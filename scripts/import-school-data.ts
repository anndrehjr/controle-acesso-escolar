import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { ALL_CLASSROOMS } from "../src/lib/school-data";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const ESCOLA_ID = "6b50af3f-8023-497f-bccb-32ceec3d0252";

type NotaInsert = {
  escola_id: string;
  turma_id: string;
  aluno_id: string;
  disciplina_id: string;
  ano_letivo: number;
  bimestre: number;
  nota: number;
  status: string;
};

function normalizarTexto(texto: string) {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executarComRetry<T extends { error?: unknown }>(
  operacao: () => PromiseLike<T>,
  descricao: string,
  tentativas = 5
): Promise<T> {
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    try {
      const resultado = await Promise.resolve(operacao());

      if (!resultado.error) {
        return resultado;
      }

      const mensagem = JSON.stringify(resultado.error);

      if (
        mensagem.includes("fetch failed") ||
        mensagem.includes("ECONNRESET")
      ) {
        console.log(`⚠️ Retry ${tentativa}/${tentativas} -> ${descricao}`);
        await sleep(1000 * tentativa);
        continue;
      }

      return resultado;
    } catch {
      console.log(`⚠️ Erro inesperado ${descricao} tentativa ${tentativa}`);
      await sleep(1000 * tentativa);
    }
  }

  throw new Error(`Falha total: ${descricao}`);
}

function getAnoSerie(nomeTurma: string) {
  if (nomeTurma.includes("1ª")) return 1;
  if (nomeTurma.includes("2ª")) return 2;
  if (nomeTurma.includes("3ª")) return 3;

  return Number(nomeTurma.replace(/\D/g, ""));
}

function getGrupoPedagogico(turma: {
  name: string;
  level: "EF" | "EM";
}) {
  const anoSerie = getAnoSerie(turma.name);

  if (turma.level === "EF" && [6, 9].includes(anoSerie)) {
    return "FUND_69";
  }

  if (turma.level === "EF" && [7, 8].includes(anoSerie)) {
    return "FUND_78";
  }

  if (turma.level === "EM" && [1, 2].includes(anoSerie)) {
    return "MEDIO_12";
  }

  if (turma.level === "EM" && anoSerie === 3) {
    return "MEDIO_3";
  }

  return "INDEFINIDO";
}

async function importar() {
  console.log("🚀 Iniciando importação segura");

  console.log("🧹 Limpando notas e matriz_disciplinas...");

  await executarComRetry(
    () =>
      supabase
        .from("notas")
        .delete()
        .eq("escola_id", ESCOLA_ID),
    "limpar notas"
  );

  await executarComRetry(
    () =>
      supabase
        .from("matriz_disciplinas")
        .delete()
        .eq("escola_id", ESCOLA_ID),
    "limpar matriz_disciplinas"
  );

  console.log("✅ Limpeza concluída");

  const turmasMap = new Map<string, string>();
  const disciplinasMap = new Map<string, string>();
  const matrizMap = new Map<string, string>();

  const { data: disciplinasBanco, error: disciplinasError } =
    await executarComRetry(
      () =>
        supabase
          .from("disciplinas")
          .select("id, nome")
          .eq("escola_id", ESCOLA_ID),
      "buscar disciplinas"
    );

  if (disciplinasError) {
    console.log("❌ Erro ao buscar disciplinas:", disciplinasError);
    return;
  }

  for (const disciplina of disciplinasBanco ?? []) {
    disciplinasMap.set(
      normalizarTexto(disciplina.nome),
      disciplina.id
    );
  }

  console.log(`✅ Disciplinas carregadas: ${disciplinasMap.size}`);

  for (const turma of ALL_CLASSROOMS) {
    const anoSerie = getAnoSerie(turma.name);
    const grupoPedagogico = getGrupoPedagogico(turma);

    const { data: turmaExistente, error: buscaTurmaError } =
      await executarComRetry(
        () =>
          supabase
            .from("turmas")
            .select("id")
            .eq("escola_id", ESCOLA_ID)
            .eq("nome", turma.name)
            .maybeSingle(),
        `buscar turma ${turma.name}`
      );

    if (buscaTurmaError) {
      console.log(`❌ Erro ao buscar turma ${turma.name}:`, buscaTurmaError);
      continue;
    }

    if (turmaExistente) {
      const { error: updateTurmaError } = await executarComRetry(
        () =>
          supabase
            .from("turmas")
            .update({
              grupo_pedagogico: grupoPedagogico,
              etapa: turma.level,
              ano_serie: anoSerie,
              periodo: "Manhã",
              total_ativos: turma.totalActive,
            })
            .eq("id", turmaExistente.id),
        `atualizar turma ${turma.name}`
      );

      if (updateTurmaError) {
        console.log(
          `❌ Erro ao atualizar turma ${turma.name}:`,
          updateTurmaError
        );
        continue;
      }

      turmasMap.set(turma.id, turmaExistente.id);
      console.log(`🔁 Turma atualizada: ${turma.name}`);
      await sleep(100);
      continue;
    }

    const { data: turmaCriada, error: turmaError } =
      await executarComRetry(
        () =>
          supabase
            .from("turmas")
            .insert({
              escola_id: ESCOLA_ID,
              nome: turma.name,
              etapa: turma.level,
              ano_serie: anoSerie,
              periodo: "Manhã",
              total_ativos: turma.totalActive,
              grupo_pedagogico: grupoPedagogico,
            })
            .select()
            .single(),
        `criar turma ${turma.name}`
      );

    if (turmaError) {
      console.log(`❌ Erro ao criar turma ${turma.name}:`, turmaError);
      continue;
    }

    turmasMap.set(turma.id, turmaCriada.id);
    console.log(`✅ Turma criada: ${turma.name}`);
    await sleep(100);
  }

  console.log("📚 Importando matriz_disciplinas...");

  const matrizControle = new Set<string>();

  for (const turma of ALL_CLASSROOMS) {
    const grupoPedagogico = getGrupoPedagogico(turma);

    for (const subject of turma.subjects) {
      const chave = `${grupoPedagogico}_${subject.code}`;

      if (matrizControle.has(chave)) {
        continue;
      }

      matrizControle.add(chave);

      const disciplinaId = disciplinasMap.get(
        normalizarTexto(subject.name)
      );

      if (!disciplinaId) {
        console.log(`⚠️ Disciplina não encontrada: ${subject.name}`);
        continue;
      }

      const { error: matrizError } = await executarComRetry(
        () =>
          supabase.from("matriz_disciplinas").insert({
            escola_id: ESCOLA_ID,
            etapa: grupoPedagogico,
            codigo: subject.code,
            disciplina_id: disciplinaId,
            ativo: true,
          }),
        `matriz ${grupoPedagogico} ${subject.code}`
      );

      if (matrizError) {
        console.log(
          `❌ Erro matriz ${grupoPedagogico} ${subject.code}`,
          matrizError
        );
        continue;
      }

      matrizMap.set(chave, disciplinaId);

      console.log(
        `✅ Matriz: ${grupoPedagogico} | ${subject.code} -> ${subject.name}`
      );

      await sleep(150);
    }
  }

  console.log("👥 Atualizando alunos e importando notas...");

  let totalNotas = 0;

  for (const turma of ALL_CLASSROOMS) {
    const turmaDbId = turmasMap.get(turma.id);
    const grupoPedagogico = getGrupoPedagogico(turma);

    if (!turmaDbId) {
      console.log(`⚠️ Turma não encontrada no map: ${turma.name}`);
      continue;
    }

    for (const student of turma.students) {
      const status = Object.values(student.grades).includes("TR")
        ? "TRANSFERIDO"
        : "ATIVO";

      const { data: alunoExistente, error: buscaAlunoError } =
        await executarComRetry(
          () =>
            supabase
              .from("alunos")
              .select("id")
              .eq("escola_id", ESCOLA_ID)
              .eq("turma_id", turmaDbId)
              .eq("numero_chamada", student.id)
              .maybeSingle(),
          `buscar aluno ${student.name}`
        );

      if (buscaAlunoError) {
        console.log(
          `❌ Erro ao buscar aluno ${student.name}:`,
          buscaAlunoError
        );
        continue;
      }

      let alunoId: string | undefined = alunoExistente?.id;

      if (alunoId) {
        const { error: updateAlunoError } = await executarComRetry(
          () =>
            supabase
              .from("alunos")
              .update({
                nome: student.name,
                status,
                em_atencao: student.isAttention,
              })
              .eq("id", alunoId),
          `atualizar aluno ${student.name}`
        );

        if (updateAlunoError) {
          console.log(
            `❌ Erro ao atualizar aluno ${student.name}:`,
            updateAlunoError
          );
          continue;
        }

        console.log(`🔁 Aluno atualizado: ${student.name}`);
      } else {
        const { data: alunoCriado, error: alunoError } =
          await executarComRetry(
            () =>
              supabase
                .from("alunos")
                .insert({
                  escola_id: ESCOLA_ID,
                  turma_id: turmaDbId,
                  nome: student.name,
                  numero_chamada: student.id,
                  status,
                  em_atencao: student.isAttention,
                })
                .select()
                .single(),
            `criar aluno ${student.name}`
          );

        if (alunoError) {
          console.log(`❌ Erro ao criar aluno ${student.name}:`, alunoError);
          continue;
        }

        alunoId = alunoCriado.id;
        console.log(`👤 Aluno criado: ${student.name}`);
      }

      if (!alunoId) {
        console.log(`⚠️ Aluno sem ID: ${student.name}`);
        continue;
      }

      const notasParaInserir: NotaInsert[] = [];

      for (const [codigo, valor] of Object.entries(student.grades)) {
        if (valor === "TR") {
          continue;
        }

        if (typeof valor !== "number") {
          continue;
        }

        const chave = `${grupoPedagogico}_${codigo}`;
        const disciplinaId = matrizMap.get(chave);

        if (!disciplinaId) {
          console.log(
            `⚠️ Matriz não encontrada: ${chave} | aluno ${student.name}`
          );
          continue;
        }

        notasParaInserir.push({
          escola_id: ESCOLA_ID,
          turma_id: turmaDbId,
          aluno_id: alunoId,
          disciplina_id: disciplinaId,
          ano_letivo: 2026,
          bimestre: 1,
          nota: valor,
          status: "NORMAL",
        });
      }

      if (notasParaInserir.length > 0) {
        const resultadoNotas = await executarComRetry(
          () =>
            supabase
              .from("notas")
              .insert(notasParaInserir),
          `notas ${student.name}`
        );

        if (resultadoNotas.error) {
          console.log(
            `❌ Erro notas ${student.name}`,
            resultadoNotas.error
          );
        } else {
          totalNotas += notasParaInserir.length;
        }
      }

      await sleep(150);
    }
  }

  console.log(`✅ Total de notas importadas: ${totalNotas}`);
  console.log("🎉 IMPORTAÇÃO FINALIZADA");
}

importar().catch((error) => {
  console.error("💥 Erro fatal na importação:", error);
  process.exit(1);
});