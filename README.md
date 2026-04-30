# Bulut Dosya Yoneticisi

Supabase destekli, statik olarak yayinlanabilen bulut dosya yonetimi arayuzu.

## Ozellikler

- E-posta ile hesap girisi
- Dosya yukleme, indirme ve silme
- Klasor filtreleri ve ozel klasorler
- Arama, siralama, kart ve liste gorunumu
- Sureli paylasim linki olusturma
- Depolama kotasi ve son guncelleme gostergesi

## Calistirma

Yerel sunucu ile calistir:

```bash
start-server.cmd
```

Sunucu varsayilan olarak `http://localhost:4173` adresinde acilir.

Statik dosyalar `public` klasorundedir.

## GitHub Pages

Bu repo `public` klasorunu GitHub Pages'e yayinlamak icin hazir bir workflow icerir.

1. Repository `Settings > Pages` sayfasina gir.
2. `Build and deployment` altinda `Source` alanini `GitHub Actions` yap.
3. `main` branch'e push yapildiginda site otomatik yayinlanir.

Beklenen proje adresi:

```text
https://ibrahimguney.github.io/bulut-dosya-yoneticisi/
```

## Vercel

Vercel'de yeni proje olustururken:

- Framework Preset: `Other`
- Build Command: bos birak
- Output Directory: `public`
- Install Command: bos birakilabilir

## Supabase

- SQL Editor icinde `supabase-setup.sql` dosyasindaki komutlari calistir.
- Daha once kurulum yapildiysa kalici klasorler icin `supabase-folders.sql` dosyasindaki komutlari calistir.
- Authentication ayarlarinda Email provider'in acik oldugunu kontrol et.
- Storage bucket adinin `files` oldugunu dogrula.
