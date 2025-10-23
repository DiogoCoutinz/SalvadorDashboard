// Replica a lógica do tratar_vendas.py em TypeScript
import * as XLSX from 'xlsx'

export interface VendasRow {
  Vendedor: string
  No_cliente: string
  Cliente: string
  Familia: string
  Tipo: string
  [key: string]: string | number
}

export interface VendaResumoProcessed {
  Vendedor: string
  No_cliente: string
  Cliente: string
  Familia: string
  Tipo: string
  Acum_ac: number
  Acum_aa: number
  Per_acum: number
  Crescimento: number | null
}

export interface VendaMensalProcessed {
  Vendedor: string
  No_cliente: string
  Cliente: string
  Familia: string
  Tipo: string
  Mes: string
  Valor: number
}

/**
 * Limpa caracteres especiais em strings (replica Python exatamente)
 */
const cleanString = (str: string): string => {
  return str
    .trim()
    .replace(/¢/g, 'o')
    .replace(/€/g, 'e') 
    .replace(/å/g, 'a')
    .replace(/\ufffd/g, 'i')  // Character replacement como no Python
}

/**
 * Converte valor português para float (replica Python exatamente)
 */
const parsePortugueseNumber = (value: string | number): number => {
  if (typeof value === 'number') return value
  if (!value || value === '' || value === null || value === undefined) return 0
  
  const str = String(value)
    .trim()
    .replace(/\./g, '')      // Remove pontos de milhar  
    .replace(/,/g, '.')      // Troca vírgula por ponto decimal
  
  // Se ficou string vazia após limpeza, retorna 0 (como Python .replace("", "0"))
  if (str === '') return 0
  
  const parsed = parseFloat(str)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Processa ficheiro Excel/CSV e retorna dados tratados
 */
export const processVendasFile = async (file: File): Promise<{
  resumo: VendaResumoProcessed[]
  mensal: VendaMensalProcessed[]
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        let rawData: any[] = []
        
        // Se for CSV, lê como texto para preservar formato original
        if (file.name.toLowerCase().endsWith('.csv')) {
          const text = new TextDecoder('latin1').decode(e.target?.result as ArrayBuffer)
          const lines = text.trim().split('\n')
          
          // Parse CSV respeitando campos entre aspas
          const parseCSVLine = (line: string): string[] => {
            const result: string[] = []
            let current = ''
            let inQuotes = false
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i]
              if (char === '"') {
                inQuotes = !inQuotes
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim())
                current = ''
              } else {
                current += char
              }
            }
            result.push(current.trim())
            return result
          }
          
          const headers = parseCSVLine(lines[0])
          
          rawData = lines.slice(1).map(line => {
            const values = parseCSVLine(line)
            const obj: any = {}
            headers.forEach((h, i) => {
              obj[h] = values[i] || ''
            })
            return obj
          })
          
        } else {
          // Para Excel, usa XLSX mas força raw
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          
          rawData = XLSX.utils.sheet_to_json(sheet, { 
            defval: '',
            raw: false  // Mantém como texto
          })
        }
        
        
        // 1️⃣ Limpa strings e processa colunas (replica Python)
        const allColumns = Object.keys(rawData[0])
        const numericColumns = allColumns.slice(5) // A partir da 6ª coluna (índice 5) como no Python
        
        const cleanedData: VendasRow[] = rawData.map(row => {
          const cleaned: any = {}
          Object.keys(row).forEach(key => {
            const cleanKey = cleanString(key.trim())
            const value = row[key]
            
            // Se é coluna numérica (a partir da 5ª), converte para número português
            if (numericColumns.includes(key)) {
              cleaned[cleanKey] = parsePortugueseNumber(value)
            } else {
              // Se é string, limpa caracteres
              cleaned[cleanKey] = typeof value === 'string' ? cleanString(value) : value
            }
          })
          return cleaned
        })
        
        // Identifica colunas mensais (_ac mas não acum_ac)
        const firstRow = cleanedData[0]
        const allKeys = Object.keys(firstRow)
        const mensalCols = allKeys.filter(k => 
          k.toLowerCase().includes('_ac') && 
          !k.toLowerCase().includes('acum')
        )
        
        
        // 2️⃣ Processa cada linha
        const resumo: VendaResumoProcessed[] = []
        const mensal: VendaMensalProcessed[] = []
        
        cleanedData.forEach((row, idx) => {
          try {
            // Extrai campos base
            const baseFields = {
              Vendedor: String(row.Vendedor || ''),
              No_cliente: String(row.No_cliente || row.No_Cliente || row['Nº cliente'] || ''),
              Cliente: String(row.Cliente || ''),
              Familia: String(row.Familia || row.Família || ''),
              Tipo: String(row.Tipo || '')
            }
            
            // Extrai acumulados (já convertidos na limpeza)
            const Acum_ac = Number(row.Acum_ac || row.acum_ac || 0)
            const Acum_aa = Number(row.Acum_aa || row.acum_aa || 0) 
            const Per_acum = Number(row.Per_acum || row.per_acum || 0)
            
            // Calcula crescimento
            const Crescimento = Acum_aa > 0 
              ? ((Acum_ac - Acum_aa) / Acum_aa) * 100 
              : null
            
            // Adiciona ao resumo
            resumo.push({
              ...baseFields,
              Acum_ac,
              Acum_aa,
              Per_acum,
              Crescimento
            })
            
            // 3️⃣ Cria versão "melt" para vendas mensais
            mensalCols.forEach(col => {
              const mesName = col.replace(/_ac$/i, '').trim()
              const mesCapitalized = mesName.charAt(0).toUpperCase() + mesName.slice(1).toLowerCase()
              const valor = Number(row[col] || 0)  // Já convertido na limpeza
              
              mensal.push({
                ...baseFields,
                Mes: mesCapitalized,
                Valor: valor
              })
            })
          } catch (err) {
            console.warn(`⚠️ Erro ao processar linha ${idx}:`, err)
          }
        })
        
        
        resolve({ resumo, mensal })
      } catch (error) {
        console.error('❌ Erro ao processar ficheiro:', error)
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Erro ao ler ficheiro'))
    reader.readAsArrayBuffer(file)
  })
}

