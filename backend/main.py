from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import funds

app = FastAPI(
    title="fundscope API",
    description="ファンドスコープ バックエンドAPI — リアルタイム価格・騰落率取得",
    version="1.0.0",
)

# ── CORS: GitHub Pages + ローカル開発を許可 ──────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://vnpbb7-maker.github.io",
        "http://localhost:5173",   # Vite dev
        "http://localhost:4173",   # Vite preview
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────
app.include_router(funds.router, prefix="/api")


# ── Health check ─────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "service": "fundscope-api", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
