# Peluit · CC Cup XLI

Website proyek ITG Kelompok 8-1 Kolese Kanisius. Isinya fenomena dan solusi, hasil pertandingan mini soccer, info acara, info CC Cup, forum peserta dengan login, chatbot, dan carousel 3D anggota kelompok.

## Isi folder

| File | Fungsi |
|---|---|
| `index.html` | Kerangka halaman utama |
| `anggota.html`, `js/anggota.js` | Halaman Credits: carousel 5 kartu anggota (diadaptasi dari CircularCarousel React Bits), foto, dan jabatan di CC Cup XLI |
| `js/pillnav.js`, `css/pillnav.css` | Navigasi atas berbentuk pil (diadaptasi dari PillNav React Bits, tanpa React). Melipat jadi tombol menu kalau tidak muat |
| `js/lightfall.js`, `js/fluxlines.js`, `js/ghostfibers.js`, `js/antigravity.js`, `js/pixelsnow.js`, `js/section-bg.js` | Latar animasi WebGL2 (diadaptasi dari React Bits, tanpa React): Lightfall di Fenomena, FluxLines di Panduan SOP, GhostFibers di Hasil, Antigravity di CC Cup, PixelSnow di Forum dan Laporan. Tanpa WebGL2, latar tetap polos |
| `js/pages.js` | Membuat setiap menu di `index.html` jadi halaman sendiri (`#fenomena`, `#info`, `#forum`, ...), bukan satu halaman panjang yang digulir |
| `404.html` | Halaman "tidak ditemukan" (Netlify memakainya otomatis) |
| `favicon-32.png`, `apple-touch-icon.png`, `assets/logo-cc-cup-xli.jpg` | Logo CC Cup XLI (ikon tab dan halaman login), sudah dikecilkan dari 878 KB ke 48 KB |
| `js/aero-shards.js`, `js/hero-bg.js`, `js/vendor/vgpu-0.3.1.mjs` | Latar pecahan kaca interaktif di Beranda (AeroShards dari React Bits, butuh WebGPU). Tanpa WebGPU, Beranda memakai latar biasa |
| `js/site.js` | Menu mobile, sumber di footer, dan tahun copyright untuk semua halaman |
| `css/style.css` | Tampilan (warna, huruf, tata letak, carousel 3D) |
| `js/data.js` | **Semua isi website.** Edit file ini untuk mengganti teks, jadwal, hasil, anggota |
| `js/config.js` | Pengaturan Firebase dan chatbot AI |
| `js/backend.js` | Login (email + password, opsional Google) dan database Firebase |
| `js/app.js` | Semua fitur di halaman |
| `firestore.rules` | Aturan keamanan database (wajib dipasang) |
| `netlify/functions/chat.js` | API chatbot AI opsional (`POST /api/chat`) |
| `netlify/functions/status.js` | API cek kesehatan website (`GET /api/status`) |
| `firebase.json`, `firestore.indexes.json` | Pengaturan database untuk deploy otomatis |
| `.github/workflows/ci.yml` | DevOps: pemeriksaan otomatis dan deploy rules |
| `jalankan.bat`, `jalankan.ps1` | Server lokal di `http://localhost:5500` |
| `_headers`, `netlify.toml` | Pengaturan keamanan, Netlify, dan alamat `/api` |

## Arsitektur

| Bagian | Teknologi | Di mana |
|---|---|---|
| Frontend | HTML, CSS, JavaScript tanpa framework; loading screen, gerbang login, halaman laporan | `index.html`, `css/`, `js/app.js` |
| Backend | Firebase Authentication (email + password, opsional Google) dan fungsi server Netlify | `js/backend.js`, `netlify/functions/` |
| Database | Cloud Firestore; akses dijaga `firestore.rules` | koleksi `reports`, `reportPhotos`, `roles`, `admins`, forum |
| API | `POST /api/chat`, `GET /api/status` | `netlify.toml` meneruskan `/api/*` ke fungsi |
| DevOps | GitHub Actions memeriksa setiap push; Netlify deploy otomatis dari GitHub; rules Firestore dipasang otomatis | `.github/workflows/ci.yml` |

## Menggunakan Claude Code untuk mengembangkan website

Claude Code adalah alat bantu coding yang dijalankan dari terminal, bukan sesuatu yang ditempel ke file website. Petunjuk proyek sudah disimpan di `CLAUDE.md`, sehingga Claude Code dapat memahami struktur dan aturan penting proyek ini.

1. Pasang Claude Code mengikuti petunjuk resmi Anthropic, lalu buka folder proyek ini di VS Code.
2. Buka **Terminal > New Terminal**. Pastikan terminal berada di folder `peluit-cccup` (folder yang berisi `README.md`).
3. Jalankan `claude` dan ikuti proses masuk yang diminta.
4. Minta perubahan dengan jelas, misalnya: `Periksa js/data.js dan jelaskan data yang masih berupa placeholder. Jangan mengubah file dulu.` Setelah itu, tinjau perubahan yang diusulkan sebelum menyetujuinya.

Claude Code membantu mengubah kode lokal; ia tidak otomatis memublikasikan website. Periksa perubahan sebelum deploy, dan jangan berikan API key, password, atau data pribadi kepadanya. Ini berbeda dari chatbot Peluit di website, yang dijelaskan pada bagian berikut.

## 1. Mengisi konten

Buka `js/data.js` di VS Code. Semua teks yang masih `[di dalam kurung siku]` belum diisi. Pengunjung tidak melihatnya: bagian itu disembunyikan atau ditulis "menyusul". Ganti dengan data asli dari panitia atau wawancara, dan bagiannya langsung tampil.

- Foto anggota: kecilkan dulu ke lebar sekitar 900px dan ukuran di bawah 200 KB (misalnya lewat squoosh.app), simpan di `assets/anggota/`, misalnya `01.jpg`, lalu isi `photo: "assets/anggota/01.jpg"`. Foto tegak (potret) paling pas. Tanpa foto, kartu memakai nomor absen seperti nomor punggung.
- Denah: simpan gambar sebagai `assets/denah.jpg`.
- Video: isi `youtubeId` dengan kode setelah `v=` di link YouTube.
- Hasil pool: isi angka `w`, `d`, `l`, `gf`, `ga`. Poin dan urutan dihitung otomatis.
- Jangan menulis nomor HP atau data pribadi. Semua isi `data.js` bisa dibaca siapa saja.

## 2. Mencoba di komputer

Isi dulu konfigurasi Firebase (bagian 4). Lalu klik dua kali `jalankan.bat`. Website terbuka di `http://localhost:5500`. Tutup jendela hitamnya untuk berhenti. Jangan membuka `index.html` langsung (alamat `file://`), karena login Firebase tidak berjalan di alamat itu.

Selama `firebase` di `js/config.js` masih `null`, website hanya menampilkan pesan "Belum tersambung" dan tidak ada yang bisa masuk. Tidak ada mode demo.

## 3. Publish ke internet (gratis)

1. Buat akun di netlify.com.
2. Buka app.netlify.com/drop, lalu seret folder `peluit-cccup` ke halaman itu.
3. Catat alamat websitenya, misalnya `https://peluit-cccup.netlify.app`.

Kalau ingin riwayat kode, upload ke GitHub dulu, lalu di Netlify pilih **Add new site > Import from Git**.

## 4. Menyambungkan Firebase (wajib)

Semua akun, forum, dan laporan tersimpan di Firebase. Proyek Firebase harus dibuat oleh pemilik akun Google (tidak bisa dibuat dari file website).

1. Buka console.firebase.google.com, klik **Create a project**, beri nama (misalnya `peluit-cccup`). Google Analytics boleh dimatikan.
2. **Build > Authentication > Get started > Sign-in method**:
   - Aktifkan **Email/Password** (yang atas saja; *Email link* tidak perlu).
   - Aktifkan **Google** kalau ingin tombol Google tetap ada. Kalau tidak, ubah `providers: []` di `js/config.js`.
   - Yahoo dan Microsoft tidak dipakai lagi, biarkan mati.
3. **Authentication > Settings > Authorized domains**: `localhost` sudah ada; tambahkan alamat Netlify kamu (misalnya `peluit-cccup.netlify.app`).
4. **Build > Firestore Database > Create database**, pilih lokasi `asia-southeast2 (Jakarta)`, mulai dalam **production mode**. Buka tab **Rules**, hapus isinya, tempel seluruh isi `firestore.rules`, klik **Publish**.
5. **Project settings (ikon roda gigi) > General > Your apps**, klik ikon **</>** (Web), beri nama, klik **Register app**. Salin bagian `firebaseConfig` ke `js/config.js`, menggantikan `firebase: null`. Contohnya ada di file itu.
6. Muat ulang website, lalu buat akun pertama lewat **Buat akun**.
7. Upload ulang folder ke Netlify.

Website tidak mengirim email apa pun: tidak ada email verifikasi dan tidak ada email reset password. Akun langsung bisa dipakai setelah dibuat. Password bisa diganti dari halaman Forum selama masih ingat password lama. Kalau lupa password, admin menghapus akun itu di **Authentication > Users** (titik tiga > Delete account), lalu orangnya membuat akun baru dengan email yang sama.

### Peran dan laporan

Website hanya bisa dibuka setelah login. Setiap akun punya satu peran:

| Peran | Bisa apa |
|---|---|
| Pengguna | Semua akun yang login. Melihat website, menulis di forum, dan membuat laporan. Hanya bisa membaca laporannya sendiri dan menghapus kirimannya sendiri |
| Panitia | Membaca semua laporan dan mengubah statusnya, membuat pengumuman, menjawab pertanyaan. Untuk menghapus, haknya sama dengan pengguna: hanya kiriman sendiri |
| Admin | Semua hak panitia, ditambah menghapus kiriman siapa pun, menghapus laporan, dan mengatur akses di bagian **Atur akses** |

Setiap tombol Kirim dan Hapus punya jeda 4 detik: garis tipis di tepi tombol berjalan habis, dan selama itu tombolnya berubah jadi **Batalkan** (atau tekan Escape). Kiriman baru benar-benar terkirim atau terhapus setelah garisnya habis.

Karena email tidak diverifikasi, siapa pun bisa mendaftar memakai alamat email orang lain. Jadi peran **tidak** diberikan berdasarkan email akun password. Peran diberikan seperti ini:

| Cara | Peran |
|---|---|
| Masuk lewat tombol **Google** dengan `2515856.rafael@kanisius.sch.id` | Admin |
| Masuk lewat tombol **Google** dengan email yang ada di daftar panitia (`isPanitiaEmail` di `firestore.rules`) | Panitia |
| ID akun (UID) didaftarkan di **Atur akses** | Panitia atau Admin, sesuai pilihan |
| UID ditulis manual di koleksi `admins` (Firestore, ID dokumen = UID) | Admin |
| Semua akun lain | Pengguna |

Email Google sudah diverifikasi oleh Google, jadi aman dipakai untuk peran. Admin pertama cukup masuk lewat tombol Google dengan email admin di atas. Kalau tombol Google tidak dipakai: buat akun email+password, buka halaman Forum, salin **ID akun**, lalu di Firebase Console buka **Firestore > Start collection** `admins`, ID dokumen = ID akun itu, isi satu field apa saja (misalnya `nama`), simpan.

Untuk menjadikan orang lain panitia/admin: orang itu menyalin **ID akun** dari halaman Forum dan memberikannya ke admin, lalu admin memasukkannya di **Atur akses**.

Bukti foto diperkecil di browser lalu disimpan di Firestore (koleksi `reportPhotos`), jadi tidak perlu Firebase Storage. Data lokasi di foto ikut terhapus.

Penting untuk keamanan:
- Jangan menghapus syarat `verified()` di `firestore.rules`. Syarat itu yang membuat peran berbasis email hanya berlaku untuk login Google.
- Setelah mengubah `firestore.rules`, tempel ulang di Firebase Console lalu klik **Publish**.
- Konfigurasi web Firebase (`apiKey` dan lainnya) memang terlihat di browser, dan itu normal; bukan kunci rahasia. Yang menjaga data adalah `firestore.rules`. Sebagai pengaman tambahan, batasi API key di Google Cloud Console > APIs & Services > Credentials hanya untuk domain website kamu.

## DevOps: deploy otomatis lewat GitHub

1. Upload folder ini ke repository GitHub (branch `main`).
2. Di Netlify: **Add new site > Import from Git**, pilih repository itu. Setiap push ke `main` otomatis di-deploy. Di **Site settings > Build & deploy**, nyalakan pengaturan agar deploy menunggu check GitHub lulus kalau ingin lebih aman.
3. Setiap push menjalankan **GitHub Actions** (tab Actions di GitHub): cek sintaks, cek isi `data.js`, tes `/api/status`, dan mencari kunci rahasia yang bocor. Kalau gagal, tanda silang merah muncul di commit.
4. Opsional, agar `firestore.rules` terpasang otomatis setiap push ke `main`:
   - Firebase Console > **Project settings > Service accounts > Generate new private key** (unduh file JSON). File ini rahasia: jangan dimasukkan ke folder proyek.
   - GitHub repository > **Settings > Secrets and variables > Actions**: buat **secret** `FIREBASE_SERVICE_ACCOUNT` berisi seluruh isi file JSON tadi, dan **variable** `FIREBASE_PROJECT_ID` berisi ID proyek Firebase.
   - Hapus file JSON dari komputer setelah ditempel.
5. Pemantauan: buka `https://alamat-website/api/status`. Hasil `"ok": true` berarti website sehat. Alamat ini bisa dipasang di layanan pemantau gratis seperti UptimeRobot.

## 5. Chatbot AI (opsional)

Tanpa pengaturan apa pun, chatbot memakai **mode tanpa AI**: mencari jawaban dari SOP dan info di `data.js`. Ini gratis dan tidak butuh kunci.

Untuk mode AI, kunci API harus dibuat oleh **orang dewasa (guru atau orang tua)** karena ada batas usia dan biaya pemakaian.

1. Di Netlify: **Site settings > Environment variables**, tambahkan `ANTHROPIC_API_KEY` dan `ALLOWED_ORIGIN` (alamat website kamu).
2. Di `js/config.js`, isi `aiEndpoint: "/api/chat"`.
3. Deploy dari GitHub (fungsi server tidak ikut terpasang lewat drag-and-drop).

Kunci API **tidak pernah** ditulis di file website. Kunci hanya ada di pengaturan Netlify, jadi pengunjung tidak bisa melihatnya.

## Checklist keamanan

| Cek | Status di proyek ini |
|---|---|
| Tidak ada kunci rahasia di kode browser | Ya. Kunci AI hanya di environment variable server |
| Aturan akses database (row level security) | Ya, `firestore.rules`: menulis wajib login, hanya pemilik/panitia yang menghapus, masukan dan keluhan privat |
| Tidak ada halaman /admin tanpa password | Bagian Atur akses hanya tampil untuk admin, dan peran dicek di server lewat koleksi `admins` dan `roles` |
| Laporan kejadian privat | Ya. Hanya pelapor dan panitia/admin yang bisa membaca laporan dan fotonya |
| File `.env` tidak ikut ke GitHub | Ya, ada di `.gitignore` |
| AI tidak punya akses ke database | Ya. Fungsi chat hanya membaca `data.js` |
| Input pengguna tidak bisa menyisipkan kode (XSS) | Ya. Semua teks forum ditampilkan dengan `textContent` |
| Batas panjang isian | Ya, di browser dan di `firestore.rules` |
| Header keamanan (CSP, anti-iframe, HTTPS) | Ya, di `_headers` |
| Batas jumlah pertanyaan ke AI | Ya, 8 per menit per IP |
| Pesan error tidak membocorkan detail server | Ya |
| Versi library dikunci | Ya, Firebase 10.12.2 |
| Data pribadi (nomor HP) tidak dipublikasikan | Ya. Kontak lewat forum |

Belum dicakup dan perlu dipertimbangkan kalau website dipakai banyak orang: Firebase App Check (mencegah bot), moderasi kata kasar di forum, dan backup database.

## Sumber

- SOP Mini Soccer CC Cup XLI
- IFAB, Laws of the Game 2026/27 (theifab.com)
