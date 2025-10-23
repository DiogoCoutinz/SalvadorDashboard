import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getTopClientes } from '@/lib/queries'
import { type Filters } from '@/lib/supabase'
import Filters from '@/components/Filters'
import DataTable from '@/components/DataTable'
import LoadingState from '@/components/LoadingState'

export default function Clientes() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<any[]>([])

  useEffect(() => {
    const filters: Filters = {
      vendedores: searchParams.get('vendedores')?.split(',').filter(Boolean),
      familias: searchParams.get('familias')?.split(',').filter(Boolean),
      tipo: searchParams.get('tipo') || undefined,
    }

    setLoading(true)
    getTopClientes(filters, 100)
      .then(data => {
        setClientes(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [searchParams])

  const handleRowClick = (cliente: string) => {
    navigate(`/detalhe?tipo=cliente&nome=${encodeURIComponent(cliente)}`)
  }

  if (loading) {
    return (
      <div>
        <Filters />
        <LoadingState message="A carregar clientes..." />
      </div>
    )
  }

  return (
    <div>
      <Filters />

      <DataTable
        data={clientes.map(c => ({
          ...c,
          _onClick: () => handleRowClick(c.cliente)
        }))}
        columns={[
          { key: 'cliente', label: 'Cliente' },
          { key: 'vendedor', label: 'Vendedor' },
          { key: 'acum_ac', label: 'Vendas YTD', format: 'currency' },
          { key: 'acum_aa', label: 'Ano Anterior', format: 'currency' },
          { key: 'crescimento', label: 'Crescimento (%)', format: 'percent' },
        ]}
        title="👥 Ranking Clientes"
        pageSize={50}
        exportFilename="clientes"
      />
    </div>
  )
}

