// UI kuis matematika: menu pilih topik → soal pilihan ganda → pembahasan →
// hasil. Digambar di canvas seperti ShopUI/Menu agar gaya pixel-art konsisten,
// tapi semua tombol bisa disentuh (klik/sentuh) maupun keyboard.
import { view } from '../render/renderer.js';
import { panel, text, wrap, UI } from './draw.js';

const LETTERS = ['A', 'B', 'C', 'D'];

export class MathUI {
  constructor(math, audio = null, onFinish = null) {
    this.math = math;
    this.audio = audio;
    this.onFinish = onFinish; // (summary) => void — untuk kirim ke Sheets
    this.open = false;
    this.screen = 'menu'; // menu | quiz | feedback | result
    this.cursor = 0;      // kursor menu / pilihan jawaban
    this.feedback = null; // hasil jawaban terakhir
    this.summary = null;
    this.sent = false;
    this.sentMsg = '';
    this.topicCursor = 0;
    this.levelCursor = 0;
    this.levels = ['campuran', 'X', 'XI', 'XII'];
    this._optionRects = [];
    this._menuRects = [];
  }

  openMenu() {
    this.open = true;
    this.screen = 'menu';
    this.cursor = 0;
    this.topicCursor = 0;
    this.levelCursor = 0;
  }

  close() { this.open = false; }

  startQuiz() {
    const topics = this.math.topics;
    const topic = this.topicCursor === 0 ? 'campuran' : topics[this.topicCursor - 1]?.id ?? 'campuran';
    const level = this.levels[this.levelCursor] ?? 'campuran';
    this.math.startSession({ topic, level, count: 10 });
    this.screen = 'quiz';
    this.cursor = 0;
    this.feedback = null;
    this.summary = null;
    this.sent = false;
    this.sentMsg = '';
  }

  chooseAnswer(i) {
    if (this.screen !== 'quiz') return;
    const r = this.math.answer(i);
    if (!r) return;
    this.feedback = r;
    this.screen = 'feedback';
    if (r.ok) this.audio?.coin(); else this.audio?.denied();
  }

  advanceFeedback() {
    if (this.screen !== 'feedback') return;
    if (this.math.next()) {
      this.screen = 'quiz';
      this.cursor = 0;
      this.feedback = null;
    } else {
      this.summary = this.math.finish();
      this.screen = 'result';
      this.cursor = 0;
      if (this.onFinish && this.summary) this.onFinish(this.summary);
    }
  }

  /** Keyboard: up/down/left/right/interact. Mengembalikan true kalau ditangani. */
  key(action) {
    if (!this.open) return false;
    if (this.screen === 'menu') {
      const topics = this.math.topics;
      const topicCount = topics.length + 1; // + Campuran
      if (action === 'up') { this.topicCursor = (this.topicCursor + topicCount - 1) % topicCount; this.audio?.ui(); }
      if (action === 'down') { this.topicCursor = (this.topicCursor + 1) % topicCount; this.audio?.ui(); }
      if (action === 'left') { this.levelCursor = (this.levelCursor + this.levels.length - 1) % this.levels.length; this.audio?.ui(); }
      if (action === 'right') { this.levelCursor = (this.levelCursor + 1) % this.levels.length; this.audio?.ui(); }
      if (action === 'interact') this.startQuiz();
      return true;
    }
    if (this.screen === 'quiz') {
      if (action === 'up') { this.cursor = (this.cursor + 3) % 4; this.audio?.ui(); }
      if (action === 'down') { this.cursor = (this.cursor + 1) % 4; this.audio?.ui(); }
      if (action === 'left') { this.cursor = (this.cursor + 3) % 4; this.audio?.ui(); }
      if (action === 'right') { this.cursor = (this.cursor + 1) % 4; this.audio?.ui(); }
      if (action === 'interact') this.chooseAnswer(this.cursor);
      return true;
    }
    if (this.screen === 'feedback') {
      if (action === 'interact') this.advanceFeedback();
      return true;
    }
    if (this.screen === 'result') {
      if (action === 'up' || action === 'down') { this.cursor = (this.cursor + 1) % 3; this.audio?.ui(); }
      if (action === 'interact') {
        if (this.cursor === 0) this.openMenu();
        else if (this.cursor === 1) this.startQuiz();
        else this.close();
      }
      return true;
    }
    return false;
  }

  /** Klik/sentuh pada koordinat logis. Mengembalikan true kalau kena tombol. */
  click(mx, my) {
    if (!this.open) return false;
    const hit = (rects) => rects.findIndex((r) => mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h);
    if (this.screen === 'menu') {
      const ti = hit(this._menuRects.topics);
      if (ti >= 0) { this.topicCursor = ti; this.startQuiz(); return true; }
      const li = hit(this._menuRects.levels);
      if (li >= 0) { this.levelCursor = li; this.audio?.ui(); return true; }
      if (hit(this._menuRects.close) >= 0) { this.close(); return true; }
      return false;
    }
    if (this.screen === 'quiz') {
      const i = hit(this._optionRects);
      if (i >= 0) { this.cursor = i; this.chooseAnswer(i); return true; }
      return false;
    }
    if (this.screen === 'feedback') {
      if (hit(this._menuRects.next) >= 0) { this.advanceFeedback(); return true; }
      return false;
    }
    if (this.screen === 'result') {
      const i = hit(this._menuRects.result);
      if (i >= 0) {
        this.cursor = i;
        if (i === 0) this.openMenu();
        else if (i === 1) this.startQuiz();
        else this.close();
        return true;
      }
      return false;
    }
    return false;
  }

  // ---------------------------------------------------------------- draw
  draw(ctx) {
    if (!this.open) return;
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, 0, view.w, view.h);
    if (this.screen === 'menu') this.drawMenu(ctx);
    else if (this.screen === 'quiz') this.drawQuiz(ctx);
    else if (this.screen === 'feedback') this.drawFeedback(ctx);
    else if (this.screen === 'result') this.drawResult(ctx);
  }

  _box(ctx, w, h) {
    const x = Math.round((view.w - w) / 2);
    const y = Math.round((view.h - h) / 2);
    panel(ctx, x, y, w, h);
    return { x, y, w, h };
  }

  _btn(ctx, x, y, w, h, label, active, font = UI.fontBig) {
    ctx.fillStyle = active ? '#e0a040' : UI.creamDark;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = UI.outline;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    text(ctx, label, x + w / 2, y + Math.round(h / 2) - 10, { font, align: 'center', color: active ? UI.outline : '#5a4a30' });
    return { x, y, w, h };
  }

  drawMenu(ctx) {
    const W = Math.min(560, view.w - 24);
    const H = Math.min(520, view.h - 24);
    const { x, y } = this._box(ctx, W, H);
    text(ctx, 'LATIHAN MATEMATIKA SMA', x + W / 2, y + 16, { font: UI.fontTitle, align: 'center', color: UI.red });
    text(ctx, 'Pilih topik, lalu ketuk untuk mulai (10 soal)', x + W / 2, y + 42, { font: UI.font, align: 'center', color: '#7a6647' });

    const topics = [{ id: 'campuran', name: 'Campuran (semua topik)' }, ...this.math.topics];
    const listY = y + 70;
    const rowH = 34;
    this._menuRects.topics = [];
    topics.forEach((t, i) => {
      const ry = listY + i * rowH;
      if (ry + rowH > y + H - 110) return;
      const on = i === this.topicCursor;
      if (on) { ctx.fillStyle = '#fff3d6'; ctx.fillRect(x + 16, ry - 2, W - 32, rowH - 4); }
      text(ctx, `${on ? '▶' : ' '} ${t.name}`, x + 28, ry + 4, { font: UI.fontBig, color: on ? UI.outline : '#5a4a30' });
      if (t.desc) text(ctx, t.desc, x + W - 28, ry + 6, { font: UI.font, align: 'right', color: '#7a6647' });
      this._menuRects.topics.push({ x: x + 16, y: ry - 2, w: W - 32, h: rowH - 4 });
    });

    // Pilihan level
    const ly = y + H - 96;
    text(ctx, 'Level:', x + 28, ly + 4, { font: UI.fontBig });
    this._menuRects.levels = [];
    const labels = ['Campuran', 'Kelas X', 'Kelas XI', 'Kelas XII'];
    labels.forEach((lab, i) => {
      const bx = x + 100 + i * 108;
      const r = this._btn(ctx, bx, ly, 100, 30, lab, i === this.levelCursor, UI.font);
      this._menuRects.levels.push(r);
    });

    this._menuRects.close = [this._btn(ctx, x + W / 2 - 70, y + H - 52, 140, 36, 'TUTUP (Esc)', false, UI.font)];
    text(ctx, 'Panah pilih topik · ←/→ level · E mulai · Esc tutup', x + W / 2, y + H - 20, { font: UI.font, align: 'center', color: '#7a6647' });
  }

  drawQuiz(ctx) {
    const q = this.math.current;
    const s = this.math.session;
    if (!q || !s) return;
    const W = Math.min(620, view.w - 24);
    const H = Math.min(520, view.h - 24);
    const { x, y } = this._box(ctx, W, H);
    text(ctx, `SOAL ${s.index + 1}/${s.total}  ·  ${this.math.topicName(q.topic)} · Kelas ${q.level}`, x + W / 2, y + 16, { font: UI.fontTitle, align: 'center', color: UI.red });
    text(ctx, `Benar: ${s.correct}   Salah: ${s.wrong}   XP sesi: ${s.xp}   Streak: ${s.streak}`, x + W / 2, y + 44, { font: UI.font, align: 'center', color: '#7a6647' });

    const lines = wrap(ctx, q.q, W - 56, UI.fontBig);
    lines.forEach((l, i) => text(ctx, l, x + 28, y + 74 + i * 24, { font: UI.fontBig }));

    const oy = y + 74 + lines.length * 24 + 14;
    this._optionRects = [];
    q.options.forEach((opt, i) => {
      const ry = oy + i * 52;
      const on = i === this.cursor;
      ctx.fillStyle = on ? '#fff3d6' : '#ffffff';
      ctx.fillRect(x + 24, ry, W - 48, 44);
      ctx.fillStyle = UI.outline;
      ctx.strokeRect(x + 24.5, ry + 0.5, W - 49, 43);
      text(ctx, `${LETTERS[i]}. ${opt}`, x + 40, ry + 10, { font: UI.fontBig, color: on ? UI.outline : '#3a2a2a' });
      this._optionRects.push({ x: x + 24, y: ry, w: W - 48, h: 44 });
    });
    text(ctx, 'Panah / ketuk pilih jawaban · E konfirmasi', x + W / 2, y + H - 24, { font: UI.font, align: 'center', color: '#7a6647' });
  }

  drawFeedback(ctx) {
    const r = this.feedback;
    const q = r?.question;
    if (!r || !q) return;
    const W = Math.min(620, view.w - 24);
    const H = Math.min(480, view.h - 24);
    const { x, y } = this._box(ctx, W, H);
    const ok = r.ok;
    text(ctx, ok ? `BENAR! +${r.xp} XP  +${r.coins} koin` : 'BELUM TEPAT', x + W / 2, y + 18, { font: UI.fontTitle, align: 'center', color: ok ? '#2f7a1e' : UI.red });
    if (r.streak >= 3) text(ctx, `Streak ${r.streak} — bonus XP aktif!`, x + W / 2, y + 48, { font: UI.fontBig, align: 'center', color: '#b8860b' });

    let ly = y + 78;
    text(ctx, `Jawaban benar: ${LETTERS[q.answer]}. ${q.options[q.answer]}`, x + 28, ly, { font: UI.fontBig, color: ok ? '#2f7a1e' : UI.red });
    ly += 34;
    text(ctx, 'Pembahasan:', x + 28, ly, { font: UI.fontBig, color: '#8a2c1d' });
    ly += 26;
    wrap(ctx, q.explain, W - 56, UI.font).forEach((l, i) => text(ctx, l, x + 28, ly + i * 20, { font: UI.font }));

    const last = this.math.session.index >= this.math.session.questions.length - 1;
    this._menuRects.next = [this._btn(ctx, x + W / 2 - 110, y + H - 64, 220, 40, last ? 'LIHAT HASIL' : 'SOAL BERIKUTNYA (E)', false)];
    text(ctx, 'Ketuk tombol atau tekan E', x + W / 2, y + H - 24, { font: UI.font, align: 'center', color: '#7a6647' });
  }

  drawResult(ctx) {
    const s = this.summary;
    if (!s) return;
    const W = Math.min(560, view.w - 24);
    const H = Math.min(480, view.h - 24);
    const { x, y } = this._box(ctx, W, H);
    text(ctx, 'HASIL KUIS', x + W / 2, y + 18, { font: UI.fontTitle, align: 'center', color: UI.red });
    text(ctx, `${s.topic} · Level ${s.level}`, x + W / 2, y + 48, { font: UI.fontBig, align: 'center', color: '#7a6647' });

    const rows = [
      ['Skor', `${s.score} / 100`],
      ['Benar', `${s.correct} dari ${s.total}`],
      ['Salah', `${s.wrong}`],
      ['XP didapat', `+${s.xp}`],
      ['Koin didapat', `+${s.coins}`],
      ['Streak terbaik', `${s.bestStreak}`],
    ];
    rows.forEach(([k, v], i) => {
      const ry = y + 84 + i * 34;
      text(ctx, k, x + 60, ry, { font: UI.fontBig, color: '#5a4a30' });
      text(ctx, v, x + W - 60, ry, { font: UI.fontBig, align: 'right' });
    });

    const msg = this.sentMsg || (this.sent ? 'Nilai terkirim ke Google Sheets ✓' : 'Nilai tersimpan lokal — akan dikirim ke Sheets');
    text(ctx, msg, x + W / 2, y + 84 + rows.length * 34 + 6, { font: UI.font, align: 'center', color: this.sent ? '#2f7a1e' : '#7a6647' });

    const labels = ['GANTI TOPIK', 'MAIN LAGI', 'TUTUP'];
    this._menuRects.result = labels.map((lab, i) => {
      const bx = x + 40 + i * ((W - 80) / 3);
      return this._btn(ctx, bx, y + H - 64, (W - 80) / 3 - 12, 40, lab, i === this.cursor, UI.font);
    });
    text(ctx, 'Panah pilih · E konfirmasi · Esc tutup', x + W / 2, y + H - 24, { font: UI.font, align: 'center', color: '#7a6647' });
  }
}
