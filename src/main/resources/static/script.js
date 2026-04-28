const API_BASE = "/api";

// ============ STATE ============
let currentCountryId = null; // numeric ID from DB
let currentCountrySlug = null; // for packing state key
let currentUser = null;
let countriesCache = []; // List<Country> from GET /api/countries
let packingState = JSON.parse(localStorage.getItem("travi_packing") || "{}");

// ============ AUTH TOKEN ============
function getToken() {
  return localStorage.getItem("travi_token");
}
function setToken(token) {
  localStorage.setItem("travi_token", token);
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
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { 
    ...options, 
    headers 
  });

  // Only clear token for 401 Unauthorized, not 403 Forbidden
  if (res.status === 401) {
    clearToken();
    localStorage.removeItem("travi_user");
    updateAuthUI();
    throw new Error("Unauthorized - Please log in again");
  }
  
  // For 403, just throw the error without clearing token
  if (res.status === 403) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Forbidden: ${text || res.statusText}`);
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

// ── Redirect to authentication page instead of modal ──────
function openAuthModal(mode = "login") {
  // Save the current scroll position so we can restore it on return
  sessionStorage.setItem("travi_auth_return", window.location.href);
  window.location.href = `authentication.html?mode=${mode}`;
}

function closeAuthModal() {
  // No-op: kept for compatibility. Auth now lives on its own page.
}

function switchAuthMode(mode) {
  // No-op: kept for compatibility.
  openAuthModal(mode);
}

async function handleLogin(e) {
  // Login is now handled in authentication.html / authentication.js
  // This stub is kept for backward compatibility with any inline modal usage.
  e && e.preventDefault();
  openAuthModal("login");
}

async function handleRegister(e) {
  // Register is now handled in authentication.html / authentication.js
  e && e.preventDefault();
  openAuthModal("register");
}

function handleLogout() {
  clearToken();
  localStorage.removeItem("travi_user"); // Clear user data
  updateAuthUI();
  renderSavedSection();
  loadMyTrips();
  showToast("Logged out.");
}

function getCurrentUser() {
  const stored = localStorage.getItem("travi_user");
  return stored ? JSON.parse(stored) : null;
}

function setCurrentUser(user) {
  currentUser = user;
  if (user) {
    localStorage.setItem("travi_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("travi_user");
  }
}

function updateAuthUI() {
  const loggedIn = isLoggedIn();
  const currentUser = getCurrentUser();
  
  const signInBtns = document.querySelectorAll(".btn-sign-in");
  const getStartedBtns = document.querySelectorAll(".btn-get-started");
  const logoutBtns = document.querySelectorAll(".btn-logout");

  signInBtns.forEach((b) => (b.style.display = loggedIn ? "none" : ""));
  getStartedBtns.forEach((b) => (b.style.display = loggedIn ? "none" : ""));
  logoutBtns.forEach((b) => (b.style.display = loggedIn ? "" : "none"));
  
  // Optional: Add username display in navbar
  let usernameSpan = document.querySelector(".nav-username");
  if (!usernameSpan && loggedIn && currentUser) {
    // Create username display if it doesn't exist
    const navLinks = $("navLinks");
    if (navLinks) {
      const li = document.createElement("li");
      usernameSpan = document.createElement("span");
      usernameSpan.className = "nav-username";
      usernameSpan.style.cssText = "color: white; padding: 8px 14px; font-weight: 500;";
      usernameSpan.textContent = currentUser.username;
      li.appendChild(usernameSpan);
      // Insert before logout button
      const logoutLi = navLinks.querySelector("li:has(.btn-logout)");
      if (logoutLi) {
        navLinks.insertBefore(li, logoutLi);
      }
    }
  } else if (usernameSpan && (!loggedIn || !currentUser)) {
    usernameSpan.remove();
  } else if (usernameSpan && currentUser) {
    usernameSpan.textContent = currentUser.username;
  }
}

// ============ AUTH REDIRECT PROMPT ============
// Shows a branded in-page overlay nudge instead of a jarring redirect.
function promptAuthRedirect(mode = "login", action = "") {
  // Remove any existing prompt
  const existing = document.getElementById("authPromptOverlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "authPromptOverlay";
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:3000;
    background:rgba(30,42,50,0.72);
    backdrop-filter:blur(6px);
    display:flex; align-items:center; justify-content:center;
    padding:20px;
    animation: authPromptIn .25s cubic-bezier(.4,0,.2,1) both;
  `;

  const card = document.createElement("div");
  card.style.cssText = `
    background:#fff;
    border-radius:20px;
    padding:36px 32px;
    max-width:400px; width:100%;
    text-align:center;
    box-shadow:0 32px 80px rgba(0,0,0,0.35);
    animation: authCardIn .35s cubic-bezier(.34,1.56,.64,1) .05s both;
  `;

  const actionText = action ? `<p style="font-size:.88rem;color:#8fa3b0;margin-bottom:24px;line-height:1.5;">
    To <strong>${action}</strong>, you need to be signed in.
  </p>` : "";

  card.innerHTML = `
    <div style="font-size:2.2rem;margin-bottom:12px;">✈️</div>
    <h2 style="font-family:'Playfair Display',serif;font-size:1.55rem;color:#1E2A32;margin-bottom:8px;">
      Sign in to continue
    </h2>
    ${actionText}
    <div style="display:flex;flex-direction:column;gap:12px;">
      <a href="authentication.html?mode=${mode}"
         style="display:block;padding:13px;background:linear-gradient(135deg,#FF7E5F,#e8613a);
                color:#fff;border-radius:100px;font-weight:700;font-size:.95rem;
                font-family:'DM Sans',sans-serif;
                box-shadow:0 4px 18px rgba(255,126,95,.38);
                transition:all .22s ease;text-decoration:none;">
        Sign In
      </a>
      <a href="authentication.html?mode=register"
         style="display:block;padding:12px;border:1.5px solid #dde4e8;color:#1E2A32;
                border-radius:100px;font-weight:500;font-size:.9rem;
                font-family:'DM Sans',sans-serif;
                transition:all .22s ease;text-decoration:none;">
        Create an Account
      </a>
      <button onclick="document.getElementById('authPromptOverlay').remove()"
              style="background:none;border:none;color:#8fa3b0;font-size:.85rem;
                     cursor:pointer;font-family:'DM Sans',sans-serif;
                     padding:4px;transition:color .18s ease;">
        Continue as guest
      </button>
    </div>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Close on backdrop click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Inject keyframes once
  if (!document.getElementById("authPromptStyles")) {
    const st = document.createElement("style");
    st.id = "authPromptStyles";
    st.textContent = `
      @keyframes authPromptIn { from{opacity:0} to{opacity:1} }
      @keyframes authCardIn   { from{opacity:0;transform:translateY(24px) scale(.96)} to{opacity:1;transform:none} }
    `;
    document.head.appendChild(st);
  }
}

// ============ WELCOME BACK TOAST (on return from auth page) ============
function maybeShowWelcomeBack() {
  const flag = sessionStorage.getItem("travi_just_logged_in");
  if (flag) {
    sessionStorage.removeItem("travi_just_logged_in");
    const user = getCurrentUser();
    const name = user ? user.username : "traveler";
    showToast(`Welcome back, ${name}! 🌍`, "success");
  }
}
document.addEventListener("DOMContentLoaded", async () => {
  initNavbar();
  initHamburger();
  initAuthModal();

  // ── DIAGNOSTIC: token state on page load ──
  console.group("🛫 Travi boot");
  console.log("token in localStorage:", localStorage.getItem("travi_token") ? "✅ present" : "❌ missing");
  console.log("user  in localStorage:", localStorage.getItem("travi_user")  ? "✅ present" : "❌ missing");

  const verifiedUser = await verifyCurrentUser();
  console.log("verifyCurrentUser() =>", verifiedUser
    ? ("✅ " + verifiedUser.username + " (id=" + verifiedUser.id + ")")
    : "❌ null — token invalid or missing");

  updateAuthUI();
  maybeShowWelcomeBack();

  await loadCountries();
  console.log("countries loaded:", countriesCache.length);

  renderDestinationsGrid();

  console.log("renderSavedSection — isLoggedIn():", isLoggedIn());
  await renderSavedSection();

  initSearch();
  initHeroChips();

  console.log("initPlanner — getCurrentUser():", getCurrentUser());
  await initPlanner();

  console.groupEnd();
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
  const overlay = $("sidebarOverlay");

  function openSidebar() {
    links.classList.add("open");
    btn.classList.add("open");
    if (overlay) overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    links.classList.remove("open");
    btn.classList.remove("open");
    if (overlay) overlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (btn && links) {
    btn.addEventListener("click", () => {
      links.classList.contains("open") ? closeSidebar() : openSidebar();
    });
  }

  if (overlay) {
    overlay.addEventListener("click", closeSidebar);
  }

  // Close sidebar when a nav link is clicked
  if (links) {
    links.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", closeSidebar);
    });
  }

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && links && links.classList.contains("open")) {
      closeSidebar();
    }
  });
}

// ============ AUTH MODAL INIT ============
function initAuthModal() {
  // Sign-in / Get-started / Logout buttons in the navbar
  document.querySelectorAll(".btn-sign-in").forEach((b) => {
    b.addEventListener("click", () => openAuthModal("login"));
  });
  document.querySelectorAll(".btn-get-started").forEach((b) => {
    b.addEventListener("click", () => openAuthModal("register"));
  });
  document.querySelectorAll(".btn-logout").forEach((b) => {
    b.addEventListener("click", handleLogout);
  });

  // The inline modal elements (kept in HTML for legacy) — close if they somehow appear
  const closeBtn = $("authModalClose");
  if (closeBtn) closeBtn.addEventListener("click", closeAuthModal);

  const modal = $("authModal");
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeAuthModal(); });
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

    // Set currency for this country (budget guide may override later)
    if (country.currency) currentCurrencyCode = country.currency.toUpperCase();

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

  // Set the global currency so formatCurrency picks it up everywhere
  if (b.currency) currentCurrencyCode = b.currency.toUpperCase();

  const { symbol, locale } = getCurrencyInfo(currentCurrencyCode);

  const fmt = (num) =>
    num != null
      ? symbol + Number(num).toLocaleString(locale, { maximumFractionDigits: 0 })
      : "—";

  const format = (min, max) => {
    if (min != null && max != null) return `${fmt(min)}–${fmt(max)}`;
    if (min != null) return `${fmt(min)}+`;
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
    showToast("Sign in to save destinations ✈️");
    promptAuthRedirect("login", "Save this destination");
    return;
  }
  
  try {
    const isSaved = await checkIfSaved(countryId);
    if (isSaved) {
      await apiFetch(`/saved-destinations/${countryId}`, { method: "DELETE" });
      showToast("Removed from saved.");
    } else {
      await apiFetch(`/saved-destinations/${countryId}`, { method: "POST" });
      showToast("Destination saved!", "success");
    }
    updateSaveBtn();
    await renderSavedSection();
  } catch (err) {
    console.error("Error toggling save:", err);
    if (err.message.includes("Unauthorized")) {
      openAuthModal("login");
      showToast("Please sign in again.", "error");
    } else {
      showToast("Could not update saved destinations.", "error");
    }
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
  
  // Clear existing cards
  grid.querySelectorAll(".saved-card").forEach((c) => c.remove());

  if (!isLoggedIn()) {
    empty.style.display = "flex";
    empty.innerHTML = `
      <div class="empty-icon">✦</div>
      <p>Sign in to see your saved destinations.</p>
      <button class="btn-outline-sm btn-sign-in">Sign In</button>
    `;
    const signInBtn = empty.querySelector(".btn-sign-in");
    if (signInBtn) {
      signInBtn.addEventListener("click", () => openAuthModal("login"));
    }
    return;
  }

  // Show a loading state while fetching
  empty.style.display = "none";
  grid.innerHTML += `<div id="savedLoading" style="color:var(--text-muted);padding:24px;font-size:.9rem;">Loading saved destinations…</div>`;

  try {
    console.log("renderSavedSection: calling GET /api/saved-destinations …");
    const saved = await apiFetch("/saved-destinations");
    console.log("renderSavedSection: server returned →", saved);
    // Remove loading indicator
    const loadingEl = $("savedLoading");
    if (loadingEl) loadingEl.remove();

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
      const id = s.countryId || s.country?.id;
      const name = s.countryName || s.country?.name || "Unknown";
      const flag = s.countryFlag || s.country?.flagEmoji || "🌍";
      const region = s.countryRegion || s.country?.region || "";
      const gradient = s.countryGradient || s.country?.gradientCss || defaultGradient(0);

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
      
      card.querySelector(".saved-card-img").addEventListener("click", () => id && openCountry(id));
      card.querySelector(".saved-card-name").parentElement.addEventListener("click", () => id && openCountry(id));
      card.querySelector(".saved-remove-btn").addEventListener("click", async (e) => {
        e.stopPropagation();
        await toggleSave(id);
      });
      grid.appendChild(card);
    });
  } catch (err) {
    const loadingEl = $("savedLoading");
    if (loadingEl) loadingEl.remove();
    console.error("Error loading saved destinations:", err);
    if (err.message.includes("Unauthorized")) {
      // Token expired — clear and prompt re-login
      clearToken();
      localStorage.removeItem("travi_user");
      updateAuthUI();
      empty.style.display = "flex";
      empty.innerHTML = `
        <div class="empty-icon">✦</div>
        <p>Session expired. Please sign in again.</p>
        <button class="btn-outline-sm btn-sign-in">Sign In</button>
      `;
      const signInBtn = empty.querySelector(".btn-sign-in");
      if (signInBtn) {
        signInBtn.addEventListener("click", () => openAuthModal("login"));
      }
    } else {
      showToast("Could not load saved destinations.", "error");
      empty.style.display = "flex";
    }
  }
}

// ============ TRAVEL PLANNER ============

let currentPlannerTrip = null;
let currentPlannerDays = [];
let currentPlannerDestinationId = null;

async function initPlanner() {
  const newTripBtn = $("newTripBtn");
  const tripForm = $("tripForm");
  const closeTripBtn = $("closeTripModal");
  const closeItineraryBtn = $("closeItineraryModal");
  const planTripBtn = $("planTripBtn");
  const closeEditActivityBtn = $("closeEditActivityModal");
  const editActivityForm = $("editActivityForm");
  const budgetTierSelect = $("budgetTierSelect");

  if (newTripBtn) {
    newTripBtn.addEventListener("click", () => openPlannerModal());
  }

  if (tripForm) {
    tripForm.addEventListener("submit", handleCreatePlan);
  }

  if (closeTripBtn) {
    closeTripBtn.addEventListener("click", closePlannerModal);
  }

  if (closeItineraryBtn) {
    closeItineraryBtn.addEventListener("click", closeItineraryModal);
  }

  if (budgetTierSelect) {
    budgetTierSelect.addEventListener("change", renderTripBudget);
  }

  if (planTripBtn) {
    planTripBtn.addEventListener("click", () => {
      if (!currentCountryId) return;
      openPlannerModal(currentCountryId);
    });
  }

  if (closeEditActivityBtn) {
    closeEditActivityBtn.addEventListener("click", closeEditActivityModal);
  }

  if (editActivityForm) {
    editActivityForm.addEventListener("submit", handleUpdateActivity);
  }

  ["tripModal", "itineraryModal", "editActivityModal"].forEach((modalId) => {
    const modal = $(modalId);
    if (!modal) return;

    modal.addEventListener("click", (e) => {
      if (e.target !== modal) return;

      if (modalId === "tripModal") closePlannerModal();
      if (modalId === "itineraryModal") closeItineraryModal();
      if (modalId === "activityModal") closeActivityModal();
    });
  });

  await loadMyTrips();
}

function openPlannerModal(destinationId = null) {
  if (!isLoggedIn()) {
    showToast("Sign in to plan your trip ✈️");
    promptAuthRedirect("login", "Create a trip plan");
    return;
  }

  populateTripDestinationSelect(destinationId);

  const form = $("tripForm");
  if (form) form.reset();

  if (destinationId) {
    $("tripDestinationId").value = String(destinationId);

    const country = findCountry(destinationId);
    if (country) {
      $("tripTitle").value = `${country.name} Trip`;
    }
  }

  $("tripModal").classList.remove("hidden");
}

function closePlannerModal() {
  $("tripModal").classList.add("hidden");
}

function populateTripDestinationSelect(selectedId = null) {
  const select = $("tripDestinationId");
  if (!select) return;

  select.innerHTML = countriesCache
    .map(
      (country) => `
        <option value="${country.id}" ${Number(selectedId) === Number(country.id) ? "selected" : ""}>
          ${country.flagEmoji || "🌍"} ${country.name}
        </option>
      `,
    )
    .join("");
}

async function handleCreatePlan(e) {
  e.preventDefault();

  const destinationId = Number($("tripDestinationId").value);
  const numberOfDays = Number($("tripNumberOfDays").value);
  const travelStyle = $("tripTravelStyle").value;
  const peopleCount = Number($("tripPeopleCount").value || 1);
  const representativeName = $("tripRepresentativeName").value.trim();
  const notes = $("tripNotes").value.trim();
  const totalBudget = parseFloat($("tripTotalBudget").value) || null;

  if (!destinationId || !numberOfDays) {
    showToast("Please select a country and number of days.", "error");
    return;
  }

  const country = findCountry(destinationId);
  const user = getCurrentUser();

  if (!user) {
    showToast("Please sign in to create a trip.", "error");
    promptAuthRedirect("login", "Create a trip plan");
    return;
  }

  const payload = {
    userId: user.id, // Use actual user ID
    countryId: destinationId,
    title: `${country?.name || "Travel"} ${numberOfDays}-Day Trip`,
    numberOfDays,
    peopleCount,
    representativeName,
    travelStyle,
    totalBudget,
    notes,
  };

  try {
    const trip = await apiFetch("/trips/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    closePlannerModal();
    showToast("Trip plan generated!", "success");
    await renderGeneratedPlan(trip);
    await loadMyTrips(); // Refresh the trips list
  } catch (err) {
    console.error(err);
    showToast("Could not generate trip plan.", "error");
  }
}

async function verifyCurrentUser() {
  if (!isLoggedIn()) {
    console.log("verifyCurrentUser: no token, skipping");
    return null;
  }
  try {
    console.log("verifyCurrentUser: calling GET /api/auth/me …");
    const user = await apiFetch("/auth/me");
    console.log("verifyCurrentUser: server returned →", user);
    setCurrentUser(user);
    return user;
  } catch (err) {
    console.warn("verifyCurrentUser: /auth/me failed →", err.message);
    
    // Only clear token for 401, not 403
    if (err.message.includes("Unauthorized")) {
      console.log("verifyCurrentUser: clearing token due to 401");
      clearToken();
      localStorage.removeItem("travi_user");
      updateAuthUI();
    }
    // For 403 or other errors, keep the token and return null
    return null;
  }
}

async function renderGeneratedPlan(trip) {
  const tripId = trip.id || trip.tripId;

  if (!tripId) {
    showToast("Generated trip has no ID.", "error");
    return;
  }

  await openItinerary(tripId);
}

async function createMissingTripDays(tripId, startDate, numberOfDays) {
  const start = new Date(`${startDate}T00:00:00`);

  for (let i = 0; i < numberOfDays; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    await apiFetch("/trip-days", {
      method: "POST",
      body: JSON.stringify({
        tripId,
        dayNumber: i + 1,
        date: toLocalDate(date),
        notes: "",
      }),
    });
  }
}

async function loadMyTrips() {
  const grid = $("plannerTripsGrid");
  if (!grid) return;

  if (!isLoggedIn()) {
    renderPlannerEmptyState();
    return;
  }

  // Use in-memory/localStorage user; if missing, fetch it now
  let user = getCurrentUser();
  if (!user) {
    try {
      user = await apiFetch("/auth/me");
      setCurrentUser(user);
    } catch {
      renderPlannerEmptyState();
      return;
    }
  }

  grid.innerHTML = `
    <div class="planner-empty">
      <div class="empty-icon">✈</div>
      <p>Loading your trips...</p>
    </div>
  `;

  try {
    console.log("loadMyTrips: calling GET /api/trips/user/" + user.id + " …");
    const trips = await apiFetch(`/trips/user/${user.id}`);
    console.log("loadMyTrips: server returned →", trips);
    renderPlannerTrips(Array.isArray(trips) ? trips : []);
  } catch (err) {
    console.error(err);
    grid.innerHTML = `
      <div class="planner-empty">
        <div class="empty-icon">!</div>
        <p>Could not load your trips.</p>
      </div>
    `;
  }
}

function renderPlannerTrips(trips) {
  const grid = $("plannerTripsGrid");
  if (!grid) return;

  if (!trips.length) {
    grid.innerHTML = `
      <div class="planner-empty">
        <div class="empty-icon">✈</div>
        <p>No trips yet.<br/>Create your first travel plan.</p>
        <button class="btn-primary-sm" onclick="openPlannerModal()">+ New Trip</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = trips
    .map((trip) => {
      const destination = getTripDestinationName(trip);
      const range = formatTripRange(trip.startDate, trip.endDate);
      const notes = trip.notes || "No notes yet.";

      return `
        <article class="trip-card">
          <span class="trip-status">${trip.status || "Planning"}</span>
          <h3>${escapeText(trip.title || "Untitled Trip")}</h3>
          <div class="trip-meta">${escapeText(destination)} · ${range}</div>
          <p class="trip-notes">${escapeText(notes)}</p>

          <div class="trip-actions">
            <button class="btn-primary-sm" onclick="openItinerary(${trip.id})">View Plan</button>
            <button class="btn-outline-sm" onclick="deleteTrip(${trip.id})">Delete</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderPlannerEmptyState() {
  const grid = $("plannerTripsGrid");
  if (!grid) return;

  grid.innerHTML = `
    <div class="planner-empty">
      <div class="empty-icon">✦</div>
      <p>Sign in to create and manage your travel plans.</p>
      <button class="btn-outline-sm" onclick="promptAuthRedirect('login','Create a trip plan')">Sign In</button>
    </div>
  `;
}

async function openItinerary(tripId) {
  try {
    const [trip, days] = await Promise.all([
      apiFetch(`/trips/${tripId}`),
      apiFetch(`/trip-days/trip/${tripId}`).catch(() => []),
    ]);

    currentPlannerTrip = trip;
    currentPlannerDays = Array.isArray(days) ? days : [];

    const countryId =
      trip.countryId ||
      trip.country?.id ||
      trip.destinationId ||
      trip.destination?.id;

    currentPlannerDestinationId = countryId;

    // Resolve currency from trip's country data
    const tripCountry =
      trip.country ||
      trip.destination ||
      findCountry(countryId);
    if (tripCountry?.currency) {
      currentCurrencyCode = tripCountry.currency.toUpperCase();
    } else if (countryId) {
      // Fallback: look up from cache
      const cached = findCountry(countryId);
      if (cached?.currency) currentCurrencyCode = cached.currency.toUpperCase();
    }

    renderItinerary(trip, currentPlannerDays);

    $("itineraryModal").classList.remove("hidden");

    if (countryId) {
      await loadTripBudget(countryId);
    }

    if (trip.totalBudget && trip.totalBudget > 0) {
      await loadBudgetForecast(tripId);
    } else if (countryId) {
      await loadTripBudget(countryId);
    }
  } catch (err) {
    console.error(err);
    showToast("Could not open itinerary.", "error");
  }
}

function closeItineraryModal() {
  $("itineraryModal").classList.add("hidden");
}

async function loadBudgetForecast(tripId) {
  try {
    const forecast = await apiFetch(`/trips/${tripId}/budget-forecast`);
    renderBudgetForecast(forecast);
  } catch (err) {
    console.warn("Budget forecast not available:", err.message);
    // Fall back to the old budget display
    if (currentPlannerDestinationId) {
      await loadTripBudget(currentPlannerDestinationId);
    }
  }
}

function renderItinerary(trip, days = []) {
  const content = $("itineraryContent");
  if (!content) return;

  const destinationName = getTripDestinationName(trip);
  const range = formatTripRange(trip.startDate, trip.endDate);

  content.innerHTML = `
    <div class="itinerary-header">
      <span class="trip-status">${trip.status || "Planning"}</span>
      <h2>${escapeText(trip.title || "Untitled Trip")}</h2>
      <p>${escapeText(destinationName)} · ${range}</p>
      ${trip.notes ? `<p style="margin-top:10px">${escapeText(trip.notes)}</p>` : ""}
    </div>

    <!--ADD BUDGET HERE-->
    <div class="trip-budget-summary" id="tripBudgetSummary">
      <div class="budget-summary-header">
        <div>
          <span class="budget-eyebrow">Estimated Budget</span>
          <h3>Trip cost estimate</h3>
        </div>

        <select id="budgetTierSelect">
          <option value="BUDGET">Budget</option>
          <option value="MID_RANGE" selected>Mid-range</option>
          <option value="LUXURY">Luxury</option>
        </select>
      </div>

      <div class="budget-summary-grid">
        <div>
          <span>Per day</span>
          <strong id="budgetPerDay">—</strong>
        </div>

        <div>
          <span>Total trip</span>
          <strong id="budgetTotal">—</strong>
        </div>

        <div>
          <span>Per person</span>
          <strong id="budgetPerPerson">—</strong>
        </div>
      </div>

      <p id="budgetSavingTips" class="budget-saving-tips"></p>
    </div>

    <div style="display:flex; justify-content:space-between; gap:12px; align-items:center; margin-bottom:18px;">
      <h3 style="font-family:var(--font-display); color:var(--primary-dark);">Itinerary</h3>
    </div>

    <div class="itinerary-days">
      ${
        days.length
          ? days
              .sort((a, b) => Number(a.dayNumber) - Number(b.dayNumber))
              .map(renderItineraryDay)
              .join("")
          : `
            <div class="planner-empty">
              <div class="empty-icon">☀</div>
              <p>No days yet.</p>
              <button class="btn-primary-sm" onclick="handleAddDay()">+ Add Day</button>
            </div>
          `
      }
    </div>
  `;

  // ✅ IMPORTANT: rebind event AFTER render
  const select = $("budgetTierSelect");
  if (select) {
    select.addEventListener("change", renderTripBudget);
  }
}

function renderItineraryDay(day) {
  const activities = day.activities || day.tripActivities || day.trip_activities || [];

  return `
    <article class="itinerary-day-card itinerary-timeline-day">
      <div class="day-card-header">
        <div>
          <h3>Day ${day.dayNumber}</h3>
          <div class="day-date">${formatDateText(day.date)}</div>
        </div>

        <div class="day-actions">
          <span class="trip-status">Generated</span>
          <button class="btn-outline-sm" onclick="openActivityModal(${day.id})">+ Activity</button>
        </div>
      </div>

      ${day.notes ? `<p class="trip-notes">${escapeText(day.notes)}</p>` : ""}

      <div class="activity-timeline">
        ${
          activities.length
            ? activities
                .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
                .map(renderActivityCard)
                .join("")
            : `<div class="empty-day-activity">No activities yet. Add one manually.</div>`
        }
      </div>
    </article>
  `;
}

function renderActivityCard(activity) {
  const placeName = activity.placeName || activity.place?.name || "Selected place";

  return `
    <div class="activity-card timeline-activity-card">
      <div class="activity-dot"></div>

      <div class="activity-main">
        <div class="activity-top">
          <div>
            <div class="activity-time">
               ${normalizeTime(activity.startTime)} - ${normalizeTime(activity.endTime)}
            </div>
            <strong>${escapeText(activity.title || placeName)}</strong>
          </div>

          <div class="activity-actions">
            <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn-outline-sm" onclick="openEditActivityModal(${activity.id})">
                Edit
              </button>
              <button class="btn-outline-sm" onclick="deleteTripActivity(${activity.id})">
                Delete
              </button>
            </div>
          </div>
        </div>

        ${
          activity.notes
            ? `<div class="activity-notes">${escapeText(activity.notes)}</div>`
            : `<div class="activity-notes muted">No notes added.</div>`
        }
      </div>
    </div>
  `;
}

function openEditActivityModal(activityId) {
  showToast("Edit activity UI coming next.", "info");
}

async function handleAddDay() {
  if (!currentPlannerTrip) return;

  const nextDayNumber = currentPlannerDays.length + 1;
  const baseDate = new Date(`${currentPlannerTrip.startDate}T00:00:00`);
  baseDate.setDate(baseDate.getDate() + nextDayNumber - 1);

  try {
    await apiFetch("/trip-days", {
      method: "POST",
      body: JSON.stringify({
        tripId: currentPlannerTrip.id,
        dayNumber: nextDayNumber,
        date: toLocalDate(baseDate),
        notes: "",
      }),
    });

    showToast("Day added.", "success");
    await openItinerary(currentPlannerTrip.id);
  } catch (err) {
    console.error(err);
    showToast("Could not add day.", "error");
  }
}

async function openActivityModal(tripDayId) {
  $("activityTripDayId").value = tripDayId;
  $("editActivityId").value = ""; // create mode
  $("activityForm").reset();
  $("editActivityTripDayId").value = tripDayId; // re-set after reset
  $("activityTripDayId").value = tripDayId;

  await populateActivityPlaces();

  $("activityModal").classList.remove("hidden");
}

function closeActivityModal() {
  $("activityModal").classList.add("hidden");
}

async function populateActivityPlaces() {
  const select = $("activityPlaceId");
  if (!select) return;

  select.innerHTML = `<option value="">Loading places...</option>`;

  try {
    const destinationId =
      currentPlannerDestinationId ||
      currentPlannerTrip?.destinationId ||
      currentPlannerTrip?.destination?.id;

    const places = await apiFetch(`/places/destination/${destinationId}`);

    select.innerHTML = places.length
      ? places
          .map(
            (place) => `
              <option value="${place.id}">
                ${place.name}
              </option>
            `,
          )
          .join("")
      : `<option value="">No places available</option>`;
  } catch (err) {
    console.error(err);
    select.innerHTML = `<option value="">Could not load places</option>`;
  }
}

async function handleCreateActivity(e) {
  e.preventDefault();

  const payload = {
    tripDayId: Number($("activityTripDayId").value),
    placeId: Number($("activityPlaceId").value),
    startTime: $("activityStartTime").value,
    endTime: $("activityEndTime").value,
    notes: $("activityNotes").value.trim(),
  };

  if (!payload.tripDayId || !payload.placeId || !payload.startTime || !payload.endTime) {
    showToast("Please complete the activity form.", "error");
    return;
  }

  try {
    await apiFetch("/trip-activities", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    closeActivityModal();
    showToast("Activity added.", "success");

    if (currentPlannerTrip?.id) {
      await openItinerary(currentPlannerTrip.id);
    }
  } catch (err) {
    console.error(err);
    showToast("Could not add activity.", "error");
  }
}

async function deleteTrip(tripId) {
  if (!confirm("Delete this trip?")) return;

  try {
    await apiFetch(`/trips/${tripId}`, { method: "DELETE" });
    showToast("Trip deleted.");
    await loadMyTrips();
  } catch (err) {
    console.error(err);
    showToast("Could not delete trip.", "error");
  }
}

async function deleteTripDay(dayId) {
  if (!confirm("Delete this day?")) return;

  try {
    await apiFetch(`/trip-days/${dayId}`, { method: "DELETE" });
    showToast("Day deleted.");

    if (currentPlannerTrip?.id) {
      await openItinerary(currentPlannerTrip.id);
    }
  } catch (err) {
    console.error(err);
    showToast("Could not delete day.", "error");
  }
}

async function deleteTripActivity(activityId) {
  if (!confirm("Delete this activity?")) return;

  try {
    await apiFetch(`/trip-activities/${activityId}`, { method: "DELETE" });
    showToast("Activity deleted.");

    if (currentPlannerTrip?.id) {
      await openItinerary(currentPlannerTrip.id);
    }
  } catch (err) {
    console.error(err);
    showToast("Could not delete activity.", "error");
  }
}

function findCountry(id) {
  return countriesCache.find((country) => Number(country.id) === Number(id));
}

function getTripDestinationName(trip) {
  return (
    trip.countryName ||
    trip.destinationName ||
    trip.country?.name ||
    trip.destination?.name ||
    findCountry(trip.countryId)?.name ||
    findCountry(trip.destinationId)?.name ||
    "Unknown destination"
  );
}

function formatTripRange(startDate, endDate) {
  if (!startDate && !endDate) return "No dates yet";
  if (startDate && !endDate) return formatDateText(startDate);
  return `${formatDateText(startDate)} – ${formatDateText(endDate)}`;
}

function formatDateText(value) {
  if (!value) return "No date";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toLocalDate(date) {
  return date.toISOString().slice(0, 10);
}

function escapeText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


function findActivityById(activityId) {
  for (const day of currentPlannerDays) {
    const activities =
      day.activities ||
      day.tripActivities ||
      day.trip_activities ||
      [];

    const activity = activities.find(
      (item) => Number(item.id) === Number(activityId)
    );

    if (activity) return activity;
  }

  return null;
}

async function openEditActivityModal(activityId) {
  const activity = findActivityById(activityId);

  if (!activity) {
    showToast("Activity not found.", "error");
    return;
  }

  $("editActivityId").value = activity.id;
  $("editActivityStartTime").value = normalizeTime(activity.startTime);
  $("editActivityEndTime").value = normalizeTime(activity.endTime);
  $("editActivityNotes").value = activity.notes || "";

  await populateEditActivityPlaces(activity.placeId || activity.place?.id);

  $("editActivityModal").classList.remove("hidden");
}

function closeEditActivityModal() {
  $("editActivityModal").classList.add("hidden");
}

async function populateEditActivityPlaces(selectedPlaceId = null) {
  const select = $("editActivityPlaceId");
  if (!select) return;

  select.innerHTML = `<option value="">Loading places...</option>`;

  try {
    const countryId =
      currentPlannerTrip?.countryId ||
      currentPlannerTrip?.country?.id ||
      currentCountryId;

    if (!countryId) {
      throw new Error("Country ID missing");
    }

    const places = await apiFetch(`/places/country/${countryId}`);

    select.innerHTML = places.length
      ? places
          .map(
            (place) => `
              <option value="${place.id}" ${
                Number(selectedPlaceId) === Number(place.id) ? "selected" : ""
              }>
                ${escapeText(place.name)}
              </option>
            `
          )
          .join("")
      : `<option value="">No places available</option>`;
  } catch (err) {
    console.error(err);
    select.innerHTML = `<option value="">Could not load places</option>`;
    showToast("Could not load places.", "error");
  }
}

async function handleUpdateActivity(e) {
  e.preventDefault();

  const activityId = $("editActivityId").value ? Number($("editActivityId").value) : null;
  const tripDayId = $("editActivityTripDayId").value ? Number($("editActivityTripDayId").value) : null;
  const placeId = Number($("editActivityPlaceId").value);
  const startTime = $("editActivityStartTime").value;
  const endTime = $("editActivityEndTime").value;
  const notes = $("editActivityNotes").value.trim();

  // Validate required fields
  if (!placeId || !startTime || !endTime) {
    showToast("Please complete the form.", "error");
    return;
  }

  // Must have either activityId (update) or tripDayId (create)
  if (!activityId && !tripDayId) {
    showToast("Missing activity or day information.", "error");
    return;
  }

  const payload = {
    placeId: placeId,
    startTime: startTime,
    endTime: endTime,
    notes: notes,
  };

  try {
    if (!activityId && tripDayId) {
      // CREATE — no activityId, but we have a tripDayId
      payload.tripDayId = tripDayId;
      await apiFetch("/trip-activities", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast("Activity added.", "success");
    } else {
      // UPDATE — activityId exists
      await apiFetch(`/trip-activities/${activityId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast("Activity updated.", "success");
    }

    closeEditActivityModal();

    if (currentPlannerTrip?.id) {
      await openItinerary(currentPlannerTrip.id);
    }
  } catch (err) {
    console.error(err);
    showToast("Could not save activity.", "error");
  }
}

function normalizeTime(value) {
  if (!value) return "";
  
  const parts = String(value).split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${displayHours}:${minutes} ${period}`;
}

let currentBudgetGuide = null;

async function loadTripBudget(countryId) {
  try {
    currentBudgetGuide = await apiFetch(`/budgets/country/${countryId}`);
    renderTripBudget();
  } catch (err) {
    console.warn("No budget guide found for country:", countryId);

    currentBudgetGuide = null;

    if ($("budgetPerDay")) $("budgetPerDay").textContent = "No data";
    if ($("budgetTotal")) $("budgetTotal").textContent = "No data";
    if ($("budgetPerPerson")) $("budgetPerPerson").textContent = "No data";
    if ($("budgetSavingTips")) {
      $("budgetSavingTips").textContent =
        "Budget estimate is not available for this country yet.";
    }
  }
}

function renderTripBudget() {
  if (!currentBudgetGuide || !currentPlannerTrip) return;

  const selectedTier = $("budgetTierSelect")?.value || "MID_RANGE";
  const tier = currentBudgetGuide.tiers.find(t => t.tierName === selectedTier);

  if (!tier) return;

  const days = currentPlannerDays.length || currentPlannerTrip.numberOfDays || 1;
  const people = currentPlannerTrip.peopleCount || 1;

  const perDayMin = Number(tier.dailyTotalMin);
  const perDayMax = Number(tier.dailyTotalMax);

  const totalMin = perDayMin * days * people;
  const totalMax = perDayMax * days * people;

  const perPersonMin = perDayMin * days;
  const perPersonMax = perDayMax * days;

  $("budgetPerDay").textContent = formatMoneyRange(
    currentBudgetGuide.currency,
    perDayMin,
    perDayMax
  );

  $("budgetTotal").textContent = formatMoneyRange(
    currentBudgetGuide.currency,
    totalMin,
    totalMax
  );

  $("budgetPerPerson").textContent = formatMoneyRange(
    currentBudgetGuide.currency,
    perPersonMin,
    perPersonMax
  );

  $("budgetSavingTips").textContent = currentBudgetGuide.savingTips || "";
}

function formatMoneyRange(currency, min, max) {
  const code = (currency || currentCurrencyCode || "PHP").toUpperCase();
  const info = getCurrencyInfo(code);
  const fmt = (n) => info.symbol + Number(n).toLocaleString(info.locale, { maximumFractionDigits: 0 });
  return `${fmt(min)} - ${fmt(max)}`;
}

function formatNumber(value) {
  const info = getCurrencyInfo(currentCurrencyCode);
  return Number(value).toLocaleString(info.locale, {
    maximumFractionDigits: 0
  });
}

// ============ SMART BUDGET FORECAST RENDERING ============

const BUDGET_CATEGORY_CONFIG = {
  ACCOMMODATION:         { icon: "🏨", label: "Accommodation", barClass: "bar-accommodation" },
  FOOD_DINING:           { icon: "🍽️", label: "Food & Dining", barClass: "bar-food" },
  ACTIVITIES_ATTRACTIONS: { icon: "🎫", label: "Activities", barClass: "bar-activities" },
  TRANSPORTATION:        { icon: "🚇", label: "Transport", barClass: "bar-transport" },
  SHOPPING:              { icon: "🛍️", label: "Shopping", barClass: "bar-shopping" },
  MISCELLANEOUS:         { icon: "📦", label: "Miscellaneous", barClass: "bar-misc" },
  EMERGENCY_BUFFER:      { icon: "🆘", label: "Emergency Buffer", barClass: "bar-buffer" }
};

function renderBudgetForecast(forecast) {
  const container = document.getElementById("tripBudgetSummary");
  if (!container || !forecast) return;

  if (!forecast.totalBudget || forecast.totalBudget === 0) {
    container.innerHTML = `
      <div class="trip-budget-summary" style="background: linear-gradient(135deg, #0f172a, #1e3a8a); color: #fff; padding: 28px; border-radius: var(--radius-xl); text-align: center;">
        <div style="font-size: 2rem; margin-bottom: 12px;">💰</div>
        <h3 style="font-family: var(--font-display); margin-bottom: 8px;">Set Your Budget</h3>
        <p style="color: rgba(255,255,255,0.6);">Add a total budget to see smart allocation suggestions.</p>
      </div>
    `;
    return;
  }

  const totalBudget = forecast.totalBudget || 0;
  const allocations = forecast.allocatedAmounts || {};
  const percentages = forecast.allocatedPercentages || {};
  const tips = forecast.tips || {};
  const status = forecast.currentStatus || {};
  const travelStyle = forecast.travelStyle || "SOLO";
  const dailyBudget = forecast.dailyBudget || 0;
  const numberOfDays = forecast.numberOfDays || 1;

  // Status badge
  const statusClass = getStatusClass(status.statusMessage);
  const statusLabel = formatStatusLabel(status.statusMessage);

  // Build allocation rows
  const allocationRows = Object.entries(BUDGET_CATEGORY_CONFIG)
    .filter(([key]) => allocations[key] != null)
    .map(([key, config]) => {
      const amount = allocations[key] || 0;
      const percent = percentages[key] || 0;
      const percentDisplay = (parseFloat(percent) * 100).toFixed(0);
      const maxAllocation = Math.max(...Object.values(allocations).map(a => parseFloat(a || 0)), 1);
      const barWidth = maxAllocation > 0 ? (parseFloat(amount) / maxAllocation) * 100 : 0;

      return `
        <div class="budget-allocation-item">
          <div class="budget-allocation-icon">${config.icon}</div>
          <div class="budget-allocation-info">
            <div class="budget-allocation-label">
              <span>${config.label}</span>
              <span>
                ${formatCurrency(amount)}
                <span class="budget-allocation-percent">(${percentDisplay}%)</span>
              </span>
            </div>
            <div class="budget-allocation-bar-bg">
              <div class="budget-allocation-bar-fill ${config.barClass}" style="width: ${barWidth}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join("");

  // Build tips rows
  const tipRows = Object.entries(tips)
    .map(([key, tip]) => `<div class="budget-tip-item">${escapeText(tip)}</div>`)
    .join("");

  container.innerHTML = `
    <div class="budget-forecast">
      <div class="budget-forecast-header">
        <div>
          <div class="budget-eyebrow">Smart Budget Allocation</div>
          <h3>${escapeText(travelStyle)} Travel • ${numberOfDays} Days</h3>
        </div>
        <div class="budget-total-display">
          <div class="budget-total-amount">${formatCurrency(totalBudget)}</div>
          <div class="budget-total-label">
            ${formatCurrency(dailyBudget)} / day
            <span class="budget-status-badge budget-status-${statusClass}">${statusLabel}</span>
          </div>
        </div>
      </div>

      <div class="budget-allocation-list">
        ${allocationRows}
      </div>

      ${tipRows ? `
        <div class="budget-forecast-tips">
          <h4>💡 Smart Tips</h4>
          <div class="budget-forecast-tips-grid">
            ${tipRows}
          </div>
        </div>
      ` : ""}
    </div>
  `;
}

function getStatusClass(statusMessage) {
  if (!statusMessage) return "healthy";
  const s = statusMessage.toUpperCase();
  if (s.includes("OVER")) return "over";
  if (s.includes("CRITICAL")) return "critical";
  return "healthy";
}

function formatStatusLabel(statusMessage) {
  if (!statusMessage) return "On Track";
  const s = statusMessage.toUpperCase();
  if (s.includes("OVER_BUDGET")) return "Over Budget";
  if (s.includes("CRITICAL")) return "Almost Out";
  if (s.includes("HEALTHY")) return "On Track";
  if (s.includes("NO_BUDGET")) return "No Budget Set";
  return escapeText(statusMessage);
}

// ============ CURRENCY SYSTEM ============

// ISO 4217 → { symbol, locale, symbolAfter? }
const CURRENCY_MAP = {
  // Southeast Asia
  PHP: { symbol: "₱",  locale: "en-PH" },
  THB: { symbol: "฿",  locale: "th-TH" },
  VND: { symbol: "₫",  locale: "vi-VN" },
  IDR: { symbol: "Rp", locale: "id-ID" },
  MYR: { symbol: "RM", locale: "ms-MY" },
  SGD: { symbol: "S$", locale: "en-SG" },
  MMK: { symbol: "K",  locale: "my-MM" },
  KHR: { symbol: "៛",  locale: "km-KH" },
  LAK: { symbol: "₭",  locale: "lo-LA" },
  BND: { symbol: "B$", locale: "ms-BN" },

  // East Asia
  CNY: { symbol: "¥",  locale: "zh-CN" },
  JPY: { symbol: "¥",  locale: "ja-JP" },
  KRW: { symbol: "₩",  locale: "ko-KR" },
  TWD: { symbol: "NT$",locale: "zh-TW" },
  HKD: { symbol: "HK$",locale: "zh-HK" },
  MOP: { symbol: "P",  locale: "zh-MO" },

  // South Asia
  INR: { symbol: "₹",  locale: "en-IN" },
  NPR: { symbol: "₨",  locale: "ne-NP" },
  PKR: { symbol: "₨",  locale: "ur-PK" },
  LKR: { symbol: "₨",  locale: "si-LK" },
  BDT: { symbol: "৳",  locale: "bn-BD" },
  MVR: { symbol: "Rf", locale: "dv-MV" },
  BTN: { symbol: "Nu", locale: "dz-BT" },

  // Middle East & Central Asia
  AED: { symbol: "د.إ", locale: "ar-AE" },
  SAR: { symbol: "﷼",  locale: "ar-SA" },
  QAR: { symbol: "﷼",  locale: "ar-QA" },
  KWD: { symbol: "KD", locale: "ar-KW" },
  BHD: { symbol: "BD", locale: "ar-BH" },
  OMR: { symbol: "﷼",  locale: "ar-OM" },
  JOD: { symbol: "JD", locale: "ar-JO" },
  ILS: { symbol: "₪",  locale: "he-IL" },
  TRY: { symbol: "₺",  locale: "tr-TR" },
  IRR: { symbol: "﷼",  locale: "fa-IR" },
  KZT: { symbol: "₸",  locale: "kk-KZ" },
  UZS: { symbol: "so'm", locale: "uz-UZ" },

  // Europe
  EUR: { symbol: "€",  locale: "de-DE" },
  GBP: { symbol: "£",  locale: "en-GB" },
  CHF: { symbol: "Fr", locale: "de-CH" },
  NOK: { symbol: "kr", locale: "nb-NO" },
  SEK: { symbol: "kr", locale: "sv-SE" },
  DKK: { symbol: "kr", locale: "da-DK" },
  PLN: { symbol: "zł", locale: "pl-PL" },
  CZK: { symbol: "Kč", locale: "cs-CZ" },
  HUF: { symbol: "Ft", locale: "hu-HU" },
  RON: { symbol: "lei",locale: "ro-RO" },
  BGN: { symbol: "лв", locale: "bg-BG" },
  HRK: { symbol: "kn", locale: "hr-HR" },
  RSD: { symbol: "din", locale: "sr-RS" },
  UAH: { symbol: "₴",  locale: "uk-UA" },
  RUB: { symbol: "₽",  locale: "ru-RU" },
  ISK: { symbol: "kr", locale: "is-IS" },
  ALL: { symbol: "L",  locale: "sq-AL" },
  MKD: { symbol: "ден", locale: "mk-MK" },
  BAM: { symbol: "KM", locale: "bs-BA" },

  // Americas
  USD: { symbol: "$",  locale: "en-US" },
  CAD: { symbol: "CA$",locale: "en-CA" },
  MXN: { symbol: "MX$",locale: "es-MX" },
  BRL: { symbol: "R$", locale: "pt-BR" },
  ARS: { symbol: "$",  locale: "es-AR" },
  CLP: { symbol: "$",  locale: "es-CL" },
  COP: { symbol: "$",  locale: "es-CO" },
  PEN: { symbol: "S/", locale: "es-PE" },
  UYU: { symbol: "$U", locale: "es-UY" },
  BOB: { symbol: "Bs", locale: "es-BO" },
  PYG: { symbol: "₲",  locale: "es-PY" },
  GTQ: { symbol: "Q",  locale: "es-GT" },
  CRC: { symbol: "₡",  locale: "es-CR" },
  DOP: { symbol: "RD$",locale: "es-DO" },
  CUP: { symbol: "₱",  locale: "es-CU" },

  // Africa
  ZAR: { symbol: "R",  locale: "en-ZA" },
  NGN: { symbol: "₦",  locale: "en-NG" },
  KES: { symbol: "KSh",locale: "sw-KE" },
  GHS: { symbol: "₵",  locale: "en-GH" },
  EGP: { symbol: "£",  locale: "ar-EG" },
  MAD: { symbol: "MAD",locale: "ar-MA" },
  ETB: { symbol: "Br", locale: "am-ET" },
  TZS: { symbol: "TSh",locale: "sw-TZ" },
  UGX: { symbol: "USh",locale: "sw-UG" },
  XOF: { symbol: "CFA",locale: "fr-SN" },
  XAF: { symbol: "FCFA",locale: "fr-CM" },

  // Oceania
  AUD: { symbol: "A$", locale: "en-AU" },
  NZD: { symbol: "NZ$",locale: "en-NZ" },
  FJD: { symbol: "FJ$",locale: "en-FJ" },
  PGK: { symbol: "K",  locale: "en-PG" },
};

// Currently active currency code (updated when a country is opened or a trip loaded)
let currentCurrencyCode = "PHP";

/** Resolve currency info from an ISO code, falling back to USD. */
function getCurrencyInfo(code) {
  return CURRENCY_MAP[(code || "").toUpperCase()] || { symbol: code || "$", locale: "en-US" };
}

/** Format a number as currency using the current country's currency. */
function formatCurrency(amount, currencyCode) {
  const num = parseFloat(amount);
  if (isNaN(num)) {
    const info = getCurrencyInfo(currencyCode || currentCurrencyCode);
    return `${info.symbol}0`;
  }
  const info = getCurrencyInfo(currencyCode || currentCurrencyCode);
  return info.symbol + num.toLocaleString(info.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}