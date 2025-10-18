// Azbry Tap Runner — Fix:
// - Restart tak menggandakan loop (gravity terasa normal lagi)
// - Background selalu tampil & direset saat restart
// - Tidak mengubah rasio; patuh ke atribut canvas (pastikan 360x640 di index)

const ASSETS = {
  bird: '/assets/img/bird.png',
  bg:   '/assets/img/bg-city.png'
};

// ====== Canvas & context ======
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;   // 360
const H = canvas.height;  // 640

// ====== Theme ======
const GREEN       = '#b8ff9a';
const GREEN_DARK  = '#8ee887';
const OBST_COLOR  = '#1a1f25';
const OBST_STROKE = '#6df37a';

// ====== State ======
let state = 'idle';           // idle | playing | gameover
let score = 0;
let highScore = parseInt(localStorage.getItem('azbry_highscore')) || 0;
let loopStarted = false;      // mencegah multi-loop

// ====== Player ======
const player = {
  x: 70,
  y: H / 2,
  r: 18,
  vy: 0,
  gravity: 0.25,   // bisa kamu atur
  jump:   -5.2,    // bisa kamu atur
  img: null
};

// ====== Background (parallax) ======
const bg = { img: null, x: 0, x2: 0, speed: 1.2 };

// ====== Obstacles ======
const obstacles   = [];
const OBST_GAP    = 150;
const OBST_WIDTH  = 50;
const OBST_MIN    = 60;
const OBST_SPEED  = 2.6;
const SPAWN_EVERY = 1300;
let lastSpawn     = 0;

// ====== Reward ======
const REWARD_SCORE = 5;

// ====== Load assets (dengan fallback agar tak hitam) ======
function loadAssets() {
  return new Promise(resolve => {
    const bird = new Image();
    const bgImg = new Image();
    let loaded = 0;
    const done = () => { loaded++; if (loaded === 2) resolve({ bird, bgImg }); };

    bird.src = ASSETS.bird + '?v=1';
    bgImg.src = ASSETS.bg + '?v=1';

    bird.onload = done;
    bgImg.onload = done;

    bird.onerror = () => { bird._failed = true; console.warn('bird.png gagal dimuat'); done(); };
    bgImg.onerror = () => { bgImg._failed = true; console.warn('bg-city.png gagal dimuat'); done(); };
  });
}

// ====== Util draw text ======
function drawText(txt, x, y, size = 26, color = '#e6e8ec', align = 'center') {
  ctx.font = `700 ${size}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(txt, x, y);
}

// ====== Spawn obstacle ======
function spawnObstacle() {
  const topH = Math.random() * (H / 2) + OBST_MIN;
  obstacles.push({ x: W, y: 0, w: OBST_WIDTH, h: topH, passed: false });
  obstacles.push({ x: W, y: topH + OBST_GAP, w: OBST_WIDTH, h: H - topH - OBST_GAP, passed: false });
}

// ====== Update ======
function update() {
  if (state !== 'playing') return;

  // Parallax background
  bg.x  -= bg.speed;
  bg.x2 -= bg.speed;
  if (bg.x  + W <= 0) bg.x  = W;
  if (bg.x2 + W <= 0) bg.x2 = W;

  // Physics
  player.vy += player.gravity;
  player.y  += player.vy;

  // Lantai/atap
  if (player.y + player.r > H) { player.y = H - player.r; gameOver(); }
  if (player.y - player.r < 0) { player.y = player.r; player.vy = 0; }

  // Obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= OBST_SPEED;

    // Collision
    if (player.x + player.r > o.x && player.x - player.r < o.x + o.w &&
        player.y + player.r > o.y && player.y - player.r < o.y + o.h) {
      gameOver();
    }

    // Score
    if (!o.passed && o.x + o.w < player.x) {
      o.passed = true;
      score++;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('azbry_highscore', highScore);
      }
    }

    // Cleanup
    if (o.x + o.w < 0) obstacles.splice(i, 1);
  }

  // Spawn baru
  if (performance.now() - lastSpawn > SPAWN_EVERY) {
    spawnObstacle();
    lastSpawn = performance.now();
  }
}

// ====== Render ======
function render() {
  // BG — gambar jika ada, fallback gradient bila gagal
  if (bg.img && !bg.img._failed) {
    ctx.drawImage(bg.img, bg.x,  0, W, H);
    ctx.drawImage(bg.img, bg.x2, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, '#0c1016');
    g.addColorStop(1, '#0a0d12');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);
  }

  // Obstacles
  for (const o of obstacles) {
    ctx.fillStyle = OBST_COLOR;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.strokeStyle = OBST_STROKE;
    ctx.lineWidth = 2;
    ctx.strokeRect(o.x, o.y, o.w, o.h);
  }

  // Player
  if (player.img && !player.img._failed) {
    ctx.drawImage(player.img, player.x - player.r, player.y - player.r, player.r*2, player.r*2);
  } else {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
    ctx.fill();
  }

  // HUD
  drawText(`Score: ${score}`, W - 90, 36, 20, '#dbe4ea');
  drawText(`High: ${highScore}`, W - 95, 62, 16, GREEN_DARK);

  if (state === 'idle') {
    drawText('Tap untuk mulai', W/2, H/2, 24, GREEN);
  }

  if (state === 'gameover') {
    drawText('GAME OVER', W/2, H/2 - 28, 34, GREEN);
    drawText('Ayo coba lagi!', W/2, H/2 + 6, 20, '#e6e8ec');
    drawText(`Kalau dapat ${REWARD_SCORE} poin, kamu berhak klaim`, W/2, H/2 + 34, 14, '#cfd6dc');
    drawText('1 Nasi Uduk Mama Alpi 🍚', W/2, H/2 + 54, 16, GREEN_DARK);
  }
}

// ====== Loop tunggal ======
function loop() {
  ctx.clearRect(0,0,W,H);
  render();
  update();
  requestAnimationFrame(loop);
}

// ====== Controls ======
function jump() {
  if (state === 'playing') player.vy = player.jump;
}

function resetGame() {
  obstacles.length = 0;
  score = 0;
  player.y = H/2;
  player.vy = 0;

  // reset parallax supaya terlihat lagi
  bg.x = 0;
  bg.x2 = W;

  lastSpawn = 0;
}

function startGame() {
  state = 'playing';
  resetGame();

  const ui = window.__AZBRY_UI__;
  if (ui) {
    ui.statusEl.textContent = '🎮 Sedang bermain...';
    ui.startBtn.style.display = 'none';
    ui.restartBtn.style.display = 'none';
  }
}

function gameOver() {
  state = 'gameover';
  const ui = window.__AZBRY_UI__;
  if (ui) {
    ui.statusEl.textContent = '💀 Game Over';
    ui.restartBtn.style.display = 'inline-block';
  }
}

// ====== Bootstrap ======
async function boot() {
  // Load gambar dulu
  const { bird, bgImg } = await loadAssets();
  player.img = bird;
  bg.img = bgImg;
  bg.x = 0;
  bg.x2 = W;

  // Mulai loop sekali saja
  if (!loopStarted) {
    loopStarted = true;
    requestAnimationFrame(loop);
  }

  // UI controls
  const ui = window.__AZBRY_UI__;
  if (ui) {
    ui.startBtn.onclick   = () => (state === 'idle')     && startGame();
    ui.restartBtn.onclick = () => (state === 'gameover') && startGame();
  }

  // Input
  canvas.addEventListener('mousedown', () => { if (state === 'idle') startGame(); jump(); });
  canvas.addEventListener('touchstart',  (e) => { e.preventDefault(); if (state === 'idle') startGame(); jump(); }, { passive:false });
}

window.addEventListener('DOMContentLoaded', boot);
