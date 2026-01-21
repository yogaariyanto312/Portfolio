// ===== Background Animation (Network Particles) =====
(function () {
   const canvas = document.getElementById("bg-canvas");
   const ctx = canvas.getContext("2d");
   let particlesArray;

   // Set canvas dimensions
   canvas.width = window.innerWidth;
   canvas.height = window.innerHeight;

   // Particle Class
   class Particle {
      constructor(x, y, directionX, directionY, size, color) {
         this.x = x;
         this.y = y;
         this.directionX = directionX;
         this.directionY = directionY;
         this.size = size;
         this.color = color;
      }

      // Draw individual particle
      draw() {
         ctx.beginPath();
         ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
         ctx.fillStyle = this.color;
         ctx.fill();
      }

      // Update particle position
      update() {
         // Check if particle hits canvas boundaries
         if (this.x > canvas.width || this.x < 0) {
            this.directionX = -this.directionX;
         }
         if (this.y > canvas.height || this.y < 0) {
            this.directionY = -this.directionY;
         }

         // Move particle
         this.x += this.directionX;
         this.y += this.directionY;

         // Draw particle
         this.draw();
      }
   }

   // Check theme color
   function getParticleColor() {
      const theme = document.documentElement.getAttribute("data-theme");
      // Dark Mode: Putih pudar, Light Mode: Abu-abu pudar
      return theme === "light" ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.4)";
   }

   function getLineColor() {
      const theme = document.documentElement.getAttribute("data-theme");
      return theme === "light" ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.05)";
   }

   // Create particle array
   function init() {
      particlesArray = [];
      // Jumlah partikel menyesuaikan lebar layar
      let numberOfParticles = (canvas.width * canvas.height) / 9000;

      for (let i = 0; i < numberOfParticles; i++) {
         let size = Math.random() * 2 + 1;
         let x = Math.random() * (innerWidth - size * 2 - size * 2) + size * 2;
         let y = Math.random() * (innerHeight - size * 2 - size * 2) + size * 2;
         let directionX = Math.random() * 0.4 - 0.2; // Kecepatan lambat
         let directionY = Math.random() * 0.4 - 0.2;
         let color = getParticleColor();

         particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
      }
   }

   // Connect particles with lines
   function connect() {
      let opacityValue = 1;
      for (let a = 0; a < particlesArray.length; a++) {
         for (let b = a; b < particlesArray.length; b++) {
            let distance =
               (particlesArray[a].x - particlesArray[b].x) *
                  (particlesArray[a].x - particlesArray[b].x) +
               (particlesArray[a].y - particlesArray[b].y) *
                  (particlesArray[a].y - particlesArray[b].y);

            // Jika jarak cukup dekat, gambar garis
            if (distance < (canvas.width / 7) * (canvas.height / 7)) {
               opacityValue = 1 - distance / 20000;
               const baseColor = getLineColor().slice(0, -6); // Ambil rgba prefix tanpa opacity
               ctx.strokeStyle = baseColor + opacityValue + ")";
               ctx.lineWidth = 1;
               ctx.beginPath();
               ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
               ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
               ctx.stroke();
            }
         }
      }
   }

   // Animation Loop
   function animate() {
      requestAnimationFrame(animate);
      ctx.clearRect(0, 0, innerWidth, innerHeight);

      for (let i = 0; i < particlesArray.length; i++) {
         particlesArray[i].update();
      }
      connect();
   }

   // Handle Resize
   window.addEventListener("resize", function () {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
      init();
   });

   // Listen for theme changes to update particle colors
   // Kita pakai MutationObserver untuk memantau perubahan atribut pada <html>
   const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
         if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
            const newColor = getParticleColor();
            particlesArray.forEach((p) => (p.color = newColor));
         }
      });
   });

   observer.observe(document.documentElement, {
      attributes: true //configure it to listen to attribute changes
   });

   init();
   animate();
})();

// ===== AOS Init (guarded) =====
if (window.AOS) {
   AOS.init({ once: false, duration: 700, easing: "ease-out-cubic" });

   // Re-trigger AOS when sections are re-entered
   (function () {
      const els = document.querySelectorAll("[data-aos]");
      if (!els.length) return;
      const io = new IntersectionObserver(
         (entries) => {
            entries.forEach((entry) => {
               const el = entry.target;
               if (!entry.isIntersecting) {
                  el.classList.remove("aos-animate");
               }
            });
         },
         { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0 }
      );
      els.forEach((el) => io.observe(el));
   })();
}

// ===== Navbar toggle (mobile, robust + desktop-safe) =====
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const MOBILE_Q = window.matchMedia("(max-width: 640px)");

function isMobile() {
   return (
      MOBILE_Q.matches || (navToggle && getComputedStyle(navToggle).display !== "none")
   );
}

function openMenu() {
   navLinks.style.display = "flex";
}
function closeMenu() {
   navLinks.style.display = "none";
}
function resetMenuForDesktop() {
   navLinks.style.display = "";
}

if (navToggle && navLinks) {
   navToggle.addEventListener("click", () => {
      const open = navLinks.style.display === "flex";
      if (open) closeMenu();
      else openMenu();
   });

   navLinks.addEventListener("click", (e) => {
      if (e.target.matches("a") && isMobile()) closeMenu();
   });

   function handleViewportChange() {
      if (!isMobile()) resetMenuForDesktop();
   }
   window.addEventListener("resize", handleViewportChange);
   if (MOBILE_Q.addEventListener)
      MOBILE_Q.addEventListener("change", handleViewportChange);

   handleViewportChange();
}

// ===== Auto year =====
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// ===== Typing effect =====
const typingEl = document.getElementById("typing");
const caretEl = document.querySelector(".caret");
const roles = [
   "QC Engineering",
   "Web Developer",
   "Network Engineer",
   "Minecraft Server Developer",
   "Welder & Fabricator"
];
let roleIdx = 0,
   charIdx = 0,
   deleting = false;

function typeLoop() {
   const current = roles[roleIdx];
   if (!deleting) {
      typingEl.textContent = current.slice(0, ++charIdx);
      if (charIdx === current.length) {
         deleting = true;
         setTimeout(typeLoop, 1800);
         return;
      }
   } else {
      typingEl.textContent = current.slice(0, --charIdx);
      if (charIdx === 0) {
         deleting = false;
         roleIdx = (roleIdx + 1) % roles.length;
      }
   }
   setTimeout(typeLoop, deleting ? 45 : 85);
}
if (typingEl) typeLoop();

// blink caret
setInterval(() => {
   if (caretEl) caretEl.style.opacity = caretEl.style.opacity === "0" ? "1" : "0";
}, 600);

// ===== Project hover: tilt effect =====
(function () {
   const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
   if (prefersReduced) return;
   document.querySelectorAll(".project-card").forEach((card) => {
      const img = card.querySelector(".card-media img");
      if (!img) return;
      function onMove(e) {
         const rect = card.getBoundingClientRect();
         const x = e.clientX - rect.left - rect.width / 2;
         const y = e.clientY - rect.top - rect.height / 2;
         const rY = (x / (rect.width / 2)) * 6;
         const rX = -(y / (rect.height / 2)) * 6;
         img.style.transform = `rotateY(${rY}deg) rotateX(${rX}deg) translateZ(0) scale(1.02)`;
      }
      function reset() {
         img.style.transform = "translateZ(0) scale(1)";
      }
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", reset);
   });
})();

// ===== Filter by category (Smooth Transition + Stagger) =====
const filterBtns = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".project-card");

filterBtns.forEach((btn) => {
   btn.addEventListener("click", () => {
      // 1. Update tombol aktif
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filterValue = btn.getAttribute("data-filter");

      // Variabel untuk delay berurutan (stagger)
      let showDelay = 0;

      projectCards.forEach((card) => {
         const category = card.getAttribute("data-category");

         // Cek apakah kartu harus ditampilkan atau disembunyikan
         const shouldShow = filterValue === "all" || filterValue === category;

         if (shouldShow) {
            // Jika harus tampil tapi sedang tersembunyi (display:none atau class hiding)
            if (card.style.display === "none" || card.classList.contains("hiding")) {
               card.style.display = "block";
               void card.offsetWidth; // Force reflow agar animasi jalan

               // Hapus class hiding dengan delay berurutan agar muncul "satu per satu"
               setTimeout(() => {
                  card.classList.remove("hiding");
               }, showDelay * 50); // Tambah 50ms untuk setiap item berikutnya
               showDelay++;
            } else {
               card.classList.remove("hiding");
            }
         } else {
            // Jika harus sembunyi
            card.classList.add("hiding");

            // Tunggu animasi selesai baru set display:none
            setTimeout(() => {
               if (card.classList.contains("hiding")) {
                  card.style.display = "none";
               }
            }, 600); // Sesuaikan dengan durasi CSS (0.6s)
         }
      });
   });
});

// ===== THEME: OS preference + manual toggle (Switch) with persistence =====
const STORAGE_KEY = "theme";
const root = document.documentElement;
const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
const themeSwitch = document.getElementById("theme-switch");

function applyTheme(t) {
   root.setAttribute("data-theme", t);
   if (themeSwitch) {
      themeSwitch.checked = t === "light";
   }
}

function initTheme() {
   const saved = localStorage.getItem(STORAGE_KEY);
   if (saved) {
      applyTheme(saved);
      return;
   }
   applyTheme(mediaQuery.matches ? "light" : "dark");
}

if (themeSwitch) {
   themeSwitch.addEventListener("change", () => {
      const next = themeSwitch.checked ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
   });
}

mediaQuery.addEventListener("change", (e) => {
   const saved = localStorage.getItem(STORAGE_KEY);
   if (saved) return;
   applyTheme(e.matches ? "light" : "dark");
});

initTheme();

// ===== Skills: animate bars on scroll (replay) =====
const skillSpans = document.querySelectorAll("#skills .bar span");
skillSpans.forEach((el) => {
   el.dataset.progress = el.getAttribute("data-progress") || el.style.width || "0%";
   el.style.width = "0%";
});
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const skillObserver = new IntersectionObserver(
   (entries) => {
      entries.forEach((entry) => {
         const group = entry.target;
         const spans = group.querySelectorAll(".bar span");
         if (entry.isIntersecting) {
            spans.forEach((s, i) => {
               const pct = s.dataset.progress || "0%";
               if (prefersReduced) {
                  s.style.transition = "none";
                  s.style.width = pct;
               } else {
                  s.style.transition = "width .9s ease";
                  setTimeout(() => {
                     s.style.width = pct;
                  }, i * 120);
               }
            });
         } else {
            spans.forEach((s) => {
               s.style.transition = "none";
               s.style.width = "0%";
               void s.offsetWidth;
            });
         }
      });
   },
   { rootMargin: "0px 0px -10% 0px", threshold: 0.3 }
);
document.querySelectorAll("[data-skill-group]").forEach((g) => skillObserver.observe(g));

// ===== Avatar: subtle tilt/parallax =====
(function () {
   const img = document.querySelector("[data-avatar-tilt]");
   const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
   if (!img || prefersReduced) return;
   const wrapper = img.closest(".hero-art");
   if (!wrapper) return;
   function onMove(e) {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rY = (x / (rect.width / 2)) * 6;
      const rX = -(y / (rect.height / 2)) * 6;
      img.style.transform = `rotateY(${rY}deg) rotateX(${rX}deg) translateZ(0)`;
   }
   function reset() {
      img.style.transform = "translateZ(0)";
   }
   wrapper.addEventListener("mousemove", onMove);
   wrapper.addEventListener("mouseleave", reset);
})();

// ===== Restart CSS animations =====
(function () {
   const restartables = document.querySelectorAll("[data-anim-restart]");
   if (!restartables.length) return;
   const io = new IntersectionObserver(
      (entries) => {
         entries.forEach((entry) => {
            const el = entry.target;
            if (!entry.isIntersecting) {
               el.style.animation = "none";
            } else {
               void el.offsetWidth; // reflow
               el.style.animation = "";
            }
         });
      },
      { threshold: 0 }
   );
   restartables.forEach((el) => io.observe(el));
})();

// ===== Toast utility =====
function showToast(message, type) {
   const el = document.getElementById("toast");
   if (!el) return;
   el.textContent = message;
   el.setAttribute("data-type", type === "err" ? "err" : "ok");
   el.classList.add("show");
   clearTimeout(el._hide);
   el._hide = setTimeout(() => el.classList.remove("show"), 3800);
   el.onclick = () => el.classList.remove("show");
}

// ===== Injil Function (Replacement for Alert) =====
function Injil() {
   showToast("Karena masa depan sungguh ada, dan harapanmu tidak akan hilang.", "ok");
}

// ===== Contact form: toast (no redirect) =====
(function () {
   const form = document.getElementById("contact-form");
   const status = document.getElementById("form-status");
   if (!form || !status) return;
   const endpoint = (form.getAttribute("action") || "").trim();

   form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.textContent = "";
      form.classList.add("is-sending");

      const fd = new FormData(form);
      const name = String(fd.get("name") || "").trim();
      const email = String(fd.get("email") || "").trim();
      const message = String(fd.get("message") || "").trim();
      const honey = String(fd.get("_gotcha") || "");

      if (honey) {
         form.classList.remove("is-sending");
         return;
      }

      if (!name || !email || !message) {
         status.textContent = "Isi nama, email & pesan dulu ya.";
         status.className = "status-err";
         form.classList.remove("is-sending");
         showToast("Isi nama, email & pesan dulu ya.", "err");
         return;
      }

      fd.append("page", location.href);

      try {
         const res = await fetch(endpoint, {
            method: "POST",
            body: fd,
            headers: { Accept: "application/json" }
         });

         if (res.ok) {
            status.textContent = "Thanks! Your message was sent ✅";
            status.className = "status-ok";
            form.reset();
            showToast("Pesan terkirim. Makasih! ✅", "ok");
         } else {
            const data = await res.json().catch(() => null);
            const msg =
               data && data.errors
                  ? data.errors.map((e) => e.message).join(", ")
                  : "Gagal mengirim. Coba lagi nanti.";
            status.textContent = msg;
            status.className = "status-err";
            showToast(msg, "err");
         }
      } catch (err) {
         status.textContent = "Jaringan error. Cek koneksi kamu ya.";
         status.className = "status-err";
         showToast("Jaringan error. Coba lagi nanti.", "err");
      } finally {
         form.classList.remove("is-sending");
      }
   });
})();
