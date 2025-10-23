import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getTopVendedores } from '@/lib/queries'
import { type Filters } from '@/lib/supabase'
import Filters from '@/components/Filters'
import DataTable from '@/components/DataTable'
import LoadingState from '@/components/LoadingState'

export default function Vendedores() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [vendedores, setVendedores] = useState<any[]>([])

  useEffect(() => {
    const filters: Filters = {
      familias: searchParams.get('familias')?.split(',').filter(Boolean),
      tipo: searchParams.get('tipo') || undefined,
    }

    setLoading(true)
    getTopVendedores(filters, 100)
      .then(data => {
        setVendedores(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [searchParams])

  const handleRowClick = (vendedor: string) => {
    navigate(`/detalhe?tipo=vendedor&nome=${encodeURIComponent(vendedor)}`)
  }

  if (loading) {
    return (
      <div>
        <Filters />
        <LoadingState message="A carregar vendedores..." />
      </div>
    )
  }

  return (
    <div>
      <Filters />

      <DataTable
        data={vendedores.map(v => ({
          ...v,
          _onClick: () => handleRowClick(v.vendedor)
        }))}
        columns={[
          { key: 'vendedor', label: 'Vendedor' },
          { key: 'acum_ac', label: 'Vendas YTD', format: 'currency' },
          { key: 'acum_aa', label: 'Ano Anterior', format: 'currency' },
          { key: 'crescimento', label: 'Crescimento (%)', format: 'percent' },
        ]}
        title="🧑‍💼 Ranking Vendedores"
        pageSize={50}
        exportFilename="vendedores"
      />
    </div>
  )
}

