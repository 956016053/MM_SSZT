import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs";

/* ============================================================
   🎮 抽卡系统 (Gacha System)
   ============================================================ */
window.gachaSystem = {
    state: { score: 0, level: 1, mastered: [] },
    focusIndex: -1, 

    init() { 
        if(!window.DB) { alert("⚠️ 错误：无法读取 data.js！"); return; }
        document.getElementById('totalCount').innerText = window.DB.length;
        this.loadState(); 
        this.updateUI(); 
    },
    
    loadState() { const s = localStorage.getItem('ai_gacha_save'); if(s) this.state = JSON.parse(s); },
    saveState() { localStorage.setItem('ai_gacha_save', JSON.stringify(this.state)); this.updateUI(); },
    
    draw(count) {
        const container = document.getElementById('cardContainer');
        container.innerHTML = ''; 
        this.focusIndex = -1; 
        const pool = window.DB.filter(card => !this.state.mastered.includes(card.id));
        if (pool.length === 0) { container.innerHTML = '<div class="empty-tip">🎉 太强了！所有知识点已掌握！</div>'; return; }
        
        for(let i=0; i<count; i++) {
            const card = pool[Math.floor(Math.random() * pool.length)];
            this.createCard(card, container, i);
        }
        setTimeout(() => this.selectCard(0), 500);
    },

    getSmartIcon(term) {
        const t = term.toLowerCase();
        if (t.match(/neural|deep|net|神经网络|深度|脑|核心/)) return '🧠';
        if (t.match(/agent|robot|bot|智能体|机器人|自动/)) return '🤖';
        if (t.match(/learn|train|reinforce|学习|训练|强化/)) return '📚';
        if (t.match(/vision|cnn|image|视觉|图像|识别/)) return '👁️';
        if (t.match(/language|nlp|gpt|llm|语言|文本|生成/)) return '💬';
        if (t.match(/search|optimiz|path|搜索|优化|路径/)) return '🔍';
        if (t.match(/data|stat|analy|数据|统计|分析/)) return '📊';
        if (t.match(/math|logic|algo|数学|逻辑|算法/)) return '🧮';
        if (t.match(/chip|gpu|cpu|hard|硬件|算力|芯片/)) return '💻';
        if (t.match(/app|real|应用|系统|平台/)) return '📱';
        return '📄';
    },

    getRarityColor(r) {
        const R = r.toUpperCase();
        if(R==='UR') return '#ffd700';
        if(R==='SSR') return '#ff0080';
        if(R==='SR') return '#00bfff';
        return '#666';
    },

    createCard(data, container, index) {
        const el = document.createElement('div');
        const rarityClass = data.rarity.toUpperCase();
        
        const rarityColor = this.getRarityColor(data.rarity);
        const icon = this.getSmartIcon(data.term);

        el.className = `card-wrapper new-card rarity-${rarityClass}`;
        const delayStep = index > 4 ? 0.06 : 0.1;
        el.style.animationDelay = `${index * delayStep}s`;
        
        el.onclick = function(e) { 
            if(e.target.tagName === 'BUTTON') return;
            window.gachaSystem.selectCard(index); 
            this.classList.toggle('flipped'); 
    
            if (this.classList.contains('flipped')) {
                const rect = this.getBoundingClientRect();
                const x = (rect.left + rect.width / 2) / window.innerWidth;
                const y = (rect.top + rect.height / 2) / window.innerHeight;
    
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { x: x, y: y },
                    colors: [rarityColor, '#ffffff'], 
                    gravity: 1.2,
                    scalar: 0.8,
                    drift: 0,
                    ticks: 200
                });
            }
        };

        el.innerHTML = `
            <div class="card-inner">
                <div class="card-face card-front">
                    <div style="position:absolute;top:10px;left:10px;background:#333;padding:2px 5px;border-radius:4px;font-size:0.7rem;color:#aaa">${data.parent}</div>
                    <div class="rarity-badge" style="color:${rarityColor}">${rarityClass}</div>
                    <div class="card-icon">${icon}</div>
                    <h3 style="margin:0">${data.term}</h3>
                    <p style="color:#888;font-size:0.9rem;margin-top:10px;">"${data.hint}"</p>
                </div>
                <div class="card-face card-back">
                    <h3 style="color:${rarityColor}">${data.term}</h3>
                    <p style="font-size:0.9rem;">${data.def}</p>
                    <div style="background:rgba(255,255,255,0.1);padding:5px;border-radius:5px;font-size:0.9rem;">${data.analogy}</div>
                    <div style="margin-top:auto;display:flex;gap:10px;">
                        <button onclick="window.gachaSystem.handleCard(event, false)" style="flex:1;padding:8px;background:#444;border:none;color:#fff;border-radius:5px;">❌ 不会</button>
                        <button onclick="window.gachaSystem.handleCard(event, true, '${data.id}')" style="flex:1;padding:8px;background:#2ecc71;border:none;color:#fff;border-radius:5px;">✅ 会了</button>
                    </div>
                </div>
            </div>`;
        container.appendChild(el);
    },

    selectCard(index) {
        const cards = document.querySelectorAll('.card-wrapper');
        if (index < 0 || index >= cards.length) return;
        cards.forEach(c => c.classList.remove('selected'));
        cards[index].classList.add('selected');
        this.focusIndex = index;
        cards[index].scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
    },
    
    selectNext() {
        const cards = document.querySelectorAll('.card-wrapper');
        if (cards.length === 0) return;
        let nextIndex = this.focusIndex + 1;
        if (nextIndex >= cards.length) nextIndex = 0; 
        this.selectCard(nextIndex);
    },
    
    flipCurrent() {
        const cards = document.querySelectorAll('.card-wrapper');
        if (this.focusIndex >= 0 && this.focusIndex < cards.length) cards[this.focusIndex].classList.toggle('flipped');
    },
    
    flipAll() {
        const cards = document.querySelectorAll('.card-wrapper');
        let allFlipped = Array.from(cards).every(c => c.classList.contains('flipped'));
        cards.forEach(c => {
            if(allFlipped) c.classList.remove('flipped'); 
            else c.classList.add('flipped'); 
        });
    },

    handleCard(e, isKnown, id) {
        e.stopPropagation();
        const wrapper = e.target.closest('.card-wrapper');
        
        if (isKnown) {
            this.state.score += 100;
            if (!this.state.mastered.includes(id)) this.state.mastered.push(id);
            
            const rect = wrapper.getBoundingClientRect();
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;
            
            confetti({
                particleCount: 80, spread: 100, origin: { x: x, y: y },
                colors: ['#2ecc71', '#f1c40f', '#ffffff'], gravity: 1.5, ticks: 150
            });

            wrapper.classList.add('fly-away');
            setTimeout(() => { wrapper.remove(); this.saveState(); }, 600);
            this.showFloatScore(100, wrapper);
            
        } else {
            wrapper.classList.add('shake-card');
            setTimeout(() => { 
                wrapper.classList.remove('shake-card'); 
                wrapper.classList.remove('flipped'); 
            }, 500);
        }
    },

    showFloatScore(amount, el) {
        const rect = el.getBoundingClientRect();
        const float = document.createElement('div');
        float.className = 'float-score'; float.innerText = `+${amount} XP`;
        float.style.left = rect.left+'px'; float.style.top = rect.top+'px';
        document.body.appendChild(float);
        setTimeout(() => float.remove(), 1000);
    },

    updateUI() {
        document.getElementById('scoreVal').innerText = this.state.score;
        document.getElementById('masteredCount').innerText = this.state.mastered.length;
        document.getElementById('xpBar').style.width = `${(this.state.score % 500 / 500)*100}%`;
        document.getElementById('levelNum').innerText = Math.floor(this.state.score/500) + 1;
    },

    openAlbum() {
        const grid = document.getElementById('albumGrid'); grid.innerHTML = '';
        if(window.DB) {
            window.DB.forEach(c => {
                const done = this.state.mastered.includes(c.id);
                grid.innerHTML += `<div class="album-item" style="opacity:${done?1:0.5}"><div style="color:${done?'#fff':'#888'}">${c.term}</div><div>${done?'✅':'🔒'}</div></div>`;
            });
        }
        document.getElementById('albumModal').style.display = 'block';
    },

    resetProgress() { if(confirm("确定要重置所有进度吗？")) { localStorage.removeItem('ai_gacha_save'); location.reload(); } }
};

/* ============================================================
   👋 手势控制系统
   ============================================================ */
window.gestureSystem = {
    webcamRunning: false,
    handLandmarker: undefined,
    lastX: 0, lastY: 0, cooldown: false,
    
    async toggleCamera() {
        if (location.protocol === 'file:') return alert("⚠️ 请在 HBuilderX 点击【运行到浏览器】！");
        const btn = document.getElementById('camBtn');
        const container = document.getElementById('videoContainer');

        if (!this.handLandmarker) {
            btn.innerText = "⌛ 连接云端引擎...";
            try {
                const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
                this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: { 
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task", 
                        delegate: "GPU" 
                    },
                    runningMode: "VIDEO", numHands: 1
                });
                console.log("模型加载完毕");
            } catch(e) {
                alert("⚠️ 模型下载失败：\n" + e);
                btn.innerText = "⚠️ 网络错误";
                return;
            }
        }

        this.webcamRunning = !this.webcamRunning;
        if (this.webcamRunning) {
            btn.innerText = "📹 关闭手势";
            btn.style.borderColor = "#00d2ff"; btn.style.color = "#00d2ff";
            container.style.display = 'block';
            this.startCam();
        } else {
            btn.innerText = "📷 开启手势控制";
            btn.style.borderColor = "#555"; btn.style.color = "#ccc";
            container.style.display = 'none';
            this.stopCam();
        }
    },

    startCam() {
        const video = document.getElementById('webcam');
        navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
            video.srcObject = stream;
            video.addEventListener('loadeddata', () => this.predict());
        });
    },
    stopCam() {
        const video = document.getElementById('webcam');
        if(video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());
    },
    
    async predict() {
        const video = document.getElementById('webcam');
        const canvas = document.getElementById('output_canvas');
        const ctx = canvas.getContext('2d');
        if(!this.webcamRunning) return;
        
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        let now = performance.now();
        
        if(this.handLandmarker) {
            const result = this.handLandmarker.detectForVideo(video, now);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if(result.landmarks.length > 0) {
                const landmarks = result.landmarks[0];
                const x = landmarks[9].x * canvas.width;
                const y = landmarks[9].y * canvas.height;
                ctx.fillStyle = "#00ff00"; ctx.beginPath(); ctx.arc(x, y, 8, 0, 2*Math.PI); ctx.fill();

                const currX = landmarks[9].x;
                const currY = landmarks[9].y;

                if(this.lastX !== 0 && !this.cooldown) {
                    const deltaX = currX - this.lastX;
                    const deltaY = currY - this.lastY;
                    const absX = Math.abs(deltaX);
                    const absY = Math.abs(deltaY);
                    const THRESHOLD = 0.08; 
                    if (absX > THRESHOLD || absY > THRESHOLD) {
                        if (absY > absX) {
                            if (deltaY < -THRESHOLD) this.triggerAction("👆 向上: 全翻", () => window.gachaSystem.flipAll());
                            else this.triggerAction("👇 向下: 抽卡", () => window.gachaSystem.draw(5));
                        } else {
                            if (deltaX > THRESHOLD) this.triggerAction("👉 向右: 下一张", () => window.gachaSystem.selectNext());
                            else this.triggerAction("👈 向左: 翻转", () => window.gachaSystem.flipCurrent());
                        }
                    }
                }
                this.lastX = currX; this.lastY = currY;
            }
        }
        window.requestAnimationFrame(() => this.predict());
    },

    triggerAction(text, callback) {
        const feedback = document.getElementById('gestureFeedback');
        const container = document.getElementById('videoContainer');
        feedback.innerText = text; feedback.style.color = "#00ff00"; container.style.borderColor = "#00ff00";
        if(callback) callback();
        this.cooldown = true;
        setTimeout(() => { 
            this.cooldown = false; container.style.borderColor = "#00d2ff"; feedback.style.color = "white"; feedback.innerText = "等待手势...";
        }, 400); 
    }
};

/* ============================================================
   ✨ 酷炫特效系统 & 🎞️ 悬浮窗拖拽
   ============================================================ */
// 粒子背景
tsParticles.load("tsparticles", {
  particles: {
    number: { value: 60, density: { enable: true, value_area: 800 } },
    color: { value: "#ffffff" }, shape: { type: "circle" }, opacity: { value: 0.3, random: true }, size: { value: 3, random: true },
    line_linked: { enable: true, distance: 150, color: "#4facfe", opacity: 0.2, width: 1 },
    move: { enable: true, speed: 1, direction: "none", random: false, straight: false, out_mode: "out", bounce: false }
  },
  interactivity: {
    detect_on: "canvas", events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: true, mode: "push" }, resize: true },
    modes: { grab: { distance: 200, line_linked: { opacity: 0.5 } }, push: { particles_nb: 4 } }
  },
  retina_detect: true
});

// 拖拽逻辑
const dragItem = document.getElementById("videoContainer");
let active = false; let currentX, currentY, initialX, initialY; let xOffset = 0, yOffset = 0;
dragItem.addEventListener("touchstart", dragStart, false);
dragItem.addEventListener("touchend", dragEnd, false);
dragItem.addEventListener("touchmove", drag, false);
dragItem.addEventListener("mousedown", dragStart, false);
document.addEventListener("mouseup", dragEnd, false);
document.addEventListener("mousemove", drag, false);
function dragStart(e) {
    if (e.type === "touchstart") { initialX = e.touches[0].clientX - xOffset; initialY = e.touches[0].clientY - yOffset; } 
    else { initialX = e.clientX - xOffset; initialY = e.clientY - yOffset; }
    if (e.target === dragItem || e.target.parentNode === dragItem) active = true;
}
function dragEnd(e) { initialX = currentX; initialY = currentY; active = false; }
function drag(e) {
    if (active) {
        e.preventDefault();
        if (e.type === "touchmove") { currentX = e.touches[0].clientX - initialX; currentY = e.touches[0].clientY - initialY; }
        else { currentX = e.clientX - initialX; currentY = e.clientY - initialY; }
        xOffset = currentX; yOffset = currentY;
        dragItem.style.transform = "translate3d(" + currentX + "px, " + currentY + "px, 0)";
    }
}

window.onload = function() { window.gachaSystem.init(); };

