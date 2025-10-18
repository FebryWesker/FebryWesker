// Azbry-MD MiniGame — by FebryWesker
// Tema: City Night | Reward: Nasi Uduk Mama Alpi 🍚

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Responsive 9:16 layout
canvas.width = 360;
canvas.height = 640;

// ===== SETTINGS =====
const GRAVITY = 0.30;
const JUMP_VELOCITY = -8.2;
const PIPE_SPEED = 2.5;
const GAP_HEIGHT = 160;
const PIPE_WIDTH = 55;
const PIPE_SPACING = 600;

// ===== IMAGES =====
const birdImg = new Image();
birdImg.src = "assets/img/bird.png";

const bgImg = new Image();
bgImg.src = "assets/img/bg-city.png";

// ===== VARIABLES =====
let birdY = canvas.height / 2;
let birdVel = 0;
let pipes = [];
let score = 0;
let gameOver = false;

// ===== EVENT HANDLERS =====
function jump() {
  if (!gameOver) {
    birdVel = JUMP_VELOCITY;
  } else {
    // klik di area tombol "Main Lagi"
    const rect = canvas.getBoundingClientRect();
    canvas.addEventListener("click", restart, { once: true });
  }
}

document.addEventListener("mousedown", jump);
document.addEventListener("touchstart", jump);

// ===== PIPE LOGIC =====
function createPipe(xOffset = 0) {
  const topHeight = Math.random() * (canvas.height / 2);
  const bottomY = topHeight + GAP_HEIGHT;
  pipes.push({ x: canvas.width + xOffset, topHeight, bottomY });
}

for (let i = 0; i < 3; i++) createPipe(i * PIPE_SPACING);

// ===== DRAW FUNCTION =====
function draw() {
  // background
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  // pipes
  ctx.fillStyle = "#2e3b2f";
  pipes.forEach(p => {
    ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topHeight);
    ctx.fillRect(p.x, p.bottomY, PIPE_WIDTH, canvas.height - p.bottomY);
    ctx.strokeStyle = "#8ee887";
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.topHeight);
    ctx.strokeRect(p.x, p.bottomY, PIPE_WIDTH, canvas.height - p.bottomY);
  });

  // bird
  ctx.drawImage(birdImg, 50, birdY, 40, 40);

  // score
  ctx.fillStyle = "#b8ff9a";
  ctx.font = "bold 28px Inter";
  ctx.fillText(score, canvas.width / 2, 80);

  // credit
  ctx.font = "14px Inter";
  ctx.fillStyle = "#98a2b3";
  ctx.textAlign = "center";
  ctx.fillText("Azbry-MD • FebryWesker", canvas.width / 2, canvas.height - 12);
}

// ===== UPDATE FUNCTION =====
function update() {
  if (!gameOver) {
    birdVel += GRAVITY;
    birdY += birdVel;

    pipes.forEach(p => {
      p.x -= PIPE_SPEED;

      // reset pipe
      if (p.x + PIPE_WIDTH < 0) {
        pipes.shift();
        createPipe();
        score++;
      }

      // collision
      if (
        50 + 40 > p.x &&
        50 < p.x + PIPE_WIDTH &&
        (birdY < p.topHeight || birdY + 40 > p.bottomY)
      ) {
        gameOver = true;
      }
    });

    if (birdY + 40 > canvas.height || birdY < 0) {
      gameOver = true;
    }
  }
}

// ===== GAME OVER SCREEN =====
function renderGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 46px Inter";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 60);

  ctx.font = "18px Inter";
  ctx.fillStyle = "#b8ff9a";
  ctx.fillText(
    "Selesaikan 50 poin dan dapatkan reward x1 Nasi Uduk Mama Alpi",
    canvas.width / 2,
    canvas.height / 2 - 20
  );

  // tombol main lagi
  const btnW = 160, btnH = 46;
  const btnX = canvas.width / 2 - btnW / 2;
  const btnY = canvas.height / 2 + 30;

  ctx.fillStyle = "#8ee887";
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.fillStyle = "#0b0d10";
  ctx.font = "bold 22px Inter";
  ctx.fillText("Main Lagi", canvas.width / 2, btnY + 30);

  canvas.addEventListener("click", function clickHandler(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
      canvas.removeEventListener("click", clickHandler);
      restart();
    }
  });
}

// ===== RESTART =====
function restart() {
  birdY = canvas.height / 2;
  birdVel = 0;
  pipes = [];
  score = 0;
  gameOver = false;
  for (let i = 0; i < 3; i++) createPipe(i * PIPE_SPACING);
}

// ===== LOOP =====
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  draw();
  update();
  if (gameOver) renderGameOver();
  requestAnimationFrame(loop);
}

loop();
