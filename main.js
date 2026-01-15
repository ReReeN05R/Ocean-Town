/* ==========================================
   Ocean Town - 超リッチ動き重視版 JavaScript
   20-30fps基準、動きを最大限に
   ========================================== */

(function() {
    'use strict';

    /* ==========================================
       グローバル変数
       ========================================== */
    let mouseX = 0;
    let mouseY = 0;
    let scrollProgress = 0;
    let isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let isMobile = window.innerWidth < 768;
    
    // パフォーマンス設定（動き重視）
    const PERFORMANCE_CONFIG = {
        maxRipples: 30,                          // 波紋を大幅増加
        particleCount: isMobile ? 120 : 180,     // パーティクル大幅増加
        targetFPS: isMobile ? 20 : 30,           // 20-30fps
        canvasUpdateThrottle: isMobile ? 50 : 33, // 20fps/30fps
        rippleProbability: 0.92,                 // 超高確率
        buttonRippleEnabled: true,               // ボタン波紋有効
    };

    /* ==========================================
       初期化
       ========================================== */
    document.addEventListener('DOMContentLoaded', function() {
        initWaterCanvas();
        initLogoParticles();
        initHamburgerMenu();
        initThemeToggle();
        initScrollProgress();
        initCatchCopy();
        initJobCards();
        initRuleButtons();
        initStepNavigation();
        initButtonRipples();
        initAllButtonRipples(); // すべてのボタンに波紋追加
        initGSAPAnimations();
        initLiveStatus();
        initParticleTrail(); // マウス追従パーティクル
        
        window.addEventListener('resize', debounce(() => {
            isMobile = window.innerWidth < 768;
        }, 250));
    });

    /* ==========================================
       デバウンス関数
       ========================================== */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /* ==========================================
       Canvas水面エフェクト - 超リッチ版
       ========================================== */
    function initWaterCanvas() {
        const canvas = document.getElementById('waterCanvas');
        if (!canvas || isReducedMotion) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        const ripples = [];
        let isVisible = true;
        let lastTime = 0;

        window.addEventListener('resize', debounce(() => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }, 250));

        document.addEventListener('visibilitychange', () => {
            isVisible = !document.hidden;
        });

        // マウス移動で波紋生成（高頻度）
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            // 超高確率で波紋生成
            if (Math.random() > PERFORMANCE_CONFIG.rippleProbability && ripples.length < PERFORMANCE_CONFIG.maxRipples) {
                ripples.push({
                    x: mouseX,
                    y: mouseY,
                    radius: 0,
                    maxRadius: 120 + Math.random() * 80,
                    speed: 2.5 + Math.random() * 1.5,
                    opacity: 0.6,
                    color: Math.random() > 0.5 ? 'rgba(127, 215, 255,' : 'rgba(0, 170, 255,'
                });
            }
        });

        // クリックで超大きな波紋
        document.addEventListener('click', (e) => {
            for (let i = 0; i < 3; i++) {
                ripples.push({
                    x: e.clientX,
                    y: e.clientY,
                    radius: i * 20,
                    maxRadius: 250 + i * 50,
                    speed: 4 + i * 0.5,
                    opacity: 0.8 - i * 0.2,
                    color: 'rgba(127, 215, 255,'
                });
            }
        });

        // アニメーションループ
        function animate(currentTime) {
            if (!isVisible) {
                requestAnimationFrame(animate);
                return;
            }

            const deltaTime = currentTime - lastTime;
            if (deltaTime < PERFORMANCE_CONFIG.canvasUpdateThrottle) {
                requestAnimationFrame(animate);
                return;
            }
            lastTime = currentTime;

            ctx.clearRect(0, 0, width, height);

            // 背景グラデーション（強化）
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, 'rgba(127, 215, 255, 0.05)');
            gradient.addColorStop(0.5, 'rgba(0, 170, 255, 0.03)');
            gradient.addColorStop(1, 'rgba(79, 195, 247, 0.05)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // 波紋の描画
            for (let i = ripples.length - 1; i >= 0; i--) {
                const ripple = ripples[i];

                // 外側の波紋（太く）
                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `${ripple.color}${ripple.opacity})`;
                ctx.lineWidth = 3;
                ctx.stroke();

                // 内側の波紋
                if (ripple.radius > 15) {
                    ctx.beginPath();
                    ctx.arc(ripple.x, ripple.y, ripple.radius * 0.7, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(0, 170, 255, ${ripple.opacity * 0.6})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // 中間の波紋（追加）
                if (ripple.radius > 30) {
                    ctx.beginPath();
                    ctx.arc(ripple.x, ripple.y, ripple.radius * 0.85, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(79, 195, 247, ${ripple.opacity * 0.4})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                ripple.radius += ripple.speed;
                ripple.opacity -= 0.004; // ゆっくり消える

                if (ripple.opacity <= 0 || ripple.radius >= ripple.maxRadius) {
                    ripples.splice(i, 1);
                }
            }

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }

    /* ==========================================
       ロゴパーティクルアニメーション - 超リッチ版
       ========================================== */
    function initLogoParticles() {
        const canvas = document.getElementById('logoCanvas');
        if (!canvas || isReducedMotion) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        canvas.width = 600;
        canvas.height = 200;

        const particles = [];
        const particleCount = PERFORMANCE_CONFIG.particleCount;
        let isVisible = true;
        let lastTime = 0;

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                isVisible = entry.isIntersecting;
            });
        }, { threshold: 0 });
        observer.observe(canvas);

        class Particle {
            constructor() {
                this.reset();
                this.targetX = Math.random() * canvas.width;
                this.targetY = Math.random() * canvas.height;
                this.x = this.targetX;
                this.y = this.targetY;
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.targetX = Math.random() * canvas.width;
                this.targetY = Math.random() * canvas.height;
                this.size = Math.random() * 3.5 + 1.5; // サイズ大きく
                this.speedX = (Math.random() - 0.5) * 2.5;
                this.speedY = (Math.random() - 0.5) * 2.5;
                this.opacity = Math.random() * 0.6 + 0.4;
            }

            update() {
                const dx = this.targetX - this.x;
                const dy = this.targetY - this.y;
                this.x += dx * 0.05 + this.speedX;
                this.y += dy * 0.05 + this.speedY;

                this.speedX += (Math.random() - 0.5) * 0.15;
                this.speedY += (Math.random() - 0.5) * 0.15;
                this.speedX *= 0.95;
                this.speedY *= 0.95;

                if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                    this.reset();
                }
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(127, 215, 255, ${this.opacity})`;
                ctx.fill();

                // 強化された発光効果
                ctx.shadowBlur = 15;
                ctx.shadowColor = 'rgba(127, 215, 255, 0.8)';
            }
        }

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function animate(currentTime) {
            if (!isVisible) {
                requestAnimationFrame(animate);
                return;
            }

            const deltaTime = currentTime - lastTime;
            if (deltaTime < PERFORMANCE_CONFIG.canvasUpdateThrottle) {
                requestAnimationFrame(animate);
                return;
            }
            lastTime = currentTime;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            // パーティクル間の線（増量）
            const maxConnections = 8;
            particles.forEach((p1, i) => {
                let connections = 0;
                for (let j = i + 1; j < particles.length && connections < maxConnections; j++) {
                    const p2 = particles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 120) { // 距離を伸ばす
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(127, 215, 255, ${0.25 * (1 - distance / 120)})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                        connections++;
                    }
                }
            });

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }

    /* ==========================================
       マウス追従パーティクル（新規追加）
       ========================================== */
    function initParticleTrail() {
        if (isReducedMotion || isMobile) return;

        const trailParticles = [];

        document.addEventListener('mousemove', (e) => {
            if (Math.random() > 0.7) { // 30%の確率で生成
                trailParticles.push({
                    x: e.clientX,
                    y: e.clientY,
                    size: Math.random() * 4 + 2,
                    opacity: 1,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    life: 1
                });
            }
        });

        function animateTrail() {
            const canvas = document.getElementById('waterCanvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');

            for (let i = trailParticles.length - 1; i >= 0; i--) {
                const p = trailParticles[i];

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(127, 215, 255, ${p.opacity * 0.5})`;
                ctx.fill();

                p.x += p.vx;
                p.y += p.vy;
                p.opacity -= 0.02;
                p.life -= 0.02;

                if (p.life <= 0) {
                    trailParticles.splice(i, 1);
                }
            }

            requestAnimationFrame(animateTrail);
        }

        animateTrail();
    }

    /* ==========================================
       すべてのボタンに波紋エフェクト（新規追加）
       ========================================== */
    function initAllButtonRipples() {
        // すべてのクリッカブル要素を取得（theme-toggleを除外）
        const clickableElements = document.querySelectorAll('button:not(#themeToggle), .hamburger, .job-card, .rule-button, .feature-card, .status-card, .support-card, .step-nav-btn');

        clickableElements.forEach(element => {
            element.addEventListener('click', function(e) {
                createRippleEffect(e, this);
            });
        });

        function createRippleEffect(e, element) {
            const ripple = document.createElement('span');
            ripple.classList.add('click-ripple');

            const rect = element.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            // position: fixedの要素は除外（安全のため）
            const computedStyle = window.getComputedStyle(element);
            if (computedStyle.position !== 'fixed') {
                element.style.position = 'relative';
            }
            element.style.overflow = 'hidden';
            element.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        }
    }

    /* ==========================================
       キャッチコピーアニメーション
       ========================================== */
    function initCatchCopy() {
        const words = document.querySelectorAll('.catch-word');
        
        words.forEach((word, index) => {
            setTimeout(() => {
                word.style.opacity = '1';
                word.style.transform = 'translateY(0)';
                word.style.animationDelay = `${index * 0.2}s`;
            }, index * 200);
        });
    }

    /* ==========================================
       ハンバーガーメニュー - 強化版
       ========================================== */
    function initHamburgerMenu() {
        const hamburger = document.getElementById('hamburger');
        const nav = document.getElementById('fullscreenNav');
        const navLinks = document.querySelectorAll('.nav-link');

        if (!hamburger || !nav) return;

        hamburger.addEventListener('click', function(e) {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
            document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';

            // クリック位置から波紋を広げる
            createFullScreenRipple(e.clientX, e.clientY);
        });

        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && nav.classList.contains('active')) {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // 全画面波紋エフェクト
        function createFullScreenRipple(x, y) {
            const ripple = document.createElement('div');
            ripple.className = 'fullscreen-ripple';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            document.body.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 1000);
        }
    }

    /* ==========================================
       ダークモード切り替え - 超強化版
       ========================================== */
    function initThemeToggle() {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;

        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }

        toggle.addEventListener('click', function(e) {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');

            // ボタンの中心座標を取得
            const rect = toggle.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // 超派手な波紋エフェクト
            createMassiveRipple(centerX, centerY, isDark);
            
            // パーティクル爆発
            createParticleExplosion(centerX, centerY);
        });

        // 超巨大波紋エフェクト（修正版：ボタン位置を取得）
        function createMassiveRipple(x, y, isDark) {
            // ボタンの実際の位置を取得
            const button = document.getElementById('themeToggle');
            if (button) {
                const rect = button.getBoundingClientRect();
                x = rect.left + rect.width / 2;
                y = rect.top + rect.height / 2;
            }
            
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const ripple = document.createElement('div');
                    ripple.className = 'massive-ripple';
                    ripple.style.left = `${x}px`;
                    ripple.style.top = `${y}px`;
                    ripple.style.animationDelay = `${i * 0.1}s`;
                    ripple.style.borderColor = isDark ? 'rgba(127, 215, 255, 0.5)' : 'rgba(255, 193, 7, 0.5)';
                    document.body.appendChild(ripple);

                    setTimeout(() => {
                        ripple.remove();
                    }, 2000);
                }, i * 100);
            }
        }

        // パーティクル爆発エフェクト（修正版：ボタン位置を取得）
        function createParticleExplosion(x, y) {
            // ボタンの実際の位置を取得
            const button = document.getElementById('themeToggle');
            if (button) {
                const rect = button.getBoundingClientRect();
                x = rect.left + rect.width / 2;
                y = rect.top + rect.height / 2;
            }
            
            const particleCount = 20;
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'explosion-particle';
                particle.style.left = `${x}px`;
                particle.style.top = `${y}px`;
                
                const angle = (Math.PI * 2 * i) / particleCount;
                const velocity = 100 + Math.random() * 100;
                const tx = Math.cos(angle) * velocity;
                const ty = Math.sin(angle) * velocity;
                
                particle.style.setProperty('--tx', `${tx}px`);
                particle.style.setProperty('--ty', `${ty}px`);
                
                document.body.appendChild(particle);

                setTimeout(() => {
                    particle.remove();
                }, 1000);
            }
        }
    }

    /* ==========================================
       スクロールプログレス（サーフボード）
       ========================================== */
    function initScrollProgress() {
        const surfboard = document.querySelector('.surfboard');
        if (!surfboard) return;

        window.addEventListener('scroll', () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            scrollProgress = scrollTop / (documentHeight - windowHeight);
            const maxTop = windowHeight - 100;
            
            surfboard.style.top = `${scrollProgress * maxTop}px`;
        });
    }

    /* ==========================================
       Job カードのホバーエフェクト - 強化版
       ========================================== */
    function initJobCards() {
        const jobCards = document.querySelectorAll('.job-card');

        jobCards.forEach(card => {
            card.addEventListener('mouseenter', function(e) {
                jobCards.forEach(otherCard => {
                    if (otherCard !== card) {
                        otherCard.style.opacity = '0.5';
                        otherCard.style.transform = 'scale(0.95)';
                    }
                });

                // ホバー時にパーティクル発生
                createHoverParticles(e);
            });

            card.addEventListener('mouseleave', function() {
                jobCards.forEach(otherCard => {
                    otherCard.style.opacity = '1';
                    otherCard.style.transform = 'scale(1)';
                });
            });

            card.addEventListener('mousemove', createHoverParticles);
        });

        function createHoverParticles(e) {
            if (Math.random() > 0.8) {
                const particle = document.createElement('div');
                particle.className = 'hover-particle';
                particle.style.left = `${e.clientX}px`;
                particle.style.top = `${e.clientY}px`;
                document.body.appendChild(particle);

                setTimeout(() => {
                    particle.remove();
                }, 1000);
            }
        }
    }

    /* ==========================================
       Rule ボタンのホバーエフェクト - 強化版
       ========================================== */
    function initRuleButtons() {
        const ruleButtons = document.querySelectorAll('.rule-button');

        ruleButtons.forEach(button => {
            button.addEventListener('mouseenter', function(e) {
                this.style.willChange = 'transform';
                createHoverWave(e, this);
            });

            button.addEventListener('mouseleave', function() {
                this.style.willChange = 'auto';
            });
        });

        function createHoverWave(e, element) {
            const wave = document.createElement('div');
            wave.className = 'hover-wave';
            const rect = element.getBoundingClientRect();
            wave.style.left = `${e.clientX - rect.left}px`;
            wave.style.top = `${e.clientY - rect.top}px`;
            element.appendChild(wave);

            setTimeout(() => {
                wave.remove();
            }, 600);
        }
    }

    /* ==========================================
       How to Join ステップナビゲーション
       ========================================== */
    function initStepNavigation() {
        const stepItems = document.querySelectorAll('.step-item');
        const navButtons = document.querySelectorAll('.step-nav-btn');
        let currentStep = 1;
        let autoPlayInterval;

        function showStep(stepNumber) {
            stepItems.forEach(item => {
                item.classList.remove('active');
                if (parseInt(item.dataset.step) === stepNumber) {
                    item.classList.add('active');
                }
            });

            navButtons.forEach(btn => {
                btn.classList.remove('active');
                if (parseInt(btn.dataset.target) === stepNumber) {
                    btn.classList.add('active');
                }
            });

            currentStep = stepNumber;
        }

        navButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const targetStep = parseInt(this.dataset.target);
                showStep(targetStep);
                stopAutoPlay();
            });
        });

        function startAutoPlay() {
            autoPlayInterval = setInterval(() => {
                currentStep = currentStep >= stepItems.length ? 1 : currentStep + 1;
                showStep(currentStep);
            }, 5000);
        }

        function stopAutoPlay() {
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
            }
        }

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    startAutoPlay();
                } else {
                    stopAutoPlay();
                }
            });
        }, { threshold: 0.5 });

        const stepsContainer = document.querySelector('.steps-container');
        if (stepsContainer) {
            observer.observe(stepsContainer);
        }
    }

    /* ==========================================
       ボタンリップルエフェクト
       ========================================== */
    function initButtonRipples() {
        const buttons = document.querySelectorAll('.step-button, .discord-button');

        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = this.querySelector('.button-ripple');
                if (!ripple) return;

                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;

                ripple.style.animation = 'none';
                requestAnimationFrame(() => {
                    ripple.style.animation = '';
                });
            });
        });
    }

    /* ==========================================
       GSAP ScrollTrigger アニメーション - 強化版
       ========================================== */
    function initGSAPAnimations() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn('GSAP or ScrollTrigger not loaded');
            return;
        }

        gsap.registerPlugin(ScrollTrigger);

        // セクションタイトル - 修正版（自然な動き）
        gsap.utils.toArray('.section-title').forEach(title => {
            gsap.from(title, {
                scrollTrigger: {
                    trigger: title,
                    start: 'top 80%',
                    end: 'top 60%',
                    scrub: 0.5,
                    toggleActions: 'play none none reverse',
                },
                y: 50,
                opacity: 0,
                scale: 0.9,
                duration: 0.8,
            });
        });

        // Feature カード - 修正版（自然な動き）
        gsap.utils.toArray('.feature-card').forEach((card, index) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse',
                },
                y: 60,
                opacity: 0,
                scale: 0.9,
                duration: 0.6,
                delay: index * 0.1,
                ease: 'power2.out',
            });
        });

        // Job カード - 修正版（自然な動き）
        gsap.utils.toArray('.job-card').forEach((card, index) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse',
                },
                y: 80,
                opacity: 0,
                scale: 0.85,
                rotation: index % 2 === 0 ? -5 : 5,
                duration: 0.8,
                delay: index * 0.08,
                ease: 'back.out(1.2)',
            });
        });

        // Rule ボタン - 修正版（自然な動き）
        gsap.utils.toArray('.rule-button').forEach((button, index) => {
            gsap.from(button, {
                scrollTrigger: {
                    trigger: button,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse',
                },
                y: 60,
                opacity: 0,
                scale: 0.9,
                duration: 0.7,
                delay: index * 0.06,
                ease: 'power2.out',
            });
        });

        // Status カード - 修正版（自然な動き）
        gsap.utils.toArray('.status-card').forEach((card, index) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse',
                },
                x: index % 2 === 0 ? -80 : 80,
                y: 40,
                opacity: 0,
                duration: 0.8,
                delay: index * 0.1,
                ease: 'power3.out',
            });
        });

        // Support カード - 修正版（自然な動き）
        gsap.utils.toArray('.support-card').forEach((card, index) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse',
                },
                y: 60,
                opacity: 0,
                scale: 0.9,
                duration: 0.7,
                delay: index * 0.1,
                ease: 'power2.out',
            });
        });

        // ヒーローセクションのパララックス - 強化
        gsap.to('.hero-background', {
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true,
            },
            y: 300,
            opacity: 0.2,
            scale: 1.2,
        });

        // Discord ボタン - 修正版（自然な動き）
        gsap.from('.discord-button', {
            scrollTrigger: {
                trigger: '.discord-button',
                start: 'top 90%',
                toggleActions: 'play none none reverse',
            },
            scale: 0.8,
            opacity: 0,
            y: 40,
            duration: 0.8,
            ease: 'back.out(1.5)',
        });
    }

    /* ==========================================
       Live Status データ取得
       ========================================== */
    function initLiveStatus() {
        const serverStatus = document.getElementById('serverStatus');
        const playerCount = document.getElementById('playerCount');
        const serverPing = document.getElementById('serverPing');

        if (!serverStatus || !playerCount || !serverPing) return;

        function updateStatus() {
            const isOnline = Math.random() > 0.1;
            serverStatus.textContent = isOnline ? 'オンライン' : 'オフライン';
            serverStatus.style.color = isOnline ? '#4caf50' : '#f44336';

            const currentPlayers = Math.floor(Math.random() * 50) + 10;
            const countElement = playerCount.querySelector('.count-number');
            if (countElement) {
                animateNumber(countElement, parseInt(countElement.textContent) || 0, currentPlayers, 1000);
            }

            const ping = Math.floor(Math.random() * 50) + 20;
            const pingElement = serverPing.querySelector('.ping-number');
            if (pingElement) {
                animateNumber(pingElement, parseInt(pingElement.textContent) || 0, ping, 1000);
            }
        }

        function animateNumber(element, start, end, duration) {
            const startTime = performance.now();
            
            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const current = Math.floor(start + (end - start) * progress);
                element.textContent = current;
                
                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            }
            
            requestAnimationFrame(update);
        }

        updateStatus();
        setInterval(updateStatus, 10000);
    }

    /* ==========================================
       スムーススクロール
       ========================================== */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    /* ==========================================
       Intersection Observer
       ========================================== */
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const fadeObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.section').forEach(section => {
        fadeObserver.observe(section);
    });

})();
