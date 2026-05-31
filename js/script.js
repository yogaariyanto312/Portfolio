// ===== Cache Manager =====
// Setiap kali push perubahan ke production:
//   1. Update APP_VERSION di sini (format: YYYYMMDD + 2 digit urutan)
//   2. Update ?v= di index.html (css/style.css & js/script.js)
const APP_VERSION = '2026053100';

(function () {
   try {
      if (localStorage.getItem('app_v') === APP_VERSION) return;

      const savedTheme = localStorage.getItem('theme'); // jaga preferensi tema
      localStorage.clear();
      sessionStorage.clear();

      // Hapus Cache Storage API (service worker cache)
      if ('caches' in window) {
         caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
      }

      if (savedTheme) localStorage.setItem('theme', savedTheme);
      localStorage.setItem('app_v', APP_VERSION);
   } catch (_) { /* silent fail — jangan block app */ }
})();

// ===== Device capability detection =====
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isLowEnd = (() => {
   const cores = navigator.hardwareConcurrency || 4;
   const mem   = navigator.deviceMemory || 4; // Chrome only, fallback 4
   return prefersReducedMotion || cores <= 2 || mem <= 2;
})();
if (isLowEnd) document.documentElement.classList.add("low-perf");

/* Mencegah Inspect Element — di luar canvas IIFE agar selalu aktif */
document.addEventListener('contextmenu', (e) => {
   e.preventDefault();
   showToast("Klik kanan dinonaktifkan!");
});
document.addEventListener('keydown', (e) => {
   if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
      (e.ctrlKey && e.key === 'U')
   ) {
      e.preventDefault();
      showToast("Inspect Element dinonaktifkan!");
   }
});

// ===== Background Animation (Network Particles) =====
(function () {
   const canvas = document.getElementById("bg-canvas");
   if (!canvas || isLowEnd) return;

   const ctx = canvas.getContext("2d");
   let particlesArray;
   let animId;

   canvas.width = window.innerWidth;
   canvas.height = window.innerHeight;

   const MAX_PARTICLES = window.innerWidth < 768 ? 40 : 80;

   class Particle {
      constructor(x, y, directionX, directionY, size, color) {
         this.x = x;
         this.y = y;
         this.directionX = directionX;
         this.directionY = directionY;
         this.size = size;
         this.color = color;
      }

      draw() {
         ctx.beginPath();
         ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
         ctx.fillStyle = this.color;
         ctx.fill();
      }

      update() {
         if (this.x > canvas.width  || this.x < 0) this.directionX = -this.directionX;
         if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;
         this.x += this.directionX;
         this.y += this.directionY;
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

   function init() {
      particlesArray = [];
      // Cap jumlah partikel biar tidak O(n²) kebablasan
      const count = Math.min(
         Math.floor((canvas.width * canvas.height) / 9000),
         MAX_PARTICLES
      );
      const color = getParticleColor();
      for (let i = 0; i < count; i++) {
         const size = Math.random() * 2 + 1;
         const x = Math.random() * (canvas.width  - size * 4) + size * 2;
         const y = Math.random() * (canvas.height - size * 4) + size * 2;
         const dx = Math.random() * 0.4 - 0.2;
         const dy = Math.random() * 0.4 - 0.2;
         particlesArray.push(new Particle(x, y, dx, dy, size, color));
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

   function animate() {
      animId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesArray.length; i++) particlesArray[i].update();
      connect();
   }

   // Debounce resize — reinit hanya setelah user selesai resize (bukan setiap pixel)
   let resizeTimer;
   window.addEventListener("resize", function () {
      cancelAnimationFrame(animId);
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
         canvas.width  = window.innerWidth;
         canvas.height = window.innerHeight;
         init();
         animate();
      }, 200);
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

// ===== Home nav link — scroll to top, clean URL =====
document.querySelector('a[href="#home"]')?.addEventListener("click", (e) => {
   e.preventDefault();
   window.scrollTo({ top: 0, behavior: "smooth" });
   history.replaceState(null, "", location.pathname);
});

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
         if (caretEl) caretEl.classList.remove("is-typing"); // blink saat pause
         setTimeout(typeLoop, 1800);
         return;
      }
      if (caretEl) caretEl.classList.add("is-typing"); // solid saat ngetik
   } else {
      if (caretEl) caretEl.classList.add("is-typing"); // solid saat hapus
      typingEl.textContent = current.slice(0, --charIdx);
      if (charIdx === 0) {
         deleting = false;
         roleIdx = (roleIdx + 1) % roles.length;
      }
   }
   setTimeout(typeLoop, deleting ? 45 : 75);
}
if (typingEl) typeLoop();

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

// ===== Filter by category =====
const filterBtns = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".project-card");

filterBtns.forEach((btn) => {
   btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filterValue = btn.getAttribute("data-filter");
      let showIdx = 0;

      projectCards.forEach((card) => {
         const shouldShow = filterValue === "all" || filterValue === card.dataset.category;
         const isHidden = card.style.display === "none" || card.classList.contains("hiding");

         if (!shouldShow) {
            // Animate keluar, lalu hapus dari flow
            card.classList.add("hiding");
            setTimeout(() => {
               if (card.classList.contains("hiding")) card.style.display = "none";
            }, 400);
         } else if (isHidden) {
            // Hanya kartu yang benar-benar tersembunyi yang animate masuk dengan stagger
            card.style.transition = "none";
            card.classList.add("hiding");
            card.style.display = "";
            void card.offsetWidth;
            card.style.transition = "";
            setTimeout(() => card.classList.remove("hiding"), showIdx * 80);
            showIdx++;
         } else {
            // Kartu sudah visible — tidak perlu re-animate, cukup pastikan state bersih
            card.classList.remove("hiding");
         }
      });
   });
});

// ===== THEME: OS preference + manual toggle (Switch) with persistence =====
const STORAGE_KEY = "theme";
const root = document.documentElement;
const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
const themeSwitch = document.getElementById("theme-switch");
const themeSwitchMobile = document.getElementById("theme-switch-mobile");

function applyTheme(t) {
   root.setAttribute("data-theme", t);
   const isLight = t === "light";
   if (themeSwitch) themeSwitch.checked = isLight;
   if (themeSwitchMobile) themeSwitchMobile.checked = isLight;
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

if (themeSwitchMobile) {
   themeSwitchMobile.addEventListener("change", () => {
      const next = themeSwitchMobile.checked ? "light" : "dark";
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

// ===== Stats counter animation =====
(function () {
   const statEls = document.querySelectorAll("[data-count]");
   if (!statEls.length) return;

   function animateCounter(el) {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || "";
      const duration = 1600;
      const start = performance.now();

      el._rafId && cancelAnimationFrame(el._rafId);

      function step(now) {
         const elapsed = now - start;
         const progress = Math.min(elapsed / duration, 1);
         const eased = 1 - Math.pow(1 - progress, 3);
         el.textContent = Math.round(eased * target) + suffix;
         if (progress < 1) el._rafId = requestAnimationFrame(step);
      }
      el._rafId = requestAnimationFrame(step);
   }

   const counterObserver = new IntersectionObserver(
      (entries) => {
         entries.forEach((entry) => {
            if (entry.isIntersecting) {
               animateCounter(entry.target);
            } else {
               entry.target._rafId && cancelAnimationFrame(entry.target._rafId);
               entry.target.textContent = "0" + (entry.target.dataset.suffix || "");
            }
         });
      },
      { threshold: 0.6 }
   );
   statEls.forEach((el) => counterObserver.observe(el));
})();

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

// ===== Card media: blurred background from thumbnail =====
document.querySelectorAll(".card-media").forEach((el) => {
   const img = el.querySelector("img");
   if (img) el.style.setProperty("--bg-img", `url('${img.getAttribute("src")}')`);
});

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
   if (!endpoint) { console.warn("[Form] action attribute missing"); return; }

   // Hapus readonly dari honeypot agar FormData bisa membacanya,
   // lalu restore setelah submit
   const honeyInput = form.querySelector('[name="_gotcha"]');

   form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.textContent = "";
      form.classList.add("is-sending");

      // Temporarily allow honeypot to be read by FormData
      if (honeyInput) honeyInput.removeAttribute("readonly");
      const fd = new FormData(form);
      if (honeyInput) honeyInput.setAttribute("readonly", "");

      const name    = String(fd.get("name")    || "").trim();
      const email   = String(fd.get("email")   || "").trim();
      const message = String(fd.get("message") || "").trim();
      const honey   = String(fd.get("_gotcha") || "").trim();

      if (honey) {
         // Bot detected — silent fail with generic message
         form.classList.remove("is-sending");
         showToast("Terjadi kesalahan. Refresh halaman dan coba lagi.", "err");
         return;
      }

      if (!name || !email || !message) {
         form.classList.remove("is-sending");
         showToast("Isi nama, email & pesan dulu ya.", "err");
         status.textContent = "Isi nama, email & pesan dulu ya.";
         status.className = "status-err";
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
            status.textContent = "Pesan terkirim. Makasih! ✅";
            status.className = "status-ok";
            form.reset();
            showToast("Pesan terkirim. Makasih! ✅", "ok");
         } else {
            const data = await res.json().catch(() => null);
            const msg = data?.errors
               ? data.errors.map((err) => err.message).join(", ")
               : "Gagal mengirim. Coba lagi nanti.";
            status.textContent = msg;
            status.className = "status-err";
            showToast(msg, "err");
         }
      } catch (_) {
         status.textContent = "Jaringan error. Cek koneksi kamu ya.";
         status.className = "status-err";
         showToast("Jaringan error. Cek koneksi kamu ya.", "err");
      } finally {
         form.classList.remove("is-sending");
      }
   });
})();

// ===== i18n — Bilingual (ID / EN) =====
const TRANSLATIONS = {
   id: {
      'nav.home': 'Beranda', 'nav.about': 'Tentang', 'nav.skills': 'Skills',
      'nav.experience': 'Experience', 'nav.projects': 'Projects', 'nav.contact': 'Kontak',
      'hero.eyebrow': 'Halo, saya',
      'hero.desc': 'Karena masa depan sungguh ada, dan harapanmu tidak akan hilang.',
      'hero.btn.projects': 'Lihat Project', 'hero.btn.contact': 'Kontak Saya',
      'about.title': 'About Me', 'about.desc': 'Sedikit informasi saya',
      'about.who.title': 'Siapa Saya?',
      'about.who.text': 'Saya <strong>QC Engineer</strong> di industri manufaktur listrik, sekaligus developer yang gemar mengeksplorasi <strong>web</strong> dan <strong>jaringan</strong>. Standar presisi yang saya terapkan sehari-hari turut membentuk cara saya menulis kode — <em>teliti, terstruktur, dan scalable.</em>',
      'about.stat.exp': 'Years Exp', 'about.stat.projects': 'Projects', 'about.stat.committed': 'Committed',
      'about.soft.title': 'Soft Skills', 'about.mission.title': 'Misi & Fokus',
      'about.mission.text': 'Berfokus pada tantangan yang berdampak nyata — membangun sistem yang andal, menekan defect, dan menciptakan <em>user experience</em> yang intuitif.',
      'skills.title': 'Skills', 'skills.desc': 'Skills yang saya miliki dan yang lagi saya kembangkan.',
      'exp.title': 'Experience', 'exp.desc': 'Pengalaman kerja dan magang saya.',
      'exp.job1.title': 'Quality Control',
      'exp.job1.desc': 'Menjalankan quality control di lini produksi komponen listrik — mulai dari inspeksi visual dan dimensional welding, verifikasi WPS, hingga dokumentasi defect dan koordinasi perbaikan bersama tim produksi.',
      'exp.job2.title': 'Quality Control Intern',
      'exp.job2.desc': 'Mendukung proses QC perangkat CCTV melalui burn-in test, inspeksi jaringan, verifikasi firmware, dan penanganan unit DOA — pengalaman yang membentuk dasar pendekatan sistematis saya dalam quality assurance.',
      'projects.title': 'Projects', 'projects.desc': 'Karya dan eksperimen terbaru.',
      'filter.all': 'All', 'filter.web': 'Web', 'filter.server': 'Server', 'filter.game': 'Game',
      'p1.name': 'NeedTwoGoo', 'p1.desc': 'Server Minecraft self-hosted yang dikelola dengan AMP Panel dan Docker — dirancang untuk memberikan pengalaman bermain yang stabil dan mudah diakses.',
      'p2.name': 'Card-LinkTree Clone', 'p2.desc': 'Halaman link personal bergaya modern dengan efek glassmorphism dan animasi halus — satu tautan untuk semua profil sosial media dan karya.',
      'p3.name': 'QC Process Tracker', 'p3.desc': 'Dashboard berbasis web untuk memantau dan mendokumentasikan proses quality control di lini produksi — mempermudah pencatatan inspeksi dan pelacakan defect.',
      'p4.name': 'TowerGame', 'p4.desc': 'Game stack tower berbasis browser yang menantang refleks dan presisi pemain. Dibangun murni dengan HTML, CSS, dan JavaScript tanpa library game engine.',
      'p5.name': 'Snake Games', 'p5.desc': 'Implementasi klasik game ular dengan kontrol yang responsif dan sistem high score. Dibangun dengan JavaScript vanilla untuk pengalaman bermain yang mulus langsung di browser.',
      'p6.name': 'Chess Games', 'p6.desc': 'Game catur interaktif berbasis web dengan logika pergerakan bidak yang lengkap. Cocok untuk berlatih strategi catur kapan saja langsung dari browser.',
      'p7.name': 'FlappyPixel Games', 'p7.desc': 'Klona Flappy Bird dengan estetika pixel art yang nostalgik. Tantang refleks Anda melewati rintangan yang semakin sulit dengan setiap sesi permainan.',
      'contact.title': 'Kontak', 'contact.desc': 'Punya project/kolab? Masuk aja ke DM.',
      'contact.card.title': 'Hubungi Saya',
      'form.name.label': 'Your name', 'form.name.ph': 'cth. Budi Santoso',
      'form.email.label': 'Your email', 'form.email.ph': 'email@contoh.com',
      'form.msg.label': 'Your message', 'form.msg.ph': 'Tulis pesanmu...',
      'form.send': 'Kirim',
      'reach.email': 'Email', 'reach.ig': 'Instagram', 'reach.web': 'Website',
      'footer': '© {year} Yoga Ariyanto — All Rights Reserved.',
      'roles': ['QC Engineering', 'Web Developer', 'Network Engineer', 'Server Developer', 'Welder & Fabricator'],
   },
   en: {
      'nav.home': 'Home', 'nav.about': 'About', 'nav.skills': 'Skills',
      'nav.experience': 'Experience', 'nav.projects': 'Projects', 'nav.contact': 'Contact',
      'hero.eyebrow': 'Hello, I am',
      'hero.desc': 'For surely there is a future, and your hope will not be cut off.',
      'hero.btn.projects': 'View Projects', 'hero.btn.contact': 'Contact Me',
      'about.title': 'About Me', 'about.desc': 'A little about myself',
      'about.who.title': 'Who Am I?',
      'about.who.text': 'I\'m a <strong>QC Engineer</strong> in the electrical manufacturing industry, also a developer who loves exploring <strong>web</strong> and <strong>networking</strong>. The precision standards I apply daily also shape how I write code — <em>careful, structured, and scalable.</em>',
      'about.stat.exp': 'Years Exp', 'about.stat.projects': 'Projects', 'about.stat.committed': 'Committed',
      'about.soft.title': 'Soft Skills', 'about.mission.title': 'Mission & Focus',
      'about.mission.text': 'Focused on impactful challenges — building reliable systems, reducing defects, and creating intuitive <em>user experiences</em>.',
      'skills.title': 'Skills', 'skills.desc': 'Skills I have and am currently developing.',
      'exp.title': 'Experience', 'exp.desc': 'My work and internship experience.',
      'exp.job1.title': 'Quality Control',
      'exp.job1.desc': 'Running quality control on electrical component production lines — from visual and dimensional welding inspection, WPS verification, to defect documentation and repair coordination with the production team.',
      'exp.job2.title': 'Quality Control Intern',
      'exp.job2.desc': 'Supporting CCTV device QC processes through burn-in testing, network inspection, firmware verification, and DOA unit handling — experience that formed the foundation of my systematic approach to quality assurance.',
      'projects.title': 'Projects', 'projects.desc': 'Latest works and experiments.',
      'filter.all': 'All', 'filter.web': 'Web', 'filter.server': 'Server', 'filter.game': 'Game',
      'p1.name': 'NeedTwoGoo', 'p1.desc': 'A self-hosted Minecraft server managed with AMP Panel and Docker — designed to provide a stable and easily accessible gaming experience.',
      'p2.name': 'Card-LinkTree Clone', 'p2.desc': 'A modern personal link page with glassmorphism effects and smooth animations — one link for all social media profiles and works.',
      'p3.name': 'QC Process Tracker', 'p3.desc': 'A web-based dashboard for monitoring and documenting quality control processes on production lines — simplifying inspection recording and defect tracking.',
      'p4.name': 'TowerGame', 'p4.desc': 'A browser-based stack tower game that challenges player reflexes and precision. Built purely with HTML, CSS, and JavaScript without a game engine library.',
      'p5.name': 'Snake Games', 'p5.desc': 'Classic snake game implementation with responsive controls and a high score system. Built with vanilla JavaScript for a smooth in-browser experience.',
      'p6.name': 'Chess Games', 'p6.desc': 'An interactive web-based chess game with complete piece movement logic. Perfect for practicing chess strategy anytime directly in the browser.',
      'p7.name': 'FlappyPixel Games', 'p7.desc': 'A Flappy Bird clone with nostalgic pixel art aesthetics. Challenge your reflexes navigating increasingly difficult obstacles with each session.',
      'contact.title': 'Contact', 'contact.desc': 'Have a project or collab? Slide into my DMs.',
      'contact.card.title': 'Get in Touch',
      'form.name.label': 'Your name', 'form.name.ph': 'e.g. John Doe',
      'form.email.label': 'Your email', 'form.email.ph': 'email@example.com',
      'form.msg.label': 'Your message', 'form.msg.ph': 'Write your message...',
      'form.send': 'Send',
      'reach.email': 'Email', 'reach.ig': 'Instagram', 'reach.web': 'Website',
      'footer': '© {year} Yoga Ariyanto — All Rights Reserved.',
      'roles': ['QC Engineering', 'Web Developer', 'Network Engineer', 'Server Developer', 'Welder & Fabricator'],
   }
};

let currentLang = localStorage.getItem('lang') || 'id';

function applyLang(lang) {
   const t = TRANSLATIONS[lang];
   currentLang = lang;
   localStorage.setItem('lang', lang);
   document.documentElement.setAttribute('lang', lang === 'id' ? 'id' : 'en');

   // Text content
   document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.textContent = t[key].replace('{year}', new Date().getFullYear());
   });

   // Inner HTML (bold/italic inside text)
   document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (t[key] !== undefined) el.innerHTML = t[key];
   });

   // Placeholders
   document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (t[key] !== undefined) el.setAttribute('placeholder', t[key]);
   });

   // Lang toggle button label
   const btn = document.getElementById('lang-toggle');
   if (btn) btn.textContent = lang === 'id' ? 'EN' : 'ID';

   // Update typing roles
   if (t.roles) {
      roles.length = 0;
      t.roles.forEach(r => roles.push(r));
   }
}

const langBtn = document.getElementById('lang-toggle');
if (langBtn) {
   langBtn.addEventListener('click', () => {
      applyLang(currentLang === 'id' ? 'en' : 'id');
   });
}

applyLang(currentLang);
