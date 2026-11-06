/*
 * Latar interaktif di Beranda: AeroShards (pecahan kaca oranye, melingkar di tengah).
 * Gerakkan kursor untuk menyibak pecahan, klik untuk gelombang cahaya, tahan untuk mengumpulkan.
 * Hanya jalan di browser dengan WebGPU. Tanpa WebGPU, Beranda tampil dengan latar biasa.
 */
import { mountAeroShards } from './aero-shards.js';

const box = document.getElementById('heroShards');
const btn = document.getElementById('heroMotion');

function fallback() {
  if (box) box.remove();
  if (btn) btn.hidden = true;
}

if (!box || !('gpu' in navigator)) {
  fallback();
} else {
  const light = window.matchMedia('(prefers-color-scheme: light)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Layar kecil: pecahan lebih sedikit supaya HP tidak berat.
  const small = window.matchMedia('(max-width: 700px)').matches;

  const fx = mountAeroShards(box, {
    shardColor: '#e6731b',
    accentColor: '#f88736',
    placement: 'center',
    material: 'glass',
    markers: 'plus',
    count: small ? 800 : 1700,
    depthOfField: 0.89,
    vignette: 0.2,
    mouseInteraction: true,
    pulseOnClick: true,
    holdToGather: true,
    shardSize: 0.93,
    spread: 0.85,
    twist: 1.4,
    billow: 0.6,
    speed: 1.29,
    scale: 0.99,
    glow: 0.75,
    grain: 0.08,
    parallax: 0.31,
    lightMode: light.matches,
    onError: fallback
  });

  light.addEventListener('change', (e) => fx.update({ lightMode: e.matches }));

  // Animasi berjalan terus, jadi harus bisa dihentikan. Dengan reduced motion latarnya sudah diam.
  if (btn && !reduced.matches) {
    btn.hidden = false;
    btn.addEventListener('click', () => {
      const stop = btn.getAttribute('aria-pressed') !== 'true';
      fx.update({ paused: stop });
      btn.setAttribute('aria-pressed', stop ? 'true' : 'false');
      btn.textContent = stop ? 'Jalankan animasi latar' : 'Hentikan animasi latar';
    });
  }
}
