-- Prioridade 4: integridade estrutural dos dados escolares.
-- Idempotente e transacional. A validação inicial impede alterações parciais.

BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.notas WHERE nota IS NULL OR nota < 0 OR nota > 10) THEN
    RAISE EXCEPTION 'notas contém valores nulos ou fora do intervalo 0..10';
  END IF;
  IF EXISTS (SELECT 1 FROM public.notas WHERE bimestre NOT BETWEEN 1 AND 4) THEN
    RAISE EXCEPTION 'notas contém bimestre fora do intervalo 1..4';
  END IF;
  IF EXISTS (SELECT 1 FROM public.notas WHERE ano_letivo NOT BETWEEN 2000 AND 2100) THEN
    RAISE EXCEPTION 'notas contém ano letivo fora do intervalo 2000..2100';
  END IF;
  IF EXISTS (SELECT 1 FROM public.alunos WHERE numero_chamada IS NULL OR numero_chamada <= 0) THEN
    RAISE EXCEPTION 'alunos contém número de chamada nulo ou inválido';
  END IF;
  IF EXISTS (SELECT 1 FROM public.turmas WHERE ano_serie IS NULL OR ano_serie NOT BETWEEN 1 AND 9) THEN
    RAISE EXCEPTION 'turmas contém ano/série nulo ou inválido';
  END IF;
END $$;

-- Corrige o único valor legado com erro de digitação antes de restringir o domínio.
UPDATE public.disciplinas SET etapa = 'AMBOS' WHERE etapa = 'AMBUS';

ALTER TABLE public.notas
  ALTER COLUMN nota SET NOT NULL,
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.alunos
  ALTER COLUMN numero_chamada SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN em_atencao SET NOT NULL,
  ALTER COLUMN ativo SET NOT NULL;

ALTER TABLE public.turmas
  ALTER COLUMN ano_serie SET NOT NULL,
  ALTER COLUMN periodo SET NOT NULL,
  ALTER COLUMN total_ativos SET NOT NULL,
  ALTER COLUMN grupo_pedagogico SET NOT NULL,
  ALTER COLUMN ativo SET NOT NULL;

ALTER TABLE public.disciplinas
  ALTER COLUMN ativo SET NOT NULL,
  ALTER COLUMN etapa SET NOT NULL;

ALTER TABLE public.matriz_disciplinas ALTER COLUMN ativo SET NOT NULL;
ALTER TABLE public.usuarios ALTER COLUMN ativo SET NOT NULL;
ALTER TABLE public.logs_acesso ALTER COLUMN acao SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notas_nota_intervalo') THEN
    ALTER TABLE public.notas ADD CONSTRAINT notas_nota_intervalo CHECK (nota BETWEEN 0 AND 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notas_bimestre_intervalo') THEN
    ALTER TABLE public.notas ADD CONSTRAINT notas_bimestre_intervalo CHECK (bimestre BETWEEN 1 AND 4);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notas_ano_letivo_intervalo') THEN
    ALTER TABLE public.notas ADD CONSTRAINT notas_ano_letivo_intervalo CHECK (ano_letivo BETWEEN 2000 AND 2100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notas_status_valido') THEN
    ALTER TABLE public.notas ADD CONSTRAINT notas_status_valido
      CHECK (status IN ('NORMAL', 'RECUPERACAO', 'CONSELHO', 'AJUSTE'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alunos_numero_chamada_positivo') THEN
    ALTER TABLE public.alunos ADD CONSTRAINT alunos_numero_chamada_positivo CHECK (numero_chamada > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alunos_status_valido') THEN
    ALTER TABLE public.alunos ADD CONSTRAINT alunos_status_valido
      CHECK (status IN ('ATIVO', 'TRANSFERIDO', 'INATIVO', 'CONCLUIDO', 'ABANDONO'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'turmas_etapa_valida') THEN
    ALTER TABLE public.turmas ADD CONSTRAINT turmas_etapa_valida CHECK (etapa IN ('EF', 'EM'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'turmas_ano_serie_intervalo') THEN
    ALTER TABLE public.turmas ADD CONSTRAINT turmas_ano_serie_intervalo CHECK (ano_serie BETWEEN 1 AND 9);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'turmas_total_ativos_nao_negativo') THEN
    ALTER TABLE public.turmas ADD CONSTRAINT turmas_total_ativos_nao_negativo CHECK (total_ativos >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'disciplinas_etapa_valida') THEN
    ALTER TABLE public.disciplinas ADD CONSTRAINT disciplinas_etapa_valida
      CHECK (etapa IN ('AMBOS', 'FUNDAMENTAL', 'MEDIO'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_role_valida') THEN
    ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_role_valida
      CHECK (role IN ('DEV_MASTER', 'SUPER_ADMIN', 'ADMIN_ESCOLA', 'PROFESSOR', 'LEITOR'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_alunos_turma_numero
  ON public.alunos (turma_id, numero_chamada);
CREATE UNIQUE INDEX IF NOT EXISTS uq_turmas_escola_nome
  ON public.turmas (escola_id, nome);
CREATE UNIQUE INDEX IF NOT EXISTS uq_matriz_escola_etapa_codigo
  ON public.matriz_disciplinas (escola_id, etapa, codigo);
CREATE UNIQUE INDEX IF NOT EXISTS uq_matriz_escola_etapa_disciplina
  ON public.matriz_disciplinas (escola_id, etapa, disciplina_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_professor_vinculo_geral
  ON public.professor_vinculos (professor_id, escola_id, turma_id)
  WHERE disciplina_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_professor_vinculo_disciplina
  ON public.professor_vinculos (professor_id, escola_id, turma_id, disciplina_id)
  WHERE disciplina_id IS NOT NULL;

COMMIT;
