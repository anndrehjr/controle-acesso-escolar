import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../lib/auth";
import { montarRegistroAuditoria } from "../../../lib/audit";
import db from "../../../lib/db";
import { resolveEscolaAccess } from "../../../lib/permissions";
import { capabilitiesFor } from "../../../types/roles";

const CODIGOS = new Set(["GERAL", "MAT", "PORT", "ING", "HIST", "GEO", "CIE", "FILO", "SOC", "BIO", "FIS", "QUI", "FIN", "TEC"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ensino medio|\bem\b/g, "").replace(/[^a-z0-9]/g, "");
}

export async function GET(request: Request) {
  const perfil = await checkApiAuth(request);
  if (!perfil) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!capabilitiesFor(perfil.role).viewReports) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const escolaId = resolveEscolaAccess(perfil, params.get("escolaId"));
  const ano = Number(params.get("ano") || new Date().getFullYear());
  if (!escolaId || !UUID.test(escolaId)) return NextResponse.json({ error: "Escola inválida" }, { status: 400 });
  if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) return NextResponse.json({ error: "Ano inválido" }, { status: 400 });

  const [escola, turmas, resultados, anos] = await Promise.all([
    db`SELECT id,nome,ano_letivo FROM escolas WHERE id=${escolaId} AND ativo=true LIMIT 1`,
    db`SELECT id,nome,ano_serie FROM turmas WHERE escola_id=${escolaId} AND ativo=true ORDER BY ano_serie,nome`,
    db`SELECT turma_id,ano_letivo,bimestre,disciplina_codigo,percentual_acertos::float AS percentual_acertos FROM prova_paulista_resultados WHERE escola_id=${escolaId} AND ano_letivo=${ano} ORDER BY bimestre,disciplina_codigo`,
    db`SELECT DISTINCT ano_letivo FROM prova_paulista_resultados WHERE escola_id=${escolaId} ORDER BY ano_letivo DESC`,
  ]);
  if (!escola[0]) return NextResponse.json({ error: "Escola não encontrada" }, { status: 404 });
  return NextResponse.json({ escola: escola[0], anoLetivo: ano, anos: anos.map((item) => Number(item.ano_letivo)), turmas, resultados, podeImportar: capabilitiesFor(perfil.role).manageUsuarios });
}

type LinhaImportada = { turma?: unknown; disciplina?: unknown; percentual?: unknown; bimestre?: unknown };

export async function POST(request: Request) {
  const perfil = await checkApiAuth(request);
  if (!perfil) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!capabilitiesFor(perfil.role).manageUsuarios) return NextResponse.json({ error: "Sem permissão para importar" }, { status: 403 });
  const body = await request.json().catch(() => null) as { escolaId?: unknown; anoLetivo?: unknown; fonte?: unknown; linhas?: LinhaImportada[] } | null;
  const escolaId = resolveEscolaAccess(perfil, typeof body?.escolaId === "string" ? body.escolaId : null);
  const anoLetivo = Number(body?.anoLetivo);
  const fonte = typeof body?.fonte === "string" ? body.fonte.slice(0, 120) : "Importação de planilha";
  if (!escolaId || !UUID.test(escolaId)) return NextResponse.json({ error: "Escola inválida" }, { status: 400 });
  if (!Number.isInteger(anoLetivo) || anoLetivo < 2000 || anoLetivo > 2100) return NextResponse.json({ error: "Ano letivo inválido" }, { status: 400 });
  if (!Array.isArray(body?.linhas) || body.linhas.length === 0 || body.linhas.length > 1000) return NextResponse.json({ error: "Nenhum resultado válido foi enviado" }, { status: 400 });

  const turmas = await db`SELECT id,nome FROM turmas WHERE escola_id=${escolaId} AND ativo=true`;
  const mapaTurmas = new Map(turmas.map((turma) => [normalizar(String(turma.nome)), turma]));
  const validas: { turma_id: string; turma: string; disciplina: string; percentual: number; bimestre: number }[] = [];
  const ignoradas: string[] = [];
  for (const linha of body.linhas) {
    const turmaNome = typeof linha.turma === "string" ? linha.turma.trim() : "";
    const disciplina = typeof linha.disciplina === "string" ? linha.disciplina.trim().toUpperCase().replace("FÍS", "FIS") : "";
    const percentual = Number(linha.percentual);
    const bimestre = Number(linha.bimestre);
    const turma = mapaTurmas.get(normalizar(turmaNome));
    if (!turma || !CODIGOS.has(disciplina) || !Number.isFinite(percentual) || percentual < 0 || percentual > 100 || !Number.isInteger(bimestre) || bimestre < 1 || bimestre > 4) {
      ignoradas.push(`${turmaNome || "Turma ausente"} · ${disciplina || "disciplina ausente"} · B${bimestre || "?"}`);
      continue;
    }
    validas.push({ turma_id: String(turma.id), turma: String(turma.nome), disciplina, percentual, bimestre });
  }
  if (validas.length === 0) return NextResponse.json({ error: "Nenhuma linha corresponde às turmas e disciplinas do sistema", ignoradas }, { status: 422 });

  await db.begin(async (tx) => {
    for (const linha of validas) {
      await tx`
        INSERT INTO prova_paulista_resultados (escola_id,turma_id,ano_letivo,bimestre,disciplina_codigo,percentual_acertos,fonte,created_by)
        VALUES (${escolaId},${linha.turma_id},${anoLetivo},${linha.bimestre},${linha.disciplina},${linha.percentual},${fonte},${perfil.id})
        ON CONFLICT (escola_id,turma_id,ano_letivo,bimestre,disciplina_codigo)
        DO UPDATE SET percentual_acertos=EXCLUDED.percentual_acertos,fonte=EXCLUDED.fonte,updated_at=now(),created_by=EXCLUDED.created_by
      `;
    }
    const log = montarRegistroAuditoria({ usuario: perfil, escolaId, acao: "PROVA_PAULISTA_IMPORTADA", tabela: "prova_paulista_resultados", tela: "/dashboard/prova-paulista", req: request, dadosNovos: { anoLetivo, linhasGravadas: validas.length, linhasIgnoradas: ignoradas.length, fonte } });
    await tx`INSERT INTO logs_acesso ${tx([log], "usuario_id", "usuario_email", "role", "escola_id", "acao", "tabela", "registro_id", "tela", "ip", "user_agent", "dados_anteriores", "dados_novos", "sucesso")}`;
  });
  return NextResponse.json({ ok: true, gravadas: validas.length, ignoradas });
}
