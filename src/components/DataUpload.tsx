import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Upload, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react'
import { processVendasFile } from '@/lib/dataProcessor'
import { deleteAllData, insertNewData } from '@/lib/queries'

export default function DataUpload() {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setStatus('idle')
      setMessage('')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage('Por favor seleciona um ficheiro')
      setStatus('error')
      return
    }

    try {
      setStatus('processing')
      setProgress('📊 A processar ficheiro...')
      
      // 1️⃣ Processa o ficheiro (replica Python)
      const { resumo, mensal } = await processVendasFile(file)
      
      setProgress('🗑️ A apagar dados antigos...')
      
      // 2️⃣ Apaga dados antigos
      await deleteAllData()
      
      setProgress('📤 A inserir novos dados...')
      
      // 3️⃣ Insere novos dados
      await insertNewData(resumo, mensal)
      
      setStatus('success')
      setMessage(`✅ Dados atualizados com sucesso! ${resumo.length} resumos + ${mensal.length} mensais`)
      setProgress('')
      setFile(null)
      
      // Recarrega página após 2s para mostrar novos dados
      setTimeout(() => {
        window.location.reload()
      }, 2000)
      
    } catch (error: any) {
      console.error('❌ Erro no upload:', error)
      setStatus('error')
      setMessage(`Erro: ${error.message}`)
      setProgress('')
    }
  }

  const handleCancel = () => {
    setIsOpen(false)
    setFile(null)
    setStatus('idle')
    setMessage('')
    setProgress('')
  }

  // Bloquear scroll quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const modalContent = isOpen ? (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-[#1a1a1a] border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Upload className="w-6 h-6 text-blue-500" />
              Atualizar Dados de Vendas
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-500 mb-1">⚠️ Atenção!</p>
                  <p className="text-gray-300">
                    Esta ação vai <strong>apagar TODOS os dados</strong> das tabelas <code className="bg-dark-hover px-1 rounded">vendas_resumo</code> e <code className="bg-dark-hover px-1 rounded">vendas_mensais</code> e substituí-los pelos novos dados do ficheiro.
                  </p>
                  <p className="text-gray-400 mt-2 text-xs">
                    O ficheiro será processado automaticamente (limpeza de caracteres, conversão de números PT, cálculo de crescimento, etc.)
                  </p>
                </div>
              </div>
            </div>

            {/* Input de ficheiro */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Seleciona o ficheiro Excel/CSV
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={status === 'processing'}
                className="block w-full text-sm text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700
                  file:cursor-pointer
                  cursor-pointer
                  border border-dark-border rounded-lg
                  bg-dark-hover p-2
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {file && (
                <p className="text-sm text-gray-400 mt-2">
                  📄 Ficheiro selecionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            {/* Progress */}
            {progress && (
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{progress}</span>
                </div>
              </div>
            )}

            {/* Status Message */}
            {message && (
              <div className={`mb-4 p-3 rounded-lg border ${
                status === 'success' 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                <div className="flex items-start gap-2">
                  {status === 'success' ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="text-sm whitespace-pre-line">{message}</span>
                </div>
              </div>
            )}

          {/* Botões */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              disabled={status === 'processing'}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {status === 'success' ? 'Fechar' : 'Cancelar'}
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || status === 'processing' || status === 'success'}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
              {status === 'processing' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  A processar...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Atualizar Dados
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      {/* Botão para abrir modal */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        title="Atualizar dados do Supabase"
      >
        <Upload className="w-4 h-4" />
        <span className="hidden sm:inline">Atualizar Dados</span>
      </button>

      {/* Modal usando Portal para renderizar fora da hierarquia */}
      {typeof document !== 'undefined' && createPortal(
        modalContent,
        document.body
      )}
    </>
  )
}

