import { NextResponse } from "next/server";
import { checkApiAuth } from "../../../lib/auth";
import db from "../../../lib/db";
import {
  disciplinasVisiveisNaTurma,
  resolveEscolaAccess,
  turmasVisiveis,
} from "../../../lib/permissions";
import { capabilitiesFor } from "../../../types/roles";

export async function GET(request: Request) {
  const perfil = await checkApiAuth(request);
  if (!perfil) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!capabilitiesFor(perfil.role).manageNotas) {
    return NextResponse.json({ error: "Sem permissão para acessar o diário" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const escolas = capabilitiesFor(perfil.role).viewAllEscolas
    ? await db`SELECT id, nome, ano_letivo, bimestre_atual FROM escolas WHERE ativo = true ORDER BY nome`
    : await db`SELECT id, nome, ano_letivo, bimestre_atual FROM escolas WHERE id = ${perfil.escola_id} AND ativo = true`;
  const escolaId = resolveEscolaAccess(perfil, searchParams.get("escolaId"));
  if (!escolaId) return NextResponse.json({ escolas, turmas: [], disciplinas: [], alunos: [], notas: [] });

  const escola = escolas.find((item) => item.id === escolaId);
  if (!escola) return NextResponse.json({ error: "Escola não encontrada" }, { status: 404 });
  const anoLetivo = Number(searchParams.get("anoLetivo") ?? escola.ano_letivo ?? new Date().getFullYear());
  const bimestre = Number(searchParams.get("bimestre") ?? escola.bimestre_atual ?? 1);
  if (!Number.isInteger(anoLetivo) || anoLetivo < 2000 || anoLetivo > 2100 || ![1, 2, 3, 4].includes(bimestre)) {
    return NextResponse.json({ error: "Ano letivo ou bimestre inválido" }, { status: 400 });
  }

  const idsTurmas = await turmasVisiveis(perfil, escolaId);
  const turmas = idsTurmas.length === 0
    ? []
    : await db`
        SELECT id, nome, grupo_pedagogico
        FROM turmas
        WHERE escola_id = ${escolaId} AND id = ANY(${idsTurmas}::uuid[]) AND ativo = true
        ORDER BY ano_serie, nome
      `;
  const turmaId = searchParams.get("turmaId");
  if (!turmaId) {
    return NextResponse.json({ escolaId, escolas, anoLetivo, bimestre, turmas, disciplinas: [], alunos: [], notas: [] });
  }
  const turma = turmas.find((item) => item.id === turmaId);
  if (!turma) return NextResponse.json({ error: "Sem permissão para esta turma" }, { status: 403 });

  const permitidas = await disciplinasVisiveisNaTurma(perfil, escolaId, turmaId);
  const todasDisciplinas = await db`
    SELECT DISTINCT d.id, d.nome, md.codigo
    FROM matriz_disciplinas md
    JOIN disciplinas d ON d.id = md.disciplina_id
    WHERE md.escola_id = ${escolaId}
      AND md.etapa = ${turma.grupo_pedagogico}
      AND md.ativo = true AND d.ativo = true
    ORDER BY md.codigo, d.nome
  `;
  const disciplinas = permitidas === null
    ? todasDisciplinas
    : todasDisciplinas.filter((item) => permitidas.includes(item.id));
  const disciplinaId = searchParams.get("disciplinaId");
  if (!disciplinaId) {
    return NextResponse.json({ escolaId, escolas, anoLetivo, bimestre, turmas, turma, disciplinas, alunos: [], notas: [] });
  }
  if (!disciplinas.some((item) => item.id === disciplinaId)) {
    return NextResponse.json({ error: "Sem permissão para esta disciplina" }, { status: 403 });
  }

  const [alunos, notas] = await Promise.all([
    db`
      SELECT a.id, a.nome, m.id AS matricula_id, m.numero_chamada
      FROM matriculas m
      JOIN alunos a ON a.id = m.aluno_id
      WHERE m.escola_id = ${escolaId}
        AND m.turma_id = ${turmaId}
        AND m.ano_letivo = ${anoLetivo}
        AND m.status = 'ATIVA'
        AND a.ativo = true
      ORDER BY m.numero_chamada, a.nome
    `,
    db`
      SELECT id, aluno_id, matricula_id, nota
      FROM notas
      WHERE escola_id = ${escolaId}
        AND turma_id = ${turmaId}
        AND disciplina_id = ${disciplinaId}
        AND ano_letivo = ${anoLetivo}
        AND bimestre = ${bimestre}
    `,
  ]);
  return NextResponse.json({
    escolaId, escolas, anoLetivo, bimestre, turmas, turma, disciplinas,
    disciplinaId, alunos, notas,
  });
}
