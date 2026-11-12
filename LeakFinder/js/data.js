// js/data.js - Default sample data & localStorage initialization

const STORAGE_KEY = "leakfinder_subscriptions_v1";
const ROLE_STORAGE_KEY = "leakfinder_user_role_v1";

const DEFAULT_SUBSCRIPTIONS = [
  {
    id: "sub-1",
    name: "Netflix Standard (Shared)",
    category: "OTT",
    amount: 499,
    cycle: "Monthly",
    nextBillingDate: "2026-11-18",
    status: "Active",
    notes: "Shared with family (4 screens)"
  },
  {
    id: "sub-2",
    name: "Cult.fit Pro Gym Pass",
    category: "Gym & Fitness",
    amount: 1200,
    cycle: "Monthly",
    nextBillingDate: "2026-11-15",
    status: "Forgotten",
    notes: "Haven't visited in 6 weeks — cancel before renewal"
  },
  {
    id: "sub-3",
    name: "Spotify Duo",
    category: "Music",
    amount: 149,
    cycle: "Monthly",
    nextBillingDate: "2026-11-22",
    status: "Active",
    notes: "Daily commute use"
  },
  {
    id: "sub-4",
    name: "Canva Pro Trial Auto-Renew",
    category: "Apps & SaaS",
    amount: 499,
    cycle: "Monthly",
    nextBillingDate: "2026-11-14",
    status: "Rarely Used",
    notes: "Used once for college fest poster"
  },
  {
    id: "sub-5",
    name: "Disney+ Hotstar Super",
    category: "OTT",
    amount: 899,
    cycle: "Yearly",
    nextBillingDate: "2026-12-05",
    status: "Active",
    notes: "Annual cricket & movie plan"
  },
  {
    id: "sub-6",
    name: "PlayStation Plus Essential",
    "category": "Gaming",
    amount: 499,
    cycle: "Monthly",
    nextBillingDate: "2026-11-28",
    status: "Forgotten",
    notes: "Auto-debit active during exam semester"
  }
];

function getSubscriptions() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SUBSCRIPTIONS));
    return [...DEFAULT_SUBSCRIPTIONS];
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Corrupted localStorage data, resetting to defaults.", e);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SUBSCRIPTIONS));
    return [...DEFAULT_SUBSCRIPTIONS];
  }
}

function saveSubscriptions(subscriptions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
}

async function resetToSampleData() {
  try {
    const response = await fetch("./sample-data.json");
    if (response.ok) {
      const seedData = await response.json();
      saveSubscriptions(seedData);
      return seedData;
    }
  } catch (err) {
    // Fallback when opened directly via file:// protocol
    console.warn("Fetch fallback triggered; using embedded DEFAULT_SUBSCRIPTIONS.");
  }
  saveSubscriptions(DEFAULT_SUBSCRIPTIONS);
  return [...DEFAULT_SUBSCRIPTIONS];
}

function getCurrentRole() {
  return localStorage.getItem(ROLE_STORAGE_KEY) || "admin";
}

function setCurrentRole(role) {
  localStorage.setItem(ROLE_STORAGE_KEY, role);
}
