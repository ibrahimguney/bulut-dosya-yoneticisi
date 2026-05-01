# Bulut Dosya Yoneticisi Ders Notlari

Bu ders notu, `Bulut Dosya Yoneticisi` projesinin fikir asamasindan canli yayina kadar nasil gelistirildigini adim adim anlatir. Proje HTML, CSS, Vanilla JavaScript, Supabase ve GitHub Pages kullanilarak hazirlanmistir.

Canli demo:

```text
https://ibrahimguney.github.io/bulut-dosya-yoneticisi/
```

## Dersi Nasil Kullanmalisin?

Bu dokuman bir okuma metni gibi degil, uygulamali bir egitim notu gibi takip edilmelidir. Her bolumde once kavrami oku, sonra ilgili dosyayi acip kodun projedeki karsiligini incele.

Tavsiye edilen calisma sirasi:

1. Once projeyi yerelde calistir.
2. Canli demo ile yerel surumu karsilastir.
3. Her bolumde anlatilan dosyayi ac.
4. Kod parcasini oku ve uygulamada hangi bolumu etkiledigini bul.
5. Bolum sonundaki sorulari cevapla.
6. Mini odevleri kucuk commitler halinde uygula.

## On Kosullar

Bu dersi takip etmek icin su konulara temel seviyede asina olmak yeterlidir:

- HTML etiketleri
- CSS class kullanimi
- JavaScript fonksiyonlari
- `git add`, `git commit`, `git push`
- GitHub repo mantigi
- Web tarayicisinda gelistirici konsolu kullanimi

Supabase veya GitHub Actions bilmek zorunlu degildir; ilgili bolumlerde proje uzerinden anlatilir.

## Ogrenme Hedefleri

Bu egitim dokumanini tamamladiginda sunlari yapabilir hale gelmen beklenir:

- Statik bir web uygulamasinin dosya yapisini anlayabilmek
- HTML, CSS ve JavaScript dosyalarinin sorumluluklarini ayirabilmek
- Vanilla JavaScript ile basit state yonetimi kurabilmek
- Supabase Auth ve Storage ile temel islemler yapabilmek
- Demo modu gibi portfoy odakli bir deneyim tasarlayabilmek
- GitHub Pages ile statik site yayinlayabilmek
- Bir projeyi README ve portfoy sayfasi ile sunulabilir hale getirebilmek

## Ders Plani

| Ders | Konu | Uygulama |
| --- | --- | --- |
| 1 | Proje fikri ve dosya yapisi | Repo dosyalarini inceleme |
| 2 | Yerel sunucu | `start-server.cmd` ile calistirma |
| 3 | HTML iskeleti | Sidebar, auth ve dashboard bolumleri |
| 4 | CSS tasarimi | Layout, kartlar, responsive yapi |
| 5 | JavaScript state | `state`, `els`, event listener'lar |
| 6 | Supabase | Auth, Storage, klasor tablosu |
| 7 | Demo modu | Hesapsiz portfoy deneyimi |
| 8 | Deploy | GitHub Pages workflow |
| 9 | Sunum | README ve portfoye ekleme |

## 1. Projenin Amaci

Bu projenin hedefi, kullanicinin dosyalarini bulut ortaminda yonetebilecegi profesyonel bir web arayuzu hazirlamaktir.

Uygulamada su temel ozellikler vardir:

- E-posta ve sifre ile giris
- Demo olarak hesap acmadan inceleme
- Dosya yukleme, indirme ve silme
- Klasor olusturma, yeniden adlandirma ve silme
- Dosya arama ve siralama
- Kart ve liste gorunumu
- Paylasim linki olusturma
- Depolama kotasi ve son hareketler paneli
- GitHub Pages ile canli yayin

Bu proje ayni zamanda portfoyde sergilenebilecek bir web uygulamasi olarak tasarlanmistir.

## 2. Proje Dosya Yapisi

Projenin ana dosyalari:

```text
public/
  index.html
  styles.css
  app.js
  favicon.svg
tools/
  local-server.cjs
.github/
  workflows/
    pages.yml
README.md
supabase-setup.sql
supabase-folders.sql
start-server.cmd
```

Dosyalarin gorevleri:

- `public/index.html`: Sayfanin HTML iskeletini tutar.
- `public/styles.css`: Tum gorsel tasarimi ve responsive duzeni belirler.
- `public/app.js`: Uygulama mantigini, Supabase baglantisini ve kullanici etkilesimlerini yonetir.
- `tools/local-server.cjs`: Yerelde statik dosyalari sunan basit Node.js sunucusudur.
- `.github/workflows/pages.yml`: GitHub Pages deploy isini otomatiklestirir.
- `supabase-setup.sql`: Supabase tarafindaki ilk veritabani ve policy kurulumu icindir.
- `supabase-folders.sql`: Kalici klasor ozelligi icin ek SQL dosyasidir.

## 3. Yerelde Calistirma

Projeyi yerelde calistirmak icin:

```bash
start-server.cmd
```

Bu komut `tools/local-server.cjs` dosyasini calistirir ve uygulamayi su adreste acar:

```text
http://localhost:4173
```

Sunucudaki kritik kisim:

```js
const port = Number(process.env.PORT || 4173);
const root = path.join(__dirname, "..", "public");
```

Burada `root`, yayinlanacak statik dosyalarin bulundugu `public` klasorunu isaret eder. Ilk basta bu yol yanlis oldugunda sayfa `404` verebilir. Bu nedenle sunucunun `tools/public` degil, proje kokundeki `public` klasorune bakmasi gerekir.

## 4. HTML Iskeleti

Uygulamanin ana HTML dosyasi `public/index.html` icindedir. Sayfa dort temel bolumden olusur:

1. Sol menudeki sidebar
2. Giriş ve demo ekrani
3. Dashboard
4. Klasor olusturma dialog penceresi

Ana kapsayici:

```html
<div class="app-shell">
  <aside class="sidebar">...</aside>
  <main class="workspace">...</main>
</div>
```

`sidebar` bolumunde klasor filtreleri ve depolama paneli vardir. `workspace` bolumunde ise giris formu veya dashboard gosterilir.

Giris ekrani:

```html
<section class="auth-view" id="authView" hidden>
  ...
  <button class="ghost-button" id="demoButton" type="button">
    Demo olarak incele
  </button>
</section>
```

Bu bolum kullanici oturum acmamisken gorunur. `Demo olarak incele` dugmesi, ziyaretcinin hesap acmadan uygulamayi denemesini saglar.

Dashboard:

```html
<section class="dashboard" id="dashboard">
  <div class="command-bar">...</div>
  <div class="stats-grid">...</div>
  <div class="work-grid">...</div>
</section>
```

Dashboard icinde arama, siralama, gorunum secimi, dosya yukleme, dosya listesi ve sagdaki ozet panel vardir.

## 5. CSS ile Profesyonel Arayuz

Tasarim `public/styles.css` dosyasindadir.

Renkler CSS degiskenleriyle tanimlanir:

```css
:root {
  --bg: #f4f7fb;
  --surface: #ffffff;
  --ink: #182230;
  --muted: #667085;
  --brand: #0b65c2;
}
```

Bu yaklasim, renkleri tek merkezden kontrol etmeyi saglar.

Ana layout:

```css
.app-shell {
  display: grid;
  grid-template-columns: 288px minmax(0, 1fr);
  min-height: 100vh;
}
```

Bu kod sayfayi iki kolona ayirir:

- 288px genisliginde sidebar
- Geri kalan alani kaplayan ana calisma alani

Mobil uyumluluk:

```css
@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
  }
}
```

Ekran daraldiginda sidebar ve ana alan tek kolona duser.

## 6. JavaScript State Yonetimi

Uygulama mantigi `public/app.js` dosyasindadir. Merkezi durum nesnesi:

```js
const state = {
  user: null,
  demoMode: false,
  activeFolder: "all",
  view: "grid",
  sortBy: "newest",
  isLoading: false,
  lastSyncedAt: null,
  files: [],
  sharedFiles: loadSharedFiles(),
  folders: [...DEFAULT_FOLDERS],
};
```

Bu nesne uygulamanin o anki durumunu tutar:

- Kullanici oturum acmis mi?
- Demo modu aktif mi?
- Hangi klasor secili?
- Kart mi liste mi gorunuyor?
- Dosyalar ve klasorler neler?
- Son guncelleme zamani nedir?

Arayuz her degisiklikten sonra `render()` fonksiyonu ile yeniden cizilir.

```js
function render() {
  const signedIn = Boolean(state.user || state.demoMode);
  els.authView.hidden = signedIn;
  els.dashboard.hidden = !signedIn;
  ...
  renderStats();
  renderInsights();
  renderFiles();
}
```

Bu fonksiyon giris ekraninin mi dashboard'un mu gorunecegine karar verir.

## 7. DOM Elemanlarini Secme

Sayfadaki HTML elemanlari bir `els` nesnesinde toplanir:

```js
const els = {
  authView: document.querySelector("#authView"),
  authForm: document.querySelector("#authForm"),
  demoButton: document.querySelector("#demoButton"),
  dashboard: document.querySelector("#dashboard"),
  fileGrid: document.querySelector("#fileGrid"),
};
```

Bu sayede kodun farkli yerlerinde tekrar tekrar `document.querySelector` yazmaya gerek kalmaz.

## 8. Olay Dinleyicileri

Kullanici etkilesimleri event listener'larla baglanir:

```js
els.authForm.addEventListener("submit", handleAuthSubmit);
els.demoButton.addEventListener("click", startDemo);
els.signOutButton.addEventListener("click", signOut);
els.searchInput.addEventListener("input", renderFiles);
els.refreshButton.addEventListener("click", refreshWorkspace);
```

Ornek:

- Giris formu gonderilirse `handleAuthSubmit`
- Demo butonuna basilirsa `startDemo`
- Arama kutusu degisirse `renderFiles`

## 9. Supabase Baglantisi

Supabase istemcisi su sekilde olusturulur:

```js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

Burada:

- `persistSession`: Oturumu tarayicida saklar.
- `autoRefreshToken`: Oturum suresini otomatik yeniler.

Giris islemi:

```js
await supabase.auth.signInWithPassword({ email, password });
```

Kayit islemi:

```js
await supabase.auth.signUp({ email, password });
```

Oturum kapatma:

```js
await supabase.auth.signOut();
```

## 10. Dosya Yukleme

Dosya yukleme `handleFiles` fonksiyonunda yapilir.

Gercek kullanici icin Supabase Storage kullanilir:

```js
const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
  cacheControl: "3600",
  upsert: false,
});
```

Dosya yolu su sekilde olusturulur:

```js
const path = `${state.user.id}/${folder}/${Date.now()}-${sanitizeFileName(file.name)}`;
```

Bu yapi kullanicinin dosyalarini kendi `user.id` klasoru altinda tutar.

## 11. Dosya Listeleme

Dosyalar Supabase Storage icinden listelenir:

```js
const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
  limit: 100,
  sortBy: { column: "created_at", order: "desc" },
});
```

Her klasor icin dosya listesi okunur ve tek diziye cevrilir:

```js
const results = await Promise.all(folders.map((folder) => listFolder(folder.id)));
state.files = results.flat().sort((a, b) => b.createdAt - a.createdAt);
```

## 12. Arama ve Siralama

Gorunen dosyalar `getVisibleFiles()` fonksiyonuyla hesaplanir:

```js
function getVisibleFiles() {
  const query = els.searchInput.value.trim().toLocaleLowerCase("tr-TR");
  return state.files
    .filter((file) => {
      if (state.activeFolder === "all") return true;
      if (state.activeFolder === "shared") return file.shared;
      return file.folder === state.activeFolder;
    })
    .filter((file) => file.name.toLocaleLowerCase("tr-TR").includes(query))
    .sort(sortFiles);
}
```

Bu fonksiyon uc is yapar:

1. Secili klasore gore filtreler.
2. Arama metnine gore filtreler.
3. Secili siralama turune gore siralar.

Siralama:

```js
function sortFiles(a, b) {
  if (state.sortBy === "name") return a.name.localeCompare(b.name, "tr-TR", { sensitivity: "base" });
  if (state.sortBy === "size") return b.size - a.size;
  return b.createdAt - a.createdAt;
}
```

## 13. Demo Modu

Demo modu portfoy icin eklenmistir. Ziyaretci hesap acmadan uygulamayi deneyebilir.

Demo dosyalari:

```js
const DEMO_FILES = [
  {
    name: "Musteri-sunum-notlari.pdf",
    type: "application/pdf",
    size: 2.4 * 1024 * 1024,
    folder: "documents",
    shared: true,
    ageHours: 2,
  },
];
```

Demo baslatma:

```js
function startDemo() {
  state.user = null;
  state.demoMode = true;
  state.folders = [...DEFAULT_FOLDERS, ...DEMO_FOLDERS];
  state.files = DEMO_FILES.map(...);
  render();
}
```

Demo modunda gercek Supabase islemi yapilmaz. Dosya ekleme, silme, indirme ve paylasma tarayici icinde simule edilir.

Bu, canli siteyi ziyaret eden kisinin hesap acmadan uygulamanin kalitesini gormesini saglar.

## 14. Klasor Islemleri

Yeni klasor olusturma:

```js
await supabase
  .from("folders")
  .insert({ slug: id, name })
  .select("slug, name")
  .single();
```

Klasor yeniden adlandirma:

```js
await supabase
  .from("folders")
  .update({ slug: nextSlug, name })
  .eq("slug", oldId);
```

Klasor silme:

```js
await supabase.from("folders").delete().eq("slug", folder.id);
```

Onemli kontrol:

```js
if (folderFiles.length) {
  showToast("Bu klasor bos degil. Once icindeki dosyalari sil.");
  return;
}
```

Bos olmayan klasorun silinmesi engellenir.

## 15. Paylasim Linki ve Indirme

Paylasim linki Supabase signed URL ile olusturulur:

```js
const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(file.path, 60 * 60);
```

Burada `60 * 60`, linkin 1 saat gecerlilik suresi oldugunu belirtir.

Indirme icin de signed URL olusturulur:

```js
const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(file.path, 60);
```

Sonra gecici bir `<a>` etiketi ile indirme baslatilir.

## 16. Depolama Kotasi

Kota 100 MB olarak belirlenmistir:

```js
const QUOTA_BYTES = 100 * 1024 * 1024;
```

Toplam kullanim:

```js
function getUsage() {
  return state.files.reduce((sum, file) => sum + file.size, 0);
}
```

Yuzde hesabi:

```js
function getUsagePercent(bytes) {
  const raw = (bytes / QUOTA_BYTES) * 100;
  const rounded = Math.min(100, Math.round(raw));
  return { label: `${rounded}%`, meterWidth: `${rounded}%` };
}
```

Bu bilgi sol alttaki depolama panelinde gosterilir.

## 17. GitHub Pages ile Yayinlama

GitHub Pages deploy dosyasi:

```text
.github/workflows/pages.yml
```

Workflow ozeti:

```yaml
name: Deploy static site to Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:
```

Bu ayar `main` branch'e push yapildiginda deploy islemini baslatir.

Statik dosya yukleme:

```yaml
- name: Upload static files
  uses: actions/upload-pages-artifact@v3
  with:
    path: public
```

Burada GitHub Pages'e `public` klasoru yayinlanir.

GitHub ayari:

```text
Settings > Pages > Source > GitHub Actions
```

Canli adres:

```text
https://ibrahimguney.github.io/bulut-dosya-yoneticisi/
```

## 18. README Hazirlama

README dosyasi projenin vitrinidir. Bu projede README su bilgileri icerir:

- Canli demo linki
- One cikan ozellikler
- Kullanilan teknolojiler
- Yerelde calistirma
- Demo deneyimi
- GitHub Pages
- Vercel
- Supabase kurulumu

Iyi bir README, projeyi inceleyen kisinin hizlica anlamasini saglar.

## 19. Portfoye Ekleme

Proje tamamlandiktan sonra kisisel portfoy sitesine eklendi:

```text
https://ibrahimguney.github.io/
```

Portfoyde proje icin iki ana link verildi:

- Canli Demo
- GitHub Repo

Bu adim, projenin sadece kod olarak degil, sunulabilir bir calisma olarak gorunmesini saglar.

## 20. Gelistirme Fikirleri

Bu projeyi daha da ilerletmek icin:

- Dosya onizleme ozelligi eklenebilir.
- Surukle birak dosya yukleme yapilabilir.
- Klasor ici gezinme gelistirilebilir.
- Rol bazli paylasim izinleri eklenebilir.
- Gercek zamanli aktivite gecmisi tutulabilir.
- Dosya versiyonlama eklenebilir.
- Daha kapsamli hata ve loading durumlari yazilabilir.

## 21. Ogrenilenler

Bu proje sonunda su konular pratik edildi:

- Statik web uygulamasi gelistirme
- HTML ile semantik sayfa yapisi kurma
- CSS Grid ve responsive tasarim
- Vanilla JavaScript ile state yonetimi
- Supabase Auth ve Storage kullanimi
- Demo modu tasarlama
- GitHub Actions ile Pages deploy
- README ve portfoy sunumu hazirlama

Bu nedenle proje, basit bir arayuz calismasindan daha fazlasidir: fikir, gelistirme, veri baglantisi, yayin ve portfoy sunumu adimlarini bir araya getiren uctan uca bir uygulamadir.

## 22. Bolum Sonu Genel Tekrar Sorulari

1. Bu projede HTML, CSS ve JavaScript hangi sorumluluklari ustleniyor?
2. `state` nesnesi olmasaydi uygulama mantigi nasil zorlasirdi?
3. Supabase Auth ve Storage projede hangi problemleri cozer?
4. Demo modu neden gercek kullanici modundan ayrildi?
5. GitHub Pages ile Vercel arasinda bu proje icin nasil bir fark vardir?
6. README dosyasi teknik olarak uygulamayi calistirir mi, yoksa sunum gorevi mi gorur?
7. Portfoye eklemek neden proje gelistirme surecinin bir parcasi sayilabilir?
8. Bu projeyi daha guvenli yapmak icin hangi ek kontroller gerekir?
9. Mobil tasarimda en cok hangi bolumler riskli olabilir?
10. Bu uygulamayi musteriye teslim edilecek seviyeye getirmek icin hangi ozellikleri eklersin?

## 23. Bolum Bazli Kontrol Sorulari

### Proje Fikri

- Bu uygulamanin hedef kullanicisi kimdir?
- Demo modu neden portfoy projeleri icin onemlidir?
- Bu proje sadece tasarim projesi mi, yoksa veri baglantisi da olan bir uygulama mi?

### Dosya Yapisi

- `public` klasoru neden onemlidir?
- `app.js` ile `styles.css` arasindaki sorumluluk farki nedir?
- GitHub Pages hangi klasoru yayinliyor?

### Yerel Sunucu

- Local server neden gereklidir?
- `4173` neyi temsil eder?
- `public/index.html` dosyasi neden otomatik acilir?

### HTML

- `hidden` attribute'u ne ise yarar?
- `id` ve `class` arasindaki fark nedir?
- Neden form elemanlarinda `required` kullanildi?

### CSS

- CSS degiskenleri neden kullanildi?
- Grid layout bu proje icin neden uygundur?
- Mobil tasarim icin media query neden gereklidir?

### JavaScript

- Merkezi state kullanmak neden faydalidir?
- `render()` fonksiyonunu her degisiklikten sonra cagirmak ne saglar?
- `demoMode` ve `user` birlikte nasil kullaniliyor?

### Supabase

- `persistSession` ne ise yarar?
- Supabase Auth ile Storage arasindaki fark nedir?
- Publishable key neden frontend tarafinda kullanilabilir?

### Deploy

- GitHub Pages neden backend calistiramaz?
- Bu proje neden statik yayinlanabiliyor?
- `public` klasoru neden deploy artifact olarak secildi?

## 24. Uygulamali Odevler

### Odev 1: Demo Dosyasi Ekle

`DEMO_FILES` dizisine yeni bir dosya ekle ve demo modunda gorundugunu kontrol et.

Beklenen sonuc:

- Dosya listede gorunmeli.
- Sag panelde son hareketlere dusmeli.
- Depolama kotasi guncellenmeli.

### Odev 2: Yeni Siralama Secenegi

Dosyalari dosya uzantisina gore siralayan yeni bir secenek ekle.

Dokunulacak yerler:

- `public/index.html`
- `public/app.js`

Beklenen sonuc:

- Select icinde yeni secenek gorunmeli.
- Secilince dosyalar uzantiya gore siralanmali.

### Odev 3: Bos Durum Metnini Gelistir

Dosya olmayan klasorlerde daha yonlendirici bir mesaj goster.

Ornek:

```text
Bu klasorde henuz dosya yok. Dosya yukleyerek baslayabilirsin.
```

### Odev 4: README'ye Ekran Goruntusu Alani Ekle

README icine su basligi ekle:

```md
## Ekran Goruntusu
```

Sonra canli uygulamadan bir ekran goruntusu alip bu bolumde kullanmak icin hazirla.

### Odev 5: Portfoy Kartini Gelistir

Portfoy ana sayfasindaki proje kartina 3 maddelik ozellik listesi ekle.

Ornek:

- Demo modu
- Supabase Storage
- GitHub Pages deploy

## 25. Uygulama Kontrol Listeleri

### Yerel Calisma Kontrol Listesi

- `start-server.cmd` calisiyor mu?
- `http://localhost:4173` aciliyor mu?
- Tarayici konsolunda hata var mi?
- Demo butonu dashboard'u aciyor mu?
- Dosya kartlari gorunuyor mu?

### GitHub Pages Kontrol Listesi

- `.github/workflows/pages.yml` dosyasi var mi?
- GitHub Pages `Source` ayari `GitHub Actions` mi?
- Actions sekmesinde workflow basarili mi?
- Canli site `200 OK` donuyor mu?
- Canli sitede son eklenen ozellik gorunuyor mu?

### README Kontrol Listesi

- Proje adi var mi?
- Canli demo linki var mi?
- Ozellik listesi var mi?
- Kullanilan teknolojiler yaziyor mu?
- Yerelde calistirma adimi var mi?
- Deploy bilgisi var mi?
- Supabase kurulumu anlatiliyor mu?

### Portfoy Kontrol Listesi

- Proje karti ana sayfada gorunuyor mu?
- Canli demo linki calisiyor mu?
- GitHub repo linki calisiyor mu?
- Kart aciklamasi kisa ve anlasilir mi?
- Kullanilan teknolojiler gorunuyor mu?

## 26. Degerlendirme Rubrigi

Bu proje uzerinden kendini degerlendirmek icin asagidaki tabloyu kullanabilirsin.

| Kriter | Baslangic | Orta | Iyi |
| --- | --- | --- | --- |
| HTML yapisi | Elemanlari taniyor | Bolumleri aciklayabiliyor | Yeni bolum ekleyebiliyor |
| CSS tasarimi | Class'lari buluyor | Layout'u degistirebiliyor | Responsive tasarim yapabiliyor |
| JavaScript | Fonksiyonlari okuyabiliyor | State ve render mantigini anliyor | Yeni ozellik ekleyebiliyor |
| Supabase | Auth/Storage ayrimini biliyor | Dosya yukleme akisini anliyor | Policy ve veri modelini tartisabiliyor |
| Deploy | Pages ayarini biliyor | Workflow'u okuyabiliyor | Hata durumunda debug yapabiliyor |
| Sunum | README okuyor | README duzenleyebiliyor | Portfoyde projeyi etkili sunabiliyor |

## 27. Egitmen Notlari

Bu proje anlatilirken en iyi ilerleme sekli sudur:

1. Once canli demoyu goster.
2. Sonra yerel projeyi calistir.
3. HTML iskeletini acikla.
4. CSS layout'u uzerinden gorsel yapiyi anlat.
5. JavaScript `state` nesnesine gec.
6. Demo modunu acikla.
7. Supabase'in gercek veri tarafini nasil sagladigini anlat.
8. GitHub Pages deploy surecini goster.
9. README ve portfoy sunumunu dersin sonuna koy.

Bu siralama ogrencinin once sonucu gormesini, sonra adim adim nasil yapildigini anlamasini saglar.

## 28. Kapanis

Bu egitim dokumani, bir web uygulamasinin sadece kod yazmaktan ibaret olmadigini gosterir. Basarili bir portfoy projesi icin su adimlar birlikte dusunulmelidir:

- Kullanici deneyimi
- Temiz dosya yapisi
- Anlasilir kod
- Veri baglantisi
- Demo deneyimi
- Canli yayin
- README
- Portfoy sunumu

Bu projede bu adimlarin tamami uygulandi. Bundan sonraki hedef, ayni yaklasimi baska projelere de tasimaktir.
