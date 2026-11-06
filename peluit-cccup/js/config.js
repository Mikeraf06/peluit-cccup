/*
 * Pengaturan website
 *
 * 1) firebase: WAJIB diisi. Salin dari Firebase Console > Project settings > General >
 *    Your apps > Web app > "SDK setup and configuration" (pilih "Config").
 *    Selama masih null, website menampilkan pesan "belum tersambung ke database"
 *    dan tidak ada yang bisa masuk. Langkah lengkapnya ada di README.
 *
 *    Konfigurasi web Firebase memang dipakai di browser dan BUKAN kunci rahasia
 *    (semua website Firebase menaruhnya di browser). Yang melindungi data adalah
 *    file firestore.rules. Pastikan rules itu sudah dipasang sebelum website dibagikan.
 *
 * 2) providers: tombol masuk tambahan selain email + password. ["google"] menampilkan
 *    tombol Google; [] hanya memakai email + password.
 *
 * 3) aiEndpoint: isi "/api/chat" HANYA setelah kunci API AI
 *    dipasang sebagai environment variable di Netlify (lihat README).
 *    Kosong = chatbot memakai mode tanpa AI (mencari jawaban di SOP dan info).
 *
 * JANGAN PERNAH menaruh kunci API AI, password, atau isi file .env di sini.
 * Semua file di folder js/ bisa dibaca siapa saja yang membuka website.
 */
window.PELUIT_CONFIG = {
  firebase: {
    apiKey: "AIzaSyA0xsFOjlaeuWPxkGzDoG50KahLjlwb_uM",
    authDomain: "itg-kelompok-7-81.firebaseapp.com",
    projectId: "itg-kelompok-7-81",
    storageBucket: "itg-kelompok-7-81.firebasestorage.app",
    messagingSenderId: "276782256343",
    appId: "1:276782256343:web:1e27bba339d67ce31b6092"
  },
  /* Bentuk konfigurasi (dari Firebase Console > Project settings > Your apps > Web):
  firebase: {
    apiKey: "AIza...",
    authDomain: "nama-proyek.firebaseapp.com",
    projectId: "nama-proyek",
    storageBucket: "nama-proyek.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
  },
  */
  providers: ["google"],
  aiEndpoint: ""
};
