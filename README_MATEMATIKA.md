# Lembah Kenanga — Petualangan Matematika SMA

Versi pembelajaran dari [Lembah Kenanga](https://github.com/bangtutorial/lembah-kenanga):
game petualangan desa pixel-art yang kini menjadi **game belajar matematika SMA**
yang bisa dimainkan langsung dari browser HP siswa, dengan pendaftaran & nilai
yang tercatat di **Google Sheets**.

## Yang baru

| Fitur | Detail |
|---|---|
| 📐 **Kuis matematika SMA** | 59 soal pilihan ganda + pembahasan: Aljabar, Geometri, Trigonometri, Statistika, Peluang, Logika & Himpunan, Kalkulus Dasar (Kelas X–XII). 10 soal per kuis, pilih topik & level. Benar = +100 XP + 50 koin, streak = bonus. |
| 🏫 **Di dalam dunia game** | Papan Matematika di plaza (dekat Balai Desa) + NPC **Bu Guru Ratna**. Tekan `M` / tombol 📐 / `E` di papan untuk mulai. HUD menampilkan Level & XP. |
| 📱 **Kontrol HP** | Joystick virtual (kiri), tombol E / 📐 / 🎒 / ☰ / 🏃 / 🎁 (kanan), tombol Matematika & Layar Penuh (atas), jawaban kuis tinggal ketuk. Viewport mobile, saran landscape, PWA (`manifest.json` + `sw.js`) bisa “Add to Home Screen” & offline. |
| 📝 **Pendaftaran siswa** | Nama lengkap + Kelas (X-1 … XII-8) + Username + Avatar di halaman utama. |
| 📊 **Google Sheets** | Sheet **Pendaftaran** (nama, kelas, username) dan sheet **Nilai** (topik, skor, benar/salah, XP, streak, tanggal). Antrean offline otomatis. Setup: [docs/GOOGLE_SHEETS_SETUP.md](docs/GOOGLE_SHEETS_SETUP.md), kode Apps Script: [tools/apps-script/Code.gs](tools/apps-script/Code.gs). |
| 🚀 **Siap deploy** | GitHub Pages otomatis (`.github/workflows/pages.yml`), Netlify (`netlify.toml`), Vercel (`vercel.json`). Panduan: [docs/DEPLOY.md](docs/DEPLOY.md). |

## Menjalankan lokal

```bash
git clone <repo-ini>
cd lembah-kenanga
python tools/serve.py
# buka http://localhost:47311
```

Atau tanpa server Python (statis saja — obrolan mati, matematika tetap jalan):

```bash
python tools/publish.py   # -> dist/
# sajikan dist/ dengan server statis apa pun, mis. npx serve dist
```

## Menghubungkan Google Sheets (sekali saja)

1. Buat Spreadsheet → Extensions → Apps Script → tempel `tools/apps-script/Code.gs`.
2. Deploy → Web app → Who has access: **Anyone** → salin URL `/exec`.
3. Tempel ke `src/core/config.js` → `SHEETS_URL`. Selesai — detail di [docs/GOOGLE_SHEETS_SETUP.md](docs/GOOGLE_SHEETS_SETUP.md).

## Struktur tambahan

```
src/data/math.json        Bank soal + daftar topik SMA
src/systems/math.js       Mesin kuis: sesi, XP, streak, level, statistik
src/ui/math-ui.js         Layar kuis (menu → soal → pembahasan → hasil)
src/ui/touch.js           Kontrol sentuh HP (joystick + tombol)
src/core/sheets.js        Klien Google Sheets + antrean offline
src/core/config.js        SHEETS_URL (isi URL Apps Script di sini)
tools/apps-script/Code.gs Backend Apps Script (2 sheet otomatis)
manifest.json, sw.js      PWA: install + offline
.github/workflows/pages.yml  Deploy GitHub Pages otomatis
```

## Catatan

- Bu Guru Ratna memakai sprite/portrait yang sudah ada (`npc_ratna`) agar tanpa aset baru — ganti di `src/data/npcs.json` kalau nanti ada sprite guru khusus.
- Tanpa `SHEETS_URL`, game tetap jalan penuh; data tersimpan lokal dan terkirim otomatis begitu URL diisi.
- Bertani, memancing, berdagang, dan bersosialisasi tetap ada sebagai aktivitas pengumpul koin di dunia desa.
