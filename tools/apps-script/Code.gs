/**
 * Lembah Kenanga — Matematika SMA: backend Google Sheets via Apps Script.
 *
 * CARA PASANG (sekali saja, ±5 menit):
 * 1. Buat Google Spreadsheet baru di drive.google.com → beri nama
 *    "Lembah Kenanga — Nilai Matematika".
 * 2. Di spreadsheet: menu Extensions → Apps Script.
 * 3. Hapus isi editor, lalu tempel SELURUH berkas ini.
 * 4. Klik Deploy → New deployment → pilih type "Web app".
 *    - Description: "Lembah Kenanga Sheets"
 *    - Execute as: Me
 *    - Who has access: Anyone (siapa pun bisa mengakses — wajib agar HP siswa bisa mengirim)
 * 5. Klik Deploy → Authorize → salin URL Web App yang muncul
 *    (bentuknya https://script.google.com/macros/s/AKfyc.../exec).
 * 6. Tempel URL itu ke src/core/config.js → SHEETS_URL, lalu deploy ulang game.
 *
 * Sheet yang dibuat otomatis:
 *  - "Pendaftaran": Timestamp | Nama | Kelas | Username | Avatar
 *  - "Nilai":        Timestamp | Nama | Kelas | Username | Topik | Level |
 *                    Skor | Benar | Salah | Total | XP | Streak
 *
 * Uji cepat: buka URL Web App di browser → harus muncul
 * {"ok":true,"app":"Lembah Kenanga Sheets"}.
 */

const SHEET_DAFTAR = 'Pendaftaran';
const SHEET_NILAI = 'Nilai';

function doGet() {
  return jsonOut({ ok: true, app: 'Lembah Kenanga Sheets', time: new Date().toISOString() });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action;
    if (action === 'register') return jsonOut(registerStudent(body));
    if (action === 'score') return jsonOut(submitScore(body));
    return jsonOut({ ok: false, error: 'action tidak dikenal: ' + action });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function registerStudent(b) {
  const sh = getSheet_(SHEET_DAFTAR, ['Timestamp', 'Nama', 'Kelas', 'Username', 'Avatar']);
  sh.appendRow([new Date(), b.nama || '', b.kelas || '', b.username || '', b.avatar || '']);
  return { ok: true };
}

function submitScore(b) {
  const sh = getSheet_(SHEET_NILAI, ['Timestamp', 'Nama', 'Kelas', 'Username', 'Topik', 'Level', 'Skor', 'Benar', 'Salah', 'Total', 'XP', 'Streak']);
  sh.appendRow([
    new Date(),
    b.nama || '',
    b.kelas || '',
    b.username || '',
    b.topik || '',
    b.level || '',
    b.skor ?? '',
    b.benar ?? '',
    b.salah ?? '',
    b.total ?? '',
    b.xp ?? '',
    b.streak ?? '',
  ]);
  return { ok: true };
}
