export interface UsuarioSessao {
  id: string
  nome: string
  email: string
  role: string
  escola_id: string | null
  is_dev_master: boolean
  pode_ajustar_notas: boolean
}

export type ResultadoSessao =
  | { status: 'autenticado'; usuario: UsuarioSessao }
  | { status: 'nao_autenticado'; usuario: null }
  | { status: 'erro_temporario'; usuario: null }

export async function getCurrentUser(): Promise<ResultadoSessao> {
  try {
    const response = await fetch('/api/auth/me', {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    })

    if (response.status === 401) return { status: 'nao_autenticado', usuario: null }
    if (!response.ok) return { status: 'erro_temporario', usuario: null }

    const data = await response.json() as { usuario?: UsuarioSessao }
    if (!data.usuario) return { status: 'erro_temporario', usuario: null }
    return { status: 'autenticado', usuario: data.usuario }
  } catch {
    return { status: 'erro_temporario', usuario: null }
  }
}
