const PROFILE_KEY = "fatigue_profile_v1";
const API_URL_KEY = "fatigue_api_url_v1";
const HISTORY_KEY = "fatigue_history_v1";
const PENDING_KEY = "fatigue_pending_v1";

const profileForm = document.getElementById("profileForm");
const dailyForm = document.getElementById("dailyForm");
const profileSummary = document.getElementById("profileSummary");
const editProfileBtn = document.getElementById("editProfileBtn");
const statusText = document.getElementById("statusText");
const jsonPreview = document.getElementById("jsonPreview");
const backupInfo = document.getElementById("backupInfo");
const retryPendingBtn = document.getElementById("retryPendingBtn");
const exportBackupBtn = document.getElementById("exportBackupBtn");

const fatigueScore = document.getElementById("fatigueScore");
const fatigueScoreValue = document.getElementById("fatigueScoreValue");
const sleepStars = document.getElementById("sleepStars");
const demoMode = document.getElementById("demoMode");
const apiUrl = document.getElementById("apiUrl");

let sleepQuality = 3;
let isProfileLocked = false;

init();

registerServiceWorker();

function init() {
  buildStars();
  fatigueScoreValue.textContent = fatigueScore.value;

  const savedApiUrl = localStorage.getItem(API_URL_KEY);
  if (savedApiUrl) apiUrl.value = savedApiUrl;

  loadProfileFromStorage();
  lockProfileIfReady();

  fatigueScore.addEventListener("input", () => {
    fatigueScoreValue.textContent = fatigueScore.value;
  });

  demoMode.addEventListener("change", () => {
    apiUrl.disabled = demoMode.checked;
  });

  editProfileBtn.addEventListener("click", unlockProfile);
  profileForm.addEventListener("submit", onSaveProfile);
  dailyForm.addEventListener("submit", onSubmitDaily);
  retryPendingBtn.addEventListener("click", retryPendingSubmissions);
  exportBackupBtn.addEventListener("click", exportLocalBackup);

  window.addEventListener("online", () => {
    status("網路已恢復，可重送待送資料", "ok");
  });

  refreshBackupInfo();
}

function buildStars() {
  sleepStars.innerHTML = "";
  for (let i = 1; i <= 5; i += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "star-btn";
    btn.dataset.value = String(i);
    btn.setAttribute("aria-label", `睡眠品質 ${i} 分`);
    btn.textContent = i <= sleepQuality ? "★" : "☆";

    btn.addEventListener("click", () => {
      sleepQuality = i;
      paintStars();
    });

    sleepStars.appendChild(btn);
  }
  paintStars();
}

function paintStars() {
  [...sleepStars.querySelectorAll(".star-btn")].forEach((btn) => {
    const value = Number(btn.dataset.value);
    const active = value <= sleepQuality;
    btn.textContent = active ? "★" : "☆";
    btn.classList.toggle("active", active);
  });
}

function lockProfileIfReady() {
  const profile = getProfile();
  if (!profile) {
    setProfileEditable(true);
    return;
  }

  setProfileValues(profile);
  setProfileEditable(false);
  renderProfileSummary(profile);
}

function setProfileEditable(editable) {
  isProfileLocked = !editable;
  [...profileForm.elements].forEach((el) => {
    if (el.id !== "saveProfileBtn") {
      el.disabled = !editable;
    }
  });
  document.getElementById("saveProfileBtn").hidden = !editable;
  editProfileBtn.hidden = editable;
  profileSummary.hidden = editable;
}

function unlockProfile() {
  setProfileEditable(true);
  status("已開啟基本資料編輯", "ok");
}

function onSaveProfile(event) {
  event.preventDefault();
  const profile = readProfileFromForm();

  if (!profile) {
    status("請完成所有基本資料欄位", "warn");
    return;
  }

  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  renderProfileSummary(profile);
  setProfileEditable(false);
  status("基本資料已儲存，之後採集不用重填", "ok");
}

async function onSubmitDaily(event) {
  event.preventDefault();

  const profile = getProfile();
  if (!profile) {
    status("請先完成基本資料儲存", "warn");
    setProfileEditable(true);
    return;
  }

  const payload = {
    timestamp: Math.floor(Date.now() / 1000),
    name: profile.name,
    gender: profile.gender,
    age: Number(profile.age),
    height_cm: Number(profile.height_cm),
    weight_kg: Number(profile.weight_kg),
    sport_type: profile.sport_type,
    device_id: profile.device_id,
    sleep_quality: sleepQuality,
    phase: document.getElementById("phase").value,
    body_part: document.getElementById("bodyPart").value,
    fatigue_score: Number(fatigueScore.value),
    notes: document.getElementById("notes").value.trim()
  };

  addHistory(payload);
  refreshBackupInfo();
  jsonPreview.textContent = JSON.stringify(payload, null, 2);

  if (demoMode.checked) {
    status(`Demo 送出成功，timestamp: ${payload.timestamp}（已存本機備份）`, "ok");
    return;
  }

  const url = apiUrl.value.trim();
  if (!url) {
    status("請先輸入 API URL，或改用 Demo 模式", "warn");
    addPending(payload);
    refreshBackupInfo();
    return;
  }

  localStorage.setItem(API_URL_KEY, url);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    status(`送出成功，timestamp: ${payload.timestamp}（已存本機備份）`, "ok");
  } catch (error) {
    addPending(payload);
    refreshBackupInfo();
    status(`送出失敗: ${error.message}`, "warn");
  }
}

async function retryPendingSubmissions() {
  const url = apiUrl.value.trim();
  if (demoMode.checked) {
    status("目前是 Demo 模式，先取消勾選再重送", "warn");
    return;
  }
  if (!url) {
    status("請先輸入 API URL", "warn");
    return;
  }

  const pending = getList(PENDING_KEY);
  if (!pending.length) {
    status("目前沒有待送資料", "ok");
    return;
  }

  const remain = [];
  let successCount = 0;

  for (const payload of pending) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      successCount += 1;
    } catch {
      remain.push(payload);
    }
  }

  localStorage.setItem(PENDING_KEY, JSON.stringify(remain));
  refreshBackupInfo();
  status(`重送完成：成功 ${successCount} 筆，待送 ${remain.length} 筆`, remain.length ? "warn" : "ok");
}

function exportLocalBackup() {
  const history = getList(HISTORY_KEY);
  if (!history.length) {
    status("目前沒有可匯出的本機資料", "warn");
    return;
  }

  const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateText = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `fatigue-backup-${dateText}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  status(`已匯出備份，共 ${history.length} 筆`, "ok");
}

function readProfileFromForm() {
  const name = document.getElementById("name").value.trim();
  const gender = document.getElementById("gender").value;
  const age = document.getElementById("age").value;
  const heightCm = document.getElementById("heightCm").value;
  const weightKg = document.getElementById("weightKg").value;
  const sportType = document.getElementById("sportType").value;
  const deviceId = document.getElementById("deviceId").value.trim().toUpperCase();

  if (!name || !gender || !age || !heightCm || !weightKg || !sportType || !deviceId) {
    return null;
  }

  return {
    name,
    gender,
    age: Number(age),
    height_cm: Number(heightCm),
    weight_kg: Number(weightKg),
    sport_type: sportType,
    device_id: deviceId
  };
}

function setProfileValues(profile) {
  document.getElementById("name").value = profile.name || "";
  document.getElementById("gender").value = profile.gender || "";
  document.getElementById("age").value = profile.age || "";
  document.getElementById("heightCm").value = profile.height_cm || "";
  document.getElementById("weightKg").value = profile.weight_kg || "";
  document.getElementById("sportType").value = profile.sport_type || "";
  document.getElementById("deviceId").value = profile.device_id || "";
}

function renderProfileSummary(profile) {
  profileSummary.innerHTML = [
    `<strong>${escapeHtml(profile.name)}</strong> | ${escapeHtml(profile.gender)} | ${profile.age} 歲`,
    `身高 ${profile.height_cm} cm | 體重 ${profile.weight_kg} kg`,
    `專項 ${escapeHtml(profile.sport_type)} | Device_ID ${escapeHtml(profile.device_id)}`
  ].join("<br>");
}

function loadProfileFromStorage() {
  const profile = getProfile();
  if (profile) {
    setProfileValues(profile);
    renderProfileSummary(profile);
  }
}

function getProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const required = ["name", "gender", "age", "height_cm", "weight_kg", "sport_type", "device_id"];
    const valid = required.every((k) => parsed[k] !== undefined && parsed[k] !== "");
    return valid ? parsed : null;
  } catch {
    return null;
  }
}

function status(msg, kind) {
  statusText.textContent = msg;
  statusText.classList.remove("warn", "ok");
  if (kind) statusText.classList.add(kind);
}

function addHistory(payload) {
  const list = getList(HISTORY_KEY);
  list.push(payload);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

function addPending(payload) {
  const list = getList(PENDING_KEY);
  list.push(payload);
  localStorage.setItem(PENDING_KEY, JSON.stringify(list));
}

function getList(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function refreshBackupInfo() {
  const historyCount = getList(HISTORY_KEY).length;
  const pendingCount = getList(PENDING_KEY).length;
  backupInfo.textContent = `本機備份 ${historyCount} 筆 | 待送 ${pendingCount} 筆`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js");
      if (navigator.onLine) {
        status("已啟用離線模式，可加入主畫面後使用", "ok");
      }
    } catch {
      status("離線快取初始化失敗，請重新整理一次", "warn");
    }
  });
}
