// grammar_data.js

// 1. 自定義 AI 出題的文法重點 (提示詞來源)
const grammarHints = {
    "L1": "形容詞比較級（如：-er, more..., than...）、形容詞原級比較（as...as）",
    "L2": "形容詞最高級（如：the -est, the most...）、不定代名詞 one / ones 的用法",
    "L3": "過去進行式（was/were + V-ing）、when/while 引導的時間副詞子句",
    "L4": "受與動詞（give/send/buy... sth to/for sb）、反身代名詞（myself, himself...）"
};

// 2. 原有的靜態題目庫 (當 AI 關閉時使用)
const grammarBank = {
    "L1": [
        {
            q: "The jacket is _____ than any other jacket in the store.",
            options: ["lighter", "lightest", "more light", "light"],
            answer: "lighter",
            explanation: "比較級需使用 -er，且 lighter 為形容詞比較級。"
        },
        {
            q: "Hector is _____ stronger than Wilson.",
            options: ["many", "much", "more", "most"],
            answer: "much",
            explanation: "比較級前可用 much 來加強語氣。"
        }
    ],
    "L2": [
        {
            q: "Winter is the _____ season of the year.",
            options: ["cold", "colder", "coldest", "more cold"],
            answer: "coldest",
            explanation: "最高級前需加 the，且需使用 -est。"
        }
    ]
};