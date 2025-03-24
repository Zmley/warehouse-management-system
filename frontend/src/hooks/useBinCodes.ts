// src/hooks/useBinCodes.ts
import { useState, useEffect } from 'react'

const useBinCodes = () => {
  const [sourceBin, setSourceBin] = useState('')
  const [destinationBin, setDestinationBin] = useState('')

  useEffect(() => {
    const storedSource = localStorage.getItem('sourceBinCode') || ''
    const storedDestination = localStorage.getItem('destinationBinCode') || ''
    setSourceBin(storedSource)
    setDestinationBin(storedDestination)
  }, [])

  const updateSourceBin = (code: string) => {
    localStorage.setItem('sourceBinCode', code)
    setSourceBin(code)
  }

  const updateDestinationBin = (code: string) => {
    localStorage.setItem('destinationBinCode', code)
    setDestinationBin(code)
  }

  const clearBinCodes = () => {
    localStorage.removeItem('sourceBinCode')
    localStorage.removeItem('destinationBinCode')
    setSourceBin('')
    setDestinationBin('')
  }

  return {
    sourceBin,
    destinationBin,
    updateSourceBin,
    updateDestinationBin,
    clearBinCodes
  }
}

export default useBinCodes
