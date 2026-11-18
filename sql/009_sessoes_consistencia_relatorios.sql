BEGIN;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 0;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='usuarios_session_version_valida' AND conrelid='usuarios'::regclass) THEN
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_session_version_valida CHECK (session_version >= 0);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_tokens_revogados_expira ON tokens_revogados (expires_at);

-- C22 e uma copia sem referencias; C05 e o cadastro utilizado.
-- O registro e preservado para rastreabilidade, apenas deixa de ser ativo.
UPDATE disciplinas d SET ativo=false
WHERE d.id='941b10bd-5b09-4bc0-ad51-d5062494c34c' AND d.codigo='C22'
AND NOT EXISTS (SELECT 1 FROM notas n WHERE n.disciplina_id=d.id)
AND NOT EXISTS (SELECT 1 FROM matriz_disciplinas md WHERE md.disciplina_id=d.id)
AND NOT EXISTS (SELECT 1 FROM professor_vinculos pv WHERE pv.disciplina_id=d.id)
AND NOT EXISTS (SELECT 1 FROM avaliacoes av WHERE av.disciplina_id=d.id)
AND NOT EXISTS (SELECT 1 FROM recuperacoes r WHERE r.disciplina_id=d.id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_disciplinas_nome_normalizado_ativa
ON disciplinas (escola_id, lower(regexp_replace(trim(nome), '\s+', ' ', 'g')))
WHERE ativo=true;

CREATE OR REPLACE FUNCTION sincronizar_aluno_com_matriculas()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  aluno_alvo uuid := COALESCE(NEW.aluno_id, OLD.aluno_id);
  matricula_atual record;
BEGIN
  SELECT m.status,m.turma_id,m.numero_chamada INTO matricula_atual
  FROM matriculas m WHERE m.aluno_id=aluno_alvo
  ORDER BY (m.status='ATIVA') DESC,m.ano_letivo DESC,m.updated_at DESC,m.created_at DESC LIMIT 1;
  IF NOT FOUND THEN
    UPDATE alunos SET status='INATIVO',ativo=false WHERE id=aluno_alvo;
  ELSIF matricula_atual.status='ATIVA' THEN
    UPDATE alunos SET status='ATIVO',ativo=true,turma_id=matricula_atual.turma_id,
      numero_chamada=matricula_atual.numero_chamada WHERE id=aluno_alvo;
  ELSE
    UPDATE alunos SET status=CASE matricula_atual.status
      WHEN 'TRANSFERIDA' THEN 'TRANSFERIDO'
      WHEN 'CONCLUIDA' THEN 'CONCLUIDO'
      ELSE 'INATIVO' END,ativo=false WHERE id=aluno_alvo;
  END IF;
  RETURN COALESCE(NEW,OLD);
END;
$$;
DROP TRIGGER IF EXISTS trg_sincronizar_aluno_matricula ON matriculas;
CREATE TRIGGER trg_sincronizar_aluno_matricula
AFTER INSERT OR DELETE OR UPDATE OF status,turma_id,numero_chamada,ano_letivo ON matriculas
FOR EACH ROW EXECUTE FUNCTION sincronizar_aluno_com_matriculas();

UPDATE alunos a SET ativo=false
WHERE a.status='TRANSFERIDO' AND a.ativo=true
AND NOT EXISTS (SELECT 1 FROM matriculas m WHERE m.aluno_id=a.id AND m.status='ATIVA');

CREATE INDEX IF NOT EXISTS idx_notas_relatorios
ON notas (escola_id,ano_letivo,turma_id,disciplina_id,bimestre,aluno_id);
CREATE INDEX IF NOT EXISTS idx_recuperacoes_relatorios
ON recuperacoes (escola_id,ano_letivo,turma_id,disciplina_id,bimestre,matricula_id) WHERE aplicado=true;
CREATE INDEX IF NOT EXISTS idx_avaliacoes_relatorios
ON avaliacoes (escola_id,ano_letivo,turma_id,disciplina_id,bimestre) WHERE ativo=true;
GRANT SELECT, UPDATE (session_version) ON usuarios TO app_escola;
COMMIT;
