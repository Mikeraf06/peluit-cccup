/*
 * Perkenalan anggota: carousel melingkar dengan 5 kartu.
 *
 * Diadaptasi dari komponen CircularCarousel (React Bits, reactbits.dev), preset "orbit":
 * intro "spin", lebar kartu 230px, rasio 0.75, kecepatan 10, tilt -13, perspektif 1280,
 * momentum 0.4. Ditulis ulang tanpa React karena website ini tidak memakai proses build.
 *
 * Kartu digambar seperti punggung jersey: nama depan dan nomor absen sebagai nomor punggung.
 * Kalau foto ada di data.js (photo: "assets/anggota/01.jpg"), foto yang tampil.
 */
(function () {
  "use strict";

  var D = window.CC_DATA;
  var root = document.getElementById("orbit");
  if (!D || !root) return;

  var members = D.group.members.slice(0, 5);
  var COUNT = members.length;
  var REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* Pengaturan (sama dengan contoh React Bits, preset orbit). */
  var S = {
    cardW: 230, aspect: 0.75, gap: 25, spread: 1.45,
    tilt: -13, perspective: 1280,
    speed: 10, momentum: 0.4,
    parallax: REDUCED ? 0 : 0.3,
    stretch: REDUCED ? 0 : 0.5,
    depthFade: 0.55,
    intro: REDUCED ? "none" : "spin",
    autoplay: !REDUCED
  };
  S.cardH = S.cardW / S.aspect;
  S.step = 360 / COUNT;
  S.radius = Math.max(((S.cardW + S.gap) * S.spread) / (2 * Math.sin(Math.PI / Math.max(COUNT, 3))), S.cardW * 0.6);

  var INTRO_LEN = 1800, SPRING = 118, SETTLE = 9, DRAG_THRESHOLD = 5, TO_RAD = Math.PI / 180;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function wrap(d) { return ((((d + 180) % 360) + 360) % 360) - 180; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 4); }
  function rotX(p, deg) { var r = deg * TO_RAD, c = Math.cos(r), s = Math.sin(r); return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c]; }
  function rotY(p, deg) { var r = deg * TO_RAD, c = Math.cos(r), s = Math.sin(r); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; }
  function isTodo(s) { return /\[[^\]]*\]/.test(String(s || "")); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  var stage = document.getElementById("orbitStage"), camera = document.getElementById("orbitCamera"), ring = document.getElementById("orbitRing");
  var nameEl = document.getElementById("orbitName"), roleEl = document.getElementById("orbitRole"), countEl = document.getElementById("orbitCount");
  var nowBox = document.getElementById("orbitNow"), live = document.getElementById("orbitLive");
  var pauseBtn = document.getElementById("orbitPause");
  var roster = document.getElementById("roster");

  /* Kartu */
  var cards = members.map(function (m, i) {
    var card = el("div", "orbit-card");
    card.setAttribute("data-i", String(i));
    card.setAttribute("role", "group");
    card.setAttribute("aria-roledescription", "kartu");
    card.setAttribute("aria-label", m.name + ", " + (i + 1) + " dari " + COUNT);
    var face = el("div", "jersey");
    face.style.left = (-S.cardW / 2) + "px"; face.style.top = (-S.cardH / 2) + "px";
    face.style.width = S.cardW + "px"; face.style.height = S.cardH + "px";
    var first = m.nick || m.name.split(/\s+/)[0] || m.name;
    face.appendChild(el("span", "jersey-class", "8-1"));
    face.appendChild(el("span", "jersey-num", m.no));
    face.appendChild(el("span", "jersey-name", first));
    if (m.role && !isTodo(m.role)) face.appendChild(el("span", "jersey-role", m.role));
    if (m.photo) {
      var img = document.createElement("img");
      img.src = m.photo; img.alt = ""; img.width = 460; img.height = 614; img.decoding = "async"; img.draggable = false;
      img.addEventListener("load", function () { face.classList.add("has-photo"); });
      img.addEventListener("error", function () { img.remove(); });
      face.insertBefore(img, face.firstChild);
    }
    face.appendChild(el("span", "jersey-shade"));
    card.appendChild(face);
    ring.appendChild(card);
    return card;
  });

  /* Daftar anggota: cara tanpa gerakan untuk memilih anggota. */
  var rosterBtns = members.map(function (m, i) {
    var li = el("li"), b = el("button");
    b.type = "button";
    var av = el("span", "av"); av.setAttribute("aria-hidden", "true");
    av.appendChild(el("span", "no", m.no));
    if (m.photo) {
      var pic = document.createElement("img");
      pic.src = m.photo; pic.alt = ""; pic.width = 120; pic.height = 160; pic.loading = "lazy"; pic.decoding = "async";
      pic.addEventListener("error", function () { pic.remove(); });
      av.appendChild(pic);
    }
    b.appendChild(av);
    var info = el("span", "info");
    var nm = el("span", "nm"); nm.appendChild(el("span", "sr", "Nomor absen " + m.no + ", ")); nm.appendChild(document.createTextNode(m.nick || m.name));
    info.appendChild(nm);
    if (m.nick) info.appendChild(el("span", "full", m.name));
    if (!isTodo(m.role) && m.role) info.appendChild(el("span", "rl", m.role));
    info.appendChild(el("span", "abs", "Absen " + m.no + " · 8-1"));
    b.appendChild(info);
    b.addEventListener("click", function () {
      focusIndex(i, true);
      root.scrollIntoView({ block: "center", behavior: REDUCED ? "auto" : "smooth" });
    });
    li.appendChild(b); roster.appendChild(li);
    return b;
  });

  /* Keadaan */
  var st = {
    angle: 0, velocity: 0, target: null, dir: -1,
    press: null, drag: false, hover: false, userPaused: false,
    pointer: { inside: false, x: 0, y: 0 }, yaw: 0, pitch: 0,
    intro: null, introDone: false, holdUntil: 0, suppressClick: false,
    fit: 1, last: 0, wheelTimer: 0, announceUntil: 0
  };
  var active = -1, raf = 0, visible = true, ready = false;

  function nearest(a) { return Math.round(a / S.step) * S.step; }

  /* Skala supaya seluruh lingkaran muat di layar. */
  function measure() {
    var rect = root.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var width = rect.width * 0.94, height = rect.height * 0.92, P = S.perspective;
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    var corners = [[-S.cardW / 2, -S.cardH / 2], [S.cardW / 2, -S.cardH / 2], [-S.cardW / 2, S.cardH / 2], [S.cardW / 2, S.cardH / 2]];
    for (var a = -180; a <= 180; a += 7.5) {
      var c = rotY([0, 0, S.radius], a);
      for (var k = 0; k < 4; k++) {
        var p = rotX([c[0] + corners[k][0], corners[k][1], c[2]], S.tilt);
        p[2] -= S.radius;
        if (p[2] >= P * 0.95) continue;
        var f = P / (P - p[2]);
        minX = Math.min(minX, p[0] * f); maxX = Math.max(maxX, p[0] * f);
        minY = Math.min(minY, p[1] * f); maxY = Math.max(maxY, p[1] * f);
      }
    }
    var fit = Math.min(1, width / Math.max(maxX - minX, 1), height / Math.max(maxY - minY, 1));
    st.fit = fit;
    stage.style.perspective = P + "px";
    stage.style.transform = "translate3d(0," + (-((minY + maxY) / 2) * fit) + "px,0) scale(" + fit + ")";
  }

  function advance(dt, now) {
    if (!st.introDone && ready) {
      if (!st.intro) { if (S.intro === "none") st.introDone = true; else st.intro = { start: now }; }
      if (st.intro && now - st.intro.start >= INTRO_LEN) { st.intro = null; st.introDone = true; }
    }
    var paused = st.hover || st.drag || st.userPaused || now < st.holdUntil;
    var cruise = S.autoplay && ready && !paused && !st.intro ? S.speed * st.dir : 0;
    var busy = !!st.intro || st.drag;

    if (st.drag || st.intro) {
      if (!st.drag) st.velocity = 0;
    } else if (st.target !== null) {
      var rem = dt, damping = 2 * Math.sqrt(SPRING);
      while (rem > 0) {
        var hstep = Math.min(rem, 1 / 240);
        var acc = SPRING * (st.target - st.angle) - damping * st.velocity;
        st.velocity += acc * hstep; st.angle += st.velocity * hstep; rem -= hstep;
      }
      if (Math.abs(st.target - st.angle) < 0.004 && Math.abs(st.velocity) < 0.03) { st.angle = st.target; st.velocity = 0; st.target = null; }
      busy = true;
    } else {
      var tau = 0.18 + S.momentum * 1.5;
      st.velocity += (cruise - st.velocity) * (1 - Math.exp(-dt / tau));
      st.angle += st.velocity * dt;
      if (cruise === 0 && Math.abs(st.velocity) < SETTLE) st.target = nearest(st.angle);
      busy = busy || cruise !== 0 || Math.abs(st.velocity) > 0.01 || st.target !== null;
    }
    if (now < st.holdUntil) busy = true;

    var ease = 1 - Math.exp(-dt / 0.35);
    var aimYaw = st.pointer.inside ? st.pointer.x * S.parallax * 9 : 0;
    var aimPitch = st.pointer.inside ? -st.pointer.y * S.parallax * 6 : 0;
    st.yaw += (aimYaw - st.yaw) * ease; st.pitch += (aimPitch - st.pitch) * ease;
    if (Math.abs(aimYaw - st.yaw) > 0.01 || Math.abs(aimPitch - st.pitch) > 0.01) busy = true;
    return busy;
  }

  function render(now) {
    var p = st.intro ? easeOut(clamp((now - st.intro.start) / INTRO_LEN, 0, 1)) : 1;
    var spin = st.intro ? -300 * st.dir * (1 - p) : 0;
    var angle = st.angle + spin;
    var swell = 1 + S.stretch * 0.12 * Math.min(1, Math.abs(st.velocity) / 420);
    var R = S.radius * swell;
    camera.style.transform = "translate3d(0,0," + (-R) + "px) rotateX(" + (S.tilt + st.pitch) + "deg) rotateY(" + st.yaw + "deg)";
    ring.style.transform = "rotateY(" + angle + "deg)";
    var r = R * (st.intro ? 1 + 0.28 * (1 - p) : 1);
    for (var i = 0; i < COUNT; i++) {
      var base = i * S.step;
      // Orbit: setiap kartu selalu menghadap ke depan.
      cards[i].style.transform = "rotateY(" + base + "deg) translateZ(" + r + "px) rotateY(" + (-(base + angle)) + "deg)";
      var facing = Math.cos(wrap(base + angle) * TO_RAD);
      cards[i].style.setProperty("--depth", (S.depthFade * Math.pow((1 - facing) / 2, 1.25)).toFixed(3));
    }
    var idx = ((Math.round(-st.angle / S.step) % COUNT) + COUNT) % COUNT || 0;
    if (idx !== active) setActive(idx);
  }

  function setActive(i) {
    var first = active === -1;
    active = i;
    var m = members[i];
    cards.forEach(function (c, j) { c.classList.toggle("active", j === i); });
    rosterBtns.forEach(function (b, j) { if (j === i) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
    nameEl.textContent = m.nick || m.name;
    roleEl.textContent = isTodo(m.role) ? "" : (m.role || "");
    roleEl.hidden = !roleEl.textContent;
    countEl.textContent = (m.nick ? m.name + " · " : "") + "Absen " + m.no + " · " + pad(i + 1) + " / " + pad(COUNT);
    if (!first && !REDUCED) { nowBox.classList.remove("swap"); void nowBox.offsetWidth; nowBox.classList.add("swap"); }
    // Hanya umumkan ke pembaca layar kalau pengguna sendiri yang memindahkan, bukan saat berputar otomatis.
    if (performance.now() < st.announceUntil) live.textContent = m.name + ", " + (i + 1) + " dari " + COUNT;
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function frame(now) {
    raf = 0;
    var dt = st.last ? Math.min((now - st.last) / 1000, 0.05) : 1 / 60;
    st.last = now;
    var busy = advance(dt, now);
    render(now);
    if (busy && visible && !document.hidden) raf = requestAnimationFrame(frame);
    else st.last = 0;
  }
  function wake() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); }

  function userMoved() { st.announceUntil = performance.now() + 3000; }
  /* Pindah ke sudut tertentu. Dengan reduced motion, langsung lompat tanpa animasi. */
  function goTo(t) {
    st.holdUntil = performance.now() + 2800;
    if (REDUCED) { st.angle = t; st.velocity = 0; st.target = null; render(performance.now()); return; }
    st.target = t; wake();
  }
  function focusIndex(i, announce) {
    var t = -i * S.step;
    t += 360 * Math.round((st.angle - t) / 360);
    if (announce) userMoved();
    goTo(t);
  }
  function stepBy(d) {
    var base = st.target !== null ? st.target : nearest(st.angle);
    userMoved();
    goTo(base - d * S.step);
  }

  /* Seret dengan mouse atau jari */
  root.addEventListener("pointerdown", function (e) {
    st.suppressClick = false;
    if (e.button !== 0) return;
    st.press = { id: e.pointerId, x: e.clientX, y: e.clientY, angle: st.angle, moved: false, origin: 0, samples: [{ t: performance.now(), a: st.angle }] };
  });
  root.addEventListener("pointermove", function (e) {
    if (e.pointerType === "mouse") {
      var rect = root.getBoundingClientRect();
      st.pointer.inside = true;
      st.pointer.x = clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      st.pointer.y = clamp(((e.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    }
    var pr = st.press;
    if (!pr || pr.id !== e.pointerId) { wake(); return; }
    var dx = e.clientX - pr.x, dy = e.clientY - pr.y;
    if (!pr.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      // Di layar sentuh, gerakan yang lebih ke atas-bawah dibiarkan untuk menggulir halaman.
      if (Math.abs(dy) > Math.abs(dx) * 1.2 && e.pointerType !== "mouse") { st.press = null; return; }
      pr.moved = true; pr.origin = dx;
      st.drag = true; st.target = null; st.velocity = 0;
      root.setAttribute("data-dragging", "");
      try { root.setPointerCapture(e.pointerId); } catch (x) { /* abaikan */ }
    }
    st.angle = pr.angle + (dx - pr.origin) * (180 / (Math.PI * S.radius * st.fit));
    var now = performance.now();
    pr.samples.push({ t: now, a: st.angle });
    while (pr.samples.length > 2 && now - pr.samples[0].t > 110) pr.samples.shift();
    wake();
  });
  function release(e) {
    var pr = st.press;
    if (!pr || pr.id !== e.pointerId) return;
    st.press = null;
    if (!pr.moved) return;
    st.drag = false; root.removeAttribute("data-dragging");
    st.suppressClick = true;
    var a = pr.samples[0], b = pr.samples[pr.samples.length - 1], span = (b.t - a.t) / 1000;
    var v = span > 0.008 ? clamp((b.a - a.a) / span, -1400, 1400) : 0;
    st.velocity = v;
    if (Math.abs(v) > 60) st.dir = Math.sign(v);
    var coasting = S.autoplay && !st.userPaused && !(st.hover && e.pointerType === "mouse");
    if (!coasting) st.target = Math.round((st.angle + v * (0.18 + S.momentum * 1.5) * 0.55) / S.step) * S.step;
    userMoved(); wake();
  }
  root.addEventListener("pointerup", release);
  root.addEventListener("pointercancel", release);
  root.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") { st.hover = true; wake(); } });
  root.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") { st.hover = false; st.pointer.inside = false; } wake(); });
  root.addEventListener("click", function (e) {
    if (st.suppressClick) { st.suppressClick = false; return; }
    var card = e.target.closest && e.target.closest(".orbit-card");
    if (card) focusIndex(+card.getAttribute("data-i"), true);
  });
  root.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") stepBy(1);
    else if (e.key === "ArrowLeft") stepBy(-1);
    else if (e.key === "Home") focusIndex(0, true);
    else if (e.key === "End") focusIndex(COUNT - 1, true);
    else return;
    e.preventDefault();
  });
  root.addEventListener("wheel", function (e) {
    var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0;
    if (!d) return;
    e.preventDefault();
    var per = 180 / (Math.PI * S.radius * st.fit);
    st.target = null; st.angle -= d * per; st.velocity = -d * per * 30;
    st.holdUntil = performance.now() + 1600;
    clearTimeout(st.wheelTimer);
    st.wheelTimer = setTimeout(function () { st.target = nearest(st.angle + st.velocity * 0.12); wake(); }, 140);
    wake();
  }, { passive: false });

  document.getElementById("orbitPrev").addEventListener("click", function () { stepBy(-1); });
  document.getElementById("orbitNext").addEventListener("click", function () { stepBy(1); });

  /* Putaran otomatis berjalan lebih dari 5 detik, jadi harus bisa dihentikan. */
  if (!S.autoplay) pauseBtn.parentNode.hidden = true;
  pauseBtn.addEventListener("click", function () {
    st.userPaused = !st.userPaused;
    pauseBtn.setAttribute("aria-pressed", st.userPaused ? "true" : "false");
    pauseBtn.textContent = st.userPaused ? "Jalankan animasi" : "Hentikan animasi";
    wake();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; st.last = 0; } else wake();
  });
  if ("ResizeObserver" in window) new ResizeObserver(function () { measure(); wake(); }).observe(root);
  else window.addEventListener("resize", function () { measure(); wake(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible) wake(); else { cancelAnimationFrame(raf); raf = 0; st.last = 0; }
    }).observe(root);
  }

  measure();
  render(performance.now());
  // Tampilkan setelah huruf siap supaya nomor punggung tidak berganti bentuk saat intro.
  var fontsReady = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1500); })]) : Promise.resolve();
  fontsReady.then(function () { ready = true; root.setAttribute("data-ready", ""); wake(); });
})();
