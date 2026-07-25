import { redirect, notFound } from "next/navigation";
import { requireAuth } from "../../../../lib/requireAuth";
import { resolveEscolaAccess } from "../../../../lib/permissions";
import DashboardConteudo from "../../../../components/escola-dashboard/DashboardConteudo";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bimestre?: string; turma?: string; tab?: string }>;
};

export default async function EscolaPage({ params, searchParams }: PageProps) {
  const usuario = await requireAuth();
  if (!usuario) redirect("/login");

  const { id } = await params;
  const escolaId = resolveEscolaAccess(usuario, id);

  if (!escolaId) {
    // Usuário autenticado, mas sem permissão para ESTA escola — 404 em vez de 403 para não
    // confirmar a um usuário mal-intencionado que o id de escola existe.
    notFound();
  }

  const sp = await searchParams;
  return <DashboardConteudo usuario={usuario} escolaId={escolaId} searchParams={sp} />;
}
