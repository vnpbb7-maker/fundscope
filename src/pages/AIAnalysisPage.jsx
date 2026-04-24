// ─── Gemini APIキー取得手順 ────────────────────────────────────
// 1. https://aistudio.google.com/ にGoogleアカウントでアクセス
// 2. 左メニュー「Get API key」→「Create API key」
// 3. 発行されたキーを .env.local に保存:
//    VITE_GEMINI_API_KEY=AIzaSy...
// 4. npm run dev を再起動
//
// .env.local に以下を追記（ANTHROPIC_API_KEYの行は削除してOK）:
// VITE_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// ──────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'

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

// ─── API Key (Gemini) ──────────────────────────────────────────
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`

// ─── System Prompt ─────────────────────────────────────────────
const SYSTEM_PROMPT = `
あなたはKazumiさんの投資アドバイザー分身AIです。
以下のポートフォリオ情報を常に把握した上で、
データドリブンな投資分析・アドバイスを日本語で提供してください。

【基本情報】
- 月間積立: 30万円（年間360万円）
- NISA枠: 成長投資枠＋つみたて投資枠を両方フル活用中
- 投資スタイル: 長期・積立・インデックス中心

【現在の保有銘柄】
{{HOLDINGS_JSON}}

【回答スタイル】
- 具体的な数値・パーセンテージを使って説明
- NISA制度の制約を常に考慮
- リスクとリターンを客観的に分析
- 長期視点でのアドバイスを優先
- 回答は簡潔に、要点を箇条書きで整理
`

// ─── Suggest Questions ─────────────────────────────────────────
const SUGGESTS = [
  '現在のポートフォリオのリスク分析をして',
  '今月のリバランス提案をして',
  'NISA枠の最適な使い方を教えて',
  'S&P500 vs 全世界株式、どちらを増やすべき？',
]

// ─── Loading Dots ──────────────────────────────────────────────
function LoadingDots() {
  return (
    <>
      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1);   }
        }
        .dot {
          display: inline-block; width: 6px; height: 6px;
          border-radius: 50%; background: #8C8C8C; margin: 0 2px;
          animation: dotPulse 1.4s ease-in-out infinite both;
        }
        .dot:nth-child(1) { animation-delay: 0s;    }
        .dot:nth-child(2) { animation-delay: 0.16s; }
        .dot:nth-child(3) { animation-delay: 0.32s; }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0' }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, color: C.muted, marginRight: 4 }}>
          分析中
        </span>
        <span className="dot"/><span className="dot"/><span className="dot"/>
      </div>
    </>
  )
}

// ─── Message Bubble ────────────────────────────────────────────
function Bubble({ role, content }) {
  const isUser = role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: '#4285F4', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, flexShrink: 0,
          marginRight: 8, marginTop: 2, fontFamily: "'Syne',sans-serif",
        }}>G</div>
      )}
      <div style={{
        maxWidth: isUser ? '70%' : '80%',
        background: isUser ? C.ink : C.card,
        color: isUser ? '#FFFFFF' : C.ink,
        border: isUser ? 'none' : `0.5px solid rgba(26,26,46,0.1)`,
        borderRadius: isUser ? '12px 12px 0 12px' : '12px 12px 12px 0',
        padding: '10px 14px',
        fontSize: 13,
        fontFamily: "'Syne',sans-serif",
        lineHeight: 1.65,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
      }}>
        {content}
      </div>
      {isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: C.ink, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, flexShrink: 0,
          marginLeft: 8, marginTop: 2, fontFamily: "'Syne',sans-serif",
        }}>You</div>
      )}
    </div>
  )
}

// ─── AIAnalysisPage ────────────────────────────────────────────
export default function AIAnalysisPage() {
  const [messages,   setMessages  ] = useState([])
  const [input,      setInput     ] = useState('')
  const [isLoading,  setIsLoading ] = useState(false)
  const [holdings,   setHoldings  ] = useState([])
  const [error,      setError     ] = useState(null)
  const bottomRef   = useRef(null)
  const textareaRef = useRef(null)

  // localStorage から保有銘柄を読み込み
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fundscope_holdings')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setHoldings(parsed)
      }
    } catch (e) {
      console.error('holdings読み込みエラー:', e)
    }
  }, [])

  // メッセージ追加時に最下部へスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ── Send (Gemini API) ─────────────────────────────────────────
  async function sendMessage(text) {
    const trimmed = (text ?? input).trim()
    if (!trimmed || isLoading) return

    if (!API_KEY) {
      setError('APIキーが未設定です。.env.local に VITE_GEMINI_API_KEY を設定してください。')
      return
    }

    const userMsg    = { role: 'user', content: trimmed }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setInput('')
    setIsLoading(true)
    setError(null)

    // Gemini形式に変換（role: user → user, assistant → model）
    const geminiContents = newHistory.map(m => ({
      role:  m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const systemPrompt = SYSTEM_PROMPT.replace(
      '{{HOLDINGS_JSON}}',
      holdings.length > 0
        ? JSON.stringify(holdings, null, 2)
        : '（保有銘柄なし：マイPF設定ページで登録してください）'
    )

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: geminiContents,
            generationConfig: {
              temperature:      0.7,
              maxOutputTokens:  1024,
            },
          }),
        }
      )

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error?.message || `APIエラー: ${res.status}`)
      }

      const data  = await res.json()
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
        ?? '応答を取得できませんでした'

      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      setError(`エラー: ${e.message}`)
    } finally {
      setIsLoading(false)
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }

  function resetChat() {
    setMessages([])
    setError(null)
    setInput('')
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: 'calc(100vh - 58px)', fontFamily: "'Syne',sans-serif" }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 24px 48px' }}>

        {/* ── Header ────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            {/* Gemini "G" badge */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4285F4 0%, #34A853 33%, #FBBC05 66%, #EA4335 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 900, color: '#fff',
              flexShrink: 0,
            }}>G</div>
            <div>
              <h1 style={{
                fontFamily: "'Syne',sans-serif", fontWeight: 700,
                fontSize: 18, color: C.ink, margin: 0,
              }}>
                Gemini 分身 — 投資分析AI
              </h1>
              <div style={{
                fontFamily: "'DM Mono',monospace", fontSize: 11,
                color: C.muted, marginTop: 2,
              }}>
                モデル: Gemini 2.0 Flash（Google・完全無料）&nbsp;|&nbsp;
                保有銘柄: {holdings.length > 0
                  ? `${holdings.length}銘柄を認識中`
                  : '未登録（マイPF設定で追加）'}
              </div>
            </div>
          </div>

          {/* API Key 未設定バナー */}
          {!API_KEY && (
            <div style={{
              background: '#FFF8E0',
              border: '1px solid #D4A800',
              borderRadius: 8,
              padding: '10px 14px',
              fontFamily: "'Syne',sans-serif",
              fontSize: 12,
              color: '#7A5A00',
              marginTop: 12,
              lineHeight: 1.7,
            }}>
              ⚠ <strong>.env.local</strong> に{' '}
              <code style={{ background: '#FFF0B0', padding: '1px 4px', borderRadius: 3 }}>
                VITE_GEMINI_API_KEY=AIzaSy...
              </code>{' '}
              を設定してください。<br/>
              →{' '}
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#4285F4', textDecoration: 'underline' }}
              >
                https://aistudio.google.com/
              </a>{' '}
              でGoogleアカウントから無料取得できます
            </div>
          )}
        </div>

        {/* ── Suggest Buttons (初回のみ) ─────────────────────── */}
        {messages.length === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {SUGGESTS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={isLoading}
                style={{
                  background: C.card,
                  border: `0.5px solid rgba(26,26,46,0.15)`,
                  borderRadius: 10,
                  padding: '14px 16px',
                  fontSize: 13,
                  fontFamily: "'Syne',sans-serif",
                  color: C.ink,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  lineHeight: 1.5,
                  transition: 'border-color .15s, box-shadow .15s',
                  boxShadow: '0 1px 4px rgba(0,0,0,.04)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = C.gold
                  e.currentTarget.style.boxShadow = `0 2px 10px rgba(201,168,76,.15)`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(26,26,46,0.15)'
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.04)'
                }}
              >
                <span style={{ fontSize: 16, marginRight: 6 }}>✦</span>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* ── Chat Area ─────────────────────────────────────── */}
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: '20px 20px 8px',
          minHeight: 400,
          boxShadow: '0 2px 12px rgba(0,0,0,.05)',
          marginBottom: 12,
        }}>
          {messages.length === 0 && !isLoading ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: 360, flexDirection: 'column', gap: 12,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, #4285F4 0%, #34A853 33%, #FBBC05 66%, #EA4335 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 900, color: '#fff',
              }}>G</div>
              <div style={{
                fontFamily: "'Syne',sans-serif", fontSize: 13,
                color: C.muted, textAlign: 'center',
              }}>
                上のボタンか入力欄から質問してください
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <Bubble key={i} role={msg.role} content={msg.content}/>
              ))}

              {/* Loading bubble */}
              {isLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#4285F4', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                    marginRight: 8, marginTop: 2,
                  }}>G</div>
                  <div style={{
                    background: C.card,
                    border: `0.5px solid rgba(26,26,46,0.1)`,
                    borderRadius: '12px 12px 12px 0',
                    padding: '10px 14px',
                    boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                  }}>
                    <LoadingDots/>
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </>
          )}
        </div>

        {/* ── Error ─────────────────────────────────────────── */}
        {error && (
          <div style={{
            background: C.downBg,
            border: `1px solid #F0C8B8`,
            borderRadius: 8,
            padding: '10px 14px',
            fontFamily: "'Syne',sans-serif",
            fontSize: 12,
            color: '#712B13',
            marginBottom: 10,
          }}>
            {error}
          </div>
        )}

        {/* ── Input Area ────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder="ポートフォリオについて質問してください... (Shift+Enter で改行)"
            rows={2}
            style={{
              flex: 1,
              resize: 'none',
              border: `0.5px solid rgba(26,26,46,0.2)`,
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              fontFamily: "'Syne',sans-serif",
              background: C.card,
              color: C.ink,
              outline: 'none',
              lineHeight: 1.6,
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            style={{
              background: isLoading || !input.trim() ? '#CCCCCC' : C.gold,
              color: C.ink,
              border: 'none',
              borderRadius: 10,
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 700,
              cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
              fontFamily: "'Syne',sans-serif",
              whiteSpace: 'nowrap',
              height: 48,
              transition: 'background .15s',
            }}
          >
            {isLoading ? '分析中...' : '送信 →'}
          </button>
        </div>

        {/* ── Reset ─────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button
            onClick={resetChat}
            style={{
              fontFamily: "'Syne',sans-serif", fontSize: 11,
              color: C.muted, background: 'transparent',
              border: 'none', cursor: 'pointer', padding: '4px 8px',
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}
          >
            会話をリセット
          </button>
        </div>

        {/* ── Tip ───────────────────────────────────────────── */}
        <div style={{
          marginTop: 24, padding: '11px 16px',
          background: 'rgba(66,133,244,0.06)',
          border: '1px solid rgba(66,133,244,0.2)',
          borderRadius: 10,
          fontFamily: "'DM Mono',monospace", fontSize: 11,
          color: '#1A3A7A', lineHeight: 1.8,
        }}>
          📋 APIキーの設定: プロジェクトルートの <strong>.env.local</strong> に
          &nbsp;
          <code style={{ background: 'rgba(66,133,244,0.1)', padding: '1px 5px', borderRadius: 3 }}>
            VITE_GEMINI_API_KEY=AIzaSy...
          </code>
          &nbsp;を記載 → <code>npm run dev</code> を再起動してください（Gitには含まれません）
        </div>
      </div>
    </div>
  )
}
