/*
 * Latar animasi untuk halaman tertentu di index.html:
 * - Fenomena        : Lightfall (js/lightfall.js)
 * - Panduan SOP     : FluxLines (js/fluxlines.js)
 * - Hasil           : GhostFibers (js/ghostfibers.js)
 * - CC Cup          : Antigravity (js/antigravity.js)
 * - Forum, Laporan  : PixelSnow (js/pixelsnow.js)
 * Semua latar hanya menggambar saat halamannya tampil, dan berhenti sendiri kalau
 * browser tidak mendukung WebGL2. Di HP/tablet kecil atau perangkat lemah dipakai
 * mode ringan (partikel lebih sedikit, resolusi lebih rendah) supaya tidak patah-patah.
 */
(function () {
  "use strict";

  var light = !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) &&
    document.documentElement.getAttribute("data-theme") !== "dark" ||
    document.documentElement.getAttribute("data-theme") === "light";

  // Mode ringan: layar sempit (HP, tablet kecil) atau prosesor dengan sedikit inti.
  var lite = !!(window.matchMedia && window.matchMedia("(max-width: 820px)").matches) ||
    (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2);
  var dpr = lite ? 1.25 : undefined;

  function safe(fn) { try { fn(); } catch (e) { console.warn("Latar animasi tidak bisa dimuat", e); } }
  /* Latar baru dibuat saat halamannya pertama kali tampil. Browser membatasi jumlah WebGL
     yang aktif (lebih sedikit lagi di HP), jadi jangan membuat keenamnya sekaligus. */
  function later(el, fn) {
    if (!("IntersectionObserver" in window)) { safe(fn); return; }
    var io = new IntersectionObserver(function (entries) {
      if (!entries.some(function (en) { return en.isIntersecting; })) return;
      io.disconnect();
      safe(fn);
    });
    io.observe(el);
  }

  var hasil = document.getElementById("hasilBg");
  if (hasil && window.GhostFibers) later(hasil, function () {
    window.GhostFibers.mount(hasil, {
      glowColor: "#ad4801",
      layers: 3,
      twist: 1.5,
      threads: lite ? 40 : 72,
      fiberStyle: "dots",
      depthOfField: 0.85,
      hoverEffect: "focus",
      intro: true,
      mouseInteraction: true,
      lineColor: "#cfa218",
      secondaryColor: "#8d0d0d",
      gradient: "along",
      waves: 1.4,
      spread: 1.4,
      scale: 0.8,
      density: lite ? 0.7 : 1.1,
      foldGlow: 1.45,
      flow: 0.25,
      rollSpeed: 0.17,
      focusDepth: -0.1,
      particles: lite ? 0.3 : 0.6,
      glow: 0.75,
      mouseStrength: 1.2,
      dpr: dpr,
      lightMode: light
    });
  });

  var fenomena = document.getElementById("fenomenaBg");
  if (fenomena && window.Lightfall) later(fenomena, function () {
    window.Lightfall.mount(fenomena, {
      colors: ["#f97316", "#8d0d0d", "#eab308"],
      backgroundColor: "#834500",
      speed: 0.4,
      streakCount: lite ? 2 : 3,
      streakWidth: 0.8,
      twinkle: 0.35,
      backgroundGlow: 0.3,
      headGlow: 0.4,
      bloom: 0.4,
      mouseInteraction: true,
      holdToWarp: true,
      intro: true,
      streakLength: 0.7,
      density: 0.7,
      zoom: 2.6,
      mouseStrength: 0.1,
      lens: 0.35,
      fade: 0.15,
      dpr: dpr,
      lightMode: light
    });
  });

  /* Salju piksel di Forum dan Laporan. Di mode terang, salju putih tidak terlihat,
     jadi warnanya diganti abu-abu hijau tua. */
  ["forumBg", "laporanBg"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el && window.PixelSnow) later(el, function () {
      window.PixelSnow.mount(el, {
        color: light ? "#3b4a40" : "#ffffff",
        variant: "snowflake",
        density: lite ? 0.25 : 0.4,
        speed: 1,
        wind: 0.2,
        flakeSize: 1,
        pixelSize: 4,
        glow: 0.85,
        mouseInteraction: true,
        sway: 0.7,
        twinkle: 0.4,
        depth: 0.5,
        fade: 0.1,
        opacity: 0.8,
        dpr: dpr,
        lightMode: light
      });
    });
  });

  var info = document.getElementById("infoBg");
  if (info && window.FluxLines) later(info, function () {
    window.FluxLines.mount(info, {
      colors: ["#7b0303", "#834500", "#ab8202"],
      glow: 2,
      rimWidth: 0.2,
      lineWidth: 1.1,
      flowDirection: "down",
      mouseInteraction: true,
      clickSwirl: true,
      speed: 0.4,
      scale: 1.4,
      turbulence: 0.9,
      sharpness: 3,
      dpr: dpr,
      lightMode: light
    });
  });

  var cccup = document.getElementById("cccupBg");
  if (cccup && window.Antigravity) later(cccup, function () {
    window.Antigravity.mount(cccup, {
      colors: ["#FF9FFC", "#ffd6a5", "#fda4af"],
      count: lite ? 900 : 1800,
      magnetRadius: 10,
      ringRadius: 8,
      particleSize: 1,
      autoAnimate: true,
      colorSpeed: 0.04,
      fieldStrength: 12,
      waveAmplitude: 6,
      waveCount: 4,
      waveSpeed: 0.3,
      pulseSpeed: 2.5,
      depthFactor: 1.3,
      ambient: 0.4,
      lerpSpeed: 0.06,
      maxDevicePixelRatio: lite ? 1.25 : 2,
      lightMode: light
    });
  });
})();
