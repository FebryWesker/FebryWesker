// ================================
// Azbry-MD MiniGame — Tap Runner
// by FebryWesker
// ================================

// canvas setup
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// images
const birdImg = new Image();
birdImg.src = './assets/bird.png';

const bgImg = new Image();
bgImg.src = './assets/bg.jpg';

// game variables
let bird = { x: 100, y: canvas.height / 2, width: 48, height: 48, velocity: 0 };
let gravity = 0.25; // bisa diubah buat tingkat kesulitan
let jump = -6;
let obstacles = [];
let gap = 180;
let score = 0;
let gameOver = false;
let rewardShown = false;

// event listener (klik/tap buat loncat)
window.addEventListener('pointerdown', () => {
  if (gameOver) return;
  bird.velocity = jump;
});

// restart manual
document.getElementById('restart').addEventListener('click', () => {
  resetGame();
});

function resetGame() {
  bird = { x: 100, y: canvas.height / 2, width: 48, height: 48, velocity: 0 };
  obstacles = [];
  score = 0;
  gameOver = false;
  rewardShown = false;
  document.getElementById('gameover').style.display = 'none';
}

// obstacle generator
function createObstacle() {
  const top = Math.random() * (canvas.height / 2);
  const bottom = top + gap;
  obstacles.push({ x: canvas.width, top: top, bottom: bottom, width: 60 });
}

setInterval(createObstacle, 1800);

// main game loop
function update() {
  if (gameOver) return;

  bird.velocity += gravity;
  bird.y += bird.velocity;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    o.x -= 4;

    // obstacles
    ctx.fillStyle = '#1eff86';
    ctx.fillRect(o.x, 0, o.width, o.top);
    ctx.fillRect(o.x, o.bottom, o.width, canvas.height - o.bottom);
    ctx.strokeStyle = '#b8ff9a';
    ctx.lineWidth = 3;
    ctx.strokeRect(o.x, 0, o.width, o.top);
    ctx.strokeRect(o.x, o.bottom, o.width, canvas.height - o.bottom);

    // detect collision
    if (
      bird.x < o.x + o.width &&
      bird.x + bird.width > o.x &&
      (bird.y < o.top || bird.y + bird.height > o.bottom)
    ) {
      endGame();
    }

    // score logic
    if (!o.passed && o.x + o.width < bird.x) {
      o.passed = true;
      score++;

      // reward check
      if (score === 50 && !rewardShown) {
        rewardShown = true;
        showMessage("🎉 Luar biasa! Kamu mencapai 50 poin!\n🎁 Hadiah: x1 Nasi Uduk Mama Alpi 🍚");
      }
    }
  }

  // bird falls off screen
  if (bird.y + bird.height > canvas.height || bird.y < 0) {
    endGame();
  }

  // draw score
  ctx.fillStyle = '#b8ff9a';
  ctx.font = 'bold 32px Inter, sans-serif';
  ctx.fillText(`Score: ${score}`, 20, 50);

  requestAnimationFrame(update);
}

function endGame() {
  gameOver = true;
  document.getElementById('gameover').style.display = 'block';
}

function showMessage(text) {
  const msg = document.createElement('div');
  msg.textContent = text;
  msg.style.position = 'absolute';
  msg.style.top = '50%';
  msg.style.left = '50%';
  msg.style.transform = 'translate(-50%, -50%) scale(0.9)';
  msg.style.background = 'rgba(0,0,0,0.7)';
  msg.style.color = '#b8ff9a';
  msg.style.padding = '20px 30px';
  msg.style.borderRadius = '12px';
  msg.style.fontWeight = '700';
  msg.style.fontSize = '18px';
  msg.style.textAlign = 'center';
  msg.style.boxShadow = '0 0 20px rgba(184,255,154,0.5)';
  msg.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
  msg.style.opacity = '0';
  msg.style.whiteSpace = 'pre-line';
  document.body.appendChild(msg);
  requestAnimationFrame(() => {
    msg.style.opacity = '1';
    msg.style.transform = 'translate(-50%, -50%) scale(1)';
  });
  setTimeout(() => {
    msg.style.opacity = '0';
    msg.style.transform = 'translate(-50%, -50%) scale(0.9)';
    setTimeout(() => msg.remove(), 300);
  }, 4000);
}

// start
update();
