import { AlertCircle } from 'lucide-react'

type Props = {
  message?: string
}

export default function EmptyState({ message = 'Sem dados disponíveis' }: Props) {
  return (
    <div className="card flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="w-12 h-12 text-gray-600 mb-3" />
      <p className="text-gray-400">{message}</p>
    </div>
  )
}

