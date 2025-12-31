/* ============================================================
   🚀 动态题库加载器 (Loader)
   作用：解析 URL 参数 ?subject=xxx，并加载对应的题库文件
   ============================================================ */
(function() {
    // 1. 获取 URL 参数
    const params = new URLSearchParams(window.location.search);
    const subject = params.get('subject') || 'default'; // 如果没有参数，默认加载 default.js

    // 2. 构建文件路径 (假设题库都在 banks 目录下)
    // 添加时间戳防止浏览器缓存修改后的题目
    const src = `banks/${subject}.js?t=${new Date().getTime()}`;

    console.log(`📡 正在加载题库: ${subject}...`);

    // 3. 动态创建 Script 标签
    const script = document.createElement('script');
    script.src = src;
    
    // 4. 加载成功后的回调
    script.onload = () => {
        console.log("✅ 题库加载成功！启动系统...");
        // 只有数据加载完了，才启动 QuizSystem
        if (window.quizSystem) {
            window.quizSystem.init();
            // 如果不是刷题模式，自动开始第一题
            if(!window.quizSystem.isReviewMode) window.quizSystem.nextQuestion();
        }
    };

    // 5. 加载失败的处理 (容错)
    script.onerror = () => {
        alert(`❌ 找不到题库文件: ${subject}.js\n请检查文件名或 URL 参数。`);
        // 这里可以做一个 fallback，加载默认题库
    };

    document.head.appendChild(script);
})();