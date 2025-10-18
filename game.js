// ====== Azbry Tap Runner — game.js (FIX) ======
// Konfigurasi dasar
const CANVAS_W = 360;
const CANVAS_H = 640;

const GRAVITY = 0.42;     // gravitasi jatuh
const JUMP_VELOCITY = -7.6; // kekuatan loncat
const PIPE_SPEED = 2.6;   // kecepatan maju
const GAP_HEIGHT = 150;   // tinggi celah antar pipa
const PIPE_WIDTH = 56;    // lebar pipa
const PIPE_SPACING = 220; // jarak antar pasangan pipa

const REWARD_TARGET = 50; // target hadiah (ubah sesukamu)

// ambil elemen
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// ukuran kanvas fix (rasio 9:16). Styling scale di CSS.
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

// asset
const birdImg = new Image();
const bgImg = new Image();

// Ganti path sesuai repo kamu (pakai aset lokal biar cepat)
birdImg.src = './assets/bird.png';
bgImg.src = './assets/bg-city.png';

// state game
let started = false;
let gameOver = false;
let score = 0;
let highScore = parseInt(localStorage.getItem('azbry_highscore') || '0', 10);

// background parallax
let bgX1 = 0;
let bgX2 = CANVAS_W;

// pemain
const player = {
  x: 60,
  y: CANVAS_H / 2,
  vy: 0,
  r: 16 // radius tabrakan (aproksimasi)
};

// obstacle disimpan per **pasangan** (satu objek = dua pipa: atas & bawah)
let pipes = [];
let lastSpawnX = CANVAS_W + 120;

// util random
function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

// buat 1 pasangan pipa (gapY = posisi tengah celah)
function spawnPipePair(x) {
  const margin = 60; // margin dari tepi atas/bawah biar adil
  const gapY = randRange(margin + GAP_HEIGHT / 2, CANVAS_H - margin - GAP_HEIGHT / 2);
  pipes.push({
    x,
    gapY,
    w: PIPE_WIDTH,
    gapH: GAP_HEIGHT,
    passed: false // untuk skor (hanya dihitung 1x per pasangan)
  });
}

// reset total
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

// gambar background bergerak (loop)
function drawBackground() {
  const h = CANVAS_H;
  const w = CANVAS_W;

  bgX1 -= PIPE_SPEED * 0.6;
  bgX2 -= PIPE_SPEED * 0.6;

  if (bgX1 + w <= 0) bgX1 = bgX2 + w;
  if (bgX2 + w <= 0) bgX2 = bgX1 + w;

  ctx.drawImage(bgImg, bgX1, 0, w, h);
  ctx.drawImage(bgImg, bgX2, 0, w, h);
}

// gambar pemain
function drawPlayer() {
  const s = 36; // ukuran gambar burung
  if (birdImg.complete && birdImg.naturalWidth > 0) {
    ctx.drawImage(birdImg, player.x - s/2, player.y - s/2, s, s);
  } else {
    // fallback kalau gambar belum termuat
    ctx.fillStyle = '#8ae68a';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// gambar satu pasangan pipa + outline hijau
function drawPipePair(p) {
  ctx.save();

  // warna pipa (abu neon) + border hijau
  ctx.fillStyle = '#30363d';
  ctx.strokeStyle = '#8ee887';
  ctx.lineWidth = 3;

  const topHeight = p.gapY - p.gapH / 2;
  const bottomY = p.gapY + p.gapH / 2;
  const bottomHeight = CANVAS_H - bottomY;

  // pipa atas
  ctx.fillRect(p.x, 0, p.w, topHeight);
  ctx.strokeRect(p.x, 0, p.w, topHeight);

  // pipa bawah
  ctx.fillRect(p.x, bottomY, p.w, bottomHeight);
  ctx.strokeRect(p.x, bottomY, p.w, bottomHeight);

  ctx.restore();
}

// update logika
function update() {
  if (!started || gameOver) return;

  // background
  drawBackground();

  // fisika burung
  player.vy += GRAVITY;
  player.y += player.vy;

  // spawn pipa baru jika perlu
  if (lastSpawnX - pipes[pipes.length - 1]?.x >= PIPE_SPACING || pipes.length === 0) {
    lastSpawnX += PIPE_SPACING;
  }
  // geser & gambar pipa
  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    p.x -= PIPE_SPEED;
    drawPipePair(p);
  }
  // hapus pipa yang keluar layar & pastikan supply
  pipes = pipes.filter(p => p.x + p.w > -10);
  if (pipes.length === 0 || (pipes[pipes.length - 1].x < CANVAS_W - PIPE_SPACING)) {
    spawnPipePair(CANVAS_W + 20);
  }

  // gambar burung
  drawPlayer();

  // skor — hanya dihitung 1x per pasangan pipa (saat pipa **bawah** sudah lewat burung)
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

  // deteksi tabrakan
  for (const p of pipes) {
    const topRect = { x: p.x, y: 0, w: p.w, h: p.gapY - p.gapH / 2 };
    const botRect = { x: p.x, y: p.gapY + p.gapH / 2, w: p.w, h: CANVAS_H - (p.gapY + p.gapH / 2) };

    if (circleRectCollide(player.x, player.y, player.r, topRect) ||
        circleRectCollide(player.x, player.y, player.r, botRect)) {
      triggerGameOver();
      break;
    }
  }

  // jatuh ke tanah / nabrak langit
  if (player.y + player.r >= CANVAS_H || player.y - player.r <= 0) {
    triggerGameOver();
  }

  // UI skor
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
  // overlay
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // teks
  ctx.fillStyle = '#e6e8ec';
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px Inter, system-ui, sans-serif';
  ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 40);

  ctx.font = '600 14px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#d6ffd2';
  ctx.fillText(`Ayo coba lagi! Capai ${REWARD_TARGET} skor`, CANVAS_W / 2, CANVAS_H / 2 - 12);
  ctx.fillText('untuk 1× Nasi Uduk Mama Alpi.', CANVAS_W / 2, CANVAS_H / 2 + 8);

  // tombol
  const btnW = 150, btnH = 44;
  const btnX = (CANVAS_W - btnW) / 2;
  const btnY = CANVAS_H / 2 + 40;

  // simpan area tombol untuk klik
  restartButtonArea = { x: btnX, y: btnY, w: btnW, h: btnH };

  // tombol style
  ctx.fillStyle = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
  ctx.fillStyle.addColorStop(0, '#b8ff9a');
  ctx.fillStyle.addColorStop(1, '#8ee887');
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

// input
function flap() {
  if (!started) {
    started = true;
    player.vy = JUMP_VELOCITY;
    requestAnimationFrame(update);
  } else if (!gameOver) {
    player.vy = JUMP_VELOCITY;
  }
}

// klik tombol restart di dalam canvas
let restartButtonArea = null;
function onPointerDown(evt) {
  const rect = canvas.getBoundingClientRect();
  const x = (evt.clientX || (evt.touches && evt.touches[0].clientX)) - rect.left;
  const y = (evt.clientY || (evt.touches && evt.touches[0].clientY)) - rect.top;

  // transform ke koordinat internal canvas (kalau canvas diskalakan CSS)
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const cx = x * scaleX;
  const cy = y * scaleY;

  if (gameOver && restartButtonArea) {
    const b = restartButtonArea;
    if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
      resetGame();
      // tampilkan layar awal (belum jalan sampai tap)
      drawStartScreen();
      return;
    }
  }
  flap();
}

function onKeyDown(e) {
  if (e.code === 'Space') {
    if (gameOver && restartButtonArea) {
      // space saat game over = restart
      resetGame();
      drawStartScreen();
      return;
    }
    flap();
  }
}

canvas.addEventListener('mousedown', onPointerDown, { passive: true });
canvas.addEventListener('touchstart', onPointerDown, { passive: true });
window.addEventListener('keydown', onKeyDown);

// layar awal
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

// mulai
resetGame();
drawStartScreen();
