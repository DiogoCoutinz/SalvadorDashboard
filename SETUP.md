# Setup Rápido

## 1. Instalar

```bash
npm install
```

## 2. Configurar Supabase

Cria o ficheiro `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://uvvxvqrymdywxoqgnnvd.supabase.co
VITE_SUPABASE_ANON_KEY=<TUA_KEY_AQUI>
```

**Onde encontrar as credenciais:**
1. Vai ao teu projeto Supabase
2. Settings → API
3. Copia `Project URL` e `anon public` key

## 3. Criar as Tabelas no Supabase

No Supabase SQL Editor, executa:

```sql
-- Tabela vendas_resumo
CREATE TABLE vendas_resumo (
  id BIGSERIAL PRIMARY KEY,
  "Vendedor" TEXT,
  "No_cliente" TEXT,
  "Cliente" TEXT,
  "Familia" TEXT,
  "Tipo" TEXT,
  "Acum_ac" NUMERIC DEFAULT 0,
  "Acum_aa" NUMERIC DEFAULT 0,
  "Per_acum" NUMERIC DEFAULT 0,
  "Crescimento" NUMERIC DEFAULT 0
);

-- Tabela vendas_mensais
CREATE TABLE vendas_mensais (
  id BIGSERIAL PRIMARY KEY,
  "Vendedor" TEXT,
  "No_cliente" TEXT,
  "Cliente" TEXT,
  "Familia" TEXT,
  "Tipo" TEXT,
  "Mes" TEXT,
  "Valor" NUMERIC DEFAULT 0
);

-- Índices para performance
CREATE INDEX idx_resumo_vendedor ON vendas_resumo("Vendedor");
CREATE INDEX idx_resumo_cliente ON vendas_resumo("Cliente");
CREATE INDEX idx_resumo_familia ON vendas_resumo("Familia");
CREATE INDEX idx_mensal_mes ON vendas_mensais("Mes");
CREATE INDEX idx_mensal_vendedor ON vendas_mensais("Vendedor");
```

## 4. Importar Dados

### Opção A: UI do Supabase
1. Vai à tabela no Table Editor
2. Import CSV
3. Seleciona `vendas_resumo.csv` e `vendas_mensais.csv`

### Opção B: Python Script (se tiveres os CSVs)
```python
# Ver tratar_vendas.py como referência
```

## 5. Executar

```bash
npm run dev
```

## 6. Deploy Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configura as env vars no dashboard Vercel
```

## Troubleshooting

**Erro de fetch/CORS:**
- Confirma que as tabelas estão públicas (RLS disabled para leitura) ou configura políticas
- No Supabase: Authentication → Policies

**Sem dados:**
- Verifica se as tabelas têm dados no Table Editor
- Abre DevTools Console para ver erros

**CSV Fallback:**
- Coloca `vendas_resumo.csv` e `vendas_mensais.csv` em `/public`
- Remove/comenta as env vars do Supabase

