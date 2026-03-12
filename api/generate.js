// api/generate.js
export default async function handler(req, res) {
    const { word, len } = req.query;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: "API Key is not configured." });
    }

    const prompt = `Target word: "${word}". Create 3 incorrect English vocabulary distractors (${len} letters). Return ONLY comma-separated words. Example: word1,word2,word3`;

    try {
        console.log("API Key Check:", API_KEY ? "Found" : "Missing");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Gemini API error:", errorData);
            return res.status(500).json({ error: "Gemini API failed" });
        }

        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!aiText) throw new Error("No text content returned from Gemini");

        res.status(200).json({ distractors: aiText.trim() });
    } catch (error) {
        console.error("Internal Server Error:", error);
        res.status(500).json({ error: error.message });
    }
}