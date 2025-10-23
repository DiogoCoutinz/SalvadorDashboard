import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getFilterOptions } from '@/lib/queries'
import { Filter, X } from 'lucide-react'

export default function Filters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [options, setOptions] = useState<{
    vendedores: string[]
    familias: string[]
    tipos: string[]
  }>({ vendedores: [], familias: [], tipos: [] })

  useEffect(() => {
    getFilterOptions().then(setOptions)
  }, [])

  const selectedVendedores = searchParams.get('vendedores')?.split(',').filter(Boolean) || []
  const selectedFamilias = searchParams.get('familias')?.split(',').filter(Boolean) || []
  const selectedTipo = searchParams.get('tipo') || ''

  const updateFilter = (key: string, value: string | string[]) => {
    const params = new URLSearchParams(searchParams)
    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(','))
      } else {
        params.delete(key)
      }
    } else {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    setSearchParams(params)
  }

  const toggleVendedor = (vendedor: string) => {
    const current = selectedVendedores
    const updated = current.includes(vendedor)
      ? current.filter(v => v !== vendedor)
      : [...current, vendedor]
    updateFilter('vendedores', updated)
  }

  const toggleFamilia = (familia: string) => {
    const current = selectedFamilias
    const updated = current.includes(familia)
      ? current.filter(f => f !== familia)
      : [...current, familia]
    updateFilter('familias', updated)
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams())
  }

  const hasActiveFilters = selectedVendedores.length > 0 || selectedFamilias.length > 0 || selectedTipo

  return (
    <div className="card mb-4 sm:mb-6">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Filtros</span>
          {hasActiveFilters && (
            <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
              {selectedVendedores.length + selectedFamilias.length + (selectedTipo ? 1 : 0)}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Limpar
          </button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3 border-t border-gray-800">
          {/* Vendedores */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Vendedores</label>
            <div className="max-h-40 overflow-y-auto space-y-1 bg-dark-bg p-2 rounded">
              {options.vendedores.map((v) => (
                <label key={v} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-dark-hover p-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedVendedores.includes(v)}
                    onChange={() => toggleVendedor(v)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-300">{v}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Famílias */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Famílias</label>
            <div className="max-h-40 overflow-y-auto space-y-1 bg-dark-bg p-2 rounded">
              {options.familias.map((f) => (
                <label key={f} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-dark-hover p-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedFamilias.includes(f)}
                    onChange={() => toggleFamilia(f)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-300">{f}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Tipo</label>
            <select
              value={selectedTipo}
              onChange={(e) => updateFilter('tipo', e.target.value)}
              className="w-full"
            >
              <option value="">Todos</option>
              {options.tipos.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

