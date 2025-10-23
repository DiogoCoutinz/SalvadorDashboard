# 🚀 Quick Start — 5 Minutos

## 1️⃣ Instalar (30 seg)

```bash
npm install
```

## 2️⃣ Configurar Supabase (1 min)

Cria `.env.local` na raiz:

```env
VITE_SUPABASE_URL=https://uvvxvqrymdywxoqgnnvd.supabase.co
VITE_SUPABASE_ANON_KEY=<COLA_TUA_KEY_AQUI>
```

**Onde está a key?**
- Vai ao Supabase → Settings → API
- Copia `anon public` key

## 3️⃣ Criar Tabelas (2 min)

No Supabase SQL Editor, cola e executa:

```sql
CREATE TABLE vendas_resumo (
  id BIGSERIAL PRIMARY KEY,
  "Vendedor" TEXT, "No_cliente" TEXT, "Cliente" TEXT,
  "Familia" TEXT, "Tipo" TEXT,
  "Acum_ac" NUMERIC DEFAULT 0, "Acum_aa" NUMERIC DEFAULT 0,
  "Per_acum" NUMERIC DEFAULT 0, "Crescimento" NUMERIC DEFAULT 0
);

CREATE TABLE vendas_mensais (
  id BIGSERIAL PRIMARY KEY,
  "Vendedor" TEXT, "No_cliente" TEXT, "Cliente" TEXT,
  "Familia" TEXT, "Tipo" TEXT, "Mes" TEXT,
  "Valor" NUMERIC DEFAULT 0
);

CREATE INDEX idx_resumo_vendedor ON vendas_resumo("Vendedor");
CREATE INDEX idx_resumo_cliente ON vendas_resumo("Cliente");
CREATE INDEX idx_mensal_mes ON vendas_mensais("Mes");
```

## 4️⃣ Importar Dados (1 min)

- Supabase → Table Editor → vendas_resumo → Import CSV
- Supabase → Table Editor → vendas_mensais → Import CSV

(Usa os teus ficheiros `vendas_resumo.csv` e `vendas_mensais.csv`)

## 5️⃣ Rodar! (30 seg)

```bash
npm run dev
```

Abre http://localhost:5173 🎉

---

## 🔥 Deploy Vercel (BÓNUS)

```bash
# Install CLI
npm i -g vercel

# Deploy
vercel

# Depois:
# 1. Vai ao dashboard Vercel
# 2. Settings → Environment Variables
# 3. Adiciona VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
# 4. Redeploy
```

---

## 🎯 Embed no Notion

```
/embed https://teu-projeto.vercel.app
```

Done! 🚀

