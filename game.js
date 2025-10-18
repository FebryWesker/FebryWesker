const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GRAVITY = 0.25;
const JUMP_VELOCITY = -5.6;
const PIPE_SPEED = 2.8;
const GAP_HEIGHT = 150;
const PIPE_WIDTH = 57;
const PIPE_SPACING = 500;

const birdImg = new Image();
birdImg.src = "assets/bird.png";

const bgImg = new Image();
bgImg.src = "assets/bg.png";

let bird = { x: 80, y: 200, width: 34, height: 24, velocity: 0 };
let pipes = [];
let score = 0;
let gameOver = false;

function resetGame() {
  bird = { x: 80, y: 200, width: 34, height: 24, velocity: 0 };
  pipes = [];
  score = 0;
  gameOver = false;
}

function spawnPipe() {
  const gapY = Math.random() * (canvas.height - GAP_HEIGHT - 200) + 100;
  pipes.push({
    x: canvas.width,
    top: gapY - GAP_HEIGHT - 200,
    bottom: gapY + GAP_HEIGHT
  });
}

function drawBackground() {
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
}

function drawBird() {
  ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
}

function drawPipes() {
  ctx.fillStyle = "#8ee887";
  pipes.forEach(pipe => {
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top + 200);
    ctx.fillRect(pipe.x, pipe.bottom, PIPE_WIDTH, canvas.height - pipe.bottom);
  });
}

function drawScore() {
  ctx.fillStyle = "#b8ff9a";
  ctx.font = "bold 24px Inter";
  ctx.fillText("Score: " + score, 10, 30);
}

function drawGameOver() {
  ctx.fillStyle = "#b8ff9a";
  ctx.font = "bold 28px Inter";
  ctx.fillText("Game Over", canvas.width / 2 - 85, canvas.height / 2 - 20);
  ctx.font = "16px Inter";
  ctx.fillText("Ayo coba lagi!", canvas.width / 2 - 55, canvas.height / 2 + 10);
  ctx.fillText("Dapatkan 50 poin untuk hadiah!", canvas.width / 2 - 110, canvas.height / 2 + 35);
  ctx.fillText("🎁 Nasi Uduk Mama Alpi", canvas.width / 2 - 95, canvas.height / 2 + 60);

  const btnW = 120, btnH = 40;
  const btnX = canvas.width / 2 - btnW / 2;
  const btnY = canvas.height / 2 + 90;

  ctx.fillStyle = "rgba(184,255,154,0.15)";
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = "#b8ff9a";
  ctx.strokeRect(btnX, btnY, btnW, btnH);
  ctx.fillStyle = "#b8ff9a";
  ctx.font = "bold 16px Inter";
  ctx.fillText("Main Lagi", btnX + 20, btnY + 25);
}

function update() {
  if (gameOver) return;

  bird.velocity += GRAVITY;
  bird.y += bird.velocity;

  if (bird.y + bird.height > canvas.height) gameOver = true;
  if (bird.y < 0) bird.y = 0;

  pipes.forEach(pipe => {
    pipe.x -= PIPE_SPEED;

    if (bird.x < pipe.x + PIPE_WIDTH && bird.x + bird.width > pipe.x &&
        (bird.y < pipe.top + 200 || bird.y + bird.height > pipe.bottom)) {
      gameOver = true;
    }

    if (pipe.x + PIPE_WIDTH < 0) {
      pipes.shift();
      score++;
    }
  });

  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - PIPE_SPACING) {
    spawnPipe();
  }
}

function draw() {
  drawBackground();
  drawPipes();
  drawBird();
  drawScore();
  if (gameOver) drawGameOver();
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  update();
  draw();
  requestAnimationFrame(loop);
}

canvas.addEventListener("click", handleInput);
canvas.addEventListener("touchstart", handleInput);

function handleInput(e) {
  if (gameOver) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    const btnW = 120, btnH = 40;
    const btnX = canvas.width / 2 - btnW / 2;
    const btnY = canvas.height / 2 + 90;
    if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
      resetGame();
      return;
    }
  } else {
    bird.velocity = JUMP_VELOCITY;
  }
}

resetGame();
loop();
