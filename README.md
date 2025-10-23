# Dashboard Vendas — Salvador

Dashboard moderno de vendas em React + TypeScript com Supabase, Tailwind CSS e Recharts.

## Stack Tecnológica

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (dark theme baseado no template)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Database**: Supabase (com fallback para CSV local)
- **Deploy**: Vercel

## Estrutura de Dados

### Tabelas Supabase

**vendas_resumo**
```
Vendedor, No_cliente, Cliente, Familia, Tipo, Acum_ac, Acum_aa, Per_acum, Crescimento
```

**vendas_mensais**
```
Vendedor, No_cliente, Cliente, Familia, Tipo, Mes, Valor
```

## Setup Local

1. **Instalar dependências**
```bash
npm install
```

2. **Configurar environment**

Copie `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```

Edite `.env.local` e adicione suas credenciais Supabase:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

3. **Executar em desenvolvimento**
```bash
npm run dev
```

Abre em http://localhost:5173

## Fallback CSV

Se não configurar Supabase, coloque os ficheiros CSV na pasta `/public`:
- `/public/vendas_resumo.csv`
- `/public/vendas_mensais.csv`

## Build & Deploy

### Build local
```bash
npm run build
npm run preview
```

### Deploy Vercel

1. Push para GitHub
2. Conecte o repo no Vercel
3. Configure as env vars no dashboard Vercel
4. Deploy automático

## Funcionalidades

✅ Dashboard principal com KPIs, gráficos e heatmap  
✅ Filtros globais (vendedor, cliente, família, tipo)  
✅ Páginas de ranking (vendedores, clientes, famílias)  
✅ Página de detalhe reusável para qualquer entidade  
✅ Comparação YTD vs ano anterior  
✅ Navegação por URL (filtros persistem)  
✅ Responsivo mobile-first  
✅ Pronto para embed no Notion

## Embedding no Notion

Use a URL do deploy Vercel num bloco Embed:
```
/embed https://seu-dashboard.vercel.app
```

## Estrutura do Projeto

```
/src
  /components   → KpiCard, MonthTrend, BarCompare, HeatmapTable, DataTable, Filters, Layout
  /pages        → Dashboard, Vendedores, Clientes, Familias, DetalheEntidade
  /lib          → supabase.ts, format.ts, constants.ts, queries.ts
```

## Licença

Propriedade privada — Salvador Business

