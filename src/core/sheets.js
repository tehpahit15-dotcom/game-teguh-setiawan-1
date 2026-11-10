// Klien Google Sheets via Apps Script Web App.
//
// Dua aksi:
//   register  -> baris baru di sheet "Pendaftaran" (nama, kelas, username, avatar)
//   score     -> baris baru di sheet "Nilai" (nama, kelas, topik, skor, xp, ...)
//
// Apps Script tidak mendukung CORS penuh dari semua browser, jadi pengiriman
// memakai fetch biasa dulu; kalau gagal (mis. CORS/opaque), diulang dengan
// mode 'no-cors' yang selalu "berhasil" dari sisi browser. Apa pun hasilnya,
// setiap payload juga masuk antrean localStorage dan dikirim ulang saat
// online berikutnya — nilai tidak pernah hilang hanya karena Wi-Fi mati.
import { CONFIG, sheetsConfigured } from './config.js';

const QUEUE_KEY = 'lk_sheets_queue';
const STUDENT_KEY = 'lk_student';

function readQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
}
function writeQueue(q) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch {}
}

export function saveStudentLocal(student) {
  try { localStorage.setItem(STUDENT_KEY, JSON.stringify(student)); } catch {}
}
export function readStudentLocal() {
  try { return JSON.parse(localStorage.getItem(STUDENT_KEY) || 'null'); } catch { return null; }
}

function enqueue(payload) {
  const q = readQueue();
  q.push({ ...payload, _queuedAt: new Date().toISOString() });
  writeQueue(q);
}

async function postPayload(payload) {
  if (!sheetsConfigured()) return { ok: false, offline: true, reason: 'SHEETS_URL belum diisi' };
  const url = CONFIG.SHEETS_URL;
  // Percobaan 1: fetch normal (Apps Script mengembalikan JSON).
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (data && data.ok) return { ok: true, data };
  } catch { /* jatuh ke no-cors */ }
  // Percobaan 2: no-cors — browser tidak bisa membaca balasan, tapi request
  // tetap sampai ke Apps Script. Dianggap terkirim.
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    return { ok: true, opaque: true };
  } catch {
    return { ok: false, offline: true };
  }
}

/** Daftarkan siswa ke sheet Pendaftaran. Selalu disimpan lokal dulu. */
export async function registerStudent(student) {
  saveStudentLocal(student);
  const payload = { action: 'register', ...student, tanggal: new Date().toISOString() };
  const r = await postPayload(payload);
  if (!r.ok) enqueue(payload);
  return r;
}

/** Kirim hasil kuis ke sheet Nilai. */
export async function submitScore(score) {
  const payload = { action: 'score', ...score, tanggal: new Date().toISOString() };
  const r = await postPayload(payload);
  if (!r.ok) enqueue(payload);
  return r;
}

/** Kirim ulang antrean yang tertunda (dipanggil saat game dibuka). */
export async function flushQueue() {
  if (!sheetsConfigured()) return { sent: 0, pending: readQueue().length };
  const q = readQueue();
  if (!q.length) return { sent: 0, pending: 0 };
  let sent = 0;
  const rest = [];
  for (const item of q) {
    const { _queuedAt, ...payload } = item;
    const r = await postPayload(payload);
    if (r.ok) sent++;
    else rest.push(item);
  }
  writeQueue(rest);
  return { sent, pending: rest.length };
}

export function pendingCount() { return readQueue().length; }
