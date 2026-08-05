-- A tabela logs_acesso já existia (criada pelo schema antigo do sistema-escolar-backend,
-- nunca usada de fato) com um shape diferente do que a Fase 1 de auditoria precisa.
-- Este ajuste é idempotente: só adiciona o que falta.

ALTER TABLE public.logs_acesso ADD COLUMN IF NOT EXISTS usuario_email text;
ALTER TABLE public.logs_acesso ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE public.logs_acesso ADD COLUMN IF NOT EXISTS escola_id uuid;
ALTER TABLE public.logs_acesso ADD COLUMN IF NOT EXISTS tela text;
ALTER TABLE public.logs_acesso ADD COLUMN IF NOT EXISTS ip text;
ALTER TABLE public.logs_acesso ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE public.logs_acesso ADD COLUMN IF NOT EXISTS dados_anteriores jsonb;
ALTER TABLE public.logs_acesso ADD COLUMN IF NOT EXISTS dados_novos jsonb;
ALTER TABLE public.logs_acesso ADD COLUMN IF NOT EXISTS sucesso boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_logs_acesso_escola ON public.logs_acesso (escola_id);
