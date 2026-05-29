# Karbon Emisyonu Panel Analizi — Uçtan Uca Pipeline

Bu paket, küresel sera gazı emisyonlarını bağımlı değişken alan bir **ülke × yıl
panel** veri seti kurar ve üzerinde **panel ekonometrisi**, **çok değişkenli
istatistik** ve **derin öğrenme** uygular; ardından **makaleye hazır tablo ve
şekilleri** üretir. Tüm zincir tek komutla, internet olmadan çalıştırılabilir.

---

## 1. Kurulum

```bash
python -m venv .venv && source .venv/bin/activate   # (Windows: .venv\Scripts\activate)
pip install -r requirements.txt
```

`torch` (LSTM) ve `pydynpd` (sistem-GMM) opsiyoneldir. Kurmazsan ilgili adımları
`--no-dl` / `--no-gmm` ile atla.

> **pydynpd notu:** Bu paket NumPy 2.x ile en uyumludur; `pydynpd` (sistem-GMM)
> ise NumPy < 2 ile sorunsuz çalışır. Sistem-GMM kullanacaksan `pip install "numpy<2"`
> önerilir. Çalışmazsa Anderson-Hsiao ve CCEMG dinamik/heterojen alternatifleri
> zaten devrededir.

---

## 2. Hızlı başlangıç (çevrimdışı, tek komut)

```bash
python run_all.py            # torch + pydynpd kuruluysa tam zincir
python run_all.py --no-gmm   # sistem-GMM olmadan
python run_all.py --no-dl --no-gmm
```

Bu komut sırasıyla: eksik veri temizliği → ekonometri + LSTM → tablolar → şekiller.
Çıktılar `data/analysis_output/` ve `data/figures/` altına yazılır.

---

## 3. Pipeline ve betikler

```
   [EDGAR / OWID / World Bank]
            │  (veri çekme)
   edgar_fetch.py · build_panel.py
            ▼
        data/panel.csv          ← pakette HAZIR gelir
            │
   handle_missing.py            ← eksik veri teşhisi + işleme
            ▼
     data/panel_clean.csv
            │
   ┌────────┼─────────────────────────────┐
   ▼        ▼                              ▼
analysis_pipeline_full.py   make_report.py            make_figures.py
(ekonometri + LSTM)         (LaTeX/Word tablo)        (3 makale şekli)
```

| Betik | İşlev | Tipik komut |
|------|-------|-------------|
| `edgar_fetch.py` | EDGAR_2025_GHG (CO2/CH4/N2O/F-gaz) indir | `python edgar_fetch.py --country TUR` |
| `csv_to_excel_safe.py` | CSV'yi Excel'in tarihe çevirmesini önleyen .xlsx'e dönüştür | `python csv_to_excel_safe.py data/*.csv` |
| `build_panel.py` | OWID + World Bank + EDGAR → ülke-yıl paneli | `python build_panel.py --owid-dir data/raw` |
| `handle_missing.py` | Eksik veri teşhisi + ülke-içi interpolasyon | `python handle_missing.py data/panel.csv` |
| `analysis_pipeline_full.py` | CD, birim kök, VIF, Pooled/FE/RE+Hausman (kümelenmiş & Driscoll-Kraay), Anderson-Hsiao, sistem-GMM, MG/CCEMG, LSTM | `python analysis_pipeline_full.py data/panel_clean.csv` |
| `make_report.py` | Tahminci karşılaştırma + tanı tabloları (LaTeX & Word) | `python make_report.py data/panel_clean.csv` |
| `make_figures.py` | EKC eğrisi, forest plot, CCEMG heterojenliği | `python make_figures.py data/panel_clean.csv --highlight TUR` |

> **Önemli:** Betikleri **paket kökünden** çalıştır (`make_report.py` ve
> `make_figures.py`, `analysis_pipeline_full.py` modülünü içe aktarır; aynı klasörde
> olmaları gerekir).

---

## 4. Veriyi sıfırdan yeniden üretmek

Pakette `data/panel.csv` ve `data/panel_clean.csv` hazır gelir. Sıfırdan üretmek için:

```bash
# Çevrimdışı (yerel OWID anlık görüntüsüyle), World Bank olmadan:
python build_panel.py --owid-dir data/raw --no-wb

# World Bank göstergeleriyle (urban, ticaret, FDI, finansal gelişme...) — internet gerekir:
python build_panel.py --owid-dir data/raw
```

`data/raw/` klasörü OWID CO2 ve enerji verisinin anlık görüntüsünü içerir. Güncel
veri için `--owid-dir` olmadan çalıştır (GitHub'dan canlı indirir).

---

## 5. Değişkenler (özet)

**Bağımlı:** `co2_total_mt` (toplam CO2), `co2_pc` / `ln_co2_pc` (kişi başı),
`ghg_total_mt` (toplam GHG), `co2_cons_mt` (tüketim-bazlı).

**Açıklayıcı (STIRPAT/EKC):** kişi başı GSYİH ve karesi (EKC ters-U), kişi başı
enerji, enerji yoğunluğu, yenilenebilir payı; World Bank katmanıyla: kentleşme,
ticari açıklık, DYY, sanayi payı, finansal gelişme, Ar-Ge, beşeri sermaye.

Tam liste: `data/data_dictionary.csv`.

---

## 6. Metodolojik notlar (makale için)

- **EKC için mean-centering:** Gelir, karesi alınmadan önce ortalamadan
  arındırılır; bu, gelir ile karesi arasındaki yapay çoklu doğrusal bağlantıyı
  (VIF ~214 → ~1) ortadan kaldırır. Dönüm noktası merkezlenmiş ölçekte
  `-b1/(2·b2)` ile bulunup gelir ortalaması eklenerek seviyeye çevrilir.
- **Yatay kesit bağımlılığı:** Pesaran CD anlamlıysa (genelde öyledir) çıkarımı
  Driscoll-Kraay standart hatalarına ve **CCEMG** tahmincisine dayandır.
- **Dinamik panel:** Gecikmeli bağımlı değişken anlamlıysa (kalıcılık) sistem-GMM
  (Hansen p>0.10 ve AR(2) p>0.10 raporlanmalı) veya Anderson-Hsiao kullan.
- **Eksik veri:** Bağımlı değişken asla impute edilmez; doldurma ülke-içi ve
  sınırlı boşluk için yapılır; `var__miss` bayrakları şeffaflık sağlar. Sonuçları
  "impute edilmiş vs yalnızca gözlenen" ile sağlamlık testine tabi tut.
- **Derin öğrenme sızıntısı:** Ölçekleyici ve eğitim yalnızca bölme yılına kadar
  olan veriyle yapılır; hiperparametre seçimi için test setini değil ayrı bir
  doğrulama penceresi kullan. LSTM hedefi log ölçeğindedir; yorumda `exp` ile
  seviyeye dön.
- **Ülke-bazlı eğimler (Şekil 3) keşifseldir:** kısa serili ülkelerde gürültülü;
  tekil değerlerden çok dağılıma odaklan.

---

## 7. Atıf ve lisans

- **EDGAR:** Crippa, M. ve diğ. (2025), *GHG emissions of all world countries —
  2025 Report*, Publications Office of the EU, doi:10.2760/9816914 (JRC143227).
  Veri CC BY 4.0; **IEA-EDGAR CO2 bileşeni CC BY-NC-ND 4.0** (ticari kullanım için
  IEA izni gerekir).
- **Our World in Data** (CO2 & Energy): CC BY 4.0.
- **World Bank WDI:** CC BY 4.0.

---

## 8. LaTeX/Word çıktıları

`make_report.py` hem `regression_table.tex` (booktabs + threeparttable) hem
`regression_table.docx` üretir. LaTeX'i Türkçe karakterler için **XeLaTeX** veya
**LuaLaTeX** ile derlemen önerilir (`pdflatex` de çalışır; betik ρ, χ² gibi özel
karakterleri math moduna çevirir).
