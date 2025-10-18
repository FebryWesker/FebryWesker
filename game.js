// game.js — Azbry Tap Runner (ready start + manual restart)

// ===== Aset =====
const ASSETS = {
  bird: 'assets/img/bird.png',
  bg:   'assets/img/bg-city.png'
};

// ===== Canvas =====
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// ===== Tema =====
const GREEN = '#b8ff9a';
const GREEN_DARK = '#8ee887';
const OBST_COLOR = '#1a1f25';
const OBST_STROKE = '#6df37a';
const MUTED = '#98a2b3';

// ===== State =====
let state = 'ready';   // ready | playing | gameover
let score = 0;
let highScore = parseInt(localStorage.getItem('azbry_highscore') || '0', 10);

// ===== Player =====
const player = { x: 70, y: H/2, r: 18, vy: 0, gravity: 0.45, jump: -7.6, img: null };

// ===== Background =====
const bg = { img: null, x1: 0, x2: W, speed: 1.2 };

// ===== Obstacles =====
const obstacles = [];
const OBST_GAP = 150;
const OBST_WIDTH = 50;
const OBST_MIN = 60;
const OBST_SPEED = 3.2;
const SPAWN_EVERY = 1200;
let lastSpawn = 0;

// ===== UI =====
function drawText(txt, x, y, size = 28, align = 'center', color = '#e6e8ec') {
  ctx.font = `700 ${size}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(txt, x, y);
}
function roundRect(x, y, w, h, r) {
  const rr = Math.min(r, h/2, w/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y,   x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x,   y+h, rr);
  ctx.arcTo(x,   y+h, x,   y,   rr);
  ctx.arcTo(x,   y,   x+w, y,   rr);
  ctx.closePath();
}

// ===== Restart Button =====
const restartBtn = { w: 200, h: 44, get x(){return (W-this.w)/2}, get y(){return Math.floor(H/2)+70} };
function drawRestartButton(){
  const {x,y,w,h} = restartBtn;
  ctx.shadowColor = 'rgba(184,255,154,.25)'; ctx.shadowBlur = 18;
  roundRect(x,y,w,h,12);
  const g = ctx.createLinearGradient(0,y,0,y+h); g.addColorStop(0,GREEN); g.addColorStop(1,GREEN_DARK);
  ctx.fillStyle = g; ctx.fill(); ctx.shadowBlur = 0;
  drawText('Main Lagi', x+w/2, y+h/2+8, 18, 'center', '#0b0d10');
}
function isInsideRestart(px,py){ const {x,y,w,h}=restartBtn; return px>=x&&px<=x+w&&py>=y&&py<=y+h; }

// ===== Load Assets =====
function loadImage(src){ return new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src; }); }
(async function(){
  bg.img = await loadImage(ASSETS.bg);
  player.img = await loadImage(ASSETS.bird);
  // tetap di 'ready' — menunggu tap pertama
})();

// ===== Control =====
function safeReset() {
  score = 0;
  player.y = H/2; player.vy = 0;
  obstacles.length = 0;
  bg.x1 = 0; bg.x2 = W;
  lastSpawn = performance.now() + 600; // jeda 0.6s sebelum pipa pertama
}
function startPlay() { safeReset(); state = 'playing'; }
function gameOver() { state = 'gameover'; if (score > highScore){ highScore = score; localStorage.setItem('azbry_highscore', highScore); } }

function pointerXY(e){
  const r = canvas.getBoundingClientRect();
  if (e.touches && e.touches[0]) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
  return { x: (e.clientX ?? 0) - r.left, y: (e.clientY ?? 0) - r.top };
}

function onTap(e){
  e?.preventDefault?.();
  if (state === 'ready') { startPlay(); return; }
  if (state === 'gameover') {
    const {x,y} = pointerXY(e||{});
    if (isInsideRestart(x,y)) startPlay();
    return;
  }
  // playing → loncat
  player.vy = player.jump;
}

canvas.addEventListener('pointerdown', onTap, {passive:false});
canvas.addEventListener('touchstart', onTap, {passive:false});
canvas.addEventListener('mousedown', onTap);
window.addEventListener('keydown', (e)=>{
  if (state === 'ready' && (e.code==='Space'||e.key===' '||e.code==='Enter')) { startPlay(); return; }
  if (state === 'gameover' && (e.code==='Enter' || e.code==='Space')) { startPlay(); return; }
  if (state === 'playing' && (e.code==='Space' || e.key===' ')) player.vy = player.jump;
});

// ===== Update =====
function update(ts){
  if (state !== 'playing') return;

  // fisika
  player.vy += player.gravity;
  player.y  += player.vy;

  // clamp aman supaya tidak langsung keluar layar karena frame drop
  if (player.y < player.r) { player.y = player.r; player.vy = 0; }
  if (player.y > H - player.r) { player.y = H - player.r; gameOver(); return; }

  // bg parallax
  bg.x1 -= bg.speed; bg.x2 -= bg.speed;
  if (bg.x1 + W < 0) bg.x1 = bg.x2 + W;
  if (bg.x2 + W < 0) bg.x2 = bg.x1 + W;

  // spawn rintangan setelah jeda
  if (ts - lastSpawn > SPAWN_EVERY) {
    lastSpawn = ts;
    const gapY = Math.random() * (H - OBST_GAP - OBST_MIN*2) + OBST_MIN;
    obstacles.push({ x: W+20, y: 0, h: gapY, passed: false });
    obstacles.push({ x: W+20, y: gapY + OBST_GAP, h: H - gapY - OBST_GAP, passed: false });
  }

  // gerak + buang
  for (const o of obstacles) o.x -= OBST_SPEED;
  while (obstacles.length && obstacles[0].x + OBST_WIDTH < 0) obstacles.shift();

  // tabrakan
  for (const o of obstacles) {
    if (player.x + player.r > o.x && player.x - player.r < o.x + OBST_WIDTH &&
        player.y + player.r > o.y && player.y - player.r < o.y + o.h) { gameOver(); return; }
  }

  // skor (sekali per pasangan pipa — pakai pipa atas y==0)
  for (const o of obstacles) {
    if (!o.passed && o.y === 0 && player.x > o.x + OBST_WIDTH) {
      o.passed = true; score++;
    }
  }
}

// ===== Draw =====
function draw(){
  // bg
  if (bg.img) {
    ctx.drawImage(bg.img, bg.x1, 0, W, H);
    ctx.drawImage(bg.img, bg.x2, 0, W, H);
  } else {
    ctx.fillStyle = '#0b0d10'; ctx.fillRect(0,0,W,H);
  }

  // obstacles
  ctx.fillStyle = OBST_COLOR; ctx.strokeStyle = OBST_STROKE;
  for (const o of obstacles) { ctx.beginPath(); ctx.rect(o.x,o.y,OBST_WIDTH,o.h); ctx.fill(); ctx.stroke(); }

  // player
  if (player.img) ctx.drawImage(player.img, player.x-player.r, player.y-player.r, player.r*2, player.r*2);
  else { ctx.fillStyle = GREEN; ctx.beginPath(); ctx.arc(player.x,player.y,player.r,0,Math.PI*2); ctx.fill(); }

  // HUD/top info
  drawText(`Score: ${score}`, W/2, 40, 22);
  drawText(`Highscore: ${highScore}`, W/2, 70, 16, 'center', MUTED);

  if (state === 'ready') {
    drawText('Tap untuk mulai', W/2, H/2 - 6, 22, 'center', GREEN);
    drawText('Sentuh layar untuk terbang dan hindari rintangan!', W/2, H/2 + 18, 14, 'center', MUTED);
  }

  if (state === 'gameover') {
    drawText('GAME OVER', W/2, H/2 - 30, 30, 'center', GREEN);
    drawText('Ayo coba lagi!', W/2, H/2 + 5, 18);
    drawText('Kalau dapat 100 poin, kamu berhak klaim', W/2, H/2 + 28, 14, 'center', MUTED);
    drawText('1 Nasi Uduk Mama Alpi 🍛', W/2, H/2 + 48, 16, 'center', '#e6e8ec');
    drawRestartButton();
  }
}

// ===== Loop =====
let last = 0;
function loop(ts){ const dt = ts - last; last = ts; update(ts); draw(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
