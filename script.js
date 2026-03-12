const correctSound = new Audio("./assets/correct.wav");
const wrongSound = new Audio("./assets/wrong.wav");

let currentQueue = [];
let errorList = [];
let currentIndex = 0;
let score = 0;

// Keyboard Support
document.getElementById("user-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        if (document.getElementById("submit-btn").style.display !== "none") checkAnswer();
        else if (document.getElementById("next-btn").style.display !== "none") nextQuestion();
    }
});

function playSound(type) {
    const sound = (type === "correct") ? correctSound : wrongSound;
    sound.currentTime = 0;
    sound.play().catch(() => {});
}

function exitQuiz() {
    if (confirm("Are you sure you want to quit this quiz?")) {
        document.getElementById("quiz-area").style.display = "none";
        document.getElementById("result-area").style.display = "none";
        document.getElementById("setup-options").style.display = "block";
    }
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

    currentIndex = 0;
    score = 0;
    errorList = [];

    document.getElementById("setup-options").style.display = "none";
    document.getElementById("quiz-area").style.display = "block";
    document.getElementById("result-area").style.display = "none";
    showQuestion();
}

async function showQuestion() {
    if (currentIndex >= currentQueue.length) return showResult();

    const q = currentQueue[currentIndex];
    const mode = document.getElementById("quiz-mode").value;

    document.getElementById("status-text").innerText = `Progress: ${currentIndex + 1} / ${currentQueue.length}`;
    document.getElementById("sentence-text").innerText = q.q;
    document.getElementById("translation-text").innerText = q.sentenceTranslation;
    document.getElementById("feedback").style.display = "none";
    document.getElementById("next-btn").style.display = "none";

    if (mode === "multiple-choice") {
        setupMultipleChoice(q);
    } else {
        document.getElementById("user-input").style.display = "block";
        document.getElementById("submit-btn").style.display = "block";
        document.getElementById("options-container").style.display = "none";
        document.getElementById("user-input").value = "";
        document.getElementById("user-input").focus();
    }
}

async function setupMultipleChoice(q) {
    const container = document.getElementById("options-container");
    const useAI = document.getElementById("use-ai-toggle").checked;
    const word = q.word.toLowerCase();

    document.getElementById("user-input").style.display = "none";
    document.getElementById("submit-btn").style.display = "none";
    container.style.display = "grid";
    container.innerHTML = "<div>AI Generating...</div>";

    let distractors = [];
    if (useAI && !word.includes(" ")) {
        try {
            const res = await fetch(`/api/generate?word=${encodeURIComponent(word)}&len=${word.length}`);
            const data = await res.json();
            if (data.distractors) distractors = data.distractors.split(",").map(w => w.trim().toLowerCase()).filter(w => w !== word);
        } catch (e) { console.error("AI failed"); }
    }

    if (distractors.length < 3) {
        const allWords = Object.values(fullWordBank).flat().map(i => i.word.toLowerCase());
        const filtered = allWords.filter(w => w !== word);
        while (distractors.length < 3) {
            const pick = filtered[Math.floor(Math.random() * filtered.length)];
            if (!distractors.includes(pick)) distractors.push(pick);
        }
    }

    const options = [word, ...distractors.slice(0, 3)].sort(() => Math.random() - 0.5);
    container.innerHTML = "";
    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.onclick = () => handleFeedback(opt === word, word);
        container.appendChild(btn);
    });
}

function handleFeedback(isCorrect, correctWord) {
    const feedback = document.getElementById("feedback");
    feedback.style.display = "block";
    document.getElementById("next-btn").style.display = "block";
    document.getElementById("options-container").style.display = "none";
    document.getElementById("submit-btn").style.display = "none";
    document.getElementById("user-input").style.display = "none";

    if (isCorrect) {
        feedback.className = "feedback correct";
        feedback.innerText = "Correct!";
        score++;
        playSound("correct");
    } else {
        feedback.className = "feedback wrong";
        feedback.innerText = `Incorrect. The answer is: ${correctWord}`;
        if (!errorList.includes(currentQueue[currentIndex])) errorList.push(currentQueue[currentIndex]);
        playSound("wrong");
    }
}

function nextQuestion() {
    currentIndex++;
    showQuestion();
}

function showResult() {
    document.getElementById("quiz-area").style.display = "none";
    document.getElementById("result-area").style.display = "block";
    document.getElementById("score-text").innerText = `Final Score: ${score} / ${currentQueue.length}`;
    
    const tbody = document.getElementById("mistake-table-body");
    tbody.innerHTML = errorList.length > 0 ? "" : "<tr><td colspan='2'>Perfect! No mistakes.</td></tr>";
    errorList.forEach(item => {
        tbody.innerHTML += `<tr><td>${item.word}</td><td>${item.t || "N/A"}</td></tr>`;
    });
}