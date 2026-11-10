// Sistem pembelajaran matematika SMA.
//
// Satu sesi kuis = N soal dari satu topik (atau campuran). Jawaban benar
// memberi XP + koin + bonus streak; jawaban salah menampilkan pembahasan.
// Statistik total disimpan di save agar papan peringkat lokal dan level
// pemain bertahan antar sesi.
export const XP_PER_CORRECT = 100;
export const COINS_PER_CORRECT = 50;
export const STREAK_BONUS = 10; // XP ekstra per streak di atas 2

export class MathSystem {
  constructor() {
    this.bank = [];        // semua soal dari math.json
    this.topics = [];
    this.session = null;   // {topicId, level, questions, index, correct, wrong, xp, coins, streak, bestStreak, answers}
    this.stats = {
      xp: 0,
      level: 1,
      sessions: 0,
      answered: 0,
      correct: 0,
      bestStreak: 0,
      lastScore: null,
    };
  }

  load(data) {
    this.bank = data.questions ?? [];
    this.topics = data.topics ?? [];
  }

  topicName(id) {
    if (id === 'campuran') return 'Campuran';
    return this.topics.find((t) => t.id === id)?.name ?? id;
  }

  /** Ambil soal sesuai filter, diacak, tanpa pengulangan dalam satu sesi. */
  pickQuestions({ topic = 'campuran', level = 'campuran', count = 10 } = {}) {
    let pool = this.bank.filter((q) =>
      (topic === 'campuran' || q.topic === topic) &&
      (level === 'campuran' || q.level === level));
    if (pool.length < count) {
      // Longgarkan filter level dulu, lalu topik — lebih baik dapat soal
      // campuran daripada sesi kosong.
      pool = this.bank.filter((q) => topic === 'campuran' || q.topic === topic);
    }
    if (pool.length < count) pool = [...this.bank];
    // Fisher–Yates
    const arr = [...pool];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, Math.min(count, arr.length));
  }

  startSession(opts) {
    const questions = this.pickQuestions(opts);
    this.session = {
      topic: opts.topic ?? 'campuran',
      level: opts.level ?? 'campuran',
      questions,
      index: 0,
      correct: 0,
      wrong: 0,
      xp: 0,
      coins: 0,
      streak: 0,
      bestStreak: 0,
      answers: [], // {id, picked, ok}
      finished: false,
    };
    return this.session;
  }

  get active() { return !!this.session && !this.session.finished; }
  get current() { return this.session ? this.session.questions[this.session.index] : null; }
  get total() { return this.session ? this.session.questions.length : 0; }

  /** Jawab soal aktif. Mengembalikan {ok, xp, coins, streak}. */
  answer(picked) {
    const s = this.session;
    if (!s || s.finished) return null;
    const q = this.current;
    if (!q) return null;
    const ok = picked === q.answer;
    s.answers.push({ id: q.id, picked, ok });
    let xp = 0, coins = 0;
    if (ok) {
      s.correct++;
      s.streak++;
      s.bestStreak = Math.max(s.bestStreak, s.streak);
      xp = XP_PER_CORRECT + (s.streak > 2 ? (s.streak - 2) * STREAK_BONUS : 0);
      coins = COINS_PER_CORRECT + (s.streak > 2 ? (s.streak - 2) * 10 : 0);
      s.xp += xp;
      s.coins += coins;
    } else {
      s.wrong++;
      s.streak = 0;
    }
    this.stats.answered++;
    if (ok) this.stats.correct++;
    this.stats.bestStreak = Math.max(this.stats.bestStreak, s.bestStreak);
    this.stats.xp += xp;
    // Level: tiap 500 XP naik satu level.
    this.stats.level = 1 + Math.floor(this.stats.xp / 500);
    return { ok, xp, coins, streak: s.streak, question: q };
  }

  next() {
    const s = this.session;
    if (!s) return false;
    if (s.index < s.questions.length - 1) { s.index++; return true; }
    return false;
  }

  /** Tutup sesi: catat ringkasan dan kembalikan untuk dikirim ke Sheets. */
  finish() {
    const s = this.session;
    if (!s || s.finished) return null;
    s.finished = true;
    this.stats.sessions++;
    const total = s.questions.length || 1;
    const score = Math.round((s.correct / total) * 100);
    this.stats.lastScore = score;
    return {
      topic: this.topicName(s.topic),
      topicId: s.topic,
      level: s.level,
      total: s.questions.length,
      correct: s.correct,
      wrong: s.wrong,
      score,
      xp: s.xp,
      coins: s.coins,
      bestStreak: s.bestStreak,
      date: new Date().toISOString(),
    };
  }

  toJSON() { return { ...this.stats }; }
  loadJSON(d) { if (d) Object.assign(this.stats, d); }
}
