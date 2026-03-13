// --- 全域變數 ---
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

// --- 測驗流程核心 ---
async function startNewQuiz() {
    const start = parseInt(document.getElementById("start-lesson").value);
    const end = parseInt(document.getElementById("end-lesson").value);
    const amount = parseInt(document.getElementById("quiz-amount").value);
    const useAi = document.getElementById("use-ai-toggle").checked;
    const isGrammar = document.getElementById("selected-mode-label").innerText === "Grammar Mode";

    document.getElementById("setup-options").style.display = "none";
    document.getElementById("quiz-area").style.display = "block";
    document.getElementById("sentence-text").innerText = "Loading...";

    currentQueue = [];
    const source = isGrammar ? grammarBank : fullWordBank;

    for (let i = start; i <= end; i++) {
        if (source["L" + i]) currentQueue = currentQueue.concat(source["L" + i]);
    }

    currentQueue.sort(() => Math.random() - 0.5);
    if (amount > 0 && currentQueue.length > amount) currentQueue = currentQueue.slice(0, amount);

    // 預先載入 AI 干擾項 (Vocabulary 模式下)
    if (!isGrammar && useAi) {
        const aiPromises = currentQueue.map(q => fetchAiDistractors(q.word));
        const allDistractors = await Promise.all(aiPromises);
        currentQueue.forEach((q, index) => q.preloadedDistractors = allDistractors[index]);
    }

    currentIndex = 0; score = 0; errorList = [];
    showQuestion();
}

// --- 顯示題目 (嚴格分流) ---
function showQuestion() {
    const q = currentQueue[currentIndex];
    const isGrammar = document.getElementById("selected-mode-label").innerText === "Grammar Mode";
    const quizMode = document.getElementById("quiz-mode").value; // 'multiple-choice' 或 'fill-in-the-blank'

    document.getElementById("status-text").innerText = `Progress: ${currentIndex + 1} / ${currentQueue.length}`;
    document.getElementById("sentence-text").innerText = q.q;
    document.getElementById("translation-text").innerText = isGrammar ? (q.explanation || "") : (q.sentenceTranslation || "");

    document.getElementById("feedback").style.display = "none";
    document.getElementById("next-btn").style.display = "none";

    // 判定是否顯示選項 (文法題 或 選擇題模式)
    const showOptions = isGrammar || quizMode === "multiple-choice";

    if (showOptions) {
        document.getElementById("user-input").style.display = "none";
        document.getElementById("submit-btn").style.display = "none";
        document.getElementById("options-container").style.display = "grid";
        
        isGrammar ? renderGrammarOptions(q) : setupMultipleChoice(q, q.preloadedDistractors || []);
    } else {
        document.getElementById("options-container").style.display = "none";
        document.getElementById("user-input").style.display = "block";
        document.getElementById("submit-btn").style.display = "block";
        document.getElementById("user-input").value = "";
        setTimeout(() => document.getElementById("user-input").focus(), 50);
    }
}

// --- 選項渲染 ---
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
    
    // 補齊亂數
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

// --- 互動與結果 ---
function checkAnswer() {
    const q = currentQueue[currentIndex];
    handleFeedback(document.getElementById("user-input").value.trim().toLowerCase() === q.word.toLowerCase(), q.word);
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

function showResult() {
    document.getElementById("quiz-area").style.display = "none";
    document.getElementById("result-area").style.display = "block";
    document.getElementById("score-text").innerText = `Final Score: ${score} / ${currentQueue.length}`;
    const tbody = document.getElementById("mistake-table-body");
    tbody.innerHTML = errorList.length === 0 ? "<tr><td colspan='2'>Perfect!</td></tr>" : "";
    errorList.forEach(item => tbody.innerHTML += `<tr><td>${item.word}</td><td>${item.t || "N/A"}</td></tr>`);
}

function exitQuiz() { location.reload(); }

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const input = document.getElementById("user-input");
        const next = document.getElementById("next-btn");
        if (input.style.display !== "none" && input.value.trim() !== "") checkAnswer();
        else if (next.style.display !== "none") nextQuestion();
    }
});