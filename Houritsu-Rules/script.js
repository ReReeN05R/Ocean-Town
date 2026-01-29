/* =========================================================
  Ocean Town ルール文書ページ（法律ルール）
  目的：
  - 可読性を損なわない範囲で「安心して読む」体験を補助する
  実装：
  - ページ初回フェードイン（1回のみ）
  - 見出しのごく軽い出現（初回のみ）
  - スクロール進捗バー
  - サイドナビ：現在地ハイライト（任意）
  - テーマ切替（保存・復元）
  注意：
  - ルール本文自体はアニメしない
  - 常時ループする動きは入れない
========================================================= */

(() => {
  "use strict";

  const pageRoot = document.getElementById("pageRoot");
  const progressBar = document.getElementById("scrollProgressBar");
  const titleTargets = document.querySelectorAll("[data-reveal-title]");
  const sideLinks = document.querySelectorAll(".sidenav__link");

  /* -----------------------------
    テーマ切替（保存・復元）
    - data-theme="dark" を <html> に付与
    - localStorage に保存
  ----------------------------- */
  const themeToggle = document.getElementById("themeToggle");
  const root = document.documentElement;
  const THEME_KEY = "oceanTheme"; // メインと統一したい場合は同キーにする

  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark") {
    root.setAttribute("data-theme", "dark");
    themeToggle?.setAttribute("aria-pressed", "true");
  }

  themeToggle?.addEventListener("click", () => {
    const isDark = root.getAttribute("data-theme") === "dark";
    if (isDark) {
      root.removeAttribute("data-theme");
      localStorage.setItem(THEME_KEY, "light");
      themeToggle.setAttribute("aria-pressed", "false");
    } else {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem(THEME_KEY, "dark");
      themeToggle.setAttribute("aria-pressed", "true");
    }
  });

  /* -----------------------------
    ページ初回フェードイン（1回のみ）
  ----------------------------- */
  window.addEventListener("DOMContentLoaded", () => {
    if (pageRoot) {
      requestAnimationFrame(() => {
        pageRoot.classList.add("is-ready");
      });
    }
  });

  /* -----------------------------
    スクロール進捗バー
  ----------------------------- */
  function updateProgress() {
    if (!progressBar) return;

    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = doc.scrollHeight || document.body.scrollHeight;
    const clientHeight = doc.clientHeight || window.innerHeight;

    const max = Math.max(1, scrollHeight - clientHeight);
    const p = Math.min(1, Math.max(0, scrollTop / max));

    progressBar.style.width = (p * 100).toFixed(2) + "%";
  }

  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress, { passive: true });
  updateProgress();

  /* -----------------------------
    見出しのごく軽い出現（本文は対象外）
  ----------------------------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { root: null, threshold: 0.12 });

  titleTargets.forEach((el) => revealObserver.observe(el));

  /* -----------------------------
    サイドナビ：現在地ハイライト（このページは章が少ないので最小）
  ----------------------------- */
  const sections = ["#crime-table", "#text-rules"]
    .map((sel) => document.querySelector(sel))
    .filter(Boolean);

  function setActiveLinkByHash(hash) {
    if (!hash) return;
    sideLinks.forEach((a) => {
      const href = a.getAttribute("href");
      a.classList.toggle("is-active", href === hash);
    });
  }

  const navObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top));

    if (visible.length === 0) return;

    const topMost = visible[0].target;
    if (!topMost?.id) return;
    setActiveLinkByHash("#" + topMost.id);
  }, {
    root: null,
    rootMargin: "-20% 0px -70% 0px",
    threshold: 0.01
  });

  sections.forEach((s) => navObserver.observe(s));
})();
