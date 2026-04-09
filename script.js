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

// --- 測驗開始 (含預載 AI 邏輯) ---
async function startNewQuiz() {
    const start = parseInt(document.getElementById("start-lesson").value);
    const end = parseInt(document.getElementById("end-lesson").value);
    const amountVal = document.getElementById("quiz-amount").value;
    const amount = amountVal === "all" ? 999 : parseInt(amountVal);
    const useAi = document.getElementById("use-ai").checked;
    const isGrammar = document.getElementById("selected-mode-label").innerText.includes("Grammar");
    const quizMode = document.getElementById("quiz-mode").value;
    const statusText = document.getElementById("status-text");

    currentQueue = [];
    errorList = [];
    statusText.innerText = "Loading...";

    if (isGrammar) {
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
            for (let i = start; i <= end; i++) {
                if (typeof grammarBank !== 'undefined' && grammarBank[`L${i}`]) {
                    currentQueue.push(...grammarBank[`L${i}`]);
                }
            }
            currentQueue = currentQueue.sort(() => 0.5 - Math.random()).slice(0, amount);
        }
    } else {
        statusText.innerText = "Preparing Vocabulary...";
        let rawQueue = [];
        for (let i = start; i <= end; i++) {
            const key = `L${i}`;
            if (typeof fullWordBank !== 'undefined' && fullWordBank[key]) {
                rawQueue.push(...fullWordBank[key]);
            }
        }
        currentQueue = rawQueue.sort(() => 0.5 - Math.random()).slice(0, amount);

        if (useAi && quizMode === "multiple-choice") {
            statusText.innerText = `AI Pre-loading options (0/${currentQueue.length})...`;
            const prefetchTasks = currentQueue.map(async (item, index) => {
                const distractors = await fetchAiDistractors(item.word);
                item.aiOptions = [item.word, ...distractors];
                statusText.innerText = `AI Pre-loading ( ${index + 1}/${currentQueue.length} )...`;
            });
            await Promise.all(prefetchTasks);
        }
    }

    if (currentQueue && currentQueue.length > 0) {
        document.getElementById("setup-options").style.display = "none";
        document.getElementById("quiz-area").style.display = "block";
        currentIndex = 0; score = 0;
        statusText.innerText = "Ready";
        showQuestion();
    } else {
        alert("無法獲取題目，請檢查資料庫。");
        statusText.innerText = "Ready";
    }
}

// --- 顯示題目 ---
function showQuestion() {
    const item = currentQueue[currentIndex];
    const quizMode = document.getElementById("quiz-mode").value;
    const useAi = document.getElementById("use-ai").checked;

    document.getElementById("feedback").innerText = "";
    document.getElementById("next-btn").style.display = "none";
    document.getElementById("submit-btn").style.display = (quizMode === "fill-in" ? "block" : "none");
    
    const optionsContainer = document.getElementById("options-container");
    const userInput = document.getElementById("user-input");
    optionsContainer.innerHTML = "";
    
    document.getElementById("sentence-text").innerText = item.q || item.question;
    document.getElementById("translation-text").innerText = item.sentenceTranslation || item.explanation || "";

    if (quizMode === "multiple-choice") {
        optionsContainer.style.display = "grid";
        userInput.style.display = "none";
        let options = [];

        if (item.options && item.options.length > 0) options = [...item.options];
        else if (useAi && item.aiOptions) options = [...item.aiOptions];
        else options = generateRandomDistractors(item.word);

        renderOptions(options, item.word || item.answer);
    } else {
        optionsContainer.style.display = "none";
        userInput.style.display = "block";
        userInput.disabled = false; // 確保填空框被啟用
        userInput.value = "";
        userInput.focus();
    }
}

function renderOptions(options, correctAnswer) {
    const container = document.getElementById("options-container");
    const shuffled = [...options].sort(() => 0.5 - Math.random());
    
    shuffled.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.onclick = () => checkMultipleChoice(btn, opt, correctAnswer); // 傳入按鈕本身以進行樣式修改
        container.appendChild(btn);
    });
}

// --- 檢查答案 (關鍵修正：鎖定按鈕) ---
function checkMultipleChoice(selectedBtn, selectedText, correctText) {
    // 1. 立即禁用所有選項按鈕，防止重複點擊
    const allButtons = document.querySelectorAll(".option-btn");
    allButtons.forEach(btn => btn.disabled = true);

    if (selectedText.toLowerCase() === correctText.toLowerCase()) {
        selectedBtn.style.backgroundColor = "#4CAF50"; // 答對變綠
        selectedBtn.style.color = "white";
        handleCorrect();
    } else {
        selectedBtn.style.backgroundColor = "#f44336"; // 答錯選項變紅
        selectedBtn.style.color = "white";
        
        // 額外顯示正確答案是哪一個
        allButtons.forEach(btn => {
            if (btn.innerText.toLowerCase() === correctText.toLowerCase()) {
                btn.style.border = "2px solid #4CAF50";
                btn.style.color = "#4CAF50";
            }
        });
        handleWrong(correctText);
    }
}

function checkAnswer() {
    const item = currentQueue[currentIndex];
    const userInput = document.getElementById("user-input");
    const userAnswer = userInput.value.trim().toLowerCase();
    const correctAnswer = (item.word || item.answer).toLowerCase();

    userInput.disabled = true; // 鎖定輸入框

    if (userAnswer === correctAnswer) {
        handleCorrect();
    } else {
        handleWrong(item.word || item.answer);
    }
}

// --- 處理狀態 ---
function handleCorrect() {
    score++;
    document.getElementById("feedback").innerHTML = "<span style='color: #4CAF50; font-weight: bold;'>Correct!</span>";
    document.getElementById("submit-btn").style.display = "none";
    document.getElementById("next-btn").style.display = "block";
}

function handleWrong(correctAnswer) {
    errorList.push(currentQueue[currentIndex]);
    document.getElementById("feedback").innerHTML = `<span style='color: #f44336; font-weight: bold;'>Wrong! Answer: ${correctAnswer}</span>`;
    document.getElementById("submit-btn").style.display = "none";
    document.getElementById("next-btn").style.display = "block";
}

// --- 其餘輔助函式 ---
function generateRandomDistractors(correctWord) {
    const allWords = [];
    Object.values(fullWordBank).forEach(lesson => {
        lesson.forEach(item => allWords.push(item.word));
    });
    const distractors = [];
    while (distractors.length < 3) {
        const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
        if (randomWord !== correctWord && !distractors.includes(randomWord)) distractors.push(randomWord);
    }
    return [correctWord, ...distractors];
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
    tbody.innerHTML = errorList.length ? "" : "<tr><td colspan='2'>No mistakes! 🎉</td></tr>";
    errorList.forEach(item => {
        tbody.innerHTML += `<tr><td>${item.word || item.answer}</td><td>${item.t || "Grammar Review"}</td></tr>`;
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

function exitQuiz() { if (confirm("Quit this quiz?")) location.reload(); }

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const nextBtn = document.getElementById("next-btn");
        const submitBtn = document.getElementById("submit-btn");
        if (nextBtn.style.display === "block") nextQuestion();
        else if (submitBtn.style.display === "block") {
            if (document.getElementById("quiz-mode").value === "fill-in") checkAnswer();
        }
    }
});