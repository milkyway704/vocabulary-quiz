export default async function handler(req, res) {
    const { word, len, type, topic, count } = req.query;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) return res.status(500).json({ error: "API Key missing" });

    let finalPrompt = "";
    if (type === 'grammar') {
        finalPrompt = `
        請生成 ${count} 題台灣國中英語文法選擇題，主題為：${topic}。
        要求：
        1. 題目需具備教學意義（如比較級、不定代名詞）。
        2. 每題包含：q(題目), options(4個字串陣列), answer(正確答案字串), explanation(中文解析)。
        3. 回傳格式為純 JSON 陣列。不要包含 markdown 標記。
        `;
    } else {
        finalPrompt = `Target word: "${word}". Create 3 incorrect English vocabulary distractors (${len} letters). Return ONLY comma-separated words. Example: word1,word2,word3`;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] })
        });

        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (type === 'grammar') {
            const cleanJson = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
            res.status(200).json({ questions: JSON.parse(cleanJson) });
        } else {
            res.status(200).json({ distractors: aiText });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}