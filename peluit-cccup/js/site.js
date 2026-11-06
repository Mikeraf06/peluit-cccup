/*
 * Bagian yang sama di semua halaman: navigasi PillNav, sumber di footer, tahun copyright.
 */
(function () {
  "use strict";

  /* Navigasi atas. Di index.html setiap menu membuka halamannya sendiri (lihat js/pages.js);
     dari halaman lain, tautannya menuju index.html#halaman. */
  var host = document.getElementById("navHost");
  if (host && window.PillNav) {
    var onIndex = !!document.getElementById("beranda");
    var P = onIndex ? "" : "index.html";
    // Ikon garis sederhana (viewBox 24×24), satu per menu.
    var ICON = {
      fenomena: ["M12 3 2 20h20L12 3z", "M12 10v4", "M12 17h.01"],
      hasil: ["M8 4h8v5a4 4 0 0 1-8 0V4z", "M8 6H5a3 3 0 0 0 3 4", "M16 6h3a3 3 0 0 1-3 4", "M12 13v4", "M8 20h8", "M10 17h4"],
      sop: ["M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z", "M4 19a2 2 0 0 1 2-2h13", "M9 7h6", "M9 10h4"],
      cccup: ["M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0", "M12 8l3 2.2-1.1 3.6h-3.8L9 10.2z", "M12 3v5", "M15 10.2l5.4-1.6", "M13.9 13.8l3.4 4.6", "M10.1 13.8l-3.4 4.6", "M9 10.2 3.6 8.6"],
      forum: ["M4 5h16v10H9l-5 4V5z", "M8 9h8", "M8 12h5"],
      laporan: ["M5 21V4", "M5 4h12l-2.5 4 2.5 4H5"],
      akses: ["M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z", "M9 12l2 2 4-4"],
      credits: ["M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0", "M2 21v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1", "M16 3.5a4 4 0 0 1 0 7", "M19 15a5 5 0 0 1 3 4.6V21"]
    };
    var items = [
      { label: "Fenomena", href: P + "#fenomena", icon: ICON.fenomena },
      { label: "Hasil", href: P + "#hasil", icon: ICON.hasil },
      { label: "Panduan SOP", href: P + "#info", icon: ICON.sop },
      { label: "CC Cup", href: P + "#cccup", icon: ICON.cccup },
      { label: "Forum", href: P + "#forum", icon: ICON.forum },
      { label: "Laporan", href: P + "#laporan", icon: ICON.laporan },
      { label: "Atur akses", href: P + "#akses", icon: ICON.akses },
      { label: "Credits", href: "anggota.html", icon: ICON.credits }
    ];
    var nav = window.PillNav.mount(host, {
      logo: "assets/logo-cc-cup-xli.jpg", // logo CC Cup XLI
      logoAlt: "CC Cup XLI, ke beranda",
      logoHref: P + "#beranda",
      items: items,
      activeHref: onIndex ? null : "anggota.html",
      hidden: [P + "#akses"], // tampil hanya untuk admin (diatur app.js)
      indicator: "dot",
      bounce: 0.45,
      ariaLabel: "Menu utama"
    });
    window.SiteNav = nav;
  }

  /* Footer */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  var src = document.getElementById("sources");
  var D = window.CC_DATA;
  if (src && D && D.sources) {
    D.sources.forEach(function (s) {
      var li = document.createElement("li");
      if (s && typeof s === "object" && /^https:\/\//.test(s.url || "")) {
        var a = document.createElement("a");
        a.href = s.url; a.target = "_blank"; a.rel = "noopener noreferrer";
        a.textContent = s.text;
        li.appendChild(a);
      } else {
        li.textContent = typeof s === "string" ? s : (s && s.text) || "";
      }
      src.appendChild(li);
    });
  }
})();
