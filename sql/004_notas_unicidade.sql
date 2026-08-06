-- ============================================================
-- Fase 2 de auditoria técnica — controle-acesso-escolar
-- Idempotente: seguro rodar mais de uma vez.
--
-- Achado F-05 da auditoria de 06/08/2026: nada no schema impedia duas notas
-- para o mesmo aluno/disciplina/bimestre/ano — dependia inteiramente da
-- aplicação (ou de quem mexe direto no banco) não duplicar.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notas_unicidade'
  ) THEN
    ALTER TABLE public.notas
      ADD CONSTRAINT notas_unicidade
      UNIQUE (aluno_id, disciplina_id, bimestre, ano_letivo);
  END IF;
END $$;
