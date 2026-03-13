export default async function handler(req, res) {
    const { word, len, type, topic, count } = req.query;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) return res.status(500).json({ error: "API Key missing in environment" });

    let finalPrompt = "";
    if (type === 'grammar') {
        finalPrompt = `請生成 ${count || 5} 題國中英語文法選擇題，主題：${topic}。
        要求：
        1. 內容參考國中英語文法，包含比較級、最高級、代名詞(one/ones/that/those)等。
        2. 每題包含 q(題目), options(4個選項陣列), answer(正確答案), explanation(中文解析)。
        3. 必須回傳純 JSON 陣列格式，不要包含 Markdown 標記或 ```json 符號。`;
    } else {
        finalPrompt = `Target word: "${word}". Create 3 incorrect English vocabulary distractors (${len} letters). Return ONLY comma-separated words. Example: word1,word2,word3`;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] })
        });

        const data = await response.json();
        
        // 檢查 Gemini 回傳結構
        if (!data.candidates || !data.candidates[0]) {
            return res.status(500).json({ error: "Gemini returned empty response", detail: data });
        }

        const aiText = data.candidates[0].content.parts[0].text.trim();
        
        if (type === 'grammar') {
            try {
                // 強制清理可能存在的雜訊
                const cleanJson = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
                const startIndex = cleanJson.indexOf('[');
                const endIndex = cleanJson.lastIndexOf(']');
                const jsonStr = cleanJson.substring(startIndex, endIndex + 1);
                
                const parsed = JSON.parse(jsonStr);
                res.status(200).json({ questions: parsed });
            } catch (parseError) {
                // 如果解析失敗，將原始 AI 內容丟出來，方便除錯
                res.status(500).json({ error: "JSON Parse failed", rawAI: aiText });
            }
        } else {
            res.status(200).json({ distractors: aiText });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}