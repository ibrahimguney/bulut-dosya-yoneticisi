const STORAGE_KEY = "bulut-dosya-yoneticisi-state";
const QUOTA_BYTES = 100 * 1024 * 1024;

const seedState = {
  user: null,
  activeFolder: "all",
  view: "grid",
  folders: [
    { id: "documents", name: "Belgeler" },
    { id: "images", name: "Görseller" },
    { id: "shared", name: "Paylaşılanlar" },
  ],
  files: [
    {
      id: crypto.randomUUID(),
      name: "Teklif-dosyasi.pdf",
      type: "application/pdf",
      size: 820000,
      folder: "documents",
      shared: true,
      createdAt: Date.now() - 86400000,
      dataUrl: "",
    },
    {
      id: crypto.randomUUID(),
      name: "Ekip-notlari.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 260000,
      folder: "documents",
      shared: false,
      createdAt: Date.now() - 3600000,
      dataUrl: "",
    },
    {
      id: crypto.randomUUID(),
      name: "Kapak-gorseli.png",
      type: "image/png",
      size: 1340000,
      folder: "images",
      shared: false,
      createdAt: Date.now() - 5400000,
      dataUrl: "",
    },
  ],
};

let state = loadState();

const els = {
  authView: document.querySelector("#authView"),
  authForm: document.querySelector("#authForm"),
  emailInput: document.querySelector("#emailInput"),
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
els.authForm.addEventListener("submit", handleSignIn);
els.signOutButton.addEventListener("click", signOut);
els.searchInput.addEventListener("input", render);
els.fileInput.addEventListener("change", handleFiles);
els.newFolderButton.addEventListener("click", () => {
  els.folderNameInput.value = "";
  els.folderDialog.showModal();
  els.folderNameInput.focus();
});
els.folderForm.addEventListener("submit", handleFolderCreate);

render();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(seedState);

  try {
    return { ...structuredClone(seedState), ...JSON.parse(saved) };
  } catch {
    return structuredClone(seedState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function handleSignIn(event) {
  event.preventDefault();
  state.user = { email: els.emailInput.value.trim() };
  saveState();
  render();
  showToast("Oturum açıldı.");
}

function signOut() {
  state.user = null;
  saveState();
  render();
}

function handleDocumentClick(event) {
  const navButton = event.target.closest("[data-folder]");
  if (navButton) {
    state.activeFolder = navButton.dataset.folder;
    saveState();
    render();
    return;
  }

  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    state.view = viewButton.dataset.view;
    saveState();
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
  if (!files.length) return;

  const currentUsage = getUsage();
  const incomingUsage = files.reduce((sum, file) => sum + file.size, 0);

  if (currentUsage + incomingUsage > QUOTA_BYTES) {
    showToast("Depolama kotası aşılıyor.");
    event.target.value = "";
    return;
  }

  const uploaded = await Promise.all(files.map(fileToCloudItem));
  state.files.unshift(...uploaded);
  saveState();
  event.target.value = "";
  render();
  showToast(`${uploaded.length} dosya yüklendi.`);
}

function fileToCloudItem(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        folder: inferFolder(file),
        shared: false,
        createdAt: Date.now(),
        dataUrl: reader.result,
      });
    };
    reader.readAsDataURL(file);
  });
}

function handleFolderCreate(event) {
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
  saveState();
  addFolderNavItem({ id, name });
  render();
  showToast("Klasör oluşturuldu.");
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
  const sharedClass = file.shared ? "shared" : "";

  return `
    <article class="file-card">
      <div class="file-symbol ${sharedClass}" aria-hidden="true">${extension}</div>
      <div class="file-meta">
        <strong title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</strong>
        <span>${formatSize(file.size)} · ${formatDate(file.createdAt)}</span>
      </div>
      <div class="file-actions">
        <button type="button" data-action="share" data-id="${file.id}" title="Paylaş" aria-label="Paylaş">↗</button>
        <button type="button" data-action="download" data-id="${file.id}" title="İndir" aria-label="İndir">↓</button>
        <button type="button" data-action="delete" data-id="${file.id}" title="Sil" aria-label="Sil">×</button>
      </div>
    </article>
  `;
}

function shareFile(file) {
  file.shared = true;
  const shareUrl = `${location.origin}${location.pathname}#share-${file.id}`;
  navigator.clipboard?.writeText(shareUrl);
  saveState();
  render();
  showToast("Paylaşım linki panoya kopyalandı.");
}

function downloadFile(file) {
  if (!file.dataUrl) {
    showToast("Örnek dosyada indirilecek içerik yok.");
    return;
  }

  const link = document.createElement("a");
  link.href = file.dataUrl;
  link.download = file.name;
  link.click();
}

function deleteFile(file) {
  state.files = state.files.filter((item) => item.id !== file.id);
  saveState();
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

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return entities[char];
  });
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("visible"), 2200);
}
