import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("*")
    .eq("email", user.email)
    .single();

  if (!perfil || perfil.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const { data: escolas } = await supabase
    .from("escolas")
    .select("*")
    .order("nome", { ascending: true });

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Fundo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(39,39,42,0.9),transparent_45%),linear-gradient(to_bottom,#09090b,#000000)]" />
      <div className="absolute top-0 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-zinc-800/20 blur-3xl" />

      <section className="relative z-10 p-6 md:p-10">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-zinc-700/70 bg-zinc-900/70 px-4 py-2 text-sm text-zinc-300 shadow-xl backdrop-blur">
              Painel administrativo global
            </div>

            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Dashboard Super Admin
            </h1>

            <p className="mt-3 max-w-2xl text-zinc-400">
              Bem-vindo, {perfil.nome}. Gerencie escolas, acompanhe
              informações institucionais e visualize todo o ecossistema
              educacional.
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-4 md:w-[360px]">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 backdrop-blur">
              <p className="text-sm text-zinc-500">Escolas</p>
              <h2 className="mt-2 text-3xl font-bold">
                {escolas?.length || 0}
              </h2>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 backdrop-blur">
              <p className="text-sm text-zinc-500">Perfil</p>
              <h2 className="mt-2 text-lg font-bold text-zinc-200">
                SUPER ADMIN
              </h2>
            </div>
          </div>
        </div>

        {/* Escolas */}
        <section className="mt-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Escolas cadastradas</h2>

              <p className="mt-1 text-zinc-500">
                Selecione uma escola para acessar o painel administrativo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {escolas?.map((escola) => (
              <Link
                key={escola.id}
                href={`/dashboard/escolas/${escola.id}`}
                className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/30"
              >
                {/* Glow */}
                <div className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                  <div className="absolute -top-20 right-0 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
                </div>

                <div className="relative z-10">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-2xl">
                    🏫
                  </div>

                  <h3 className="text-2xl font-bold text-white">
                    {escola.nome}
                  </h3>

                  <p className="mt-2 text-zinc-400">
                    {escola.cidade} - {escola.estado}
                  </p>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-xs text-zinc-600">
                      ID: {escola.id}
                    </span>

                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 transition group-hover:border-white/40">
                      Acessar
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {!escolas?.length && (
            <div className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-10 text-center backdrop-blur">
              <p className="text-zinc-400">
                Nenhuma escola cadastrada no sistema.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}