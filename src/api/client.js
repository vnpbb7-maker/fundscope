// API base URL: Railway本番 or ローカル開発
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Railway バックエンドから全ファンドデータを取得する
 * @param {string} period - 1D / 1W / 1M / 3M / 6M / YTD / 1Y
 * @returns {Promise<{funds: Array, usd_jpy: number, updated_at: string}>}
 */
export async function fetchFunds(period = '1D') {
  const res = await fetch(`${API_BASE}/api/funds?period=${period}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

/**
 * USD/JPY レートを取得する
 * @returns {Promise<{usd_jpy: number, updated_at: string}>}
 */
export async function fetchRate() {
  const res = await fetch(`${API_BASE}/api/rate`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

/**
 * 単一ファンドの詳細を取得する
 * @param {number} id
 * @param {string} period
 */
export async function fetchFundDetail(id, period = '1D') {
  const res = await fetch(`${API_BASE}/api/funds/${id}?period=${period}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
