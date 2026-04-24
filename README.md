# fundscope 📈

ETF・インデックスファンド上昇率追跡 ＆ ポートフォリオ管理サイト

## 機能
- 話題・注目テーマのETFリアルタイム表示（セクターヒートマップ）
- 上昇率ランキング（期間・カテゴリ・地域フィルター）
- マイポートフォリオ管理（保有銘柄・積立設定・JSON入出力）
- Claude claude-opus-4-6 による AI投資分析（分身エージェント）

## セットアップ
```
npm install
npm run dev
```

## 環境変数
`.env.local` を作成して以下を設定:
```
VITE_ANTHROPIC_API_KEY=your_key_here
```

## GitHub Pages
https://vnpbb7-maker.github.io/fundscope/