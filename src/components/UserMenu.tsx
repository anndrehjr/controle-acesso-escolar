"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, BookOpen, BookOpenCheck, CircleHelp, ClipboardCheck, Crown, FileBarChart, FileWarning, GraduationCap, Home, Link2, LogOut, PencilLine, RotateCcw, ScrollText, TrendingUp, User, Users } from "lucide-react";
import { useUsuarioAtual } from "../hooks/useUsuarioAtual";
import { logout } from "../services/auth";
import { dashboardHomeFor, NOME_PAPEL } from "../types/roles";

const linkIconStyle: React.CSSProperties = {
  display: "flex", height: "24px", width: "24px", alignItems: "center",
  justifyContent: "center", borderRadius: "var(--radius-pill)",
  color: "var(--text-secondary)", transition: "background-color 0.15s ease, color 0.15s ease",
};

const hoverIn = (event: React.MouseEvent<HTMLElement>) => {
  event.currentTarget.style.color = "var(--brand-primary)";
  event.currentTarget.style.background = "var(--bg-sidebar-active)";
};
const hoverOut = (event: React.MouseEvent<HTMLElement>) => {
  event.currentTarget.style.color = "var(--text-secondary)";
  event.currentTarget.style.background = "transparent";
};

export function UserMenu() {
  const { usuario, loading, capacidades, podeAjustarNotas } = useUsuarioAtual();
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);
  if (loading || !usuario) return null;
  const visaoCoordenacao = usuario.role === "ADMIN_ESCOLA";

  async function handleLogout() {
    setSaindo(true);
    try { await logout(); }
    finally { router.replace("/login"); router.refresh(); }
  }

  return (
    <div className="flex items-center gap-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
      <User className="h-3 w-3" style={{ color: "var(--text-secondary)" }} />
      <span className="ml-1 hidden font-medium sm:inline" style={{ color: "var(--text-primary)" }}>{usuario.nome}</span>
      <span className="hidden md:inline" style={{ color: "var(--text-secondary)" }}>· {NOME_PAPEL[usuario.role] ?? usuario.role}</span>

      <Link
        href={dashboardHomeFor(usuario.role, usuario.escola_id)}
        title="Voltar ao dashboard inicial"
        aria-label="Voltar ao dashboard inicial"
        className="ml-2 gap-1 px-2 font-semibold"
        style={{ ...linkIconStyle, width: "auto" }}
        onMouseEnter={hoverIn}
        onMouseLeave={hoverOut}
      >
        <Home className="h-3 w-3" />
        <span className="hidden sm:inline">Início</span>
      </Link>

      {capacidades?.manageNotas && !visaoCoordenacao && (
        <>
          <Link href="/dashboard/diario" title="Diário de classe" aria-label="Diário de classe" className="ml-2" style={linkIconStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
            <BookOpen className="h-3 w-3" />
          </Link>
          <Link href="/dashboard/avaliacoes" title="Avaliações e recuperação" aria-label="Avaliações e recuperação" style={linkIconStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
            <ClipboardCheck className="h-3 w-3" />
          </Link>
        </>
      )}
      {capacidades?.viewReports && (
        <>
          <Link href={visaoCoordenacao ? "/dashboard/relatorios?tipo=intervencao" : "/dashboard/relatorios"} title="Relatórios" aria-label="Relatórios" style={linkIconStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
            <FileBarChart className="h-3 w-3" />
          </Link>
          <Link href="/dashboard/prova-paulista" title="Prova Paulista" aria-label="Prova Paulista" style={linkIconStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
            <BarChart3 className="h-3 w-3" />
          </Link>
        </>
      )}
      {capacidades?.manageUsuarios && !visaoCoordenacao && (
        <>
          {usuario.escola_id && (
            <Link href="/dashboard/alunos" title="Gestão de alunos" aria-label="Gestão de alunos" className="ml-2" style={linkIconStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
              <GraduationCap className="h-3 w-3" />
            </Link>
          )}
          <Link href="/dashboard/usuarios" title="Usuários" aria-label="Usuários" className={usuario.escola_id ? undefined : "ml-2"} style={linkIconStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
            <Users className="h-3 w-3" />
          </Link>
          <Link href="/dashboard/vinculos-professores" title="Vínculos de professores" aria-label="Vínculos de professores" style={linkIconStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
            <Link2 className="h-3 w-3" />
          </Link>
        </>
      )}
      {capacidades?.viewAuditLogs && (
        <Link href="/dashboard/logs" title="Logs de auditoria" aria-label="Logs de auditoria" style={linkIconStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
          <ScrollText className="h-3 w-3" />
        </Link>
      )}
      {usuario.role === "DEV_MASTER" && usuario.is_dev_master && (
        <>
          <Link href="/dashboard/caderno-notas" title="Caderno particular de notas" aria-label="Caderno particular de notas" style={linkIconStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
            <BookOpenCheck className="h-3 w-3" />
          </Link>
          <Link href="/dashboard/ranking" title="Ranking dos alunos" aria-label="Ranking dos alunos" style={linkIconStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
            <Crown className="h-3 w-3" />
          </Link>
          <Link href="/dashboard/relatorio-notas-baixas" title="Relatório de notas abaixo de 5" aria-label="Relatório de notas abaixo de 5" style={linkIconStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
            <FileWarning className="h-3 w-3" />
          </Link>
          <Link href="/dashboard/projecao-notas" title="Projeção de notas futuras" aria-label="Projeção de notas futuras" style={linkIconStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
            <TrendingUp className="h-3 w-3" />
          </Link>
          <Link href="/dashboard/planejamento-recuperacao" title="Planejamento de recuperação" aria-label="Planejamento de recuperação" style={linkIconStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
            <RotateCcw className="h-3 w-3" />
          </Link>
        </>
      )}
      {podeAjustarNotas && !visaoCoordenacao && (
        <Link href="/dashboard/ajustar-notas" title="Ajustar notas" aria-label="Ajustar notas" style={linkIconStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
          <PencilLine className="h-3 w-3" />
        </Link>
      )}
      <Link href="/dashboard/documentacao" title="Documentação e ajuda" aria-label="Documentação e ajuda" style={linkIconStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
        <CircleHelp className="h-3 w-3" />
      </Link>
      <button onClick={handleLogout} disabled={saindo} title="Sair" aria-label="Sair" className="ml-1 disabled:opacity-50" style={linkIconStyle}
        onMouseEnter={(event) => { if (!saindo) { event.currentTarget.style.color = "var(--brand-accent-red)"; event.currentTarget.style.background = "var(--status-danger-tint)"; } }}
        onMouseLeave={hoverOut}>
        <LogOut className="h-3 w-3" />
      </button>
    </div>
  );
}
