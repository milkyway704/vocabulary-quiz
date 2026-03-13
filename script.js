// --- 初始化與變數 ---
if (typeof fetchAiDistractors === 'undefined') {
    console.error("api-client.js 未成功載入或順序錯誤！");
}

let currentQueue = [];
let errorList = [];
let currentIndex = 0;
let score = 0;

// --- 模式選擇 ---
function selectMainMode(mode) {
    document.getElementById("selected-mode-label").innerText = (mode === 'vocabulary' ? "Vocabulary Mode" : "Grammar Mode");
    document.getElementById("mode-selection").style.display = "none";
    document.getElementById("setup-options").style.display = "block";
    
    // 修正：文法模式時強制隱藏填充題選項
    const quizModeSelect = document.getElementById("quiz-mode");
    if (mode === 'grammar') {
        quizModeSelect.value = "multiple-choice";
        quizModeSelect.disabled = true; // 禁止切換回填充題
    } else {
        quizModeSelect.disabled = false;
    }
}

function backToModeSelection() {
    document.getElementById("mode-selection").style.display = "block";
    document.getElementById("setup-options").style.display = "none";
}

// --- 測驗開始 (核心修正) ---
async function startNewQuiz() {
    const start = parseInt(document.getElementById("start-lesson").value);
    const end = parseInt(document.getElementById("end-lesson").value);
    const amount = parseInt(document.getElementById("quiz-amount").value);
    const isGrammar = document.getElementById("selected-mode-label").innerText.includes("Grammar");
    const useAi = document.getElementById("use-ai-toggle").checked;
    
    currentQueue = [];
    document.getElementById("setup-options").style.display = "none";
    document.getElementById("quiz-area").style.display = "block";
    document.getElementById("sentence-text").innerText = "Loading questions...";

    // 1. 蒐集/獲取題目
    if (isGrammar && useAi) {
        const topic = `國中英語 L${start} 到 L${end} 文法重點`;
        const aiData = await fetchGrammarQuestions(topic, amount);
        currentQueue = aiData || [];
    } else {
        const source = isGrammar ? grammarBank : fullWordBank;
        for (let i = start; i <= end; i++) {
            if (source["L" + i]) currentQueue = currentQueue.concat(source["L" + i]);
        }
        currentQueue.sort(() => Math.random() - 0.5);
        if (amount > 0 && currentQueue.length > amount) currentQueue = currentQueue.slice(0, amount);

        // 預載 AI 干擾項
        if (!isGrammar && useAi && currentQueue.length > 0) {
            document.getElementById("sentence-text").innerText = "Loading AI content...";
            const aiPromises = currentQueue.map(q => fetchAiDistractors(q.word));
            const allDistractors = await Promise.all(aiPromises);
            currentQueue.forEach((q, index) => { q.preloadedDistractors = allDistractors[index]; });
        }
    }
    
    // 防錯檢查
    if (!currentQueue || currentQueue.length === 0) {
        alert("無題目資料，請檢查選單設定。");
        location.reload();
        return;
    }
    
    currentIndex = 0; score = 0; errorList = [];
    showQuestion();
}

// --- 顯示題目 (嚴格分流) ---
async function startNewQuiz() {
    const start = parseInt(document.getElementById("start-lesson").value);
    const end = parseInt(document.getElementById("end-lesson").value);
    const amount = parseInt(document.getElementById("quiz-amount").value);
    const useAi = document.getElementById("use-ai").checked;
    const isGrammar = document.getElementById("selected-mode-label").innerText.includes("Grammar");
    const statusText = document.getElementById("status-text");

    currentQueue = [];
    errorList = [];
    
    if (isGrammar) {
        // --- 文法模式邏輯 ---
        if (useAi) {
            statusText.innerText = "AI Generating Grammar Questions...";
            const topic = `國中英語 L${start} 到 L${end} 文法重點`;
            currentQueue = await fetchGrammarQuestions(topic, amount);
        } else {
            // 從 grammar_data.js 讀取靜態題目
            for (let i = start; i <= end; i++) {
                const lessonData = grammarBank[`L${i}`] || [];
                currentQueue.push(...lessonData);
            }
            currentQueue = currentQueue.sort(() => 0.5 - Math.random()).slice(0, amount);
        }
    } else {
        // --- 單字模式邏輯 ---
        let allWords = [];
        for (let i = start; i <= end; i++) {
            allWords.push(...(fullWordBank[`L${i}`] || []));
        }
        currentQueue = allWords.sort(() => 0.5 - Math.random()).slice(0, amount);

        if (useAi) {
            statusText.innerText = "AI Generating Distractors...";
            // 這裡就是我說的預載邏輯
            const aiPromises = currentQueue.map(q => fetchAiDistractors(q.word));
            const results = await Promise.all(aiPromises);
            currentQueue.forEach((q, idx) => {
                q.preloadedDistractors = results[idx];
            });
        }
    }

    if (currentQueue.length > 0) {
        document.getElementById("setup-options").style.display = "none";
        document.getElementById("quiz-area").style.display = "block";
        currentIndex = 0;
        score = 0;
        showQuestion();
    } else {
        alert("No questions found for the selected range.");
    }
}

// --- 選項渲染 (文法專用) ---
function renderGrammarOptions(q) {
    const container = document.getElementById("options-container");
    container.innerHTML = "";
    if (!q.options) return;
    q.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.onclick = () => handleFeedback(opt === q.answer, q.answer);
        container.appendChild(btn);
    });
}

// --- 選項渲染 (單字選擇題專用) ---
function setupMultipleChoice(q, distractors) {
    const container = document.getElementById("options-container");
    container.innerHTML = "";
    let options = [q.word.toLowerCase()];
    distractors.forEach(d => { if(!options.includes(d)) options.push(d); });
    
    const allWords = currentQueue.map(item => item.word.toLowerCase());
    while(options.length < 4) {
        let rand = allWords[Math.floor(Math.random() * allWords.length)];
        if(!options.includes(rand)) options.push(rand);
    }
    options.sort(() => Math.random() - 0.5);
    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.onclick = () => handleFeedback(opt === q.word.toLowerCase(), q.word);
        container.appendChild(btn);
    });
}

// --- 原有功能區 (反饋/錯誤複習/監聽) ---
function checkAnswer() {
    const q = currentQueue[currentIndex];
    handleFeedback(document.getElementById("user-input").value.trim().toLowerCase() === q.word.toLowerCase(), q.word);
}

function handleFeedback(isCorrect, correctWord) {
    const feedback = document.getElementById("feedback");
    const q = currentQueue[currentIndex];
    const isGrammar = document.getElementById("selected-mode-label").innerText.includes("Grammar");

    feedback.style.display = "block";
    
    if (isCorrect) {
        feedback.className = "feedback correct";
        feedback.innerText = "Correct!";
        score++;
    } else {
        feedback.className = "feedback wrong";
        // 只有答錯時顯示解析，且僅在文法模式下顯示
        let msg = `Incorrect. The answer is: ${correctWord}`;
        if (isGrammar && q.explanation) {
            msg += `<br><small style="color: #666;">解析：${q.explanation}</small>`;
        }
        feedback.innerHTML = msg;
        errorList.push(q);
    }
    
    document.getElementById("next-btn").style.display = "block";
    document.getElementById("submit-btn").style.display = "none";
    document.getElementById("options-container").style.display = "none";
}

function nextQuestion() {
    currentIndex++;
    if (currentIndex < currentQueue.length) showQuestion();
    else showResult();
}

function showResult() {
    document.getElementById("quiz-area").style.display = "none";
    document.getElementById("result-area").style.display = "block";
    document.getElementById("score-text").innerText = `Final Score: ${score} / ${currentQueue.length}`;
    const tbody = document.getElementById("mistake-table-body");
    tbody.innerHTML = ""; 
    if (errorList.length === 0) {
        tbody.innerHTML = "<tr><td colspan='2' style='padding: 15px;'>Perfect! No mistakes.</td></tr>";
        document.getElementById("review-btn").style.display = "none";
    } else {
        errorList.forEach(item => {
            tbody.innerHTML += `<tr><td style='padding: 10px;'>${item.word}</td><td style='padding: 10px;'>${item.t || "N/A"}</td></tr>`;
        });
        document.getElementById("review-btn").style.display = "block";
    }
}

function startReview() {
    if (errorList.length === 0) return;
    currentQueue = [...errorList];
    errorList = [];
    currentIndex = 0; score = 0;
    document.getElementById("result-area").style.display = "none";
    document.getElementById("quiz-area").style.display = "block";
    showQuestion();
}

function exitQuiz() { if (confirm("Quit quiz?")) location.reload(); }

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const userInput = document.getElementById("user-input");
        const nextBtn = document.getElementById("next-btn");
        if (userInput.style.display !== "none" && userInput.value.trim() !== "") checkAnswer();
        else if (nextBtn.style.display !== "none") nextQuestion();
    }
});