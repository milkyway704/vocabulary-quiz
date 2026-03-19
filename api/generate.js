export default async function handler(req, res) {
    const { word, len, type, topic, count } = req.query;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) return res.status(500).json({ error: "API Key missing" });

    let finalPrompt = "";
    if (type === 'grammar') {
        // --- 核心修正：讓 AI 專注於你傳入的 topic ---
        finalPrompt = `你現在是一位專業的台灣國中英語老師。請根據以下指定的文法要點生成 ${count || 5} 題選擇題。
        
        【文法要點】：${topic}
        
        要求：
        1. 題目與選項必須完全符合上述文法範圍，程度需適合國中生。
        2. 題目必須包含：q(題目), options(4個選項陣列), answer(正確答案), explanation(深入淺出的中文解析)。
        3. 格式規範：回傳一個純 JSON 陣列，嚴禁包含 Markdown 標記 (如 \`\`\`json) 或任何前言後語。
        4. 確保正確答案位於 options 陣列中，且與 answer 欄位完全一致。`;
        
    } else {
        finalPrompt = `Target word: "${word}". Create 3 incorrect English vocabulary distractors (${len} letters). Return ONLY comma-separated words without any explanation or markdown. Example: word1,word2,word3`;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] })
        });

        const data = await response.json();

        // 核心修復：安全讀取 AI 回傳內容
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiText) {
            console.error("Gemini Error:", data);
            return res.status(500).json({ error: "AI failed to generate content", detail: data });
        }

        if (type === 'grammar') {
            // 清理 JSON 格式中的 Markdown 標籤
            const cleanJson = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
            const startIndex = cleanJson.indexOf('[');
            const endIndex = cleanJson.lastIndexOf(']');
            
            if (startIndex === -1 || endIndex === -1) {
                throw new Error("Invalid JSON format from AI");
            }

            const jsonStr = cleanJson.substring(startIndex, endIndex + 1);
            res.status(200).json({ questions: JSON.parse(jsonStr) });
        } else {
            // 清理單字回傳中可能的引號或 Markdown
            const cleanText = aiText.replace(/`/g, "").trim();
            res.status(200).json({ distractors: cleanText });
        }
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: error.message });
    }
}