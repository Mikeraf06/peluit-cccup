/*
 * GET /api/status
 * Cek kesehatan website untuk pemantauan (misalnya UptimeRobot atau GitHub Actions).
 * Tidak membocorkan rahasia: hanya menyebut fitur mana yang aktif, bukan nilainya.
 */
const DATA = require("../../js/data.js");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET" && event.httpMethod !== "HEAD") {
    return { statusCode: 405, headers: { "Content-Type": "application/json", "Allow": "GET" }, body: JSON.stringify({ error: "Metode tidak diizinkan." }) };
  }
  const body = {
    ok: true,
    service: "peluit-cccup",
    version: process.env.COMMIT_REF ? process.env.COMMIT_REF.slice(0, 7) : "lokal",
    time: new Date().toISOString(),
    checks: {
      data: Array.isArray(DATA.sop) && DATA.sop.length > 0,
      ai: !!process.env.ANTHROPIC_API_KEY
    }
  };
  body.ok = body.checks.data;
  return {
    statusCode: body.ok ? 200 : 503,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(body)
  };
};
