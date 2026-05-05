# Fikir Reaktörü

Fikir Reaktörü, sıfırdan proje yapmayı öğrenmek için hazırlanmış tarayıcıda çalışan bir mini uygulamadır.

Kullanıcı bir konu, hedef kitle, zorluk ve uygulama tarzı seçer; uygulama buna göre proje fikri, özellik listesi, MVP görevleri, README taslağı ve paylaşılabilir link üretir.

## Özellikler

- Proje fikri üretme
- 3 alternatif üretip karşılaştırma
- MVP görev panosu ve ilerleme yüzdesi
- Kayıtlı fikirler, favori, silme ve geri alma
- Kayıtlarda arama ve favori filtresi
- JSON dışa/içe aktar
- README taslağı kopyalama ve önizleme
- Paylaşılabilir URL state
- Öğrenme modu ve mini quiz
- Açık/koyu tema
- Ctrl+K komut paleti
- Toast bildirimleri

## Yerelde Çalıştırma

Repo kökünde:

```powershell
node tools\static-root-server.cjs
```

Sonra tarayıcıda aç:

```text
http://127.0.0.1:4175/fikir-reaktoru/
```

## Yayın

GitHub Pages workflow'u bu klasörü şu adrese yayınlar:

```text
https://ibrahimguney.github.io/fikir-reaktoru/
```

## Dosyalar

```text
fikir-reaktoru/
  index.html
  styles.css
  app.js
  ADIM_ADIM.md
  CHANGELOG.md
  README.md
```

## Öğrenme Amacı

Bu proje özellikle şu kavramları öğretir:

- HTML semantiği
- CSS grid, responsive tasarım ve tema değişkenleri
- JavaScript state yönetimi
- localStorage
- URLSearchParams
- event delegation
- form doğrulama
- import/export
- türetilmiş dashboard metrikleri
