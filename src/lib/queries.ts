import { supabase, type Filters, type VendaResumo, type VendaMensal } from './supabase'

// Helper to apply filters to a query
const applyFilters = (query: any, filters: Filters, table: 'resumo' | 'mensal') => {
  if (filters.vendedores && filters.vendedores.length > 0) {
    query = query.in('Vendedor', filters.vendedores)
  }
  if (filters.clientes && filters.clientes.length > 0) {
    query = query.in('Cliente', filters.clientes)
  }
  if (filters.familias && filters.familias.length > 0) {
    query = query.in('Familia', filters.familias)
  }
  if (filters.tipo) {
    query = query.eq('Tipo', filters.tipo)
  }
  if (table === 'mensal' && filters.meses && filters.meses.length > 0) {
    query = query.in('Mes', filters.meses)
  }
  return query
}

export const getResumo = async (filters: Filters = {}) => {
  if (!supabase) {
    return fallbackGetResumo(filters)
  }


  let query = supabase.from('vendas_resumo').select('Acum_ac, Acum_aa')
  
  // Só aplicar filtros se existirem
  const hasFilters = (filters.vendedores && filters.vendedores.length > 0) ||
                      (filters.clientes && filters.clientes.length > 0) ||
                      (filters.familias && filters.familias.length > 0) ||
                      filters.tipo
  
  if (hasFilters) {
    query = applyFilters(query, filters, 'resumo')
  }
  
  const { data, error } = await query
  if (error) throw error

  const totalAcumAc = data?.reduce((sum, row) => sum + (parseFloat(String(row.Acum_ac)) || 0), 0) || 0
  const totalAcumAa = data?.reduce((sum, row) => sum + (parseFloat(String(row.Acum_aa)) || 0), 0) || 0
  const crescimento = totalAcumAa > 0 ? ((totalAcumAc - totalAcumAa) / totalAcumAa) * 100 : null


  return {
    totalAcumAc,
    totalAcumAa,
    crescimento,
  }
}

export const getMensal = async (filters: Filters = {}) => {
  if (!supabase) {
    return fallbackGetMensal(filters)
  }


  // CRÍTICO: Supabase tem limite de 1000 rows por padrão!
  // Como temos 64k+ records, precisamos buscar SEM PAGINAÇÃO
  let query = supabase
    .from('vendas_mensais')
    .select('Mes, Valor', { count: 'exact' })
  
  // IMPORTANTE: Só aplicar filtros se existirem!
  const hasFilters = (filters.vendedores && filters.vendedores.length > 0) ||
                      (filters.clientes && filters.clientes.length > 0) ||
                      (filters.familias && filters.familias.length > 0) ||
                      filters.tipo ||
                      (filters.meses && filters.meses.length > 0)
  
  if (hasFilters) {
    query = applyFilters(query, filters, 'mensal')
  }
  
  // Fetch tudo de uma vez (sem limite)
  let allData: any[] = []
  let page = 0
  const pageSize = 1000
  let hasMore = true
  
  while (hasMore) {
    const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1)
    
    if (error) {
      console.error('Error fetching mensal data:', error)
      throw error
    }
    
    if (data) {
      allData = allData.concat(data)
    }
    
    hasMore = data && data.length === pageSize
    page++
    
    // Safety limit: max 100 pages (100k records)
    if (page > 100) {
      break
    }
  }
  
  const data = allData
  const error = null
  if (error) {
    console.error('Error fetching mensal data:', error)
    throw error
  }


  // Group by month
  const byMonth: Record<string, number> = {}
  data?.forEach((row) => {
    const month = row.Mes
    const valor = parseFloat(String(row.Valor || 0))
    byMonth[month] = (byMonth[month] || 0) + valor
  })

  // Convert to array and sort
  const result = Object.entries(byMonth).map(([mes, valor]) => ({ mes, valor }))
  
  // Sort by actual month order, not alphabetically
  const monthOrder: Record<string, number> = {
    'Jan': 1, 'Fev': 2, 'Mar': 3, 'Abr': 4, 'Mai': 5, 'Jun': 6,
    'Jul': 7, 'Ago': 8, 'Set': 9, 'Out': 10, 'Nov': 11, 'Dez': 12
  }
  
  result.sort((a, b) => (monthOrder[a.mes] || 0) - (monthOrder[b.mes] || 0))

  return result
}

export const getTopVendedores = async (filters: Filters = {}, limit = 10) => {
  if (!supabase) {
    return fallbackGetTopVendedores(filters, limit)
  }

  let query = supabase.from('vendas_resumo').select('Vendedor, Acum_ac, Acum_aa')
  
  const hasFilters = (filters.vendedores && filters.vendedores.length > 0) ||
                      (filters.familias && filters.familias.length > 0) ||
                      filters.tipo
  
  if (hasFilters) {
    query = applyFilters(query, filters, 'resumo')
  }
  
  // Fetch com paginação
  let allData: any[] = []
  let page = 0
  const pageSize = 1000
  let hasMore = true
  
  while (hasMore) {
    const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1)
    if (error) throw error
    if (data) allData = allData.concat(data)
    hasMore = data && data.length === pageSize
    page++
    if (page > 20) break // Vendas_resumo é menor
  }

  // Group by Vendedor
  const byVendedor: Record<string, { acum_ac: number; acum_aa: number }> = {}
  allData.forEach((row) => {
    const v = row.Vendedor
    if (!byVendedor[v]) {
      byVendedor[v] = { acum_ac: 0, acum_aa: 0 }
    }
    byVendedor[v].acum_ac += parseFloat(String(row.Acum_ac || 0))
    byVendedor[v].acum_aa += parseFloat(String(row.Acum_aa || 0))
  })

  const result = Object.entries(byVendedor).map(([vendedor, vals]) => ({
    vendedor,
    acum_ac: vals.acum_ac,
    acum_aa: vals.acum_aa,
    crescimento: vals.acum_aa > 0 ? ((vals.acum_ac - vals.acum_aa) / vals.acum_aa) * 100 : null,
  }))

  result.sort((a, b) => b.acum_ac - a.acum_ac)
  return result.slice(0, limit)
}

export const getTopClientes = async (filters: Filters = {}, limit = 10) => {
  if (!supabase) {
    return fallbackGetTopClientes(filters, limit)
  }

  let query = supabase.from('vendas_resumo').select('Cliente, Vendedor, Acum_ac, Acum_aa')
  
  const hasFilters = (filters.vendedores && filters.vendedores.length > 0) ||
                      (filters.familias && filters.familias.length > 0) ||
                      filters.tipo
  
  if (hasFilters) {
    query = applyFilters(query, filters, 'resumo')
  }
  
  // Fetch com paginação
  let allData: any[] = []
  let page = 0
  const pageSize = 1000
  let hasMore = true
  
  while (hasMore) {
    const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1)
    if (error) throw error
    if (data) allData = allData.concat(data)
    hasMore = data && data.length === pageSize
    page++
    if (page > 20) break
  }

  // Group by Cliente
  const byCliente: Record<string, { vendedor: string; acum_ac: number; acum_aa: number }> = {}
  allData.forEach((row) => {
    const c = row.Cliente
    if (!byCliente[c]) {
      byCliente[c] = { vendedor: row.Vendedor, acum_ac: 0, acum_aa: 0 }
    }
    byCliente[c].acum_ac += parseFloat(String(row.Acum_ac || 0))
    byCliente[c].acum_aa += parseFloat(String(row.Acum_aa || 0))
  })

  const result = Object.entries(byCliente).map(([cliente, vals]) => ({
    cliente,
    vendedor: vals.vendedor,
    acum_ac: vals.acum_ac,
    acum_aa: vals.acum_aa,
    crescimento: vals.acum_aa > 0 ? ((vals.acum_ac - vals.acum_aa) / vals.acum_aa) * 100 : null,
  }))

  result.sort((a, b) => b.acum_ac - a.acum_ac)
  return result.slice(0, limit)
}

export const getFamiliasResumo = async (filters: Filters = {}) => {
  if (!supabase) {
    return fallbackGetFamiliasResumo(filters)
  }

  let query = supabase.from('vendas_resumo').select('Familia, Acum_ac, Acum_aa')
  
  const hasFilters = (filters.vendedores && filters.vendedores.length > 0) ||
                      filters.tipo
  
  if (hasFilters) {
    query = applyFilters(query, filters, 'resumo')
  }
  
  // Fetch com paginação
  let allData: any[] = []
  let page = 0
  const pageSize = 1000
  let hasMore = true
  
  while (hasMore) {
    const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1)
    if (error) throw error
    if (data) allData = allData.concat(data)
    hasMore = data && data.length === pageSize
    page++
    if (page > 20) break
  }

  // Group by Familia
  const byFamilia: Record<string, { acum_ac: number; acum_aa: number }> = {}
  allData.forEach((row) => {
    const f = row.Familia
    if (!byFamilia[f]) {
      byFamilia[f] = { acum_ac: 0, acum_aa: 0 }
    }
    byFamilia[f].acum_ac += parseFloat(String(row.Acum_ac || 0))
    byFamilia[f].acum_aa += parseFloat(String(row.Acum_aa || 0))
  })

  const result = Object.entries(byFamilia).map(([familia, vals]) => ({
    familia,
    acum_ac: vals.acum_ac,
    acum_aa: vals.acum_aa,
    crescimento: vals.acum_aa > 0 ? ((vals.acum_ac - vals.acum_aa) / vals.acum_aa) * 100 : null,
  }))

  result.sort((a, b) => b.acum_ac - a.acum_ac)
  return result
}

export const getHeatmapFamiliaMes = async (filters: Filters = {}) => {
  if (!supabase) {
    return fallbackGetHeatmapFamiliaMes(filters)
  }

  // Usar aggregate direto no Supabase para evitar buscar 64k records
  let query = supabase.from('vendas_mensais').select('Familia, Mes, Valor')
  
  const hasFilters = (filters.vendedores && filters.vendedores.length > 0) ||
                      (filters.clientes && filters.clientes.length > 0) ||
                      (filters.familias && filters.familias.length > 0) ||
                      filters.tipo ||
                      (filters.meses && filters.meses.length > 0)
  
  if (hasFilters) {
    query = applyFilters(query, filters, 'mensal')
  }
  
  // Fetch com paginação
  let allData: any[] = []
  let page = 0
  const pageSize = 1000
  let hasMore = true
  
  while (hasMore) {
    const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1)
    
    if (error) throw error
    
    if (data) {
      allData = allData.concat(data)
    }
    
    hasMore = data && data.length === pageSize
    page++
    
    if (page > 100) break // Safety
  }

  // Pivot: familia × mes
  const pivot: Record<string, Record<string, number>> = {}
  allData.forEach((row) => {
    const f = row.Familia
    const m = row.Mes
    if (!pivot[f]) pivot[f] = {}
    pivot[f][m] = (pivot[f][m] || 0) + (parseFloat(String(row.Valor)) || 0)
  })

  return pivot
}

export const getEntidadeSeries = async (
  entidade: string,
  tipoEntidade: 'vendedor' | 'cliente' | 'familia',
  filters: Filters = {}
) => {
  if (!supabase) {
    return fallbackGetEntidadeSeries(entidade, tipoEntidade, filters)
  }

  const column = tipoEntidade === 'vendedor' ? 'Vendedor' : tipoEntidade === 'cliente' ? 'Cliente' : 'Familia'


  let query = supabase.from('vendas_mensais').select('Mes, Valor, Familia, Vendedor, Cliente')
  query = query.eq(column, entidade)
  query = applyFilters(query, filters, 'mensal')
  
  // CRÍTICO: Também precisa de paginação aqui!
  let allData: any[] = []
  let page = 0
  const pageSize = 1000
  let hasMore = true
  
  
  while (hasMore) {
    const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1)
    
    if (error) {
      console.error('Supabase error:', error)
      throw error
    }
    
    if (data) {
      allData = allData.concat(data)
    }
    
    hasMore = data && data.length === pageSize
    page++
    
    if (page > 100) {
      break
    }
  }
  
  
  if (allData.length === 0) {
    console.warn('No data found for:', { entidade, tipoEntidade })
    return { series: [], breakdown: [] }
  }
  
  const data = allData

  // Series mensal
  const byMonth: Record<string, number> = {}
  data.forEach((row) => {
    const m = row.Mes
    const valor = parseFloat(String(row.Valor || 0))
    byMonth[m] = (byMonth[m] || 0) + valor
  })

  // Sort by month order
  const monthOrder: Record<string, number> = {
    'Jan': 1, 'Fev': 2, 'Mar': 3, 'Abr': 4, 'Mai': 5, 'Jun': 6,
    'Jul': 7, 'Ago': 8, 'Set': 9, 'Out': 10, 'Nov': 11, 'Dez': 12
  }

  const series = Object.entries(byMonth)
    .map(([mes, valor]) => ({ mes, valor }))
    .sort((a, b) => (monthOrder[a.mes] || 0) - (monthOrder[b.mes] || 0))
  
  console.log('Series for', entidade, ':', series)

  // Breakdown por outra dimensão
  let breakdownKey = ''
  if (tipoEntidade === 'vendedor') breakdownKey = 'Familia'
  else if (tipoEntidade === 'cliente') breakdownKey = 'Familia'
  else breakdownKey = 'Cliente'

  const breakdownMap: Record<string, number> = {}
  data.forEach((row) => {
    const key = row[breakdownKey as keyof typeof row] as string
    if (key) {
      const valor = parseFloat(String(row.Valor || 0))
      breakdownMap[key] = (breakdownMap[key] || 0) + valor
    }
  })

  const breakdown = Object.entries(breakdownMap)
    .map(([name, valor]) => ({ name, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10)
  
  console.log('Breakdown for', entidade, ':', breakdown.length, 'items')

  return { series, breakdown }
}

export const searchClientes = async (search: string, filters: Filters = {}, limit = 50) => {
  if (!supabase) {
    return fallbackSearchClientes(search, filters, limit)
  }

  let query = supabase.from('vendas_resumo').select('Cliente')
  if (search) {
    query = query.ilike('Cliente', `%${search}%`)
  }
  query = applyFilters(query, filters, 'resumo')
  
  const { data, error } = await query
  if (error) throw error

  const unique = Array.from(new Set(data?.map(r => r.Cliente) || []))
  return unique.slice(0, limit)
}

export const getFilterOptions = async () => {
  if (!supabase) {
    return fallbackGetFilterOptions()
  }

  const [vendedoresRes, familiasRes, tiposRes] = await Promise.all([
    supabase.from('vendas_resumo').select('Vendedor'),
    supabase.from('vendas_resumo').select('Familia'),
    supabase.from('vendas_resumo').select('Tipo'),
  ])

  return {
    vendedores: Array.from(new Set(vendedoresRes.data?.map(r => r.Vendedor) || [])).sort(),
    familias: Array.from(new Set(familiasRes.data?.map(r => r.Familia) || [])).sort(),
    tipos: Array.from(new Set(tiposRes.data?.map(r => r.Tipo) || [])).sort(),
  }
}

// ========================================
// FALLBACK (CSV local)
// ========================================

let cachedResumo: VendaResumo[] | null = null
let cachedMensal: VendaMensal[] | null = null

const loadCSVs = async () => {
  if (cachedResumo && cachedMensal) return

  try {
    const [resumoRes, mensalRes] = await Promise.all([
      fetch('/vendas_resumo.csv'),
      fetch('/vendas_mensais.csv'),
    ])

    const resumoText = await resumoRes.text()
    const mensalText = await mensalRes.text()

    cachedResumo = parseCSV(resumoText, 'resumo') as VendaResumo[]
    cachedMensal = parseCSV(mensalText, 'mensal') as VendaMensal[]
  } catch (err) {
    console.warn('Fallback CSV load failed:', err)
    cachedResumo = []
    cachedMensal = []
  }
}

const parseCSV = (text: string, type: 'resumo' | 'mensal') => {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const obj: any = {}
    headers.forEach((h, i) => {
      const val = values[i]
      if (type === 'resumo' && ['Acum_ac', 'Acum_aa', 'Per_acum', 'Crescimento'].includes(h)) {
        obj[h] = parseFloat(val) || 0
      } else if (type === 'mensal' && h === 'Valor') {
        obj[h] = parseFloat(val) || 0
      } else {
        obj[h] = val
      }
    })
    return obj
  })
}

const fallbackGetResumo = async (filters: Filters) => {
  await loadCSVs()
  let data = cachedResumo || []
  
  if (filters.vendedores?.length) data = data.filter(r => filters.vendedores!.includes(r.Vendedor))
  if (filters.clientes?.length) data = data.filter(r => filters.clientes!.includes(r.Cliente))
  if (filters.familias?.length) data = data.filter(r => filters.familias!.includes(r.Familia))
  if (filters.tipo) data = data.filter(r => r.Tipo === filters.tipo)

  const totalAcumAc = data.reduce((sum, r) => sum + r.Acum_ac, 0)
  const totalAcumAa = data.reduce((sum, r) => sum + r.Acum_aa, 0)
  const crescimento = totalAcumAa > 0 ? ((totalAcumAc - totalAcumAa) / totalAcumAa) * 100 : null

  return { totalAcumAc, totalAcumAa, crescimento }
}

const fallbackGetMensal = async (filters: Filters) => {
  await loadCSVs()
  let data = cachedMensal || []
  
  if (filters.vendedores?.length) data = data.filter(r => filters.vendedores!.includes(r.Vendedor))
  if (filters.clientes?.length) data = data.filter(r => filters.clientes!.includes(r.Cliente))
  if (filters.familias?.length) data = data.filter(r => filters.familias!.includes(r.Familia))
  if (filters.tipo) data = data.filter(r => r.Tipo === filters.tipo)
  if (filters.meses?.length) data = data.filter(r => filters.meses!.includes(r.Mes))

  const byMonth: Record<string, number> = {}
  data.forEach(r => {
    byMonth[r.Mes] = (byMonth[r.Mes] || 0) + r.Valor
  })

  const result = Object.entries(byMonth).map(([mes, valor]) => ({ mes, valor }))
  result.sort((a, b) => a.mes.localeCompare(b.mes))
  return result
}

const fallbackGetTopVendedores = async (filters: Filters, limit: number) => {
  await loadCSVs()
  let data = cachedResumo || []
  
  if (filters.vendedores?.length) data = data.filter(r => filters.vendedores!.includes(r.Vendedor))
  if (filters.clientes?.length) data = data.filter(r => filters.clientes!.includes(r.Cliente))
  if (filters.familias?.length) data = data.filter(r => filters.familias!.includes(r.Familia))
  if (filters.tipo) data = data.filter(r => r.Tipo === filters.tipo)

  const byVendedor: Record<string, { acum_ac: number; acum_aa: number }> = {}
  data.forEach(r => {
    if (!byVendedor[r.Vendedor]) byVendedor[r.Vendedor] = { acum_ac: 0, acum_aa: 0 }
    byVendedor[r.Vendedor].acum_ac += r.Acum_ac
    byVendedor[r.Vendedor].acum_aa += r.Acum_aa
  })

  const result = Object.entries(byVendedor).map(([vendedor, vals]) => ({
    vendedor,
    acum_ac: vals.acum_ac,
    acum_aa: vals.acum_aa,
    crescimento: vals.acum_aa > 0 ? ((vals.acum_ac - vals.acum_aa) / vals.acum_aa) * 100 : null,
  }))

  result.sort((a, b) => b.acum_ac - a.acum_ac)
  return result.slice(0, limit)
}

const fallbackGetTopClientes = async (filters: Filters, limit: number) => {
  await loadCSVs()
  let data = cachedResumo || []
  
  if (filters.vendedores?.length) data = data.filter(r => filters.vendedores!.includes(r.Vendedor))
  if (filters.clientes?.length) data = data.filter(r => filters.clientes!.includes(r.Cliente))
  if (filters.familias?.length) data = data.filter(r => filters.familias!.includes(r.Familia))
  if (filters.tipo) data = data.filter(r => r.Tipo === filters.tipo)

  const byCliente: Record<string, { vendedor: string; acum_ac: number; acum_aa: number }> = {}
  data.forEach(r => {
    if (!byCliente[r.Cliente]) byCliente[r.Cliente] = { vendedor: r.Vendedor, acum_ac: 0, acum_aa: 0 }
    byCliente[r.Cliente].acum_ac += r.Acum_ac
    byCliente[r.Cliente].acum_aa += r.Acum_aa
  })

  const result = Object.entries(byCliente).map(([cliente, vals]) => ({
    cliente,
    vendedor: vals.vendedor,
    acum_ac: vals.acum_ac,
    acum_aa: vals.acum_aa,
    crescimento: vals.acum_aa > 0 ? ((vals.acum_ac - vals.acum_aa) / vals.acum_aa) * 100 : null,
  }))

  result.sort((a, b) => b.acum_ac - a.acum_ac)
  return result.slice(0, limit)
}

const fallbackGetFamiliasResumo = async (filters: Filters) => {
  await loadCSVs()
  let data = cachedResumo || []
  
  if (filters.vendedores?.length) data = data.filter(r => filters.vendedores!.includes(r.Vendedor))
  if (filters.clientes?.length) data = data.filter(r => filters.clientes!.includes(r.Cliente))
  if (filters.familias?.length) data = data.filter(r => filters.familias!.includes(r.Familia))
  if (filters.tipo) data = data.filter(r => r.Tipo === filters.tipo)

  const byFamilia: Record<string, { acum_ac: number; acum_aa: number }> = {}
  data.forEach(r => {
    if (!byFamilia[r.Familia]) byFamilia[r.Familia] = { acum_ac: 0, acum_aa: 0 }
    byFamilia[r.Familia].acum_ac += r.Acum_ac
    byFamilia[r.Familia].acum_aa += r.Acum_aa
  })

  const result = Object.entries(byFamilia).map(([familia, vals]) => ({
    familia,
    acum_ac: vals.acum_ac,
    acum_aa: vals.acum_aa,
    crescimento: vals.acum_aa > 0 ? ((vals.acum_ac - vals.acum_aa) / vals.acum_aa) * 100 : null,
  }))

  result.sort((a, b) => b.acum_ac - a.acum_ac)
  return result
}

const fallbackGetHeatmapFamiliaMes = async (filters: Filters) => {
  await loadCSVs()
  let data = cachedMensal || []
  
  if (filters.vendedores?.length) data = data.filter(r => filters.vendedores!.includes(r.Vendedor))
  if (filters.clientes?.length) data = data.filter(r => filters.clientes!.includes(r.Cliente))
  if (filters.familias?.length) data = data.filter(r => filters.familias!.includes(r.Familia))
  if (filters.tipo) data = data.filter(r => r.Tipo === filters.tipo)
  if (filters.meses?.length) data = data.filter(r => filters.meses!.includes(r.Mes))

  const pivot: Record<string, Record<string, number>> = {}
  data.forEach(r => {
    if (!pivot[r.Familia]) pivot[r.Familia] = {}
    pivot[r.Familia][r.Mes] = (pivot[r.Familia][r.Mes] || 0) + r.Valor
  })

  return pivot
}

const fallbackGetEntidadeSeries = async (
  entidade: string,
  tipoEntidade: 'vendedor' | 'cliente' | 'familia',
  filters: Filters
) => {
  await loadCSVs()
  let data = cachedMensal || []
  
  const column = tipoEntidade === 'vendedor' ? 'Vendedor' : tipoEntidade === 'cliente' ? 'Cliente' : 'Familia'
  data = data.filter(r => r[column] === entidade)
  
  if (filters.vendedores?.length) data = data.filter(r => filters.vendedores!.includes(r.Vendedor))
  if (filters.clientes?.length) data = data.filter(r => filters.clientes!.includes(r.Cliente))
  if (filters.familias?.length) data = data.filter(r => filters.familias!.includes(r.Familia))
  if (filters.tipo) data = data.filter(r => r.Tipo === filters.tipo)
  if (filters.meses?.length) data = data.filter(r => filters.meses!.includes(r.Mes))

  const byMonth: Record<string, number> = {}
  data.forEach(r => {
    byMonth[r.Mes] = (byMonth[r.Mes] || 0) + r.Valor
  })

  const series = Object.entries(byMonth)
    .map(([mes, valor]) => ({ mes, valor }))
    .sort((a, b) => a.mes.localeCompare(b.mes))

  let breakdownKey = ''
  if (tipoEntidade === 'vendedor') breakdownKey = 'Familia'
  else if (tipoEntidade === 'cliente') breakdownKey = 'Familia'
  else breakdownKey = 'Cliente'

  const breakdownMap: Record<string, number> = {}
  data.forEach(r => {
    const key = r[breakdownKey as keyof VendaMensal] as string
    breakdownMap[key] = (breakdownMap[key] || 0) + r.Valor
  })

  const breakdown = Object.entries(breakdownMap)
    .map(([name, valor]) => ({ name, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10)

  return { series, breakdown }
}

const fallbackSearchClientes = async (search: string, filters: Filters, limit: number) => {
  await loadCSVs()
  let data = cachedResumo || []
  
  if (search) {
    const lower = search.toLowerCase()
    data = data.filter(r => r.Cliente.toLowerCase().includes(lower))
  }
  
  if (filters.vendedores?.length) data = data.filter(r => filters.vendedores!.includes(r.Vendedor))
  if (filters.familias?.length) data = data.filter(r => filters.familias!.includes(r.Familia))
  if (filters.tipo) data = data.filter(r => r.Tipo === filters.tipo)

  const unique = Array.from(new Set(data.map(r => r.Cliente)))
  return unique.slice(0, limit)
}

const fallbackGetFilterOptions = async () => {
  await loadCSVs()
  const data = cachedResumo || []

  return {
    vendedores: Array.from(new Set(data.map(r => r.Vendedor))).sort(),
    familias: Array.from(new Set(data.map(r => r.Familia))).sort(),
    tipos: Array.from(new Set(data.map(r => r.Tipo))).sort(),
  }
}

// ========================================
// DATA UPLOAD & REPLACEMENT
// ========================================

/**
 * Apaga todos os dados das tabelas vendas_resumo e vendas_mensais
 */
export const deleteAllData = async () => {
  if (!supabase) {
    throw new Error('Supabase não configurado')
  }

  console.log('🗑️ A apagar todos os dados...')
  
  // Apaga vendas_mensais primeiro (pode ter foreign keys)
  const { error: errorMensal } = await supabase
    .from('vendas_mensais')
    .delete()
    .neq('id', 0) // Deleta tudo (Supabase não tem delete all direto)
  
  if (errorMensal) throw new Error(`Erro ao apagar vendas_mensais: ${errorMensal.message}`)
  
  // Apaga vendas_resumo
  const { error: errorResumo } = await supabase
    .from('vendas_resumo')
    .delete()
    .neq('id', 0)
  
  if (errorResumo) throw new Error(`Erro ao apagar vendas_resumo: ${errorResumo.message}`)
  
  console.log('✅ Dados apagados com sucesso')
}

/**
 * Insere dados novos em lotes (batch insert)
 */
export const insertNewData = async (
  resumo: any[],
  mensal: any[]
) => {
  if (!supabase) {
    throw new Error('Supabase não configurado')
  }

  console.log('📤 A inserir novos dados...')
  console.log('   📊 Resumo:', resumo.length, 'linhas')
  console.log('   📅 Mensal:', mensal.length, 'linhas')
  
  // Insere em lotes de 1000 (limite do Supabase)
  const BATCH_SIZE = 1000
  
  // Insere vendas_resumo
  for (let i = 0; i < resumo.length; i += BATCH_SIZE) {
    const batch = resumo.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('vendas_resumo')
      .insert(batch)
    
    if (error) {
      throw new Error(`Erro ao inserir resumo (lote ${i / BATCH_SIZE + 1}): ${error.message}`)
    }
    
    console.log(`   ✓ Resumo lote ${i / BATCH_SIZE + 1}/${Math.ceil(resumo.length / BATCH_SIZE)}`)
  }
  
  // Insere vendas_mensais
  for (let i = 0; i < mensal.length; i += BATCH_SIZE) {
    const batch = mensal.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('vendas_mensais')
      .insert(batch)
    
    if (error) {
      throw new Error(`Erro ao inserir mensal (lote ${i / BATCH_SIZE + 1}): ${error.message}`)
    }
    
    console.log(`   ✓ Mensal lote ${i / BATCH_SIZE + 1}/${Math.ceil(mensal.length / BATCH_SIZE)}`)
  }
  
  console.log('✅ Dados inseridos com sucesso!')
}

