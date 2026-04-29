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
npm.cmd start
```

Sunucu varsayilan olarak `http://localhost:4173` adresinde acilir.

## Vercel Deploy

Bu proje statik dosyalarla calisir. Vercel'de yeni proje olustururken:

- Framework Preset: `Other`
- Build Command: bos birak
- Output Directory: bos birak
- Install Command: bos birakilabilir

## Sonraki Adimlar

- Supabase Auth ile gercek kullanici girisi
- Supabase Storage, AWS S3 veya Cloudflare R2 ile gercek dosya depolama
- Dosya paylasim izinleri
- Klasor ici gezinme
- Backend API ve veritabani modeli
