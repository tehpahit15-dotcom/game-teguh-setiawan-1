# Google Sheet — Lembah Kenanga Nilai Matematika

- Nama: Lembah Kenanga — Nilai Matematika
- ID: 1Y75P_kojD9_XFexcg0Y0-IhBHF_RyRwYjOxYUIibdCQ
- Link: https://docs.google.com/spreadsheets/d/1Y75P_kojD9_XFexcg0Y0-IhBHF_RyRwYjOxYUIibdCQ/edit?usp=drivesdk
- Isi:
  - Pendaftaran: Timestamp | Nama | Kelas | Username | Avatar
  - Nilai: Timestamp | Nama | Kelas | Username | Topik | Level | Skor | Benar | Salah | Total | XP | Streak
  - Panduan: langkah aktivasi + kode Apps Script

## Langkah terakhir (wajib, ±3 menit)
Spreadsheet sudah jadi, tapi agar game BISA MENULIS ke sheet ini perlu
satu kali klik Deploy Apps Script (tidak bisa via API Drive):

1. Buka link sheet di atas → Extensions → Apps Script
2. Hapus isi editor → tempel kode di sheet "Panduan" (atau tools/apps-script/Code.gs)
3. Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone → Deploy → Authorize
4. Salin URL Web App (.../exec) → tempel ke src/core/config.js → SHEETS_URL
5. Deploy ulang game → daftar + main kuis → cek baris baru muncul di sheet

## Web App (sudah terpasang di game)
- URL: https://script.google.com/macros/s/AKfycbyumVx91dGRXoM2PbFcI8tRTrStJD567Tty5NsNk88LULRowByrpBDc5sTs23bKnPad_w/exec
- Status: TERUJI OK (GET {"ok":true}, POST register/score masuk ke sheet)
- Terpasang di: src/core/config.js → SHEETS_URL (sudah di-build ke dist/)

## Catatan data tes
Baris "Tes Koneksi", "Tes Koneksi 2", "Tes", "Tes Manual" di sheet Pendaftaran
adalah data uji dari verifikasi — aman dihapus manual oleh guru.
