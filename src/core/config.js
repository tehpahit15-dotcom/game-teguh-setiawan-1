// Konfigurasi pusat game.
//
// SHEETS_URL: URL Web App Google Apps Script yang terhubung ke Google Sheets.
// Cara mengisi: lihat docs/GOOGLE_SHEETS_SETUP.md — buat Spreadsheet, tempel
// kode di tools/apps-script/Code.gs, Deploy → Web App, salin URL-nya ke sini.
// Selama kosong, game tetap jalan penuh: data disimpan di localStorage dan
// antrean dikirim otomatis begitu URL diisi.
export const CONFIG = {
  SHEETS_URL: 'https://script.google.com/macros/s/AKfycbyumVx91dGRXoM2PbFcI8tRTrStJD567Tty5NsNk88LULRowByrpBDc5sTs23bKnPad_w/exec',
  SCHOOL_NAME: 'SMA Lembah Kenanga',
  APP_NAME: 'Lembah Kenanga — Matematika SMA',
};

export function sheetsConfigured() {
  return !!(CONFIG.SHEETS_URL && CONFIG.SHEETS_URL.startsWith('http'));
}
