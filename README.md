# AkilLab AI Egitim Paneli

Render uzerinde surekli yayinda kalabilecek AI destekli egitim icerigi paneli.

## Ozellikler

- Ders plani, quiz, konu ozeti, kart seti, odev ve rubrik uretimi
- Render Web Service uzerinden guvenli AI endpoint'i
- `OPENAI_API_KEY` yoksa demo mod
- Kayitli materyal kutuphanesi
- Arama, tur filtresi, kopyalama, Markdown indirme, yazdirma ve disa aktarma
- Tek Node servisiyle frontend ve `/api/generate` endpoint'i
- Supabase Auth ile hesap acma ve materyalleri veritabaninda saklama

## Yerelde Calistirma

```bash
npm.cmd start
```

Adres:

```text
http://localhost:4173
```

Gercek AI uretimi icin ortam degiskenleri:

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.2
SUPABASE_URL=https://yqleugywrmevmsjzekdw.supabase.co
SUPABASE_ANON_KEY=...
```

Anahtar yoksa uygulama demo icerik uretir.

## Render Kurulumu

Render'da servis tipi:

```text
New > Web Service
```

Ayarlar:

```text
Runtime: Node
Build Command: npm install
Start Command: npm start
```

Environment bolumune ekle:

```text
OPENAI_API_KEY = senin OpenAI API anahtarin
OPENAI_MODEL = gpt-5.2
SUPABASE_URL = Supabase project URL
SUPABASE_ANON_KEY = Supabase anon/publishable key
```

`render.yaml` dosyasi Blueprint olarak da kullanilabilir.

## Supabase Kurulumu

Supabase SQL Editor icinde `supabase-akillab-schema.sql` dosyasini calistir.
Bu dosya `materials` tablosunu ve kullanicinin sadece kendi materyallerini gorebildigi RLS policy'lerini olusturur.

## Gelistirme Plani

1. Sinif ve ogrenci modulu
2. PDF cikti ve paylasim linkleri
3. Materyal duzenleme ve surum gecmisi
4. Kullanim analitigi
5. Kurum paneli ve abonelik sistemi
