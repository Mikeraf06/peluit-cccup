/*
 * Tampilan website
 * Semua teks dari pengguna ditampilkan dengan textContent (tidak pernah innerHTML),
 * supaya tidak ada yang bisa menyisipkan kode berbahaya (XSS) lewat forum.
 */
(function () {
  "use strict";

  var D = window.CC_DATA;
  var B = window.Backend;
  var CFG = window.PELUIT_CONFIG || {};
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Helpers */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { append(el, x); }); return; }
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

  var RULES = {};
  D.sop.forEach(function (s) { s.r.forEach(function (r) { RULES[r.c] = { sec: s.n, t: r.t, note: r.note || "" }; }); });
  var TOKEN_RE = /(\[[^\]]+\]|\b(?:PU|KP|KU|PP|PT|TP|DP|KH|PL|LL)-\d{1,2}\b)/g;

  /* Teks [isi ...] di data.js berarti belum diisi. Pengunjung tidak melihatnya:
     kalimat yang memuatnya dibuang, atau seluruh bagiannya disembunyikan. */
  var TODO_RE = /\[[^\]]*\]/;
  function isTodo(s) { return TODO_RE.test(String(s == null ? "" : s)); }
  /* Buang kalimat yang masih berisi [isi ...]. Hasil kosong berarti belum ada isi sama sekali. */
  function filled(s) {
    s = String(s == null ? "" : s);
    if (!isTodo(s)) return s;
    return (s.match(/[^.!?]+[.!?]*/g) || []).filter(function (x) { return !isTodo(x); }).join("").trim();
  }
  function orLater(s, fallback) { return isTodo(s) ? fallback : s; }

  /* Kode pasal jadi tombol. Sisa [isi ...] yang lolos ditulis "menyusul". Aman: hanya membuat text node. */
  function rich(text) {
    var frag = document.createDocumentFragment();
    String(text == null ? "" : text).split(TOKEN_RE).forEach(function (part) {
      if (!part) return;
      if (/^\[[^\]]+\]$/.test(part)) frag.appendChild(h("span", { class: "later" }, "menyusul"));
      else if (RULES[part]) frag.appendChild(codeBtn(part));
      else frag.appendChild(document.createTextNode(part));
    });
    return frag;
  }
  function codeBtn(c) { return h("button", { type: "button", class: "code", "data-code": c, "aria-label": "Buka aturan " + c }, c); }
  function fmtTime(ms) {
    if (!ms) return "";
    try { return new Date(ms).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
    catch (e) { return ""; }
  }
  function num(v) { return typeof v === "number" && isFinite(v); }
  function emptyState(title, text) { return h("div", { class: "empty" }, h("b", null, title), text ? h("span", null, text) : null); }

  /* Form dengan tombol bersumbu: setelah Kirim ditekan ada 4 detik untuk Batalkan,
     baru setelah itu benar-benar dikirim. onSubmit boleh mengembalikan { ok: "teks sukses" }.
     precheck (opsional) dijalankan sebelum sumbu menyala; kembalikan teks error untuk menahan. */
  function form(fields, submitLabel, onSubmit, precheck) {
    var msg = h("span", { class: "form-msg", role: "status" });
    var busy = false, f;
    var fb = window.FuseButton({
      preset: "send", label: submitLabel, type: "submit", armOnClick: false,
      onCommit: function () { send(); },
      onUndo: function () { msg.className = "form-msg"; msg.textContent = "Dibatalkan. Belum ada yang terkirim."; }
    });
    f = h("form", { class: "form" }, fields, h("div", { class: "form-foot" }, msg, fb.el));
    f.addEventListener("keydown", function (e) { if (e.key === "Enter") fb.markKeyboard(); });
    // Validasi bawaan browser (required, minlength) berjalan dulu, lalu sumbu menyala.
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (busy || fb.phase() !== "idle") return;
      var problem = precheck ? precheck(f) : "";
      if (problem) { msg.className = "form-msg err"; msg.textContent = problem; return; }
      msg.className = "form-msg"; msg.textContent = "Dikirim saat garis habis.";
      fb.arm();
    });
    function send() {
      busy = true; fb.setDisabled(true);
      msg.className = "form-msg"; msg.textContent = "Mengirim…";
      Promise.resolve().then(function () { return onSubmit(f); }).then(function (res) {
        f.reset(); msg.textContent = res && typeof res.ok === "string" ? res.ok : "Terkirim.";
      }).catch(function (err) {
        msg.className = "form-msg err"; msg.textContent = B.friendlyError(err) || "Gagal mengirim. Coba lagi.";
      }).then(function () { busy = false; fb.setDisabled(false); });
    }
    return f;
  }

  /* Tombol hapus bersumbu. Data baru dihapus saat sumbu habis; Batalkan berarti tidak terjadi apa-apa.
     Sumbu yang sedang menyala dicatat di sini, jadi kalau daftar digambar ulang (misalnya ada kiriman
     baru masuk), tombol yang baru melanjutkan sumbu yang sama dan aksinya hanya jalan sekali. */
  var pendingDeletes = {};
  function deleteFuse(key, run, label) {
    var errBox = null;
    function item() { return fb.el.closest ? fb.el.closest(".item") : null; }
    var fb = window.FuseButton({
      preset: "delete", label: label || "Hapus", size: "sm",
      onPhaseChange: function (p) {
        if (p === "armed" && !pendingDeletes[key]) pendingDeletes[key] = { fb: fb, fired: false };
        var it = item(); if (it) it.classList.toggle("deleting", p === "armed");
      },
      onUndo: function () { delete pendingDeletes[key]; },
      onCommit: function () {
        var p = pendingDeletes[key];
        if (!p || p.fired) return;
        p.fired = true;
        Promise.resolve().then(run).then(function () { delete pendingDeletes[key]; }).catch(function (e) {
          delete pendingDeletes[key];
          var it = item(); if (it) it.classList.remove("deleting");
          if (!errBox) { errBox = h("p", { class: "form-msg err", role: "alert" }); if (fb.el.parentNode) fb.el.parentNode.appendChild(errBox); }
          errBox.textContent = B.friendlyError(e) || "Gagal menghapus. Coba lagi.";
        });
      }
    });
    var old = pendingDeletes[key];
    if (old && !old.fired) {
      var t = old.fb.elapsed();
      old.fb.detach();
      old.fb = fb;
      fb.resume(t);
      // Tombol baru belum terpasang di halaman saat ini; tandai kirimannya setelah terpasang.
      setTimeout(function () { var it = item(); if (it && fb.phase() === "armed") it.classList.add("deleting"); }, 0);
    }
    return fb.el;
  }
  function field(label, el) { return h("label", null, label, el); }
  /* Email jadi tautan mailto (membuka aplikasi email). Teks tetap textContent, jadi aman. */
  function mailLink(email, subject) {
    email = String(email || "");
    if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email)) return email;
    return h("a", { href: "mailto:" + email + (subject ? "?subject=" + encodeURIComponent(subject) : "") }, email);
  }

  var ROLE_LABEL = { pengguna: "Pengguna", panitia: "Panitia", admin: "Admin" };
  var PROVIDER_NAME = { "google.com": "Google", "password": "Email" };
  var SOCIAL_LABEL = { google: "Google" };

  /* Rule dialog */
  var dlg = $("#ruleDlg");
  function openRule(code) {
    var r = RULES[code]; if (!r) return;
    $("#ruleDlgSec").textContent = "SOP Mini Soccer · " + r.sec;
    $("#ruleDlgCode").textContent = code;
    $("#ruleDlgText").textContent = r.t;
    $("#ruleDlgNote").textContent = r.note ? "Catatan: " + r.note : "";
    if (typeof dlg.showModal === "function") { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute("open", "");
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-code]");
    if (b) { e.preventDefault(); openRule(b.getAttribute("data-code")); }
  });

  /* Tabs helper */
  function makeTabs(listEl, onChange) {
    var tabs = [].slice.call(listEl.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
      if (onChange) onChange(tab.id);
    }
    tabs.forEach(function (t, i) {
      t.type = "button";
      t.tabIndex = t.getAttribute("aria-selected") === "true" ? 0 : -1;
      t.addEventListener("click", function () { select(t); });
      t.addEventListener("keydown", function (e) {
        var j = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
        if (j == null) return;
        e.preventDefault(); select(tabs[(j + tabs.length) % tabs.length], true);
      });
    });
    return { select: function (id) { var t = document.getElementById(id); if (t) select(t); } };
  }

  /* Hero */
  (function () {
    var m = D.hasil.knockout[0];
    $("#heroScore").textContent = (num(m.sa) ? m.sa : "–") + " : " + (num(m.sb) ? m.sb : "–");
    $("#heroAsk").addEventListener("click", function () { Chat.open(); });
    $("#openChat").addEventListener("click", function () { Chat.open(); });
  })();

  /* Fenomena & solusi */
  var STAT = { turunan: "Turunan", adaptasi: "Adaptasi diizinkan", tambahan: "Tambahan penyelenggara", menyimpang: "Penyimpangan", ambigu: "Tidak jelas" };
  (function renderFenomena() {
    var f = D.fenomena, s = f.solusi, root = $("#fenomenaBody");
    var left = h("div", null,
      h("div", { class: "case-meta" }, h("span", null, f.match), isTodo(f.when) ? null : h("span", null, rich(f.when))),
      h("ol", { class: "timeline" }, f.kronologi.map(function (k, i) {
        var text = filled(k);
        return text ? h("li", { class: i === 1 || i === 2 ? "hot" : null }, h("p", null, rich(text))) : null;
      })));
    var right = h("div", { class: "problem" },
      h("div", { class: "problem-box" },
        h("h3", null, "Masalah"),
        h("p", null, rich(f.masalah)),
        h("div", { class: "asas" }, f.asas.map(function (a) {
          return h("div", null, h("b", null, "Asas: " + a.nama), h("span", null, rich(a.isi)));
        }))));
    root.appendChild(h("div", { class: "case-grid" }, left, right));

    var sol = h("div", { class: "solution" },
      h("h3", null, "Solusi"),
      h("p", null, rich(s.ringkas)),
      h("div", { class: "map" }, s.fitur.map(function (x) {
        return h("div", { class: "map-row" },
          h("div", null, h("span", { class: "lbl" }, "Masalah"), rich(x.masalah)),
          h("span", { class: "arrow", "aria-hidden": "true" }, "→"),
          h("div", null, h("span", { class: "lbl" }, "Jawaban di website"), document.getElementById(x.link.slice(1)) ? h("a", { href: x.link }, rich(x.fitur)) : rich(x.fitur)));
      })),
      h("h3", { id: "usulan", class: "sub-h" }, "Usulan pasal untuk SOP berikutnya"),
      h("div", { class: "usulan" }, s.usulan.map(function (u) {
        return h("article", null, h("h4", null, u.judul), h("p", null, rich(u.isi)));
      })),
      !s.ukuran || isTodo(s.ukuran) ? null : h("p", { class: "measure" }, h("b", null, "Ukuran keberhasilan: "), rich(s.ukuran)),
      h("details", { class: "cmp" },
        h("summary", null, "Perbandingan aturan CC Cup dan IFAB Laws of the Game 2026/27"),
        h("div", { class: "cmp-table-wrap" }, h("table", { class: "cmp-table" },
          h("thead", null, h("tr", null, ["Aturan", "Status", "IFAB", "SOP CC Cup", "Asas"].map(function (t) { return h("th", { scope: "col" }, t); }))),
          h("tbody", null, D.cmp.map(function (c) {
            return h("tr", null,
              h("td", null, h("b", null, c.n)),
              h("td", null, h("span", { class: "tag tag-" + c.s }, STAT[c.s] || c.s)),
              h("td", null, c.ifab, h("br"), h("span", { class: "muted small" }, c.ir)),
              h("td", null, c.cc, " ", c.codes.map(function (x) { return [codeBtn(x), " "]; })),
              h("td", null, rich(c.a)));
          }))))));
    root.appendChild(sol);
  })();

  /* Hasil pertandingan */
  (function renderHasil() {
    var root = $("#hasilBody");
    var realPools = D.hasil.pools.map(function (p) {
      return { name: p.name, teams: p.teams.filter(function (t) { return !isTodo(t.name); }) };
    }).filter(function (p) { return p.teams.length; });
    var pools = !realPools.length
      ? emptyState("Pembagian pool belum diumumkan panitia.", "Klasemen tampil di sini setelah tim di setiap pool diumumkan.")
      : h("div", { class: "pools" }, realPools.map(function (p) {
      var rows = p.teams.map(function (t) {
        var has = num(t.w) && num(t.d) && num(t.l);
        return { t: t, has: has, pts: has ? t.w * 3 + t.d : null, gd: num(t.gf) && num(t.ga) ? t.gf - t.ga : null };
      });
      var any = rows.some(function (r) { return r.has; });
      if (any) rows.sort(function (a, b) {
        return (b.pts || 0) - (a.pts || 0) || (b.gd || 0) - (a.gd || 0) || ((b.t.gf || 0) - (a.t.gf || 0));
      });
      function c(v) { return num(v) ? v : "–"; }
      // Tanpa angka hasil: cukup daftar tim, bukan tabel klasemen kosong.
      if (!any) return h("div", { class: "pool" }, h("h3", null, p.name),
        h("ul", { class: "pool-teams" }, p.teams.map(function (t) { return h("li", null, rich(t.name)); })));
      return h("div", { class: "pool" }, h("h3", null, p.name),
        h("table", { class: "standings" },
          h("thead", null, h("tr", null,
            h("th", { scope: "col" }, "Tim"), h("th", { scope: "col", title: "Main" }, "MN"), h("th", { scope: "col", title: "Menang" }, "M"),
            h("th", { scope: "col", title: "Seri" }, "S"), h("th", { scope: "col", title: "Kalah" }, "K"),
            h("th", { scope: "col", title: "Selisih gol" }, "SG"), h("th", { scope: "col", title: "Poin" }, "P"))),
          h("tbody", null, rows.map(function (r, i) {
            var t = r.t;
            var played = r.has ? t.w + t.d + t.l : null;
            return h("tr", { class: any && i === 0 ? "lead" : null },
              h("td", null, rich(t.name)), h("td", null, c(played)), h("td", null, c(t.w)), h("td", null, c(t.d)), h("td", null, c(t.l)),
              h("td", null, r.gd == null ? "–" : (r.gd > 0 ? "+" : "") + r.gd), h("td", { class: "pts" }, c(r.pts)));
          }))));
    }));
    root.appendChild(pools);
    root.appendChild(h("h3", { class: "sub-h" }, "Babak gugur"));
    root.appendChild(h("div", { class: "bracket" }, D.hasil.knockout.map(function (m) {
      function row(name, sc, side) {
        var tbd = isTodo(name);
        return h("div", { class: "match-row" + (m.winner === side ? " win" : "") + (tbd ? " tbd" : "") },
          h("span", { class: "nm" }, tbd ? "Belum ditentukan" : rich(name)), h("span", { class: "sc" }, num(sc) ? sc : "–"));
      }
      return h("article", { class: "match" + (m.round === "Final" ? " final" : "") },
        h("span", { class: "eyebrow" }, m.round),
        row(m.a, m.sa, "a"), row(m.b, m.sb, "b"),
        m.note ? h("p", { class: "match-note" }, rich(m.note)) : null);
    })));
  })();

  /* Info acara */
  var infoTabs = makeTabs($(".info-tabs"));
  (function renderInfo() {
    $("#ip-rundown").appendChild(h("div", { class: "days" }, D.rundown.map(function (d) {
      return h("div", { class: "day" },
        h("h3", null, orLater(d.day, "Hari berikutnya"), h("small", null, orLater(d.date, "Tanggal menyusul"))),
        d.items.map(function (it) {
          return h("div", { class: "slot" },
            h("span", { class: "t" + (isTodo(it.time) ? " later" : "") }, orLater(it.time, "Jam menyusul")),
            h("div", null, h("b", null, rich(it.what)),
              isTodo(it.where) ? null : h("span", { class: "w" }, rich(it.where)),
              filled(it.note) ? h("span", { class: "w" }, rich(filled(it.note))) : null));
        }));
    })));

    $("#ip-tempat").appendChild(h("div", { class: "venues" }, D.venues.filter(function (v) { return !isTodo(v.cabang); }).map(function (v) {
      return h("div", { class: "venue" }, h("b", null, rich(v.cabang)),
        h("span", null, isTodo(v.tempat) ? h("span", { class: "later" }, "Tempat menyusul") : rich(v.tempat),
          v.tanggal ? h("span", { class: "muted small venue-date" }, v.tanggal) : null),
        v.sumber ? codeBtn(v.sumber) : h("span"));
    })));

    var aturan = $("#ip-aturan");
    var search = h("input", { class: "rule-search", type: "search", id: "ruleSearch", placeholder: "Cari aturan: sepatu, usia, protes…", "aria-label": "Cari aturan" });
    function ruleRow(r) { return h("div", { class: "rule-row", "data-q": (r.c + " " + r.t + " " + (r.note || "")).toLowerCase() }, h("span", { class: "rc" }, r.c), h("div", null, r.t, r.note ? h("span", { class: "rn" }, "Catatan: " + r.note) : null)); }
    var pu = D.sop.filter(function (s) { return s.k === "PU"; })[0];
    var all = h("details", { class: "all-sop" }, h("summary", null, "Seluruh SOP Mini Soccer CC Cup XLI"),
      D.sop.filter(function (s) { return s.k !== "PU"; }).map(function (s) {
        return h("div", { class: "sop-sec" }, h("h4", null, s.n), h("div", { class: "rules-list" }, s.r.map(ruleRow)));
      }));
    var noRes = h("p", { class: "muted", hidden: true }, "Tidak ada aturan yang cocok. Coba kata lain, atau tanya lewat tombol Tanya.");
    aturan.appendChild(h("p", { class: "muted" }, "Peraturan umum berlaku untuk semua peserta CC Cup XLI. Sumber: SOP Mini Soccer CC Cup XLI."));
    aturan.appendChild(search);
    aturan.appendChild(h("div", { class: "rules-list" }, pu.r.map(ruleRow)));
    aturan.appendChild(all);
    aturan.appendChild(noRes);
    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase(), shown = 0;
      [].forEach.call(aturan.querySelectorAll(".rule-row"), function (row) {
        var ok = !q || row.getAttribute("data-q").indexOf(q) >= 0; row.hidden = !ok; if (ok) shown++;
      });
      if (q) all.open = true;
      noRes.hidden = shown > 0;
    });

    $("#ip-dress").appendChild(h("div", { class: "dress" }, D.dresscode.filter(function (d) { return !isTodo(d.aturan); }).map(function (d) {
      return h("article", null, h("span", { class: "who" }, d.siapa), h("p", null, rich(d.aturan)), d.kode ? h("span", null, codeBtn(d.kode)) : null);
    })));
    $("#ip-dress").appendChild(h("p", { class: "ban" }, h("b", null, "Barang terlarang. "), rich(D.larangan)));

    var den = $("#ip-denah");
    var box = h("div", { class: "denah" });
    var img = h("img", { src: D.denah.image, alt: "Denah Kolese Kanisius dengan lokasi setiap lomba", loading: "lazy", width: "1600", height: "1000" });
    img.addEventListener("error", function () {
      var note = filled(D.denah.note);
      clear(box).appendChild(emptyState("Denah sekolah belum tersedia.", note || "Untuk sementara, lihat tab Tempat lomba untuk lokasi setiap cabang."));
    });
    box.appendChild(img);
    den.appendChild(box);
  })();

  /* Tentang CC Cup */
  (function renderAbout() {
    var e = D.event, root = $("#aboutBody");
    root.appendChild(h("div", { class: "about-grid" },
      h("div", { class: "about-text" }, h("h3", null, "Latar belakang"),
        e.background.filter(function (p) { return !isTodo(p); }).map(function (p) { return h("p", null, rich(p)); }),
        h("p", { class: "muted" }, "Tempat: " + e.host + (isTodo(e.dates) ? "." : ". Tanggal: " + e.dates + "."))),
      h("aside", { class: "theme-box" }, h("span", { class: "eyebrow" }, "Tema CC Cup XLI"), h("p", { class: "big" }, rich(e.theme)), h("p", { class: "muted" }, rich(e.themeMeaning)))));

    // Dokumentasi dan koordinator hanya tampil kalau datanya sudah diisi di data.js.
    var doc = e.dokumentasi || {};
    if (/^https:\/\//.test(doc.url || "")) {
      root.appendChild(h("div", { class: "doc-link" }, h("h3", { class: "sub-h" }, "Dokumentasi"),
        h("p", null, h("a", { class: "btn btn-line", href: doc.url, target: "_blank", rel: "noopener noreferrer" }, doc.label || "Buka folder dokumentasi"),
          h("span", { class: "muted small" }, " Foto dan video CC Cup XLI. Terbuka di tab baru."))));
    }

    var koor = D.koorbid.filter(function (p) { return !isTodo(p.nama) && !isTodo(p.jabatan); });
    if (koor.length) {
      root.appendChild(h("h3", { class: "sub-h" }, "Koordinator bidang mini soccer"));
      // Dikelompokkan per jenjang (SMP, SMA), urut sesuai data.js.
      var groups = [];
      koor.forEach(function (p) {
        var key = p.jenjang || "";
        var g = groups.filter(function (x) { return x.key === key; })[0];
        if (!g) { g = { key: key, list: [] }; groups.push(g); }
        g.list.push(p);
      });
      groups.forEach(function (g) {
        if (g.key) root.appendChild(h("h4", { class: "people-group" }, g.key));
        root.appendChild(h("div", { class: "people" }, g.list.map(function (p) {
          return h("div", { class: "person" }, h("span", { class: "role" }, p.jabatan), h("b", null, p.nama), isTodo(p.kelas) ? null : h("span", { class: "muted" }, "Kelas " + p.kelas));
        })));
      });
    }
    root.appendChild(h("p", { class: "muted small sub-h" }, "Untuk menghubungi panitia, pakai forum Tanya-jawab atau Masukan & kritik di bawah."));
  })();

  /* Buka halaman lain di index.html (lihat js/pages.js). */
  function goPage(id) {
    if (window.Pages) window.Pages.go(id);
    else { var el = document.getElementById(id); if (el) el.scrollIntoView({ block: "start" }); }
  }

  /* Forum */
  var Forum = (function () {
    var CATS = D.announcementCategories;
    var CAT_LABEL = {}; CATS.forEach(function (c) { CAT_LABEL[c.id] = c.label; });
    var TOPICS = ["Mini soccer", "Badminton", "Basket", "Acara umum", "Tiket & closing", "Website", "Lainnya"];
    var data = { announcements: [], posts: [], questions: [], feedback: [], replies: [] };
    var annFilter = "all", thread = null, unsubReplies = null, unsubFeedback = null, replyForm = null;
    var user = null, isAdmin = false, role = "pengguna";
    var panels = {};
    ["info", "diskusi", "qna", "masukan"].forEach(function (k) {
      var p = document.getElementById("fp-" + k);
      panels[k] = { form: h("div"), extra: h("div"), list: h("div", { class: "list" }) };
      p.appendChild(panels[k].form); p.appendChild(panels[k].extra); p.appendChild(panels[k].list);
    });
    var tabs = makeTabs($(".forum-tabs"));

    var authMsg = h("span", { class: "form-msg err" });
    /* Bilah akun: nama, peran, ID akun (untuk diberikan ke admin), ganti password, keluar. */
    function renderAuth() {
      var bar = clear($("#authBar"));
      if (!user) {
        bar.appendChild(h("div", { class: "who" }, h("span", null, "Masuk untuk ikut berdiskusi, bertanya, atau mengirim masukan.")));
        bar.appendChild(authMsg);
        return;
      }
      bar.appendChild(h("div", { class: "who" }, h("span", null, "Masuk sebagai ", h("b", null, user.name)), h("span", { class: "badge" }, ROLE_LABEL[role] || "Pengguna")));
      var copyMsg = h("span", { class: "muted small", "aria-live": "polite" });
      var copyBtn = h("button", { type: "button", class: "link-btn" }, "Salin");
      copyBtn.addEventListener("click", function () {
        var done = function () { copyMsg.textContent = " Tersalin."; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(user.uid).then(done, function () { copyMsg.textContent = " Salin manual."; });
        else copyMsg.textContent = " Salin manual.";
      });
      bar.appendChild(h("p", { class: "acct-id small" }, "ID akun: ", h("code", null, user.uid), " ", copyBtn, copyMsg,
        role === "pengguna" ? h("span", { class: "muted" }, " Berikan ID ini ke admin kalau kamu perlu akses panitia.") : null));
      var actions = h("div", { class: "login-btns" });
      if (user.provider === "password") {
        var pwBox = h("div", { class: "pw-box", hidden: true });
        var toggle = h("button", { type: "button", class: "btn btn-line btn-small" }, "Ganti password");
        toggle.addEventListener("click", function () {
          pwBox.hidden = !pwBox.hidden;
          if (!pwBox.hidden && !pwBox.firstChild) {
            var oldPw = h("input", { type: "password", id: "pwOld", autocomplete: "current-password", required: true, maxlength: "128" });
            var newPw = h("input", { type: "password", id: "pwNew", autocomplete: "new-password", required: true, minlength: String(B.minPassword), maxlength: "128" });
            pwBox.appendChild(form([field("Password lama", oldPw), field("Password baru (min. " + B.minPassword + " karakter)", newPw)], "Simpan password", function () {
              return B.changePassword(oldPw.value, newPw.value).then(function () { oldPw.value = ""; newPw.value = ""; return { ok: "Password sudah diganti." }; });
            }));
          }
        });
        actions.appendChild(toggle);
        bar.appendChild(actions);
        actions.appendChild(h("button", { type: "button", class: "btn btn-line btn-small", onclick: function () { B.signOut(); } }, "Keluar"));
        bar.appendChild(pwBox);
      } else {
        actions.appendChild(h("button", { type: "button", class: "btn btn-line btn-small", onclick: function () { B.signOut(); } }, "Keluar"));
        bar.appendChild(actions);
      }
      bar.appendChild(authMsg);
    }
    function needLogin(text) {
      return h("div", { class: "empty" }, h("b", null, text), h("span", null, "Membaca tidak perlu login."));
    }
    function delBtn(path, id) { return deleteFuse(path + "/" + id, function () { return B.remove(path, id); }); }
    /* Kiriman sendiri boleh dihapus pemiliknya. Kiriman orang lain hanya oleh admin.
       Panitia sama dengan pengguna di sini. Aturan yang berlaku tetap firestore.rules. */
    function canDelete(item) { return !!user && (role === "admin" || item.authorUid === user.uid); }

    /* Pengumuman */
    function renderInfoForm() {
      var p = clear(panels.info.form);
      if (!isAdmin) return;
      var sel = h("select", { id: "annCat" }, CATS.map(function (c) { return h("option", { value: c.id }, c.label); }));
      var ti = h("input", { id: "annTitle", minlength: "3", maxlength: B.limits.title, required: true });
      var bo = h("textarea", { id: "annBody", maxlength: B.limits.body, required: true });
      p.appendChild(form([h("h3", null, "Buat pengumuman"), h("div", { class: "form-row" }, field("Kategori", sel), field("Judul", ti)), field("Isi", bo)],
        "Umumkan", function () { return B.add("announcements", { category: sel.value, title: ti.value, body: bo.value }); }));
    }
    var chipsEl = h("div", { class: "chips", role: "group", "aria-label": "Saring pengumuman" });
    panels.info.extra.appendChild(chipsEl);
    function renderChips() {
      clear(chipsEl);
      [{ id: "all", label: "Semua" }].concat(CATS).forEach(function (c) {
        chipsEl.appendChild(h("button", { type: "button", class: "chip", "aria-pressed": annFilter === c.id ? "true" : "false",
          onclick: function () { annFilter = c.id; renderChips(); renderInfoList(); } }, c.label));
      });
    }
    function renderInfoList() {
      var l = clear(panels.info.list);
      var items = data.announcements.filter(function (a) { return annFilter === "all" || a.category === annFilter; });
      if (!items.length) { l.appendChild(emptyState("Belum ada pengumuman" + (annFilter === "all" ? "." : " di kategori ini."), "Pengumuman resmi panitia akan muncul di sini.")); return; }
      items.forEach(function (a) {
        l.appendChild(h("article", { class: "item" },
          h("div", { class: "item-meta" }, h("span", { class: "cat" }, CAT_LABEL[a.category] || "Umum"), h("span", null, fmtTime(a.createdAt)), h("span", null, a.authorName)),
          h("h4", null, a.title), h("p", { class: "body" }, a.body),
          canDelete(a) ? h("div", { class: "item-actions" }, delBtn("announcements", a.id)) : null));
      });
    }

    /* Diskusi */
    function renderDiskusiForm() {
      var p = clear(panels.diskusi.form);
      if (thread) return;
      if (!user) { p.appendChild(needLogin("Masuk untuk membuat topik diskusi.")); return; }
      var ti = h("input", { id: "postTitle", minlength: "3", maxlength: B.limits.title, required: true });
      var bo = h("textarea", { id: "postBody", maxlength: B.limits.body, required: true });
      p.appendChild(form([h("h3", null, "Topik baru"), field("Judul", ti), field("Isi", bo),
        h("p", { class: "muted small" }, "Jaga sportivitas (PU-4). Jangan menulis data pribadi seperti nomor HP.")],
        "Kirim topik", function () { return B.add("posts", { title: ti.value, body: bo.value }); }));
    }
    function renderDiskusiList() {
      var l = clear(panels.diskusi.list);
      if (thread) {
        var post = data.posts.filter(function (x) { return x.id === thread; })[0];
        if (!post) { thread = null; renderDiskusiForm(); renderDiskusiList(); return; }
        l.appendChild(h("button", { type: "button", class: "link-btn thread-back", onclick: function () { closeThread(); } }, "← Semua topik"));
        l.appendChild(h("article", { class: "item" },
          h("div", { class: "item-meta" }, h("span", null, post.authorName), h("span", null, fmtTime(post.createdAt))),
          h("h4", null, post.title), h("p", { class: "body" }, post.body),
          canDelete(post) ? h("div", { class: "item-actions" }, delBtn("posts", post.id)) : null));
        var reps = h("div", { class: "replies" });
        if (!data.replies.length) reps.appendChild(h("p", { class: "muted small" }, "Belum ada balasan."));
        data.replies.forEach(function (r) {
          reps.appendChild(h("div", { class: "item" },
            h("div", { class: "item-meta" }, h("span", null, r.authorName), h("span", null, fmtTime(r.createdAt))),
            h("p", { class: "body" }, r.body),
            canDelete(r) ? h("div", { class: "item-actions" }, delBtn("posts/" + post.id + "/replies", r.id)) : null));
        });
        l.appendChild(reps);
        if (user) {
          // Form balasan dibuat sekali per topik, supaya tulisan dan sumbu kirim tidak hilang
          // saat daftar balasan digambar ulang karena ada balasan baru masuk.
          if (!replyForm || replyForm.thread !== post.id) {
            var bo = h("textarea", { id: "replyBody", maxlength: B.limits.reply, required: true });
            var pid = post.id;
            replyForm = { thread: pid, el: form([field("Balas", bo)], "Kirim balasan", function () { return B.add("posts/" + pid + "/replies", { body: bo.value }); }) };
          }
          l.appendChild(replyForm.el);
        } else l.appendChild(needLogin("Masuk untuk membalas."));
        return;
      }
      if (!data.posts.length) { l.appendChild(emptyState("Belum ada topik.", "Mulai diskusi pertama soal lomba atau aturan.")); return; }
      data.posts.forEach(function (p) {
        l.appendChild(h("article", { class: "item" },
          h("div", { class: "item-meta" }, h("span", null, p.authorName), h("span", null, fmtTime(p.createdAt))),
          h("h4", null, p.title),
          h("p", { class: "body muted" }, p.body.length > 180 ? p.body.slice(0, 180) + "…" : p.body),
          h("div", { class: "item-actions" }, h("button", { type: "button", class: "link-btn", onclick: function () { openThread(p.id); } }, "Buka dan balas"))));
      });
    }
    function openThread(id) {
      thread = id; data.replies = [];
      if (unsubReplies) unsubReplies();
      unsubReplies = B.watch("posts/" + id + "/replies", function (items) { if (items) { data.replies = items; renderDiskusiList(); } }, { asc: true });
      renderDiskusiForm(); renderDiskusiList();
      document.getElementById("forum").scrollIntoView({ block: "start" });
    }
    function closeThread() { thread = null; if (unsubReplies) { unsubReplies(); unsubReplies = null; } renderDiskusiForm(); renderDiskusiList(); }

    /* Tanya-jawab */
    function renderQnaForm() {
      var p = clear(panels.qna.form);
      if (!user) { p.appendChild(needLogin("Masuk untuk bertanya ke panitia.")); return; }
      var q = h("textarea", { id: "qText", minlength: "5", maxlength: B.limits.question, required: true, placeholder: "Tulis pertanyaanmu untuk panitia." });
      p.appendChild(form([h("h3", null, "Tanya panitia"), field("Pertanyaan", q), h("p", { class: "muted small" }, "Coba tombol Tanya dulu. Chatbot bisa menjawab banyak pertanyaan soal aturan.")],
        "Kirim pertanyaan", function () { return B.add("questions", { question: q.value }); }));
    }
    function renderQnaList() {
      var l = clear(panels.qna.list);
      if (!data.questions.length) { l.appendChild(emptyState("Belum ada pertanyaan.", "Pertanyaan dan jawaban panitia akan muncul di sini.")); return; }
      data.questions.forEach(function (q) {
        var it = h("article", { class: "item" },
          h("div", { class: "item-meta" }, h("span", null, q.authorName), h("span", null, fmtTime(q.createdAt))),
          h("h4", null, q.question));
        if (q.answer) it.appendChild(h("div", { class: "answer" }, h("span", { class: "lbl" }, "Jawaban " + (q.answeredBy || "panitia")), h("p", { class: "body" }, q.answer)));
        else it.appendChild(h("p", { class: "pending" }, "Belum dijawab panitia."));
        if (isAdmin && !q.answer) {
          var ta = h("textarea", { id: "ans-" + q.id, maxlength: B.limits.answer, required: true });
          it.appendChild(form([field("Jawab sebagai panitia", ta)], "Kirim jawaban", function () { return B.answer(q.id, ta.value); }));
        }
        if (canDelete(q)) it.appendChild(h("div", { class: "item-actions" }, delBtn("questions", q.id)));
        l.appendChild(it);
      });
    }

    /* Masukan, kritik & keluhan */
    var FB_TYPE = { masukan: "Masukan", kritik: "Kritik", keluhan: "Keluhan" };
    function renderMasukanForm() {
      var p = clear(panels.masukan.form);
      if (!user) { p.appendChild(needLogin("Masuk untuk mengirim masukan, kritik, atau keluhan.")); return; }
      var type = h("select", { id: "fbType" }, Object.keys(FB_TYPE).map(function (k) { return h("option", { value: k }, FB_TYPE[k]); }));
      var topic = h("select", { id: "fbTopic" }, TOPICS.map(function (t) { return h("option", { value: t }, t); }));
      var body = h("textarea", { id: "fbBody", minlength: "10", maxlength: B.limits.feedback, required: true, placeholder: "Ceritakan apa yang terjadi dan apa yang kamu harapkan." });
      p.appendChild(form([h("h3", null, "Kirim masukan, kritik, atau keluhan"),
        h("div", { class: "form-row" }, field("Jenis", type), field("Topik", topic)), field("Isi", body),
        h("p", { class: "muted small" }, "Hanya kamu dan panitia yang bisa membaca kirimanmu. Untuk protes resmi hasil pertandingan, serahkan juga protes tertulis ke panitia (PU-21).")],
        "Kirim", function () { return B.add("feedback", { type: type.value, topic: topic.value, body: body.value }); }));
    }
    var STATUS = { diterima: "Diterima", diproses: "Diproses", selesai: "Selesai" };
    function renderMasukanList() {
      var l = clear(panels.masukan.list);
      if (!user) return;
      l.appendChild(h("h3", { class: "sub-h" }, isAdmin ? "Semua kiriman (panitia)" : "Kirimanmu"));
      if (!data.feedback.length) { l.appendChild(emptyState("Belum ada kiriman.", null)); return; }
      data.feedback.forEach(function (f) {
        var st = h("span", { class: "status st-" + f.status }, STATUS[f.status] || f.status);
        var it = h("article", { class: "item" },
          h("div", { class: "item-meta" }, h("span", { class: "cat" }, FB_TYPE[f.type] || "Masukan"), h("span", null, f.topic), h("span", null, fmtTime(f.createdAt)), isAdmin ? h("span", null, f.authorName) : null, st),
          h("p", { class: "body" }, f.body));
        var actions = h("div", { class: "item-actions" });
        if (isAdmin) {
          var sel = h("select", { id: "st-" + f.id, "aria-label": "Ubah status" }, Object.keys(STATUS).map(function (k) { var o = h("option", { value: k }, STATUS[k]); if (k === f.status) o.selected = true; return o; }));
          sel.addEventListener("change", function () { B.setStatus(f.id, sel.value).catch(function (e) { alertInline(it, B.friendlyError(e)); }); });
          actions.appendChild(h("label", { class: "check" }, "Status ", sel));
        }
        if (canDelete(f)) actions.appendChild(delBtn("feedback", f.id));
        if (actions.firstChild) it.appendChild(actions);
        l.appendChild(it);
      });
    }
    function alertInline(el, text) { el.appendChild(h("p", { class: "form-msg err" }, text)); }

    /* Subscriptions */
    function watchErr(items) { return items == null; }
    B.watch("announcements", function (items) { if (watchErr(items)) return; data.announcements = items; renderInfoList(); Chat.refresh(); });
    B.watch("posts", function (items) { if (watchErr(items)) return; data.posts = items; renderDiskusiList(); });
    B.watch("questions", function (items) { if (watchErr(items)) return; data.questions = items; renderQnaList(); });
    function resubFeedback() {
      if (unsubFeedback) unsubFeedback();
      data.feedback = [];
      unsubFeedback = user ? B.watch("feedback", function (items) { if (watchErr(items)) return; data.feedback = items; renderMasukanList(); }) : null;
      renderMasukanList();
    }

    B.onAuth(function (u, admin, r) {
      var changed = (u && u.uid) !== (user && user.uid) || admin !== isAdmin || r !== role;
      user = u; isAdmin = admin; role = r;
      if (changed) replyForm = null;
      renderAuth();
      if (!changed && panels.info.form.childNodes.length + panels.diskusi.form.childNodes.length > 0) return;
      renderInfoForm(); renderChips(); renderInfoList();
      renderDiskusiForm(); renderDiskusiList();
      renderQnaForm(); renderQnaList();
      renderMasukanForm(); resubFeedback();
    });

    return {
      goQnA: function () { tabs.select("ft-qna"); goPage("forum"); },
      announcements: function () { return data.announcements; },
      catLabel: function (id) { return CAT_LABEL[id] || "Umum"; }
    };
  })();

  /* Gerbang login dan penanda akun di header */
  (function gate() {
    var gateEl = $("#gate"), body = $("#gateBody"), acct = $("#acct"), outBtn = $("#signOutTop");
    var behind = [$(".top"), $("#main"), $(".foot"), $("#chat")];
    var shown = null;
    var mode = "masuk"; // "masuk", "daftar", atau "lupa"
    var COPY = {
      masuk: { title: "Masuk", lead: "Masuk dengan email (Gmail) dan password akun Peluit kamu." },
      daftar: { title: "Buat akun", lead: "Buat akun Peluit dengan email (Gmail) dan password. Setelah itu kamu tetap masuk setiap kali membuka website ini." },
      lupa: { title: "Lupa password", lead: "Website ini tidak mengirim email, jadi password tidak bisa direset lewat email." },
      setup: { title: "Belum tersambung", lead: "Website ini belum tersambung ke database Firebase." },
      file: { title: "Buka lewat server", lead: "Website ini dibuka langsung dari file, jadi login tidak bisa dipakai." }
    };

    function lock(on) {
      gateEl.hidden = !on;
      behind.forEach(function (el) { if (on) el.setAttribute("inert", ""); else el.removeAttribute("inert"); });
      document.documentElement.classList.toggle("locked", on);
    }

    /* Bagian formulir */
    var uid = 0;
    function input(label, attrs, hint) {
      var id = "g-" + (++uid);
      var hintId = hint ? id + "-hint" : null;
      var el = h("input", Object.assign({ id: id, class: "g-input", "aria-describedby": hintId }, attrs));
      return { el: el, node: h("div", { class: "g-field" }, h("label", { for: id }, label), el, hint ? h("p", { class: "g-hint", id: hintId }, hint) : null) };
    }
    function passwordInput(label, autocomplete, hint) {
      var f = input(label, { type: "password", autocomplete: autocomplete, required: true, maxlength: "128", minlength: autocomplete === "new-password" ? String(B.minPassword) : null }, hint);
      var toggle = h("button", { type: "button", class: "g-reveal", "aria-controls": f.el.id, "aria-pressed": "false" }, "Tampilkan");
      toggle.addEventListener("click", function () {
        var show = f.el.type === "password";
        f.el.type = show ? "text" : "password";
        toggle.textContent = show ? "Sembunyikan" : "Tampilkan";
        toggle.setAttribute("aria-pressed", show ? "true" : "false");
      });
      var wrap = h("div", { class: "g-pass" }, f.el, toggle);
      f.node.insertBefore(wrap, f.node.children[1]);
      return f;
    }
    /* Login selalu tersimpan di perangkat ini sampai menekan Keluar, jadi tidak ada pilihan "Ingat saya". */
    function remember() {
      return { el: { checked: true }, node: h("p", { class: "g-hint g-saved" }, "Tetap masuk di perangkat ini sampai kamu menekan Keluar.") };
    }
    function switchLink(text, label, target) {
      return h("p", { class: "g-switch" }, text, h("button", { type: "button", class: "g-link g-strong", onclick: function () { show(target); } }, label));
    }
    /* Tombol masuk tambahan (Google), kalau diaktifkan di config.js. */
    function socials(msg) {
      var list = (CFG.providers || []).filter(function (p) { return p === "google"; });
      if (!list.length) return null;
      var btns = list.map(function (p) {
        return h("button", { type: "button", class: "g-social", onclick: function () {
          msg.className = "g-msg"; msg.textContent = "";
          btns.forEach(function (b) { b.disabled = true; });
          B.signIn(p)
            .catch(function (e) { msg.className = "g-msg err"; msg.textContent = B.friendlyError(e); })
            .then(function () { btns.forEach(function (b) { b.disabled = false; }); });
        }, "aria-label": "Lanjut dengan Google" }, h("span", { class: "prov prov-" + p, "aria-hidden": "true" }, "G"), SOCIAL_LABEL[p] || p);
      });
      return [h("p", { class: "g-divider" }, h("span", null, "atau")), h("div", { class: "g-socials" }, btns)];
    }
    /* Formulir dengan tombol utama dan pesan status. run() mengembalikan Promise; teks sukses opsional. */
    function gateForm(fields, submitLabel, run) {
      var msg = h("p", { class: "g-msg", role: "alert" });
      var btn = h("button", { type: "submit", class: "g-submit" }, submitLabel);
      var f = h("form", { class: "g-form" }, fields, btn, msg);
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        msg.className = "g-msg"; msg.textContent = "";
        btn.disabled = true; btn.textContent = "Memproses…";
        Promise.resolve().then(run).then(function (okText) {
          if (okText) { msg.className = "g-msg ok"; msg.textContent = okText; }
        }).catch(function (err) {
          msg.className = "g-msg err"; msg.textContent = B.friendlyError(err) || "Dibatalkan.";
        }).then(function () { btn.disabled = false; btn.textContent = submitLabel; });
      });
      return { form: f, msg: msg };
    }

    function loginView() {
      var em = input("Email (Gmail)", { type: "email", autocomplete: "username", required: true, maxlength: String(B.limits.email), placeholder: "nama@gmail.com", value: B.lastEmail() || null });
      var pw = passwordInput("Password", "current-password");
      var rm = remember();
      var forgot = h("button", { type: "button", class: "g-link", onclick: function () { show("lupa"); } }, "Lupa password?");
      var g = gateForm([em.node, pw.node, h("div", { class: "g-row" }, rm.node, forgot)], "Masuk", function () {
        return B.signInEmail(em.el.value, pw.el.value);
      });
      return [g.form, socials(g.msg), switchLink("Belum punya akun? ", "Buat akun", "daftar")];
    }
    function registerView() {
      var nm = input("Nama lengkap", { type: "text", autocomplete: "name", required: true, maxlength: String(B.limits.name) });
      var em = input("Email (Gmail)", { type: "email", autocomplete: "email", required: true, maxlength: String(B.limits.email), placeholder: "nama@gmail.com" },
        "Dipakai untuk masuk. Tidak ada email yang dikirim ke alamat ini.");
      var pw = passwordInput("Password", "new-password", "Minimal " + B.minPassword + " karakter. Catat baik-baik: password tidak bisa direset lewat email.");
      var pw2 = passwordInput("Ulangi password", "new-password");
      function sameCheck() { pw2.el.setCustomValidity(pw2.el.value && pw2.el.value !== pw.el.value ? "Password tidak sama." : ""); }
      pw.el.addEventListener("input", sameCheck); pw2.el.addEventListener("input", sameCheck);
      var rm = remember();
      var g = gateForm([nm.node, em.node, pw.node, pw2.node, h("div", { class: "g-row" }, rm.node)], "Buat akun", function () {
        sameCheck();
        if (!pw2.el.checkValidity()) throw Object.assign(new Error(), { code: "invalid", message: "Password tidak sama." });
        return B.register(nm.el.value, em.el.value, pw.el.value);
      });
      return [g.form, socials(g.msg), switchLink("Sudah punya akun? ", "Masuk", "masuk")];
    }
    function forgotView() {
      return [
        h("div", { class: "g-form" },
          h("p", null, "Minta bantuan admin website. Admin bisa menghapus akunmu di Firebase Console (Authentication > Users), lalu kamu membuat akun baru dengan email yang sama."),
          h("p", { class: "g-hint" }, "Kalau masih bisa masuk, ganti password kapan saja dari halaman Forum.")),
        h("p", { class: "g-switch" }, h("button", { type: "button", class: "g-link g-strong", onclick: function () { show("masuk"); } }, "Kembali ke Masuk"))
      ];
    }
    /* Firebase Authentication tidak bisa dipakai dari alamat file:// (index.html diklik dua kali). */
    function fileView() {
      return [h("div", { class: "g-form" },
        h("p", null, "Tutup tab ini, lalu klik dua kali file jalankan.bat di folder peluit-cccup. Website akan terbuka di http://localhost:5500 dan login (email maupun Google) bisa dipakai."),
        h("p", { class: "g-hint" }, "Setelah website di-publish ke Netlify, cukup buka alamat Netlify-nya.")),
        h("p", { class: "g-switch" }, h("a", { class: "g-link g-strong", href: "http://localhost:5500/" }, "Sudah menjalankan jalankan.bat? Buka http://localhost:5500"))];
    }
    function setupView() {
      return [h("div", { class: "g-form" },
        h("p", null, "Admin perlu mengisi konfigurasi Firebase di file js/config.js. Langkahnya ada di README bagian \"Menyambungkan Firebase\"."),
        h("p", { class: "g-hint" }, "Setelah diisi, muat ulang halaman ini."))];
    }
    function show(m) {
      mode = m;
      $("#gateTitle").textContent = COPY[m].title;
      $("#gateLead").textContent = COPY[m].lead;
      clear(body);
      append(body, m === "daftar" ? registerView() : m === "lupa" ? forgotView() : m === "setup" ? setupView() : m === "file" ? fileView() : loginView());
      var first = [].filter.call(body.querySelectorAll("input"), function (i) { return !i.value; })[0] || body.querySelector("input");
      if (first) first.focus();
    }
    function renderAcct(u, role) {
      clear(acct);
      outBtn.hidden = !u;
      if (!u) { acct.hidden = true; return; }
      acct.hidden = false;
      var prov = PROVIDER_NAME[u.provider] || "Akun";
      acct.title = "Masuk sebagai " + (u.email || u.name) + " lewat " + prov + " (" + (ROLE_LABEL[role] || role) + ")";
      acct.appendChild(h("span", { class: "prov prov-" + String(u.provider).split(".")[0], "aria-hidden": "true" }, prov.charAt(0)));
      acct.appendChild(h("span", { class: "acct-mail" }, u.email || u.name));
      acct.appendChild(h("span", { class: "badge acct-role role-" + role }, ROLE_LABEL[role] || role));
    }
    outBtn.addEventListener("click", function () { B.signOut(); });

    /* Loading screen: tetap tampil minimal sebentar supaya tidak berkedip, lalu memudar. */
    var loader = $("#loader"), loaderText = $("#loaderText");
    var started = (window.performance && performance.now) ? performance.now() : 0;
    var fontsReady = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 2500); })]) : Promise.resolve();
    var hideTimer = null;
    function setLoading(on, text) {
      clearTimeout(hideTimer);
      if (on) { loaderText.textContent = text; loader.classList.remove("done"); loader.removeAttribute("aria-hidden"); return; }
      fontsReady.then(function () {
        var wait = Math.max(0, 700 - ((window.performance && performance.now) ? performance.now() - started : 0));
        hideTimer = setTimeout(function () { loader.classList.add("done"); loader.setAttribute("aria-hidden", "true"); }, REDUCED ? 0 : wait);
      });
    }

    B.onAuth(function (u, staff, role) {
      renderAcct(u, role);
      if (window.SiteNav) window.SiteNav.setHidden("#akses", role !== "admin");
      $("#akses").hidden = role !== "admin";
      if (window.Pages) window.Pages.refresh();
      var view = !B.authChecked ? "wait" : !u ? "login" : "in";
      if (view === shown) return;
      shown = view;
      if (view === "wait") { setLoading(true, u ? "Memeriksa akses akunmu…" : "Memeriksa login…"); return; }
      setLoading(false);
      if (view === "in") { lock(false); return; }
      lock(true);
      // Belum ada konfigurasi Firebase: tidak ada yang bisa masuk.
      // Perangkat yang belum pernah dipakai masuk langsung diarahkan untuk membuat akun dulu.
      show(location.protocol === "file:" ? "file" : !B.configured ? "setup" : B.hasAccounts() ? "masuk" : "daftar");
    });

    /* Tidak ada email verifikasi: akun langsung bisa dipakai setelah dibuat. */
  })();

  /* Laporan kejadian */
  (function laporan() {
    var LEVELS = [
      { id: "sangat_tinggi", label: "Sangat tinggi", hint: "Kekerasan fisik berat atau ada yang terluka" },
      { id: "tinggi", label: "Tinggi", hint: "Perkelahian, pemukulan, atau ancaman" },
      { id: "sedang", label: "Sedang", hint: "Saling dorong, provokasi, atau ejekan kasar" },
      { id: "rendah", label: "Rendah", hint: "Pelanggaran aturan tanpa kekerasan" },
      { id: "sangat_rendah", label: "Sangat rendah", hint: "Masalah kecil atau catatan" }
    ];
    var LEVEL_LABEL = {}; LEVELS.forEach(function (l) { LEVEL_LABEL[l.id] = l.label; });
    var STATUS = { diterima: "Diterima", diproses: "Diproses", selesai: "Selesai" };
    var formEl = $("#laporanForm"), filterEl = $("#laporanFilter"), listEl = $("#laporanList"), intro = $("#laporanIntro");
    var user = null, role = "pengguna", staff = false, items = [], unsub = null, levelFilter = "all", subKey = null;

    /* Foto diperkecil dan diubah ke JPEG di browser. Data lokasi (EXIF) ikut terhapus. */
    function shrinkPhoto(file) {
      return new Promise(function (resolve, reject) {
        var fr = new FileReader();
        fr.onerror = function () { reject(new Error("read")); };
        fr.onload = function () {
          var img = new Image();
          img.onerror = function () { reject(new Error("decode")); };
          img.onload = function () {
            var w = img.naturalWidth, hgt = img.naturalHeight;
            var tries = [[1600, 0.8], [1280, 0.75], [1024, 0.7], [800, 0.65], [640, 0.6]];
            for (var i = 0; i < tries.length; i++) {
              var s = Math.min(1, tries[i][0] / Math.max(w, hgt));
              var c = document.createElement("canvas");
              c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(hgt * s));
              var ctx = c.getContext("2d");
              ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
              ctx.drawImage(img, 0, 0, c.width, c.height);
              var out = c.toDataURL("image/jpeg", tries[i][1]);
              if (out.indexOf("data:image/jpeg;base64,") === 0 && out.length <= B.limits.photo - 2000) { resolve(out); return; }
            }
            reject(new Error("too-big"));
          };
          img.src = fr.result;
        };
        fr.readAsDataURL(file);
      });
    }

    function renderForm() {
      clear(formEl);
      if (!user) return;
      var photo = "", processing = false;
      var ti = h("input", { id: "lpTitle", minlength: "3", maxlength: B.limits.title, required: true, placeholder: "Contoh: Saling dorong setelah semifinal" });
      var kr = h("textarea", { id: "lpKronologi", minlength: "20", maxlength: B.limits.kronologi, required: true, rows: "7",
        placeholder: "Ceritakan urutannya: kapan dan di mana kejadiannya, siapa yang terlibat (nama tim atau nomor punggung), apa yang terjadi, dan apa yang terjadi sesudahnya." });
      var levels = h("fieldset", { class: "levels" }, h("legend", null, "Tingkat laporan"),
        h("div", { class: "level-grid" }, LEVELS.map(function (l, i) {
          return h("label", { class: "level lv-" + l.id },
            h("input", { type: "radio", name: "lpLevel", value: l.id, required: i === 0 }),
            h("span", { class: "lv-name" }, l.label), h("span", { class: "lv-hint" }, l.hint));
        })));
      var file = h("input", { type: "file", id: "lpPhoto", accept: "image/*" });
      var prev = h("div", { class: "photo-prev", hidden: true });
      var pmsg = h("span", { class: "form-msg", role: "status" });
      function clearPhoto() { photo = ""; file.value = ""; clear(prev); prev.hidden = true; }
      file.addEventListener("change", function () {
        photo = ""; clear(prev); prev.hidden = true; pmsg.className = "form-msg"; pmsg.textContent = "";
        var f = file.files && file.files[0]; if (!f) return;
        if (!/^image\//.test(f.type)) { pmsg.className = "form-msg err"; pmsg.textContent = "File harus berupa foto."; file.value = ""; return; }
        if (f.size > 25 * 1024 * 1024) { pmsg.className = "form-msg err"; pmsg.textContent = "Foto terlalu besar (maks. 25 MB)."; file.value = ""; return; }
        processing = true; pmsg.textContent = "Memproses foto…";
        shrinkPhoto(f).then(function (url) {
          photo = url;
          prev.appendChild(h("img", { src: url, alt: "Pratinjau bukti foto" }));
          prev.appendChild(h("button", { type: "button", class: "btn btn-line btn-small", onclick: function () { clearPhoto(); pmsg.textContent = "Foto dihapus."; } }, "Hapus foto"));
          prev.hidden = false;
          pmsg.textContent = "Foto siap (" + Math.round(url.length * 0.75 / 1024) + " KB).";
        }).catch(function () {
          clearPhoto(); pmsg.className = "form-msg err"; pmsg.textContent = "Foto tidak bisa dibaca. Coba foto JPG atau PNG lain.";
        }).then(function () { processing = false; });
      });
      var f = form([
        h("h3", null, "Buat laporan"),
        field("Judul singkat", ti),
        field("Kronologi kejadian", kr),
        levels,
        h("div", { class: "photo-field" }, field("Bukti foto (opsional)", file), pmsg, prev),
        h("p", { class: "muted small" }, "Laporanmu hanya bisa dibaca kamu dan panitia. Tulis apa adanya dan jangan menulis nomor HP atau alamat rumah.")
      ], "Kirim laporan", function () {
        var lv = formEl.querySelector('input[name="lpLevel"]:checked');
        return B.addReport({ title: ti.value, kronologi: kr.value, level: lv ? lv.value : "", photo: photo })
          .then(function () { return { ok: "Laporan terkirim. Panitia akan menindaklanjuti." }; });
      }, function () { return processing ? "Tunggu foto selesai diproses." : ""; });
      f.addEventListener("reset", function () { clearPhoto(); pmsg.className = "form-msg"; pmsg.textContent = ""; });
      formEl.appendChild(f);
    }

    function renderFilter() {
      clear(filterEl);
      if (!staff) return;
      var count = {}; items.forEach(function (r) { count[r.level] = (count[r.level] || 0) + 1; });
      filterEl.appendChild(h("h3", { class: "sub-h" }, "Semua laporan"));
      filterEl.appendChild(h("div", { class: "chips", role: "group", "aria-label": "Saring tingkat laporan" },
        [{ id: "all", label: "Semua" }].concat(LEVELS).map(function (l) {
          var n = l.id === "all" ? items.length : (count[l.id] || 0);
          return h("button", { type: "button", class: "chip", "aria-pressed": levelFilter === l.id ? "true" : "false",
            onclick: function () { levelFilter = l.id; renderFilter(); renderList(); } }, l.label + " (" + n + ")");
        })));
    }

    function photoBlock(r) {
      var box = h("div", { class: "report-photo" });
      var btn = h("button", { type: "button", class: "link-btn" }, "Lihat bukti foto");
      btn.addEventListener("click", function () {
        btn.disabled = true; btn.textContent = "Memuat foto…";
        B.getReportPhoto(r.id).then(function (url) {
          clear(box);
          if (url && url.indexOf("data:image/jpeg;base64,") === 0) box.appendChild(h("img", { src: url, alt: "Bukti foto laporan: " + r.title }));
          else box.appendChild(h("p", { class: "muted small" }, "Foto tidak ditemukan."));
        }).catch(function (e) { btn.disabled = false; btn.textContent = B.friendlyError(e) || "Gagal memuat. Coba lagi"; });
      });
      box.appendChild(btn);
      return box;
    }

    function renderList() {
      clear(listEl);
      if (!user) return;
      if (!staff) listEl.appendChild(h("h3", { class: "sub-h" }, "Laporanmu"));
      var shownItems = items.filter(function (r) { return levelFilter === "all" || r.level === levelFilter; });
      if (!shownItems.length) {
        listEl.appendChild(emptyState(staff ? "Belum ada laporan" + (levelFilter === "all" ? "." : " di tingkat ini.") : "Kamu belum membuat laporan.", staff ? null : "Laporan yang kamu kirim dan statusnya akan muncul di sini."));
        return;
      }
      shownItems.forEach(function (r) {
        var it = h("article", { class: "item report lvl-" + r.level },
          h("div", { class: "item-meta" },
            h("span", { class: "lvl-tag lvl-tag-" + r.level }, LEVEL_LABEL[r.level] || r.level),
            h("span", { class: "status st-" + r.status }, STATUS[r.status] || r.status),
            h("span", null, fmtTime(r.createdAt)),
            staff ? h("span", null, r.authorName, r.authorEmail ? [" · ", mailLink(r.authorEmail, "Laporan: " + r.title)] : null) : null),
          h("h4", null, r.title),
          h("p", { class: "body" }, r.kronologi),
          r.hasPhoto ? photoBlock(r) : null);
        if (staff) {
          var sel = h("select", { id: "lpst-" + r.id, "aria-label": "Ubah status laporan" }, Object.keys(STATUS).map(function (k) {
            var o = h("option", { value: k }, STATUS[k]); if (k === r.status) o.selected = true; return o;
          }));
          sel.addEventListener("change", function () {
            B.setReportStatus(r.id, sel.value).catch(function (e) { it.appendChild(h("p", { class: "form-msg err" }, B.friendlyError(e))); });
          });
          it.appendChild(h("div", { class: "item-actions" }, h("label", { class: "check" }, "Status ", sel),
            role === "admin" ? deleteFuse("reports/" + r.id, function () { return B.remove("reports", r.id); }) : null));
        }
        listEl.appendChild(it);
      });
    }

    function resub() {
      var key = user ? user.uid + "|" + staff : null;
      if (key === subKey) return;
      subKey = key;
      if (unsub) { unsub(); unsub = null; }
      items = []; levelFilter = "all";
      if (user) unsub = B.watch("reports", function (list, err) {
        if (list == null) { clear(listEl).appendChild(emptyState("Laporan tidak bisa dimuat.", B.friendlyError(err))); return; }
        items = list; renderFilter(); renderList();
      });
    }

    B.onAuth(function (u, isStaff, r) {
      var formChanged = (u && u.uid) !== (user && user.uid) || r !== role;
      user = u; staff = isStaff; role = r;
      intro.textContent = staff
        ? "Sebagai " + ROLE_LABEL[role].toLowerCase() + ", kamu bisa membaca semua laporan dan mengubah statusnya. Kamu juga tetap bisa membuat laporan."
        : "Ceritakan kejadian di mini soccer CC Cup XLI, misalnya keributan, kekerasan, atau pelanggaran. Laporan hanya bisa dibaca kamu dan panitia.";
      if (formChanged || !formEl.firstChild) renderForm();
      resub(); renderFilter(); renderList();
    });
  })();

  /* Atur akses (hanya admin). Peran diberikan ke ID akun (UID), bukan ke email,
     karena email akun tidak diverifikasi dan bisa dipakai orang lain saat mendaftar. */
  (function akses() {
    var formEl = $("#aksesForm"), listEl = $("#aksesList");
    var user = null, adminKey = null, unsub = null;

    function roleSelect(id, value) {
      var s = h("select", { id: id },
        h("option", { value: "panitia" }, "Panitia: melihat dan memproses laporan"),
        h("option", { value: "admin" }, "Admin: panitia + mengatur akses"));
      if (value) s.value = value;
      return s;
    }

    function renderForm() {
      clear(formEl);
      var id = h("input", { id: "shareUid", type: "text", maxlength: "128", required: true, placeholder: "Contoh: a1B2c3D4e5F6g7H8i9J0k1L2m3N4", autocomplete: "off", spellcheck: "false" });
      var nm = h("input", { id: "shareLabel", type: "text", maxlength: String(B.limits.label), required: true, placeholder: "Nama orang itu", autocomplete: "off" });
      var rl = roleSelect("shareRole");
      formEl.appendChild(form([
        h("h3", null, "Bagikan akses"),
        field("ID akun", id),
        h("div", { class: "form-row" }, field("Nama (untuk daftar ini)", nm), field("Peran", rl)),
        h("p", { class: "muted small" }, "Orang itu menyalin ID akunnya dari halaman Forum (bagian atas), lalu memberikannya kepadamu. Peran langsung aktif tanpa perlu keluar-masuk.")
      ], "Bagikan akses", function () {
        var label = nm.value.trim(), r = ROLE_LABEL[rl.value];
        return B.shareAccess(id.value, rl.value, label).then(function () {
          return { ok: label + " sekarang " + r + "." };
        });
      }));
    }

    function renderList(items) {
      clear(listEl);
      listEl.appendChild(h("h3", { class: "sub-h" }, "Daftar akses"));
      if (!items.length) { listEl.appendChild(emptyState("Belum ada panitia atau admin yang dibagikan.", "Admin utama yang didaftarkan lewat Firebase Console tidak muncul di sini.")); return; }
      items.forEach(function (x) {
        var me = user && x.id === user.uid;
        var rs = roleSelect("role-" + x.id, x.role);
        rs.setAttribute("aria-label", "Ubah peran " + (x.label || x.id));
        var it = h("article", { class: "item" },
          h("div", { class: "item-meta" },
            h("span", { class: "badge acct-role role-" + x.role }, ROLE_LABEL[x.role] || x.role),
            h("span", null, "Dibagikan " + (x.addedByName ? "oleh " + x.addedByName + " " : "") + fmtTime(x.createdAt))),
          h("h4", null, x.label || "Tanpa nama", me ? h("span", { class: "muted small" }, " (kamu)") : null),
          h("p", { class: "muted small" }, "ID akun: ", h("code", null, x.id)));
        rs.addEventListener("change", function () {
          B.shareAccess(x.id, rs.value, x.label || "Tanpa nama").catch(function (e) { rs.value = x.role; it.appendChild(h("p", { class: "form-msg err" }, B.friendlyError(e))); });
        });
        it.appendChild(h("div", { class: "item-actions" }, h("label", { class: "check" }, "Peran ", rs),
          deleteFuse("roles/" + x.id, function () { return B.removeAccess(x.id); }, me ? "Cabut aksesku" : "Cabut akses")));
        listEl.appendChild(it);
      });
    }

    B.onAuth(function (u, staff, role) {
      user = u;
      var key = u && role === "admin" ? u.uid : null;
      if (key === adminKey) return;
      adminKey = key;
      if (unsub) { unsub(); unsub = null; }
      clear(formEl); clear(listEl);
      if (!key) return;
      renderForm();
      unsub = B.watch("roles", function (items, err) {
        if (items == null) { clear(listEl).appendChild(emptyState("Daftar akses tidak bisa dimuat.", B.friendlyError(err))); return; }
        renderList(items);
      });
    });
  })();

  /* Chatbot */
  var Chat = (function () {
    var panel = $("#chat"), log = $("#chatLog"), input = $("#chatInput"), sug = $("#chatSug");
    var greeted = false, history = [], busy = false;
    var useAI = typeof CFG.aiEndpoint === "string" && /^\/[A-Za-z0-9/._-]+$/.test(CFG.aiEndpoint);
    $("#chatMode").textContent = useAI ? "Dijawab AI dari SOP dan info panitia." : "Mode tanpa AI: mencari jawaban di SOP dan info panitia.";

    var STOP = "yang apa di ke dari dan atau itu ini kalau kalo gimana bagaimana berapa ada aku saya kami kita apakah untuk dengan bisa boleh kah nya jika saat pada ga gak nggak tidak mau dong sih ya kak tolong dapat jadi akan sudah udah tau tahu mana siapa kapan".split(" ");
    var GROUPS = [
      ["ribut", "keributan", "berkelahi", "kelahi", "berantem", "ricuh", "tawuran", "bertengkar", "dorong", "ejek", "provokasi"],
      ["seri", "imbang", "draw", "penalti", "adu", "undian"],
      ["denda", "bayar", "rp", "rupiah", "biaya", "uang"],
      ["telat", "terlambat", "wo", "walk", "datang"],
      ["umur", "usia", "lahir", "tahun"],
      ["profesional", "porda", "o2sn", "osn", "atlet", "pplp", "kejurnas", "popnas", "kejurda"],
      ["sepatu", "baju", "pakaian", "kaos", "dresscode", "celana", "sandal", "seragam", "rompi", "pelindung"],
      ["tiket", "closing", "harga"],
      ["makan", "makanan", "jajan", "stand", "minum", "kantin"],
      ["hilang", "barang", "ketinggalan", "temu", "ditemukan"],
      ["juara", "pemenang", "hadiah", "menang", "final"],
      ["jadwal", "rundown", "jam", "acara", "mulai"],
      ["tempat", "lokasi", "lapangan", "dimana", "ruang", "gedung", "denah"],
      ["kartu", "kuning", "merah", "pelanggaran"],
      ["ganti", "pergantian", "substitusi", "cadangan"],
      ["protes", "komplain", "keluhan", "banding"],
      ["peserta", "pemain", "regu", "tim", "kiper"],
      ["durasi", "menit", "babak", "lama", "waktu"],
      ["dokumentasi", "foto", "video", "drive"],
      ["tema", "latar", "sejarah"],
      ["panitia", "koorbid", "koordinator", "narahubung"],
      ["skor", "hasil", "klasemen", "pool", "poin"]
    ];
    var SYN = {}; GROUPS.forEach(function (g) { g.forEach(function (w) { SYN[w] = g; }); });
    var SEC_KEYS = { PU: "umum peserta aturan", KP: "syarat pemain kriteria peserta", KU: "kuota jumlah tim", PP: "aturan pertandingan main", PT: "tunda ditunda hujan gangguan", TP: "sistem pool gugur klasemen", DP: "durasi waktu menit babak lama istirahat", KH: "hadir kehadiran walk out", PL: "kartu pelanggaran denda sanksi", LL: "suporter penonton nyanyi" };

    function tok(s) {
      return String(s || "").toLowerCase().replace(/[^a-z0-9\- ]+/g, " ").split(/\s+/).filter(function (w) { return w.length > 1 && STOP.indexOf(w) < 0; });
    }
    /* Kata kunci tambahan untuk pasal yang sering ditanyakan. */
    var BOOST = {
      "PP-7": "seri imbang draw penalti undian pemenang", "TP-4": "seri imbang draw penalti undian semifinal final",
      "KH-1": "telat terlambat datang menit", "KH-4": "telat terlambat wo kalah",
      "KP-10": "sepatu pul futsal kaos kaki pelindung", "PU-7": "sepatu sandal crocs",
      "PU-12": "keributan ribut berkelahi sanksi diskualifikasi setelah laga pertandingan",
      "PU-16": "umur usia batas", "PU-19": "atlet profesional o2sn osn tidak boleh ikut",
      "PU-21": "protes keluhan", "KP-4": "tidak boleh ikut", "PL-3": "larangan main pertandingan berikutnya"
    };
    var KB = [];
    function entry(type, title, text, extra, go) { return { type: type, title: title, text: text, go: go || null, tokens: tok(title + " " + text + " " + (extra || "")) }; }
    function push(e) {
      // Lewati entri yang isinya masih kosong semua ([isi ...]), supaya tidak jadi jawaban utama.
      if (String(e.text).replace(/\[[^\]]*\]/g, "").replace(/[^A-Za-z]/g, "").length < 24) return;
      KB.push(e);
    }
    function build() {
      KB = [];
      D.sop.forEach(function (s) { s.r.forEach(function (r) {
        var e = entry("rule", s.n, r.t + (r.note ? " Catatan: " + r.note : ""), r.c + " " + (SEC_KEYS[s.k] || "") + " " + (BOOST[r.c] || ""), { sec: "info", tab: "it-aturan" });
        e.code = r.c; e.boost = tok(BOOST[r.c] || ""); KB.push(e);
      }); });
      D.rundown.forEach(function (d) { d.items.forEach(function (it) {
        push(entry("info", "Jadwal", it.what + ": " + d.day + ", " + d.date + ", jam " + it.time + ", di " + it.where + ". " + (it.note || ""), "jadwal rundown jam acara kapan", { sec: "info", tab: "it-rundown" }));
      }); });
      D.venues.forEach(function (v) { push(entry("info", "Tempat", v.cabang + ": " + v.tempat + (v.tanggal ? " (" + v.tanggal + ")" : "") + ".", "tempat lokasi dimana ruang ruangan gedung", { sec: "info", tab: "it-tempat" })); });
      D.dresscode.forEach(function (d) { push(entry("info", "Dresscode", d.siapa + ": " + d.aturan + (d.kode ? " (" + d.kode + ")" : ""), "dresscode pakaian", { sec: "info", tab: "it-dress" })); });
      push(entry("info", "Barang terlarang", D.larangan, "dilarang bawa barang rokok", { sec: "info", tab: "it-dress" }));
      push(entry("info", "Denah", "Denah sekolah ada di halaman Panduan SOP, tab Denah. " + D.denah.note, "denah peta lokasi", { sec: "info", tab: "it-denah" }));
      var e = D.event;
      push(entry("info", "Tentang CC Cup", e.background.join(" ") + " Tempat: " + e.host + ". Tanggal: " + e.dates + ".", "cc cup latar sejarah kapan tanggal", { sec: "cccup" }));
      push(entry("info", "Tema", "Tema CC Cup XLI: " + e.theme + ". " + e.themeMeaning, "tema", { sec: "cccup" }));
      D.koorbid.forEach(function (p) { push(entry("info", "Panitia mini soccer", p.jabatan + ": " + p.nama + ", kelas " + p.kelas + ".", "panitia koorbid koordinator siapa", { sec: "cccup" })); });
      if (e.dokumentasi && e.dokumentasi.url) push(entry("info", "Dokumentasi", "Foto dan video CC Cup XLI ada di folder dokumentasi. Buka halaman CC Cup, bagian Dokumentasi.", "dokumentasi foto video drive", { sec: "cccup" }));
      D.hasil.knockout.forEach(function (m) {
        var w = m.winner === "a" ? m.a : m.winner === "b" ? m.b : "[belum diisi]";
        var sc = num(m.sa) && num(m.sb) ? m.sa + "-" + m.sb : "[isi skor]";
        push(entry("info", "Hasil " + m.round, m.round + ": " + m.a + " vs " + m.b + ", skor " + sc + ". Pemenang: " + w + ". " + (m.note || ""), "hasil skor menang " + m.round.toLowerCase(), { sec: "hasil" }));
      });
      var f = D.fenomena;
      push(entry("info", "Fenomena ITG", f.title + ". " + f.masalah, "keributan semifinal setelah peluit masalah fenomena", { sec: "fenomena" }));
      push(entry("info", "Solusi", f.solusi.ringkas + " Usulan: " + f.solusi.usulan.map(function (u) { return u.judul + " (" + u.isi + ")"; }).join("; "), "solusi usulan pasal website", { sec: "fenomena" }));
      D.cmp.forEach(function (c) { push(entry("info", "CC Cup vs IFAB: " + c.n, c.n + ". IFAB (" + c.ir + "): " + c.ifab + " SOP CC Cup: " + c.cc + " " + c.a, "fifa ifab beda perbandingan " + c.codes.join(" "), { sec: "fenomena" })); });
      (Forum.announcements() || []).forEach(function (a) {
        push(entry("ann", "Pengumuman: " + Forum.catLabel(a.category), a.title + ". " + a.body, a.category + " pengumuman", { sec: "forum" }));
      });
    }
    function score(q, e) {
      var s = 0;
      q.forEach(function (w) {
        var syn = SYN[w] || [w];
        if (e.tokens.indexOf(w) >= 0) s += 3 + (e.boost && e.boost.indexOf(w) >= 0 ? 2.5 : 0);
        else if (syn.some(function (x) { return x !== w && e.tokens.indexOf(x) >= 0; })) s += 1.5;
        else if (w.length >= 4 && e.tokens.some(function (t) { return t.length >= 4 && (t.indexOf(w) === 0 || w.indexOf(t) === 0); })) s += 1;
      });
      if (e.code && q.indexOf(e.code.toLowerCase()) >= 0) s += 6;
      return s / Math.pow(e.tokens.length, 0.18);
    }
    function localAnswer(question) {
      var q = tok(question);
      if (!q.length) return { text: "Tulis pertanyaanmu tentang aturan atau acara CC Cup XLI.", miss: true };
      var ranked = KB.map(function (e) { return { e: e, s: score(q, e) }; }).sort(function (a, b) { return b.s - a.s; });
      var top = ranked[0];
      if (!top || top.s < 1.6) return { text: "Aku belum menemukan jawabannya di SOP atau info panitia. Kirim pertanyaanmu ke panitia lewat Tanya-jawab di forum.", miss: true };
      var picks = [top.e];
      if (ranked[1] && ranked[1].s >= top.s * 0.82) picks.push(ranked[1].e);
      return { picks: picks };
    }

    function msg(who, content) {
      var m = h("div", { class: "msg " + who }, content);
      log.appendChild(m); log.scrollTop = log.scrollHeight; return m;
    }
    function goTo(go) {
      if (!go) return;
      close();
      if (go.tab) infoTabs.select(go.tab);
      goPage(go.sec);
    }
    function renderLocal(ans) {
      if (ans.miss) {
        return [h("p", null, ans.text), h("button", { type: "button", class: "link-btn", onclick: function () { close(); Forum.goQnA(); } }, "Buka Tanya-jawab")];
      }
      return ans.picks.map(function (e, i) {
        var head = e.type === "rule" ? "Menurut SOP " : e.title + ": ";
        var body = h("p", null, i ? h("b", null, "Terkait. ") : null, head, e.code ? [codeBtn(e.code), " "] : null, rich(e.text));
        var link = e.go ? h("button", { type: "button", class: "link-btn src", onclick: function () { goTo(e.go); } }, "Lihat di halaman") : null;
        return [body, link];
      });
    }
    function ask(text) {
      text = String(text || "").trim().slice(0, 500);
      if (!text || busy) return;
      sug.hidden = true;
      msg("me", text);
      if (!useAI) { msg("bot", renderLocal(localAnswer(text))); return; }
      busy = true;
      var wait = msg("bot", h("p", { class: "muted" }, "Mencari jawaban…"));
      fetch(CFG.aiEndpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, history: history.slice(-6) })
      }).then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
        .then(function (j) {
          var a = String(j.answer || "").replace(/\*\*/g, "");
          clear(wait); append(wait, a.split(/\n+/).filter(Boolean).map(function (p) { return h("p", null, rich(p)); }));
          history.push({ role: "user", content: text }, { role: "assistant", content: a.slice(0, 1000) });
        })
        .catch(function () {
          clear(wait); append(wait, [h("p", { class: "src" }, "AI sedang tidak bisa dihubungi. Ini jawaban dari pencarian SOP:"), renderLocal(localAnswer(text))]);
        })
        .then(function () { busy = false; log.scrollTop = log.scrollHeight; });
    }
    var SUGGEST = ["Denda kartu merah berapa?", "Kalau seri di semifinal gimana?", "Ada keributan setelah laga, sanksinya?", "Siapa yang tidak boleh ikut?", "Sepatu apa yang boleh dipakai?", "Tim telat datang, apa yang terjadi?"];
    SUGGEST.forEach(function (s) { sug.appendChild(h("button", { type: "button", onclick: function () { ask(s); } }, s)); });
    $("#chatForm").addEventListener("submit", function (e) { e.preventDefault(); var t = input.value; input.value = ""; ask(t); });
    $("#closeChat").addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden && !(dlg && dlg.open)) close(); });
    function open() {
      panel.hidden = false;
      if (!greeted) {
        greeted = true; build();
        msg("bot", h("p", null, "Halo! Tanya apa saja soal aturan dan acara CC Cup XLI. Klik kode seperti ", codeBtn("PL-4"), " untuk membaca aturannya."));
      }
      input.focus();
    }
    function close() { panel.hidden = true; }
    return { open: open, refresh: function () { if (greeted) build(); } };
  })();

})();
