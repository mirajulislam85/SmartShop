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
  loadProducts();
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

  dom.searchInput = document.getElementById("searchInput");
  dom.sortSelect = document.getElementById("sortSelect");
  dom.categoryFilters = document.getElementById("categoryFilters");
  dom.productGrid = document.getElementById("productGrid");
  dom.productStatus = document.getElementById("productStatus");
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

  dom.searchInput?.addEventListener("input", applySearchAndSort);
  dom.sortSelect?.addEventListener("change", applySearchAndSort);
  dom.categoryFilters?.addEventListener("click", handleCategoryFilterClick);
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

// Products and filters
async function loadProducts() {
  dom.productStatus.textContent = "Loading products...";
  dom.productStatus.className = "mb-5 text-sm text-slate-600";
  try {
    const response = await fetch(config.apiUrl);
    if (!response.ok) {
      throw new Error("Product request failed");
    }
    const data = await response.json();
    state.products = Array.isArray(data) ? data : [];
    state.filteredProducts = [...state.products];
    state.activeCategory = "all";
    renderCategoryFilters();
    applySearchAndSort();
  } catch (error) {
    dom.productStatus.textContent = "Unable to load products right now.";
    dom.productStatus.className = "mb-5 text-sm text-rose-500";
  }
}

function applySearchAndSort() {
  const query = (dom.searchInput?.value || "").trim().toLowerCase();
  const sort = dom.sortSelect?.value || "default";

  let working = [...state.products];
  if (query) {
    working = working.filter((item) => item.title.toLowerCase().includes(query));
  }
  if (state.activeCategory && state.activeCategory !== "all") {
    working = working.filter((item) => item.category === state.activeCategory);
  }
  if (sort === "low-high") {
    working.sort((a, b) => a.price - b.price);
  } else if (sort === "high-low") {
    working.sort((a, b) => b.price - a.price);
  }

  state.filteredProducts = working;
  renderProducts();
}

function renderCategoryFilters() {
  if (!dom.categoryFilters) return;
  const categories = Array.from(
    new Set(state.products.map((item) => item.category).filter(Boolean))
  );
  const allCategories = ["all", ...categories];
  dom.categoryFilters.innerHTML = "";
  allCategories.forEach((category) => {
    const active = category === state.activeCategory;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.category = category;
    button.className = active
      ? "rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white transition-all duration-300"
      : "rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition-all duration-300 hover:border-emerald-300 hover:text-emerald-600";
    button.textContent = category === "all" ? "All" : category;
    dom.categoryFilters.appendChild(button);
  });
}

function handleCategoryFilterClick(event) {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  state.activeCategory = button.dataset.category || "all";
  renderCategoryFilters();
  applySearchAndSort();
}

function renderProducts() {
  dom.productGrid.innerHTML = "";
  if (!state.filteredProducts.length) {
    dom.productStatus.textContent = "No products match your search.";
    return;
  }

  dom.productStatus.textContent = `Showing ${state.filteredProducts.length} of ${state.products.length} products.`;

  state.filteredProducts.forEach((product) => {
    const card = document.createElement("article");
    card.className = "group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md";

    const imageWrap = document.createElement("div");
    imageWrap.className = "mb-4 rounded-xl bg-slate-50 p-4";
    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.title;
    image.loading = "lazy";
    image.className = "mx-auto h-36 w-full object-contain";
    imageWrap.appendChild(image);

    const title = document.createElement("h3");
    title.className = "line-clamp-2 min-h-[3rem] text-sm font-semibold text-slate-800";
    title.textContent = product.title;

    const price = document.createElement("p");
    price.className = "mt-2 text-lg font-bold text-slate-900";
    price.textContent = `${formatMoney(product.price)} BDT`;

    const ratingRow = document.createElement("div");
    ratingRow.className = "mt-2 flex items-center justify-between text-xs";
    ratingRow.innerHTML = `<span class="font-medium text-amber-500">${renderStars(product.rating?.rate || 0)}</span><span class="text-slate-500">${(product.rating?.rate || 0).toFixed(1)} (${product.rating?.count || 0})</span>`;

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "mt-4 w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-emerald-600";
    addBtn.textContent = "Add to Cart";
    addBtn.addEventListener("click", () => addToCart(product.id));

    card.append(imageWrap, title, price, ratingRow, addBtn);
    dom.productGrid.appendChild(card);
  });
}
