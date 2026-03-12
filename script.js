if (typeof fetchAiDistractors === 'undefined') {
    console.error("api-client.js 未成功載入或順序錯誤！");
}

const correctSound = new Audio("./assets/correct.wav");
const wrongSound = new Audio("./assets/wrong.wav");

let currentQueue = [];
let errorList = [];
let currentIndex = 0;
let score = 0;

function selectMainMode(mode) {
    document.getElementById("selected-mode-label").innerText = (mode === 'vocabulary' ? "Vocabulary Mode" : "Grammar Mode");
    document.getElementById("mode-selection").style.display = "none";
    document.getElementById("setup-options").style.display = "block";
}

function backToModeSelection() {
    document.getElementById("mode-selection").style.display = "block";
    document.getElementById("setup-options").style.display = "none";
}

async function startNewQuiz() {
    const start = parseInt(document.getElementById("start-lesson").value);
    const end = parseInt(document.getElementById("end-lesson").value);
    const isGrammar = document.getElementById("selected-mode-label").innerText.includes("Grammar");
    const useAi = document.getElementById("use-ai-toggle").checked;

    currentQueue = [];
    
    // 如果是文法模式且勾選 AI
    if (isGrammar && useAi) {
        const topic = `國中英語 L${start} 到 L${end} 文法重點`;
        const aiData = await fetchGrammarQuestions(topic, 5);
        currentQueue = aiData || [];
    } else {
        // 使用原有的靜態題庫
        const source = isGrammar ? grammarBank : fullWordBank;
        for (let i = start; i <= end; i++) {
            if (source["L" + i]) currentQueue = currentQueue.concat(source["L" + i]);
        }
    }
    
    currentIndex = 0; score = 0; errorList = [];
    document.getElementById("setup-options").style.display = "none";
    document.getElementById("quiz-area").style.display = "block";
    showQuestion();
}

function showQuestion() {
    const q = currentQueue[currentIndex];
    // 判斷當前模式：查看標籤文字
    const isGrammar = document.getElementById("selected-mode-label").innerText.includes("Grammar");

    document.getElementById("status-text").innerText = `Progress: ${currentIndex + 1} / ${currentQueue.length}`;
    document.getElementById("sentence-text").innerText = q.q;
    
    // 調整翻譯區塊：單字模式顯示 t，文法模式顯示解釋(如果有)
    document.getElementById("translation-text").innerText = isGrammar ? (q.explanation || "") : (q.t || "");
    
    // 重置介面元素顯示狀態
    document.getElementById("feedback").style.display = "none";
    document.getElementById("next-btn").style.display = "none";

    // 【關鍵修復】根據模式決定顯示什麼
    if (isGrammar) {
        // 文法模式：顯示選項，隱藏輸入框與提交按鈕
        document.getElementById("user-input").style.display = "none";
        document.getElementById("submit-btn").style.display = "none";
        document.getElementById("options-container").style.display = "grid";
        renderGrammarOptions(q);
    } else {
        // 單字模式：顯示輸入框與提交按鈕，隱藏選項
        document.getElementById("user-input").style.display = "block";
        document.getElementById("submit-btn").style.display = "block";
        document.getElementById("options-container").style.display = "none";
        document.getElementById("user-input").value = "";
        
        // 恢復單字模式的自動聚焦
        setTimeout(() => { document.getElementById("user-input").focus(); }, 50);
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

async function setupMultipleChoice(q, useAi) {
    const container = document.getElementById("options-container");
    container.innerHTML = "<div>Loading options...</div>"; // 顯示載入中
    container.style.display = "grid";
    
    let distractors = [];
    
    if (useAi) {
        // 呼叫您寫在 api-client.js 中的函式
        distractors = await fetchAiDistractors(q.word);
    }

    // 若 AI 未開啟或取得數量不足，補齊亂數選項
    let options = [q.word.toLowerCase()];
    const allWords = currentQueue.map(item => item.word.toLowerCase());
    
    while(options.length < 4 && distractors.length > 0) {
        let d = distractors.pop();
        if(!options.includes(d)) options.push(d);
    }
    
    while(options.length < 4) {
        let rand = allWords[Math.floor(Math.random() * allWords.length)];
        if(!options.includes(rand)) options.push(rand);
    }
    
    options.sort(() => Math.random() - 0.5);
    container.innerHTML = ""; // 清除 Loading 字樣

    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.onclick = () => handleFeedback(opt === q.word.toLowerCase(), q.word);
        container.appendChild(btn);
    });
}

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
    if (currentIndex < currentQueue.length) {
        showQuestion();
    } else {
        showResult();
    }
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
            // 使用模板字串確保表格內容格式一致
            tbody.innerHTML += `<tr>
                <td style='padding: 10px;'>${item.word}</td>
                <td style='padding: 10px;'>${item.t || "N/A"}</td>
            </tr>`;
        });
        document.getElementById("review-btn").style.display = "block";
    }
}

// 重新練習錯誤題目
function startReview() {
    if (errorList.length === 0) return;
    
    currentQueue = [...errorList]; // 將錯誤題目變成新的測驗隊列
    errorList = []; // 清空錯誤列表
    currentIndex = 0;
    score = 0;

    document.getElementById("result-area").style.display = "none";
    document.getElementById("quiz-area").style.display = "block";
    showQuestion();
}

function exitQuiz() {
    if (confirm("Quit quiz?")) location.reload();
}

// 監聽整個網頁的按鍵事件
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const userInput = document.getElementById("user-input");
        const submitBtn = document.getElementById("submit-btn");
        const nextBtn = document.getElementById("next-btn");
        const optionsContainer = document.getElementById("options-container");

        // 1. 如果是填充題模式，且輸入框有值
        if (userInput.style.display !== "none" && userInput.value.trim() !== "") {
            if (submitBtn.style.display !== "none") {
                checkAnswer(); // 執行送出檢查
            }
        } 
        // 2. 如果已經顯示反饋，且有「下一題」按鈕
        else if (nextBtn.style.display !== "none") {
            nextQuestion(); // 執行下一題
        }
    }
});