BEGIN;

CREATE TABLE IF NOT EXISTS public.dev_cadernos_notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  disciplina_id uuid NOT NULL REFERENCES public.disciplinas(id) ON DELETE RESTRICT,
  ano_letivo integer NOT NULL CHECK (ano_letivo BETWEEN 2000 AND 2100),
  bimestre integer NOT NULL CHECK (bimestre BETWEEN 1 AND 4),
  created_by uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (created_by, turma_id, disciplina_id, ano_letivo, bimestre)
);

CREATE TABLE IF NOT EXISTS public.dev_caderno_componentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caderno_id uuid NOT NULL REFERENCES public.dev_cadernos_notas(id) ON DELETE CASCADE,
  nome text NOT NULL CHECK (char_length(btrim(nome)) BETWEEN 1 AND 60),
  ordem integer NOT NULL CHECK (ordem BETWEEN 1 AND 20),
  peso numeric(7,4) CHECK (peso IS NULL OR (peso > 0 AND peso <= 100)),
  nota_maxima numeric(5,2) NOT NULL DEFAULT 10 CHECK (nota_maxima > 0 AND nota_maxima <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (caderno_id, ordem)
);

CREATE TABLE IF NOT EXISTS public.dev_caderno_resultados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caderno_id uuid NOT NULL REFERENCES public.dev_cadernos_notas(id) ON DELETE CASCADE,
  componente_id uuid NOT NULL REFERENCES public.dev_caderno_componentes(id) ON DELETE CASCADE,
  matricula_id uuid NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  nota numeric(6,2) NOT NULL CHECK (nota >= 0 AND nota <= 100),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (componente_id, matricula_id)
);

CREATE INDEX IF NOT EXISTS idx_dev_cadernos_contexto
  ON public.dev_cadernos_notas (created_by, escola_id, ano_letivo, bimestre);
CREATE INDEX IF NOT EXISTS idx_dev_caderno_resultados_caderno
  ON public.dev_caderno_resultados (caderno_id, matricula_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dev_cadernos_notas TO app_escola;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dev_caderno_componentes TO app_escola;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dev_caderno_resultados TO app_escola;

COMMIT;
