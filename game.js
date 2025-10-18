/* ===== AZBRY TAP-RUNNER — SAFE MODE LOOP ===== */

/* ---- Konfigurasi gameplay (boleh kamu tweak) ---- */
const GRAVITY = 0.30;        // lebih kecil = jatuh lebih pelan
const JUMP_VELOCITY = -8.2;  // sedikit lebih lemah biar loncatnya pas
const PIPE_SPEED = 2.5;      // turunin biar gerakan pipa lebih pelan
const GAP_HEIGHT = 160;      // celah antar pipa sedikit lebih lebar
const PIPE_WIDTH = 55;       // lebar pipa agak besar biar enak dihindarin
const PIPE_SPACING = 600;    // jarak antar pipa lebih jauh

/* ---- Pegangan DOM & canvas ---- */
const canvas = document.getElementById('game') || (() => {
  const c = document.createElement('canvas');
  c.id = 'game';
  document.body.appendChild(c);
  return c;
})();
const ctx = canvas.getContext('2d');

/* ---- Overlay debug di HP (biar kelihatan kalau ada error) ---- */
let debugEl = document.getElementById('debug');
if (!debugEl) {
  debugEl = document.createElement('div');
  debugEl.id = 'debug';
  debugEl.style.cssText = 'position:fixed;left:8px;bottom:8px;max-width:90vw;background:rgba(0,0,0,.5);color:#b8ff9a;font:12px/1.35 monospace;padding:6px 8px;border-radius:8px;z-index:9999;display:none;white-space:pre-wrap;';
  document.body.appendChild(debugEl);
}
function dbg(msg) {
  debugEl.style.display = 'block';
  debugEl.textContent = String(msg).slice(0, 800);
}

/* Tangkap error global supaya loop nggak mati */
window.addEventListener('error', (e) => dbg(`JS Error: ${e.message}`));

/* ---- Ukuran aman (9:16 ramah-HP, tanpa devicePixelRatio) ---- */
function fitCanvas916() {
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  // target 9:16
  let w = sw, h = Math.round((sw * 16) / 9);
  if (h > sh) { // kalau kepanjangan, pakai tinggi layar
    h = sh;
    w = Math.round((sh * 9) / 16);
  }
  canvas.width = w;
  canvas.height = h;
}
fitCanvas916();
window.addEventListener('resize', () => {
  fitCanvas916();
});

/* ---- Asset (opsional, tidak bikin crash kalau gagal) ---- */
const birdImg = new Image();
birdImg.src = './assets/bird.jpg'; // ganti ke path repo kamu
birdImg.onerror = () => dbg('Gagal load bird image (pakai bentuk bulat).');

const bgImg = new Image();
bgImg.src = './assets/bg.jpg';     // ganti ke path repo kamu
bgImg.onerror = () => dbg('Gagal load background (pakai fill saja).');

/* ---- State game ---- */
let running = false;
let gameOver = false;
let score = 0;
let bestScore = 0;

const bird = {
  x: 0,
  y: 0,
  r: 18,
  vy: 0
};

let pipes = [];
let bgOffset = 0;

/* ---- Reset state ---- */
function resetGame() {
  fitCanvas916();
  const W = canvas.width, H = canvas.height;
  running = true;
  gameOver = false;
  score = 0;

  bird.x = Math.round(W * 0.25);
  bird.y = Math.round(H * 0.45);
  bird.vy = 0;

  pipes = [];
  bgOffset = 0;

  // spawn beberapa pipa awal
  let x = W + 60;
  for (let i = 0; i < 3; i++) {
    const gapY = randInt(Math.round(H * 0.22), Math.round(H * 0.65));
    pipes.push({ x, gapY, passed: false });
    x += PIPE_SPACING;
  }
}

/* ---- Util ---- */
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

/* ---- Input (tap/klik/space) ---- */
function jump() {
  if (!running) return;
  if (gameOver) return;
  bird.vy = JUMP_VELOCITY;
}
function handleStart() {
  if (!running) {
    resetGame();
    requestAnimationFrame(loop);
  } else if (gameOver) {
    // tombol restart wajib dipakai; tap biasa diabaikan saat game over
  } else {
    jump();
  }
}
canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); handleStart(); }, { passive: false });
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    handleStart();
  }
});

/* ---- Tombol Restart (opsional kalau kamu sudah buat di HTML) ---- */
const restartBtn = document.getElementById('restart');
if (restartBtn) {
  restartBtn.addEventListener('click', () => {
    resetGame();
    requestAnimationFrame(loop);
  });
}

/* ---- Update ---- */
function update(dt) {
  const W = canvas.width, H = canvas.height;
  if (gameOver) return;

  // background scroll (pelan)
  bgOffset -= PIPE_SPEED * 0.25;
  if (bgOffset <= -W) bgOffset += W;

  // fisika burung
  bird.vy += GRAVITY;
  bird.y += bird.vy;

  // batas layar
  if (bird.y < bird.r) { bird.y = bird.r; bird.vy = 0; }
  if (bird.y > H - bird.r) { bird.y = H - bird.r; gameOver = true; bestScore = Math.max(bestScore, score); }

  // pipa
  pipes.forEach(p => p.x -= PIPE_SPEED);

  // tambah pipa baru bila cukup jauh
  if (pipes.length) {
    const last = pipes[pipes.length - 1];
    if (last.x < W - PIPE_SPACING) {
      const gapY = randInt(Math.round(H * 0.22), Math.round(H * 0.65));
      pipes.push({ x: last.x + PIPE_SPACING, gapY, passed: false });
    }
  }

  // buang pipa di kiri
  if (pipes.length && pipes[0].x + PIPE_WIDTH < 0) pipes.shift();

  // skor & tabrakan
  for (const p of pipes) {
    // nambah skor sekali per pipa
    if (!p.passed && p.x + PIPE_WIDTH < bird.x - bird.r) {
  p.passed = true;
  score += 1;
  if (score === 5) alert('🎉 Selamat! Kamu dapet 1× Nasi Uduk Mama Alpi 🍛');
    }
    }
    // cek tabrak
    const inX = bird.x + bird.r > p.x && bird.x - bird.r < p.x + PIPE_WIDTH;
    const gapTop = p.gapY - GAP_HEIGHT / 2;
    const gapBot = p.gapY + GAP_HEIGHT / 2;
    const hitTop = bird.y - bird.r < gapTop;
    const hitBot = bird.y + bird.r > gapBot;
    if (inX && (hitTop || hitBot)) {
      gameOver = true;
      bestScore = Math.max(bestScore, score);
    }
  }
}

/* ---- Render ---- */
function drawBackground() {
  const W = canvas.width, H = canvas.height;
  if (bgImg.complete && bgImg.naturalWidth > 0) {
    // gambar 2 ubin agar bisa looping
    const x1 = Math.floor(bgOffset);
    const x2 = x1 + W;
    ctx.drawImage(bgImg, x1, 0, W, H);
    ctx.drawImage(bgImg, x2, 0, W, H);
  } else {
    // fallback fill (tema gelap hijau)
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(184,255,154,0.05)';
    ctx.fillRect(0, 0, W, Math.floor(H * 0.33));
  }
}

function drawBird() {
  const d = bird.r * 2;
  if (birdImg.complete && birdImg.naturalWidth > 0) {
    ctx.save();
    // sedikit rotasi sesuai kecepatan buat “rasa fisik”
    const rot = Math.max(-0.35, Math.min(0.6, bird.vy * 0.06));
    ctx.translate(bird.x, bird.y);
    ctx.rotate(rot);
    ctx.drawImage(birdImg, -bird.r, -bird.r, d, d);
    ctx.restore();
  } else {
    // fallback bulatan
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2);
    ctx.fillStyle = '#b8ff9a';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#8ee887';
    ctx.stroke();
  }
}

function drawPipes() {
  const H = canvas.height;
  ctx.fillStyle = 'rgba(184,255,154,0.14)';
  ctx.strokeStyle = '#8ee887';
  ctx.lineWidth = 2.5;

  for (const p of pipes) {
    const gapTop = p.gapY - GAP_HEIGHT / 2;
    const gapBot = p.gapY + GAP_HEIGHT / 2;

    // pipa atas
    ctx.fillRect(p.x, 0, PIPE_WIDTH, gapTop);
    ctx.strokeRect(p.x, 0, PIPE_WIDTH, gapTop);

    // pipa bawah
    ctx.fillRect(p.x, gapBot, PIPE_WIDTH, H - gapBot);
    ctx.strokeRect(p.x, gapBot, PIPE_WIDTH, H - gapBot);
  }
}

function drawHUD() {
  const W = canvas.width, H = canvas.height;

  // skor
  ctx.font = Math.floor(W * 0.07) + 'px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e6e8ec';
  ctx.fillText(String(score), Math.floor(W / 2), Math.floor(H * 0.12));

  // tip footer (selama main)
  ctx.font = '12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(230,232,236,0.75)';
  ctx.fillText('Azbry-MD — FebryWesker', 10, H - 10);

  // tombol portofolio (pojok kanan bawah)
  const linkText = 'Portofolio';
  ctx.textAlign = 'right';
  ctx.fillText(linkText, W - 10, H - 10);
  // deteksi klik area linkPortofolio kecil (opsional)
}

function drawGameOver() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#e6e8ec';
  ctx.font = 'bold ' + Math.floor(W * 0.08) + 'px Inter, system-ui, sans-serif';
  ctx.fillText('GAME OVER', Math.floor(W / 2), Math.floor(H * 0.42));

  ctx.font = Math.floor(W * 0.045) + 'px Inter, system-ui, sans-serif';
  ctx.fillText(`Score: ${score}  •  Best: ${bestScore}`, Math.floor(W / 2), Math.floor(H * 0.50));

  ctx.font = Math.floor(W * 0.035) + 'px Inter, system-ui, sans-serif';
  ctx.fillText('Ayo coba lagi! Capai 50 poin untuk 1× Nasi Uduk Mama Alpi', Math.floor(W / 2), Math.floor(H * 0.58));

  // tombol restart visual (kalau kamu belum pakai tombol HTML)
  ctx.fillStyle = '#b8ff9a';
  const bw = Math.floor(W * 0.42), bh = Math.floor(H * 0.08);
  const bx = Math.floor(W / 2 - bw / 2), by = Math.floor(H * 0.66);
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#0b0d10';
  ctx.font = 'bold ' + Math.floor(W * 0.045) + 'px Inter, system-ui, sans-serif';
  ctx.fillText('Main Lagi', Math.floor(W / 2), Math.floor(H * 0.66 + bh * 0.65));

  // area klik tombol restart (untuk canvas-only)
  canvas.onclick = (ev) => {
    if (!gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
      resetGame();
      requestAnimationFrame(loop);
    }
  };
}

/* ---- Loop dengan proteksi error ---- */
let last = 0;
function loop(ts) {
  if (!running) return;
  try {
    const dt = ts - (last || ts);
    last = ts;

    update(dt);

    // gambar
    drawBackground();
    drawPipes();
    drawBird();
    drawHUD();

    if (gameOver) {
      drawGameOver();
      return; // berhenti sampai user restart
    }

    requestAnimationFrame(loop);
  } catch (err) {
    dbg('Loop crash: ' + (err?.message || err));
    // coba terus agar tidak jadi layar hitam permanen
    requestAnimationFrame(loop);
  }
}

/* ---- Mulai game saat halaman siap ---- */
window.addEventListener('load', () => {
  // Mulai pada kondisi menunggu tap pertama (running masih false)
  // biar user sadar perlu tap.
  ctx.fillStyle = '#0b0d10';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e6e8ec';
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px Inter, system-ui, sans-serif';
  ctx.fillText('Tap untuk mulai', canvas.width / 2, canvas.height / 2);
});
