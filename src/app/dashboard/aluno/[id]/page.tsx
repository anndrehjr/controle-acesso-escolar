import { notFound, redirect } from "next/navigation";
import { requireAuth } from "../../../../lib/requireAuth";
import db from "../../../../lib/db";
import { podeVerTurma, resolveEscolaAccess } from "../../../../lib/permissions";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from "lucide-react";
import { cache } from "../../../../lib/cache";
import type { Aluno, Disciplina, MatrizDisciplina, Nota, Turma } from "../../../../lib/analytics/types";
import { avaliarDisciplina, statusAlunoPorRisco } from "../../../../lib/analytics/avaliarDisciplina";
import InfoTooltip from "../../../../components/InfoTooltip";


type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bimestre?: string; turmaId?: string }>;
};

function getNivel(media: number) {
  if (media < 5) return { label: "Abaixo do Básico", statusColor: "var(--status-danger-bg)", bg: "var(--status-danger-tint)" };
  if (media < 7) return { label: "Básico", statusColor: "#E8860C", bg: "var(--status-warning-tint)" };
  if (media < 8) return { label: "Adequado", statusColor: "var(--status-success-bg)", bg: "var(--status-success-tint)" };
  return { label: "Avançado", statusColor: "var(--brand-primary)", bg: "var(--bg-sidebar-active)" };
}

function getNotaColor(nota: number | null): string {
  if (nota === null) return "var(--text-secondary)";
  if (nota < 5) return "var(--status-danger-bg)";
  if (nota < 7) return "#E8860C";
  if (nota < 8) return "var(--status-success-bg)";
  return "var(--brand-primary)";
}

function getNotaBg(nota: number | null): string {
  if (nota === null) return "var(--bg-app)";
  if (nota < 5) return "var(--status-danger-tint)";
  if (nota < 7) return "var(--status-warning-tint)";
  if (nota < 8) return "var(--status-success-tint)";
  return "var(--bg-sidebar-active)";
}

function inferirGrupo(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes("série") || n.includes("serie") || n.includes("médio") || n.includes("medio")) return "EM";
  if (n.includes("ano") || n.includes("fundamental")) return "EF";
  return "";
}

async function buscarNotasBimestre(
  escolaId: string,
  alunoId: string,
  anoLetivo: number,
  bimestre: number
): Promise<Nota[]> {
  const rows = await db`
    SELECT * FROM notas
    WHERE escola_id = ${escolaId}
      AND aluno_id = ${alunoId}
      AND ano_letivo = ${anoLetivo}
      AND bimestre = ${bimestre}
  `;
  return rows as unknown as Nota[];
}

export default async function AlunoPage({ params, searchParams }: PageProps) {
  const usuario = await requireAuth();
  if (!usuario) redirect("/login");

  const { id } = await params;
  const { turmaId: turmaIdParam } = await searchParams;

  const alunoRows = await db`SELECT * FROM alunos WHERE id = ${id} LIMIT 1`;
  const alunoRaw = (alunoRows[0] ?? null) as Aluno | null;
  if (!alunoRaw) notFound();

  const escolaId = resolveEscolaAccess(usuario, alunoRaw.escola_id);
  if (!escolaId || !(await podeVerTurma(usuario, escolaId, alunoRaw.turma_id))) {
    // A mesma resposta e usada para aluno inexistente e sem permissao, sem revelar o UUID.
    notFound();
  }

  const [escola, disciplinas, matriz] = await Promise.all([
    cache.getOrSet(`escola:${escolaId}`, async () => {
      const rows = await db`SELECT * FROM escolas WHERE id = ${escolaId} LIMIT 1`;
      return rows[0] ?? null;
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

  if (!alunoRaw) {
    return (
      <main className="min-h-screen p-8">
        <p style={{ color: "var(--status-danger-bg)" }}>Aluno não encontrado.</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center gap-2 text-sm"
          style={{ color: "var(--text-link)" }}
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao dashboard
        </Link>
      </main>
    );
  }

  const aluno = alunoRaw as Aluno;
  const anoLetivo = (escola?.ano_letivo as number | undefined) ?? new Date().getFullYear();
  const bimestreAtual = (escola?.bimestre_atual as number | undefined) ?? 1;
  const bimestres = [1, 2, 3, 4];

  const turma = await cache.getOrSet(`turma:${escolaId}:${aluno.turma_id}`, async () => {
    const rows = await db`SELECT * FROM turmas WHERE id = ${aluno.turma_id} AND escola_id = ${escolaId} LIMIT 1`;
    return (rows[0] ?? null) as Turma | null;
  });

  const grpRaw = String(turma?.grupo_pedagogico ?? "").trim().toUpperCase();
  const grupo = grpRaw || inferirGrupo(turma?.nome ?? "");

  const matrizDaTurma = (matriz as MatrizDisciplina[])
    .filter((m) => String(m.etapa ?? "").trim().toUpperCase() === grupo)
    .sort((a, b) => a.codigo.localeCompare(b.codigo));

  const disciplinasDaTurma = matrizDaTurma
    .map((m) => {
      const disc = (disciplinas as Disciplina[]).find(
        (d) => String(d.id).trim() === String(m.disciplina_id).trim()
      );
      if (!disc) return null;
      return { id: disc.id, nome: disc.nome, codigo: m.codigo };
    })
    .filter((item): item is { id: string; nome: string; codigo: string } => item !== null);

  const notasPorBimestre = await Promise.all(
    bimestres.map(async (b) => ({
      bimestre: b,
      notas: await cache.getOrSet(`notas:aluno:${escolaId}:${aluno.id}:ano:${anoLetivo}:bim:${b}`, () =>
        buscarNotasBimestre(escolaId, aluno.id, anoLetivo, b)
      ),
    }))
  );

  const tabelaDisciplinas = disciplinasDaTurma.map((disc) => {
    const notasBim = bimestres.map((b) => {
      const grupo = notasPorBimestre.find((g) => g.bimestre === b);
      const nota = grupo?.notas.find(
        (n) => String(n.disciplina_id).trim() === String(disc.id).trim()
      );
      return nota?.nota !== null && nota?.nota !== undefined ? Number(nota.nota) : null;
    });

    // Sempre a média acumulada dos bimestres já lançados — nunca a nota de um
    // bimestre isolado. avaliarDisciplina() é o mesmo serviço usado no
    // dashboard/alertas, garante que "em risco" significa a mesma coisa em
    // toda a tela.
    const avaliacao = avaliarDisciplina(notasBim);
    const media = avaliacao.media;

    const idxComDados = notasBim
      .map((n, i) => (n !== null ? i : -1))
      .filter((i) => i >= 0);
    let tendencia: number | null = null;
    if (idxComDados.length >= 2) {
      const ultimo = notasBim[idxComDados[idxComDados.length - 1]] as number;
      const penultimo = notasBim[idxComDados[idxComDados.length - 2]] as number;
      tendencia = Number((ultimo - penultimo).toFixed(1));
    }

    return { disc, notasBim, media, tendencia, emRisco: avaliacao.emRisco, emConselho: avaliacao.emConselho };
  });

  const mediasValidas = tabelaDisciplinas
    .map((d) => d.media)
    .filter((m): m is number => m !== null);

  const mediaGeral =
    mediasValidas.length > 0
      ? mediasValidas.reduce((a, b) => a + b, 0) / mediasValidas.length
      : null;

  const nivelGeral = mediaGeral !== null ? getNivel(mediaGeral) : null;

  // Disciplinas em risco = média acumulada < 5,0 (nunca a nota de um bimestre
  // isolado) — mesmo critério e mesmo limiar (3+ = pré-reprovado) usados em
  // buildRiscoAcademico(), pra não haver dois números diferentes pro mesmo aluno
  // em telas diferentes.
  const disciplinasAbaixo5 = tabelaDisciplinas.filter((d) => d.emRisco).length;
  const alertaStatus = statusAlunoPorRisco(disciplinasAbaixo5);

  const totalBimestresComDados = bimestres.filter((b) =>
    notasPorBimestre.find((g) => g.bimestre === b)?.notas.length
  ).length;

  const cardStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-sm)",
    boxShadow: "var(--shadow-card)",
  };

  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Back button */}
        <Link
          href={`/dashboard?tab=heatmap${turmaIdParam ? `&turma=${turmaIdParam}` : ""}`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition"
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            background: "var(--bg-card)",
            color: "var(--text-secondary)",
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao dashboard
        </Link>

        {/* Header card */}
        <div className="p-6 md:p-8" style={cardStyle}>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div
                className="mb-3 inline-flex px-3 py-1 text-xs font-medium"
                style={{
                  background: "var(--bg-app)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-pill)",
                  color: "var(--text-secondary)",
                }}
              >
                Nº {String(aluno.numero_chamada).padStart(2, "0")} · {turma?.nome ?? "Turma não identificada"}
              </div>
              <h1
                className="text-2xl tracking-tight md:text-3xl"
                style={{ color: "var(--text-primary)", fontWeight: 600 }}
              >
                {aluno.nome}
              </h1>
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                Evolução pedagógica · {anoLetivo}
              </p>
            </div>

            {/* KPI chips */}
            <div className="flex flex-wrap gap-3">
              {mediaGeral !== null && (
                <div
                  className="px-5 py-4 text-center"
                  style={{
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-app)",
                  }}
                >
                  <span
                    className="text-3xl"
                    style={{ color: getNotaColor(mediaGeral), fontWeight: 600 }}
                  >
                    {mediaGeral.toFixed(1)}
                  </span>
                  <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    média geral
                  </p>
                </div>
              )}

              {nivelGeral && (
                <div
                  className="px-5 py-4 text-center"
                  style={{
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    background: nivelGeral.bg,
                  }}
                >
                  <span className="text-sm font-semibold" style={{ color: nivelGeral.statusColor }}>
                    {nivelGeral.label}
                  </span>
                  <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    nível
                  </p>
                </div>
              )}

              <div
                className="px-5 py-4 text-center"
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  background:
                    disciplinasAbaixo5 === 0
                      ? "var(--status-success-tint)"
                      : disciplinasAbaixo5 < 3
                      ? "var(--status-warning-tint)"
                      : "var(--status-danger-tint)",
                }}
              >
                <span
                  className="text-3xl"
                  style={{
                    color:
                      disciplinasAbaixo5 === 0
                        ? "var(--status-success-bg)"
                        : disciplinasAbaixo5 < 3
                        ? "#E8860C"
                        : "var(--status-danger-bg)",
                    fontWeight: 600,
                  }}
                >
                  {disciplinasAbaixo5}
                </span>
                <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {disciplinasAbaixo5 === 1 ? "disciplina" : "disciplinas"} em risco
                </p>
                <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-secondary)", opacity: 0.7 }}>
                  pela média acumulada · 3+ é Pré-Reprovado
                </p>
              </div>

              <div
                className="flex items-center gap-2.5 px-5 py-4"
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  background:
                    alertaStatus === "critico"
                      ? "var(--status-danger-tint)"
                      : alertaStatus === "atencao"
                      ? "var(--status-warning-tint)"
                      : "var(--status-success-tint)",
                }}
              >
                {alertaStatus === "critico" ? (
                  <AlertTriangle
                    className="h-5 w-5"
                    style={{ color: "var(--status-danger-bg)" }}
                  />
                ) : alertaStatus === "atencao" ? (
                  <AlertTriangle className="h-5 w-5" style={{ color: "#E8860C" }} />
                ) : (
                  <CheckCircle
                    className="h-5 w-5"
                    style={{ color: "var(--status-success-bg)" }}
                  />
                )}
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color:
                        alertaStatus === "critico"
                          ? "var(--status-danger-bg)"
                          : alertaStatus === "atencao"
                          ? "#E8860C"
                          : "var(--status-success-bg)",
                    }}
                  >
                    {alertaStatus === "critico"
                      ? "Pré-Reprovado"
                      : alertaStatus === "atencao"
                      ? "Atenção"
                      : "Regular"}
                  </p>
                  <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    acompanhando o {bimestreAtual}º bimestre
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grades table */}
        <div className="p-6 md:p-8" style={cardStyle}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Notas por Disciplina
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                {turma?.nome} · {totalBimestresComDados}{" "}
                {totalBimestresComDados === 1 ? "bimestre" : "bimestres"} com dados
              </p>
            </div>
          </div>

          <div
            className="overflow-x-auto"
            style={{
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th
                    className="sticky left-0 z-10 min-w-[200px] p-3 text-left"
                    style={{
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-app)",
                      color: "var(--text-primary)",
                      fontWeight: 600,
                    }}
                  >
                    Disciplina
                  </th>
                  {bimestres.map((b) => (
                    <th
                      key={b}
                      className="min-w-[80px] p-3 text-center"
                      style={{
                        border: "1px solid var(--border-subtle)",
                        background:
                          b === bimestreAtual ? "var(--bg-sidebar-active)" : "var(--bg-app)",
                        color:
                          b === bimestreAtual
                            ? "var(--brand-primary)"
                            : "var(--text-secondary)",
                        fontWeight: b === bimestreAtual ? 600 : 400,
                      }}
                    >
                      {b}º Bim
                    </th>
                  ))}
                  <th
                    className="min-w-[100px] p-3 text-center"
                    style={{
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-app)",
                      color: "var(--text-primary)",
                      fontWeight: 600,
                    }}
                  >
                    <span className="inline-flex items-center justify-center gap-1">
                      Média Atual
                      <InfoTooltip
                        align="end"
                        texto="Média acumulada de todos os bimestres já lançados dessa disciplina — nunca a nota de um bimestre isolado. É essa média que define se a disciplina está em risco (abaixo de 5,0)."
                      />
                    </span>
                  </th>
                  <th
                    className="min-w-[90px] p-3 text-center"
                    style={{
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-app)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Tendência
                  </th>
                </tr>
              </thead>

              <tbody>
                {tabelaDisciplinas.map(({ disc, notasBim, media, tendencia }) => (
                  <tr key={disc.id} className="group">
                    <td
                      className="sticky left-0 z-10 p-3 font-medium"
                      style={{
                        border: "1px solid var(--border-subtle)",
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <span
                        className="mr-2 inline-flex h-5 w-7 items-center justify-center text-[10px] font-semibold"
                        style={{
                          background: "var(--bg-app)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {disc.codigo.replace("C", "")}
                      </span>
                      {disc.nome}
                    </td>
                    {notasBim.map((nota, idx) => (
                      <td
                        key={idx}
                        className="p-2 text-center"
                        style={{
                          border: "1px solid var(--border-subtle)",
                          background:
                            bimestres[idx] === bimestreAtual ? "var(--bg-sidebar-active)" : "var(--bg-card)",
                        }}
                      >
                        <div
                          className="px-2 py-1.5 font-semibold"
                          style={{
                            borderRadius: "var(--radius-sm)",
                            background: getNotaBg(nota),
                            color: getNotaColor(nota),
                          }}
                        >
                          {nota !== null ? nota : "–"}
                        </div>
                      </td>
                    ))}
                    <td
                      className="p-2 text-center"
                      style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-card)" }}
                    >
                      <div
                        className="px-2 py-1.5 text-base font-semibold"
                        style={{
                          borderRadius: "var(--radius-sm)",
                          background: getNotaBg(media),
                          color: getNotaColor(media),
                        }}
                      >
                        {media !== null ? media.toFixed(1) : "–"}
                      </div>
                    </td>
                    <td
                      className="p-2 text-center"
                      style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-card)" }}
                    >
                      {tendencia === null ? (
                        <span style={{ color: "var(--text-secondary)" }}>–</span>
                      ) : tendencia > 0 ? (
                        <div
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold"
                          style={{
                            background: "var(--status-success-tint)",
                            borderRadius: "var(--radius-pill)",
                            color: "var(--status-success-bg)",
                          }}
                        >
                          <TrendingUp className="h-3 w-3" />
                          +{tendencia}
                        </div>
                      ) : tendencia < 0 ? (
                        <div
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold"
                          style={{
                            background: "var(--status-danger-tint)",
                            borderRadius: "var(--radius-pill)",
                            color: "var(--status-danger-bg)",
                          }}
                        >
                          <TrendingDown className="h-3 w-3" />
                          {tendencia}
                        </div>
                      ) : (
                        <div
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold"
                          style={{
                            background: "var(--bg-app)",
                            borderRadius: "var(--radius-pill)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          <Minus className="h-3 w-3" />
                          0
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { color: "var(--status-danger-bg)", bg: "var(--status-danger-tint)", texto: "0–4 · Abaixo do Básico" },
              { color: "#E8860C", bg: "var(--status-warning-tint)", texto: "5–6 · Básico" },
              { color: "var(--status-success-bg)", bg: "var(--status-success-tint)", texto: "7–8 · Adequado" },
              { color: "var(--brand-primary)", bg: "var(--bg-sidebar-active)", texto: "8–10 · Avançado" },
            ].map(({ color, texto }) => (
              <div
                key={texto}
                className="flex items-center gap-2 px-3 py-1.5"
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--bg-card)",
                }}
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ background: color }}
                />
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  {texto}
                </span>
              </div>
            ))}
            <div
              className="flex items-center gap-2 px-3 py-1.5"
              style={{
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-pill)",
                background: "var(--bg-card)",
              }}
            >
              <TrendingUp className="h-3 w-3" style={{ color: "var(--status-success-bg)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                Tendência: variação entre os dois últimos bimestres com nota
              </span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
