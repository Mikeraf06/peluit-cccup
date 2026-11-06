/*
 * Tombol bersumbu: setelah ditekan, sumbu menyala selama beberapa detik dan seluruh tombol
 * berubah jadi "Batalkan". Aksi baru dijalankan saat sumbu habis (commitOn "fuseEnd"),
 * jadi membatalkan berarti tidak ada yang terkirim atau terhapus.
 *
 * Diadaptasi dari komponen FuseButton (React Bits, reactbits.dev), ditulis ulang tanpa React
 * karena website ini tidak memakai proses build. Ikon digambar langsung sebagai SVG.
 *
 * Pemakaian:
 *   var fb = FuseButton({ preset: "send", label: "Kirim", onCommit: kirim, onUndo: batal });
 *   wadah.appendChild(fb.el);
 */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var SIZES = {
    sm: { height: 36, font: 13, icon: 14, px: 16 },
    md: { height: 44, font: 14, icon: 15, px: 20 },
    lg: { height: 52, font: 15, icon: 17, px: 24 }
  };
  var ICONS = {
    send: ["M21 3 10 14", "M21 3 14.5 21 10 14 3 9.5 21 3Z"],
    delete: ["M4 7h16", "M9 7V4h6v3", "M6 7l1 13h10l1-13", "M10 11v6", "M14 11v6"],
    undo: ["M9 14 4 9l5-5", "M4 9h10.5a5.5 5.5 0 0 1 0 11H11"],
    tick: ["m5 12.5 4.5 4.5L19 7"]
  };
  var PRESETS = {
    send: { label: "Kirim", undoLabel: "Batalkan", doneLabel: "Terkirim", armedNote: "Akan dikirim. Tekan Batalkan atau Escape untuk membatalkan.", icon: "send" },
    delete: { label: "Hapus", undoLabel: "Batalkan", doneLabel: "Dihapus", armedNote: "Akan dihapus. Tekan Batalkan atau Escape untuk membatalkan.", icon: "delete" }
  };
  var LINE = [{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }];
  var OUTLINE = [{ strokeDashoffset: 0 }, { strokeDashoffset: -1 }];
  var uid = 0;

  function icon(name, size, stroke) {
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", size); svg.setAttribute("height", size);
    svg.setAttribute("fill", "none"); svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", stroke); svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");
    (ICONS[name] || []).forEach(function (d) { var p = document.createElementNS(NS, "path"); p.setAttribute("d", d); svg.appendChild(p); });
    return svg;
  }
  function span(cls) { var s = document.createElement("span"); s.className = cls; return s; }

  window.FuseButton = function (opts) {
    var preset = PRESETS[opts.preset] || PRESETS.send;
    var o = {
      label: opts.label || preset.label,
      undoLabel: opts.undoLabel || preset.undoLabel,
      doneLabel: opts.doneLabel || preset.doneLabel,
      armedNote: opts.armedNote || preset.armedNote,
      icon: opts.icon || preset.icon,
      size: SIZES[opts.size] ? opts.size : "md",
      radius: opts.radius != null ? opts.radius : 16,
      undoWindow: opts.undoWindow || 4000,
      fuse: opts.fuse || "outline",
      fuseThickness: opts.fuseThickness != null ? opts.fuseThickness : 1,
      crossfadeMs: opts.crossfadeMs != null ? opts.crossfadeMs : 210,
      commitOn: opts.commitOn || "fuseEnd",
      pauseOnHover: opts.pauseOnHover !== false,
      settle: opts.settle || "reset",
      type: opts.type || "button",
      armOnClick: opts.armOnClick !== false
    };
    var sz = SIZES[o.size];
    var phase = "idle", disabled = !!opts.disabled, anim = null, timer = null;
    var pause = { hover: false, hidden: false, canHoverPause: false };
    var lastInput = "pointer";
    var statusId = "fb-status-" + (++uid);

    var root = span("fuse-button fuse-" + (opts.preset || "send") + (opts.className ? " " + opts.className : ""));
    root.tabIndex = -1;
    root.setAttribute("data-phase", "idle");
    root.setAttribute("data-fuse", o.fuse);
    var vars = {
      "--fb-fuse-h": o.fuseThickness + "px", "--fb-radius": o.radius + "px", "--fb-fade": o.crossfadeMs + "ms",
      "--fb-h": sz.height + "px", "--fb-fs": sz.font + "px", "--fb-icon": sz.icon + "px", "--fb-px": sz.px + "px"
    };
    Object.keys(vars).forEach(function (k) { root.style.setProperty(k, vars[k]); });

    var idle = document.createElement("button");
    idle.type = o.type; idle.className = "fuse-button__face fuse-button__idle";
    var ii = span("fuse-button__icon"); ii.setAttribute("aria-hidden", "true"); ii.appendChild(icon(o.icon, sz.icon, 1.8));
    idle.appendChild(ii); idle.appendChild(document.createTextNode(o.label));
    if (opts.ariaLabel) idle.setAttribute("aria-label", opts.ariaLabel);

    var undo = document.createElement("button");
    undo.type = "button"; undo.className = "fuse-button__face fuse-button__undo";
    undo.setAttribute("aria-describedby", statusId); undo.setAttribute("aria-keyshortcuts", "Escape");
    var ui = span("fuse-button__icon fuse-button__icon--undo"); ui.setAttribute("aria-hidden", "true"); ui.appendChild(icon("undo", sz.icon, 2));
    undo.appendChild(ui); undo.appendChild(document.createTextNode(o.undoLabel));
    var line = null;
    if (o.fuse !== "outline") { line = document.createElement("i"); line.className = "fuse-button__fuse"; line.setAttribute("aria-hidden", "true"); undo.appendChild(line); }

    var settled = span("fuse-button__face fuse-button__settled");
    var si = span("fuse-button__icon"); si.setAttribute("aria-hidden", "true"); si.appendChild(icon("tick", sz.icon, 2.2));
    settled.appendChild(si); settled.appendChild(document.createTextNode(o.doneLabel));

    root.appendChild(idle); root.appendChild(undo); root.appendChild(settled);
    var rim = null;
    if (o.fuse === "outline") {
      var svg = document.createElementNS(NS, "svg"); svg.setAttribute("class", "fuse-button__rim"); svg.setAttribute("aria-hidden", "true");
      rim = document.createElementNS(NS, "rect"); rim.setAttribute("pathLength", "1");
      svg.appendChild(rim); root.appendChild(svg);
    }
    var status = span("fuse-button__status"); status.id = statusId; status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
    root.appendChild(status);

    function setInert(el, on) { el.inert = on; if (on) el.setAttribute("inert", ""); else el.removeAttribute("inert"); }
    function applyPhase() {
      root.setAttribute("data-phase", phase);
      if (lastInput === "keyboard") root.setAttribute("data-instant", ""); else root.removeAttribute("data-instant");
      setInert(idle, phase !== "idle"); setInert(undo, phase !== "armed"); setInert(settled, phase !== "settled");
      if (phase === "settled") root.setAttribute("aria-disabled", "true"); else root.removeAttribute("aria-disabled");
      idle.disabled = disabled;
    }
    function go(next) {
      var inside = root.contains(document.activeElement);
      phase = next; applyPhase();
      status.textContent = next === "armed" ? o.armedNote : "";
      if (next === "armed") undo.focus({ preventScroll: true });
      else if (inside) (next === "idle" ? idle : root).focus({ preventScroll: true });
      if (opts.onPhaseChange) opts.onPhaseChange(next);
    }

    /* Waktu sumbu dihitung dengan jam sendiri, bukan dari animasi. Animasi hanya tampilan:
       jam animasi bisa berhenti (tab latar belakang, iframe yang dibatasi browser), dan
       pengiriman atau penghapusan tidak boleh ikut macet karenanya. */
    var clock = { base: 0, since: null };
    function now() { return window.performance && performance.now ? performance.now() : Date.now(); }
    function elapsed() { return clock.base + (clock.since != null ? now() - clock.since : 0); }
    function schedule() {
      clearTimeout(timer);
      if (clock.since == null) return;
      timer = setTimeout(finish, Math.max(0, o.undoWindow - elapsed()));
    }
    function syncPlayState() {
      var held = pause.hover || pause.hidden;
      if (held && clock.since != null) {
        clock.base = elapsed(); clock.since = null; clearTimeout(timer);
        if (anim) { anim.pause(); anim.currentTime = clock.base; }
      } else if (!held && clock.since == null && phase === "armed") {
        clock.since = now(); schedule();
        if (anim) { anim.currentTime = clock.base; anim.play(); }
      }
    }
    function finish() {
      if (phase !== "armed") return;
      stopFuse();
      if (opts.onFuseEnd) opts.onFuseEnd();
      if (o.commitOn === "fuseEnd" && opts.onCommit) opts.onCommit("fuseEnd");
      lastInput = "pointer";
      go(o.settle === "stay" ? "settled" : "idle");
    }
    function light(from) {
      var target = o.fuse === "outline" ? rim : line;
      stopFuse();
      clock.base = from || 0; clock.since = now();
      if (target && target.animate) {
        anim = target.animate(o.fuse === "outline" ? OUTLINE : LINE, { duration: o.undoWindow, easing: "linear", fill: "forwards" });
        anim.currentTime = clock.base;
      }
      schedule();
      syncPlayState();
    }
    function stopFuse() {
      if (anim) { anim.cancel(); anim = null; }
      clearTimeout(timer); timer = null;
      clock.since = null; clock.base = 0;
    }

    function arm(from) {
      if (disabled || phase !== "idle") return false;
      light(from || 0);
      pause.canHoverPause = false; pause.hover = false;
      if (o.commitOn === "press" && opts.onCommit) opts.onCommit("press");
      go("armed");
      return true;
    }
    function cancel() {
      if (phase !== "armed") return;
      stopFuse();
      if (opts.onUndo) opts.onUndo();
      go("idle");
    }

    idle.addEventListener("click", function () { if (o.armOnClick) arm(); });
    undo.addEventListener("click", cancel);
    root.addEventListener("pointerdown", function (e) {
      lastInput = "pointer";
      if (e.button === 0 && (phase === "armed" || (phase === "idle" && !disabled))) root.setAttribute("data-pressed", "");
    });
    function release() { root.removeAttribute("data-pressed"); }
    root.addEventListener("pointerup", release);
    root.addEventListener("pointercancel", release);
    root.addEventListener("pointerenter", function (e) {
      if (o.pauseOnHover && e.pointerType === "mouse" && pause.canHoverPause) { pause.hover = true; syncPlayState(); }
    });
    root.addEventListener("pointerleave", function (e) {
      release();
      if (e.pointerType !== "mouse") return;
      pause.canHoverPause = true; pause.hover = false; syncPlayState();
    });
    root.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") lastInput = "keyboard";
      if (e.key === "Escape" && phase === "armed") { e.preventDefault(); e.stopPropagation(); lastInput = "keyboard"; cancel(); }
    });
    document.addEventListener("visibilitychange", function () { pause.hidden = document.hidden; syncPlayState(); });

    applyPhase();
    return {
      el: root,
      arm: arm,
      cancel: cancel,
      /* Lanjutkan sumbu yang sudah berjalan (misalnya setelah daftar digambar ulang). */
      resume: function (ms) { return arm(ms); },
      elapsed: elapsed,
      /* Matikan tanpa menjalankan aksi atau Batalkan. */
      detach: function () { stopFuse(); },
      phase: function () { return phase; },
      setDisabled: function (on) { disabled = !!on; applyPhase(); },
      markKeyboard: function () { lastInput = "keyboard"; }
    };
  };
})();
