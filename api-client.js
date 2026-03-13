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
        // 使用您定義的參數：type=grammar (對應後端 req.query.mode 或 req.query.type)
        const url = `/api/generate?type=grammar&topic=${encodeURIComponent(topic)}&count=${count}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        // 確保回傳結構正確。如果後端回傳 { questions: [...] }，則 return data.questions
        // 如果後端回傳直接就是陣列，則 return data
        return Array.isArray(data.questions) ? data.questions : (Array.isArray(data) ? data : []);
    } catch (error) {
        console.error("Fetch Grammar Error:", error);
        return []; // 發生錯誤時回傳空陣列，防止程式崩潰
    }
}