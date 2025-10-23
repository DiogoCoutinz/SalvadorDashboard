// Utility para exportar dados como CSV

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert('Sem dados para exportar')
    return
  }

  // Get headers from first row
  const headers = Object.keys(data[0])
  
  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const copyLinkWithFilters = () => {
  const url = window.location.href
  navigator.clipboard.writeText(url).then(() => {
    alert('Link copiado para clipboard! 📋')
  }).catch(err => {
    console.error('Erro ao copiar:', err)
    alert('Erro ao copiar link')
  })
}

