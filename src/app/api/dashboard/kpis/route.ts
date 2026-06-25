import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../../lib/auth";
import db from "../../../../lib/db";
import { buildSchoolDashboard } from "../../../../lib/analytics/buildSchoolDashboard";
import { buildAlertas } from "../../../../lib/analytics/buildAlertas";
import { cache } from "../../../../lib/cache";

import type {
  Aluno,
  Disciplina,
  MatrizDisciplina,
  Nota,
  Turma,
} from "../../../../lib/analytics/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const escolaId = searchParams.get("escolaId");

    if (!escolaId) {
      return NextResponse.json({ error: "escolaId obrigatório" }, { status: 400 });
    }

    const perfil = await checkApiAuth(request);
    if (!perfil) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const podeAcessar =
      perfil.role === "SUPER_ADMIN" ||
      (perfil.role === "ADMIN_ESCOLA" && perfil.escola_id === escolaId);

    if (!podeAcessar) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const escolaRows = await db`SELECT * FROM escolas WHERE id = ${escolaId} LIMIT 1`;
    const escola = escolaRows[0];

    if (!escola) {
      return NextResponse.json({ error: "Escola não encontrada" }, { status: 404 });
    }

    const [turmas, alunos, disciplinas, matriz] = await Promise.all([
      cache.getOrSet(`turmas:${escolaId}`, async () => {
        const rows = await db`SELECT * FROM turmas WHERE escola_id = ${escolaId}`;
        return rows as unknown as Turma[];
      }),
      cache.getOrSet(`alunos:${escolaId}`, async () => {
        const rows = await db`SELECT * FROM alunos WHERE escola_id = ${escolaId} AND ativo = true`;
        return rows as unknown as Aluno[];
      }),
      cache.getOrSet(`disciplinas:${escolaId}`, async () => {
        const rows = await db`SELECT * FROM disciplinas WHERE escola_id = ${escolaId}`;
        return rows as unknown as Disciplina[];
      }),
      cache.getOrSet(`matriz:${escolaId}`, async () => {
        const rows = await db`SELECT * FROM matriz_disciplinas WHERE escola_id = ${escolaId}`;
        return rows as unknown as MatrizDisciplina[];
      }),
    ]);

    const todasNotas = await cache.getOrSet(`notas:${escolaId}`, async () => {
      const rows = await db`SELECT * FROM notas WHERE escola_id = ${escolaId}`;
      return rows as unknown as Nota[];
    });

    const bimestreAtual = (escola.bimestre_atual as number | undefined) ?? 1;
    const anoLetivo = (escola.ano_letivo as number | undefined) ?? 2026;

    // Filter notes to current bimestre for dashboard calculations
    const notas = todasNotas.filter(
      (n) => Number(n.bimestre) === bimestreAtual && Number(n.ano_letivo) === anoLetivo
    );

    const dashboard = buildSchoolDashboard({
      alunos,
      notas,
      turmas,
      disciplinas,
      bimestre: bimestreAtual,
      anoLetivo,
    });

    // Use same rule as SSR: 4+ disciplines < 5 = crítico, 2-3 = atenção
    const alertas = buildAlertas({ alunos, notas, turmas, disciplinas, matriz });

    return NextResponse.json({
      data: {
        totalAlunos: dashboard.alunosAtivos.length,
        totalTurmas: turmas.length,
        mediaGeral: dashboard.mediaGeral,
        alunosCriticos: alertas.criticos.length,
        alunosAbaixoBasico: alertas.abaixoBasico,
        percentualAdequado: dashboard.percentualAdequado,
        totalAdequadosOuAvancados: dashboard.alunosAdequadosOuAvancados.length,
        melhorTurma: dashboard.melhorTurma?.turma.nome ?? "-",
        melhorTurmaMedia: dashboard.melhorTurma?.media ?? 0,
        turmaAlerta: dashboard.turmaAlerta?.turma.nome ?? "-",
        turmaAlertaMedia: dashboard.turmaAlerta?.media ?? 0,
        disciplinaCritica: dashboard.disciplinaMaisCritica?.disciplina.nome ?? "-",
        disciplinaCriticaPercentual: dashboard.disciplinaMaisCritica?.percentual ?? 0,
        alunosAtencao: alertas.atencao.length,
      },
    });
  } catch (err) {
    console.error("[kpis]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
