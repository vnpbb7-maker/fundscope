import { useState, useEffect } from 'react'

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

// ─── Mock Data ─────────────────────────────────────────────────
const PERIODS = ['1D','1W','1M','3M','6M','YTD','1Y']

const CATEGORIES = [
  { value:'all',    label:'全て' },
  { value:'etf_jp', label:'国内ETF（東証上場）' },
  { value:'etf_us', label:'外国ETF' },
  { value:'index',  label:'インデックスファンド' },
]

const REGIONS = [
  { value:'all',   label:'地域：全て' },
  { value:'us',    label:'米国' },
  { value:'jp',    label:'日本' },
  { value:'world', label:'全世界' },
  { value:'em',    label:'新興国' },
  { value:'eu',    label:'欧州' },
]

const TAG_STYLE = {
  'AI・半導体':  { bg:'#EEEDFE', color:'#3C3489' },
  '全世界':      { bg:'#E1F5EE', color:'#085041' },
  '米国':        { bg:'#E6F1FB', color:'#0C447C' },
  '日本株':      { bg:'#FAEEDA', color:'#633806' },
  '防衛・地政学':{ bg:'#FAECE7', color:'#712B13' },
  'コモディティ':{ bg:'#F1EFE8', color:'#444441' },
  'インド':      { bg:'#F1EFE8', color:'#555550' },
  '先進国':      { bg:'#EBF3FF', color:'#1A4A8A' },
}

const FUNDS = [
  { rank:1,  owned:false, name:'iShares Semiconductor ETF',      ticker:'SOXX', tag:'AI・半導体',  pct:5.24, price:'$248.60', fee:'0.350%', vol:'3.2×' },
  { rank:2,  owned:false, name:'Global X AI & Technology ETF',   ticker:'AIQ',  tag:'AI・半導体',  pct:4.73, price:'$32.14',  fee:'0.680%', vol:'2.8×' },
  { rank:3,  owned:false, name:'VanEck Defense ETF',             ticker:'DFND', tag:'防衛・地政学', pct:4.18, price:'$41.88',  fee:'0.550%', vol:'4.1×' },
  { rank:4,  owned:true,  name:'eMAXIS Slim 全世界株（AC）',      ticker:'—',    tag:'全世界',      pct:3.61, price:'¥28,440', fee:'0.058%', vol:null   },
  { rank:5,  owned:true,  name:'SBI・V・S&P500インデックスF',     ticker:'—',    tag:'米国',        pct:3.44, price:'¥31,220', fee:'0.094%', vol:null   },
  { rank:6,  owned:true,  name:'ニッセイ外国株式インデックスF',    ticker:'—',    tag:'先進国',      pct:3.31, price:'¥58,110', fee:'0.094%', vol:null   },
  { rank:7,  owned:false, name:'WisdomTree India Earnings ETF',  ticker:'EPI',  tag:'インド',      pct:2.94, price:'$34.72',  fee:'0.850%', vol:'2.1×' },
  { rank:8,  owned:true,  name:'NEXT FUNDS TOPIX ETF',           ticker:'412A', tag:'日本株',      pct:2.41, price:'¥2,521',  fee:'0.078%', vol:null   },
  { rank:9,  owned:true,  name:'ニッセイTOPIXインデックスF',       ticker:'—',    tag:'日本株',      pct:2.18, price:'¥18,840', fee:'0.143%', vol:null   },
  { rank:10, owned:false, name:'SPDR Gold Shares ETF',           ticker:'GLD',  tag:'コモディティ', pct:1.82, price:'$218.40', fee:'0.400%', vol:'0.9×' },
]

// ─── Helpers ───────────────────────────────────────────────────
const fmtPct   = v => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`
const pctColor = v => v >= 0 ? C.up : C.down

function useTime() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

const sendPrompt = t => {
  if (typeof window !== 'undefined' && window.sendPrompt) window.sendPrompt(t)
  else console.log('[sendPrompt]', t)
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

// feeColor: 低コスト(<0.1%) 緑 / 中(0.1-0.5%) 黒 / 高(>0.5%) 赤
function feeColor(feeStr) {
  const v = parseFloat(feeStr)
  if (v < 0.1)  return C.up
  if (v <= 0.5) return C.ink
  return C.down
}

function SummaryCard({ label, value, sub, valueColor }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
      padding:'18px 20px', boxShadow:'0 1px 6px rgba(0,0,0,.05)',
      display:'flex', flexDirection:'column', gap:5,
      transition:'box-shadow .2s ease, transform .2s ease' }}>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700,
        color:C.muted, letterSpacing:'0.05em', textTransform:'uppercase' }}>{label}</div>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:24, fontWeight:500,
        color:valueColor||C.ink, letterSpacing:'-0.03em', lineHeight:1.2 }}>{value}</div>
      {sub && <div style={{ fontFamily:"'Syne',sans-serif", fontSize:11, color:C.muted }}>{sub}</div>}
    </div>
  )
}

const COL = '32px 1fr 90px 80px 80px 70px 52px'

// ─── RankingPage ───────────────────────────────────────────────
export default function RankingPage() {
  const [period, setPeriod] = useState('1D')
  const [cat,    setCat   ] = useState('all')
  const [region, setRegion] = useState('all')
  const now = useTime()

  const fmtJSTFull = date => {
    const d = date.toLocaleDateString('ja-JP',{ timeZone:'Asia/Tokyo', year:'numeric', month:'2-digit', day:'2-digit' })
    const t = date.toLocaleTimeString('ja-JP',{ timeZone:'Asia/Tokyo', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false })
    return `${d} ${t} JST`
  }

  return (
    <div style={{ background:C.bg, fontFamily:"'Syne',sans-serif", color:C.ink }}>

      {/* sub-header */}
      <div style={{ background:'rgba(248,247,244,.95)', backdropFilter:'blur(12px)',
        borderBottom:`1px solid ${C.border}`, padding:'0 28px', height:48,
        display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:C.subtle, letterSpacing:'0.04em' }}>
          {fmtJSTFull(now)}
        </div>
      </div>

      <main style={{ maxWidth:1060, margin:'0 auto', padding:'22px 24px 56px' }}>

        {/* Filters */}
        <section style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap',
          marginBottom:20, padding:'12px 16px',
          background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
          boxShadow:'0 1px 6px rgba(0,0,0,.04)' }}>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {PERIODS.map(p => {
              const active=period===p
              return (
                <button key={p} onClick={() => setPeriod(p)} style={{
                  fontFamily:"'DM Mono',monospace", fontWeight:500, fontSize:12,
                  padding:'5px 13px', borderRadius:20,
                  border:active?'none':`0.5px solid ${C.border}`,
                  background:active?C.ink:'transparent',
                  color:active?'#FFFFFF':C.subtle, cursor:'pointer', transition:'all .15s' }}>
                  {p}
                </button>
              )
            })}
          </div>
          <div style={{ width:1, height:22, background:C.border, flexShrink:0 }}/>
          <select value={cat} onChange={e => setCat(e.target.value)} style={{
            fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:500,
            padding:'6px 28px 6px 12px', border:`0.5px solid ${C.border}`,
            borderRadius:8, background:C.card, color:C.subtle, cursor:'pointer',
            appearance:'none', backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%238C8C8C' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center' }}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={region} onChange={e => setRegion(e.target.value)} style={{
            fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:500,
            padding:'6px 28px 6px 12px', border:`0.5px solid ${C.border}`,
            borderRadius:8, background:C.card, color:C.subtle, cursor:'pointer',
            appearance:'none', backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%238C8C8C' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center' }}>
            {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </section>

        {/* Summary Cards */}
        <section style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:22 }}>
          <SummaryCard label="対象ファンド数" value="1,284" sub="ETF 412 / 投信 872"/>
          <SummaryCard label="上昇ファンド"   value="847"   sub="1,284件中 66%が上昇中" valueColor={C.up}/>
          <SummaryCard label={`平均上昇率（${period}）`} value="+1.84%" sub="あなたのPF +2.31%" valueColor={C.up}/>
        </section>

        {/* Ranking Table */}
        <section>
          <div style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:16, overflow:'hidden', boxShadow:'0 2px 14px rgba(0,0,0,.05)' }}>

            {/* head */}
            <div style={{ display:'grid', gridTemplateColumns:COL, padding:'10px 20px',
              background:'#F3F1EC', borderBottom:`1px solid ${C.border}`, gap:12, alignItems:'center' }}>
              {['#','ファンド名','上昇率','基準価額','信託報酬（年率）','出来高比',''].map((h,i) => (
                <div key={i} style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700,
                  color:C.muted, letterSpacing:'0.05em', textTransform:'uppercase',
                  textAlign:i>=2?'center':'left' }}>{h}</div>
              ))}
            </div>

            {/* rows */}
            {FUNDS.map((fund, idx) => {
              const isTop3  = fund.rank <= 3
              const subCol  = fund.owned ? '#4A3A1A' : C.subtle
              return (
                <div key={fund.rank}
                  onClick={() => sendPrompt(`${fund.name}の詳細分析をして`)}
                  style={{ display:'grid', gridTemplateColumns:COL, padding:'12px 20px',
                    gap:12, alignItems:'center',
                    background:fund.owned ? C.goldLight : C.card,
                    borderBottom:idx<FUNDS.length-1?`1px solid ${fund.owned?'#E8D9A8':C.border}`:'none',
                    cursor:'pointer', transition:'background .15s' }}>

                  {/* rank */}
                  <div style={{ fontFamily:"'DM Mono',monospace", fontWeight:500,
                    fontSize:isTop3?16:13, color:isTop3?C.gold:C.muted,
                    textAlign:'center', letterSpacing:'-0.02em' }}>{fund.rank}</div>

                  {/* name */}
                  <div style={{ display:'flex', flexDirection:'column', gap:4, minWidth:0 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13,
                      color:C.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {fund.name}
                      {fund.ticker !== '—' && (
                        <span style={{ fontFamily:"'DM Mono',monospace", fontWeight:400,
                          fontSize:11, color:subCol, marginLeft:6 }}>({fund.ticker})</span>
                      )}
                    </div>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      <RankCatTag label={fund.tag}/>
                      {fund.owned && <OwnedBadge/>}
                    </div>
                  </div>

                  {/* pct */}
                  <div style={{ fontFamily:"'DM Mono',monospace", fontWeight:500, fontSize:14,
                    color:pctColor(fund.pct), textAlign:'center', letterSpacing:'-0.02em' }}>
                    {fmtPct(fund.pct)}
                  </div>

                  {/* price */}
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12,
                    color:subCol, textAlign:'center' }}>{fund.price}</div>

                  {/* fee */}
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:500,
                    color:feeColor(fund.fee), textAlign:'center', letterSpacing:'0.01em' }}>
                    {fund.fee}
                  </div>

                  {/* vol */}
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12,
                    color:fund.vol?C.up:'transparent', textAlign:'center',
                    fontWeight:fund.vol?500:400 }}>{fund.vol ?? '—'}</div>

                  <div/>
                </div>
              )
            })}
          </div>
        </section>

        {/* Pagination */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginTop:22 }}>
          <button disabled style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600,
            padding:'7px 16px', border:`1px solid ${C.border}`, borderRadius:8,
            background:C.card, color:C.muted, opacity:.4, cursor:'not-allowed' }}>← 前へ</button>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:C.subtle,
            background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'7px 16px' }}>
            1 / 52ページ（1,284件）
          </div>
          <button onClick={() => sendPrompt('ランキング11位以降を教えて')}
            style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600,
              padding:'7px 16px', border:`1px solid ${C.border}`, borderRadius:8,
              background:C.card, color:C.subtle, cursor:'pointer', transition:'all .15s' }}>次へ →</button>
        </div>

        {/* Footer note */}
        <div style={{ marginTop:22, padding:'11px 16px',
          background:'rgba(201,168,76,0.07)', border:'1px solid rgba(201,168,76,0.25)',
          borderRadius:10, fontFamily:"'Syne',sans-serif", fontSize:11, color:C.goldText }}>
          黄背景 = あなたの保有ファンド｜出来高比 = 平常時比｜データ遅延 最大15分
        </div>
      </main>
    </div>
  )
}
