-- Prioridades 9 e 10: avaliações, recuperação real e rastreabilidade de valores.
-- Migração idempotente, transacional e sem exclusão de dados.

BEGIN;

CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id),
  turma_id uuid NOT NULL REFERENCES public.turmas(id),
  disciplina_id uuid NOT NULL REFERENCES public.disciplinas(id),
  ano_letivo integer NOT NULL,
  bimestre integer NOT NULL,
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'PROVA',
  peso numeric(8,2) NOT NULL DEFAULT 1,
  nota_maxima numeric(8,2) NOT NULL DEFAULT 10,
  data_avaliacao date,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT avaliacoes_ano_valido CHECK (ano_letivo BETWEEN 2000 AND 2100),
  CONSTRAINT avaliacoes_bimestre_valido CHECK (bimestre BETWEEN 1 AND 4),
  CONSTRAINT avaliacoes_nome_valido CHECK (char_length(btrim(nome)) BETWEEN 2 AND 120),
  CONSTRAINT avaliacoes_tipo_valido CHECK (tipo IN ('ATIVIDADE', 'PROVA', 'TRABALHO', 'SIMULADO', 'OUTRA')),
  CONSTRAINT avaliacoes_peso_valido CHECK (peso > 0 AND peso <= 100),
  CONSTRAINT avaliacoes_nota_maxima_valida CHECK (nota_maxima > 0 AND nota_maxima <= 100)
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_contexto
  ON public.avaliacoes (escola_id, turma_id, disciplina_id, ano_letivo, bimestre, ativo);

CREATE TABLE IF NOT EXISTS public.resultados_avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id uuid NOT NULL REFERENCES public.avaliacoes(id),
  matricula_id uuid NOT NULL REFERENCES public.matriculas(id),
  nota numeric(8,2),
  ausente boolean NOT NULL DEFAULT false,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT resultados_avaliacoes_unicidade UNIQUE (avaliacao_id, matricula_id),
  CONSTRAINT resultados_avaliacoes_presenca CHECK (
    (ausente = true AND nota IS NULL) OR (ausente = false AND nota IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_resultados_avaliacoes_matricula
  ON public.resultados_avaliacoes (matricula_id, avaliacao_id);

CREATE TABLE IF NOT EXISTS public.recuperacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id),
  turma_id uuid NOT NULL REFERENCES public.turmas(id),
  matricula_id uuid NOT NULL REFERENCES public.matriculas(id),
  disciplina_id uuid NOT NULL REFERENCES public.disciplinas(id),
  ano_letivo integer NOT NULL,
  bimestre integer NOT NULL,
  tipo text NOT NULL DEFAULT 'BIMESTRAL',
  criterio text NOT NULL DEFAULT 'MAIOR_NOTA',
  nota_anterior numeric(4,2) NOT NULL,
  nota_recuperacao numeric(4,2) NOT NULL,
  nota_final numeric(4,2) NOT NULL,
  observacao text,
  aplicado boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recuperacoes_unicidade UNIQUE (matricula_id, disciplina_id, ano_letivo, bimestre, tipo),
  CONSTRAINT recuperacoes_ano_valido CHECK (ano_letivo BETWEEN 2000 AND 2100),
  CONSTRAINT recuperacoes_bimestre_valido CHECK (bimestre BETWEEN 1 AND 4),
  CONSTRAINT recuperacoes_tipo_valido CHECK (tipo IN ('PARALELA', 'BIMESTRAL', 'FINAL')),
  CONSTRAINT recuperacoes_criterio_valido CHECK (criterio IN ('MAIOR_NOTA', 'MEDIA_ARITMETICA', 'SUBSTITUICAO')),
  CONSTRAINT recuperacoes_notas_validas CHECK (
    nota_anterior BETWEEN 0 AND 10 AND nota_recuperacao BETWEEN 0 AND 10 AND nota_final BETWEEN 0 AND 10
  )
);

CREATE INDEX IF NOT EXISTS idx_recuperacoes_contexto
  ON public.recuperacoes (escola_id, turma_id, disciplina_id, ano_letivo, bimestre);

ALTER TABLE public.notas ADD COLUMN IF NOT EXISTS origem_calculo text NOT NULL DEFAULT 'LANCAMENTO_MANUAL';
ALTER TABLE public.notas ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notas_origem_calculo_valida') THEN
    ALTER TABLE public.notas ADD CONSTRAINT notas_origem_calculo_valida
      CHECK (origem_calculo IN ('LANCAMENTO_MANUAL', 'AVALIACOES', 'RECUPERACAO'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.validar_avaliacao_escopo()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  grupo text;
BEGIN
  SELECT t.grupo_pedagogico INTO grupo
  FROM public.turmas t
  WHERE t.id = NEW.turma_id AND t.escola_id = NEW.escola_id AND t.ativo = true;
  IF grupo IS NULL THEN RAISE EXCEPTION 'Turma inválida para a avaliação'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.matriz_disciplinas md
    JOIN public.disciplinas d ON d.id = md.disciplina_id
    WHERE md.escola_id = NEW.escola_id AND md.etapa = grupo
      AND md.disciplina_id = NEW.disciplina_id AND md.ativo = true AND d.ativo = true
  ) THEN RAISE EXCEPTION 'Disciplina fora da matriz da turma'; END IF;
  NEW.nome := btrim(NEW.nome);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_avaliacao_escopo ON public.avaliacoes;
CREATE TRIGGER trg_validar_avaliacao_escopo
  BEFORE INSERT OR UPDATE ON public.avaliacoes
  FOR EACH ROW EXECUTE FUNCTION public.validar_avaliacao_escopo();

CREATE OR REPLACE FUNCTION public.validar_resultado_avaliacao()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  av public.avaliacoes%ROWTYPE;
  mat public.matriculas%ROWTYPE;
BEGIN
  SELECT * INTO av FROM public.avaliacoes WHERE id = NEW.avaliacao_id;
  SELECT * INTO mat FROM public.matriculas WHERE id = NEW.matricula_id;
  IF av.id IS NULL OR mat.id IS NULL OR mat.escola_id <> av.escola_id
     OR mat.turma_id <> av.turma_id OR mat.ano_letivo <> av.ano_letivo THEN
    RAISE EXCEPTION 'Resultado não corresponde à avaliação e à matrícula';
  END IF;
  IF NEW.nota IS NOT NULL AND (NEW.nota < 0 OR NEW.nota > av.nota_maxima) THEN
    RAISE EXCEPTION 'Resultado fora da escala da avaliação';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_resultado_avaliacao ON public.resultados_avaliacoes;
CREATE TRIGGER trg_validar_resultado_avaliacao
  BEFORE INSERT OR UPDATE ON public.resultados_avaliacoes
  FOR EACH ROW EXECUTE FUNCTION public.validar_resultado_avaliacao();

CREATE OR REPLACE FUNCTION public.calcular_validar_recuperacao()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  mat public.matriculas%ROWTYPE;
  grupo text;
BEGIN
  SELECT * INTO mat FROM public.matriculas WHERE id = NEW.matricula_id;
  IF mat.id IS NULL OR mat.escola_id <> NEW.escola_id OR mat.turma_id <> NEW.turma_id
     OR mat.ano_letivo <> NEW.ano_letivo THEN
    RAISE EXCEPTION 'Recuperação não corresponde à matrícula';
  END IF;
  SELECT grupo_pedagogico INTO grupo FROM public.turmas WHERE id = NEW.turma_id AND escola_id = NEW.escola_id;
  IF NOT EXISTS (
    SELECT 1 FROM public.matriz_disciplinas md
    WHERE md.escola_id = NEW.escola_id AND md.etapa = grupo
      AND md.disciplina_id = NEW.disciplina_id AND md.ativo = true
  ) THEN RAISE EXCEPTION 'Disciplina fora da matriz da recuperação'; END IF;
  NEW.nota_final := CASE NEW.criterio
    WHEN 'MAIOR_NOTA' THEN greatest(NEW.nota_anterior, NEW.nota_recuperacao)
    WHEN 'MEDIA_ARITMETICA' THEN round((NEW.nota_anterior + NEW.nota_recuperacao) / 2, 2)
    ELSE NEW.nota_recuperacao
  END;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calcular_validar_recuperacao ON public.recuperacoes;
CREATE TRIGGER trg_calcular_validar_recuperacao
  BEFORE INSERT OR UPDATE ON public.recuperacoes
  FOR EACH ROW EXECUTE FUNCTION public.calcular_validar_recuperacao();

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.avaliacoes TO app_escola;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.resultados_avaliacoes TO app_escola;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.recuperacoes TO app_escola;

COMMIT;
