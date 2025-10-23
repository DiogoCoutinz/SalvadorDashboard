export const formatCurrency = (n: number | null | undefined, withSymbol = true): string => {
  if (n == null || isNaN(n)) return '—'
  
  const formatted = new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
  
  return withSymbol ? `${formatted}€` : formatted
}

export const formatNumber = (n: number | null | undefined): string => {
  if (n == null || isNaN(n)) return '—'
  return new Intl.NumberFormat('pt-PT').format(Math.round(n))
}

export const formatPercent = (n: number | null | undefined): string => {
  if (n == null || isNaN(n)) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toLocaleString('pt-PT', { 
    minimumFractionDigits: 1, 
    maximumFractionDigits: 1 
  })}%`
}

export const calculateGrowth = (current: number, previous: number): number | null => {
  if (previous === 0 || isNaN(previous) || isNaN(current)) return null
  return ((current - previous) / previous) * 100
}

export const formatMonthKey = (monthKey: string): string => {
  // Converts "2024-01" to "Jan"
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const parts = monthKey.split('-')
  if (parts.length !== 2) return monthKey
  const monthIndex = parseInt(parts[1], 10) - 1
  return months[monthIndex] || monthKey
}

