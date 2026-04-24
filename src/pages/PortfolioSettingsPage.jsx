import { useState, useEffect, useRef } from 'react'
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
  downBg:    '#FAECE7',
  border:    '#E8E5DE',
  muted:     '#8C8C8C',
  subtle:    '#4A4A5A',
}

const STORAGE_KEY = 'fundscope_holdings'

// ─── Helpers ───────────────────────────────────────────────────
const fmtYen = n =>
  n != null ? `¥${new Intl.NumberFormat('ja-JP').format(Math.round(n))}` : '—'

const fmt = n => new Intl.NumberFormat('ja-JP').format(Math.round(n))

function CatBadge({ label }) {
  const s = CATEGORY_STYLES[label] || { bg: '#F0F0F0', color: '#444' }
  return (
    <span style={{
      fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 600,
      background: s.bg, color: s.color, borderRadius: 4,
      padding: '2px 7px', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

function AccBadge({ label }) {
  const MAP = {
    'NISA成長':    { bg: '#E1F5EE', color: '#085041' },
    'NISAつみたて':{ bg: '#E6F1FB', color: '#0C447C' },
    '特定口座':    { bg: '#F1EFE8', color: '#444441' },
    '一般口座':    { bg: '#F1EFE8', color: '#444441' },
    'iDeCo':       { bg: '#EEEDFE', color: '#3C3489' },
  }
  const s = MAP[label] || { bg: '#F0F0F0', color: '#444' }
  return (
    <span style={{
      fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 600,
      background: s.bg, color: s.color, borderRadius: 4,
      padding: '2px 7px', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

// ─── Field wrapper ─────────────────────────────────────────────
const labelSt = {
  fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 700,
  color: C.muted, letterSpacing: '0.04em', textTransform: 'uppercase',
  display: 'block', marginBottom: 4,
}
const inputSt = {
  fontFamily: "'Syne',sans-serif", fontSize: 12,
  padding: '7px 10px', border: `1px solid ${C.border}`,
  borderRadius: 8, background: C.card, color: C.ink,
  width: '100%', outline: 'none', boxSizing: 'border-box',
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <label style={labelSt}>{label}</label>
      {children}
    </div>
  )
}

// ─── HoldingModal (inlined, no position:fixed) ─────────────────
function HoldingModal({ holding, onSave, onCancel, title }) {
  const [form, setForm] = useState({ ...holding })

  const set = (key, val) =>
    setForm(prev => ({ ...prev, [key]: val }))

  const isUnitType = form.units !== null && form.units !== undefined

  return (
    <div style={{
      marginTop: 24,
      background: C.card,
      border: '0.5px solid rgba(26,26,46,0.2)',
      borderRadius: 12,
      padding: 24,
    }}>
      {/* title */}
      <div style={{
        fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14,
        color: C.ink, marginBottom: 20,
      }}>
        {title}
      </div>

      {/* row 1: name */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Field label="ファンド正式名">
          <input
            style={inputSt}
            value={form.name}
            placeholder="例: eMAXIS Slim 全世界株式"
            onChange={e => set('name', e.target.value)}
          />
        </Field>
        <Field label="省略名（表示用）">
          <input
            style={inputSt}
            value={form.shortName || ''}
            placeholder="例: eMAXIS AC"
            onChange={e => set('shortName', e.target.value)}
          />
        </Field>
      </div>

      {/* row 2: ticker / category / account */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Field label="ティッカー（ETFのみ）">
          <input
            style={inputSt}
            value={form.ticker || ''}
            placeholder="例: 412A"
            onChange={e => set('ticker', e.target.value)}
          />
        </Field>
        <Field label="カテゴリ">
          <select
            style={inputSt}
            value={form.category}
            onChange={e => set('category', e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="口座">
          <select
            style={inputSt}
            value={form.account}
            onChange={e => set('account', e.target.value)}
          >
            {ACCOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
      </div>

      {/* row 3: method / monthlyAmount / units / unitPrice */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Field label="積立方法">
          <select
            style={inputSt}
            value={form.method}
            onChange={e => set('method', e.target.value)}
          >
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="月額積立（円）">
          <input
            style={inputSt}
            type="number"
            value={form.monthlyAmount ?? ''}
            placeholder="例: 50000"
            onChange={e =>
              set('monthlyAmount', e.target.value ? parseInt(e.target.value, 10) || 0 : null)
            }
          />
        </Field>
        <Field label="口数（ETFのみ）">
          <input
            style={inputSt}
            type="number"
            value={form.units ?? ''}
            placeholder="例: 11"
            onChange={e =>
              set('units', e.target.value ? parseInt(e.target.value, 10) || null : null)
            }
          />
        </Field>
        <Field label="単価（円）">
          <input
            style={inputSt}
            type="number"
            value={form.unitPrice ?? ''}
            placeholder="例: 2340"
            onChange={e =>
              set('unitPrice', e.target.value ? parseFloat(e.target.value) || null : null)
            }
          />
        </Field>
      </div>

      {/* row 4: dayOfMonth / startDate / memo */}
      <div style={{ display: 'grid', gridTemplateColumns: '100px 160px 1fr', gap: 12, marginBottom: 20 }}>
        <Field label="引落日（日）">
          <input
            style={inputSt}
            type="number"
            min={1} max={31}
            value={form.dayOfMonth ?? ''}
            onChange={e =>
              set('dayOfMonth', e.target.value ? parseInt(e.target.value, 10) : null)
            }
          />
        </Field>
        <Field label="開始日">
          <input
            style={inputSt}
            type="date"
            value={form.startDate || ''}
            onChange={e => set('startDate', e.target.value)}
          />
        </Field>
        <Field label="メモ">
          <input
            style={inputSt}
            value={form.memo || ''}
            placeholder="任意メモ"
            onChange={e => set('memo', e.target.value)}
          />
        </Field>
      </div>

      {/* action buttons */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 600,
            padding: '7px 18px', borderRadius: 8,
            border: `1px solid ${C.border}`, background: 'transparent',
            color: C.subtle, cursor: 'pointer',
          }}
        >
          キャンセル
        </button>
        <button
          onClick={() => onSave(form)}
          style={{
            fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700,
            padding: '7px 20px', borderRadius: 8,
            border: 'none', background: C.ink, color: '#fff', cursor: 'pointer',
          }}
        >
          保存する
        </button>
      </div>
    </div>
  )
}

// ─── SummaryCard ───────────────────────────────────────────────
function SummaryCard({ label, value, sub }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
      padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{
        fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 700,
        color: C.muted, letterSpacing: '0.04em', textTransform: 'uppercase',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'DM Mono',monospace", fontSize: 20, fontWeight: 500,
        color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.2,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, color: C.muted }}>
          {sub}
        </div>
      )}
    </div>
  )
}

// ─── PortfolioSettingsPage ─────────────────────────────────────
export default function PortfolioSettingsPage() {
  // ── State ────────────────────────────────────────────────────
  const [holdings,       setHoldings      ] = useState(DEFAULT_HOLDINGS)
  const [editTarget,     setEditTarget    ] = useState(null)   // holding obj | null
  const [isAdding,       setIsAdding      ] = useState(false)
  const [deleteConfirmId,setDeleteConfirmId] = useState(null)
  const [jsonText,       setJsonText      ] = useState('')
  const [jsonMode,       setJsonMode      ] = useState(false)
  const [jsonErr,        setJsonErr       ] = useState('')
  const fileInputRef = useRef(null)

  // ── localStorage: 初期読み込み ───────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) setHoldings(parsed)
      }
    } catch (e) {
      console.error('localStorage読み込みエラー:', e)
    }
  }, [])

  // ── localStorage: 変更時に保存 ───────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings))
    } catch (e) {
      console.error('localStorage保存エラー:', e)
    }
  }, [holdings])

  // ── Handlers ─────────────────────────────────────────────────
  function handleEditSave(updated) {
    setHoldings(prev => prev.map(h => h.id === updated.id ? updated : h))
    setEditTarget(null)
  }

  function handleAddSave(newH) {
    setHoldings(prev => [...prev, { ...newH, id: Date.now() }])
    setIsAdding(false)
  }

  function handleDelete(id) {
    setHoldings(prev => prev.filter(x => x.id !== id))
    setDeleteConfirmId(null)
  }

  function handleExport() {
    const json = JSON.stringify(holdings, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'fundscope_portfolio.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleFileImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result)
        if (!Array.isArray(parsed) || !parsed[0]?.name) {
          alert('JSONの形式が正しくありません')
          return
        }
        setHoldings(parsed)
        alert(`${parsed.length}件をインポートしました`)
      } catch {
        alert('JSONの解析に失敗しました')
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  function openJsonEditor() {
    setJsonText(JSON.stringify(holdings, null, 2))
    setJsonErr('')
    setJsonMode(true)
  }

  function applyJson() {
    try {
      const parsed = JSON.parse(jsonText)
      if (!Array.isArray(parsed)) throw new Error('配列形式で入力してください')
      setHoldings(parsed)
      setJsonMode(false)
      setJsonErr('')
    } catch (err) {
      setJsonErr(err.message)
    }
  }

  // ── Summary Calculations ─────────────────────────────────────
  const totalMonthly = holdings.reduce((sum, h) => {
    if (h.monthlyAmount) return sum + h.monthlyAmount
    if (h.units && h.unitPrice) return sum + h.units * h.unitPrice
    return sum
  }, 0)

  const accounts = [...new Set(holdings.map(h => h.account))]

  // ── New holding template ──────────────────────────────────────
  const newTemplate = {
    id: 0, name: '', shortName: '', ticker: '',
    category: CATEGORIES[0], account: ACCOUNTS[0], method: METHODS[0],
    monthlyAmount: 10000, units: null, unitPrice: null,
    dayOfMonth: 5, startDate: '', memo: '',
  }

  // ── Grid columns ─────────────────────────────────────────────
  const GRID = '2.2fr 1fr 1fr 1fr 140px 90px 100px'

  return (
    <div style={{ background: C.bg, minHeight: 'calc(100vh - 58px)', fontFamily: "'Syne',sans-serif" }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '26px 24px 64px' }}>

        {/* ── Page Header ─────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 22,
        }}>
          <div>
            <h1 style={{
              fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18,
              color: C.ink, margin: 0,
            }}>マイPF設定</h1>
            <p style={{
              fontFamily: "'Syne',sans-serif", fontSize: 12,
              color: C.muted, marginTop: 4,
            }}>保有ファンド・積立設定を管理します</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* hidden file input for JSON import */}
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileImport}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 600,
                padding: '7px 16px', border: `1px solid ${C.border}`, borderRadius: 8,
                background: C.card, color: C.subtle, cursor: 'pointer',
              }}
            >
              ↑ JSONインポート
            </button>
            <button
              onClick={handleExport}
              style={{
                fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 600,
                padding: '7px 16px', border: `1px solid ${C.border}`, borderRadius: 8,
                background: C.card, color: C.subtle, cursor: 'pointer',
              }}
            >
              ↓ JSONエクスポート
            </button>
            <button
              onClick={openJsonEditor}
              style={{
                fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 600,
                padding: '7px 16px', border: `1px solid ${C.border}`, borderRadius: 8,
                background: C.card, color: C.subtle, cursor: 'pointer',
              }}
            >
              { } JSON編集
            </button>
            <button
              onClick={() => { setIsAdding(true); setEditTarget(null) }}
              style={{
                fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700,
                padding: '7px 18px', border: 'none', borderRadius: 8,
                background: C.ink, color: '#fff', cursor: 'pointer',
              }}
            >
              ＋ ファンド追加
            </button>
          </div>
        </div>

        {/* ── Summary Cards ───────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 22 }}>
          <SummaryCard label="登録銘柄数"      value={`${holdings.length}件`} />
          <SummaryCard label="月次積立合計"     value={`¥${fmt(totalMonthly)}`} sub="現金＋CC＋口数換算" />
          <SummaryCard label="口座数"          value={`${accounts.length}口座`} sub={accounts.join(' / ')} />
          <SummaryCard
            label="NISAへの拠出"
            value={`¥${fmt(holdings.filter(h => h.account?.includes('NISA'))
              .reduce((s, h) => s + (h.monthlyAmount || (h.units && h.unitPrice ? h.units * h.unitPrice : 0)), 0))}`}
            sub="NISA成長＋つみたて合算"
          />
        </div>

        {/* ── JSON Editor ─────────────────────────────────────── */}
        {jsonMode && (
          <div style={{
            background: 'rgba(248,247,244,0.95)',
            padding: 20, marginBottom: 20,
            borderRadius: 12,
            border: '0.5px solid rgba(26,26,46,0.1)',
          }}>
            <div style={{
              fontFamily: "'Syne',sans-serif", fontWeight: 700,
              fontSize: 13, color: C.ink, marginBottom: 10,
            }}>
              JSON直接編集
            </div>
            <textarea
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              style={{
                width: '100%', height: 260,
                fontFamily: "'DM Mono',monospace", fontSize: 11,
                padding: 10, border: `1px solid ${C.border}`,
                borderRadius: 8, background: '#FAFAF8',
                color: C.ink, resize: 'vertical', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {jsonErr && (
              <div style={{
                color: C.down, fontFamily: "'DM Mono',monospace",
                fontSize: 11, marginTop: 6,
              }}>
                ⚠ {jsonErr}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                onClick={() => setJsonMode(false)}
                style={{
                  fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 600,
                  padding: '7px 16px', border: `1px solid ${C.border}`, borderRadius: 8,
                  background: 'transparent', color: C.subtle, cursor: 'pointer',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={applyJson}
                style={{
                  fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700,
                  padding: '7px 18px', border: 'none', borderRadius: 8,
                  background: C.ink, color: '#fff', cursor: 'pointer',
                }}
              >
                適用
              </button>
            </div>
          </div>
        )}

        {/* ── Add Form ────────────────────────────────────────── */}
        {isAdding && (
          <div style={{
            background: 'rgba(248,247,244,0.95)',
            padding: 20, marginBottom: 20,
            borderRadius: 12,
            border: '0.5px solid rgba(26,26,46,0.1)',
          }}>
            <HoldingModal
              holding={newTemplate}
              title="新規ファンド追加"
              onSave={handleAddSave}
              onCancel={() => setIsAdding(false)}
            />
          </div>
        )}

        {/* ── Holdings Table ──────────────────────────────────── */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,.05)',
        }}>
          {/* thead */}
          <div style={{
            display: 'grid', gridTemplateColumns: GRID,
            padding: '10px 20px', background: '#F3F1EC',
            borderBottom: `1px solid ${C.border}`, gap: 10, alignItems: 'center',
          }}>
            {['ファンド名', 'カテゴリ', '口座', '方法', '月額 / 口数', '引落日', '操作'].map(h => (
              <div key={h} style={{
                fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 700,
                color: C.muted, letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                {h}
              </div>
            ))}
          </div>

          {holdings.length === 0 ? (
            <div style={{
              padding: '48px 20px', textAlign: 'center',
              color: C.muted, fontFamily: "'Syne',sans-serif", fontSize: 14,
            }}>
              保有ファンドが登録されていません。「＋ ファンド追加」から追加してください。
            </div>
          ) : holdings.map((h, idx) => {
            const isEditing    = editTarget?.id === h.id
            const isConfirming = deleteConfirmId === h.id
            const isLast       = idx === holdings.length - 1

            return (
              <div key={h.id}>
                {/* ── row ─────────────────────────────────────── */}
                <div style={{
                  display: 'grid', gridTemplateColumns: GRID,
                  padding: '12px 20px', gap: 10, alignItems: 'center',
                  background: isEditing ? C.goldLight : C.card,
                  borderBottom: isLast && !isEditing && !isConfirming
                    ? 'none'
                    : `1px solid ${C.border}`,
                  transition: 'background .15s',
                }}>
                  {/* name */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'Syne',sans-serif", fontWeight: 600,
                      fontSize: 12, color: C.ink,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                      title={h.name}
                    >
                      {h.shortName || h.name}
                      {h.ticker && (
                        <span style={{
                          fontFamily: "'DM Mono',monospace", fontSize: 10,
                          color: C.muted, marginLeft: 6,
                        }}>
                          ({h.ticker})
                        </span>
                      )}
                    </div>
                    {h.memo && (
                      <div style={{
                        fontFamily: "'Syne',sans-serif", fontSize: 10, color: C.muted,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {h.memo}
                      </div>
                    )}
                  </div>

                  <CatBadge label={h.category}/>
                  <AccBadge label={h.account}/>

                  <div style={{
                    fontFamily: "'Syne',sans-serif", fontSize: 11, color: C.subtle,
                  }}>
                    {h.method}
                  </div>

                  {/* monthly / units */}
                  <div style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 12, color: C.ink,
                  }}>
                    {h.units != null
                      ? `${h.units}口 × ${fmtYen(h.unitPrice)}`
                      : fmtYen(h.monthlyAmount)}
                  </div>

                  <div style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.subtle,
                  }}>
                    {h.dayOfMonth ? `毎月${h.dayOfMonth}日` : '—'}
                  </div>

                  {/* action buttons */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => {
                        setEditTarget(isEditing ? null : h)
                        setDeleteConfirmId(null)
                      }}
                      style={{
                        fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 600,
                        padding: '4px 10px', border: `1px solid ${C.border}`, borderRadius: 6,
                        background: isEditing ? C.gold : 'transparent',
                        color: isEditing ? C.ink : C.subtle,
                        cursor: 'pointer', transition: 'all .15s',
                      }}
                    >
                      {isEditing ? '閉じる' : '編集'}
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirmId(isConfirming ? null : h.id)
                        setEditTarget(null)
                      }}
                      style={{
                        fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 600,
                        padding: '4px 8px', border: '1px solid #FCDCD4',
                        borderRadius: 6, background: 'transparent',
                        color: C.down, cursor: 'pointer',
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>

                {/* ── Inline Edit Form ─────────────────────────── */}
                {isEditing && (
                  <div style={{
                    background: 'rgba(248,247,244,0.95)',
                    padding: '0 20px 20px',
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    <HoldingModal
                      holding={h}
                      title={`編集: ${h.shortName || h.name}`}
                      onSave={handleEditSave}
                      onCancel={() => setEditTarget(null)}
                    />
                  </div>
                )}

                {/* ── Delete Confirm ───────────────────────────── */}
                {isConfirming && (
                  <div style={{
                    padding: '8px 20px',
                    background: C.downBg,
                    borderBottom: isLast ? 'none' : `1px solid #F0C8B8`,
                    display: 'flex', gap: 10, alignItems: 'center',
                  }}>
                    <span style={{
                      fontFamily: "'Syne',sans-serif", fontSize: 12, color: '#712B13',
                    }}>
                      「{h.shortName || h.name}」を削除しますか？
                    </span>
                    <button
                      onClick={() => handleDelete(h.id)}
                      style={{
                        fontSize: 11, background: C.down, color: '#fff',
                        border: 'none', borderRadius: 6,
                        padding: '4px 12px', cursor: 'pointer',
                        fontFamily: "'Syne',sans-serif", fontWeight: 600,
                      }}
                    >
                      削除する
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      style={{
                        fontSize: 11, background: 'transparent',
                        border: `0.5px solid ${C.down}`, borderRadius: 6,
                        padding: '4px 12px', cursor: 'pointer',
                        color: C.down, fontFamily: "'Syne',sans-serif", fontWeight: 600,
                      }}
                    >
                      キャンセル
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Footer note ─────────────────────────────────────── */}
        <div style={{
          marginTop: 20, padding: '11px 16px',
          background: 'rgba(201,168,76,0.07)',
          border: '1px solid rgba(201,168,76,0.25)',
          borderRadius: 10,
          fontFamily: "'Syne',sans-serif", fontSize: 11, color: C.goldText,
        }}>
          データはブラウザの localStorage に保存されます（キー: {STORAGE_KEY}）
        </div>
      </div>
    </div>
  )
}
