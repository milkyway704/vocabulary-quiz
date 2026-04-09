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

// --- 測驗開始 (核心優化：預載 AI 選項) ---
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
        // 【文法模式】直接由 AI 生成整批題目 (含選項)
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
        // 【單字模式】
        statusText.innerText = "Preparing Vocabulary...";
        let rawQueue = [];
        for (let i = start; i <= end; i++) {
            const key = `L${i}`;
            if (typeof fullWordBank !== 'undefined' && fullWordBank[key]) {
                rawQueue.push(...fullWordBank[key]);
            }
        }
        // 先決定好要考哪些題
        currentQueue = rawQueue.sort(() => 0.5 - Math.random()).slice(0, amount);

        // 如果是多選模式且開啟 AI：在此處「預載」所有選項
        if (useAi && quizMode === "multiple-choice") {
            statusText.innerText = `AI Pre-loading options (0/${currentQueue.length})...`;
            
            // 使用 Promise.all 並行請求以加快速度
            const prefetchTasks = currentQueue.map(async (item, index) => {
                const distractors = await fetchAiDistractors(item.word);
                item.aiOptions = [item.word, ...distractors]; // 將生成的選項存入該題目物件
                statusText.innerText = `AI Pre-loading options (${index + 1}/${currentQueue.length})...`;
            });

            await Promise.all(prefetchTasks);
        }
    }

    if (currentQueue && currentQueue.length > 0) {
        document.getElementById("setup-options").style.display = "none";
        document.getElementById("quiz-area").style.display = "block";
        currentIndex = 0;
        score = 0;
        statusText.innerText = "Ready";
        showQuestion(); // 此時已預載完成，不需要 await
    } else {
        alert("無法獲取題目，請檢查資料庫 (data.js) 是否包含所選課次。");
        statusText.innerText = "Ready";
    }
}

// --- 顯示題目 (邏輯簡化，因為資料已備妥) ---
function showQuestion() {
    const item = currentQueue[currentIndex];
    const quizMode = document.getElementById("quiz-mode").value;
    const useAi = document.getElementById("use-ai").checked;

    // UI 重置
    document.getElementById("feedback").innerText = "";
    document.getElementById("next-btn").style.display = "none";
    document.getElementById("submit-btn").style.display = "block";
    const optionsContainer = document.getElementById("options-container");
    const userInput = document.getElementById("user-input");
    optionsContainer.innerHTML = "";
    
    // 設定題目文字
    document.getElementById("sentence-text").innerText = item.q || item.question;
    document.getElementById("translation-text").innerText = item.sentenceTranslation || item.explanation || "";

    if (quizMode === "multiple-choice") {
        optionsContainer.style.display = "grid";
        userInput.style.display = "none";
        let options = [];

        if (item.options && item.options.length > 0) {
            // 優先使用題目內建選項 (文法題)
            options = [...item.options];
        } else if (useAi && item.aiOptions) {
            // 使用預載好的 AI 選項 (單字題)
            options = [...item.aiOptions];
        } else {
            // 沒開 AI 或 AI 失敗時的備案：隨機抓取
            options = generateRandomDistractors(item.word);
        }

        renderOptions(options, item.word || item.answer);
    } else {
        // 填空模式
        optionsContainer.style.display = "none";
        userInput.style.display = "block";
        userInput.value = "";
        userInput.focus();
    }
}

// --- 以下其餘函式保持不變 ---
function renderOptions(options, correctAnswer) {
    const container = document.getElementById("options-container");
    // 複製並洗牌，確保選項位置隨機
    const shuffled = [...options].sort(() => 0.5 - Math.random());
    
    shuffled.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.onclick = () => checkMultipleChoice(opt, correctAnswer);
        container.appendChild(btn);
    });
}

function generateRandomDistractors(correctWord) {
    const allWords = [];
    Object.values(fullWordBank).forEach(lesson => {
        lesson.forEach(item => allWords.push(item.word));
    });
    
    const distractors = [];
    while (distractors.length < 3) {
        const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
        if (randomWord !== correctWord && !distractors.includes(randomWord)) {
            distractors.push(randomWord);
        }
    }
    return [correctWord, ...distractors];
}

function checkAnswer() {
    const item = currentQueue[currentIndex];
    const userAnswer = document.getElementById("user-input").value.trim().toLowerCase();
    const correctAnswer = (item.word || item.answer).toLowerCase();
    if (userAnswer === correctAnswer) handleCorrect();
    else handleWrong(item.word || item.answer);
}

function checkMultipleChoice(selected, correct) {
    if (selected.toLowerCase() === correct.toLowerCase()) handleCorrect();
    else handleWrong(correct);
}

function handleCorrect() {
    score++;
    document.getElementById("feedback").innerHTML = "<span style='color: #4CAF50'>Correct!</span>";
    document.getElementById("submit-btn").style.display = "none";
    document.getElementById("next-btn").style.display = "block";
}

function handleWrong(correctAnswer) {
    errorList.push(currentQueue[currentIndex]);
    document.getElementById("feedback").innerHTML = `<span style='color: #f44336'>Wrong! Answer: ${correctAnswer}</span>`;
    document.getElementById("submit-btn").style.display = "none";
    document.getElementById("next-btn").style.display = "block";
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