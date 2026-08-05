-- ============================================================
-- Fase 1 de segurança/RBAC/auditoria (continuação) — controle-acesso-escolar
-- Idempotente: seguro rodar mais de uma vez (IF NOT EXISTS).
--
-- tokens_revogados já existia em produção sem migration correspondente
-- (criada fora do versionamento) — esta migration formaliza o schema real
-- para que o banco continue reproduzível a partir do git em qualquer
-- ambiente (dev, produção, um terceiro ambiente futuro).
-- ============================================================

-- Denylist de JWT revogados por jti, com expiração — permite invalidar uma sessão
-- especifica no servidor (ex: logout forçado, reset de senha) mesmo o token ainda
-- não tendo expirado naturalmente.
CREATE TABLE IF NOT EXISTS public.tokens_revogados (
  jti uuid NOT NULL DEFAULT gen_random_uuid(),
  token_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  revogado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tokens_revogados_pkey PRIMARY KEY (jti),
  CONSTRAINT tokens_revogados_token_hash_key UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_tokens_revogados_expires ON public.tokens_revogados (expires_at);
CREATE INDEX IF NOT EXISTS idx_tokens_revogados_hash ON public.tokens_revogados (token_hash);
