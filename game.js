// game.js — Azbry Tap Runner (final fix)

// ===== Debug & Error Overlay =====
(function () {
  window.onerror = function (msg, src, line, col, err) {
    const div = document.createElement('div');
    div.style.cssText = `
      position:fixed;left:10px;right:10px;bottom:10px;
      background:#15181c;border:1px solid #252a31;
      color:#b8ff9a;font:13px/1.5 Inter,system-ui;
      padding:10px 14px;border-radius:12px;
      z-index:9999;box-shadow:0 6px 20px rgba(0,0,0,.4);`;
    div.textContent = 'Error: ' + msg;
    document.body.appendChild(div);
    console.error('❌ GameError:', msg, src, line, col, err);
  };
})();

console.log("✅ game.js loaded");

// ===== Konfigurasi aset =====
const ASSETS = {
  bird: 'assets/img/bird.png',    // burung
  bg: 'assets/img/bg-city.png'    // latar
};

// ===== Canvas =====
const canvas = document.getElementById('game');
if (!canvas) throw new Error('Canvas #game tidak ditemukan');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// ===== Warna & Tema =====
const GREEN = '#b8ff9a';
const GREEN_DARK = '#8ee887';
const OBST_COLOR = '#1a1f25';
const OBST_STROKE = '#6df37a';

// ===== State =====
let state = 'loading'; // loading | playing | gameover
let score = 0;
let highScore = parseInt(localStorage.getItem('azbry_highscore') || '0');

// ===== Player =====
const player = {
  x: 70,
  y: H / 2,
  r: 18,
  vy: 0,
  gravity: 0.45,
  jump: -7.6,
  img: null
};

// ===== Background =====
const bg = {
  img: null,
  x1: 0,
  x2: 0,
  speed: 1.4
};

// ===== Obstacles =====
const obstacles = [];
const OBST_GAP = 150;
const OBST_WIDTH = 50;
const OBST_MIN = 60;
const OBST_SPEED = 3.2;
const SPAWN_EVERY = 1300;
let lastSpawn = 0;

// ===== Utilitas =====
function drawText(txt, x, y, size = 28, color = '#e6e8ec', align = 'center') {
  ctx.font = `700 ${size}px Inter, system-ui`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(txt, x, y);
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('Gagal load: ' + src));
    img.src = src;
  });
}

// ===== Init =====
async function init() {
  try {
    player.img = await loadImage(ASSETS.bird);
    bg.img = await loadImage(ASSETS.bg);
    bg.x2 = W;
    state = 'playing';
    lastSpawn = performance.now();
    loop();
  } catch (err) {
    console.error(err);
  }
}

// ===== Spawn Obstacle =====
function spawnObstacle() {
  const gapY = OBST_MIN + Math.random() * (H - OBST_GAP - OBST_MIN);
  obstacles.push({ x: W, y: gapY, passed: false });
}

// ===== Update =====
function update(dt) {
  if (state !== 'playing') return;

  // background
  bg.x1 -= bg.speed;
  bg.x2 -= bg.speed;
  if (bg.x1 + W < 0) bg.x1 = bg.x2 + W;
  if (bg.x2 + W < 0) bg.x2 = bg.x1 + W;

  // player
  player.vy += player.gravity;
  player.y += player.vy;

  if (player.y + player.r > H || player.y - player.r < 0) gameOver();

  // obstacles
  for (const o of obstacles) o.x -= OBST_SPEED;
  if (performance.now() - lastSpawn > SPAWN_EVERY) {
    spawnObstacle();
    lastSpawn = performance.now();
  }

  // hit detect
  for (const o of obstacles) {
    if (o.x < player.x + player.r &&
        o.x + OBST_WIDTH > player.x - player.r) {
      if (player.y - player.r < o.y ||
          player.y + player.r > o.y + OBST_GAP) {
        gameOver();
      }
    }
    if (!o.passed && o.x + OBST_WIDTH < player.x) {
      o.passed = true;
      score++;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('azbry_highscore', highScore);
      }
    }
  }
  while (obstacles.length && obstacles[0].x + OBST_WIDTH < 0) obstacles.shift();
}

// ===== Draw =====
function draw() {
  // bg
  ctx.drawImage(bg.img, bg.x1, 0, W, H);
  ctx.drawImage(bg.img, bg.x2, 0, W, H);

  // player
  if (player.img) ctx.drawImage(player.img, player.x - 24, player.y - 24, 48, 48);

  // obstacles
  ctx.fillStyle = OBST_COLOR;
  ctx.strokeStyle = OBST_STROKE;
  for (const o of obstacles) {
    ctx.beginPath();
    ctx.rect(o.x, 0, OBST_WIDTH, o.y);
    ctx.rect(o.x, o.y + OBST_GAP, OBST_WIDTH, H - o.y - OBST_GAP);
    ctx.fill();
    ctx.stroke();
  }

  // score
  drawText(score, W / 2, 60, 42, GREEN);
  drawText(`High: ${highScore}`, W - 80, 36, 18, '#98a2b3', 'right');
}

// ===== Game Over =====
function gameOver() {
  state = 'gameover';
  setTimeout(() => {
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(0, 0, W, H);
    drawText('Game Over', W / 2, H / 2 - 20, 36, '#fff');
    drawText('Ayo coba lagi!', W / 2, H / 2 + 20, 20, GREEN);
    drawText('Dapatkan 100 skor dan kamu boleh ambil hadiah dari Febry', W / 2, H / 2 + 50, 14, '#b8ff9a');
  }, 50);
  setTimeout(() => {
    state = 'playing';
    obstacles.length = 0;
    score = 0;
    player.y = H / 2;
    player.vy = 0;
  }, 2000);
}

// ===== Input =====
canvas.addEventListener('mousedown', () => {
  if (state === 'playing') player.vy = player.jump;
});

// ===== Loop =====
let last = 0;
function loop(ts = 0) {
  const dt = ts - last;
  last = ts;
  ctx.clearRect(0, 0, W, H);
  if (state === 'playing') update(dt);
  draw();
  requestAnimationFrame(loop);
}

// ===== Start =====
init();
