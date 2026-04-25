import { useState, useEffect } from 'react'
import { useFunds } from '../hooks/useFunds'

// ─── Color Tokens ─────────────────────────────────────────────
const C = {
  bg:        '#F8F7F4',
  card:      '#FFFFFF',
  gold:      '#C9A84C',
  goldLight: '#F5EDD5',
  goldText:  '#7A5A10',
  ink:       '#1A1A2E',
  up:        '#0F6E56',
  upBg:      '#E8F5F1',
  down:      '#993C1D',
  downBg:    '#FAF0EC',
  border:    '#E8E5DE',
  muted:     '#8C8C8C',
  subtle:    '#4A4A5A',
}

// ─── 為替レート ────────────────────────────────────────────────
const USD_JPY_FALLBACK = 151.5
const formatPrice = (priceJpy) => {
  if (priceJpy == null) return '取得中'
  return '¥' + Math.round(priceJpy).toLocaleString('ja-JP')
}

// ─── テーマ別グルーピング定義 ──────────────────────────────────
// API から取得したfundsをcategoryでグルーピングして表示
const THEME_ORDER = [
  'AI・半導体',
  '防衛・地政学',
  '全世界・先進国',
  '日本株',
  '新興国',
  'エネルギー・コモディティ',
  'ヘルスケア',
  '債券・REIT',
  'クリーンエネルギー',
  'バランス・その他',
]

// API categoryをテーマにマッピング
function mapCategoryToTheme(category) {
  if (!category) return 'バランス・その他'
  if (['AI・半導体','情報技術'].includes(category))                    return 'AI・半導体'
  if (['防衛・地政学'].includes(category))                           return '防衛・地政学'
  if (['全世界・先進国','先進国株式','米国株式','米国グロース','アジア太平洋'].includes(category)) return '全世界・先進国'
  if (['日本株','国内ETF','国内株式'].includes(category))             return '日本株'
  if (['新興国','新興国株式','インド'].includes(category))             return '新興国'
  if (['コモディティ','コモディティ総合','金','銀','エネルギー'].includes(category)) return 'エネルギー・コモディティ'
  if (['ヘルスケア'].includes(category))                              return 'ヘルスケア'
  if (['米国債券','長期米国債','投資適格社債','ハイイールド債','新興国債券','国際債券','外国債券','債券・REIT','米国REIT','不動産'].includes(category)) return '債券・REIT'
  if (['クリーンエネルギー','太陽光'].includes(category))              return 'クリーンエネルギー'
  return 'バランス・その他'
}

// ─── 外部リンクURL生成 ──────────────────────────────────
const getFundUrl = (fund) => {
  if (fund.type === 'us_etf') {
    return `https://finance.yahoo.com/quote/${fund.ticker}`
  }
  if (fund.type === 'tse_etf') {
    return `https://finance.yahoo.co.jp/quote/${fund.ticker}.T`
  }
  if (fund.type === 'jp_fund' && fund.isin) {
    return `https://www.morningstar.co.jp/FundData/SnapShot.do?isinCode=${fund.isin}`
  }
  return null
}

// ─── NISAバッジスタイル ───────────────────────────────
const NISA_BADGE = {
  '成長':   { label: 'NISA成長',   bg: '#E6F1FB', color: '#0C447C' },
  '両方':   { label: 'NISA両枠',   bg: '#F5EDD5', color: '#7A5A10' },
  '対象外': { label: 'NISA対象外', bg: '#F1EFE8', color: '#666' },
}

// ─── 資産クラスバッジスタイル ─────────────────────────────
const ASSET_BADGE = {
  '海外ETF':    { bg: '#EEEDFE', color: '#3C3489' },
  '国内ETF':    { bg: '#FAEEDA', color: '#633806' },
  '国内株式':   { bg: '#FAEEDA', color: '#633806' },
  '海外株式':   { bg: '#EEEDFE', color: '#3C3489' },
  '国内投信':   { bg: '#E1F5EE', color: '#085041' },
  '債券':       { bg: '#F0EEFB', color: '#4A2D8A' },
  'コモディティ': { bg: '#FFF3E0', color: '#7A4200' },
  'REIT':        { bg: '#FBEAF0', color: '#72243E' },
  'バランス':     { bg: '#F1EFE8', color: '#444441' },
}

// ─── Tag colors ───────────────────────────────────────────────
const THEME_TAG_COLOR = {
  'AI・半導体':             { bg:'#EEEDFE', color:'#3C3489' },
  '防衛・地政学':           { bg:'#FAECE7', color:'#712B13' },
  '全世界・先進国':         { bg:'#E1F5EE', color:'#085041' },
  '日本株':                 { bg:'#FAEEDA', color:'#633806' },
  '新興国':                 { bg:'#FFF4E6', color:'#7A4A10' },
  'エネルギー・コモディティ':{ bg:'#F1EFE8', color:'#444441' },
  'ヘルスケア':             { bg:'#FBEAF0', color:'#72243E' },
  '債券・REIT':             { bg:'#E8F4F8', color:'#1A4A6A' },
  'クリーンエネルギー':     { bg:'#E4F8E4', color:'#1A5A1A' },
  'バランス・その他':       { bg:'#F0F4F8', color:'#304060' },
}

function feeColor(feeStr) {
  if (!feeStr) return '#8C8C8C'
  const v = parseFloat(feeStr)
  if (v < 0.1)  return C.up
  if (v <= 0.5) return C.ink
  return C.down
}


const fmtPct   = v => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`
const pctColor = v => v >= 0 ? C.up   : C.down
const pctBg    = v => v >= 0 ? C.upBg : C.downBg

function useTime() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

// ─── Sub-components ────────────────────────────────────────────
function OwnedBadge() {
  return (
    <span style={{ background:C.gold, color:C.ink, fontSize:10, fontWeight:600,
      fontFamily:"'Syne',sans-serif", borderRadius:6, padding:'2px 8px', whiteSpace:'nowrap' }}>
      保有中
    </span>
  )
}

function ThemeTag({ label }) {
  const s = THEME_TAG_COLOR[label] || { bg:'#F0F0F0', color:'#444' }
  return (
    <span style={{ fontSize:10, fontFamily:"'Syne',sans-serif", fontWeight:600,
      background:s.bg, color:s.color, borderRadius:4, padding:'2px 7px', whiteSpace:'nowrap' }}>
      {label}
    </span>
  )
}

function HeatBar({ pct, maxAbs=4 }) {
  const ratio = Math.min(Math.abs(pct) / maxAbs, 1)
  return (
    <div style={{ width:'100%', height:4, background:'rgba(0,0,0,.07)', borderRadius:2, marginTop:8 }}>
      <div style={{ width:`${ratio*100}%`, height:'100%', background:pctColor(pct), borderRadius:2, transition:'width .6s' }}/>
    </div>
  )
}

function SectorCard({ name, pct, etfLabel, isHot }) {
  return (
    <div style={{ background:isHot?'#FFFDF5':C.card,
      border:`1.5px solid ${isHot?C.gold:C.border}`,
      borderRadius:12, padding:'14px 16px',
      display:'flex', flexDirection:'column', gap:4,
      boxShadow:isHot?'0 4px 20px rgba(201,168,76,.15)':'0 1px 6px rgba(0,0,0,.05)',
      position:'relative', overflow:'hidden' }}>
      {isHot && (
        <div style={{ position:'absolute', top:8, right:10, fontSize:9,
          fontFamily:"'Syne',sans-serif", fontWeight:700, color:C.gold, letterSpacing:'0.08em' }}>
          🔥 最熱
        </div>
      )}
      <div style={{ fontSize:12, fontFamily:"'Syne',sans-serif", fontWeight:600, color:C.ink }}>{name}</div>
      <div style={{ fontSize:20, fontFamily:"'DM Mono',monospace", fontWeight:500, color:pctColor(pct), letterSpacing:'-0.02em' }}>
        {fmtPct(pct)}
      </div>
      <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:C.muted }}>{etfLabel}</div>
      <HeatBar pct={pct}/>
    </div>
  )
}

const COL = '1fr 100px 100px 90px 80px'

// ─── TrendPage ─────────────────────────────────────────────────
export default function TrendPage() {
  const [activeTheme, setActiveTheme] = useState(THEME_ORDER[0])
  const [period,      setPeriod     ] = useState('1D')
  const now = useTime()

  // ── API データ取得（period が変わると自動 re-fetch） ──────────
  const { funds, usdJpy, updatedAt, isLoading, error, refetch } = useFunds(period)

  // ── 期間ボタン ─────────────────────────────────────────────────
  function handlePeriod(p) {
    setPeriod(p)
    // useFunds の useEffect が period 変更を検知して自動で再取得
  }

  // ── API データをテーマ別にグルーピング ─────────────────────────
  const themeMap = {}
  for (const theme of THEME_ORDER) themeMap[theme] = []
  for (const f of funds) {
    const theme = mapCategoryToTheme(f.category)
    if (themeMap[theme]) themeMap[theme].push(f)
  }

  // ── ヒートマップ用集計 ─────────────────────────────────────────
  const sectorStats = THEME_ORDER.map(theme => {
    const list = themeMap[theme] || []
    const avg  = list.length > 0
      ? list.reduce((s, f) => s + (f.change || 0), 0) / list.length
      : 0
    const top2 = list.slice(0, 2).map(f => f.shortName || f.ticker || '').filter(Boolean).join(' / ')
    return { name: theme, pct: avg, etfLabel: top2 || '—' }
  })
  const hotTheme = sectorStats.reduce((best, s) => s.pct > best.pct ? s : best, sectorStats[0] || { pct: -Infinity })

  const displayFunds = themeMap[activeTheme] || []
  const PERIODS = ['1D','1W','1M','3M']

  return (
    <div style={{ background:C.bg, fontFamily:"'Syne',sans-serif", color:C.ink }}>

      {/* ── Sub-header ────────────────────────────────── */}
      <div style={{ background:'rgba(248,247,244,.95)', backdropFilter:'blur(12px)',
        borderBottom:`1px solid ${C.border}`, padding:'0 24px', height:52,
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>

        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#1DB954',
            animation:'pulseDot 1.6s ease-in-out infinite' }}/>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:11,
            color:'#1DB954', letterSpacing:'0.08em' }}>LIVE</span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:C.subtle, marginLeft:4 }}>
            {now.toLocaleTimeString('ja-JP', { timeZone:'Asia/Tokyo', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false })} JST
          </span>
          {!isLoading && usdJpy !== USD_JPY_FALLBACK && (
            <span style={{ marginLeft:8, fontSize:11, color:C.goldText,
              background:C.goldLight, borderRadius:8, padding:'2px 8px',
              fontFamily:"'DM Mono',monospace" }}>
              1USD=¥{usdJpy.toFixed(1)}
            </span>
          )}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* 期間ボタン */}
          <div style={{ display:'flex', background:'rgba(0,0,0,.05)', borderRadius:8, padding:3, gap:2 }}>
            {PERIODS.map(p => (
              <button key={p} onClick={() => handlePeriod(p)} style={{
                fontFamily:"'DM Mono',monospace", fontWeight:500, fontSize:11,
                padding:'4px 10px', borderRadius:6, border:'none', cursor:'pointer',
                background:period===p?C.gold:'transparent',
                color:period===p?C.ink:C.subtle, letterSpacing:'0.04em', transition:'all .15s' }}>
                {p}
              </button>
            ))}
          </div>

          {/* 更新ボタン */}
          <span style={{ fontSize:11, color:C.muted, fontFamily:"'DM Mono',monospace" }}>
            {updatedAt
              ? `更新: ${updatedAt.toLocaleTimeString('ja-JP', { hour:'2-digit', minute:'2-digit' })}`
              : 'API接続待ち'}
          </span>
          <button onClick={refetch} disabled={isLoading} style={{
            fontSize:12, padding:'5px 14px', borderRadius:20,
            border:`0.5px solid rgba(26,26,46,0.2)`,
            background:isLoading ? C.goldLight : C.ink,
            color:isLoading ? C.goldText : '#FFFFFF',
            cursor:isLoading ? 'not-allowed' : 'pointer',
            fontFamily:"'Syne',sans-serif", transition:'all .2s',
            display:'flex', alignItems:'center', gap:5 }}>
            {isLoading ? '取得中...' : '↻ 更新'}
          </button>
        </div>
      </div>

      {/* ── Theme Tabs ────────────────────────────────── */}
      <div style={{ padding:'0 24px', borderBottom:`1px solid ${C.border}`,
        display:'flex', gap:2, overflowX:'auto', background:C.card }}>
        {THEME_ORDER.map(key => {
          const isActive = activeTheme === key
          return (
            <button key={key} onClick={() => setActiveTheme(key)} style={{
              fontFamily:"'Syne',sans-serif", fontWeight:isActive?700:500, fontSize:12,
              padding:'12px 14px', border:'none', whiteSpace:'nowrap',
              borderBottom:isActive?`2.5px solid ${C.gold}`:'2.5px solid transparent',
              background:'transparent', color:isActive ? C.ink : C.subtle,
              cursor:'pointer', transition:'all .15s' }}>
              {key}
            </button>
          )
        })}
      </div>

      <main style={{ maxWidth:1080, margin:'0 auto', padding:'26px 24px 56px' }}>

        {/* ── エラー表示 ─────────────────────────────── */}
        {error && (
          <div style={{ marginBottom:16, padding:'12px 16px',
            background:'#FFF0EC', border:`1px solid ${C.down}30`,
            borderRadius:10, fontFamily:"'Syne',sans-serif", fontSize:12, color:C.down }}>
            ⚠️ {error}（モックデータで表示中）
          </div>
        )}

        {/* ── Sector Heatmap ────────────────────────── */}
        <section style={{ marginBottom:32 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:C.ink, margin:0 }}>
              テーマ ヒートマップ
            </h2>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:C.muted }}>{period}</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10,
            opacity:isLoading ? 0.5 : 1, transition:'opacity .3s' }}>
            {sectorStats.map(s => (
              <SectorCard key={s.name} name={s.name} pct={s.pct}
                etfLabel={s.etfLabel} isHot={s.name === hotTheme.name}/>
            ))}
          </div>
        </section>

        {/* ── Fund List ─────────────────────────────── */}
        <section>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:C.ink, margin:0 }}>
                {activeTheme}
              </h2>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:600,
                color:C.gold, background:C.goldLight, borderRadius:4, padding:'2px 8px' }}>
                {displayFunds.length}件
              </span>
            </div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:C.muted }}>
              全{funds.length}件 / {THEME_ORDER.length}テーマ
            </div>
          </div>

          {isLoading && displayFunds.length === 0 ? (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16,
              padding:'60px 20px', textAlign:'center' }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, color:C.muted }}>
                {period} データ取得中...
              </div>
            </div>
          ) : (
            <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`,
              overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.05)',
              opacity:isLoading ? 0.5 : 1, transition:'opacity .3s' }}>

              {/* thead */}
              <div style={{ display:'grid', gridTemplateColumns:COL,
                padding:'10px 20px', background:'#F3F1EC',
                borderBottom:`1px solid ${C.border}`, gap:12, alignItems:'end' }}>
                {[
                  { label:'ファンド名' },
                  { label:`上昇率（${period}）`, center:true },
                  { label:'基準価額（円）', sub:`1USD=¥${usdJpy.toFixed(1)}換算`, center:true },
                  { label:'信託報酬（年率）', center:true },
                  { label:'テーマ' },
                ].map(({ label, sub, center }, i) => (
                  <div key={i} style={{ textAlign:center?'center':'left' }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700,
                      color:C.muted, letterSpacing:'0.04em', textTransform:'uppercase' }}>{label}</div>
                    {sub && <div style={{ fontSize:9, color:C.muted, marginTop:2 }}>{sub}</div>}
                  </div>
                ))}
              </div>

              {/* rows */}
              {displayFunds.length === 0 ? (
                <div style={{ padding:'40px 20px', textAlign:'center',
                  color:C.muted, fontFamily:"'Syne',sans-serif", fontSize:14 }}>
                  このテーマのファンドデータが取得できませんでした
                </div>
              ) : displayFunds.map((fund, idx) => {
                const isLast     = idx === displayFunds.length - 1
                const reasonColor = fund.isOwned ? C.ink : '#6B6B7A'
                const displayChange = fund.change ?? 0
                const theme = mapCategoryToTheme(fund.category)

                return (
                  <a key={fund.id || idx}
                    href={getFundUrl(fund) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={e => { e.currentTarget.style.background = fund.isOwned ? '#EDE5C4' : '#F8F7F4' }}
                    onMouseLeave={e => { e.currentTarget.style.background = fund.isOwned ? C.goldLight : C.card }}
                    style={{ display:'grid', gridTemplateColumns:COL,
                      padding:'13px 16px', gap:8, alignItems:'center',
                      textDecoration:'none', color:'inherit',
                      background:fund.isOwned ? C.goldLight : C.card,
                      borderBottom:isLast ? 'none' : `0.5px solid ${fund.isOwned ? '#E8D9A8' : 'rgba(26,26,46,0.06)'}`,
                      cursor: getFundUrl(fund) ? 'pointer' : 'default',
                      transition:'background .1s' }}>

                    {/* name + reason + badges */}
                    <div style={{ display:'flex', flexDirection:'column', gap:3, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13,
                          color:C.ink, whiteSpace:'nowrap' }}>
                          {fund.shortName}
                        </span>
                        <span style={{ fontSize:'10px', color:C.gold, marginLeft:'4px', opacity:0.8 }}>↗</span>
                        {fund.ticker && (
                          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.muted }}>
                            {fund.ticker}
                          </span>
                        )}
                      </div>
                      {fund.reason && (
                        <div style={{ fontSize:11, color:reasonColor, fontStyle:'italic', lineHeight:1.5 }}>
                          {fund.reason}
                        </div>
                      )}
                      <div style={{ display:'flex', alignItems:'center', gap:'4px', flexWrap:'wrap', marginTop:'4px' }}>
                        {fund.assetClass && (
                          <span style={{
                            fontSize:'10px', fontWeight:600,
                            padding:'2px 7px', borderRadius:'6px',
                            background: ASSET_BADGE[fund.assetClass]?.bg || '#F1EFE8',
                            color: ASSET_BADGE[fund.assetClass]?.color || '#444',
                            whiteSpace:'nowrap',
                          }}>
                            {fund.assetClass}
                          </span>
                        )}
                        {fund.nisa && NISA_BADGE[fund.nisa] && (
                          <span style={{
                            fontSize:'10px', fontWeight:600,
                            padding:'2px 7px', borderRadius:'6px',
                            background: NISA_BADGE[fund.nisa].bg,
                            color: NISA_BADGE[fund.nisa].color,
                            whiteSpace:'nowrap',
                          }}>
                            {NISA_BADGE[fund.nisa].label}
                          </span>
                        )}
                        {fund.isOwned && (
                          <span style={{
                            fontSize:'10px', fontWeight:600,
                            padding:'2px 7px', borderRadius:'6px',
                            background:C.gold, color:C.ink,
                            whiteSpace:'nowrap',
                          }}>
                            保有中
                          </span>
                        )}
                      </div>
                    </div>

                    {/* change % */}
                    <div style={{ fontFamily:"'DM Mono',monospace", fontWeight:500, fontSize:14,
                      color:pctColor(displayChange), background:pctBg(displayChange),
                      borderRadius:8, padding:'4px 8px', textAlign:'center', letterSpacing:'-0.01em' }}>
                      {fmtPct(displayChange)}
                    </div>

                    {/* price (JPY) */}
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12,
                      color:fund.isOwned ? '#4A3A1A' : C.subtle, textAlign:'center' }}>
                      {formatPrice(fund.price_jpy)}
                    </div>

                    {/* fee */}
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:500,
                      color:feeColor(fund.fee), textAlign:'center' }}>
                      {fund.fee || '—'}
                    </div>

                    {/* theme tag */}
                    <div>
                      <ThemeTag label={theme}/>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Footer ────────────────────────────────── */}
        <footer style={{ marginTop:28, padding:'14px 0', borderTop:`1px solid ${C.border}`,
          fontFamily:"'Syne',sans-serif", fontSize:11, color:C.muted }}>
          黄背景 = あなたの保有ファンド｜信託報酬: 緑(&lt;0.1%) 黒(中) 赤(&gt;0.5%)｜価格: APIリアルタイム取得 / 1USD=¥{usdJpy.toFixed(1)}換算
        </footer>
      </main>

      <style>{`
        @keyframes pulseDot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.4; transform:scale(.8); }
        }
      `}</style>
    </div>
  )
}
