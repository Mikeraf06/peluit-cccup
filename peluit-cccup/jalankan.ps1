# Menjalankan website di http://localhost:5500 supaya login Google/Yahoo/Microsoft bisa dicoba.
# (Login Firebase tidak bisa dari file yang dibuka dengan klik dua kali.)
# Cara pakai: klik dua kali jalankan.bat, atau jalankan:  powershell -ExecutionPolicy Bypass -File jalankan.ps1
# Hentikan dengan Ctrl+C atau tutup jendelanya.

$port = 5500
$root = (Resolve-Path $PSScriptRoot).Path
$types = @{
  ".html" = "text/html; charset=utf-8"; ".css" = "text/css; charset=utf-8"; ".js" = "text/javascript; charset=utf-8"; ".mjs" = "text/javascript; charset=utf-8"
  ".json" = "application/json"; ".png" = "image/png"; ".jpg" = "image/jpeg"; ".jpeg" = "image/jpeg"
  ".svg" = "image/svg+xml; charset=utf-8"; ".webp" = "image/webp"; ".ico" = "image/x-icon"
}
# Hanya file website yang dilayani; file lain (misalnya .env) ditolak.
$blocked = @(".env", ".ps1", ".bat", ".md", ".rules", ".toml")

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try { $listener.Start() } catch { Write-Host "Port $port sedang dipakai. Tutup jendela server lain lalu coba lagi."; Read-Host "Tekan Enter"; exit 1 }
Write-Host "Website berjalan di http://localhost:$port  (Ctrl+C untuk berhenti)"
Start-Process "http://localhost:$port/"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $res = $ctx.Response
    try {
      $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart("/")
      if ($rel -eq "") { $rel = "index.html" }
      $full = [IO.Path]::GetFullPath([IO.Path]::Combine($root, $rel))
      $ext = [IO.Path]::GetExtension($full).ToLower()
      $name = [IO.Path]::GetFileName($full).ToLower()
      $inside = $full.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)
      if (-not $inside -or $name.StartsWith(".") -or $blocked -contains $ext -or -not (Test-Path -LiteralPath $full -PathType Leaf)) {
        $res.StatusCode = 404
        $page404 = Join-Path $root "404.html"
        if (Test-Path -LiteralPath $page404) { $bytes = [IO.File]::ReadAllBytes($page404); $res.ContentType = $types[".html"] }
        else { $bytes = [Text.Encoding]::UTF8.GetBytes("Tidak ditemukan") }
      } else {
        $bytes = [IO.File]::ReadAllBytes($full)
        if ($types.ContainsKey($ext)) { $res.ContentType = $types[$ext] } else { $res.ContentType = "application/octet-stream" }
        $res.Headers.Add("Cache-Control", "no-store")
      }
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch { $res.StatusCode = 500 } finally { $res.Close() }
  }
} finally { $listener.Stop() }
