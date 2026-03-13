// --- 初始化與變數 ---
if (typeof fetchAiDistractors === 'undefined') {
    console.error("api-client.js 未成功載入或順序錯誤！");
}

const correctSound = new Audio("./assets/correct.wav");
const wrongSound = new Audio("./assets/wrong.wav");

let currentQueue = [];
let errorList = [];
let currentIndex = 0;
let score = 0;

// --- 模式選擇 ---
function selectMainMode(mode) {
    document.getElementById("selected-mode-label").innerText = (mode === 'vocabulary' ? "Vocabulary Mode" : "Grammar Mode");
    document.getElementById("mode-selection").style.display = "none";
    document.getElementById("setup-options").style.display = "block";
}

function backToModeSelection() {
    document.getElementById("mode-selection").style.display = "block";
    document.getElementById("setup-options").style.display = "none";
}

// --- 測驗開始 (已加入 AI 預載邏輯) ---
async function startNewQuiz() {
    const start = parseInt(document.getElementById("start-lesson").value);
    const end = parseInt(document.getElementById("end-lesson").value);
    const amount = parseInt(document.getElementById("quiz-amount").value);
    const isGrammar = document.getElementById("selected-mode-label").innerText.includes("Grammar");
    const useAi = document.getElementById("use-ai-toggle").checked;
    
    currentQueue = [];
    
    // 1. 蒐集題目
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

        // 2. 預先載入 AI 干擾項 (不更動原本功能，僅在 startNewQuiz 時執行)
        if (!isGrammar && useAi) {
            document.getElementById("sentence-text").innerText = "Loading AI content...";
            const aiPromises = currentQueue.map(q => fetchAiDistractors(q.word));
            const allDistractors = await Promise.all(aiPromises);
            currentQueue.forEach((q, index) => { q.preloadedDistractors = allDistractors[index]; });
        }
    }
    
    currentIndex = 0; score = 0; errorList = [];
    document.getElementById("setup-options").style.display = "none";
    document.getElementById("quiz-area").style.display = "block";
    showQuestion();
}

// --- 顯示題目 (嚴格遵守您的原版邏輯) ---
function showQuestion() {
    const q = currentQueue[currentIndex];
    const quizMode = document.getElementById("quiz-mode").value;
    const isGrammar = document.getElementById("selected-mode-label").innerText.includes("Grammar");

    document.getElementById("status-text").innerText = `Progress: ${currentIndex + 1} / ${currentQueue.length}`;
    document.getElementById("sentence-text").innerText = q.q;
    document.getElementById("translation-text").innerText = isGrammar ? (q.explanation || "") : (q.sentenceTranslation || "");

    document.getElementById("feedback").style.display = "none";
    document.getElementById("next-btn").style.display = "none";

    if (isGrammar || quizMode === "multiple-choice") {
        document.getElementById("user-input").style.display = "none";
        document.getElementById("submit-btn").style.display = "none";
        document.getElementById("options-container").style.display = "grid";
        
        if (isGrammar) {
            renderGrammarOptions(q);
        } else {
            // 使用預載的資料
            setupMultipleChoice(q, q.preloadedDistractors || []);
        }
    } else {
        document.getElementById("user-input").style.display = "block";
        document.getElementById("submit-btn").style.display = "block";
        document.getElementById("options-container").style.display = "none";
        document.getElementById("user-input").value = "";
        setTimeout(() => { document.getElementById("user-input").focus(); }, 50);
    }
}

// --- 選擇題渲染邏輯 ---
function renderGrammarOptions(q) {
    const container = document.getElementById("options-container");
    container.innerHTML = "";
    q.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.onclick = () => handleFeedback(opt === q.answer, q.answer);
        container.appendChild(btn);
    });
}

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

// --- 檢查答案與反饋 (保留您的完整功能) ---
function checkAnswer() {
    const q = currentQueue[currentIndex];
    const userAnswer = document.getElementById("user-input").value.trim().toLowerCase();
    handleFeedback(userAnswer === q.word.toLowerCase(), q.word);
}

function handleFeedback(isCorrect, correctWord) {
    const feedback = document.getElementById("feedback");
    feedback.style.display = "block";
    document.getElementById("next-btn").style.display = "block";
    document.getElementById("submit-btn").style.display = "none";
    document.getElementById("user-input").style.display = "none";
    document.getElementById("options-container").style.display = "none";

    if (isCorrect) {
        feedback.className = "feedback correct";
        feedback.innerText = "Correct!";
        score++;
    } else {
        feedback.className = "feedback wrong";
        feedback.innerText = `Incorrect. The answer is: ${correctWord}`;
        errorList.push(currentQueue[currentIndex]);
    }
}

function nextQuestion() {
    currentIndex++;
    if (currentIndex < currentQueue.length) showQuestion();
    else showResult();
}

// --- 錯誤複習功能 (完整保留) ---
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

// --- 鍵盤監聽 (保留您的完整功能) ---
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const userInput = document.getElementById("user-input");
        const nextBtn = document.getElementById("next-btn");
        if (userInput.style.display !== "none" && userInput.value.trim() !== "") checkAnswer();
        else if (nextBtn.style.display !== "none") nextQuestion();
    }
});