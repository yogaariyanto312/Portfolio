// ===== AOS Init (guarded) =====
if (window.AOS) {
   AOS.init({ once: false, duration: 700, easing: "ease-out-cubic" });

   // Re-trigger AOS when sections are re-entered: remove 'aos-animate' when out of view
   (function () {
      const els = document.querySelectorAll("[data-aos]");
      if (!els.length) return;
      const io = new IntersectionObserver(
         (entries) => {
            entries.forEach((entry) => {
               const el = entry.target;
               if (!entry.isIntersecting) {
                  el.classList.remove("aos-animate"); // so it can animate again next time
               }
            });
         },
         { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0 }
      );
      els.forEach((el) => io.observe(el));
   })();
}

// alert Injil
function Injil() { // Fungsi Injil
   alert("Karena masa depan sungguh ada, dan harapanmu tidak akan hilang."); // Tampilkan alert
}


// ===== Navbar toggle (mobile, robust + desktop-safe) =====
const navToggle = document.querySelector(".nav-toggle");
const navLinks  = document.querySelector(".nav-links");
const MOBILE_Q  = window.matchMedia("(max-width: 640px)");

function isMobile() {
  // mobile kalau breakpoint match ATAU burger kelihatan
  return MOBILE_Q.matches || (navToggle && getComputedStyle(navToggle).display !== "none");
}

function openMenu() {
  navLinks.style.display = "flex";
}
function closeMenu() {
  navLinks.style.display = "none";
}
function resetMenuForDesktop() {
  // biar CSS yang ngatur (desktop default flex)
  navLinks.style.display = "";
}

if (navToggle && navLinks) {
  // Toggle by burger
  navToggle.addEventListener("click", () => {
    const open = navLinks.style.display === "flex";
    if (open) closeMenu(); else openMenu();
  });

  // Klik link: auto-hide hanya di mobile
  navLinks.addEventListener("click", (e) => {
    if (e.target.matches("a") && isMobile()) closeMenu();
  });

  // Saat viewport berubah: kalau bukan mobile, bersihin inline style
  function handleViewportChange() {
    if (!isMobile()) resetMenuForDesktop();
  }
  window.addEventListener("resize", handleViewportChange);
  MOBILE_Q.addEventListener?.("change", handleViewportChange);

  // Safety: sync awal sesuai viewport
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

// ===== Project hover: same style as avatar (subtle tilt on image only) =====
(function () {
   const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
   if (prefersReduced) return; // keep it calm
   document.querySelectorAll(".project-card").forEach((card) => {
      const img = card.querySelector(".card-media img");
      if (!img) return;
      function onMove(e) {
         const rect = card.getBoundingClientRect();
         const x = e.clientX - rect.left - rect.width / 2;
         const y = e.clientY - rect.top - rect.height / 2;
         const rY = (x / (rect.width / 2)) * 6; // left/right
         const rX = -(y / (rect.height / 2)) * 6; // up/down
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
      const f = btn.getAttribute("data-filter");
      projectCards.forEach((card) => {
         const cat = card.getAttribute("data-category");
         card.style.display = f === "all" || f === cat ? "block" : "none";
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
   if (saved) return; // respect manual choice
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

// ===== Avatar: subtle tilt/parallax (disabled if reduced motion)
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

// ===== Restart CSS animations when element re-enters viewport
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

// ===== Accessibility: disable tilt for keyboard navigation =====
document.addEventListener("keydown", (e) => {
   if (e.key === "Tab") {
      document.querySelectorAll(".project-card .card-media img").forEach((img) => {
         img.style.transform = "translateZ(0) scale(1)";
      });
   }
});

// ===== Toast utility (centered, auto-dismiss) =====
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

// ===== Contact form: toast (no redirect) — FormData (paling kompat) =====
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

    // Honeypot anti-bot
    if (honey) { form.classList.remove("is-sending"); return; }

    if (!name || !email || !message) {
      status.textContent = "Isi nama, email & pesan dulu ya.";
      status.className = "status-err";
      form.classList.remove("is-sending");
      showToast("Isi nama, email & pesan dulu ya.", "err");
      return;
    }

    // Tambahan metadata (opsional, useful di email)
    fd.append("page", location.href);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: fd,                        // <— KIRIM FORMDATA (biarin browser set Content-Type)
        headers: { Accept: "application/json" } // <— biar responnya JSON
      });

      if (res.ok) {
        status.textContent = "Thanks! Your message was sent ✅";
        status.className = "status-ok";
        form.reset();
        showToast("Pesan terkirim. Makasih! ✅", "ok");
      } else {
        // Coba baca error detail dari Formspree
        const data = await res.json().catch(() => null);
        const msg = data && data.errors
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


// ===== Lightweight self-tests (console) =====
(function tests() {
   const results = [];
   function t(name, fn) {
      try {
         fn();
         results.push({ name, ok: true });
      } catch (e) {
         results.push({ name, ok: false, e });
      }
   }
   // ===== Lightweight self-tests (console) =====
   (function tests() {
      const results = [];
      function t(name, fn) {
         try {
            fn();
            results.push({ name, ok: true });
         } catch (e) {
            results.push({ name, ok: false, e });
         }
      }
      // Test 1: inline SVG URLs encoded (no raw '#')
      t("SVG data URLs encoded", () => {
         document.querySelectorAll(".card-media img, #avatar").forEach((img) => {
            const src = img.getAttribute("src") || "";
            if (src.startsWith("data:image/svg+xml")) {
               if (src.includes("#")) throw new Error("Found raw # in data URL");
            }
         });
      });
      // Test 2: skills bars primed to 0%
      t("Skills bars primed", () => {
         document.querySelectorAll("#skills .bar span").forEach((s) => {
            if (s.style.width !== "0%") throw new Error("bar not reset");
         });
      });
      // Test 3: contact form has name/email/message fields
      t("Contact form has name/email/message", () => {
         const f = document.getElementById("contact-form");
         if (!f) throw new Error("form missing");
         ["name", "email", "message"].forEach((n) => {
            if (!f.querySelector(`[name="${n}"]`)) throw new Error(`${n} field missing`);
         });
      });
      // Test 4: navbar links exist & point to sections
      t("Navbar links valid", () => {
         document.querySelectorAll(".nav-links a").forEach((a) => {
            const id = (a.getAttribute("href") || "").replace("#", "");
            if (id && !document.getElementById(id))
               throw new Error("missing section #" + id);
         });
      });
      // Test 5: theme switch reflects theme
      t("Theme switch reflects theme", () => {
         const root = document.documentElement;
         const sw = document.getElementById("theme-switch");
         if (!sw) throw new Error("switch missing");
         const theme = root.getAttribute("data-theme");
         if (theme === "light" && !sw.checked) throw new Error("light but unchecked");
         if (theme !== "light" && sw.checked) throw new Error("dark but checked");
      });
      const ok = results.filter((r) => r.ok).length;
      const fail = results.length - ok;
      console.log(
         `[Portfolio tests] ${ok}/${results.length} passed${
            fail ? `, ${fail} failed` : ""
         }`,
         results
      );
   })();
})();
