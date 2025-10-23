import { supabase } from './supabase'
import { type Filters } from './supabase'

/**
 * KPIs adicionais importantes para vendas B2B
 */

/**
 * Número de clientes únicos (ativos)
 */
export const getClientesUnicos = async (filters: Filters = {}) => {
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
  if (filters.familias?.length) {
    query = query.in('Familia', filters.familias)
  }
  if (filters.tipo) {
    query = query.eq('Tipo', filters.tipo)
  }

  const { data, error } = await query.limit(50000)

  if (error) throw error

  // Count unique clients with sales
  const clientesAcUnicos = new Set()
  const clientesAaUnicos = new Set()

  data?.forEach(row => {
    if (parseFloat(String(row.Acum_ac || 0)) > 0) {
      clientesAcUnicos.add(row.Cliente)
    }
    if (parseFloat(String(row.Acum_aa || 0)) > 0) {
      clientesAaUnicos.add(row.Cliente)
    }
  })

  return {
    clientesAtivosAc: clientesAcUnicos.size,
    clientesAtivosAa: clientesAaUnicos.size,
    crescimentoClientes: clientesAaUnicos.size > 0 
      ? ((clientesAcUnicos.size - clientesAaUnicos.size) / clientesAaUnicos.size) * 100 
      : null
  }
}

/**
 * Ticket médio por cliente ativo
 */
export const getTicketMedio = async (filters: Filters = {}) => {
  if (!supabase) {
    throw new Error('Supabase não configurado')
  }

  const vendas = await supabase
    .from('vendas_resumo')
    .select('Cliente, Acum_ac, Acum_aa')
    .gt('Acum_ac', 0) // Só clientes ativos

  if (vendas.error) throw vendas.error

  // Group by cliente para evitar duplicatas
  const clientesMap: Record<string, { acum_ac: number; acum_aa: number }> = {}
  
  vendas.data?.forEach(row => {
    const cliente = row.Cliente
    if (!clientesMap[cliente]) {
      clientesMap[cliente] = { acum_ac: 0, acum_aa: 0 }
    }
    clientesMap[cliente].acum_ac += parseFloat(String(row.Acum_ac || 0))
    clientesMap[cliente].acum_aa += parseFloat(String(row.Acum_aa || 0))
  })

  const clientes = Object.values(clientesMap)
  const numClientesAtivos = clientes.length
  const numClientesAnteriores = clientes.filter(c => c.acum_aa > 0).length

  const totalVendasAc = clientes.reduce((sum, c) => sum + c.acum_ac, 0)
  const totalVendasAa = clientes.reduce((sum, c) => sum + c.acum_aa, 0)

  return {
    ticketMedioAc: numClientesAtivos > 0 ? totalVendasAc / numClientesAtivos : 0,
    ticketMedioAa: numClientesAnteriores > 0 ? totalVendasAa / numClientesAnteriores : 0,
    crescimentoTicket: null // Calculado no componente
  }
}

/**
 * Concentração de vendas - Pareto 80/20
 */
export const getConcentracaoVendas = async (filters: Filters = {}) => {
  if (!supabase) {
    throw new Error('Supabase não configurado')
  }

  const { data, error } = await supabase
    .from('vendas_resumo')
    .select('Cliente, Acum_ac')
    .gt('Acum_ac', 0)
    .limit(50000)

  if (error) throw error

  // Group by cliente
  const clientesMap: Record<string, number> = {}
  data?.forEach(row => {
    const cliente = row.Cliente
    clientesMap[cliente] = (clientesMap[cliente] || 0) + parseFloat(String(row.Acum_ac || 0))
  })

  // Sort by vendas desc
  const clientesOrdenados = Object.entries(clientesMap)
    .map(([cliente, vendas]) => ({ cliente, vendas }))
    .sort((a, b) => b.vendas - a.vendas)

  const totalVendas = clientesOrdenados.reduce((sum, c) => sum + c.vendas, 0)
  const totalClientes = clientesOrdenados.length

  // Calculate concentration
  const top20PctCount = Math.ceil(totalClientes * 0.2)
  const top20PctVendas = clientesOrdenados
    .slice(0, top20PctCount)
    .reduce((sum, c) => sum + c.vendas, 0)

  const concentracaoTop20 = totalVendas > 0 ? (top20PctVendas / totalVendas) * 100 : 0

  return {
    totalClientes,
    concentracaoTop20, // % de vendas dos top 20% clientes
    top20PctCount,
    top20PctVendas
  }
}

/**
 * Performance por tipo de cliente
 */
export const getPerformancePorTipo = async (filters: Filters = {}) => {
  if (!supabase) {
    throw new Error('Supabase não configurado')
  }

  const { data, error } = await supabase
    .from('vendas_resumo')
    .select('Tipo, Acum_ac, Acum_aa')
    .limit(50000)

  if (error) throw error

  const tiposMap: Record<string, { acum_ac: number; acum_aa: number; count: number }> = {}

  data?.forEach(row => {
    const tipo = row.Tipo || 'Não Definido'
    if (!tiposMap[tipo]) {
      tiposMap[tipo] = { acum_ac: 0, acum_aa: 0, count: 0 }
    }
    tiposMap[tipo].acum_ac += parseFloat(String(row.Acum_ac || 0))
    tiposMap[tipo].acum_aa += parseFloat(String(row.Acum_aa || 0))
    tiposMap[tipo].count++
  })

  const result = Object.entries(tiposMap)
    .map(([tipo, vals]) => ({
      tipo,
      acum_ac: vals.acum_ac,
      acum_aa: vals.acum_aa,
      count: vals.count,
      crescimento: vals.acum_aa > 0 ? ((vals.acum_ac - vals.acum_aa) / vals.acum_aa) * 100 : null,
      participacao: 0 // Will be calculated after we have total
    }))
    .sort((a, b) => b.acum_ac - a.acum_ac)

  // Calculate participação
  const totalVendas = result.reduce((sum, r) => sum + r.acum_ac, 0)
  result.forEach(r => {
    r.participacao = totalVendas > 0 ? (r.acum_ac / totalVendas) * 100 : 0
  })

  return result
}
