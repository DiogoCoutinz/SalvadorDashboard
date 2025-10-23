import pandas as pd
import numpy as np

# 1️⃣ Lê o ficheiro Excel/CSV original
df = pd.read_csv("VendasSetembro.csv", encoding="latin1")

# 2️⃣ Limpa strings e caracteres estranhos
df.columns = df.columns.str.strip()
df = df.map(lambda x: str(x).strip() if isinstance(x, str) else x)
df.replace({'¢': 'o', '€': 'e', 'å': 'a', '': 'i'}, regex=True, inplace=True)

# 3️⃣ Converte colunas numéricas para float (corrige "." e ",")
for c in df.columns[5:]:
    df[c] = (
        df[c]
        .astype(str)
        .str.replace(".", "", regex=False)   # remove pontos de milhar
        .str.replace(",", ".", regex=False)  # troca vírgulas por ponto decimal
        .replace("", "0")
        .astype(float)
    )

# 4️⃣ Cria versão longa (somente meses)
cols_mensais = [c for c in df.columns if "_ac" in c.lower() and "acum" not in c.lower()]
df_melt = df.melt(
    id_vars=['Vendedor', 'No_cliente', 'Cliente', 'Familia', 'Tipo'],
    value_vars=cols_mensais,
    var_name='Mes',
    value_name='Valor'
)
df_melt['Mes'] = df_melt['Mes'].str.replace('_ac', '').str.capitalize()

# 5️⃣ Calcula crescimento acumulado (com proteção para divisões por zero)
df["Crescimento"] = np.where(
    df["Acum_aa"] == 0, np.nan, ((df["Acum_ac"] - df["Acum_aa"]) / df["Acum_aa"]) * 100
)

# 6️⃣ Cria resumo limpo (sem colunas mensais)
vendas_resumo = df[['Vendedor', 'No_cliente', 'Cliente', 'Familia', 'Tipo',
                    'Acum_ac', 'Acum_aa', 'Per_acum', 'Crescimento']]

# 7️⃣ Uniformiza nomes (igual ao Supabase)
vendas_resumo.columns = [c.capitalize() for c in vendas_resumo.columns]
df_melt.columns = [c.capitalize() for c in df_melt.columns]

# 6️⃣ Cria versão resumo (sem colunas mensais)
vendas_resumo = df[['Vendedor', 'No_cliente', 'Cliente', 'Familia', 'Tipo',
                    'Acum_ac', 'Acum_aa', 'Per_acum', 'Crescimento']]

# 7️⃣ Exporta CSVs prontos para o Supabase
vendas_resumo.to_csv("vendas_resumo.csv", index=False)
df_melt.to_csv("vendas_mensais.csv", index=False)

print("✅ Dados tratados e exportados com sucesso!")
print("➡️ Ficheiros criados: vendas_resumo.csv e vendas_mensais.csv")

