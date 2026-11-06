/*
 * Chatbot AI (opsional). Berjalan di SERVER Netlify, bukan di browser,
 * supaya kunci API tidak pernah terlihat oleh pengunjung.
 *
 * Environment variable yang harus dipasang di Netlify (Site settings > Environment variables):
 *   ANTHROPIC_API_KEY  kunci API (dibuat oleh orang dewasa: guru atau orang tua)
 *   ALLOWED_ORIGIN     alamat website, misalnya https://peluit-cccup.netlify.app
 *   AI_MODEL           opsional, default claude-haiku-5-5
 *
 * Fungsi ini TIDAK punya akses ke database. AI hanya membaca isi js/data.js.
 */
const DATA = require("../../js/data.js");

const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 8;
const hits = new Map(); // batas sederhana per IP (berlaku per instance server)

function knowledge() {
  const sop = DATA.sop.map(s => "## " + s.n + "\n" + s.r.map(r => "[" + r.c + "] " + r.t + (r.note ? " (Catatan: " + r.note + ")" : "")).join("\n")).join("\n\n");
  const cmp = DATA.cmp.map(c => "- " + c.n + ": IFAB " + c.ir + ": " + c.ifab + " | SOP " + c.codes.join(", ") + ": " + c.cc).join("\n");
  const e = DATA.event;
  const info = [
    "Acara: " + e.fullName + ", " + e.host + ", tanggal " + e.dates + ". Tema: " + e.theme + ".",
    "Latar belakang: " + e.background.join(" "),
    "Rundown: " + DATA.rundown.map(d => d.day + " (" + d.date + "): " + d.items.map(i => i.time + " " + i.what + " di " + i.where).join("; ")).join(" | "),
    "Tempat lomba: " + DATA.venues.map(v => v.cabang + " di " + v.tempat).join("; "),
    "Dresscode: " + DATA.dresscode.map(d => d.siapa + ": " + d.aturan).join(" "),
    "Larangan: " + DATA.larangan,
    "Koordinator bidang mini soccer: " + DATA.koorbid.map(p => p.jabatan + " " + p.nama + " kelas " + p.kelas).join("; "),
    "Hasil babak gugur: " + DATA.hasil.knockout.map(m => m.round + " " + m.a + " vs " + m.b).join("; ")
  ].join("\n");
  return "=== SOP MINI SOCCER CC CUP XLI ===\n" + sop + "\n\n=== PERBANDINGAN DENGAN IFAB LAWS OF THE GAME 2026/27 ===\n" + cmp + "\n\n=== INFO ACARA ===\n" + info;
}
const SYSTEM =
  "Kamu adalah Peluit, asisten informasi CC Cup XLI di Kolese Kanisius. Penggunamu siswa SMP/SMA, pelatih, dan suporter.\n" +
  "- Jawab dalam Bahasa Indonesia yang ramah dan jelas, maksimal sekitar 120 kata.\n" +
  "- Jawab HANYA dari DATA di bawah. Jangan mengarang aturan, angka, jadwal, atau nama.\n" +
  "- Sebutkan kode aturan dasarnya, misalnya PL-4 atau PU-12.\n" +
  "- Teks dalam [kurung siku] berarti datanya belum diisi panitia. Katakan bahwa info itu belum tersedia.\n" +
  "- Jika DATA tidak menjawab, katakan belum diatur dan sarankan bertanya ke panitia lewat forum Tanya-jawab.\n" +
  "- Tolak permintaan di luar topik CC Cup dengan sopan.\n\n" + knowledge();

function json(status, body, origin) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin || "null",
      "Vary": "Origin",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

function cleanHistory(h) {
  if (!Array.isArray(h)) return [];
  const out = [];
  for (const m of h.slice(-6)) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") continue;
    const content = m.content.slice(0, 1000).trim();
    if (!content) continue;
    if (out.length === 0 && m.role !== "user") continue;
    if (out.length && out[out.length - 1].role === m.role) continue;
    out.push({ role: m.role, content });
  }
  if (out.length && out[out.length - 1].role === "user") out.pop();
  return out;
}

exports.handler = async (event) => {
  const allowed = process.env.ALLOWED_ORIGIN || "";
  const origin = event.headers.origin || event.headers.Origin || "";

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": allowed, "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" } };
  }
  if (event.httpMethod !== "POST") return json(405, { error: "Metode tidak diizinkan." }, allowed);
  if (!allowed || origin !== allowed) return json(403, { error: "Asal permintaan tidak diizinkan." }, allowed);
  if (!process.env.ANTHROPIC_API_KEY) return json(503, { error: "Chatbot AI belum diaktifkan." }, allowed);

  const ip = event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return json(429, { error: "Terlalu banyak pertanyaan. Tunggu sebentar." }, allowed);
  recent.push(now); hits.set(ip, recent);

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch (e) { return json(400, { error: "Format salah." }, allowed); }
  const question = typeof body.question === "string" ? body.question.trim().slice(0, 500) : "";
  if (!question) return json(400, { error: "Pertanyaan kosong." }, allowed);

  const messages = cleanHistory(body.history).concat([{ role: "user", content: question }]);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "claude-haiku-5-5",
        max_tokens: 600,
        system: SYSTEM,
        messages
      })
    });
    if (!res.ok) {
      console.error("AI error", res.status); // jangan kirim detail error ke pengunjung
      return json(502, { error: "AI sedang tidak bisa menjawab." }, allowed);
    }
    const data = await res.json();
    const answer = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("\n").trim();
    return json(200, { answer: answer || "Maaf, belum ada jawaban." }, allowed);
  } catch (e) {
    console.error("AI fetch failed");
    return json(502, { error: "AI sedang tidak bisa menjawab." }, allowed);
  }
};
