const API_BASE = "/api";

// ============ STATE ============
let currentCountryId = null; // numeric ID from DB
let currentCountrySlug = null; // for packing state key
let countriesCache = []; // List<Country> from GET /api/countries
let packingState = JSON.parse(localStorage.getItem("travi_packing") || "{}");

// ============ AUTH TOKEN ============
function getToken() {
  return localStorage.getItem("travi_token");
}
function setToken(token) {
  localStorage.setItem("'travi_packing'", token);
}
function clearToken() {
  localStorage.removeItem("travi_token");
}
function isLoggedIn() {
  return !!getToken();
}

// ============ API HELPERS ============
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    updateAuthUI();
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ============ DOM HELPERS ============
const $ = (id) => document.getElementById(id);
const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

function showToast(msg, type = "info") {
  let toast = document.getElementById("traviToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "traviToast";
    toast.style.cssText = `
      position:fixed; bottom:24px; right:24px; z-index:9999;
      background: var(--ink, #1a1a1a); color:#fff; padding:14px 22px;
      border-radius:10px; font-size:0.9rem; opacity:0;
      transition: opacity 0.3s; pointer-events:none; max-width:320px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(toast);
  }
  if (type === "error") toast.style.background = "#c0392b";
  else if (type === "success") toast.style.background = "#27ae60";
  else toast.style.background = "var(--ink, #1a1a1a)";
  toast.textContent = msg;
  toast.style.opacity = "1";
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    toast.style.opacity = "0";
  }, 3000);
}

// ============ AUTH UI ============
function updateAuthUI() {
  const loggedIn = isLoggedIn();
  const signInBtns = document.querySelectorAll(".btn-sign-in");
  const getStartedBtns = document.querySelectorAll(".btn-get-started");
  const logoutBtns = document.querySelectorAll(".btn-logout");

  signInBtns.forEach((b) => (b.style.display = loggedIn ? "none" : ""));
  getStartedBtns.forEach((b) => (b.style.display = loggedIn ? "none" : ""));
  logoutBtns.forEach((b) => (b.style.display = loggedIn ? "" : "none"));
}

function openAuthModal(mode = "login") {
  const modal = $("authModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  switchAuthMode(mode);
}

function closeAuthModal() {
  const modal = $("authModal");
  if (modal) modal.classList.add("hidden");
}

function switchAuthMode(mode) {
  const loginForm = $("loginForm");
  const registerForm = $("registerForm");
  if (!loginForm || !registerForm) return;
  if (mode === "login") {
    loginForm.style.display = "";
    registerForm.style.display = "none";
  } else {
    loginForm.style.display = "none";
    registerForm.style.display = "";
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const username = $("loginUsername").value.trim();
  const password = $("loginPassword").value;
  if (!username || !password)
    return showToast("Please fill in all fields.", "error");
  try {
    // POST /api/auth/login  → LoginResponse { token, ... }
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    updateAuthUI();
    closeAuthModal();
    showToast("Welcome back!", "success");
    renderSavedSection(); // reload saved from server
  } catch (err) {
    showToast("Login failed. Check your credentials.", "error");
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = $("regUsername").value.trim();
  const email = $("regEmail").value.trim();
  const password = $("regPassword").value;
  if (!username || !email || !password)
    return showToast("Please fill in all fields.", "error");
  try {
    // POST /api/auth/register  → RegisterResponse { token, ... }
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
    setToken(data.token);
    updateAuthUI();
    closeAuthModal();
    showToast("Account created!", "success");
  } catch (err) {
    showToast("Registration failed. Try a different username/email.", "error");
  }
}

function handleLogout() {
  clearToken();
  updateAuthUI();
  renderSavedSection();
  showToast("Logged out.");
}

// ============ INIT ============
document.addEventListener("DOMContentLoaded", async () => {
  initNavbar();
  initHamburger();
  initAuthModal();
  updateAuthUI();
  await loadCountries();
  renderDestinationsGrid();
  renderSavedSection();
  initSearch();
  initHeroChips();
});

// ============ LOAD COUNTRIES ============
// GET /api/countries  →  List<Country>
// Country fields expected: id, name, flagEmoji, region, tagline, gradientCss, description,
//   population, currency, timeZone, language, powerPlug, drivingSide, climate, tipping,
//   internet, bestMonths (comma-separated or List<String>)
async function loadCountries() {
  try {
    countriesCache = await apiFetch("/countries");
  } catch (err) {
    showToast("Could not load destinations. Is the server running?", "error");
    countriesCache = [];
  }
}

// ============ NAVBAR SCROLL ============
function initNavbar() {
  const nav = $("navbar");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 40);
  });
}

// ============ HAMBURGER ============
function initHamburger() {
  const btn = $("hamburger");
  const links = $("navLinks");
  if (btn && links) {
    btn.addEventListener("click", () => links.classList.toggle("open"));
  }
}

// ============ AUTH MODAL INIT ============
function initAuthModal() {
  // Wire sign-in buttons
  document.querySelectorAll(".btn-sign-in").forEach((b) => {
    b.addEventListener("click", () => openAuthModal("login"));
  });
  document.querySelectorAll(".btn-get-started").forEach((b) => {
    b.addEventListener("click", () => openAuthModal("register"));
  });
  document.querySelectorAll(".btn-logout").forEach((b) => {
    b.addEventListener("click", handleLogout);
  });

  const closeBtn = $("authModalClose");
  if (closeBtn) closeBtn.addEventListener("click", closeAuthModal);

  const modal = $("authModal");
  if (modal)
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeAuthModal();
    });

  const toLogin = $("switchToLogin");
  const toReg = $("switchToRegister");
  if (toLogin) toLogin.addEventListener("click", () => switchAuthMode("login"));
  if (toReg) toReg.addEventListener("click", () => switchAuthMode("register"));

  const loginForm = $("loginForm");
  const registerForm = $("registerForm");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (registerForm) registerForm.addEventListener("submit", handleRegister);
}

// ============ DESTINATIONS GRID ============
// Uses GET /api/countries (cached)
function renderDestinationsGrid() {
  const grid = $("destinationsGrid");
  grid.innerHTML = "";
  countriesCache.forEach((c, i) => {
    const card = el("div", "dest-card");
    card.style.animationDelay = `${i * 0.08}s`;
    card.innerHTML = `
      <div class="dest-card-img">
        <div class="dest-card-img-bg" style="background: ${c.gradientCss || defaultGradient(i)}; width:100%; height:100%;"></div>
        <div class="dest-card-img-overlay"></div>
        <div class="dest-card-flag">${c.flagEmoji || "🌍"}</div>
        <div class="dest-card-region">${c.region || ""}</div>
      </div>
      <div class="dest-card-body">
        <div>
          <div class="dest-card-name">${c.name}</div>
          <div class="dest-card-sub">${c.tagline || ""}</div>
        </div>
        <div class="dest-card-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    `;
    card.addEventListener("click", () => openCountry(c.id));
    grid.appendChild(card);
  });
}

function defaultGradient(i) {
  const grads = [
    "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #e94560 100%)",
    "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    "linear-gradient(135deg, #0d2137 0%, #1e4d7b 50%, #d4382a 100%)",
    "linear-gradient(135deg, #1a1a2e 0%, #002395 50%, #ED2939 100%)",
  ];
  return grads[i % grads.length];
}

// ============ SEARCH ============
function initSearch() {
  const input = $("heroSearchInput");
  const dropdown = $("heroDropdown");
  const btn = $("heroSearchBtn");

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      dropdown.classList.remove("visible");
      return;
    }
    const results = countriesCache.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.region || "").toLowerCase().includes(q),
    );
    renderDropdown(dropdown, results, input);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = input.value.trim().toLowerCase();
      const match = countriesCache.find((c) =>
        (c.name || "").toLowerCase().includes(q),
      );
      if (match) {
        openCountry(match.id);
        dropdown.classList.remove("visible");
        input.value = "";
      }
    }
  });

  btn.addEventListener("click", () => {
    const q = input.value.trim().toLowerCase();
    const match = countriesCache.find((c) =>
      (c.name || "").toLowerCase().includes(q),
    );
    if (match) {
      openCountry(match.id);
      dropdown.classList.remove("visible");
      input.value = "";
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".hero-search-wrap"))
      dropdown.classList.remove("visible");
  });
}

function renderDropdown(dropdown, results, input) {
  if (!results.length) {
    dropdown.classList.remove("visible");
    return;
  }
  dropdown.innerHTML = results
    .map(
      (c) => `
    <div class="dropdown-item" data-id="${c.id}">
      <span class="dropdown-flag">${c.flagEmoji || "🌍"}</span>
      <div class="dropdown-info">
        <div class="dropdown-name">${c.name}</div>
        <div class="dropdown-region">${c.region || ""}</div>
      </div>
    </div>
  `,
    )
    .join("");
  dropdown.classList.add("visible");
  dropdown.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("click", () => {
      openCountry(Number(item.dataset.id));
      dropdown.classList.remove("visible");
      input.value = "";
    });
  });
}

// ============ HERO CHIPS ============
// Chips use country name (case-insensitive match against cache)
function initHeroChips() {
  document.querySelectorAll(".tag-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const label = chip.dataset.country.replace(/-/g, " ").toLowerCase();
      const match = countriesCache.find(
        (c) => (c.name || "").toLowerCase() === label,
      );
      if (match) openCountry(match.id);
      else showToast(`"${chip.dataset.country}" not found.`, "error");
    });
  });
}

// ============ OPEN COUNTRY ============
// Fetches all detail tabs from:
//   GET /api/countries/{id}
//   GET /api/countries/{id}/requirements
//   GET /api/countries/{id}/budget
//   GET /api/countries/{id}/checklist
//   GET /api/countries/{id}/tips
//   GET /api/countries/{id}/culture
async function openCountry(id) {
  currentCountryId = id;
  currentCountrySlug = String(id); // use numeric ID as packing state key

  // Show loading state
  document.querySelector(".popular-section").classList.add("hidden");
  $("countryDetailSection").classList.remove("hidden");
  $("countryName").textContent = "Loading…";
  $("countryTagline").textContent = "";
  $("countryFlag").textContent = "";

  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => {
    $("countryDetailSection").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 100);

  try {
    // Fire all requests in parallel
    const [country, requirements, budget, checklist, tips, culture] =
      await Promise.all([
        apiFetch(`/countries/${id}`),
        apiFetch(`/countries/${id}/requirements`).catch(() => null),
        apiFetch(`/countries/${id}/budget`).catch(() => null),
        apiFetch(`/countries/${id}/checklist`).catch(() => null),
        apiFetch(`/countries/${id}/tips`).catch(() => null),
        apiFetch(`/countries/${id}/culture`).catch(() => null),
      ]);

    // Banner
    $("countryBanner").style.background =
      country.gradientCss || defaultGradient(0);
    $("countryFlag").textContent = country.flagEmoji || "🌍";
    $("countryName").textContent = country.name;
    $("countryTagline").textContent = country.tagline || "";

    // Save button state
    updateSaveBtn();

    // Populate all tabs
    populateOverview(country);
    populateEntry(requirements);
    populateBudget(budget);
    populatePacking(checklist);
    populateTips(tips);
    populateCulture(culture);

    // Reset to overview tab
    activateTab("overview");
  } catch (err) {
    showToast("Failed to load country details.", "error");
    console.error(err);
  }

  // Wire tab nav
  $("tabNav")
    .querySelectorAll(".tab-btn")
    .forEach((btn) => {
      btn.onclick = () => activateTab(btn.dataset.tab);
    });

  // Back button
  $("backBtn").onclick = () => {
    $("countryDetailSection").classList.add("hidden");
    document.querySelector(".popular-section").classList.remove("hidden");
    document.querySelector("#explore").scrollIntoView({ behavior: "smooth" });
  };

  // Save button
  $("saveBtnDetail").onclick = () => toggleSave(id);
}

function activateTab(tab) {
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  document
    .querySelectorAll(".tab-panel")
    .forEach((p) => p.classList.toggle("active", p.id === `tab-${tab}`));
}

// ============ POPULATE OVERVIEW ============
// Maps Country entity fields:
//   description, population, currency, timeZone,
//   language, powerPlug, drivingSide, climate, tipping, internet,
//   bestMonths (String e.g. "March,April" or List<String>)
function populateOverview(c) {
  $("overviewDesc").textContent = c.overview || "No overview available.";

  const stats = [
    { value: c.currency || "—", label: "Currency" },
    { value: c.timeZone || "—", label: "Time Zone" },
    { value: c.safetyLevel || "—", label: "Safety" },
  ];
  $("statsRow").innerHTML = stats
    .map(
      (s) => `
    <div class="stat-box">
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>
  `,
    )
    .join("");

  const quickFacts = [
    { icon: "🗣️", key: "Language", value: c.language || "—" },
    { icon: "🔌", key: "Power Plug", value: c.powerPlug || "—" },
    { icon: "🚗", key: "Driving Side", value: c.drivingSide || "—" },
    { icon: "🌡️", key: "Climate", value: c.climate || "—" },
    { icon: "💳", key: "Tipping", value: c.tipping || "—" },
    { icon: "🌐", key: "Internet", value: c.internet || "—" },
  ].filter((f) => f.value !== "—");

  $("quickFacts").innerHTML = `
    <h3 class="card-label">Quick Facts</h3>
    <div class="quick-facts-list">
      ${quickFacts
        .map(
          (f) => `
        <div class="qf-item">
          <span class="qf-icon">${f.icon}</span>
          <div>
            <div class="qf-key">${f.key}</div>
            <div class="qf-value">${f.value}</div>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  `;

  // bestMonths can be a comma-separated string or an array
  let months = [];
  if (c.bestTimeToVisit) {
    months = c.bestTimeToVisit.split(",").map((m) => m.trim());
  }

  $("bestTime").innerHTML = `
    <h3 class="card-label">Best Time to Visit</h3>
    <div class="best-time-tags">
      ${months.length ? months.map((m) => `<span class="month-tag">${m}</span>`).join("") : '<span class="entry-desc">Not specified</span>'}
    </div>
  `;
}

// ============ POPULATE ENTRY ============
// Maps EntryRequirement entity:
//   visaStatus (GREEN/YELLOW/RED), visaLabel, visaNote,
//   passportValidity, requirementsList (List<String>),
//   vaccinations, insuranceNote, customsInfo, importantNote
function populateEntry(e) {
  if (!e) {
    $("entryGrid").innerHTML =
      '<div class="entry-card full-width"><p class="entry-desc">Entry requirement data unavailable.</p></div>';
    return;
  }

  const visaLabelMap = {
    VISA_FREE: "Visa-Free",
    VISA_REQUIRED: "Visa Required",
    E_VISA: "e-Visa",
  };

  const visaLabel =
    visaLabelMap[e.visaType] || e.visaType || "Check Requirements";

  const entryItems = [
    e.maxStayDays != null ? `Maximum stay: ${e.maxStayDays} days` : null,
    e.additionalNotes || null,
  ].filter(Boolean);

  $("entryGrid").innerHTML = `
    <div class="entry-card">
      <div class="entry-card-title">
        <span class="entry-icon">🛂</span> Visa Requirements
        <span class="entry-badge badge-yellow">${visaLabel}</span>
      </div>
      <p class="entry-desc">${visaLabel}</p>
    </div>

    <div class="entry-card">
      <div class="entry-card-title"><span class="entry-icon">📗</span> Passport Validity</div>
      <p class="entry-desc">${e.passportValidityRequired || "—"}</p>
    </div>

    <div class="entry-card">
      <div class="entry-card-title"><span class="entry-icon">📋</span> Entry Requirements</div>
      <div class="entry-list">
        ${
          entryItems.length
            ? entryItems
                .map((item) => `<div class="entry-list-item">${item}</div>`)
                .join("")
            : '<p class="entry-desc">—</p>'
        }
      </div>
    </div>

    <div class="entry-card">
      <div class="entry-card-title"><span class="entry-icon">💉</span> Health</div>
      ${e.vaccinationRequirements ? `<p class="entry-desc"><strong>Vaccinations:</strong> ${e.vaccinationRequirements}</p>` : '<p class="entry-desc">—</p>'}
      ${e.travelInsurance ? `<p class="entry-desc" style="margin-top:10px"><strong>Insurance:</strong> ${e.travelInsurance}</p>` : ""}
    </div>

    ${
      e.customsNotes
        ? `
        <div class="entry-card full-width">
          <div class="entry-card-title"><span class="entry-icon">🧳</span> Customs Notes</div>
          <p class="entry-desc">${e.customsNotes}</p>
        </div>
      `
        : ""
    }
  `;
}

// ============ POPULATE BUDGET ============
// Maps BudgetGuide entity:
//   budgetTierMin, budgetTierMax (budget tier daily range, string)
//   midTierMin, midTierMax, luxuryTierMin
//   budgetAccommodation, budgetFood, budgetTransport, budgetActivities  (and mid/luxury variants)
//   moneyTips (List<{icon,text}> or JSON string)
//
// The entity is expected to have either a structured tiers list OR flat fields.
// We support both: if `tiers` array exists, use it; otherwise build tiers from flat fields.
function populateBudget(b) {
  if (!b || !Array.isArray(b.tiers) || !b.tiers.length) {
    $("budgetLayout").innerHTML =
      '<div class="budget-tips-card"><div class="budget-tips-title">Budget data unavailable.</div></div>';
    return;
  }

  const currency = b.currency === "PHP" ? "₱" : "$";

  const format = (min, max) => {
    if (min && max) return `${currency}${min}–${max}`;
    if (min && !max) return `${currency}${min}+`;
    return "—";
  };

  const tiersHTML = b.tiers
    .map((t) => {
      const isMid = t.tierName === "MID_RANGE";

      return `
        <div class="budget-tier ${isMid ? "featured" : ""}">
          ${isMid ? '<div class="featured-badge">Most Popular</div>' : ""}
          
          <div class="budget-tier-name">${t.tierName.replace("_", " ")}</div>
          <div class="budget-tier-price">${format(t.dailyTotalMin, t.dailyTotalMax)}</div>
          <div class="budget-per-day">per person / day</div>

          <div class="budget-items">
            <div class="budget-item">
              <span>Accommodation</span>
              <span>${format(t.accommodationMin, t.accommodationMax)}</span>
            </div>
            <div class="budget-item">
              <span>Food</span>
              <span>${format(t.foodMin, t.foodMax)}</span>
            </div>
            <div class="budget-item">
              <span>Transport</span>
              <span>${format(t.transportMin, t.transportMax)}</span>
            </div>
            <div class="budget-item">
              <span>Activities</span>
              <span>${format(t.activitiesMin, t.activitiesMax)}</span>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  $("budgetLayout").innerHTML = `
    <div class="budget-tier-grid">
      ${tiersHTML}
    </div>

    ${
      b.savingTips
        ? `
      <div class="budget-tips-card">
        <div class="budget-tips-title">💡 Money-Saving Tips</div>
        <div class="budget-tip-text">${b.savingTips}</div>
      </div>
    `
        : ""
    }
  `;
}

function formatRange(min, max) {
  if (!min) return "—";
  return max ? `${min}–${max}` : `${min}+`;
}

function buildBudgetItems(b, tier) {
  const p = tier === "budget" ? "" : tier === "mid" ? "mid" : "luxury";
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
  const items = [
    { label: "Accommodation", field: `${p}${p ? "A" : "a"}ccommodation` },
    { label: "Food", field: `${p}${p ? "F" : "f"}ood` },
    { label: "Transport", field: `${p}${p ? "T" : "t"}ransport` },
    { label: "Activities", field: `${p}${p ? "A" : "a"}ctivities` },
  ];
  // Build with camelCase variations
  return [
    {
      label: "Accommodation",
      value: b[`${tier}Accommodation`] || b[`${cap(tier)}Accommodation`],
    },
    { label: "Food", value: b[`${tier}Food`] || b[`${cap(tier)}Food`] },
    {
      label: "Transport",
      value: b[`${tier}Transport`] || b[`${cap(tier)}Transport`],
    },
    {
      label: "Activities",
      value: b[`${tier}Activities`] || b[`${cap(tier)}Activities`],
    },
  ].filter((i) => i.value);
}

// ============ POPULATE PACKING ============
// Maps List<PackingCategoryDTO>:
//   PackingCategoryDTO { category (String), icon (String), items: List<PackingItem { itemText, essential }> }
function populatePacking(categories) {
  const key = currentCountrySlug;
  if (!packingState[key]) packingState[key] = {};

  if (!categories || !categories.length) {
    $("packingLayout").innerHTML =
      '<div class="info-card"><p class="entry-desc">Packing checklist unavailable.</p></div>';
    return;
  }

  const totalItems = categories.reduce(
    (sum, cat) => sum + (cat.items || []).length,
    0,
  );

  const updateProgress = () => {
    const checked = Object.values(packingState[key] || {}).filter(
      Boolean,
    ).length;
    const pct = totalItems ? Math.round((checked / totalItems) * 100) : 0;
    const fill = document.querySelector(".progress-fill");
    const text = document.querySelector(".progress-text");
    if (fill) fill.style.width = pct + "%";
    if (text) text.textContent = `${checked} / ${totalItems} packed`;
  };

  const catsHTML = categories
    .map(
      (cat, ci) => `
    <div class="packing-cat">
      <div class="packing-cat-header">
        <span class="packing-cat-icon">${cat.icon || "📦"}</span>
        <span class="packing-cat-title">${cat.category || cat.name || "Items"}</span>
        <span class="packing-cat-count">${(cat.items || []).length}</span>
      </div>
      <div class="packing-items">
        ${(cat.items || [])
          .map((item, ii) => {
            const itemKey = `${ci}-${ii}`;
            const checked = packingState[key][itemKey] || false;
            const text = item.itemText || item.text || "";
            const essential = item.essential || false;
            return `
            <div class="pack-item${checked ? " checked" : ""}" data-cat="${ci}" data-item="${ii}">
              <div class="pack-checkbox"></div>
              <span class="pack-item-text">${text}</span>
              ${essential ? '<span class="pack-essential">Essential</span>' : ""}
            </div>
          `;
          })
          .join("")}
      </div>
    </div>
  `,
    )
    .join("");

  const checkedCount = Object.values(packingState[key]).filter(Boolean).length;
  const pct = totalItems ? Math.round((checkedCount / totalItems) * 100) : 0;

  $("packingLayout").innerHTML = `
    <div class="info-card">
      <div class="packing-header">
        <h3 class="card-label" style="margin-bottom:0">Packing Checklist</h3>
        <div class="packing-progress">
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <span class="progress-text">${checkedCount} / ${totalItems} packed</span>
        </div>
      </div>
    </div>
    <div class="packing-categories">${catsHTML}</div>
  `;

  document.querySelectorAll(".pack-item").forEach((item) => {
    item.addEventListener("click", () => {
      const ci = item.dataset.cat;
      const ii = item.dataset.item;
      const itemKey = `${ci}-${ii}`;
      packingState[key][itemKey] = !packingState[key][itemKey];
      item.classList.toggle("checked", packingState[key][itemKey]);
      localStorage.setItem("travi_packing", JSON.stringify(packingState));
      updateProgress();
    });
  });
}

// ============ POPULATE TIPS ============
// Maps Map<String, List<LocalTip>> grouped by category
// LocalTip { title, body/text, category }
function populateTips(tipsMap) {
  if (!tipsMap) {
    $("tipsLayout").innerHTML =
      '<div class="tips-grid"><p class="entry-desc">Local tips unavailable.</p></div>';
    return;
  }

  // Flatten the grouped map into a flat array for the existing card layout
  const allTips = [];
  if (typeof tipsMap === "object" && !Array.isArray(tipsMap)) {
    Object.entries(tipsMap).forEach(([category, list]) => {
      (list || []).forEach((t) =>
        allTips.push({ ...t, tag: t.category || category }),
      );
    });
  } else if (Array.isArray(tipsMap)) {
    tipsMap.forEach((t) =>
      allTips.push({ ...t, tag: t.category || t.tag || "" }),
    );
  }

  if (!allTips.length) {
    $("tipsLayout").innerHTML =
      '<div class="tips-grid"><p class="entry-desc">No tips available.</p></div>';
    return;
  }

  $("tipsLayout").innerHTML = `
    <div class="tips-grid">
      ${allTips
        .map(
          (t, i) => `
        <div class="tip-card">
          <div class="tip-number">0${i + 1}</div>
          <div class="tip-title">${t.title || ""}</div>
          <div class="tip-text">${t.body || t.text || ""}</div>
          <span class="tip-tag">${t.tag || ""}</span>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

// ============ POPULATE CULTURE ============
// Maps Map<String, List<CultureGuideItem>> grouped by type
// Expected types/keys: "INSIGHT" | "DO" | "DONT"
// CultureGuideItem { title, description/text, icon, type }
function populateCulture(cultureMap) {
  if (!cultureMap) {
    $("cultureLayout").innerHTML =
      '<p class="entry-desc">Culture guide unavailable.</p>';
    return;
  }

  // Flatten entries by type
  const insights = [];
  const dos = [];
  const donts = [];

  const entries =
    typeof cultureMap === "object" && !Array.isArray(cultureMap)
      ? cultureMap
      : {};

  Object.entries(entries).forEach(([type, list]) => {
    const key = type.toUpperCase();
    (list || []).forEach((item) => {
      const obj = {
        icon: item.icon || "",
        title: item.title || "",
        text: item.description || item.text || "",
      };
      if (key === "INSIGHT" || key === "INSIGHTS") insights.push(obj);
      else if (key === "DO" || key === "DOS") dos.push(obj);
      else if (
        key === "DONT" ||
        key === "DONTS" ||
        key === "DON'T" ||
        key === "DON'TS"
      )
        donts.push(obj);
      else insights.push(obj); // fallback: treat unknown types as insights
    });
  });

  $("cultureLayout").innerHTML = `
    ${
      insights.length
        ? `
    <div class="culture-grid">
      ${insights
        .map(
          (i) => `
        <div class="culture-card">
          <div class="culture-icon">${i.icon}</div>
          <div class="culture-title">${i.title}</div>
          <div class="culture-text">${i.text}</div>
        </div>
      `,
        )
        .join("")}
    </div>`
        : ""
    }
    ${
      dos.length || donts.length
        ? `
    <div class="do-dont-grid">
      ${
        dos.length
          ? `
      <div class="do-list">
        <div class="do-dont-title">✅ Do</div>
        <div class="do-dont-items">
          ${dos.map((d) => `<div class="do-dont-item"><span class="marker">✓</span>${d.text || d.title}</div>`).join("")}
        </div>
      </div>`
          : ""
      }
      ${
        donts.length
          ? `
      <div class="dont-list">
        <div class="do-dont-title">🚫 Don't</div>
        <div class="do-dont-items">
          ${donts.map((d) => `<div class="do-dont-item"><span class="marker">✗</span>${d.text || d.title}</div>`).join("")}
        </div>
      </div>`
          : ""
      }
    </div>`
        : ""
    }
  `;
}

// ============ SAVED DESTINATIONS ============
// GET  /api/saved-destinations          → List<SavedDestinationResponse>
// POST /api/saved-destinations/{id}     → SavedDestinationResponse
// DEL  /api/saved-destinations/{id}     → 204

async function toggleSave(countryId) {
  if (!isLoggedIn()) {
    openAuthModal("login");
    showToast("Please sign in to save destinations.");
    return;
  }
  const isSaved = await checkIfSaved(countryId);
  try {
    if (isSaved) {
      await apiFetch(`/saved-destinations/${countryId}`, { method: "DELETE" });
      showToast("Removed from saved.");
    } else {
      await apiFetch(`/saved-destinations/${countryId}`, { method: "POST" });
      showToast("Destination saved!", "success");
    }
    updateSaveBtn();
    renderSavedSection();
  } catch (err) {
    showToast("Could not update saved destinations.", "error");
  }
}

async function checkIfSaved(countryId) {
  if (!isLoggedIn()) return false;
  try {
    const list = await apiFetch("/saved-destinations");
    return list.some(
      (s) => s.countryId === countryId || s.country?.id === countryId,
    );
  } catch (_) {
    return false;
  }
}

async function updateSaveBtn() {
  const btn = $("saveBtnDetail");
  if (!btn) return;
  if (!currentCountryId) return;
  const isSaved = await checkIfSaved(currentCountryId);
  btn.classList.toggle("saved", isSaved);
  btn.title = isSaved ? "Remove from saved" : "Save destination";
}

async function renderSavedSection() {
  const grid = $("savedGrid");
  const empty = $("savedEmpty");
  grid.querySelectorAll(".saved-card").forEach((c) => c.remove());

  if (!isLoggedIn()) {
    empty.style.display = "flex";
    empty.innerHTML = `
      <div class="empty-icon">✦</div>
      <p>Sign in to see your saved destinations.</p>
      <button class="btn-outline-sm btn-sign-in">Sign In</button>
    `;
    // rewire the sign-in button rendered inside the empty state
    const signInBtn = empty.querySelector(".btn-sign-in");
    if (signInBtn)
      signInBtn.addEventListener("click", () => openAuthModal("login"));
    return;
  }

  try {
    const saved = await apiFetch("/saved-destinations");
    if (!saved || !saved.length) {
      empty.style.display = "flex";
      empty.innerHTML = `
        <div class="empty-icon">✦</div>
        <p>No saved destinations yet.<br/>Explore and save places you love.</p>
        <a href="#explore" class="btn-outline-sm">Start Exploring</a>
      `;
      return;
    }

    empty.style.display = "none";
    saved.forEach((s) => {
      // SavedDestinationResponse: { id, countryId, countryName, countryFlag, countryRegion, countryGradient, ... }
      const id = s.countryId || s.country?.id;
      const name = s.countryName || s.country?.name || "Unknown";
      const flag = s.countryFlag || s.country?.flagEmoji || "🌍";
      const region = s.countryRegion || s.country?.region || "";
      const gradient =
        s.countryGradient || s.country?.gradientCss || defaultGradient(0);

      const card = el("div", "saved-card");
      card.innerHTML = `
        <div class="saved-card-img">
          <div class="saved-card-img-bg" style="background: ${gradient}; width:100%; height:100%;"></div>
          <div class="saved-card-img-overlay"></div>
          <div class="saved-card-flag">${flag}</div>
        </div>
        <div class="saved-card-body">
          <div>
            <div class="saved-card-name">${name}</div>
            <div class="saved-card-region">${region}</div>
          </div>
          <button class="saved-remove-btn" title="Remove">✕</button>
        </div>
      `;
      card
        .querySelector(".saved-card-img")
        .addEventListener("click", () => id && openCountry(id));
      card
        .querySelector(".saved-card-name")
        .parentElement.addEventListener("click", () => id && openCountry(id));
      card
        .querySelector(".saved-remove-btn")
        .addEventListener("click", async (e) => {
          e.stopPropagation();
          await toggleSave(id);
        });
      grid.appendChild(card);
    });
  } catch (err) {
    showToast("Could not load saved destinations.", "error");
    empty.style.display = "flex";
  }
}
