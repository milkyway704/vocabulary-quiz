async function fetchAiDistractors(word) {
    try {
        const response = await fetch(`/api/generate?type=vocab&word=${encodeURIComponent(word)}&len=${word.length}`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        if (!data.distractors) return [];
        
        // 1. 處理回傳字串，過濾掉非法字元與重複的正解
        let distractors = data.distractors.split(",")
            .map(w => w.replace(/[^a-zA-Z]/g, "").trim().toLowerCase())
            .filter(w => w !== "" && w !== word.toLowerCase());

        // 2. 去重（防止 AI 給了重複的干擾項）
        distractors = [...new Set(distractors)];

        // 3. 【核心修正】如果選項不夠 3 個（加上正解才會有 4 個），自動補齊
        if (distractors.length < 3) {
            const allWords = [];
            // 從本地資料庫抓取所有可能的單字
            Object.values(fullWordBank).forEach(lesson => {
                lesson.forEach(item => allWords.push(item.word.toLowerCase()));
            });

            while (distractors.length < 3) {
                const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
                // 確保補進來的字不是正解，也不是已經存在的干擾項
                if (randomWord !== word.toLowerCase() && !distractors.includes(randomWord)) {
                    distractors.push(randomWord);
                }
            }
        }

        // 4. 只取前 3 個，確保加正解後剛好 4 個選項
        return distractors.slice(0, 3);
        
    } catch (error) {
        console.error("AI API Error:", error);
        // 如果 API 完全掛掉，直接回傳 3 個隨機單字當保底
        return generateRandomDistractorsOnly(word);
    }
}

// 輔助函式：當 API 失敗或不夠時使用的純隨機邏輯
function generateRandomDistractorsOnly(correctWord) {
    const allWords = [];
    Object.values(fullWordBank).forEach(lesson => {
        lesson.forEach(item => allWords.push(item.word.toLowerCase()));
    });
    const fallback = [];
    while (fallback.length < 3) {
        const rw = allWords[Math.floor(Math.random() * allWords.length)];
        if (rw !== correctWord.toLowerCase() && !fallback.includes(rw)) {
            fallback.push(rw);
        }
    }
    return fallback;
}