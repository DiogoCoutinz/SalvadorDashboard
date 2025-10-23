import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getEntidadeSeries } from '@/lib/queries'
import { type Filters } from '@/lib/supabase'
import { formatCurrency, formatMonthKey } from '@/lib/format'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import MonthTrend from '@/components/MonthTrend'
import LoadingState from '@/components/LoadingState'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { COLORS } from '@/lib/constants'

export default function DetalheEntidade() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const tipo = searchParams.get('tipo') as 'vendedor' | 'cliente' | 'familia'
  const nome = searchParams.get('nome') || ''

  const [loading, setLoading] = useState(true)
  const [series, setSeries] = useState<{ mes: string; valor: number }[]>([])
  const [breakdown, setBreakdown] = useState<{ name: string; valor: number }[]>([])

  useEffect(() => {
    if (!tipo || !nome || nome === 'null' || nome === 'undefined') {
      console.error('Invalid tipo or nome:', { tipo, nome })
      setLoading(false)
      return
    }

    const filters: Filters = {}

    console.log('Loading detail for:', { tipo, nome })
    setLoading(true)
    getEntidadeSeries(nome, tipo, filters)
      .then(data => {
        console.log('Detail data loaded:', data)
        setSeries(data.series)
        setBreakdown(data.breakdown)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading detail:', err)
        alert(`Erro ao carregar dados: ${err.message || 'Erro desconhecido'}`)
        setLoading(false)
      })
  }, [tipo, nome])

  const handleBack = () => {
    navigate(-1)
  }

  const breakdownLabel = tipo === 'vendedor' ? 'Top Famílias' : tipo === 'cliente' ? 'Famílias Compradas' : 'Top Clientes'

  if (loading) {
    return (
      <div>
        <button onClick={handleBack} className="btn mb-4 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <LoadingState message={`A carregar detalhe de ${tipo}...`} />
      </div>
    )
  }

  const hasNoData = series.length === 0 && breakdown.length === 0

  return (
    <div>
      <button onClick={handleBack} className="btn mb-4 flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-1">{nome}</h2>
        <p className="text-sm text-gray-400 capitalize">{tipo}</p>
      </div>

      {hasNoData && (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Sem Dados Disponíveis</h3>
            <p className="text-gray-400 text-center max-w-md">
              Não foram encontrados dados de vendas para <strong>{nome}</strong> no período disponível.
            </p>
            <p className="text-gray-500 text-sm mt-4">
              Verifica se existem vendas registadas para esta {tipo} na tabela <code className="bg-dark-hover px-2 py-1 rounded">vendas_mensais</code>
            </p>
          </div>
        </div>
      )}

      {!hasNoData && (
        <>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <MonthTrend data={series} title="📈 Série Mensal" />

        <div className="card">
          <h3 className="text-base font-semibold mb-4">🎯 {breakdownLabel}</h3>
          {breakdown.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              Sem dados disponíveis
            </div>
          ) : (
            <div className="overflow-x-auto">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={breakdown} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={120}
                    interval={0}
                    tick={{ fill: '#9ca3af', fontSize: 9 }}
                    stroke="#2a2a2a"
                    tickFormatter={(value) => value.length > 20 ? value.substring(0, 17) + '...' : value}
                  />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    stroke="#2a2a2a"
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #3a3a3a',
                      borderRadius: '8px',
                      color: '#e5e5e5',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Valor']}
                    labelStyle={{ color: '#e5e5e5', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="valor" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-base font-semibold mb-4">📅 Movimentos Mensais</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Mês</th>
                <th className="text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {series.map(s => (
                <tr key={s.mes}>
                  <td>{formatMonthKey(s.mes)}</td>
                  <td className="text-right">{formatCurrency(s.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  )
}

