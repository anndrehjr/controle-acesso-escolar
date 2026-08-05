-- ============================================================
-- Fase 1 de segurança/RBAC/auditoria — controle-acesso-escolar
-- Idempotente: seguro rodar mais de uma vez (IF NOT EXISTS).
-- As tabelas base (escolas, usuarios, turmas, alunos, disciplinas,
-- matriz_disciplinas, notas) já existem em produção e não são
-- tocadas aqui.
-- ============================================================

-- 1. Vínculo professor <-> turma (papel PROFESSOR, leitura escopada)
CREATE TABLE IF NOT EXISTS public.professor_vinculos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL,
  escola_id uuid NOT NULL,
  turma_id uuid NOT NULL,
  disciplina_id uuid,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT professor_vinculos_pkey PRIMARY KEY (id),
  CONSTRAINT professor_vinculos_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.usuarios(id),
  CONSTRAINT professor_vinculos_escola_id_fkey FOREIGN KEY (escola_id) REFERENCES public.escolas(id),
  CONSTRAINT professor_vinculos_turma_id_fkey FOREIGN KEY (turma_id) REFERENCES public.turmas(id),
  CONSTRAINT professor_vinculos_disciplina_id_fkey FOREIGN KEY (disciplina_id) REFERENCES public.disciplinas(id)
);

CREATE INDEX IF NOT EXISTS idx_professor_vinculos_professor
  ON public.professor_vinculos (professor_id, escola_id) WHERE ativo = true;

-- 2. Auditoria real (a versão documentada em CLAUDE.md nunca foi criada de fato)
CREATE TABLE IF NOT EXISTS public.logs_acesso (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  usuario_email text,
  role text,
  escola_id uuid,
  acao text NOT NULL,
  tela text,
  ip text,
  user_agent text,
  dados_anteriores jsonb,
  dados_novos jsonb,
  sucesso boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT logs_acesso_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_logs_acesso_created_at ON public.logs_acesso (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_acesso_usuario ON public.logs_acesso (usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_acesso_escola ON public.logs_acesso (escola_id);

-- 3. Tentativas de login (rate limiting/bloqueio persistente entre restarts do app)
CREATE TABLE IF NOT EXISTS public.tentativas_login (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip text NOT NULL,
  sucesso boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tentativas_login_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_tentativas_login_email ON public.tentativas_login (email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tentativas_login_ip ON public.tentativas_login (ip, created_at DESC);
