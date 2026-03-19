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

// --- 測驗開始 ---
async function startNewQuiz() {
    const start = parseInt(document.getElementById("start-lesson").value);
    const end = parseInt(document.getElementById("end-lesson").value);
    const amountVal = document.getElementById("quiz-amount").value;
    const amount = amountVal === "all" ? 999 : parseInt(amountVal);
    const useAi = document.getElementById("use-ai").checked;
    // 檢查目前是否為文法模式
    const isGrammar = document.getElementById("selected-mode-label").innerText.includes("Grammar");
    const statusText = document.getElementById("status-text");

    currentQueue = [];
    errorList = [];
    statusText.innerText = "Loading...";

    if (isGrammar) {
        // --- 文法模式邏輯 ---
        if (useAi) {
            statusText.innerText = "AI Generating Questions...";
            let hintParts = [];
            for (let i = start; i <= end; i++) {
                const key = `L${i}`;
                if (typeof grammarHints !== 'undefined' && grammarHints[key]) {
                    hintParts.push(`${key}重點：${grammarHints[key]}`);
                }
            }
            const topic = hintParts.length > 0 ? hintParts.join("；") : `國中英語 L${start} 到 L${end} 相關文法`;
            currentQueue = await fetchGrammarQuestions(topic, amount === 999 ? 10 : amount);
        } else {
            // 從 grammarBank 抓取靜態文法題
            for (let i = start; i <= end; i++) {
                if (typeof grammarBank !== 'undefined' && grammarBank[`L${i}`]) {
                    currentQueue.push(...grammarBank[`L${i}`]);
                }
            }
            currentQueue = currentQueue.sort(() => 0.5 - Math.random()).slice(0, amount);
        }
    } else {
        // --- 單字模式邏輯 (請確保這段與以下一致) ---
        statusText.innerText = "Loading Vocabulary...";
        for (let i = start; i <= end; i++) {
            const key = `L${i}`;
            // 關鍵點：單字模式必須強制只讀取 fullWordBank
            if (typeof fullWordBank !== 'undefined' && fullWordBank[key]) {
                currentQueue.push(...fullWordBank[key]);
            }
        }
        // 隨機排序並根據數量切片
        currentQueue = currentQueue.sort(() => 0.5 - Math.random()).slice(0, amount);
    }

    // --- 顯示題目邏輯 ---
    if (currentQueue && currentQueue.length > 0) {
        document.getElementById("setup-options").style.display = "none";
        document.getElementById("quiz-area").style.display = "block";
        currentIndex = 0;
        score = 0;
        showQuestion();
        statusText.innerText = "Playing";
    } else {
        alert("無法獲取題目，請檢查資料庫 (data.js) 是否包含所選課次。");
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