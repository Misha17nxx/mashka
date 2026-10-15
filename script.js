/* ============================================================
   КАНВАС САЛЮТА
   ============================================================ */
const cvs = document.getElementById("canvas");
const ctx = cvs.getContext("2d", { alpha: false });
let W, H;
function resize() {
  W = cvs.width = window.innerWidth;
  H = cvs.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

const PALETTES = [
  ["#ff4d6d", "#ff8fab", "#ffd6e2"],
  ["#ffd166", "#ff9a3c", "#fff4b8"],
  ["#4cc9f0", "#4361ee", "#b8e0ff"],
  ["#c77dff", "#7b2cbf", "#e0aaff"],
  ["#06ffa5", "#00d9a3", "#c7ffe8"],
  ["#ffffff", "#ffd166", "#ff4d6d"],
];

const sparks = [];
const MAX_SPARKS = 700;

function explode(x, y, palette, count = 55) {
  flashScreen();
  for (let i = 0; i < count; i++) {
    if (sparks.length >= MAX_SPARKS) break;
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    sparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.014 + Math.random() * 0.012,
      color: palette[Math.floor(Math.random() * palette.length)],
      size: 1.8 + Math.random() * 1.8,
    });
  }
}

const rockets = [];
function launchRocket(x) {
  rockets.push({
    x: x !== undefined ? x : W / 2 + (Math.random() - 0.5) * W * 0.5,
    y: H,
    vy: -(9 + Math.random() * 3),
    vx: (Math.random() - 0.5) * 1,
    targetY: H * (0.15 + Math.random() * 0.35),
    palette: PALETTES[Math.floor(Math.random() * PALETTES.length)],
    dead: false,
  });
}
window.launchRocket = launchRocket;

const bgParts = [];
const BG_MAX = 40;
function spawnBg() {
  if (bgParts.length >= BG_MAX) return;
  bgParts.push({
    x: Math.random() * W,
    y: H + 20,
    vy: -(0.4 + Math.random() * 1.2),
    vx: (Math.random() - 0.5) * 0.4,
    size: 5 + Math.random() * 10,
    alpha: 0.25 + Math.random() * 0.4,
    type: Math.random() < 0.5 ? "heart" : "star",
    color: PALETTES[Math.floor(Math.random() * PALETTES.length)][0],
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.04,
  });
}
setInterval(spawnBg, 400);

let lastTime = 0;
const FRAME = 1000 / 60;

function loop(now) {
  requestAnimationFrame(loop);
  if (now - lastTime < FRAME - 1) return;
  lastTime = now;

  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "lighter";

  for (let i = bgParts.length - 1; i >= 0; i--) {
    const p = bgParts[i];
    p.y += p.vy;
    p.x += p.vx;
    p.rot += p.rotSpeed;
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    if (p.type === "heart") {
      const s = p.size / 20;
      ctx.scale(s, s);
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.bezierCurveTo(-10, -4, -20, 4, 0, 18);
      ctx.bezierCurveTo(20, 4, 10, -4, 0, 6);
      ctx.fill();
    } else {
      const r = p.size,
        r2 = p.size * 0.45;
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = (k * 2 * Math.PI) / 5 - Math.PI / 2;
        const ax = Math.cos(a) * r,
          ay = Math.sin(a) * r;
        if (k === 0) ctx.moveTo(ax, ay);
        else ctx.lineTo(ax, ay);
        const a2 = a + Math.PI / 5;
        ctx.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    if (p.y < -30) bgParts.splice(i, 1);
  }

  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    r.x += r.vx;
    r.y += r.vy;
    r.vy += 0.14;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd166";
    for (let t = 1; t <= 3; t++) {
      ctx.globalAlpha = 0.7 / t;
      ctx.beginPath();
      ctx.arc(r.x - r.vx * t * 1.5, r.y - r.vy * t * 1.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (r.y <= r.targetY || r.vy >= 0) {
      explode(r.x, r.y, r.palette, 55);
      rockets.splice(i, 1);
    }
  }

  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vx *= 0.975;
    s.vy *= 0.975;
    s.vy += 0.055;
    s.life -= s.decay;
    if (s.life <= 0) {
      sparks.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = s.life;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}
requestAnimationFrame(loop);

const flash = document.getElementById("flash");
let flashTimeout;
function flashScreen() {
  flash.classList.remove("on");
  void flash.offsetWidth;
  flash.classList.add("on");
  clearTimeout(flashTimeout);
  flashTimeout = setTimeout(() => flash.classList.remove("on"), 350);
}

function bigShow(duration = 5000) {
  const start = performance.now();
  function tick(now) {
    if (now - start < duration) {
      launchRocket();
      setTimeout(() => tick(performance.now()), 180 + Math.random() * 150);
    }
  }
  tick(performance.now());
}

function grandFinale() {
  for (let i = 0; i < 12; i++) setTimeout(() => launchRocket(), i * 90);
  setTimeout(() => {
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const x = Math.random() * W;
        const y = Math.random() * H * 0.5 + H * 0.15;
        explode(
          x,
          y,
          PALETTES[Math.floor(Math.random() * PALETTES.length)],
          45
        );
      }, i * 70);
    }
  }, 1200);
}

/* ============================================================
      СЦЕНЫ
      ============================================================ */
const scenes = document.querySelectorAll(".scene");
let current = 0;

function goTo(index) {
  if (index < 0 || index >= scenes.length) return;
  scenes[current].classList.remove("active");
  current = index;
  scenes[current].classList.add("active");

  if (index === 1) bigShow(4500);
  if (index === 2) launchRocket();
  if (index === 3) bigShow(2500);
  if (index === 4) launchRocket();
  if (index === 5) launchRocket();
  if (index === 6) bigShow(1500);
  if (index === 7) launchRocket();
  if (index === 8) grandFinale();
}

document.querySelectorAll("[data-next]").forEach((b) => {
  b.addEventListener("click", () => goTo(current + 1));
});

document.getElementById("startBtn").addEventListener("click", () => {
  bigShow(3500);
  setTimeout(() => goTo(1), 600);
});

document.getElementById("finalBtn").addEventListener("click", grandFinale);

document.addEventListener("click", (e) => {
  if (e.target.closest("button")) return;
  if (e.target.closest(".song-item")) return;
  if (e.target.closest(".mini-player")) return;
  if (e.target.closest(".game-wrap")) return;
  if (e.target.closest(".bouquet-parallax")) return;
  if (e.target.closest(".gallery")) return;
  if (e.target.closest(".universe-stage")) return;
  if (e.target.closest(".cake-stage")) return;
  if (e.target.closest(".video-reveal")) return;
  if (e.target.closest(".love-letter")) return;
  launchRocket(e.clientX);
});

setTimeout(() => bigShow(2500), 500);
setInterval(() => {
  if (Math.random() < 0.5) launchRocket();
}, 3500);

/* ============================================================
      ФОНОВАЯ МУЗЫКА (простая версия)
      ============================================================ */
(function initBgMusic() {
  const bgMusic = document.getElementById("bgMusic");
  if (!bgMusic) return;

  bgMusic.volume = 0.55;
  const START_AT = 50; // 👈 секунда старта
  let started = false;

  function tryStart() {
    if (started) return;

    try {
      if (bgMusic.readyState >= 1) {
        if (bgMusic.currentTime < 1) bgMusic.currentTime = START_AT;
      } else {
        bgMusic.addEventListener(
          "loadedmetadata",
          function once() {
            bgMusic.removeEventListener("loadedmetadata", once);
            if (bgMusic.currentTime < 1) bgMusic.currentTime = START_AT;
          },
          { once: true }
        );
      }
    } catch (e) {}

    bgMusic
      .play()
      .then(() => {
        started = true;
        document.removeEventListener("click", tryStart);
        document.removeEventListener("touchstart", tryStart);
      })
      .catch(() => {});
  }

  tryStart();
  document.addEventListener("click", tryStart);
  document.addEventListener("touchstart", tryStart, { passive: true });

  const startBtn = document.getElementById("startBtn");
  if (startBtn) startBtn.addEventListener("click", tryStart);
})();

/* ============================================================
      БУКЕТ: ПАРАЛЛАКС + ЛЕПЕСТКИ + ОТКРЫТКА
      ============================================================ */
const bouquetStage = document.querySelector(".bouquet-stage");
const bouquetParallax = document.getElementById("bouquetParallax");
const bouquetImg = document.getElementById("bouquetImg");
const petalsCanvas = document.getElementById("petalsCanvas");

if (bouquetStage && petalsCanvas) {
  const pctx = petalsCanvas.getContext("2d");
  let pw = 0,
    ph = 0;

  function resizePetals() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = bouquetStage.getBoundingClientRect();
    pw = rect.width;
    ph = rect.height;
    petalsCanvas.width = pw * dpr;
    petalsCanvas.height = ph * dpr;
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizePetals();
  window.addEventListener("resize", resizePetals);
  setTimeout(resizePetals, 300);

  let targetX = 0,
    targetY = 0,
    curX = 0,
    curY = 0;

  bouquetStage.addEventListener("mousemove", (e) => {
    const rect = bouquetStage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    targetX = ((e.clientX - cx) / (rect.width / 2)) * 18;
    targetY = ((e.clientY - cy) / (rect.height / 2)) * 18;
  });
  bouquetStage.addEventListener("mouseleave", () => {
    targetX = 0;
    targetY = 0;
  });

  function updateParallax() {
    curX += (targetX - curX) * 0.12;
    curY += (targetY - curY) * 0.12;
    bouquetParallax.style.transform = `translate(${curX}px, ${curY}px) rotate(${
      curX * 0.15
    }deg)`;
    requestAnimationFrame(updateParallax);
  }
  updateParallax();

  const petalColors = [
    "#ff8fab",
    "#ff4d6d",
    "#ffd166",
    "#c77dff",
    "#ffb3c6",
    "#ffe5ec",
    "#ff9a3c",
    "#e0aaff",
  ];
  const petals = [];
  const MAX_PETALS = 28;

  function spawnPetal() {
    if (petals.length >= MAX_PETALS) return;
    petals.push({
      x: Math.random() * pw,
      y: -20,
      vx: (Math.random() - 0.5) * 1.2,
      vy: 0.6 + Math.random() * 1.2,
      size: 8 + Math.random() * 10,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.06,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.02 + Math.random() * 0.03,
      swayAmp: 0.5 + Math.random() * 1.2,
      color: petalColors[Math.floor(Math.random() * petalColors.length)],
      alpha: 0.55 + Math.random() * 0.4,
      life: 1,
      decay: 0.002 + Math.random() * 0.002,
    });
  }
  setInterval(() => {
    if (document.querySelector('[data-scene="2"]').classList.contains("active"))
      spawnPetal();
  }, 350);

  function drawPetalShape(p) {
    pctx.save();
    pctx.translate(p.x, p.y);
    pctx.rotate(p.rot);
    pctx.globalAlpha = p.alpha * p.life;
    pctx.fillStyle = p.color;
    const s = p.size;
    pctx.beginPath();
    pctx.moveTo(0, -s);
    pctx.bezierCurveTo(s * 0.9, -s * 0.5, s * 0.9, s * 0.6, 0, s);
    pctx.bezierCurveTo(-s * 0.9, s * 0.6, -s * 0.9, -s * 0.5, 0, -s);
    pctx.fill();
    pctx.restore();
  }

  function updatePetalsLoop() {
    pctx.clearRect(0, 0, pw, ph);
    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      p.sway += p.swaySpeed;
      p.x += p.vx + Math.sin(p.sway) * p.swayAmp;
      p.y += p.vy;
      p.rot += p.rotSpeed;
      p.vy += 0.008;
      p.vy = Math.min(p.vy, 2.2);
      p.life -= p.decay;
      if (p.y > ph - 40) p.life -= 0.02;
      if (p.life <= 0 || p.y > ph + 30) {
        petals.splice(i, 1);
        continue;
      }
      drawPetalShape(p);
    }
    requestAnimationFrame(updatePetalsLoop);
  }
  updatePetalsLoop();

  bouquetParallax.addEventListener("click", (e) => {
    e.stopPropagation();

    const rect = bouquetStage.getBoundingClientRect();
    const cx = rect.width / 2,
      cy = rect.height / 2;
    for (let i = 0; i < 24; i++) {
      if (petals.length >= MAX_PETALS + 30) break;
      const angle = (Math.PI * 2 * i) / 24 + Math.random() * 0.3;
      const speed = 3 + Math.random() * 5;
      petals.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 7 + Math.random() * 9,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
        sway: 0,
        swaySpeed: 0.03,
        swayAmp: 0.4,
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
        alpha: 0.9,
        life: 1,
        decay: 0.012,
      });
    }
    if (typeof launchRocket === "function") launchRocket();

    const letter = document.getElementById("loveLetter");
    if (letter) {
      letter.classList.add("show");
      document.body.style.overflow = "hidden";
      if (typeof bigShow === "function") bigShow(2500);

      const card = document.getElementById("loveLetterCard");
      if (card) {
        const content = card.querySelector(".love-content");
        const fresh = content.cloneNode(true);
        content.replaceWith(fresh);
      }
    }
  });

  if (bouquetImg) {
    bouquetImg.addEventListener("error", () => {
      bouquetImg.style.display = "none";
      const emoji = document.createElement("div");
      emoji.textContent = "💐";
      emoji.style.fontSize = "180px";
      emoji.style.filter = "drop-shadow(0 20px 40px rgba(255,77,109,.8))";
      bouquetParallax.appendChild(emoji);
    });
  }
}

/* ============================================================
      ЗАКРЫТИЕ ОТКРЫТКИ
      ============================================================ */
(function initLoveLetter() {
  const letter = document.getElementById("loveLetter");
  const backdrop = document.getElementById("loveLetterBackdrop");
  const closeBtn = document.getElementById("loveClose");
  if (!letter || !closeBtn) return;

  function closeLetter() {
    letter.classList.remove("show");
    document.body.style.overflow = "";
  }

  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeLetter();
  });
  backdrop.addEventListener("click", closeLetter);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && letter.classList.contains("show")) closeLetter();
  });

  const card = document.getElementById("loveLetterCard");
  if (card) card.addEventListener("click", (e) => e.stopPropagation());
})();

/* ============================================================
      ПЛЕЕР ПЕСЕН
      ============================================================ */
const songItems = document.querySelectorAll(".song-item");
const miniPlayer = document.getElementById("miniPlayer");
const miniPlayBtn = document.getElementById("miniPlayBtn");
const miniTitle = document.getElementById("miniTitle");
const miniProgress = document.getElementById("miniProgress");
const miniProgressWrap = document.getElementById("miniProgressWrap");
const miniTime = document.getElementById("miniTime");

const audio = new Audio();
audio.preload = "metadata";
audio.volume = 0.85;
let currentItem = null;

function fmt(sec) {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

songItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.stopPropagation();

    // Фон — на паузу
    const bg = document.getElementById("bgMusic");
    if (bg && !bg.paused) bg.pause();

    const src = item.dataset.src;
    const title = item.querySelector(".song-name").textContent.trim();

    if (currentItem === item && !audio.paused) {
      audio.pause();
      return;
    }
    if (currentItem === item && audio.paused && audio.src.endsWith(src)) {
      audio.play();
      return;
    }
    if (currentItem) currentItem.classList.remove("playing");

    audio.src = src;
    audio.currentTime = 0;
    audio.play().catch((err) => {
      console.warn("Ошибка:", err);
      item.classList.remove("playing");
    });

    currentItem = item;
    item.classList.add("playing");
    miniTitle.textContent = title;
    miniPlayer.classList.add("show");
    miniPlayBtn.textContent = "❚❚";
  });
});

miniPlayBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!audio.src) return;
  if (audio.paused) audio.play();
  else audio.pause();
});

audio.addEventListener("play", () => {
  miniPlayBtn.textContent = "❚❚";
  if (currentItem) currentItem.classList.add("playing");
});

audio.addEventListener("pause", () => {
  miniPlayBtn.textContent = "▶";
  if (currentItem) currentItem.classList.remove("playing");
});

audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  miniProgress.style.width = (audio.currentTime / audio.duration) * 100 + "%";
  miniTime.textContent = fmt(audio.currentTime) + " / " + fmt(audio.duration);
});

miniProgressWrap.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!audio.duration) return;
  const rect = miniProgressWrap.getBoundingClientRect();
  audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
});

audio.addEventListener("ended", () => {
  if (currentItem) currentItem.classList.remove("playing");
  miniPlayBtn.textContent = "▶";
  miniProgress.style.width = "0%";
});

/* ============================================================
      ФОТО-ГАЛЕРЕЯ
      ============================================================ */
(function initGallery() {
  const track = document.getElementById("galTrack");
  if (!track) return;
  const slides = track.querySelectorAll(".gal-slide");
  const dotsWrap = document.getElementById("galDots");
  const prev = document.getElementById("galPrev");
  const next = document.getElementById("galNext");
  let idx = 0;

  slides.forEach((_, i) => {
    const d = document.createElement("span");
    d.className = "dot" + (i === 0 ? " active" : "");
    d.addEventListener("click", (e) => {
      e.stopPropagation();
      goToSlide(i);
    });
    dotsWrap.appendChild(d);
  });

  function update() {
    track.style.transform = `translateX(-${idx * 100}%)`;
    slides.forEach((s, i) => s.classList.toggle("active", i === idx));
    dotsWrap
      .querySelectorAll(".dot")
      .forEach((d, i) => d.classList.toggle("active", i === idx));
  }

  function goToSlide(i) {
    idx = (i + slides.length) % slides.length;
    update();
  }

  prev.addEventListener("click", (e) => {
    e.stopPropagation();
    goToSlide(idx - 1);
  });
  next.addEventListener("click", (e) => {
    e.stopPropagation();
    goToSlide(idx + 1);
  });

  setInterval(() => {
    if (
      document.querySelector('[data-scene="4"]').classList.contains("active")
    ) {
      goToSlide(idx + 1);
    }
  }, 5000);

  update();
})();

/* ============================================================
      3D-ВСЕЛЕННАЯ НА CANVAS
      ============================================================ */
(function initUniverse() {
  const stage = document.getElementById("universeStage");
  const canvas = document.getElementById("universeCanvas");
  if (!stage || !canvas) return;

  const uctx = canvas.getContext("2d");
  let uw = 0,
    uh = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resizeU() {
    const rect = stage.getBoundingClientRect();
    uw = rect.width;
    uh = rect.height;
    canvas.width = uw * dpr;
    canvas.height = uh * dpr;
    uctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const PHOTOS = [
    "images/photo1.jpg",
    "images/photo2.jpg",
    "images/photo3.jpg",
    "images/photo4.jpg",
  ];

  const photoImages = PHOTOS.map((src, i) => {
    const img = new Image();
    img.src = src;
    img.dataset.loaded = "false";
    img.onload = () => {
      img.dataset.loaded = "true";
    };
    img.onerror = () => {
      img.dataset.loaded = "error";
    };
    img.dataset.fallbackHue = (i * 60) % 360;
    return img;
  });

  const objects = [];

  photoImages.forEach((img, i) => {
    const angle = (i / PHOTOS.length) * Math.PI * 2;
    const radius = 260;
    objects.push({
      type: "photo",
      img,
      x: Math.cos(angle) * radius,
      y: i % 2 === 0 ? 100 : -100,
      z: Math.sin(angle) * radius,
      w: 140,
      h: 105,
      baseY: i % 2 === 0 ? 100 : -100,
      phase: i * 1.5,
    });
  });

  objects.push({ type: "planet", x: 0, y: 0, z: 0, r: 65, phase: 0 });
  objects.push({ type: "ring", x: 0, y: 0, z: 0, r: 105, phase: 0 });

  const particlesU = [];
  for (let i = 0; i < 280; i++) {
    const r = 320 + Math.random() * 400;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    particlesU.push({
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
      type: Math.random() < 0.5 ? "heart" : "star",
      color: ["#ff4d6d", "#ffd166", "#4cc9f0", "#c77dff", "#ff8fab"][
        Math.floor(Math.random() * 5)
      ],
      size: 4 + Math.random() * 6,
      phase: Math.random() * Math.PI * 2,
    });
  }

  let rotY = 0,
    rotX = 0;
  let targetRotY = 0,
    targetRotX = 0;
  let velY = 0.006;
  let autoRotate = true;
  let isDragging = false;
  let prevX = 0,
    prevY = 0;

  stage.addEventListener("mousedown", (e) => {
    isDragging = true;
    autoRotate = false;
    prevX = e.clientX;
    prevY = e.clientY;
  });
  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    prevX = e.clientX;
    prevY = e.clientY;
    targetRotY += dx * 0.01;
    targetRotX += dy * 0.008;
    targetRotX = Math.max(-1.2, Math.min(1.2, targetRotX));
    velY = dx * 0.0012;
  });
  window.addEventListener("mouseup", () => {
    isDragging = false;
    setTimeout(() => {
      autoRotate = true;
    }, 3000);
  });

  stage.addEventListener(
    "touchstart",
    (e) => {
      isDragging = true;
      autoRotate = false;
      prevX = e.touches[0].clientX;
      prevY = e.touches[0].clientY;
    },
    { passive: true }
  );

  stage.addEventListener(
    "touchmove",
    (e) => {
      if (!isDragging) return;
      const dx = e.touches[0].clientX - prevX;
      const dy = e.touches[0].clientY - prevY;
      prevX = e.touches[0].clientX;
      prevY = e.touches[0].clientY;
      targetRotY += dx * 0.012;
      targetRotX += dy * 0.01;
      targetRotX = Math.max(-1.2, Math.min(1.2, targetRotX));
    },
    { passive: true }
  );

  stage.addEventListener("touchend", () => {
    isDragging = false;
    setTimeout(() => {
      autoRotate = true;
    }, 3000);
  });

  const FOV = 950;

  function project(x, y, z) {
    const cosY = Math.cos(rotY),
      sinY = Math.sin(rotY);
    let x1 = x * cosY - z * sinY;
    let z1 = x * sinY + z * cosY;
    const cosX = Math.cos(rotX),
      sinX = Math.sin(rotX);
    let y1 = y * cosX - z1 * sinX;
    let z2 = y * sinX + z1 * cosX;
    const dist = FOV + z2;
    if (dist < 50) return null;
    const scale = FOV / dist;
    return { x: uw / 2 + x1 * scale, y: uh / 2 + y1 * scale, scale, z: z2 };
  }

  function drawHeart(x, y, size, color, alpha) {
    uctx.save();
    uctx.globalAlpha = alpha;
    uctx.fillStyle = color;
    uctx.translate(x, y);
    uctx.scale(size / 20, size / 20);
    uctx.beginPath();
    uctx.moveTo(0, 6);
    uctx.bezierCurveTo(-10, -4, -20, 4, 0, 18);
    uctx.bezierCurveTo(20, 4, 10, -4, 0, 6);
    uctx.fill();
    uctx.restore();
  }

  function drawStar(x, y, size, color, alpha) {
    uctx.save();
    uctx.globalAlpha = alpha;
    uctx.fillStyle = color;
    uctx.translate(x, y);
    uctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = (k * 2 * Math.PI) / 5 - Math.PI / 2;
      const px = Math.cos(a) * size;
      const py = Math.sin(a) * size;
      if (k === 0) uctx.moveTo(px, py);
      else uctx.lineTo(px, py);
      const a2 = a + Math.PI / 5;
      uctx.lineTo(Math.cos(a2) * size * 0.45, Math.sin(a2) * size * 0.45);
    }
    uctx.closePath();
    uctx.fill();
    uctx.restore();
  }

  let lastT = 0;

  function loopU(now) {
    requestAnimationFrame(loopU);

    const sceneEl = document.querySelector('[data-scene="5"]');
    if (!sceneEl || !sceneEl.classList.contains("active")) return;

    if (now - lastT < 16) return;
    lastT = now;

    resizeU();

    const t = now / 1000;

    if (autoRotate && !isDragging) targetRotY += velY;
    rotY += (targetRotY - rotY) * 0.1;
    rotX += (targetRotX - rotX) * 0.1;

    uctx.clearRect(0, 0, uw, uh);

    uctx.fillStyle = "rgba(255,255,255,0.15)";
    for (let i = 0; i < 30; i++) {
      const fx = (i * 137.5) % uw;
      const fy = (i * 219.3) % uh;
      const s = 0.5 + ((Math.sin(t * 2 + i) + 1) / 2) * 1.5;
      uctx.fillRect(fx, fy, s, s);
    }

    const render = [];

    particlesU.forEach((p) => {
      const proj = project(p.x, p.y, p.z);
      if (!proj) return;
      render.push({
        z: proj.z,
        draw: () => {
          const alpha = 0.5 + (1 - Math.min(1, Math.abs(proj.z) / 400)) * 0.5;
          const size =
            p.size * proj.scale * (0.8 + Math.sin(t * 2 + p.phase) * 0.2);
          if (p.type === "heart")
            drawHeart(proj.x, proj.y, size, p.color, alpha);
          else drawStar(proj.x, proj.y, size, p.color, alpha);
        },
      });
    });

    objects.forEach((o) => {
      if (o.type === "photo") {
        const floatY = o.baseY + Math.sin(t * 0.8 + o.phase) * 12;
        const proj = project(o.x, floatY, o.z);
        if (!proj) return;
        render.push({ z: proj.z, draw: () => drawPhoto(o, proj) });
      }
      if (o.type === "planet") {
        const proj = project(o.x, o.y, o.z);
        if (!proj) return;
        render.push({ z: proj.z, draw: () => drawPlanet(proj, o, t) });
      }
      if (o.type === "ring") {
        const proj = project(o.x, o.y, o.z);
        if (!proj) return;
        render.push({ z: proj.z, draw: () => drawRing(proj, o, t) });
      }
    });

    render.sort((a, b) => a.z - b.z);
    render.forEach((r) => r.draw());
  }

  function drawPhoto(o, proj) {
    const w = o.w * proj.scale * 1.6;
    const h = o.h * proj.scale * 1.6;
    const x = proj.x - w / 2;
    const y = proj.y - h / 2;

    const glow = uctx.createRadialGradient(
      proj.x,
      proj.y,
      0,
      proj.x,
      proj.y,
      w * 0.8
    );
    glow.addColorStop(0, "rgba(255,77,109,0.5)");
    glow.addColorStop(1, "rgba(255,77,109,0)");
    uctx.fillStyle = glow;
    uctx.fillRect(x - w * 0.3, y - h * 0.3, w * 1.6, h * 1.6);

    uctx.save();
    if (o.img.dataset.loaded === "true") {
      uctx.beginPath();
      roundRect(uctx, x, y, w, h, 10);
      uctx.clip();
      uctx.drawImage(o.img, x, y, w, h);
      uctx.restore();

      uctx.save();
      uctx.beginPath();
      roundRect(uctx, x, y, w, h, 10);
      uctx.strokeStyle = "rgba(255,77,109,0.9)";
      uctx.lineWidth = 3;
      uctx.shadowColor = "#ff4d6d";
      uctx.shadowBlur = 20;
      uctx.stroke();
      uctx.restore();
    } else {
      const hue = parseInt(o.img.dataset.fallbackHue);
      uctx.fillStyle = `hsl(${hue}, 60%, 35%)`;
      uctx.beginPath();
      roundRect(uctx, x, y, w, h, 10);
      uctx.fill();
      uctx.strokeStyle = "rgba(255,77,109,0.9)";
      uctx.lineWidth = 3;
      uctx.stroke();
      uctx.restore();

      uctx.save();
      uctx.font = `${Math.min(w, h) * 0.5}px serif`;
      uctx.textAlign = "center";
      uctx.textBaseline = "middle";
      uctx.fillText("📷", proj.x, proj.y);
      uctx.restore();
    }
  }

  function drawPlanet(proj, o, t) {
    const r = o.r * proj.scale * 1.6;
    if (r < 2) return;

    const glow = uctx.createRadialGradient(
      proj.x,
      proj.y,
      r * 0.5,
      proj.x,
      proj.y,
      r * 2
    );
    glow.addColorStop(0, "rgba(255, 120, 200, 0.5)");
    glow.addColorStop(1, "rgba(255, 120, 200, 0)");
    uctx.fillStyle = glow;
    uctx.beginPath();
    uctx.arc(proj.x, proj.y, r * 2, 0, Math.PI * 2);
    uctx.fill();

    const grad = uctx.createRadialGradient(
      proj.x - r * 0.3,
      proj.y - r * 0.3,
      0,
      proj.x,
      proj.y,
      r
    );
    grad.addColorStop(0, "#ffb3d9");
    grad.addColorStop(0.5, "#ff4d6d");
    grad.addColorStop(1, "#8b0033");
    uctx.fillStyle = grad;
    uctx.beginPath();
    uctx.arc(proj.x, proj.y, r, 0, Math.PI * 2);
    uctx.fill();

    uctx.save();
    uctx.globalAlpha = 0.6;
    uctx.fillStyle = "#fff";
    uctx.beginPath();
    uctx.ellipse(
      proj.x - r * 0.35,
      proj.y - r * 0.4,
      r * 0.2,
      r * 0.12,
      -Math.PI / 6,
      0,
      Math.PI * 2
    );
    uctx.fill();
    uctx.restore();

    uctx.save();
    uctx.globalAlpha = 0.3 + Math.sin(t * 1.5) * 0.2;
    uctx.strokeStyle = "#ff4d6d";
    uctx.lineWidth = 2;
    uctx.beginPath();
    uctx.arc(
      proj.x,
      proj.y,
      r * (1.2 + Math.sin(t * 1.5) * 0.1),
      0,
      Math.PI * 2
    );
    uctx.stroke();
    uctx.restore();
  }

  function drawRing(proj, o, t) {
    const r = o.r * proj.scale * 1.6;
    if (r < 2) return;

    uctx.save();
    uctx.translate(proj.x, proj.y);
    uctx.scale(1, 0.35);
    uctx.rotate(t * 0.3);

    uctx.beginPath();
    uctx.arc(0, 0, r, 0, Math.PI * 2);
    uctx.strokeStyle = "rgba(255, 209, 102, 0.7)";
    uctx.lineWidth = 3;
    uctx.stroke();

    uctx.beginPath();
    uctx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
    uctx.strokeStyle = "rgba(255, 77, 109, 0.5)";
    uctx.lineWidth = 2;
    uctx.stroke();

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + t * 0.5;
      uctx.beginPath();
      uctx.arc(Math.cos(a) * r, Math.sin(a) * r, 3, 0, Math.PI * 2);
      uctx.fillStyle = "#ffd166";
      uctx.fill();
    }
    uctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  resizeU();
  window.addEventListener("resize", resizeU);
  requestAnimationFrame(loopU);

  stage.addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    if (typeof launchRocket === "function") launchRocket();
  });
})();

/* ============================================================
      ИГРА: ЛОПНИ ШАРИКИ
      ============================================================ */
const gameWrap = document.getElementById("gameWrap");
const gameCanvas = document.getElementById("gameCanvas");
const gctx = gameCanvas.getContext("2d");
const gameIntro = document.getElementById("gameIntro");
const playBtn = document.getElementById("playBtn");
const restartBtn = document.getElementById("restartBtn");
const gameOverEl = document.getElementById("gameOver");
const scoreVal = document.getElementById("scoreVal");
const timeVal = document.getElementById("timeVal");
const bestVal = document.getElementById("bestVal");
const finalScore = document.getElementById("finalScore");
const goBestMsg = document.getElementById("goBestMsg");
const goStats = document.getElementById("goStats");
const goTitle = document.getElementById("goTitle");
const gameNextBtn = document.getElementById("gameNextBtn");
const ringFg = document.getElementById("ringFg");
const comboIndicator = document.getElementById("comboIndicator");
const comboNum = document.getElementById("comboNum");

let gw = 0,
  gh = 0;
let gameRunning = false;
let gameScore = 0;
let gameTime = 10;
const GAME_DURATION = 10;

let gameTimer = null;
let spawnTimer = null;
let gameLoopId = null;
let lastFrameTime = 0;

let totalPopped = 0;
let maxCombo = 0;
let comboTimer = null;
let currentCombo = 0;

const BEST_KEY = "masha_balloons_best_v2";
let bestScore = parseInt(localStorage.getItem(BEST_KEY) || "0", 10);
bestVal.textContent = bestScore;

function resizeGameCanvas() {
  if (!gameWrap) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const rect = gameWrap.getBoundingClientRect();
  gw = rect.width;
  gh = rect.height;
  gameCanvas.width = gw * dpr;
  gameCanvas.height = gh * dpr;
  gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", () => {
  if (gameWrap.classList.contains("active")) resizeGameCanvas();
});

const RING_CIRCUMFERENCE = 2 * Math.PI * 48;
if (ringFg) {
  ringFg.style.strokeDasharray = RING_CIRCUMFERENCE;
  ringFg.style.strokeDashoffset = 0;
}
function updateRing(secondsLeft, totalSeconds) {
  if (!ringFg) return;
  const pct = secondsLeft / totalSeconds;
  ringFg.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - pct);
  const hue = Math.max(0, Math.min(120, pct * 120));
  ringFg.style.stroke = `hsl(${hue}, 90%, 60%)`;
  ringFg.style.filter = `drop-shadow(0 0 6px hsl(${hue}, 90%, 60%)) drop-shadow(0 0 12px hsl(${hue}, 90%, 60%))`;
}

const BALLOON_TYPES = [
  {
    type: "balloon",
    emoji: "🎈",
    score: 1,
    radius: 26,
    weight: 50,
    color: "#ff4d6d",
  },
  {
    type: "heart",
    emoji: "💗",
    score: 2,
    radius: 24,
    weight: 24,
    color: "#ff8fab",
  },
  {
    type: "star",
    emoji: "⭐",
    score: 5,
    radius: 22,
    weight: 10,
    color: "#ffd166",
  },
  {
    type: "bomb",
    emoji: "💣",
    score: -2,
    radius: 24,
    weight: 16,
    color: "#ff2d2d",
  },
];

function pickBalloonType() {
  const total = BALLOON_TYPES.reduce((s, b) => s + b.weight, 0);
  let r = Math.random() * total;
  for (const b of BALLOON_TYPES) {
    r -= b.weight;
    if (r <= 0) return b;
  }
  return BALLOON_TYPES[0];
}

const balloons = [];
const particles = [];

function spawnBalloon() {
  const t = pickBalloonType();
  const isBonus = Math.random() < 0.1 && t.type === "balloon";
  const baseSpeed = 1.6 + Math.random() * 1.6;
  balloons.push({
    x: 50 + Math.random() * (gw - 100),
    y: gh + 40,
    vx: (Math.random() - 0.5) * 1.6,
    vy: -baseSpeed,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 0.02 + Math.random() * 0.03,
    swayAmp: 0.5 + Math.random() * 1.4,
    radius: isBonus ? t.radius * 0.7 : t.radius,
    emoji: isBonus ? "💎" : t.emoji,
    score: isBonus ? 10 : t.score,
    type: isBonus ? "diamond" : t.type,
    color: isBonus ? "#4cc9f0" : t.color,
    rot: (Math.random() - 0.5) * 0.4,
    rotSpeed: (Math.random() - 0.5) * 0.02,
    isBonus,
    pulse: 0,
  });
}

function spawnBurst(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 1,
      decay: 0.025 + Math.random() * 0.02,
      size: 2 + Math.random() * 5,
      color,
      isEmoji: Math.random() < 0.25,
      emoji: ["✨", "💫", "⭐", "🌟", "💥"][Math.floor(Math.random() * 5)],
      gravity: 0.14,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
    });
  }
}

function popupScore(x, y, text, color, size = 1.5) {
  const el = document.createElement("div");
  el.className = "score-popup";
  el.textContent = text;
  el.style.color = color;
  el.style.left = x + "px";
  el.style.top = y + "px";
  el.style.transform = "translate(-50%, 0)";
  el.style.fontSize = size + "rem";
  gameWrap.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

function shockwave(x, y, color) {
  const el = document.createElement("div");
  el.className = "shockwave";
  el.style.left = x + "px";
  el.style.top = y + "px";
  el.style.width = "40px";
  el.style.height = "40px";
  el.style.color = color;
  gameWrap.appendChild(el);
  setTimeout(() => el.remove(), 520);
}

function bumpCombo() {
  currentCombo++;
  if (currentCombo > maxCombo) maxCombo = currentCombo;
  if (currentCombo >= 2) {
    comboNum.textContent = currentCombo;
    comboIndicator.classList.remove("show");
    void comboIndicator.offsetWidth;
    comboIndicator.classList.add("show");
    gameWrap.classList.remove("combo-active");
    void gameWrap.offsetWidth;
    gameWrap.classList.add("combo-active");
    for (let i = 0; i < 6; i++) spawnBurst(gw / 2, gh / 2, "#ffd166", 4);
  }
  clearTimeout(comboTimer);
  comboTimer = setTimeout(() => {
    currentCombo = 0;
    gameWrap.classList.remove("combo-active");
  }, 1500);
}

function handleClick(clientX, clientY) {
  if (!gameRunning) return;
  const rect = gameWrap.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  for (let i = balloons.length - 1; i >= 0; i--) {
    const b = balloons[i];
    const dx = x - b.x;
    const dy = y - b.y;
    const hitRadius = b.radius + 12;
    if (dx * dx + dy * dy <= hitRadius * hitRadius) {
      popBalloon(i);
      return;
    }
  }
}

function popBalloon(index) {
  const b = balloons[index];
  balloons.splice(index, 1);
  totalPopped++;

  const comboBonus = currentCombo >= 2 ? currentCombo : 1;
  let earned = b.score;
  if (earned > 0 && comboBonus > 1) earned = earned + (comboBonus - 1);

  gameScore += earned;
  if (gameScore < 0) gameScore = 0;
  scoreVal.textContent = gameScore;

  scoreVal.parentElement.classList.add("bump");
  setTimeout(() => scoreVal.parentElement.classList.remove("bump"), 150);

  const color = earned > 0 ? "#ffd166" : "#ff4d6d";
  const sign = earned > 0 ? "+" : "";
  const size = earned >= 5 ? 2.2 : earned >= 2 ? 1.8 : 1.5;
  popupScore(b.x, b.y, sign + earned, color, size);
  shockwave(b.x, b.y, b.color);

  if (b.type === "bomb") {
    spawnBurst(b.x, b.y, "#ff2d2d", 22);
    const fl = document.createElement("div");
    fl.className = "bomb-flash";
    gameWrap.appendChild(fl);
    setTimeout(() => fl.remove(), 520);
    gameWrap.classList.remove("shake");
    void gameWrap.offsetWidth;
    gameWrap.classList.add("shake");
    setTimeout(() => gameWrap.classList.remove("shake"), 400);
    currentCombo = 0;
    gameWrap.classList.remove("combo-active");
  } else if (b.type === "diamond") {
    spawnBurst(b.x, b.y, "#4cc9f0", 26);
    if (typeof launchRocket === "function") {
      launchRocket();
      launchRocket();
    }
  } else {
    spawnBurst(b.x, b.y, b.color, 14);
  }

  if (b.type !== "bomb") bumpCombo();
  else currentCombo = 0;
}

function drawBalloon(b) {
  gctx.save();
  gctx.translate(b.x, b.y);
  gctx.rotate(b.rot);
  let pulseScale = 1;
  if (b.isBonus || b.type === "star") {
    b.pulse += 0.15;
    pulseScale = 1 + Math.sin(b.pulse) * 0.12;
  }
  gctx.scale(pulseScale, pulseScale);

  const grd = gctx.createRadialGradient(0, 0, 0, 0, 0, b.radius * 1.8);
  grd.addColorStop(0, b.color + "cc");
  grd.addColorStop(0.55, b.color + "40");
  grd.addColorStop(1, b.color + "00");
  gctx.fillStyle = grd;
  gctx.beginPath();
  gctx.arc(0, 0, b.radius * 1.8, 0, Math.PI * 2);
  gctx.fill();

  gctx.font = `${b.radius * 2}px serif`;
  gctx.textAlign = "center";
  gctx.textBaseline = "middle";
  gctx.fillText(b.emoji, 0, 0);
  gctx.restore();
}

function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.vy += p.gravity;
    p.life -= p.decay;
    p.rot += p.rotSpeed;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    gctx.globalAlpha = Math.max(0, p.life);
    if (p.isEmoji) {
      gctx.save();
      gctx.translate(p.x, p.y);
      gctx.rotate(p.rot);
      gctx.font = `${p.size * 3.5}px serif`;
      gctx.textAlign = "center";
      gctx.textBaseline = "middle";
      gctx.fillText(p.emoji, 0, 0);
      gctx.restore();
    } else {
      gctx.fillStyle = p.color;
      gctx.beginPath();
      gctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      gctx.fill();
    }
  }
  gctx.globalAlpha = 1;
}

function gameLoop(now) {
  if (!gameRunning) return;
  gameLoopId = requestAnimationFrame(gameLoop);
  if (now - lastFrameTime < 16) return;
  lastFrameTime = now;

  gctx.clearRect(0, 0, gw, gh);

  for (let i = balloons.length - 1; i >= 0; i--) {
    const b = balloons[i];
    b.sway += b.swaySpeed;
    b.x += b.vx + Math.sin(b.sway) * b.swayAmp;
    b.y += b.vy;
    b.rot += b.rotSpeed;

    if (b.x < b.radius || b.x > gw - b.radius) {
      b.vx *= -1;
      b.x = Math.max(b.radius, Math.min(gw - b.radius, b.x));
    }

    if (b.y < -b.radius * 2) {
      balloons.splice(i, 1);
      continue;
    }
    drawBalloon(b);
  }

  drawParticles();
}

function showGo() {
  const el = document.createElement("div");
  el.className = "countdown-go";
  el.textContent = "GO!";
  gameWrap.appendChild(el);
  setTimeout(() => el.remove(), 850);
}

function startGame() {
  gameIntro.style.display = "none";
  gameOverEl.classList.remove("show");
  gameWrap.classList.add("active");
  gameNextBtn.style.display = "none";

  setTimeout(() => resizeGameCanvas(), 30);

  balloons.length = 0;
  particles.length = 0;
  gameScore = 0;
  gameTime = GAME_DURATION;
  totalPopped = 0;
  maxCombo = 0;
  currentCombo = 0;
  scoreVal.textContent = "0";
  timeVal.textContent = GAME_DURATION;
  timeVal.classList.remove("low");
  updateRing(GAME_DURATION, GAME_DURATION);
  gameRunning = true;
  lastFrameTime = 0;

  showGo();

  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  gameLoopId = requestAnimationFrame(gameLoop);

  if (spawnTimer) clearInterval(spawnTimer);
  spawnTimer = setInterval(() => {
    if (!gameRunning) return;
    spawnBalloon();
    if (Math.random() < 0.5) spawnBalloon();
  }, 280);

  if (gameTimer) cancelAnimationFrame(gameTimer);
  const startTime = performance.now();

  function tickTimer() {
    if (!gameRunning) return;
    const elapsed = (performance.now() - startTime) / 1000;
    const left = Math.max(0, GAME_DURATION - elapsed);

    const newTime = Math.ceil(left);
    if (newTime !== gameTime) {
      gameTime = newTime;
      timeVal.textContent = gameTime;
    }
    updateRing(left, GAME_DURATION);

    if (left <= 3) timeVal.classList.add("low");

    if (left <= 0) {
      endGame();
      return;
    }
    gameTimer = requestAnimationFrame(tickTimer);
  }
  gameTimer = requestAnimationFrame(tickTimer);
}

function endGame() {
  if (!gameRunning) return;
  gameRunning = false;
  if (gameTimer) cancelAnimationFrame(gameTimer);
  clearInterval(spawnTimer);
  if (gameLoopId) cancelAnimationFrame(gameLoopId);

  finalScore.textContent = gameScore;
  goStats.textContent = `Лопнуто: ${totalPopped} · Макс. комбо: ×${maxCombo}`;

  if (gameScore > bestScore) {
    bestScore = gameScore;
    localStorage.setItem(BEST_KEY, bestScore);
    bestVal.textContent = bestScore;
    goTitle.textContent = "🏆 Новый рекорд!";
    goBestMsg.textContent = `Рекорд: ${bestScore}`;
  } else {
    goTitle.textContent = "Время вышло!";
    goBestMsg.textContent = `Рекорд: ${bestScore}`;
  }

  gameOverEl.classList.add("show");
  gameNextBtn.style.display = "inline-block";

  if (typeof launchRocket === "function") {
    for (let i = 0; i < 6; i++) setTimeout(launchRocket, i * 110);
  }
}

playBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  startGame();
});
restartBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  startGame();
});

gameWrap.addEventListener("click", (e) => {
  e.stopPropagation();
  handleClick(e.clientX, e.clientY);
});

gameWrap.addEventListener(
  "touchstart",
  (e) => {
    if (!gameRunning) return;
    e.preventDefault();
    e.stopPropagation();
    const t = e.touches[0];
    handleClick(t.clientX, t.clientY);
  },
  { passive: false }
);

const gameSceneEl = document.querySelector('[data-scene="6"]');
if (gameSceneEl) {
  const observer = new MutationObserver(() => {
    if (!gameSceneEl.classList.contains("active") && gameRunning) {
      gameRunning = false;
      if (gameTimer) cancelAnimationFrame(gameTimer);
      clearInterval(spawnTimer);
      if (gameLoopId) cancelAnimationFrame(gameLoopId);
    }
  });
  observer.observe(gameSceneEl, {
    attributes: true,
    attributeFilter: ["class"],
  });
}

/* ============================================================
      ТОРТ: ЗАДУТЬ СВЕЧУ + ВИДЕО
      ============================================================ */
(function initCake() {
  const cake = document.querySelector(".cake-3d");
  const blowBtn = document.getElementById("blowBtn");
  const blowHint = document.getElementById("blowHint");
  const videoReveal = document.getElementById("videoReveal");
  const afterCakeBtn = document.getElementById("afterCakeBtn");
  if (!cake || !blowBtn) return;

  let blown = false;

  blowBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (blown) return;
    blown = true;

    cake.classList.add("blown");
    blowHint.textContent = "✨ Желание загадано!";

    const smoke = document.createElement("div");
    smoke.style.cssText = `
         position:absolute; left:50%; bottom:240px;
         transform: translateX(-50%);
         font-size:2rem;
         animation: smokeUp 2s ease-out forwards;
         pointer-events:none;
         z-index:6;
       `;
    smoke.textContent = "💨";
    cake.appendChild(smoke);
    setTimeout(() => smoke.remove(), 2000);

    setTimeout(() => {
      videoReveal.classList.add("show");
      afterCakeBtn.classList.add("show");
      if (typeof bigShow === "function") bigShow(2500);
    }, 600);
  });

  const video = document.getElementById("surpriseVideo");
  if (video) {
    video.addEventListener("error", () => {
      blowHint.textContent =
        "(Видео не найдено — но сюрприз всё равно есть ❤️)";
      videoReveal.classList.add("show");
      afterCakeBtn.classList.add("show");
    });
  }

  const cakeScene = document.querySelector('[data-scene="7"]');
  if (cakeScene && video) {
    const obs = new MutationObserver(() => {
      if (!cakeScene.classList.contains("active") && !video.paused)
        video.pause();
    });
    obs.observe(cakeScene, { attributes: true, attributeFilter: ["class"] });
  }
})();
