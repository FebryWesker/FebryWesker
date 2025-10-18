// Azbry-MD MiniGame — FebryWesker
// ================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const VW = 360;
const VH = 640;
canvas.width = VW;
canvas.height = VH;

const GRAVITY = 0.30;
const JUMP_VELOCITY = -8.2;
const PIPE_SPEED = 2.5;
const GAP_HEIGHT = 160;
const PIPE_WIDTH = 55;
const PIPE_SPACING = 600;

let bird, bgReady = false, bgTileW = VW, bgTileH = VH, bgX = 0;
let pipes = [];
let gameOver = false;
let score = 0;
let started = false;

// gambar
const imgBird = new Image();
imgBird.src = 'assets/img/bird.png';
const imgBg = new Image();
imgBg.src = 'assets/img/bg-city.png';
imgBg.onload = () => {
  const scale = VH / imgBg.naturalHeight;
  bgTileW = imgBg.naturalWidth * scale;
  bgTileH = VH;
  bgReady = true;
};

function resetGame() {
  bird = { x: 80, y: VH / 2, velocity: 0 };
  pipes = [];
  bgX = 0;
  score = 0;
  gameOver = false;
  started = false;
  document.getElementById('restartBtn')?.remove();
}

function startGame() {
  started = true;
  bird = { x: 80, y: VH / 2, velocity: 0 };
  pipes = [];
  score = 0;
  gameOver = false;
}

resetGame();

// pipa generator
function createPipe() {
  const topH = Math.random() * (VH - GAP_HEIGHT - 200) + 50;
  pipes.push({
    x: VW,
    top: topH,
    bottom: topH + GAP_HEIGHT
  });
}

// kontrol tap
canvas.addEventListener('click', () => {
  if (!started) startGame();
  else if (!gameOver) bird.velocity = JUMP_VELOCITY;
});

// update loop
let lastPipe = 0;
function update(dt) {
  if (!started || gameOver) return;
  bird.velocity += GRAVITY;
  bird.y += bird.velocity;

  // scroll background
  bgX = (bgX - PIPE_SPEED * 0.35 + bgTileW) % bgTileW;

  // buat pipa baru
  if (pipes.length === 0 || VW - pipes[pipes.length - 1].x >= PIPE_SPACING) {
    createPipe();
  }

  for (let p of pipes) {
    p.x -= PIPE_SPEED;
  }

  // hapus pipa keluar layar
  pipes = pipes.filter(p => p.x + PIPE_WIDTH > 0);

  // tabrakan
  for (let p of pipes) {
    if (
      bird.x + 24 > p.x && bird.x < p.x + PIPE_WIDTH &&
      (bird.y < p.top || bird.y + 24 > p.bottom)
    ) {
      gameOver = true;
    }
  }

  if (bird.y + 24 > VH || bird.y < 0) gameOver = true;

  // score
  for (let p of pipes) {
    if (!p.scored && bird.x > p.x + PIPE_WIDTH) {
      p.scored = true;
      score++;
      if (score >= 50 && !p.rewardShown) {
        p.rewardShown = true;
      }
    }
  }

  if (gameOver) renderGameOver();
}

// render loop
function render() {
  ctx.clearRect(0, 0, VW, VH);

  // background
  if (bgReady) {
    const start = - (bgX % bgTileW) - bgTileW;
    for (let x = start; x < VW + bgTileW; x += bgTileW) {
      ctx.drawImage(imgBg, 0, 0, imgBg.naturalWidth, imgBg.naturalHeight, x, 0, bgTileW, bgTileH);
    }
  } else {
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, VW, VH);
  }

  // pipa
  ctx.fillStyle = '#55cc66';
  for (let p of pipes) {
    ctx.fillRect(p.x, 0, PIPE_WIDTH, p.top);
    ctx.fillRect(p.x, p.bottom, PIPE_WIDTH, VH - p.bottom);
  }

  // burung
  if (imgBird.complete) ctx.drawImage(imgBird, bird.x, bird.y, 34, 24);
  else {
    ctx.fillStyle = '#b8ff9a';
    ctx.fillRect(bird.x, bird.y, 24, 24);
  }

  // skor
  ctx.fillStyle = '#e6e8ec';
  ctx.font = '700 24px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(score, VW / 2, 80);
}

function renderGameOver() {
  const btn = document.createElement('button');
  btn.id = 'restartBtn';
  btn.textContent = 'Main Lagi';
  btn.style.cssText = `
    position: absolute; left: 50%; top: 60%;
    transform: translate(-50%, -50%);
    background: linear-gradient(180deg,#b8ff9a,#8ee887);
    color: #0b0d10; font-weight: 700; font-size: 16px;
    border: none; padding: 10px 20px; border-radius: 12px;
    box-shadow: 0 0 12px rgba(184,255,154,.4); cursor: pointer;
  `;
  btn.onclick = () => resetGame();
  document.body.appendChild(btn);
}

// loop utama
let last = 0;
function loop(ts) {
  const dt = ts - last;
  last = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// info bar
const bar = document.createElement('div');
bar.style.cssText = `
  position:fixed; left:12px; right:12px; top:10px;
  color:#dfe7dd; font:600 14px Inter,system-ui,sans-serif;
  display:flex; justify-content:space-between; pointer-events:none;
  text-shadow:0 1px 0 rgba(0,0,0,.4);
`;
bar.innerHTML = `<span>Azbry-MD • FebryWesker</span><span id="hudScore">Score: 0</span>`;
document.body.appendChild(bar);

// game over overlay teks
function renderOverlayText() {
  if (gameOver) {
    ctx.fillStyle = '#e6e8ec';
    ctx.font = '700 32px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', VW / 2, VH / 2 - 40);
    ctx.font = '500 16px Inter';
    ctx.fillText('Selesaikan 50 poin dan dapatkan reward x1 Nasi Uduk Mama Alpi', VW / 2, VH / 2);
  }
      }
