import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react'
import apiClient from '../api/axiosClient.ts'

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
      const response = await apiClient.post('/cart/carCode')
      const { binCode } = response.data

      setSourceBinCode(binCode)
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
