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
  // Switch logos based on theme
  const lightLogos = document.querySelectorAll(".logo-light");
  const darkLogos = document.querySelectorAll(".logo-dark");
  lightLogos.forEach(logo => logo.style.display = theme === "dark" ? "none" : "block");
  darkLogos.forEach(logo => logo.style.display = theme === "dark" ? "block" : "none");
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
const menuToggle = document.getElementById("menu-toggle");
const navbar = document.getElementById("nav");

menuToggle.addEventListener("click", () => {
  navbar.classList.toggle("show");
});

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

// ========== HORIZONTAL SHOTS CAROUSEL (guarded) ==========
(function initShotsCarousels() {
  const carousels = document.querySelectorAll("[data-shots-carousel]");
  if (!carousels.length) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const getStep = (scroller) => {
    const items = Array.from(scroller.children).filter(
      (el) => el.nodeType === 1
    );
    if (items.length >= 2) {
      const delta = items[1].offsetLeft - items[0].offsetLeft;
      if (delta > 0) return delta;
    }
    if (items.length === 1) return items[0].getBoundingClientRect().width;
    return Math.max(240, Math.round(scroller.clientWidth * 0.85));
  };

  const updateState = (carousel, scroller, prevBtn, nextBtn) => {
    const maxLeft = scroller.scrollWidth - scroller.clientWidth;
    const left = scroller.scrollLeft;
    const atStart = left <= 2;
    const atEnd = left >= maxLeft - 2;
    const overflow = maxLeft > 2;

    prevBtn.disabled = !overflow || atStart;
    nextBtn.disabled = !overflow || atEnd;
    carousel.classList.toggle("is-overflowing", overflow);
  };

  carousels.forEach((carousel) => {
    const scroller = carousel.querySelector(".shots-scroller");
    const prevBtn = carousel.querySelector("[data-shots-prev]");
    const nextBtn = carousel.querySelector("[data-shots-next]");
    if (!scroller || !prevBtn || !nextBtn) return;

    if (prefersReducedMotion) scroller.style.scrollBehavior = "auto";

    let step = getStep(scroller);

    const scrollByStep = (dir) => {
      step = getStep(scroller);
      const delta = dir * step;
      try {
        scroller.scrollBy({
          left: delta,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      } catch {
        scroller.scrollLeft += delta;
      }
    };

    prevBtn.addEventListener("click", () => scrollByStep(-1));
    nextBtn.addEventListener("click", () => scrollByStep(1));

    scroller.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollByStep(-1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollByStep(1);
      }
    });

    const onScroll = () => updateState(carousel, scroller, prevBtn, nextBtn);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
  });
})();

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

// ========== ANIMATED COUNTERS ==========
const counters = document.querySelectorAll(".counter");

// Initialize all counters with their starting value (0) properly formatted
counters.forEach((counter) => {
  const decimal = parseInt(counter.dataset.decimal) || 0;
  counter.textContent = (0).toFixed(decimal);
});

function animateCounter(counter) {
  const target = parseFloat(counter.dataset.target);
  const decimal = parseInt(counter.dataset.decimal) || 0;
  const duration = 2000;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function for smooth animation
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = target * easeOutQuart;

    counter.textContent = current.toFixed(decimal);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      counter.textContent = target.toFixed(decimal);
    }
  }

  requestAnimationFrame(update);
}

// Observe counters for intersection
if (counters.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((counter) => counterObserver.observe(counter));
} else {
  // Fallback: just show the final values
  counters.forEach((counter) => {
    const target = parseFloat(counter.dataset.target);
    const decimal = parseInt(counter.dataset.decimal) || 0;
    counter.textContent = target.toFixed(decimal);
  });
}

// ========== ROI CALCULATOR ==========
const fleetSizeInput = document.getElementById("fleet-size");
const dispatchesInput = document.getElementById("monthly-dispatches");
const tripCostInput = document.getElementById("avg-trip-cost");
const annualSavingsEl = document.getElementById("annual-savings");
const timeSavedEl = document.getElementById("time-saved");
const efficiencyGainEl = document.getElementById("efficiency-gain");

function calculateROI() {
  if (!fleetSizeInput || !dispatchesInput || !tripCostInput) return;

  const fleetSize = parseInt(fleetSizeInput.value) || 10;
  const monthlyDispatches = parseInt(dispatchesInput.value) || 500;
  const avgTripCost = parseInt(tripCostInput.value) || 150;

  // ROI Calculations (estimates based on efficiency gains)
  const efficiencyGain = Math.min(40, 25 + (fleetSize * 0.5)); // 25-40% efficiency gain
  const costSavingsPercent = efficiencyGain * 0.4; // About 10-16% cost savings
  const monthlyTotalCost = monthlyDispatches * avgTripCost;
  const monthlySavings = monthlyTotalCost * (costSavingsPercent / 100);
  const annualSavings = Math.round(monthlySavings * 12);

  // Time saved: ~15 min per dispatch saved on coordination
  const timeSaved = Math.round((monthlyDispatches * 0.25) / fleetSize * fleetSize * 0.5);

  // Update display with animation
  animateValue(annualSavingsEl, annualSavings);
  animateValue(timeSavedEl, timeSaved);
  animateValue(efficiencyGainEl, Math.round(efficiencyGain));
}

function animateValue(element, targetValue) {
  if (!element) return;

  const currentValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
  const duration = 500;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(currentValue + (targetValue - currentValue) * easeOut);

    element.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = targetValue.toLocaleString();
    }
  }

  requestAnimationFrame(update);
}

// Initialize ROI calculator
if (fleetSizeInput && dispatchesInput && tripCostInput) {
  calculateROI(); // Initial calculation

  // Add event listeners
  fleetSizeInput.addEventListener("input", calculateROI);
  dispatchesInput.addEventListener("input", calculateROI);
  tripCostInput.addEventListener("input", calculateROI);
}

// Set current year in footer
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// ========== 3D TILT EFFECT ON CARDS ==========
// DISABLED - Using CSS hover effects instead for better performance
// const tiltCards = document.querySelectorAll('.quote, .plan, .step, .roi-result-card');
// Tilt effect removed to improve mobile performance and prevent stuttering

// ========== SMOOTH PARALLAX ON SCROLL ==========
let ticking = false;

function updateParallax() {
  const scrolled = window.scrollY;

  // Parallax for hero section
  const heroContent = document.querySelector('.hero .container > div:first-child');
  const phone = document.querySelector('.phone');

  if (heroContent && scrolled < 800) {
    heroContent.style.transform = `translateY(${scrolled * 0.15}px)`;
  }

  if (phone && scrolled < 800) {
    phone.style.transform = `translateY(${scrolled * -0.1}px)`;
  }

  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    requestAnimationFrame(updateParallax);
    ticking = true;
  }
}, { passive: true });

// ========== MAGNETIC BUTTONS ==========
const magneticBtns = document.querySelectorAll('.btn-primary');

magneticBtns.forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px) scale(1.02)`;
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translate(0, 0) scale(1)';
  });
});

// ========== TYPING EFFECT FOR HERO TITLE ==========
function typeEffect(element, text, speed = 50) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    element.textContent = text;
    return;
  }

  element.textContent = '';
  let i = 0;

  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }

  type();
}

// ========== CURSOR GLOW EFFECT ==========
const glowCircle = document.createElement('div');
glowCircle.className = 'cursor-glow';
glowCircle.style.cssText = `
  position: fixed;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(229, 57, 53, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  transform: translate(-50%, -50%);
  transition: opacity 0.3s ease;
  opacity: 0;
`;
document.body.appendChild(glowCircle);

let glowTimeout;
document.addEventListener('mousemove', (e) => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  glowCircle.style.left = e.clientX + 'px';
  glowCircle.style.top = e.clientY + 'px';
  glowCircle.style.opacity = '1';

  clearTimeout(glowTimeout);
  glowTimeout = setTimeout(() => {
    glowCircle.style.opacity = '0';
  }, 1000);
});

// ========== SMOOTH NUMBER TICKER ==========
function animateNumber(element, start, end, duration, format = null) {
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Smooth easing
    const easeOutExpo = 1 - Math.pow(2, -10 * progress);
    const current = start + (end - start) * easeOutExpo;

    if (format) {
      element.textContent = format(current);
    } else {
      element.textContent = Math.round(current).toLocaleString();
    }

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// ========== INTERSECTION OBSERVER FOR ANIMATIONS ==========
const animatedElements = document.querySelectorAll('.kpis .tile, .feature-row, .step, .quote');

const animationObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('animated');
        entry.target.style.animationDelay = `${index * 100}ms`;
      }, index * 100);
    }
  });
}, { threshold: 0.2 });

animatedElements.forEach(el => animationObserver.observe(el));

