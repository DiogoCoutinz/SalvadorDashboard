import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency, formatMonthKey } from '@/lib/format'
import { COLORS } from '@/lib/constants'

type DataPoint = {
  mes: string
  valor: number
}

type Props = {
  data: DataPoint[]
  title?: string
}

export default function MonthTrend({ data, title = 'Evolução Mensal' }: Props) {
  const chartData = data.map(d => ({
    mes: formatMonthKey(d.mes),
    mesOriginal: d.mes,
    valor: d.valor,
  }))

  // Se só houver 1 ponto, mostrar como bar chart
  const hasOnlyOnePoint = chartData.length === 1
  const hasVeryFewPoints = chartData.length <= 3

  return (
    <div className="card">
      <h3 className="text-base font-semibold mb-4">
        {title}
        {hasOnlyOnePoint && (
          <span className="ml-2 text-xs text-warning font-normal">
            (Apenas 1 mês com dados - aguardando mais dados)
          </span>
        )}
      </h3>
      {chartData.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
          Sem dados disponíveis
        </div>
      ) : hasOnlyOnePoint ? (
        // Mostrar como card de resumo quando só há 1 ponto
        <div className="h-[300px] flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="text-5xl font-bold text-primary mb-2">
              {formatCurrency(chartData[0].valor)}
            </div>
            <div className="text-lg text-gray-400 mb-1">{chartData[0].mes}</div>
            <div className="text-sm text-gray-500">Total de vendas no mês</div>
          </div>
          <div className="mt-8 text-xs text-gray-500 text-center max-w-md">
            💡 Mais dados serão exibidos automaticamente conforme novos meses forem adicionados
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis
              dataKey="mes"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              stroke="#2a2a2a"
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              stroke="#2a2a2a"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                color: '#e5e5e5',
              }}
              formatter={(value: number) => formatCurrency(value)}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Legend
              wrapperStyle={{ color: '#e5e5e5', fontSize: '13px' }}
            />
            <Line
              type="monotone"
              dataKey="valor"
              name="Vendas"
              stroke={COLORS.primary}
              strokeWidth={3}
              dot={{ r: hasVeryFewPoints ? 6 : 4, fill: COLORS.primary }}
              activeDot={{ r: hasVeryFewPoints ? 8 : 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

