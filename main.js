/* =========================================================
  Ocean Town 公式ポータル（実運用前提）
  - GSAP + ScrollTrigger
  - 水面歪みキャンバス（穏やか）
  - マウス反応の波紋（控えめ）
  - HERO：水の粒子からロゴ形成（文字粒子）
  - キャッチコピー：文字ごとにゆっくり上下に
========================================================= */

(() => {
  "use strict";

  /* -----------------------------
    共通：テーマ切替（任意機能）
  ----------------------------- */
  const themeToggle = document.getElementById("themeToggle");
  const root = document.documentElement;

  // 保存済みテーマの復元（実運用でよくある要件）
  const savedTheme = localStorage.getItem("oceanTheme");
  if (savedTheme === "dark") root.setAttribute("data-theme", "dark");

  themeToggle?.addEventListener("click", () => {
    const isDark = root.getAttribute("data-theme") === "dark";
    if (isDark) {
      root.removeAttribute("data-theme");
      localStorage.setItem("oceanTheme", "light");
    } else {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("oceanTheme", "dark");
    }
  });

  /* -----------------------------
    GSAP初期化
  ----------------------------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* =========================================================
    1) グローバル水面キャンバス
  ========================================================= */
  const oceanCanvas = document.getElementById("ocean-canvas");
  const oceanCtx = oceanCanvas?.getContext("2d", { alpha: true });

  const ocean = {
    w: 0,
    h: 0,
    t: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    ripples: [],
    mouse: { x: 0.5, y: 0.5, vx: 0, vy: 0, active: false }
  };

  function resizeOcean() {
    if (!oceanCanvas || !oceanCtx) return;
    ocean.w = window.innerWidth;
    ocean.h = window.innerHeight;
    oceanCanvas.width = Math.floor(ocean.w * ocean.dpr);
    oceanCanvas.height = Math.floor(ocean.h * ocean.dpr);
    oceanCanvas.style.width = ocean.w + "px";
    oceanCanvas.style.height = ocean.h + "px";
    oceanCtx.setTransform(ocean.dpr, 0, 0, ocean.dpr, 0, 0);
  }

  function addRipple(x, y, strength = 1) {
    ocean.ripples.push({
      x,
      y,
      r: 0,
      a: 0.25 * strength,   // 透明度（控えめ）
      s: 1.4 + 0.8 * strength, // 拡散速度
      life: 0
    });
    if (ocean.ripples.length > 28) ocean.ripples.shift();
  }

  function drawOcean() {
    if (!oceanCanvas || !oceanCtx) return;

    const ctx = oceanCtx;
    const w = ocean.w;
    const h = ocean.h;
    ocean.t += 0.008;

    ctx.clearRect(0, 0, w, h);

    const base = ctx.createLinearGradient(0, 0, 0, h);
    base.addColorStop(0, "rgba(127,215,255,0.10)");
    base.addColorStop(0.55, "rgba(79,195,247,0.06)");
    base.addColorStop(1, "rgba(255,255,255,0.00)");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 7; i++) {
      const y = (h * (0.12 + i * 0.12)) + Math.sin(ocean.t * (1.1 + i * 0.12)) * 10;
      ctx.beginPath();
      const amp = 10 + i * 1.8;
      const freq = 0.012 + i * 0.0012;

      for (let x = 0; x <= w; x += 18) {
        const wave =
          Math.sin(ocean.t * 1.2 + x * freq) * amp +
          Math.sin(ocean.t * 0.7 + x * (freq * 1.6)) * (amp * 0.35);

        const dx = x / w - ocean.mouse.x;
        const dy = y / h - ocean.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist * 2.2) * (ocean.mouse.active ? 6 : 2);

        const yy = y + wave + influence * 0.2;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }

      ctx.strokeStyle = `rgba(255,255,255,${0.08 - i * 0.007})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();

    for (let i = ocean.ripples.length - 1; i >= 0; i--) {
      const r = ocean.ripples[i];
      r.life += 1;
      r.r += r.s;
      r.a *= 0.986;

      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(127,215,255,${r.a})`;
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r * 1.22, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${r.a * 0.55})`;
      ctx.lineWidth = 0.9;
      ctx.stroke();

      if (r.a < 0.01 || r.r > Math.max(w, h) * 0.6 || r.life > 420) {
        ocean.ripples.splice(i, 1);
      }
    }

    requestAnimationFrame(drawOcean);
  }

  function bindOceanInput() {
    if (!oceanCanvas) return;

    const onMove = (clientX, clientY) => {
      const x = clientX / ocean.w;
      const y = clientY / ocean.h;

      const vx = x - ocean.mouse.x;
      const vy = y - ocean.mouse.y;
      ocean.mouse.vx = vx;
      ocean.mouse.vy = vy;

      ocean.mouse.x = x;
      ocean.mouse.y = y;
      ocean.mouse.active = true;

      if (Math.abs(vx) + Math.abs(vy) > 0.004) {
        addRipple(clientX, clientY, 0.8);
      }
    };

    window.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY), { passive: true });
    window.addEventListener("mouseleave", () => { ocean.mouse.active = false; }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      onMove(t.clientX, t.clientY);
    }, { passive: true });

    window.addEventListener("touchstart", (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      addRipple(t.clientX, t.clientY, 1.0);
    }, { passive: true });
  }

  resizeOcean();
  bindOceanInput();
  window.addEventListener("resize", resizeOcean, { passive: true });
  requestAnimationFrame(drawOcean);

  /* =========================================================
    2) HERO：粒子からロゴ形成（Canvas）
  ========================================================= */
  const logoCanvas = document.getElementById("logo-canvas");
  const logoCtx = logoCanvas?.getContext("2d");

  const logoFx = {
    w: 0,
    h: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    particles: [],
    targetPoints: [],
    ready: false,
    formed: false,
    t: 0
  };

  function resizeLogo() {
    if (!logoCanvas || !logoCtx) return;
    const rect = logoCanvas.getBoundingClientRect();
    logoFx.w = rect.width;
    logoFx.h = rect.height;

    logoCanvas.width = Math.floor(logoFx.w * logoFx.dpr);
    logoCanvas.height = Math.floor(logoFx.h * logoFx.dpr);
    logoCanvas.style.width = rect.width + "px";
    logoCanvas.style.height = rect.height + "px";
    logoCtx.setTransform(logoFx.dpr, 0, 0, logoFx.dpr, 0, 0);

    buildLogoTargets();
    seedLogoParticles();
  }

  function buildLogoTargets() {
    if (!logoCanvas || !logoCtx) return;

    const ctx = logoCtx;
    const w = logoFx.w;
    const h = logoFx.h;

    ctx.clearRect(0, 0, w, h);

    const plate = ctx.createLinearGradient(0, 0, w, h);
    plate.addColorStop(0, "rgba(255,255,255,0.10)");
    plate.addColorStop(1, "rgba(127,215,255,0.08)");
    ctx.fillStyle = plate;
    ctx.fillRect(0, 0, w, h);

    const fontSize = Math.max(44, Math.min(84, w * 0.11));
    ctx.font = `600 ${fontSize}px ${getComputedStyle(document.documentElement).getPropertyValue("--font-serif") || "serif"}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.fillText("Ocean Town", w * 0.5, h * 0.52);

    const img = ctx.getImageData(0, 0, w, h);
    const data = img.data;
    const points = [];
    const step = Math.max(4, Math.floor(logoFx.w / 160));

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const idx = (y * w + x) * 4;
        const a = data[idx + 3];
        if (a > 190) points.push({ x, y });
      }
    }

    logoFx.targetPoints = points;
    logoFx.ready = true;

    ctx.clearRect(0, 0, w, h);
  }

  function seedLogoParticles() {
    if (!logoFx.ready) return;

    const w = logoFx.w;
    const h = logoFx.h;

    const count = Math.min(1600, Math.max(700, Math.floor(logoFx.targetPoints.length * 0.78)));
    logoFx.particles = [];

    for (let i = 0; i < count; i++) {
      const p = logoFx.targetPoints[Math.floor(Math.random() * logoFx.targetPoints.length)];
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.max(w, h) * (0.55 + Math.random() * 0.55);

      logoFx.particles.push({
        x: w * 0.5 + Math.cos(angle) * radius,
        y: h * 0.5 + Math.sin(angle) * radius * 0.42,
        vx: 0,
        vy: 0,
        tx: p.x,
        ty: p.y,
        size: 1.2 + Math.random() * 1.6,
        hue: 195 + Math.random() * 20,
        a: 0.35 + Math.random() * 0.45
      });
    }

    logoFx.formed = false;
  }

  function drawLogo() {
    if (!logoCanvas || !logoCtx || !logoFx.ready) return;

    const ctx = logoCtx;
    const w = logoFx.w;
    const h = logoFx.h;
    logoFx.t += 0.012;

    ctx.clearRect(0, 0, w, h);

    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "rgba(255,255,255,0.10)");
    bg.addColorStop(1, "rgba(127,215,255,0.08)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    let formedCount = 0;

    for (let i = 0; i < logoFx.particles.length; i++) {
      const p = logoFx.particles[i];

      if (!logoFx.formed && Math.random() < 0.008) {
        const t = logoFx.targetPoints[Math.floor(Math.random() * logoFx.targetPoints.length)];
        p.tx = t.x; p.ty = t.y;
      }

      const dx = p.tx - p.x;
      const dy = p.ty - p.y;

      p.vx += dx * 0.008;
      p.vy += dy * 0.008;
      p.vx *= 0.86;
      p.vy *= 0.86;

      if (logoFx.formed) {
        p.vx += Math.sin(logoFx.t + i * 0.01) * 0.02;
        p.vy += Math.cos(logoFx.t + i * 0.012) * 0.02;
      }

      p.x += p.vx;
      p.y += p.vy;

      if (Math.abs(dx) + Math.abs(dy) < 1.2) formedCount++;

      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${p.a})`;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${p.a * 0.45})`;
      ctx.arc(p.x + 0.4, p.y - 0.4, p.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!logoFx.formed && formedCount > logoFx.particles.length * 0.78) {
      logoFx.formed = true;
    }

    requestAnimationFrame(drawLogo);
  }

  resizeLogo();
  window.addEventListener("resize", resizeLogo, { passive: true });
  requestAnimationFrame(drawLogo);

  /* =========================================================
    3) HERO：キャッチコピー（文字ごとに表示＋上下に揺れ）
  ========================================================= */
  const taglineChars = document.querySelectorAll("#heroTagline .char");
  if (window.gsap && taglineChars.length) {
    gsap.to(taglineChars, {
      opacity: 1,
      y: 0,
      duration: 1.2,
      stagger: 0.045,
      ease: "power2.out",
      delay: 0.4
    });

    gsap.to(taglineChars, {
      y: (i) => (i % 2 === 0 ? -4 : 4),
      duration: 3.2,
      ease: "sine.inOut",
      stagger: 0.06,
      yoyo: true,
      repeat: -1,
      delay: 1.6
    });
  }

  /* =========================================================
    4) 各セクション：穏やかなリビール
  ========================================================= */
  if (window.gsap && window.ScrollTrigger) {
    gsap.utils.toArray(".reveal").forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0, y: 16, filter: "blur(2px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 84%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });
  }

  /* =========================================================
    5) World View：多層パララックス（スクロール＋マウス）
  ========================================================= */
  const world = {
    root: document.getElementById("worldParallax"),
    layers: {
      sky: document.querySelector(".world-layer--sky"),
      clouds: document.querySelector(".world-layer--clouds"),
      horizon: document.querySelector(".world-layer--horizon"),
      sea: document.querySelector(".world-layer--sea"),
      front: document.querySelector(".world-layer--front")
    }
  };

  /* =========================================================
    World View：背景画像パス（ここを差し替えるだけ）
    重要：
    - 画像は「横長」推奨（例：1920x1080）
    - パスはプロジェクト構成に合わせて変更してください
  ========================================================= */
  const WORLD_BG_IMAGES = {
    beach: "img/beach.jpg",
    city: "img/city.jpg",
    port: "img/port.jpg",
    nature: "img/nature.jpg"
  };

  function applyWorldFrontImage(key) {
    const front = world.layers.front;
    if (!front) return;

    const nextUrl = WORLD_BG_IMAGES[key];

    // 未設定（空/undefined）の場合は何もしない
    if (!nextUrl) return;

    front.classList.add("is-fading");

    window.setTimeout(() => {
      front.style.setProperty("--world-front-image", `url("${nextUrl}")`);
      front.classList.remove("is-fading");
    }, 240);
  }

  if (world.root) {
    world.root.addEventListener("mousemove", (e) => {
      const rect = world.root.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;

      world.layers.sky.style.transform = `translate3d(${nx * 8}px, ${ny * 6}px, 0)`;
      world.layers.clouds.style.transform = `translate3d(${nx * 12}px, ${ny * 10}px, 0)`;
      world.layers.horizon.style.transform = `translate3d(${nx * 16}px, ${ny * 12}px, 0)`;
      world.layers.sea.style.transform = `translate3d(${nx * 20}px, ${ny * 14}px, 0)`;
      world.layers.front.style.transform = `translate3d(${nx * 26}px, ${ny * 18}px, 0)`;
    }, { passive: true });

    world.root.addEventListener("mouseleave", () => {
      Object.values(world.layers).forEach((l) => l.style.transform = "translate3d(0,0,0)");
    }, { passive: true });

    if (window.gsap && window.ScrollTrigger) {
      gsap.to(world.layers.clouds, {
        y: 30,
        ease: "none",
        scrollTrigger: { trigger: world.root, start: "top bottom", end: "bottom top", scrub: 0.6 }
      });
      gsap.to(world.layers.sea, {
        y: -20,
        ease: "none",
        scrollTrigger: { trigger: world.root, start: "top bottom", end: "bottom top", scrub: 0.6 }
      });
    }
  }

  const worldPanelTitle = document.getElementById("worldTitle");
  const worldPanelText = document.getElementById("worldText");
  const chips = document.querySelectorAll(".world-chip");

  const worldCopy = {
    beach: {
      title: "海岸",
      text: "白い砂と透明感のある海。到着して最初に深呼吸したくなる場所です。",
      tint: "rgba(127,215,255,.22)"
    },
    city: {
      title: "市街地",
      text: "人が集まり、会話が生まれる。買い物や用事が生活のテンポになります。",
      tint: "rgba(255,255,255,.18)"
    },
    port: {
      title: "港",
      text: "漁、運送、出入りする車両。働く景色が街の生活感を支えます。",
      tint: "rgba(79,195,247,.18)"
    },
    nature: {
      title: "自然エリア",
      text: "少し遠回りしたくなる道。静けさと緑が、呼吸を整えてくれます。",
      tint: "rgba(120,255,220,.10)"
    }
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const key = chip.dataset.world || "beach";
      const data = worldCopy[key] || worldCopy.beach;

      if (worldPanelTitle) worldPanelTitle.textContent = data.title;
      if (worldPanelText) worldPanelText.textContent = data.text;

      const panel = document.getElementById("worldPanel");
      if (panel) {
        panel.style.boxShadow = "0 18px 60px rgba(0,40,70,.16)";
        panel.style.background = `linear-gradient(135deg, rgba(255,255,255,.62), ${data.tint})`;
      }

      applyWorldFrontImage(key);

      const rect = chip.getBoundingClientRect();
      addRipple(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5, 0.9);
    });
  });

  // 初期表示：海岸
  applyWorldFrontImage("beach");

  /* =========================================================
    6) Jobs Detail：カードのリップル座標をCSS変数へ反映
  ========================================================= */
  const jobCards = document.querySelectorAll(".job-card");
  jobCards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const rx = ((e.clientX - rect.left) / rect.width) * 100;
      const ry = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--rx", rx + "%");
      card.style.setProperty("--ry", ry + "%");
    }, { passive: true });

    card.addEventListener("mouseenter", () => {
      const rect = card.getBoundingClientRect();
      addRipple(rect.left + rect.width * 0.5, rect.top + rect.height * 0.6, 0.8);
    }, { passive: true });
  });

  /* =========================================================
    7) Jobs Overview：常時微浮遊アニメーション（穏やか）
  ========================================================= */
  const floatCards = document.querySelectorAll(".float-card");
  if (window.gsap && floatCards.length) {
    floatCards.forEach((card, i) => {
      gsap.to(card, {
        y: (i % 2 === 0) ? -6 : 6,
        duration: 3.6 + (i * 0.2),
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });
    });
  }

  /* =========================================================
    8) A Day：画像のみを時間経過で切替（フェード）
    - HTMLの朝/昼/夜分岐や ScrollTrigger の onUpdate 切替は使わない
    - dayStage が画面内にある時だけ回す（省エネ）
  ========================================================= */
  const dayStage = document.getElementById("dayStage");
  const dayTime = document.getElementById("dayTime");
  const dayTitle = document.getElementById("dayTitle");
  const dayText = document.getElementById("dayText");
  const dayDots = document.querySelectorAll(".day-dot");

  /* =========================================================
    A Day：画像パス（ここを差し替えるだけ）
    重要：
    - 画像は「横長」推奨（例：1920x1080）
    - パスはプロジェクト構成に合わせて変更してください
  ========================================================= */
  const DAY_SLIDES = [
    "img/night.jpg",
    "img/day.jpg",
    "img/morning.jpg"
  ];

  const DAY_SLIDE_INTERVAL = 4500;

  const dayCopy = [
    {
      time: "朝",
      title: "港に光が落ちる",
      text: "仕事の準備、挨拶、出航。静かな始まりが街のテンポを作ります。"
    },
    {
      time: "昼",
      title: "市街地が賑わう",
      text: "買い物、移動、用事。生活が回り、会話が自然に生まれます。"
    },
    {
      time: "夜",
      title: "海の音が近くなる",
      text: "落ち着いた時間。今日の出来事が物語になって、街に積もっていきます。"
    }
  ];

  let dayTimer = null;
  let dayIndex = 0;

  function setupDaySlides() {
    if (!dayStage) return;

    // 既に生成済みなら何もしない
    if (dayStage.querySelector(".day-slide")) return;

    const valid = DAY_SLIDES.filter((u) => !!u);
    if (valid.length === 0) return;

    valid.forEach((url, i) => {
      const slide = document.createElement("div");
      slide.className = "day-slide" + (i === 0 ? " is-active" : "");
      slide.style.backgroundImage = `url("${url}")`;
      dayStage.insertBefore(slide, dayStage.firstChild);
    });
  }

  function applyDayUI(idx) {
    const d = dayCopy[idx] || dayCopy[0];
    if (dayTime) dayTime.textContent = d.time;
    if (dayTitle) dayTitle.textContent = d.title;
    if (dayText) dayText.textContent = d.text;
    dayDots.forEach((dot, i) => dot.classList.toggle("is-active", i === idx));
  }

  function setActiveDaySlide(idx) {
    if (!dayStage) return;
    const slides = dayStage.querySelectorAll(".day-slide");
    if (!slides.length) return;

    slides.forEach((s) => s.classList.remove("is-active"));
    slides[idx % slides.length].classList.add("is-active");

    applyDayUI(idx);

    // ほんのり波紋（控えめ）
    const rect = dayStage.getBoundingClientRect();
    addRipple(rect.left + rect.width * 0.5, rect.top + rect.height * 0.55, 0.9);
  }

  function startDaySlideshow() {
    if (!dayStage) return;

    setupDaySlides();

    const slides = dayStage.querySelectorAll(".day-slide");
    if (!slides.length) return;

    stopDaySlideshow();

    // 初期UI反映
    setActiveDaySlide(dayIndex);

    dayTimer = window.setInterval(() => {
      dayIndex = (dayIndex + 1) % slides.length;
      setActiveDaySlide(dayIndex);
    }, DAY_SLIDE_INTERVAL);
  }

  function stopDaySlideshow() {
    if (dayTimer) {
      window.clearInterval(dayTimer);
      dayTimer = null;
    }
  }

  // dayStage があれば、画面内にいる時だけ回す（ScrollTriggerが使える場合）
  if (dayStage && window.ScrollTrigger) {
    ScrollTrigger.create({
      trigger: dayStage,
      start: "top 75%",
      end: "bottom 25%",
      onEnter: () => startDaySlideshow(),
      onEnterBack: () => startDaySlideshow(),
      onLeave: () => stopDaySlideshow(),
      onLeaveBack: () => stopDaySlideshow()
    });
  } else {
    // ScrollTriggerが無い場合でも最低限動くように（常時）
    startDaySlideshow();
  }

  /* =========================================================
    9) スムーススクロール補助（強制しない）
  ========================================================= */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;

      const el = document.querySelector(id);
      if (!el) return;

      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });

      addRipple(ocean.w * 0.5, 120, 0.6);
    });
  });

})();
