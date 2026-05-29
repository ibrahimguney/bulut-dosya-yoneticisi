#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
handle_missing.py
=================
Ülke × yıl panelinde EKSİK VERİYİ teşhis eder ve metodolojik olarak savunulabilir
biçimde işler. Çıktı; panel ekonometrisi, çok değişkenli istatistik ve derin
öğrenme için kullanıma hazırdır.

İlkeler (önemli):
  - BAĞIMLI değişken (CO2) ASLA doldurulmaz; eksikse o satır düşülür. (Sonucu
    impute etmek tahmini geçersiz kılar.)
  - Boşluklar ülke-İÇİ, zaman boyunca interpolasyonla doldurulur — ülkeler ARASI
    DEĞİL. Yalnızca seri içindeki ARA boşluklar (uçlar değil), sınırlı uzunlukta.
  - Tamamen boş seriler (bir ülkede o değişken hiç yok) interpolasyonla
    doldurulamaz; ya değişken ya ülke örneklemden çıkarılır.
  - İsteğe bağlı "eksiklik bayrağı" (var__miss) kolonları eklenir: hem şeffaflık
    hem de derin öğrenme modeline bilgi verir.
  - Derin öğrenmede impute İŞLEMİ yalnızca EĞİTİM bölümünde fit edilmeli (sızıntı
    önleme). Bu araç tüm paneli birlikte işler; sıkı çalışmada bölmeden sonra uygula.

Kurulum:
    pip install pandas numpy openpyxl

Kullanım:
    python handle_missing.py panel_output/panel.csv                # teşhis + temizle
    python handle_missing.py panel.csv --dep co2_total_mt
    python handle_missing.py panel.csv --drop-var-thresh 0.4 --max-gap 3
    python handle_missing.py panel.csv --min-country-years 20 --balanced
    python handle_missing.py panel.csv --diagnose-only               # sadece rapor
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

ID_COLS = ["iso3", "country", "year"]
DERIVED_PREFIX = ("ln_",)
DERIVED_SUFFIX = ("_sq",)


# --------------------------------------------------------------------------- #
# Teşhis
# --------------------------------------------------------------------------- #
def diagnose(df: pd.DataFrame, dep: str, out: Path) -> None:
    var_cols = [c for c in df.columns if c not in ID_COLS]
    n_country = df["iso3"].nunique()
    n_year = df["year"].nunique()

    # Değişken bazlı eksiklik + tamamen-boş ülke sayısı
    rows = []
    for c in var_cols:
        miss = df[c].isna().mean() * 100
        fully_empty = df.groupby("iso3")[c].apply(lambda s: s.notna().sum() == 0).sum()
        rows.append({"variable": c, "missing_pct": round(miss, 1),
                     "countries_fully_empty": int(fully_empty)})
    vrep = pd.DataFrame(rows).sort_values("missing_pct", ascending=False)
    vrep.to_csv(out / "diag_variables.csv", index=False)

    # Ülke bazlı kapsama (kaç yıl bağımlı değişken gözlemi var)
    crep = (df.groupby("iso3")[dep].apply(lambda s: s.notna().sum())
              .rename("dep_obs_years").reset_index()
              .sort_values("dep_obs_years"))
    crep.to_csv(out / "diag_countries.csv", index=False)

    print(f"[teşhis] {n_country} ülke × {n_year} yıl | bağımlı: {dep}")
    print("  En çok eksik 8 değişken (%):")
    print(vrep.head(8).to_string(index=False))
    print(f"  -> Raporlar: {out/'diag_variables.csv'}, {out/'diag_countries.csv'}")


# --------------------------------------------------------------------------- #
# Temizleme / işleme
# --------------------------------------------------------------------------- #
def _explanatory_cols(df: pd.DataFrame, dep: str) -> list[str]:
    skip = set(ID_COLS) | {dep}
    return [c for c in df.columns
            if c not in skip and pd.api.types.is_numeric_dtype(df[c])
            and not c.endswith("__miss")]


def _recompute_derived(df: pd.DataFrame) -> pd.DataFrame:
    pairs = {"ln_co2_pc": "co2_pc", "ln_energy_pc": "energy_pc",
             "ln_gdp_pc": "gdp_pc_ppp", "ln_pop": "pop_wb"}
    for ln, base in pairs.items():
        if ln in df.columns and base in df.columns:
            df[ln] = np.log(df[base].where(df[base] > 0))
    if "ln_gdp_pc_sq" in df.columns and "ln_gdp_pc" in df.columns:
        df["ln_gdp_pc_sq"] = df["ln_gdp_pc"] ** 2
    return df


def clean(df: pd.DataFrame, dep: str, drop_var_thresh: float, max_gap: int,
          min_country_years: int, add_flags: bool, balanced: bool) -> pd.DataFrame:
    df = df.sort_values(["iso3", "year"]).copy()

    # Türetilmiş kolonları geçici çıkar (temizlik sonrası yeniden hesaplanır)
    derived = [c for c in df.columns
               if c.startswith(DERIVED_PREFIX) or c.endswith(DERIVED_SUFFIX)]
    df = df.drop(columns=derived)

    # 1) Bağımlı değişken eksikse satırı düş (ASLA impute etme)
    before = len(df)
    df = df[df[dep].notna()].copy()
    print(f"[1] Bağımlı '{dep}' eksik {before - len(df):,} satır düşüldü.")

    # 2) Çok eksik açıklayıcı değişkenleri çıkar
    expl = _explanatory_cols(df, dep)
    drop_vars = [c for c in expl if df[c].isna().mean() > drop_var_thresh]
    df = df.drop(columns=drop_vars)
    print(f"[2] >{drop_var_thresh:.0%} eksik {len(drop_vars)} değişken çıkarıldı: {drop_vars}")

    # 3) Eksiklik bayrakları (impute ÖNCESİ orijinal eksikliği kaydet)
    expl = _explanatory_cols(df, dep)
    if add_flags:
        for c in expl:
            df[f"{c}__miss"] = df[c].isna().astype(int)

    # 4) Ülke-içi zaman interpolasyonu (yalnızca ara boşluklar, sınırlı)
    for c in expl:
        df[c] = (df.groupby("iso3")[c]
                   .transform(lambda s: s.interpolate(method="linear",
                                                       limit=max_gap,
                                                       limit_area="inside")))
    print(f"[4] {len(expl)} açıklayıcı değişkende ülke-içi interpolasyon "
          f"(max ardışık boşluk={max_gap}).")

    # 5) Yetersiz kapsamlı ülkeleri çıkar
    cov = df.groupby("iso3")[dep].transform("size")
    kept = df[cov >= min_country_years].copy()
    print(f"[5] <{min_country_years} yıllık {df['iso3'].nunique()-kept['iso3'].nunique()} "
          f"ülke çıkarıldı -> {kept['iso3'].nunique()} ülke.")
    df = kept

    # 6) Türetilmiş değişkenleri yeniden hesapla
    for d in derived:
        if d not in df.columns:
            df[d] = np.nan
    df = _recompute_derived(df)

    # 7) (Opsiyonel) dengeli panel: tüm açıklayıcılarda tam gözlemli ülke×yıl
    if balanced:
        model_cols = _explanatory_cols(df, dep) + [dep]
        model_cols = [c for c in model_cols if not c.endswith("__miss")]
        yrs = df["year"].nunique()
        full = (df.dropna(subset=model_cols).groupby("iso3")["year"].nunique()
                  .pipe(lambda s: s[s == yrs].index))
        before_n = df["iso3"].nunique()
        df = df[df["iso3"].isin(full)].copy()
        print(f"[7] Dengeli panel: {before_n} -> {df['iso3'].nunique()} ülke "
              f"(tüm değişkenlerde {yrs} yıl tam).")

    return df.reset_index(drop=True)


# --------------------------------------------------------------------------- #
def main() -> None:
    ap = argparse.ArgumentParser(description="Panelde eksik veri teşhisi ve işleme.")
    ap.add_argument("csv", help="Girdi panel CSV")
    ap.add_argument("--dep", default="co2_total_mt", help="Bağımlı değişken adı")
    ap.add_argument("--drop-var-thresh", type=float, default=0.5,
                    help="Bu orandan fazla eksik değişkeni çıkar (vars., 0.5)")
    ap.add_argument("--max-gap", type=int, default=3,
                    help="İnterpolasyonla doldurulacak max ardışık boşluk (vars., 3)")
    ap.add_argument("--min-country-years", type=int, default=15,
                    help="Bir ülkeyi tutmak için min yıl sayısı (vars., 15)")
    ap.add_argument("--no-flags", action="store_true", help="Eksiklik bayrağı ekleme")
    ap.add_argument("--balanced", action="store_true", help="Dengeli panel üret")
    ap.add_argument("--diagnose-only", action="store_true", help="Sadece teşhis raporu")
    args = ap.parse_args()

    src = Path(args.csv)
    out = src.parent
    df = pd.read_csv(src)
    if args.dep not in df.columns:
        raise SystemExit(f"Bağımlı değişken '{args.dep}' tabloda yok. "
                         f"Kolonlar: {list(df.columns)}")

    diagnose(df, args.dep, out)
    if args.diagnose_only:
        return

    cleaned = clean(df, args.dep, args.drop_var_thresh, args.max_gap,
                    args.min_country_years, not args.no_flags, args.balanced)

    dst = src.with_name(src.stem + "_clean.csv")
    cleaned.to_csv(dst, index=False)
    print(f"\n[bitti] {dst}")
    print(f"  {cleaned['iso3'].nunique()} ülke | {cleaned['year'].min()}-{cleaned['year'].max()}"
          f" | {len(cleaned):,} satır | kalan eksik (%): "
          f"{cleaned.drop(columns=ID_COLS).isna().mean().mul(100).mean():.1f}")


if __name__ == "__main__":
    main()
