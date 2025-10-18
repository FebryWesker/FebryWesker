// ====== Azbry Tap Runner — game.js (MOBILE TAP ULTRA-FIX) ======
const CANVAS_W = 360;
const CANVAS_H = 640;

const GRAVITY = 0.30;        // lebih kecil = jatuh lebih pelan
const JUMP_VELOCITY = -8.2;  // sedikit lebih lemah biar loncatnya pas
const PIPE_SPEED = 2.5;      // turunin biar gerakan pipa lebih pelan
const GAP_HEIGHT = 160;      // celah antar pipa sedikit lebih lebar
const PIPE_WIDTH = 55;       // lebar pipa agak besar biar enak dihindarin
const PIPE_SPACING = 600;    // jarak antar pipa lebih jauh

const REWARD_TARGET = 50;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

// ⛔ matikan default gesture (zoom/scroll) di area canvas
canvas.style.touchAction = 'none';

// asset
const birdImg = new Image();
const bgImg = new Image();
birdImg.src = './assets/img/bird.png';
bgImg.src = './assets/img/bg-city.png';

// state
let started = false;
let gameOver = false;
let score = 0;
let highScore = parseInt(localStorage.getItem('azbry_highscore') || '0', 10);
let restartButtonArea = null;

// background
let bgX1 = 0;
let bgX2 = CANVAS_W;

// player
const player = { x: 60, y: CANVAS_H / 2, vy: 0, r: 16 };
let pipes = [];
let lastSpawnX = CANVAS_W + 120;

// utils
function randRange(min, max) { return Math.random() * (max - min) + min; }
function spawnPipePair(x) {
  const margin = 60;
  const gapY = randRange(margin + GAP_HEIGHT / 2, CANVAS_H - margin - GAP_HEIGHT / 2);
  pipes.push({ x, gapY, w: PIPE_WIDTH, gapH: GAP_HEIGHT, passed: false });
}
function resetGame() {
  started = false;
  gameOver = false;
  score = 0;
  player.x = 60;
  player.y = CANVAS_H / 2;
  player.vy = 0;
  pipes = [];
  bgX1 = 0;
  bgX2 = CANVAS_W;
  lastSpawnX = CANVAS_W + 120;
  spawnPipePair(CANVAS_W + 100);
  spawnPipePair(CANVAS_W + 100 + PIPE_SPACING);
  spawnPipePair(CANVAS_W + 100 + PIPE_SPACING * 2);
}

function drawBackground() {
  const h = CANVAS_H, w = CANVAS_W;
  bgX1 -= PIPE_SPEED * 0.6;
  bgX2 -= PIPE_SPEED * 0.6;
  if (bgX1 + w <= 0) bgX1 = bgX2 + w;
  if (bgX2 + w <= 0) bgX2 = bgX1 + w;
  ctx.drawImage(bgImg, bgX1, 0, w, h);
  ctx.drawImage(bgImg, bgX2, 0, w, h);
}

function drawPlayer() {
  const s = 36;
  if (birdImg.complete && birdImg.naturalWidth > 0)
    ctx.drawImage(birdImg, player.x - s / 2, player.y - s / 2, s, s);
  else {
    ctx.fillStyle = '#8ae68a';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPipePair(p) {
  ctx.save();
  ctx.fillStyle = '#30363d';
  ctx.strokeStyle = '#8ee887';
  ctx.lineWidth = 3;

  const topHeight = p.gapY - p.gapH / 2;
  const bottomY = p.gapY + p.gapH / 2;
  const bottomHeight = CANVAS_H - bottomY;

  ctx.fillRect(p.x, 0, p.w, topHeight);
  ctx.strokeRect(p.x, 0, p.w, topHeight);
  ctx.fillRect(p.x, bottomY, p.w, bottomHeight);
  ctx.strokeRect(p.x, bottomY, p.w, bottomHeight);
  ctx.restore();
}

function update() {
  if (!started || gameOver) return;

  drawBackground();
  player.vy += GRAVITY;
  player.y += player.vy;

  if (lastSpawnX - pipes[pipes.length - 1]?.x >= PIPE_SPACING || pipes.length === 0)
    lastSpawnX += PIPE_SPACING;

  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    p.x -= PIPE_SPEED;
    drawPipePair(p);
  }

  pipes = pipes.filter(p => p.x + p.w > -10);
  if (pipes.length === 0 || (pipes[pipes.length - 1].x < CANVAS_W - PIPE_SPACING))
    spawnPipePair(CANVAS_W + 20);

  drawPlayer();

  for (const p of pipes) {
    if (!p.passed && p.x + p.w < player.x) {
      p.passed = true;
      score += 1;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('azbry_highscore', highScore);
      }
    }
  }

  for (const p of pipes) {
    const topRect = { x: p.x, y: 0, w: p.w, h: p.gapY - p.gapH / 2 };
    const botRect = { x: p.x, y: p.gapY + p.gapH / 2, w: p.w, h: CANVAS_H - (p.gapY + p.gapH / 2) };
    if (circleRectCollide(player.x, player.y, player.r, topRect) ||
        circleRectCollide(player.x, player.y, player.r, botRect)) {
      triggerGameOver();
      break;
    }
  }

  if (player.y + player.r >= CANVAS_H || player.y - player.r <= 0) triggerGameOver();
  drawHUD();
  requestAnimationFrame(update);
}

function drawHUD() {
  ctx.save();
  ctx.fillStyle = '#e6e8ec';
  ctx.font = 'bold 24px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 12, 32);
  ctx.font = '600 14px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#98a2b3';
  ctx.fillText(`Best: ${highScore}`, 12, 52);
  ctx.restore();
}

function triggerGameOver() {
  gameOver = true;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#e6e8ec';
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px Inter, system-ui, sans-serif';
  ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 40);
  ctx.font = '600 14px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#d6ffd2';
  ctx.fillText(`Ayo coba lagi! Capai ${REWARD_TARGET} skor`, CANVAS_W / 2, CANVAS_H / 2 - 12);
  ctx.fillText('untuk 1× Nasi Uduk Mama Alpi.', CANVAS_W / 2, CANVAS_H / 2 + 8);

  const btnW = 150, btnH = 44;
  const btnX = (CANVAS_W - btnW) / 2;
  const btnY = CANVAS_H / 2 + 40;
  restartButtonArea = { x: btnX, y: btnY, w: btnW, h: btnH };

  const g = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
  g.addColorStop(0, '#b8ff9a'); g.addColorStop(1, '#8ee887');
  ctx.fillStyle = g;
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = 'rgba(0,0,0,.18)';
  ctx.strokeRect(btnX + 0.5, btnY + 0.5, btnW - 1, btnH - 1);
  ctx.fillStyle = '#0b0d10';
  ctx.font = 'bold 16px Inter, system-ui, sans-serif';
  ctx.fillText('Main lagi', CANVAS_W / 2, btnY + 28);
  ctx.restore();
}

function circleRectCollide(cx, cy, cr, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return (dx * dx + dy * dy) <= (cr * cr);
}

function flap() {
  if (!started) {
    started = true;
    player.vy = JUMP_VELOCITY;
    requestAnimationFrame(update);
  } else if (!gameOver) {
    player.vy = JUMP_VELOCITY;
  }
}

// ——— INPUT HANDLERS (mobile/desktop) ———
function getPointerXY(evt) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;

  if (evt.touches && evt.touches.length) {
    clientX = evt.touches[0].clientX;
    clientY = evt.touches[0].clientY;
  } else if (evt.changedTouches && evt.changedTouches.length) {
    clientX = evt.changedTouches[0].clientX;
    clientY = evt.changedTouches[0].clientY;
  } else {
    clientX = evt.clientX;
    clientY = evt.clientY;
  }

  const x = (clientX - rect.left) * (canvas.width / rect.width);
  const y = (clientY - rect.top) * (canvas.height / rect.height);
  return { x, y };
}

function pointerDownHandler(evt) {
  evt.preventDefault(); // penting buat HP
  const { x, y } = getPointerXY(evt);

  if (gameOver && restartButtonArea) {
    const b = restartButtonArea;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      resetGame();
      drawStartScreen();
      return;
    }
  }
  flap();
}

function keyDownHandler(e) {
  if (e.code === 'Space') {
    if (gameOver && restartButtonArea) {
      resetGame();
      drawStartScreen();
      return;
    }
    flap();
  }
}

// Pakai pointerdown (universal), plus fallback
canvas.addEventListener('pointerdown', pointerDownHandler, { passive: false });
canvas.addEventListener('touchstart', pointerDownHandler, { passive: false });
canvas.addEventListener('mousedown', pointerDownHandler, { passive: false });
canvas.addEventListener('click', pointerDownHandler, { passive: false });
window.addEventListener('keydown', keyDownHandler);

// start screen
function drawStartScreen() {
  drawBackground();
  drawPlayer();
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e6e8ec';
  ctx.font = 'bold 24px Inter, system-ui, sans-serif';
  ctx.fillText('Azbry Tap Runner', CANVAS_W / 2, CANVAS_H / 2 - 20);
  ctx.font = '600 14px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#98a2b3';
  ctx.fillText('Tap / klik / spasi untuk mulai', CANVAS_W / 2, CANVAS_H / 2 + 6);
  ctx.restore();
  drawHUD();
}

// init
resetGame();
drawStartScreen();
