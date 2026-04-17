const API_BASE = "/api";

let countries = [];
let filteredCountries = [];
let currentEditingId = null;

/* ============ AUTH ============ */
function getToken() {
  return localStorage.getItem("wayfarer_token");
}

function clearToken() {
  localStorage.removeItem("wayfarer_token");
}

/* ============ API ============ */
async function apiFetch(path, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    throw new Error("Unauthorized");
  }

  if (response.status === 403) {
    throw new Error("Forbidden");
  }

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(text || response.statusText);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
}

/* ============ DOM HELPERS ============ */
function $(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showToast(message, type = "info") {
  let toast = document.getElementById("wayfarerAdminToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "wayfarerAdminToast";
    toast.style.cssText = `
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 9999;
      max-width: 360px;
      padding: 14px 18px;
      border-radius: 12px;
      color: #fff;
      font-size: 0.92rem;
      font-weight: 500;
      box-shadow: 0 12px 30px rgba(0,0,0,0.22);
      opacity: 0;
      transform: translateY(8px);
      transition: all 0.2s ease;
      pointer-events: none;
      background: #111827;
    `;
    document.body.appendChild(toast);
  }

  if (type === "success") toast.style.background = "#065f46";
  else if (type === "error") toast.style.background = "#991b1b";
  else if (type === "warning") toast.style.background = "#92400e";
  else toast.style.background = "#111827";

  toast.textContent = message;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
  }, 2800);
}

function setLoadingState(isLoading) {
  const tbody = $("countryTableBody");
  if (!tbody) return;

  if (isLoading) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="padding:24px; text-align:center; color:#7d879c;">
          Loading countries...
        </td>
      </tr>
    `;
  }
}

/* ============ INIT ============ */
document.addEventListener("DOMContentLoaded", async () => {
  initNav();
  initSearch();
  initActions();
  injectCountryModal();

  await bootstrapAdminPage();
});

async function bootstrapAdminPage() {
  try {
    setLoadingState(true);

    await Promise.all([
      loadDashboard().catch((err) => {
        console.warn("Dashboard load skipped:", err.message);
      }),
      loadCountries(),
      loadActivity().catch((err) => {
        console.warn("Activity load skipped:", err.message);
      }),
    ]);
  } catch (err) {
    handleBootstrapError(err);
  }
}

function handleBootstrapError(err) {
  console.error("Admin bootstrap failed:", err);

  if (err.message === "Unauthorized") {
    showToast("Please sign in first.", "error");
    return;
  }

  if (err.message === "Forbidden") {
    showToast("Admin access only.", "error");
    renderCountries([]);
    renderActivities([]);
    return;
  }

  showToast("Failed to load admin data.", "error");
  renderCountries([]);
  renderActivities([]);
}

/* ============ LOADERS ============ */
async function loadCountries() {
  countries = await apiFetch("/admin/countries");
  filteredCountries = [...countries];
  renderCountries(filteredCountries);
}

async function loadDashboard() {
  const data = await apiFetch("/admin/dashboard");

  if ($("totalCountries"))
    $("totalCountries").textContent = formatNumber(data.totalCountries ?? 0);
  if ($("publishedGuides"))
    $("publishedGuides").textContent = formatNumber(data.publishedGuides ?? 0);
  if ($("draftUpdates"))
    $("draftUpdates").textContent = formatNumber(data.draftUpdates ?? 0);
  if ($("totalSaves"))
    $("totalSaves").textContent = formatNumber(data.totalSaves ?? 0);
}

async function loadActivity() {
  const items = await apiFetch("/admin/activity");
  renderActivities(Array.isArray(items) ? items : []);
}

/* ============ RENDER COUNTRIES ============ */
function renderCountries(items) {
  const tbody = $("countryTableBody");
  if (!tbody) return;

  if (!items || !items.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="padding:24px; text-align:center; color:#7d879c;">
          No countries found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items
    .map((country) => {
      const id = Number(country.id);
      const flag = escapeHtml(country.flagEmoji || country.flag || "🌍");
      const name = escapeHtml(country.name || "Unknown");
      const region = escapeHtml(country.region || "-");
      const status = country.status || inferCountryStatus(country);
      const updatedAt = formatDate(
        country.updatedAt || country.updated_at || country.lastUpdated,
      );

      return `
      <tr>
        <td>
          <div class="country-cell">
            <div class="flag-box">${flag}</div>
            <span>${name}</span>
          </div>
        </td>
        <td>${region}</td>
        <td>${renderStatusBadge(status)}</td>
        <td>${updatedAt}</td>
        <td>
          <div class="table-actions">
            <button class="mini-btn" data-action="view" data-id="${id}">View</button>
            <button class="mini-btn" data-action="edit" data-id="${id}">Edit</button>
            <button class="mini-btn" data-action="delete" data-id="${id}">Delete</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");

  bindCountryActionButtons();
}

function bindCountryActionButtons() {
  document.querySelectorAll("[data-action='view']").forEach((btn) => {
    btn.addEventListener("click", () => handleView(Number(btn.dataset.id)));
  });

  document.querySelectorAll("[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => handleEdit(Number(btn.dataset.id)));
  });

  document.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", () => handleDelete(Number(btn.dataset.id)));
  });
}

function inferCountryStatus(country) {
  if (typeof country.published === "boolean") {
    return country.published ? "Published" : "Draft";
  }
  return "Draft";
}

/* ============ RENDER ACTIVITY ============ */
function renderActivities(items) {
  const container = $("activityList");
  if (!container) return;

  if (!items || !items.length) {
    container.innerHTML = `
      <div class="list-item">
        <div>
          <h4>No recent activity</h4>
          <p>Recent admin actions will appear here once your backend provides them.</p>
        </div>
        <span class="badge badge-warning">Empty</span>
      </div>
    `;
    return;
  }

  container.innerHTML = items
    .map((item) => {
      const title = escapeHtml(item.title || item.action || "Activity");
      const description = escapeHtml(
        item.description ||
          item.message ||
          item.details ||
          "No description available.",
      );
      const status = item.status || item.type || "Info";

      return `
      <div class="list-item">
        <div>
          <h4>${title}</h4>
          <p>${description}</p>
        </div>
        ${renderStatusBadge(status)}
      </div>
    `;
    })
    .join("");
}

/* ============ BADGES ============ */
function renderStatusBadge(status) {
  const raw = String(status || "Unknown");
  const normalized = raw.toLowerCase();

  if (["published", "live", "saved", "ready", "success"].includes(normalized)) {
    return `<span class="badge badge-success">${escapeHtml(raw)}</span>`;
  }

  if (["draft", "pending", "warning"].includes(normalized)) {
    return `<span class="badge badge-warning">${escapeHtml(raw)}</span>`;
  }

  return `<span class="badge badge-danger">${escapeHtml(raw)}</span>`;
}

/* ============ NAV ============ */
function initNav() {
  const navItems = document.querySelectorAll(".nav-item");
  const pageTitle = $("pageTitle");
  const pageSubtitle = $("pageSubtitle");

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();

      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");

      const section = item.dataset.section || "dashboard";

      if (pageTitle) pageTitle.textContent = formatSectionTitle(section);
      if (pageSubtitle) pageSubtitle.textContent = getSectionSubtitle(section);
    });
  });
}

function formatSectionTitle(section) {
  switch (section) {
    case "dashboard":
      return "Editorial Command Center";
    case "analytics":
      return "Analytics Overview";
    case "users":
      return "User Management";
    case "countries":
      return "Country Management";
    case "requirements":
      return "Entry Requirements";
    case "budgets":
      return "Budget Guides";
    case "packing":
      return "Packing Checklists";
    case "tips":
      return "Local Tips";
    case "culture":
      return "Culture Guides";
    case "drafts":
      return "Draft Management";
    case "publish":
      return "Publish Queue";
    case "settings":
      return "System Settings";
    default:
      return "Wayfarer Admin";
  }
}

function getSectionSubtitle(section) {
  switch (section) {
    case "dashboard":
      return "Manage destinations, keep travel data accurate, and publish updates with confidence.";
    case "analytics":
      return "Track engagement, saves, and content performance across the platform.";
    case "users":
      return "Monitor user activity, saved destinations, and account-level insights.";
    case "countries":
      return "Create, update, publish, and archive country destination pages.";
    case "requirements":
      return "Maintain visa notes, passport rules, vaccinations, and customs guidance.";
    case "budgets":
      return "Update budget tiers, accommodation costs, transport, and saving tips.";
    case "packing":
      return "Manage packing categories, essentials, and arrival-ready checklists.";
    case "tips":
      return "Publish local travel advice, etiquette reminders, and practical guidance.";
    case "culture":
      return "Curate customs, do’s and don’ts, and country-specific cultural insights.";
    case "drafts":
      return "Review unpublished content and prepare updates before going live.";
    case "publish":
      return "Approve content changes and control what becomes visible to travelers.";
    case "settings":
      return "Manage admin preferences, permissions, and operational controls.";
    default:
      return "Admin tools for managing Wayfarer content.";
  }
}

/* ============ SEARCH ============ */
function initSearch() {
  const input = $("searchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();

    filteredCountries = countries.filter((country) => {
      const name = String(country.name || "").toLowerCase();
      const region = String(country.region || "").toLowerCase();
      const status = String(
        country.status || inferCountryStatus(country),
      ).toLowerCase();

      return (
        name.includes(query) || region.includes(query) || status.includes(query)
      );
    });

    renderCountries(filteredCountries);
  });
}

/* ============ ACTIONS ============ */
function initActions() {
  const exportBtn = $("exportBtn");
  const addCountryBtn = $("addCountryBtn");

  if (exportBtn) {
    exportBtn.addEventListener("click", handleExportCountries);
  }

  if (addCountryBtn) {
    addCountryBtn.addEventListener("click", handleAddCountry);
  }
}

function handleExportCountries() {
  if (!countries.length) {
    showToast("No countries to export.", "warning");
    return;
  }

  const rows = [
    ["ID", "Flag", "Name", "Region", "Status", "Updated At"],
    ...countries.map((country) => [
      country.id ?? "",
      country.flagEmoji || country.flag || "",
      country.name || "",
      country.region || "",
      country.status || inferCountryStatus(country),
      country.updatedAt || country.updated_at || country.lastUpdated || "",
    ]),
  ];

  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "wayfarer-admin-countries.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
  showToast("Countries exported.", "success");
}

function handleAddCountry() {
  currentEditingId = null;
  openCountryModal("Add Country", {
    name: "",
    code: "",
    capital: "",
    currency: "",
    language: "",
    timeZone: "",
    bestTimeToVisit: "",
    safetyLevel: "",
    flagUrl: "",
    overview: ""
  });
}

function handleView(countryId) {
  const country = countries.find(c => Number(c.id) === Number(countryId));
  if (!country) {
    showToast("Country not found.", "error");
    return;
  }

  openCountryModal("View Country", {
    name: country.name || "",
    code: country.code || "",
    capital: country.capital || "",
    currency: country.currency || "",
    language: country.language || "",
    timeZone: country.timeZone || "",
    bestTimeToVisit: country.bestTimeToVisit || "",
    safetyLevel: country.safetyLevel || "",
    flagUrl: country.flagUrl || "",
    overview: country.overview || ""
  }, true);
}

function handleEdit(countryId) {
  const country = countries.find(c => Number(c.id) === Number(countryId));
  if (!country) {
    showToast("Country not found.", "error");
    return;
  }

  currentEditingId = countryId;
  openCountryModal("Edit Country", {
    name: country.name || "",
    code: country.code || "",
    capital: country.capital || "",
    currency: country.currency || "",
    language: country.language || "",
    timeZone: country.timeZone || "",
    bestTimeToVisit: country.bestTimeToVisit || "",
    safetyLevel: country.safetyLevel || "",
    flagUrl: country.flagUrl || "",
    overview: country.overview || ""
  });
}

async function handleDelete(countryId) {
  const confirmed = window.confirm("Delete this country?");
  if (!confirmed) return;

  try {
    await apiFetch(`/admin/countries/${countryId}`, {
      method: "DELETE",
    });

    showToast("Country deleted.", "success");
    await loadCountries();
    await loadDashboard().catch(() => {});
  } catch (err) {
    console.error(err);
    showToast(`Delete failed: ${err.message}`, "error");
  }
}

/* ============ MODAL ============ */
function injectCountryModal() {
  if ($("countryModal")) return;

  const modal = document.createElement("div");
  modal.id = "countryModal";
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(10, 15, 30, 0.55);
    display: none;
    align-items: flex-start;
    justify-content: center;
    z-index: 9998;
    padding: 24px;
    overflow-y: auto;
    `;

  modal.innerHTML = `
    <div style="
      width: 100%;
      max-width: 560px;
      background: #ffffff;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.22);
    ">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
        <h3 id="countryModalTitle" style="font-size:1.35rem;margin:0;">Country</h3>
        <button id="closeCountryModalBtn" style="
          border:none;
          background:#f3f4f6;
          width:36px;
          height:36px;
          border-radius:999px;
          cursor:pointer;
          font-size:18px;
        ">×</button>
      </div>

      <form id="countryForm">
        <div style="display:grid;gap:14px;">
        <div>
            <label for="countryName" style="display:block;margin-bottom:8px;font-weight:600;">Name</label>
            <input id="countryName" name="name" type="text" required style="width:100%;padding:12px 14px;border:1px solid #d1d5db;border-radius:12px;">
        </div>

        <div>
            <label for="countryCode" style="display:block;margin-bottom:8px;font-weight:600;">Code</label>
            <input id="countryCode" name="code" type="text" placeholder="JPN" style="width:100%;padding:12px 14px;border:1px solid #d1d5db;border-radius:12px;">
        </div>

        <div>
            <label for="countryCapital" style="display:block;margin-bottom:8px;font-weight:600;">Capital</label>
            <input id="countryCapital" name="capital" type="text" placeholder="Tokyo" style="width:100%;padding:12px 14px;border:1px solid #d1d5db;border-radius:12px;">
        </div>

        <div>
            <label for="countryCurrency" style="display:block;margin-bottom:8px;font-weight:600;">Currency</label>
            <input id="countryCurrency" name="currency" type="text" placeholder="Japanese Yen" style="width:100%;padding:12px 14px;border:1px solid #d1d5db;border-radius:12px;">
        </div>

        <div>
            <label for="countryLanguage" style="display:block;margin-bottom:8px;font-weight:600;">Language</label>
            <input id="countryLanguage" name="language" type="text" placeholder="Japanese" style="width:100%;padding:12px 14px;border:1px solid #d1d5db;border-radius:12px;">
        </div>

        <div>
            <label for="countryTimeZone" style="display:block;margin-bottom:8px;font-weight:600;">Time Zone</label>
            <input id="countryTimeZone" name="timeZone" type="text" placeholder="JST (UTC+9)" style="width:100%;padding:12px 14px;border:1px solid #d1d5db;border-radius:12px;">
        </div>

        <div>
            <label for="countryBestTimeToVisit" style="display:block;margin-bottom:8px;font-weight:600;">Best Time to Visit</label>
            <input id="countryBestTimeToVisit" name="bestTimeToVisit" type="text" placeholder="March to May, October to November" style="width:100%;padding:12px 14px;border:1px solid #d1d5db;border-radius:12px;">
        </div>

        <div>
            <label for="countrySafetyLevel" style="display:block;margin-bottom:8px;font-weight:600;">Safety Level</label>
            <input id="countrySafetyLevel" name="safetyLevel" type="text" placeholder="High" style="width:100%;padding:12px 14px;border:1px solid #d1d5db;border-radius:12px;">
        </div>

        <div>
            <label for="countryFlagUrl" style="display:block;margin-bottom:8px;font-weight:600;">Flag URL</label>
            <input id="countryFlagUrl" name="flagUrl" type="text" placeholder="https://..." style="width:100%;padding:12px 14px;border:1px solid #d1d5db;border-radius:12px;">
        </div>

        <div>
            <label for="countryOverview" style="display:block;margin-bottom:8px;font-weight:600;">Overview</label>
            <textarea id="countryOverview" name="overview" rows="5" placeholder="Write a short country overview..." style="width:100%;padding:12px 14px;border:1px solid #d1d5db;border-radius:12px;resize:vertical;"></textarea>
        </div>
        </div>

        <div id="countryModalActions" style="display:flex;justify-content:flex-end;gap:10px;margin-top:22px;">
          <button type="button" id="cancelCountryBtn" class="btn btn-outline">Cancel</button>
          <button type="submit" id="saveCountryBtn" class="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  $("closeCountryModalBtn").addEventListener("click", closeCountryModal);
  $("cancelCountryBtn").addEventListener("click", closeCountryModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeCountryModal();
  });

  $("countryForm").addEventListener("submit", submitCountryForm);
}

function openCountryModal(title, values = {}, readOnly = false) {
  $("countryModalTitle").textContent = title;
  $("countryName").value = values.name || "";
  $("countryCode").value = values.code || "";
  $("countryCapital").value = values.capital || "";
  $("countryCurrency").value = values.currency || "";
  $("countryLanguage").value = values.language || "";
  $("countryTimeZone").value = values.timeZone || "";
  $("countryBestTimeToVisit").value = values.bestTimeToVisit || "";
  $("countrySafetyLevel").value = values.safetyLevel || "";
  $("countryFlagUrl").value = values.flagUrl || "";
  $("countryOverview").value = values.overview || "";

  [
    "countryName",
    "countryCode",
    "countryCapital",
    "countryCurrency",
    "countryLanguage",
    "countryTimeZone",
    "countryBestTimeToVisit",
    "countrySafetyLevel",
    "countryFlagUrl",
    "countryOverview"
  ].forEach(id => {
    $(id).disabled = readOnly;
  });

  $("saveCountryBtn").style.display = readOnly ? "none" : "inline-flex";
  $("countryModal").style.display = "flex";
}

function closeCountryModal() {
  $("countryModal").style.display = "none";
  currentEditingId = null;
  $("countryForm").reset();
}

async function submitCountryForm(event) {
  event.preventDefault();

  const payload = {
    name: $("countryName").value.trim(),
    code: $("countryCode").value.trim(),
    capital: $("countryCapital").value.trim(),
    currency: $("countryCurrency").value.trim(),
    language: $("countryLanguage").value.trim(),
    timeZone: $("countryTimeZone").value.trim(),
    bestTimeToVisit: $("countryBestTimeToVisit").value.trim(),
    safetyLevel: $("countrySafetyLevel").value.trim(),
    flagUrl: $("countryFlagUrl").value.trim(),
    overview: $("countryOverview").value.trim()
  };

  if (!payload.name) {
    showToast("Name is required.", "warning");
    return;
  }

  try {
    if (currentEditingId) {
      await apiFetch(`/admin/countries/${currentEditingId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      showToast("Country updated.", "success");
    } else {
      await apiFetch("/admin/countries", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showToast("Country created.", "success");
    }

    closeCountryModal();
    await loadCountries();
    await loadDashboard().catch(() => {});
  } catch (err) {
    console.error(err);
    showToast(`Save failed: ${err.message}`, "error");
  }
}

/* ============ FORMATTERS ============ */
function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}
