import { useState, useEffect } from 'react'
import {
  DEFAULT_HOLDINGS,
  CATEGORIES,
  ACCOUNTS,
  METHODS,
  CATEGORY_STYLES,
} from '../constants/portfolio'

// ─── Color Tokens ─────────────────────────────────────────────
const C = {
  bg:        '#F8F7F4',
  card:      '#FFFFFF',
  gold:      '#C9A84C',
  goldLight: '#F5EDD5',
  goldText:  '#7A5A10',
  ink:       '#1A1A2E',
  up:        '#0F6E56',
  down:      '#993C1D',
  border:    '#E8E5DE',
  muted:     '#8C8C8C',
  subtle:    '#4A4A5A',
}

const STORAGE_KEY = 'fundscope_holdings'

// ─── Helpers ───────────────────────────────────────────────────
const fmtYen = n => n != null ? `¥${Number(n).toLocaleString()}` : '—'

function CatBadge({ label }) {
  const s = CATEGORY_STYLES[label] || { bg:'#F0F0F0', color:'#444' }
  return (
    <span style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:600,
      background:s.bg, color:s.color, borderRadius:4, padding:'2px 7px', whiteSpace:'nowrap' }}>
      {label}
    </span>
  )
}

function AccBadge({ label }) {
  const MAP = {
    'NISA成長':   { bg:'#E1F5EE', color:'#085041' },
    'NISAつみたて':{ bg:'#E6F1FB', color:'#0C447C' },
    '特定口座':   { bg:'#F1EFE8', color:'#444441' },
    '一般口座':   { bg:'#F1EFE8', color:'#444441' },
    'iDeCo':      { bg:'#EEEDFE', color:'#3C3489' },
  }
  const s = MAP[label] || { bg:'#F0F0F0', color:'#444' }
  return (
    <span style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:600,
      background:s.bg, color:s.color, borderRadius:4, padding:'2px 7px', whiteSpace:'nowrap' }}>
      {label}
    </span>
  )
}

// ─── Empty holding template ────────────────────────────────────
function emptyHolding(id) {
  return {
    id,
    name: '',
    shortName: '',
    ticker: '',
    category: CATEGORIES[0],
    account: ACCOUNTS[0],
    method: METHODS[0],
    monthlyAmount: 10000,
    units: null,
    unitPrice: null,
    dayOfMonth: 5,
    startDate: '',
    memo: '',
  }
}

// ─── Inline field style ────────────────────────────────────────
const inputSt = {
  fontFamily:"'Syne',sans-serif",
  fontSize: 12,
  padding: '6px 10px',
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  background: C.card,
  color: C.ink,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelSt = {
  fontFamily:"'Syne',sans-serif",
  fontSize: 10,
  fontWeight: 700,
  color: C.muted,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: 4,
}

function Field({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
      <label style={labelSt}>{label}</label>
      {children}
    </div>
  )
}

// ─── Hold Form (inline expand) ────────────────────────────────
function HoldingForm({ holding, onSave, onCancel }) {
  const [form, setForm] = useState({ ...holding })

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const isETF = form.units != null || form.ticker !== ''

  return (
    <div style={{ background:'#FAFAF8', border:`1.5px solid ${C.gold}`, borderRadius:14,
      padding:'20px 24px', marginTop:12, display:'flex', flexDirection:'column', gap:16 }}>

      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:C.ink }}>
        {holding.name ? `編集: ${holding.shortName || holding.name}` : '新規ファンド追加'}
      </div>

      {/* row 1 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="ファンド正式名">
          <input style={inputSt} value={form.name}
            onChange={e => set('name', e.target.value)} placeholder="例: eMAXIS Slim 全世界株式" />
        </Field>
        <Field label="省略名">
          <input style={inputSt} value={form.shortName}
            onChange={e => set('shortName', e.target.value)} placeholder="例: eMAXIS AC" />
        </Field>
      </div>

      {/* row 2 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
        <Field label="ティッカー（ETFのみ）">
          <input style={inputSt} value={form.ticker}
            onChange={e => set('ticker', e.target.value)} placeholder="例: 412A" />
        </Field>
        <Field label="カテゴリ">
          <select style={inputSt} value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="口座">
          <select style={inputSt} value={form.account} onChange={e => set('account', e.target.value)}>
            {ACCOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
      </div>

      {/* row 3 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12 }}>
        <Field label="積立方法">
          <select style={inputSt} value={form.method} onChange={e => set('method', e.target.value)}>
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="毎月積立額（円）">
          <input style={inputSt} type="number" value={form.monthlyAmount ?? ''}
            onChange={e => set('monthlyAmount', e.target.value ? Number(e.target.value) : null)}
            placeholder="例: 50000" />
        </Field>
        <Field label="口数（ETFのみ）">
          <input style={inputSt} type="number" value={form.units ?? ''}
            onChange={e => set('units', e.target.value ? Number(e.target.value) : null)}
            placeholder="例: 11" />
        </Field>
        <Field label="単価（円）">
          <input style={inputSt} type="number" value={form.unitPrice ?? ''}
            onChange={e => set('unitPrice', e.target.value ? Number(e.target.value) : null)}
            placeholder="例: 2340" />
        </Field>
      </div>

      {/* row 4 */}
      <div style={{ display:'grid', gridTemplateColumns:'120px 160px 1fr', gap:12 }}>
        <Field label="引落日">
          <input style={inputSt} type="number" min={1} max={31}
            value={form.dayOfMonth} onChange={e => set('dayOfMonth', Number(e.target.value))} />
        </Field>
        <Field label="開始日">
          <input style={inputSt} type="date" value={form.startDate}
            onChange={e => set('startDate', e.target.value)} />
        </Field>
        <Field label="メモ">
          <input style={inputSt} value={form.memo}
            onChange={e => set('memo', e.target.value)} placeholder="任意メモ" />
        </Field>
      </div>

      {/* buttons */}
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
        <button onClick={onCancel}
          style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:600,
            padding:'7px 18px', borderRadius:8, border:`1px solid ${C.border}`,
            background:'transparent', color:C.subtle, cursor:'pointer' }}>
          キャンセル
        </button>
        <button onClick={() => onSave(form)}
          style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700,
            padding:'7px 20px', borderRadius:8, border:'none',
            background:C.ink, color:'#fff', cursor:'pointer' }}>
          保存
        </button>
      </div>
    </div>
  )
}

// ─── Summary Bar ───────────────────────────────────────────────
function SummaryBar({ holdings }) {
  const monthly = holdings.reduce((sum, h) => sum + (h.monthlyAmount || 0), 0)
  const etfMonthly = holdings.filter(h => h.units).reduce((sum, h) => {
    return sum + (h.units || 0) * (h.unitPrice || 0)
  }, 0)

  const cards = [
    { label:'登録銘柄数', value:`${holdings.length}件` },
    { label:'月次積立（現金＋CC）', value:fmtYen(monthly) },
    { label:'ETF月次想定額', value:fmtYen(etfMonthly || null) },
    { label:'口座数', value:`${[...new Set(holdings.map(h=>h.account))].length}口座` },
  ]

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
      {cards.map(c => (
        <div key={c.label} style={{ background:C.card, border:`1px solid ${C.border}`,
          borderRadius:12, padding:'14px 18px', display:'flex', flexDirection:'column', gap:4 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700,
            color:C.muted, letterSpacing:'0.04em', textTransform:'uppercase' }}>{c.label}</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:20, fontWeight:500,
            color:C.ink, letterSpacing:'-0.02em' }}>{c.value}</div>
        </div>
      ))}
    </div>
  )
}

// ─── PortfolioSettingsPage ─────────────────────────────────────
export default function PortfolioSettingsPage() {
  const [holdings, setHoldings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : DEFAULT_HOLDINGS
    } catch {
      return DEFAULT_HOLDINGS
    }
  })

  const [editingId, setEditingId] = useState(null)  // null | id | 'new'
  const [nextId,    setNextId   ] = useState(() =>
    Math.max(0, ...DEFAULT_HOLDINGS.map(h => h.id)) + 1
  )
  const [jsonMode, setJsonMode] = useState(false)
  const [jsonText, setJsonText] = useState('')
  const [jsonErr,  setJsonErr ] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings))
  }, [holdings])

  function saveHolding(form) {
    if (editingId === 'new') {
      setHoldings(prev => [...prev, { ...form, id: nextId }])
      setNextId(n => n + 1)
    } else {
      setHoldings(prev => prev.map(h => h.id === editingId ? { ...form, id: h.id } : h))
    }
    setEditingId(null)
  }

  function deleteHolding(id) {
    if (!window.confirm('この銘柄を削除しますか？')) return
    setHoldings(prev => prev.filter(h => h.id !== id))
    if (editingId === id) setEditingId(null)
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(holdings, null, 2)], { type:'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'fundscope_holdings.json'
    a.click()
  }

  function openImport() {
    setJsonText(JSON.stringify(holdings, null, 2))
    setJsonErr('')
    setJsonMode(true)
  }

  function applyJSON() {
    try {
      const parsed = JSON.parse(jsonText)
      if (!Array.isArray(parsed)) throw new Error('配列形式で入力してください')
      setHoldings(parsed)
      setJsonMode(false)
      setJsonErr('')
    } catch (e) {
      setJsonErr(e.message)
    }
  }

  const newHolding = emptyHolding('new')

  return (
    <div style={{ background:C.bg, minHeight:'calc(100vh - 58px)', fontFamily:"'Syne',sans-serif" }}>
      <div style={{ maxWidth:1060, margin:'0 auto', padding:'26px 24px 64px' }}>

        {/* Header row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:C.ink, margin:0 }}>
              マイPF設定
            </h1>
            <p style={{ fontFamily:"'Syne',sans-serif", fontSize:12, color:C.muted, marginTop:4 }}>
              保有ファンド・積立設定を管理します
            </p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={openImport}
              style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:600,
                padding:'7px 16px', border:`1px solid ${C.border}`, borderRadius:8,
                background:C.card, color:C.subtle, cursor:'pointer' }}>
              JSONで編集
            </button>
            <button onClick={exportJSON}
              style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:600,
                padding:'7px 16px', border:`1px solid ${C.border}`, borderRadius:8,
                background:C.card, color:C.subtle, cursor:'pointer' }}>
              ↓ エクスポート
            </button>
            <button
              onClick={() => { setEditingId('new') }}
              style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700,
                padding:'7px 18px', border:'none', borderRadius:8,
                background:C.ink, color:'#fff', cursor:'pointer', display:'flex',
                alignItems:'center', gap:6 }}>
              ＋ ファンド追加
            </button>
          </div>
        </div>

        {/* Summary */}
        <SummaryBar holdings={holdings}/>

        {/* JSON Editor */}
        {jsonMode && (
          <div style={{ background:C.card, border:`1.5px solid ${C.gold}`, borderRadius:14,
            padding:'20px 24px', marginBottom:20 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13,
              color:C.ink, marginBottom:10 }}>JSON直接編集</div>
            <textarea value={jsonText} onChange={e => setJsonText(e.target.value)}
              style={{ width:'100%', height:260, fontFamily:"'DM Mono',monospace", fontSize:11,
                padding:'10px', border:`1px solid ${C.border}`, borderRadius:8,
                background:'#FAFAF8', color:C.ink, resize:'vertical', outline:'none' }}/>
            {jsonErr && (
              <div style={{ color:C.down, fontFamily:"'DM Mono',monospace", fontSize:11, marginTop:6 }}>
                ⚠ {jsonErr}
              </div>
            )}
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:10 }}>
              <button onClick={() => setJsonMode(false)}
                style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:600,
                  padding:'7px 16px', border:`1px solid ${C.border}`, borderRadius:8,
                  background:'transparent', color:C.subtle, cursor:'pointer' }}>キャンセル</button>
              <button onClick={applyJSON}
                style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700,
                  padding:'7px 18px', border:'none', borderRadius:8,
                  background:C.ink, color:'#fff', cursor:'pointer' }}>適用</button>
            </div>
          </div>
        )}

        {/* New holding form */}
        {editingId === 'new' && (
          <HoldingForm
            holding={newHolding}
            onSave={saveHolding}
            onCancel={() => setEditingId(null)}
          />
        )}

        {/* Holdings list */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16,
          overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.05)', marginTop:16 }}>

          {/* thead */}
          <div style={{ display:'grid',
            gridTemplateColumns:'2.5fr 1fr 1fr 1fr 90px 90px 90px 80px',
            padding:'10px 20px', background:'#F3F1EC',
            borderBottom:`1px solid ${C.border}`, gap:8, alignItems:'center' }}>
            {['ファンド名','カテゴリ','口座','方法','月額/口数','引落日','開始日','操作'].map(h => (
              <div key={h} style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700,
                color:C.muted, letterSpacing:'0.04em', textTransform:'uppercase' }}>{h}</div>
            ))}
          </div>

          {holdings.length === 0 ? (
            <div style={{ padding:'40px 20px', textAlign:'center', color:C.muted,
              fontFamily:"'Syne',sans-serif", fontSize:14 }}>
              保有ファンドが登録されていません。「＋ ファンド追加」から追加してください。
            </div>
          ) : holdings.map((h, idx) => (
            <div key={h.id}>
              <div
                style={{ display:'grid', gridTemplateColumns:'2.5fr 1fr 1fr 1fr 90px 90px 90px 80px',
                  padding:'12px 20px', gap:8, alignItems:'center',
                  background:editingId === h.id ? C.goldLight : C.card,
                  borderBottom:idx < holdings.length - 1 ? `1px solid ${C.border}` : 'none',
                  transition:'background .15s' }}>

                {/* name */}
                <div style={{ display:'flex', flexDirection:'column', gap:3, minWidth:0 }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:12, color:C.ink,
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}
                    title={h.name}>
                    {h.shortName || h.name}
                    {h.ticker && (
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10,
                        color:C.muted, marginLeft:6 }}>({h.ticker})</span>
                    )}
                  </div>
                  {h.memo && (
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10,
                      color:C.muted, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {h.memo}
                    </div>
                  )}
                </div>

                <CatBadge label={h.category}/>
                <AccBadge label={h.account}/>

                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:11, color:C.subtle }}>
                  {h.method}
                </div>

                {/* monthly / units */}
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:C.ink }}>
                  {h.units != null
                    ? `${h.units}口 × ${fmtYen(h.unitPrice)}`
                    : fmtYen(h.monthlyAmount)}
                </div>

                {/* day */}
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:C.subtle }}>
                  毎月{h.dayOfMonth}日
                </div>

                {/* start date */}
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:C.subtle }}>
                  {h.startDate || '—'}
                </div>

                {/* actions */}
                <div style={{ display:'flex', gap:4 }}>
                  <button
                    onClick={() => setEditingId(editingId === h.id ? null : h.id)}
                    style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:600,
                      padding:'4px 10px', border:`1px solid ${C.border}`, borderRadius:6,
                      background:editingId===h.id?C.gold:'transparent',
                      color:editingId===h.id?C.ink:C.subtle, cursor:'pointer', transition:'all .15s' }}>
                    編集
                  </button>
                  <button onClick={() => deleteHolding(h.id)}
                    style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:600,
                      padding:'4px 8px', border:`1px solid #FCDCD4`, borderRadius:6,
                      background:'transparent', color:C.down, cursor:'pointer' }}>
                    削除
                  </button>
                </div>
              </div>

              {/* Inline edit form */}
              {editingId === h.id && (
                <div style={{ padding:'0 20px 16px', background:C.goldLight }}>
                  <HoldingForm
                    holding={h}
                    onSave={saveHolding}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div style={{ marginTop:20, padding:'11px 16px',
          background:'rgba(201,168,76,0.07)', border:'1px solid rgba(201,168,76,0.25)',
          borderRadius:10, fontFamily:"'Syne',sans-serif", fontSize:11, color:C.goldText }}>
          データはブラウザの localStorage に保存されます（localStorage キー: {STORAGE_KEY}）
        </div>
      </div>
    </div>
  )
}
