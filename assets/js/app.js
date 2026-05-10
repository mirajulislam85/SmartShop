const config = {
  apiUrl: "https://fakestoreapi.com/products",
  reviewsUrl: "assets/js/data/reviews.json",
  couponCode: "SMART10",
  couponRate: 0.1,
  deliveryCharge: 60,
  shippingCost: 90,
  initialBalance: 1000,
  addMoneyAmount: 1000,
  bannerIntervalMs: 5000,
  reviewIntervalMs: 6000,
  balanceStorageKey: "smartshop_balance"
};

const state = {
  products: [],
  filteredProducts: [],
  activeCategory: "all",
  cart: new Map(),
  couponApplied: false,
  balance: config.initialBalance,
  reviews: [],
  bannerIndex: 0,
  reviewIndex: 0,
  bannerTimer: null,
  reviewTimer: null
};

const dom = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  bindEvents();
  initializeNavHighlight();
  initializeBanner();
});

// DOM references
function cacheDom() {
  dom.mobileMenuBtn = document.getElementById("mobileMenuBtn");
  dom.mobileMenu = document.getElementById("mobileMenu");
  dom.navLinks = Array.from(document.querySelectorAll(".nav-link"));
  dom.sections = Array.from(document.querySelectorAll("main section[id]"));

  dom.balanceHero = document.getElementById("balanceHero");
  dom.addMoneyBtn = document.getElementById("addMoneyBtn");
  dom.cartTotalHero = document.getElementById("cartTotalHero");

  dom.bannerSlides = Array.from(document.querySelectorAll(".banner-slide"));
  dom.prevBannerBtn = document.getElementById("prevBannerBtn");
  dom.nextBannerBtn = document.getElementById("nextBannerBtn");
  dom.bannerDots = document.getElementById("bannerDots");
}

// Event wiring
function bindEvents() {
  dom.mobileMenuBtn?.addEventListener("click", () => {
    dom.mobileMenu?.classList.toggle("hidden");
  });

  dom.navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      dom.mobileMenu?.classList.add("hidden");
    });
  });

  dom.prevBannerBtn?.addEventListener("click", () => {
    setBannerSlide(state.bannerIndex - 1);
    restartBannerTimer();
  });
  dom.nextBannerBtn?.addEventListener("click", () => {
    setBannerSlide(state.bannerIndex + 1);
    restartBannerTimer();
  });
}

// Navigation active state
function initializeNavHighlight() {
  if (!dom.sections.length) return;
  const linkMap = new Map();
  dom.navLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (!href.startsWith("#")) return;
    const id = href.slice(1);
    if (!linkMap.has(id)) {
      linkMap.set(id, []);
    }
    linkMap.get(id).push(link);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const activeLinks = linkMap.get(entry.target.id);
        if (!activeLinks) return;
        dom.navLinks.forEach((link) => {
          link.classList.remove("text-emerald-500", "font-semibold");
          link.removeAttribute("aria-current");
        });
        activeLinks.forEach((link) => {
          link.classList.add("text-emerald-500", "font-semibold");
          link.setAttribute("aria-current", "page");
        });
      });
    },
    { rootMargin: "-45% 0px -45% 0px" }
  );

  dom.sections.forEach((section) => observer.observe(section));
}

// Banner slider
function initializeBanner() {
  if (!dom.bannerSlides.length) return;
  createDots(dom.bannerDots, dom.bannerSlides.length, (index) => {
    setBannerSlide(index);
    restartBannerTimer();
  });
  setBannerSlide(0);
  restartBannerTimer();
}

function setBannerSlide(index) {
  state.bannerIndex = wrapIndex(index, dom.bannerSlides.length);
  dom.bannerSlides.forEach((slide, idx) => {
    const active = idx === state.bannerIndex;
    slide.classList.toggle("opacity-100", active);
    slide.classList.toggle("opacity-0", !active);
    slide.setAttribute("aria-hidden", active ? "false" : "true");
  });
  updateDots(dom.bannerDots, state.bannerIndex);
}

function restartBannerTimer() {
  clearInterval(state.bannerTimer);
  state.bannerTimer = setInterval(() => {
    setBannerSlide(state.bannerIndex + 1);
  }, config.bannerIntervalMs);
}
