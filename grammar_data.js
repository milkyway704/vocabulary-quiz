// grammar_data.js

// 1. 自定義 AI 出題的文法重點 (提示詞來源)
const grammarHints = {
    "L1": "形容詞比較級（如：-er, more..., than...）、形容詞原級比較（as...as）",
    "L2": "形容詞最高級（如：the -est, the most...）、不定代名詞 one / ones 的用法",
    "L3": "過去進行式（was/were + V-ing）、when/while 引導的時間副詞子句",
    "L4": "受與動詞（give/send/buy... sth to/for sb）、反身代名詞（myself, himself...）"
};

// 2. 原有的靜態題目庫 (當 AI 關閉時使用)
const grammarBank = {
    "L1": [
            // --- 第 5 頁：一、語法選擇 (1-8 題) ---
            { q: "The beef noodles are _____ more delicious than the rice.", options: ["very", "too", "much", "many"], answer: "much", explanation: "比較級前可用 much, a lot, even, far 等副詞加強語氣，不可用 very。" },
            { q: "Tina is _____ than her younger sister.", options: ["heavy", "heavier", "heaviest", "more heavy"], answer: "heavier", explanation: "兩者比較用比較級。heavy 為「子音+y」，需去 y 加 ier。" },
            { q: "This movie is _____ than that one.", options: ["interesting", "interested", "more interesting", "most interesting"], answer: "more interesting", explanation: "多音節形容詞的比較級需在前面加上 more。" },
            { q: "Your bag is _____ than mine.", options: ["big", "bigger", "biggest", "more big"], answer: "bigger", explanation: "單音節短母音形容詞 big，需重複字尾 g 再加 er。" },
            { q: "The weather today is _____ than it was yesterday.", options: ["bad", "badder", "worse", "worst"], answer: "worse", explanation: "bad 的比較級為不規則變化 worse。" },
            { q: "Of the two boys, Kevin is _____.", options: ["taller", "the taller", "tallest", "the tallest"], answer: "the taller", explanation: "當範圍明確指出是「兩者之中 (of the two)」時，比較級前須加 the。" },
            { q: "The jacket is lighter than _____ jacket in the store.", options: ["any", "any other", "all", "other"], answer: "any other", explanation: "「比較級 + than any other + 單數名詞」表示「比其他任何一個都...」。" },
            { q: "These books are old. I need to buy some new _____.", options: ["one", "ones", "it", "them"], answer: "ones", explanation: "使用不定代名詞 ones 來代替前面提過的複數名詞 (books)。" },

            // --- 第 6 頁：二、填充題 (9-18 題，轉換為選擇格式) ---
            { q: "My coffee is cold. I want a hot _____.", options: ["one", "ones", "it", "them"], answer: "one", explanation: "代名詞 one 用於替代前面提到過的單數可數名詞 (coffee)。" },
            { q: "The computer is _____ expensive than the watch.", options: ["more", "most", "much", "very"], answer: "more", explanation: "多音節形容詞 expensive 的比較級需加 more。" },
            { q: "This cake is _____ than that one.", options: ["good", "well", "better", "best"], answer: "better", explanation: "good 的比較級為不規則變化 better。" },
            { q: "It is _____ hotter today than yesterday.", options: ["very", "too", "even", "more"], answer: "even", explanation: "比較級前可用 even 加強語氣。" },
            { q: "Which is _____, the black umbrella or the blue one?", options: ["cheaper", "the cheaper", "cheapest", "the cheapest"], answer: "the cheaper", explanation: "在 Which is... A or B? 句型中，若指兩者中較...的那一個，通常用 the + 比較級。" },
            { q: "The cookies are _____ than the candies.", options: ["yummyer", "yummier", "more yummy", "yummy"], answer: "yummier", explanation: "yummy 字尾為「子音+y」，需去 y 加 ier。" },
            { q: "My room is _____ than yours.", options: ["dirtyer", "dirtier", "more dirty", "dirtyest"], answer: "dirtier", explanation: "dirty 字尾為「子音+y」，需去 y 加 ier。" },
            { q: "Health is _____ important than money.", options: ["more", "most", "much", "very"], answer: "more", explanation: "多音節形容詞 important 需加 more 形成比較級。" },
            { q: "This box is _____ than that one.", options: ["heavyer", "heavier", "more heavy", "heavy"], answer: "heavier", explanation: "heavy 去 y 加 ier。" },
            { q: "The yellow dress is _____ than the red one.", options: ["prettyer", "prettier", "more pretty", "prettiest"], answer: "prettier", explanation: "pretty 去 y 加 ier。" },

            // --- 第 7 頁：實戰模擬與歷屆試題 (19-28 題) ---
            { q: "Who is _____, Mary or Lucy?", options: ["thin", "thinner", "the thinner", "thinnest"], answer: "thinner", explanation: "兩者之間比較，詢問「哪一個比較...」，使用比較級。" },
            { q: "My older brother is _____ than I am.", options: ["thin", "thinner", "thinnest", "the thinner"], answer: "thinner", explanation: "thin 為短母音+單子音，重複字尾 n 加 er。" },
            { q: "The blue car is _____ than the red one.", options: ["expensive", "expensiver", "more expensive", "the most expensive"], answer: "more expensive", explanation: "多音節形容詞比較級加 more。" },
            { q: "This problem is _____ than that one.", options: ["easy", "easier", "easiest", "more easy"], answer: "easier", explanation: "easy 去 y 加 ier。" },
            { q: "Math is _____ for me than English.", options: ["difficult", "difficulter", "more difficult", "most difficult"], answer: "more difficult", explanation: "多音節形容詞比較級加 more。" },
            { q: "Is the elephant _____ than the tiger?", options: ["strong", "stronger", "strongest", "the stronger"], answer: "stronger", explanation: "兩者比較使用比較級。" },
            { q: "The train is _____ than the bus.", options: ["fast", "faster", "fastest", "the faster"], answer: "faster", explanation: "單音節形容詞直接加 er。" },
            { q: "My bag is _____ than your bag.", options: ["large", "larger", "largest", "the larger"], answer: "larger", explanation: "字尾為 e 直接加 r。" },
            { q: "This book is _____ than that one.", options: ["useful", "usefuler", "more useful", "most useful"], answer: "more useful", explanation: "部分雙音節形容詞（如 -ful 結尾）需加 more。" },
            { q: "He is _____ than any other student in his class.", options: ["smart", "smarter", "smartest", "the smarter"], answer: "smarter", explanation: "「比較級 + than any other + 單數名詞」句型。" },

            // --- 第 8 頁：綜合測驗與克漏字 (29-38 題) ---
            { q: "Teacher: Mary, _____ do you think?", options: ["who", "what", "which", "how"], answer: "what", explanation: "What do you think? 為詢問意見的固定用法。" },
            { q: "Mary: Well, John is _____ than me.", options: ["kind", "kinder", "kindest", "the kinder"], answer: "kinder", explanation: "than 前面接形容詞比較級。" },
            { q: "Mary: He is also _____ popular than me.", options: ["more", "most", "much", "very"], answer: "more", explanation: "popular 是多音節，比較級加 more。" },
            { q: "John: Your grades are better than _____.", options: ["my", "me", "mine", "I"], answer: "mine", explanation: "mine 為所有格代名詞，代替 my grades。" },
            { q: "Teacher: Please come back ten minutes _____.", options: ["later", "lately", "latest", "late"], answer: "later", explanation: "ten minutes later 表示「十分鐘之後」。" },
            { q: "This smartphone is _____ than my old one.", options: ["thin", "thinner", "thinnest", "more thin"], answer: "thinner", explanation: "thin 重複字尾 n 加 er。" },
            { q: "The history test was _____ than the science test.", options: ["easy", "easier", "easiest", "more easy"], answer: "easier", explanation: "easy 去 y 加 ier。" },
            { q: "She is _____ more beautiful in person.", options: ["very", "even", "too", "so"], answer: "even", explanation: "even 可加強比較級語氣。" },
            { q: "Which mountain is _____, Ali Mountain or Jade Mountain?", options: ["high", "higher", "highest", "the highest"], answer: "higher", explanation: "兩者比較使用比較級。" },
            { q: "This pair of shoes is _____ than that pair.", options: ["cheap", "cheaper", "cheapest", "more cheap"], answer: "cheaper", explanation: "單音節形容詞直接加 er。" }
        ]
    };
    "L2": [
        {
            q: "Winter is the _____ season of the year.",
            options: ["cold", "colder", "coldest", "more cold"],
            answer: "coldest",
            explanation: "最高級前需加 the，且需使用 -est。"
        }
    ]
};