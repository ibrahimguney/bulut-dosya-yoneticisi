# Bulut Dosya Yoneticisi

Supabase destekli, GitHub Pages uzerinden yayinlanan profesyonel bulut dosya yonetimi arayuzu.

**Canli demo:** https://ibrahimguney.github.io/bulut-dosya-yoneticisi/

## One Cikanlar

- Hesap acmadan incelenebilen demo calisma alani
- E-posta ile Supabase Authentication girisi
- Dosya yukleme, indirme, silme ve paylasim linki olusturma
- Sistem klasorleri ve kullanici tarafindan olusturulan ozel klasorler
- Arama, siralama, kart/liste gorunumu
- Depolama kotasi, en buyuk dosya ve son hareketler paneli
- GitHub Pages ve Vercel icin statik yayin mimarisi

## Teknolojiler

- HTML
- CSS
- Vanilla JavaScript
- Supabase Auth
- Supabase Storage
- GitHub Pages Actions

## Yerelde Calistirma

```bash
start-server.cmd
```

Sunucu varsayilan olarak su adreste acilir:

```text
http://localhost:4173
```

Statik dosyalar `public` klasorundedir.

## Demo Deneyimi

Canli siteye giren ziyaretciler `Demo olarak incele` dugmesiyle hesap acmadan dashboard'u gorebilir.
Demo modunda ornek dosyalar, klasorler, paylasim, indirme ve silme aksiyonlari tarayici icinde simule edilir.

## GitHub Pages

Bu repo `public` klasorunu GitHub Pages'e yayinlamak icin hazir workflow icerir:

```text
.github/workflows/pages.yml
```

Repository ayari:

```text
Settings > Pages > Source > GitHub Actions
```

## Vercel

Vercel'de yeni proje olustururken:

- Framework Preset: `Other`
- Build Command: bos birak
- Output Directory: `public`
- Install Command: bos birakilabilir

## Supabase Kurulumu

1. `supabase-setup.sql` dosyasindaki SQL komutlarini Supabase SQL Editor icinde calistir.
2. Daha once kurulum yapildiysa kalici klasorler icin `supabase-folders.sql` dosyasini calistir.
3. Authentication ayarlarinda Email provider'in acik oldugunu kontrol et.
4. Storage bucket adinin `files` oldugunu dogrula.

## Proje Durumu

Bu proje portfoyde gosterilebilir statik bir web uygulamasi olarak hazirlandi. Canli demo GitHub Pages uzerinden yayinlanir; Supabase bilgileri dogru oldugunda kalici dosya yonetimi de aktif calisir.
