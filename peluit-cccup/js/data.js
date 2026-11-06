/*
 * Isi website. Edit file ini untuk mengganti teks, jadwal, hasil, dan anggota.
 * Teks di dalam [kurung siku] adalah bagian yang BELUM DIISI.
 * Website menyembunyikannya dari pengunjung (atau menulis "menyusul"), dan
 * bagian itu tampil otomatis setelah kurung sikunya diganti dengan isi asli.
 * Jangan menulis nomor HP, alamat rumah, atau data pribadi lain di file ini:
 * semua isinya bisa dibaca siapa saja yang membuka website.
 */
var CC_DATA = (function () {
  "use strict";

  /* SOP Mini Soccer CC Cup XLI (sumber resmi) */
  var SOP = [
 {k:"PU",n:"Peraturan Umum",r:[
  "Peserta adalah siswa-siswi yang masih aktif terdaftar di SMP/SMA sederajat yang berlokasi di daerah Jabodetabek.",
  "Seluruh peserta wajib menaati aturan yang berlaku selama CC CUP XLI (aturan umum serta aturan pertandingan dan perlombaan).",
  "Seluruh rangkaian acara CC CUP XLI dilaksanakan secara tatap muka (offline) di Kolese Kanisius.",
  "Peserta wajib menjaga sportivitas selama berada di area Kolese Kanisius.",
  "Dilarang keras membawa benda tajam, senjata api, bahan peledak, minuman keras, obat-obatan terlarang, pilox, rokok, parfum, petasan, dan hewan peliharaan ke area Kolese Kanisius. Barang tersebut akan diamankan dan tidak dikembalikan oleh panitia.",
  "Dilarang keras memakai pakaian terbuka (bikini, baju transparan, crop-top, rok pendek, dan celana pendek) bagi seluruh peserta lomba maupun pengunjung.",
  "Dilarang memakai alas kaki terbuka (sandal jepit, crocs, dan semacamnya). Peserta wajib memakai alas kaki tertutup atau sepatu.",
  "Peserta, pendamping, dan penonton dilarang keras merokok di area Kolese Kanisius.",
  "Dilarang keras memalsukan identitas peserta.",
  "Panitia berhak memeriksa lebih lanjut jika ada kecurigaan pemalsuan identitas peserta.",
  "Setiap tim boleh membawa suporter. Suporter wajib menjaga dan mematuhi protokol keamanan yang berlaku.",
  "Peserta maupun suporter dilarang membuat keributan selama CC CUP XLI berlangsung. Jika terjadi, tim yang bersangkutan diberi sanksi diskualifikasi.",
  "Peserta dan suporter wajib menjaga kebersihan dan dilarang merusak fasilitas Kolese Kanisius. Kerusakan akibat kelalaian peserta ditanggung pihak peserta.",
  "Peserta yang tidak membawa kartu peserta mendapat toleransi 10 menit dari jadwal untuk menunjukkan kartu secara langsung (tidak boleh daring). Lewat batas waktu, peserta dilarang bertanding. Kartu yang hilang di area Kolese Kanisius wajib dilaporkan ke panitia inti.",
  "Panitia tidak bertanggung jawab atas cedera peserta. Panitia hanya memberikan pertolongan pertama (P3K).",
  "Batas usia pemain per 19 September 2026: SMP maksimal 15 tahun, SMA maksimal 18 tahun.",
  "Setiap peserta wajib memenuhi kelengkapan administrasi sebagai syarat mengikuti pertandingan.",
  "Pemain adalah perwakilan sah sekolah (masih terdaftar sebagai siswa sekolah itu) dan tidak dapat digantikan selama CC CUP XLI.",
  {t:"Peserta bukan pemain profesional. Untuk lomba selain basket, yang dianggap profesional: (i) pernah atau sedang terdaftar di sekolah binaan atau program pembinaan olahraga (PPLP, SKO, KKO, PPLOPD, PPLPD, PAB, PPOP, PPOPD, Sentra Olahraga, dan program pembinaan provinsi atau kabupaten/kota sejenis); (ii) pernah bermain dan/atau menjuarai kompetisi seperti Olympic, Asian Games, SEA Games, PON, POPNAS, ASEAN School Games, Kejurnas, Kejurprov, Kejurda, atau sejenisnya; (iii) juara 1, 2, atau 3 O2SN tingkat kabupaten, atau pernah ikut O2SN tingkat provinsi/nasional; (iv) juara 1, 2, atau 3 FL3SN tingkat kabupaten, atau pernah ikut FL3SN tingkat provinsi/nasional. Lomba basket memakai definisi tersendiri.",note:"Butir iii dan iv di SOP ditulis 'Bukan peraih juara…' di dalam daftar definisi profesional. Di sini ditafsirkan sebagai syarat yang membuat pemain tidak boleh ikut."},
  "Keputusan panitia, wasit, dan juri dianggap mutlak dan tidak dapat diganggu gugat.",
  "Setiap protes harus dilakukan secara tertulis dan diserahkan kepada pihak Perlombaan CC CUP XLI.",
  "Setiap peserta berhak melakukan protes dengan syarat tertulis dan diserahkan kepada pihak Perlombaan CC CUP XLI.",
  "Setiap peserta wajib hadir pada Technical Meeting dan mengirim perwakilan pada Upacara Pembukaan. Peserta yang tidak hadir di Technical Meeting dianggap menyetujui seluruh kesepakatannya.",
  "Setiap tim wajib berfoto bersama sebelum pertandingan dimulai."]},
 {k:"KP",n:"Kriteria Peserta",r:[
  "Cabang mini soccer hanya terbuka bagi murid putra.",
  "Setiap regu maksimal 14 pemain: 7 starter dan 7 cadangan.",
  "Setiap sekolah hanya boleh mengirim 1 regu, kecuali sekolah penyelenggara.",
  "Pemain yang sudah berada di level Porda tingkat kabupaten/kotamadya dan/atau provinsi/internasional tidak boleh ikut bertanding.",
  "Peserta lain yang mengetahui status pemain level Porda dipersilakan mengonfirmasi ke panitia dengan memberikan bukti.",
  "Yang boleh bertanding hanya peserta yang terdaftar resmi pada formulir pendaftaran lengkap.",
  "Setiap pemain wajib memakai kaos tim (kaos dan celana) yang sama dalam satu regu dan bernomor punggung. Regu tanpa kaos tim boleh memakai seragam olahraga dan akan dipinjami rompi bernomor.",
  "Penjaga gawang wajib memakai kaos berbeda warna dengan regunya; disarankan memakai sarung tangan.",
  "Pemain tidak boleh mengganti nomor punggung dari awal sampai akhir pertandingan.",
  "Setiap pemain wajib memakai sepatu pul (sepak bola) atau sepatu futsal.",
  "Setiap pemain wajib memakai kaos kaki panjang dan pelindung tulang kering. Jika tidak, pemain diberi kartu kuning.",
  "Setiap regu wajib hadir 30 menit sebelum pertandingan dimulai.",
  "Setiap regu dipimpin 1 kapten dan wajib didampingi pelatih atau guru pendamping dari sekolah.",
  "Kapten wajib menandatangani berita acara pertandingan setelah pertandingan selesai.",
  "Setiap pemain hanya boleh mewakili satu sekolah (SMP atau SMA), dibuktikan dengan fotokopi kartu pelajar."]},
 {k:"KU",n:"Kuota Perlombaan",r:[
  "Kuota tim mini soccer CC Cup XLI maksimal 12 tim dan minimal 8 tim (SMP dan SMA, termasuk tim mini soccer CC)."]},
 {k:"PP",n:"Peraturan Perlombaan",r:[
  "Peraturan pertandingan berpedoman pada aturan FIFA dengan beberapa modifikasi untuk pembinaan mini soccer tingkat SMP dan SMA.",
  "Pergantian pemain hanya boleh saat bola mati (permainan dihentikan), tidak boleh saat bola aktif dimainkan.",
  "Saat kick-off, gol yang tercipta dari tendangan/sentuhan kedua dinyatakan sah.",
  "Lemparan ke dalam (throw-in): kedua kaki harus berada di belakang garis.",
  "Jika dua regu memakai kaos berwarna sama, regu yang disebut di belakang wajib mengganti dengan rompi dari panitia.",
  "Jika ada gangguan sebelum atau selama pertandingan, pertandingan dihentikan atau ditunda dan diatur sebagai pertandingan tunda.",
  "Semua keputusan wasit mutlak, mengikat, dan tidak dapat digugat. Penentuan pemenang: (i) regu dengan gol terbanyak menang; (ii) di sistem gugur, jika seri sampai akhir pertandingan, dilakukan adu penalti 5 penendang per regu; (iii) jika masih sama, dilakukan undian. Pemenang undian memilih menendang atau menjaga gawang. Jika tendangan tidak berbuah gol, regu yang menendang kalah."]},
 {k:"PT",n:"Pertandingan Tertunda",r:[
  "Pertandingan tunda dilaksanakan keesokan harinya pada jam yang ditentukan panitia.",
  "Jika pertandingan sebelumnya berlangsung kurang dari 5 menit, waktu dan skor diulang dari awal.",
  "Jika pertandingan sebelumnya berlangsung 5 menit atau lebih, waktu dan skor melanjutkan pertandingan sebelumnya.",
  "Pertandingan tunda diatur oleh panitia cabang mini soccer CC Cup XLI."]},
 {k:"TP",n:"Teknis Pertandingan",r:[
  "Pertandingan dilaksanakan di lapangan depan (lapangan mini soccer) Kolese Kanisius.",
  "Babak penyisihan memakai sistem setengah kompetisi (pool), babak selanjutnya memakai sistem gugur (knock-out).",
  "Babak penyisihan: 4 pool (A, B, C, D) masing-masing 3 regu, sistem single round robin. Poin: menang 3, seri 1, kalah 0. Hanya juara pool yang lolos. Jika poin sama, tiebreaker berurutan: selisih gol, jumlah gol, head to head, selisih gol head to head, lalu tingkat fair play (kartu kuning dan merah). Posisi 2 dan 3 tereliminasi.",
  "Babak knock-out dimulai dari semifinal (4 tim); juara pool bertemu juara pool lain sesuai pairing panitia, lalu final dan perebutan juara 3. Jika imbang saat waktu habis, adu penalti 5 kali dengan penendang berbeda. Jika masih sama, undian: pemenang undian memilih menendang atau menjaga gawang; jika tendangan tidak berbuah gol, regu yang menendang kalah. Tim yang kalah tereliminasi."]},
 {k:"DP",n:"Durasi Pertandingan",r:[
  "Babak penyisihan dan semifinal: 2 × 20 menit, istirahat 5 menit (waktu kotor).",
  "Final: 2 × 25 menit, istirahat 10 menit (waktu kotor)."]},
 {k:"KH",n:"Kehadiran Peserta (Walk Out)",r:[
  {t:"Regu terlambat atau tidak datang setelah 5 menit dari jadwal pertandingan.",note:"SOP tidak menulis kalimat pembuka. Butir 1–3 ditafsirkan sebagai penyebab sanksi Walk Out (butir 4)."},
  "Regu menolak bertanding pada jadwal yang ditetapkan panitia.",
  "Regu tidak menghadirkan minimal 5 pemain saat pertandingan dimulai.",
  "Regu yang terkena sanksi Walk Out (WO) dinyatakan kalah 0-3."]},
 {k:"PL",n:"Pelanggaran",r:[
  "Kartu kuning diberikan jika: (a) perlengkapan bertanding tidak lengkap (misalnya tanpa pelindung kaki atau sepatu olahraga); (b) memakai aksesoris saat bertanding (cincin, gelang, kalung, dan benda lain yang dapat melukai); (c) menghina perangkat pertandingan atau lawan; (d) selebihnya mengikuti peraturan FIFA.",
  "Kartu merah diberikan jika: (a) mencegah peluang besar lawan mencetak gol dengan cara apa pun (misalnya situasi open goal, atau lawan ditekel dari belakang saat membawa bola); (b) menghina perangkat pertandingan atau lawan dengan sangat kasar.",
  {t:"Akumulasi 2 kartu kuning dalam satu pertandingan menjadi kartu merah; pemain tidak boleh bermain lagi sampai pertandingan selesai. Pemain yang mendapat kartu merah langsung tidak boleh bermain lagi sampai pertandingan selesai dan tidak boleh mengikuti 1 pertandingan berikutnya.",note:"Larangan main di laga berikutnya hanya disebut untuk kartu merah langsung, tidak untuk akumulasi 2 kuning."},
  "Denda: kartu kuning Rp20.000; kartu merah atau 2 kartu kuning Rp50.000; kartu kuning lalu kartu merah langsung tanpa kuning kedua Rp75.000."]},
 {k:"LL",n:"Lain-lain",r:[
  "Penonton dan suporter dilarang membuat keributan selama pertandingan. Bernyanyi kencang hanya boleh saat selebrasi gol, istirahat babak, setelah pertandingan selesai, atau di antara pertandingan.",
  "Suporter atau penonton yang membuat keributan akan ditegur panitia dan keamanan. Jika tetap tidak berhenti, mereka berhak diusir dari lingkungan Kolese Kanisius dengan radius minimal 1500 meter."]}
];
  SOP.forEach(function (s) {
    s.r = s.r.map(function (x, i) {
      var o = typeof x === "string" ? { t: x } : x;
      o.c = s.k + "-" + (i + 1);
      return o;
    });
  });

  /* Perbandingan SOP CC Cup vs IFAB Laws of the Game 2026/27 */
  var CMP = [
 {n:"Rujukan ke FIFA",s:"turunan",ifab:"Laws of the Game berlaku untuk semua pertandingan; hanya modifikasi yang diizinkan IFAB yang boleh dipakai.",ir:"About the Laws · General Modifications",cc:"Pertandingan berpedoman pada aturan FIFA dengan modifikasi. Hal yang tidak diatur mengikuti FIFA.",codes:["PP-1","PL-1"],a:"Sumber keabsahan. SOP sendiri menunjuk FIFA sebagai aturan di atasnya. Ini bukti tertulis hubungan dua lapis aturan."},
 {n:"Pergantian pemain",s:"turunan",ifab:"Pergantian dilakukan saat permainan berhenti, dengan izin wasit.",ir:"Law 3",cc:"Pergantian hanya saat bola mati, tidak boleh saat bola aktif.",codes:["PP-2"],a:"Sumber keabsahan. Isinya mengikuti Law 3."},
 {n:"Durasi pertandingan",s:"adaptasi",ifab:"2 × 45 menit, istirahat paling lama 15 menit. Untuk sepak bola usia muda, durasi babak boleh diubah.",ir:"Law 7 · General Modifications",cc:"Penyisihan & semifinal 2 × 20 menit (istirahat 5). Final 2 × 25 menit (istirahat 10).",codes:["DP-1","DP-2"],a:"Sumber keabsahan. IFAB memberi izin mengubah durasi, jadi perbedaan ini sah."},
 {n:"Sanksi lanjutan & denda",s:"tambahan",ifab:"Mengatur kartu kuning dan merah. Laws of the Game tidak mengatur denda uang atau larangan main di laga berikutnya.",ir:"Law 12",cc:"Denda Rp20.000 / Rp50.000 / Rp75.000; kartu merah langsung dilarang main 1 laga berikutnya.",codes:["PL-3","PL-4"],a:"Tidak boleh bertentangan. Denda menambah sanksi tanpa mengubah aturan kartu, jadi tidak bertentangan."},
 {n:"Walk Out",s:"tambahan",ifab:"Tidak mengatur kekalahan WO; itu urusan penyelenggara kompetisi.",ir:"Tidak ada pasal khusus",cc:"Regu terlambat 5 menit, menolak main, atau kurang dari 5 pemain kalah 0-3.",codes:["KH-1","KH-4"],a:"Mengisi ruang yang memang diserahkan ke penyelenggara."},
 {n:"Lemparan ke dalam",s:"menyimpang",ifab:"Saat melempar, sebagian dari tiap kaki berada di garis atau di tanah di luar garis.",ir:"Law 15",cc:"Kedua kaki harus berada di belakang garis.",codes:["PP-4"],a:"Tidak boleh bertentangan. Berdiri di atas garis sah menurut IFAB tetapi tidak sah di CC Cup, dan aturan lemparan tidak termasuk daftar izin IFAB."},
 {n:"Adu penalti",s:"menyimpang",ifab:"Jika setelah 5 tendangan masih sama, tendangan dilanjutkan sampai satu tim unggul dari jumlah tendangan yang sama.",ir:"Law 10",cc:"Setelah 5 tendangan, dilakukan undian. Pemenang undian memilih menendang atau menjaga gawang, lalu satu tendangan menentukan.",codes:["PP-7","TP-4"],a:"Tidak boleh bertentangan. Undian menggantikan sudden death, padahal cara menentukan pemenang tidak termasuk izin modifikasi IFAB."},
 {n:"Perlengkapan & aksesoris",s:"menyimpang",ifab:"Pemain disuruh memperbaiki perlengkapan atau melepas benda berbahaya dulu. Kartu kuning hanya jika menolak, mengulang, atau masuk lagi tanpa izin.",ir:"Law 4",cc:"Tanpa pelindung tulang kering atau memakai aksesoris langsung kartu kuning.",codes:["KP-11","PL-1"],a:"Tidak boleh bertentangan. Sanksi CC Cup lebih keras dari IFAB. Alasan keselamatan perlu dibahas."},
 {n:"Gol dari kick-off",s:"ambigu",ifab:"Gol boleh dicetak langsung dari kick-off ke gawang lawan.",ir:"Law 8",cc:"Gol dari tendangan/sentuhan kedua saat kick-off dinyatakan sah.",codes:["PP-3"],a:"SOP tidak melarang gol langsung dari kick-off, hanya menegaskan gol sentuhan kedua sah. Jika wasit melarang gol langsung, itu tidak tertulis. Perlu dikonfirmasi ke panitia."},
 {n:"Keributan setelah peluit akhir",s:"ambigu",ifab:"Wasit berwenang mengambil tindakan disiplin sampai meninggalkan lapangan dan melaporkan kejadian setelah laga.",ir:"Law 5",cc:"Keributan selama CC Cup: tim didiskualifikasi. Menghina lawan: kartu kuning atau merah.",codes:["PU-12","PL-1","PL-2"],a:"Yang khusus didahulukan. Bagian Pelanggaran lebih khusus dari Peraturan Umum (sederajat, satu dokumen), tetapi tidak menyebut kejadian setelah peluit. Tidak jelas sanksi mana yang berlaku."}
];

  return {
    event: {
      name: "CC Cup XLI",
      fullName: "Canisius College Cup XLI",
      year: 2026,
      host: "Kolese Kanisius, Jakarta",
      dates: "19 - 26 September 2026",
      theme: "Má Caaput U Ch'abal Yah",
      themeMeaning: "Tema dari kegiatan ini adalah Ma Caaput U Ch'abal Yah. Tema ini berasal dari peribahasa Suku Maya yang memiliki makna Tidak jatuh dua kali pada kesulitan yang sama. Tema tersebut mencerminkan semangat untuk terus bangkit dan berkembang dari setiap tantangan maupun kegagalan yang pernah dialami. Dalam setiap pertandingan dan perlombaan, kemenangan bukanlah satu-satunya tujuan, melainkan kesempatan untuk belajar, memperbaiki diri, dan menjadi pribadi yang lebih baik.",
      background: [
        "CC Cup XLI adalah penyelenggaraan ke-41 Canisius College Cup, kompetisi antarsekolah SMP dan SMA se-Jabodetabek yang diadakan di Kolese Kanisius."
      ],
      // Link folder dokumentasi (foto dan video). Kosongkan url kalau tidak ada.
      dokumentasi: {
        url: "https://drive.google.com/drive/folders/1AFyBFbw4_QUUfZxMNOniEVTz0wD8ql0L",
        label: "Folder dokumentasi CC Cup XLI (Google Drive)"
      }
    },

    group: {
      label: "Kelompok ITG Kelas 8-1",
      school: "Kolese Kanisius",
      // Foto: simpan di assets/anggota/ lalu isi "photo", misalnya "assets/anggota/01.jpg".
      // nick = nama panggilan (tampil besar di Credits). role = jabatan saat CC Cup XLI.
      members: [
        { no: "01", nick: "Ale", name: "Alexander Agung Riatmojo Rampengan", role: "Koorbid Admin", photo: "assets/anggota/01.jpg" },
        { no: "10", nick: "Emerick", name: "Emerick Polana Kho", role: "Kabid Perlombaan", photo: "assets/anggota/10.jpg" },
        { no: "29", nick: "Lokan", name: "Rafael Joshua Lokan", role: "Panitia Dana", photo: "assets/anggota/29.jpg" },
        { no: "30", nick: "Sugandi", name: "Rafael Kristoforus Sugandi", role: "Koorbid Perlombaan Cerdas Cermat", photo: "assets/anggota/30.jpg" },
        { no: "31", nick: "Rangga", name: "Ranggalana Kastyano Putra", role: "Panitia Mini Soccer dan peserta (CC Tim B)", photo: "assets/anggota/31.jpg" }
      ]
    },

    fenomena: {
      title: "Keributan setelah peluit akhir semifinal",
      match: "Semifinal mini soccer: SMPN 18 vs SMPN 74",
      when: "Rabu, 23 September 2026, 13:30 - 14:15",
      kronologi: [
        "SMPN 74 menang 2-1 atas SMPN 18 dan lolos ke final.",
        "Setelah peluit akhir, seorang pemain SMPN 74 mengejek dan mendorong pemain SMPN 18.",
        "Pemain SMPN 18 membalas dengan ejekan personal dan kontak fisik. Kiper dan pemain lain ikut terlibat.",
        "Frater, guru pendamping, pelatih kedua tim, dan ball boy melerai sampai situasi tenang.",
        "Panitia belum menjatuhkan sanksi apa pun. Keributan hanya dilerai di tempat."
      ],
      masalah: "SOP mengatur keributan di dua tempat yang tidak saling menyebut. PU-12 menyatakan tim yang membuat keributan didiskualifikasi, sedangkan PL-1 dan PL-2 hanya memberi kartu untuk pemain yang menghina lawan. Keduanya sederajat dalam satu dokumen, tetapi tidak ada yang menjelaskan kejadian setelah peluit akhir. Padahal SOP berpedoman pada FIFA (PP-1), dan IFAB Laws of the Game 2026/27 Law 5 menyatakan wasit tetap berwenang sampai meninggalkan lapangan.",
      asas: [
        { nama: "Yang khusus didahulukan", isi: "Bagian Pelanggaran lebih khusus daripada Peraturan Umum, tetapi hanya cocok untuk kejadian selama pertandingan. Asas ini tidak bisa langsung menjawab kasus setelah peluit." },
        { nama: "Sumber keabsahan", isi: "SOP menunjuk FIFA sebagai pedoman (PP-1). Law 5 menjadi rujukan, tetapi isinya tidak diturunkan ke SOP. Terjadi kekosongan aturan turunan." }
      ],
      solusi: {
        ringkas: "Website ini membuat aturan mudah ditemukan, memberi jalur resmi untuk protes, dan mengusulkan pasal yang menutup celah setelah peluit akhir.",
        fitur: [
          { masalah: "Peserta dan suporter tidak tahu aturan mana yang berlaku.", fitur: "Chatbot dan halaman aturan yang menyebut kode pasal SOP.", link: "#info" },
          { masalah: "Emosi keluar di lapangan karena tidak ada saluran protes.", fitur: "Forum masukan dan keluhan, sesuai protes tertulis di PU-21.", link: "#forum" },
          { masalah: "Informasi lomba tersebar dan sering terlewat.", fitur: "Papan pengumuman resmi panitia: lomba berlangsung, pemenang, barang hilang.", link: "#forum" },
          { masalah: "SOP tidak mengatur kejadian setelah peluit akhir.", fitur: "Usulan tiga pasal baru untuk SOP CC Cup berikutnya.", link: "#usulan" }
        ],
        usulan: [
          { judul: "Wewenang sampai keluar lapangan", isi: "Wewenang wasit dan panitia berlaku sejak tim memasuki area pertandingan sampai seluruh pemain meninggalkannya, selaras dengan IFAB Law 5." },
          { judul: "Sanksi setelah peluit akhir", isi: "Ejekan, provokasi, atau kontak fisik setelah peluit akhir dicatat di laporan wasit dan diberi sanksi setara kartu merah. Besarannya diputuskan panitia." },
          { judul: "Protokol jabat tangan", isi: "Setelah peluit akhir, kedua tim berbaris dan berjabat tangan didampingi wasit, lalu meninggalkan lapangan bergantian." }
        ]
      }
    },

    /* Hasil pertandingan. Pool cukup berisi nama tim. Kalau nanti ingin menampilkan klasemen,
       isi angka w (menang), d (seri), l (kalah), gf (gol memasukkan), ga (gol kemasukan);
       poin dan urutan dihitung otomatis: menang 3, seri 1, kalah 0 (TP-3).
       winner: "a" atau "b" = tim yang menang (boleh diisi walau skornya belum ada). */
    hasil: {
      pools: [
        // Pembagian pool mini soccer SMP (Rundown Minsoc 2026).
        { name: "Pool A", teams: [ { name: "SMPN 18" }, { name: "SMP Santa Maria" }, { name: "CC A" } ] },
        { name: "Pool B", teams: [ { name: "SMP Barunawati II" }, { name: "SMP Desa Putera" }, { name: "CC B" } ] },
        { name: "Pool C", teams: [ { name: "SMPN 10" }, { name: "SMP Bellarminus" }, { name: "SMPN 33" } ] },
        { name: "Pool D", teams: [ { name: "SMPN 74" }, { name: "SMPN 228" }, { name: "SMP Fikri Jakarta" } ] }
      ],
      knockout: [
        { round: "Semifinal 1", a: "SMPN 18", b: "SMPN 74", sa: 1, sb: 2, winner: "b", note: "Keributan setelah peluit akhir. Dibahas di bagian Fenomena." },
        { round: "Semifinal 2", a: "CC B", b: "SMPN 10", sa: null, sb: null, winner: "b", note: "" },
        { round: "Final", a: "SMPN 74", b: "SMPN 10", sa: null, sb: null, winner: "a", note: "SMPN 74 juara mini soccer SMP CC Cup XLI." }
      ]
    },

    rundown: [
      { day: "Sebelum lomba", date: "17 September 2026", items: [
        { time: "14:00 - 17:30", what: "Technical Meeting", where: "Kolese Kanisius", note: "Wajib dihadiri. Yang tidak hadir dianggap setuju dengan semua kesepakatan (PU-23)." }
      ]},
      { day: "Hari 1", date: "19 September 2026", items: [
        { time: "07:30 - 09:30", what: "Upacara pembukaan", where: "Lapangan mini soccer (lapangan depan)", note: "Setiap sekolah mengirim perwakilan (PU-23)." },
        { time: "09:50 - 17:20", what: "Babak penyisihan pool mini soccer (ronde 1)", where: "Lapangan mini soccer (lapangan depan)", note: "SMP mulai 09:50, SMA mulai 13:50. Datang 30 menit sebelum jadwal (KP-12)." }
      ]},
      { day: "Hari 2 - 4", date: "20 - 22 September 2026", items: [
        { time: "Mulai 09:00 / 13:30", what: "Babak penyisihan pool mini soccer (ronde 2 dan 3)", where: "Lapangan mini soccer (lapangan depan)", note: "Ronde 2 pada 20 September mulai 09:00. Ronde 3 pada 21 dan 22 September mulai 13:30." }
      ]},
      { day: "Hari 5", date: "Rabu, 23 September 2026", items: [
        { time: "13:30 - 17:20", what: "Semifinal mini soccer", where: "Lapangan mini soccer (lapangan depan)", note: "SMP 13:30 - 15:10, SMA 15:40 - 17:20. 2 × 20 menit, istirahat 5 menit (DP-1)." }
      ]},
      { day: "Hari 6", date: "Kamis, 24 September 2026", items: [
        { time: "13:30 - 17:20", what: "Perebutan juara 3 dan final mini soccer", where: "Lapangan mini soccer (lapangan depan)", note: "SMP 13:30 - 15:20, SMA 15:30 - 17:20. Final 2 × 25 menit, istirahat 10 menit (DP-2)." }
      ]},
      { day: "Hari 8", date: "Sabtu, 26 September 2026", items: [
        { time: "18:30 - 02:00", what: "Closing", where: "Lapangan Mini Soccer", note: "Harga tiket ada di papan pengumuman." }
      ]}
    ],

    /* Tempat lomba dan posko (dari daftar peminjaman ruangan CC Cup XLI).
       sumber = kode pasal SOP Mini Soccer kalau ada; tanggal opsional. */
    venues: [
      { cabang: "Mini soccer", tempat: "Lapangan depan (lapangan mini soccer) Kolese Kanisius", tanggal: "19 - 24 September", sumber: "TP-1" },
      { cabang: "Bulutangkis", tempat: "Sporthall", tanggal: "20 - 23 September" },
      { cabang: "Basket", tempat: "Lapangan Basket Kolese Kanisius" },
      { cabang: "Voli", tempat: "Lapangan Voli A dan B", tanggal: "19 - 26 September" },
      { cabang: "Pencak silat", tempat: "Lantai 7, Gedung Ignatius", tanggal: "19 - 20 September" },
      { cabang: "Catur", tempat: "Ruang Matematika 1, Lt. 2 Gedung Xaverius (ruang tunggu: Biologi 1)", tanggal: "19 - 22 September" },
      { cabang: "Cubing", tempat: "Aula Lt. 4, Gedung Xaverius", tanggal: "19 - 20 September" },
      { cabang: "Tenis meja", tempat: "Ruang Agama dan Ruang Kimia 1, Gedung Xaverius", tanggal: "19 - 22 September" },
      { cabang: "Cerdas cermat", tempat: "Ruang Bahasa Indonesia 1 dan 2, Gedung Bellarminus", tanggal: "20 - 23 September" },
      { cabang: "Debat", tempat: "IPS 1, IPS 2, IPA 1, IPA 2 (Gedung Bellarminus), lalu R. PKN, B. Indo 1, B. Indo 2, R. IPS (Gedung Xaverius). Final: Aula Lt. 4 Xaverius", tanggal: "19 - 24 September" },
      { cabang: "English debate", tempat: "Ruang kelas Gedung Xaverius (prelim, perempat final, semifinal). Final: Lantai 7, Gedung Ignatius", tanggal: "19 - 25 September" },
      { cabang: "Paduan suara", tempat: "Aula Lt. 7, Gedung Ignatius", tanggal: "21 September" },
      { cabang: "Digital painting", tempat: "Ruang Seni Budaya 2", tanggal: "21 September" },
      { cabang: "Film pendek", tempat: "Teater Lt. 4, Gedung Ignatius", tanggal: "19 - 22 September" },
      { cabang: "Band", tempat: "Teater Lt. 4, Gedung Ignatius", tanggal: "23 - 25 September" },
      { cabang: "Modern dance", tempat: "Sporthall", tanggal: "24 - 25 September" },
      { cabang: "Wall climb", tempat: "Ruang tunggu atlet: Ruang Akuntansi", tanggal: "19 - 26 September" },
      { cabang: "Posko P3K", tempat: "Ruang Agama 1 dan 2, Gedung Stanislaus", tanggal: "19 - 26 September" },
      { cabang: "Panitia keamanan", tempat: "Ruang Ekonomi, Lt. 2 Gedung Xaverius", tanggal: "19 - 26 September" },
      { cabang: "Penjualan tiket closing", tempat: "Ruang Multifungsi 2", tanggal: "23 - 25 September" },
      { cabang: "Acoustic corner dan photobooth", tempat: "Ruang Penjaskes 12.1 dan Ruang Audio Visual", tanggal: "19 - 26 September" }
    ],

    dresscode: [
      { siapa: "Semua peserta dan pengunjung", aturan: "Tidak boleh memakai pakaian terbuka: bikini, baju transparan, crop top, rok pendek, dan celana pendek.", kode: "PU-6" },
      { siapa: "Semua peserta dan pengunjung", aturan: "Wajib memakai sepatu atau alas kaki tertutup. Sandal jepit dan crocs dilarang.", kode: "PU-7" },
      { siapa: "Pemain mini soccer", aturan: "Kaos dan celana tim yang sama, bernomor punggung. Tanpa kaos tim, boleh seragam olahraga dan dipinjami rompi bernomor.", kode: "KP-7" },
      { siapa: "Penjaga gawang", aturan: "Kaos beda warna dengan tim. Sarung tangan disarankan.", kode: "KP-8" },
      { siapa: "Pemain mini soccer", aturan: "Sepatu pul atau sepatu futsal, kaos kaki panjang, dan pelindung tulang kering. Tanpa pelindung berarti kartu kuning.", kode: "KP-10" },
      { siapa: "Pemain mini soccer", aturan: "Tidak boleh memakai cincin, gelang, kalung, atau aksesori lain saat bertanding.", kode: "PL-1" },
      { siapa: "Panitia dan penonton", aturan: "Panitia harus mengenakan Dresscode yang sudah ditentukan.", kode: "" }
    ],

    larangan: "Dilarang membawa benda tajam, senjata, bahan peledak, minuman keras, obat terlarang, pilox, rokok, parfum, petasan, dan hewan peliharaan. Barang akan diamankan panitia dan tidak dikembalikan (PU-5). Dilarang merokok di seluruh area sekolah (PU-8).",

    denah: { image: "assets/denah.jpg", note: "Lapangan mini soccer ada di tengah, di depan Gedung Ignatius Loyola." },

    // Koordinator bidang mini soccer, dibagi per jenjang (SMP / SMA).
    // Tulis nama lengkap dan kelas saja, tanpa nomor HP.
    koorbid: [
      { jenjang: "SMP", jabatan: "Koordinator Bidang Mini Soccer SMP", nama: "Joseph Shevaro Hyarta Padmosepoetro", kelas: "8-3" },
      { jenjang: "SMP", jabatan: "Koordinator Bidang Mini Soccer SMP", nama: "Timothy Jaedon Ardent Silalahi", kelas: "9-4" },
      { jenjang: "SMA", jabatan: "Koordinator Bidang Mini Soccer SMA", nama: "Antonio Aldrich", kelas: "11-5" },
      { jenjang: "SMA", jabatan: "Koordinator Bidang Mini Soccer SMA", nama: "Hayden Aurelius Limanto", kelas: "12-1" }
    ],

    announcementCategories: [
      { id: "berlangsung", label: "Lomba berlangsung" },
      { id: "pemenang", label: "Pemenang & hadiah" },
      { id: "peserta", label: "Peserta lomba" },
      { id: "hilang", label: "Barang hilang" },
      { id: "tiket", label: "Tiket closing" },
      { id: "makanan", label: "Stand makanan" },
      { id: "umum", label: "Umum" }
    ],

    sop: SOP,
    cmp: CMP,
    // Sumber: teks biasa, atau { text, url } kalau ada alamat web resminya.
    sources: [
      "SOP Mini Soccer CC Cup XLI",
      { text: "IFAB, Laws of the Game 2026/27", url: "https://www.theifab.com/" }
    ]
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = CC_DATA;
