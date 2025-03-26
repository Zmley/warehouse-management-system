import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react'

import { getMyCartCode } from '../api/cartApi'

interface WorkerTaskContextType {
  sourceBinCode: string | null
  destinationBinCode: string | null
  setSourceBinCode: (code: string | null) => void
  setDestinationBinCode: (code: string | null) => void
  fetchBinCodes: () => Promise<void>
}

const binCodeContext = createContext<WorkerTaskContextType | undefined>(
  undefined
)

export const useBinCodeContext = (): WorkerTaskContextType => {
  const context = useContext(binCodeContext)
  if (!context) {
    throw new Error(
      'useWorkerTaskContext must be used within a WorkerTaskProvider'
    )
  }
  return context
}

export const BinCodeProvider = ({ children }: { children: ReactNode }) => {
  const [sourceBinCode, setSourceBinCode] = useState<string | null>(null)
  const [destinationBinCode, setDestinationBinCode] = useState<string | null>(
    null
  )

  const fetchBinCodes = async () => {
    try {
      const { binCode } = await getMyCartCode()
      setSourceBinCode(binCode || null)
    } catch (err) {
      console.error('❌ Failed to fetch bin codes', err)
    }
  }

  useEffect(() => {
    fetchBinCodes()
  }, [])

  return (
    <binCodeContext.Provider
      value={{
        sourceBinCode,
        destinationBinCode,
        setSourceBinCode,
        setDestinationBinCode,
        fetchBinCodes
      }}
    >
      {children}
    </binCodeContext.Provider>
  )
}
