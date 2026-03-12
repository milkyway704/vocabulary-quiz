// api/generate.js
export default async function handler(req, res) {
    const { word } = req.query; // 從前端傳來的單字
    const API_KEY = process.env.GEMINI_API_KEY; // 從環境變數讀取 Key，不會出現在原始碼

    const prompt = `Target word: "${word}". 
        Generate 3 incorrect but plausible English vocabulary distractors for a junior high school student in Taiwan. 
        Requirements:
        1. Each distractor MUST have exactly ${word.length} letters (the same as the target word).
        2. The words should be common vocabulary for CEFR A1-A2 level (junior high school).
        3. Return only the 3 words separated by commas, no other text.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;
        
        // 回傳給前端
        res.status(200).json({ distractors: aiText });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch AI distractors" });
    }
}