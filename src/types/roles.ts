export const ROLES = ['SUPER_ADMIN', 'ADMIN_ESCOLA', 'PROFESSOR', 'LEITOR'] as const

export type Role = (typeof ROLES)[number]

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

export interface RoleCapabilities {
  /** Vê e navega entre todas as escolas, não só a própria */
  viewAllEscolas: boolean
  /** Vê todas as turmas da escola (coordenador); se falso, só as turmas vinculadas (professor) */
  viewAllTurmasDaEscola: boolean
  /** Pode gerenciar usuários (criar, resetar senha, ativar/desativar) */
  manageUsuarios: boolean
  /** Pode acessar a tela de logs de auditoria */
  viewAuditLogs: boolean
}

export const CAPABILITIES: Record<Role, RoleCapabilities> = {
  SUPER_ADMIN: {
    viewAllEscolas: true,
    viewAllTurmasDaEscola: true,
    manageUsuarios: true,
    viewAuditLogs: true,
  },
  ADMIN_ESCOLA: {
    viewAllEscolas: false,
    viewAllTurmasDaEscola: true,
    manageUsuarios: true,
    viewAuditLogs: false,
  },
  PROFESSOR: {
    viewAllEscolas: false,
    viewAllTurmasDaEscola: false,
    manageUsuarios: false,
    viewAuditLogs: false,
  },
  LEITOR: {
    viewAllEscolas: false,
    viewAllTurmasDaEscola: true,
    manageUsuarios: false,
    viewAuditLogs: false,
  },
}

export function capabilitiesFor(role: string): RoleCapabilities {
  return isRole(role) ? CAPABILITIES[role] : CAPABILITIES.LEITOR
}

/** Rota de destino após login, por papel. */
export function dashboardHomeFor(role: Role, escolaId: string | null): string {
  if (role === 'SUPER_ADMIN') return '/dashboard'
  return escolaId ? `/dashboard/escolas/${escolaId}` : '/dashboard'
}
