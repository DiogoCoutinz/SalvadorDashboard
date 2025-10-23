import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getResumo } from '@/lib/queries'
import { getMensalOptimized, getTopVendedoresOptimized, getTopClientesOptimized, getHeatmapFamiliaMesOptimized } from '@/lib/queriesOptimized'
import { getClientesUnicos, getTicketMedio, getConcentracaoVendas } from '@/lib/kpisAdicionais'
import { type Filters as FilterType } from '@/lib/supabase'
import KpiCard from '@/components/KpiCard'
import MonthTrend from '@/components/MonthTrend'
import BarCompare from '@/components/BarCompare'
import HeatmapTable from '@/components/HeatmapTable'
import DataTable from '@/components/DataTable'
import Filters from '@/components/Filters'
import LoadingState from '@/components/LoadingState'

export default function Dashboard() {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [resumo, setResumo] = useState({ totalAcumAc: 0, totalAcumAa: 0, crescimento: null as number | null })
  const [mensal, setMensal] = useState<{ mes: string; valor: number }[]>([])
  const [topVendedores, setTopVendedores] = useState<any[]>([])
  const [topClientes, setTopClientes] = useState<any[]>([])
  const [heatmap, setHeatmap] = useState<Record<string, Record<string, number>>>({})
  const [kpisAdicionais, setKpisAdicionais] = useState({
    clientesUnicos: { clientesAtivosAc: 0, clientesAtivosAa: 0, crescimentoClientes: null as number | null },
    ticketMedio: { ticketMedioAc: 0, ticketMedioAa: 0, crescimentoTicket: null as number | null },
    concentracao: { concentracaoTop20: 0, totalClientes: 0 }
  })

  useEffect(() => {
    const filters: FilterType = {
      vendedores: searchParams.get('vendedores')?.split(',').filter(Boolean),
      familias: searchParams.get('familias')?.split(',').filter(Boolean),
      tipo: searchParams.get('tipo') || undefined,
    }


    setLoading(true)
    Promise.all([
      getResumo(filters),
      getMensalOptimized(filters),
      getTopVendedoresOptimized(filters, 10),
      getTopClientesOptimized(filters, 10),
      getHeatmapFamiliaMesOptimized(filters),
      getClientesUnicos(filters),
      getTicketMedio(filters),
      getConcentracaoVendas(filters),
    ]).then(([res, men, vend, cli, heat, clientes, ticket, concentracao]) => {
      setResumo(res)
      setMensal(men)
      setTopVendedores(vend)
      setTopClientes(cli)
      setHeatmap(heat)
      
      // Calculate crescimento ticket médio
      const crescimentoTicket = ticket.ticketMedioAa > 0 
        ? ((ticket.ticketMedioAc - ticket.ticketMedioAa) / ticket.ticketMedioAa) * 100 
        : null
      
      setKpisAdicionais({
        clientesUnicos: clientes,
        ticketMedio: { 
          ticketMedioAc: ticket.ticketMedioAc,
          ticketMedioAa: ticket.ticketMedioAa,
          crescimentoTicket
        },
        concentracao: concentracao
      })
      setLoading(false)
    }).catch(err => {
      console.error('Dashboard error:', err)
      alert(`Erro ao carregar dashboard: ${err.message}`)
      setLoading(false)
    })
  }, [searchParams])

  if (loading) {
    return (
      <div>
        <Filters />
        <LoadingState message="A carregar dashboard..." />
      </div>
    )
  }

  return (
    <div>
      <Filters />

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <KpiCard label="Vendas YTD" value={resumo.totalAcumAc} previous={resumo.totalAcumAa} format="currency" />
        <KpiCard
          label="Crescimento (%)"
          value={resumo.crescimento || 0}
          format="percent"
          invertDelta={false}
        />
        <KpiCard 
          label="Clientes Ativos"
          value={kpisAdicionais.clientesUnicos.clientesAtivosAc}
          previous={kpisAdicionais.clientesUnicos.clientesAtivosAa}
          format="number"
        />
      </div>

      {/* KPIs Secundários */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <KpiCard
          label="Ticket Médio"
          value={kpisAdicionais.ticketMedio.ticketMedioAc}
          previous={kpisAdicionais.ticketMedio.ticketMedioAa}
          format="currency"
        />
        <KpiCard
          label="Concentração Top 20%"
          value={kpisAdicionais.concentracao.concentracaoTop20}
          format="percent"
        />
        <KpiCard
          label="Total Clientes"
          value={kpisAdicionais.concentracao.totalClientes}
          format="number"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <MonthTrend data={mensal} title="📈 Evolução Mensal de Vendas" />
        <BarCompare
          data={topVendedores.map(v => ({ name: v.vendedor, acum_ac: v.acum_ac, acum_aa: v.acum_aa }))}
          title="🏆 Top 10 Vendedores (YTD vs Anterior)"
        />
      </div>

      {/* Heatmap */}
      <div className="mb-6">
        <HeatmapTable data={heatmap} title="🔥 Heatmap Família × Mês" />
      </div>

      {/* Table */}
      <DataTable
        data={topClientes}
        columns={[
          { key: 'cliente', label: 'Cliente' },
          { key: 'vendedor', label: 'Vendedor' },
          { key: 'acum_ac', label: 'Vendas YTD', format: 'currency' },
          { key: 'acum_aa', label: 'Ano Anterior', format: 'currency' },
          { key: 'crescimento', label: 'Crescimento (%)', format: 'percent' },
        ]}
        title="📊 Top 10 Clientes"
        exportFilename="top_clientes"
      />
    </div>
  )
}

