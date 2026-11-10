# Google Sheets Setup — Pendaftaran & Nilai Siswa

Game ini mengirim dua jenis data ke Google Sheets lewat **Apps Script Web App**:

| Aksi | Sheet | Isi |
|---|---|---|
| `register` | **Pendaftaran** | Timestamp, Nama, Kelas, Username, Avatar |
| `score` | **Nilai** | Timestamp, Nama, Kelas, Username, Topik, Level, Skor, Benar, Salah, Total, XP, Streak |

Siswa mengisi **Nama + Kelas + Username** di halaman utama. Setiap selesai kuis 10 soal, nilai otomatis terkirim. Kalau internet mati, data masuk antrean `localStorage` dan terkirim otomatis saat online lagi.

## Langkah pasang (±5 menit, sekali saja)

1. Buka [drive.google.com](https://drive.google.com) → **New → Google Sheets** → beri nama `Lembah Kenanga — Nilai Matematika`.
2. Di spreadsheet: menu **Extensions → Apps Script**.
3. Hapus isi editor, tempel seluruh isi [`tools/apps-script/Code.gs`](../tools/apps-script/Code.gs).
4. Klik **Deploy → New deployment** → type **Web app**:
   - Description: `Lembah Kenanga Sheets`
   - Execute as: **Me**
   - Who has access: **Anyone** ← wajib, agar HP siswa bisa mengirim
5. Klik **Deploy → Authorize access** → salin **Web App URL** (berakhiran `/exec`).
6. Buka file `src/core/config.js` di repo game, isi:

   ```js
   SHEETS_URL: 'https://script.google.com/macros/s/AKfyc.../exec',
   ```

7. Deploy ulang game (lihat [DEPLOY.md](DEPLOY.md)). Selesai!

## Uji cepat

- Buka URL Web App di browser → harus muncul `{"ok":true,"app":"Lembah Kenanga Sheets"}`.
- Daftar satu siswa dummy → cek sheet **Pendaftaran** bertambah 1 baris.
- Selesaikan 1 kuis → cek sheet **Nilai** bertambah 1 baris.

## Tips untuk guru

- **Filter per kelas:** di sheet Nilai, pakai Data → Create filter, lalu filter kolom Kelas.
- **Rekap nilai:** tambahkan rumus di baris baru, mis. `=AVERAGEIF(B:B;"XI-1";G:G)` untuk rata-rata skor kelas XI-1.
- **Privasi:** sheet hanya bisa dilihat akun Google guru. Siswa hanya bisa *menulis* lewat Web App, tidak bisa membaca sheet.
- **Ganti spreadsheet:** cukup buat spreadsheet baru, ulangi langkah 2–6, ganti URL di `config.js`.
- **Update kode Apps Script:** edit di editor → Deploy → Manage deployments → Edit → Version: New version → Deploy. URL tetap sama.

## Cara kerja di sisi game

- `src/core/sheets.js` — `registerStudent()` saat daftar, `submitScore()` saat kuis selesai, `flushQueue()` saat game dibuka.
- `src/core/config.js` — satu-satunya tempat mengisi URL.
- Tanpa URL (kosong), game tetap jalan penuh: semua data tersimpan lokal dan antrean menunggu URL diisi.
