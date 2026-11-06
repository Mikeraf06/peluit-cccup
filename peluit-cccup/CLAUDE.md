# Panduan Claude Code untuk proyek Peluit · CC Cup XLI

## Konteks proyek

Ini adalah website statis untuk CC Cup XLI. Frontend menggunakan HTML, CSS, dan JavaScript tanpa proses build. Konten utama ada di `js/data.js`; pengaturan Firebase dan chatbot ada di `js/config.js`; akses Firebase ada di `js/backend.js`; interaksi halaman ada di `js/app.js`. Fungsi chatbot server berada di `netlify/functions/chat.js`.

## Cara bekerja

- Baca file terkait sebelum mengubahnya dan pertahankan pola serta gaya yang sudah ada.
- Untuk perubahan konten acara, utamakan `js/data.js`; jangan menggandakan konten di tempat lain tanpa alasan.
- Tidak ada mode demo: semua login dan data memakai Firebase. Tanpa konfigurasi Firebase, website hanya menampilkan pesan "belum tersambung".
- Website tidak mengirim email apa pun (tidak ada verifikasi atau reset password lewat email). Karena itu peran panitia/admin tidak boleh diberikan berdasarkan email akun password; pakai UID (Atur akses) atau login Google yang emailnya terverifikasi.
- Pertahankan tampilan responsif dan aksesibilitas dasar, serta gunakan Bahasa Indonesia yang jelas untuk teks antarmuka.
- Buat perubahan sekecil mungkin yang menyelesaikan permintaan. Jangan mengubah file atau perilaku yang tidak terkait.
- Setelah perubahan, periksa diff dan validasi halaman/fitur yang terdampak. Proyek ini tidak memiliki `package.json` atau perintah test/build bawaan.

## Keamanan dan privasi

- Jangan pernah menaruh API key, password, token, atau isi `.env` di file frontend atau commit.
- Jangan menambahkan informasi pribadi siswa/pengguna ke konten website.
- Pertahankan validasi dan aturan akses di `firestore.rules`; jangan mengandalkan pemeriksaan di browser sebagai pengaman database.
- Chatbot hanya boleh menerima kunci API melalui environment variable server Netlify. Jangan memberinya akses ke database atau membocorkan detail error server kepada pengguna.
- Jangan mengubah konfigurasi autentikasi, aturan Firestore, deployment, atau menghapus data tanpa diminta secara eksplisit.

## Pembedaan penting

Chatbot Peluit yang tampil di website adalah fitur untuk pengunjung. Claude Code adalah alat bantu developer yang dijalankan dari terminal di folder proyek ini; keduanya berbeda.
