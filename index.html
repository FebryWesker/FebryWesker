// game.js — Azbry Tap Runner (mobile-first)

// ====== Konfigurasi aset (samakan dengan struktur repo kamu) ======
const ASSETS = {
  bird: 'assets/img/bird.png',     // ganti sesuai nama file burungmu
  bg:   'assets/img/bg-city.png',  // ganti sesuai nama file latar
};

// ====== Canvas & Context ======
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Ukuran kanvas (disetel tetap biar stabil di HP)
const W = canvas.width;
const H = canvas.height;

// ====== Tema (selaras Azbry) ======
const GREEN = '#b8ff9a';
const GREEN_DARK = '#8ee887';
const OBST_COLOR = '#1a1f25';
const OBST_STROKE = '#6df37a';

// ====== Game State ======
let state = 'loading'; // loading | playing | gameover
let score = 0;
let highScore = parseInt(localStorage.getItem('azbry_highscore') || '0', 10);

// ====== Burung (pemain) ======
const player = {
  x: 70,
  y: H/2,
  r: 18,
  vy: 0,
  gravity: 0.45,
  jump: -7.6,
  img: null
};

// ====== Background (parallax loop) ======
const bg = {
  img: null,
  w: 0,
  h: 0,
  x1: 0,
  x2: 0,
  speed: 1.2
};

// ====== Obstacles (pipes + drones) ======
const obstacles = [];
const OBST_GAP = 150;            // celah antar atas-bawah
const OBST_WIDTH = 50;
const OBST_MIN = 60;             // tinggi min pipe
const OBST_SPEED = 3.2;          // kecepatan geser
const SPAWN_EVERY = 1200;        // ms antara spawn rintangan
const DRONE_CHANCE = 0.45;       // peluang spawn rintangan melayang

let lastSpawn = 0;

// ====== UI ======
function drawText(txt, x, y, size=28, align='center', color='#e6e8ec') {
  ctx.font = `700 ${size}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(txt, x, y);
}

function drawPill(text, x, y) {
  ctx.save();
  ctx.shadowColor = GREEN;
  ctx.shadowBlur = 12;
  ctx.fillStyle = GREEN;
  const padX = 14, padY = 6;
  ctx.font = `700 14px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  const w = ctx.measureText(text).width + padX*2;
  const h = 28;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#0b0d10';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + padX, y + h/2);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
}

// ====== Load Images ======
function loadImage(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}

async function loadAssets() {
  [player.img, bg.img] = await Promise.all([
    loadImage(ASSETS.bird),
    loadImage(ASSETS.bg)
  ]);
  // set loop posisi bg
  bg.w = bg.img.width;
  bg.h = bg.img.height;
  bg.x1 = 0;
  bg.x2 = bg.w;
}

// ====== Controls ======
function flap() {
  if (state === 'playing') {
    player.vy = player.jump;
  } else if (state === 'gameover') {
    restart();
  }
}
canvas.addEventListener('touchstart', flap, { passive: true });
canvas.addEventListener('mousedown', flap);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') flap();
});

// ====== Spawn Obstacles ======
function spawnObstacle() {
  // Pipe atas & bawah
  const topH = OBST_MIN + Math.random() * (H - OBST_MIN*2 - OBST_GAP);
  const bottomY = topH + OBST_GAP;
  const bottomH = H - bottomY;

  obstacles.push({
    type: 'pipeTop',
    x: W + 20,
    y: 0,
    w: OBST_WIDTH,
    h: topH,
    passed: false
  });
  obstacles.push({
    type: 'pipeBottom',
    x: W + 20,
    y: bottomY,
    w: OBST_WIDTH,
    h: bottomH,
    passed: false
  });

  // Drone (melayang) kadang muncul
  if (Math.random() < DRONE_CHANCE) {
    const size = 36 + Math.random()*22;
    const y = 80 + Math.random()*(H - 160);
    obstacles.push({
      type: 'drone',
      x: W + 20 + Math.random()*120,
      y,
      w: size,
      h: size,
      vy: (Math.random()*1.2 - 0.6), // gerak sedikit vertikal
      passed: false
    });
  }
}

// ====== Update ======
function update(dt) {
  // background scroll
  bg.x1 -= bg.speed;
  bg.x2 -= bg.speed;
  if (bg.x1 + bg.w <= 0) bg.x1 = bg.x2 + bg.w;
  if (bg.x2 + bg.w <= 0) bg.x2 = bg.x1 + bg.w;

  // player physics
  player.vy += player.gravity;
  player.y += player.vy;
  // bound
  if (player.y < player.r) { player.y = player.r; player.vy = 0; }
  if (player.y > H - player.r) { player.y = H - player.r; player.vy = 0; gameOver(); }

  // spawn
  const now = performance.now();
  if (now - lastSpawn > SPAWN_EVERY) {
    spawnObstacle();
    lastSpawn = now;
  }

  // move obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= OBST_SPEED;
    if (o.type === 'drone') {
      o.y += o.vy || 0;
      // mantul halus
      if (o.y < 40 || o.y + o.h > H - 40) o.vy = -(o.vy || 0);
    }
    // hapus yang keluar layar
    if (o.x + o.w < -60) obstacles.splice(i, 1);
  }

  // collision & score
  for (const o of obstacles) {
    if (collide(player, o)) {
      gameOver();
      break;
    }
    // skor dihitung saat melewati pipe bottom saja biar 1 poin per set
    if (!o.passed && o.type === 'pipeBottom' && o.x + o.w < player.x - player.r) {
      o.passed = true;
      score += 1;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('azbry_highscore', String(highScore));
      }
    }
  }
}

function collide(p, o) {
  // burung diperlakukan lingkaran; obstacle kotak
  const cx = Math.max(o.x, Math.min(p.x, o.x + o.w));
  const cy = Math.max(o.y, Math.min(p.y, o.y + o.h));
  const dx = p.x - cx;
  const dy = p.y - cy;
  return (dx*dx + dy*dy) <= (p.r*p.r);
}

// ====== Draw ======
function draw() {
  // bg
  // gambar 2 tile untuk loop
  drawBg(bg.x1);
  drawBg(bg.x2);

  // obstacles
  for (const o of obstacles) {
    if (o.type === 'drone') {
      // kotak melayang dengan outline hijau
      ctx.fillStyle = OBST_COLOR;
      ctx.strokeStyle = OBST_STROKE;
      ctx.lineWidth = 2;
      roundRect(ctx, o.x, o.y, o.w, o.h, 8);
      ctx.fill();
      ctx.stroke();
      // garis hud tipis
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h/2);
      ctx.lineTo(o.x - 8, o.y + o.h/2);
      ctx.strokeStyle = GREEN_DARK;
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      // pipes
      ctx.fillStyle = OBST_COLOR;
      ctx.strokeStyle = OBST_STROKE;
      ctx.lineWidth = 2;
      roundRect(ctx, o.x, o.y, o.w, o.h, 10);
      ctx.fill();
      ctx.stroke();
    }
  }

  // player (burung)
  if (player.img) {
    const s = player.r*2;
    ctx.save();
    // sedikit rotasi sesuai kecepatan
    const angle = Math.max(-0.5, Math.min(0.6, player.vy * 0.04));
    ctx.translate(player.x, player.y);
    ctx.rotate(angle);
    ctx.drawImage(player.img, -player.r, -player.r, s, s);
    ctx.restore();
  } else {
    // fallback circle
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
    ctx.fillStyle = GREEN;
    ctx.fill();
  }

  // HUD
  drawPill(`Score ${score}`, 16, 12);
  drawPill(`High ${highScore}`, W - 16 - 96, 12); // lebar kira-kira
}

function drawBg(offsetX) {
  // skala proporsional ke canvas height
  const scale = H / bg.h;
  const drawW = bg.w * scale;
  ctx.drawImage(bg.img, offsetX * scale, 0, drawW, H);
}

// ====== Loop ======
let prev = 0;
function loop(t) {
  const dt = t - prev; prev = t;
  if (state === 'playing') update(dt);
  render();
  requestAnimationFrame(loop);
}

function render() {
  ctx.clearRect(0, 0, W, H);
  draw();

  if (state === 'loading') {
    drawOverlay('Memuat… sentuh untuk mulai');
  } else if (state === 'gameover') {
    drawOverlay('Game Over');
    drawText('Ayo coba lagi! Dapatkan 100 score', W/2, H/2 + 48, 16, 'center', '#cbd5e1');
    drawText('dan kamu boleh mengambil hadiah dari Febry', W/2, H/2 + 70, 14, 'center', '#9aa4b2');
    drawText('Tap untuk main lagi', W/2, H/2 + 104, 14, 'center', GREEN);
  }
}

function drawOverlay(title) {
  ctx.save();
  ctx.fillStyle = 'rgba(11,13,16,.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e6e8ec';
  drawText(title, W/2, H/2 - 6 - 36, 28);
  ctx.restore();
}

// ====== State Control ======
function start() {
  state = 'playing';
  score = 0;
  player.x = 70;
  player.y = H/2;
  player.vy = 0;
  obstacles.length = 0;
  lastSpawn = performance.now();
}

function gameOver() {
  state = 'gameover';
}

function restart() {
  start();
}

// ====== Boot ======
(async function boot() {
  try {
    await loadAssets();
  } catch (e) {
    console.error('Gagal load aset:', e);
  }
  state = 'loading';
  requestAnimationFrame(loop);

  // Mulai saat tap pertama
  const startOnce = () => {
    if (state === 'loading') start();
    canvas.removeEventListener('touchstart', startOnce);
    canvas.removeEventListener('mousedown', startOnce);
  };
  canvas.addEventListener('touchstart', startOnce, { passive: true });
  canvas.addEventListener('mousedown', startOnce);
})();
