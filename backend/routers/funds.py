import asyncio
import datetime
from fastapi import APIRouter
from services.fetcher import fetch_us_etf, fetch_tse_etf, fetch_jp_fund, get_usd_jpy

router = APIRouter()

# ── ファンドマスター定義 ────────────────────────────────────────
FUND_MASTER = [
    # ── 米国ETF（NISA成長投資枠）──
    {"id": 1,  "shortName": "SOXX",         "ticker": "SOXX",  "type": "us_etf",  "category": "AI・半導体",         "fee": "0.350%", "nisa": "成長", "reason": "Nvidia Blackwell需要急増・AI半導体サイクル加速",          "isOwned": False},
    {"id": 2,  "shortName": "AIQ",          "ticker": "AIQ",   "type": "us_etf",  "category": "AI・半導体",         "fee": "0.680%", "nisa": "成長", "reason": "エージェントAI普及・データセンター投資拡大",             "isOwned": False},
    {"id": 3,  "shortName": "SMH",          "ticker": "SMH",   "type": "us_etf",  "category": "AI・半導体",         "fee": "0.350%", "nisa": "成長", "reason": "半導体設計・製造企業に集中投資",                        "isOwned": False},
    {"id": 4,  "shortName": "VGT",          "ticker": "VGT",   "type": "us_etf",  "category": "AI・半導体",         "fee": "0.100%", "nisa": "成長", "reason": "情報技術セクター全体・低コストで米国IT大手を網羅",       "isOwned": False},
    {"id": 5,  "shortName": "XLK",          "ticker": "XLK",   "type": "us_etf",  "category": "AI・半導体",         "fee": "0.090%", "nisa": "成長", "reason": "S&P500のIT比率が高くテクノロジー株全般が好調",          "isOwned": False},
    {"id": 6,  "shortName": "DFND",         "ticker": "DFND",  "type": "us_etf",  "category": "防衛・地政学",       "fee": "0.550%", "nisa": "成長", "reason": "NATO加盟国の国防費増加・欧州防衛予算拡大",              "isOwned": False},
    {"id": 7,  "shortName": "ITA",          "ticker": "ITA",   "type": "us_etf",  "category": "防衛・地政学",       "fee": "0.400%", "nisa": "成長", "reason": "米国防衛産業大手（ロッキード・レイセオン）に集中",        "isOwned": False},
    {"id": 8,  "shortName": "XAR",          "ticker": "XAR",   "type": "us_etf",  "category": "防衛・地政学",       "fee": "0.350%", "nisa": "成長", "reason": "航空宇宙・防衛に均等加重・中小企業も含む",              "isOwned": False},
    {"id": 9,  "shortName": "VOO",          "ticker": "VOO",   "type": "us_etf",  "category": "全世界・先進国",     "fee": "0.030%", "nisa": "成長", "reason": "S&P500に超低コストで連動・長期保有向き",                "isOwned": False},
    {"id": 10, "shortName": "VTI",          "ticker": "VTI",   "type": "us_etf",  "category": "全世界・先進国",     "fee": "0.030%", "nisa": "成長", "reason": "米国全株式3600社以上・中小型株成長も取り込む",          "isOwned": False},
    {"id": 11, "shortName": "QQQ",          "ticker": "QQQ",   "type": "us_etf",  "category": "全世界・先進国",     "fee": "0.200%", "nisa": "成長", "reason": "AI・グロース株主導の上昇・ナスダック100に連動",         "isOwned": False},
    {"id": 12, "shortName": "VT",           "ticker": "VT",    "type": "us_etf",  "category": "全世界・先進国",     "fee": "0.070%", "nisa": "成長", "reason": "全世界株式に一本で投資・新興国も含む分散",              "isOwned": False},
    {"id": 13, "shortName": "EFA",          "ticker": "EFA",   "type": "us_etf",  "category": "全世界・先進国",     "fee": "0.320%", "nisa": "成長", "reason": "欧州・アジア先進国へ広く分散・円安恩恵あり",            "isOwned": False},
    {"id": 14, "shortName": "VEA",          "ticker": "VEA",   "type": "us_etf",  "category": "全世界・先進国",     "fee": "0.050%", "nisa": "成長", "reason": "先進国（米国除く）への低コスト投資",                    "isOwned": False},
    {"id": 15, "shortName": "EPI",          "ticker": "EPI",   "type": "us_etf",  "category": "新興国",             "fee": "0.850%", "nisa": "成長", "reason": "インド株・モディ政権インフラ投資加速で高成長",           "isOwned": False},
    {"id": 16, "shortName": "VWO",          "ticker": "VWO",   "type": "us_etf",  "category": "新興国",             "fee": "0.080%", "nisa": "成長", "reason": "新興国全体への低コスト分散・ドル安で有利",              "isOwned": False},
    {"id": 17, "shortName": "FXI",          "ticker": "FXI",   "type": "us_etf",  "category": "新興国",             "fee": "0.740%", "nisa": "成長", "reason": "中国大型株・政策刺激・景気回復期待で反発",              "isOwned": False},
    {"id": 18, "shortName": "EWZ",          "ticker": "EWZ",   "type": "us_etf",  "category": "新興国",             "fee": "0.590%", "nisa": "成長", "reason": "ブラジルの資源・農業大国としての回復期待",              "isOwned": False},
    {"id": 19, "shortName": "GLD",          "ticker": "GLD",   "type": "us_etf",  "category": "コモディティ",       "fee": "0.400%", "nisa": "成長", "reason": "地政学リスク・インフレ懸念で金価格上昇継続",            "isOwned": False},
    {"id": 20, "shortName": "IAU",          "ticker": "IAU",   "type": "us_etf",  "category": "コモディティ",       "fee": "0.250%", "nisa": "成長", "reason": "GLD代替・低コスト金ETF・少額から投資可能",             "isOwned": False},
    {"id": 21, "shortName": "SLV",          "ticker": "SLV",   "type": "us_etf",  "category": "コモディティ",       "fee": "0.500%", "nisa": "成長", "reason": "太陽光・電池需要増加で銀の産業需要が拡大",             "isOwned": False},
    {"id": 22, "shortName": "XLE",          "ticker": "XLE",   "type": "us_etf",  "category": "コモディティ",       "fee": "0.090%", "nisa": "成長", "reason": "原油・天然ガス価格上昇でエネルギー企業増益",            "isOwned": False},
    {"id": 23, "shortName": "XLV",          "ticker": "XLV",   "type": "us_etf",  "category": "ヘルスケア",         "fee": "0.090%", "nisa": "成長", "reason": "高齢化社会・医薬品需要増加・ディフェンシブ銘柄",        "isOwned": False},
    {"id": 24, "shortName": "VHT",          "ticker": "VHT",   "type": "us_etf",  "category": "ヘルスケア",         "fee": "0.100%", "nisa": "成長", "reason": "米国ヘルスケア全体に低コストで分散",                    "isOwned": False},
    {"id": 25, "shortName": "IBB",          "ticker": "IBB",   "type": "us_etf",  "category": "ヘルスケア",         "fee": "0.440%", "nisa": "成長", "reason": "バイオテク・製薬の革新的創薬企業に集中投資",            "isOwned": False},
    {"id": 26, "shortName": "BND",          "ticker": "BND",   "type": "us_etf",  "category": "債券・REIT",         "fee": "0.030%", "nisa": "成長", "reason": "米国債券市場全体に超低コストで分散",                    "isOwned": False},
    {"id": 27, "shortName": "TLT",          "ticker": "TLT",   "type": "us_etf",  "category": "債券・REIT",         "fee": "0.150%", "nisa": "成長", "reason": "長期金利低下期待で価格上昇・デュレーション長め",        "isOwned": False},
    {"id": 28, "shortName": "VNQ",          "ticker": "VNQ",   "type": "us_etf",  "category": "債券・REIT",         "fee": "0.120%", "nisa": "成長", "reason": "米国不動産市場の回復・金利低下でREIT上昇",              "isOwned": False},
    {"id": 29, "shortName": "LQD",          "ticker": "LQD",   "type": "us_etf",  "category": "債券・REIT",         "fee": "0.140%", "nisa": "成長", "reason": "優良企業社債に投資・国債より高い安定利回り",            "isOwned": False},
    {"id": 30, "shortName": "ICLN",         "ticker": "ICLN",  "type": "us_etf",  "category": "クリーンエネルギー", "fee": "0.420%", "nisa": "成長", "reason": "再エネ政策転換・補助金削減で短期調整中",               "isOwned": False},
    {"id": 31, "shortName": "TAN",          "ticker": "TAN",   "type": "us_etf",  "category": "クリーンエネルギー", "fee": "0.690%", "nisa": "成長", "reason": "太陽光パネル価格下落・補助金終了で収益悪化",           "isOwned": False},
    {"id": 32, "shortName": "ARKK",         "ticker": "ARKK",  "type": "us_etf",  "category": "バランス・その他",   "fee": "0.750%", "nisa": "成長", "reason": "破壊的技術革新銘柄に集中投資・高リスク高リターン",     "isOwned": False},
    {"id": 33, "shortName": "VYM",          "ticker": "VYM",   "type": "us_etf",  "category": "バランス・その他",   "fee": "0.060%", "nisa": "成長", "reason": "高配当株に絞り投資・安定的な配当収入を重視",           "isOwned": False},
    {"id": 34, "shortName": "SPYD",         "ticker": "SPYD",  "type": "us_etf",  "category": "バランス・その他",   "fee": "0.070%", "nisa": "成長", "reason": "S&P500高配当80社・低コスト高利回りETF",                "isOwned": False},
    {"id": 35, "shortName": "EWJ",          "ticker": "EWJ",   "type": "us_etf",  "category": "日本株",             "fee": "0.500%", "nisa": "成長", "reason": "日本株ETF・米国上場で外国人投資家が日本株買い",         "isOwned": False},
    # ── 東証ETF（NISA成長投資枠）──
    {"id": 36, "shortName": "ETF 412A",     "ticker": "412A",  "type": "tse_etf", "category": "日本株",             "fee": "0.078%", "nisa": "成長", "reason": "東証ETF・低コスト・NISA成長投資枠で積立最適",          "isOwned": True},
    {"id": 37, "shortName": "1306 TOPIX",   "ticker": "1306",  "type": "tse_etf", "category": "日本株",             "fee": "0.088%", "nisa": "成長", "reason": "TOPIX連動の老舗ETF・国内機関投資家の需要高い",          "isOwned": False},
    {"id": 38, "shortName": "1321 日経225", "ticker": "1321",  "type": "tse_etf", "category": "日本株",             "fee": "0.220%", "nisa": "成長", "reason": "日経225連動・流動性高く個人投資家に人気",               "isOwned": False},
    {"id": 39, "shortName": "1678 インド",  "ticker": "1678",  "type": "tse_etf", "category": "新興国",             "fee": "0.220%", "nisa": "成長", "reason": "東証上場インド株ETF・円建てでインド成長を享受",         "isOwned": False},
    {"id": 40, "shortName": "2621 米長期債","ticker": "2621",  "type": "tse_etf", "category": "債券・REIT",         "fee": "0.154%", "nisa": "成長", "reason": "東証上場米国長期国債ETF・円建てで金利差益",            "isOwned": False},
    {"id": 41, "shortName": "1540 金",      "ticker": "1540",  "type": "tse_etf", "category": "コモディティ",       "fee": "0.400%", "nisa": "成長", "reason": "東証上場金ETF・円建てで金投資が手軽にできる",          "isOwned": False},
    {"id": 42, "shortName": "1476 REIT",    "ticker": "1476",  "type": "tse_etf", "category": "債券・REIT",         "fee": "0.165%", "nisa": "成長", "reason": "東証上場REIT・国内不動産に低コストで投資",              "isOwned": False},
    {"id": 43, "shortName": "1478 高配当",  "ticker": "1478",  "type": "tse_etf", "category": "日本株",             "fee": "0.209%", "nisa": "成長", "reason": "MSCIジャパン高配当・安定配当企業に絞った投資",          "isOwned": False},
    {"id": 44, "shortName": "2513 外国株",  "ticker": "2513",  "type": "tse_etf", "category": "全世界・先進国",     "fee": "0.187%", "nisa": "成長", "reason": "東証上場外国株ETF・低コストで先進国株に投資可能",       "isOwned": False},
    {"id": 45, "shortName": "1482 米中期債","ticker": "1482",  "type": "tse_etf", "category": "債券・REIT",         "fee": "0.132%", "nisa": "成長", "reason": "米国債7-10年連動・金利低下局面でのリターン期待",       "isOwned": False},
    # ── 国内投信 → 代替東証ETFで取得（NISA両枠）──
    {"id": 46, "shortName": "eMAXIS AC",     "ticker": "2559", "type": "tse_etf", "category": "全世界・先進国", "fee": "0.058%", "nisa": "両方", "reason": "円安進行＋先進国株高・低コストが長期積立に有利", "isOwned": True},
    {"id": 47, "shortName": "SBI S&P500",    "ticker": "2563", "type": "tse_etf", "category": "全世界・先進国", "fee": "0.094%", "nisa": "両方", "reason": "米国企業業績好調・Fed利下げ期待で株高継続",        "isOwned": True},
    {"id": 48, "shortName": "ニッセイ外国株","ticker": "1550", "type": "tse_etf", "category": "全世界・先進国", "fee": "0.094%", "nisa": "両方", "reason": "先進国株式全般に恩恵・低コスト（0.094%）が強み",   "isOwned": True},
    {"id": 49, "shortName": "ニッセイTOPIX","ticker": "1306", "type": "tse_etf", "category": "日本株",         "fee": "0.143%", "nisa": "両方", "reason": "国内景気回復・日銀政策正常化で日本株見直し買い",   "isOwned": True},
    {"id": 50, "shortName": "はじめてAC",    "ticker": "2559", "type": "tse_etf", "category": "全世界・先進国", "fee": "0.058%", "nisa": "両方", "reason": "全世界株式・NISA成長投資枠で月1万円から積立",      "isOwned": True},
]


async def _enrich(fund: dict, usd_jpy: float, period: str) -> dict:
    """ファンドデータに価格・騰落率を付加する"""
    f = fund.copy()

    if f["type"] == "us_etf":
        data = fetch_us_etf(f["ticker"])
        f["price_usd"]     = data.get("price_usd")
        f["price_jpy"]     = round(data["price_usd"] * usd_jpy) if data.get("price_usd") else None
        f["changes"]       = data.get("changes", {})
        f["change"]        = data.get("changes", {}).get(period, 0.0)

    elif f["type"] == "tse_etf":
        data = fetch_tse_etf(f["ticker"])
        # 東証ETFは円建て（price_usd フィールドに円価格が入っている）
        f["price_jpy"]     = int(data["price_usd"]) if data.get("price_usd") else None
        f["changes"]       = data.get("changes", {})
        f["change"]        = data.get("changes", {}).get(period, 0.0)

    elif f["type"] == "jp_fund":
        # fetch_jp_fund は現在 fetch_us_etf に委譲しているため sync
        data = fetch_jp_fund(f.get("ticker", ""))
        # 東証ETF代替なので price_usd フィールドが円価格
        f["price_jpy"]     = int(data["price_usd"]) if data.get("price_usd") else None
        f["changes"]       = data.get("changes", {})
        f["change"]        = data.get("changes", {}).get(period, 0.0)

    # 表示用価格文字列
    f["price_display"] = (
        f"¥{f['price_jpy']:,}" if f.get("price_jpy") else "取得中"
    )
    f["usd_jpy"] = usd_jpy
    return f


@router.get("/funds")
async def get_funds(period: str = "1D"):
    """
    全ファンドの価格・期間別騰落率を取得して返す。
    period: 1D / 1W / 1M / 3M / 6M / YTD / 1Y
    """
    usd_jpy = await get_usd_jpy()

    results = await asyncio.gather(
        *[_enrich(f, usd_jpy, period) for f in FUND_MASTER]
    )

    # 騰落率降順でソート
    results = sorted(results, key=lambda x: x.get("change", 0), reverse=True)

    # rank 付与
    for i, r in enumerate(results):
        r["rank"] = i + 1

    return {
        "period":     period,
        "usd_jpy":   usd_jpy,
        "updated_at": datetime.datetime.now().isoformat(),
        "count":      len(results),
        "funds":      results,
    }


@router.get("/funds/{fund_id}")
async def get_fund_detail(fund_id: int, period: str = "1D"):
    """単一ファンドの詳細を取得"""
    fund = next((f for f in FUND_MASTER if f["id"] == fund_id), None)
    if not fund:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Fund not found")

    usd_jpy = await get_usd_jpy()
    return await _enrich(fund, usd_jpy, period)


@router.get("/rate")
async def get_rate():
    """USD/JPY レートを返す"""
    rate = await get_usd_jpy()
    return {
        "usd_jpy":    rate,
        "updated_at": datetime.datetime.now().isoformat(),
    }
