export const ROLES = ['DEV_MASTER', 'SUPER_ADMIN', 'ADMIN_ESCOLA', 'PROFESSOR', 'LEITOR'] as const

export type Role = (typeof ROLES)[number]

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

/**
 * Nomes exibidos na interface. A hierarquia de 3 níveis pedida (Dev Master /
 * Administrador Multi-Escolas / Direção-Coordenação) é uma reinterpretação
 * dos papéis já existentes, não uma tabela nova — SUPER_ADMIN vira
 * "Administrador Multi-Escolas" e ADMIN_ESCOLA vira "Direção/Coordenação"
 * na tela, preservando o valor salvo no banco (nenhuma migração de dados
 * de usuários existentes).
 */
export const NOME_PAPEL: Record<Role, string> = {
  DEV_MASTER: 'Dev Master',
  SUPER_ADMIN: 'Administrador Multi-Escolas',
  ADMIN_ESCOLA: 'Direção/Coordenação',
  PROFESSOR: 'Professor',
  LEITOR: 'Somente leitura',
}

export interface RoleCapabilities {
  /** Vê e navega entre todas as escolas, não só a própria */
  viewAllEscolas: boolean
  /** Vê todas as turmas da escola (coordenador); se falso, só as turmas vinculadas (professor) */
  viewAllTurmasDaEscola: boolean
  /** Pode gerenciar usuários (criar, resetar senha, ativar/desativar) — sempre restrito à própria escola, exceto DEV_MASTER/SUPER_ADMIN */
  manageUsuarios: boolean
  /** Pode acessar a tela de logs de auditoria */
  viewAuditLogs: boolean
  /** Pode consultar e exportar relatórios oficiais */
  viewReports: boolean
  /** Pode lançar/editar notas (sempre restrito às turmas visíveis do usuário — F-01) */
  manageNotas: boolean
  /**
   * Nível 1 (Dev Master): recursos internos/de manutenção do sistema — configurações globais,
   * ferramentas de desenvolvimento, recursos ainda não expostos aos demais perfis. Gated
   * separadamente de viewAllEscolas porque um Administrador Multi-Escolas (nível 2) também
   * enxerga todas as escolas, mas NUNCA deve ter acesso a isso.
   */
  devTools: boolean
}

export const CAPABILITIES: Record<Role, RoleCapabilities> = {
  DEV_MASTER: {
    viewAllEscolas: true,
    viewAllTurmasDaEscola: true,
    manageUsuarios: true,
    viewAuditLogs: true,
    viewReports: true,
    manageNotas: true,
    devTools: true,
  },
  SUPER_ADMIN: {
    viewAllEscolas: true,
    viewAllTurmasDaEscola: true,
    manageUsuarios: true,
    viewAuditLogs: true,
    viewReports: true,
    manageNotas: true,
    devTools: false,
  },
  ADMIN_ESCOLA: {
    viewAllEscolas: false,
    viewAllTurmasDaEscola: true,
    // Direção/Coordenação passa a gerenciar usuários da própria escola (ex.: cadastrar
    // professores) — o backend já restringe isso à escola do próprio usuário e nunca permite
    // criar/alterar um papel acima do seu (ver api/usuarios e api/usuarios/[id]/resetar-senha).
    manageUsuarios: true,
    viewAuditLogs: false,
    viewReports: true,
    manageNotas: true,
    devTools: false,
  },
  PROFESSOR: {
    viewAllEscolas: false,
    viewAllTurmasDaEscola: false,
    manageUsuarios: false,
    viewAuditLogs: false,
    viewReports: true,
    manageNotas: true,
    devTools: false,
  },
  LEITOR: {
    viewAllEscolas: false,
    viewAllTurmasDaEscola: true,
    manageUsuarios: false,
    viewAuditLogs: false,
    viewReports: true,
    manageNotas: false,
    devTools: false,
  },
}

export function capabilitiesFor(role: string): RoleCapabilities {
  return isRole(role) ? CAPABILITIES[role] : CAPABILITIES.LEITOR
}

/**
 * Mantem as guardas de pagina sincronizadas com a mesma matriz de capacidades
 * usada pelos menus e pelas APIs.
 */
export function rolesWithCapability(capability: keyof RoleCapabilities): Role[] {
  return ROLES.filter((role) => CAPABILITIES[role][capability])
}

/** Papéis que um usuário com determinado papel pode atribuir a outro usuário (nunca a si mesmo, nunca acima do próprio nível). */
export function papeisAtribuiveisPor(role: Role): Role[] {
  if (role === 'DEV_MASTER') return ['DEV_MASTER', 'SUPER_ADMIN', 'ADMIN_ESCOLA', 'PROFESSOR', 'LEITOR']
  if (role === 'SUPER_ADMIN') return ['ADMIN_ESCOLA', 'PROFESSOR', 'LEITOR']
  if (role === 'ADMIN_ESCOLA') return ['PROFESSOR', 'LEITOR']
  return []
}

/** Rota de destino após login, por papel. */
export function dashboardHomeFor(role: Role, escolaId: string | null): string {
  if (role === 'DEV_MASTER' || role === 'SUPER_ADMIN') return '/dashboard'
  return escolaId ? `/dashboard/escolas/${escolaId}` : '/dashboard'
}
