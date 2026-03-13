async function fetchAiDistractors(word) {
    try {
        const response = await fetch(`/api/generate?word=${encodeURIComponent(word)}&len=${word.length}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        if (!data.distractors) return [];
        
        // 處理回傳字串，並過濾掉重複或正解
        return data.distractors.split(",")
            .map(w => w.trim().toLowerCase())
            .filter(w => w !== "" && w !== word.toLowerCase());
    } catch (error) {
        console.error("AI API Error:", error);
        return [];
    }
}

async function fetchGrammarQuestions(topic, count = 5) {
    try {
        const response = await fetch(`/api/generate?type=grammar&topic=${encodeURIComponent(topic)}&count=${count}`);
        const data = await response.json();
        // 確保回傳陣列
        return data.questions || []; 
    } catch (error) {
        console.error("Fetch Grammar Error:", error);
        return [];
    }
}