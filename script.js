// --- 初始化與變數 ---
let currentQueue = [];
let errorList = [];
let currentIndex = 0;
let score = 0;

// --- 模式選擇 ---
function selectMainMode(mode) {
    document.getElementById("selected-mode-label").innerText = (mode === 'vocabulary' ? "Vocabulary Mode" : "Grammar Mode");
    document.getElementById("mode-selection").style.display = "none";
    document.getElementById("setup-options").style.display = "block";
    
    const quizModeSelect = document.getElementById("quiz-mode");
    if (mode === 'grammar') {
        quizModeSelect.value = "multiple-choice";
        quizModeSelect.disabled = true;
    } else {
        quizModeSelect.disabled = false;
    }
}

function backToModeSelection() {
    document.getElementById("mode-selection").style.display = "block";
    document.getElementById("setup-options").style.display = "none";
}

// --- 測驗開始 (修復數量與加載邏輯) ---
async function startNewQuiz() {
    const start = parseInt(document.getElementById("start-lesson").value);
    const end = parseInt(document.getElementById("end-lesson").value);
    const amountVal = document.getElementById("quiz-amount").value;
    const amount = amountVal === "all" ? 999 : parseInt(amountVal); // 修正：處理 "all"
    const useAi = document.getElementById("use-ai").checked;
    const isGrammar = document.getElementById("selected-mode-label").innerText.includes("Grammar");
    const statusText = document.getElementById("status-text");

    currentQueue = [];
    errorList = [];
    statusText.innerText = "Loading...";

    if (isGrammar) {
        if (useAi) {
            statusText.innerText = "AI Generating Questions...";
            const topic = `國中英語 L${start} 到 L${end} 文法重點`;
            currentQueue = await fetchGrammarQuestions(topic, amount === 999 ? 20 : amount);
        } else {
            for (let i = start; i <= end; i++) {
                if (typeof grammarBank !== 'undefined' && grammarBank[`L${i}`]) {
                    currentQueue.push(...grammarBank[`L${i}`]);
                }
            }
            currentQueue = currentQueue.sort(() => 0.5 - Math.random()).slice(0, amount);
        }
    } else {
        // 單字模式：先從 data.js 載入基礎資料
        let allWords = [];
        for (let i = start; i <= end; i++) {
            if (typeof fullWordBank !== 'undefined' && fullWordBank[`L${i}`]) {
                allWords.push(...fullWordBank[`L${i}`]);
            }
        }
        currentQueue = allWords.sort(() => 0.5 - Math.random()).slice(0, amount);

        if (useAi && currentQueue.length > 0) {
            statusText.innerText = "AI Generating Distractors...";
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
        statusText.innerText = `Question ${currentIndex + 1} / ${currentQueue.length}`;
        currentIndex = 0;
        score = 0;
        showQuestion();
    } else {
        alert("No questions found. Please check your data.js or range.");
        statusText.innerText = "Ready";
    }
}

// --- 顯示題目 (修復 UI 分流) ---
function showQuestion() {
    const q = currentQueue[currentIndex];
    const mode = document.getElementById("quiz-mode").value;
    const isGrammar = document.getElementById("selected-mode-label").innerText.includes("Grammar");
    
    document.getElementById("status-text").innerText = `Question ${currentIndex + 1} / ${currentQueue.length}`;
    document.getElementById("sentence-text").innerText = q.q;
    document.getElementById("translation-text").innerText = q.sentenceTranslation || q.t || "";
    document.getElementById("feedback").style.display = "none";
    document.getElementById("next-btn").style.display = "none";
    
    const inputField = document.getElementById("user-input");
    const optionsContainer = document.getElementById("options-container");
    const submitBtn = document.getElementById("submit-btn");

    if (mode === "multiple-choice" || isGrammar) {
        inputField.style.display = "none";
        optionsContainer.style.display = "grid";
        submitBtn.style.display = "none";
        
        if (isGrammar) {
            renderGrammarOptions(q);
        } else {
            setupMultipleChoice(q, q.preloadedDistractors || []);
        }
    } else {
        inputField.style.display = "block";
        optionsContainer.style.display = "none";
        submitBtn.style.display = "block";
        inputField.value = "";
        inputField.focus();
    }
}

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
    distractors.forEach(d => { if(!options.includes(d.toLowerCase())) options.push(d.toLowerCase()); });
    
    // 如果干擾項不足，從現有題庫補
    const allWords = currentQueue.map(item => item.word.toLowerCase());
    while(options.length < 4) {
        let rand = allWords[Math.floor(Math.random() * allWords.length)];
        if(!options.includes(rand)) options.push(rand);
    }
    
    options.sort(() => Math.random() - 0.5).forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.onclick = () => handleFeedback(opt === q.word.toLowerCase(), q.word);
        container.appendChild(btn);
    });
}

function checkAnswer() {
    const q = currentQueue[currentIndex];
    const val = document.getElementById("user-input").value.trim().toLowerCase();
    handleFeedback(val === q.word.toLowerCase(), q.word);
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
        let msg = `Wrong. Answer: ${correctWord}`;
        if (isGrammar && q.explanation) msg += `<br><small>解析：${q.explanation}</small>`;
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
    document.getElementById("score-text").innerText = `Score: ${score} / ${currentQueue.length}`;
    const tbody = document.getElementById("mistake-table-body");
    tbody.innerHTML = errorList.length ? "" : "<tr><td colspan='2'>No mistakes!</td></tr>";
    errorList.forEach(item => {
        tbody.innerHTML += `<tr><td>${item.word || item.answer}</td><td>${item.t || "Grammar"}</td></tr>`;
    });
    document.getElementById("review-btn").style.display = errorList.length ? "block" : "none";
}

function startReview() {
    currentQueue = [...errorList];
    errorList = [];
    currentIndex = 0; score = 0;
    document.getElementById("result-area").style.display = "none";
    document.getElementById("quiz-area").style.display = "block";
    showQuestion();
}

function exitQuiz() { if (confirm("Quit?")) location.reload(); }

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const nextBtn = document.getElementById("next-btn");
        const submitBtn = document.getElementById("submit-btn");
        if (nextBtn.style.display !== "none") nextQuestion();
        else if (submitBtn.style.display !== "none") checkAnswer();
    }
});