import re
import asyncio
import yfinance as yf
import httpx
from services.cache import cache


# ── 為替レート取得（ExchangeRate-API → フォールバック 151.5） ──────
async def get_usd_jpy() -> float:
    cached = cache.get("usd_jpy")
    if cached is not None:
        return cached

    rate = 151.5  # デフォルトフォールバック
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.get(
                "https://api.exchangerate-api.com/v4/latest/USD"
            )
            res.raise_for_status()
            rate = float(res.json()["rates"]["JPY"])
    except Exception:
        pass  # フォールバック値を使用

    cache.set("usd_jpy", rate, ttl_seconds=300)  # 5分キャッシュ
    return rate


# ── 米国ETF 価格・期間別騰落率取得（yfinance） ───────────────────
def fetch_us_etf(ticker: str) -> dict:
    cached = cache.get(f"etf_{ticker}")
    if cached is not None:
        return cached

    try:
        t = yf.Ticker(ticker)
        hist = t.history(period="1y")
        if hist.empty:
            return {"ticker": ticker, "error": "empty history"}

        price_now = float(hist["Close"].iloc[-1])

        def price_at(n: int) -> float:
            return float(hist["Close"].iloc[-n]) if len(hist) >= n else price_now

        def pct(prev: float) -> float:
            if prev == 0:
                return 0.0
            return round((price_now - prev) / prev * 100, 2)

        result = {
            "ticker": ticker,
            "price_usd": round(price_now, 2),
            "changes": {
                "1D":  pct(price_at(2)),
                "1W":  pct(price_at(6)),
                "1M":  pct(price_at(22)),
                "3M":  pct(price_at(66)),
                "6M":  pct(price_at(130)),
                "YTD": pct(float(hist["Close"].iloc[0])),
                "1Y":  pct(float(hist["Close"].iloc[0])),
            },
        }
    except Exception as e:
        result = {"ticker": ticker, "error": str(e)}

    cache.set(f"etf_{ticker}", result, ttl_seconds=60)  # 1分
    return result


# ── 東証ETF 価格取得（yfinance {code}.T suffix） ────────────────
def fetch_tse_etf(ticker: str) -> dict:
    """東証ETF は yfinance で {code}.T のティッカーで取得（円建て）"""
    t_ticker = f"{ticker}.T"
    cached = cache.get(f"tse_{ticker}")
    if cached is not None:
        return cached

    try:
        t = yf.Ticker(t_ticker)
        hist = t.history(period="1y")
        if hist.empty:
            return {"ticker": ticker, "error": "empty history"}

        price_now = float(hist["Close"].iloc[-1])

        def price_at(n: int) -> float:
            return float(hist["Close"].iloc[-n]) if len(hist) >= n else price_now

        def pct(prev: float) -> float:
            if prev == 0:
                return 0.0
            return round((price_now - prev) / prev * 100, 2)

        result = {
            "ticker": ticker,
            # 東証ETFは円建てなので price_usd フィールドに円価格を入れる
            # （呼び出し側で round() して price_jpy として使う）
            "price_usd": round(price_now, 0),
            "changes": {
                "1D":  pct(price_at(2)),
                "1W":  pct(price_at(6)),
                "1M":  pct(price_at(22)),
                "3M":  pct(price_at(66)),
                "6M":  pct(price_at(130)),
                "YTD": pct(float(hist["Close"].iloc[0])),
                "1Y":  pct(float(hist["Close"].iloc[0])),
            },
        }
    except Exception as e:
        result = {"ticker": ticker, "error": str(e)}

    cache.set(f"tse_{ticker}", result, ttl_seconds=60)
    return result


# ── 国内投信 基準価額取得（投資信託協会ウェブ scraping） ──────────
async def fetch_jp_fund(isin: str) -> dict:
    """
    投資信託協会の FDST 検索ページから基準価額を取得する。
    isin: JP で始まる ISINコード（例: JP90C000H8Y5）
    """
    cached = cache.get(f"jpfund_{isin}")
    if cached is not None:
        return cached

    result: dict = {"isin": isin}
    try:
        url = f"https://toushin-lib.fwg.ne.jp/FdsWeb/FDST999999?isinCd={isin}"
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            res = await client.get(url)
            text = res.text

        # 基準価額: "12,345 円" パターン
        m_price = re.search(r"基準価額[^0-9]*([0-9,]+)\s*円", text)
        price = int(m_price.group(1).replace(",", "")) if m_price else None

        # 前日比（円）: △▼ 記号または signed int
        m_chg = re.search(r"前日比[^0-9△▲▼\-]*([△▲▼\-]?)\s*([0-9,]+)", text)
        change_jpy = 0.0
        if m_chg:
            sign = -1 if m_chg.group(1) in ("▼", "-") else 1
            change_jpy = sign * float(m_chg.group(2).replace(",", ""))

        result = {
            "isin": isin,
            "price_jpy": price,
            "change_1d_jpy": change_jpy,
            "change_1d_pct": (
                round(change_jpy / price * 100, 2) if price else 0.0
            ),
        }
    except Exception as e:
        result["error"] = str(e)

    cache.set(f"jpfund_{isin}", result, ttl_seconds=3600)  # 1時間
    return result
