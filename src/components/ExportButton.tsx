import { Download } from 'lucide-react'
import { exportToCSV } from '@/lib/export'

type Props = {
  data: any[]
  filename: string
}

export default function ExportButton({ data, filename }: Props) {
  const handleExport = () => {
    exportToCSV(data, filename)
  }

  return (
    <button
      onClick={handleExport}
      className="btn flex items-center gap-2 text-xs"
      title="Exportar para CSV"
    >
      <Download className="w-3 h-3" />
      <span className="hidden sm:inline">Exportar CSV</span>
    </button>
  )
}

