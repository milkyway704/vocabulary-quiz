export default async function handler(req, res) {
    const API_KEY = process.env.GEMINI_API_KEY;
    const { word, len, topic, amount, mode } = req.query; // 接收模式參數

    if (!API_KEY) return res.status(500).json({ error: "API Key missing" });

    let finalPrompt = "";
    let isGrammar = (mode === 'grammar');

    if (isGrammar) {
        finalPrompt = `Create ${amount} multiple choice grammar questions about ${topic}. Format as a JSON array of objects: [{"q": "...", "options": ["...", "...", "...", "..."], "answer": "...", "explanation": "..."}]. Return ONLY the raw JSON, no markdown formatting.`;
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
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (isGrammar) {
            // 移除可能出現的 markdown json 標記
            const cleanJson = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
            res.status(200).json({ questions: JSON.parse(cleanJson) });
        } else {
            res.status(200).json({ distractors: aiText.trim() });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}