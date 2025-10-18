// Azbry Tap Runner — versi fix anti-layar-hitam (Vercel-ready)

// ====== ASET ======
const ASSETS = {
  bird: '/assets/img/bird.png',
  bg: '/assets/img/bg-city.png'
};

// ====== KANVAS ======
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// ====== WARNA ======
const GREEN = '#b8ff9a';
const GREEN_DARK = '#8ee887';
const OBST_COLOR = '#1a1f25';
const OBST_STROKE = '#6df37a';

// ====== STATE ======
let state = 'idle';
let score = 0;
let highScore = parseInt(localStorage.getItem('azbry_highscore')) || 0;

// ====== PEMAIN ======
const player = {
  x: 70,
  y: H / 2,
  r: 18,
  vy: 0,
  gravity: 0.25,
  jump: -5.2,
  img: null
};

// ====== LATAR ======
const bg = { img: null, x: 0, x2: W, speed: 1.2 };

// ====== OBSTACLE ======
const obstacles = [];
const OBST_GAP = 150;
const OBST_WIDTH = 50;
const OBST_MIN = 60;
const OBST_SPEED = 2.6;
const SPAWN_EVERY = 1300;
let lastSpawn = 0;

// ====== HADIAH ======
const REWARD_SCORE = 5;

// ====== LOAD ASSETS DENGAN FALLBACK ======
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

    bird.onerror = () => { console.warn('bird.png gagal dimuat'); bird._failed = true; done(); };
    bgImg.onerror = () => { console.warn('bg-city.png gagal dimuat'); bgImg._failed = true; done(); };
  });
}

// ====== DRAW TEXT ======
function drawText(txt, x, y, size = 26, color = '#e6e8ec', align = 'center') {
  ctx.font = `700 ${size}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(txt, x, y);
}

// ====== SPAWN OBSTACLE ======
function spawnObstacle() {
  const topH = Math.random() * (H / 2) + OBST_MIN;
  obstacles.push({ x: W, y: 0, w: OBST_WIDTH, h: topH, passed: false });
  obstacles.push({ x: W, y: topH + OBST_GAP, w: OBST_WIDTH, h: H - topH - OBST_GAP, passed: false });
}

// ====== UPDATE ======
function update() {
  if (state !== 'playing') return;

  // background
  bg.x -= bg.speed;
  bg.x2 -= bg.speed;
  if (bg.x + W <= 0) bg.x = W;
  if (bg.x2 + W <= 0) bg.x2 = W;

  // physics
  player.vy += player.gravity;
  player.y += player.vy;

  if (player.y + player.r > H) {
    player.y = H - player.r;
    gameOver();
  } else if (player.y - player.r < 0) {
    player.y = player.r;
    player.vy = 0;
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= OBST_SPEED;

    // collision
    if (
      player.x + player.r > o.x &&
      player.x - player.r < o.x + o.w &&
      player.y + player.r > o.y &&
      player.y - player.r < o.y + o.h
    ) {
      gameOver();
    }

    // delete
    if (o.x + o.w < 0) obstacles.splice(i, 1);

    // score
    if (!o.passed && o.x + o.w < player.x) {
      o.passed = true;
      score++;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('azbry_highscore', highScore);
      }
    }
  }

  if (performance.now() - lastSpawn > SPAWN_EVERY) {
    spawnObstacle();
    lastSpawn = performance.now();
  }
}

// ====== RENDER ======
function render() {
  if (bg.img && !bg.img._failed) {
    ctx.drawImage(bg.img, bg.x, 0, W, H);
    ctx.drawImage(bg.img, bg.x2, 0, W, H);
  } else {
    ctx.fillStyle = '#0b0b0f';
    ctx.fillRect(0, 0, W, H);
  }

  for (const o of obstacles) {
    ctx.fillStyle = OBST_COLOR;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.strokeStyle = OBST_STROKE;
    ctx.strokeRect(o.x, o.y, o.w, o.h);
  }

  if (player.img && !player.img._failed) {
    ctx.drawImage(player.img, player.x - player.r, player.y - player.r, player.r * 2, player.r * 2);
  } else {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
  }

  drawText(`Score: ${score}`, W - 100, 40, 22);
  drawText(`Highscore: ${highScore}`, W - 120, 70, 18, GREEN_DARK);
}

// ====== STATE HANDLER ======
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
function loop() {
  ctx.clearRect(0, 0, W, H);
  render();
  update();

  if (state === 'gameover') {
    drawText('GAME OVER', W / 2, H / 2 - 20, 36, GREEN);
    drawText('Ayo coba lagi!', W / 2, H / 2 + 20, 22);
    drawText(`Kalau dapat ${REWARD_SCORE} poin,\nkamu berhak klaim 1 Nasi Uduk Mama Alpi 🍚`, W / 2, H / 2 + 60, 14, '#ccc');
  }

  requestAnimationFrame(loop);
}

// ====== INPUT ======
function jump() {
  if (state === 'playing') player.vy = player.jump;
}

// ====== START GAME ======
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
