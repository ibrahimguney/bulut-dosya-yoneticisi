const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const port = Number(process.env.PORT || 4173);
const root = path.join(__dirname, "..", "public");
const apiKey = process.env.OPENAI_API_KEY || "";
const model = process.env.OPENAI_MODEL || "gpt-5.2";
const supabaseUrl = process.env.SUPABASE_URL || "https://yqleugywrmevmsjzekdw.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_eA14QrXd4sESvwNwfmfvqg_WwIyuAzI";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const server = http.createServer((req, res) => {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${port}`);

  if (url.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      aiEnabled: Boolean(apiKey),
      model: apiKey ? model : null,
      supabaseEnabled: Boolean(supabaseUrl && supabaseAnonKey),
    });
    return;
  }

  if (url.pathname === "/api/config") {
    sendJson(res, 200, {
      supabaseUrl,
      supabaseAnonKey,
    });
    return;
  }

  if (url.pathname === "/api/generate" && req.method === "POST") {
    handleGenerate(req, res);
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    sendJson(res, 404, { error: "API endpoint not found." });
    return;
  }

  const pathname = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const safePath = path.normalize(pathname || "index.html").replace(/^(\.\.[/\\])+/, "");
  const requested = safePath === "." ? "index.html" : safePath;
  const filePath = path.join(root, requested);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      fs.readFile(path.join(root, "index.html"), (fallbackError, fallback) => {
        if (fallbackError) {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Not found");
          return;
        }
        res.writeHead(200, { "Content-Type": types[".html"] });
        res.end(fallback);
      });
      return;
    }

    res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
    res.end(content);
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`AkilLab is running at http://localhost:${port}`);
});

function handleGenerate(req, res) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 128_000) req.destroy();
  });

  req.on("end", async () => {
    try {
      const payload = JSON.parse(body || "{}");
      const validated = validatePayload(payload);

      if (!apiKey) {
        sendJson(res, 200, {
          source: "demo",
          content: buildDemoMaterial(validated),
        });
        return;
      }

      const content = await generateWithOpenAI(validated);
      sendJson(res, 200, { source: "openai", content });
    } catch (error) {
      const status = error.statusCode || 500;
      sendJson(res, status, { error: error.message || "Content generation failed." });
    }
  });
}

async function generateWithOpenAI(payload) {
  const prompt = [
    "Turkish education content generator.",
    "Return clean Markdown only. Do not include code fences.",
    "Make the result directly usable by a teacher or learner.",
    `Topic: ${payload.topic}`,
    `Level: ${payload.level}`,
    `Material type: ${payload.type}`,
    `Duration: ${payload.duration}`,
    `Tone: ${payload.tone}`,
    `Goal or notes: ${payload.goal || "No extra notes."}`,
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: prompt,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error?.message || `OpenAI request failed with ${response.status}`;
    const error = new Error(message);
    error.statusCode = response.status;
    throw error;
  }

  const text = extractResponseText(data);
  if (!text) throw new Error("OpenAI response did not include text output.");
  return text;
}

function extractResponseText(data) {
  if (typeof data.output_text === "string") return data.output_text.trim();

  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) parts.push(content.text);
      if (content.type === "text" && content.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

function validatePayload(payload) {
  const clean = {
    topic: String(payload.topic || "").trim().slice(0, 160),
    level: String(payload.level || "Lise").trim().slice(0, 80),
    type: String(payload.type || "lesson").trim(),
    duration: String(payload.duration || "40 dakika").trim().slice(0, 80),
    tone: String(payload.tone || "Sade ve anlasilir").trim().slice(0, 80),
    goal: String(payload.goal || "").trim().slice(0, 1200),
  };

  const allowedTypes = new Set(["lesson", "quiz", "summary", "flashcards", "assignment", "rubric"]);
  if (!clean.topic) {
    const error = new Error("Topic is required.");
    error.statusCode = 400;
    throw error;
  }
  if (!allowedTypes.has(clean.type)) clean.type = "lesson";
  return clean;
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
3. "${payload.topic}" kavramini bir arkadasina nasil anlatirsin?
4. Bir yanlis anlama yaz ve dogrusunu belirt.
5. Konuyu 3 maddede ozetle.

## Cevap anahtari
- Cevaplar kavram dogrulugu, ornek kalitesi ve acik ifade uzerinden degerlendirilir.
- Her soru 20 puandir.
- Geri bildirim kisa, somut ve gelistirici olmalidir.`;
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

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}
