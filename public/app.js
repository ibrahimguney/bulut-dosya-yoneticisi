import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STORAGE_KEY = "akillab-materials";

const state = {
  currentOutput: "",
  currentMeta: null,
  materials: loadMaterials(),
  apiLive: false,
  supabase: null,
  user: null,
  cloudReady: false,
};

const els = {
  form: document.querySelector("#generatorForm"),
  topic: document.querySelector("#topicInput"),
  level: document.querySelector("#levelSelect"),
  type: document.querySelector("#typeSelect"),
  duration: document.querySelector("#durationSelect"),
  tone: document.querySelector("#toneSelect"),
  goal: document.querySelector("#goalInput"),
  generate: document.querySelector("#generateButton"),
  clear: document.querySelector("#clearButton"),
  seed: document.querySelector("#seedButton"),
  outputTitle: document.querySelector("#outputTitle"),
  outputBox: document.querySelector("#outputBox"),
  copy: document.querySelector("#copyButton"),
  download: document.querySelector("#downloadButton"),
  print: document.querySelector("#printButton"),
  save: document.querySelector("#saveButton"),
  savedCount: document.querySelector("#savedCount"),
  libraryGrid: document.querySelector("#libraryGrid"),
  librarySearch: document.querySelector("#librarySearch"),
  libraryTypeFilter: document.querySelector("#libraryTypeFilter"),
  exportLibrary: document.querySelector("#exportLibraryButton"),
  modePill: document.querySelector("#modePill"),
  statusDot: document.querySelector("#statusDot"),
  statusTitle: document.querySelector("#statusTitle"),
  statusCopy: document.querySelector("#statusCopy"),
  authForm: document.querySelector("#authForm"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  authStatus: document.querySelector("#authStatus"),
  accountCard: document.querySelector("#accountCard"),
  accountEmail: document.querySelector("#accountEmail"),
  signOut: document.querySelector("#signOutButton"),
  toast: document.querySelector("#toast"),
};

document.addEventListener("click", handleNavigation);
els.form.addEventListener("submit", generateMaterial);
els.clear.addEventListener("click", clearStudio);
els.seed.addEventListener("click", fillExample);
els.copy.addEventListener("click", copyOutput);
els.download.addEventListener("click", downloadOutput);
els.print.addEventListener("click", printOutput);
els.save.addEventListener("click", saveOutput);
els.librarySearch.addEventListener("input", renderLibrary);
els.libraryTypeFilter.addEventListener("change", renderLibrary);
els.exportLibrary.addEventListener("click", exportLibrary);
els.authForm.addEventListener("submit", handleAuth);
els.signOut.addEventListener("click", signOut);
window.addEventListener("hashchange", syncView);

init();

async function init() {
  syncView();
  renderLibrary();
  await checkHealth();
  await configureSupabase();
}

async function checkHealth() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();
    state.apiLive = Boolean(data.aiEnabled);
  } catch {
    state.apiLive = false;
  }

  els.statusDot.classList.toggle("live", state.apiLive);
  els.modePill.classList.toggle("live", state.apiLive);
  els.statusTitle.textContent = state.apiLive ? "AI aktif" : "Demo mod";
  els.statusCopy.textContent = state.apiLive
    ? "Render uzerindeki API gercek AI yanitlari uretiyor."
    : "OPENAI_API_KEY eklenince ayni panel gercek AI ile calisir.";
  els.modePill.textContent = state.apiLive ? "AI aktif" : "Demo mod";
}

async function configureSupabase() {
  try {
    const response = await fetch("/api/config");
    const config = await response.json();
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      setAuthStatus("Supabase ayari bekleniyor.");
      return;
    }

    state.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    state.cloudReady = true;

    const { data } = await state.supabase.auth.getSession();
    state.user = data.session?.user || null;
    state.supabase.auth.onAuthStateChange(async (_event, session) => {
      state.user = session?.user || null;
      if (state.user) await loadCloudMaterials();
      if (!state.user) state.materials = loadMaterials();
      renderAuth();
      renderLibrary();
    });

    if (state.user) await loadCloudMaterials();
    renderAuth();
    renderLibrary();
  } catch {
    setAuthStatus("Supabase baglantisi kurulamadi.");
    renderAuth();
  }
}

async function handleAuth(event) {
  event.preventDefault();
  if (!state.supabase) {
    showToast("Supabase henuz hazir degil.");
    return;
  }

  const mode = event.submitter?.dataset.authMode || "signin";
  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;
  if (!email || !password) {
    showToast("E-posta ve sifre gerekli.");
    return;
  }

  setAuthStatus("Islem yapiliyor...");
  const result =
    mode === "signup"
      ? await state.supabase.auth.signUp({ email, password })
      : await state.supabase.auth.signInWithPassword({ email, password });

  if (result.error) {
    setAuthStatus(translateAuthError(result.error.message));
    showToast(translateAuthError(result.error.message));
    return;
  }

  state.user = result.data.user || result.data.session?.user || state.user;
  if (state.user) await loadCloudMaterials();
  renderAuth();
  renderLibrary();
  showToast(mode === "signup" ? "Kayit olusturuldu." : "Giris yapildi.");
}

async function signOut() {
  if (state.supabase) await state.supabase.auth.signOut();
  state.user = null;
  state.materials = loadMaterials();
  renderAuth();
  renderLibrary();
  showToast("Oturum kapatildi.");
}

function renderAuth() {
  els.authForm.hidden = Boolean(state.user);
  els.accountCard.hidden = !state.user;
  els.accountEmail.textContent = state.user?.email || "";
  if (state.user) {
    setAuthStatus("");
    return;
  }
  setAuthStatus(state.cloudReady ? "Giris yapinca materyaller hesaba kaydedilir." : "Supabase ayari bekleniyor.");
}

function setAuthStatus(message) {
  els.authStatus.textContent = message;
}

async function generateMaterial(event) {
  event.preventDefault();
  const payload = readForm();

  if (!payload.topic) {
    showToast("Once bir konu yaz.");
    return;
  }

  setLoading(true);
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Icerik uretilemedi.");

    state.currentOutput = data.content;
    state.currentMeta = {
      ...payload,
      source: data.source || "demo",
      createdAt: new Date().toISOString(),
    };
    state.apiLive = data.source === "openai";
    els.outputTitle.textContent = `${typeLabel(payload.type)}: ${payload.topic}`;
    renderOutput(data.content);
    await checkHealth();
    showToast(data.source === "openai" ? "AI icerigi hazir." : "Demo icerik hazir.");
  } catch (error) {
    const fallback = buildDemoMaterial(payload);
    state.currentOutput = fallback;
    state.currentMeta = { ...payload, source: "demo", createdAt: new Date().toISOString() };
    els.outputTitle.textContent = `${typeLabel(payload.type)}: ${payload.topic}`;
    renderOutput(fallback);
    showToast(error.message || "Demo icerik olusturuldu.");
  } finally {
    setLoading(false);
  }
}

function readForm() {
  return {
    topic: els.topic.value.trim(),
    level: els.level.value,
    type: els.type.value,
    duration: els.duration.value,
    tone: els.tone.value,
    goal: els.goal.value.trim(),
  };
}

function setLoading(isLoading) {
  els.generate.disabled = isLoading;
  els.generate.textContent = isLoading ? "Uretiliyor..." : "Icerik uret";
  els.modePill.textContent = isLoading ? "Calisiyor" : state.apiLive ? "AI aktif" : "Demo mod";
}

function renderOutput(markdown) {
  els.outputBox.innerHTML = `<article class="markdown-output">${markdownToHtml(markdown)}</article>`;
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  let html = "";
  let listType = null;
  let inTable = false;

  const closeList = () => {
    if (!listType) return;
    html += `</${listType}>`;
    listType = null;
  };

  const closeTable = () => {
    if (!inTable) return;
    html += "</tbody></table>";
    inTable = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      closeList();
      closeTable();
      continue;
    }

    const heading = line.match(/^#{1,3}\s+(.+)/);
    if (heading) {
      closeList();
      closeTable();
      html += `<h3>${inlineFormat(heading[1])}</h3>`;
      continue;
    }

    if (line.startsWith("|") && line.endsWith("|")) {
      closeList();
      const cells = line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim());
      const isDivider = cells.every((cell) => /^:?-{3,}:?$/.test(cell));
      if (isDivider) continue;

      if (!inTable) {
        html += "<table><tbody>";
        inTable = true;
      }

      const cellTag = html.endsWith("<tbody>") ? "th" : "td";
      html += `<tr>${cells.map((cell) => `<${cellTag}>${inlineFormat(cell)}</${cellTag}>`).join("")}</tr>`;
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.+)/);
    if (ordered) {
      closeTable();
      if (listType !== "ol") {
        closeList();
        html += "<ol>";
        listType = "ol";
      }
      html += `<li>${inlineFormat(ordered[1])}</li>`;
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.+)/);
    if (bullet) {
      closeTable();
      if (listType !== "ul") {
        closeList();
        html += "<ul>";
        listType = "ul";
      }
      html += `<li>${inlineFormat(bullet[1])}</li>`;
      continue;
    }

    closeList();
    closeTable();
    html += `<p>${inlineFormat(line)}</p>`;
  }

  closeList();
  closeTable();
  return html;
}

function inlineFormat(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

async function saveOutput() {
  if (!state.currentOutput || !state.currentMeta) {
    showToast("Kaydedilecek icerik yok.");
    return;
  }

  const item = {
    id: crypto.randomUUID(),
    title: `${typeLabel(state.currentMeta.type)}: ${state.currentMeta.topic}`,
    content: state.currentOutput,
    meta: state.currentMeta,
  };

  if (state.user && state.supabase) {
    const { data, error } = await state.supabase
      .from("materials")
      .insert({
        user_id: state.user.id,
        title: item.title,
        content: item.content,
        meta: item.meta,
      })
      .select("id, title, content, meta, created_at")
      .single();

    if (error) {
      showToast(error.message || "Materyal Supabase'e kaydedilemedi.");
      return;
    }

    state.materials = [normalizeMaterial(data), ...state.materials];
    renderLibrary();
    showToast("Materyal Supabase'e kaydedildi.");
    return;
  }

  state.materials = [item, ...state.materials].slice(0, 80);
  saveMaterials();
  renderLibrary();
  showToast("Materyal bu tarayiciya kaydedildi.");
}

async function copyOutput() {
  if (!state.currentOutput) {
    showToast("Kopyalanacak icerik yok.");
    return;
  }
  await navigator.clipboard?.writeText(state.currentOutput);
  showToast("Icerik panoya kopyalandi.");
}

function downloadOutput() {
  if (!state.currentOutput || !state.currentMeta) {
    showToast("Indirilecek icerik yok.");
    return;
  }
  downloadText(slugify(state.currentMeta.topic) + ".md", state.currentOutput);
}

function printOutput() {
  if (!state.currentOutput || !state.currentMeta) {
    showToast("Yazdirilacak icerik yok.");
    return;
  }

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    showToast("Tarayici yazdirma penceresini engelledi.");
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(state.currentMeta.topic)}</title>
        <style>
          body { color: #17202a; font-family: Arial, sans-serif; line-height: 1.55; margin: 32px; }
          h1, h2, h3 { margin-bottom: 8px; }
          li { margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d8e0e7; padding: 8px; text-align: left; vertical-align: top; }
        </style>
      </head>
      <body>${markdownToHtml(state.currentOutput)}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function clearStudio() {
  els.form.reset();
  state.currentOutput = "";
  state.currentMeta = null;
  els.outputTitle.textContent = "Hazir icerik burada gorunur";
  els.outputBox.innerHTML = `
    <div class="empty-state">
      <strong>Bir konu yazip uretime basla.</strong>
      <span>Ders plani, quiz, ozet veya kart seti olusturabilirsin.</span>
    </div>
  `;
}

function fillExample() {
  els.topic.value = "Yapay zeka okuryazarligi";
  els.level.value = "Lise";
  els.type.value = "lesson";
  els.duration.value = "40 dakika";
  els.tone.value = "Sade ve anlasilir";
  els.goal.value = "Ogrenciler AI araclarini bilincli kullanmayi, kaynak kontrolunu ve etik riskleri tartissin.";
  location.hash = "#studio";
  showToast("Ornek konu dolduruldu.");
}

function renderLibrary() {
  els.savedCount.textContent = state.materials.length;
  const query = els.librarySearch.value.trim().toLocaleLowerCase("tr-TR");
  const selectedType = els.libraryTypeFilter.value;
  const visible = state.materials.filter((item) => {
    const haystack = `${item.title} ${item.content}`.toLocaleLowerCase("tr-TR");
    const matchesType = selectedType === "all" || item.meta.type === selectedType;
    return matchesType && haystack.includes(query);
  });

  if (!visible.length) {
    els.libraryGrid.innerHTML = `
      <div class="empty-state">
        <strong>Henuz kayitli materyal yok.</strong>
        <span>Urettigin icerikleri kaydederek burada arsivleyebilirsin.</span>
      </div>
    `;
    return;
  }

  els.libraryGrid.innerHTML = visible.map(libraryCardTemplate).join("");
}

function libraryCardTemplate(item) {
  const summary = item.content.replace(/[#*`>-]/g, " ").replace(/\s+/g, " ").trim();
  const date = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    .format(new Date(item.meta.createdAt));

  return `
    <article class="library-card">
      <strong title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(summary || "Kayitli materyal")}</span>
      <small>${escapeHtml(item.meta.level)} · ${escapeHtml(date)} · ${escapeHtml(item.meta.source)}</small>
      <div class="card-actions">
        <button class="secondary-button" type="button" data-library-action="open" data-id="${item.id}">Ac</button>
        <button class="secondary-button" type="button" data-library-action="delete" data-id="${item.id}">Sil</button>
      </div>
    </article>
  `;
}

async function handleNavigation(event) {
  const link = event.target.closest("[data-view-link]");
  if (link) {
    document.querySelectorAll("[data-view-link]").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
    return;
  }

  const action = event.target.closest("[data-library-action]");
  if (!action) return;

  const item = state.materials.find((material) => material.id === action.dataset.id);
  if (!item) return;

  if (action.dataset.libraryAction === "open") {
    state.currentOutput = item.content;
    state.currentMeta = item.meta;
    els.outputTitle.textContent = item.title;
    renderOutput(item.content);
    location.hash = "#studio";
    showToast("Materyal acildi.");
  }

  if (action.dataset.libraryAction === "delete") {
    if (state.user && state.supabase) {
      const { error } = await state.supabase.from("materials").delete().eq("id", item.id);
      if (error) {
        showToast(error.message || "Materyal silinemedi.");
        return;
      }
    }

    state.materials = state.materials.filter((material) => material.id !== item.id);
    if (!state.user) saveMaterials();
    renderLibrary();
    showToast("Materyal silindi.");
  }
}

function syncView() {
  const view = (location.hash || "#studio").replace("#", "");
  document.querySelectorAll(".view-panel").forEach((panel) => panel.classList.remove("active"));
  document.querySelector(`#${view}View`)?.classList.add("active");
  document.querySelectorAll("[data-view-link]").forEach((link) => {
    link.classList.toggle("active", link.dataset.viewLink === view);
  });
}

function exportLibrary() {
  if (!state.materials.length) {
    showToast("Disa aktarilacak materyal yok.");
    return;
  }
  const content = state.materials
    .map((item) => `# ${item.title}\n\n${item.content}`)
    .join("\n\n---\n\n");
  downloadText("akillab-kutuphane.md", content);
}

function buildDemoMaterial(payload) {
  const title = `${typeLabel(payload.type)}: ${payload.topic}`;
  if (payload.type === "quiz") {
    return `# ${title}

## Hedef
${payload.level} seviyesi icin ${payload.topic} konusunu olcmek ve eksik kavramlari hizlica gormek.

## Sorular
1. ${payload.topic} konusunun temel amaci nedir?
2. Bu konuyla ilgili gunluk hayattan bir ornek ver.
3. Asagidaki ifadeyi acikla: "${payload.topic} sadece bilgi degil, uygulama gerektirir."
4. Bir yanlis anlama yaz ve dogrusunu belirt.
5. Konuyu 3 maddede ozetle.

## Cevap anahtari
- Cevaplar kavram dogrulugu, ornek kalitesi ve acik ifade uzerinden degerlendirilir.
- Her soru 20 puandir.
- Kisa geri bildirim: Guclu kavramlari koru, zayif kalan kavramlar icin tekrar etkinligi yap.`;
  }

  if (payload.type === "flashcards") {
    return `# ${title}

## Kart seti
- **Kart 1:** ${payload.topic} nedir? / Temel kavrami tek cumlede acikla.
- **Kart 2:** En onemli 3 anahtar kelime nedir? / Kavram, ornek, uygulama.
- **Kart 3:** Nerede kullanilir? / Gercek yasamdan bir durumla bagla.
- **Kart 4:** Sik hata nedir? / Ezberlemek ama iliski kurmamak.
- **Kart 5:** Mini gorev nedir? / Konuyu 90 saniyelik bir anlatima donustur.

## Tekrar onerisi
Ilk tekrar dersten hemen sonra, ikinci tekrar 24 saat sonra, ucuncu tekrar hafta sonunda yapilir.`;
  }

  if (payload.type === "summary") {
    return `# ${title}

## Kisa ozet
${payload.topic}, ${payload.level} duzeyinde once temel kavramlar, sonra ornekler ve en son uygulama uzerinden islenmelidir.

## Ana fikirler
- Konuyu tek bir buyuk soru etrafinda toparla.
- Ogrenciden sadece tanim degil, ornek ve karsilastirma iste.
- ${payload.tone} anlatim kullan.
- ${payload.duration} icinde bir giris, bir etkinlik ve bir cikis bileti planla.

## Cikis bileti
Ogrenciler dersten cikmadan once "${payload.topic} konusunda bugun ogrendigim en net fikir..." cumlesini tamamlar.`;
  }

  if (payload.type === "assignment") {
    return `# ${title}

## Odev amaci
${payload.level} seviyesi icin ${payload.topic} konusunu arastirma, uygulama ve kisa sunumla pekistirmek.

## Yonetge
1. Konuyu 5 temel kavramla acikla.
2. Gercek hayattan bir ornek bul.
3. Ornegi ders kavramlariyla iliskilendir.
4. 1 sayfalik kisa rapor veya 5 slaytlik sunum hazirla.

## Teslim kriterleri
- Acik ve duzenli anlatim
- Kaynak belirtme
- Ozgun ornek kullanma
- Zamaninda teslim

## Ek not
${payload.goal || "Odev bireysel yapilir; isteyen ogrenciler ek bir soru-cevap bolumu ekleyebilir."}`;
  }

  if (payload.type === "rubric") {
    return `# ${title}

## Degerlendirme rubrigi

| Kriter | 4 - Cok iyi | 3 - Iyi | 2 - Gelisiyor | 1 - Baslangic |
| --- | --- | --- | --- | --- |
| Kavram dogrulugu | Tum kavramlar dogru | Kucuk eksikler var | Bazi kavramlar karisik | Temel kavramlar eksik |
| Ornek kullanimi | Ozgun ve yerinde | Uygun ama sinirli | Kismen baglantili | Ornek yok veya ilgisiz |
| Aciklik | Cok net ve duzenli | Anlasilir | Yer yer belirsiz | Takibi zor |
| Uygulama | Bilgiyi yeni duruma aktarir | Basit uygulama yapar | Yardimla uygular | Uygulama yapamaz |

## Geri bildirim cumlesi
${payload.topic} konusunda en guclu yanin ..., bir sonraki adimda ... uzerinde calismalisin.`;
  }

  return `# ${title}

## Ders hedefi
${payload.level} ogrencileri ${payload.topic} konusunu kavrar, orneklerle aciklar ve kisa bir uygulama uretir.

## Akis
1. **Giris - 5 dakika:** Merak uyandiran bir soru sor.
2. **Kavram anlatimi - 10 dakika:** Konuyu ${payload.tone.toLocaleLowerCase("tr-TR")} bir dille acikla.
3. **Etkinlik - 15 dakika:** Ogrenciler ikili gruplarla bir ornek olusturur.
4. **Degerlendirme - 5 dakika:** 3 soruluk hizli kontrol yap.
5. **Kapanis - 5 dakika:** Ogrenciler tek cumlelik ozet yazar.

## Notlar
${payload.goal || "Bu plan ilk taslaktir; sinif seviyesine gore ornekler ve sureler kolayca degistirilebilir."}

## Olcme
- Kavram dogrulugu
- Ornek kalitesi
- Kisa ve net ifade
- Derse katilim`;
}

function typeLabel(type) {
  return {
    lesson: "Ders plani",
    quiz: "Quiz",
    summary: "Konu ozeti",
    flashcards: "Kartlar",
    assignment: "Odev",
    rubric: "Rubrik",
  }[type] || "Icerik";
}

function loadMaterials() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

async function loadCloudMaterials() {
  if (!state.user || !state.supabase) return;

  const { data, error } = await state.supabase
    .from("materials")
    .select("id, title, content, meta, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    showToast(error.message || "Supabase materyalleri okunamadi.");
    return;
  }

  state.materials = (data || []).map(normalizeMaterial);
}

function normalizeMaterial(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    meta: {
      ...(row.meta || {}),
      createdAt: row.meta?.createdAt || row.created_at || new Date().toISOString(),
    },
  };
}

function saveMaterials() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.materials));
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function slugify(value) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "akillab-icerik";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return entities[char];
  });
}

function translateAuthError(message) {
  const lower = message.toLocaleLowerCase("tr-TR");
  if (lower.includes("invalid login credentials")) return "E-posta veya sifre hatali.";
  if (lower.includes("email not confirmed")) return "E-posta dogrulamasi gerekiyor.";
  if (lower.includes("user already registered")) return "Bu e-posta zaten kayitli.";
  if (lower.includes("password")) return "Sifre en az 6 karakter olmali.";
  return message;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("visible"), 2600);
}
