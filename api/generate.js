export default async function handler(req, res) {
    const { word, len, type, topic, count } = req.query; // 務必解構所有可能的參數
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) return res.status(500).json({ error: "API Key missing" });

    let finalPrompt = "";
    if (type === 'grammar') {
        finalPrompt = `
            請作為一名台灣國中英語教師，根據以下要求生成 ${count} 題文法選擇題：
            主題範圍：${topic}
            要求：
            1. 參考國中英語文法講義風格，題目需包含比較級、最高級、不定代名詞(one/ones/it/them)等用法。
            2. 每題包含四個選項(A, B, C, D)，且必須只有一個正確答案。
            3. 必須提供詳細的「中文解析」。
            4. 回傳格式為嚴格的 JSON 陣列，欄位如下：
            [
            {
                "q": "題目內容",
                "options": ["A選項", "B選項", "C選項", "D選項"],
                "answer": "正確答案 (與選項內容完全一致)",
                "explanation": "中文解析說明"
            }
            ]
            請僅回傳 JSON，不要包含任何 Markdown 標記或文字說明。
            `;
    } else {
        finalPrompt = `Target word: "${word}". Create 3 incorrect English vocabulary distractors (${len} letters). Return ONLY comma-separated words.`;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] })
        });

        const data = await response.json();
        
        // 增加這行 log 來看 Gemini 到底回了什麼
        console.log("Gemini Raw Response:", JSON.stringify(data)); 

        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!aiText) throw new Error("No content from Gemini");

        if (type === 'grammar') {
            const cleanJson = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
            res.status(200).json(JSON.parse(cleanJson));
        } else {
            res.status(200).json({ distractors: aiText.trim() });
        }
    } catch (error) {
        console.error("Backend Error:", error); // 這行會顯示在 Vercel Functions 的 Log 裡
        res.status(500).json({ error: error.message });
    }
}