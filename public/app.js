import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STORAGE_KEY = "akillab-materials";

const state = {
  currentOutput: "",
  currentMeta: null,
  currentMaterialId: null,
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
  editOutput: document.querySelector("#editOutputButton"),
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
els.editOutput.addEventListener("click", toggleOutputEditor);
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
      setAuthStatus("Supabase ayarı bekleniyor.");
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
    await loadSharedMaterialFromHash();
    renderAuth();
    renderLibrary();
  } catch {
    setAuthStatus("Supabase bağlantısı kurulamadı.");
    renderAuth();
  }
}

async function handleAuth(event) {
  event.preventDefault();
  if (!state.supabase) {
    showToast("Supabase henüz hazır değil.");
    return;
  }

  const mode = event.submitter?.dataset.authMode || "signin";
  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;
  if (!email || !password) {
    showToast("E-posta ve şifre gerekli.");
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

  const sessionResult = await state.supabase.auth.getSession();
  state.user = result.data.session?.user || sessionResult.data.session?.user || result.data.user || state.user;
  if (state.user) await loadCloudMaterials();
  renderAuth();
  renderLibrary();
  showToast(state.user ? "Giriş yapıldı." : "Kayıt oluşturuldu. E-posta doğrulaması gerekiyorsa gelen kutunu kontrol et.");
}

async function signOut() {
  if (state.supabase) await state.supabase.auth.signOut();
  state.user = null;
  state.materials = loadMaterials();
  renderAuth();
  renderLibrary();
  showToast("Oturum kapatıldı.");
}

function renderAuth() {
  els.authForm.hidden = Boolean(state.user);
  els.accountCard.hidden = !state.user;
  els.accountEmail.textContent = state.user?.email || "";
  if (state.user) {
    setAuthStatus("");
    return;
  }
  setAuthStatus(state.cloudReady ? "Giriş yapınca materyaller hesaba kaydedilir." : "Supabase ayarı bekleniyor.");
}

function setAuthStatus(message) {
  els.authStatus.textContent = message;
}

async function generateMaterial(event) {
  event.preventDefault();
  const payload = readForm();

  if (!payload.topic) {
    showToast("Önce bir konu yaz.");
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
    state.currentMaterialId = null;
    state.currentMeta = {
      ...payload,
      source: data.source || "demo",
      createdAt: new Date().toISOString(),
    };
    state.apiLive = data.source === "openai";
    els.outputTitle.textContent = `${typeLabel(payload.type)}: ${payload.topic}`;
    renderOutput(data.content);
    await checkHealth();
    showToast(data.source === "openai" ? "AI içeriği hazır." : "Demo içerik hazır.");
  } catch (error) {
    const fallback = buildDemoMaterial(payload);
    state.currentOutput = fallback;
    state.currentMaterialId = null;
    state.currentMeta = { ...payload, source: "demo", createdAt: new Date().toISOString() };
    els.outputTitle.textContent = `${typeLabel(payload.type)}: ${payload.topic}`;
    renderOutput(fallback);
    showToast(error.message || "Demo içerik oluşturuldu.");
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
  els.generate.textContent = isLoading ? "Üretiliyor..." : "İçerik üret";
  els.modePill.textContent = isLoading ? "Çalışıyor" : state.apiLive ? "AI aktif" : "Demo mod";
}

function renderOutput(markdown) {
  els.outputBox.innerHTML = `<article class="markdown-output">${markdownToHtml(markdown)}</article>`;
  els.editOutput.textContent = "ED";
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
  syncOutputEditor();
  if (!state.currentOutput || !state.currentMeta) {
    showToast("Kaydedilecek içerik yok.");
    return;
  }

  const item = {
    id: crypto.randomUUID(),
    title: `${typeLabel(state.currentMeta.type)}: ${state.currentMeta.topic}`,
    content: state.currentOutput,
    meta: state.currentMeta,
  };

  if (state.user && state.supabase) {
    const payload = {
        title: item.title,
        content: item.content,
        meta: item.meta,
    };

    const wasUpdate = Boolean(state.currentMaterialId);
    const query = wasUpdate
      ? state.supabase.from("materials").update(payload).eq("id", state.currentMaterialId)
      : state.supabase.from("materials").insert(payload);

    const { data, error } = await query
      .select("id, title, content, meta, created_at, share_id")
      .single();

    if (error) {
      showToast(error.message || "Materyal Supabase'e kaydedilemedi.");
      return;
    }

    const saved = normalizeMaterial(data);
    state.currentMaterialId = saved.id;
    state.materials = [saved, ...state.materials.filter((material) => material.id !== saved.id)];
    renderLibrary();
    showToast(wasUpdate ? "Materyal güncellendi." : "Materyal Supabase'e kaydedildi.");
    return;
  }

  if (state.currentMaterialId) {
    item.id = state.currentMaterialId;
    state.materials = [item, ...state.materials.filter((material) => material.id !== item.id)].slice(0, 80);
  } else {
    state.currentMaterialId = item.id;
    state.materials = [item, ...state.materials].slice(0, 80);
  }
  saveMaterials();
  renderLibrary();
  showToast(state.cloudReady ? "Oturum açılmadığı için materyal bu tarayıcıya kaydedildi." : "Materyal bu tarayıcıya kaydedildi.");
}

function toggleOutputEditor() {
  if (!state.currentOutput) {
    showToast("Düzenlenecek içerik yok.");
    return;
  }

  const editor = document.querySelector("#outputEditor");
  if (editor) {
    state.currentOutput = editor.value;
    renderOutput(state.currentOutput);
    showToast("Düzenleme önizlemeye alındı.");
    return;
  }

  els.outputBox.innerHTML = `<textarea class="output-editor" id="outputEditor" aria-label="İçeriği düzenle">${escapeHtml(state.currentOutput)}</textarea>`;
  els.editOutput.textContent = "OK";
  document.querySelector("#outputEditor").focus();
}

function syncOutputEditor() {
  const editor = document.querySelector("#outputEditor");
  if (editor) {
    state.currentOutput = editor.value;
    renderOutput(state.currentOutput);
  }
}

async function copyOutput() {
  if (!state.currentOutput) {
    showToast("Kopyalanacak içerik yok.");
    return;
  }
  await navigator.clipboard?.writeText(state.currentOutput);
  showToast("İçerik panoya kopyalandı.");
}

function downloadOutput() {
  if (!state.currentOutput || !state.currentMeta) {
    showToast("İndirilecek içerik yok.");
    return;
  }
  downloadText(slugify(state.currentMeta.topic) + ".md", state.currentOutput);
}

function printOutput() {
  if (!state.currentOutput || !state.currentMeta) {
    showToast("Yazdırılacak içerik yok.");
    return;
  }

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    showToast("Tarayıcı yazdırma penceresini engelledi.");
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
  state.currentMaterialId = null;
  els.outputTitle.textContent = "Hazır içerik burada görünür";
  els.outputBox.innerHTML = `
    <div class="empty-state">
      <strong>Bir konu yazıp üretime başla.</strong>
      <span>Ders planı, quiz, özet veya kart seti oluşturabilirsin.</span>
    </div>
  `;
}

function fillExample() {
  els.topic.value = "Yapay zeka okuryazarlığı";
  els.level.value = "Lise";
  els.type.value = "lesson";
  els.duration.value = "40 dakika";
  els.tone.value = "Sade ve anlaşılır";
  els.goal.value = "Öğrenciler AI araçlarını bilinçli kullanmayı, kaynak kontrolünü ve etik riskleri tartışsın.";
  location.hash = "#studio";
  showToast("Örnek konu dolduruldu.");
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
        <strong>Henüz kayıtlı materyal yok.</strong>
        <span>Ürettiğin içerikleri kaydederek burada arşivleyebilirsin.</span>
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
      <span>${escapeHtml(summary || "Kayıtlı materyal")}</span>
      <small>${escapeHtml(item.meta.level)} · ${escapeHtml(date)} · ${escapeHtml(item.meta.source)}</small>
      <div class="card-actions">
        <button class="secondary-button" type="button" data-library-action="open" data-id="${item.id}">Ac</button>
        <button class="secondary-button" type="button" data-library-action="share" data-id="${item.id}">Paylaş</button>
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
    state.currentMaterialId = item.id;
    els.outputTitle.textContent = item.title;
    renderOutput(item.content);
    location.hash = "#studio";
    showToast("Materyal açıldı.");
  }

  if (action.dataset.libraryAction === "share") {
    await shareMaterial(item);
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

async function shareMaterial(item) {
  if (!state.user || !state.supabase) {
    showToast("Paylaşım linki için giriş yapıp materyali Supabase'e kaydetmelisin.");
    return;
  }

  const shareId = item.shareId || crypto.randomUUID();
  const { data, error } = await state.supabase
    .from("materials")
    .update({ share_id: shareId })
    .eq("id", item.id)
    .select("id, title, content, meta, created_at, share_id")
    .single();

  if (error) {
    showToast(error.message || "Paylaşım linki oluşturulamadı.");
    return;
  }

  const updated = normalizeMaterial(data);
  state.materials = state.materials.map((material) => (material.id === updated.id ? updated : material));
  const url = `${location.origin}${location.pathname}#share=${encodeURIComponent(updated.shareId)}`;
  await navigator.clipboard?.writeText(url);
  renderLibrary();
  showToast("Paylaşım linki panoya kopyalandı.");
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
    showToast("Dışa aktarılacak materyal yok.");
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
${payload.level} seviyesi için ${payload.topic} konusunu ölçmek ve eksik kavramları hızlıca görmek.

## Sorular
1. ${payload.topic} konusunun temel amacı nedir?
2. Bu konuyla ilgili günlük hayattan bir örnek ver.
3. Aşağıdaki ifadeyi açıkla: "${payload.topic} sadece bilgi değil, uygulama gerektirir."
4. Bir yanlış anlama yaz ve doğrusunu belirt.
5. Konuyu 3 maddede özetle.

## Cevap anahtari
- Cevaplar kavram doğruluğu, örnek kalitesi ve açık ifade üzerinden değerlendirilir.
- Her soru 20 puandır.
- Kısa geri bildirim: Güçlü kavramları koru, zayıf kalan kavramlar için tekrar etkinliği yap.`;
  }

  if (payload.type === "flashcards") {
    return `# ${title}

## Kart seti
- **Kart 1:** ${payload.topic} nedir? / Temel kavramı tek cümlede açıkla.
- **Kart 2:** En önemli 3 anahtar kelime nedir? / Kavram, örnek, uygulama.
- **Kart 3:** Nerede kullanılır? / Gerçek yaşamdan bir durumla bağla.
- **Kart 4:** Sık hata nedir? / Ezberlemek ama ilişki kurmamak.
- **Kart 5:** Mini görev nedir? / Konuyu 90 saniyelik bir anlatıma dönüştür.

## Tekrar önerisi
İlk tekrar dersten hemen sonra, ikinci tekrar 24 saat sonra, üçüncü tekrar hafta sonunda yapılır.`;
  }

  if (payload.type === "summary") {
    return `# ${title}

## Kısa özet
${payload.topic}, ${payload.level} düzeyinde önce temel kavramlar, sonra örnekler ve en son uygulama üzerinden işlenmelidir.

## Ana fikirler
- Konuyu tek bir büyük soru etrafında toparla.
- Öğrenciden sadece tanım değil, örnek ve karşılaştırma iste.
- ${payload.tone} anlatim kullan.
- ${payload.duration} içinde bir giriş, bir etkinlik ve bir çıkış bileti planla.

## Çıkış bileti
Öğrenciler dersten çıkmadan önce "${payload.topic} konusunda bugün öğrendiğim en net fikir..." cümlesini tamamlar.`;
  }

  if (payload.type === "assignment") {
    return `# ${title}

## Ödev amacı
${payload.level} seviyesi için ${payload.topic} konusunu araştırma, uygulama ve kısa sunumla pekiştirmek.

## Yonetge
1. Konuyu 5 temel kavramla acikla.
2. Gercek hayattan bir ornek bul.
3. Örneği ders kavramlarıyla ilişkilendir.
4. 1 sayfalık kısa rapor veya 5 slaytlık sunum hazırla.

## Teslim kriterleri
- Açık ve düzenli anlatım
- Kaynak belirtme
- Özgün örnek kullanma
- Zamanında teslim

## Ek not
${payload.goal || "Ödev bireysel yapılır; isteyen öğrenciler ek bir soru-cevap bölümü ekleyebilir."}`;
  }

  if (payload.type === "rubric") {
    return `# ${title}

## Değerlendirme rubriği

| Kriter | 4 - Çok iyi | 3 - İyi | 2 - Gelişiyor | 1 - Başlangıç |
| --- | --- | --- | --- | --- |
| Kavram doğruluğu | Tüm kavramlar doğru | Küçük eksikler var | Bazı kavramlar karışık | Temel kavramlar eksik |
| Örnek kullanımı | Özgün ve yerinde | Uygun ama sınırlı | Kısmen bağlantılı | Örnek yok veya ilgisiz |
| Açıklık | Çok net ve düzenli | Anlaşılır | Yer yer belirsiz | Takibi zor |
| Uygulama | Bilgiyi yeni duruma aktarır | Basit uygulama yapar | Yardımla uygular | Uygulama yapamaz |

## Geri bildirim cumlesi
${payload.topic} konusunda en güçlü yanın ..., bir sonraki adımda ... üzerinde çalışmalısın.`;
  }

  return `# ${title}

## Ders hedefi
${payload.level} öğrencileri ${payload.topic} konusunu kavrar, örneklerle açıklar ve kısa bir uygulama üretir.

## Akis
1. **Giriş - 5 dakika:** Merak uyandıran bir soru sor.
2. **Kavram anlatımı - 10 dakika:** Konuyu ${payload.tone.toLocaleLowerCase("tr-TR")} bir dille açıkla.
3. **Etkinlik - 15 dakika:** Öğrenciler ikili gruplarla bir örnek oluşturur.
4. **Değerlendirme - 5 dakika:** 3 soruluk hızlı kontrol yap.
5. **Kapanış - 5 dakika:** Öğrenciler tek cümlelik özet yazar.

## Notlar
${payload.goal || "Bu plan ilk taslaktır; sınıf seviyesine göre örnekler ve süreler kolayca değiştirilebilir."}

## Olcme
- Kavram doğruluğu
- Örnek kalitesi
- Kısa ve net ifade
- Derse katılım`;
}

function typeLabel(type) {
  return {
    lesson: "Ders planı",
    quiz: "Quiz",
    summary: "Konu özeti",
    flashcards: "Kartlar",
    assignment: "Ödev",
    rubric: "Rubrik",
  }[type] || "İçerik";
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
    .select("id, title, content, meta, created_at, share_id")
    .order("created_at", { ascending: false });

  if (error) {
    showToast(error.message || "Supabase materyalleri okunamadi.");
    return;
  }

  state.materials = (data || []).map(normalizeMaterial);
}

async function loadSharedMaterialFromHash() {
  if (!state.supabase || !location.hash.startsWith("#share=")) return;

  const shareId = decodeURIComponent(location.hash.replace("#share=", ""));
  const { data, error } = await state.supabase
    .from("materials")
    .select("id, title, content, meta, created_at, share_id")
    .eq("share_id", shareId)
    .single();

  if (error || !data) {
    showToast("Paylaşım bağlantısı bulunamadı.");
    return;
  }

  const material = normalizeMaterial(data);
  state.currentOutput = material.content;
  state.currentMeta = material.meta;
  state.currentMaterialId = material.id;
  els.outputTitle.textContent = material.title;
  renderOutput(material.content);
  location.hash = "#studio";
  syncView();
  showToast("Paylaşılan materyal açıldı.");
}

function normalizeMaterial(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    shareId: row.share_id || null,
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
  if (lower.includes("invalid login credentials")) return "E-posta veya şifre hatalı.";
  if (lower.includes("email not confirmed")) return "E-posta doğrulaması gerekiyor.";
  if (lower.includes("user already registered")) return "Bu e-posta zaten kayıtlı.";
  if (lower.includes("password")) return "Şifre en az 6 karakter olmalı.";
  return message;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("visible"), 2600);
}
