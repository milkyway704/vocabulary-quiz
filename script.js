/**
 * Vocabulary Quiz Core Logic
 */

// 1. 初始化音效
const correctSound = new Audio("./assets/correct.wav");
const wrongSound = new Audio("./assets/wrong.wav");

// 2. 狀態變數
let currentQueue = [];    // 當前測驗題庫
let errorList = [];       // 錯題集
let currentIndex = 0;     // 當前題號索引
let score = 0;            // 分數
let currentMainMode = 'vocabulary'; // 預留：單字或文法模式

// 3. 鍵盤支援 (Enter 鍵)
document.getElementById("user-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const submitBtn = document.getElementById("submit-btn");
        const nextBtn = document.getElementById("next-btn");
        
        if (submitBtn.style.display !== "none") {
            checkAnswer();
        } else if (nextBtn.style.display !== "none") {
            nextQuestion();
        }
    }
});

/** --- 介面控制 --- **/

// 選擇主模式並解鎖音效限制
function selectMainMode(mode) {
    currentMainMode = mode;
    document.getElementById("selected-mode-label").innerText = (mode === 'vocabulary' ? "單字模式" : "文法模式");
    document.getElementById("mode-selection").style.display = "none";
    document.getElementById("setup-options").style.display = "block";
    
    // 關鍵：在使用者點擊後立即播放並暫停，解鎖瀏覽器對音效的限制
    [correctSound, wrongSound].forEach(s => {
        s.play().then(() => {
            s.pause();
            s.currentTime = 0;
        }).catch(e => console.log("Audio prep hindered:", e));
    });
}

function backToModeSelection() {
    document.getElementById("mode-selection").style.display = "block";
    document.getElementById("setup-options").style.display = "none";
}

function playSound(type) {
    const sound = (type === "correct") ? correctSound : wrongSound;
    sound.pause();
    sound.currentTime = 0;
    sound.play().catch(e => console.warn("Audio blocked by browser"));
}

/** --- 測驗流程 --- **/

// 開始新測驗
function startNewQuiz() {
    const start = parseInt(document.getElementById("start-lesson").value);
    const end = parseInt(document.getElementById("end-lesson").value);
    const amount = document.getElementById("quiz-amount").value;

    if (start > end) {
        alert("Invalid range! Start lesson must be before end lesson.");
        return;
    }

    // 組合題庫
    currentQueue = [];
    for (let i = start; i <= end; i++) {
        const key = "L" + i;
        if (typeof fullWordBank !== 'undefined' && fullWordBank[key]) {
            currentQueue = currentQueue.concat(fullWordBank[key]);
        }
    }

    if (currentQueue.length === 0) {
        alert("No questions found in this range!");
        return;
    }

    // 洗牌與截取數量
    currentQueue.sort(() => Math.random() - 0.5);
    if (amount !== "all") {
        currentQueue = currentQueue.slice(0, parseInt(amount));
    }

    // 重置計數器
    currentIndex = 0;
    score = 0;
    errorList = [];

    // 切換介面
    document.getElementById("setup-options").style.display = "none";
    document.getElementById("quiz-area").style.display = "block";
    document.getElementById("result-area").style.display = "none";
    
    showQuestion();
}

// 顯示題目
async function showQuestion() {
    if (currentIndex >= currentQueue.length) {
        showResult();
        return;
    }

    const q = currentQueue[currentIndex];
    const mode = document.getElementById("quiz-mode").value;

    // 更新狀態列
    document.getElementById("status-text").innerText = `Progress: ${currentIndex + 1} / ${currentQueue.length}`;
    document.getElementById("sentence-text").innerText = q.q;
    document.getElementById("translation-text").innerText = q.sentenceTranslation;
    document.getElementById("feedback").style.display = "none";
    document.getElementById("next-btn").style.display = "none";

    // 判斷填充或選擇
    if (mode === "multiple-choice") {
        setupMultipleChoice(q);
    } else {
        setupFillIn();
    }
}

// 設定填充模式
function setupFillIn() {
    const input = document.getElementById("user-input");
    input.style.display = "block";
    input.value = "";
    document.getElementById("submit-btn").style.display = "block";
    document.getElementById("options-container").style.display = "none";
    setTimeout(() => input.focus(), 100);
}

// 設定選擇題模式 (含 AI 生成邏輯)
async function setupMultipleChoice(q) {
    const container = document.getElementById("options-container");
    const useAI = document.getElementById("use-ai-toggle").checked;
    const targetWord = q.word.toLowerCase();

    document.getElementById("user-input").style.display = "none";
    document.getElementById("submit-btn").style.display = "none";
    container.style.display = "grid";
    container.innerHTML = "<div style='grid-column: 1/-1; text-align:center;'>🤖 AI 生成中...</div>";

    let distractors = [];

    // 邏輯：只有單一單字才使用 AI，片語(如 as...as)則跳過
    if (useAI && !targetWord.includes(" ")) {
        try {
            const response = await fetch(`/api/generate?word=${encodeURIComponent(targetWord)}&len=${targetWord.length}`);
            const data = await response.json();
            if (data.distractors) {
                distractors = data.distractors.split(",")
                    .map(w => w.trim().toLowerCase())
                    .filter(w => w !== "" && w !== targetWord);
            }
        } catch (e) {
            console.error("AI 獲取失敗，改用備用方案");
        }
    }

    // 防呆：如果 AI 選項不足 3 個，從本地題庫補足
    if (distractors.length < 3) {
        const allWords = Object.values(fullWordBank).flat().map(i => i.word.toLowerCase());
        const filtered = allWords.filter(w => w !== targetWord);
        while (distractors.length < 3) {
            const randomPick = filtered[Math.floor(Math.random() * filtered.length)];
            if (!distractors.includes(randomPick)) distractors.push(randomPick);
        }
    }

    // 最終洗牌選項 (正確答案 + 3 個干擾項)
    const finalOptions = [targetWord, ...distractors.slice(0, 3)].sort(() => Math.random() - 0.5);
    
    container.innerHTML = "";
    finalOptions.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.onclick = () => handleFeedback(opt.toLowerCase() === targetWord, targetWord);
        container.appendChild(btn);
    });
}

// 檢查填充題答案
function checkAnswer() {
    const userAns = document.getElementById("user-input").value.trim().toLowerCase();
    const correctAns = currentQueue[currentIndex].word.toLowerCase();
    handleFeedback(userAns === correctAns, currentQueue[currentIndex].word);
}

// 處理答題回饋 (正確/錯誤)
function handleFeedback(isCorrect, correctWord) {
    const feedback = document.getElementById("feedback");
    feedback.style.display = "block";
    document.getElementById("submit-btn").style.display = "none";
    document.getElementById("options-container").style.display = "none";
    document.getElementById("user-input").style.display = "none";
    document.getElementById("next-btn").style.display = "block";

    if (isCorrect) {
        feedback.className = "feedback correct";
        feedback.innerText = "Correct!";
        score++;
        playSound("correct");
    } else {
        feedback.className = "feedback wrong";
        feedback.innerText = `Incorrect. Answer: ${correctWord}`;
        if (!errorList.includes(currentQueue[currentIndex])) {
            errorList.push(currentQueue[currentIndex]);
        }
        playSound("wrong");
    }
}

function nextQuestion() {
    currentIndex++;
    showQuestion();
}

/** --- 結果統計與複習 --- **/

function showResult() {
    document.getElementById("quiz-area").style.display = "none";
    document.getElementById("result-area").style.display = "block";
    document.getElementById("score-text").innerText = `Final Score: ${score} / ${currentQueue.length}`;

    const tbody = document.getElementById("mistake-table-body");
    const container = document.getElementById("mistake-list-container");
    const reviewBtn = document.getElementById("review-btn");

    tbody.innerHTML = "";

    if (errorList.length > 0) {
        container.style.display = "block";
        reviewBtn.style.display = "inline-block";
        errorList.forEach(item => {
            const row = `<tr>
                <td>${item.word}</td>
                <td>${item.t || "N/A"}</td>
            </tr>`;
            tbody.innerHTML += row;
        });
    } else {
        container.style.display = "none";
        reviewBtn.style.display = "none";
        tbody.innerHTML = "<tr><td colspan='2'>Perfect! No mistakes.</td></tr>";
    }
}

// 錯題重練
function startReview() {
    if (errorList.length === 0) return;
    
    currentQueue = [...errorList];
    errorList = [];
    currentIndex = 0;
    score = 0;
    
    document.getElementById("quiz-area").style.display = "block";
    document.getElementById("result-area").style.display = "none";
    showQuestion();
}