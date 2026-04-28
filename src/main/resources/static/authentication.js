/* ============================================================
   TRAVI — AUTHENTICATION PAGE JAVASCRIPT
   Handles: login, register, tab switching, animations,
            token persistence (localStorage), guest redirect.
   ============================================================ */

const API_BASE = "/api";

// ── DOM refs ──────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const tabLogin      = $("tabLogin");
const tabRegister   = $("tabRegister");
const tabIndicator  = $("tabIndicator");
const panelLogin    = $("panelLogin");
const panelRegister = $("panelRegister");
const panelSuccess  = $("panelSuccess");

const loginForm     = $("loginForm");
const registerForm  = $("registerForm");

const loginSubmit   = $("loginSubmit");
const registerSubmit= $("registerSubmit");

const successTitle   = $("successTitle");
const successSub     = $("successSub");
const successBarFill = $("successBarFill");

// ── Token / Auth helpers ──────────────────────────────────
function getToken()        { return localStorage.getItem("travi_token"); }
function setToken(t)       { localStorage.setItem("travi_token", t); }
function clearToken()      { localStorage.removeItem("travi_token"); }
function isLoggedIn()      { return !!getToken(); }
function getStoredUser()   { try { return JSON.parse(localStorage.getItem("travi_user")); } catch { return null; } }
function setStoredUser(u)  { localStorage.setItem("travi_user", JSON.stringify(u)); }

// ── API helper ────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Toast ──────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, type = "info") {
  const toast = $("authToast");
  if (!toast) return;
  toast.classList.remove("hidden", "toast-success", "toast-error", "show");
  toast.textContent = msg;
  if (type === "success") toast.classList.add("toast-success");
  if (type === "error")   toast.classList.add("toast-error");
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.classList.add("hidden"), 320);
  }, 3200);
}

// ── Tab indicator position ────────────────────────────────
function updateIndicator(activeTab) {
  if (!tabIndicator) return;
  tabIndicator.style.left  = activeTab.offsetLeft + "px";
  tabIndicator.style.width = activeTab.offsetWidth + "px";
}

// ── Switch panel ──────────────────────────────────────────
function switchPanel(to, direction = "right") {
  // Update tabs
  [tabLogin, tabRegister].forEach(t => t.classList.remove("active"));

  const panels = [panelLogin, panelRegister, panelSuccess];
  panels.forEach(p => {
    p.classList.remove("active", "slide-left");
    p.style.display = "none";
  });

  if (to === "login") {
    tabLogin.classList.add("active");
    updateIndicator(tabLogin);
    panelLogin.style.display = "block";
    panelLogin.classList.add("active");
    if (direction === "left") panelLogin.classList.add("slide-left");
    document.title = "Travi — Sign In";
  } else if (to === "register") {
    tabRegister.classList.add("active");
    updateIndicator(tabRegister);
    panelRegister.style.display = "block";
    panelRegister.classList.add("active");
    if (direction === "right") panelRegister.classList.add("slide-left");
    document.title = "Travi — Create Account";
  } else if (to === "success") {
    panelSuccess.style.display = "block";
    panelSuccess.classList.add("active");
    // Trigger progress bar
    requestAnimationFrame(() => {
      setTimeout(() => { successBarFill.style.width = "100%"; }, 60);
    });
  }
}

// ── Field validation helpers ──────────────────────────────
function setError(inputId, errId, msg) {
  const input = $(inputId);
  const err   = $(errId);
  if (input) input.classList.toggle("error", !!msg);
  if (err)   err.textContent = msg || "";
  return !!msg;
}

function clearErrors(...pairs) {
  pairs.forEach(([inputId, errId]) => setError(inputId, errId, ""));
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Password strength ─────────────────────────────────────
function checkStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8)                         score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd))                          score++;
  if (/[^A-Za-z0-9]/.test(pwd))               score++;
  return score; // 0-4
}

const STRENGTH_LABELS  = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_CLASSES = ["", "weak", "fair", "good", "strong"];
const STRENGTH_COLORS  = ["", "#ef4444", "#f59e0b", "#2A9D8F", "#10b981"];

function updateStrength(pwd) {
  const score = checkStrength(pwd);
  const bars  = [$("sBar1"), $("sBar2"), $("sBar3"), $("sBar4")];
  const label = $("strengthLabel");
  const cls   = STRENGTH_CLASSES[score] || "";
  bars.forEach((bar, i) => {
    bar.className = "strength-bar " + (i < score ? cls : "");
  });
  if (label) {
    label.textContent = pwd ? STRENGTH_LABELS[score] : "";
    label.style.color = pwd ? STRENGTH_COLORS[score] : "rgba(255,255,255,.4)";
  }
}

// ── Set loading state ─────────────────────────────────────
function setLoading(btn, loading) {
  const text   = btn.querySelector(".btn-text");
  const loader = btn.querySelector(".btn-loader");
  btn.disabled = loading;
  if (text)   text.style.opacity  = loading ? "0" : "1";
  if (loader) loader.classList.toggle("hidden", !loading);
}

// ── Show form-level error ─────────────────────────────────
function showFormError(id, msg) {
  const el = $(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
}
function hideFormError(id) {
  const el = $(id);
  if (el) el.classList.add("hidden");
}

// ── Handle Login ──────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  clearErrors(
    ["loginUsername", "loginUsernameErr"],
    ["loginPassword", "loginPasswordErr"]
  );
  hideFormError("loginFormError");

  const username = $("loginUsername").value.trim();
  const password = $("loginPassword").value;

  let hasErr = false;
  if (!username) hasErr = setError("loginUsername", "loginUsernameErr", "Username is required.") || hasErr;
  if (!password) hasErr = setError("loginPassword", "loginPasswordErr", "Password is required.") || hasErr;
  if (hasErr) return;

  setLoading(loginSubmit, true);

  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    // Persist token and user info
    setToken(data.token);
    const userInfo = {
      id:       data.id,
      username: data.username,
      email:    data.email,
      role:     data.role,
    };
    setStoredUser(userInfo);

    // Flag so index.html can show a welcome toast
    sessionStorage.setItem("travi_just_logged_in", "1");

    // Show success state
    successTitle.textContent = `Welcome back, ${data.username}!`;
    successSub.textContent   = "Redirecting you to your destinations…";
    switchPanel("success");
    showToast("Signed in successfully!", "success");

    // Redirect after animation
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);

  } catch (err) {
    setLoading(loginSubmit, false);
    const msg = parseApiError(err, "Invalid username or password. Please try again.");
    showFormError("loginFormError", msg);
    // Shake the card
    shakeCard();
  }
}

// ── Handle Register ───────────────────────────────────────
async function handleRegister(e) {
  e.preventDefault();
  clearErrors(
    ["regUsername", "regUsernameErr"],
    ["regEmail",    "regEmailErr"],
    ["regPassword", "regPasswordErr"]
  );
  hideFormError("registerFormError");

  const username = $("regUsername").value.trim();
  const email    = $("regEmail").value.trim();
  const password = $("regPassword").value;

  let hasErr = false;
  if (!username)               hasErr = setError("regUsername", "regUsernameErr", "Username is required.")        || hasErr;
  else if (username.length < 3)hasErr = setError("regUsername", "regUsernameErr", "At least 3 characters.")      || hasErr;
  if (!email)                  hasErr = setError("regEmail",    "regEmailErr",    "Email is required.")           || hasErr;
  else if (!validateEmail(email))hasErr= setError("regEmail",   "regEmailErr",    "Enter a valid email address.") || hasErr;
  if (!password)               hasErr = setError("regPassword", "regPasswordErr", "Password is required.")        || hasErr;
  else if (password.length < 6)hasErr = setError("regPassword", "regPasswordErr", "At least 6 characters.")      || hasErr;
  if (hasErr) return;

  setLoading(registerSubmit, true);

  try {
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });

    // Persist token and user
    setToken(data.token);
    const user = data.user || { id: data.id, username: data.username, email: data.email, role: data.role };
    setStoredUser(user);

    // Flag so index.html can show a welcome toast
    sessionStorage.setItem("travi_just_logged_in", "1");

    // Show success
    successTitle.textContent = `Welcome to Travi, ${user.username}!`;
    successSub.textContent   = "Your account is ready. Taking you home…";
    switchPanel("success");
    showToast("Account created! Welcome aboard!", "success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1900);

  } catch (err) {
    setLoading(registerSubmit, false);
    const msg = parseApiError(err, "Registration failed. Username or email may already be in use.");
    showFormError("registerFormError", msg);
    shakeCard();
  }
}

// ── Parse API error message ───────────────────────────────
function parseApiError(err, fallback) {
  try {
    const parsed = JSON.parse(err.message);
    return parsed.message || parsed.error || fallback;
  } catch {
    return err.message || fallback;
  }
}

// ── Card shake animation ──────────────────────────────────
function shakeCard() {
  const card = $("authCard");
  if (!card) return;
  card.style.animation = "none";
  requestAnimationFrame(() => {
    card.style.animation = "shakeCard .4s cubic-bezier(.4,0,.2,1)";
  });
}

// Inject shake keyframes dynamically (avoids polluting CSS)
const shakeStyle = document.createElement("style");
shakeStyle.textContent = `
@keyframes shakeCard {
  0%,100% { transform: translateX(0); }
  20%     { transform: translateX(-7px); }
  40%     { transform: translateX(7px); }
  60%     { transform: translateX(-4px); }
  80%     { transform: translateX(4px); }
}`;
document.head.appendChild(shakeStyle);

// ── Toggle password visibility ────────────────────────────
function initPasswordToggles() {
  document.querySelectorAll(".field-eye").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = $(btn.dataset.target);
      if (!input) return;
      const isText = input.type === "text";
      input.type = isText ? "password" : "text";
      const show = btn.querySelector(".eye-show");
      const hide = btn.querySelector(".eye-hide");
      if (show) show.style.display = isText ? "block" : "none";
      if (hide) hide.style.display = isText ? "none"  : "block";
    });
  });
}

// ── Panel tab click ───────────────────────────────────────
function initTabs() {
  if (tabLogin) {
    tabLogin.addEventListener("click", () => {
      if (!panelLogin.classList.contains("active")) switchPanel("login", "left");
    });
  }
  if (tabRegister) {
    tabRegister.addEventListener("click", () => {
      if (!panelRegister.classList.contains("active")) switchPanel("register", "right");
    });
  }
}

// ── Switch-link buttons (inside forms) ───────────────────
function initSwitchLinks() {
  document.querySelectorAll(".switch-link").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.switch;
      const dir    = target === "register" ? "right" : "left";
      switchPanel(target, dir);
    });
  });
}

// ── Password strength live update ─────────────────────────
function initStrength() {
  const input = $("regPassword");
  if (input) input.addEventListener("input", () => updateStrength(input.value));
}

// ── Redirect if already logged in ────────────────────────
function redirectIfLoggedIn() {
  if (isLoggedIn()) {
    // Verify token is still valid on the server, then redirect
    apiFetch("/auth/me")
      .then(user => {
        if (user) {
          setStoredUser(user);
          showToast(`Already signed in as ${user.username}. Redirecting…`);
          setTimeout(() => { window.location.href = "index.html"; }, 1200);
        }
      })
      .catch(() => {
        // Token is stale — clear it and stay on auth page
        clearToken();
        localStorage.removeItem("travi_user");
      });
  }
}

// ── URL param: ?mode=register ─────────────────────────────
function applyUrlMode() {
  const params = new URLSearchParams(window.location.search);
  const mode   = params.get("mode");
  if (mode === "register") switchPanel("register");
  else switchPanel("login");
}

// ── Keyboard: Escape clears errors ───────────────────────
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    hideFormError("loginFormError");
    hideFormError("registerFormError");
  }
});

// ── Init ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  redirectIfLoggedIn();
  applyUrlMode();
  initTabs();
  initSwitchLinks();
  initPasswordToggles();
  initStrength();

  if (loginForm)    loginForm.addEventListener("submit", handleLogin);
  if (registerForm) registerForm.addEventListener("submit", handleRegister);

  // Set initial indicator position after layout
  requestAnimationFrame(() => {
    const activeTab = document.querySelector(".panel-tab.active");
    if (activeTab) updateIndicator(activeTab);
  });
});