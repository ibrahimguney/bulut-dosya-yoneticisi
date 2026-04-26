# Kurulum

Bu sayfa, projeyi bilgisayarınızda çalıştırmak için gereken temel adımları gösterir. Amaç sadece komutları kopyalamak değil, her adımın ne işe yaradığını da öğrenmektir.

## 1. Depoyu bilgisayara indirme

Önce projeyi GitHub'dan bilgisayarımıza alırız:

```bash
git clone https://github.com/ibrahimguney/web-proje.git
```

Ardından proje klasörüne gireriz:

```bash
cd web-proje
```

## 2. Sanal ortam oluşturma

Python projelerinde paketleri düzenli tutmak için sanal ortam kullanılır.

### Windows PowerShell

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### macOS / Linux

```bash
python -m venv .venv
source .venv/bin/activate
```

Sanal ortam aktif olduğunda terminal satırının başında genellikle `(.venv)` görünür.

## 3. Gerekli paketleri yükleme

Projede kullanılan paketler `requirements.txt` dosyasında listelenir.

```bash
pip install -r requirements.txt
```

Bu komut, MkDocs ve diğer gerekli Python paketlerini yükler.

## 4. Paketi geliştirici modunda kurma

Bu proje bir Python paketi yapısı içerdiği için aşağıdaki komutla geliştirici modunda kurulabilir:

```bash
pip install -e .
```

Buradaki `-e` ifadesi **editable** anlamına gelir. Yani kaynak kodda değişiklik yaptığınızda paketi tekrar kurmanız gerekmez.

## 5. Dokümantasyon sitesini yerelde çalıştırma

Web sitesini bilgisayarda test etmek için:

```bash
mkdocs serve
```

Bu komuttan sonra terminal genellikle şu adrese benzer bir bağlantı verir:

```text
http://127.0.0.1:8000/
```

Bu adresi tarayıcıda açarak siteyi yerelde görebilirsiniz.

## 6. GitHub Pages ile yayınlama mantığı

Bu projede dokümantasyon sayfaları `docs/` klasöründedir. Ana dala gönderilen değişikliklerden sonra GitHub Actions otomatik olarak siteyi yayınlayabilir.

Genel akış şöyledir:

```text
Dosyayı düzenle → Commit yap → GitHub'a gönder → GitHub Pages güncellenir
```

## 7. Sık karşılaşılan sorunlar

### `mkdocs` komutu bulunamadı

Önce paketlerin yüklendiğinden emin olun:

```bash
pip install -r requirements.txt
```

### Sanal ortam aktif değil

Windows PowerShell için tekrar çalıştırın:

```powershell
.venv\Scripts\Activate.ps1
```

### Sayfa GitHub Pages üzerinde hemen güncellenmedi

GitHub Actions yayını birkaç dakika sürebilir. Ayrıca tarayıcı önbelleği nedeniyle sayfayı yenilemek gerekebilir.

## Sonraki adım

Kurulum tamamlandıktan sonra [Kullanım](usage.md) sayfasına geçerek projeyi nasıl çalıştıracağımızı inceleyebiliriz.
