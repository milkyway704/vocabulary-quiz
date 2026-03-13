async function fetchAiDistractors(word) {
    try {
        // 明確加入 type=vocab 參數，並對單字進行編碼處理
        const response = await fetch(`/api/generate?type=vocab&word=${encodeURIComponent(word)}&len=${word.length}`);
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Network response was not ok');
        }
        
        const data = await response.json();
        if (!data.distractors) return [];
        
        // 處理回傳字串：過濾掉 Markdown、換行、空白，並確保不包含正解單字
        return data.distractors.split(",")
            .map(w => w.replace(/[^a-zA-Z]/g, "").trim().toLowerCase()) // 只保留字母
            .filter(w => w !== "" && w !== word.toLowerCase().replace(/\s/g, ""));
    } catch (error) {
        console.error("AI API Error:", error);
        return [];
    }
}

async function fetchGrammarQuestions(topic, count = 5) {
    try {
        const response = await fetch(`/api/generate?type=grammar&topic=${encodeURIComponent(topic)}&count=${count}`);
        if (!response.ok) throw new Error('Grammar API failed');
        
        const data = await response.json();
        return data.questions || []; 
    } catch (error) {
        console.error("Fetch Grammar Error:", error);
        return [];
    }
}