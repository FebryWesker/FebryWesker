// ===== AZBRY-MD MINIGAME =====
// by FebryWesker

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = 360;
const HEIGHT = 640;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// === KONSTANTA GAME ===
const GRAVITY = 0.30;        // lebih kecil = jatuh lebih pelan
const JUMP_VELOCITY = -8.2;  // sedikit lebih lemah biar loncatnya pas
const PIPE_SPEED = 2.5;      // turunin biar gerakan pipa lebih pelan
const GAP_HEIGHT = 160;      // celah antar pipa sedikit lebih lebar
const PIPE_WIDTH = 55;       // lebar pipa agak besar biar enak dihindarin
const PIPE_SPACING = 600;    // jarak antar pipa lebih jauh
const REWARD_SCORE = 5; // ubah ke 50 kalau sudah stabil

// === ASSET ===
const birdImg = new Image();
birdImg.src = "assets/img/bird.png";
const bgImg = new Image();
bgImg.src = "assets/img/bg-city.png";

// === VARIABEL GAME ===
let bird = { x: 80, y: HEIGHT / 2, w: 34, h: 26, vel: 0 };
let pipes = [];
let score = 0;
let gameOver = false;
let btnRect = null;

// === EVENT HANDLER ===
canvas.addEventListener("click", (e) => onPointer(getPointerPos(e)));
canvas.addEventListener(
  "touchstart",
  (e) => {
    onPointer(getPointerPos(e));
    e.preventDefault();
  },
  { passive: false }
);

function getPointerPos(evt) {
  const e = evt.touches ? evt.touches[0] : evt;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function onPointer(pos) {
  if (gameOver && btnRect) {
    if (
      pos.x >= btnRect.x &&
      pos.x <= btnRect.x + btnRect.w &&
      pos.y >= btnRect.y &&
      pos.y <= btnRect.y + btnRect.h
    ) {
      restartGame();
      return;
    }
  }
  if (!gameOver) flap();
}

function flap() {
  bird.vel = JUMP_VELOCITY;
}

// === RESET GAME ===
function restartGame() {
  bird = { x: 80, y: HEIGHT / 2, w: 34, h: 26, vel: 0 };
  pipes = [];
  score = 0;
  gameOver = false;
  btnRect = null;
  loop();
}

// === PIPE GENERATOR ===
function spawnPipe() {
  const top = Math.random() * (HEIGHT - GAP_HEIGHT - 200) + 50;
  pipes.push({
    x: WIDTH,
    topHeight: top,
    bottomY: top + GAP_HEIGHT,
    counted: false,
  });
}

// === LOGIKA GAME ===
let lastSpawn = 0;
function update(dt) {
  bird.vel += GRAVITY;
  bird.y += bird.vel;

  // cek tabrakan tanah / langit
  if (bird.y + bird.h > HEIGHT || bird.y < 0) {
    gameOver = true;
  }

  // spawn pipe
  if (performance.now() - lastSpawn > PIPE_SPACING / PIPE_SPEED * 16) {
    spawnPipe();
    lastSpawn = performance.now();
  }

  // update pipe
  for (let i = pipes.length - 1; i >= 0; i--) {
    const p = pipes[i];
    p.x -= PIPE_SPEED;

    // tabrakan
    if (
      bird.x + bird.w > p.x &&
      bird.x < p.x + PIPE_WIDTH &&
      (bird.y < p.topHeight || bird.y + bird.h > p.bottomY)
    ) {
      gameOver = true;
    }

    // skor
    if (!p.counted && p.x + PIPE_WIDTH < bird.x) {
      score++;
      p.counted = true;
    }

    if (p.x + PIPE_WIDTH < 0) pipes.splice(i, 1);
  }
}

// === RENDER ===
function draw() {
  // latar
  ctx.drawImage(bgImg, 0, 0, WIDTH, HEIGHT);

  // burung
  ctx.drawImage(birdImg, bird.x, bird.y, bird.w, bird.h);

  // pipa
  ctx.fillStyle = "#6aff6a";
  pipes.forEach((p) => {
    ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topHeight);
    ctx.fillRect(p.x, p.bottomY, PIPE_WIDTH, HEIGHT - p.bottomY);
  });

  // skor
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 16, 32);

  // credit di bawah
  ctx.font = "13px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(200,200,200,0.8)";
  ctx.textAlign = "left";
  ctx.fillText("Azbry-MD • FebryWesker", 12, HEIGHT - 12);

  // tombol portofolio kanan bawah
  const linkW = 120,
    linkH = 28;
  const lx = WIDTH - linkW - 12,
    ly = HEIGHT - linkH - 12;
  ctx.fillStyle = "rgba(184,255,154,0.9)";
  ctx.fillRect(lx, ly, linkW, linkH);
  ctx.fillStyle = "#0b0d10";
  ctx.font = "bold 13px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Portofolio", lx + linkW / 2, ly + linkH / 2);

  // deteksi klik link
  linkRect = { x: lx, y: ly, w: linkW, h: linkH };

  if (gameOver) renderGameOver(ctx);
}

// === RENDER GAME OVER ===
function renderGameOver(ctx) {
  ctx.save();

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("GAME OVER", WIDTH / 2, HEIGHT * 0.38);

  ctx.fillStyle = "#cfd6dd";
  ctx.font = "600 16px Inter, system-ui, sans-serif";
  ctx.fillText(
    `Ayo coba lagi! Capai ${REWARD_SCORE} skor dan dapatkan x1 Nasi Uduk Mama Alpi 🍚`,
    WIDTH / 2,
    HEIGHT * 0.46
  );

  const cx = WIDTH / 2;
  const cy = HEIGHT * 0.62;
  const BTN_W = 220;
  const BTN_H = 56;
  const radius = 12;
  btnRect = { x: cx - BTN_W / 2, y: cy - BTN_H / 2, w: BTN_W, h: BTN_H };

  ctx.beginPath();
  ctx.moveTo(btnRect.x + radius, btnRect.y);
  ctx.arcTo(btnRect.x + BTN_W, btnRect.y, btnRect.x + BTN_W, btnRect.y + BTN_H, radius);
  ctx.arcTo(btnRect.x + BTN_W, btnRect.y + BTN_H, btnRect.x, btnRect.y + BTN_H, radius);
  ctx.arcTo(btnRect.x, btnRect.y + BTN_H, btnRect.x, btnRect.y, radius);
  ctx.arcTo(btnRect.x, btnRect.y, btnRect.x + BTN_W, btnRect.y, radius);
  ctx.closePath();

  ctx.fillStyle = "#b8ff9a";
  ctx.strokeStyle = "rgba(0,0,0,.18)";
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#0b0d10";
  ctx.font = "bold 18px Inter, system-ui, sans-serif";
  ctx.fillText("Main Lagi", cx, cy);

  ctx.restore();
}

// === LOOP ===
let last = 0;
function loop(ts) {
  const dt = ts - last;
  last = ts;
  if (!gameOver) update(dt);
  draw();
  requestAnimationFrame(loop);
}

// === KLIK PORTOFOLIO ===
canvas.addEventListener("click", (e) => {
  const pos = getPointerPos(e);
  if (
    linkRect &&
    pos.x >= linkRect.x &&
    pos.x <= linkRect.x + linkRect.w &&
    pos.y >= linkRect.y &&
    pos.y <= linkRect.y + linkRect.h
  ) {
    window.open("https://azbry-portofolio.vercel.app/", "_blank");
  }
});

// === MULAI ===
spawnPipe();
loop();
