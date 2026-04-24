import { useState } from 'react'
import TrendPage from './pages/TrendPage'
import RankingPage from './pages/RankingPage'
import PortfolioSettingsPage from './pages/PortfolioSettingsPage'
import AIAnalysisPage from './pages/AIAnalysisPage'
import NewsFeed from './components/NewsFeed'

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

      {/* ── ランキング: 左=RankingPage / 右=NewsFeed ── */}
      {active === 'ranking' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: 20,
          alignItems: 'flex-start',
          maxWidth: 1400,
          margin: '0 auto',
          padding: '0 0 40px',
        }}>
          <RankingPage />
          <div style={{ position: 'sticky', top: 72, padding: '20px 20px 0 0' }}>
            <NewsFeed />
          </div>
        </div>
      )}

      {/* ── 注目テーマ: フル幅 ── */}
      {active === 'trend' && <TrendPage />}

      {/* ── マイPF設定: フル幅 ── */}
      {active === 'portfolio' && <PortfolioSettingsPage />}

      {/* ── AI分析: 左=AIAnalysisPage / 右=NewsFeed ── */}
      {active === 'ai' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: 20,
          alignItems: 'flex-start',
          maxWidth: 1400,
          margin: '0 auto',
          padding: '0 0 40px',
        }}>
          <AIAnalysisPage />
          <div style={{ position: 'sticky', top: 72, padding: '20px 20px 0 0' }}>
            <NewsFeed compact={true} />
          </div>
        </div>
      )}
    </div>
  )
}
