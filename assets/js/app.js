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
  initializeBalance();
  bindEvents();
  initializeNavHighlight();
  initializeBanner();
  initializeReviews();
  loadProducts();
  renderCart();
});

// DOM references
function cacheDom() {
  dom.mobileMenuBtn = document.getElementById("mobileMenuBtn");
  dom.mobileMenu = document.getElementById("mobileMenu");
  dom.navLinks = Array.from(document.querySelectorAll(".nav-link"));
  dom.sections = Array.from(document.querySelectorAll("main section[id]"));

  dom.balanceHero = document.getElementById("balanceHero");
  dom.addMoneyBtn = document.getElementById("addMoneyBtn");
  dom.addMoneyFooterBtn = document.getElementById("addMoneyFooterBtn");
  dom.cartTotalHero = document.getElementById("cartTotalHero");

  dom.cartCount = document.getElementById("cartCount");
  dom.cartBadge = document.getElementById("cartBadge");
  dom.openCartBtn = document.getElementById("openCartBtn");
  dom.closeCartBtn = document.getElementById("closeCartBtn");
  dom.cartDrawer = document.getElementById("cartDrawer");
  dom.cartOverlay = document.getElementById("cartOverlay");
  dom.cartItems = document.getElementById("cartItems");
  dom.cartEmpty = document.getElementById("cartEmpty");
  dom.subtotalText = document.getElementById("subtotalText");
  dom.deliveryText = document.getElementById("deliveryText");
  dom.shippingText = document.getElementById("shippingText");
  dom.discountText = document.getElementById("discountText");
  dom.totalText = document.getElementById("totalText");
  dom.checkoutBtn = document.getElementById("checkoutBtn");
  dom.couponInput = document.getElementById("couponInput");
  dom.applyCouponBtn = document.getElementById("applyCouponBtn");
  dom.couponMessage = document.getElementById("couponMessage");

  dom.bannerSlides = Array.from(document.querySelectorAll(".banner-slide"));
  dom.prevBannerBtn = document.getElementById("prevBannerBtn");
  dom.nextBannerBtn = document.getElementById("nextBannerBtn");
  dom.bannerDots = document.getElementById("bannerDots");

  dom.searchInput = document.getElementById("searchInput");
  dom.sortSelect = document.getElementById("sortSelect");
  dom.categoryFilters = document.getElementById("categoryFilters");
  dom.productGrid = document.getElementById("productGrid");
  dom.productStatus = document.getElementById("productStatus");

  dom.reviewCard = document.getElementById("reviewCard");
  dom.prevReviewBtn = document.getElementById("prevReviewBtn");
  dom.nextReviewBtn = document.getElementById("nextReviewBtn");
  dom.reviewDots = document.getElementById("reviewDots");

  dom.contactForm = document.getElementById("contactForm");
  dom.contactName = document.getElementById("contactName");
  dom.contactEmail = document.getElementById("contactEmail");
  dom.contactMessageInput = document.getElementById("contactMessageInput");
  dom.contactMessage = document.getElementById("contactMessage");

  dom.newsletterForm = document.getElementById("newsletterForm");
  dom.newsletterEmail = document.getElementById("newsletterEmail");
  dom.newsletterMessage = document.getElementById("newsletterMessage");
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

  dom.addMoneyBtn?.addEventListener("click", addMoney);
  dom.addMoneyFooterBtn?.addEventListener("click", addMoney);

  dom.openCartBtn?.addEventListener("click", openCart);
  dom.closeCartBtn?.addEventListener("click", closeCart);
  dom.cartOverlay?.addEventListener("click", closeCart);
  dom.cartItems?.addEventListener("click", handleCartActions);

  dom.applyCouponBtn?.addEventListener("click", applyCoupon);
  dom.checkoutBtn?.addEventListener("click", handleCheckout);

  dom.prevBannerBtn?.addEventListener("click", () => {
    setBannerSlide(state.bannerIndex - 1);
    restartBannerTimer();
  });
  dom.nextBannerBtn?.addEventListener("click", () => {
    setBannerSlide(state.bannerIndex + 1);
    restartBannerTimer();
  });

  dom.prevReviewBtn?.addEventListener("click", () => {
    setReviewSlide(state.reviewIndex - 1);
    restartReviewTimer();
  });
  dom.nextReviewBtn?.addEventListener("click", () => {
    setReviewSlide(state.reviewIndex + 1);
    restartReviewTimer();
  });

  dom.contactForm?.addEventListener("submit", handleContactSubmit);
  dom.newsletterForm?.addEventListener("submit", handleNewsletterSubmit);

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

// Cart logic
function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  const nextCart = new Map(state.cart);
  const existing = nextCart.get(productId);
  nextCart.set(productId, {
    id: product.id,
    title: product.title,
    image: product.image,
    price: product.price,
    qty: existing ? existing.qty + 1 : 1
  });

  const totals = calculateTotals(nextCart);
  if (totals.total > state.balance) {
    showToast("Insufficient balance. Add money to continue.", "error");
    return;
  }

  state.cart = nextCart;
  renderCart();
  showToast("Item added to cart.", "success");
}

function handleCartActions(event) {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (!id) return;

  if (btn.dataset.action === "inc") {
    addToCart(id);
    return;
  }

  if (!state.cart.has(id)) return;
  if (btn.dataset.action === "dec") {
    const item = state.cart.get(id);
    if (item.qty <= 1) {
      state.cart.delete(id);
    } else {
      state.cart.set(id, { ...item, qty: item.qty - 1 });
    }
  }

  if (btn.dataset.action === "remove") {
    state.cart.delete(id);
  }

  renderCart();
}

function renderCart() {
  dom.cartItems.innerHTML = "";
  const entries = Array.from(state.cart.values());
  dom.cartEmpty.classList.toggle("hidden", entries.length > 0);

  entries.forEach((item) => {
    const row = document.createElement("article");
    row.className = "flex items-center gap-3 rounded-xl border border-slate-200 p-3";

    const image = document.createElement("img");
    image.src = item.image;
    image.alt = item.title;
    image.className = "h-14 w-14 rounded-lg bg-slate-50 object-contain p-1";

    const info = document.createElement("div");
    info.className = "min-w-0 flex-1";
    info.innerHTML = `<p class="truncate text-sm font-semibold">${escapeHtml(item.title)}</p><p class="text-xs text-slate-500">${formatMoney(item.price)} BDT</p>`;

    const controls = document.createElement("div");
    controls.className = "flex items-center gap-1";
    controls.innerHTML = `
      <button type="button" data-action="dec" data-id="${item.id}" class="rounded-lg border border-slate-200 px-2 py-1 text-xs">-</button>
      <span class="w-6 text-center text-xs font-semibold">${item.qty}</span>
      <button type="button" data-action="inc" data-id="${item.id}" class="rounded-lg border border-slate-200 px-2 py-1 text-xs">+</button>
      <button type="button" data-action="remove" data-id="${item.id}" class="ml-1 rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-500">x</button>
    `;

    row.append(image, info, controls);
    dom.cartItems.appendChild(row);
  });

  const totals = calculateTotals(state.cart);
  updateCartTotalsUI(totals);
}

function calculateTotals(cartMap) {
  let subtotal = 0;
  cartMap.forEach((item) => {
    subtotal += item.price * item.qty;
  });

  const delivery = subtotal > 0 ? config.deliveryCharge : 0;
  const shipping = subtotal > 0 ? config.shippingCost : 0;
  const discount = state.couponApplied ? subtotal * config.couponRate : 0;
  const total = subtotal + delivery + shipping - discount;

  return { subtotal, delivery, shipping, discount, total };
}

function updateCartTotalsUI(totals) {
  dom.subtotalText.textContent = `${formatMoney(totals.subtotal)} BDT`;
  dom.deliveryText.textContent = `${formatMoney(totals.delivery)} BDT`;
  dom.shippingText.textContent = `${formatMoney(totals.shipping)} BDT`;
  dom.discountText.textContent = `${formatMoney(totals.discount)} BDT`;
  dom.totalText.textContent = `${formatMoney(totals.total)} BDT`;
  dom.cartTotalHero.textContent = formatMoney(totals.subtotal);

  const qty = Array.from(state.cart.values()).reduce((sum, item) => sum + item.qty, 0);
  dom.cartCount.textContent = qty;
  dom.cartBadge?.classList.toggle("hidden", qty === 0);
  dom.cartBadge?.classList.toggle("flex", qty > 0);
}

function applyCoupon() {
  const code = (dom.couponInput.value || "").trim().toUpperCase();
  if (!code) {
    state.couponApplied = false;
    setCouponMessage("Coupon removed.", true);
    renderCart();
    return;
  }

  if (code !== config.couponCode) {
    state.couponApplied = false;
    setCouponMessage("Invalid coupon code.", false);
    renderCart();
    return;
  }

  state.couponApplied = true;
  setCouponMessage("SMART10 applied. 10 percent discount added.", true);
  renderCart();
}

function setCouponMessage(message, ok) {
  dom.couponMessage.textContent = message;
  dom.couponMessage.className = `mt-2 text-xs ${ok ? "text-emerald-500" : "text-rose-500"}`;
}

function openCart() {
  dom.cartDrawer.classList.remove("translate-x-full");
  dom.cartOverlay.classList.remove("pointer-events-none", "opacity-0");
  dom.cartOverlay.classList.add("opacity-100");
}

function closeCart() {
  dom.cartDrawer.classList.add("translate-x-full");
  dom.cartOverlay.classList.add("pointer-events-none", "opacity-0");
  dom.cartOverlay.classList.remove("opacity-100");
}

function handleCheckout() {
  const totals = calculateTotals(state.cart);
  if (totals.total <= 0) {
    showToast("Your cart is empty.", "error");
    return;
  }

  if (totals.total > state.balance) {
    showToast("Total exceeds balance. Add money first.", "error");
    return;
  }

  state.balance -= Math.round(totals.total);
  saveBalance();
  updateBalanceUI();

  state.cart.clear();
  state.couponApplied = false;
  dom.couponInput.value = "";
  setCouponMessage("", true);
  renderCart();
  showToast("Checkout complete. Order placed.", "success");
  closeCart();
}

// Balance
function initializeBalance() {
  const raw = localStorage.getItem(config.balanceStorageKey);
  const parsed = Number.parseInt(raw || "", 10);
  state.balance = Number.isFinite(parsed) ? parsed : config.initialBalance;
  saveBalance();
  updateBalanceUI();
}

function saveBalance() {
  localStorage.setItem(config.balanceStorageKey, String(state.balance));
}

function addMoney() {
  state.balance += config.addMoneyAmount;
  saveBalance();
  updateBalanceUI();
  showToast("Balance increased by 1000 BDT.", "success");
}

function updateBalanceUI() {
  const value = String(state.balance);
  dom.balanceHero.textContent = value;
}

// Reviews
async function initializeReviews() {
  try {
    const response = await fetch(config.reviewsUrl);
    if (!response.ok) {
      throw new Error("Reviews request failed");
    }
    const data = await response.json();
    state.reviews = Array.isArray(data) ? data : [];
  } catch (error) {
    state.reviews = [];
  }

  if (!state.reviews.length) {
    dom.reviewCard.innerHTML = "<p class=\"text-sm text-slate-500\">No reviews available right now.</p>";
    return;
  }

  createDots(dom.reviewDots, state.reviews.length, (index) => {
    setReviewSlide(index);
    restartReviewTimer();
  });
  setReviewSlide(0);
  restartReviewTimer();
}

function setReviewSlide(index) {
  state.reviewIndex = wrapIndex(index, state.reviews.length);
  const review = state.reviews[state.reviewIndex];
  dom.reviewCard.innerHTML = `
    <p class="text-sm font-semibold text-slate-800">${escapeHtml(review.name)}</p>
    <p class="mt-2 text-sm text-slate-600">${escapeHtml(review.comment)}</p>
    <div class="mt-3 flex items-center justify-between text-xs text-slate-500">
      <span class="text-amber-500">${renderStars(review.rating || 0)}</span>
      <span>${escapeHtml(review.date || "")}</span>
    </div>
  `;
  updateDots(dom.reviewDots, state.reviewIndex);
}

function restartReviewTimer() {
  clearInterval(state.reviewTimer);
  state.reviewTimer = setInterval(() => {
    setReviewSlide(state.reviewIndex + 1);
  }, config.reviewIntervalMs);
}

// Contact form
function handleContactSubmit(event) {
  event.preventDefault();
  const name = dom.contactName.value.trim();
  const email = dom.contactEmail.value.trim();
  const message = dom.contactMessageInput.value.trim();

  if (!name || !email || !message) {
    setContactMessage("Please fill all fields.", false);
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setContactMessage("Please provide a valid email.", false);
    return;
  }

  setContactMessage("Thank you. Your message has been sent.", true);
  dom.contactForm.reset();
}

function setContactMessage(text, success) {
  dom.contactMessage.textContent = text;
  dom.contactMessage.className = `text-sm ${success ? "text-emerald-500" : "text-rose-500"}`;
}

function handleNewsletterSubmit(event) {
  event.preventDefault();
  const email = dom.newsletterEmail.value.trim();

  if (!email) {
    setNewsletterMessage("Please enter your email.", false);
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setNewsletterMessage("Please provide a valid email.", false);
    return;
  }

  setNewsletterMessage("Thanks for subscribing.", true);
  dom.newsletterForm.reset();
}

function setNewsletterMessage(text, success) {
  dom.newsletterMessage.textContent = text;
  dom.newsletterMessage.className = `text-sm ${success ? "text-emerald-500" : "text-rose-500"}`;
}
