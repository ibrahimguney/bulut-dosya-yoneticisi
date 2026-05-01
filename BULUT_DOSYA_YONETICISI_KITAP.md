# Bulut Dosya Yonetimi Projesi

## Ogrenci Ders Notu ve Kucuk Kitap

Bu kitapcik, `Bulut Dosya Yoneticisi` projesinin fikir asamasindan calisan bir bulut uygulamasina donusmesini adim adim anlatir. Amac sadece kod yazmak degil; bir web uygulamasinin nasil dusunuldugunu, nasil parcalara ayrildigini, nasil yayina alindigini ve nasil bulut servislerine baglandigini anlamaktir.

Proje; HTML, CSS, Vanilla JavaScript, Supabase, GitHub ve Vercel kullanilarak hazirlanmistir.

## Icindekiler

1. Projenin Amaci
2. Bulut Uygulamasi Nedir?
3. Kullanilan Teknolojiler
4. Proje Dosya Yapisi
5. Arayuz Tasarimi
6. JavaScript ile Uygulama Mantigi
7. Supabase Auth ile Kullanici Girisi
8. Supabase Storage ile Dosya Yukleme
9. Kalici Klasor Sistemi
10. Paylasim Linkleri
11. Vercel ile Deploy
12. Guvenlik ve RLS Mantigi
13. Test Etme ve Hata Ayiklama
14. Odevler ve Gelistirme Fikirleri

## 1. Projenin Amaci

Bu projenin amaci, kullanicilarin dosyalarini web uzerinden yonetebilecegi bir bulut dosya yonetimi uygulamasi gelistirmektir.

Uygulamada su islemler yapilabilir:

- E-posta ve sifre ile kayit olma
- Kullanici girisi yapma
- Dosya yukleme
- Dosyalari listeleme
- Dosya indirme
- Dosya silme
- Paylasim linki olusturma
- Klasor olusturma
- Klasorleri yeniden adlandirma
- Bos klasorleri silme
- Depolama kullanimini gorme

Bu uygulama kucuk bir MVP'dir. MVP, `Minimum Viable Product` ifadesinin kisaltmasidir. Yani bir fikrin calisan en sade ve anlamli surumudur.

## 2. Bulut Uygulamasi Nedir?

Bulut uygulamasi, verilerin sadece kullanicinin bilgisayarinda degil, internet uzerindeki sunucularda saklandigi uygulamadir.

Bu projede:

- Arayuz Vercel uzerinden yayinlanir.
- Kullanici hesabi Supabase Auth ile tutulur.
- Dosyalar Supabase Storage icinde saklanir.
- Klasor bilgileri Supabase veritabaninda tutulur.

Boylece kullanici farkli cihazlardan giris yaptiginda ayni verilere ulasabilir.

## 3. Kullanilan Teknolojiler

### HTML

HTML uygulamanin iskeletidir. Formlar, butonlar, dosya kartlari ve dashboard bolumleri HTML ile tanimlanir.

Projede ana HTML dosyasi:

```text
public/index.html
```

### CSS

CSS uygulamanin gorunumunu belirler. Sidebar, kartlar, butonlar, bos durum ekrani ve responsive davranis CSS ile tasarlanir.

Projede ana stil dosyasi:

```text
public/styles.css
```

### JavaScript

JavaScript uygulamanin davranislarini yonetir. Butona tiklama, dosya yukleme, Supabase'e istek atma, ekrani guncelleme gibi islemler JavaScript ile yapilir.

Projede ana JavaScript dosyasi:

```text
public/app.js
```

### Supabase

Supabase bu projede backend gorevi gorur.

Kullanilan Supabase servisleri:

- Auth
- Storage
- PostgreSQL database
- Row Level Security

### Vercel

Vercel uygulamanin internette yayinlanmasini saglar. Bu projede uygulama statik site olarak yayinlanir.

## 4. Proje Dosya Yapisi

Projedeki temel dosyalar sunlardir:

```text
public/
  index.html
  styles.css
  app.js
  favicon.svg

tools/
  local-server.cjs

supabase-setup.sql
supabase-folders.sql
vercel.json
README.md
```

### `public/index.html`

Kullanicinin gordugu sayfanin HTML yapisini icerir.

Ornek bolumler:

- Sol menu
- Giriş formu
- Dashboard
- Dosya listesi
- Yeni klasor dialog'u

### `public/styles.css`

Tum gorsel tasarim burada bulunur.

Ornek:

- Renkler
- Kart boyutlari
- Buton tasarimlari
- Mobil uyumluluk

### `public/app.js`

Uygulamanin beyni bu dosyadir.

Bu dosyada:

- Supabase client olusturulur.
- Kullanici oturumu kontrol edilir.
- Dosyalar yuklenir ve listelenir.
- Klasorler Supabase'den okunur.
- Paylasim linkleri uretilir.

## 5. Arayuz Tasarimi

Uygulama iki ana bolumden olusur:

1. Sidebar
2. Ana calisma alani

Sidebar icinde klasorler ve depolama bilgisi bulunur. Ana alanda ise arama, gorunum secimi, yeni klasor, yukleme butonu ve dosya kartlari vardir.

Bu tasarim, kullanicinin dosyalari hizli sekilde taramasina ve yonetmesine yardim eder.

## 6. JavaScript ile Uygulama Mantigi

Uygulamada merkezi bir `state` nesnesi kullanilir.

Ornek:

```js
const state = {
  user: null,
  activeFolder: "all",
  view: "grid",
  files: [],
  folders: [...DEFAULT_FOLDERS],
};
```

Bu nesne uygulamanin o anki durumunu tutar.

Ornek:

- Hangi kullanici giris yapti?
- Hangi klasor secili?
- Dosyalar hangileri?
- Gorunum kart mi liste mi?

Ekran degisiklikleri `render()` fonksiyonu ile yapilir. Bu mantik, basit ama ogretici bir frontend state yonetimi ornegidir.

## 7. Supabase Auth ile Kullanici Girisi

Kullanici kayit ve giris islemleri Supabase Auth ile yapilir.

Kayit islemi:

```js
await supabase.auth.signUp({ email, password });
```

Giris islemi:

```js
await supabase.auth.signInWithPassword({ email, password });
```

Oturum kontrolu:

```js
const { data } = await supabase.auth.getSession();
```

Bu sayede kullanici sayfayi yenilese bile oturumu devam edebilir.

## 8. Supabase Storage ile Dosya Yukleme

Dosyalar Supabase Storage icindeki `files` bucket'ina yuklenir.

Dosya yolu su mantikla olusturulur:

```text
kullanici_id / klasor / dosya_adi
```

Ornek:

```text
6f2.../documents/1714490000-rapor.pdf
```

Bu yapi sayesinde her kullanicinin dosyalari kendi kullanici id'si altinda tutulur.

Dosya yukleme:

```js
await supabase.storage.from("files").upload(path, file);
```

Dosya listeleme:

```js
await supabase.storage.from("files").list(prefix);
```

Dosya silme:

```js
await supabase.storage.from("files").remove([file.path]);
```

## 9. Kalici Klasor Sistemi

Ilk surumde klasorler sadece tarayici icinde tutuluyordu. Bu, sayfa yenilenince veya baska cihazdan girince klasorlerin kaybolmasi anlamina gelirdi.

Daha sonra `folders` tablosu eklendi.

Tablonun temel alanlari:

```text
id
user_id
slug
name
created_at
```

### `slug` nedir?

Slug, klasorun teknik adidir. Ornegin:

```text
Makale Dosyalari -> makale-dosyalari
```

Gorunen ad kullaniciya guzel gorunur. Slug ise dosya yolu ve veritabani icin daha guvenli bir degerdir.

### Klasor olusturma

Kullanici yeni klasor olusturdugunda uygulama Supabase'e kayit ekler:

```js
await supabase.from("folders").insert({ slug, name });
```

### Klasor yeniden adlandirma

Klasor bos ise slug da degisebilir. Klasor icinde dosya varsa uygulama dosya yollarini bozmamak icin sadece gorunen adi gunceller.

Bu, gercek uygulama tasariminda onemli bir karardir.

## 10. Paylasim Linkleri

Dosya paylasimi icin Supabase signed URL kullanilir.

Signed URL, belirli bir sure calisan gecici linktir.

Ornek:

```js
await supabase.storage.from("files").createSignedUrl(file.path, 60 * 60);
```

Bu kod 1 saatlik paylasim linki olusturur.

Bu yaklasim guvenlidir cunku bucket private kalir. Dosyalar herkese acik olmaz.

## 11. Vercel ile Deploy

Proje Vercel'e statik site olarak deploy edilir.

Vercel ayarlari:

```text
Framework Preset: Other
Build Command: bos
Output Directory: public
Install Command: bos
```

`vercel.json` dosyasi:

```json
{
  "framework": null,
  "buildCommand": null,
  "installCommand": null,
  "outputDirectory": "public"
}
```

Bu ayarlarla Vercel, uygulamayi Node server gibi calistirmaya calismaz. Sadece `public` klasorundeki statik dosyalari yayinlar.

## 12. Guvenlik ve RLS Mantigi

Supabase'de guvenligin en onemli parcasi RLS yani `Row Level Security` sistemidir.

Bu projede her kullanici sadece kendi verilerine erisebilir.

Storage politikasi su mantiktadir:

```sql
bucket_id = 'files'
and (storage.foldername(name))[1] = auth.uid()::text
```

Bu su anlama gelir:

Dosya yolunun ilk klasoru kullanicinin id'si ile ayniysa erisim ver.

Klasor tablosunda da benzer mantik vardir:

```sql
user_id = auth.uid()
```

Boylece bir kullanici baska kullanicinin klasorlerini okuyamaz.

## 13. Test Etme ve Hata Ayiklama

Projeyi gelistirirken karsilasilan bazi hatalar ve cozumleri:

### `Failed to fetch`

Bu hata genellikle Supabase URL yanlis oldugunda veya internet istegi engellendiginde gorulur.

Kontrol edilecekler:

- Project URL dogru mu?
- Publishable key dogru projeye mi ait?
- Supabase projesi aktif mi?

### `Invalid API key`

Bu hata key ile URL'nin ayni projeye ait olmadigini gosterir.

Cozum:

Supabase `Connect` ekranindan ayni projeye ait URL ve publishable key alinmalidir.

### Vercel 500 hatasi

Vercel projeyi serverless function gibi calistirmaya calisirsa 500 hatasi gorulebilir.

Cozum:

- `server.js` kullanma
- Statik dosyalari `public` klasorune koy
- Output Directory degerini `public` yap

### Dosya yuklenmiyor

Kontrol edilecekler:

- `files` bucket var mi?
- Storage policy calistirildi mi?
- Kullanici giris yapmis mi?

## 14. Odevler ve Gelistirme Fikirleri

### Odev 1: Dosya Turune Gore Renk

PDF, DOCX, PNG gibi dosya turlerine farkli renkler ver.

### Odev 2: Klasor Silme Onayi

Klasor silmeden once daha guzel bir modal tasarla.

### Odev 3: Profil Sayfasi

Kullanicinin e-posta adresini ve depolama kullanimini gosteren bir profil sayfasi ekle.

### Odev 4: Paylasim Gecmisi

Paylasilan dosyalar icin Supabase'de `shares` tablosu olustur.

### Odev 5: Dosya Onizleme

Gorseller icin kucuk onizleme resmi goster.

### Odev 6: Arama ve Siralama

Dosyalari ada, tarihe ve boyuta gore sirala.

## Sonuc

Bu proje, basit bir HTML/CSS/JavaScript uygulamasinin nasil gercek bir bulut uygulamasina donusebilecegini gosteren guzel bir ornektir.

Ogrenilen ana fikirler:

- Frontend ve backend ayrimi
- Statik site deploy mantigi
- Supabase ile kullanici yonetimi
- Supabase Storage ile dosya saklama
- RLS ile veri guvenligi
- GitHub ve Vercel ile yayin sureci
- MVP'den urunlesmeye giden yol

Bu kitapcik, projeyi tekrar yapmak veya bir derste anlatmak icin temel kaynak olarak kullanilabilir.
