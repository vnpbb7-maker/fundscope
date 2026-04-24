import { useState } from 'react'
import TrendPage from './pages/TrendPage'
import RankingPage from './pages/RankingPage'
import PortfolioSettingsPage from './pages/PortfolioSettingsPage'
import AIAnalysisPage from './pages/AIAnalysisPage'

const TABS = [
  { id: 'ranking',   label: 'ランキング' },
  { id: 'trend',     label: '注目テーマ' },
  { id: 'portfolio', label: 'マイPF設定' },
  { id: 'ai',        label: 'AI分析' },
]

export default function App() {
  const [active, setActive] = useState('ranking')

  const s = {
    wrap: { minHeight: '100vh', background: '#F8F7F4' },
    nav: {
      position: 'sticky',
      top: 0,
      zIndex: 200,
      background: '#FFFFFF',
      borderBottom: '0.5px solid rgba(26,26,46,0.1)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    logo: {
      fontSize: '18px',
      fontWeight: '800',
      color: '#1A1A2E',
      marginRight: '16px',
      fontFamily: "'Syne', sans-serif",
      letterSpacing: '-0.5px',
      userSelect: 'none',
    },
    logoAccent: { color: '#C9A84C' },
    sep: {
      width: 1,
      height: 20,
      background: 'rgba(26,26,46,0.12)',
      marginRight: 4,
    },
  }

  function tabStyle(id) {
    const on = active === id
    return {
      fontSize: '13px',
      padding: '7px 16px',
      borderRadius: '20px',
      border: on ? 'none' : '0.5px solid rgba(26,26,46,0.2)',
      background: on ? '#1A1A2E' : 'transparent',
      color: on ? '#FFFFFF' : '#6B6B7A',
      cursor: 'pointer',
      fontFamily: "'Syne', sans-serif",
      fontWeight: on ? '600' : '500',
      transition: 'all .15s',
      whiteSpace: 'nowrap',
    }
  }

  return (
    <div style={s.wrap}>
      <nav style={s.nav}>
        <div style={s.logo}>
          fund<span style={s.logoAccent}>scope</span>
        </div>
        <div style={s.sep} />
        {TABS.map(t => (
          <button key={t.id} style={tabStyle(t.id)} onClick={() => setActive(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {active === 'ranking'   && <RankingPage />}
      {active === 'trend'     && <TrendPage />}
      {active === 'portfolio' && <PortfolioSettingsPage />}
      {active === 'ai' && <AIAnalysisPage />}
    </div>
  )
}
