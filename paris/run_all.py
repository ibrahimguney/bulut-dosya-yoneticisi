#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
run_all.py — Tüm analiz zincirini tek komutla çalıştırır (ÇEVRİMDIŞI).

Başlangıç noktası: data/panel.csv (pakette hazır gelir).
Adımlar:
  1) handle_missing.py     -> data/panel_clean.csv
  2) analysis_pipeline_full.py (ekonometri + LSTM)  -> konsol + data/analysis_output/
  3) make_report.py        -> data/analysis_output/regression_table.{tex,docx,csv}
  4) make_figures.py       -> data/figures/*.png|pdf

Ham veriden (OWID) yeniden üretmek için (internet GEREKMEZ, yerel anlık görüntü):
    python build_panel.py --owid-dir data/raw --no-wb        # WB için internet gerekir

Kullanım:
    python run_all.py
    python run_all.py --no-dl     # LSTM'i atla (torch kurulu değilse)
"""
import argparse, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PY = sys.executable


def step(title, cmd):
    print("\n" + "=" * 70 + f"\n>> {title}\n" + "=" * 70)
    r = subprocess.run([PY] + cmd, cwd=ROOT)
    if r.returncode != 0:
        print(f"[UYARI] '{title}' sıfırdan farklı kodla bitti ({r.returncode}).")
    return r.returncode


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-dl", action="store_true", help="LSTM adımını atla")
    ap.add_argument("--no-gmm", action="store_true", help="Sistem-GMM'i atla")
    a = ap.parse_args()

    panel = "data/panel.csv"
    clean = "data/panel_clean.csv"
    if not (ROOT / panel).exists():
        sys.exit(f"Bulunamadı: {panel}. Paketle gelen veriyi silmeyin "
                 f"ya da önce build_panel.py ile üretin.")

    step("1/4  Eksik veri temizliği", ["handle_missing.py", panel,
         "--dep", "co2_total_mt", "--max-gap", "3", "--min-country-years", "20"])

    flags = []
    if a.no_dl: flags.append("--no-dl")
    if a.no_gmm: flags.append("--no-gmm")
    step("2/4  Ekonometri + LSTM", ["analysis_pipeline_full.py", clean,
         "--dep", "ln_co2_pc"] + flags)

    step("3/4  Makale tabloları (LaTeX/Word)", ["make_report.py", clean,
         "--dep", "ln_co2_pc"])

    step("4/4  Şekiller", ["make_figures.py", clean,
         "--dep", "ln_co2_pc", "--highlight", "TUR"])

    print("\nTAMAM. Çıktılar: data/analysis_output/  ve  data/figures/")


if __name__ == "__main__":
    main()
