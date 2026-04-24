import { useState, useEffect, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export function useFunds(period = '1D') {
  const [funds,     setFunds    ] = useState([])
  const [usdJpy,    setUsdJpy   ] = useState(151.5)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError    ] = useState(null)

  const fetchFunds = useCallback(async (targetPeriod) => {
    const p = targetPeriod || period
    setIsLoading(true)
    setError(null)
    try {
      const url = `${API_BASE}/api/funds?period=${encodeURIComponent(p)}`
      console.log('[useFunds] Fetching:', url)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`APIエラー: ${res.status}`)
      const data = await res.json()
      setFunds(data.funds || [])
      setUsdJpy(data.usd_jpy || 151.5)
      setUpdatedAt(data.updated_at ? new Date(data.updated_at) : new Date())
    } catch (e) {
      console.error('[useFunds] Error:', e.message)
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [period])

  // period が変わるたびに自動で再取得
  useEffect(() => {
    fetchFunds(period)
  }, [period]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    funds,
    usdJpy,
    updatedAt,
    isLoading,
    error,
    refetch: () => fetchFunds(period),
  }
}
