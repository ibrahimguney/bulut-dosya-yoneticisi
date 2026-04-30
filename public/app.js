import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://yqleugywrmevmsjzekdw.supabase.co";
const SUPABASE_KEY = "sb_publishable_7jm5f6_T8QaqwO4fAkhKnQ_7-woQ-fl";
const BUCKET = "files";
const QUOTA_BYTES = 100 * 1024 * 1024;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

const state = {
  user: null,
  activeFolder: "all",
  view: "grid",
  files: [],
  folders: [
    { id: "documents", name: "Belgeler" },
    { id: "images", name: "Görseller" },
    { id: "shared", name: "Paylaşılanlar" },
  ],
};

const els = {
  authView: document.querySelector("#authView"),
  authForm: document.querySelector("#authForm"),
  authMessage: document.querySelector("#authMessage"),
  emailInput: document.querySelector("#emailInput"),
  passwordInput: document.querySelector("#passwordInput"),
  dashboard: document.querySelector("#dashboard"),
  accountName: document.querySelector("#accountName"),
  signOutButton: document.querySelector("#signOutButton"),
  searchInput: document.querySelector("#searchInput"),
  fileInput: document.querySelector("#fileInput"),
  fileGrid: document.querySelector("#fileGrid"),
  emptyState: document.querySelector("#emptyState"),
  resultCount: document.querySelector("#resultCount"),
  currentFolderTitle: document.querySelector("#currentFolderTitle"),
  fileCount: document.querySelector("#fileCount"),
  folderCount: document.querySelector("#folderCount"),
  shareCount: document.querySelector("#shareCount"),
  storagePercent: document.querySelector("#storagePercent"),
  storageMeter: document.querySelector("#storageMeter"),
  storageText: document.querySelector("#storageText"),
  newFolderButton: document.querySelector("#newFolderButton"),
  folderDialog: document.querySelector("#folderDialog"),
  folderForm: document.querySelector("#folderForm"),
  folderNameInput: document.querySelector("#folderNameInput"),
  toast: document.querySelector("#toast"),
};

document.addEventListener("click", handleDocumentClick);
els.authForm.addEventListener("submit", handleAuthSubmit);
els.signOutButton.addEventListener("click", signOut);
els.searchInput.addEventListener("input", renderFiles);
els.fileInput.addEventListener("change", handleFiles);
els.newFolderButton.addEventListener("click", () => {
  els.folderNameInput.value = "";
  els.folderDialog.showModal();
  els.folderNameInput.focus();
});
els.folderForm.addEventListener("submit", handleFolderCreate);

init();

async function init() {
  const { data } = await supabase.auth.getSession();
  state.user = data.session?.user || null;

  supabase.auth.onAuthStateChange(async (_event, session) => {
    state.user = session?.user || null;
    if (state.user) await loadFiles();
    render();
  });

  if (state.user) await loadFiles();
  render();
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const submitter = event.submitter;
  const mode = submitter?.dataset.authMode || "signin";
  const email = els.emailInput.value.trim();
  const password = els.passwordInput.value;

  setAuthMessage("İşlem yapılıyor...", "info");
  submitter.disabled = true;
  try {
    const result =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) throw result.error;

    if (mode === "signup" && !result.data.session) {
      setAuthMessage("Kayıt oluşturuldu. Supabase e-posta doğrulaması istiyorsa gelen kutunu kontrol et.", "success");
      showToast("Kayıt oluşturuldu.");
      return;
    }

    state.user = result.data.user || result.data.session?.user || state.user;
    setAuthMessage("Oturum açıldı.", "success");
    if (state.user) await loadFiles();
    render();
  } catch (error) {
    const message = translateAuthError(error.message || "Giriş işlemi tamamlanamadı.");
    setAuthMessage(message, "error");
    showToast(message);
  } finally {
    submitter.disabled = false;
  }
}

async function signOut() {
  await supabase.auth.signOut();
  state.user = null;
  state.files = [];
  render();
}

function handleDocumentClick(event) {
  const navButton = event.target.closest("[data-folder]");
  if (navButton) {
    state.activeFolder = navButton.dataset.folder;
    render();
    return;
  }

  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    state.view = viewButton.dataset.view;
    render();
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const file = state.files.find((item) => item.id === actionButton.dataset.id);
  if (!file) return;

  if (actionButton.dataset.action === "share") shareFile(file);
  if (actionButton.dataset.action === "download") downloadFile(file);
  if (actionButton.dataset.action === "delete") deleteFile(file);
}

async function handleFiles(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length || !state.user) return;

  const incomingUsage = files.reduce((sum, file) => sum + file.size, 0);
  if (getUsage() + incomingUsage > QUOTA_BYTES) {
    showToast("Depolama kotası aşılıyor.");
    event.target.value = "";
    return;
  }

  for (const file of files) {
    const folder = inferFolder(file);
    const path = `${state.user.id}/${folder}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      showToast(error.message || "Dosya yüklenemedi.");
      event.target.value = "";
      return;
    }
  }

  event.target.value = "";
  await loadFiles();
  render();
  showToast(`${files.length} dosya yüklendi.`);
}

async function handleFolderCreate(event) {
  if (event.submitter?.value !== "create") return;

  const name = els.folderNameInput.value.trim();
  if (!name) return;

  const id = slugify(name);
  if (state.folders.some((folder) => folder.id === id)) {
    showToast("Bu klasör zaten var.");
    event.preventDefault();
    return;
  }

  state.folders.push({ id, name });
  state.activeFolder = id;
  addFolderNavItem({ id, name });
  render();
  showToast("Klasör oluşturuldu.");
}

async function loadFiles() {
  if (!state.user) return;

  const folders = state.folders.filter((folder) => folder.id !== "shared");
  const results = await Promise.all(folders.map((folder) => listFolder(folder.id)));
  state.files = results.flat().sort((a, b) => b.createdAt - a.createdAt);
}

async function listFolder(folder) {
  const prefix = `${state.user.id}/${folder}`;
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    showToast(error.message || "Dosyalar okunamadı.");
    return [];
  }

  return (data || [])
    .filter((item) => item.name !== ".emptyFolderPlaceholder")
    .map((item) => ({
      id: `${prefix}/${item.name}`,
      path: `${prefix}/${item.name}`,
      name: stripUploadPrefix(item.name),
      type: item.metadata?.mimetype || "application/octet-stream",
      size: item.metadata?.size || 0,
      folder,
      shared: false,
      createdAt: new Date(item.created_at || item.updated_at || Date.now()).getTime(),
    }));
}

function render() {
  const signedIn = Boolean(state.user);
  els.authView.hidden = signedIn;
  els.dashboard.hidden = !signedIn;
  els.accountName.textContent = state.user?.email || "Oturum kapalı";

  ensureCustomFolders();

  document.querySelectorAll("[data-folder]").forEach((button) => {
    button.classList.toggle("active", button.dataset.folder === state.activeFolder);
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.view);
  });

  renderStats();
  renderFiles();
}

function renderStats() {
  const usage = getUsage();
  const percent = Math.min(100, Math.round((usage / QUOTA_BYTES) * 100));
  els.fileCount.textContent = state.files.length;
  els.folderCount.textContent = state.folders.length;
  els.shareCount.textContent = state.files.filter((file) => file.shared).length;
  els.storagePercent.textContent = `${percent}%`;
  els.storageMeter.style.width = `${percent}%`;
  els.storageText.textContent = `${formatSize(usage)} / ${formatSize(QUOTA_BYTES)}`;
}

function renderFiles() {
  const files = getVisibleFiles();
  els.currentFolderTitle.textContent = getFolderTitle();
  els.resultCount.textContent = `${files.length} öğe`;
  els.emptyState.hidden = files.length > 0;
  els.fileGrid.className = `file-grid ${state.view === "list" ? "list" : ""}`;
  els.fileGrid.innerHTML = files.map(fileCardTemplate).join("");
}

function getVisibleFiles() {
  const query = els.searchInput.value.trim().toLocaleLowerCase("tr-TR");
  return state.files
    .filter((file) => {
      if (state.activeFolder === "all") return true;
      if (state.activeFolder === "shared") return file.shared;
      return file.folder === state.activeFolder;
    })
    .filter((file) => file.name.toLocaleLowerCase("tr-TR").includes(query));
}

function fileCardTemplate(file) {
  const extension = file.name.includes(".") ? file.name.split(".").pop().slice(0, 4).toUpperCase() : "FILE";

  return `
    <article class="file-card">
      <div class="file-symbol" aria-hidden="true">${extension}</div>
      <div class="file-meta">
        <strong title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</strong>
        <span>${formatSize(file.size)} · ${formatDate(file.createdAt)}</span>
      </div>
      <div class="file-actions">
        <button type="button" data-action="share" data-id="${escapeHtml(file.id)}" title="Paylaş" aria-label="Paylaş">↗</button>
        <button type="button" data-action="download" data-id="${escapeHtml(file.id)}" title="İndir" aria-label="İndir">↓</button>
        <button type="button" data-action="delete" data-id="${escapeHtml(file.id)}" title="Sil" aria-label="Sil">×</button>
      </div>
    </article>
  `;
}

async function shareFile(file) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(file.path, 60 * 60);
  if (error) {
    showToast(error.message || "Paylaşım linki oluşturulamadı.");
    return;
  }

  await navigator.clipboard?.writeText(data.signedUrl);
  file.shared = true;
  render();
  showToast("1 saatlik paylaşım linki panoya kopyalandı.");
}

async function downloadFile(file) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(file.path, 60);
  if (error) {
    showToast(error.message || "İndirme linki oluşturulamadı.");
    return;
  }

  const link = document.createElement("a");
  link.href = data.signedUrl;
  link.download = file.name;
  link.click();
}

async function deleteFile(file) {
  const { error } = await supabase.storage.from(BUCKET).remove([file.path]);
  if (error) {
    showToast(error.message || "Dosya silinemedi.");
    return;
  }

  await loadFiles();
  render();
  showToast("Dosya silindi.");
}

function getFolderTitle() {
  if (state.activeFolder === "all") return "Tüm dosyalar";
  return state.folders.find((folder) => folder.id === state.activeFolder)?.name || "Klasör";
}

function ensureCustomFolders() {
  state.folders.forEach(addFolderNavItem);
}

function addFolderNavItem(folder) {
  if (document.querySelector(`[data-folder="${folder.id}"]`)) return;

  const button = document.createElement("button");
  button.className = "nav-item";
  button.dataset.folder = folder.id;
  button.type = "button";
  button.innerHTML = `<span class="nav-icon">▤</span>${escapeHtml(folder.name)}`;
  document.querySelector(".nav-list").append(button);
}

function inferFolder(file) {
  if (file.type.startsWith("image/")) return "images";
  if (state.activeFolder !== "all" && state.activeFolder !== "shared") return state.activeFolder;
  return "documents";
}

function getUsage() {
  return state.files.reduce((sum, file) => sum + file.size, 0);
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" }).format(timestamp);
}

function slugify(value) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sanitizeFileName(value) {
  return value.replace(/[^\w.\-() ]/g, "_");
}

function stripUploadPrefix(value) {
  return value.replace(/^\d+-/, "");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return entities[char];
  });
}

function translateAuthError(message) {
  const lower = message.toLocaleLowerCase("tr-TR");
  if (lower.includes("failed to fetch")) return "Supabase bağlantısı kurulamadı. Project URL veya publishable key yanlış olabilir.";
  if (lower.includes("invalid login credentials")) return "E-posta veya şifre hatalı. Önce Kayıt ol düğmesiyle hesap oluştur.";
  if (lower.includes("email not confirmed")) return "E-posta doğrulanmamış. Gelen kutundaki Supabase doğrulama linkine tıkla.";
  if (lower.includes("user already registered")) return "Bu e-posta zaten kayıtlı. Giriş yap düğmesini kullan.";
  if (lower.includes("password should be at least")) return "Şifre en az 6 karakter olmalı.";
  return message;
}

function setAuthMessage(message, type = "info") {
  els.authMessage.textContent = message;
  els.authMessage.className = `auth-message ${type === "info" ? "" : type}`;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("visible"), 2600);
}
