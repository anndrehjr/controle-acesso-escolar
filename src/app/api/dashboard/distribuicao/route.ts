import { NextResponse } from "next/server";

import { createClient } from "../../../../lib/supabase/server";
import { buildDistribuicaoPedagogica } from "../../../../lib/analytics/buildDistribuicaoPedagogica";
import { cache } from "../../../../lib/cache";

import type {
  Aluno,
  Nota,
  Turma,
} from "../../../../lib/analytics/types";

async function buscarTodasNotas(
  supabase: Awaited<ReturnType<typeof createClient>>,
  escolaId: string
) {
  const tamanhoPagina = 1000;
  let pagina = 0;
  let todasNotas: Nota[] = [];

  while (true) {
    const inicio = pagina * tamanhoPagina;
    const fim = inicio + tamanhoPagina - 1;

    const { data, error } = await supabase
      .from("notas")
      .select("*")
      .eq("escola_id", escolaId)
      .range(inicio, fim);

    if (error) throw error;

    if (!data || data.length === 0) break;

    todasNotas = [...todasNotas, ...(data as Nota[])];

    if (data.length < tamanhoPagina) break;

    pagina++;
  }

  return todasNotas;
}

export async function GET(request: Request) {
  try {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const escolaId = searchParams.get("escolaId");

  if (!escolaId) {
    return NextResponse.json(
      { error: "escolaId obrigatório" },
      { status: 400 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401 }
    );
  }

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("id, role, escola_id, ativo")
    .eq("auth_id", user.id)
    .single();

  if (!perfil || perfil.ativo === false) {
    return NextResponse.json(
      { error: "Perfil inválido" },
      { status: 401 }
    );
  }

  const podeAcessar =
    perfil.role === "SUPER_ADMIN" ||
    (perfil.role === "ADMIN_ESCOLA" && perfil.escola_id === escolaId);

  if (!podeAcessar) {
    return NextResponse.json(
      { error: "Sem permissão" },
      { status: 403 }
    );
  }

  const [turmas, alunos] = await Promise.all([
    cache.getOrSet(`turmas:${escolaId}`, async () => {
      const { data } = await supabase.from("turmas").select("*").eq("escola_id", escolaId);
      return (data ?? []) as Turma[];
    }),
    cache.getOrSet(`alunos:${escolaId}`, async () => {
      const { data } = await supabase
        .from("alunos")
        .select("*")
        .eq("escola_id", escolaId)
        .eq("ativo", true);
      return (data ?? []) as Aluno[];
    }),
  ]);

  const notas = await cache.getOrSet(`notas:${escolaId}`, () =>
    buscarTodasNotas(supabase, escolaId)
  );

  const distribuicao = buildDistribuicaoPedagogica({ alunos, notas, turmas });

  return NextResponse.json({ data: distribuicao });
  } catch (err) {
    console.error("[distribuicao]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
