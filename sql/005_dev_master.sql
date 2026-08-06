-- Etapa final: hierarquia de 3 níveis + identificador exclusivo do Dev Master
-- (nunca usar somente o nome do papel como mecanismo de autorização — ver
-- types/roles.ts e lib/auth.ts) + fluxo de troca de senha obrigatória no
-- primeiro login.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios' AND column_name = 'is_dev_master'
  ) THEN
    ALTER TABLE public.usuarios ADD COLUMN is_dev_master boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios' AND column_name = 'deve_trocar_senha'
  ) THEN
    ALTER TABLE public.usuarios ADD COLUMN deve_trocar_senha boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Só pode haver 1 linha com is_dev_master = true por vez (identificador exclusivo,
-- não uma lista aberta) — reforça a intenção de "usuário exclusivo do tipo DEV MASTER".
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_unico_dev_master
  ON public.usuarios ((is_dev_master))
  WHERE is_dev_master = true;
