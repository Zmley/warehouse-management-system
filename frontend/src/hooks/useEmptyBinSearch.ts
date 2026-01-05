import { useEffect, useRef, useState, useCallback } from 'react'

type EmptyBin = { binID: string; binCode: string }

type UseEmptyBinSearchArgs = {
  emptyBins?: EmptyBin[]
  isLoading: boolean
  fetchEmptyBins: (args: { q: string; limit: number }) => void
  limit?: number
  cacheTtlMs?: number
}

let emptyBinCache: EmptyBin[] = []
let emptyBinCacheAt = 0

export const useEmptyBinSearch = ({
  emptyBins,
  isLoading,
  fetchEmptyBins,
  limit = 50,
  cacheTtlMs = 60_000
}: UseEmptyBinSearchArgs) => {
  const [q, setQ] = useState('')
  const debounceRef = useRef<number | undefined>(undefined)
  const spinnerRef = useRef<number | undefined>(undefined)
  const [showSpinner, setShowSpinner] = useState(false)

  const displayBins: EmptyBin[] =
    emptyBins && emptyBins.length ? emptyBins : emptyBinCache

  const refresh = useCallback(() => {
    fetchEmptyBins({ q, limit })
  }, [fetchEmptyBins, limit, q])

  useEffect(() => {
    const now = Date.now()
    const hasFreshCache =
      emptyBinCache.length > 0 && now - emptyBinCacheAt < cacheTtlMs

    window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      if (hasFreshCache && q.trim() === '') {
        fetchEmptyBins({ q, limit })
      } else {
        fetchEmptyBins({ q, limit })
      }
    }, 300)

    return () => window.clearTimeout(debounceRef.current)
  }, [q, fetchEmptyBins, limit, cacheTtlMs])

  useEffect(() => {
    if (emptyBins && emptyBins.length) {
      emptyBinCache = emptyBins
      emptyBinCacheAt = Date.now()
    }
  }, [emptyBins])

  useEffect(() => {
    if (displayBins.length > 0 || !isLoading) {
      window.clearTimeout(spinnerRef.current)
      setShowSpinner(false)
      return
    }
    window.clearTimeout(spinnerRef.current)
    spinnerRef.current = window.setTimeout(() => setShowSpinner(true), 200)
    return () => window.clearTimeout(spinnerRef.current)
  }, [isLoading, displayBins.length])

  return {
    q,
    setQ,
    displayBins,
    showSpinner,
    refresh
  }
}
