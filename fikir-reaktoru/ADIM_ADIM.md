# Fikir Reaktörü - Adım Adım Proje Notları

Bu proje, sıfırdan küçük ama gerçek bir web uygulaması yapmayı öğretmek için kuruldu.

## 1. Proje fikri

Once tek cumlelik hedef belirledik:

```text
Kullanıcı konu, hedef kitle ve zorluk seçsin; uygulama ona uygulanabilir mini proje planı üretsin.
```

Iyi bir ilk proje fikri su uc soruya cevap verir:

- Kim kullanacak?
- Hangi problemi çözecek?
- İlk ekranda hangi aksiyon yapılacak?

## 2. Dosya yapisi

```text
fikir-reaktoru/
  index.html   -> Sayfanin iskeleti
  styles.css   -> Gorunum ve responsive tasarim
  app.js       -> Form davranisi ve proje uretme mantigi
  ADIM_ADIM.md -> Öğrenme notları
```

Kucuk projelerde bu yapi yeterlidir. Framework kullanmadan HTML, CSS ve JavaScript temeli netlesir.

## 3. HTML mantigi

`index.html` dosyasinda once bolumleri kurduk:

- Header: marka ve navigasyon
- Hero: uygulamanin ne yaptigini anlatan ilk alan
- Form: kullanici girdileri
- Sonuc: uretilen proje fikri
- Sprint plani: ilk yapilacak isler
- Öğrenme alanı: HTML, CSS, JS rollerinin özeti

HTML'in görevi davranış yazmak değil, anlamlı bir iskelet kurmaktır.

## 4. CSS mantigi

`styles.css` dosyasinda su kararlar var:

- `:root` icinde renk degiskenleri
- Grid ile iki kolonlu ana yerlesim
- 8px radius kartlar
- Mobilde tek kolona dusen responsive tasarim
- Okunabilir font boyutlari ve yeterli bosluk

CSS'in görevi sadece güzelleştirmek değil; kullanıcının ekranı rahat okumasını sağlamaktır.

## 5. JavaScript mantigi

`app.js` dosyasinda akisi dort parcaya ayirdik:

1. Kullanıcı seçimlerini oku: `readState`
2. Bu secimlerden fikir uret: `buildIdea`
3. Hazırlık skoru hesapla: `calculateReadiness`
4. Sonucu ekrana bas: `renderProject`

Bu ayrim onemlidir. Her fonksiyonun tek isi olursa proje buyudugunde kodu takip etmek kolaylasir.

## 6. Sonraki gelistirmeler

Bu projeyi buyutmek icin iyi siralama:

1. Fikir kartlarını favorilere ayır.
2. Birden fazla proje fikri üretip karşılaştır.
3. README taslağını ekranda önizleme olarak göster.
4. GitHub Pages workflow'una ekleyip yayına al.

## 7. Ikinci turda eklenenler

Bu turda proje "tek ekran demo" olmaktan biraz daha uygulama gibi davranmaya basladi.

Eklenen özellikler:

- Üretilen fikri `localStorage` ile kaydetme
- Kayıtlı fikirleri kartlar halinde listeleme
- Üretilen projeden README taslağı oluşturup panoya kopyalama
- Ekrandaki sonuc, kayit ve README icin ayni `currentProject` nesnesini kullanma

Buradaki ana ders sudur:

```text
Ayni veriyi tekrar tekrar DOM'dan okumak yerine, uygulamanin durumunu bir JavaScript nesnesinde tut.
```

Bu nesneye genelde `state` denir. Kucuk projelerde bile state mantigini erken ogrenmek, daha sonra React veya benzeri kutuphanelere gecmeyi kolaylastirir.

## 8. Ucuncu turda eklenenler

Bu turda kayitli fikirler uzerinde CRUD mantigini tamamladik:

- Create: `Fikri kaydet`
- Read: Kayıtlı fikirleri kart olarak listeleme
- Update: Favori durumunu degistirme
- Delete: Kayıtlı fikri silme

Ayrıca "Yükle" butonu ile kayıtlı bir fikrin form alanlarına geri dönmesini sağladık.

Buradaki ana teknik `event delegation`:

```text
Her karta ayri ayri click listener eklemek yerine, kartlari saran alana tek listener ekle.
Tıklanan butonun data-action ve data-id değerlerinden ne yapılacağını anla.
```

Bu yöntem dinamik olarak üretilen listelerde çok kullanışlıdır. Listeye sonradan yeni kart eklenince ekstra listener kurmaya gerek kalmaz.

## 9. Dördüncü turda eklenenler

Bu turda README taslağını ekranda önizleme olarak gösterdik.

Eklenen parçalar:

- `README önizle` butonu
- `hidden` ile saklanan önizleme paneli
- Kapatma butonu
- Panel dışına tıklayınca kapatma
- `Escape` tuşu ile kapatma

Buradaki ana ders:

```text
Bir UI parçasını silip yeniden oluşturmak zorunda değilsin.
Onu HTML içinde hazır tutabilir, JavaScript ile hidden durumunu açıp kapatabilirsin.
```

Bu, modal, yan panel, açılır menü ve detay penceresi gibi birçok arayüz davranışının temelidir.

## 10. Beşinci turda eklenenler

Bu turda aynı girdiden üç farklı proje alternatifi ürettik:

- Dashboard
- Oyunlaştırılmış deneyim
- Günlük / takip aracı

Her alternatif ayrı bir kart olarak render ediliyor. Karttaki "Bu fikri seç" düğmesi, o alternatifi ana proje sonucuna taşıyor.

Buradaki ana ders:

```text
Birden fazla benzer öğeyi elle HTML yazmak yerine array içinde tut.
Sonra map ile her öğeyi karta dönüştür.
```

Bu, gerçek uygulamalarda ürün listesi, görev listesi, mesaj listesi, arama sonucu ve kart galerisi gibi birçok alanın temelidir.

## 11. Altıncı turda eklenenler

Bu turda sprint planını etkileşimli bir görev panosuna dönüştürdük.

Eklenenler:

- Plan adımlarından otomatik görev listesi üretme
- Checkbox ile görevi tamamlandı olarak işaretleme
- Tamamlanan görevleri görsel olarak ayırma
- İlerleme yüzdesi ve progress çizgisi
- Yeni proje seçilince görev listesini sıfırlama

Buradaki ana ders:

```text
Bir liste sadece okunmak zorunda değildir.
Her öğeye done gibi küçük bir durum ekleyerek listeyi etkileşimli hale getirebilirsin.
```

Bu mantık yapılacaklar listesi, kurs ilerlemesi, onboarding adımları ve proje takip ekranlarının temelidir.

## 12. Yedinci turda eklenenler

Bu turda kayıtlı fikirleri JSON dosyası olarak dışa aktarma ve tekrar içe aktarma ekledik.

Eklenenler:

- Kayıtlı fikirleri `Blob` ile JSON dosyasına dönüştürme
- Geçici indirme linki oluşturma
- Dosya input ile JSON seçme
- `FileReader` ile dosya içeriğini okuma
- İçe aktarılan veriyi doğrulama ve mevcut kayıtlarla birleştirme

Buradaki ana ders:

```text
Uygulama verisi sadece ekranda kalmak zorunda değildir.
JSON olarak dışa aktarılırsa yedeklenebilir, paylaşılabilir ve tekrar içe alınabilir.
```

Bu mantık ayar yedekleme, proje şablonu taşıma, küçük CRM verisi aktarma ve offline uygulama senaryolarında çok işe yarar.

## 13. Sekizinci turda eklenenler

Bu turda öğrenme modu ekledik.

Eklenenler:

- Header içine `Öğrenme modu` butonu
- Bölümlere `data-tip` açıklamaları
- Body üzerinde `learn-mode` class'ı
- CSS ile açıklama kutularını sadece mod açıkken gösterme
- `aria-pressed` ile butonun açık/kapalı durumunu erişilebilir hale getirme

Buradaki ana ders:

```text
JavaScript her zaman HTML üretmek zorunda değildir.
Bazen sadece class değiştirir; CSS de görünümü buna göre yönetir.
```

Bu yöntem tema değiştirme, yoğun/rahat görünüm, öğretici mod ve admin mod gibi arayüz seçeneklerinde çok kullanılır.

## 14. Dokuzuncu turda eklenenler

Bu turda kayıtlı fikirler için arama ve favori filtresi ekledik.

Eklenenler:

- Arama input'u
- Sadece favorileri gösteren checkbox
- `input` ve `change` event'leri
- Kayıt listesinden ayrı bir görünür liste türetme
- Arama sonucu boşsa özel boş durum mesajı

Buradaki ana ders:

```text
Verinin kendisini değiştirmeden ekranda gösterilen listeyi filtreleyebilirsin.
Asıl kaynak savedIdeas olarak kalır; görünüm getVisibleSavedIdeas ile türetilir.
```

Bu yaklaşım ürün arama, tablo filtresi, görev panosu ve yönetim paneli gibi arayüzlerde çok kullanılır.

## 15. Onuncu turda eklenenler

Bu turda paylaşılabilir proje linki ekledik.

Eklenenler:

- `Paylaşım linki` butonu
- Mevcut form state'ini URL query parametrelerine yazma
- Sayfa açılırken URL parametrelerini okuyup formu doldurma
- Linki panoya kopyalama
- `history.replaceState` ile adres çubuğunu sayfayı yenilemeden güncelleme

Buradaki ana ders:

```text
Bazı state değerleri URL'de taşınabilir.
Böylece aynı ekran yenilenebilir, paylaşılabilir ve geri getirilebilir.
```

Bu mantık arama sayfaları, filtreli ürün listeleri, dashboard görünümleri ve paylaşılabilir rapor linklerinde çok kullanılır.

## 16. On birinci turda eklenenler

Bu turda toast bildirimleri ekledik.

Eklenenler:

- HTML içinde `toastStack` alanı
- Sağ altta görünen geçici bildirim tasarımı
- `setStatus` fonksiyonunu merkezi bildirim noktasına dönüştürme
- İlk sayfa yüklenirken toast göstermeme
- İşlem sonrası bildirimi birkaç saniye sonra otomatik kaldırma

Buradaki ana ders:

```text
Aynı geri bildirim davranışını her yerde tekrar yazma.
Tek bir yardımcı fonksiyon oluştur; kaydetme, silme, import ve paylaşım aynı fonksiyonu kullansın.
```

Bu yaklaşım bildirim, hata mesajı, yükleniyor durumu ve form doğrulama gibi tekrar eden arayüz davranışlarında çok işe yarar.

## 17. On ikinci turda eklenenler

Bu turda öğrenme bölümüne mini quiz ekledik.

Eklenenler:

- Soru listesi için `quizQuestions` array'i
- Geçerli soruyu tutan `quizIndex` state'i
- Seçenekleri `map` ile butonlara dönüştürme
- Doğru ve yanlış cevaba göre sınıf ekleme
- Kısa bekleme sonrası sıradaki soruya geçme

Buradaki ana ders:

```text
Quiz gibi akışlarda hem veri listesi hem de o anki indeks state olarak tutulur.
Ekran her cevap sonrası bu state'e göre yeniden render edilir.
```

Bu mantık anket, onboarding, eğitim modülü, flashcard ve test uygulamalarında sık kullanılır.

## 18. On üçüncü turda eklenenler

Bu turda açık/koyu tema desteği ekledik.

Eklenenler:

- `Koyu tema` butonu
- `dark-theme` class'ı
- CSS değişkenleriyle renkleri toplu değiştirme
- Tema tercihini `localStorage` içine kaydetme
- Sayfa açılınca kayıtlı temayı geri uygulama

Buradaki ana ders:

```text
Tema için her bileşeni tek tek değiştirmek yerine renkleri CSS değişkenlerinde tut.
Body'ye bir class ekleyerek tüm arayüzün renk sistemini değiştirebilirsin.
```

Bu yöntem koyu tema, marka teması, yüksek kontrast modu ve kullanıcı tercihleri için çok kullanılır.

## 19. On dördüncü turda eklenenler

Bu turda komut paleti ekledik.

Eklenenler:

- `Ctrl+K` veya `Cmd+K` ile açılan panel
- Komut arama input'u
- Komutları array içinde tanımlama
- Aramaya göre komut listesini filtreleme
- Seçilen komutun ilgili fonksiyonu çalıştırması
- Escape, dış alana tıklama ve kapatma butonu

Buradaki ana ders:

```text
Uygulamadaki işlemleri sadece butonlara bağlamak zorunda değilsin.
Komutları veri olarak tanımlarsan aynı işlemleri menüden, kısayoldan veya paletten çalıştırabilirsin.
```

Bu desen kod editörleri, dashboardlar, üretkenlik araçları ve admin panellerinde sık kullanılır.

## 20. On beşinci turda eklenenler

Bu turda son silinen fikri geri alma özelliği ekledik.

Eklenenler:

- `Son silineni geri al` butonu
- Silinen son fikri tutan `lastDeletedIdea` değişkeni
- Silme işleminden sonra geri al butonunu aktif etme
- Geri alınca fikri kayıtların başına ekleme
- Geri alma tamamlanınca butonu tekrar pasifleştirme

Buradaki ana ders:

```text
Silme işlemi her zaman geri dönüşsüz olmak zorunda değildir.
Silinen öğeyi kısa süreli bir değişkende tutarak kullanıcıya undo hakkı verebilirsin.
```

Bu yaklaşım not uygulamaları, görev listeleri, CRM kayıtları ve dosya yönetimi ekranlarında kullanıcı güvenini artırır.

## 21. On altıncı turda eklenenler

Bu turda proje özeti paneli ekledik.

Eklenenler:

- Hazırlık skoru kartı
- Görev ilerleme yüzdesi
- Kayıtlı fikir ve favori sayısı
- Üretilen alternatif sayısı
- Arama/favori filtresine göre görünür kayıt sayısı

Buradaki ana ders:

```text
Her veri ekranda ham liste olarak görünmek zorunda değildir.
Mevcut state değerlerinden türetilmiş metrikler hesaplayıp özet kartları oluşturabilirsin.
```

Bu yaklaşım dashboard, CRM, proje takip, eğitim ilerleme ve yönetim paneli ekranlarının temelidir.

## 22. On yedinci turda eklenenler

Bu turda form doğrulama ekledik.

Eklenenler:

- Konu alanı için inline hata mesajı
- `aria-invalid` ve `aria-describedby` ile erişilebilir hata durumu
- Hatalı input için kırmızı border
- Submit sırasında `validateForm` kontrolü
- Kullanıcı tekrar yazınca hatayı temizleme

Buradaki ana ders:

```text
Kullanıcı girdisine güvenme; önce doğrula, sonra işlem yap.
Hata varsa genel alert yerine ilgili alanın yanında net mesaj göster.
```

Bu yaklaşım kayıt formları, arama formları, ödeme ekranları ve admin panellerinde temel bir kullanıcı deneyimi parçasıdır.

## 23. On sekizinci turda eklenenler

Bu turda aynı fikrin tekrar tekrar kaydedilmesini engelledik.

Eklenenler:

- Kayıt öncesi duplicate kontrolü
- Fikir için karşılaştırma anahtarı üreten `ideaKey`
- Liste içinde aynı fikir var mı diye bakan `isDuplicateIdea`
- Tekrar kayıt yerine kullanıcıya açıklayıcı mesaj gösterme

Buradaki ana ders:

```text
Veri eklemeden önce mevcut kayıtlarla çakışıyor mu kontrol et.
Aynı veriyi çoğaltmak yerine kullanıcıya net geri bildirim ver.
```

Bu yaklaşım favori listeleri, CRM kayıtları, ürün sepeti, görev listesi ve import işlemlerinde veri bütünlüğünü korur.

## 24. On dokuzuncu turda eklenenler

Bu turda rastgele ilham konusu ekledik.

Eklenenler:

- Hazır konu havuzu: `inspirationTopics`
- `Rastgele ilham konusu` butonu
- Mevcut konudan farklı konu seçme
- Form alanını JavaScript ile güncelleme
- Yeni konu seçilince fikri otomatik yeniden üretme
- Komut paletine aynı işlemi ekleme

Buradaki ana ders:

```text
Form değerleri sadece kullanıcı yazarak değişmez.
JavaScript de input değerini güncelleyebilir ve ardından aynı render akışını çalıştırabilir.
```

Bu yaklaşım öneri butonları, örnek veri yükleme, demo mod ve hızlı başlangıç ekranlarında çok kullanılır.
