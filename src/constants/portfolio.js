export const DEFAULT_HOLDINGS = [
  {
    id: 1,
    name: "ニッセイTOPIXインデックスファンド",
    shortName: "ニッセイTOPIX",
    ticker: "",
    category: "国内株式",
    account: "NISA成長",
    method: "現金",
    monthlyAmount: 90000,
    units: null,
    unitPrice: null,
    dayOfMonth: 5,
    startDate: "2026-05-02",
    memo: ""
  },
  {
    id: 2,
    name: "ニッセイ外国株式インデックスファンド",
    shortName: "ニッセイ外国株式①",
    ticker: "",
    category: "先進国株式",
    account: "NISA成長",
    method: "クレジットカード",
    monthlyAmount: 50000,
    units: null,
    unitPrice: null,
    dayOfMonth: 7,
    startDate: "2026-06-07",
    memo: ""
  },
  {
    id: 3,
    name: "SBI・V・S&P500インデックス・ファンド",
    shortName: "SBI S&P500",
    ticker: "",
    category: "米国株式",
    account: "NISAつみたて",
    method: "現金",
    monthlyAmount: 50000,
    units: null,
    unitPrice: null,
    dayOfMonth: 5,
    startDate: "2026-05-02",
    memo: ""
  },
  {
    id: 4,
    name: "ニッセイ外国株式インデックスファンド",
    shortName: "ニッセイ外国株式②",
    ticker: "",
    category: "先進国株式",
    account: "NISAつみたて",
    method: "クレジットカード",
    monthlyAmount: 30000,
    units: null,
    unitPrice: null,
    dayOfMonth: 5,
    startDate: "2026-06-05",
    memo: ""
  },
  {
    id: 5,
    name: "eMAXIS Slim 全世界株式（オール・カントリー）",
    shortName: "eMAXIS AC",
    ticker: "",
    category: "全世界株式",
    account: "NISAつみたて",
    method: "クレジットカード",
    monthlyAmount: 20000,
    units: null,
    unitPrice: null,
    dayOfMonth: 5,
    startDate: "2026-06-05",
    memo: ""
  },
  {
    id: 6,
    name: "はじめてのNISA・全世界株式インデックス（オール・カントリー）",
    shortName: "はじめてAC",
    ticker: "",
    category: "全世界株式",
    account: "NISA成長",
    method: "現金",
    monthlyAmount: 10000,
    units: null,
    unitPrice: null,
    dayOfMonth: 5,
    startDate: "2026-05-02",
    memo: ""
  },
  {
    id: 7,
    name: "NEXT FUNDS TOPIX連動型上場投信",
    shortName: "ETF 412A",
    ticker: "412A",
    category: "国内株式ETF",
    account: "NISA成長",
    method: "現金",
    monthlyAmount: null,
    units: 11,
    unitPrice: 2340,
    dayOfMonth: 5,
    startDate: "2026-05-02",
    memo: "毎月11口積立"
  }
]

export const CATEGORIES = [
  "国内株式", "先進国株式", "米国株式",
  "全世界株式", "国内株式ETF", "新興国株式",
  "コモディティ", "債券", "REIT", "その他"
]

export const ACCOUNTS = [
  "NISA成長", "NISAつみたて", "特定口座", "一般口座", "iDeCo"
]

export const METHODS = ["現金", "クレジットカード", "銀行引落"]

export const CATEGORY_STYLES = {
  "国内株式":    { bg: "#FAEEDA", color: "#633806" },
  "国内株式ETF": { bg: "#FAEEDA", color: "#633806" },
  "先進国株式":  { bg: "#E6F1FB", color: "#0C447C" },
  "米国株式":    { bg: "#E6F1FB", color: "#0C447C" },
  "全世界株式":  { bg: "#E1F5EE", color: "#085041" },
  "新興国株式":  { bg: "#F1EFE8", color: "#444441" },
  "コモディティ":{ bg: "#F1EFE8", color: "#444441" },
  "債券":        { bg: "#EEEDFE", color: "#3C3489" },
  "REIT":        { bg: "#FBEAF0", color: "#72243E" },
  "その他":      { bg: "#F1EFE8", color: "#444441" },
}
