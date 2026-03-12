// api/generate.js
export default async function handler(req, res) {
    const { type, word, len, topic, count } = req.query;
    const API_KEY = process.env.GEMINI_API_KEY;

    try {
        let prompt = "";
        if (type === 'grammar') {
            prompt = `請針對「${topic}」出 ${count || 3} 題選擇題。格式必須為 JSON 陣列，每個物件包含 q(題目), options(陣列), answer(正確選項), explanation(解析)。範例: [{"q":"...","options":["A","B","C","D"],"answer":"A","explanation":"..."}]。請不要輸出任何 Markdown 標記，僅輸出純 JSON。`;
        } else {
            prompt = `Target word: "${word}". Create 3 incorrect distractors (exactly ${len} letters). Return ONLY comma-separated words.`;
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text.trim().replace(/```json|```/g, "");
        
        res.status(200).json(type === 'grammar' ? JSON.parse(aiText) : { distractors: aiText });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}