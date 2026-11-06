/*
 * Latar Galaxy di halaman Anggota. Bintang berwarna dari palet logo CC Cup XLI,
 * menyingkir dari kursor, dan melompat (warp) saat area kartu diklik.
 * Tombol "Hentikan animasi" menghentikan putaran kartu dan bintang sekaligus.
 * Tanpa WebGL2, halaman tampil dengan latar biasa.
 */
(function () {
  "use strict";
  var box = document.getElementById("teamGalaxy");
  if (!box || typeof window.mountGalaxy !== "function") return;

  var light = window.matchMedia("(prefers-color-scheme: light)");
  var fx = null;
  try {
    fx = window.mountGalaxy(box, {
      starColors: ["#D9A441", "#F7BD5A", "#ECE8DE", "#E0645A"],
      density: 1.1,
      glowIntensity: 0.35,
      starSpeed: 0.5,
      speed: 1,
      twinkleIntensity: 0.4,
      rotationSpeed: 0.05,
      repulsionStrength: 2,
      mouseRepulsion: true,
      mouseInteraction: true,
      clickWarp: true,
      intro: true,
      transparent: true,
      lightMode: light.matches
    });
  } catch (e) {
    fx = null;
  }
  if (!fx) { box.remove(); return; }

  if (light.addEventListener) light.addEventListener("change", function (e) { fx.update({ lightMode: e.matches }); });

  var pause = document.getElementById("orbitPause");
  if (pause) pause.addEventListener("click", function () {
    // anggota.js sudah mengubah aria-pressed sebelum ini dijalankan.
    fx.update({ disableAnimation: pause.getAttribute("aria-pressed") === "true" });
  });
})();
