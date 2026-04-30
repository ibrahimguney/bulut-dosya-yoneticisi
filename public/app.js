import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://gblyelnbskjsumxxdyct.supabase.co";
const SUPABASE_KEY = "sb_publishable_7jm5f6_T8QaqwO4fAkhKnQ_7-woQ-fl";
const BUCKET = "files";
const QUOTA_BYTES = 100 * 1024 * 1024;
const SHARED_FILES_KEY = "bulut-shared-files";
const DEFAULT_FOLDERS = [
  { id: "documents", name: "Belgeler", system: true },
  { id: "images", name: "Görseller", system: true },
  { id: "shared", name: "Paylaşılanlar", system: true },
];

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
  sharedFiles: loadSharedFiles(),
  folders: [...DEFAULT_FOLDERS],
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
  folderDialogTitle: document.querySelector("#folderDialogTitle"),
  folderForm: document.querySelector("#folderForm"),
  folderNameInput: document.querySelector("#folderNameInput"),
  folderSubmitButton: document.querySelector("#folderSubmitButton"),
  toast: document.querySelector("#toast"),
};

document.addEventListener("click", handleDocumentClick);
els.authForm.addEventListener("submit", handleAuthSubmit);
els.signOutButton.addEventListener("click", signOut);
els.searchInput.addEventListener("input", renderFiles);
els.fileInput.addEventListener("change", handleFiles);
els.newFolderButton.addEventListener("click", () => {
  openFolderDialog();
});
els.folderForm.addEventListener("submit", handleFolderSave);

init();

async function init() {
  const { data } = await supabase.auth.getSession();
  state.user = data.session?.user || null;

  supabase.auth.onAuthStateChange(async (_event, session) => {
    state.user = session?.user || null;
    if (state.user) await loadWorkspace();
    render();
  });

  if (state.user) await loadWorkspace();
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
    if (state.user) await loadWorkspace();
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
  state.folders = [...DEFAULT_FOLDERS];
  state.activeFolder = "all";
  render();
}

function handleDocumentClick(event) {
  const folderActionButton = event.target.closest("[data-folder-action]");
  if (folderActionButton) {
    const folder = state.folders.find((item) => item.id === folderActionButton.dataset.folderId);
    if (!folder) return;

    if (folderActionButton.dataset.folderAction === "rename") openFolderDialog(folder);
    if (folderActionButton.dataset.folderAction === "delete") deleteFolder(folder);
    return;
  }

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

async function handleFolderSave(event) {
  if (event.submitter?.value !== "save") return;

  const name = els.folderNameInput.value.trim();
  if (!name) return;

  const editingId = els.folderForm.dataset.editingFolder || "";
  const id = slugify(name);
  if (state.folders.some((folder) => folder.id === id && folder.id !== editingId)) {
    showToast("Bu klasör zaten var.");
    event.preventDefault();
    return;
  }

  if (editingId) {
    await renameFolder(editingId, id, name, event);
    return;
  }

  await createFolder(id, name, event);
}

async function createFolder(id, name, event) {
  const { data, error } = await supabase
    .from("folders")
    .insert({ slug: id, name })
    .select("slug, name")
    .single();

  if (error) {
    showToast(error.message || "Klasör oluşturulamadı.");
    event.preventDefault();
    return;
  }

  const folder = { id: data.slug, name: data.name, system: false };
  state.folders.push(folder);
  state.activeFolder = id;
  syncFolderNav();
  render();
  showToast("Klasör oluşturuldu.");
}

async function renameFolder(oldId, newId, name, event) {
  const folder = state.folders.find((item) => item.id === oldId);
  if (!folder || folder.system) return;

  const folderFiles = state.files.filter((file) => file.folder === oldId);
  const nextSlug = folderFiles.length ? oldId : newId;

  const { data, error } = await supabase
    .from("folders")
    .update({ slug: nextSlug, name })
    .eq("slug", oldId)
    .select("slug, name")
    .single();

  if (error) {
    showToast(error.message || "Klasör güncellenemedi.");
    event.preventDefault();
    return;
  }

  folder.id = data.slug;
  folder.name = data.name;
  if (state.activeFolder === oldId) state.activeFolder = data.slug;
  await loadWorkspace();
  if (state.folders.some((item) => item.id === data.slug)) state.activeFolder = data.slug;
  render();
  showToast(folderFiles.length && oldId !== newId ? "Klasör adı güncellendi; içindeki dosyalar korundu." : "Klasör güncellendi.");
}

async function deleteFolder(folder) {
  if (folder.system) return;

  const folderFiles = state.files.filter((file) => file.folder === folder.id);
  if (folderFiles.length) {
    showToast("Bu klasör boş değil. Önce içindeki dosyaları sil.");
    return;
  }

  const confirmed = window.confirm(`"${folder.name}" klasörü silinsin mi?`);
  if (!confirmed) return;

  const { error } = await supabase.from("folders").delete().eq("slug", folder.id);
  if (error) {
    showToast(error.message || "Klasör silinemedi.");
    return;
  }

  state.folders = state.folders.filter((item) => item.id !== folder.id);
  if (state.activeFolder === folder.id) state.activeFolder = "all";
  render();
  showToast("Klasör silindi.");
}

async function loadWorkspace() {
  await loadFolders();
  await loadFiles();
}

async function loadFolders() {
  if (!state.user) return;

  const { data, error } = await supabase.from("folders").select("slug, name").order("created_at");

  if (error) {
    state.folders = [...DEFAULT_FOLDERS];
    showToast(error.message || "Klasörler okunamadı.");
    return;
  }

  const customFolders = (data || []).map((folder) => ({
    id: folder.slug,
    name: folder.name,
    system: false,
  }));
  state.folders = [...DEFAULT_FOLDERS, ...customFolders];
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
      shared: state.sharedFiles.includes(`${prefix}/${item.name}`),
      createdAt: new Date(item.created_at || item.updated_at || Date.now()).getTime(),
    }));
}

function render() {
  const signedIn = Boolean(state.user);
  els.authView.hidden = signedIn;
  els.dashboard.hidden = !signedIn;
  els.accountName.textContent = state.user?.email || "Oturum kapalı";

  syncFolderNav();

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
  const percent = getUsagePercent(usage);
  els.fileCount.textContent = state.files.length;
  els.folderCount.textContent = state.folders.filter((folder) => folder.id !== "shared").length;
  els.shareCount.textContent = state.files.filter((file) => file.shared).length;
  els.storagePercent.textContent = percent.label;
  els.storageMeter.style.width = percent.meterWidth;
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
  const sharedClass = file.shared ? "shared" : "";
  const sharedBadge = file.shared ? '<span class="file-badge">Paylaşıldı</span>' : "";

  return `
    <article class="file-card">
      <div class="file-symbol ${sharedClass}" aria-hidden="true">${extension}</div>
      <div class="file-meta">
        <strong title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</strong>
        <span>${formatSize(file.size)} · ${formatDate(file.createdAt)}</span>
        ${sharedBadge}
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
  if (!state.sharedFiles.includes(file.path)) {
    state.sharedFiles.push(file.path);
    saveSharedFiles();
  }
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

  state.sharedFiles = state.sharedFiles.filter((path) => path !== file.path);
  saveSharedFiles();
  await loadFiles();
  render();
  showToast("Dosya silindi.");
}

function getFolderTitle() {
  if (state.activeFolder === "all") return "Tüm dosyalar";
  return state.folders.find((folder) => folder.id === state.activeFolder)?.name || "Klasör";
}

function syncFolderNav() {
  document.querySelectorAll("[data-dynamic-folder='true']").forEach((button) => button.remove());
  state.folders.filter((folder) => !folder.system).forEach(addFolderNavItem);
}

function addFolderNavItem(folder) {
  if (document.querySelector(`[data-folder="${folder.id}"]`)) return;

  const button = document.createElement("button");
  button.className = "nav-item";
  button.dataset.folder = folder.id;
  button.dataset.dynamicFolder = "true";
  button.type = "button";
  button.innerHTML = `
    <span class="nav-icon">▤</span>
    <span>${escapeHtml(folder.name)}</span>
    <span class="nav-folder-actions">
      <button type="button" data-folder-action="rename" data-folder-id="${escapeHtml(folder.id)}" title="Yeniden adlandır" aria-label="Yeniden adlandır">✎</button>
      <button type="button" data-folder-action="delete" data-folder-id="${escapeHtml(folder.id)}" title="Sil" aria-label="Sil">×</button>
    </span>
  `;
  document.querySelector(".nav-list").append(button);
}

function openFolderDialog(folder = null) {
  els.folderForm.dataset.editingFolder = folder?.id || "";
  els.folderDialogTitle.textContent = folder ? "Klasörü düzenle" : "Yeni klasör";
  els.folderSubmitButton.textContent = folder ? "Kaydet" : "Oluştur";
  els.folderNameInput.value = folder?.name || "";
  els.folderDialog.showModal();
  els.folderNameInput.focus();
  els.folderNameInput.select();
}

function inferFolder(file) {
  if (file.type.startsWith("image/")) return "images";
  if (state.activeFolder !== "all" && state.activeFolder !== "shared") return state.activeFolder;
  return "documents";
}

function getUsage() {
  return state.files.reduce((sum, file) => sum + file.size, 0);
}

function getUsagePercent(bytes) {
  if (bytes === 0) return { label: "0%", meterWidth: "0%" };

  const raw = (bytes / QUOTA_BYTES) * 100;
  if (raw < 1) return { label: "<1%", meterWidth: "2%" };

  const rounded = Math.min(100, Math.round(raw));
  return { label: `${rounded}%`, meterWidth: `${rounded}%` };
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
  const decoded = value.replace(/_/g, " ");
  return decoded.replace(/^\d+-/, "");
}

function loadSharedFiles() {
  try {
    return JSON.parse(localStorage.getItem(SHARED_FILES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveSharedFiles() {
  localStorage.setItem(SHARED_FILES_KEY, JSON.stringify(state.sharedFiles));
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
