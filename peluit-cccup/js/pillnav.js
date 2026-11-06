/*
 * PillNav: navigasi berbentuk pil di bagian atas setiap halaman.
 *
 * Diadaptasi dari komponen PillNav (React Bits, reactbits.dev), varian JavaScript + CSS,
 * dengan pengaturan layout "split", itemStyle "pill", hoverEffect "fill", indicator "pill".
 * Ditulis ulang tanpa React karena website ini tidak memakai proses build.
 *
 * Pemakaian:
 *   var nav = PillNav.mount(hostEl, { logo, logoAlt, logoHref, items: [{ label, href }], activeHref });
 *   nav.setActive("#forum");          // tandai halaman yang sedang dibuka
 *   nav.setHidden("#akses", true);    // sembunyikan item (misalnya khusus admin)
 */
(function () {
  "use strict";

  var EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
  var uid = 0;

  function reduced() { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function el(tag, cls, attrs, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] != null) e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text;
    return e;
  }
  function clear(e) { while (e.firstChild) e.removeChild(e.firstChild); }
  function readVar(e, name) { return parseFloat(getComputedStyle(e).getPropertyValue(name)) || 0; }

  /* Ikon: daftar path SVG (viewBox 24×24, garis). Dibuat dengan createElementNS, bukan innerHTML. */
  var SVG_NS = "http://www.w3.org/2000/svg";
  function icon(paths) {
    if (!paths || !paths.length) return null;
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    paths.forEach(function (d) {
      var p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", d);
      svg.appendChild(p);
    });
    return svg;
  }
  /* Isi pil: ikon (kalau ada) lalu teks. */
  function face(cls, it, attrs) {
    var s = el("span", cls, attrs);
    var ic = icon(it.icon);
    if (ic) s.appendChild(ic);
    s.appendChild(document.createTextNode(it.label));
    return s;
  }

  function mount(host, opts) {
    opts = opts || {};
    var items = (opts.items || []).slice();
    var active = opts.activeHref || null;
    var indicator = opts.indicator === "pill" ? "pill" : "dot";
    var bounce = Math.min(1, Math.max(0, opts.bounce == null ? 0.3 : opts.bounce));
    var hidden = {};
    (opts.hidden || []).forEach(function (href) { hidden[href] = true; });
    var collapsed = false, open = false, running = [], slots = [], rows = [];
    var panelId = "pn-panel-" + (++uid);

    var root = el("nav", "pill-nav", { "aria-label": opts.ariaLabel || "Menu utama", "data-layout": "split", "data-items": "pill" });

    /* Logo bulat: berputar saat disentuh kursor */
    var logo = el("span", "pill-nav__logo pill-nav__surface");
    var logoLink = el("a", "pill-nav__logo-link", { href: opts.logoHref || "#", "aria-label": opts.logoAlt || "Beranda" });
    var mark = el("span", "pill-nav__mark");
    if (opts.logo) mark.appendChild(el("img", null, { src: opts.logo, alt: "", draggable: "false", width: "64", height: "64", decoding: "async" }));
    logoLink.appendChild(mark);
    logo.appendChild(logoLink);
    logo.appendChild(el("span", "pill-nav__rim"));
    logoLink.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "touch" || reduced() || (mark.getAnimations && mark.getAnimations().length)) return;
      if (mark.animate) mark.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], { duration: 900, easing: "cubic-bezier(0.65, 0, 0.25, 1)" });
    });

    /* Bar berisi pil */
    var bar = el("div", "pill-nav__bar pill-nav__surface");
    var track = el("div", "pill-nav__track");
    var list = el("ul", "pill-nav__list");
    track.appendChild(list);
    // Titik penanda halaman aktif: meluncur ke menu yang dipilih dengan efek pantul.
    var dot = indicator === "dot" ? el("span", "pill-nav__dot", { "aria-hidden": "true" }) : null;
    if (dot) track.appendChild(dot);
    bar.appendChild(track);
    bar.appendChild(el("span", "pill-nav__rim"));

    /* Tombol menu dan panel (saat pil tidak muat satu baris) */
    var toggle = el("button", "pill-nav__toggle pill-nav__surface", { type: "button", "aria-expanded": "false", "aria-controls": panelId, "aria-label": "Buka menu" });
    var burger = el("span", "pill-nav__burger", { "aria-hidden": "true" });
    burger.appendChild(el("span", "pill-nav__line pill-nav__line--top"));
    burger.appendChild(el("span", "pill-nav__line pill-nav__line--bottom"));
    toggle.appendChild(burger);
    toggle.appendChild(el("span", "pill-nav__rim"));
    toggle.hidden = true;

    var panel = el("div", "pill-nav__panel pill-nav__surface", { id: panelId });
    var menu = el("ul", "pill-nav__menu");
    panel.appendChild(menu);
    panel.appendChild(el("span", "pill-nav__rim"));
    panel.hidden = true;

    /* Salinan tak terlihat untuk mengukur lebar semua pil */
    var measureBox = el("div", "pill-nav__measure", { "aria-hidden": "true" });
    var measureList = el("div", "pill-nav__list");
    measureBox.appendChild(measureList);

    root.appendChild(logo);
    root.appendChild(bar);
    root.appendChild(toggle);
    root.appendChild(panel);
    root.appendChild(measureBox);
    host.appendChild(root);

    function visibleItems() { return items.filter(function (it) { return !hidden[it.href]; }); }

    function build() {
      clear(list); clear(menu); clear(measureList);
      slots = []; rows = [];
      visibleItems().forEach(function (it) {
        var li = el("li", "pill-nav__slot");
        var a = el("a", "pill-nav__item", { href: it.href });
        a.appendChild(el("span", "pill-nav__fill", { "aria-hidden": "true" }));
        a.appendChild(face("pill-nav__face", it));
        a.appendChild(face("pill-nav__face-alt", it, { "aria-hidden": "true" }));
        li.appendChild(a);
        var lit = function (on) {
          if (on) li.setAttribute("data-hover", ""); else li.removeAttribute("data-hover");
          // Titik berganti warna kalau pil aktif sedang tersorot.
          if (it.href === active) { if (on) root.setAttribute("data-dot-lit", ""); else root.removeAttribute("data-dot-lit"); }
        };
        li.addEventListener("pointerenter", function (e) { if (e.pointerType !== "touch") lit(true); });
        li.addEventListener("pointerleave", function () { lit(false); });
        a.addEventListener("focus", function () { if (!a.matches || a.matches(":focus-visible")) lit(true); });
        a.addEventListener("blur", function () { lit(false); });
        a.addEventListener("pointerdown", function (e) { if (e.button === 0) li.setAttribute("data-press", ""); });
        a.addEventListener("pointerup", function () { li.removeAttribute("data-press"); });
        a.addEventListener("pointercancel", function () { li.removeAttribute("data-press"); });
        list.appendChild(li);
        slots.push({ li: li, a: a, it: it });

        var row = el("a", "pill-nav__row", { href: it.href });
        var ric = icon(it.icon);
        if (ric) row.appendChild(ric);
        row.appendChild(document.createTextNode(it.label));
        row.tabIndex = open ? 0 : -1;
        row.addEventListener("click", function () { setOpen(false); });
        var mli = el("li");
        mli.appendChild(row);
        menu.appendChild(mli);
        rows.push({ row: row, it: it });

        measureList.appendChild(face("pill-nav__ink-item", it));
      });
      paint();
      measureFill();
      evaluate();
    }

    function paint() {
      slots.forEach(function (s) {
        var on = s.it.href === active;
        // Indikator "pill": pil aktif terisi penuh. Indikator "dot": cukup titik di bawah label.
        if (on && indicator === "pill") s.li.setAttribute("data-on", ""); else s.li.removeAttribute("data-on");
        if (on) s.a.setAttribute("aria-current", "page"); else s.a.removeAttribute("aria-current");
      });
      rows.forEach(function (r) {
        if (r.it.href === active) r.row.setAttribute("aria-current", "page"); else r.row.removeAttribute("aria-current");
      });
      moveDot();
    }

    /* Titik penanda: pegas teredam (sama seperti React Bits). bounce 0..1 menentukan pantulan. */
    var dotState = { x: 0, v: 0, alpha: 0, target: null, raf: 0, last: 0 };
    function dotTarget() {
      for (var i = 0; i < slots.length; i++) {
        if (slots[i].it.href === active) return slots[i].li.offsetLeft + slots[i].li.offsetWidth / 2;
      }
      return null;
    }
    function drawDot() {
      var pull = Math.min(2.2, Math.abs(dotState.v) / 700);
      dot.style.transform = "translate3d(" + dotState.x + "px, 0, 0) scaleX(" + (1 + pull) + ")";
      dot.style.opacity = String(dotState.alpha);
    }
    function dotTick(now) {
      dotState.raf = 0;
      var dt = dotState.last ? Math.min(0.05, (now - dotState.last) / 1000) : 1 / 60;
      dotState.last = now;
      var t = dotState.target, busy = false;
      if (t != null) {
        if (dotState.alpha < 0.02) { dotState.x = t; dotState.v = 0; }
        if (reduced()) { dotState.x = t; dotState.v = 0; }
        else {
          var k = 360, steps = Math.ceil(dt / (1 / 240)), h = dt / steps;
          for (var i = 0; i < steps; i++) {
            dotState.v += (-k * (dotState.x - t) - 2 * (1 - 0.5 * bounce) * Math.sqrt(k) * dotState.v) * h;
            dotState.x += dotState.v * h;
          }
        }
        dotState.alpha += (1 - dotState.alpha) * (reduced() ? 1 : 1 - Math.exp(-dt / 0.1));
        busy = Math.abs(dotState.x - t) > 0.05 || Math.abs(dotState.v) > 0.5 || dotState.alpha < 0.999;
      } else {
        dotState.alpha += (0 - dotState.alpha) * (reduced() ? 1 : 1 - Math.exp(-dt / 0.1));
        busy = dotState.alpha > 0.002;
        if (!busy) dotState.alpha = 0;
      }
      drawDot();
      if (busy) dotState.raf = requestAnimationFrame(dotTick); else dotState.last = 0;
    }
    function moveDot(snap) {
      if (!dot || collapsed) return;
      dotState.target = dotTarget();
      if (snap && dotState.target != null) { dotState.x = dotState.target; dotState.v = 0; drawDot(); }
      if (!dotState.raf) { dotState.last = 0; dotState.raf = requestAnimationFrame(dotTick); }
    }

    /* Ukuran lingkaran pengisi: cukup besar untuk menutup seluruh pil dari bawah. */
    function measureFill() {
      slots.forEach(function (s) {
        var w = s.li.offsetWidth, h = s.li.offsetHeight;
        if (!w) return;
        var reach = Math.ceil(2 * Math.sqrt(Math.pow(w / 2, 2) + h * h)) + 2;
        s.li.style.setProperty("--pn-fill", reach + "px");
      });
    }

    /* Lipat pil ke tombol menu kalau tidak muat dalam satu baris. */
    function evaluate() {
      var parent = root.parentElement;
      if (!parent) return;
      var cs = getComputedStyle(parent);
      var available = parent.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      var need = readVar(root, "--pn-h") + readVar(root, "--pn-gap") + measureList.offsetWidth + readVar(root, "--pn-pad") * 2;
      setCollapsed(need > available + 0.5);
    }

    function setCollapsed(next) {
      if (next === collapsed) return;
      collapsed = next;
      if (collapsed) root.setAttribute("data-collapsed", ""); else root.removeAttribute("data-collapsed");
      bar.hidden = collapsed;
      toggle.hidden = !collapsed;
      if (!collapsed) setOpen(false, true);
      requestAnimationFrame(function () { measureFill(); moveDot(true); });
    }

    function stopRunning() {
      running.forEach(function (a) { a.onfinish = null; try { a.cancel(); } catch (e) { /* abaikan */ } });
      running = [];
    }

    function setOpen(next, instant) {
      if (next === open) return;
      open = next;
      if (open) root.setAttribute("data-open", ""); else root.removeAttribute("data-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
      rows.forEach(function (r) { r.row.tabIndex = open ? 0 : -1; });
      stopRunning();
      var anim = !instant && !reduced() && panel.animate;
      if (open) {
        panel.hidden = false;
        root.setAttribute("data-panel", "");
        if (!anim) return;
        var g = geometry();
        running.push(panel.animate([{ clipPath: g.start }, { clipPath: g.end }], { duration: 560, easing: EASE_OUT }));
        [].forEach.call(menu.children, function (li, i) {
          running.push(li.animate([{ opacity: 0, transform: "translateY(-8px)" }, { opacity: 1, transform: "translateY(0)" }],
            { duration: 420, delay: 90 + i * 40, easing: EASE_OUT, fill: "backwards" }));
        });
      } else {
        var done = function () { panel.hidden = true; root.removeAttribute("data-panel"); };
        if (!anim || panel.hidden) { done(); return; }
        var g2 = geometry();
        var morph = panel.animate([{ clipPath: g2.end }, { clipPath: g2.start }], { duration: 380, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" });
        morph.onfinish = function () { done(); stopRunning(); };
        running.push(morph);
        [].forEach.call(menu.children, function (li) {
          running.push(li.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" }));
        });
      }
    }
    function geometry() {
      var w = panel.offsetWidth, h = panel.offsetHeight, head = toggle.offsetHeight || 44;
      return {
        start: "inset(0px 0px " + Math.max(0, h - head) + "px " + Math.max(0, w - head) + "px round " + head / 2 + "px)",
        end: "inset(0px 0px 0px 0px round 24px)"
      };
    }

    toggle.addEventListener("click", function () { setOpen(!open); });
    document.addEventListener("pointerdown", function (e) {
      if (open && !(e.target instanceof Node && root.contains(e.target))) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) { setOpen(false); toggle.focus(); }
    });

    /* Animasi pembuka: logo muncul, bar terbuka dari kiri, pil masuk satu per satu. */
    function intro() {
      if (reduced() || !logo.animate || opts.intro === false) return;
      logo.animate([{ opacity: 0, transform: "scale(0.6)" }, { opacity: 1, transform: "scale(1)" }],
        { duration: 700, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", fill: "backwards" });
      if (collapsed) {
        toggle.animate([{ opacity: 0, transform: "scale(0.6)" }, { opacity: 1, transform: "scale(1)" }],
          { duration: 700, delay: 120, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", fill: "backwards" });
        return;
      }
      var w = bar.offsetWidth, h = bar.offsetHeight;
      bar.animate([
        { clipPath: "inset(0px " + Math.max(0, w - h) + "px 0px 0px round " + h / 2 + "px)" },
        { clipPath: "inset(0px 0px 0px 0px round " + h / 2 + "px)" }
      ], { duration: 760, delay: 90, easing: EASE_OUT, fill: "backwards" });
      slots.forEach(function (s, i) {
        s.li.animate([{ opacity: 0, transform: "translateX(-10px)" }, { opacity: 1, transform: "translateX(0)" }],
          { duration: 560, delay: 200 + i * 50, easing: EASE_OUT, fill: "backwards" });
      });
    }

    build();
    intro();

    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(function () { evaluate(); measureFill(); moveDot(true); });
      if (root.parentElement) ro.observe(root.parentElement);
      ro.observe(measureBox);
    } else {
      window.addEventListener("resize", function () { evaluate(); measureFill(); moveDot(true); });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { evaluate(); measureFill(); }).catch(function () {});

    return {
      el: root,
      setActive: function (href) { active = href; paint(); },
      setHidden: function (href, on) {
        if (!!hidden[href] === !!on) return;
        if (on) hidden[href] = true; else delete hidden[href];
        build();
      },
      close: function () { setOpen(false); }
    };
  }

  window.PillNav = { mount: mount };
})();
