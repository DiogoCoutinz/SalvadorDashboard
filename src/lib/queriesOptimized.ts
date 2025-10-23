import { supabase } from './supabase'
import { type Filters } from './supabase'

/**
 * VERSÕES OTIMIZADAS - Reduzem drasticamente o número de requests
 * Usam agregações no cliente com dados limitados
 */

/**
 * getMensal OTIMIZADO - Sem paginação, faz GROUP BY no cliente
 */
export const getMensalOptimized = async (filters: Filters = {}) => {
  if (!supabase) {
    throw new Error('Supabase não configurado')
  }

  let query = supabase
    .from('vendas_mensais')
    .select('Mes, Valor')

  // Apply filters to reduce data BEFORE fetching
  if (filters.vendedores?.length) {
    query = query.in('Vendedor', filters.vendedores)
  }
  if (filters.clientes?.length) {
    query = query.in('Cliente', filters.clientes)
  }
  if (filters.familias?.length) {
    query = query.in('Familia', filters.familias)
  }
  if (filters.tipo) {
    query = query.eq('Tipo', filters.tipo)
  }
  if (filters.meses?.length) {
    query = query.in('Mes', filters.meses)
  }

  // Se não há filtros, buscamos tudo de uma vez (mais eficiente que paginação)
  // Se há filtros, o dataset é muito menor
  const { data, error } = await query.limit(100000) // Remove limite padrão de 1000

  if (error) {
    console.error('Error fetching mensal data:', error)
    throw error
  }

  // Group by month efficiently
  const byMonth: Record<string, number> = {}
  data?.forEach((row) => {
    const month = row.Mes
    const valor = parseFloat(String(row.Valor || 0))
    byMonth[month] = (byMonth[month] || 0) + valor
  })

  // Sort by month order
  const monthOrder: Record<string, number> = {
    'Jan': 1, 'Fev': 2, 'Mar': 3, 'Abr': 4, 'Mai': 5, 'Jun': 6,
    'Jul': 7, 'Ago': 8, 'Set': 9, 'Out': 10, 'Nov': 11, 'Dez': 12
  }

  const result = Object.entries(byMonth)
    .map(([mes, valor]) => ({ mes, valor }))
    .sort((a, b) => (monthOrder[a.mes] || 0) - (monthOrder[b.mes] || 0))

  return result
}

/**
 * getHeatmapFamiliaMes OTIMIZADO - Query mais eficiente
 */
export const getHeatmapFamiliaMesOptimized = async (filters: Filters = {}) => {
  if (!supabase) {
    throw new Error('Supabase não configurado')
  }

  let query = supabase
    .from('vendas_mensais')
    .select('Familia, Mes, Valor')

  // Apply filters to reduce data transfer
  if (filters.vendedores?.length) {
    query = query.in('Vendedor', filters.vendedores)
  }
  if (filters.clientes?.length) {
    query = query.in('Cliente', filters.clientes)
  }
  if (filters.familias?.length) {
    query = query.in('Familia', filters.familias)
  }
  if (filters.tipo) {
    query = query.eq('Tipo', filters.tipo)
  }
  if (filters.meses?.length) {
    query = query.in('Mes', filters.meses)
  }

  const { data, error } = await query.limit(100000) // Remove limite padrão

  if (error) {
    console.error('Error fetching heatmap data:', error)
    throw error
  }

  // Pivot: familia × mes
  const pivot: Record<string, Record<string, number>> = {}
  data?.forEach((row) => {
    const f = row.Familia
    const m = row.Mes
    const valor = parseFloat(String(row.Valor || 0))
    
    if (!pivot[f]) pivot[f] = {}
    pivot[f][m] = (pivot[f][m] || 0) + valor
  })

  return pivot
}

/**
 * getTopVendedores OTIMIZADO - Usa agregação no cliente (mais rápido que SQL)
 */
export const getTopVendedoresOptimized = async (filters: Filters = {}, limit = 10) => {
  if (!supabase) {
    throw new Error('Supabase não configurado')
  }

  let query = supabase
    .from('vendas_resumo')
    .select('Vendedor, Acum_ac, Acum_aa')

  // Apply filters
  if (filters.vendedores?.length) {
    query = query.in('Vendedor', filters.vendedores)
  }
  if (filters.clientes?.length) {
    query = query.in('Cliente', filters.clientes)
  }
  if (filters.familias?.length) {
    query = query.in('Familia', filters.familias)
  }
  if (filters.tipo) {
    query = query.eq('Tipo', filters.tipo)
  }

  const { data, error } = await query.limit(50000)

  if (error) {
    console.error('Error fetching vendedores data:', error)
    throw error
  }

  // Group by vendedor
  const byVendedor: Record<string, { acum_ac: number; acum_aa: number }> = {}
  data?.forEach((row) => {
    const vendedor = row.Vendedor
    if (!byVendedor[vendedor]) {
      byVendedor[vendedor] = { acum_ac: 0, acum_aa: 0 }
    }
    byVendedor[vendedor].acum_ac += parseFloat(String(row.Acum_ac || 0))
    byVendedor[vendedor].acum_aa += parseFloat(String(row.Acum_aa || 0))
  })

  // Convert to array and calculate crescimento
  const result = Object.entries(byVendedor)
    .map(([vendedor, vals]) => ({
      vendedor,
      acum_ac: vals.acum_ac,
      acum_aa: vals.acum_aa,
      crescimento: vals.acum_aa > 0 ? ((vals.acum_ac - vals.acum_aa) / vals.acum_aa) * 100 : null
    }))
    .sort((a, b) => b.acum_ac - a.acum_ac)
    .slice(0, limit)

  return result
}

/**
 * getTopClientes OTIMIZADO - Usa agregação no cliente
 */
export const getTopClientesOptimized = async (filters: Filters = {}, limit = 10) => {
  if (!supabase) {
    throw new Error('Supabase não configurado')
  }

  let query = supabase
    .from('vendas_resumo')
    .select('Cliente, Acum_ac, Acum_aa')

  // Apply filters
  if (filters.vendedores?.length) {
    query = query.in('Vendedor', filters.vendedores)
  }
  if (filters.clientes?.length) {
    query = query.in('Cliente', filters.clientes)
  }
  if (filters.familias?.length) {
    query = query.in('Familia', filters.familias)
  }
  if (filters.tipo) {
    query = query.eq('Tipo', filters.tipo)
  }

  const { data, error } = await query.limit(50000)

  if (error) {
    console.error('Error fetching clientes data:', error)
    throw error
  }

  // Group by cliente
  const byCliente: Record<string, { acum_ac: number; acum_aa: number }> = {}
  data?.forEach((row) => {
    const cliente = row.Cliente
    if (!byCliente[cliente]) {
      byCliente[cliente] = { acum_ac: 0, acum_aa: 0 }
    }
    byCliente[cliente].acum_ac += parseFloat(String(row.Acum_ac || 0))
    byCliente[cliente].acum_aa += parseFloat(String(row.Acum_aa || 0))
  })

  // Convert to array and calculate crescimento
  const result = Object.entries(byCliente)
    .map(([cliente, vals]) => ({
      cliente,
      acum_ac: vals.acum_ac,
      acum_aa: vals.acum_aa,
      crescimento: vals.acum_aa > 0 ? ((vals.acum_ac - vals.acum_aa) / vals.acum_aa) * 100 : null
    }))
    .sort((a, b) => b.acum_ac - a.acum_ac)
    .slice(0, limit)

  return result
}
