(function () {
   "use strict";
   // ===== Canvas init (DPR-aware) =====
   const canvas = document.getElementById("canvas");
   const ctx = canvas.getContext("2d");
   let DPR = Math.min(window.devicePixelRatio || 1, 2);
   function resize() {
      const w = canvas.parentElement.clientWidth;
      const availH = window.innerHeight;
      const headerH = document.querySelector("header").offsetHeight;
      const footerH = document.querySelector("footer").offsetHeight;
      const h = Math.max(220, availH - headerH - footerH);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      computeGrid();
      draw();
   }
   window.addEventListener("resize", () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      resize();
   });
   window.addEventListener(
      "orientationchange",
      () => {
         setTimeout(() => {
            resize();
            updateControlsVisibility();
         }, 50);
      },
      { passive: true }
   );

   // Avoid iOS pull-to-refresh / scroll while playing
   ["touchmove", "gesturestart", "dblclick"].forEach((ev) => {
      document.addEventListener(
         ev,
         (e) => {
            if (
               e.target === canvas ||
               (e.target.closest && e.target.closest("#controls"))
            ) {
               e.preventDefault();
            }
         },
         { passive: false }
      );
   });

   // ===== Grid config =====
   const grid = { cols: 24, rows: 24, size: 24, pad: 2 };
   function computeGrid() {
      const maxCols = Math.floor(canvas.clientWidth / 24);
      const maxRows = Math.floor(canvas.clientHeight / 24);
      grid.cols = Math.max(12, Math.min(40, maxCols));
      grid.rows = Math.max(12, Math.min(40, maxRows));
      const csW = Math.floor(canvas.clientWidth / grid.cols);
      const csH = Math.floor(canvas.clientHeight / grid.rows);
      grid.size = Math.max(14, Math.min(40, Math.min(csW, csH)));
      grid.pad = Math.max(1, Math.floor(grid.size / 12));
   }
   function toScreen(x, y) {
      return { x: x * grid.size, y: y * grid.size };
   }

   // ===== Game State =====
   const scoreEl = document.getElementById("score");
   const bestEl = document.getElementById("best");
   const overlay = document.getElementById("overlay");
   const btnRestart = document.getElementById("restart");
   const btnPause = document.getElementById("pause");
   const btnAgain = document.getElementById("playAgain");
   const speedSel = document.getElementById("speed");
   const padToggle = document.getElementById("padToggle");

   const state = {
      running: false,
      paused: false,
      tickRate: 8, // cells per second (default Normal)
      lastTime: 0,
      acc: 0,
      snake: [],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: { x: 10, y: 10, color: null },
      score: 0,
      best: Number(localStorage.getItem("snake_best") || 0),
      particles: [] // explosion particles
   };
   bestEl.textContent = state.best;

   function reset() {
      const cx = Math.floor(grid.cols / 2),
         cy = Math.floor(grid.rows / 2);
      state.snake = [
         { x: cx - 1, y: cy },
         { x: cx, y: cy }
      ];
      state.dir = { x: 1, y: 0 };
      state.nextDir = { x: 1, y: 0 };
      state.food = spawnFood(); // randomized color each reset
      state.score = 0;
      scoreEl.textContent = "0";
      state.running = true;
      state.paused = false;
      overlay.classList.add("hidden");
      state.acc = 0;
      state.lastTime = performance.now();
      state.particles.length = 0; // clear particles
   }

   function spawnFood() {
      while (true) {
         const x = Math.floor(Math.random() * grid.cols);
         const y = Math.floor(Math.random() * grid.rows);
         if (!state.snake.some((s) => s.x === x && s.y === y))
            return { x, y, color: randomFoodColor() };
      }
   }

   // ===== Game Loop =====
   function loop(t) {
      if (!state.running) return; // stop when not running
      const dt = Math.min(0.05, (t - state.lastTime) / 1000); // seconds
      state.lastTime = t;
      if (!state.paused) {
         state.acc += dt;
         const step = 1 / state.tickRate;
         while (state.acc >= step) {
            tick();
            state.acc -= step;
         }
         // update particles with real-time dt for smoother animation
         updateParticles(dt);
      }
      draw();
      requestAnimationFrame(loop);
   }

   function tick() {
      // commit direction queued
      if (state.nextDir.x !== -state.dir.x || state.nextDir.y !== -state.dir.y) {
         state.dir = state.nextDir;
      }
      const head = state.snake[state.snake.length - 1];
      let nx = head.x + state.dir.x;
      let ny = head.y + state.dir.y;
      // wrap around always (no walls)
      nx = (nx + grid.cols) % grid.cols;
      ny = (ny + grid.rows) % grid.rows;
      // self-collision
      if (state.snake.some((s) => s.x === nx && s.y === ny)) return gameOver();

      state.snake.push({ x: nx, y: ny });
      if (nx === state.food.x && ny === state.food.y) {
         state.score++;
         scoreEl.textContent = String(state.score);
         // spawn particle explosion using food color
         spawnExplosion(nx, ny, state.food.color);
         state.food = spawnFood();
         if (state.score % 5 === 0) state.tickRate = Math.min(20, state.tickRate + 1);
         if (navigator.vibrate)
            try {
               navigator.vibrate(15);
            } catch (_) {}
      } else {
         state.snake.shift();
      }
   }

   // ===== Render =====
   function draw() {
      // Clear fully (no motion trail / no borders)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // draw particles under snake core for nice glow overlay
      drawParticles();

      // food (solid color that changes each spawn)
      const fcol = state.food && state.food.color ? state.food.color : varColor("--food");
      paintCell(state.food.x, state.food.y, fcol);

      // snake
      for (let i = 0; i < state.snake.length; i++) {
         const seg = state.snake[i];
         const col =
            i === state.snake.length - 1 ? varColor("--snake") : varColor("--snake-dark");
         paintCell(seg.x, seg.y, col, true);
      }
   }

   function paintCell(cx, cy, color, round = false) {
      const p = toScreen(cx, cy);
      const r = grid.size - grid.pad * 2;
      const x = p.x + grid.pad,
         y = p.y + grid.pad;

      // --- Neon glow pass ---
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.shadowColor = color;
      ctx.shadowBlur = Math.max(10, Math.floor(grid.size * 0.9));
      ctx.fillStyle = color;
      if (round) {
         const rad = Math.max(3, Math.floor(r * 0.25));
         roundRect(ctx, x, y, r, r, rad);
         ctx.globalAlpha = 0.75;
         ctx.fill();
      } else {
         ctx.globalAlpha = 0.75;
         ctx.fillRect(x, y, r, r);
      }

      // --- Inner core (crisp) ---
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      if (round) {
         const rad = Math.max(3, Math.floor(r * 0.2));
         roundRect(ctx, x + 1, y + 1, r - 2, r - 2, rad);
         ctx.fill();
      } else {
         ctx.fillRect(x + 1, y + 1, r - 2, r - 2);
      }

      // subtle highlight outline
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 1;
      if (round) {
         const rad = Math.max(3, Math.floor(r * 0.2));
         roundRect(ctx, x + 1, y + 1, r - 2, r - 2, rad);
         ctx.stroke();
      } else {
         ctx.strokeRect(x + 1.5, y + 1.5, r - 3, r - 3);
      }
      ctx.restore();
   }
   function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
   }
   function varColor(name) {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
   }

   // Solid color helper
   function randomFoodColor() {
      const h = Math.floor(Math.random() * 360);
      const s = 100; // saturation
      const l = 60; // lightness (bright for glow)
      return `hsl(${h} ${s}% ${l}%)`;
   }

   // ===== Particles (Explosion on Eat) =====
   function spawnExplosion(cx, cy, color) {
      const center = toScreen(cx, cy);
      const cxp = center.x + grid.size / 2;
      const cyp = center.y + grid.size / 2;
      const count = Math.max(18, Math.floor(grid.size * 1.2));
      const col = color || varColor("--food");
      for (let i = 0; i < count; i++) {
         const ang = Math.random() * Math.PI * 2;
         const speed = grid.size * 2 * (0.5 + Math.random()); // px/sec
         state.particles.push({
            x: cxp,
            y: cyp,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            life: 0.35 + Math.random() * 0.35, // seconds
            age: 0,
            color: col,
            size: Math.max(
               2,
               Math.floor(grid.size * 0.16 + Math.random() * grid.size * 0.12)
            )
         });
      }
   }
   function updateParticles(dt) {
      if (!state.particles.length) return;
      for (let i = state.particles.length - 1; i >= 0; i--) {
         const p = state.particles[i];
         p.age += dt;
         if (p.age >= p.life) {
            state.particles.splice(i, 1);
            continue;
         }
         // integrate
         p.x += p.vx * dt;
         p.y += p.vy * dt;
         // mild drag
         const drag = 1 - Math.min(0.04, dt * 3);
         p.vx *= drag;
         p.vy *= drag;
      }
   }
   function drawParticles() {
      if (!state.particles.length) return;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const p of state.particles) {
         const t = p.age / p.life;
         const alpha = (1 - t) * 0.9; // fade out
         ctx.shadowColor = p.color;
         ctx.shadowBlur = Math.max(6, grid.size * 0.6);
         ctx.fillStyle = p.color;
         ctx.globalAlpha = alpha;
         const s = p.size;
         ctx.beginPath();
         ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
         ctx.fill();
      }
      ctx.restore();
   }

   // ===== Input (Keyboard) =====
   function setDir(x, y) {
      state.nextDir = { x, y };
   }
   window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") setDir(-1, 0);
      else if (k === "arrowup" || k === "w") setDir(0, -1);
      else if (k === "arrowright" || k === "d") setDir(1, 0);
      else if (k === "arrowdown" || k === "s") setDir(0, 1);
      else if (k === " ") {
         togglePause();
      }
   });

   // ===== Input (Mobile Controls + Swipe) =====
   const btnPauseTop = document.getElementById("pause");
   const btnUp = document.getElementById("btnUp");
   const btnDown = document.getElementById("btnDown");
   const btnLeft = document.getElementById("btnLeft");
   const btnRight = document.getElementById("btnRight");

   const tapOpts = { passive: false };
   function bindTap(el, fn) {
      el.addEventListener(
         "touchstart",
         (e) => {
            e.preventDefault();
            fn();
         },
         tapOpts
      );
      el.addEventListener(
         "pointerdown",
         (e) => {
            e.preventDefault();
            fn();
         },
         tapOpts
      );
      el.addEventListener("click", (e) => {
         e.preventDefault();
         fn();
      });
   }

   bindTap(btnUp, () => setDir(0, -1));
   bindTap(btnDown, () => setDir(0, 1));
   bindTap(btnLeft, () => setDir(-1, 0));
   bindTap(btnRight, () => setDir(1, 0));

   // keypress visual feedback like real keycaps
   function addKeycapPressEffect(el) {
      const on = () => el.classList.add("is-press");
      const off = () => el.classList.remove("is-press");
      ["pointerdown", "touchstart", "mousedown"].forEach((ev) =>
         el.addEventListener(ev, on, { passive: true })
      );
      ["pointerup", "touchend", "touchcancel", "mouseup", "mouseleave"].forEach((ev) =>
         el.addEventListener(ev, off, { passive: true })
      );
   }
   [btnUp, btnDown, btnLeft, btnRight].forEach(addKeycapPressEffect);

   // top buttons remain
   btnRestart.addEventListener("click", () => {
      reset();
      start();
   });
   btnPauseTop.addEventListener("click", togglePause);
   btnAgain.addEventListener("click", () => {
      reset();
      start();
   });

   // Swipe (mobile)
   let touchStart = null;
   canvas.addEventListener(
      "touchstart",
      (e) => {
         const t = e.touches[0];
         touchStart = { x: t.clientX, y: t.clientY };
      },
      { passive: true }
   );
   canvas.addEventListener(
      "touchend",
      (e) => {
         if (!touchStart) return;
         const t = e.changedTouches[0];
         const dx = t.clientX - touchStart.x,
            dy = t.clientY - touchStart.y;
         if (Math.abs(dx) > Math.abs(dy)) setDir(Math.sign(dx), 0);
         else setDir(0, Math.sign(dy));
         touchStart = null;
      },
      { passive: true }
   );

   function togglePause() {
      if (!state.running) return;
      state.paused = !state.paused;
      btnPauseTop.textContent = state.paused ? "Resume" : "Pause";
   }
   function gameOver() {
      state.running = false;
      overlay.classList.remove("hidden");
      state.best = Math.max(state.best, state.score);
      bestEl.textContent = state.best;
      localStorage.setItem("snake_best", String(state.best));
   }
   function start() {
      state.tickRate = Number(speedSel.value);
      state.lastTime = performance.now();
      state.acc = 0;
      requestAnimationFrame(loop);
   }

   // ===== Self Tests =====
   (function tests() {
      const panel = document.getElementById("selftest");
      const logs = [];
      const ok = (s) => logs.push("✅ " + s);
      const bad = (s) => logs.push("❌ " + s);
      try {
         if (typeof ctx.setTransform === "function") {
            ok("ctx.setTransform tersedia");
         } else {
            bad("ctx.setTransform missing");
         }
      } catch (e) {
         bad("ctx.setTransform access threw");
      }
      try {
         // move forward
         state.snake = [
            { x: 1, y: 1 },
            { x: 2, y: 1 },
            { x: 3, y: 1 },
            { x: 4, y: 1 },
            { x: 5, y: 1 }
         ];
         state.dir = { x: 1, y: 0 };
         state.nextDir = { x: 1, y: 0 };
         state.food = { x: 99, y: 99, color: randomFoodColor() };
         grid.cols = 30;
         grid.rows = 20;
         tick();
         if (state.snake[state.snake.length - 1].x === 6) ok("Move forward");
         else bad("Move failed");
      } catch (e) {
         bad("Tick threw: " + e.message);
      }
      try {
         // self-collision
         state.snake = [
            { x: 1, y: 1 },
            { x: 1, y: 2 },
            { x: 1, y: 3 },
            { x: 2, y: 3 },
            { x: 2, y: 2 }
         ];
         state.dir = { x: -1, y: 0 };
         state.nextDir = { x: -1, y: 0 };
         state.food = { x: 99, y: 99, color: randomFoodColor() };
         state.running = true;
         const end = gameOver;
         let ended = false;
         gameOver = () => {
            ended = true;
            state.running = false;
            overlay.classList.add("hidden");
         };
         tick();
         gameOver = end;
         if (ended) ok("Self collision detected");
         else bad("Self collision miss");
      } catch (e) {
         bad("Self collision test threw");
      }
      try {
         // food spawns off snake
         state.snake = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 }
         ];
         grid.cols = 10;
         grid.rows = 10;
         let f = spawnFood();
         if (
            typeof f.color === "string" &&
            f.color.length > 0 &&
            !state.snake.some((s) => s.x === f.x && s.y === f.y)
         )
            ok("Food spawn valid w/ color");
         else bad("Food spawn invalid");
      } catch (e) {
         bad("Food spawn test threw");
      }
      try {
         // randomFoodColor returns a CSS color string
         const c = randomFoodColor();
         if (typeof c === "string" && c.includes("hsl(")) ok("Food color generator ok");
         else bad("Food color generator bad");
      } catch (e) {
         bad("Food color generator test threw");
      }
      try {
         // explosion spawns particles with or without color arg
         const before = state.particles.length;
         spawnExplosion(5, 5, "hsl(120 100% 60%)");
         const mid = state.particles.length;
         spawnExplosion(6, 6);
         const after = state.particles.length;
         if (mid > before && after > mid) ok("Explosion spawns particles");
         else bad("Explosion particle count incorrect");
      } catch (e) {
         bad("Explosion test threw: " + e.message);
      }
      try {
         // draw() should not throw on empty particles
         draw();
         ok("Draw safe");
      } catch (e) {
         bad("Draw threw: " + e.message);
      }
      // Show tests when requested
      if (location.search.includes("test=1")) {
         panel.textContent = logs.join(" · ");
         panel.classList.add("show");
      }
   })();

   // boot
   const controlsEl = document.getElementById("controls");
   function updateControlsVisibility() {
      const mqCoarse = window.matchMedia("(pointer:coarse)").matches;
      const mqNoHover = window.matchMedia("(hover:none)").matches;
      const touchPoints = (navigator.maxTouchPoints || 0) > 0;
      const hasTouch = "ontouchstart" in window || touchPoints || mqCoarse || mqNoHover;
      const forced = /[?&]pad=1\b/.test(location.search);
      const show = (padToggle?.checked ?? true) || hasTouch || forced;
      controlsEl.classList.toggle("hidden", !show);
      controlsEl.style.display = show ? "grid" : "none";
   }
   resize();
   updateControlsVisibility();
   padToggle?.addEventListener("change", updateControlsVisibility);
   reset();
   start();
   window
      .matchMedia("(pointer:coarse)")
      .addEventListener("change", updateControlsVisibility);
})();
