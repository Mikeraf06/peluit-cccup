/*
 * Backend: login, forum, laporan, dan peran. Semuanya tersimpan di Firebase
 * (Authentication + Firestore). Konfigurasinya ada di js/config.js.
 *
 * Keamanan data diatur di firestore.rules, BUKAN di file ini. Pengecekan di browser
 * hanya untuk tampilan; aturan sebenarnya dijalankan di server Firebase.
 *
 * Cara masuk:
 * - Email (misalnya Gmail) + password. Website TIDAK mengirim email apa pun
 *   (tidak ada email verifikasi atau reset password).
 * - Tombol Google (opsional, lihat PELUIT_CONFIG.providers).
 *
 * Peran:
 * - admin   : email admin utama (ditulis di firestore.rules) yang masuk lewat Google, UID di
 *             koleksi "admins", atau diberi peran admin lewat Atur akses.
 * - panitia : email di daftar panitia (ditulis di firestore.rules) yang masuk lewat Google,
 *             atau diberi peran panitia lewat Atur akses.
 * - pengguna: semua akun lain.
 * Karena email tidak diverifikasi, Atur akses memakai ID akun (UID), bukan alamat email:
 * siapa pun bisa mendaftar memakai alamat email orang lain, tetapi ID akun tidak bisa dipalsukan.
 */
(function () {
  "use strict";

  var CFG = window.PELUIT_CONFIG || {};
  var FIREBASE_VERSION = "10.12.2";
  var LIMITS = {
    title: 120, body: 3000, reply: 1500, question: 500, answer: 2000, feedback: 2000, name: 60,
    kronologi: 5000, photo: 900000, email: 120, label: 120
  };
  var LEVELS = ["sangat_tinggi", "tinggi", "sedang", "rendah", "sangat_rendah"];
  var REPORT_STATUS = ["diterima", "diproses", "selesai"];
  var SHARE_ROLES = ["panitia", "admin"];
  var EMAIL_RE = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;
  var UID_RE = /^[A-Za-z0-9]{10,128}$/;
  var MIN_PASSWORD = 8;

  /* Email terakhir yang dipakai masuk di perangkat ini, supaya formulir Masuk langsung terisi.
     Password TIDAK pernah disimpan di sini. */
  var LAST_EMAIL = "peluit-last-email";
  function saveLastEmail(email) { try { if (email) localStorage.setItem(LAST_EMAIL, email); } catch (e) {} }
  function lastEmail() { try { return localStorage.getItem(LAST_EMAIL) || ""; } catch (e) { return ""; } }

  var authListeners = [];
  var state = { user: null, role: "pengguna", checked: false };
  function staff() { return state.role === "panitia" || state.role === "admin"; }
  function emitAuth() {
    authListeners.forEach(function (fn) { try { fn(state.user, staff(), state.role); } catch (e) { console.error(e); } });
  }

  function friendlyError(err) {
    var code = (err && err.code) || "";
    if (code === "not-configured") return "Website belum tersambung ke database. Hubungi admin.";
    if (code.indexOf("permission-denied") >= 0) return "Kamu tidak punya izin untuk melakukan ini.";
    if (code.indexOf("popup-closed") >= 0 || code.indexOf("cancelled-popup") >= 0) return "";
    if (code.indexOf("popup-blocked") >= 0) return "Jendela login diblokir browser. Izinkan pop-up lalu coba lagi.";
    if (code.indexOf("account-exists-with-different-credential") >= 0) return "Email ini sudah terdaftar dengan cara login lain. Masuk dengan email dan password.";
    if (code.indexOf("unauthorized-domain") >= 0) return "Alamat website ini belum diizinkan di Firebase Authentication (Settings > Authorized domains).";
    if (code.indexOf("unavailable") >= 0 || code.indexOf("network") >= 0) return "Koneksi bermasalah. Coba lagi sebentar.";
    if (code.indexOf("invalid-credential") >= 0 || code.indexOf("wrong-password") >= 0 || code.indexOf("user-not-found") >= 0 || code.indexOf("invalid-login") >= 0) return "Email atau password salah.";
    if (code.indexOf("email-already-in-use") >= 0) return "Email ini sudah punya akun. Pilih Masuk.";
    if (code.indexOf("weak-password") >= 0) return "Password terlalu lemah. Pakai minimal " + MIN_PASSWORD + " karakter.";
    if (code.indexOf("invalid-email") >= 0) return "Format email belum benar.";
    if (code.indexOf("too-many-requests") >= 0) return "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.";
    if (code.indexOf("operation-not-allowed") >= 0) return "Cara masuk ini belum diaktifkan di Firebase Authentication.";
    if (code.indexOf("api-key-not-valid") >= 0 || code.indexOf("invalid-api-key") >= 0) return "Konfigurasi Firebase di js/config.js salah. Hubungi admin.";
    if (code === "not-signed-in") return "Masuk dulu untuk melakukan ini.";
    if (code === "invalid") return (err && err.message) || "Isian belum lengkap.";
    return "Terjadi kesalahan. Coba lagi.";
  }

  function clean(s, max) { return String(s == null ? "" : s).trim().slice(0, max); }
  function fail(code, message) { var e = new Error(message || code); e.code = code; return e; }
  function normEmail(s) { return clean(s, LIMITS.email).toLowerCase(); }

  /* Validasi yang sama dengan firestore.rules, supaya pesan error muncul sebelum dikirim. */
  function prepare(path, data) {
    var col = path.split("/").pop();
    var d = {};
    if (col === "announcements") {
      d.category = clean(data.category, 20); d.title = clean(data.title, LIMITS.title); d.body = clean(data.body, LIMITS.body);
      if (d.title.length < 3 || !d.body) throw fail("invalid", "Judul (min. 3 huruf) dan isi wajib diisi.");
    } else if (col === "posts") {
      d.title = clean(data.title, LIMITS.title); d.body = clean(data.body, LIMITS.body);
      if (d.title.length < 3 || !d.body) throw fail("invalid", "Judul (min. 3 huruf) dan isi wajib diisi.");
    } else if (col === "replies") {
      d.body = clean(data.body, LIMITS.reply);
      if (!d.body) throw fail("invalid", "Balasan masih kosong.");
    } else if (col === "questions") {
      d.question = clean(data.question, LIMITS.question);
      if (d.question.length < 5) throw fail("invalid", "Pertanyaan minimal 5 huruf.");
    } else if (col === "feedback") {
      d.type = ["masukan", "kritik", "keluhan"].indexOf(data.type) >= 0 ? data.type : "masukan"; d.topic = clean(data.topic, 40); d.body = clean(data.body, LIMITS.feedback);
      d.status = "diterima";
      if (!d.topic || d.body.length < 10) throw fail("invalid", "Pilih topik dan tulis minimal 10 huruf.");
    }
    return d;
  }
  function prepareReport(data) {
    var d = { title: clean(data.title, LIMITS.title), kronologi: clean(data.kronologi, LIMITS.kronologi), level: data.level, status: "diterima" };
    if (d.title.length < 3) throw fail("invalid", "Judul laporan minimal 3 huruf.");
    if (d.kronologi.length < 20) throw fail("invalid", "Kronologi minimal 20 huruf. Ceritakan apa yang terjadi.");
    if (LEVELS.indexOf(d.level) < 0) throw fail("invalid", "Pilih tingkat laporan.");
    var photo = data.photo || "";
    if (photo && (typeof photo !== "string" || photo.indexOf("data:image/jpeg;base64,") !== 0 || photo.length > LIMITS.photo)) {
      throw fail("invalid", "Foto tidak bisa dipakai. Coba foto lain.");
    }
    d.hasPhoto = !!photo;
    return { report: d, photo: photo };
  }
  function prepareCredentials(email, password, name, isRegister) {
    email = normEmail(email);
    if (!EMAIL_RE.test(email)) throw fail("invalid", "Tulis alamat email yang benar.");
    if (!password) throw fail("invalid", "Tulis password.");
    if (isRegister) {
      name = clean(name, LIMITS.name);
      if (name.length < 2) throw fail("invalid", "Tulis nama lengkap.");
      if (password.length < MIN_PASSWORD) throw fail("invalid", "Password minimal " + MIN_PASSWORD + " karakter.");
    }
    return { email: email, password: password, name: name };
  }
  function prepareShare(uid, role, label) {
    uid = clean(uid, 128);
    if (!UID_RE.test(uid)) throw fail("invalid", "ID akun tidak valid. Minta orang itu menyalin ID akunnya dari halaman Forum.");
    if (SHARE_ROLES.indexOf(role) < 0) throw fail("invalid", "Pilih peran.");
    label = clean(label, LIMITS.label);
    if (!label) throw fail("invalid", "Tulis nama orang itu supaya mudah dikenali di daftar.");
    return { uid: uid, role: role, label: label };
  }

  var configured = !!(CFG.firebase && CFG.firebase.apiKey && CFG.firebase.projectId && CFG.firebase.appId);
  // Firebase Authentication tidak berjalan di alamat file:// (index.html diklik dua kali),
  // jadi di sana Firebase tidak dimuat sama sekali; app.js menampilkan petunjuk jalankan.bat.
  var hasFirebase = configured && location.protocol !== "file:";

  var base = "https://www.gstatic.com/firebasejs/" + FIREBASE_VERSION + "/";
  var F = {};
  var auth, db;
  var ready = null;
  var stopRole = null;

  function notReady() { return Promise.reject(fail("not-configured")); }
  function toItem(d) {
    var x = d.data({ serverTimestamps: "estimate" }) || {};
    var o = { id: d.id };
    Object.keys(x).forEach(function (k) {
      var v = x[k];
      o[k] = v && typeof v.toMillis === "function" ? v.toMillis() : v;
    });
    return o;
  }
  function ref(path) { return F.fs.collection.apply(null, [db].concat(path.split("/"))); }
  var pendingName = "";

  /* Login selalu disimpan di perangkat (IndexedDB): tetap masuk setiap kali website dibuka lagi,
     sampai pengguna menekan Keluar. */
  function persist() {
    return F.auth.setPersistence(auth, F.auth.indexedDBLocalPersistence || F.auth.browserLocalPersistence)
      .catch(function () { return F.auth.setPersistence(auth, F.auth.browserLocalPersistence); });
  }

  /* Peran dibaca dari server. Ini hanya untuk tampilan; firestore.rules yang benar-benar menjaga data. */
  function watchRole(u) {
    var uid = u.uid, user = state.user;
    var superAdmin = false, listed = false, shared = null, gotAdmin = false, gotRole = false;
    function update() {
      if (!state.user || state.user.uid !== uid || !gotAdmin || !gotRole) return;
      state.role = superAdmin ? "admin" : (shared || (listed ? "panitia" : "pengguna"));
      state.checked = true; emitAuth();
    }
    // Peran dicek dengan bertanya ke server, jadi daftar email admin/panitia hanya ada di firestore.rules
    // (tidak di file website): hanya admin yang boleh membaca seluruh daftar akses, dan hanya panitia
    // yang boleh membaca semua laporan.
    F.fs.getDoc(F.fs.doc(db, "admins", uid)).then(function (s) { superAdmin = s.exists(); }).catch(function () {})
      .then(function () {
        if (superAdmin) return;
        return F.fs.getDocs(F.fs.query(F.fs.collection(db, "roles"), F.fs.limit(1)))
          .then(function () { superAdmin = true; }).catch(function () {});
      })
      .then(function () {
        if (superAdmin || !user.verified) return;
        return F.fs.getDocs(F.fs.query(F.fs.collection(db, "reports"), F.fs.limit(1)))
          .then(function () { listed = true; }).catch(function () {});
      })
      .then(function () { gotAdmin = true; update(); });
    stopRole = F.fs.onSnapshot(F.fs.doc(db, "roles", uid), function (s) {
      var r = s.exists() ? s.data() : null;
      shared = r && SHARE_ROLES.indexOf(r.role) >= 0 ? r.role : null;
      gotRole = true; update();
    }, function () { shared = null; gotRole = true; update(); });
  }

  function init() {
    if (!hasFirebase) {
      state.checked = true; emitAuth();
      return Promise.resolve();
    }
    ready = Promise.all([
      import(base + "firebase-app.js"),
      import(base + "firebase-auth.js"),
      import(base + "firebase-firestore.js")
    ]).then(function (m) {
      F.app = m[0]; F.auth = m[1]; F.fs = m[2];
      var app = F.app.initializeApp(CFG.firebase);
      auth = F.auth.getAuth(app);
      db = F.fs.getFirestore(app);
      F.auth.onAuthStateChanged(auth, function (u) {
        if (stopRole) { stopRole(); stopRole = null; }
        if (!u) { state.user = null; state.role = "pengguna"; state.checked = true; emitAuth(); return; }
        var info = u.providerData[0] || {};
        state.user = {
          uid: u.uid,
          name: clean(u.displayName || pendingName || "Pengguna", LIMITS.name),
          email: normEmail(u.email || info.email || ""),
          provider: info.providerId || "",
          verified: !!u.emailVerified
        };
        saveLastEmail(state.user.email);
        state.role = "pengguna"; state.checked = false; emitAuth();
        watchRole(u);
      });
    });
    return ready;
  }

  window.Backend = {
    configured: configured,
    limits: LIMITS,
    levels: LEVELS,
    ready: init().catch(function (e) {
      console.error("Firebase gagal dimuat", e);
      state.checked = true; emitAuth();
    }),
    onAuth: function (fn) { authListeners.push(fn); fn(state.user, staff(), state.role); return function () { authListeners = authListeners.filter(function (f) { return f !== fn; }); }; },
    get user() { return state.user; },
    get isAdmin() { return staff(); },
    get role() { return state.role; },
    get authChecked() { return state.checked; },
    minPassword: MIN_PASSWORD,
    lastEmail: lastEmail,
    /* Apakah perangkat ini pernah dipakai masuk (untuk memilih tampilan Masuk atau Buat akun). */
    hasAccounts: function () { return !!lastEmail(); },

    signIn: function (provider) {
      if (!hasFirebase) return notReady();
      return ready.then(persist).then(function () {
        if (provider !== "google") throw fail("invalid", "Cara login tidak dikenal.");
        var p = new F.auth.GoogleAuthProvider();
        p.setCustomParameters({ prompt: "select_account" });
        return F.auth.signInWithPopup(auth, p);
      });
    },
    signInEmail: function (email, password) {
      if (!hasFirebase) return notReady();
      var c;
      try { c = prepareCredentials(email, password); } catch (e) { return Promise.reject(e); }
      return ready.then(persist).then(function () { return F.auth.signInWithEmailAndPassword(auth, c.email, c.password); });
    },
    /* Membuat akun baru. Tidak ada email yang dikirim; akun langsung bisa dipakai. */
    register: function (name, email, password) {
      if (!hasFirebase) return notReady();
      var c;
      try { c = prepareCredentials(email, password, name, true); } catch (e) { return Promise.reject(e); }
      pendingName = c.name;
      return ready.then(persist)
        .then(function () { return F.auth.createUserWithEmailAndPassword(auth, c.email, c.password); })
        .then(function (cred) {
          return F.auth.updateProfile(cred.user, { displayName: c.name }).catch(function () {}).then(function () {
            if (state.user && state.user.uid === cred.user.uid) { state.user.name = c.name; emitAuth(); }
          });
        });
    },
    /* Ganti password saat sedang masuk (butuh password lama). Tidak ada email yang dikirim. */
    changePassword: function (oldPassword, newPassword) {
      if (!hasFirebase) return notReady();
      if (!newPassword || newPassword.length < MIN_PASSWORD) return Promise.reject(fail("invalid", "Password baru minimal " + MIN_PASSWORD + " karakter."));
      return ready.then(function () {
        var u = auth.currentUser;
        if (!u || !u.email) throw fail("not-signed-in");
        var cred = F.auth.EmailAuthProvider.credential(u.email, oldPassword || "");
        return F.auth.reauthenticateWithCredential(u, cred).then(function () { return F.auth.updatePassword(u, newPassword); });
      });
    },
    signOut: function () { return hasFirebase ? ready.then(function () { return F.auth.signOut(auth); }) : Promise.resolve(); },

    watch: function (path, cb, opts) {
      opts = opts || {};
      if (!hasFirebase) { setTimeout(function () { cb([]); }, 0); return function () {}; }
      var unsub = null, stopped = false;
      ready.then(function () {
        if (stopped) return;
        var q;
        if ((path === "feedback" || path === "reports") && !staff()) {
          if (!state.user) { cb([]); return; }
          // Tanpa orderBy supaya tidak butuh composite index; diurutkan di browser.
          q = F.fs.query(ref(path), F.fs.where("authorUid", "==", state.user.uid), F.fs.limit(50));
        } else {
          q = F.fs.query(ref(path), F.fs.orderBy("createdAt", opts.asc ? "asc" : "desc"), F.fs.limit(opts.limit || 100));
        }
        unsub = F.fs.onSnapshot(q, function (snap) {
          var items = snap.docs.map(toItem);
          items.sort(function (a, b) { return opts.asc ? a.createdAt - b.createdAt : b.createdAt - a.createdAt; });
          cb(items);
        }, function (err) { console.warn("watch", path, err && err.code); cb(null, err); });
      }).catch(function (err) { cb(null, err); });
      return function () { stopped = true; if (unsub) unsub(); };
    },
    add: function (path, data) {
      if (!hasFirebase) return notReady();
      if (!state.user) return Promise.reject(fail("not-signed-in"));
      var d;
      try { d = prepare(path, data); } catch (e) { return Promise.reject(e); }
      d.authorUid = state.user.uid; d.authorName = state.user.name; d.createdAt = F.fs.serverTimestamp();
      return F.fs.addDoc(ref(path), d).then(function (r) { return r.id; });
    },
    addReport: function (data) {
      if (!hasFirebase) return notReady();
      if (!state.user) return Promise.reject(fail("not-signed-in"));
      var p;
      try { p = prepareReport(data); } catch (e) { return Promise.reject(e); }
      var d = p.report;
      d.authorUid = state.user.uid; d.authorName = state.user.name; d.authorEmail = state.user.email; d.createdAt = F.fs.serverTimestamp();
      // Foto disimpan di dokumen terpisah supaya daftar laporan tetap ringan.
      var r = F.fs.doc(ref("reports"));
      var batch = F.fs.writeBatch(db);
      batch.set(r, d);
      if (p.photo) batch.set(F.fs.doc(db, "reportPhotos", r.id), { photo: p.photo, authorUid: state.user.uid, createdAt: F.fs.serverTimestamp() });
      return batch.commit().then(function () { return r.id; });
    },
    getReportPhoto: function (id) {
      if (!hasFirebase) return notReady();
      return F.fs.getDoc(F.fs.doc(db, "reportPhotos", id)).then(function (s) { return s.exists() ? s.data().photo : null; });
    },
    setReportStatus: function (id, status) {
      if (!hasFirebase) return notReady();
      if (REPORT_STATUS.indexOf(status) < 0) return Promise.reject(fail("invalid", "Status tidak dikenal."));
      return F.fs.updateDoc(F.fs.doc(db, "reports", id), { status: status });
    },
    /* Atur akses: beri peran ke ID akun (UID). */
    shareAccess: function (uid, role, label) {
      if (!hasFirebase) return notReady();
      if (!state.user) return Promise.reject(fail("not-signed-in"));
      var s;
      try { s = prepareShare(uid, role, label); } catch (e) { return Promise.reject(e); }
      return F.fs.setDoc(F.fs.doc(db, "roles", s.uid), {
        role: s.role, label: s.label,
        addedBy: state.user.uid, addedByName: state.user.name, createdAt: F.fs.serverTimestamp()
      });
    },
    removeAccess: function (uid) {
      if (!hasFirebase) return notReady();
      return F.fs.deleteDoc(F.fs.doc(db, "roles", uid));
    },
    answer: function (id, text) {
      if (!hasFirebase) return notReady();
      text = clean(text, LIMITS.answer); if (!text) return Promise.reject(fail("invalid", "Jawaban masih kosong."));
      return F.fs.updateDoc(F.fs.doc(db, "questions", id), { answer: text, answeredAt: F.fs.serverTimestamp(), answeredBy: state.user ? state.user.name : "Panitia" });
    },
    setStatus: function (id, status) {
      if (!hasFirebase) return notReady();
      return F.fs.updateDoc(F.fs.doc(db, "feedback", id), { status: status });
    },
    remove: function (path, id) {
      if (!hasFirebase) return notReady();
      if (path === "reports") {
        var batch = F.fs.writeBatch(db);
        batch.delete(F.fs.doc(db, "reports", id));
        batch.delete(F.fs.doc(db, "reportPhotos", id));
        return batch.commit();
      }
      return F.fs.deleteDoc(F.fs.doc.apply(null, [db].concat(path.split("/"), [id])));
    },
    friendlyError: friendlyError
  };
})();
