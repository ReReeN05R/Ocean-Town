/* =========================================================
  Ocean Town ルール文書ページ（読書支援）
  目的：
  - 可読性を損なわない範囲で「安心して読む」体験を補助する
  実装：
  - ページ初回フェードイン（1回のみ）
  - 見出しのごく軽い出現（初回のみ）
  - スクロール進捗バー
  - サイドナビ：現在地ハイライト（任意）
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
    ページ初回フェードイン（1回のみ）
  ----------------------------- */
  // DOMが整ってから自然に表示させる（読み込みのガタつきを抑える）
  window.addEventListener("DOMContentLoaded", () => {
    if (pageRoot) {
      // 次フレームで付与してCSSトランジションを確実に効かせる
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
      // 一度出たら解除（繰り返しはしない）
      revealObserver.unobserve(entry.target);
    });
  }, { root: null, threshold: 0.12 });

  titleTargets.forEach((el) => revealObserver.observe(el));

  /* -----------------------------
    サイドナビ：現在地ハイライト
    - 章ブロックを監視して、該当リンクに is-active を付与
  ----------------------------- */
  const sections = [
    "#rulesTitle",
    "#block-zentei",
    "#block-shimin",
    "#block-job",
    "#block-character",
    "#block-murder",
    "#block-crutch",
    "#block-safezone",
    "#block-gunlicense",
    "#block-joinname",
    "#block-kinshi",
    "#block-others"
  ]
    .map((sel) => document.querySelector(sel))
    .filter(Boolean);

  function setActiveLinkById(id) {
    if (!id) return;
    sideLinks.forEach((a) => {
      const href = a.getAttribute("href");
      a.classList.toggle("is-active", href === "#" + id);
    });
  }

  const navObserver = new IntersectionObserver((entries) => {
    // 画面上部に近いものを優先して active を決める
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top));

    if (visible.length === 0) return;

    const topMost = visible[0].target;
    if (topMost && topMost.id) setActiveLinkById(topMost.id);
  }, {
    root: null,
    // 上部に入ったら反映。読みやすさ優先で「早め」に切り替える
    rootMargin: "-20% 0px -70% 0px",
    threshold: 0.01
  });

  sections.forEach((s) => navObserver.observe(s));
})();
