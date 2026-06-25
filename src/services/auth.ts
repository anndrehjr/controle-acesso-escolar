interface LoginResponse {
  usuario: {
    id: string
    nome: string
    email: string
    role: string
    escola_id: string | null
  }
}

export async function login(email: string, senha: string): Promise<LoginResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  })

  if (!response.ok) {
    const data = await response.json() as { error?: string }
    throw new Error(data.error ?? 'Erro ao fazer login')
  }

  return response.json() as Promise<LoginResponse>
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' })
}
