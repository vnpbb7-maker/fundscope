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
  downBg:    '#FAF0EC',
  border:    '#E8E5DE',
  muted:     '#8C8C8C',
  subtle:    '#4A4A5A',
}

// ─── Mock Data ─────────────────────────────────────────────────
const SECTORS = [
  { id:'ai',      name:'AI・半導体',        pct: 3.82, etf:'SOXX / SMH',  hot:true  },
  { id:'defense', name:'防衛・地政学',      pct: 2.41, etf:'DFND / ITA',  hot:false },
  { id:'energy',  name:'クリーンエネルギー', pct: 1.73, etf:'ICLN / QCLN', hot:false },
  { id:'health',  name:'ヘルスケア',        pct: 1.20, etf:'XLV / VHT',   hot:false },
  { id:'india',   name:'インド株',          pct: 0.88, etf:'INDA / 1678', hot:false },
  { id:'gold',    name:'金・コモディティ',   pct: 0.44, etf:'GLD / GSG',   hot:false },
  { id:'reit',    name:'不動産・REIT',      pct:-0.31, etf:'IYR / VNQ',   hot:false },
  { id:'bond',    name:'債券',              pct:-0.58, etf:'AGG / BND',   hot:false },
]

const SPARK_DATA = {
  '1D':{ SOXX:[60,68,72,65,80,88,92,100], DFND:[55,62,58,70,74,78,82,90], eMAXIS:[50,55,60,63,70,74,78,82], AIQ:[48,56,60,67,72,77,83,88], SBI:[52,58,63,67,71,74,79,84], NIFTY:[45,50,55,58,62,66,70,75] },
  '1W':{ SOXX:[40,50,55,65,72,80,90,100], DFND:[42,52,55,65,70,76,82,90], eMAXIS:[44,50,56,62,67,72,76,82], AIQ:[38,48,55,63,70,75,82,88], SBI:[45,52,58,64,68,73,78,84], NIFTY:[36,44,50,56,60,65,70,75] },
  '1M':{ SOXX:[20,35,45,55,65,78,88,100], DFND:[25,38,50,60,68,75,83,90], eMAXIS:[30,40,50,58,65,70,76,82], AIQ:[22,36,48,60,68,75,82,88], SBI:[28,40,52,60,66,72,78,84], NIFTY:[20,32,44,52,58,64,70,75] },
  '3M':{ SOXX:[5,20,35,50,65,80,90,100],  DFND:[10,25,40,55,67,75,84,90], eMAXIS:[15,28,42,55,63,70,76,82], AIQ:[8,22,38,55,65,74,82,88],  SBI:[12,26,40,56,65,72,78,84], NIFTY:[6,18,32,46,55,62,70,75] },
}

const FUNDS = [
  { id:'SOXX',   name:'iShares Semiconductor ETF',    ticker:'SOXX', category:'AI・半導体',  reason:'Nvidia決算超過・Blackwellフル稼働で需要が急増',   pct:5.24, owned:false, sparkKey:'SOXX'   },
  { id:'DFND',   name:'VanEck Defense ETF',           ticker:'DFND', category:'防衛・地政学', reason:'NATO加盟国の国防費増加・欧州防衛強化が加速',     pct:4.18, owned:false, sparkKey:'DFND'   },
  { id:'eMAXIS', name:'eMAXIS Slim 全世界株（AC）',    ticker:'—',    category:'マクロ',      reason:'円安進行・米国株高・新興国回復が追い風',         pct:3.61, owned:true,  sparkKey:'eMAXIS' },
  { id:'AIQ',    name:'Global X AI & Technology ETF', ticker:'AIQ',  category:'AI・半導体',  reason:'エージェントAI需要急増・DCサーバー投資拡大',     pct:3.49, owned:false, sparkKey:'AIQ'    },
  { id:'SBI',    name:'SBI・V・S&P500インデックスF',   ticker:'—',    category:'マクロ',      reason:'Fed利下げ期待・S&P500最高値更新が寄与',          pct:2.88, owned:true,  sparkKey:'SBI'    },
  { id:'NIFTY',  name:'NEXT FUNDS インド株(Nifty50)', ticker:'1678', category:'新興国',      reason:'モディ政権インフラ投資・製造業シフト加速',       pct:2.11, owned:false, sparkKey:'NIFTY'  },
]

const SUB_TABS = [
  { id:'all',     label:'全て' },
  { id:'ai',      label:'AI・半導体' },
  { id:'defense', label:'防衛・地政学' },
  { id:'energy',  label:'エネルギー' },
  { id:'health',  label:'ヘルスケア' },
  { id:'owned',   label:'あなたの保有' },
]
const PERIODS = ['1D','1W','1M','3M']

const TAG_COLORS = {
  'AI・半導体':  { bg:'#EAF0FF', color:'#2752B8' },
  '防衛・地政学':{ bg:'#FFF0E8', color:'#B84427' },
  'マクロ':      { bg:'#F0FBF7', color:'#0A6045' },
  '新興国':      { bg:'#FFF8E8', color:'#8B6010' },
}

// ─── Helpers ───────────────────────────────────────────────────
const fmtPct   = v => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`
const pctColor = v => v >= 0 ? C.up    : C.down
const pctBg    = v => v >= 0 ? C.upBg  : C.downBg

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
      fontFamily:"'Syne',sans-serif", borderRadius:6, padding:'2px 8px',
      whiteSpace:'nowrap', letterSpacing:'0.02em' }}>
      保有中
    </span>
  )
}

function CatTag({ label }) {
  const s = TAG_COLORS[label] || { bg:'#F0F0F0', color:'#444' }
  return (
    <span style={{ fontSize:10, fontFamily:"'Syne',sans-serif", fontWeight:600,
      background:s.bg, color:s.color, borderRadius:4, padding:'2px 7px', whiteSpace:'nowrap' }}>
      {label}
    </span>
  )
}

function SparkChart({ values, positive }) {
  const max=Math.max(...values), min=Math.min(...values), range=max-min||1
  const W=64, H=20, barW=6, gap=2, color=positive?C.up:C.down
  return (
    <svg width={W} height={H} style={{ display:'block' }}>
      {values.map((v,i) => {
        const barH=Math.max(3,((v-min)/range)*(H-4))
        return <rect key={i} x={i*(barW+gap)} y={H-barH} width={barW} height={barH}
          rx={1.5} fill={color} opacity={0.7+(i/values.length)*0.3}/>
      })}
    </svg>
  )
}

function HeatBar({ pct, maxAbs=4 }) {
  const ratio=Math.min(Math.abs(pct)/maxAbs,1)
  return (
    <div style={{ width:'100%', height:4, background:'rgba(0,0,0,.07)', borderRadius:2, marginTop:8, overflow:'hidden' }}>
      <div style={{ width:`${ratio*100}%`, height:'100%', background:pctColor(pct), borderRadius:2, transition:'width .6s ease' }}/>
    </div>
  )
}

function SectorCard({ sector }) {
  const isHot=sector.hot
  return (
    <div onClick={() => sendPrompt(`${sector.name}の注目ETFを詳しく分析して`)}
      style={{ background:isHot?'#FFFDF5':C.card,
        border:`1.5px solid ${isHot?C.gold:C.border}`,
        borderRadius:12, padding:'14px 16px',
        display:'flex', flexDirection:'column', gap:4,
        boxShadow:isHot?'0 4px 20px rgba(201,168,76,.15)':'0 1px 6px rgba(0,0,0,.05)',
        position:'relative', overflow:'hidden', cursor:'pointer',
        transition:'all .2s ease' }}>
      {isHot && (
        <div style={{ position:'absolute', top:8, right:10, fontSize:9, fontFamily:"'Syne',sans-serif",
          fontWeight:700, color:C.gold, letterSpacing:'0.08em', textTransform:'uppercase' }}>
          🔥 最熱
        </div>
      )}
      <div style={{ fontSize:12, fontFamily:"'Syne',sans-serif", fontWeight:600, color:C.ink, lineHeight:1.3 }}>{sector.name}</div>
      <div style={{ fontSize:20, fontFamily:"'DM Mono',monospace", fontWeight:500, color:pctColor(sector.pct), letterSpacing:'-0.02em' }}>{fmtPct(sector.pct)}</div>
      <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:C.muted }}>{sector.etf}</div>
      <HeatBar pct={sector.pct}/>
    </div>
  )
}

// ─── TrendPage ─────────────────────────────────────────────────
export default function TrendPage() {
  const [tab, setTab]       = useState('all')
  const [period, setPeriod] = useState('1D')
  const now = useTime()

  const filtered = FUNDS.filter(f => {
    if (tab === 'all')     return true
    if (tab === 'owned')   return f.owned
    if (tab === 'ai')      return f.category === 'AI・半導体'
    if (tab === 'defense') return f.category === '防衛・地政学'
    if (tab === 'energy')  return f.category === 'エネルギー'
    if (tab === 'health')  return f.category === 'ヘルスケア'
    return true
  })

  return (
    <div style={{ background:C.bg, fontFamily:"'Syne',sans-serif", color:C.ink }}>

      {/* sub-header */}
      <div style={{ background:'rgba(248,247,244,.95)', backdropFilter:'blur(12px)',
        borderBottom:`1px solid ${C.border}`, padding:'0 24px', height:52,
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#1DB954',
            animation:'pulseDot 1.6s ease-in-out infinite' }}/>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:11,
            color:'#1DB954', letterSpacing:'0.08em' }}>LIVE</span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:C.subtle, marginLeft:4 }}>
            {now.toLocaleTimeString('ja-JP',{ timeZone:'Asia/Tokyo', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false })} JST
          </span>
        </div>
        <div style={{ display:'flex', background:'rgba(0,0,0,.05)', borderRadius:8, padding:3, gap:2 }}>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              fontFamily:"'DM Mono',monospace", fontWeight:500, fontSize:11,
              padding:'4px 10px', borderRadius:6, border:'none', cursor:'pointer',
              background:period===p?C.gold:'transparent',
              color:period===p?C.ink:C.subtle, letterSpacing:'0.04em', transition:'all .15s' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* category sub-tabs */}
      <div style={{ padding:'0 24px', borderBottom:`1px solid ${C.border}`,
        display:'flex', gap:4, overflowX:'auto', background:C.card }}>
        {SUB_TABS.map(t => {
          const isOwned=t.id==='owned', isActive=tab===t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              fontFamily:"'Syne',sans-serif", fontWeight:isActive?700:500, fontSize:13,
              padding:'13px 16px', border:'none',
              borderBottom:isActive?`2.5px solid ${C.gold}`:'2.5px solid transparent',
              background:isOwned?(isActive?C.goldLight:'rgba(245,237,213,.5)'):'transparent',
              color:isOwned?C.goldText:(isActive?C.ink:C.subtle),
              cursor:'pointer', whiteSpace:'nowrap',
              borderRadius:isOwned?'8px 8px 0 0':0, marginBottom:-1, transition:'all .15s' }}>
              {t.label}
            </button>
          )
        })}
      </div>

      <main style={{ maxWidth:1080, margin:'0 auto', padding:'26px 24px 56px' }}>
        {/* Sector Heatmap */}
        <section style={{ marginBottom:32 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:C.ink, margin:0 }}>
              セクター ヒートマップ
            </h2>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:C.muted }}>{period}</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {SECTORS.map(s => <SectorCard key={s.id} sector={s}/>)}
          </div>
        </section>

        {/* Fund List */}
        <section>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:C.ink, margin:0 }}>
              注目ファンドリスト
            </h2>
            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:600,
              color:C.gold, background:C.goldLight, borderRadius:4, padding:'2px 8px' }}>
              AIが理由付き
            </span>
          </div>

          <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`,
            overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.05)' }}>
            {/* thead */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 2.5fr 80px 90px',
              padding:'10px 20px', background:'#F3F1EC', borderBottom:`1px solid ${C.border}`, gap:12 }}>
              {['ファンド名','カテゴリ','AI分析理由','推移','上昇率'].map(h => (
                <div key={h} style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700,
                  color:C.muted, letterSpacing:'0.04em', textTransform:'uppercase' }}>{h}</div>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding:'40px 20px', textAlign:'center', color:C.muted,
                fontFamily:"'Syne',sans-serif", fontSize:14 }}>
                このカテゴリの保有ファンドはありません
              </div>
            ) : filtered.map((fund, idx) => {
              const sparkVals = SPARK_DATA[period][fund.sparkKey] || [50,55,60,65,70,75,80,85]
              return (
                <div key={fund.id}
                  onClick={() => sendPrompt(`${fund.name}の詳細分析をして`)}
                  style={{ display:'grid', gridTemplateColumns:'2fr 1fr 2.5fr 80px 90px',
                    padding:'13px 20px', gap:12, alignItems:'center',
                    background:fund.owned?C.goldLight:'transparent',
                    borderBottom:idx<filtered.length-1?`1px solid ${C.border}`:'none',
                    cursor:'pointer', transition:'background .15s' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13,
                      color:C.ink, lineHeight:1.3 }}>{fund.name}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11,
                        color:fund.owned?C.goldText:C.muted }}>{fund.ticker}</span>
                      {fund.owned && <OwnedBadge/>}
                    </div>
                  </div>
                  <div><CatTag label={fund.category}/></div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12,
                    color:C.ink, lineHeight:1.5 }}>{fund.reason}</div>
                  <div style={{ display:'flex', justifyContent:'center' }}>
                    <SparkChart values={sparkVals} positive={fund.pct>=0}/>
                  </div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontWeight:500, fontSize:16,
                    color:pctColor(fund.pct), background:pctBg(fund.pct),
                    borderRadius:8, padding:'4px 10px', textAlign:'center', letterSpacing:'-0.01em' }}>
                    {fmtPct(fund.pct)}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <footer style={{ marginTop:28, padding:'14px 0', borderTop:`1px solid ${C.border}`,
          fontFamily:"'Syne',sans-serif", fontSize:11, color:C.muted }}>
          ◆ = あなたの保有ファンド｜データ: Yahoo Finance / 東証｜AI分析: Claude claude-opus-4-6
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
