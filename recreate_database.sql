-- ============================================
-- SQL COMPLETO PARA RECRIAR BASE DE DADOS
-- Dashboard Vendas - Salvador
-- ============================================

-- 1. Criar tabela vendas_resumo
CREATE TABLE IF NOT EXISTS vendas_resumo (
  id BIGSERIAL PRIMARY KEY,
  "Vendedor" TEXT,
  "No_cliente" TEXT,
  "Cliente" TEXT,
  "Familia" TEXT,
  "Tipo" TEXT,
  "Acum_ac" NUMERIC DEFAULT 0,
  "Acum_aa" NUMERIC DEFAULT 0,
  "Per_acum" NUMERIC DEFAULT 0,
  "Crescimento" NUMERIC
);

-- 2. Criar tabela vendas_mensais
CREATE TABLE IF NOT EXISTS vendas_mensais (
  id BIGSERIAL PRIMARY KEY,
  "Vendedor" TEXT,
  "No_cliente" TEXT,
  "Cliente" TEXT,
  "Familia" TEXT,
  "Tipo" TEXT,
  "Mes" TEXT,
  "Valor" NUMERIC DEFAULT 0
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_resumo_vendedor ON vendas_resumo("Vendedor");
CREATE INDEX IF NOT EXISTS idx_resumo_cliente ON vendas_resumo("Cliente");
CREATE INDEX IF NOT EXISTS idx_resumo_familia ON vendas_resumo("Familia");
CREATE INDEX IF NOT EXISTS idx_mensal_mes ON vendas_mensais("Mes");
CREATE INDEX IF NOT EXISTS idx_mensal_vendedor ON vendas_mensais("Vendedor");
CREATE INDEX IF NOT EXISTS idx_mensal_cliente ON vendas_mensais("Cliente");
CREATE INDEX IF NOT EXISTS idx_mensal_familia ON vendas_mensais("Familia");

-- 4. Desabilitar RLS (Row Level Security) para permitir acesso público
-- Se preferires manter RLS ativo, descomenta as políticas abaixo
ALTER TABLE vendas_resumo DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendas_mensais DISABLE ROW LEVEL SECURITY;

-- ============================================
-- ALTERNATIVA: Se quiseres manter RLS ativo,
-- descomenta estas políticas públicas:
-- ============================================

-- -- Políticas públicas para vendas_resumo (leitura e escrita)
-- CREATE POLICY "Permitir leitura pública vendas_resumo"
--   ON vendas_resumo FOR SELECT
--   USING (true);
-- 
-- CREATE POLICY "Permitir escrita pública vendas_resumo"
--   ON vendas_resumo FOR INSERT
--   WITH CHECK (true);
-- 
-- CREATE POLICY "Permitir atualização pública vendas_resumo"
--   ON vendas_resumo FOR UPDATE
--   USING (true);
-- 
-- CREATE POLICY "Permitir exclusão pública vendas_resumo"
--   ON vendas_resumo FOR DELETE
--   USING (true);
-- 
-- -- Políticas públicas para vendas_mensais (leitura e escrita)
-- CREATE POLICY "Permitir leitura pública vendas_mensais"
--   ON vendas_mensais FOR SELECT
--   USING (true);
-- 
-- CREATE POLICY "Permitir escrita pública vendas_mensais"
--   ON vendas_mensais FOR INSERT
--   WITH CHECK (true);
-- 
-- CREATE POLICY "Permitir atualização pública vendas_mensais"
--   ON vendas_mensais FOR UPDATE
--   USING (true);
-- 
-- CREATE POLICY "Permitir exclusão pública vendas_mensais"
--   ON vendas_mensais FOR DELETE
--   USING (true);
-- 
-- -- E habilita RLS:
-- ALTER TABLE vendas_resumo ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE vendas_mensais ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PRONTO! Agora importa os dados:
-- 1. Vai ao Supabase Table Editor
-- 2. Seleciona vendas_resumo → Import CSV → vendas_resumo.csv
-- 3. Seleciona vendas_mensais → Import CSV → vendas_mensais.csv
-- ============================================

