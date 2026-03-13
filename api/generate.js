export default async function handler(req, res) {
    const { word, len, type, topic, count } = req.query;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) return res.status(500).json({ error: "API Key missing" });

    let finalPrompt = "";
    if (type === 'grammar') {
        finalPrompt = `
            請作為一名台灣國中英語教師，根據以下要求生成 ${count || 5} 題文法選擇題：
            主題範圍：${topic}
            要求：
            1. 題目需包含比較級、最高級、不定代名詞(one/ones/it/them)等用法。
            2. 每題包含四個選項(A, B, C, D)，且必須只有一個正確答案。
            3. 必須提供詳細的「中文解析」。
            4. 回傳格式為嚴格的 JSON 陣列，欄位如下：
            [{"q": "...", "options": ["A", "B", "C", "D"], "answer": "...", "explanation": "..."}]
            請僅回傳 JSON 陣列，不要包含任何 Markdown 標記、代碼區塊符號(```)或文字說明。
            `;
    } else {
        finalPrompt = `Target word: "${word}". Create 3 incorrect English vocabulary distractors (${len} letters). Return ONLY comma-separated words. Example: word1,word2,word3`;
    }

    try {
        // 使用更穩定的模型名稱
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini API Error: ${err}`);
        }

        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!aiText) throw new Error("No content from Gemini");

        if (type === 'grammar') {
            // 強力清理 JSON 內容
            const cleanJson = aiText
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();
            
            // 確保找到 JSON 的開頭與結尾
            const startIndex = cleanJson.indexOf('[');
            const endIndex = cleanJson.lastIndexOf(']');
            const jsonStr = cleanJson.substring(startIndex, endIndex + 1);
            
            res.status(200).json(JSON.parse(jsonStr));
        } else {
            res.status(200).json({ distractors: aiText.trim() });
        }
    } catch (error) {
        console.error("Backend Error Detail:", error);
        res.status(500).json({ error: error.message });
    }
}