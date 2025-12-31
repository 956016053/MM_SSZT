import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs";

window.quizSystem = {
    state: { score: 0, streak: 0 },
    currentQuestion: null,
    isFlipped: false,
    isReviewMode: false, // 标记当前是否在刷题模式

    init() {
        if(!window.QuestionBank) return alert("❌ 题库加载失败，请检查 questions.js");
        this.loadState();
        this.updateUI();
        this.initParticles();
        this.renderReviewList('all'); // 预加载列表
    },

    loadState() {
        const s = localStorage.getItem('ai_gacha_save');
        if(s) {
            const data = JSON.parse(s);
            this.state.score = data.score || 0;
            this.state.streak = data.streak || 0;
        }
    },

    saveState() {
        const oldSave = localStorage.getItem('ai_gacha_save');
        let data = oldSave ? JSON.parse(oldSave) : { score: 0, level: 1, mastered: [] };
        data.score = this.state.score;
        data.streak = this.state.streak;
        localStorage.setItem('ai_gacha_save', JSON.stringify(data));
        this.updateUI();
    },

    updateUI() {
        const scoreEl = document.getElementById('scoreVal');
        const streakEl = document.getElementById('streakVal');
        const barEl = document.getElementById('xpBar');
        if(scoreEl) scoreEl.innerText = this.state.score;
        if(streakEl) streakEl.innerText = this.state.streak;
        if(barEl) barEl.style.width = `${(this.state.score % 500 / 500)*100}%`;
    },

    // ==========================================
    // 📖 模式切换逻辑
    // ==========================================
    toggleReviewMode() {
        this.isReviewMode = !this.isReviewMode;
        const cardContainer = document.getElementById('cardModeContainer');
        const listContainer = document.getElementById('listModeContainer');
        const btn = document.getElementById('modeBtn');

        if(this.isReviewMode) {
            cardContainer.style.display = 'none';
            listContainer.style.display = 'block';
            btn.innerText = "🎲 切换至答题模式";
            this.renderReviewList('all'); // 刷新列表
        } else {
            cardContainer.style.display = 'flex';
            listContainer.style.display = 'none';
            btn.innerText = "📖 切换至刷题模式";
        }
    },

    // ==========================================
    // 🎲 抽卡答题逻辑 (读取 questions.js)
    // ==========================================
    nextQuestion() {
        if(this.isReviewMode) return; // 刷题模式下不抽题
        
        const wrapper = document.getElementById('quizCardWrapper');
        wrapper.classList.remove('flipped');
        this.isFlipped = false;

        setTimeout(() => {
            // 随机从题库取一题
            const pool = window.QuestionBank;
            this.currentQuestion = pool[Math.floor(Math.random() * pool.length)];
            
            // 根据 type 渲染
            if (this.currentQuestion.type === 'choice') this.renderMultipleChoice();
            else if (this.currentQuestion.type === 'fill') this.renderFillBlank();
            else this.renderShortAnswer();
        }, 300);
    },

    // 1. 渲染选择题
    renderMultipleChoice() {
        const q = this.currentQuestion;
        this.updateCardHeader('选择题', '🧩');
        document.getElementById('quizQuestionText').innerHTML = q.question;

        const area = document.getElementById('quizInputArea');
        area.innerHTML = '';
        
        q.options.forEach((optText, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = optText;
            btn.onclick = () => this.checkChoice(btn, index === q.answer);
            area.appendChild(btn);
        });
        this.prepareBackFace();
    },

    // 2. 渲染填空题
    renderFillBlank() {
        const q = this.currentQuestion;
        this.updateCardHeader('填空题', '✍️');
        
        // 把题干中的 "______" 替换成输入框占位符
        const displayQ = q.question.replace(/_+/g, '______');
        document.getElementById('quizQuestionText').innerHTML = displayQ;

        const area = document.getElementById('quizInputArea');
        area.innerHTML = `
            <input type="text" id="userAnswerInput" class="quiz-input" placeholder="输入答案..." autocomplete="off">
            <button class="btn-draw" style="width:100%" onclick="window.quizSystem.checkFill()">提交</button>
        `;
        // 回车提交
        setTimeout(() => {
            const input = document.getElementById('userAnswerInput');
            if(input) {
                input.focus();
                input.onkeydown = (e) => { if(e.key === 'Enter') this.checkFill(); };
            }
        }, 100);
        this.prepareBackFace();
    },

    // 3. 渲染简答题
    renderShortAnswer() {
        const q = this.currentQuestion;
        this.updateCardHeader('简答题', '🧠');
        document.getElementById('quizQuestionText').innerHTML = q.question;
        document.getElementById('quizInputArea').innerHTML = `
            <button class="btn-draw purple-btn" style="width:100%" onclick="window.quizSystem.revealAnswer()">👀 查看答案自测</button>
        `;
        this.prepareBackFace();
    },

    updateCardHeader(type, icon) {
        document.getElementById('quizType').innerText = type;
        document.getElementById('quizIcon').innerText = icon;
    },

    prepareBackFace() {
        const q = this.currentQuestion;
        let ansText = "";
        
        if(q.type === 'choice') ansText = q.options[q.answer];
        else if(q.type === 'fill') ansText = Array.isArray(q.answer) ? q.answer.join(" / ") : q.answer;
        else ansText = q.answer;

        document.getElementById('correctAnswer').innerText = ansText;
        document.getElementById('answerExplanation').innerHTML = 
            `${q.explanation}<br><br><span style="color:#aaa">💡 提示: ${q.hint}</span>`;
    },

    // --- 判题系统 ---
    checkChoice(btn, isCorrect) {
        if(this.isFlipped) return;
        if(isCorrect) {
            btn.classList.add('correct');
            this.handleWin();
        } else {
            btn.classList.add('wrong');
            // 标出正确答案
            const btns = document.querySelectorAll('.option-btn');
            btns[this.currentQuestion.answer].classList.add('correct');
            this.handleFail();
        }
    },

    checkFill() {
        if(this.isFlipped) return;
        const input = document.getElementById('userAnswerInput');
        const val = input.value.trim().toLowerCase();
        const answers = Array.isArray(this.currentQuestion.answer) 
                        ? this.currentQuestion.answer.map(a=>a.toLowerCase()) 
                        : [this.currentQuestion.answer.toLowerCase()];
        
        if(answers.some(ans => val === ans || (val.length > 1 && ans.includes(val)))) {
            this.handleWin();
        } else {
            this.handleFail();
        }
    },

    revealAnswer() {
        this.flipCard(true);
        document.getElementById('resultTitle').innerText = "自评";
        document.getElementById('resultTitle').style.color = "#fff";
        document.querySelector('#answerFace div:last-child').innerHTML = `
            <div style="display:flex; gap:10px;">
                <button class="option-btn wrong" style="flex:1;text-align:center" onclick="window.quizSystem.rateSelf(false)">❌ 忘了</button>
                <button class="option-btn correct" style="flex:1;text-align:center" onclick="window.quizSystem.rateSelf(true)">✅ 记得</button>
            </div>
        `;
    },

    rateSelf(success) {
        if(success) {
            this.state.score += 50;
            this.state.streak++;
            this.playConfetti();
        } else {
            this.state.streak = 0;
        }
        this.saveState();
        this.nextQuestion();
    },

    handleWin() {
        this.state.score += 100 + (this.state.streak * 10);
        this.state.streak++;
        document.getElementById('resultTitle').innerText = "🎉 回答正确！";
        document.getElementById('resultTitle').style.color = "#2ecc71";
        this.playConfetti();
        this.saveState();
        this.flipCard();
    },

    handleFail() {
        this.state.streak = 0;
        document.getElementById('resultTitle').innerText = "🥀 回答错误";
        document.getElementById('resultTitle').style.color = "#e74c3c";
        this.saveState();
        const wrapper = document.getElementById('quizCardWrapper');
        wrapper.classList.add('shake-card');
        setTimeout(() => wrapper.classList.remove('shake-card'), 500);
        this.flipCard();
    },

    flipCard(noResetBtn = false) {
        this.isFlipped = true;
        document.getElementById('quizCardWrapper').classList.add('flipped');
        if(!noResetBtn) {
            document.querySelector('#answerFace div:last-child').innerHTML = 
                `<button class="btn-draw" style="width:100%" onclick="window.quizSystem.nextQuestion()">下一题 (➡️)</button>`;
        }
    },

    // ==========================================
    // 📋 刷题列表逻辑 (List View)
    // ==========================================
    renderReviewList(filterType) {
        const container = document.getElementById('reviewListContent');
        container.innerHTML = '';
        
        // 更新过滤器按钮样式
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        // 简单匹配 active 状态 (实际开发可以给btn加id精准匹配，这里简化)
        
        let pool = window.QuestionBank;
        if(filterType !== 'all') {
            pool = pool.filter(q => q.type === filterType);
        }

        if(pool.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:#666;">暂无此类题目</div>';
            return;
        }

        pool.forEach((q, index) => {
            const item = document.createElement('div');
            item.className = `review-item type-${q.type}`;
            
            // 构建答案显示文本
            let ansDisplay = '';
            if(q.type === 'choice') ansDisplay = `选 ${String.fromCharCode(65 + q.answer)}: ${q.options[q.answer]}`;
            else if(q.type === 'fill') ansDisplay = Array.isArray(q.answer) ? q.answer.join(" / ") : q.answer;
            else ansDisplay = q.answer;

            item.innerHTML = `
                <div class="review-tag">${q.type.toUpperCase()}</div>
                <div class="review-q">${index+1}. ${q.question}</div>
                ${q.type === 'choice' ? `<div style="font-size:0.9rem;color:#aaa;margin-bottom:10px;">${q.options.map((o,i)=>`${String.fromCharCode(65+i)}. ${o}`).join('<br>')}</div>` : ''}
                
                <button class="toggle-ans-btn" onclick="this.nextElementSibling.classList.toggle('show')">👁️ 显示答案</button>
                <div class="review-ans-hidden">
                    <strong style="color:#2ecc71">${ansDisplay}</strong>
                    <p style="font-size:0.9rem;color:#ccc;margin-top:5px;">解析: ${q.explanation}</p>
                </div>
            `;
            container.appendChild(item);
        });
    },
    
    filterReview(type) {
        this.renderReviewList(type);
        // 高亮当前按钮（简易实现）
        const btns = document.querySelectorAll('.filter-btn');
        btns.forEach(b => {
            if(b.innerText.includes(type === 'all' ? '全部' : type === 'choice' ? '选择' : type === 'fill' ? '填空' : '简答')) {
                b.classList.add('active');
            }
        });
    },

    playConfetti() {
        if(window.confetti) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#2ecc71', '#f1c40f', '#00bfff'] });
    },
    
    initParticles() {
        if(window.tsParticles) tsParticles.load("tsparticles", { particles: { number: { value: 40 }, color: { value: "#ffffff" }, opacity: { value: 0.2 }, size: { value: 3 }, move: { enable: true, speed: 0.5 } } });
    }
};

// ==========================================
// 👋 手势 (精简版)
// ==========================================
window.quizGesture = {
    webcamRunning: false, handLandmarker: undefined, lastX: 0, cooldown: false,
    async toggleCamera() {
        if (location.protocol === 'file:') return alert("请在 HBuilderX 运行到浏览器");
        const btn = document.getElementById('camBtn');
        const container = document.getElementById('videoContainer');
        
        if (!this.handLandmarker) {
            btn.innerText = "⌛ 连接引擎...";
            try {
                const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
                this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task", delegate: "GPU" },
                    runningMode: "VIDEO", numHands: 1
                });
            } catch(e) { return alert("模型加载失败"); }
        }

        this.webcamRunning = !this.webcamRunning;
        if (this.webcamRunning) {
            btn.innerText = "📹 关闭手势";
            container.style.display = 'block';
            this.startCam();
        } else {
            btn.innerText = "📷 开启手势答题";
            container.style.display = 'none';
        }
    },
    startCam() {
        const video = document.getElementById('webcam');
        navigator.mediaDevices.getUserMedia({ video: true }).then(stream => { video.srcObject = stream; video.addEventListener('loadeddata', () => this.predict()); });
    },
    async predict() {
        if(!this.webcamRunning) return;
        const video = document.getElementById('webcam');
        const canvas = document.getElementById('output_canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        let now = performance.now();
        const result = this.handLandmarker.detectForVideo(video, now);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if(result.landmarks.length > 0) {
            const lx = result.landmarks[0][9].x; 
            ctx.fillStyle = "#ff0080"; ctx.beginPath(); ctx.arc(lx * canvas.width, result.landmarks[0][9].y * canvas.height, 8, 0, 2*Math.PI); ctx.fill();
            if(this.lastX !== 0 && !this.cooldown) {
                if (lx - this.lastX > 0.15) this.triggerAction("➡️ 下一题", () => window.quizSystem.nextQuestion());
                else if (Math.abs(lx - this.lastX) < 0.05 && Math.abs(result.landmarks[0][9].y - this.lastY) > 0.15) this.triggerAction("👋 翻牌/查看", () => window.quizSystem.revealAnswer());
            }
            this.lastX = lx; this.lastY = result.landmarks[0][9].y;
        }
        window.requestAnimationFrame(() => this.predict());
    },
    triggerAction(text, cb) {
        const fb = document.getElementById('gestureFeedback');
        fb.innerText = text; fb.style.color = "#00ff00";
        if(cb && !window.quizSystem.isReviewMode) cb(); // 刷题模式下禁用手势切题
        this.cooldown = true;
        setTimeout(() => { this.cooldown = false; fb.innerText = "等待手势..."; fb.style.color="white"; }, 1000);
    }
};

// window.onload = function() { 
//     window.quizSystem.init(); 
//     // 自动开始第一题
//     if(!window.quizSystem.isReviewMode) window.quizSystem.nextQuestion();
// };