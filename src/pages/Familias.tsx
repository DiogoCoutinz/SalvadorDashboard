import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getFamiliasResumo } from '@/lib/queries'
import { type Filters } from '@/lib/supabase'
import { formatCurrency, formatPercent } from '@/lib/format'
import Filters from '@/components/Filters'
import LoadingState from '@/components/LoadingState'

export default function Familias() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [familias, setFamilias] = useState<any[]>([])

  useEffect(() => {
    const filters: Filters = {
      vendedores: searchParams.get('vendedores')?.split(',').filter(Boolean),
      tipo: searchParams.get('tipo') || undefined,
    }

    setLoading(true)
    getFamiliasResumo(filters)
      .then(data => {
        setFamilias(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [searchParams])

  const handleClick = (familia: string) => {
    navigate(`/detalhe?tipo=familia&nome=${encodeURIComponent(familia)}`)
  }

  if (loading) {
    return (
      <div>
        <Filters />
        <LoadingState message="A carregar famílias..." />
      </div>
    )
  }

  return (
    <div>
      <Filters />

      <div className="card">
        <h3 className="text-base font-semibold mb-4">📦 Famílias de Produto</h3>
        <div className="space-y-2">
          {familias.map((f) => {
            const crescClass = f.crescimento == null ? 'text-gray-400' : f.crescimento > 0 ? 'text-success' : 'text-danger'
            const bgClass = f.crescimento == null ? '' : f.crescimento > 0 ? 'border-l-success' : 'border-l-danger'
            return (
              <div
                key={f.familia}
                onClick={() => handleClick(f.familia)}
                className={`flex items-center justify-between p-3 bg-dark-bg rounded-lg hover:bg-dark-hover cursor-pointer transition-all border-l-4 ${bgClass || 'border-l-transparent'}`}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-200 text-sm">{f.familia}</div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                    <span>YTD: <span className="text-gray-300">{formatCurrency(f.acum_ac)}</span></span>
                    <span>·</span>
                    <span>Anterior: <span className="text-gray-300">{formatCurrency(f.acum_aa)}</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {f.crescimento != null && (
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${crescClass} ${f.crescimento > 0 ? 'bg-success/10' : 'bg-danger/10'}`}>
                      {formatPercent(f.crescimento)}
                    </div>
                  )}
                  {f.crescimento == null && (
                    <div className="px-3 py-1 rounded-full text-xs font-semibold text-gray-500 bg-gray-800">
                      Novo
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

