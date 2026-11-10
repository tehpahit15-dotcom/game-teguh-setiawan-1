// Kontrol sentuh untuk HP: joystick virtual (kiri) + tombol aksi (kanan).
// Dibuat sebagai DOM di atas canvas agar mudah disentuh dan tidak mengganggu
// render pixel-art. Hanya tampil di perangkat sentuh (atau layar kecil).
import { setVirtualAxis, pressVirtual, setVirtualHeld } from '../core/input.js';

export function isTouchDevice() {
  return ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth < 760;
}

export function initTouchControls() {
  if (document.getElementById('touch-ui')) return;
  const root = document.createElement('div');
  root.id = 'touch-ui';
  root.innerHTML = `
    <div id="joy"><div id="joy-knob"></div></div>
    <div id="touch-btns">
      <button data-act="interact" class="tbtn big">E</button>
      <button data-act="math" class="tbtn math">📐</button>
      <button data-act="inventory" class="tbtn">🎒</button>
      <button data-act="menu" class="tbtn">☰</button>
      <button data-act="run" class="tbtn small">🏃</button>
      <button data-act="gift" class="tbtn small">🎁</button>
    </div>
    <div id="touch-top">
      <button id="btn-math-top" class="tbtn-top">📐 Matematika</button>
      <button id="btn-full" class="tbtn-top">⛶ Layar Penuh</button>
    </div>`;
  document.body.appendChild(root);

  const style = document.createElement('style');
  style.textContent = `
    #touch-ui { position: fixed; inset: 0; pointer-events: none; z-index: 20; font-family: "VT323", monospace; }
    #joy { position: absolute; left: 18px; bottom: 90px; width: 120px; height: 120px; border-radius: 50%;
      background: rgba(0,0,0,.28); border: 3px solid rgba(245,230,200,.55); pointer-events: auto; touch-action: none; }
    #joy-knob { position: absolute; left: 50%; top: 50%; width: 52px; height: 52px; margin: -26px 0 0 -26px;
      border-radius: 50%; background: rgba(245,230,200,.85); border: 3px solid #3a2a2a; }
    #touch-btns { position: absolute; right: 14px; bottom: 84px; display: grid; grid-template-columns: 64px 64px;
      gap: 10px; pointer-events: auto; }
    .tbtn { width: 64px; height: 64px; border-radius: 50%; border: 3px solid #3a2a2a; background: rgba(200,132,58,.92);
      color: #f5e6c8; font-size: 26px; font-family: inherit; box-shadow: 0 4px 0 #5a3418; touch-action: none; }
    .tbtn:active { transform: translateY(2px); box-shadow: 0 2px 0 #5a3418; background: #e0a040; }
    .tbtn.big { width: 76px; height: 76px; font-size: 32px; background: rgba(184,67,46,.95); }
    .tbtn.math { background: rgba(79,154,41,.95); font-size: 30px; }
    .tbtn.small { width: 56px; height: 56px; font-size: 22px; }
    #touch-top { position: absolute; top: calc(8px + env(safe-area-inset-top)); left: 50%; transform: translateX(-50%);
      display: flex; gap: 8px; pointer-events: auto; }
    .tbtn-top { border: 3px solid #3a2a2a; background: rgba(139,90,43,.95); color: #f5e6c8; font-family: inherit;
      font-size: 18px; padding: 8px 14px; border-radius: 10px; box-shadow: 0 3px 0 #5a3418; }
    .tbtn-top:active { transform: translateY(1px); }
    @media (min-width: 900px) and (pointer: fine) {
      #touch-ui { display: none; }
      #touch-ui.force { display: block; }
    }
  `;
  document.head.appendChild(style);

  // --- joystick ---
  const joy = root.querySelector('#joy');
  const knob = root.querySelector('#joy-knob');
  let joyId = null;
  const R = 44;
  function joyMove(e) {
    const t = [...e.changedTouches].find((c) => c.identifier === joyId);
    if (!t) return;
    const r = joy.getBoundingClientRect();
    let dx = t.clientX - (r.left + r.width / 2);
    let dy = t.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > R) { dx = (dx / len) * R; dy = (dy / len) * R; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    setVirtualAxis(dx / R, dy / R);
  }
  joy.addEventListener('touchstart', (e) => {
    e.preventDefault();
    joyId = e.changedTouches[0].identifier;
    joyMove(e);
  }, { passive: false });
  joy.addEventListener('touchmove', (e) => { e.preventDefault(); joyMove(e); }, { passive: false });
  const joyEnd = (e) => {
    if ([...e.changedTouches].some((c) => c.identifier === joyId)) {
      joyId = null;
      knob.style.transform = '';
      setVirtualAxis(0, 0);
    }
  };
  joy.addEventListener('touchend', joyEnd);
  joy.addEventListener('touchcancel', joyEnd);
  // Dukungan mouse untuk uji coba di desktop
  joy.addEventListener('mousedown', (e) => {
    joyId = 'mouse';
    const move = (ev) => {
      const r = joy.getBoundingClientRect();
      let dx = ev.clientX - (r.left + r.width / 2);
      let dy = ev.clientY - (r.top + r.height / 2);
      const len = Math.hypot(dx, dy);
      if (len > R) { dx = (dx / len) * R; dy = (dy / len) * R; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      setVirtualAxis(dx / R, dy / R);
    };
    const up = () => { joyId = null; knob.style.transform = ''; setVirtualAxis(0, 0); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    move(e);
  });

  // --- tombol aksi ---
  root.querySelectorAll('.tbtn[data-act]').forEach((btn) => {
    const act = btn.dataset.act;
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (act === 'run') setVirtualHeld('run', true);
      else pressVirtual(act);
    }, { passive: false });
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (act === 'run') setVirtualHeld('run', false);
    }, { passive: false });
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      if (act === 'run') setVirtualHeld('run', true);
      else pressVirtual(act);
    });
    btn.addEventListener('mouseup', () => { if (act === 'run') setVirtualHeld('run', false); });
  });

  root.querySelector('#btn-math-top').addEventListener('click', () => pressVirtual('math'));
  root.querySelector('#btn-full').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  });

  // Sembunyikan kontrol saat kuis terbuka? Tidak — tombol E tetap berguna
  // untuk menjawab. Cukup pastikan tidak menutupi panel kuis di layar kecil:
  // panel kuis digambar di tengah canvas, kontrol di tepi.
  return root;
}
