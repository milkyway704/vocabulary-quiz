export default async function handler(req, res) {
    const { word, len, type, topic, count } = req.query; // 務必解構所有可能的參數
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) return res.status(500).json({ error: "API Key missing" });

    let finalPrompt = "";
    if (type === 'grammar') {
        finalPrompt = `Create ${count} multiple choice grammar questions about ${topic}. Format as a JSON array of objects: [{"q": "...", "options": ["...", "...", "...", "..."], "answer": "...", "explanation": "..."}]. Return ONLY the JSON.`;
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