import { formatCurrency, formatPercent, formatNumber } from '@/lib/format'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type Props = {
  label: string
  value: number
  previous?: number
  format?: 'currency' | 'number' | 'percent'
  invertDelta?: boolean
}

export default function KpiCard({ label, value, previous, format = 'currency', invertDelta = false }: Props) {
  const delta = previous != null && previous > 0 ? ((value - previous) / previous) * 100 : null

  const deltaClass = delta == null ? '' : delta > 0
    ? invertDelta ? 'text-danger' : 'text-success'
    : invertDelta ? 'text-success' : 'text-danger'

  const Icon = delta == null ? Minus : delta > 0 ? TrendingUp : TrendingDown

  const formattedValue = format === 'currency' 
    ? formatCurrency(value) 
    : format === 'percent'
    ? formatPercent(value)
    : formatNumber(value)

  return (
    <div className="card">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold mb-2">{formattedValue}</div>
      {delta != null && (
        <div className={`flex items-center gap-1 text-xs ${deltaClass}`}>
          <Icon className="w-3 h-3" />
          <span>{formatPercent(Math.abs(delta))}</span>
        </div>
      )}
      {delta == null && previous != null && (
        <div className="text-xs text-gray-500">—</div>
      )}
    </div>
  )
}

