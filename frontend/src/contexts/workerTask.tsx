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

const WorkerTaskContext = createContext<WorkerTaskContextType | undefined>(
  undefined
)

export const useWorkerTaskContext = (): WorkerTaskContextType => {
  const context = useContext(WorkerTaskContext)
  if (!context) {
    throw new Error(
      'useWorkerTaskContext must be used within a WorkerTaskProvider'
    )
  }
  return context
}

export const WorkerTaskProvider = ({ children }: { children: ReactNode }) => {
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
    <WorkerTaskContext.Provider
      value={{
        sourceBinCode,
        destinationBinCode,
        setSourceBinCode,
        setDestinationBinCode,
        fetchBinCodes
      }}
    >
      {children}
    </WorkerTaskContext.Provider>
  )
}
