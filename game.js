// game.js — Azbry Tap Runner (mobile-safe final)

const ASSETS = {
  bird: 'assets/img/bird.png',
  bg: 'assets/img/bg-city.png'
};

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const GREEN = '#b8ff9a';
const OBST_COLOR = '#1a1f25';
const OBST_STROKE = '#6df37a';

let state = 'loading';
let score = 0;
let highScore = parseInt(localStorage.getItem('azbry_highscore') || '0');

const player = { x: 70, y: H / 2, r: 18, vy: 0, gravity: 0.45, jump: -7.6, img: null };
const bg = { img: null, x1: 0, x2: 0, speed: 1.3 };
const obstacles = [];

const OBST_GAP = 150;
const OBST_WIDTH = 50;
const OBST_SPEED = 3.0;
const SPAWN_EVERY = 1300;
let lastSpawn = 0;

function drawText(txt, x, y, size = 24, color = '#e6e8ec', align = 'center') {
  ctx.font = `700 ${size}px Inter, system-ui`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(txt, x, y);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(src);
    img.src = src + '?v=' + Date.now(); // force refresh
  });
}

async function loadAssets() {
  try {
    [player.img, bg.img] = await Promise.all([loadImage(ASSETS.bird), loadImage(ASSETS.bg)]);
    bg.x2 = W;
    state = 'playing';
    lastSpawn = performance.now();
    loop();
  } catch (src) {
    state = 'error';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    drawText('❌ Gagal memuat aset: ' + src, W / 2, H / 2, 14, '#000');
  }
}

function spawnObstacle() {
  const gapY = 60 + Math.random() * (H - OBST_GAP - 60);
  obstacles.push({ x: W, y: gapY, passed: false });
}

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
  if (player.y + player.r > H || player.y - player.r < 0) return gameOver();

  // obstacle
  for (const o of obstacles) o.x -= OBST_SPEED;
  if (performance.now() - lastSpawn > SPAWN_EVERY) {
    spawnObstacle();
    lastSpawn = performance.now();
  }

  for (const o of obstacles) {
    if (o.x < player.x + player.r && o.x + OBST_WIDTH > player.x - player.r) {
      if (player.y - player.r < o.y || player.y + player.r > o.y + OBST_GAP) return gameOver();
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

function draw() {
  if (state === 'error') return;
  ctx.drawImage(bg.img, bg.x1, 0, W, H);
  ctx.drawImage(bg.img, bg.x2, 0, W, H);

  for (const o of obstacles) {
    ctx.fillStyle = OBST_COLOR;
    ctx.strokeStyle = OBST_STROKE;
    ctx.beginPath();
    ctx.rect(o.x, 0, OBST_WIDTH, o.y);
    ctx.rect(o.x, o.y + OBST_GAP, OBST_WIDTH, H - o.y - OBST_GAP);
    ctx.fill();
    ctx.stroke();
  }

  ctx.drawImage(player.img, player.x - 24, player.y - 24, 48, 48);
  drawText(score, W / 2, 60, 42, GREEN);
  drawText(`High: ${highScore}`, W - 80, 36, 18, '#98a2b3', 'right');
}

function gameOver() {
  state = 'gameover';
  ctx.fillStyle = 'rgba(0,0,0,.5)';
  ctx.fillRect(0, 0, W, H);
  drawText('Game Over', W / 2, H / 2 - 20, 34, '#fff');
  drawText('Ayo coba lagi!', W / 2, H / 2 + 20, 20, GREEN);
  drawText('Dapatkan 100 skor dan kamu boleh ambil hadiah dari Febry', W / 2, H / 2 + 50, 14, GREEN);

  setTimeout(() => {
    state = 'playing';
    score = 0;
    player.y = H / 2;
    player.vy = 0;
    obstacles.length = 0;
  }, 2000);
}

canvas.addEventListener('mousedown', () => {
  if (state === 'playing') player.vy = player.jump;
});

let last = 0;
function loop(ts = 0) {
  const dt = ts - last;
  last = ts;
  ctx.clearRect(0, 0, W, H);
  if (state === 'playing') update(dt);
  draw();
  requestAnimationFrame(loop);
}

loadAssets();
