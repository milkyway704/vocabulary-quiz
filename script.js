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
    const amount = document.getElementById("quiz-amount").value;

    currentQueue = [];
    for (let i = start; i <= end; i++) {
        const key = "L" + i;
        if (typeof fullWordBank !== 'undefined' && fullWordBank[key]) {
            currentQueue = currentQueue.concat(fullWordBank[key]);
        }
    }
    currentQueue.sort(() => Math.random() - 0.5);
    if (amount !== "all") currentQueue = currentQueue.slice(0, parseInt(amount));

    currentIndex = 0; score = 0; errorList = [];
    document.getElementById("setup-options").style.display = "none";
    document.getElementById("quiz-area").style.display = "block";
    showQuestion();
}

function showQuestion() {
    const q = currentQueue[currentIndex];
    const mode = document.getElementById("quiz-mode").value;
    document.getElementById("status-text").innerText = `Progress: ${currentIndex + 1} / ${currentQueue.length}`;
    document.getElementById("sentence-text").innerText = q.q;
    document.getElementById("translation-text").innerText = q.sentenceTranslation;
    
    document.getElementById("feedback").style.display = "none";
    document.getElementById("next-btn").style.display = "none";
    document.getElementById("submit-btn").style.display = "none";
    document.getElementById("user-input").style.display = "none";
    document.getElementById("options-container").style.display = "none";

    if (mode === "multiple-choice") {
        setupMultipleChoice(q);
    } else {
        document.getElementById("submit-btn").style.display = "block";
        document.getElementById("user-input").style.display = "block";
        document.getElementById("user-input").value = "";
    }
}

function setupMultipleChoice(q) {
    const container = document.getElementById("options-container");
    container.innerHTML = "";
    container.style.display = "grid";
    
    let options = [q.word.toLowerCase()];
    // 簡單模擬選項：實際應用建議由 data.js 產生或 AI 獲取
    while(options.length < 4) {
        let rand = currentQueue[Math.floor(Math.random()*currentQueue.length)].word.toLowerCase();
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

function showResult() {
    document.getElementById("quiz-area").style.display = "none";
    document.getElementById("result-area").style.display = "block";
    document.getElementById("score-text").innerText = `Final Score: ${score} / ${currentQueue.length}`;
    
    const tbody = document.getElementById("mistake-table-body");
    tbody.innerHTML = ""; // 清空舊內容

    if (errorList.length === 0) {
        tbody.innerHTML = "<tr><td colspan='2'>Perfect! No mistakes.</td></tr>";
        document.getElementById("review-btn").style.display = "none"; // 沒有錯誤時隱藏按鈕
    } else {
        errorList.forEach(item => {
            // 顯示單字與其中文翻譯
            tbody.innerHTML += `<tr><td>${item.word}</td><td>${item.t || "N/A"}</td></tr>`;
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