import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/lib/format'
import { COLORS } from '@/lib/constants'

type DataPoint = {
  name: string
  acum_ac: number
  acum_aa: number
}

type Props = {
  data: DataPoint[]
  title?: string
  nameKey?: string
}

export default function BarCompare({ data, title = 'Comparação', nameKey = 'name' }: Props) {
  const chartData = data.map(d => {
    const fullName = String(d[nameKey as keyof DataPoint] || d.name)
    return {
      name: fullName,
      shortName: fullName.length > 15 ? fullName.substring(0, 13) + '...' : fullName,
      'Ano Atual': d.acum_ac,
      'Ano Anterior': d.acum_aa,
    }
  })

  if (data.length === 0) {
    return (
      <div className="card">
        <h3 className="text-base font-semibold mb-4">{title}</h3>
        <div className="h-[350px] flex items-center justify-center text-gray-400 text-sm">
          Sem dados disponíveis
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-base font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="shortName"
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            stroke="#2a2a2a"
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 11 }}
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
            labelFormatter={(label) => {
              const item = chartData.find(d => d.shortName === label)
              return item?.name || label
            }}
            labelStyle={{ color: '#e5e5e5', fontWeight: 'bold', marginBottom: '4px' }}
          />
          <Legend wrapperStyle={{ color: '#e5e5e5', fontSize: '13px' }} />
          <Bar dataKey="Ano Atual" fill={COLORS.success} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Ano Anterior" fill={COLORS.warning} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

