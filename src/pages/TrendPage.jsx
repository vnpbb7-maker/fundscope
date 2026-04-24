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

// ─── 為替レート（モック） ──────────────────────────────────────
const USD_JPY = 151.5
const formatPrice = (price, currency) => {
  if (currency === '¥') return '¥' + Math.round(price).toLocaleString('ja-JP')
  return '¥' + Math.round(price * USD_JPY).toLocaleString('ja-JP')
}

// ─── fee カラー ────────────────────────────────────────────────
function feeColor(feeStr) {
  const v = parseFloat(feeStr)
  if (v < 0.1)  return C.up
  if (v <= 0.5) return C.ink
  return C.down
}

// ─── Sector Heatmap Data ───────────────────────────────────────
const SECTORS = [
  { id:'ai',      name:'AI・半導体',         pct: 3.82, etf:'SOXX / SMH',  hot:true  },
  { id:'defense', name:'防衛・地政学',       pct: 2.41, etf:'DFND / ITA',  hot:false },
  { id:'global',  name:'全世界・先進国',     pct: 2.88, etf:'eMAXIS / VTI',hot:false },
  { id:'japan',   name:'日本株',            pct: 1.92, etf:'412A / 1306', hot:false },
  { id:'em',      name:'新興国',            pct: 1.44, etf:'EPI / VWO',   hot:false },
  { id:'energy',  name:'エネルギー・商品',   pct: 1.14, etf:'GLD / XLE',   hot:false },
  { id:'health',  name:'ヘルスケア',        pct: 0.68, etf:'XLV / VHT',   hot:false },
  { id:'clean',   name:'クリーンエネルギー', pct:-0.82, etf:'ICLN / TAN',  hot:false },
]

// ─── Theme Data (10テーマ × 10件 = 100件) ─────────────────────
const THEME_DATA = {
  'AI・半導体': [
    { id:1,  shortName:'SOXX',   ticker:'SOXX', change:+5.24, price:248.60, currency:'$', fee:'0.350%', reason:'Nvidia Blackwell需要急増・AI半導体サイクル加速', isOwned:false },
    { id:2,  shortName:'AIQ',    ticker:'AIQ',  change:+4.73, price:32.14,  currency:'$', fee:'0.680%', reason:'エージェントAI普及・DCサーバー投資拡大', isOwned:false },
    { id:3,  shortName:'SMH',    ticker:'SMH',  change:+3.92, price:218.60, currency:'$', fee:'0.350%', reason:'半導体設計・製造企業に集中投資・SOXXより銘柄数絞る', isOwned:false },
    { id:4,  shortName:'VGT',    ticker:'VGT',  change:+3.44, price:512.40, currency:'$', fee:'0.100%', reason:'情報技術セクター全体・低コストで米国IT大手を網羅', isOwned:false },
    { id:5,  shortName:'XLK',    ticker:'XLK',  change:+3.21, price:218.40, currency:'$', fee:'0.090%', reason:'S&P500のIT比率が高く・テクノロジー株全般が好調', isOwned:false },
    { id:6,  shortName:'FTEC',   ticker:'FTEC', change:+3.05, price:188.20, currency:'$', fee:'0.084%', reason:'Fidelity製低コストITセクターETF・VGTの代替', isOwned:false },
    { id:7,  shortName:'BOTZ',   ticker:'BOTZ', change:+2.88, price:28.40,  currency:'$', fee:'0.680%', reason:'産業ロボット・AI自動化銘柄に特化・長期テーマ', isOwned:false },
    { id:8,  shortName:'ROBO',   ticker:'ROBO', change:+2.44, price:48.40,  currency:'$', fee:'0.950%', reason:'ロボティクス・自動化の広範な銘柄に均等分散', isOwned:false },
    { id:9,  shortName:'HACK',   ticker:'HACK', change:+2.11, price:58.40,  currency:'$', fee:'0.600%', reason:'AI時代のサイバーセキュリティ需要急増で注目', isOwned:false },
    { id:10, shortName:'CIBR',   ticker:'CIBR', change:+1.88, price:48.20,  currency:'$', fee:'0.600%', reason:'セキュリティ予算増加・First Trust製ETF', isOwned:false },
  ],
  '防衛・地政学': [
    { id:11, shortName:'DFND',   ticker:'DFND', change:+4.18, price:41.88,  currency:'$', fee:'0.550%', reason:'NATO加盟国の国防費増加・欧州防衛予算拡大', isOwned:false },
    { id:12, shortName:'ITA',    ticker:'ITA',  change:+3.82, price:158.40, currency:'$', fee:'0.400%', reason:'米国防衛産業大手（ロッキード・レイセオン）に集中', isOwned:false },
    { id:13, shortName:'XAR',    ticker:'XAR',  change:+3.55, price:128.60, currency:'$', fee:'0.350%', reason:'航空宇宙・防衛に均等加重・中小企業も含む', isOwned:false },
    { id:14, shortName:'SHLD',   ticker:'SHLD', change:+3.28, price:38.20,  currency:'$', fee:'0.650%', reason:'グローバル防衛・サイバーセキュリティ複合ETF', isOwned:false },
    { id:15, shortName:'PPA',    ticker:'PPA',  change:+3.01, price:88.40,  currency:'$', fee:'0.580%', reason:'防衛・宇宙産業にフォーカス・PowerShares製', isOwned:false },
    { id:16, shortName:'DFEN',   ticker:'DFEN', change:+2.74, price:18.60,  currency:'$', fee:'0.980%', reason:'防衛株3倍レバレッジ・高リスク高リターン', isOwned:false },
    { id:17, shortName:'2648',   ticker:'2648', change:+2.44, price:1840,   currency:'¥', fee:'0.440%', reason:'東証上場・グローバル防衛企業に円建て投資', isOwned:false },
    { id:18, shortName:'EUAD',   ticker:'EUAD', change:+2.18, price:28.40,  currency:'$', fee:'0.490%', reason:'欧州防衛企業特化・ドイツ・フランス・英国中心', isOwned:false },
    { id:19, shortName:'MISL',   ticker:'MISL', change:+1.92, price:22.80,  currency:'$', fee:'0.550%', reason:'ミサイル・精密誘導兵器メーカーに特化', isOwned:false },
    { id:20, shortName:'UFO',    ticker:'UFO',  change:+1.66, price:12.40,  currency:'$', fee:'0.750%', reason:'宇宙開発・宇宙防衛の長期テーマに投資', isOwned:false },
  ],
  '全世界・先進国': [
    { id:21, shortName:'eMAXIS AC',  ticker:'',     change:+3.61, price:28440,  currency:'¥', fee:'0.058%', reason:'円安進行＋先進国株高・低コストが長期積立に有利', isOwned:true },
    { id:22, shortName:'SBI S&P500', ticker:'',     change:+3.44, price:31220,  currency:'¥', fee:'0.094%', reason:'米国企業業績好調・Fed利下げ期待で株高継続', isOwned:true },
    { id:23, shortName:'ニッセイ外国', ticker:'',   change:+3.31, price:58110,  currency:'¥', fee:'0.094%', reason:'先進国株式全般に恩恵・低コスト（0.094%）が強み', isOwned:true },
    { id:24, shortName:'VOO',        ticker:'VOO',  change:+3.18, price:498.20, currency:'$', fee:'0.030%', reason:'S&P500に超低コスト（0.03%）で連動・長期保有向き', isOwned:false },
    { id:25, shortName:'VTI',        ticker:'VTI',  change:+3.05, price:248.90, currency:'$', fee:'0.030%', reason:'米国全株式3600社以上・中小型株成長も取り込む', isOwned:false },
    { id:26, shortName:'VEA',        ticker:'VEA',  change:+2.88, price:48.60,  currency:'$', fee:'0.050%', reason:'先進国（米国除く）への低コスト投資', isOwned:false },
    { id:27, shortName:'EFA',        ticker:'EFA',  change:+2.72, price:78.20,  currency:'$', fee:'0.320%', reason:'欧州・アジア先進国へ広く分散・円安恩恵あり', isOwned:false },
    { id:28, shortName:'はじめてAC', ticker:'',     change:+2.55, price:14820,  currency:'¥', fee:'0.058%', reason:'全世界株式・NISA成長投資枠で月1万円から積立', isOwned:true },
    { id:29, shortName:'VT',         ticker:'VT',   change:+2.38, price:108.40, currency:'$', fee:'0.070%', reason:'全世界株式に一本で投資・新興国も含む分散', isOwned:false },
    { id:30, shortName:'ACWI',       ticker:'ACWI', change:+2.21, price:112.40, currency:'$', fee:'0.320%', reason:'MSCIオールカントリー連動・機関投資家にも人気', isOwned:false },
  ],
  '日本株': [
    { id:31, shortName:'ニッセイTOPIX', ticker:'',     change:+2.18, price:18840, currency:'¥', fee:'0.143%', reason:'国内景気回復・日銀政策正常化で日本株見直し買い', isOwned:true },
    { id:32, shortName:'ETF 412A',     ticker:'412A', change:+2.41, price:2521,  currency:'¥', fee:'0.078%', reason:'東証ETF・低コスト・NISA成長投資枠で積立最適', isOwned:true },
    { id:33, shortName:'1306',         ticker:'1306', change:+2.05, price:2480,  currency:'¥', fee:'0.088%', reason:'TOPIX連動の老舗ETF・国内機関投資家の需要高い', isOwned:false },
    { id:34, shortName:'1321',         ticker:'1321', change:+1.92, price:44200, currency:'¥', fee:'0.220%', reason:'日経225連動・流動性高く個人投資家に人気', isOwned:false },
    { id:35, shortName:'EWJ',          ticker:'EWJ',  change:+1.78, price:68.40, currency:'$', fee:'0.500%', reason:'日本株ETF・米国上場で外国人投資家が日本株買い', isOwned:false },
    { id:36, shortName:'1478',         ticker:'1478', change:+1.65, price:2840,  currency:'¥', fee:'0.209%', reason:'MSCIジャパン高配当・安定配当企業に絞った投資', isOwned:false },
    { id:37, shortName:'DXJ',          ticker:'DXJ',  change:+1.52, price:88.40, currency:'$', fee:'0.480%', reason:'円安ヘッジ付き日本株・輸出企業の恩恵を享受', isOwned:false },
    { id:38, shortName:'SCJ',          ticker:'SCJ',  change:+1.38, price:58.40, currency:'$', fee:'0.500%', reason:'日本の小型株に特化・内需拡大の恩恵', isOwned:false },
    { id:39, shortName:'2516',         ticker:'2516', change:+1.22, price:1840,  currency:'¥', fee:'0.187%', reason:'東証マザーズ連動・国内成長企業に投資', isOwned:false },
    { id:40, shortName:'1570',         ticker:'1570', change:+1.08, price:18200, currency:'¥', fee:'0.770%', reason:'日経平均レバレッジ2倍・短期トレード向き', isOwned:false },
  ],
  '新興国': [
    { id:41, shortName:'EPI',    ticker:'EPI',  change:+2.94, price:34.72, currency:'$', fee:'0.850%', reason:'インド株・モディ政権インフラ投資加速で高成長', isOwned:false },
    { id:42, shortName:'1678',   ticker:'1678', change:+2.55, price:3840,  currency:'¥', fee:'0.220%', reason:'東証上場インド株ETF・円建てでインド成長を享受', isOwned:false },
    { id:43, shortName:'VWO',    ticker:'VWO',  change:+2.18, price:42.80, currency:'$', fee:'0.080%', reason:'新興国全体への低コスト分散・ドル安で有利', isOwned:false },
    { id:44, shortName:'IEMG',   ticker:'IEMG', change:+1.88, price:52.40, currency:'$', fee:'0.090%', reason:'新興国株式・中国・台湾・インド等に幅広く分散', isOwned:false },
    { id:45, shortName:'EWZ',    ticker:'EWZ',  change:+1.62, price:28.40, currency:'$', fee:'0.590%', reason:'ブラジルの資源・農業大国としての回復期待', isOwned:false },
    { id:46, shortName:'FXI',    ticker:'FXI',  change:+1.38, price:28.40, currency:'$', fee:'0.740%', reason:'中国大型株・政策刺激・景気回復期待で反発', isOwned:false },
    { id:47, shortName:'MCHI',   ticker:'MCHI', change:+1.15, price:44.20, currency:'$', fee:'0.590%', reason:'MSCIチャイナ連動・テンセント・アリババ等', isOwned:false },
    { id:48, shortName:'EWT',    ticker:'EWT',  change:+0.92, price:42.80, currency:'$', fee:'0.590%', reason:'台湾株・TSMC中心の半導体産業が牽引', isOwned:false },
    { id:49, shortName:'EWY',    ticker:'EWY',  change:+0.68, price:58.40, currency:'$', fee:'0.590%', reason:'韓国株・サムスン・現代など輸出企業が中心', isOwned:false },
    { id:50, shortName:'VNM',    ticker:'VNM',  change:+0.44, price:12.40, currency:'$', fee:'0.660%', reason:'ベトナムの製造業シフト・中国代替として注目', isOwned:false },
  ],
  'エネルギー・コモディティ': [
    { id:51, shortName:'GLD',    ticker:'GLD',  change:+1.82, price:218.40, currency:'$', fee:'0.400%', reason:'地政学リスク・インフレ懸念で金価格上昇継続', isOwned:false },
    { id:52, shortName:'IAU',    ticker:'IAU',  change:+1.68, price:42.60,  currency:'$', fee:'0.250%', reason:'GLD代替・低コスト金ETF・少額から投資可能', isOwned:false },
    { id:53, shortName:'1540',   ticker:'1540', change:+1.55, price:8840,   currency:'¥', fee:'0.400%', reason:'東証上場金ETF・円建てで金投資が手軽にできる', isOwned:false },
    { id:54, shortName:'XLE',    ticker:'XLE',  change:+1.42, price:88.40,  currency:'$', fee:'0.090%', reason:'原油・天然ガス価格上昇でエネルギー企業増益', isOwned:false },
    { id:55, shortName:'SLV',    ticker:'SLV',  change:+1.28, price:28.40,  currency:'$', fee:'0.500%', reason:'太陽光・電池需要増加で銀の産業需要が拡大', isOwned:false },
    { id:56, shortName:'GSG',    ticker:'GSG',  change:+1.14, price:18.40,  currency:'$', fee:'0.750%', reason:'コモディティ全般への分散・インフレヘッジ効果', isOwned:false },
    { id:57, shortName:'DBB',    ticker:'DBB',  change:+1.01, price:22.80,  currency:'$', fee:'0.770%', reason:'銅・アルミ・亜鉛等の工業用金属に投資', isOwned:false },
    { id:58, shortName:'PDBC',   ticker:'PDBC', change:+0.88, price:14.80,  currency:'$', fee:'0.590%', reason:'多様なコモディティに分散・K-1不要の税務メリット', isOwned:false },
    { id:59, shortName:'1699',   ticker:'1699', change:+0.74, price:320,    currency:'¥', fee:'0.490%', reason:'東証上場原油連動ETF・円建てで原油投資', isOwned:false },
    { id:60, shortName:'URNM',   ticker:'URNM', change:+0.61, price:48.40,  currency:'$', fee:'0.750%', reason:'ウラン・原子力関連・脱炭素政策で需要回復', isOwned:false },
  ],
  'ヘルスケア': [
    { id:61, shortName:'XLV',    ticker:'XLV',  change:+1.20, price:142.80, currency:'$', fee:'0.090%', reason:'高齢化社会・医薬品需要増加・ディフェンシブ銘柄', isOwned:false },
    { id:62, shortName:'VHT',    ticker:'VHT',  change:+1.08, price:248.40, currency:'$', fee:'0.100%', reason:'米国ヘルスケア全体に低コストで分散', isOwned:false },
    { id:63, shortName:'IBB',    ticker:'IBB',  change:+0.95, price:148.60, currency:'$', fee:'0.440%', reason:'バイオテク・製薬の革新的創薬企業に集中投資', isOwned:false },
    { id:64, shortName:'ARKG',   ticker:'ARKG', change:+0.82, price:18.40,  currency:'$', fee:'0.750%', reason:'ゲノム革命・遺伝子治療の長期テーマに投資', isOwned:false },
    { id:65, shortName:'IHI',    ticker:'IHI',  change:+0.68, price:68.40,  currency:'$', fee:'0.400%', reason:'医療機器メーカーに特化・高齢化社会で需要増', isOwned:false },
    { id:66, shortName:'PPH',    ticker:'PPH',  change:+0.55, price:88.20,  currency:'$', fee:'0.360%', reason:'製薬大手（ファイザー・ジョンソン）に集中投資', isOwned:false },
    { id:67, shortName:'PJP',    ticker:'PJP',  change:+0.42, price:58.40,  currency:'$', fee:'0.580%', reason:'製薬業界全体への投資・パイプライン期待', isOwned:false },
    { id:68, shortName:'EDOC',   ticker:'EDOC', change:+0.28, price:14.80,  currency:'$', fee:'0.680%', reason:'デジタルヘルス・遠隔医療・AI診断の成長テーマ', isOwned:false },
    { id:69, shortName:'GNOM',   ticker:'GNOM', change:+0.15, price:22.40,  currency:'$', fee:'0.500%', reason:'ゲノミクス・精密医療の革命的技術に投資', isOwned:false },
    { id:70, shortName:'2243',   ticker:'2243', change:+0.02, price:1680,   currency:'¥', fee:'0.330%', reason:'東証上場グローバルヘルスケアETF・円建て投資', isOwned:false },
  ],
  '債券・REIT': [
    { id:71, shortName:'BND',    ticker:'BND',  change:+0.28, price:72.80,  currency:'$', fee:'0.030%', reason:'米国債券市場全体に超低コストで分散', isOwned:false },
    { id:72, shortName:'AGG',    ticker:'AGG',  change:+0.24, price:98.20,  currency:'$', fee:'0.030%', reason:'投資適格債券への分散・株式との相関低くリスク低減', isOwned:false },
    { id:73, shortName:'TLT',    ticker:'TLT',  change:+0.21, price:88.40,  currency:'$', fee:'0.150%', reason:'長期金利低下期待で価格上昇・デュレーション長め', isOwned:false },
    { id:74, shortName:'2621',   ticker:'2621', change:+0.18, price:1420,   currency:'¥', fee:'0.154%', reason:'東証上場米国長期国債ETF・円建てで金利差益', isOwned:false },
    { id:75, shortName:'LQD',    ticker:'LQD',  change:+0.14, price:108.40, currency:'$', fee:'0.140%', reason:'優良企業社債に投資・国債より高い安定利回り', isOwned:false },
    { id:76, shortName:'VNQ',    ticker:'VNQ',  change:+0.09, price:82.40,  currency:'$', fee:'0.120%', reason:'米国不動産市場の回復・金利低下でREIT上昇', isOwned:false },
    { id:77, shortName:'IYR',    ticker:'IYR',  change:+0.07, price:98.20,  currency:'$', fee:'0.400%', reason:'不動産全般への投資・高配当利回りが魅力', isOwned:false },
    { id:78, shortName:'EMB',    ticker:'EMB',  change:-0.18, price:88.40,  currency:'$', fee:'0.390%', reason:'新興国政府債券・高利回りと為替差益を狙う', isOwned:false },
    { id:79, shortName:'HYG',    ticker:'HYG',  change:-0.16, price:78.20,  currency:'$', fee:'0.490%', reason:'ハイイールド債・リスク高いが利回りも高い', isOwned:false },
    { id:80, shortName:'1476',   ticker:'1476', change:-0.31, price:2840,   currency:'¥', fee:'0.165%', reason:'東証上場REIT・国内不動産に低コストで投資', isOwned:false },
  ],
  'クリーンエネルギー': [
    { id:81, shortName:'ICLN',   ticker:'ICLN', change:-0.96, price:12.80,  currency:'$', fee:'0.420%', reason:'再エネ政策転換・補助金削減で短期調整中', isOwned:false },
    { id:82, shortName:'TAN',    ticker:'TAN',  change:-1.02, price:28.40,  currency:'$', fee:'0.690%', reason:'太陽光パネル価格下落・補助金終了で収益悪化', isOwned:false },
    { id:83, shortName:'QCLN',   ticker:'QCLN', change:-1.08, price:38.40,  currency:'$', fee:'0.600%', reason:'政策支援縮小でクリーンエネルギー株が調整', isOwned:false },
    { id:84, shortName:'ACES',   ticker:'ACES', change:-0.88, price:48.60,  currency:'$', fee:'0.450%', reason:'再生可能エネルギー全般・長期テーマだが短期調整', isOwned:false },
    { id:85, shortName:'SMOG',   ticker:'SMOG', change:-0.72, price:58.20,  currency:'$', fee:'0.580%', reason:'電気自動車・クリーン輸送への長期投資', isOwned:false },
    { id:86, shortName:'DRIV',   ticker:'DRIV', change:-0.65, price:28.80,  currency:'$', fee:'0.680%', reason:'自動運転・EVのサプライチェーン全体に投資', isOwned:false },
    { id:87, shortName:'LIT',    ticker:'LIT',  change:-0.58, price:38.40,  currency:'$', fee:'0.750%', reason:'リチウム・バッテリー技術・EV普及の恩恵期待', isOwned:false },
    { id:88, shortName:'REMX',   ticker:'REMX', change:-0.45, price:22.40,  currency:'$', fee:'0.560%', reason:'レアアース・クリーンエネルギー材料需要増加', isOwned:false },
    { id:89, shortName:'FAN',    ticker:'FAN',  change:-0.38, price:18.60,  currency:'$', fee:'0.620%', reason:'風力エネルギー・洋上風力の普及拡大に投資', isOwned:false },
    { id:90, shortName:'2584',   ticker:'2584', change:-0.25, price:1680,   currency:'¥', fee:'0.350%', reason:'東証上場クリーンエネルギーETF・円建て投資', isOwned:false },
  ],
  'バランス・その他': [
    { id:91,  shortName:'eMAXIS Balance', ticker:'',     change:+0.05, price:14820,  currency:'¥', fee:'0.143%', reason:'8資産均等分散で安定・積立に向いたバランスファンド', isOwned:false },
    { id:92,  shortName:'QQQ',            ticker:'QQQ',  change:+1.55, price:442.30, currency:'$', fee:'0.200%', reason:'AI・グロース株主導の上昇・ナスダック100に連動', isOwned:false },
    { id:93,  shortName:'VYM',            ticker:'VYM',  change:+0.02, price:128.40, currency:'$', fee:'0.060%', reason:'高配当株に絞り投資・安定的な配当収入を重視', isOwned:false },
    { id:94,  shortName:'SPYD',           ticker:'SPYD', change:-0.01, price:38.40,  currency:'$', fee:'0.070%', reason:'S&P500高配当80社・低コスト高利回りETF', isOwned:false },
    { id:95,  shortName:'DVY',            ticker:'DVY',  change:+0.01, price:118.40, currency:'$', fee:'0.380%', reason:'高配当利回り銘柄に集中・連続増配企業中心', isOwned:false },
    { id:96,  shortName:'JETS',           ticker:'JETS', change:-1.28, price:18.40,  currency:'$', fee:'0.600%', reason:'航空需要は回復も燃料コスト高・収益圧迫が続く', isOwned:false },
    { id:97,  shortName:'MOO',            ticker:'MOO',  change:-1.20, price:82.40,  currency:'$', fee:'0.560%', reason:'農業コモディティ価格下落・農業株が低迷', isOwned:false },
    { id:98,  shortName:'WOOD',           ticker:'WOOD', change:-1.14, price:82.40,  currency:'$', fee:'0.470%', reason:'木材需要低迷・住宅着工件数の減少が影響', isOwned:false },
    { id:99,  shortName:'ARKK',           ticker:'ARKK', change:+1.32, price:58.40,  currency:'$', fee:'0.750%', reason:'破壊的技術革新銘柄に集中投資・高リスク高リターン', isOwned:false },
    { id:100, shortName:'ARKW',           ticker:'ARKW', change:-1.91, price:38.40,  currency:'$', fee:'0.880%', reason:'次世代インターネット銘柄・金利上昇で成長株調整', isOwned:false },
  ],
}

const THEME_KEYS = Object.keys(THEME_DATA)

const THEME_TAG_COLOR = {
  'AI・半導体':         { bg:'#EEEDFE', color:'#3C3489' },
  '防衛・地政学':       { bg:'#FAECE7', color:'#712B13' },
  '全世界・先進国':     { bg:'#E1F5EE', color:'#085041' },
  '日本株':             { bg:'#FAEEDA', color:'#633806' },
  '新興国':             { bg:'#FFF4E6', color:'#7A3F00' },
  'エネルギー・コモディティ':{ bg:'#F1EFE8', color:'#444441' },
  'ヘルスケア':         { bg:'#FBEAF0', color:'#72243E' },
  '債券・REIT':         { bg:'#E8F4F8', color:'#1A4A6A' },
  'クリーンエネルギー': { bg:'#E4F8E4', color:'#1A5A1A' },
  'バランス・その他':   { bg:'#F0F4F8', color:'#304060' },
}

// ─── Helpers ───────────────────────────────────────────────────
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
    <div style={{ width:'100%', height:4, background:'rgba(0,0,0,.07)', borderRadius:2, marginTop:8, overflow:'hidden' }}>
      <div style={{ width:`${ratio*100}%`, height:'100%', background:pctColor(pct), borderRadius:2, transition:'width .6s ease' }}/>
    </div>
  )
}

function SectorCard({ sector }) {
  const isHot = sector.hot
  return (
    <div onClick={() => sendPrompt(`${sector.name}の注目ETFを教えて`)}
      style={{ background:isHot?'#FFFDF5':C.card,
        border:`1.5px solid ${isHot?C.gold:C.border}`,
        borderRadius:12, padding:'14px 16px',
        display:'flex', flexDirection:'column', gap:4,
        boxShadow:isHot?'0 4px 20px rgba(201,168,76,.15)':'0 1px 6px rgba(0,0,0,.05)',
        position:'relative', overflow:'hidden', cursor:'pointer',
        transition:'all .2s ease' }}>
      {isHot && (
        <div style={{ position:'absolute', top:8, right:10, fontSize:9,
          fontFamily:"'Syne',sans-serif", fontWeight:700, color:C.gold,
          letterSpacing:'0.08em', textTransform:'uppercase' }}>
          🔥 最熱
        </div>
      )}
      <div style={{ fontSize:12, fontFamily:"'Syne',sans-serif", fontWeight:600, color:C.ink, lineHeight:1.3 }}>
        {sector.name}
      </div>
      <div style={{ fontSize:20, fontFamily:"'DM Mono',monospace", fontWeight:500,
        color:pctColor(sector.pct), letterSpacing:'-0.02em' }}>
        {fmtPct(sector.pct)}
      </div>
      <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:C.muted }}>
        {sector.etf}
      </div>
      <HeatBar pct={sector.pct}/>
    </div>
  )
}

// ─── TrendPage ─────────────────────────────────────────────────
export default function TrendPage() {
  const [activeTheme,  setActiveTheme ] = useState(THEME_KEYS[0])
  const [period,       setPeriod      ] = useState('1D')
  const [themeData,    setThemeData   ] = useState(THEME_DATA)
  const [lastUpdated,  setLastUpdated ] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const now = useTime()

  function handleRefresh() {
    setIsRefreshing(true)
    setThemeData(prev => {
      const next = {}
      for (const [key, funds] of Object.entries(prev)) {
        next[key] = funds.map(f => ({
          ...f,
          change: Math.round((f.change + (Math.random() - 0.5) * 0.6) * 100) / 100,
        }))
      }
      return next
    })
    setTimeout(() => {
      setIsRefreshing(false)
      setLastUpdated(new Date())
    }, 1200)
  }

  const funds = themeData[activeTheme] || []
  const PERIODS = ['1D','1W','1M','3M']
  const COL = '1fr 100px 100px 90px 80px'

  return (
    <div style={{ background:C.bg, fontFamily:"'Syne',sans-serif", color:C.ink }}>

      {/* ── Sub-header ────────────────────────────────────── */}
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
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* period chips */}
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

          {/* 更新ボタン */}
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

      {/* ── Theme Tabs ────────────────────────────────────── */}
      <div style={{ padding:'0 24px', borderBottom:`1px solid ${C.border}`,
        display:'flex', gap:2, overflowX:'auto', background:C.card }}>
        {THEME_KEYS.map(key => {
          const isActive = activeTheme === key
          return (
            <button key={key} onClick={() => setActiveTheme(key)} style={{
              fontFamily:"'Syne',sans-serif", fontWeight:isActive?700:500, fontSize:12,
              padding:'12px 14px', border:'none', whiteSpace:'nowrap',
              borderBottom:isActive?`2.5px solid ${C.gold}`:'2.5px solid transparent',
              background:'transparent',
              color:isActive ? C.ink : C.subtle,
              cursor:'pointer', transition:'all .15s' }}>
              {key}
            </button>
          )
        })}
      </div>

      <main style={{ maxWidth:1080, margin:'0 auto', padding:'26px 24px 56px' }}>

        {/* ── Sector Heatmap ────────────────────────────── */}
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

        {/* ── Fund List ─────────────────────────────────── */}
        <section>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:C.ink, margin:0 }}>
                {activeTheme}
              </h2>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:600,
                color:C.gold, background:C.goldLight, borderRadius:4, padding:'2px 8px' }}>
                10件
              </span>
            </div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:C.muted }}>
              全100件 / 10テーマ
            </div>
          </div>

          <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`,
            overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.05)',
            opacity:isRefreshing ? 0.5 : 1, transition:'opacity .3s' }}>

            {/* thead */}
            <div style={{ display:'grid', gridTemplateColumns:COL,
              padding:'10px 20px', background:'#F3F1EC',
              borderBottom:`1px solid ${C.border}`, gap:12, alignItems:'end' }}>
              {[
                { label:'ファンド名' },
                { label:'上昇率', center:true },
                { label:'基準価額（円）', sub:'1USD=¥151.5換算', center:true },
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
            {funds.map((fund, idx) => {
              const isLast = idx === funds.length - 1
              const reasonColor = fund.isOwned ? C.ink : '#6B6B7A'
              return (
                <div key={fund.id}
                  onClick={() => sendPrompt(`${fund.shortName}の詳細分析をして`)}
                  style={{ display:'grid', gridTemplateColumns:COL,
                    padding:'12px 20px', gap:12, alignItems:'center',
                    background:fund.isOwned ? C.goldLight : C.card,
                    borderBottom:isLast ? 'none' : `1px solid ${fund.isOwned ? '#E8D9A8' : C.border}`,
                    cursor:'pointer', transition:'background .15s' }}>

                  {/* name + reason + badges */}
                  <div style={{ display:'flex', flexDirection:'column', gap:3, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13,
                        color:C.ink, whiteSpace:'nowrap' }}>
                        {fund.shortName}
                      </span>
                      {fund.ticker && (
                        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.muted }}>
                          {fund.ticker}
                        </span>
                      )}
                      {fund.isOwned && <OwnedBadge/>}
                    </div>
                    <div style={{ fontSize:11, color:reasonColor, fontStyle:'italic',
                      lineHeight:1.5, marginTop:1 }}>
                      {fund.reason}
                    </div>
                  </div>

                  {/* change % */}
                  <div style={{ fontFamily:"'DM Mono',monospace", fontWeight:500, fontSize:14,
                    color:pctColor(fund.change), background:pctBg(fund.change),
                    borderRadius:8, padding:'4px 8px', textAlign:'center',
                    letterSpacing:'-0.01em' }}>
                    {fmtPct(fund.change)}
                  </div>

                  {/* price (JPY) */}
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12,
                    color:fund.isOwned ? '#4A3A1A' : C.subtle, textAlign:'center' }}>
                    {formatPrice(fund.price, fund.currency)}
                  </div>

                  {/* fee */}
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:500,
                    color:feeColor(fund.fee), textAlign:'center' }}>
                    {fund.fee}
                  </div>

                  {/* theme tag */}
                  <div>
                    <ThemeTag label={activeTheme}/>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────── */}
        <footer style={{ marginTop:28, padding:'14px 0', borderTop:`1px solid ${C.border}`,
          fontFamily:"'Syne',sans-serif", fontSize:11, color:C.muted }}>
          黄背景 = あなたの保有ファンド｜信託報酬: 緑=低コスト(&lt;0.1%) 黒=中 赤=高(&gt;0.5%)｜1USD=¥151.5換算（モック）
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
