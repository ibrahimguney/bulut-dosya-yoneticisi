# Bulut Dosya Yoneticisi

Yerelde calisan bir bulut dosya yoneticisi prototipi.

## Ozellikler

- E-posta ile demo giris
- Dosya yukleme ve indirme
- Klasor filtreleri
- Yeni klasor olusturma
- Arama
- Kart ve liste gorunumu
- Paylasim linki olusturma
- Depolama kotasi gostergesi

## Calistirma

HTML dosyasini dogrudan acabilirsin:

```text
index.html
```

Ya da yerel sunucu ile calistir:

```bash
start-server.cmd
```

Sunucu varsayilan olarak `http://localhost:4173` adresinde acilir.

## Vercel Deploy

Bu proje statik dosyalarla calisir. Vercel'de yeni proje olustururken:

- Framework Preset: `Other`
- Build Command: bos birak
- Output Directory: `public`
- Install Command: bos birakilabilir
- Vercel'de Node sunucusu calistirilmaz; `index.html`, `styles.css` ve `app.js` statik olarak yayinlanir.

## Sonraki Adimlar

- Supabase SQL Editor icinde `supabase-setup.sql` dosyasindaki komutlari calistir
- Daha once kurulum yapildiysa kalici klasorler icin `supabase-folders.sql` dosyasindaki komutlari calistir
- Authentication ayarlarinda Email provider'in acik oldugunu kontrol et
- Dosya paylasim izinleri
- Klasor ici gezinme
- Backend API ve veritabani modeli
