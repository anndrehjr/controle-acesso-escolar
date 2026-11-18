BEGIN;

CREATE TABLE IF NOT EXISTS prova_paulista_resultados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  turma_id uuid NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  ano_letivo integer NOT NULL CHECK (ano_letivo BETWEEN 2000 AND 2100),
  bimestre smallint NOT NULL CHECK (bimestre BETWEEN 1 AND 4),
  disciplina_codigo varchar(16) NOT NULL,
  percentual_acertos numeric(5,2) NOT NULL CHECK (percentual_acertos BETWEEN 0 AND 100),
  fonte varchar(120) NOT NULL DEFAULT 'Importação de planilha',
  created_by uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (escola_id, turma_id, ano_letivo, bimestre, disciplina_codigo)
);

CREATE INDEX IF NOT EXISTS idx_prova_paulista_consulta
  ON prova_paulista_resultados (escola_id, ano_letivo, bimestre, turma_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON prova_paulista_resultados TO app_escola;

COMMIT;
