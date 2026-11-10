# Deploy — Game Bisa Dimainkan Langsung dari Browser Siswa

Game ini **statis** (HTML/CSS/JS + gambar). Tidak butuh server khusus untuk belajar matematika — obrolan multiplayer opsional dan mati otomatis kalau server tidak ada. Pilih salah satu cara gratis di bawah.

## Opsi A — GitHub Pages (disarankan, gratis, URL permanen)

1. Push repo ke GitHub (mis. `username/lembah-kenanga`).
2. Repo sudah berisi workflow `.github/workflows/pages.yml` yang otomatis:
   - menjalankan `python tools/publish.py` → folder `dist/`
   - menerbitkan `dist/` ke GitHub Pages.
3. Di GitHub: **Settings → Pages → Source: GitHub Actions**.
4. Tunggu workflow selesai → game live di `https://username.github.io/lembah-kenanga/`.
5. Bagikan link itu ke siswa. Di HP: buka link → menu browser → **Add to Home Screen** agar terasa seperti aplikasi.

> Catatan: GitHub Pages menyajikan dari subfolder (`/lembah-kenanga/`). Game sudah mendukung ini — alamat API dihitung dari posisi modul (`src/core/api.js`), dan semua aset memakai path relatif.

## Opsi B — Netlify Drop (paling cepat, tanpa GitHub)

1. Jalankan `python tools/publish.py --zip` → dapat `dist.zip`.
2. Buka [app.netlify.com/drop](https://app.netlify.com/drop), seret `dist.zip` (atau folder `dist/`).
3. Langsung dapat URL seperti `https://lembah-kenanga-xxxx.netlify.app`. Bagikan ke siswa.

## Opsi C — Vercel

1. `python tools/publish.py` → folder `dist/`.
2. `npx vercel deploy dist --prod` (atau import folder di dashboard Vercel).
3. Dapat URL `*.vercel.app`.

## Opsi D — Server sekolah / hosting sendiri

1. `python tools/publish.py` → unggah isi `dist/` ke web root (mis. via FTP/cPanel).
2. (Opsional, untuk obrolan multiplayer) jalankan `python tools/serve.py 47311 --host 127.0.0.1` dan teruskan `/api/` lewat reverse proxy. Tanpa ini, game tetap bisa dimainkan — hanya obrolan & akun server yang mati.

## Setelah deploy

1. Isi `SHEETS_URL` di `src/core/config.js` (lihat [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)), commit, push → workflow deploy ulang otomatis.
2. Uji dari HP: daftar → main kuis → cek Google Sheets bertambah.
3. Bagikan link game + kode QR-nya ke kelas. Selesai!

## PWA / “Install” di HP

Game sudah punya `manifest.json` + `sw.js` (service worker). Setelah dibuka sekali, siswa bisa:

- Android Chrome: menu ⋮ → **Install app / Add to Home screen**
- iPhone Safari: Share → **Add to Home Screen**

Game lalu bisa dibuka offline dari ikon layar utama.
