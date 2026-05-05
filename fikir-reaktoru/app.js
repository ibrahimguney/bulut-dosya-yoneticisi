const templates = {
  dashboard: {
    names: ["Pusula", "Radar", "Atölye", "Panel"],
    features: [
      ["Durum özeti", "Kullanıcının bugünkü hedefini, ilerlemesini ve sıradaki adımını tek bakışta gösterir."],
      ["Akıllı filtreler", "İçeriği konu, öncelik ve zorluğa göre ayırarak karar vermeyi kolaylaştırır."],
      ["Haftalık rapor", "Küçük kazanımları ve aksayan noktaları okunabilir bir rapora dönüştürür."],
    ],
  },
  game: {
    names: ["Meydan", "Seviye", "Gorev", "Arena"],
    features: [
      ["Görev kartları", "Kullanıcıya her gün tamamlanabilir küçük ve net görevler verir."],
      ["Puan sistemi", "Ilerlemeyi puan, rozet ve seviye ile gorunur hale getirir."],
      ["Mini meydan okuma", "Kullanıcıya 5 dakikalık hızlı karar veya pratik görevi sunar."],
    ],
  },
  journal: {
    names: ["Defter", "İz", "Günlük", "Rota"],
    features: [
      ["Günlük kayıt", "Kullanıcı ne yaptığını, ne hissettiğini ve sonraki adımını yazar."],
      ["Duygu etiketi", "Kayıtları enerji, motivasyon ve zorluk seviyesine göre işaretler."],
      ["Geriye bakış", "Haftalık kayıtlardan tekrar eden kalıpları ve iyi giden şeyleri çıkarır."],
    ],
  },
};

const levelPlans = {
  starter: [
    ["1", "Tek ekran kur", "HTML ile başlık, form ve sonuç bölümlerini yerleştir."],
    ["2", "Temel stil ver", "Renkleri, boşlukları ve mobil görünümü okunur hale getir."],
    ["3", "Formu çalıştır", "JavaScript ile input değerlerini okuyup ekrana yaz."],
    ["4", "Küçük iyileştirme", "Boş konu kontrolü ve daha iyi varsayılan metin ekle."],
  ],
  middle: [
    ["1", "Veri modelini yaz", "Proje türleri, özellikler ve plan adımlarını nesnelerle temsil et."],
    ["2", "Arayüzü bağla", "Form seçimlerini al, uygun şablonu seç ve sonucu render et."],
    ["3", "Skor hesapla", "Konu netliği, zorluk ve tarzdan basit bir hazırlık skoru üret."],
    ["4", "Test et ve düzelt", "Farklı seçimlerle metinlerin tasarıma sığdığını kontrol et."],
  ],
  advanced: [
    ["1", "Durum yönetimi kur", "Seçimleri tek state nesnesinde tut ve render fonksiyonlarını ayır."],
    ["2", "Kaydetme ekle", "Üretilen fikirleri localStorage ile kullanıcının tarayıcısında sakla."],
    ["3", "Paylaşım metni üret", "Projeyi README taslağı veya sprint notu olarak kopyalanabilir hale getir."],
    ["4", "Kalite turu yap", "Erişilebilirlik, mobil görünüm ve boş durumları tek tek denetle."],
  ],
};

const quizQuestions = [
  {
    question: "State ne işe yarar?",
    options: ["Uygulamanın mevcut durumunu tutar", "Sadece renkleri değiştirir", "HTML dosyasını siler"],
    answer: 0,
    note: "Doğru. State, uygulamanın o anki verisini ve seçimlerini temsil eder.",
  },
  {
    question: "localStorage hangi amaçla kullanıldı?",
    options: ["Kayıtlı fikirleri tarayıcıda saklamak", "CSS grid oluşturmak", "Başlığı büyütmek"],
    answer: 0,
    note: "Evet. localStorage küçük verileri tarayıcıda kalıcı tutmak için kullanıldı.",
  },
  {
    question: "URLSearchParams bize ne sağladı?",
    options: ["State'i paylaşılabilir linke taşımayı", "Dosya indirmeyi", "Checkbox çizmeyi"],
    answer: 0,
    note: "Aynen. Query parametreleriyle aynı form durumu link üzerinden geri yüklenebilir.",
  },
  {
    question: "Event delegation neden kullanışlıdır?",
    options: ["Dinamik kartlarda tek listener ile işlem yapar", "Font ailesini değiştirir", "JSON dosyasını küçültür"],
    answer: 0,
    note: "Doğru. Listeye sonradan eklenen kartlar da aynı listener ile çalışır.",
  },
];

const inspirationTopics = [
  "öğrenciler için odaklanma",
  "freelancerlar için gelir takibi",
  "öğretmenler için quiz planlama",
  "küçük işletmeler için stok uyarısı",
  "yazılım öğrenenler için hata günlüğü",
  "takımlar için toplantı kararları",
  "spor yapanlar için alışkanlık takibi",
  "okurlar için kitap notları",
  "aileler için haftalık yemek planı",
  "tasarımcılar için müşteri brief arşivi",
];

const commands = [
  {
    id: "save",
    title: "Fikri kaydet",
    description: "Mevcut proje fikrini kayıtlı fikirler listesine ekler.",
    run: () => saveCurrentIdea(),
  },
  {
    id: "inspire",
    title: "Rastgele ilham konusu",
    description: "Konu alanını yeni bir örnekle doldurur ve fikir üretir.",
    run: () => inspireTopic(),
  },
  {
    id: "compare",
    title: "3 alternatif üret",
    description: "Aynı girdiden üç farklı proje yaklaşımı oluşturur.",
    run: () => generateAlternatives(),
  },
  {
    id: "preview",
    title: "README önizle",
    description: "Mevcut proje için README taslağını panelde açar.",
    run: () => previewReadmeDraft(),
  },
  {
    id: "share",
    title: "Paylaşım linki oluştur",
    description: "Mevcut form state'ini URL'ye yazar ve linki kopyalar.",
    run: () => copyShareLink(),
  },
  {
    id: "theme",
    title: "Temayı değiştir",
    description: "Açık ve koyu tema arasında geçiş yapar.",
    run: () => toggleTheme(),
  },
  {
    id: "learn",
    title: "Öğrenme modunu değiştir",
    description: "Bölüm açıklamalarını açar veya kapatır.",
    run: () => toggleLearnMode(),
  },
];


const els = {
  learnModeButton: document.querySelector("#learnModeButton"),
  themeButton: document.querySelector("#themeButton"),
  form: document.querySelector("#ideaForm"),
  topic: document.querySelector("#topicInput"),
  topicError: document.querySelector("#topicError"),
  inspireButton: document.querySelector("#inspireButton"),
  audience: document.querySelector("#audienceSelect"),
  level: document.querySelector("#levelSelect"),
  title: document.querySelector("#projectTitle"),
  pitch: document.querySelector("#projectPitch"),
  tagRow: document.querySelector("#tagRow"),
  featureList: document.querySelector("#featureList"),
  planGrid: document.querySelector("#planGrid"),
  taskList: document.querySelector("#taskList"),
  taskProgressLabel: document.querySelector("#taskProgressLabel"),
  taskProgressBar: document.querySelector("#taskProgressBar"),
  statsGrid: document.querySelector("#statsGrid"),
  quizQuestion: document.querySelector("#quizQuestion"),
  quizOptions: document.querySelector("#quizOptions"),
  quizFeedback: document.querySelector("#quizFeedback"),
  readinessScore: document.querySelector("#readinessScore"),
  readinessText: document.querySelector("#readinessText"),
  saveIdeaButton: document.querySelector("#saveIdeaButton"),
  copyReadmeButton: document.querySelector("#copyReadmeButton"),
  previewReadmeButton: document.querySelector("#previewReadmeButton"),
  compareButton: document.querySelector("#compareButton"),
  shareLinkButton: document.querySelector("#shareLinkButton"),
  actionStatus: document.querySelector("#actionStatus"),
  compareGrid: document.querySelector("#compareGrid"),
  savedGrid: document.querySelector("#savedGrid"),
  savedSearchInput: document.querySelector("#savedSearchInput"),
  favoriteOnlyInput: document.querySelector("#favoriteOnlyInput"),
  exportIdeasButton: document.querySelector("#exportIdeasButton"),
  undoDeleteButton: document.querySelector("#undoDeleteButton"),
  importIdeasInput: document.querySelector("#importIdeasInput"),
  readmePreview: document.querySelector("#readmePreview"),
  readmePreviewText: document.querySelector("#readmePreviewText"),
  closePreviewButton: document.querySelector("#closePreviewButton"),
  toastStack: document.querySelector("#toastStack"),
  commandPanel: document.querySelector("#commandPanel"),
  commandSearchInput: document.querySelector("#commandSearchInput"),
  commandList: document.querySelector("#commandList"),
  closeCommandButton: document.querySelector("#closeCommandButton"),
};

let currentProject = null;
let savedIdeas = loadSavedIdeas();
let alternatives = [];
let sprintTasks = [];
let hasRenderedProject = false;
let quizIndex = 0;
let lastDeletedIdea = null;

els.themeButton.addEventListener("click", toggleTheme);
els.learnModeButton.addEventListener("click", toggleLearnMode);
els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderProject();
});
els.topic.addEventListener("input", clearTopicError);
els.inspireButton.addEventListener("click", inspireTopic);

els.saveIdeaButton.addEventListener("click", saveCurrentIdea);
els.copyReadmeButton.addEventListener("click", copyReadmeDraft);
els.previewReadmeButton.addEventListener("click", previewReadmeDraft);
els.compareButton.addEventListener("click", generateAlternatives);
els.shareLinkButton.addEventListener("click", copyShareLink);
els.compareGrid.addEventListener("click", handleAlternativeAction);
els.taskList.addEventListener("change", handleTaskToggle);
els.quizOptions.addEventListener("click", handleQuizAnswer);
els.savedGrid.addEventListener("click", handleSavedAction);
els.savedSearchInput.addEventListener("input", renderSavedIdeas);
els.favoriteOnlyInput.addEventListener("change", renderSavedIdeas);
els.exportIdeasButton.addEventListener("click", exportSavedIdeas);
els.undoDeleteButton.addEventListener("click", undoLastDelete);
els.importIdeasInput.addEventListener("change", importSavedIdeas);
els.closePreviewButton.addEventListener("click", closeReadmePreview);
els.closeCommandButton.addEventListener("click", closeCommandPanel);
els.commandPanel.addEventListener("click", (event) => {
  if (event.target === els.commandPanel) closeCommandPanel();
});
els.commandSearchInput.addEventListener("input", renderCommands);
els.commandList.addEventListener("click", handleCommandClick);
els.readmePreview.addEventListener("click", (event) => {
  if (event.target === els.readmePreview) closeReadmePreview();
});
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase("tr-TR") === "k") {
    event.preventDefault();
    openCommandPanel();
  }
  if (event.key === "Escape" && !els.readmePreview.hidden) closeReadmePreview();
  if (event.key === "Escape" && !els.commandPanel.hidden) closeCommandPanel();
});

applySavedTheme();
applyStateFromUrl();
renderProject();
renderSavedIdeas();
updateUndoButton();
renderQuiz();
renderCommands();
renderStats();

function renderProject() {
  if (!validateForm()) return;

  const state = readState();
  const idea = buildIdea(state);
  const score = calculateReadiness(state);
  currentProject = { ...idea, state, score, plan: levelPlans[state.level] };
  resetSprintTasks();
  renderCurrentProject();
  setStatus("Yeni fikir üretildi. İstersen kaydet veya README taslağını kopyala.", hasRenderedProject);
  hasRenderedProject = true;
}

function validateForm() {
  const topic = els.topic.value.trim();
  if (topic.length < 4) {
    showTopicError("Konu en az 4 karakter olmalı. Örneğin: öğrenci odak takibi.");
    setStatus("Fikir üretmek için konuyu biraz daha net yaz.", true);
    return false;
  }

  clearTopicError();
  return true;
}

function showTopicError(message) {
  els.topic.classList.add("is-invalid");
  els.topic.setAttribute("aria-invalid", "true");
  els.topicError.textContent = message;
}

function clearTopicError() {
  els.topic.classList.remove("is-invalid");
  els.topic.removeAttribute("aria-invalid");
  els.topicError.textContent = "";
}

function renderCurrentProject() {
  els.title.textContent = currentProject.name;
  els.pitch.textContent = currentProject.pitch;
  els.readinessScore.textContent = currentProject.score;
  els.readinessText.textContent = readinessMessage(currentProject.score);
  els.tagRow.innerHTML = currentProject.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  els.featureList.innerHTML = currentProject.features.map(featureTemplate).join("");
  els.planGrid.innerHTML = currentProject.plan.map(planTemplate).join("");
  renderSprintTasks();
  renderStats();
}

function readState() {
  const style = new FormData(els.form).get("style") || "dashboard";
  return {
    topic: els.topic.value.trim() || "günlük hayat problemi",
    audience: els.audience.value,
    level: els.level.value,
    style,
  };
}

function inspireTopic() {
  const currentTopic = els.topic.value.trim();
  const pool = inspirationTopics.filter((topic) => topic !== currentTopic);
  els.topic.value = pick(pool.length ? pool : inspirationTopics, Date.now());
  clearTopicError();
  renderProject();
  setStatus("Rastgele ilham konusu seçildi ve yeni fikir üretildi.");
}

function applyStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (!params.size) return;

  const topic = params.get("topic");
  const audience = params.get("audience");
  const level = params.get("level");
  const style = params.get("style");

  if (topic) els.topic.value = topic.slice(0, 80);
  if (audience && optionExists(els.audience, audience)) els.audience.value = audience;
  if (level && optionExists(els.level, level)) els.level.value = level;
  if (style) {
    const styleInput = els.form.querySelector(`input[name="style"][value="${escapeCssValue(style)}"]`);
    if (styleInput) styleInput.checked = true;
  }
}

function buildIdea(state) {
  const template = templates[state.style];
  const topicCore = titleCase(state.topic.split(/\s+/).slice(0, 2).join(" "));
  const suffix = pick(template.names, state.topic.length + state.audience.length);
  const name = `${topicCore} ${suffix}`;
  const styleLabel = {
    dashboard: "kontrol paneli",
    game: "oyunlaştırılmış deneyim",
    journal: "günlük ve takip aracı",
  }[state.style];

  return {
    name,
    pitch: `${name}, ${state.audience.toLocaleLowerCase("tr-TR")} için tasarlanan bir ${styleLabel}. Amacı "${state.topic}" konusunu somut adımlara bölmek ve kullanıcının ilk ilerlemeyi aynı gün görmesini sağlamak.`,
    tags: [state.audience, levelLabel(state.level), styleLabel, "HTML", "CSS", "JavaScript"],
    features: template.features,
  };
}

function generateAlternatives() {
  const baseState = readState();
  alternatives = ["dashboard", "game", "journal"].map((style, index) => {
    const state = { ...baseState, style };
    const idea = buildIdea(state);
    const score = Math.max(58, Math.min(99, calculateReadiness(state) - index * 3 + style.length));
    return { ...idea, state, score, plan: levelPlans[state.level] };
  });

  renderAlternatives();
  renderStats();
  document.querySelector("#compare").scrollIntoView({ behavior: "smooth" });
  setStatus("Üç alternatif üretildi. En uygun olanı seçebilirsin.");
}

function renderAlternatives() {
  els.compareGrid.innerHTML = alternatives
    .map(
      (idea, index) => `
        <article class="compare-card">
          <small>${escapeHtml(idea.tags[2])}</small>
          <h3>${escapeHtml(idea.name)}</h3>
          <p>${escapeHtml(idea.pitch)}</p>
          <div class="score-line">
            <span>Hazırlık skoru: ${escapeHtml(idea.score)}</span>
            <b class="score-track" aria-hidden="true"><i style="--score-width: ${idea.score}%"></i></b>
          </div>
          <button type="button" data-alternative="${index}">Bu fikri seç</button>
        </article>
      `,
    )
    .join("");
}

function handleAlternativeAction(event) {
  const button = event.target.closest("button[data-alternative]");
  if (!button) return;

  const idea = alternatives[Number(button.dataset.alternative)];
  if (!idea) return;

  currentProject = idea;
  els.topic.value = idea.state.topic;
  els.audience.value = idea.state.audience;
  els.level.value = idea.state.level;
  const styleInput = els.form.querySelector(`input[name="style"][value="${escapeCssValue(idea.state.style)}"]`);
  if (styleInput) styleInput.checked = true;
  resetSprintTasks();
  renderCurrentProject();
  document.querySelector("#reactor").scrollIntoView({ behavior: "smooth" });
  setStatus(`${idea.name} ana fikir olarak seçildi.`);
}

function resetSprintTasks() {
  sprintTasks = currentProject.plan.map(([step, title, text]) => ({
    id: `task-${step}`,
    title,
    text,
    done: false,
  }));
}

function renderSprintTasks() {
  els.taskList.innerHTML = sprintTasks
    .map(
      (task) => `
        <label class="task-item ${task.done ? "is-done" : ""}">
          <input type="checkbox" data-task-id="${escapeHtml(task.id)}" ${task.done ? "checked" : ""} />
          <span>
            <strong>${escapeHtml(task.title)}</strong>
            <p>${escapeHtml(task.text)}</p>
          </span>
        </label>
      `,
    )
    .join("");
  renderTaskProgress();
}

function handleTaskToggle(event) {
  const checkbox = event.target.closest("input[data-task-id]");
  if (!checkbox) return;

  sprintTasks = sprintTasks.map((task) =>
    task.id === checkbox.dataset.taskId ? { ...task, done: checkbox.checked } : task,
  );
  renderSprintTasks();
}

function renderTaskProgress() {
  const doneCount = sprintTasks.filter((task) => task.done).length;
  const percent = sprintTasks.length ? Math.round((doneCount / sprintTasks.length) * 100) : 0;
  els.taskProgressLabel.textContent = `${percent}% tamamlandı (${doneCount}/${sprintTasks.length})`;
  els.taskProgressBar.style.setProperty("--score-width", `${percent}%`);
  renderStats();
}

function renderStats() {
  if (!currentProject || !els.statsGrid) return;

  const doneCount = sprintTasks.filter((task) => task.done).length;
  const taskPercent = sprintTasks.length ? Math.round((doneCount / sprintTasks.length) * 100) : 0;
  const favoriteCount = savedIdeas.filter((idea) => idea.favorite).length;
  const visibleCount = getVisibleSavedIdeas().length;
  const stats = [
    ["Hazırlık", currentProject.score, "Seçilen fikrin başlangıç olgunluğu."],
    ["Görev ilerleme", `${taskPercent}%`, `${doneCount}/${sprintTasks.length} MVP görevi tamamlandı.`],
    ["Kayıtlı fikir", savedIdeas.length, `${favoriteCount} favori, ${visibleCount} görünür kayıt.`],
    ["Alternatif", alternatives.length, "Son üretilen karşılaştırma kartı sayısı."],
  ];

  els.statsGrid.innerHTML = stats
    .map(
      ([label, value, text]) => `
        <article class="stat-card">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
          <p>${escapeHtml(text)}</p>
        </article>
      `,
    )
    .join("");
}

function renderQuiz() {
  const quiz = quizQuestions[quizIndex];
  els.quizQuestion.textContent = quiz.question;
  els.quizFeedback.textContent = "Bir cevap seç.";
  els.quizOptions.innerHTML = quiz.options
    .map((option, index) => `<button type="button" data-answer="${index}">${escapeHtml(option)}</button>`)
    .join("");
}

function handleQuizAnswer(event) {
  const button = event.target.closest("button[data-answer]");
  if (!button) return;

  const quiz = quizQuestions[quizIndex];
  const selected = Number(button.dataset.answer);
  const buttons = Array.from(els.quizOptions.querySelectorAll("button"));

  buttons.forEach((item, index) => {
    item.disabled = true;
    if (index === quiz.answer) item.classList.add("is-correct");
    if (index === selected && selected !== quiz.answer) item.classList.add("is-wrong");
  });

  els.quizFeedback.textContent = selected === quiz.answer ? quiz.note : `Yaklaştı ama değil. ${quiz.note}`;

  window.setTimeout(() => {
    quizIndex = (quizIndex + 1) % quizQuestions.length;
    renderQuiz();
  }, 2400);
}

function calculateReadiness(state) {
  let score = 48;
  score += Math.min(22, state.topic.length);
  score += state.audience.length > 8 ? 10 : 6;
  score += state.level === "starter" ? 14 : state.level === "middle" ? 10 : 7;
  score += state.style === "dashboard" ? 8 : 10;
  return Math.min(98, score);
}

function readinessMessage(score) {
  if (score >= 85) return "Fikir net. Artık ekranı kurup ilk prototipi yapabilirsin.";
  if (score >= 70) return "Başlamak için yeterli. Bir özelliği daha netleştirmek iyi olur.";
  return "Konu biraz geniş. Kullanıcı ve ilk problemi daha somutlaştır.";
}

function featureTemplate([title, text], index) {
  return `
    <article class="feature-item">
      <span>${index + 1}</span>
      <div>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(text)}</p>
      </div>
    </article>
  `;
}

function planTemplate([step, title, text]) {
  return `
    <article class="plan-card">
      <small>Adim ${step}</small>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(text)}</p>
    </article>
  `;
}

function saveCurrentIdea() {
  if (!currentProject) return;

  if (isDuplicateIdea(currentProject, savedIdeas)) {
    setStatus("Bu fikir zaten kayıtlı. Yeni kopya oluşturulmadı.");
    return;
  }

  const ideaToSave = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    savedAt: new Date().toLocaleDateString("tr-TR"),
    name: currentProject.name,
    pitch: currentProject.pitch,
    tags: currentProject.tags,
    score: currentProject.score,
    state: currentProject.state,
    favorite: false,
  };

  savedIdeas = [ideaToSave, ...savedIdeas].slice(0, 9);
  persistSavedIdeas();
  renderSavedIdeas();
  setStatus(`${ideaToSave.name} kaydedildi.`);
}

async function copyReadmeDraft() {
  if (!currentProject) return;
  const draft = buildReadmeDraft(currentProject);

  try {
    await navigator.clipboard.writeText(draft);
    setStatus("README taslağı panoya kopyalandı.");
  } catch {
    setStatus("Tarayıcı panoya izin vermedi. README taslağı console yerine hazırlandı.");
    console.log(draft);
  }
}

async function copyShareLink() {
  const state = readState();
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("topic", state.topic);
  url.searchParams.set("audience", state.audience);
  url.searchParams.set("level", state.level);
  url.searchParams.set("style", state.style);
  window.history.replaceState(null, "", url);

  try {
    await navigator.clipboard.writeText(url.href);
    setStatus("Paylaşım linki panoya kopyalandı.");
  } catch {
    setStatus("Paylaşım linki adres çubuğuna yazıldı; buradan kopyalayabilirsin.");
  }
}

function previewReadmeDraft() {
  if (!currentProject) return;
  els.readmePreviewText.textContent = buildReadmeDraft(currentProject);
  els.readmePreview.hidden = false;
  els.closePreviewButton.focus();
  setStatus("README taslağı önizleme panelinde açıldı.");
}

function closeReadmePreview() {
  els.readmePreview.hidden = true;
  els.previewReadmeButton.focus();
}

function openCommandPanel() {
  els.commandPanel.hidden = false;
  els.commandSearchInput.value = "";
  renderCommands();
  els.commandSearchInput.focus();
}

function closeCommandPanel() {
  els.commandPanel.hidden = true;
}

function renderCommands() {
  const query = normalizeText(els.commandSearchInput.value);
  const visibleCommands = commands.filter((command) =>
    normalizeText(`${command.title} ${command.description}`).includes(query),
  );

  els.commandList.innerHTML = visibleCommands.length
    ? visibleCommands
        .map(
          (command) => `
            <button class="command-item" type="button" data-command="${escapeHtml(command.id)}">
              <strong>${escapeHtml(command.title)}</strong>
              <span>${escapeHtml(command.description)}</span>
            </button>
          `,
        )
        .join("")
    : `<p class="empty-state">Bu aramayla eşleşen komut yok.</p>`;
}

function handleCommandClick(event) {
  const button = event.target.closest("button[data-command]");
  if (!button) return;

  const command = commands.find((item) => item.id === button.dataset.command);
  if (!command) return;

  closeCommandPanel();
  command.run();
}

function renderSavedIdeas() {
  const visibleIdeas = getVisibleSavedIdeas();

  if (!savedIdeas.length) {
    els.savedGrid.innerHTML = `
      <p class="empty-state">
        Henüz kayıtlı fikir yok. Bir fikir üretip "Fikri kaydet" düğmesine basınca burada görünecek.
      </p>
    `;
    renderStats();
    return;
  }

  if (!visibleIdeas.length) {
    els.savedGrid.innerHTML = `
      <p class="empty-state">
        Bu arama ve filtrelerle eşleşen kayıt yok. Arama metnini temizleyebilir veya favori filtresini kapatabilirsin.
      </p>
    `;
    renderStats();
    return;
  }

  els.savedGrid.innerHTML = visibleIdeas
    .map(
      (idea) => `
        <article class="saved-card ${idea.favorite ? "is-favorite" : ""}">
          <small>${idea.favorite ? "Favori - " : ""}${escapeHtml(idea.savedAt)} - skor ${escapeHtml(idea.score)}</small>
          <h3>${escapeHtml(idea.name)}</h3>
          <p>${escapeHtml(idea.pitch)}</p>
          <div class="tag-row">${idea.tags.slice(0, 3).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
          <div class="card-actions">
            <button type="button" data-action="load" data-id="${escapeHtml(idea.id)}">Yükle</button>
            <button type="button" data-action="favorite" data-id="${escapeHtml(idea.id)}">${idea.favorite ? "Favoriden çıkar" : "Favori"}</button>
            <button type="button" data-action="delete" data-id="${escapeHtml(idea.id)}">Sil</button>
          </div>
        </article>
      `,
    )
    .join("");
  renderStats();
}

function getVisibleSavedIdeas() {
  const query = normalizeText(els.savedSearchInput.value);
  const favoriteOnly = els.favoriteOnlyInput.checked;

  return savedIdeas.filter((idea) => {
    const haystack = normalizeText(`${idea.name} ${idea.pitch} ${(idea.tags || []).join(" ")}`);
    const matchesQuery = !query || haystack.includes(query);
    const matchesFavorite = !favoriteOnly || idea.favorite;
    return matchesQuery && matchesFavorite;
  });
}

function handleSavedAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  const idea = savedIdeas.find((item) => item.id === id);
  if (!idea) return;

  if (action === "load") {
    loadSavedIdea(idea);
    return;
  }

  if (action === "favorite") {
    savedIdeas = savedIdeas.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item));
    savedIdeas.sort((a, b) => Number(b.favorite) - Number(a.favorite));
    persistSavedIdeas();
    renderSavedIdeas();
    setStatus(`${idea.name} favori durumu güncellendi.`);
    return;
  }

  if (action === "delete") {
    lastDeletedIdea = idea;
    savedIdeas = savedIdeas.filter((item) => item.id !== id);
    persistSavedIdeas();
    renderSavedIdeas();
    updateUndoButton();
    setStatus(`${idea.name} silindi. İstersen geri alabilirsin.`);
  }
}

function undoLastDelete() {
  if (!lastDeletedIdea) return;

  savedIdeas = mergeIdeas([lastDeletedIdea], savedIdeas).slice(0, 12);
  persistSavedIdeas();
  renderSavedIdeas();
  setStatus(`${lastDeletedIdea.name} geri alındı.`);
  lastDeletedIdea = null;
  updateUndoButton();
}

function updateUndoButton() {
  els.undoDeleteButton.disabled = !lastDeletedIdea;
}

function loadSavedIdea(idea) {
  if (!idea.state) {
    setStatus("Bu eski kayıtta form bilgisi yok. Yeni kayıtlarda yükleme çalışır.");
    return;
  }

  els.topic.value = idea.state.topic;
  els.audience.value = idea.state.audience;
  els.level.value = idea.state.level;
  const styleInput = els.form.querySelector(`input[name="style"][value="${escapeCssValue(idea.state.style)}"]`);
  if (styleInput) styleInput.checked = true;
  renderProject();
  document.querySelector("#reactor").scrollIntoView({ behavior: "smooth" });
  setStatus(`${idea.name} forma yeniden yüklendi.`);
}

function buildReadmeDraft(project) {
  const features = project.features.map(([title, text]) => `- **${title}:** ${text}`).join("\n");
  const plan = project.plan.map(([step, title, text]) => `${step}. **${title}:** ${text}`).join("\n");

  return `# ${project.name}

${project.pitch}

## Hedef Kitle

${project.state.audience}

## Özellikler

${features}

## İlk Sprint

${plan}

## Teknolojiler

- HTML
- CSS
- JavaScript
`;
}

function loadSavedIdeas() {
  try {
    const parsed = JSON.parse(localStorage.getItem("fikir-reaktoru-saved") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSavedIdeas() {
  localStorage.setItem("fikir-reaktoru-saved", JSON.stringify(savedIdeas));
}

function exportSavedIdeas() {
  if (!savedIdeas.length) {
    setStatus("Dışa aktarılacak kayıtlı fikir yok.");
    return;
  }

  const payload = {
    app: "Fikir Reaktörü",
    version: 1,
    exportedAt: new Date().toISOString(),
    ideas: savedIdeas,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `fikir-reaktoru-kayitlari-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus("Kayıtlı fikirler JSON olarak indirildi.");
}

function importSavedIdeas(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      const importedIdeas = normalizeImportedIdeas(parsed);
      if (!importedIdeas.length) {
        setStatus("Bu JSON içinde içe aktarılabilir fikir bulunamadı.");
        return;
      }

      savedIdeas = mergeIdeas(importedIdeas, savedIdeas).slice(0, 12);
      persistSavedIdeas();
      renderSavedIdeas();
      setStatus(`${importedIdeas.length} fikir içe aktarıldı.`);
    } catch {
      setStatus("JSON dosyası okunamadı. Dosya biçimini kontrol et.");
    } finally {
      els.importIdeasInput.value = "";
    }
  });
  reader.readAsText(file);
}

function normalizeImportedIdeas(parsed) {
  const rawIdeas = Array.isArray(parsed) ? parsed : Array.isArray(parsed.ideas) ? parsed.ideas : [];
  return rawIdeas
    .filter((idea) => idea && typeof idea.name === "string" && typeof idea.pitch === "string")
    .map((idea) => ({
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      savedAt: new Date().toLocaleDateString("tr-TR"),
      name: idea.name,
      pitch: idea.pitch,
      tags: Array.isArray(idea.tags) ? idea.tags.slice(0, 6) : ["İçe aktarıldı"],
      score: Number.isFinite(Number(idea.score)) ? Number(idea.score) : 70,
      state: idea.state && typeof idea.state === "object" ? idea.state : null,
      favorite: Boolean(idea.favorite),
    }));
}

function mergeIdeas(incoming, existing) {
  const seen = new Set();
  return [...incoming, ...existing].filter((idea) => {
    const key = ideaKey(idea);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isDuplicateIdea(idea, list) {
  const key = ideaKey(idea);
  return list.some((item) => ideaKey(item) === key);
}

function ideaKey(idea) {
  return `${normalizeText(idea.name)}::${normalizeText(idea.pitch)}`;
}

function toggleLearnMode() {
  const enabled = document.body.classList.toggle("learn-mode");
  els.learnModeButton.setAttribute("aria-pressed", String(enabled));
  setStatus(enabled ? "Öğrenme modu açıldı. Bölümlerin üstünde kod mantığı notları görünüyor." : "Öğrenme modu kapatıldı.");
}

function toggleTheme() {
  const darkEnabled = !document.body.classList.contains("dark-theme");
  applyTheme(darkEnabled);
  localStorage.setItem("fikir-reaktoru-theme", darkEnabled ? "dark" : "light");
  setStatus(darkEnabled ? "Koyu tema açıldı." : "Açık tema açıldı.");
}

function applySavedTheme() {
  applyTheme(localStorage.getItem("fikir-reaktoru-theme") === "dark");
}

function applyTheme(darkEnabled) {
  document.body.classList.toggle("dark-theme", darkEnabled);
  els.themeButton.setAttribute("aria-pressed", String(darkEnabled));
  els.themeButton.textContent = darkEnabled ? "Açık tema" : "Koyu tema";
}

function setStatus(message, toast = true) {
  els.actionStatus.textContent = message;
  if (toast) showToast(message);
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  els.toastStack.append(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3200);
}

function levelLabel(level) {
  return {
    starter: "Başlangıç",
    middle: "Orta",
    advanced: "İleri",
  }[level];
}

function pick(items, seed) {
  return items[seed % items.length];
}

function titleCase(value) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1))
    .join(" ");
}

function normalizeText(value) {
  return String(value).toLocaleLowerCase("tr-TR").trim();
}

function optionExists(select, value) {
  return Array.from(select.options).some((option) => option.value === value);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return entities[char];
  });
}

function escapeCssValue(value) {
  return String(value).replace(/["\\]/g, "\\$&");
}
