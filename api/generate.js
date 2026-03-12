// api/generate.js
export default async function handler(req, res) {
    const { word, len } = req.query; 
    const API_KEY = process.env.GEMINI_API_KEY;

    // 強化版的 Prompt，加入明確的負面約束
    const prompt = `Target word: "${word}". 
    Create 3 incorrect English vocabulary distractors for a junior high school student.
    Rules:
    1. MUST be exactly ${len} letters long.
    2. MUST NOT be the word "${word}".
    3. MUST be different from each other.
    4. Return ONLY the words separated by commas, no spaces after commas, no explanations.
    Example output: word1,word2,word3`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7 } // 增加一點隨機性
            })
        });

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text.replace(/\n/g, "");
        res.status(200).json({ distractors: aiText });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch AI" });
    }
}