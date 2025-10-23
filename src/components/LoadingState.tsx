import { Loader2 } from 'lucide-react'

type Props = {
  message?: string
}

export default function LoadingState({ message = 'A carregar dados...' }: Props) {
  return (
    <div className="card flex flex-col items-center justify-center py-16">
      <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  )
}

