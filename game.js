// game.js — Azbry Tap Runner (mobile + desktop compatible, manual restart)
// ========================================================================

// ====== Konfigurasi aset ======
const ASSETS = {
  bird: 'assets/img/bird.png',
  bg:   'assets/img/bg-city.png'
};

// ====== Canvas & Context ======
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// ====== Tema ======
const GREEN = '#b8ff9a';
const GREEN_DARK = '#8ee887';
const OBST_COLOR = '#1a1f25';
const OBST_STROKE = '#6df37a';
const MUTED = '#98a2b3';

// ====== Game State ======
let state = 'loading'; // loading | playing | gameover
let score = 0;
let highScore = parseInt(localStorage.getItem('azbry_highscore') || '0', 10);

// ====== Player (burung) ======
const player = {
  x: 70,
  y: H / 2,
  r: 18,
  vy: 0,
  gravity: 0.45,
  jump: -7.6,
  img: null
};

// ====== Background ======
const bg = {
  img: null,
  x1: 0,
  x2: 0,
  speed: 1.2
};

// ====== Obstacles ======
const obstacles = [];
const OBST_GAP = 150;
const OBST_WIDTH = 50;
const OBST_MIN = 60;
const OBST_SPEED = 3.2;
const SPAWN_EVERY = 1200;
let lastSpawn = 0;

// ====== UI Helper ======
function drawText(txt, x, y, size = 28, align = 'center', color = '#e6e8ec') {
  ctx.font = `700 ${size}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(txt, x, y);
}

function roundRect(x, y, w, h, r) {
  const rr = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// ====== Restart Button (tampil saat gameover) ======
const restartBtn = {
  w: 200,
  h: 44,
  get x() { return (W - this.w) / 2; },
  get y() { return Math.floor(H / 2) + 70; }
};

function drawRestartButton() {
  const { x, y, w, h } = restartBtn;
  // bayangan lembut
  ctx.shadowColor = 'rgba(184,255,154,.25)';
  ctx.shadowBlur = 18;
  // tombol
  roundRect(x, y, w, h, 12);
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, GREEN);
  grad.addColorStop(1, GREEN_DARK);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.shadowBlur = 0;
  // label
  drawText('Main Lagi', x + w / 2, y + h / 2 + 8, 18, 'center', '#0b0d10');
}

function isInsideRestartBtn(px, py) {
  const { x, y, w, h } = restartBtn;
  return px >= x && px <= x + w && py >= y && py <= y + h;
}

// ====== Load Assets ======
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadAssets() {
  bg.img = await loadImage(ASSETS.bg);
  player.img = await loadImage(ASSETS.bird);
  state = 'playing';
}

// ====== Reset ======
function resetGame() {
  score = 0;
  player.y = H / 2;
  player.vy = 0;
  obstacles.length = 0;
  lastSpawn = 0;
  state = 'playing';
}

// ====== Input Handler ======
function onTap(e) {
  if (e && e.preventDefault) e.preventDefault();

  if (state === 'loading') {
    state = 'playing';
    return;
  }

  // posisi pointer (untuk cek klik tombol saat gameover)
  let px = 0, py = 0;
  if (e && e.touches && e.touches[0]) {
    const rect = canvas.getBoundingClientRect();
    px = e.touches[0].clientX - rect.left;
    py = e.touches[0].clientY - rect.top;
  } else if (e && (e.clientX !== undefined)) {
    const rect = canvas.getBoundingClientRect();
    px = e.clientX - rect.left;
    py = e.clientY - rect.top;
  }

  if (state === 'gameover') {
    // restart hanya kalau klik pada tombol
    if (isInsideRestartBtn(px, py)) resetGame();
    return;
  }

  // loncat (saat playing)
  player.vy = player.jump;
}

// dukung semua input
canvas.addEventListener('pointerdown', onTap, { passive: false });
canvas.addEventListener('touchstart', onTap, { passive: false });
canvas.addEventListener('mousedown', onTap);
window.addEventListener('keydown', (e) => {
  if (state === 'gameover') {
    if (e.code === 'Enter') resetGame(); // optional: Enter buat replay
    return;
  }
  if (e.code === 'Space' || e.key === ' ') onTap(e);
});

// ====== Update ======
function update(delta) {
  if (state !== 'playing') return;

  player.vy += player.gravity;
  player.y += player.vy;

  // jatuh/keluar layar
  if (player.y + player.r > H || player.y - player.r < 0) {
    state = 'gameover';
  }

  // background scroll
  bg.x1 -= bg.speed;
  bg.x2 -= bg.speed;
  if (bg.x1 + W < 0) bg.x1 = bg.x2 + W;
  if (bg.x2 + W < 0) bg.x2 = bg.x1 + W;

  // spawn obstacles berkala
  if (performance.now() - lastSpawn > SPAWN_EVERY) {
    lastSpawn = performance.now();
    const gapY = Math.random() * (H - OBST_GAP - OBST_MIN * 2) + OBST_MIN;
    obstacles.push({ x: W, y: 0, h: gapY, passed: false });
    obstacles.push({ x: W, y: gapY + OBST_GAP, h: H - gapY - OBST_GAP, passed: false });
  }

  // gerakkan & bersihkan obstacles
  for (const o of obstacles) o.x -= OBST_SPEED;
  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (obstacles[i].x + OBST_WIDTH < 0) obstacles.splice(i, 1);
  }

  // deteksi tabrakan
  for (const o of obstacles) {
    if (
      player.x + player.r > o.x &&
      player.x - player.r < o.x + OBST_WIDTH &&
      player.y + player.r > o.y &&
      player.y - player.r < o.y + o.h
    ) {
      state = 'gameover';
      break;
    }
  }

  // skor (hitung sekali tiap pasangan pipa)
  for (const o of obstacles) {
    if (!o.passed && o.y === 0 && player.x > o.x + OBST_WIDTH) {
      o.passed = true;
      score++;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('azbry_highscore', highScore);
      }
    }
  }
}

// ====== Draw ======
function draw() {
  // background
  if (bg.img) {
    // dua gambar untuk loop seamless
    ctx.drawImage(bg.img, bg.x1, 0, W, H);
    ctx.drawImage(bg.img, bg.x2, 0, W, H);
  } else {
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(0, 0, W, H);
  }

  // obstacles
  ctx.fillStyle = OBST_COLOR;
  ctx.strokeStyle = OBST_STROKE;
  for (const o of obstacles) {
    ctx.beginPath();
    ctx.rect(o.x, o.y, OBST_WIDTH, o.h);
    ctx.fill();
    ctx.stroke();
  }

  // player
  if (player.img) {
    ctx.drawImage(player.img, player.x - player.r, player.y - player.r, player.r * 2, player.r * 2);
  } else {
    ctx.fillStyle = GREEN;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // HUD
  drawText(`Score: ${score}`, W / 2, 40, 22);
  drawText(`Highscore: ${highScore}`, W / 2, 70, 16, 'center', MUTED);

  if (state === 'gameover') {
    drawText('GAME OVER', W / 2, H / 2 - 30, 30, 'center', GREEN);
    drawText('Ayo coba lagi!', W / 2, H / 2 + 5, 18);
    drawText('Kalau dapat 100 poin, kamu berhak klaim', W / 2, H / 2 + 28, 14, 'center', MUTED);
    drawText('1 Nasi Uduk Mama Alpi 🍛', W / 2, H / 2 + 48, 16, 'center', '#e6e8ec');
    drawRestartButton();
  }
}

// ====== Loop ======
let lastTime = 0;
function loop(ts) {
  const delta = ts - lastTime;
  lastTime = ts;
  update(delta);
  draw();
  requestAnimationFrame(loop);
}

// ====== Start ======
loadAssets();
requestAnimationFrame(loop);
