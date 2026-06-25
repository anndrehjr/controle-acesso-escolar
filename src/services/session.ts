interface Usuario {
  id: string
  nome: string
  email: string
  role: string
  escola_id: string | null
}

export async function getCurrentUser(): Promise<Usuario | null> {
  try {
    const response = await fetch('/api/auth/me')

    if (!response.ok) {
      return null
    }

    const data = await response.json() as { usuario: Usuario }
    return data.usuario
  } catch {
    return null
  }
}
