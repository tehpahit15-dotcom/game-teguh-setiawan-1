// Keyboard + mouse + touch state with "pressed this frame" edge detection.
const down = new Set();
const pressed = new Set();

const BINDINGS = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  interact: ['KeyE', 'Space', 'Enter'],
  run: ['ShiftLeft', 'ShiftRight'],
  drop: ['Backspace', 'Delete'],
  gift: ['KeyG'],
  menu: ['Escape'],
  inventory: ['KeyI', 'Tab'],
  eat: ['KeyC'],
  nextTool: ['KeyX'],
  prevTool: ['KeyZ'],
  zoom: ['KeyF'],
  math: ['KeyM'],
  debugSeason: ['KeyN'],
  debugTime: ['KeyT'],
};

// Backspace ikut dicegah: di sebagian peramban ia masih memicu 'kembali'.
const PREVENT = ['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace'];

window.addEventListener('keydown', (e) => {
  if (PREVENT.includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  down.add(e.code);
  pressed.add(e.code);
});
window.addEventListener('keyup', (e) => down.delete(e.code));
window.addEventListener('blur', () => { down.clear(); pressed.clear(); });

// --- virtual input dari kontrol sentuh (src/ui/touch.js) ---
const vAxis = { x: 0, y: 0 };
const vDown = new Set();
const vPressed = new Set();

export function setVirtualAxis(x, y) { vAxis.x = x; vAxis.y = y; }
export function pressVirtual(action) { vPressed.add(action); }
export function setVirtualHeld(action, held) { if (held) vDown.add(action); else vDown.delete(action); }
export function releaseVirtual(action) { vDown.delete(action); }

export const mouse = { x: 0, y: 0, clicked: false, wheel: 0 };

export function bindMouse(canvas, view) {
  const toLogical = (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
  };
  canvas.addEventListener('mousemove', toLogical);
  canvas.addEventListener('mousedown', (e) => { toLogical(e); mouse.clicked = true; });
  canvas.addEventListener('wheel', (e) => { mouse.wheel = Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
  // Sentuhan pada canvas = klik (untuk menjawab kuis, memilih menu, dll).
  canvas.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    if (!t) return;
    const r = canvas.getBoundingClientRect();
    mouse.x = (t.clientX - r.left) * (canvas.width / r.width);
    mouse.y = (t.clientY - r.top) * (canvas.height / r.height);
    mouse.clicked = true;
  }, { passive: true });
}

export const input = {
  held(action) {
    if (vDown.has(action)) return true;
    return (BINDINGS[action] ?? []).some((c) => down.has(c));
  },
  pressed(action) {
    if (vPressed.has(action)) return true;
    return (BINDINGS[action] ?? []).some((c) => pressed.has(c));
  },

  /** 1..9 if a number key was pressed this frame, else 0. */
  digit() {
    for (let i = 1; i <= 9; i++) if (pressed.has(`Digit${i}`)) return i;
    return 0;
  },

  /** Movement axis as {x, y} in [-1, 1]; diagonals normalized. */
  axis() {
    let x = (this.held('right') ? 1 : 0) - (this.held('left') ? 1 : 0);
    let y = (this.held('down') ? 1 : 0) - (this.held('up') ? 1 : 0);
    if (x && y) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    // Joystick virtual menimpa kalau sedang dipakai.
    if (Math.abs(vAxis.x) > 0.08 || Math.abs(vAxis.y) > 0.08) return { x: vAxis.x, y: vAxis.y };
    return { x, y };
  },

  /** Call once at the end of every update tick. */
  endFrame() { pressed.clear(); vPressed.clear(); mouse.clicked = false; mouse.wheel = 0; },
};
