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
        },
        {
            q: "What is the _____ useful machine in the world?",
            options: ["more", "most", "much", "many"],
            answer: "most",
            explanation: "多音節形容詞最高級需在前面加 most。"
        }
    ]
};