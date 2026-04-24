import { useState, useEffect } from 'react'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

// ── 今日の日付取得 ──────────────────────────────────────────────
function getToday() {
  return new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
  })
}

// ── Groqでニュース分析 ──────────────────────────────────────────
async function analyzeNewsWithGroq() {
  const today = new Date().toISOString().split('T')[0]

  const prompt = `あなたは日本のETF・インデックスファンド専門の市場アナリストです。
今日（${today}）の主要な市場ニュースを踏まえて、以下のフォーマットで
必ずJSON形式のみで回答してください（マークダウン・コードブロック不要）。

以下のユーザーの保有銘柄に特に注目して分析してください:
- ニッセイTOPIX（日本株）
- eMAXIS Slim 全世界株式（全世界）
- SBI V S&P500（米国株）
- ニッセイ外国株式（先進国）
- ETF 412A（日本株・東証）

{
  "date": "${today}",
  "market_summary": "今日の市場全体を3行以内で要約",
  "news": [
    {
      "title": "ニュースタイトル（20文字以内）",
      "summary": "ニュース内容を1〜2文で説明",
      "impact": "positive" または "negative" または "neutral",
      "affected_funds": [
        {
          "name": "影響を受けるETF・ファンド名（略称）",
          "ticker": "ティッカーまたはコード",
          "reason": "このファンドへの影響を1文で説明",
          "impact_level": 1〜3の数字（3が最も影響大）
        }
      ]
    }
  ]
}

ニュースは本日の実際の市場動向に基づいて3〜5件生成してください。
必ず上記JSONのみを返し、それ以外のテキストは一切含めないでください。`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
    })
  })

  if (!res.ok) throw new Error(`Groq APIエラー: ${res.status}`)
  const data = await res.json()
  const text = data.choices[0].message.content
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim()
  return JSON.parse(text)
}

// ── impact スタイル定義 ────────────────────────────────────────
const IMPACT_STYLE = {
  positive: { bg: '#E1F5EE', color: '#0F6E56', label: '↑ 上昇要因', border: '#9FE1CB' },
  negative: { bg: '#FAECE7', color: '#993C1D', label: '↓ 下落要因', border: '#F0B8A0' },
  neutral:  { bg: '#F1EFE8', color: '#444441', label: '→ 中立',     border: '#D8D4C8' },
}

const IMPACT_DOT = {
  1: { size: 6,  opacity: 0.5 },
  2: { size: 8,  opacity: 0.75 },
  3: { size: 10, opacity: 1.0 },
}

// ── スケルトン ─────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ padding: '16px 18px' }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <div style={{ height: 14, background: '#F1EFE8', borderRadius: 4, width: '60%', marginBottom: 8,
            animation: 'pulse 1.5s ease-in-out infinite' }}/>
          <div style={{ height: 11, background: '#F1EFE8', borderRadius: 4, width: '90%', marginBottom: 4,
            animation: 'pulse 1.5s ease-in-out infinite' }}/>
          <div style={{ height: 11, background: '#F1EFE8', borderRadius: 4, width: '75%',
            animation: 'pulse 1.5s ease-in-out infinite' }}/>
        </div>
      ))}
    </div>
  )
}

// ── NewsFeed コンポーネント ─────────────────────────────────────
export default function NewsFeed({ compact = false }) {
  const [newsData,    setNewsData   ] = useState(null)
  const [isLoading,   setIsLoading  ] = useState(false)
  const [error,       setError      ] = useState(null)
  const [expanded,    setExpanded   ] = useState(null)
  const [lastFetched, setLastFetched] = useState(null)

  async function fetchNews() {
    if (!GROQ_API_KEY) {
      setError('VITE_GROQ_API_KEY が未設定です')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const data = await analyzeNewsWithGroq()
      setNewsData(data)
      setLastFetched(new Date())
      sessionStorage.setItem('fundscope_news', JSON.stringify({
        data, fetchedAt: Date.now()
      }))
    } catch(e) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 初期ロード（30分 sessionStorage キャッシュ）
  useEffect(() => {
    const cached = sessionStorage.getItem('fundscope_news')
    if (cached) {
      try {
        const { data, fetchedAt } = JSON.parse(cached)
        if (Date.now() - fetchedAt < 30 * 60 * 1000) {
          setNewsData(data)
          setLastFetched(new Date(fetchedAt))
          return
        }
      } catch {}
    }
    fetchNews()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{
      background: '#FFFFFF',
      border: '0.5px solid rgba(26,26,46,0.1)',
      borderRadius: 14,
      overflow: 'hidden',
      fontFamily: "'Syne', sans-serif",
      boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
    }}>

      {/* ── ヘッダー ─────────────────────────────────── */}
      <div style={{
        padding: '14px 18px 10px',
        borderBottom: '0.5px solid rgba(26,26,46,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#FAFAF8',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📰</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>
              本日のマーケットニュース
            </div>
            <div style={{ fontSize: 10, color: '#6B6B7A', fontFamily: "'DM Mono',monospace", marginTop: 1 }}>
              {getToday()}
              {lastFetched && ` · 取得: ${lastFetched.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`}
            </div>
          </div>
        </div>
        <button
          onClick={fetchNews}
          disabled={isLoading}
          style={{
            fontSize: 11, padding: '4px 12px', borderRadius: 20, border: 'none',
            background: isLoading ? '#D3D1C7' : '#1A1A2E',
            color: isLoading ? '#888' : '#FFFFFF',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontFamily: "'Syne',sans-serif", fontWeight: 600,
            transition: 'all .15s',
          }}
        >
          {isLoading ? '取得中...' : '↻ 更新'}
        </button>
      </div>

      {/* ── マーケットサマリー ──────────────────────── */}
      {newsData?.market_summary && (
        <div style={{
          padding: '10px 18px',
          background: '#FDF8ED',
          borderBottom: '0.5px solid rgba(201,168,76,0.25)',
          fontSize: 12, color: '#4A3A10', lineHeight: 1.7,
        }}>
          <span style={{ fontWeight: 700, marginRight: 6 }}>📊 市場概況</span>
          {newsData.market_summary}
        </div>
      )}

      {/* ── エラー表示 ───────────────────────────────── */}
      {error && (
        <div style={{
          padding: '12px 18px', background: '#FAECE7', color: '#712B13',
          fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>⚠ {error}</span>
          <button onClick={fetchNews} style={{
            fontSize: 11, color: '#993C1D', background: 'transparent',
            border: '0.5px solid #993C1D', borderRadius: 6, padding: '2px 8px', cursor: 'pointer',
          }}>再試行</button>
        </div>
      )}

      {/* ── ローディング スケルトン ─────────────────── */}
      {isLoading && !newsData && <Skeleton />}

      {/* ── ニュースリスト ───────────────────────────── */}
      {newsData?.news && (
        <div>
          {newsData.news.map((item, idx) => {
            const ist   = IMPACT_STYLE[item.impact] || IMPACT_STYLE.neutral
            const isOpen = expanded === idx

            return (
              <div key={idx} style={{
                borderBottom: idx < newsData.news.length - 1
                  ? '0.5px solid rgba(26,26,46,0.06)' : 'none',
              }}>
                {/* ニュース行（クリックで開閉） */}
                <div
                  onClick={() => setExpanded(isOpen ? null : idx)}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = '#FAFAF8' }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent' }}
                  style={{
                    padding: '12px 18px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    background: isOpen ? '#FAFAF8' : 'transparent',
                    transition: 'background .12s',
                  }}
                >
                  {/* impact バッジ */}
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 10,
                    whiteSpace: 'nowrap', marginTop: 1,
                    background: ist.bg, color: ist.color,
                    border: `0.5px solid ${ist.border}`,
                    flexShrink: 0,
                  }}>
                    {ist.label}
                  </span>

                  {/* タイトル＋サマリー */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600,
                      color: '#1A1A2E', marginBottom: 3, lineHeight: 1.4,
                    }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#5A5A6A', lineHeight: 1.55 }}>
                      {item.summary}
                    </div>
                  </div>

                  {/* 展開矢印 */}
                  {item.affected_funds?.length > 0 && (
                    <span style={{
                      fontSize: 10, color: '#C9A84C', fontWeight: 700,
                      flexShrink: 0, marginTop: 3,
                      display: 'inline-block',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform .2s',
                    }}>▼</span>
                  )}
                </div>

                {/* 展開パネル: 影響銘柄リスト */}
                {isOpen && item.affected_funds?.length > 0 && (
                  <div style={{ padding: '0 18px 14px', background: '#FAFAF8' }}>
                    <div style={{
                      fontSize: 10, fontWeight: 600, color: '#888',
                      letterSpacing: '.5px', textTransform: 'uppercase',
                      marginBottom: 8, fontFamily: "'DM Mono',monospace",
                    }}>
                      影響を受ける銘柄
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {item.affected_funds.map((fund, fi) => {
                        const dot = IMPACT_DOT[fund.impact_level] || IMPACT_DOT[1]
                        return (
                          <div key={fi} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 8,
                            padding: '8px 12px',
                            background: '#FFFFFF',
                            border: '0.5px solid rgba(26,26,46,0.08)',
                            borderRadius: 8,
                          }}>
                            {/* インパクトドット */}
                            <div style={{
                              width: dot.size, height: dot.size,
                              borderRadius: '50%', flexShrink: 0, marginTop: 4,
                              background: ist.color, opacity: dot.opacity,
                            }}/>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                display: 'flex', alignItems: 'center',
                                gap: 6, marginBottom: 3, flexWrap: 'wrap',
                              }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A2E' }}>
                                  {fund.name}
                                </span>
                                {fund.ticker && (
                                  <span style={{
                                    fontSize: 10, color: '#888',
                                    fontFamily: "'DM Mono',monospace",
                                  }}>
                                    {fund.ticker}
                                  </span>
                                )}
                                {/* 影響度バー (■□□) */}
                                <div style={{ display: 'flex', gap: 2, marginLeft: 2 }}>
                                  {[1, 2, 3].map(l => (
                                    <div key={l} style={{
                                      width: 6, height: 6, borderRadius: 1,
                                      background: l <= (fund.impact_level || 1)
                                        ? ist.color : '#E0DED8',
                                    }}/>
                                  ))}
                                </div>
                              </div>
                              <div style={{ fontSize: 11, color: '#5A5A6A', lineHeight: 1.55 }}>
                                {fund.reason}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── フッター ─────────────────────────────────── */}
      {newsData && (
        <div style={{
          padding: '8px 18px',
          borderTop: '0.5px solid rgba(26,26,46,0.06)',
          background: '#FAFAF8',
          fontSize: 10, color: '#AAA',
          fontFamily: "'DM Mono',monospace",
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>Powered by Groq · llama-3.3-70b</span>
          <span>30分キャッシュ</span>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
