import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatMonthKey } from '@/lib/format'
import { MONTHS_PT } from '@/lib/constants'

type Props = {
  data: Record<string, Record<string, number>>
  title?: string
}

export default function HeatmapTable({ data, title = 'Heatmap Família × Mês' }: Props) {
  const navigate = useNavigate()

  const { familias, allMonths, max } = useMemo(() => {
    const familias = Object.keys(data).sort()
    const monthsSet = new Set<string>()
    let max = 0

    familias.forEach(f => {
      Object.entries(data[f]).forEach(([m, v]) => {
        monthsSet.add(m)
        if (v > max) max = v
      })
    })

    const allMonths = Array.from(monthsSet).sort()
    return { familias, allMonths, max }
  }, [data])

  const getColor = (value: number) => {
    if (value === 0 || !value) return 'bg-dark-card'
    const intensity = Math.min(value / max, 1)
    
    // Use opacity classes instead of hex colors
    if (intensity >= 0.8) return 'bg-success/80'
    if (intensity >= 0.6) return 'bg-success/60'
    if (intensity >= 0.4) return 'bg-success/40'
    if (intensity >= 0.2) return 'bg-success/20'
    return 'bg-success/10'
  }

  const handleFamilyClick = (familia: string) => {
    if (!familia || familia === 'null' || familia === 'undefined') {
      console.warn('Invalid familia clicked:', familia)
      return
    }
    console.log('Navigating to familia detail:', familia)
    navigate(`/detalhe?tipo=familia&nome=${encodeURIComponent(familia)}`)
  }

  if (familias.length === 0) {
    return (
      <div className="card">
        <h3 className="text-base font-semibold mb-4">{title}</h3>
        <p className="text-gray-400 text-sm text-center py-8">Sem dados</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-base font-semibold mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-dark-card z-10 min-w-[120px]">Família</th>
              {allMonths.map(m => (
                <th key={m} className="text-center min-w-[60px]">
                  {formatMonthKey(m)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {familias.filter(f => f && f !== 'null').map(f => (
              <tr key={f} className="hover:bg-dark-hover cursor-pointer transition-colors" onClick={() => handleFamilyClick(f)}>
                <td className="sticky left-0 bg-dark-card z-10 font-medium truncate max-w-[120px] group" title={f || 'Sem nome'}>
                  <span className="group-hover:text-primary transition-colors">
                    {f && f.length > 15 ? f.substring(0, 13) + '...' : f || '—'}
                  </span>
                </td>
                {allMonths.map(m => {
                  const value = data[f]?.[m] || 0
                  return (
                  <td
                    key={m}
                    className={`text-center ${getColor(value)} transition-colors hover:bg-success/90`}
                    title={`${formatMonthKey(m)}: ${formatCurrency(value)}`}
                  >
                    {value > 0 ? (
                      <span className="font-medium">
                        {value >= 1000 ? `${(value / 1000).toFixed(0)}k` : Math.round(value)}
                      </span>
                    ) : '—'}
                  </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

