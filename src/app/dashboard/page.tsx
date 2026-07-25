import { redirect } from "next/navigation";
import { requireAuth } from "../../lib/requireAuth";
import { capabilitiesFor } from "../../types/roles";
import DashboardConteudo from "../../components/escola-dashboard/DashboardConteudo";

const ESCOLA_PADRAO = process.env.NEXT_PUBLIC_ESCOLA_ID;

type PageProps = {
  searchParams: Promise<{ bimestre?: string; turma?: string; tab?: string; escola?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const usuario = await requireAuth();
  if (!usuario) redirect("/login");

  const params = await searchParams;

  // Só o SUPER_ADMIN enxerga este dashboard "genérico"; os demais papéis são sempre
  // escopados à própria escola — sem exceção, mesmo que naveguem direto para /dashboard.
  if (!capabilitiesFor(usuario.role).viewAllEscolas) {
    redirect(`/dashboard/escolas/${usuario.escola_id}`);
  }

  const escolaId = params.escola ?? ESCOLA_PADRAO;
  if (!escolaId) {
    return (
      <main className="min-h-screen bg-zinc-900 p-8 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400">Nenhuma escola selecionada</h1>
          <p className="mt-2 text-zinc-400">
            Acesse /dashboard/escolas/[id] ou defina NEXT_PUBLIC_ESCOLA_ID.
          </p>
        </div>
      </main>
    );
  }

  return <DashboardConteudo usuario={usuario} escolaId={escolaId} searchParams={params} />;
}
