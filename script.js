// ========== THEME ==========
const themeToggles = document.querySelectorAll(".theme-toggle");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

function setTheme(theme, persist = false) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggles.forEach((btn) =>
    btn.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    )
  );
  if (persist) localStorage.setItem("theme", theme);
}

(function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") {
    setTheme(saved, false);
  } else {
    setTheme(prefersDark.matches ? "dark" : "light", false);
  }
})();
themeToggles.forEach((btn) => {
  btn.addEventListener("click", () => {
    const current =
      document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current === "dark" ? "light" : "dark", true);
  });
});
prefersDark.addEventListener("change", (e) => {
  const saved = localStorage.getItem("theme");
  if (!saved) setTheme(e.matches ? "dark" : "light", false);
});

// ========== MOBILE NAV ==========
const nav = document.getElementById("nav");
const menuBtn = document.querySelector(".menu-btn");
if (menuBtn && nav) {
  menuBtn.addEventListener("click", () => nav.classList.toggle("open"));
  nav
    .querySelectorAll("a")
    .forEach((a) =>
      a.addEventListener("click", () => nav.classList.remove("open"))
    );
}

// ========== SMOOTH SCROLL (same-page anchors only) ==========
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const id = link.getAttribute("href");
    if (id && id.length > 1) {
      const el = document.querySelector(id);
      if (el) {
        e.preventDefault();
        const y = el.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
  });
});

// ========== HERO PHONE AUTOPLAY (guarded) ==========
const phoneSlides = Array.from(document.querySelectorAll(".screen .slide"));
let psIndex = 0;
function cyclePhone() {
  phoneSlides.forEach((s, i) => s.classList.toggle("active", i === psIndex));
  if (phoneSlides.length) psIndex = (psIndex + 1) % phoneSlides.length;
}
let phoneTimer = null;
function startPhoneTimer() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!phoneSlides.length) return;
  stopPhoneTimer();
  phoneTimer = setInterval(cyclePhone, 2500);
}
function stopPhoneTimer() {
  if (phoneTimer) clearInterval(phoneTimer);
}
startPhoneTimer();
const phoneEl = document.querySelector(".phone");
if (phoneEl) {
  phoneEl.addEventListener("mouseenter", stopPhoneTimer);
  phoneEl.addEventListener("mouseleave", startPhoneTimer);
}

// ========== REVEAL ON SCROLL ==========
const reveals = document.querySelectorAll(".reveal");
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("show"));
}

// ========== SLIDER (guarded) ==========
class Slider {
  constructor(root) {
    this.root = root;
    this.track = root.querySelector(".slider-track");
    this.dotsWrap = root.querySelector(".slider-nav");
    this.prevBtn = root.querySelector("[data-prev]");
    this.nextBtn = root.querySelector("[data-next]");
    this.index = 0;
    this.count = this.track.children.length;
    this.buildDots();
    this.update();
    this.prevBtn.addEventListener("click", () => this.go(this.index - 1));
    this.nextBtn.addEventListener("click", () => this.go(this.index + 1));
    this.root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") this.go(this.index - 1);
      if (e.key === "ArrowRight") this.go(this.index + 1);
    });
    this.auto();
    this.root.addEventListener("mouseenter", () => clearInterval(this.timer));
    this.root.addEventListener("mouseleave", () => this.auto());
    window.addEventListener("resize", () => this.update());
  }
  buildDots() {
    this.dotsWrap.innerHTML = "";
    this.dots = [];
    for (let i = 0; i < this.count; i++) {
      const b = document.createElement("button");
      b.className = "dot" + (i === 0 ? " active" : "");
      b.setAttribute("aria-label", "Go to slide " + (i + 1));
      b.addEventListener("click", () => this.go(i));
      this.dotsWrap.appendChild(b);
      this.dots.push(b);
    }
  }
  go(i) {
    this.index = (i + this.count) % this.count;
    this.update();
  }
  update() {
    const x = -this.index * this.root.clientWidth;
    this.track.style.transform = `translateX(${x}px)`;
    this.dots.forEach((d, i) => d.classList.toggle("active", i === this.index));
  }
  auto() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    this.timer = setInterval(() => this.go(this.index + 1), 5000);
  }
  injectSlidesFromFiles(files) {
    const frag = document.createDocumentFragment();
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const card = document.createElement("article");
      card.className = "slide-card";
      const img = document.createElement("div");
      img.className = "img";
      img.style.backgroundSize = "cover";
      img.style.backgroundPosition = "center";
      const reader = new FileReader();
      reader.onload = (e) =>
        (img.style.backgroundImage = `url('${e.target.result}')`);
      reader.readAsDataURL(file);
      const content = document.createElement("div");
      const h3 = document.createElement("h3");
      h3.textContent = file.name.replace(/\.[^.]+$/, "");
      const p = document.createElement("p");
      p.textContent = "Slide imported from your presentation.";
      content.appendChild(h3);
      content.appendChild(p);
      card.appendChild(img);
      card.appendChild(content);
      frag.appendChild(card);
    }
    if (frag.childNodes.length) {
      this.track.innerHTML = "";
      this.track.appendChild(frag);
      this.count = this.track.children.length;
      this.index = 0;
      this.buildDots();
      this.update();
    }
  }
}
const sliderRoot = document.querySelector('[data-slider="screens"]');
let screensSlider = null;
if (sliderRoot) screensSlider = new Slider(sliderRoot);

// ========== CONTACT FORM VALIDATION (guarded) ==========
const form = document.getElementById("contactForm");
const formMsg = document.getElementById("formMsg");
if (form && formMsg) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const errors = [];
    if (!data.name || data.name.trim().length < 2)
      errors.push("Please enter your name.");
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errors.push("Please enter a valid email.");
    if (!data.message || data.message.trim().length < 10)
      errors.push("Message should be at least 10 characters.");
    if (errors.length) {
      formMsg.style.color = "var(--brand)";
      formMsg.textContent = errors.join(" ");
      return;
    }
    formMsg.style.color = "var(--success)";
    formMsg.textContent =
      "Thanks! We received your message. We’ll get back to you shortly.";
    form.reset();
  });
}

// Back to top (guarded, improved)
const toTop = document.querySelector(".to-top");
if (toTop) {
  const threshold = Math.max(200, Math.round(window.innerHeight * 0.6));
  const onScroll = () => {
    if (window.scrollY > threshold) toTop.classList.add("show");
    else toTop.classList.remove("show");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // set initial state

  toTop.addEventListener("click", (e) => {
    e.preventDefault();
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? "auto"
      : "smooth";
    if ("scrollTo" in window) {
      window.scrollTo({ top: 0, behavior });
    } else {
      // Fallback (very old browsers)
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  });
}
