-- Prioridades 7 e 8: vínculos consistentes, diário de classe e matrícula anual.
-- Migração idempotente e sem exclusão de dados.

BEGIN;

CREATE TABLE IF NOT EXISTS public.matriculas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL,
  aluno_id uuid NOT NULL,
  turma_id uuid NOT NULL,
  ano_letivo integer NOT NULL,
  numero_chamada integer NOT NULL,
  status text NOT NULL DEFAULT 'ATIVA',
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_fim date,
  motivo_fim text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT matriculas_pkey PRIMARY KEY (id),
  CONSTRAINT matriculas_escola_fkey FOREIGN KEY (escola_id) REFERENCES public.escolas(id),
  CONSTRAINT matriculas_aluno_fkey FOREIGN KEY (aluno_id) REFERENCES public.alunos(id),
  CONSTRAINT matriculas_turma_fkey FOREIGN KEY (turma_id) REFERENCES public.turmas(id),
  CONSTRAINT matriculas_ano_valido CHECK (ano_letivo BETWEEN 2000 AND 2100),
  CONSTRAINT matriculas_numero_positivo CHECK (numero_chamada > 0),
  CONSTRAINT matriculas_status_valido CHECK (status IN ('ATIVA', 'TRANSFERIDA', 'CONCLUIDA', 'CANCELADA')),
  CONSTRAINT matriculas_periodo_valido CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_matriculas_aluno_turma_ano
  ON public.matriculas (aluno_id, turma_id, ano_letivo);
CREATE UNIQUE INDEX IF NOT EXISTS uq_matriculas_ativa_aluno_ano
  ON public.matriculas (aluno_id, ano_letivo) WHERE status = 'ATIVA';
CREATE UNIQUE INDEX IF NOT EXISTS uq_matriculas_ativa_chamada
  ON public.matriculas (turma_id, ano_letivo, numero_chamada) WHERE status = 'ATIVA';
CREATE INDEX IF NOT EXISTS idx_matriculas_escola_ano_turma
  ON public.matriculas (escola_id, ano_letivo, turma_id, status);

CREATE OR REPLACE FUNCTION public.validar_matricula_escopo()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.alunos a
    WHERE a.id = NEW.aluno_id AND a.escola_id = NEW.escola_id
  ) THEN
    RAISE EXCEPTION 'Aluno não pertence à escola da matrícula';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.turmas t
    WHERE t.id = NEW.turma_id AND t.escola_id = NEW.escola_id
  ) THEN
    RAISE EXCEPTION 'Turma não pertence à escola da matrícula';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_matricula_escopo ON public.matriculas;
CREATE TRIGGER trg_validar_matricula_escopo
  BEFORE INSERT OR UPDATE ON public.matriculas
  FOR EACH ROW EXECUTE FUNCTION public.validar_matricula_escopo();

-- Converte o vínculo atual aluno -> turma em matrícula do ano letivo da escola.
INSERT INTO public.matriculas (
  escola_id, aluno_id, turma_id, ano_letivo, numero_chamada,
  status, data_inicio
)
SELECT
  a.escola_id,
  a.id,
  a.turma_id,
  e.ano_letivo,
  a.numero_chamada,
  CASE WHEN a.status = 'TRANSFERIDO' OR a.ativo = false THEN 'TRANSFERIDA' ELSE 'ATIVA' END,
  COALESCE(a.created_at::date, make_date(e.ano_letivo, 1, 1))
FROM public.alunos a
JOIN public.escolas e ON e.id = a.escola_id
WHERE e.ano_letivo IS NOT NULL
ON CONFLICT (aluno_id, turma_id, ano_letivo) DO UPDATE SET
  numero_chamada = EXCLUDED.numero_chamada,
  status = EXCLUDED.status,
  updated_at = now();

ALTER TABLE public.notas ADD COLUMN IF NOT EXISTS matricula_id uuid;

UPDATE public.notas n
SET matricula_id = m.id
FROM public.matriculas m
WHERE n.matricula_id IS NULL
  AND m.escola_id = n.escola_id
  AND m.aluno_id = n.aluno_id
  AND m.turma_id = n.turma_id
  AND m.ano_letivo = n.ano_letivo;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.notas WHERE matricula_id IS NULL) THEN
    RAISE EXCEPTION 'Existem notas sem matrícula anual correspondente';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notas_matricula_fkey') THEN
    ALTER TABLE public.notas
      ADD CONSTRAINT notas_matricula_fkey
      FOREIGN KEY (matricula_id) REFERENCES public.matriculas(id);
  END IF;
END $$;

ALTER TABLE public.notas ALTER COLUMN matricula_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_notas_matricula_disciplina_bimestre
  ON public.notas (matricula_id, disciplina_id, bimestre);
CREATE INDEX IF NOT EXISTS idx_notas_matricula ON public.notas (matricula_id);

CREATE OR REPLACE FUNCTION public.preencher_validar_nota_matricula()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  matricula public.matriculas%ROWTYPE;
BEGIN
  IF NEW.matricula_id IS NULL THEN
    SELECT m.* INTO matricula
    FROM public.matriculas m
    WHERE m.escola_id = NEW.escola_id
      AND m.aluno_id = NEW.aluno_id
      AND m.turma_id = NEW.turma_id
      AND m.ano_letivo = NEW.ano_letivo
    ORDER BY CASE WHEN m.status = 'ATIVA' THEN 0 ELSE 1 END
    LIMIT 1;
    NEW.matricula_id := matricula.id;
  ELSE
    SELECT m.* INTO matricula FROM public.matriculas m WHERE m.id = NEW.matricula_id;
  END IF;

  IF matricula.id IS NULL
     OR matricula.escola_id <> NEW.escola_id
     OR matricula.aluno_id <> NEW.aluno_id
     OR matricula.turma_id <> NEW.turma_id
     OR matricula.ano_letivo <> NEW.ano_letivo THEN
    RAISE EXCEPTION 'A nota não corresponde à matrícula anual informada';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_preencher_validar_nota_matricula ON public.notas;
CREATE TRIGGER trg_preencher_validar_nota_matricula
  BEFORE INSERT OR UPDATE OF escola_id, turma_id, aluno_id, ano_letivo, matricula_id
  ON public.notas
  FOR EACH ROW EXECUTE FUNCTION public.preencher_validar_nota_matricula();

CREATE OR REPLACE FUNCTION public.validar_professor_vinculo()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  turma_grupo text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = NEW.professor_id
      AND u.escola_id = NEW.escola_id
      AND u.role = 'PROFESSOR'
      AND u.ativo = true
  ) THEN
    RAISE EXCEPTION 'O vínculo exige um professor ativo da mesma escola';
  END IF;

  SELECT t.grupo_pedagogico INTO turma_grupo
  FROM public.turmas t
  WHERE t.id = NEW.turma_id AND t.escola_id = NEW.escola_id AND t.ativo = true;

  IF turma_grupo IS NULL THEN
    RAISE EXCEPTION 'A turma do vínculo não pertence à escola ou está inativa';
  END IF;

  IF NEW.disciplina_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.matriz_disciplinas md
    JOIN public.disciplinas d ON d.id = md.disciplina_id
    WHERE md.escola_id = NEW.escola_id
      AND md.etapa = turma_grupo
      AND md.disciplina_id = NEW.disciplina_id
      AND md.ativo = true
      AND d.ativo = true
  ) THEN
    RAISE EXCEPTION 'A disciplina não pertence à matriz da turma';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_professor_vinculo ON public.professor_vinculos;
CREATE TRIGGER trg_validar_professor_vinculo
  BEFORE INSERT OR UPDATE ON public.professor_vinculos
  FOR EACH ROW EXECUTE FUNCTION public.validar_professor_vinculo();

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE matriculas TO app_escola;

COMMIT;
