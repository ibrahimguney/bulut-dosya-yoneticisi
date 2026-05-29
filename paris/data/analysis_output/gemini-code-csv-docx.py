import csv
import pandas as pd
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def csv_to_word_table(csv_dosya_yolu, word_dosya_yolu):
    # 1. CSV dosyasını pandas ile oku
    # Not: Türkçe karakter sorunu yaşamamak için encoding='utf-8' veya 'latin-1' / 'iso-8859-9' seçilebilir.
    try:
        df = pd.read_csv(csv_dosya_yolu, encoding='utf-8')
    except UnicodeDecodeError:
        df = pd.read_csv(csv_dosya_yolu, encoding='iso-8859-9')

    # 2. Yeni bir Word dokümanı oluştur
    doc = Document()
    
    doc.add_heading('CSV Veri Tablosu', level=1)
    doc.add_paragraph('Aşağıdaki tablo CSV dosyasından otomatik olarak aktarılmıştır:')

    # 3. Word tablosunu başlat (Satır sayısı = veri satırları + 1 başlık satırı)
    satir_sayisi = df.shape[0] + 1
    sutun_sayisi = df.shape[1]
    
    table = doc.add_table(rows=satir_sayisi, cols=sutun_sayisi)
    table.style = 'Table Grid'  # Standart çizgili tablo stili

    # 4. Başlık satırını doldur ve biçimlendir
    hdr_cells = table.rows[0].cells
    for i, col_name in enumerate(df.columns):
        hdr_cells[i].text = str(col_name)
        # Başlıkları kalın yapalım
        for paragraph in hdr_cells[i].paragraphs:
            for run in paragraph.runs:
                run.font.bold = True
                run.font.size = Pt(11)

    # 5. Veri satırlarını doldur
    for r_idx, row in df.iterrows():
        row_cells = table.rows[r_idx + 1].cells
        for c_idx, value in enumerate(row):
            # Null/NaN değerleri boşluk olarak yazdır
            if pd.isna(value):
                row_cells[c_idx].text = ""
            else:
                row_cells[c_idx].text = str(value)
                
            # Yazı boyutunu ayarlayalım (Tabloya sığması için)
            for paragraph in row_cells[c_idx].paragraphs:
                for run in paragraph.runs:
                    run.font.size = Pt(10)

    # 6. Belgeyi kaydet
    doc.save(word_dosya_yolu)
    print(f"Başarılı: '{csv_dosya_yolu}' verileri '{word_dosya_yolu}' dosyasına tablo olarak kaydedildi.")

# --- KULLANIM ÖRNEĞİ ---
# Kendi dosya yollarınıza göre buraları değiştirebilirsiniz
csv_input = "results_table.csv"
word_output = "results_table.docx"

# Fonksiyonu çalıştır
csv_to_word_table(csv_input, word_output)