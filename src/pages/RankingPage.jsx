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

// ─── 為替レート（モック） ──────────────────────────────────────
const USD_JPY = 151.5
const formatPrice = (price, currency) => {
  if (currency === '¥') return '¥' + Math.round(price).toLocaleString('ja-JP')
  return '¥' + Math.round(price * USD_JPY).toLocaleString('ja-JP')
}

// ─── Filter Options ────────────────────────────────────────────
const PERIODS = ['1D','1W','1M','3M','6M','YTD','1Y']

const CATEGORIES = [
  { value:'all',        label:'全て' },
  { value:'ai',         label:'AI・半導体' },
  { value:'us_equity',  label:'米国株式' },
  { value:'intl',       label:'先進国株式' },
  { value:'em',         label:'新興国株式' },
  { value:'jp',         label:'国内ETF' },
  { value:'sector',     label:'セクター' },
  { value:'bond',       label:'債券' },
  { value:'commodity',  label:'コモディティ' },
  { value:'balance',    label:'バランス' },
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
  '防衛':                 { bg:'#FAECE7', color:'#712B13' },
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
}

// ─── 100件 Mock Data （price: 数値型、currency追加、reason追加） ─
const FUND_DATA_INIT = [
  // 1-10
  { rank:1,  name:'iShares Semiconductor ETF',               shortName:'SOXX',         ticker:'SOXX', category:'AI・半導体',         region:'米国',   change:5.24,  price:248.60, currency:'$', fee:'0.350%', volume:'3.2×', isOwned:false, reason:'Nvidia Blackwell需要急増・AI半導体サイクル加速' },
  { rank:2,  name:'Global X AI & Technology ETF',            shortName:'AIQ',          ticker:'AIQ',  category:'AI・半導体',         region:'全世界', change:4.73,  price:32.14,  currency:'$', fee:'0.680%', volume:'2.8×', isOwned:false, reason:'エージェントAI普及・データセンター投資拡大が追い風' },
  { rank:3,  name:'VanEck Defense ETF',                      shortName:'DFND',         ticker:'DFND', category:'防衛',               region:'米国',   change:4.18,  price:41.88,  currency:'$', fee:'0.550%', volume:'4.1×', isOwned:false, reason:'NATO加盟国の国防費増加・欧州防衛予算拡大' },
  { rank:4,  name:'eMAXIS Slim 全世界株式（AC）',             shortName:'eMAXIS AC',   ticker:'—',    category:'全世界株式',         region:'全世界', change:3.61,  price:28440,  currency:'¥', fee:'0.058%', volume:'1.9×', isOwned:true,  reason:'円安進行＋先進国株高・低コストが長期積立に有利' },
  { rank:5,  name:'SBI・V・S&P500インデックスF',              shortName:'SBI S&P500',  ticker:'—',    category:'米国株式',           region:'米国',   change:3.44,  price:31220,  currency:'¥', fee:'0.094%', volume:'1.6×', isOwned:true,  reason:'米国企業業績好調・Fed利下げ期待で株高継続' },
  { rank:6,  name:'ニッセイ外国株式インデックスF',            shortName:'ニッセイ外国', ticker:'—',    category:'先進国株式',         region:'先進国', change:3.31,  price:58110,  currency:'¥', fee:'0.094%', volume:'1.4×', isOwned:true,  reason:'先進国株式全般に恩恵・低コスト（0.094%）が強み' },
  { rank:7,  name:'WisdomTree India Earnings ETF',           shortName:'EPI',          ticker:'EPI',  category:'インド',             region:'新興国', change:2.94,  price:34.72,  currency:'$', fee:'0.850%', volume:'2.1×', isOwned:false, reason:'モディ政権インフラ投資加速・製造業シフトで高成長' },
  { rank:8,  name:'NEXT FUNDS TOPIX ETF',                    shortName:'ETF 412A',    ticker:'412A', category:'国内ETF',            region:'日本',   change:2.41,  price:2521,   currency:'¥', fee:'0.078%', volume:'1.2×', isOwned:true,  reason:'東証ETF・低コスト・NISA成長投資枠で積立に最適' },
  { rank:9,  name:'ニッセイTOPIXインデックスF',               shortName:'ニッセイTOPIX',ticker:'—',   category:'国内株式',           region:'日本',   change:2.18,  price:18840,  currency:'¥', fee:'0.143%', volume:'1.1×', isOwned:true,  reason:'国内景気回復・日銀政策正常化で日本株見直し買い' },
  { rank:10, name:'SPDR Gold Shares ETF',                    shortName:'GLD',          ticker:'GLD',  category:'コモディティ',       region:'米国',   change:1.82,  price:218.40, currency:'$', fee:'0.400%', volume:'0.9×', isOwned:false, reason:'地政学リスク・インフレ懸念で実物資産需要が上昇' },
  // 11-20
  { rank:11, name:'Vanguard S&P 500 ETF',                    shortName:'VOO',          ticker:'VOO',  category:'米国株式',           region:'米国',   change:1.75,  price:498.20, currency:'$', fee:'0.030%', volume:'1.3×', isOwned:false, reason:'米国市場全体に低コストで分散・長期保有に最適' },
  { rank:12, name:'Vanguard Total Stock Market ETF',         shortName:'VTI',          ticker:'VTI',  category:'米国株式',           region:'米国',   change:1.68,  price:248.90, currency:'$', fee:'0.030%', volume:'1.2×', isOwned:false, reason:'米国全株式に分散・中小型株成長も取り込む' },
  { rank:13, name:'Invesco QQQ Trust',                       shortName:'QQQ',          ticker:'QQQ',  category:'米国グロース',       region:'米国',   change:1.55,  price:442.30, currency:'$', fee:'0.200%', volume:'2.1×', isOwned:false, reason:'AI・グロース株主導の上昇・ナスダック連動で高リターン' },
  { rank:14, name:'はじめてのNISA・全世界株式インデックス',  shortName:'はじめてAC',  ticker:'—',    category:'全世界株式',         region:'全世界', change:1.48,  price:14820,  currency:'¥', fee:'0.058%', volume:'0.8×', isOwned:true,  reason:'全世界株式に低コストで分散・地域リスク分散効果大' },
  { rank:15, name:'Vanguard Information Technology ETF',     shortName:'VGT',          ticker:'VGT',  category:'情報技術',           region:'米国',   change:1.44,  price:512.40, currency:'$', fee:'0.100%', volume:'1.5×', isOwned:false, reason:'情報技術セクターのAI投資が業績を押し上げ' },
  { rank:16, name:'VanEck Semiconductor ETF',                shortName:'SMH',          ticker:'SMH',  category:'AI・半導体',         region:'米国',   change:1.38,  price:218.60, currency:'$', fee:'0.350%', volume:'1.8×', isOwned:false, reason:'AI向け半導体需要が市場予想を上回るペースで拡大' },
  { rank:17, name:'ARK Innovation ETF',                      shortName:'ARKK',         ticker:'ARKK', category:'革新的技術',         region:'米国',   change:1.32,  price:58.40,  currency:'$', fee:'0.750%', volume:'2.4×', isOwned:false, reason:'破壊的技術革新銘柄に集中投資・高リスク高リターン' },
  { rank:18, name:'NEXT FUNDS インド株(Nifty50)',             shortName:'インドNifty50',ticker:'1678', category:'インド',             region:'新興国', change:1.28,  price:3840,   currency:'¥', fee:'0.220%', volume:'1.1×', isOwned:false, reason:'インド経済の高成長・人口ボーナスで長期上昇期待' },
  { rank:19, name:'Vanguard FTSE Emerging Markets ETF',      shortName:'VWO',          ticker:'VWO',  category:'新興国株式',         region:'新興国', change:1.22,  price:42.80,  currency:'$', fee:'0.080%', volume:'0.9×', isOwned:false, reason:'新興国経済の回復・ドル安で新興国株に資金流入' },
  { rank:20, name:'iShares Core MSCI Emerging Markets ETF',  shortName:'IEMG',         ticker:'IEMG', category:'新興国株式',         region:'新興国', change:1.18,  price:52.40,  currency:'$', fee:'0.090%', volume:'1.0×', isOwned:false, reason:'新興国への分散投資・中国・台湾・インド等に広く投資' },
  // 21-30
  { rank:21, name:'iShares MSCI EAFE ETF',                   shortName:'EFA',          ticker:'EFA',  category:'先進国株式',         region:'先進国', change:1.12,  price:78.20,  currency:'$', fee:'0.320%', volume:'0.8×', isOwned:false, reason:'欧州・日本・アジア先進国に分散・為替分散効果あり' },
  { rank:22, name:'Vanguard FTSE Developed Markets ETF',     shortName:'VEA',          ticker:'VEA',  category:'先進国株式',         region:'先進国', change:1.08,  price:48.60,  currency:'$', fee:'0.050%', volume:'0.7×', isOwned:false, reason:'先進国（米国除く）への低コスト分散投資' },
  { rank:23, name:'NEXT FUNDS TOPIX連動型ETF',               shortName:'1306（TOPIX）',ticker:'1306', category:'国内ETF',            region:'日本',   change:1.04,  price:2480,   currency:'¥', fee:'0.088%', volume:'1.3×', isOwned:false, reason:'東証上場・TOPIXに連動・国内機関投資家の需要高い' },
  { rank:24, name:'NEXT FUNDS 日経225連動型ETF',             shortName:'1321（日経225）',ticker:'1321',category:'国内ETF',           region:'日本',   change:0.98,  price:44200,  currency:'¥', fee:'0.220%', volume:'1.4×', isOwned:false, reason:'日経225連動・流動性高く売買しやすいETF' },
  { rank:25, name:'iShares MSCI Japan ETF',                  shortName:'EWJ',          ticker:'EWJ',  category:'日本株',             region:'日本',   change:0.94,  price:68.40,  currency:'$', fee:'0.500%', volume:'0.6×', isOwned:false, reason:'日本株ETF・円ベースで為替リスクなし' },
  { rank:26, name:'Vanguard FTSE Europe ETF',                shortName:'VGK',          ticker:'VGK',  category:'先進国株式',         region:'欧州',   change:0.88,  price:62.80,  currency:'$', fee:'0.080%', volume:'0.5×', isOwned:false, reason:'欧州経済の回復・ユーロ高が円建てリターンを押し上げ' },
  { rank:27, name:'iShares Core MSCI Europe ETF',            shortName:'IEUR',         ticker:'IEUR', category:'先進国株式',         region:'欧州',   change:0.82,  price:48.20,  currency:'$', fee:'0.090%', volume:'0.4×', isOwned:false, reason:'フランス・ドイツ・英国等に均等分散・欧州回復の恩恵' },
  { rank:28, name:'iShares China Large-Cap ETF',             shortName:'FXI',          ticker:'FXI',  category:'新興国株式',         region:'新興国', change:0.76,  price:28.40,  currency:'$', fee:'0.740%', volume:'1.6×', isOwned:false, reason:'中国経済の政策刺激・景気回復期待で反発局面' },
  { rank:29, name:'iShares MSCI China ETF',                  shortName:'MCHI',         ticker:'MCHI', category:'新興国株式',         region:'新興国', change:0.71,  price:44.20,  currency:'$', fee:'0.590%', volume:'1.2×', isOwned:false, reason:'MSCI China連動・テンセント・アリババ等大型株中心' },
  { rank:30, name:'NEXT FUNDS 外国株式ETF',                  shortName:'2513（外国株ETF）',ticker:'2513',category:'先進国株式',      region:'先進国', change:0.68,  price:1820,   currency:'¥', fee:'0.187%', volume:'0.6×', isOwned:false, reason:'東証上場外国株ETF・低コストで先進国株に投資可能' },
  // 31-40
  { rank:31, name:'Technology Select Sector SPDR Fund',      shortName:'XLK',          ticker:'XLK',  category:'情報技術',           region:'米国',   change:0.64,  price:218.40, currency:'$', fee:'0.090%', volume:'0.8×', isOwned:false, reason:'AI・クラウド投資拡大でIT企業の利益率が向上' },
  { rank:32, name:'Health Care Select Sector SPDR Fund',     shortName:'XLV',          ticker:'XLV',  category:'ヘルスケア',         region:'米国',   change:0.60,  price:142.80, currency:'$', fee:'0.090%', volume:'0.6×', isOwned:false, reason:'高齢化社会・医薬品需要増加・ディフェンシブ銘柄' },
  { rank:33, name:'Financial Select Sector SPDR Fund',       shortName:'XLF',          ticker:'XLF',  category:'金融',               region:'米国',   change:0.56,  price:42.80,  currency:'$', fee:'0.090%', volume:'0.7×', isOwned:false, reason:'金利低下局面で銀行・保険の利ざや改善期待' },
  { rank:34, name:'Energy Select Sector SPDR Fund',          shortName:'XLE',          ticker:'XLE',  category:'エネルギー',         region:'米国',   change:0.52,  price:88.40,  currency:'$', fee:'0.090%', volume:'0.8×', isOwned:false, reason:'原油・天然ガス価格上昇・エネルギー企業の増益' },
  { rank:35, name:'Industrial Select Sector SPDR Fund',      shortName:'XLI',          ticker:'XLI',  category:'資本財',             region:'米国',   change:0.48,  price:128.60, currency:'$', fee:'0.090%', volume:'0.5×', isOwned:false, reason:'製造業・インフラ投資の回復で資本財企業が上昇' },
  { rank:36, name:'Consumer Staples Select Sector SPDR',     shortName:'XLP',          ticker:'XLP',  category:'生活必需品',         region:'米国',   change:0.44,  price:78.20,  currency:'$', fee:'0.090%', volume:'0.4×', isOwned:false, reason:'景気後退局面でも安定・ディフェンシブ銘柄として人気' },
  { rank:37, name:'Utilities Select Sector SPDR Fund',       shortName:'XLU',          ticker:'XLU',  category:'公益事業',           region:'米国',   change:0.41,  price:68.40,  currency:'$', fee:'0.090%', volume:'0.3×', isOwned:false, reason:'電力・ガス需要の安定・高配当で長期保有に適する' },
  { rank:38, name:'Materials Select Sector SPDR Fund',       shortName:'XLB',          ticker:'XLB',  category:'素材',               region:'米国',   change:0.38,  price:88.20,  currency:'$', fee:'0.090%', volume:'0.4×', isOwned:false, reason:'素材価格の上昇・資源サイクルの回復局面' },
  { rank:39, name:'Real Estate Select Sector SPDR Fund',     shortName:'XLRE',         ticker:'XLRE', category:'不動産',             region:'米国',   change:0.34,  price:38.60,  currency:'$', fee:'0.090%', volume:'0.3×', isOwned:false, reason:'不動産市場の回復・金利低下でREIT価格が上昇' },
  { rank:40, name:'Communication Services Select Sector',    shortName:'XLC',          ticker:'XLC',  category:'通信',               region:'米国',   change:0.30,  price:82.40,  currency:'$', fee:'0.090%', volume:'0.4×', isOwned:false, reason:'通信インフラへの投資増加・5G普及で需要拡大' },
  // 41-50
  { rank:41, name:'Vanguard Total Bond Market ETF',          shortName:'BND',          ticker:'BND',  category:'米国債券',           region:'米国',   change:0.28,  price:72.80,  currency:'$', fee:'0.030%', volume:'0.4×', isOwned:false, reason:'米国債券市場全体に分散・安定したインカム収入' },
  { rank:42, name:'iShares Core U.S. Aggregate Bond ETF',   shortName:'AGG',          ticker:'AGG',  category:'米国債券',           region:'米国',   change:0.24,  price:98.20,  currency:'$', fee:'0.030%', volume:'0.5×', isOwned:false, reason:'投資適格債券への分散・株式との相関低くリスク低減' },
  { rank:43, name:'iShares 20+ Year Treasury Bond ETF',     shortName:'TLT',          ticker:'TLT',  category:'長期米国債',         region:'米国',   change:0.21,  price:88.40,  currency:'$', fee:'0.150%', volume:'0.6×', isOwned:false, reason:'長期金利低下期待で価格上昇・デュレーション長め' },
  { rank:44, name:'iShares Gold Trust',                     shortName:'IAU',          ticker:'IAU',  category:'金',                 region:'米国',   change:0.18,  price:42.60,  currency:'$', fee:'0.250%', volume:'0.5×', isOwned:false, reason:'金価格は地政学リスク・インフレ懸念で上昇継続' },
  { rank:45, name:'iShares Silver Trust',                   shortName:'SLV',          ticker:'SLV',  category:'銀',                 region:'米国',   change:0.15,  price:28.40,  currency:'$', fee:'0.500%', volume:'0.6×', isOwned:false, reason:'銀は産業需要（太陽光・電池）増加で価格上昇期待' },
  { rank:46, name:'iShares S&P GSCI Commodity ETF',         shortName:'GSG',          ticker:'GSG',  category:'コモディティ総合',   region:'米国',   change:0.12,  price:18.40,  currency:'$', fee:'0.750%', volume:'0.3×', isOwned:false, reason:'コモディティ全般への分散・インフレヘッジ効果' },
  { rank:47, name:'Vanguard Real Estate ETF',               shortName:'VNQ',          ticker:'VNQ',  category:'米国REIT',           region:'米国',   change:0.09,  price:82.40,  currency:'$', fee:'0.120%', volume:'0.4×', isOwned:false, reason:'米国不動産市場の回復・オフィス需要の底打ち期待' },
  { rank:48, name:'iShares U.S. Real Estate ETF',           shortName:'IYR',          ticker:'IYR',  category:'米国REIT',           region:'米国',   change:0.07,  price:98.20,  currency:'$', fee:'0.400%', volume:'0.3×', isOwned:false, reason:'不動産全般への投資・高配当利回りが魅力' },
  { rank:49, name:'eMAXIS Slimバランス（8資産均等型）',     shortName:'eMAXIS 8資産', ticker:'—',    category:'バランス',           region:'全世界', change:0.05,  price:14820,  currency:'¥', fee:'0.143%', volume:'0.2×', isOwned:false, reason:'8資産均等分散で安定・積立に向いたバランスファンド' },
  { rank:50, name:'セゾン・グローバルバランスファンド',     shortName:'セゾングローバル',ticker:'—',  category:'バランス',           region:'全世界', change:0.03,  price:18240,  currency:'¥', fee:'0.600%', volume:'0.2×', isOwned:false, reason:'株式・債券・REITに分散・長期安定運用向き' },
  // 51-60
  { rank:51, name:'Vanguard High Dividend Yield ETF',       shortName:'VYM',          ticker:'VYM',  category:'高配当',             region:'米国',   change:0.02,  price:128.40, currency:'$', fee:'0.060%', volume:'0.3×', isOwned:false, reason:'高配当株に絞り投資・安定的な配当収入を重視' },
  { rank:52, name:'iShares Core High Dividend ETF',         shortName:'HDV',          ticker:'HDV',  category:'高配当',             region:'米国',   change:0.01,  price:108.20, currency:'$', fee:'0.080%', volume:'0.2×', isOwned:false, reason:'財務健全な高配当銘柄・連続増配企業を中心に保有' },
  { rank:53, name:'iShares Select Dividend ETF',            shortName:'DVY',          ticker:'DVY',  category:'高配当',             region:'米国',   change:0.01,  price:118.40, currency:'$', fee:'0.380%', volume:'0.2×', isOwned:false, reason:'高配当利回り銘柄に集中・インカムゲイン狙い' },
  { rank:54, name:'SPDR Portfolio S&P 500 High Dividend',   shortName:'SPYD',         ticker:'SPYD', category:'高配当',             region:'米国',   change:-0.01, price:38.40,  currency:'$', fee:'0.070%', volume:'0.3×', isOwned:false, reason:'高配当ETFの中でも低コスト・幅広い銘柄に分散' },
  { rank:55, name:'iShares MSCIジャパン高配当低ボラETF',    shortName:'1478（高配当）',ticker:'1478', category:'国内ETF',            region:'日本',   change:-0.02, price:2840,   currency:'¥', fee:'0.209%', volume:'0.2×', isOwned:false, reason:'日本の高配当株に投資・円建てで為替リスクなし' },
  { rank:56, name:'iShares 米国債7-10年ETF',                shortName:'1482（7-10Y）', ticker:'1482', category:'外国債券',           region:'米国',   change:-0.04, price:1840,   currency:'¥', fee:'0.132%', volume:'0.2×', isOwned:false, reason:'米国中期国債連動・金利低下局面でのリターン期待' },
  { rank:57, name:'iShares 米国投資適格社債ETF',            shortName:'1496（社債）',  ticker:'1496', category:'投資適格社債',       region:'米国',   change:-0.06, price:1980,   currency:'¥', fee:'0.132%', volume:'0.2×', isOwned:false, reason:'米国投資適格社債・国債より高い利回りを追求' },
  { rank:58, name:'iShares 米国長期国債ETF',                shortName:'2621（長期債）', ticker:'2621', category:'長期米国債',         region:'米国',   change:-0.08, price:1420,   currency:'¥', fee:'0.154%', volume:'0.3×', isOwned:false, reason:'米国長期国債連動・金利低下で価格上昇の恩恵大' },
  { rank:59, name:'SPDR ゴールド・ミニシェアーズ',          shortName:'1540（金）',    ticker:'1540', category:'金',                 region:'米国',   change:-0.10, price:8840,   currency:'¥', fee:'0.400%', volume:'0.2×', isOwned:false, reason:'金価格連動型ETF・円建てで金投資が可能' },
  { rank:60, name:'NEXT FUNDS 原油先物ETF',                 shortName:'1699（原油）',  ticker:'1699', category:'コモディティ総合',   region:'米国',   change:-0.12, price:320,    currency:'¥', fee:'0.490%', volume:'0.2×', isOwned:false, reason:'原油価格上昇局面でのヘッジ・コモディティ分散' },
  // 61-70
  { rank:61, name:'iShares iBoxx Investment Grade Bond',    shortName:'LQD',          ticker:'LQD',  category:'投資適格社債',       region:'米国',   change:-0.14, price:108.40, currency:'$', fee:'0.140%', volume:'0.2×', isOwned:false, reason:'優良企業社債に投資・国債より高い安定利回り' },
  { rank:62, name:'iShares iBoxx High Yield Bond ETF',      shortName:'HYG',          ticker:'HYG',  category:'ハイイールド債',     region:'米国',   change:-0.16, price:78.20,  currency:'$', fee:'0.490%', volume:'0.3×', isOwned:false, reason:'ジャンク債への投資・リスク高いが利回りも高い' },
  { rank:63, name:'iShares J.P. Morgan Emerging Market Bond',shortName:'EMB',         ticker:'EMB',  category:'新興国債券',         region:'新興国', change:-0.18, price:88.40,  currency:'$', fee:'0.390%', volume:'0.2×', isOwned:false, reason:'新興国政府債券・高利回りと為替差益の両方を狙う' },
  { rank:64, name:'Vanguard Total International Bond ETF',  shortName:'BNDX',         ticker:'BNDX', category:'国際債券',           region:'先進国', change:-0.20, price:48.60,  currency:'$', fee:'0.070%', volume:'0.2×', isOwned:false, reason:'国際債券への分散・米国債以外の安定した利回り確保' },
  { rank:65, name:'iShares 外国債券ETF',                    shortName:'1677（外国債）',ticker:'1677', category:'外国債券',           region:'先進国', change:-0.22, price:1180,   currency:'¥', fee:'0.250%', volume:'0.1×', isOwned:false, reason:'外国債券ETF・東証上場で円建て投資が可能' },
  { rank:66, name:'Vanguard FTSE Pacific ETF',              shortName:'VPL',          ticker:'VPL',  category:'アジア太平洋',       region:'アジア', change:-0.24, price:68.40,  currency:'$', fee:'0.080%', volume:'0.2×', isOwned:false, reason:'アジア太平洋株式・日本除く成長地域に分散投資' },
  { rank:67, name:'iShares MSCI Brazil ETF',                shortName:'EWZ',          ticker:'EWZ',  category:'新興国株式',         region:'新興国', change:-0.27, price:28.40,  currency:'$', fee:'0.590%', volume:'0.4×', isOwned:false, reason:'ブラジルの資源・農業大国としての成長期待' },
  { rank:68, name:'iShares MSCI Taiwan ETF',                shortName:'EWT',          ticker:'EWT',  category:'アジア太平洋',       region:'アジア', change:-0.30, price:42.80,  currency:'$', fee:'0.590%', volume:'0.3×', isOwned:false, reason:'台湾の半導体産業・TSMC等テクノロジー企業中心' },
  { rank:69, name:'iShares MSCI South Korea ETF',           shortName:'EWY',          ticker:'EWY',  category:'アジア太平洋',       region:'アジア', change:-0.33, price:58.40,  currency:'$', fee:'0.590%', volume:'0.2×', isOwned:false, reason:'韓国のIT・自動車・半導体産業への投資' },
  { rank:70, name:'iShares MSCI Australia ETF',             shortName:'EWA',          ticker:'EWA',  category:'先進国株式',         region:'先進国', change:-0.36, price:22.40,  currency:'$', fee:'0.500%', volume:'0.1×', isOwned:false, reason:'オーストラリアの資源・金融セクターに投資' },
  // 71-80
  { rank:71, name:'iShares MSCI Canada ETF',                shortName:'EWC',          ticker:'EWC',  category:'先進国株式',         region:'先進国', change:-0.39, price:38.40,  currency:'$', fee:'0.500%', volume:'0.1×', isOwned:false, reason:'カナダの資源・金融セクターへの分散投資' },
  { rank:72, name:'iShares MSCI Germany ETF',               shortName:'EWG',          ticker:'EWG',  category:'先進国株式',         region:'欧州',   change:-0.42, price:28.80,  currency:'$', fee:'0.500%', volume:'0.2×', isOwned:false, reason:'ドイツの製造業・輸出産業への投資' },
  { rank:73, name:'iShares MSCI France ETF',                shortName:'EWQ',          ticker:'EWQ',  category:'先進国株式',         region:'欧州',   change:-0.45, price:32.40,  currency:'$', fee:'0.500%', volume:'0.1×', isOwned:false, reason:'フランスの高級品・航空宇宙・エネルギー産業' },
  { rank:74, name:'iShares MSCI Italy ETF',                 shortName:'EWI',          ticker:'EWI',  category:'先進国株式',         region:'欧州',   change:-0.48, price:28.20,  currency:'$', fee:'0.500%', volume:'0.1×', isOwned:false, reason:'イタリアの金融・製造業・観光業への投資' },
  { rank:75, name:'iShares MSCI Spain ETF',                 shortName:'EWP',          ticker:'EWP',  category:'先進国株式',         region:'欧州',   change:-0.51, price:32.80,  currency:'$', fee:'0.500%', volume:'0.1×', isOwned:false, reason:'スペインの金融・インフラ・エネルギー産業' },
  { rank:76, name:'iShares MSCI Sweden ETF',                shortName:'EWD',          ticker:'EWD',  category:'先進国株式',         region:'欧州',   change:-0.54, price:38.40,  currency:'$', fee:'0.590%', volume:'0.1×', isOwned:false, reason:'スウェーデンの高技術・イノベーション産業' },
  { rank:77, name:'iShares MSCI Netherlands ETF',           shortName:'EWN',          ticker:'EWN',  category:'先進国株式',         region:'欧州',   change:-0.57, price:42.60,  currency:'$', fee:'0.500%', volume:'0.1×', isOwned:false, reason:'オランダのテクノロジー・石油・金融産業' },
  { rank:78, name:'iShares MSCI Hong Kong ETF',             shortName:'EWH',          ticker:'EWH',  category:'アジア太平洋',       region:'アジア', change:-0.60, price:18.40,  currency:'$', fee:'0.590%', volume:'0.2×', isOwned:false, reason:'香港市場・中国本土との連動で割安感あり' },
  { rank:79, name:'iShares MSCI Singapore ETF',             shortName:'EWS',          ticker:'EWS',  category:'アジア太平洋',       region:'アジア', change:-0.63, price:22.80,  currency:'$', fee:'0.500%', volume:'0.1×', isOwned:false, reason:'シンガポールの金融ハブ・ASEAN成長の恩恵' },
  { rank:80, name:'iShares MSCI Indonesia ETF',             shortName:'EIDO',         ticker:'EIDO', category:'新興国株式',         region:'新興国', change:-0.66, price:18.40,  currency:'$', fee:'0.590%', volume:'0.1×', isOwned:false, reason:'インドネシアの人口増・消費拡大・資源輸出' },
  // 81-90
  { rank:81, name:'iShares MSCI Malaysia ETF',              shortName:'EWM',          ticker:'EWM',  category:'新興国株式',         region:'新興国', change:-0.70, price:22.40,  currency:'$', fee:'0.500%', volume:'0.1×', isOwned:false, reason:'マレーシアの石油・パーム油・製造業への投資' },
  { rank:82, name:'iShares MSCI Thailand ETF',              shortName:'THD',          ticker:'THD',  category:'新興国株式',         region:'新興国', change:-0.74, price:68.40,  currency:'$', fee:'0.590%', volume:'0.1×', isOwned:false, reason:'タイの観光回復・輸出産業の持ち直し期待' },
  { rank:83, name:'iShares MSCI Philippines ETF',           shortName:'EPHE',         ticker:'EPHE', category:'新興国株式',         region:'新興国', change:-0.78, price:18.40,  currency:'$', fee:'0.590%', volume:'0.1×', isOwned:false, reason:'フィリピンのBPO・OFW送金・消費拡大' },
  { rank:84, name:'VanEck Vietnam ETF',                     shortName:'VNM',          ticker:'VNM',  category:'新興国株式',         region:'新興国', change:-0.82, price:12.40,  currency:'$', fee:'0.660%', volume:'0.1×', isOwned:false, reason:'ベトナムの製造業シフト・中国代替として注目' },
  { rank:85, name:'iShares MSCI Turkey ETF',                shortName:'TUR',          ticker:'TUR',  category:'新興国株式',         region:'新興国', change:-0.86, price:28.40,  currency:'$', fee:'0.590%', volume:'0.2×', isOwned:false, reason:'トルコの高インフレ・通貨リスクあるが割安感' },
  { rank:86, name:'VanEck Russia Alternative ETF',          shortName:'RSX（代替）',  ticker:'—',    category:'新興国株式',         region:'新興国', change:-0.91, price:8.40,   currency:'$', fee:'0.650%', volume:'0.1×', isOwned:false, reason:'地政学リスク高く投資困難・代替銘柄を検討' },
  { rank:87, name:'iShares Global Clean Energy ETF',        shortName:'ICLN',         ticker:'ICLN', category:'クリーンエネルギー', region:'全世界', change:-0.96, price:12.80,  currency:'$', fee:'0.420%', volume:'0.3×', isOwned:false, reason:'再生エネルギー政策の転換・補助金削減で下落圧力' },
  { rank:88, name:'Invesco Solar ETF',                      shortName:'TAN',          ticker:'TAN',  category:'太陽光',             region:'米国',   change:-1.02, price:28.40,  currency:'$', fee:'0.690%', volume:'0.3×', isOwned:false, reason:'太陽光パネル価格の下落・補助金終了で収益悪化' },
  { rank:89, name:'First Trust NASDAQ Clean Edge Energy',   shortName:'QCLN',         ticker:'QCLN', category:'クリーンエネルギー', region:'米国',   change:-1.08, price:38.40,  currency:'$', fee:'0.600%', volume:'0.2×', isOwned:false, reason:'政策支援の縮小でクリーンエネルギー銘柄が調整' },
  { rank:90, name:'iShares Global Timber & Forestry ETF',  shortName:'WOOD',         ticker:'WOOD', category:'林業・木材',         region:'米国',   change:-1.14, price:82.40,  currency:'$', fee:'0.470%', volume:'0.1×', isOwned:false, reason:'木材需要の低迷・住宅着工件数の減少が影響' },
  // 91-100
  { rank:91, name:'VanEck Agribusiness ETF',                shortName:'MOO',          ticker:'MOO',  category:'アグリビジネス',     region:'全世界', change:-1.20, price:82.40,  currency:'$', fee:'0.560%', volume:'0.1×', isOwned:false, reason:'農業コモディティの価格下落・農業株が低迷' },
  { rank:92, name:'U.S. Global Jets ETF',                   shortName:'JETS',         ticker:'JETS', category:'航空',               region:'米国',   change:-1.28, price:18.40,  currency:'$', fee:'0.600%', volume:'0.2×', isOwned:false, reason:'航空需要は回復も燃料コスト高・収益圧迫が続く' },
  { rank:93, name:'ETFMG Travel Tech ETF',                  shortName:'AWAY',         ticker:'AWAY', category:'旅行',               region:'米国',   change:-1.36, price:22.40,  currency:'$', fee:'0.700%', volume:'0.1×', isOwned:false, reason:'旅行需要は回復基調も過熱感・利益確定売り圧力' },
  { rank:94, name:'Global X Robotics & AI ETF',             shortName:'BOTZ',         ticker:'BOTZ', category:'ロボティクス',       region:'全世界', change:-1.44, price:28.40,  currency:'$', fee:'0.680%', volume:'0.2×', isOwned:false, reason:'ロボット・AI期待は高いが足元の収益化に時間' },
  { rank:95, name:'Robo Global Robotics & Automation ETF',  shortName:'ROBO',         ticker:'ROBO', category:'ロボティクス',       region:'全世界', change:-1.52, price:48.40,  currency:'$', fee:'0.950%', volume:'0.2×', isOwned:false, reason:'産業用ロボットの普及は長期テーマ・短期は調整中' },
  { rank:96, name:'ETFMG Prime Cyber Security ETF',         shortName:'HACK',         ticker:'HACK', category:'サイバーセキュリティ',region:'米国',   change:-1.61, price:58.40,  currency:'$', fee:'0.600%', volume:'0.2×', isOwned:false, reason:'サイバー攻撃増加で需要は高いが株価は高値圏' },
  { rank:97, name:'First Trust NASDAQ Cybersecurity ETF',   shortName:'CIBR',         ticker:'CIBR', category:'サイバーセキュリティ',region:'米国',   change:-1.70, price:48.20,  currency:'$', fee:'0.600%', volume:'0.1×', isOwned:false, reason:'セキュリティ予算の増加は続くが株価割高感あり' },
  { rank:98, name:'Procure Space ETF',                      shortName:'UFO',          ticker:'UFO',  category:'宇宙開発',           region:'全世界', change:-1.80, price:12.40,  currency:'$', fee:'0.750%', volume:'0.1×', isOwned:false, reason:'宇宙開発は長期テーマ・収益化はまだ先で下落中' },
  { rank:99, name:'ARK Next Generation Internet ETF',       shortName:'ARKW',         ticker:'ARKW', category:'次世代インターネット',region:'米国',   change:-1.91, price:38.40,  currency:'$', fee:'0.880%', volume:'0.2×', isOwned:false, reason:'次世代インターネット銘柄・金利上昇で成長株が調整' },
  { rank:100,name:'ARK Genomic Revolution ETF',             shortName:'ARKG',         ticker:'ARKG', category:'ゲノム革命',         region:'米国',   change:-2.04, price:18.40,  currency:'$', fee:'0.750%', volume:'0.2×', isOwned:false, reason:'ゲノム・バイオ銘柄・規制リスクと収益化の遅れ' },
]

const PAGE_SIZE = 20

// ─── fee カラー ────────────────────────────────────────────────
function feeColor(feeStr) {
  const v = parseFloat(feeStr)
  if (v < 0.1)  return C.up
  if (v <= 0.5) return C.ink
  return C.down
}

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

const COL = '32px 1fr 90px 80px 80px 70px 52px'

// ─── RankingPage ───────────────────────────────────────────────
export default function RankingPage() {
  const [fundData,     setFundData    ] = useState(FUND_DATA_INIT)
  const [period,       setPeriod      ] = useState('1D')
  const [cat,          setCat         ] = useState('all')
  const [region,       setRegion      ] = useState('all')
  const [currentPage,  setCurrentPage ] = useState(1)
  const [lastUpdated,  setLastUpdated ] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const now = useTime()

  const fmtJSTFull = date => {
    const d = date.toLocaleDateString('ja-JP', { timeZone:'Asia/Tokyo', year:'numeric', month:'2-digit', day:'2-digit' })
    const t = date.toLocaleTimeString('ja-JP', { timeZone:'Asia/Tokyo', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false })
    return `${d} ${t} JST`
  }

  // ── Refresh ───────────────────────────────────────────────────
  function handleRefresh() {
    setIsRefreshing(true)
    setFundData(prev => prev.map(f => ({
      ...f,
      change: Math.round((f.change + (Math.random() - 0.5) * 0.6) * 100) / 100,
    })))
    setTimeout(() => {
      setIsRefreshing(false)
      setLastUpdated(new Date())
    }, 1200)
  }

  // ── Filter ────────────────────────────────────────────────────
  const filtered = fundData.filter(f => {
    if (region !== 'all' && f.region !== region) return false
    if (cat === 'all') return true
    if (cat === 'ai')        return f.category === 'AI・半導体'
    if (cat === 'us_equity') return ['米国株式','米国グロース'].includes(f.category)
    if (cat === 'intl')      return ['先進国株式','アジア太平洋'].includes(f.category)
    if (cat === 'em')        return ['新興国株式','インド'].includes(f.category)
    if (cat === 'jp')        return ['国内ETF','国内株式','日本株'].includes(f.category)
    if (cat === 'sector')    return ['情報技術','ヘルスケア','金融','エネルギー','資本財','生活必需品','公益事業','素材','不動産','通信','防衛','革新的技術','クリーンエネルギー','太陽光','林業・木材','アグリビジネス','航空','旅行','ロボティクス','サイバーセキュリティ','宇宙開発','次世代インターネット','ゲノム革命'].includes(f.category)
    if (cat === 'bond')      return ['米国債券','長期米国債','投資適格社債','ハイイールド債','新興国債券','国際債券','外国債券'].includes(f.category)
    if (cat === 'commodity') return ['コモディティ','コモディティ総合','金','銀'].includes(f.category)
    if (cat === 'balance')   return f.category === 'バランス'
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(currentPage, totalPages)
  const pageData   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function changePeriod(p)  { setPeriod(p);  setCurrentPage(1) }
  function changeCat(v)     { setCat(v);     setCurrentPage(1) }
  function changeRegion(v)  { setRegion(v);  setCurrentPage(1) }

  function goPage(n) {
    setCurrentPage(n)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const SVG_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%238C8C8C' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`
  const selectStyle = {
    fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:500,
    padding:'6px 28px 6px 12px', border:`0.5px solid ${C.border}`,
    borderRadius:8, background:C.card, color:C.subtle, cursor:'pointer',
    appearance:'none', backgroundImage:SVG_ARROW,
    backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center',
  }

  return (
    <div style={{ background:C.bg, fontFamily:"'Syne',sans-serif", color:C.ink }}>

      {/* sub-header */}
      <div style={{ background:'rgba(248,247,244,.95)', backdropFilter:'blur(12px)',
        borderBottom:`1px solid ${C.border}`, padding:'0 28px', height:48,
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:C.subtle, letterSpacing:'0.04em' }}>
          {fmtJSTFull(now)}
        </div>
        {/* 更新ボタン */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:11, color:C.muted, fontFamily:"'DM Mono',monospace" }}>
            更新: {lastUpdated.toLocaleTimeString('ja-JP', { hour:'2-digit', minute:'2-digit' })}
          </span>
          <button onClick={handleRefresh} disabled={isRefreshing} style={{
            fontSize:12, padding:'5px 14px', borderRadius:20,
            border:`0.5px solid rgba(26,26,46,0.2)`,
            background:isRefreshing ? C.goldLight : C.ink,
            color:isRefreshing ? C.goldText : '#FFFFFF',
            cursor:isRefreshing ? 'not-allowed' : 'pointer',
            fontFamily:"'Syne',sans-serif", transition:'all .2s',
            display:'flex', alignItems:'center', gap:5 }}>
            {isRefreshing ? '更新中...' : '↻ 更新'}
          </button>
        </div>
      </div>

      <main style={{ maxWidth:1060, margin:'0 auto', padding:'22px 24px 56px' }}>

        {/* ── Filters ─────────────────────────────────────── */}
        <section style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap',
          marginBottom:20, padding:'12px 16px',
          background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
          boxShadow:'0 1px 6px rgba(0,0,0,.04)' }}>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {PERIODS.map(p => {
              const active = period === p
              return (
                <button key={p} onClick={() => changePeriod(p)} style={{
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
          <select value={cat}    onChange={e => changeCat(e.target.value)}    style={selectStyle}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={region} onChange={e => changeRegion(e.target.value)} style={selectStyle}>
            {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <div style={{ marginLeft:'auto', fontFamily:"'DM Mono',monospace", fontSize:11, color:C.muted }}>
            {filtered.length}件 / {totalPages}ページ
          </div>
        </section>

        {/* ── Summary Cards ───────────────────────────────── */}
        <section style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:22 }}>
          <SummaryCard label="対象ファンド数" value="100" sub="ETF 72 / 投信 28"/>
          <SummaryCard label="上昇ファンド"   value="53"  sub="100件中 53%が上昇中" valueColor={C.up}/>
          <SummaryCard label={`平均騰落率（${period}）`} value="+0.42%" sub="あなたのPF +2.31%" valueColor={C.up}/>
        </section>

        {/* ── Ranking Table ────────────────────────────────── */}
        <section>
          <div style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:16, overflow:'hidden', boxShadow:'0 2px 14px rgba(0,0,0,.05)',
            opacity:isRefreshing ? 0.5 : 1, transition:'opacity .3s' }}>

            {/* thead */}
            <div style={{ display:'grid', gridTemplateColumns:COL, padding:'10px 20px',
              background:'#F3F1EC', borderBottom:`1px solid ${C.border}`, gap:12, alignItems:'end' }}>
              {[
                { label:'#' },
                { label:'ファンド名' },
                { label:'上昇率', center:true },
                { label:'基準価額（円）', sub:'1USD=¥151.5換算', center:true },
                { label:'信託報酬（年率）', center:true },
                { label:'出来高比', center:true },
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
              const isTop3 = fund.rank <= 3
              const subCol = fund.isOwned ? '#4A3A1A' : C.subtle
              const isLast = idx === pageData.length - 1
              const reasonColor = fund.isOwned ? C.ink : '#6B6B7A'
              return (
                <div key={fund.rank}
                  onClick={() => sendPrompt(`${fund.name}の詳細分析をして`)}
                  style={{ display:'grid', gridTemplateColumns:COL,
                    padding:'12px 20px', gap:12, alignItems:'center',
                    background:fund.isOwned ? C.goldLight : C.card,
                    borderBottom:isLast ? 'none' : `1px solid ${fund.isOwned ? '#E8D9A8' : C.border}`,
                    cursor:'pointer', transition:'background .15s' }}>

                  {/* rank */}
                  <div style={{ fontFamily:"'DM Mono',monospace", fontWeight:500,
                    fontSize:isTop3?16:13, color:isTop3?C.gold:C.muted,
                    textAlign:'center', letterSpacing:'-0.02em' }}>
                    {fund.rank}
                  </div>

                  {/* name + reason + tags */}
                  <div style={{ display:'flex', flexDirection:'column', gap:3, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                      <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13,
                        color:C.ink, whiteSpace:'nowrap' }}>
                        {fund.shortName}
                      </span>
                      {fund.ticker && fund.ticker !== '—' && (
                        <span style={{ fontFamily:"'DM Mono',monospace", fontWeight:400,
                          fontSize:11, color:subCol }}>({fund.ticker})</span>
                      )}
                    </div>
                    <div style={{ fontSize:11, color:reasonColor, fontStyle:'italic',
                      marginTop:1, lineHeight:1.5 }}>
                      {fund.reason}
                    </div>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center', marginTop:1 }}>
                      <RankCatTag label={fund.category}/>
                      {fund.isOwned && <OwnedBadge/>}
                    </div>
                  </div>

                  {/* change % */}
                  <div style={{ fontFamily:"'DM Mono',monospace", fontWeight:500, fontSize:14,
                    color:pctColor(fund.change), textAlign:'center', letterSpacing:'-0.02em' }}>
                    {fmtPct(fund.change)}
                  </div>

                  {/* price (JPY) */}
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12,
                    color:subCol, textAlign:'center' }}>
                    {formatPrice(fund.price, fund.currency)}
                  </div>

                  {/* fee */}
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:500,
                    color:feeColor(fund.fee), textAlign:'center', letterSpacing:'0.01em' }}>
                    {fund.fee}
                  </div>

                  {/* volume */}
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12,
                    color:fund.volume ? C.up : 'transparent', textAlign:'center',
                    fontWeight:fund.volume ? 500 : 400 }}>
                    {fund.volume ?? '—'}
                  </div>

                  <div/>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Pagination ───────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginTop:24 }}>
          <button onClick={() => goPage(safePage - 1)} disabled={safePage <= 1}
            style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600,
              padding:'7px 16px', border:`1px solid ${C.border}`, borderRadius:8,
              background:C.card, color:safePage<=1?C.muted:C.subtle,
              opacity:safePage<=1?0.4:1, cursor:safePage<=1?'not-allowed':'pointer', transition:'all .15s' }}>
            ← 前へ
          </button>
          <div style={{ display:'flex', gap:4 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => goPage(n)} style={{
                fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:500,
                width:34, height:34, borderRadius:8,
                border:n===safePage?'none':`1px solid ${C.border}`,
                background:n===safePage?C.ink:C.card,
                color:n===safePage?'#FFF':C.subtle, cursor:'pointer', transition:'all .15s' }}>
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
              opacity:safePage>=totalPages?0.4:1, cursor:safePage>=totalPages?'not-allowed':'pointer', transition:'all .15s' }}>
            次へ →
          </button>
        </div>

        {/* ── Footer note ──────────────────────────────────── */}
        <div style={{ marginTop:22, padding:'11px 16px',
          background:'rgba(201,168,76,0.07)', border:'1px solid rgba(201,168,76,0.25)',
          borderRadius:10, fontFamily:"'Syne',sans-serif", fontSize:11, color:C.goldText }}>
          黄背景 = あなたの保有ファンド｜信託報酬: 緑=低コスト(&lt;0.1%) 黒=中コスト 赤=高コスト(&gt;0.5%)｜価格は1USD=¥151.5換算（モック）
        </div>
      </main>
    </div>
  )
}
