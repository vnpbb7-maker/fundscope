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


# ── 国内投信 → 代替ETFで取得（yfinance .T suffix） ──────────────
def fetch_jp_fund(fund_code: str) -> dict:
    """
    国内投信は yfinance で代替ETFのデータを取得する。
    fund_code = 代替ETFのティッカー（.T付き）
    例: "2559.T" → MAXIS全世界株式(AC)
    fetch_us_etf は .T 付きティッカーも対応済み。
    """
    return fetch_us_etf(fund_code)
