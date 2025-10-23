import { Share2, Check } from 'lucide-react'
import { useState } from 'react'
import { copyLinkWithFilters } from '@/lib/export'

export default function ShareButton() {
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    copyLinkWithFilters()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleShare}
      className="btn flex items-center gap-2 text-xs"
      title="Copiar link com filtros"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3" />
          <span className="hidden sm:inline">Copiado!</span>
        </>
      ) : (
        <>
          <Share2 className="w-3 h-3" />
          <span className="hidden sm:inline">Partilhar</span>
        </>
      )}
    </button>
  )
}

