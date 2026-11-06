/*
 * Halaman terpisah di index.html.
 * Setiap <section> langsung di dalam <main> adalah satu halaman. Hanya satu yang tampil,
 * dipilih dari alamat (#fenomena, #forum, ...). Tombol Back/Forward browser tetap bekerja.
 * Tautan ke bagian di dalam halaman (misalnya #usulan) membuka halamannya lalu menggulir ke sana.
 */
(function () {
  "use strict";

  var main = document.getElementById("main");
  if (!main || !document.getElementById("beranda")) return;

  var REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var HOME = "beranda";
  var BASE_TITLE = "Peluit · CC Cup XLI";
  var current = null;

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  function pages() { return [].filter.call(main.children, function (el) { return el.tagName === "SECTION" && el.id; }); }
  function pageOf(el) {
    while (el && el !== main) {
      if (el.parentElement === main && el.tagName === "SECTION" && el.id) return el;
      el = el.parentElement;
    }
    return null;
  }
  /* Halaman yang disembunyikan karena peran (hidden), misalnya Atur akses, tidak bisa dibuka. */
  function allowed(page) { return page && !page.hasAttribute("hidden"); }

  function titleOf(page) {
    if (page.id === HOME) return BASE_TITLE;
    var h = page.querySelector("h2");
    return (h ? h.textContent.trim() + " · " : "") + BASE_TITLE;
  }

  function show(page, target) {
    var changed = page !== current;
    if (changed) {
      pages().forEach(function (p) { p.classList.toggle("page-off", p !== page); });
      current = page;
      document.title = titleOf(page);
      if (!REDUCED) { page.classList.remove("page-in"); void page.offsetWidth; page.classList.add("page-in"); }
    }
    if (window.SiteNav) window.SiteNav.setActive("#" + page.id);
    if (target && target !== page) {
      target.scrollIntoView({ block: "start", behavior: changed || REDUCED ? "auto" : "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: changed || REDUCED ? "auto" : "smooth" });
    }
  }

  function route() {
    var id = decodeURIComponent(location.hash.slice(1));
    var target = id ? document.getElementById(id) : null;
    // Tautan "Langsung ke isi" (#main) dan anchor di luar halaman: biarkan.
    if (target && !pageOf(target) && current) return;
    var page = pageOf(target);
    if (!allowed(page)) { page = document.getElementById(HOME); target = null; }
    show(page, target);
  }

  /* Klik menu halaman yang sedang dibuka: hashchange tidak terjadi, jadi gulir ke atas sendiri. */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (a.getAttribute("href") === location.hash || (a.getAttribute("href") === "#" + HOME && !location.hash)) {
      e.preventDefault();
      route();
    }
  });
  window.addEventListener("hashchange", route);

  window.Pages = {
    /* Buka halaman atau bagian tertentu dari kode (chatbot, forum). */
    go: function (id) {
      if (location.hash === "#" + id) route();
      else location.hash = "#" + id;
    },
    /* Dipanggil saat peran berubah: keluar dari halaman yang tidak lagi boleh dibuka. */
    refresh: function () {
      var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      var want = pageOf(t);
      if (!allowed(want)) want = document.getElementById(HOME);
      if (want !== current) route();
    }
  };

  route();
})();
