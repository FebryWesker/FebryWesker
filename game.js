// Azbry Tap Runner — versi fix untuk Vercel static (mobile-friendly)

// ====== KONFIGURASI ASET ======
const ASSETS = {
  bird: '/assets/img/bird.png',
  bg: '/assets/img/bg-city.png'
};

// ====== INISIALISASI KANVAS ======
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// ====== TEMA WARNA ======
const GREEN = '#b8ff9a';
const GREEN_DARK = '#8ee887';
const OBST_COLOR = '#1a1f25';
const OBST_STROKE = '#6df37a';

// ====== GAME STATE ======
let state = 'idle'; // idle | playing | gameover
let score = 0;
let highScore = parseInt(localStorage.getItem('azbry_highscore')) || 0;

// ====== PEMAIN ======
const player = {
  x: 70,
  y: H / 2,
  r: 18,
  vy: 0,
  gravity: 0.25, // lebih ringan
  jump: -5.5, // lompatan lebih halus
  img: null
};

// ====== LATAR (parallax) ======
const bg = { img: null, x: 0, x2: W, speed: 1.2 };

// ====== RINTANGAN ======
const obstacles = [];
const OBST_GAP = 150;
const OBST_WIDTH = 50;
const OBST_MIN = 60;
const OBST_SPEED = 2.6; // lebih lambat
const SPAWN_EVERY = 1300; // ms antar spawn
let lastSpawn = 0;

// ====== HADIAH ======
const REWARD_SCORE = 5;
const rewardMessage = `🎉 Ayo coba lagi!\nKalau dapat ${REWARD_SCORE} poin,\nkamu berhak klaim 1 Nasi Uduk Mama Alpi 🍚`;

// ====== MUAT ASET ======
function loadAssets() {
  return new Promise(resolve => {
    const bird = new Image();
    const bgImg = new Image();
    let loaded = 0;

    bird.src = ASSETS.bird;
    bgImg.src = ASSETS.bg;

    const checkLoaded = () => {
      loaded++;
      if (loaded === 2) resolve({ bird, bgImg });
    };

    bird.onload = checkLoaded;
    bgImg.onload = checkLoaded;
  });
}

// ====== SPAWN OBSTACLE ======
function spawnObstacle() {
  const topH = Math.random() * (H / 2) + OBST_MIN;
  obstacles.push({ x: W, y: 0, w: OBST_WIDTH, h: topH, passed: false });
  obstacles.push({ x: W, y: topH + OBST_GAP, w: OBST_WIDTH, h: H - topH - OBST_GAP, passed: false });
}

// ====== DRAW TEXT ======
function drawText(txt, x, y, size = 26, color = '#e6e8ec', align = 'center') {
  ctx.font = `700 ${size}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(txt, x, y);
}

// ====== GAME LOOP ======
function update(delta) {
  if (state !== 'playing') return;

  // background loop
  bg.x -= bg.speed;
  bg.x2 -= bg.speed;
  if (bg.x + W <= 0) bg.x = W;
  if (bg.x2 + W <= 0) bg.x2 = W;

  // gravity
  player.vy += player.gravity;
  player.y += player.vy;

  // batas bawah/atas
  if (player.y + player.r > H) {
    player.y = H - player.r;
    gameOver();
  } else if (player.y - player.r < 0) {
    player.y = player.r;
    player.vy = 0;
  }

  // obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= OBST_SPEED;

    // deteksi tabrakan
    if (
      player.x + player.r > o.x &&
      player.x - player.r < o.x + o.w &&
      player.y + player.r > o.y &&
      player.y - player.r < o.y + o.h
    ) {
      gameOver();
    }

    // hapus jika sudah keluar layar
    if (o.x + o.w < 0) obstacles.splice(i, 1);

    // tambah skor
    if (!o.passed && o.x + o.w < player.x) {
      o.passed = true;
      score++;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('azbry_highscore', highScore);
      }
    }
  }

  // spawn obstacle baru
  if (performance.now() - lastSpawn > SPAWN_EVERY) {
    spawnObstacle();
    lastSpawn = performance.now();
  }
}

// ====== DRAW ======
function render() {
  // background
  ctx.drawImage(bg.img, bg.x, 0, W, H);
  ctx.drawImage(bg.img, bg.x2, 0, W, H);

  // obstacles
  for (const o of obstacles) {
    ctx.fillStyle = OBST_COLOR;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.strokeStyle = OBST_STROKE;
    ctx.strokeRect(o.x, o.y, o.w, o.h);
  }

  // player
  ctx.drawImage(player.img, player.x - player.r, player.y - player.r, player.r * 2, player.r * 2);

  // UI
  drawText(`Score: ${score}`, W - 100, 40, 22);
  drawText(`Highscore: ${highScore}`, W - 120, 70, 18, GREEN_DARK);
}

// ====== GAME STATE HANDLERS ======
function resetGame() {
  obstacles.length = 0;
  score = 0;
  player.y = H / 2;
  player.vy = 0;
  lastSpawn = 0;
  state = 'playing';
}

function gameOver() {
  state = 'gameover';
  const ui = window.__AZBRY_UI__;
  if (ui) {
    ui.statusEl.textContent = '💀 Game Over';
    ui.restartBtn.style.display = 'inline-block';
  }
}

// ====== LOOP ======
let lastTime = 0;
function loop(time = 0) {
  const delta = time - lastTime;
  lastTime = time;

  ctx.clearRect(0, 0, W, H);
  render();
  update(delta);

  if (state === 'gameover') {
    drawText('GAME OVER', W / 2, H / 2 - 20, 36, GREEN);
    drawText('Ayo coba lagi!', W / 2, H / 2 + 20, 22);
    drawText(`Kalau dapat ${REWARD_SCORE} poin, kamu berhak klaim 1 Nasi Uduk Mama Alpi 🍚`, W / 2, H / 2 + 55, 14, '#ccc');
  }

  requestAnimationFrame(loop);
}

// ====== INPUT ======
function jump() {
  if (state === 'playing') {
    player.vy = player.jump;
  }
}

// ====== INISIALISASI ======
async function startGame() {
  const assets = await loadAssets();
  player.img = assets.bird;
  bg.img = assets.bg;
  bg.x = 0;
  bg.x2 = W;

  const ui = window.__AZBRY_UI__;
  if (ui) {
    ui.statusEl.textContent = '🎮 Sedang bermain...';
    ui.startBtn.style.display = 'none';
    ui.restartBtn.style.display = 'none';
  }

  resetGame();
  requestAnimationFrame(loop);
}

// ====== EVENT LISTENER ======
canvas.addEventListener('mousedown', jump);
canvas.addEventListener('touchstart', jump);

window.addEventListener('DOMContentLoaded', () => {
  const ui = window.__AZBRY_UI__;
  if (!ui) return;
  ui.startBtn.addEventListener('click', startGame);
  ui.restartBtn.addEventListener('click', startGame);
});
