#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
edgar_fetch.py
==============
EDGAR (Emissions Database for Global Atmospheric Research) - EDGAR_2025_GHG
Küresel sera gazı (CO2 fosil, CO2 biyo, CH4, N2O, F-gazları, Toplam GHG CO2eq)
verilerini RESMİ JRC kaynağından indirir, açar ve makalede kullanıma hazır
"tidy" (uzun) formata dönüştürür.

Kaynak  : https://edgar.jrc.ec.europa.eu/dataset_ghg2025
Lisans  : CC BY 4.0 (IEA-EDGAR CO2 için CC BY-NC-ND 4.0 - aşağıdaki ATIF bölümüne bak)
Birim   : kton madde / yıl  (Toplam GHG dosyası: kton CO2eq / yıl, IPCC AR5 GWP-100)
Sektör  : IPCC 1996 ve 2006 kodları

Gereksinimler:
    pip install pandas requests openpyxl pyarrow

Kullanım (komut satırı):
    python edgar_fetch.py                      # tüm göstergeleri indir + tidy CSV üret
    python edgar_fetch.py --country TUR        # sadece Türkiye
    python edgar_fetch.py --substances CO2 CH4 # belirli gazlar
    python edgar_fetch.py --national-only      # sektör kırılımını topla (ülke-yıl)

Kullanım (kod içinden):
    from edgar_fetch import get_edgar, BASE
    df = get_edgar(["CO2", "CH4", "N2O"], country="TUR")
"""

from __future__ import annotations

import argparse
import io
import zipfile
from pathlib import Path

import pandas as pd
import requests

# --------------------------------------------------------------------------- #
# 1) Veri seti tanımları
# --------------------------------------------------------------------------- #
BASE = "https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/EDGAR/datasets/EDGAR_2025_GHG"

# Anahtar -> (zip dosya adı, okunabilir etiket, birim)
DATASETS: dict[str, tuple[str, str, str]] = {
    "CO2":      ("IEA_EDGAR_CO2_1970_2024.zip",  "Fosil CO2 (IEA-EDGAR)", "kt CO2/yr"),
    "CO2bio":   ("EDGAR_CO2bio_1970_2024.zip",   "Biyojenik CO2",         "kt CO2/yr"),
    "CH4":      ("EDGAR_CH4_1970_2024.zip",      "Metan (CH4)",           "kt CH4/yr"),
    "N2O":      ("EDGAR_N2O_1970_2024.zip",      "Diazot monoksit (N2O)", "kt N2O/yr"),
    "F-gases":  ("EDGAR_F-gases_1990_2024.zip",  "Florlu gazlar",         "kt/yr"),
    "GHG":      ("EDGAR_AR5_GHG_1970_2024.zip",  "Toplam GHG (CO2eq)",    "kt CO2eq/yr"),
}

CACHE_DIR = Path("edgar_cache")          # indirilen ham zip/xlsx burada saklanır
OUTPUT_DIR = Path("edgar_output")        # üretilen CSV/parquet burada


# --------------------------------------------------------------------------- #
# 2) İndirme + ZIP'ten xlsx çıkarma (yerel önbellekli)
# --------------------------------------------------------------------------- #
def _download(substance: str) -> Path:
    """İlgili gazın zip'ini indirir ve içindeki .xlsx'i diske açar; xlsx yolunu döndürür."""
    zip_name, label, _ = DATASETS[substance]
    CACHE_DIR.mkdir(exist_ok=True)

    # Önbellekte açılmış xlsx var mı?
    existing = list(CACHE_DIR.glob(f"{Path(zip_name).stem}*.xlsx"))
    if existing:
        return existing[0]

    url = f"{BASE}/{zip_name}"
    print(f"[indiriliyor] {label}: {url}")
    resp = requests.get(url, timeout=180)
    resp.raise_for_status()

    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        xlsx_names = [n for n in zf.namelist() if n.lower().endswith(".xlsx")]
        if not xlsx_names:
            raise RuntimeError(f"{zip_name} içinde .xlsx bulunamadı: {zf.namelist()}")
        zf.extract(xlsx_names[0], CACHE_DIR)
        out = CACHE_DIR / xlsx_names[0]
        # Düz dosya adına taşı (alt klasör varsa)
        if out.parent != CACHE_DIR:
            target = CACHE_DIR / Path(xlsx_names[0]).name
            out.replace(target)
            out = target
        print(f"[açıldı]      {out}")
        return out


# --------------------------------------------------------------------------- #
# 3) EDGAR xlsx -> tidy DataFrame
#    EDGAR booklet'lerinde gerçek tablo başlığı ilk birkaç meta satırın altındadır.
#    Başlık satırını otomatik tespit ederek formata bağımlılığı azaltıyoruz.
# --------------------------------------------------------------------------- #
def _find_data_sheet_and_header(xlsx_path: Path) -> tuple[str, int]:
    """Sektör+ülke kırılımı içeren sayfayı ve başlık satırı indeksini bulur."""
    xls = pd.ExcelFile(xlsx_path, engine="openpyxl")

    # Tercih sırası: sektör kodu içeren sayfalar
    preferred = [s for s in xls.sheet_names
                 if any(k in s.upper() for k in ("IPCC", "TOTALS"))]
    candidates = preferred + [s for s in xls.sheet_names if s not in preferred]

    for sheet in candidates:
        raw = pd.read_excel(xlsx_path, sheet_name=sheet, header=None,
                            nrows=20, engine="openpyxl")
        for i in range(len(raw)):
            row_vals = raw.iloc[i].astype(str).str.strip()
            # Başlık satırında bu sütun adları bulunur
            if row_vals.str.contains("Country_code_A3", case=False).any() or \
               row_vals.str.fullmatch(r"Y_\d{4}").any():
                return sheet, i
    raise RuntimeError(f"{xlsx_path.name}: veri başlığı tespit edilemedi.")


def read_edgar_xlsx(xlsx_path: Path, substance: str) -> pd.DataFrame:
    """Bir EDGAR xlsx'i okur ve uzun (tidy) formatta DataFrame döndürür."""
    sheet, header_row = _find_data_sheet_and_header(xlsx_path)
    df = pd.read_excel(xlsx_path, sheet_name=sheet, header=header_row,
                       engine="openpyxl")
    df.columns = [str(c).strip() for c in df.columns]

    # Yıl sütunları: "Y_1970" ... "Y_2024"
    year_cols = [c for c in df.columns if c.startswith("Y_") and c[2:].isdigit()]
    id_cols = [c for c in df.columns if c not in year_cols]

    long_df = df.melt(id_vars=id_cols, value_vars=year_cols,
                      var_name="year", value_name="emission")
    long_df["year"] = long_df["year"].str.replace("Y_", "", regex=False).astype(int)
    long_df["emission"] = pd.to_numeric(long_df["emission"], errors="coerce")
    long_df["substance"] = substance
    long_df["unit"] = DATASETS[substance][2]

    # Sık kullanılan sütunları standart adlara getir (varsa)
    rename = {
        "Country_code_A3": "iso3",
        "Name": "country",
        "ipcc_code_2006_for_standard_report": "ipcc2006_code",
        "ipcc_code_2006_for_standard_report_name": "sector",
        "fossil_bio": "fossil_bio",
    }
    long_df = long_df.rename(columns={k: v for k, v in rename.items()
                                      if k in long_df.columns})
    return long_df


# --------------------------------------------------------------------------- #
# 4) Ana fonksiyon
# --------------------------------------------------------------------------- #
def get_edgar(substances: list[str] | None = None,
              country: str | None = None,
              national_only: bool = False) -> pd.DataFrame:
    """
    EDGAR_2025_GHG verisini indirir ve birleştirilmiş tidy DataFrame döndürür.

    substances    : ["CO2", "CO2bio", "CH4", "N2O", "F-gases", "GHG"] alt kümesi
    country       : ISO3 ülke kodu (ör. "TUR"); None ise tüm ülkeler
    national_only : True ise sektör kırılımını toplayıp ülke-yıl bazına indirger
    """
    substances = substances or list(DATASETS.keys())
    frames = []
    for s in substances:
        if s not in DATASETS:
            raise ValueError(f"Bilinmeyen gösterge: {s}. Seçenekler: {list(DATASETS)}")
        xlsx = _download(s)
        frames.append(read_edgar_xlsx(xlsx, s))

    df = pd.concat(frames, ignore_index=True)

    if country:
        df = df[df.get("iso3", pd.Series(dtype=str)) == country.upper()].copy()

    if national_only:
        keys = [c for c in ("iso3", "country", "substance", "unit", "year")
                if c in df.columns]
        df = (df.groupby(keys, as_index=False)["emission"]
                .sum()
                .sort_values(keys))
    return df.reset_index(drop=True)


EXCEL_ROW_LIMIT = 1_048_576  # Excel'in tek sayfadaki maksimum satır sayısı


def to_wide(long_df: pd.DataFrame) -> pd.DataFrame:
    """Uzun (tidy) tabloyu yıllar sütun olacak şekilde GENİŞ formata çevirir.
    Böylece satır sayısı (ülke×sektör×gaz) seviyesine düşer ve Excel'e sığar."""
    index_cols = [c for c in ("iso3", "country", "substance", "unit",
                              "sector", "ipcc2006_code", "fossil_bio")
                  if c in long_df.columns]
    wide = (long_df.pivot_table(index=index_cols, columns="year",
                                values="emission", aggfunc="sum")
                   .reset_index())
    wide.columns = [f"Y_{c}" if isinstance(c, int) else c for c in wide.columns]
    return wide


def _save_excel_safe(df: pd.DataFrame, base_path: Path) -> None:
    """Excel satır sınırını aşmayacak biçimde kaydeder; aşıyorsa gaz başına böler."""
    if len(df) <= EXCEL_ROW_LIMIT:
        df.to_excel(base_path.with_suffix(".xlsx"), index=False)
        print(f"[kaydedildi] {base_path.with_suffix('.xlsx')}  ({len(df):,} satır)")
        return
    print(f"[uyarı] {len(df):,} satır Excel sınırını ({EXCEL_ROW_LIMIT:,}) aşıyor; "
          f"gaz başına ayrı dosyalara bölünüyor.")
    for sub, part in df.groupby("substance"):
        out = base_path.with_name(f"{base_path.stem}_{sub}.xlsx")
        part.to_excel(out, index=False)
        print(f"[kaydedildi] {out}  ({len(part):,} satır)")


# --------------------------------------------------------------------------- #
# 5) Komut satırı arayüzü
# --------------------------------------------------------------------------- #
def main() -> None:
    p = argparse.ArgumentParser(description="EDGAR_2025_GHG verisini çek ve tidy CSV üret.")
    p.add_argument("--substances", nargs="+", default=list(DATASETS.keys()),
                   help=f"Göstergeler: {list(DATASETS.keys())}")
    p.add_argument("--country", default=None, help="ISO3 ülke kodu (ör. TUR)")
    p.add_argument("--national-only", action="store_true",
                   help="Sektörleri toplayıp ülke-yıl bazına indirge")
    p.add_argument("--parquet", action="store_true", help="Ayrıca .parquet kaydet")
    p.add_argument("--wide", action="store_true",
                   help="Yılları sütun yapan GENİŞ format (Excel'e sığar)")
    p.add_argument("--excel", action="store_true",
                   help="Excel-uyumlu .xlsx yaz (sınırı aşarsa gaz başına böler)")
    args = p.parse_args()

    df = get_edgar(args.substances, args.country, args.national_only)
    if args.wide:
        df = to_wide(df)

    OUTPUT_DIR.mkdir(exist_ok=True)
    tag = (args.country or "ALL") + ("_national" if args.national_only else "") \
          + ("_wide" if args.wide else "")
    csv_path = OUTPUT_DIR / f"edgar_2025_ghg_{tag}.csv"
    df.to_csv(csv_path, index=False)
    print(f"\n[kaydedildi] {csv_path}  ({len(df):,} satır)")

    # CSV her zaman yazılır (sınırsız); ancak Excel ile açılacaksa uyar.
    if not args.excel and len(df) > EXCEL_ROW_LIMIT:
        print(f"[uyarı] {len(df):,} satır Excel sınırını ({EXCEL_ROW_LIMIT:,}) aşıyor. "
              f"Excel ile açacaksan --wide veya --national-only veya --country kullan, "
              f"ya da pandas ile çalış.")

    if args.excel:
        _save_excel_safe(df, csv_path)

    if args.parquet:
        pq = csv_path.with_suffix(".parquet")
        df.to_parquet(pq, index=False)
        print(f"[kaydedildi] {pq}")

    # Hızlı kontrol
    with pd.option_context("display.max_columns", None, "display.width", 160):
        print("\n--- Önizleme ---")
        print(df.head(10))


if __name__ == "__main__":
    main()
