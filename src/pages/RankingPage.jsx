import { useState, useMemo } from 'react'
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
  border:    '#E8E5DE',
  muted:     '#8C8C8C',
  subtle:    '#4A4A5A',
}

// ─── 為替レート ────────────────────────────────────────────────
const formatPrice = (priceJpy) => {
  if (priceJpy == null) return '取得中'
  return '¥' + Math.round(priceJpy).toLocaleString('ja-JP')
}

// ─── Filter Options ────────────────────────────────────────────
const PERIODS = ['1D','1W','1M','3M','6M','YTD','1Y']

const CATEGORIES = [
  { value:'all', label:'全て' },
]

const REGIONS = [
  { value:'all',    label:'地域：全て' },
  { value:'米国',   label:'米国' },
  { value:'日本',   label:'日本' },
  { value:'全世界', label:'全世界' },
  { value:'先進国', label:'先進国' },
  { value:'新興国', label:'新興国' },
  { value:'欧州',   label:'欧州' },
  { value:'アジア', label:'アジア' },
]

const TAG_STYLE = {
  'AI・半導体':           { bg:'#EEEDFE', color:'#3C3489' },
  '全世界株式':           { bg:'#E1F5EE', color:'#085041' },
  '米国株式':             { bg:'#E6F1FB', color:'#0C447C' },
  '米国グロース':         { bg:'#E6F1FB', color:'#0C447C' },
  '国内ETF':              { bg:'#FAEEDA', color:'#633806' },
  '国内株式':             { bg:'#FAEEDA', color:'#633806' },
  '防衛・地政学':         { bg:'#FAECE7', color:'#712B13' },
  'コモディティ':         { bg:'#F1EFE8', color:'#444441' },
  'インド':               { bg:'#FFF4E6', color:'#7A3F00' },
  '先進国株式':           { bg:'#EBF3FF', color:'#1A4A8A' },
  '新興国株式':           { bg:'#FFF8F0', color:'#7A4010' },
  '情報技術':             { bg:'#EEEDFE', color:'#3C3489' },
  'ヘルスケア':           { bg:'#FBEAF0', color:'#72243E' },
  '金融':                 { bg:'#E3F0E8', color:'#215432' },
  'エネルギー':           { bg:'#FFF3D6', color:'#7A5000' },
  '資本財':               { bg:'#E8F0FB', color:'#1A3A7A' },
  '生活必需品':           { bg:'#F0F8EE', color:'#2C5A20' },
  '公益事業':             { bg:'#EEF4F8', color:'#1A4060' },
  '素材':                 { bg:'#F5EFE8', color:'#5A3A10' },
  '不動産':               { bg:'#F5EAF0', color:'#5A2040' },
  '通信':                 { bg:'#EDE8F8', color:'#3A2880' },
  '米国債券':             { bg:'#E8F4F8', color:'#1A4A6A' },
  '長期米国債':           { bg:'#E8F4F8', color:'#1A4A6A' },
  '投資適格社債':         { bg:'#E8F4F8', color:'#1A4A6A' },
  'ハイイールド債':       { bg:'#FFF0E8', color:'#7A3010' },
  '新興国債券':           { bg:'#FFF0E8', color:'#7A3010' },
  '国際債券':             { bg:'#E8F4F8', color:'#1A4A6A' },
  '外国債券':             { bg:'#E8F4F8', color:'#1A4A6A' },
  '金':                   { bg:'#FFF8E0', color:'#7A5A00' },
  '銀':                   { bg:'#F0F0F0', color:'#404040' },
  'コモディティ総合':     { bg:'#F1EFE8', color:'#444441' },
  '米国REIT':             { bg:'#FBEAF0', color:'#72243E' },
  'バランス':             { bg:'#F0F4F8', color:'#304060' },
  '高配当':               { bg:'#E8F8F0', color:'#1A5A38' },
  'アジア太平洋':         { bg:'#FFF4E8', color:'#7A4A10' },
  '革新的技術':           { bg:'#EEEDFE', color:'#3C3489' },
  'クリーンエネルギー':   { bg:'#E4F8E4', color:'#1A5A1A' },
  '太陽光':               { bg:'#FFFCE0', color:'#6A5A00' },
  '林業・木材':           { bg:'#EAF0E4', color:'#2A4A18' },
  'アグリビジネス':       { bg:'#F0F8E8', color:'#2A5018' },
  '航空':                 { bg:'#E8F0F8', color:'#1A3A6A' },
  '旅行':                 { bg:'#F8F0F8', color:'#5A2A5A' },
  'ロボティクス':         { bg:'#EEEDFE', color:'#3C3489' },
  'サイバーセキュリティ': { bg:'#FAEEFE', color:'#5A1A7A' },
  '宇宙開発':             { bg:'#E4E4F8', color:'#2A2A7A' },
  '次世代インターネット': { bg:'#EEEDFE', color:'#3C3489' },
  'ゲノム革命':           { bg:'#F8E8F0', color:'#7A1A5A' },
  '日本株':               { bg:'#FAEEDA', color:'#633806' },
  '全世界・先進国':       { bg:'#E1F5EE', color:'#085041' },
  '新興国':               { bg:'#FFF8F0', color:'#7A4010' },
  '債券・REIT':           { bg:'#E8F4F8', color:'#1A4A6A' },
  'バランス・その他':     { bg:'#F0F4F8', color:'#304060' },
}

const PAGE_SIZE = 20

function feeColor(feeStr) {
  const v = parseFloat(feeStr)
  if (v < 0.1)  return C.up
  if (v <= 0.5) return C.ink
  return C.down
}

const fmtPct   = v => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`
const pctColor = v => v >= 0 ? C.up : C.down

// ─── 外部リンクURL生成 ────────────────────────────────────
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

// ─── NISAバッジスタイル ───────────────────────────────────
const NISA_BADGE = {
  '成長':   { label: 'NISA成長',   bg: '#E6F1FB', color: '#0C447C' },
  '両方':   { label: 'NISA両枠',   bg: '#F5EDD5', color: '#7A5A10' },
  '対象外': { label: 'NISA対象外', bg: '#F1EFE8', color: '#666' },
}

// ─── 資産クラスバッジスタイル ───────────────────────────────
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

// ─── Sub-components ────────────────────────────────────────────
function OwnedBadge() {
  return (
    <span style={{ background:C.gold, color:C.ink, fontSize:10, fontWeight:600,
      fontFamily:"'Syne',sans-serif", borderRadius:6, padding:'2px 8px', whiteSpace:'nowrap' }}>
      保有中
    </span>
  )
}

function RankCatTag({ label }) {
  const s = TAG_STYLE[label] || { bg:'#F0F0F0', color:'#555' }
  return (
    <span style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:600,
      background:s.bg, color:s.color, borderRadius:4, padding:'2px 7px', whiteSpace:'nowrap' }}>
      {label}
    </span>
  )
}

function SummaryCard({ label, value, sub, valueColor }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
      padding:'18px 20px', boxShadow:'0 1px 6px rgba(0,0,0,.05)',
      display:'flex', flexDirection:'column', gap:5 }}>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700,
        color:C.muted, letterSpacing:'0.05em', textTransform:'uppercase' }}>{label}</div>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:24, fontWeight:500,
        color:valueColor||C.ink, letterSpacing:'-0.03em', lineHeight:1.2 }}>{value}</div>
      {sub && <div style={{ fontFamily:"'Syne',sans-serif", fontSize:11, color:C.muted }}>{sub}</div>}
    </div>
  )
}

const COL = '32px 1fr 90px 90px 70px 52px'

// ─── RankingPage ───────────────────────────────────────────────
export default function RankingPage() {
  const [period,      setPeriod     ] = useState('1D')
  const [category,    setCategory   ] = useState('all')
  const [region,      setRegion     ] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  // ── API データ取得（period が変わると自動 re-fetch） ──────────
  const { funds, usdJpy, updatedAt, isLoading, error, refetch } = useFunds(period)

  // ── 期間ボタン ─────────────────────────────────────────────────
  function handlePeriod(p) {
    setPeriod(p)
    setCurrentPage(1)
    // useFunds の useEffect が period 変更を検知して自動で再取得
  }

  // ── フィルタリング（API データに対して適用） ────────────────
  const filtered = useMemo(() => {
    return funds.filter(f => {
      if (region !== 'all' && f.region !== region) return false
      if (!category || category === 'all') return true
      if (category === 'nisa_成長') return f.nisa === '成長'
      if (category === 'nisa_両方') return f.nisa === '両方'
      if (['海外ETF','国内ETF','国内投信','コモディティ','債券','REIT'].includes(category)) {
        return f.assetClass === category
      }
      return f.category === category
    })
  }, [funds, category, region])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(currentPage, totalPages)
  const pageData   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function changeRegion(v) { setRegion(v); setCurrentPage(1) }

  function goPage(n) {
    setCurrentPage(n)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── API取得中・エラー表示 ────────────────────────────────────
  const SVG_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%238C8C8C' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`
  const selectStyle = {
    fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:500,
    padding:'6px 28px 6px 12px', border:`0.5px solid ${C.border}`,
    borderRadius:8, background:C.card, color:C.subtle, cursor:'pointer',
    appearance:'none', backgroundImage:SVG_ARROW,
    backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center',
  }

  // ── 統計計算 ────────────────────────────────────────────────
  const risingCount = funds.filter(f => (f.change || 0) >= 0).length
  const avgChange   = funds.length > 0
    ? (funds.reduce((s, f) => s + (f.change || 0), 0) / funds.length).toFixed(2)
    : '0.00'
  const avgSign = parseFloat(avgChange) >= 0 ? '+' : ''

  return (
    <div style={{ background:C.bg, fontFamily:"'Syne',sans-serif", color:C.ink }}>

      {/* ── Sub-header ────────────────────────────────── */}
      <div style={{ background:'rgba(248,247,244,.95)', backdropFilter:'blur(12px)',
        borderBottom:`1px solid ${C.border}`, padding:'0 28px', height:48,
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>

        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:C.subtle }}>
          {isLoading
            ? 'データ取得中...'
            : updatedAt
              ? `更新: ${updatedAt.toLocaleTimeString('ja-JP', { hour:'2-digit', minute:'2-digit', second:'2-digit' })} JST`
              : 'API接続待ち'}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* 為替レート */}
          {!isLoading && (
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11,
              color:C.goldText, background:C.goldLight, borderRadius:8, padding:'3px 10px' }}>
              1USD = ¥{usdJpy.toFixed(1)}
            </span>
          )}
          {/* 更新ボタン */}
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

      <main style={{ maxWidth:1060, margin:'0 auto', padding:'22px 24px 56px' }}>

        {/* ── エラー表示 ─────────────────────────────── */}
        {error && (
          <div style={{ marginBottom:16, padding:'12px 16px',
            background:'#FFF0EC', border:`1px solid ${C.down}20`,
            borderRadius:10, fontFamily:"'Syne',sans-serif", fontSize:12, color:C.down }}>
            ⚠️ {error}（モックデータで表示中）
          </div>
        )}

        {/* ── Filters ────────────────────────────────── */}
        <section style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap',
          marginBottom:20, padding:'12px 16px',
          background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
          boxShadow:'0 1px 6px rgba(0,0,0,.04)' }}>

          {/* 期間ボタン */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {PERIODS.map(p => {
              const active = period === p
              return (
                <button key={p} onClick={() => handlePeriod(p)} style={{
                  fontFamily:"'DM Mono',monospace", fontWeight:500, fontSize:12,
                  padding:'5px 13px', borderRadius:20,
                  border:active ? 'none' : `0.5px solid ${C.border}`,
                  background:active ? C.ink : 'transparent',
                  color:active ? '#FFFFFF' : C.subtle,
                  cursor:'pointer', transition:'all .15s' }}>
                  {p}
                </button>
              )
            })}
          </div>

          <div style={{ width:1, height:22, background:C.border, flexShrink:0 }}/>

          <select value={category} onChange={e => { setCategory(e.target.value); setCurrentPage(1) }} style={selectStyle}>
            <option value="all">全て</option>
            <optgroup label="資産クラス">
              <option value="海外ETF">海外ETF</option>
              <option value="国内ETF">国内ETF</option>
              <option value="国内投信">国内投信</option>
              <option value="コモディティ">コモディティ</option>
              <option value="債券">債券</option>
              <option value="REIT">REIT</option>
            </optgroup>
            <optgroup label="NISA区分">
              <option value="nisa_成長">NISA成長のみ</option>
              <option value="nisa_両方">NISA両枠対応</option>
            </optgroup>
            <optgroup label="テーマ">
              <option value="AI・半導体">AI・半導体</option>
              <option value="防衛・地政学">防衛・地政学</option>
              <option value="全世界・先進国">全世界・先進国</option>
              <option value="日本株">日本株</option>
              <option value="新興国">新興国</option>
              <option value="ヘルスケア">ヘルスケア</option>
              <option value="クリーンエネルギー">クリーンエネルギー</option>
            </optgroup>
          </select>
          <select value={region} onChange={e => changeRegion(e.target.value)} style={selectStyle}>
            {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>

          <div style={{ marginLeft:'auto', fontFamily:"'DM Mono',monospace", fontSize:11, color:C.muted }}>
            {filtered.length}件 / {totalPages}ページ
          </div>
        </section>

        {/* ── Summary Cards ──────────────────────────── */}
        <section style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:22 }}>
          <SummaryCard
            label="対象ファンド数"
            value={funds.length || '—'}
            sub={isLoading ? 'ロード中...' : 'APIリアルタイム取得'}
          />
          <SummaryCard
            label={`上昇ファンド（${period}）`}
            value={funds.length ? `${risingCount}件` : '—'}
            sub={funds.length ? `${funds.length}件中 ${Math.round(risingCount/funds.length*100)}%` : ''}
            valueColor={C.up}
          />
          <SummaryCard
            label={`平均騰落率（${period}）`}
            value={funds.length ? `${avgSign}${avgChange}%` : '—'}
            sub={`1USD = ¥${usdJpy.toFixed(1)} (リアルタイム)`}
            valueColor={parseFloat(avgChange) >= 0 ? C.up : C.down}
          />
        </section>

        {/* ── Ranking Table ──────────────────────────── */}
        <section>
          {/* ロード中スケルトン */}
          {isLoading && funds.length === 0 ? (
            <div style={{ background:C.card, border:`1px solid ${C.border}`,
              borderRadius:16, padding:'60px 20px', textAlign:'center',
              boxShadow:'0 2px 14px rgba(0,0,0,.05)' }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, color:C.muted, marginBottom:8 }}>
                {period} のデータを取得中...
              </div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:C.gold }}>
                ↺
              </div>
            </div>
          ) : (
            <div style={{ background:C.card, border:`1px solid ${C.border}`,
              borderRadius:16, overflow:'hidden', boxShadow:'0 2px 14px rgba(0,0,0,.05)',
              opacity:isLoading ? 0.5 : 1, transition:'opacity .3s' }}>

              {/* thead */}
              <div style={{ display:'grid', gridTemplateColumns:COL, padding:'10px 20px',
                background:'#F3F1EC', borderBottom:`1px solid ${C.border}`, gap:12, alignItems:'end' }}>
                {[
                  { label:'#' },
                  { label:'ファンド名 / NISA区分' },
                  { label:`上昇率（${period}）`, center:true },
                  { label:'基準価額（円）', sub:`1USD=¥${usdJpy.toFixed(1)}換算`, center:true },
                  { label:'信託報酬（年率）', center:true },
                  { label:'' },
                ].map(({ label, sub, center }, i) => (
                  <div key={i} style={{ textAlign:center?'center':'left' }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700,
                      color:C.muted, letterSpacing:'0.05em', textTransform:'uppercase' }}>{label}</div>
                    {sub && <div style={{ fontSize:9, color:C.muted, marginTop:2 }}>{sub}</div>}
                  </div>
                ))}
              </div>

              {/* rows */}
              {pageData.length === 0 ? (
                <div style={{ padding:'48px 20px', textAlign:'center',
                  color:C.muted, fontFamily:"'Syne',sans-serif", fontSize:14 }}>
                  該当するファンドが見つかりません
                </div>
              ) : pageData.map((fund, idx) => {
                const isTop3     = fund.rank <= 3
                const subCol     = fund.isOwned ? '#4A3A1A' : C.subtle
                const isLast     = idx === pageData.length - 1
                const reasonColor= fund.isOwned ? C.ink : '#6B6B7A'
                const displayChange = fund.change ?? 0

                return (
                  <a key={fund.id || fund.rank}
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

                    {/* rank */}
                    <div style={{ fontFamily:"'DM Mono',monospace", fontWeight:500,
                      fontSize:isTop3?16:13, color:isTop3?C.gold:C.muted,
                      textAlign:'center', letterSpacing:'-0.02em' }}>
                      {fund.rank}
                    </div>

                    {/* name + tags */}
                    <div style={{ display:'flex', flexDirection:'column', gap:2, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:4 }}>
                        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:14,
                          color:C.ink, letterSpacing:'-0.2px', whiteSpace:'nowrap' }}>
                          {fund.shortName}
                        </span>
                        <span style={{ fontSize:'10px', color:C.gold, marginLeft:'4px', opacity:0.8 }}>↗</span>
                        {fund.ticker && fund.ticker !== '—' && (
                          <span style={{ fontFamily:"'DM Mono',monospace",
                            fontSize:11, color:'#888' }}>{fund.ticker}</span>
                        )}
                      </div>
                      {fund.reason && (
                        <div style={{ fontSize:12,
                          color:fund.isOwned ? '#3A3A4E' : '#5A5A6A',
                          marginTop:2, lineHeight:1.5 }}>
                          {fund.reason}
                        </div>
                      )}
                      <div style={{ display:'flex', alignItems:'center', gap:'4px', flexWrap:'wrap', marginTop:'4px' }}>
                        {/* 資産クラスタグ */}
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
                        {/* NISAバッジ */}
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
                        {/* 保有中バッジ */}
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
                      color:pctColor(displayChange), textAlign:'center', letterSpacing:'-0.02em' }}>
                      {fmtPct(displayChange)}
                    </div>

                    {/* price (JPY) */}
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12,
                      color:subCol, textAlign:'center' }}>
                      {formatPrice(fund.price_jpy)}
                    </div>

                    {/* fee */}
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:500,
                      color:fund.fee ? feeColor(fund.fee) : C.muted, textAlign:'center' }}>
                      {fund.fee || '—'}
                    </div>

                    <div/>
                  </a>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Pagination ──────────────────────────────── */}
        {pageData.length > 0 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginTop:24 }}>
            <button onClick={() => goPage(safePage - 1)} disabled={safePage <= 1}
              style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600,
                padding:'7px 16px', border:`1px solid ${C.border}`, borderRadius:8,
                background:C.card, color:safePage<=1?C.muted:C.subtle,
                opacity:safePage<=1?0.4:1, cursor:safePage<=1?'not-allowed':'pointer' }}>
              ← 前へ
            </button>
            <div style={{ display:'flex', gap:4 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => goPage(n)} style={{
                  fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:500,
                  width:34, height:34, borderRadius:8,
                  border:n===safePage?'none':`1px solid ${C.border}`,
                  background:n===safePage?C.ink:C.card,
                  color:n===safePage?'#FFF':C.subtle, cursor:'pointer' }}>
                  {n}
                </button>
              ))}
            </div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:C.subtle,
              padding:'0 8px', whiteSpace:'nowrap' }}>
              {safePage} / {totalPages}ページ（{filtered.length}件）
            </div>
            <button onClick={() => goPage(safePage + 1)} disabled={safePage >= totalPages}
              style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600,
                padding:'7px 16px', border:`1px solid ${C.border}`, borderRadius:8,
                background:C.card, color:safePage>=totalPages?C.muted:C.subtle,
                opacity:safePage>=totalPages?0.4:1, cursor:safePage>=totalPages?'not-allowed':'pointer' }}>
              次へ →
            </button>
          </div>
        )}

        {/* ── Footer note ──────────────────────────────── */}
        <div style={{ marginTop:22, padding:'11px 16px',
          background:'rgba(201,168,76,0.07)', border:'1px solid rgba(201,168,76,0.25)',
          borderRadius:10, fontFamily:"'Syne',sans-serif", fontSize:11, color:C.goldText }}>
          黄背景 = あなたの保有ファンド｜信託報酬: 緑=低コスト(&lt;0.1%) 黒=中コスト 赤=高コスト(&gt;0.5%)｜価格: APIリアルタイム取得
        </div>
      </main>
    </div>
  )
}
