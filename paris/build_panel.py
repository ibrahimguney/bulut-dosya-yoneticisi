#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_panel.py
==============
Karbon emisyonu (bağımlı) + sosyoekonomik/enerji açıklayıcı değişkenlerden
oluşan ÜLKE × YIL panel veri seti kurar. Panel ekonometrisi (FE/RE, GMM),
çok değişkenli istatistik (PCA, faktör analizi) ve derin öğrenme (LSTM/MLP)
için doğrudan kullanıma hazır "tidy" çıktı üretir.

Kaynaklar:
  - Our World in Data (OWID): CO2 + Energy        -> GitHub (anahtarsız, ücretsiz)
  - World Bank WDI: sosyoekonomik göstergeler      -> wbgapi (anahtarsız, ücretsiz)
  - (Opsiyonel) EDGAR_2025_GHG: edgar_fetch.py çıktısı
  - (Opsiyonel) Global Footprint Network: API anahtarı gerektirir

Kurulum:
    pip install pandas requests wbgapi pyarrow

Kullanım:
    python build_panel.py                          # 1990-2023, tüm ülkeler
    python build_panel.py --start 1995 --end 2022
    python build_panel.py --balanced               # dengeli panel (tam gözlemli ülkeler)
    python build_panel.py --no-wb                   # sadece OWID (WB API'siz ortamlar)
    python build_panel.py --edgar-csv edgar_output/edgar_2025_ghg_ALL_national.csv

Çıktılar (panel_output/):
    panel.csv / panel.parquet   -> ülke-yıl paneli
    data_dictionary.csv         -> değişken sözlüğü
    missingness_report.csv      -> değişken bazlı eksik veri oranları
"""

from __future__ import annotations

import argparse
import io
import re
from pathlib import Path

import pandas as pd
import requests

OUT = Path("panel_output")

# --------------------------------------------------------------------------- #
# 1) OWID — CO2 ve Enerji (test edilmiş, anahtarsız)
# --------------------------------------------------------------------------- #
OWID_CO2 = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv"
OWID_ENERGY = "https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv"
OWID_DIR = None   # ayarlanırsa OWID CSV'leri internetten değil bu klasörden okunur

OWID_CO2_COLS = {
    "co2": "co2_total_mt",                     # üretim-bazlı toplam CO2 (Mt)
    "co2_per_capita": "co2_pc",                # kişi başı CO2 (t)
    "co2_per_gdp": "co2_intensity_gdp",        # ekonominin karbon yoğunluğu
    "consumption_co2": "co2_cons_mt",          # tüketim-bazlı CO2 (Mt)
    "total_ghg": "ghg_total_mt",               # toplam sera gazı (Mt CO2eq)
    "methane": "ch4_mt",                       # metan (Mt CO2eq)
    "nitrous_oxide": "n2o_mt",                 # diazot monoksit (Mt CO2eq)
    "coal_co2": "co2_coal_mt",
    "oil_co2": "co2_oil_mt",
    "gas_co2": "co2_gas_mt",
    "cement_co2": "co2_cement_mt",
    "population": "population",
    "gdp": "gdp",                              # GDP (uluslararası $, OWID)
    "energy_per_capita": "energy_pc",          # kişi başı birincil enerji (kWh)
}

OWID_ENERGY_COLS = {
    "energy_per_gdp": "energy_intensity",      # enerji/GDP
    "renewables_share_energy": "renew_share",  # yenilenebilir payı (%)
    "fossil_share_energy": "fossil_share",     # fosil payı (%)
    "low_carbon_share_energy": "lowcarbon_share",
    "carbon_intensity_elec": "elec_carbon_int",# elektriğin karbon yoğunluğu
    "electricity_demand_per_capita": "elec_demand_pc",
}


def _download_csv(url: str) -> pd.DataFrame:
    if OWID_DIR:                                   # çevrimdışı: yerel dosyadan oku
        local = Path(OWID_DIR) / Path(url).name
        if local.exists():
            print(f"[yerel]       {local}")
            return pd.read_csv(local)
    print(f"[indiriliyor] {url}")
    r = requests.get(url, timeout=180)
    r.raise_for_status()
    return pd.read_csv(io.BytesIO(r.content))


def _is_country(iso: str) -> bool:
    """Gerçek ülke ISO3 kodu mu? (OWID toplamları OWID_*, boş veya bölge kodlarıdır)"""
    return isinstance(iso, str) and bool(re.fullmatch(r"[A-Z]{3}", iso))


def load_owid_panel() -> pd.DataFrame:
    co2 = _download_csv(OWID_CO2)
    en = _download_csv(OWID_ENERGY)

    co2 = co2[["country", "year", "iso_code", *OWID_CO2_COLS]].rename(columns=OWID_CO2_COLS)
    en = en[["iso_code", "year", *OWID_ENERGY_COLS]].rename(columns=OWID_ENERGY_COLS)

    df = co2.merge(en, on=["iso_code", "year"], how="left")
    df = df[df["iso_code"].apply(_is_country)].copy()
    df = df.rename(columns={"iso_code": "iso3"})
    return df


# --------------------------------------------------------------------------- #
# 2) World Bank WDI — sosyoekonomik açıklayıcılar (anahtarsız)
#    Not: WB API erişimi gereken ortam; --no-wb ile atlanabilir.
# --------------------------------------------------------------------------- #
WB_INDICATORS = {
    "NY.GDP.PCAP.PP.KD": "gdp_pc_ppp",          # kişi başı GDP, PPP sabit 2017$
    "SP.POP.TOTL":       "pop_wb",              # toplam nüfus
    "SP.URB.TOTL.IN.ZS": "urban_pct",           # kentsel nüfus (%)
    "NE.TRD.GNFS.ZS":    "trade_openness",      # ticaret (% GDP)
    "BX.KLT.DINV.WD.GD.ZS": "fdi_pct_gdp",      # DYY net giriş (% GDP)
    "NV.IND.TOTL.ZS":    "industry_pct_gdp",    # sanayi katma değeri (% GDP)
    "NV.IND.MANF.ZS":    "manuf_pct_gdp",       # imalat katma değeri (% GDP)
    "NV.SRV.TOTL.ZS":    "services_pct_gdp",    # hizmetler katma değeri (% GDP)
    "NV.AGR.TOTL.ZS":    "agri_pct_gdp",        # tarım katma değeri (% GDP)
    "FS.AST.PRVT.GD.ZS": "fin_dev_credit",      # özel sektöre kredi (% GDP)
    "NE.GDI.TOTL.ZS":    "capital_form_pct",    # gayrisafi sermaye oluşumu (% GDP)
    "EG.FEC.RNEW.ZS":    "renew_wb_pct",        # yenilenebilir enerji tüketimi (%)
    "GB.XPD.RSDV.GD.ZS": "rd_pct_gdp",          # Ar-Ge harcaması (% GDP)
    "IP.PAT.RESD":       "patents_resident",    # patent başvurusu (yerleşik)
    "SE.TER.ENRR":       "tertiary_enroll",     # yükseköğretim okullaşma (% brüt)
}


def load_wb_panel(start: int, end: int) -> pd.DataFrame:
    import wbgapi as wb  # yalnızca gerektiğinde içe aktar

    print(f"[WB] {len(WB_INDICATORS)} gösterge çekiliyor ({start}-{end}) ...")
    df = wb.data.DataFrame(
        list(WB_INDICATORS),
        economy="all",
        time=range(start, end + 1),
        labels=False,
        columns="series",
        skipBlanks=False,
    ).reset_index()

    # index sütun adları sürümlere göre 'economy'/'time' gelir
    df = df.rename(columns={"economy": "iso3", "time": "year"})
    df["year"] = df["year"].astype(str).str.replace("YR", "", regex=False).astype(int)
    df = df.rename(columns=WB_INDICATORS)

    # Toplam/bölge kümelerini ele (yalnızca gerçek ülkeler)
    countries = {e["id"] for e in wb.economy.list() if not e.get("aggregate", False)}
    df = df[df["iso3"].isin(countries)].copy()
    return df


# --------------------------------------------------------------------------- #
# 3) (Opsiyonel) EDGAR — edgar_fetch.py çıktısı
# --------------------------------------------------------------------------- #
def load_edgar_csv(path: str) -> pd.DataFrame:
    e = pd.read_csv(path)
    # Bağımlı değişken alternatifi: EDGAR CO2/GHG (gaz başına genişlet)
    keep = [c for c in ("iso3", "year", "substance", "emission") if c in e.columns]
    e = e[keep]
    wide = e.pivot_table(index=["iso3", "year"], columns="substance",
                         values="emission", aggfunc="sum").reset_index()
    wide.columns = [f"edgar_{c}" if c not in ("iso3", "year") else c
                    for c in wide.columns]
    return wide


# --------------------------------------------------------------------------- #
# 4) Türetilmiş değişkenler (model için)
# --------------------------------------------------------------------------- #
def add_derived(df: pd.DataFrame) -> pd.DataFrame:
    import numpy as np
    # Kişi başı GDP (OWID gdp / nüfus) — WB PPP yoksa yedek
    if "gdp" in df and "population" in df:
        df["gdp_pc_owid"] = df["gdp"] / df["population"].replace(0, np.nan)

    # EKC için log ve kare terimler
    for base, ln in [("gdp_pc_ppp", "ln_gdp_pc"), ("co2_pc", "ln_co2_pc"),
                     ("energy_pc", "ln_energy_pc"), ("pop_wb", "ln_pop")]:
        if base in df:
            df[ln] = np.log(df[base].where(df[base] > 0))
    if "ln_gdp_pc" in df:
        df["ln_gdp_pc_sq"] = df["ln_gdp_pc"] ** 2   # EKC ters-U terimi
    return df


# --------------------------------------------------------------------------- #
# 5) Yardımcılar
# --------------------------------------------------------------------------- #
def make_balanced(df: pd.DataFrame, core_cols: list[str]) -> pd.DataFrame:
    """Çekirdek değişkenlerde tam gözlemi olan ülkelerle dengeli panel kurar."""
    years = df["year"].nunique()
    ok = (df.dropna(subset=core_cols)
            .groupby("iso3")["year"].nunique()
            .pipe(lambda s: s[s == years].index))
    return df[df["iso3"].isin(ok)].copy()


def write_dictionary(df: pd.DataFrame) -> None:
    desc = {
        "iso3": "Ülke ISO3 kodu", "country": "Ülke adı", "year": "Yıl",
        "co2_total_mt": "Üretim-bazlı toplam CO2 (Mt)",
        "co2_pc": "Kişi başı CO2 (ton)", "co2_intensity_gdp": "CO2 / GDP",
        "co2_cons_mt": "Tüketim-bazlı CO2 (Mt)",
        "ghg_total_mt": "Toplam sera gazı (Mt CO2eq)",
        "ch4_mt": "CH4 (Mt CO2eq)", "n2o_mt": "N2O (Mt CO2eq)",
        "co2_coal_mt": "Kömür CO2 (Mt)", "co2_oil_mt": "Petrol CO2 (Mt)",
        "co2_gas_mt": "Gaz CO2 (Mt)", "co2_cement_mt": "Çimento CO2 (Mt)",
        "population": "Nüfus (OWID)", "gdp": "GDP (OWID, uluslararası $)",
        "energy_pc": "Kişi başı birincil enerji (kWh)",
        "energy_intensity": "Enerji / GDP", "renew_share": "Yenilenebilir payı (%)",
        "fossil_share": "Fosil payı (%)", "lowcarbon_share": "Düşük karbon payı (%)",
        "elec_carbon_int": "Elektrik karbon yoğunluğu", "elec_demand_pc": "Kişi başı elektrik talebi",
        "gdp_pc_ppp": "Kişi başı GDP PPP (sabit 2017$)", "pop_wb": "Nüfus (WB)",
        "urban_pct": "Kentsel nüfus (%)", "trade_openness": "Ticaret (% GDP)",
        "fdi_pct_gdp": "DYY (% GDP)", "industry_pct_gdp": "Sanayi (% GDP)",
        "manuf_pct_gdp": "İmalat (% GDP)", "services_pct_gdp": "Hizmetler (% GDP)",
        "agri_pct_gdp": "Tarım (% GDP)", "fin_dev_credit": "Özel kredi (% GDP)",
        "capital_form_pct": "Sermaye oluşumu (% GDP)", "renew_wb_pct": "Yenilenebilir tüketim (%)",
        "rd_pct_gdp": "Ar-Ge (% GDP)", "patents_resident": "Patent (yerleşik)",
        "tertiary_enroll": "Yükseköğretim okullaşma (%)",
        "gdp_pc_owid": "Kişi başı GDP (OWID)",
        "ln_gdp_pc": "ln(kişi başı GDP)", "ln_gdp_pc_sq": "ln(GDP pc)^2 — EKC",
        "ln_co2_pc": "ln(kişi başı CO2)", "ln_energy_pc": "ln(kişi başı enerji)",
        "ln_pop": "ln(nüfus)",
    }
    rows = [{"variable": c, "description": desc.get(c, ""),
             "non_null": int(df[c].notna().sum()), "dtype": str(df[c].dtype)}
            for c in df.columns]
    pd.DataFrame(rows).to_csv(OUT / "data_dictionary.csv", index=False)


# --------------------------------------------------------------------------- #
# 6) Ana akış
# --------------------------------------------------------------------------- #
def build(start: int, end: int, use_wb: bool, edgar_csv: str | None,
          balanced: bool) -> pd.DataFrame:
    panel = load_owid_panel()
    panel = panel[(panel["year"] >= start) & (panel["year"] <= end)]

    if use_wb:
        try:
            wb = load_wb_panel(start, end)
            panel = panel.merge(wb, on=["iso3", "year"], how="left")
        except Exception as exc:
            print(f"[WB atlandı] {type(exc).__name__}: {exc}\n"
                  f"  -> İnternet/erişim kısıtı olabilir; --no-wb ile OWID-only sürdür.")

    if edgar_csv:
        panel = panel.merge(load_edgar_csv(edgar_csv), on=["iso3", "year"], how="left")

    panel = add_derived(panel)
    panel = panel.sort_values(["iso3", "year"]).reset_index(drop=True)

    if balanced:
        core = [c for c in ("co2_pc", "gdp_pc_ppp", "energy_pc") if c in panel]
        before = panel["iso3"].nunique()
        panel = make_balanced(panel, core)
        print(f"[dengeli panel] {before} -> {panel['iso3'].nunique()} ülke")
    return panel


def main() -> None:
    ap = argparse.ArgumentParser(description="Karbon emisyonu panel veri seti kur.")
    ap.add_argument("--start", type=int, default=1990)
    ap.add_argument("--end", type=int, default=2023)
    ap.add_argument("--no-wb", action="store_true", help="World Bank göstergelerini atla")
    ap.add_argument("--edgar-csv", default=None, help="edgar_fetch.py çıktısı (opsiyonel)")
    ap.add_argument("--balanced", action="store_true", help="Dengeli panel üret")
    ap.add_argument("--owid-dir", default=None,
                    help="OWID CSV'lerini internet yerine bu yerel klasörden oku")
    args = ap.parse_args()

    global OWID_DIR
    OWID_DIR = args.owid_dir

    OUT.mkdir(exist_ok=True)
    panel = build(args.start, args.end, not args.no_wb, args.edgar_csv, args.balanced)

    panel.to_csv(OUT / "panel.csv", index=False)
    try:
        panel.to_parquet(OUT / "panel.parquet", index=False)
    except Exception:
        pass
    write_dictionary(panel)

    miss = (panel.isna().mean().mul(100).round(1)
            .rename("missing_pct").reset_index().rename(columns={"index": "variable"}))
    miss.to_csv(OUT / "missingness_report.csv", index=False)

    print(f"\n[bitti] {OUT/'panel.csv'}")
    print(f"  Ülke: {panel['iso3'].nunique()} | Yıl: {panel['year'].min()}-{panel['year'].max()}"
          f" | Satır: {len(panel):,} | Değişken: {panel.shape[1]}")


if __name__ == "__main__":
    main()
