// ===== Azbry Tap Runner — game.js (FIX) =====
// Assets:
//   - Bird : assets/img/bird.png
//   - Bg   : assets/img/bg-night.png

// --- Canvas bootstrap ---
const EXISTING = document.getElementById('gameCanvas');
const canvas = EXISTING || (() => {
  const c = document.createElement('canvas');
  c.id = 'gameCanvas';
  c.style.display = 'block';
  c.style.margin = '0 auto';
  document.body.appendChild(c);
  return c;
})();
const ctx = canvas.getContext('2d');

// --- Config (aman disesuaikan) ---
const GRAVITY = 0.30;        // lebih kecil = jatuh lebih pelan
const JUMP_VELOCITY = -8.2;  // sedikit lebih lemah biar loncatnya pas
const PIPE_SPEED = 2.5;      // turunin biar gerakan pipa lebih pelan
const GAP_HEIGHT = 160;      // celah antar pipa sedikit lebih lebar
const PIPE_WIDTH = 55;       // lebar pipa agak besar biar enak dihindarin
const PIPE_SPACING = 600;    // jarak antar pipa lebih jauh

// footer/credit & link
const CREDIT_TEXT = 'Azbry-MD • FebryWesker';
const PORTFOLIO_URL = 'https://azbry-portofolio.vercel.app/';

// --- State ---
let W = 360, H = 640;         // portrait default, nanti di-resize
let gameStarted = false;
let gameOver = false;
let score = 0;
let best = 0;
let pipes = [];
let bgX = 0;

const bird = {
  x: 80,
  y: 0,
  vy: 0,
  w: 42,
  h: 42
};

// restart button hitbox (saat game over)
let btnRestart = { x: 0, y: 0, w: 0, h: 0 };
// portfolio button hitbox (selama main)
let btnPortfolio = { x: 0, y: 0, w: 0, h: 0 };

// --- Images ---
const imgBird = new Image();
imgBird.src = 'assets/img/bird.png';

const imgBg = new Image();
imgBg.src = 'assets/img/bg-city.png';

let assetsLoaded = 0;
const needAssets = 2;
function onAsset() {
  assetsLoaded++;
  if (assetsLoaded >= needAssets) {
    handleResize();
    resetGame();
    loop();
  }
}
imgBird.onload = onAsset;
imgBg.onload = onAsset;

// --- Helpers ---
function handleResize() {
  // Full viewport, tapi jaga portrait
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // target aspect ~9:16
  const target = 9 / 16;
  const current = vw / vh;

  if (current > target) {
    // layar melebar -> kunci tinggi
    H = Math.min(720, vh);
    W = Math.floor(H * target);
  } else {
    // layar memanjang -> kunci lebar
    W = Math.min(480, vw);
    H = Math.floor(W / target);
  }
  canvas.width = W;
  canvas.height = H;

  // posisi tombol portfolio (pojok kanan bawah)
  ctx.font = '12px Inter, Arial';
  const label = 'Portofolio';
  const tw = ctx.measureText(label).width + 16;
  const th = 26;
  btnPortfolio.w = tw;
  btnPortfolio.h = th;
  btnPortfolio.x = W - tw - 10;
  btnPortfolio.y = H - th - 8;
}

window.addEventListener('resize', handleResize);

function resetGame() {
  score = 0;
  gameOver = false;
  gameStarted = false;
  bird.y = H * 0.45;
  bird.vy = 0;
  pipes = [];
  bgX = 0;
  // siapkan first spawn
  spawnPipe(W + 200);
}

function startGameIfNeeded() {
  if (!gameStarted && !gameOver) {
    gameStarted = true;
  }
}

function jump() {
  if (!gameStarted || gameOver) return;
  bird.vy = JUMP_VELOCITY;
}

function spawnPipe(startX) {
  const minTop = 50;
  const minBottom = 80;
  const maxTop = H - GAP_HEIGHT - minBottom;
  const topHeight = Math.floor(minTop + Math.random() * (maxTop - minTop));

  const p = {
    x: startX,
    w: PIPE_WIDTH,
    top: topHeight,
    bottom: H - (topHeight + GAP_HEIGHT),
    scored: false
  };
  pipes.push(p);
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function drawRoundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// --- Input (tap/klik) ---
function onPointerDown(ev) {
  ev.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = (ev.clientX ?? ev.touches?.[0]?.clientX) - rect.left;
  const y = (ev.clientY ?? ev.touches?.[0]?.clientY) - rect.top;

  // klik tombol portfolio (selama main)
  if (!gameOver) {
    if (x >= btnPortfolio.x && x <= btnPortfolio.x + btnPortfolio.w &&
        y >= btnPortfolio.y && y <= btnPortfolio.y + btnPortfolio.h) {
      window.open(PORTFOLIO_URL, '_blank');
      return;
    }
  }

  // klik tombol restart saat game over
  if (gameOver) {
    if (x >= btnRestart.x && x <= btnRestart.x + btnRestart.w &&
        y >= btnRestart.y && y <= btnRestart.y + btnRestart.h) {
      resetGame();
      return;
    }
  }

  // mulai / lompat
  startGameIfNeeded();
  jump();
}

canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
canvas.addEventListener('touchstart', onPointerDown, { passive: false });

// --- Update & Render ---
function update() {
  if (!gameStarted || gameOver) return;

  // background scroll
  bgX -= PIPE_SPEED * 0.5;
  const bgW = imgBg.width || W;
  if (bgX <= -bgW) bgX += bgW;

  // physics
  bird.vy += GRAVITY;
  bird.y += bird.vy;

  // spawn pipes
  const last = pipes[pipes.length - 1];
  if (last && (W - last.x) >= PIPE_SPACING) {
    spawnPipe(W + 60);
  }

  // move & clean pipes
  for (let i = 0; i < pipes.length; i++) {
    pipes[i].x -= PIPE_SPEED;
  }
  if (pipes.length && pipes[0].x + PIPE_WIDTH < -80) {
    pipes.shift();
  }

  // collision & scoring
  for (const p of pipes) {
    // hit top/bottom pipe
    if (
      rectsOverlap(bird.x, bird.y, bird.w, bird.h, p.x, 0, p.w, p.top) ||
      rectsOverlap(bird.x, bird.y, bird.w, bird.h, p.x, H - p.bottom, p.w, p.bottom)
    ) {
      setGameOver();
      return;
    }
    // score once when bird passed p.x + p.w
    if (!p.scored && bird.x > p.x + p.w) {
      p.scored = true;
      score += 1;
    }
  }

  // out of bounds
  if (bird.y + bird.h >= H || bird.y <= 0) {
    setGameOver();
  }
}

function setGameOver() {
  gameOver = true;
  best = Math.max(best, score);
}

function drawBg() {
  // tile horizontally
  const bgW = imgBg.width || W;
  const bgH = imgBg.height || H;
  const scale = Math.max(W / bgW, H / bgH);
  const drawW = bgW * scale;
  const drawH = bgH * scale;

  let x = bgX % drawW;
  if (x > 0) x -= drawW;

  ctx.drawImage(imgBg, x, 0, drawW, drawH);
  ctx.drawImage(imgBg, x + drawW, 0, drawW, drawH);
}

function drawPipes() {
  ctx.fillStyle = 'rgba(184,255,154,0.15)';
  ctx.strokeStyle = 'rgba(184,255,154,0.9)';
  ctx.lineWidth = 2;

  for (const p of pipes) {
    // top
    ctx.fillRect(p.x, 0, p.w, p.top);
    ctx.strokeRect(p.x + 0.5, 0.5, p.w - 1, p.top - 1);
    // bottom
    const by = H - p.bottom;
    ctx.fillRect(p.x, by, p.w, p.bottom);
    ctx.strokeRect(p.x + 0.5, by + 0.5, p.w - 1, p.bottom - 1);
  }
}

function drawBird() {
  if (imgBird.complete && imgBird.naturalWidth > 0) {
    ctx.drawImage(imgBird, bird.x, bird.y, bird.w, bird.h);
  } else {
    // fallback
    ctx.fillStyle = '#b8ff9a';
    ctx.beginPath();
    ctx.ellipse(bird.x + bird.w/2, bird.y + bird.h/2, bird.w/2, bird.h/2, 0, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawHUD() {
  // score center top
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  const sw = 90, sh = 40;
  ctx.fillRect(W/2 - sw/2, 8, sw, sh);
  ctx.fillStyle = '#b8ff9a';
  ctx.font = 'bold 22px Inter, Arial';
  ctx.textAlign = 'center';
  ctx.fillText(String(score), W/2, 35);

  // footer credit (selama main)
  ctx.textAlign = 'left';
  ctx.font = '12px Inter, Arial';
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(8, H - 34, 160, 26);
  ctx.fillStyle = '#d7fdd0';
  ctx.fillText(CREDIT_TEXT, 12, H - 16);

  // portfolio button (pojok kanan bawah)
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(btnPortfolio.x, btnPortfolio.y, btnPortfolio.w, btnPortfolio.h);
  ctx.strokeStyle = 'rgba(184,255,154,0.6)';
  ctx.strokeRect(btnPortfolio.x + 0.5, btnPortfolio.y + 0.5, btnPortfolio.w - 1, btnPortfolio.h - 1);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#b8ff9a';
  ctx.fillText('Portofolio', btnPortfolio.x + btnPortfolio.w/2, btnPortfolio.y + btnPortfolio.h - 8);
}

function drawStartHint() {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  const bw = 220, bh = 60;
  const bx = W/2 - bw/2, by = H*0.45 - 90;
  drawRoundedRect(bx, by, bw, bh, 10);

  ctx.fillStyle = '#e6ffe1';
  ctx.font = 'bold 18px Inter, Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Tap untuk Mulai', W/2, by + 36);
}

function drawGameOver() {
  // overlay
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0,0,W,H);

  // panel
  const pw = Math.min(300, W - 40);
  const ph = 180;
  const px = (W - pw) / 2;
  const py = H * 0.25;

  ctx.fillStyle = 'rgba(17,20,24,0.95)';
  ctx.strokeStyle = 'rgba(184,255,154,0.25)';
  ctx.lineWidth = 1.5;
  drawRoundedRect(px, py, pw, ph, 14);

  ctx.fillStyle = '#b8ff9a';
  ctx.font = 'bold 22px Inter, Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', px + pw/2, py + 40);

  ctx.fillStyle = '#dfffe0';
  ctx.font = '14px Inter, Arial';
  ctx.fillText(`Skor: ${score} • Rekor: ${best}`, px + pw/2, py + 66);

  ctx.fillStyle = '#cfeec8';
  ctx.font = '13px Inter, Arial';
  ctx.fillText('Ayo coba lagi! Dapatkan 100 score', px + pw/2, py + 92);
  ctx.fillText('dan kamu boleh mengambil hadiah dari Febry', px + pw/2, py + 110);

  // tombol restart
  const bw = 140, bh = 40;
  btnRestart.w = bw; btnRestart.h = bh;
  btnRestart.x = px + (pw - bw)/2;
  btnRestart.y = py + ph - bh - 14;

  ctx.fillStyle = 'linear-gradient(180deg, #b8ff9a, #8ee887)';
  // canvas gak support gradient string, bikin manual:
  const g = ctx.createLinearGradient(0, btnRestart.y, 0, btnRestart.y + bh);
  g.addColorStop(0, '#b8ff9a');
  g.addColorStop(1, '#8ee887');
  ctx.fillStyle = g;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  drawRoundedRect(btnRestart.x, btnRestart.y, bw, bh, 10);

  ctx.fillStyle = '#0b0d10';
  ctx.font = 'bold 14px Inter, Arial';
  ctx.fillText('Main Lagi', btnRestart.x + bw/2, btnRestart.y + 26);
}

function render() {
  // bg
  if (imgBg.complete && imgBg.naturalWidth > 0) {
    drawBg();
  } else {
    // fallback plain
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(0,0,W,H);
  }

  // pipes
  drawPipes();

  // bird
  drawBird();

  // HUD
  drawHUD();

  // hints / overlays
  if (!gameStarted && !gameOver) drawStartHint();
  if (gameOver) drawGameOver();
}

function loop() {
  update();
  ctx.clearRect(0,0,W,H);
  render();
  requestAnimationFrame(loop);
                   }
