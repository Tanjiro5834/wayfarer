const API_BASE = "/api";

let countries = [];
let filteredCountries = [];
let currentEditingId = null;

let selectedRegion = null;
let selectedSubRegion = null;

/* ============ AUTH ============ */
function getToken() {
  return localStorage.getItem("travi_token");
}

function clearToken() {
  localStorage.removeItem("travi_token");
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
    const text = await response.text().catch(() => "");
    const error = new Error(text || response.statusText || "Request failed");
    error.status = response.status;
    throw error;
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

  initEntryModal();
  initBudgetModal();
  initChecklistModal();
  initTipsModal();
  initCultureModal();

  await bootstrapAdminPage();
});

async function bootstrapAdminPage() {
  try {
    setLoadingState(true);

    await loadCountries();

    await Promise.all([
      loadDashboard().catch((err) => {
        console.warn("Dashboard load skipped:", err.message);
      }),
      loadActivity().catch((err) => {
        console.warn("Activity load skipped:", err.message);
      }),
      loadRequirements().catch((err) => {
        console.warn("Requirements load skipped:", err.message);
      }),
      loadBudgets().catch((err) => {
        console.warn("Budgets load skipped:", err.message);
      }),
      loadPacking().catch((err) => {
        console.warn("Packing load skipped:", err.message);
      }),
      loadTips().catch((err) => {
        console.warn("Tips load skipped:", err.message);
      }),
      loadCulture().catch((err) => {
        console.warn("Culture load skipped:", err.message);
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
  renderRegionCards();
  renderSubRegionCards();
}

function renderPackingCard(country, groups) {
  const name = escapeHtml(country.name || "Unknown");
  const flag = country.flagUrl
    ? `<img src="${escapeHtml(country.flagUrl)}" alt="${name} flag" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">`
    : "🌍";

  const totalItems = (groups || []).reduce((sum, group) => {
    return sum + (Array.isArray(group.items) ? group.items.length : 0);
  }, 0);

  const preview = (groups || [])
    .slice(0, 3)
    .map((group) => {
      const label = escapeHtml(group.category || group.name || "General");
      const count = Array.isArray(group.items) ? group.items.length : 0;
      return `<span class="req-tag">${label}: ${count}</span>`;
    })
    .join("");

  return `
    <div class="req-card">
      <div class="req-card-top">
        <div class="req-flag">${flag}</div>
        <div class="req-meta">
          <h4>${name}</h4>
          <p>${totalItems} checklist items</p>
        </div>
        <span style="margin-left:auto;">${renderStatusBadge(inferCountryStatus(country))}</span>
      </div>
      <div class="req-tags">
        ${preview || `<span class="req-tag">No grouped items</span>`}
      </div>
      <div class="req-actions">
        <button class="mini-btn primary">Edit</button>
        <button class="mini-btn">View</button>
      </div>
    </div>
  `;
}

function renderTipCard(country, groupedTips) {
  const name = escapeHtml(country.name || "Unknown");
  const flag = country.flagUrl
    ? `<img src="${escapeHtml(country.flagUrl)}" alt="${name} flag" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">`
    : "🌍";

  const entries = Object.entries(groupedTips || {});
  const total = entries.reduce(
    (sum, [, arr]) => sum + (Array.isArray(arr) ? arr.length : 0),
    0,
  );

  const preview = entries
    .slice(0, 4)
    .map(([category, arr]) => {
      return `<span class="req-tag">${escapeHtml(category)}: ${Array.isArray(arr) ? arr.length : 0}</span>`;
    })
    .join("");

  return `
    <div class="req-card">
      <div class="req-card-top">
        <div class="req-flag">${flag}</div>
        <div class="req-meta">
          <h4>${name}</h4>
          <p>${total} local tips</p>
        </div>
        <span style="margin-left:auto;">${renderStatusBadge(inferCountryStatus(country))}</span>
      </div>
      <div class="req-tags">
        ${preview || `<span class="req-tag">No tips yet</span>`}
      </div>
      <div class="req-actions">
        <button class="mini-btn primary">Edit</button>
        <button class="mini-btn">View</button>
      </div>
    </div>
  `;
}

function renderCultureCard(country, groupedCulture) {
  const name = escapeHtml(country.name || "Unknown");
  const flag = country.flagUrl
    ? `<img src="${escapeHtml(country.flagUrl)}" alt="${name} flag" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">`
    : "🌍";

  const dos = Array.isArray(groupedCulture?.dos)
    ? groupedCulture.dos.length
    : 0;
  const donts = Array.isArray(groupedCulture?.donts)
    ? groupedCulture.donts.length
    : 0;
  const notes = groupedCulture?.notes ? 1 : 0;

  return `
    <div class="req-card">
      <div class="req-card-top">
        <div class="req-flag">${flag}</div>
        <div class="req-meta">
          <h4>${name}</h4>
          <p>Culture guidance overview</p>
        </div>
        <span style="margin-left:auto;">${renderStatusBadge(inferCountryStatus(country))}</span>
      </div>
      <div class="req-tags">
        <span class="req-tag">Do's: ${dos}</span>
        <span class="req-tag">Don'ts: ${donts}</span>
        <span class="req-tag">Notes: ${notes}</span>
      </div>
      <div class="req-actions">
        <button class="mini-btn primary">Edit</button>
        <button class="mini-btn">View</button>
      </div>
    </div>
  `;
}

async function loadRequirements() {
  const grid = $("requirementsGrid");
  if (!grid) return;

  const list = countries?.length ? countries : await apiFetch("/countries");
  if (!list.length) {
    setText("requirementsTotalCount", 0);
    setText("requirementsPublishedCount", 0);
    setText("requirementsNeedsReviewCount", 0);
    grid.innerHTML = emptyState("No entry requirements found.");
    return;
  }

  const results = await Promise.all(
    list.map(async (country) => {
      try {
        const req = await apiFetch(`/entry-requirements/country/${country.id}`);
        return { country, req };
      } catch {
        return null;
      }
    }),
  );

  const valid = results.filter(Boolean);

  setText("requirementsTotalCount", valid.length);
  setText(
    "requirementsPublishedCount",
    valid.filter((item) => isPublished(item.country)).length,
  );
  setText(
    "requirementsNeedsReviewCount",
    valid.filter((item) => !isPublished(item.country)).length,
  );

  grid.innerHTML =
    valid
      .map((item) => renderRequirementCard(item.country, item.req))
      .join("") || emptyState("No entry requirements found.");
}

function renderRequirementCard(country, req) {
  const name = escapeHtml(country.name || "Unknown");
  const region = escapeHtml(country.region || "General");
  const subRegion = escapeHtml(country.subRegion || "General");
  const updatedAt = formatDate(
    country.updatedAt || country.updated_at || country.lastUpdated,
  );
  const badge = renderStatusBadge(inferCountryStatus(country));
  const flag = country.flagUrl
    ? `<img src="${escapeHtml(country.flagUrl)}" alt="${name} flag" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">`
    : "🌍";

  const tags = [
    req?.visaType && escapeHtml(req.visaType),
    req?.maxStayDays != null && `Max stay: ${escapeHtml(req.maxStayDays)} days`,
    req?.passportValidityRequired &&
      `Passport: ${escapeHtml(req.passportValidityRequired)}`,
    req?.vaccinationRequirements &&
      `Vaccination: ${escapeHtml(req.vaccinationRequirements)}`,
  ]
    .filter(Boolean)
    .slice(0, 4);

  return `
    <div class="req-card">
      <div class="req-card-top">
        <div class="req-flag">${flag}</div>
        <div class="req-meta">
          <h4>${name}</h4>
          <p>Updated ${updatedAt} · ${region} / ${subRegion}</p>
        </div>
        <span style="margin-left:auto;">${badge}</span>
      </div>
      <div class="req-tags">
        ${tags.map((tag) => `<span class="req-tag">${tag}</span>`).join("")}
      </div>
      <div class="req-actions">
        <button class="mini-btn primary">Edit</button>
        <button class="mini-btn">View</button>
      </div>
    </div>
  `;
}

async function loadBudgets() {
  const grid = $("budgetsGrid");
  if (!grid) return;

  const list = countries?.length ? countries : await apiFetch("/countries");
  if (!list.length) {
    setText("budgetsTotalCount", 0);
    setText("budgetsPublishedCount", 0);
    setText("budgetsDraftCount", 0);
    grid.innerHTML = emptyState("No budget guides found.");
    return;
  }

  const results = await Promise.all(
    list.map(async (country) => {
      try {
        const budget = await apiFetch(`/budgets/country/${country.id}`);
        if (!budget) return null;
        return { country, budget };
      } catch (err) {
        console.warn(
          `Budget load skipped for country ${country.id}:`,
          err.message,
        );
        return null;
      }
    }),
  );

  const valid = results.filter((item) => item && item.budget);

  setText("budgetsTotalCount", valid.length);
  setText(
    "budgetsPublishedCount",
    valid.filter((item) => isPublished(item.country)).length,
  );
  setText(
    "budgetsDraftCount",
    valid.filter((item) => !isPublished(item.country)).length,
  );

  grid.innerHTML =
    valid.map((item) => renderBudgetCard(item.country, item.budget)).join("") ||
    emptyState("No budget guides found.");
}

function getTierMap(budget) {
  const tiers = Array.isArray(budget?.tiers) ? budget.tiers : [];
  return {
    BUDGET: tiers.find((t) => t.tierName === "BUDGET") || null,
    MID_RANGE: tiers.find((t) => t.tierName === "MID_RANGE") || null,
    LUXURY: tiers.find((t) => t.tierName === "LUXURY") || null,
  };
}

function formatMoneyRange(currency, min, max) {
  if (min == null && max == null) return "-";
  const symbol =
    currency === "PHP" ? "₱" : currency === "USD" ? "$" : `${currency} `;
  if (min != null && max != null) return `${symbol}${min}–${max}`;
  if (min != null) return `${symbol}${min}+`;
  return `${symbol}${max}`;
}

function renderBudgetCard(country, budget) {
  const name = escapeHtml(country.name || "Unknown");
  const flag = country.flagUrl
    ? `<img src="${escapeHtml(country.flagUrl)}" alt="${name} flag" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">`
    : "🌍";

  const currency = budget?.currency || "PHP";
  const tierMap = getTierMap(budget);
  const defaultTier = tierMap.BUDGET || tierMap.MID_RANGE || tierMap.LUXURY;

  if (!defaultTier) {
    return `
      <div class="budget-card">
        <div class="budget-card-header">
          <div class="budget-country">
            <div class="flag-box">${flag}</div>
            <div>
              <h4>${name}</h4>
              <p>Per person / day</p>
            </div>
          </div>
          ${renderStatusBadge(inferCountryStatus(country))}
        </div>
        <div class="budget-breakdown">
          <div class="budget-row">
            <span class="budget-row-label">No tier data</span>
            <span class="budget-row-value">-</span>
          </div>
        </div>
      </div>
    `;
  }

  const cardId = `budget-card-${country.id}`;

  return `
    <div class="budget-card" id="${cardId}">
      <div class="budget-card-header">
        <div class="budget-country">
          <div class="flag-box">${flag}</div>
          <div>
            <h4>${name}</h4>
            <p>Per person / day</p>
          </div>
        </div>
        ${renderStatusBadge(inferCountryStatus(country))}
      </div>

      <div class="budget-tier-tabs">
        <button class="tier-tab active" type="button" data-card-id="${cardId}" data-tier="BUDGET">Budget</button>
        <button class="tier-tab" type="button" data-card-id="${cardId}" data-tier="MID_RANGE">Mid</button>
        <button class="tier-tab" type="button" data-card-id="${cardId}" data-tier="LUXURY">Luxury</button>
      </div>

      <div class="budget-breakdown" data-role="budget-breakdown">
        <div class="budget-row">
          <span class="budget-row-label">Accommodation</span>
          <span class="budget-row-value">${formatMoneyRange(currency, defaultTier.accommodationMin, defaultTier.accommodationMax)}</span>
        </div>
        <div class="budget-row">
          <span class="budget-row-label">Food</span>
          <span class="budget-row-value">${formatMoneyRange(currency, defaultTier.foodMin, defaultTier.foodMax)}</span>
        </div>
        <div class="budget-row">
          <span class="budget-row-label">Transport</span>
          <span class="budget-row-value">${formatMoneyRange(currency, defaultTier.transportMin, defaultTier.transportMax)}</span>
        </div>
        <div class="budget-row">
          <span class="budget-row-label">Activities</span>
          <span class="budget-row-value">${formatMoneyRange(currency, defaultTier.activitiesMin, defaultTier.activitiesMax)}</span>
        </div>
      </div>

      <div class="budget-total" data-role="budget-total">
        <span>Daily Total</span>
        <span>${formatMoneyRange(currency, defaultTier.dailyTotalMin, defaultTier.dailyTotalMax)}</span>
      </div>

      <div class="budget-card-footer">
        <button class="mini-btn primary" type="button">Edit</button>
        <button class="mini-btn" type="button">View</button>
      </div>
    </div>
  `;
}

async function loadPacking() {
  const grid = $("packingGrid");
  if (!grid) return;

  const list = countries?.length ? countries : await apiFetch("/countries");
  if (!list.length) {
    setText("packingTotalCount", 0);
    setText("packingItemsCount", 0);
    setText("packingPublishedCount", 0);
    grid.innerHTML = emptyState("No packing checklists found.");
    return;
  }

  const results = await Promise.all(
    list.map(async (country) => {
      try {
        const groups = await apiFetch(
          `/packing-checklists/country/${country.id}`,
        );
        return { country, groups: Array.isArray(groups) ? groups : [] };
      } catch {
        return null;
      }
    }),
  );

  const valid = results.filter(Boolean);

  const totalItems = valid.reduce((sum, item) => {
    const groupCount = item.groups.reduce((inner, group) => {
      const items = Array.isArray(group.items) ? group.items.length : 0;
      return inner + items;
    }, 0);
    return sum + groupCount;
  }, 0);

  setText("packingTotalCount", valid.length);
  setText("packingItemsCount", totalItems);
  setText(
    "packingPublishedCount",
    valid.filter((item) => isPublished(item.country)).length,
  );

  grid.innerHTML =
    valid
      .map((item) => renderPackingCard(item.country, item.groups))
      .join("") || emptyState("No packing checklists found.");
}

async function loadTips() {
  const grid = $("tipsGrid");
  if (!grid) return;

  const list = countries?.length ? countries : await apiFetch("/countries");
  if (!list.length) {
    setText("tipsTotalCount", 0);
    setText("tipsItemsCount", 0);
    setText("tipsPublishedCount", 0);
    grid.innerHTML = emptyState("No local tips found.");
    return;
  }

  const results = await Promise.all(
    list.map(async (country) => {
      try {
        const groupedTips = await apiFetch(`/countries/${country.id}/tips`);
        return { country, groupedTips: groupedTips || {} };
      } catch {
        return null;
      }
    }),
  );

  const valid = results.filter(Boolean);

  const totalTips = valid.reduce((sum, item) => {
    return (
      sum +
      Object.values(item.groupedTips).reduce((inner, arr) => {
        return inner + (Array.isArray(arr) ? arr.length : 0);
      }, 0)
    );
  }, 0);

  setText("tipsTotalCount", valid.length);
  setText("tipsItemsCount", totalTips);
  setText(
    "tipsPublishedCount",
    valid.filter((item) => isPublished(item.country)).length,
  );

  grid.innerHTML =
    valid
      .map((item) => renderTipCard(item.country, item.groupedTips))
      .join("") || emptyState("No local tips found.");
}

async function loadCulture() {
  const grid = $("cultureGrid");
  if (!grid) return;

  const list = countries?.length ? countries : await apiFetch("/countries");
  if (!list.length) {
    setText("cultureTotalCount", 0);
    setText("culturePublishedCount", 0);
    setText("cultureDraftCount", 0);
    grid.innerHTML = emptyState("No culture guides found.");
    return;
  }

  const results = await Promise.all(
    list.map(async (country) => {
      try {
        const groupedCulture = await apiFetch(
          `/countries/${country.id}/culture`,
        );
        return { country, groupedCulture: groupedCulture || {} };
      } catch {
        return null;
      }
    }),
  );

  const valid = results.filter(Boolean);

  setText("cultureTotalCount", valid.length);
  setText(
    "culturePublishedCount",
    valid.filter((item) => isPublished(item.country)).length,
  );
  setText(
    "cultureDraftCount",
    valid.filter((item) => !isPublished(item.country)).length,
  );

  grid.innerHTML =
    valid
      .map((item) => renderCultureCard(item.country, item.groupedCulture))
      .join("") || emptyState("No culture guides found.");
}

function emptyState(message) {
  return `
    <div class="panel" style="grid-column: 1 / -1;">
      <div class="list-item">
        <div>
          <h4>No data yet</h4>
          <p>${escapeHtml(message)}</p>
        </div>
        <span class="badge badge-warning">Empty</span>
      </div>
    </div>
  `;
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
  renderCountriesIntoTable("countryTableBody", items); // dashboard preview
  renderCountriesIntoTable("countriesSectionTableBody", items); // full countries section
}

function renderCountriesIntoTable(tbodyId, items) {
  const tbody = $(tbodyId);
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
      const name = escapeHtml(country.name || "Unknown");
      const code = escapeHtml(country.code || "-");
      const capital = escapeHtml(country.capital || "-");
      const updatedAt = formatDate(
        country.updatedAt || country.updated_at || country.lastUpdated,
      );

      const flagHtml = country.flagUrl
        ? `<img src="${escapeHtml(country.flagUrl)}" alt="${name} flag" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">`
        : "🌍";

      return `
      <tr>
        <td>
          <div class="country-cell">
            <div class="flag-box">${flagHtml}</div>
            <span>${name}</span>
          </div>
        </td>
        <td>${code}</td>
        <td>${capital}</td>
        <td>${updatedAt}</td>
        <td>
          <div class="table-actions">
            <button type="button" class="mini-btn" data-action="view" data-id="${id}">View</button>
            <button type="button" class="mini-btn" data-action="edit" data-id="${id}">Edit</button>
            <button type="button" class="mini-btn" data-action="delete" data-id="${id}">Delete</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");

  bindCountryActionButtons();
}

function bindCountryActionButtons() {
  document.querySelectorAll("table").forEach((table) => {
    if (table.dataset.actionsBound === "true") return;

    table.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const action = button.dataset.action;
      const countryId = Number(button.dataset.id);

      if (!countryId) return;

      if (action === "view") {
        await handleView(countryId);
      } else if (action === "edit") {
        await handleEdit(countryId);
      } else if (action === "delete") {
        await handleDelete(countryId);
      }
    });

    table.dataset.actionsBound = "true";
  });
}

function inferCountryStatus(country) {
  if (typeof country.published === "boolean") {
    return country.published ? "Published" : "Draft";
  }
  return "Published";
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

  const sectionMap = {
    dashboard: "dashboardSection",
    analytics: "analyticsSection",
    users: "usersSection",
    countries: "countriesSection",
    requirements: "requirementsSection",
    budgets: "budgetsSection",
    packing: "packingSection",
    tips: "tipsSection",
    culture: "cultureSection",
    drafts: "draftsSection",
    publish: "publishSection",
    settings: "settingsSection",
  };

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();

      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");

      const section = item.dataset.section || "dashboard";

      if (pageTitle) pageTitle.textContent = formatSectionTitle(section);
      if (pageSubtitle) pageSubtitle.textContent = getSectionSubtitle(section);

      showSection(sectionMap[section] || "dashboardSection");
    });
  });

  const viewAllCountriesBtn = $("viewAllCountriesBtn");
  if (viewAllCountriesBtn) {
    viewAllCountriesBtn.addEventListener("click", () => {
      document
        .querySelectorAll(".nav-item")
        .forEach((nav) => nav.classList.remove("active"));
      const countriesNav = document.querySelector(
        '.nav-item[data-section="countries"]',
      );
      if (countriesNav) countriesNav.classList.add("active");

      if (pageTitle) pageTitle.textContent = formatSectionTitle("countries");
      if (pageSubtitle)
        pageSubtitle.textContent = getSectionSubtitle("countries");

      showSection("countriesSection");
    });
  }
}

function showSection(activeSectionId) {
  const allSections = [
    "dashboardSection",
    "analyticsSection",
    "usersSection",
    "countriesSection",
    "requirementsSection",
    "budgetsSection",
    "packingSection",
    "tipsSection",
    "cultureSection",
    "draftsSection",
    "publishSection",
    "settingsSection",
  ];

  allSections.forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.style.display = id === activeSectionId ? "block" : "none";
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
      const code = String(country.code || "").toLowerCase();
      const capital = String(country.capital || "").toLowerCase();
      const currency = String(country.currency || "").toLowerCase();

      return (
        name.includes(query) ||
        code.includes(query) ||
        capital.includes(query) ||
        currency.includes(query)
      );
    });

    renderCountries(filteredCountries);
  });
}

/* ============ ACTIONS ============ */
function initActions() {
  const exportBtn = $("exportBtn");
  const addCountryBtn = $("addCountryBtn");
  const countriesAddBtn = $("countriesAddBtn");

  if (exportBtn) {
    exportBtn.addEventListener("click", handleExportCountries);
  }

  if (addCountryBtn) {
    addCountryBtn.addEventListener("click", handleAddCountry);
  }

  if (countriesAddBtn) {
    countriesAddBtn.addEventListener("click", handleAddCountry);
  }
}

function handleExportCountries() {
  if (!countries.length) {
    showToast("No countries to export.", "warning");
    return;
  }

  const rows = [
    [
      "ID",
      "Name",
      "Region",
      "Sub Region",
      "Code",
      "Capital",
      "Flag URL",
      "Updated At",
    ],
    ...countries.map((country) => [
      country.id ?? "",
      country.name || "",
      country.region || "",
      country.subRegion || "",
      country.code || "",
      country.capital || "",
      country.flagUrl || "",
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
    overview: "",
  });
}

async function handleView(countryId) {
  try {
    const country = await getCountryById(countryId);

    openCountryModal(
      "View Country",
      {
        name: country.name || "",
        code: country.code || "",
        capital: country.capital || "",
        currency: country.currency || "",
        language: country.language || "",
        timeZone: country.timeZone || "",
        bestTimeToVisit: country.bestTimeToVisit || "",
        safetyLevel: country.safetyLevel || "",
        flagUrl: country.flagUrl || "",
        overview: country.overview || "",
        region: country.region || "",
        subRegion: country.subRegion || "",
      },
      true,
    );
  } catch (err) {
    console.error(err);
    showToast(`Failed to load country: ${err.message}`, "error");
  }
}

async function handleEdit(countryId) {
  try {
    const country = await getCountryById(countryId);

    currentEditingId = countryId;

    openCountryModal(
      "Edit Country",
      {
        name: country.name || "",
        code: country.code || "",
        capital: country.capital || "",
        currency: country.currency || "",
        language: country.language || "",
        timeZone: country.timeZone || "",
        bestTimeToVisit: country.bestTimeToVisit || "",
        safetyLevel: country.safetyLevel || "",
        flagUrl: country.flagUrl || "",
        overview: country.overview || "",
        region: country.region || "",
        subRegion: country.subRegion || "",
      },
      false,
    );
  } catch (err) {
    console.error(err);
    showToast(`Failed to load country for editing: ${err.message}`, "error");
  }
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
            <label for="countryRegion" style="display:block;margin-bottom:8px;font-weight:600;">Region</label>
            <input id="countryRegion" name="region" type="text" placeholder="Asia" style="width:100%;padding:12px 14px;border:1px solid #d1d5db;border-radius:12px;">
            </div>

            <div>
            <label for="countrySubRegion" style="display:block;margin-bottom:8px;font-weight:600;">Sub Region</label>
            <input id="countrySubRegion" name="subRegion" type="text" placeholder="East Asia" style="width:100%;padding:12px 14px;border:1px solid #d1d5db;border-radius:12px;">
        </div>

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
  $("countryRegion").value = values.region || "";
  $("countrySubRegion").value = values.subRegion || "";

  [
    "countryName",
    "countryRegion",
    "countrySubRegion",
    "countryCode",
    "countryCapital",
    "countryCurrency",
    "countryLanguage",
    "countryTimeZone",
    "countryBestTimeToVisit",
    "countrySafetyLevel",
    "countryFlagUrl",
    "countryOverview",
  ].forEach((id) => {
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
    region: $("countryRegion").value.trim(),
    subRegion: $("countrySubRegion").value.trim(),
    code: $("countryCode").value.trim(),
    capital: $("countryCapital").value.trim(),
    currency: $("countryCurrency").value.trim(),
    language: $("countryLanguage").value.trim(),
    timeZone: $("countryTimeZone").value.trim(),
    bestTimeToVisit: $("countryBestTimeToVisit").value.trim(),
    safetyLevel: $("countrySafetyLevel").value.trim(),
    flagUrl: $("countryFlagUrl").value.trim(),
    overview: $("countryOverview").value.trim(),
  };

  if (!payload.name || !payload.region) {
    showToast("Name and region are required.", "warning");
    return;
  }

  if (!payload.name) {
    showToast("Name is required.", "warning");
    return;
  }

  try {
    if (currentEditingId) {
      await apiFetch(`/admin/countries/${currentEditingId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast("Country updated.", "success");
    } else {
      await apiFetch("/admin/countries", {
        method: "POST",
        body: JSON.stringify(payload),
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

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = formatNumber(value ?? 0);
}

function isPublished(country) {
  return country?.published === true;
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

async function getCountryById(countryId) {
  const existing = countries.find((c) => Number(c.id) === Number(countryId));
  if (
    existing &&
    existing.code &&
    existing.capital &&
    existing.overview !== undefined
  ) {
    return existing;
  }

  return await apiFetch(`/admin/countries/${countryId}`);
}

function renderRegionCards() {
  const container = $("countriesRegionGrid");
  if (!container) return;

  const grouped = groupCountriesByRegion(countries);
  const regions = Object.keys(grouped).sort();

  container.innerHTML = regions
    .map(
      (region) => `
    <button type="button" class="panel" style="text-align:left;cursor:pointer;" data-region="${escapeHtml(region)}">
      <h3 style="margin-bottom:8px;">${escapeHtml(region)}</h3>
      <p>${grouped[region].length} countries</p>
    </button>
  `,
    )
    .join("");

  container.querySelectorAll("[data-region]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedRegion = btn.dataset.region;
      selectedSubRegion = null;
      renderSubRegionCards();
      renderFilteredCountries();
    });
  });
}

function renderSubRegionCards() {
  const container = $("countriesSubRegionGrid");
  if (!container) return;

  if (!selectedRegion) {
    container.innerHTML = "";
    return;
  }

  const filtered = countries.filter(
    (c) => (c.region || "").toLowerCase() === selectedRegion.toLowerCase(),
  );
  const grouped = groupCountriesBySubRegion(filtered);
  const subRegions = Object.keys(grouped).sort();

  container.innerHTML = subRegions
    .map(
      (subRegion) => `
    <button type="button" class="panel" style="text-align:left;cursor:pointer;" data-subregion="${escapeHtml(subRegion)}">
      <h3 style="margin-bottom:8px;">${escapeHtml(subRegion)}</h3>
      <p>${grouped[subRegion].length} countries</p>
    </button>
  `,
    )
    .join("");

  container.querySelectorAll("[data-subregion]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedSubRegion = btn.dataset.subregion;
      renderFilteredCountries();
    });
  });
}

function renderFilteredCountries() {
  let result = [...countries];

  if (selectedRegion) {
    result = result.filter(
      (c) => (c.region || "").toLowerCase() === selectedRegion.toLowerCase(),
    );
  }

  if (selectedSubRegion) {
    result = result.filter(
      (c) =>
        (c.subRegion || "").toLowerCase() === selectedSubRegion.toLowerCase(),
    );
  }

  renderCountriesIntoTable("countriesSectionTableBody", result);
}

function groupCountriesByRegion(items) {
  return items.reduce((acc, country) => {
    const key = country.region || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(country);
    return acc;
  }, {});
}

function groupCountriesBySubRegion(items) {
  return items.reduce((acc, country) => {
    const key = country.subRegion || "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(country);
    return acc;
  }, {});
}
/* ============ FILTER CHIPS ============ */
document.addEventListener("DOMContentLoaded", () => {
  // Filter chip toggle (single-select per toolbar)
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".filter-chip");
    if (!chip) return;
    const toolbar = chip.closest(".section-toolbar-left");
    if (!toolbar) return;
    toolbar
      .querySelectorAll(".filter-chip")
      .forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
  });

  // Budget tier tab toggle per card
  document.addEventListener("click", (e) => {
    const tab = e.target.closest(".tier-tab");
    if (!tab) return;
    const tabs = tab.closest(".budget-tier-tabs");
    if (!tabs) return;
    tabs
      .querySelectorAll(".tier-tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
  });
});

/* ================================================================
   CONTENT MODALS — Entry Requirements, Budget, Checklist, Tips, Culture
   API endpoints aligned to:
     GET  /api/countries                          (CountryController)
     GET  /api/entry-requirements/country/{id}    (EntryRequirementController)
     GET  /api/budgets/country/{id}               (BudgetGuideController)
     GET  /api/packing-checklists/country/{id}    (PackingChecklistController)
     GET  /api/countries/{id}/tips                (CountryController)
     GET  /api/countries/{id}/culture             (CountryController)
   POST/PUT handled via admin endpoints (proxied through /api/admin/*)
================================================================ */

/* ── Shared: populate all country <select> dropdowns ── */
async function populateCountrySelects(selectIds) {
  let list = countries;
  if (!list || !list.length) {
    try {
      list = await apiFetch("/countries");
    } catch (_) {
      list = [];
    }
  }
  selectIds.forEach((id) => {
    const el = $(id);
    if (!el) return;
    const current = el.value;
    el.innerHTML = '<option value="">Select a country…</option>';
    list.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name || `Country #${c.id}`;
      el.appendChild(opt);
    });
    if (current) el.value = current;
  });
}

/* ── Shared: open / close helpers ── */
function openModal(id) {
  const el = $(id);
  if (el) el.style.display = "flex";
}

function closeModal(id) {
  const el = $(id);
  if (el) {
    el.style.display = "none";
  }
}

function bindModalClose(overlayId, closeBtnId, cancelBtnId, formId) {
  const overlay = $(overlayId);
  const closeBtn = $(closeBtnId);
  const cancelBtn = $(cancelBtnId);
  const form = $(formId);

  if (closeBtn) closeBtn.addEventListener("click", () => closeModal(overlayId));
  if (cancelBtn)
    cancelBtn.addEventListener("click", () => closeModal(overlayId));
  if (overlay)
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal(overlayId);
    });
  if (form) form.addEventListener("reset", () => closeModal(overlayId));
}

/* ================================================================
   1. ENTRY REQUIREMENTS MODAL
   POST  /api/admin/entry-requirements
   Payload mirrors EntryRequirement entity fields
================================================================ */
function initEntryModal() {
  const addBtn = $("addEntryBtn");
  if (addBtn)
    addBtn.addEventListener("click", async () => {
      await populateCountrySelects(["entryCountryId"]);
      $("entryModalTitle").textContent = "Add Entry Requirement";
      $("entryForm").reset();
      openModal("entryModal");
    });

  bindModalClose(
    "entryModal",
    "closeEntryModal",
    "cancelEntryModal",
    "entryForm",
  );

  const form = $("entryForm");
  if (form)
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        countryId: Number($("entryCountryId").value),
        visaType: $("entryVisaType").value,
        maxStayDays: $("entryMaxStay").value
          ? Number($("entryMaxStay").value)
          : null,
        passportValidityRequired: $("entryPassportValidity").value.trim(),
        vaccinationRequirements: $("entryVaccination").value.trim(),
        travelInsurance: $("entryInsurance").value,
        customsNotes: $("entryCustomsNotes").value.trim(),
        additionalNotes: $("entryNotes").value.trim(),
      };

      if (!payload.countryId || !payload.visaType) {
        showToast("Country and visa type are required.", "warning");
        return;
      }

      const countryId = payload.countryId;

      try {
        await apiFetch(`/entry-requirements/country/${countryId}`);

        await apiFetch(`/admin/entry-requirements/${countryId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        showToast("Entry requirement updated.", "success");
      } catch (err) {
        if (err.status === 404) {
          await apiFetch("/admin/entry-requirements", {
            method: "POST",
            body: JSON.stringify(payload),
          });

          showToast("Entry requirement saved.", "success");
        } else {
          throw err;
        }
      }
    });
}

/* ================================================================
   2. BUDGET GUIDE MODAL
   POST  /api/admin/budgets
   Payload mirrors BudgetGuide entity — three tiers
================================================================ */
function initBudgetModal() {
  const addBtn = $("addBudgetBtn");
  if (addBtn)
    addBtn.addEventListener("click", async () => {
      await populateCountrySelects(["budgetCountryId"]);
      $("budgetModalTitle").textContent = "Add Budget Guide";
      $("budgetForm").reset();
      openModal("budgetModal");
    });

  bindModalClose(
    "budgetModal",
    "closeBudgetModal",
    "cancelBudgetModal",
    "budgetForm",
  );

  const form = $("budgetForm");
  if (form)
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const payload = {
        countryId: Number($("budgetCountryId").value),
        currency: $("budgetCurrency").value.trim(),
        savingTips: $("budgetSavingTips").value.trim(),
        tiers: [
          {
            tierName: "BUDGET",
            accommodationMin: parseRangeMin(
              $("budgetBudgetAccommodation").value,
            ),
            accommodationMax: parseRangeMax(
              $("budgetBudgetAccommodation").value,
            ),
            foodMin: parseRangeMin($("budgetBudgetFood").value),
            foodMax: parseRangeMax($("budgetBudgetFood").value),
            transportMin: parseRangeMin($("budgetBudgetTransport").value),
            transportMax: parseRangeMax($("budgetBudgetTransport").value),
            activitiesMin: parseRangeMin($("budgetBudgetActivities").value),
            activitiesMax: parseRangeMax($("budgetBudgetActivities").value),
            dailyTotalMin: parseRangeMin($("budgetBudgetTotal").value),
            dailyTotalMax: parseRangeMax($("budgetBudgetTotal").value),
          },
          {
            tierName: "MID_RANGE",
            accommodationMin: parseRangeMin($("budgetMidAccommodation").value),
            accommodationMax: parseRangeMax($("budgetMidAccommodation").value),
            foodMin: parseRangeMin($("budgetMidFood").value),
            foodMax: parseRangeMax($("budgetMidFood").value),
            transportMin: parseRangeMin($("budgetMidTransport").value),
            transportMax: parseRangeMax($("budgetMidTransport").value),
            activitiesMin: parseRangeMin($("budgetMidActivities").value),
            activitiesMax: parseRangeMax($("budgetMidActivities").value),
            dailyTotalMin: parseRangeMin($("budgetMidTotal").value),
            dailyTotalMax: parseRangeMax($("budgetMidTotal").value),
          },
          {
            tierName: "LUXURY",
            accommodationMin: parseRangeMin($("budgetLuxAccommodation").value),
            accommodationMax: parseRangeMax($("budgetLuxAccommodation").value),
            foodMin: parseRangeMin($("budgetLuxFood").value),
            foodMax: parseRangeMax($("budgetLuxFood").value),
            transportMin: parseRangeMin($("budgetLuxTransport").value),
            transportMax: parseRangeMax($("budgetLuxTransport").value),
            activitiesMin: parseRangeMin($("budgetLuxActivities").value),
            activitiesMax: parseRangeMax($("budgetLuxActivities").value),
            dailyTotalMin: parseRangeMin($("budgetLuxTotal").value),
            dailyTotalMax: parseRangeMax($("budgetLuxTotal").value),
          },
        ],
      };

      if (!payload.countryId) {
        showToast("Please select a country.", "warning");
        return;
      }

      try {
        await apiFetch("/admin/budgets", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        showToast("Budget guide saved.", "success");
        closeModal("budgetModal");

        await loadBudgets(); // 🔥 important
      } catch (err) {
        showToast(`Failed: ${err.message}`, "error");
      }
    });
}

/* ================================================================
   3. PACKING CHECKLIST MODAL — dynamic item rows
   POST  /api/admin/packing-checklists
   Payload: { countryId, climate, items: [{category, itemName, essential}] }
   Mirrors PackingChecklistItem entity + PackingCategoryDTO grouping
================================================================ */
let checklistRowCount = 0;

function addChecklistRow() {
  checklistRowCount++;
  const container = $("checklistItemsContainer");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "dynamic-row";
  row.dataset.rowId = checklistRowCount;
  row.innerHTML = `
    <div class="dynamic-row-header">
      <span>Item #${checklistRowCount}</span>
      <button type="button" class="remove-row-btn" data-remove="${checklistRowCount}">×</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Category</label>
        <select name="cl_category_${checklistRowCount}">
          <option value="Documents">Documents</option>
          <option value="Clothing">Clothing</option>
          <option value="Health">Health</option>
          <option value="Tech">Tech</option>
          <option value="Toiletries">Toiletries</option>
          <option value="Money">Money</option>
          <option value="Safety">Safety</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div class="form-group">
        <label>Item Name</label>
        <input type="text" name="cl_name_${checklistRowCount}" placeholder="e.g. Pocket tissues" required />
      </div>
    </div>
    <div class="form-group">
      <label style="display:flex;align-items:center;gap:8px;flex-direction:row;">
        <input type="checkbox" name="cl_essential_${checklistRowCount}" style="width:16px;height:16px;border-radius:4px;" />
        Mark as essential item
      </label>
    </div>
  `;
  row
    .querySelector(`[data-remove="${checklistRowCount}"]`)
    .addEventListener("click", () => row.remove());
  container.appendChild(row);
}

function parseRangeMin(value) {
  if (!value) return null;
  const clean = value.replace(/[₱$,]/g, "").trim();
  if (clean.endsWith("+")) return Number(clean.replace("+", "").trim());
  const [min] = clean.split("–");
  return min ? Number(min.trim()) : null;
}

function parseRangeMax(value) {
  if (!value) return null;
  const clean = value.replace(/[₱$,]/g, "").trim();
  if (clean.endsWith("+")) return null;
  const parts = clean.split("–");
  return parts[1] ? Number(parts[1].trim()) : null;
}

function initChecklistModal() {
  const addBtn = $("addChecklistBtn");
  if (addBtn)
    addBtn.addEventListener("click", async () => {
      await populateCountrySelects(["checklistCountryId"]);
      $("checklistModalTitle").textContent = "Add Packing Checklist";
      $("checklistForm").reset();
      $("checklistItemsContainer").innerHTML = "";
      checklistRowCount = 0;
      addChecklistRow(); // start with one row
      openModal("checklistModal");
    });

  bindModalClose(
    "checklistModal",
    "closeChecklistModal",
    "cancelChecklistModal",
    "checklistForm",
  );

  const addRowBtn = $("addChecklistItemRow");
  if (addRowBtn) addRowBtn.addEventListener("click", addChecklistRow);

  const form = $("checklistForm");
  if (form)
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const countryId = Number($("checklistCountryId").value);
      const climate = $("checklistClimate").value;
      if (!countryId) {
        showToast("Please select a country.", "warning");
        return;
      }

      const rows = $("checklistItemsContainer").querySelectorAll(
        ".dynamic-row",
      );
      const items = [];
      rows.forEach((row) => {
        const id = row.dataset.rowId;
        const name = row.querySelector(`[name="cl_name_${id}"]`)?.value.trim();
        const category = row.querySelector(`[name="cl_category_${id}"]`)?.value;
        const essential =
          row.querySelector(`[name="cl_essential_${id}"]`)?.checked ?? false;
        if (name) items.push({ category, itemName: name, essential });
      });

      if (!items.length) {
        showToast("Add at least one item.", "warning");
        return;
      }

      const payload = { countryId, climate, items };

      try {
        await apiFetch("/admin/packing-checklists", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast("Checklist saved.", "success");
        closeModal("checklistModal");
      } catch (err) {
        showToast(`Failed: ${err.message}`, "error");
      }
    });
}

/* ================================================================
   4. LOCAL TIPS MODAL — dynamic tip rows
   POST  /api/admin/local-tips
   Payload: { countryId, tips: [{category, icon, title, description}] }
   Mirrors LocalTip entity; CountryController.getTips groups by category
================================================================ */
let tipRowCount = 0;

function addTipRow() {
  tipRowCount++;
  const container = $("tipsItemsContainer");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "dynamic-row";
  row.dataset.rowId = tipRowCount;
  row.innerHTML = `
    <div class="dynamic-row-header">
      <span>Tip #${tipRowCount}</span>
      <button type="button" class="remove-row-btn" data-remove="${tipRowCount}">×</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Category</label>
        <select name="tip_category_${tipRowCount}">
          <option value="Transport">Transport</option>
          <option value="Food">Food</option>
          <option value="Safety">Safety</option>
          <option value="Money">Money</option>
          <option value="Etiquette">Etiquette</option>
          <option value="Health">Health</option>
          <option value="Communication">Communication</option>
          <option value="General">General</option>
        </select>
      </div>
      <div class="form-group">
        <label>Icon (emoji)</label>
        <input type="text" name="tip_icon_${tipRowCount}" placeholder="🚃" maxlength="4" />
      </div>
    </div>
    <div class="form-group">
      <label>Title</label>
      <input type="text" name="tip_title_${tipRowCount}" placeholder="e.g. IC Cards over cash" required />
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea name="tip_desc_${tipRowCount}" rows="2" placeholder="Practical advice for travelers…" required></textarea>
    </div>
  `;
  row
    .querySelector(`[data-remove="${tipRowCount}"]`)
    .addEventListener("click", () => row.remove());
  container.appendChild(row);
}

function initTipsModal() {
  const addBtn = $("addTipsBtn");
  if (addBtn)
    addBtn.addEventListener("click", async () => {
      await populateCountrySelects(["tipsCountryId"]);
      $("tipsModalTitle").textContent = "Add Local Tips";
      $("tipsForm").reset();
      $("tipsItemsContainer").innerHTML = "";
      tipRowCount = 0;
      addTipRow();
      openModal("tipsModal");
    });

  bindModalClose("tipsModal", "closeTipsModal", "cancelTipsModal", "tipsForm");

  const addRowBtn = $("addTipItemRow");
  if (addRowBtn) addRowBtn.addEventListener("click", addTipRow);

  const form = $("tipsForm");
  if (form)
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const countryId = Number($("tipsCountryId").value);
      if (!countryId) {
        showToast("Please select a country.", "warning");
        return;
      }

      const rows = $("tipsItemsContainer").querySelectorAll(".dynamic-row");
      const tips = [];
      rows.forEach((row) => {
        const id = row.dataset.rowId;
        const title = row
          .querySelector(`[name="tip_title_${id}"]`)
          ?.value.trim();
        const desc = row.querySelector(`[name="tip_desc_${id}"]`)?.value.trim();
        const category = row.querySelector(
          `[name="tip_category_${id}"]`,
        )?.value;
        const icon =
          row.querySelector(`[name="tip_icon_${id}"]`)?.value.trim() || "💡";
        if (title && desc)
          tips.push({ category, icon, title, description: desc });
      });

      if (!tips.length) {
        showToast("Add at least one tip.", "warning");
        return;
      }

      try {
        await apiFetch("/admin/local-tips", {
          method: "POST",
          body: JSON.stringify({ countryId, tips }),
        });
        showToast("Tips saved.", "success");
        closeModal("tipsModal");
      } catch (err) {
        showToast(`Failed: ${err.message}`, "error");
      }
    });
}

/* ================================================================
   5. CULTURE GUIDE MODAL — dos/donts dynamic rows
   POST  /api/admin/culture-guides
   Payload: { countryId, dos: [{text}], donts: [{text}], notes }
   Mirrors CultureGuideItem entity; CountryController.getCulture groups by type
================================================================ */
let doRowCount = 0;
let dontRowCount = 0;

function addDoRow() {
  doRowCount++;
  const container = $("dosContainer");
  if (!container) return;
  const row = document.createElement("div");
  row.className = "dynamic-row";
  row.dataset.rowId = doRowCount;
  row.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;">
      <input type="text" name="do_text_${doRowCount}" placeholder="e.g. Remove shoes before entering" required
        style="flex:1;padding:9px 12px;border:1px solid #d1c9bb;border-radius:10px;font:inherit;font-size:0.86rem;" />
      <button type="button" class="remove-row-btn" data-remove="do_${doRowCount}">×</button>
    </div>
  `;
  row
    .querySelector(`[data-remove="do_${doRowCount}"]`)
    .addEventListener("click", () => row.remove());
  container.appendChild(row);
}

function addDontRow() {
  dontRowCount++;
  const container = $("dontsContainer");
  if (!container) return;
  const row = document.createElement("div");
  row.className = "dynamic-row";
  row.dataset.rowId = dontRowCount;
  row.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;">
      <input type="text" name="dont_text_${dontRowCount}" placeholder="e.g. Don't tip servers" required
        style="flex:1;padding:9px 12px;border:1px solid #d1c9bb;border-radius:10px;font:inherit;font-size:0.86rem;" />
      <button type="button" class="remove-row-btn" data-remove="dont_${dontRowCount}">×</button>
    </div>
  `;
  row
    .querySelector(`[data-remove="dont_${dontRowCount}"]`)
    .addEventListener("click", () => row.remove());
  container.appendChild(row);
}

function initCultureModal() {
  const addBtn = $("addCultureBtn");
  if (addBtn)
    addBtn.addEventListener("click", async () => {
      await populateCountrySelects(["cultureCountryId"]);
      $("cultureModalTitle").textContent = "Add Culture Guide";
      $("cultureForm").reset();
      $("dosContainer").innerHTML = "";
      $("dontsContainer").innerHTML = "";
      doRowCount = 0;
      dontRowCount = 0;
      addDoRow();
      addDontRow();
      openModal("cultureModal");
    });

  bindModalClose(
    "cultureModal",
    "closeCultureModal",
    "cancelCultureModal",
    "cultureForm",
  );

  const addDoBtn = $("addDoRow");
  const addDontBtn = $("addDontRow");
  if (addDoBtn) addDoBtn.addEventListener("click", addDoRow);
  if (addDontBtn) addDontBtn.addEventListener("click", addDontRow);

  const form = $("cultureForm");
  if (form)
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const countryId = Number($("cultureCountryId").value);
      if (!countryId) {
        showToast("Please select a country.", "warning");
        return;
      }

      const dos = [];
      $("dosContainer")
        .querySelectorAll(".dynamic-row")
        .forEach((row) => {
          const id = row.dataset.rowId;
          const text = row
            .querySelector(`[name="do_text_${id}"]`)
            ?.value.trim();
          if (text) dos.push({ type: "DO", text });
        });

      const donts = [];
      $("dontsContainer")
        .querySelectorAll(".dynamic-row")
        .forEach((row) => {
          const id = row.dataset.rowId;
          const text = row
            .querySelector(`[name="dont_text_${id}"]`)
            ?.value.trim();
          if (text) donts.push({ type: "DONT", text });
        });

      const notes = $("cultureNotes").value.trim();

      const payload = {
        countryId,
        items: [...dos, ...donts],
        notes,
      };

      try {
        await apiFetch("/admin/culture-guides", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast("Culture guide saved.", "success");
        closeModal("cultureModal");
      } catch (err) {
        showToast(`Failed: ${err.message}`, "error");
      }
    });
}

// ===== TIER TAB SWITCH HANDLER =====
document.addEventListener("click", (e) => {
  const tab = e.target.closest(".tier-tab");
  if (!tab) return;

  const card = document.getElementById(tab.dataset.cardId);
  if (!card) return;

  const countryName = card.querySelector(".budget-country h4")?.textContent?.trim();
  const country = countries.find((c) => c.name === countryName);
  if (!country) return;

  const tabs = card.querySelectorAll(".tier-tab");
  tabs.forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");
});

/* ── Wire everything up on DOM ready ── */
document.addEventListener("DOMContentLoaded", () => {
  initEntryModal();
  initBudgetModal();
  initChecklistModal();
  initTipsModal();
  initCultureModal();
});
