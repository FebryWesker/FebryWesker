/* Azbry-MD MiniGame — FebryWesker
 * - Mobile tap friendly
 * - 9:16 virtual canvas (360x640) dengan autoscale
 * - BG parallax, pipa atas-bawah, skor 1 per pipa
 * - Game Over + tombol Main Lagi
 * - Footer brand + tombol ke portofolio (pojok kanan)
 */

(() => {
  // ========= Konstanta gameplay (boleh tweak angka ini) =========
  const VIRTUAL_W = 360, VIRTUAL_H = 640;   // rasio 9:16
  let GRAVITY = 0.22;       // tarik ke bawah (turunin kalau terlalu jatuh)
  let JUMP_VELOCITY = -5.2; // tinggi lompatan (lebih kecil = lompatan pendek)
  let PIPE_SPEED = 2.4;     // kecepatan gerak pipa (turunin kalau terlalu cepat)
  let GAP_HEIGHT = 190;     // jarak antar pipa (naikin kalau terlalu sulit)
  const PIPE_WIDTH = 56;
  let PIPE_SPACING = 330;   // jarak antar spawn pipa (naikin kalau terlalu rapat)

  const REWARD_SCORE = 5;   // ambang hadiah (sementara 5, nanti silakan ubah)

  // ========= Canvas & scaling =========
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let scale = 1, offsetX = 0, offsetY = 0;

  function resize() {
    const ww = window.innerWidth, wh = window.innerHeight;
    const ar = VIRTUAL_W / VIRTUAL_H;
    const winAr = ww / wh;
    if (winAr > ar) {
      // terlalu lebar -> tinggi penuh, sisinya hitam
      scale = wh / VIRTUAL_H;
      canvas.width = Math.floor(VIRTUAL_W * scale);
      canvas.height = Math.floor(VIRTUAL_H * scale);
      offsetX = Math.floor((ww - canvas.width) / 2);
      offsetY = 0;
    } else {
      // terlalu tinggi -> lebar penuh, atas-bawah hitam
      scale = ww / VIRTUAL_W;
      canvas.width = Math.floor(VIRTUAL_W * scale);
      canvas.height = Math.floor(VIRTUAL_H * scale);
      offsetX = 0;
      offsetY = Math.floor((wh - canvas.height) / 2);
    }
    canvas.style.position = 'fixed';
    canvas.style.left = offsetX + 'px';
    canvas.style.top = offsetY + 'px';
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  // ========= Assets =========
  const birdImg = new Image();
  birdImg.src = 'assets/bird.jpg';

  const bgImg = new Image();
  bgImg.src = 'assets/bg.jpg';

  // ========= State =========
  let state = 'ready'; // 'ready' | 'playing' | 'over'
  let bird, pipes, score, best, bgX, lastSpawnX, rewardShown;
  let lastTime = 0;

  function resetGame() {
    bird = {
      x: 80, y: VIRTUAL_H / 2, vy: 0,
      w: 38, h: 38
    };
    pipes = [];
    score = 0;
    best = Number(localStorage.getItem('azbry_best') || '0');
    bgX = 0;
    lastSpawnX = 0;
    rewardShown = false;
    state = 'ready';
  }
  resetGame();

  function spawnPipePair(xPos) {
    const marginTop = 40, marginBottom = 80;
    const maxTop = VIRTUAL_H - marginBottom - GAP_HEIGHT - marginTop;
    const topHeight = Math.floor(marginTop + Math.random() * maxTop);
    const bottomY = topHeight + GAP_HEIGHT;

    pipes.push({
      x: xPos,
      top: { y: 0, h: topHeight },
      bottom: { y: bottomY, h: VIRTUAL_H - bottomY },
      w: PIPE_WIDTH,
      passed: false
    });
  }

  // ========= Input =========
  function worldTap() {
    if (state === 'ready') {
      state = 'playing';
      bird.vy = JUMP_VELOCITY;
      return;
    }
    if (state === 'playing') {
      bird.vy = JUMP_VELOCITY;
      return;
    }
    if (state === 'over') {
      // cek kalau klik tombol Main Lagi
      const { mx, my } = lastPointerPage;
      if (isInsideRestart(mx, my)) {
        resetGame();
        state = 'ready';
      }
    }
  }

  // Pointer normalization (page coords)
  let lastPointerPage = { mx: 0, my: 0 };
  function pointerPos(e) {
    let px, py;
    if (e.touches && e.touches[0]) {
      px = e.touches[0].clientX;
      py = e.touches[0].clientY;
    } else {
      px = e.clientX;
      py = e.clientY;
    }
    lastPointerPage.mx = px;
    lastPointerPage.my = py;
    return { px, py };
  }
  function toVirtual(px, py) {
    // translate dari page ke koordinat virtual
    const cx = (px - offsetX) / scale;
    const cy = (py - offsetY) / scale;
    return { x: cx, y: cy };
  }

  // Listener
  const tapHandler = (e) => {
    e.preventDefault();
    pointerPos(e);
    worldTap();
  };
  canvas.addEventListener('touchstart', tapHandler, { passive: false });
  canvas.addEventListener('mousedown', tapHandler);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      worldTap();
    }
  });

  // ========= Update / Physics =========
  function update(dt) {
    if (state === 'playing') {
      // BG scroll
      bgX = (bgX - PIPE_SPEED * 0.5) % VIRTUAL_W;

      // Bird physics
      bird.vy += GRAVITY;
      bird.y += bird.vy;

      // Spawn pipes
      if (pipes.length === 0) {
        spawnPipePair(VIRTUAL_W + 120);
        lastSpawnX = VIRTUAL_W + 120;
      } else {
        const lastX = pipes[pipes.length - 1].x;
        if (lastX < VIRTUAL_W - PIPE_SPACING) {
          spawnPipePair(VIRTUAL_W + 40);
        }
      }

      // Move pipes & score
      for (const p of pipes) {
        p.x -= PIPE_SPEED;
        // Skor ketika burung melewati tengah pipa
        const passX = p.x + p.w;
        if (!p.passed && passX < bird.x) {
          p.passed = true;
          score += 1;
          if (score > best) {
            best = score;
            localStorage.setItem('azbry_best', String(best));
          }
        }
      }
      // Remove off-screen
      pipes = pipes.filter(p => p.x + p.w > -10);

      // Collision
      if (collide()) {
        state = 'over';
      }

      // Floor/ceiling
      if (bird.y + bird.h > VIRTUAL_H || bird.y < -10) {
        state = 'over';
      }
    }
  }

  function collide() {
    // AABB
    for (const p of pipes) {
      const bx1 = bird.x, by1 = bird.y, bx2 = bird.x + bird.w, by2 = bird.y + bird.h;

      // top pipe rect
      const tx1 = p.x, ty1 = p.top.y, tx2 = p.x + p.w, ty2 = p.top.y + p.top.h;
      if (bx1 < tx2 && bx2 > tx1 && by1 < ty2 && by2 > ty1) return true;

      // bottom pipe rect
      const bx_1 = p.x, by_1 = p.bottom.y, bx_2 = p.x + p.w, by_2 = p.bottom.y + p.bottom.h;
      if (bx1 < bx_2 && bx2 > bx_1 && by1 < by_2 && by2 > by_1) return true;
    }
    return false;
  }

  // ========= Draw =========
  function draw() {
    // scaling: kita gambar ke buffer virtual lalu di-scale oleh canvas CSS;
    // tapi di sini kita gambar langsung skala virtual dengan transform
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, 0, 0); // gambar dalam world coords

    // Clear
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);

    // BG parallax (tile horizontal)
    if (bgImg.complete && bgImg.naturalWidth) {
      const bgW = VIRTUAL_W, bgH = VIRTUAL_H;
      // gambar dua kali untuk loop
      drawBg(bgX, 0, bgW, bgH);
      drawBg(bgX + bgW, 0, bgW, bgH);
    } else {
      // fallback warna polos
      ctx.fillStyle = '#0f1318';
      ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);
    }

    // Pipes
    for (const p of pipes) {
      // tepi hijau biar jelas
      ctx.fillStyle = '#1b242d';
      ctx.fillRect(p.x, p.top.y, p.w, p.top.h);
      ctx.fillRect(p.x, p.bottom.y, p.w, p.bottom.h);
      ctx.strokeStyle = '#8ee887';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x + 1, p.top.y + 1, p.w - 2, p.top.h - 2);
      ctx.strokeRect(p.x + 1, p.bottom.y + 1, p.w - 2, p.bottom.h - 2);
    }

    // Bird
    if (birdImg.complete && birdImg.naturalWidth) {
      // sedikit rotasi mengikuti kecepatan
      const angle = Math.max(-0.35, Math.min(0.35, bird.vy * 0.03));
      ctx.save();
      ctx.translate(bird.x + bird.w / 2, bird.y + bird.h / 2);
      ctx.rotate(angle);
      ctx.drawImage(birdImg, -bird.w / 2, -bird.h / 2, bird.w, bird.h);
      ctx.restore();
    } else {
      // fallback bulat hijau
      ctx.fillStyle = '#b8ff9a';
      ctx.beginPath();
      ctx.arc(bird.x + bird.w / 2, bird.y + bird.h / 2, bird.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD skor
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 28px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(score), VIRTUAL_W / 2, 50);

    // Footer brand + tombol portfolio (selama main/ready)
    drawFooterAndPortfolio();

    if (state === 'ready') {
      ctx.fillStyle = '#e6e8ec';
      ctx.font = '700 20px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Tap untuk mulai', VIRTUAL_W / 2, VIRTUAL_H / 2 - 40);
    }

    if (state === 'over') {
      drawGameOver();
    }

    ctx.restore();
  }

  function drawBg(x, y, w, h) {
    // Gambar bg dengan cover sederhana
    // Asumsikan bg.jpg sudah 9:16-ish; kalau tidak, tetap cover
    const img = bgImg;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    if (!iw || !ih) return;
    const targetAR = w / h;
    const imgAR = iw / ih;
    let dw, dh, dx, dy;
    if (imgAR > targetAR) {
      // image lebih lebar
      dh = h; dw = dh * imgAR;
      dx = x - (dw - w) / 2; dy = y;
    } else {
      // image lebih tinggi
      dw = w; dh = dw / imgAR;
      dx = x; dy = y - (dh - h) / 2;
    }
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // Footer + tombol portfolio
  const portfolioBtn = { x: VIRTUAL_W - 116, y: 16, w: 100, h: 30 };
  function drawFooterAndPortfolio() {
    // footer text
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(0, VIRTUAL_H - 28, VIRTUAL_W, 28);
    ctx.fillStyle = '#98a2b3';
    ctx.font = '500 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Azbry-MD • FebryWesker', 12, VIRTUAL_H - 10);

    // tombol portfolio (pojok kanan atas)
    ctx.fillStyle = 'rgba(184,255,154,.15)';
    roundRect(ctx, portfolioBtn.x, portfolioBtn.y, portfolioBtn.w, portfolioBtn.h, 8, true);
    ctx.strokeStyle = 'rgba(184,255,154,.35)';
    ctx.lineWidth = 1;
    roundRect(ctx, portfolioBtn.x, portfolioBtn.y, portfolioBtn.w, portfolioBtn.h, 8, false);
    ctx.fillStyle = '#dfffe0';
    ctx.font = '700 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Portfolio', portfolioBtn.x + portfolioBtn.w / 2, portfolioBtn.y + 20);
  }

  canvas.addEventListener('click', (e) => {
    const { px, py } = pointerPos(e);
    const v = toVirtual(px, py);
    if (pointInRect(v.x, v.y, portfolioBtn)) {
      window.open('https://azbry-portofolio.vercel.app/', '_blank');
    }
  });
  canvas.addEventListener('touchend', (e) => {
    const { px, py } = pointerPos(e);
    const v = toVirtual(px, py);
    if (pointInRect(v.x, v.y, portfolioBtn)) {
      // sedikit delay agar tidak bentrok dengan tap jump
      setTimeout(() => window.open('https://azbry-portofolio.vercel.app/', '_blank'), 60);
    }
  }, { passive: true });

  function pointInRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }
  function roundRect(c, x, y, w, h, r, fill = true) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    if (fill) c.fill(); else c.stroke();
  }

  function drawGameOver() {
    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);

    // Card
    const cw = 280, ch = 180;
    const cx = (VIRTUAL_W - cw) / 2, cy = (VIRTUAL_H - ch) / 2;
    ctx.fillStyle = '#111418';
    roundRect(ctx, cx, cy, cw, ch, 14, true);
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    ctx.lineWidth = 1;
    roundRect(ctx, cx, cy, cw, ch, 14, false);

    ctx.fillStyle = '#e6e8ec';
    ctx.font = '700 20px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', cx + cw / 2, cy + 36);

    ctx.font = '600 14px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#98a2b3';
    ctx.fillText(`Skor: ${score} • Terbaik: ${best}`, cx + cw / 2, cy + 62);

    // Pesan hadiah
    ctx.font = '600 13px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#dfffe0';
    const msg = `Ayo coba lagi!\nCapai ${REWARD_SCORE} poin untuk 1× Nasi Uduk\nMama Alpi 🍚`;
    drawMultiline(ctx, msg, cx + cw / 2, cy + 92, 16);

    // Tombol restart
    const bw = 130, bh = 36;
    const bx = cx + (cw - bw) / 2, by = cy + ch - bh - 14;
    ctx.fillStyle = 'rgba(184,255,154,.16)';
    roundRect(ctx, bx, by, bw, bh, 10, true);
    ctx.strokeStyle = 'rgba(184,255,154,.35)';
    ctx.lineWidth = 1;
    roundRect(ctx, bx, by, bw, bh, 10, false);

    ctx.fillStyle = '#dfffe0';
    ctx.font = '700 14px Inter, system-ui, sans-serif';
    ctx.fillText('Main Lagi', bx + bw / 2, by + 24);

    // Simpan area tombol restart utk klik
    restartBtnRect = { x: bx, y: by, w: bw, h: bh };
  }

  // Multiline helper
  function drawMultiline(c, text, x, y, lineH) {
    const lines = text.split('\n');
    lines.forEach((ln, i) => c.fillText(ln, x, y + i * lineH));
  }

  // Restart button hitbox
  let restartBtnRect = null;
  function isInsideRestart(px, py) {
    if (!restartBtnRect) return false;
    const v = toVirtual(px, py);
    const r = restartBtnRect;
    return v.x >= r.x && v.x <= r.x + r.w && v.y >= r.y && v.y <= r.y + r.h;
  }

  // ========= Loop =========
  function loop(ts) {
    const dt = Math.min(32, ts - (lastTime || ts));
    lastTime = ts;

    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
