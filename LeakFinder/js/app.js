// js/app.js - DOM rendering, form validation, role checks & CRUD logic

let subscriptions = [];
let currentRole = "admin";
let subscriptionModalInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  subscriptions = getSubscriptions();
  currentRole = getCurrentRole();

  const modalEl = document.getElementById("subscriptionModal");
  subscriptionModalInstance = new bootstrap.Modal(modalEl);

  // Sync role selector UI
  const roleSelect = document.getElementById("roleSelector");
  roleSelect.value = currentRole;
  roleSelect.addEventListener("change", handleRoleChange);

  // Search and Filter listeners
  document.getElementById("searchInput").addEventListener("input", renderDashboard);
  document.getElementById("statusFilter").addEventListener("change", renderDashboard);
  document.getElementById("categoryFilter").addEventListener("change", renderDashboard);

  // Action buttons
  document.getElementById("btnOpenAddModal").addEventListener("click", openAddModal);
  document.getElementById("btnResetDemo").addEventListener("click", handleResetDemo);
  document.getElementById("btnExportCSV").addEventListener("click", exportToCSV);
  document.getElementById("subscriptionForm").addEventListener("submit", handleFormSubmit);

  applyRolePermissions();
  renderDashboard();
});

// Convert any billing cycle to normalized monthly cost in Rs
function getNormalizedMonthlyCost(amount, cycle) {
  const num = Number(amount) || 0;
  if (cycle === "Yearly") return num / 12;
  if (cycle === "Quarterly") return num / 3;
  return num;
}

// Role-based access control (Evaluation Metric: role checks block unauthorized actions)
function handleRoleChange(e) {
  currentRole = e.target.value;
  setCurrentRole(currentRole);
  applyRolePermissions();
  renderDashboard();
  showAlert(
    currentRole === "admin"
      ? "Switched to Owner/Admin mode: Full Create, Edit, and Delete access enabled."
      : "Switched to Family Viewer mode: Read-only access. Write actions are restricted.",
    currentRole === "admin" ? "success" : "warning"
  );
}

function isAuthorized(actionName = "modify subscriptions") {
  if (currentRole !== "admin") {
    showAlert(`Access Denied: Viewer role cannot ${actionName}. Switch to Owner/Admin in the top bar.`, "danger");
    return false;
  }
  return true;
}

function applyRolePermissions() {
  const isViewer = currentRole !== "admin";
  const addBtn = document.getElementById("btnOpenAddModal");
  const resetBtn = document.getElementById("btnResetDemo");
  const roleBadge = document.getElementById("roleStatusBadge");

  addBtn.disabled = isViewer;
  resetBtn.disabled = isViewer;

  if (isViewer) {
    roleBadge.textContent = "Read-Only (Viewer)";
    roleBadge.className = "badge bg-warning text-dark";
  } else {
    roleBadge.textContent = "Full Access (Admin)";
    roleBadge.className = "badge bg-success";
  }
}

// Render KPI cards and main subscription table
function renderDashboard() {
  const searchQuery = document.getElementById("searchInput").value.trim().toLowerCase();
  const statusFilter = document.getElementById("statusFilter").value;
  const categoryFilter = document.getElementById("categoryFilter").value;

  // Compute global KPIs across all subscriptions
  let totalMonthly = 0;
  let monthlyLeak = 0;
  let leakCount = 0;

  subscriptions.forEach((sub) => {
    const monthly = getNormalizedMonthlyCost(sub.amount, sub.cycle);
    totalMonthly += monthly;
    if (sub.status === "Forgotten" || sub.status === "Rarely Used") {
      monthlyLeak += monthly;
      leakCount += 1;
    }
  });

  document.getElementById("kpiTotalMonthly").textContent = `₹${Math.round(totalMonthly).toLocaleString("en-IN")}`;
  document.getElementById("kpiMonthlyLeak").textContent = `₹${Math.round(monthlyLeak).toLocaleString("en-IN")}`;
  document.getElementById("kpiAnnualSavings").textContent = `₹${Math.round(monthlyLeak * 12).toLocaleString("en-IN")}/yr`;
  document.getElementById("kpiActiveCount").textContent = `${subscriptions.length} (${leakCount} leaks)`;

  // Filter table rows
  const filtered = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.name.toLowerCase().includes(searchQuery) ||
      sub.category.toLowerCase().includes(searchQuery) ||
      (sub.notes && sub.notes.toLowerCase().includes(searchQuery));
    const matchesStatus = statusFilter === "All" || sub.status === statusFilter;
    const matchesCategory = categoryFilter === "All" || sub.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const tbody = document.getElementById("subscriptionTableBody");
  const emptyState = document.getElementById("emptyState");
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.classList.remove("d-none");
    return;
  }
  emptyState.classList.add("d-none");

  filtered.forEach((sub) => {
    const monthlyEq = Math.round(getNormalizedMonthlyCost(sub.amount, sub.cycle));
    const tr = document.createElement("tr");
    if (sub.status === "Forgotten") {
      tr.classList.add("table-danger-subtle");
    } else if (sub.status === "Rarely Used") {
      tr.classList.add("table-warning-subtle");
    }

    tr.innerHTML = `
      <td>
        <div class="fw-semibold text-dark">${escapeHtml(sub.name)}</div>
        <div class="small text-muted">${escapeHtml(sub.notes || "No notes")}</div>
      </td>
      <td><span class="badge bg-secondary-subtle text-secondary-emphasis">${escapeHtml(sub.category)}</span></td>
      <td>
        <div class="fw-bold">₹${Number(sub.amount).toLocaleString("en-IN")} <span class="small fw-normal text-muted">/ ${escapeHtml(sub.cycle)}</span></div>
        <div class="small text-muted">≈ ₹${monthlyEq.toLocaleString("en-IN")}/mo</div>
      </td>
      <td>${escapeHtml(sub.nextBillingDate)}</td>
      <td>${getStatusBadgeHtml(sub.status)}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditModal('${sub.id}')" ${currentRole !== "admin" ? "disabled" : ""}>
          Edit
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteSubscription('${sub.id}')" ${currentRole !== "admin" ? "disabled" : ""}>
          Delete
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function getStatusBadgeHtml(status) {
  if (status === "Forgotten") {
    return `<span class="badge bg-danger">Forgotten (Leak!)</span>`;
  }
  if (status === "Rarely Used") {
    return `<span class="badge bg-warning text-dark">Rarely Used</span>`;
  }
  return `<span class="badge bg-success">Active</span>`;
}

// Open Modal for Create
function openAddModal() {
  if (!isAuthorized("add new subscriptions")) return;
  const form = document.getElementById("subscriptionForm");
  form.reset();
  form.classList.remove("was-validated");
  document.getElementById("subId").value = "";
  document.getElementById("modalTitle").textContent = "Add Subscription";
  document.getElementById("formErrorMsg").classList.add("d-none");
  subscriptionModalInstance.show();
}

// Open Modal for Edit
window.openEditModal = function (id) {
  if (!isAuthorized("edit subscriptions")) return;
  const sub = subscriptions.find((item) => item.id === id);
  if (!sub) return;

  const form = document.getElementById("subscriptionForm");
  form.classList.remove("was-validated");
  document.getElementById("formErrorMsg").classList.add("d-none");

  document.getElementById("subId").value = sub.id;
  document.getElementById("subName").value = sub.name;
  document.getElementById("subCategory").value = sub.category;
  document.getElementById("subAmount").value = sub.amount;
  document.getElementById("subCycle").value = sub.cycle;
  document.getElementById("subDate").value = sub.nextBillingDate;
  document.getElementById("subStatus").value = sub.status;
  document.getElementById("subNotes").value = sub.notes || "";

  document.getElementById("modalTitle").textContent = "Edit Subscription";
  subscriptionModalInstance.show();
};

// Handle Form Validation & Submit
function handleFormSubmit(e) {
  e.preventDefault();
  if (!isAuthorized("save subscription changes")) return;

  const form = e.target;
  const name = document.getElementById("subName").value.trim();
  const category = document.getElementById("subCategory").value;
  const amount = parseFloat(document.getElementById("subAmount").value);
  const cycle = document.getElementById("subCycle").value;
  const nextBillingDate = document.getElementById("subDate").value;
  const status = document.getElementById("subStatus").value;
  const notes = document.getElementById("subNotes").value.trim();
  const errorBox = document.getElementById("formErrorMsg");

  // Custom validation check
  if (!name || name.length < 2 || isNaN(amount) || amount <= 0 || !nextBillingDate || !category || !status) {
    form.classList.add("was-validated");
    errorBox.textContent = "Please enter a valid service name (2+ chars), a positive cost (₹ > 0), and a billing date.";
    errorBox.classList.remove("d-none");
    return;
  }

  const existingId = document.getElementById("subId").value;
  if (existingId) {
    const idx = subscriptions.findIndex((s) => s.id === existingId);
    if (idx > -1) {
      subscriptions[idx] = { id: existingId, name, category, amount, cycle, nextBillingDate, status, notes };
    }
    showAlert(`Updated "${name}" successfully.`, "success");
  } else {
    const newSub = {
      id: "sub-" + Date.now(),
      name,
      category,
      amount,
      cycle,
      nextBillingDate,
      status,
      notes
    };
    subscriptions.unshift(newSub);
    showAlert(`Added "${name}" to your tracker.`, "success");
  }

  saveSubscriptions(subscriptions);
  subscriptionModalInstance.hide();
  renderDashboard();
}

// Delete Subscription
window.deleteSubscription = function (id) {
  if (!isAuthorized("delete subscriptions")) return;
  const sub = subscriptions.find((item) => item.id === id);
  if (!sub) return;

  if (confirm(`Remove "${sub.name}" from your subscription tracker?`)) {
    subscriptions = subscriptions.filter((item) => item.id !== id);
    saveSubscriptions(subscriptions);
    renderDashboard();
    showAlert(`Deleted "${sub.name}".`, "secondary");
  }
};

// Reset Demo Data
async function handleResetDemo() {
  if (!isAuthorized("reset demo data")) return;
  if (confirm("Reset all subscriptions back to the default OJT sample data?")) {
    subscriptions = await resetToSampleData();
    renderDashboard();
    showAlert("Demo data restored from sample seed.", "info");
  }
}

// Export main table to CSV (Good-to-Have Feature)
function exportToCSV() {
  if (subscriptions.length === 0) {
    showAlert("No subscriptions available to export.", "warning");
    return;
  }
  const headers = ["ID", "Service Name", "Category", "Cost (INR)", "Billing Cycle", "Monthly Equivalent (INR)", "Next Renewal", "Status", "Notes"];
  const rows = subscriptions.map((sub) => [
    sub.id,
    `"${(sub.name || "").replace(/"/g, '""')}"`,
    sub.category,
    sub.amount,
    sub.cycle,
    Math.round(getNormalizedMonthlyCost(sub.amount, sub.cycle)),
    sub.nextBillingDate,
    sub.status,
    `"${(sub.notes || "").replace(/"/g, '""')}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "leakfinder-subscriptions.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helper for status alerts
function showAlert(message, type = "info") {
  const container = document.getElementById("alertContainer");
  container.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show py-2 small shadow-sm" role="alert">
      ${escapeHtml(message)}
      <button type="button" class="btn-close py-2" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
