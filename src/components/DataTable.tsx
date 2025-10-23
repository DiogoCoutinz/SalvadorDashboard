import { useState, useMemo } from 'react'
import { formatCurrency, formatPercent } from '@/lib/format'
import { ChevronUp, ChevronDown } from 'lucide-react'
import ExportButton from './ExportButton'

type Column = {
  key: string
  label: string
  format?: 'currency' | 'percent' | 'number'
  sortable?: boolean
}

type Props = {
  data: any[]
  columns: Column[]
  title?: string
  pageSize?: number
  exportFilename?: string
}

export default function DataTable({ data, columns, title, pageSize = 20, exportFilename }: Props) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return data
    const lower = search.toLowerCase()
    return data.filter(row => {
      return Object.values(row).some(val =>
        String(val).toLowerCase().includes(lower)
      )
    })
  }, [data, search])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paginatedData = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const formatValue = (value: any, format?: string) => {
    if (value == null) return '—'
    if (format === 'currency') return formatCurrency(value)
    if (format === 'percent') {
      const pct = formatPercent(value)
      // Add color based on value
      if (typeof value === 'number') {
        if (value > 0) return <span className="text-success font-medium">{pct}</span>
        if (value < 0) return <span className="text-danger font-medium">{pct}</span>
      }
      return pct
    }
    if (format === 'number') return value.toLocaleString('pt-PT')
    return String(value)
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        {title && <h3 className="text-base font-semibold">{title}</h3>}
        {exportFilename && <ExportButton data={filtered} filename={exportFilename} />}
      </div>
      
      <div className="mb-3">
        <input
          type="text"
          placeholder="Pesquisar..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setCurrentPage(1)
          }}
          className="w-full sm:w-64"
        />
      </div>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={col.sortable !== false ? 'cursor-pointer hover:bg-gray-800' : ''}
                >
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span>{col.label}</span>
                    {sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => {
                  const value = row[col.key]
                  const formatted = formatValue(value, col.format)
                  const isNumeric = col.format === 'number' || col.format === 'currency' || col.format === 'percent'
                  const isLongText = typeof value === 'string' && value.length > 50
                  
                  return (
                    <td 
                      key={col.key} 
                      className={`${isNumeric ? 'text-right' : ''} ${isLongText ? 'max-w-md' : ''}`}
                      title={isLongText ? value : undefined}
                    >
                      {isLongText ? (
                        <span className="truncate block">{formatted}</span>
                      ) : (
                        formatted
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="text-gray-400">
            {sorted.length} resultados
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn text-xs px-3 py-1"
            >
              Anterior
            </button>
            <span className="text-gray-400">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn text-xs px-3 py-1"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

