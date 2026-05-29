#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
make_figures.py
===============
Karbon emisyonu panel analizinden MAKALEYE HAZIR grafikler üretir:

  Şekil 1  EKC eğrisi + dönüm noktası  (gelir-emisyon ters-U, FE katsayıları)
  Şekil 2  Tahminci karşılaştırması    (forest plot: katsayı ± %95 GA)
  Şekil 3  CCEMG ülke-bazlı eğim       (heterojenlik / caterpillar plot)

Her şekil hem PNG (300 dpi) hem PDF (vektör) olarak figures/ klasörüne yazılır.

Kurulum:
    pip install pandas numpy scipy statsmodels linearmodels matplotlib
Kullanım:
    python make_figures.py panel_output/panel_clean.csv --dep ln_co2_pc
    python make_figures.py panel_clean.csv --highlight TUR
"""

from __future__ import annotations
import argparse
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib as mpl
mpl.use("Agg")
import matplotlib.pyplot as plt

import analysis_pipeline_full as A

# --- dergi tipi sade stil ---
mpl.rcParams.update({
    "font.family": "DejaVu Sans", "font.size": 11,
    "axes.spines.top": False, "axes.spines.right": False,
    "axes.grid": True, "grid.alpha": 0.25, "grid.linewidth": 0.6,
    "axes.titlesize": 12, "axes.titleweight": "bold",
    "figure.dpi": 120, "savefig.bbox": "tight",
})
C = {"pool": "#9aa0a6", "fe": "#1f77b4", "re": "#2ca02c",
     "ah": "#9467bd", "mg": "#ff7f0e", "cce": "#d62728", "hl": "#d62728"}
REG_LABELS = {"ln_gdp_pc": "ln(GSYİH pc)", "ln_gdp_pc_sq": "ln(GSYİH pc)²",
              "ln_energy_pc": "ln(Enerji pc)", "energy_intensity": "Enerji yoğunluğu"}


def _save(fig, out, name):
    for ext in ("png", "pdf"):
        fig.savefig(out / f"{name}.{ext}")
    plt.close(fig)
    print(f"  yazıldı: {out/name}.png / .pdf")


# --------------------------------------------------------------------------- #
# Şekil 1 — EKC eğrisi + dönüm noktası
# --------------------------------------------------------------------------- #
def fig_ekc(frame, raw, dep, out):
    if not {"ln_gdp_pc", "ln_gdp_pc_sq"}.issubset(frame.columns):
        print("  [atlandı] EKC için gelir terimleri yok."); return
    _, fe, *_ = A.panel_models(frame, dep,
                               [c for c in REG_LABELS if c in frame.columns])
    b1, b2 = fe.params["ln_gdp_pc"], fe.params["ln_gdp_pc_sq"]
    # gelir merkezlenmiş; ham veriden ln-gelir ortalaması ile seviyeye çevir
    gdp_pc = "gdp_pc_ppp" if "gdp_pc_ppp" in raw else "gdp_pc_owid"
    mu = np.log(raw[gdp_pc].where(raw[gdp_pc] > 0)).mean()
    xc = np.linspace(frame["ln_gdp_pc"].min(), frame["ln_gdp_pc"].max(), 200)
    y0 = frame[dep].mean()
    yhat = y0 + b1 * xc + b2 * xc**2          # data merkezinden geçen uyum
    gdp_level = np.exp(xc + mu)

    fig, ax = plt.subplots(figsize=(7, 4.6))
    # arka planda ham veri bulutu (bağlam)
    ax.scatter(np.exp(frame["ln_gdp_pc"] + mu), frame[dep], s=6, alpha=0.10,
               color=C["fe"], rasterized=True, label="Gözlemler")
    ax.plot(gdp_level, yhat, color=C["cce"], lw=2.4, label="FE uyumu (ters-U)")
    if b2 < 0 < b1 or (b1 > 0 and b2 < 0):    # dönüm noktası
        xstar = -b1 / (2 * b2)
        turn = np.exp(xstar + mu)
        ax.axvline(turn, ls="--", color="#444", lw=1.2)
        ax.annotate(f"Dönüm noktası\n≈ {turn:,.0f} $",
                    xy=(turn, y0 + b1*xstar + b2*xstar**2),
                    xytext=(turn*1.25, y0 - 0.5),
                    arrowprops=dict(arrowstyle="->", color="#444"), fontsize=9)
    ax.set_xscale("log")
    ax.set_xlabel("Kişi başı GSYİH ($, log ölçek)")
    ax.set_ylabel(dep)
    ax.set_title("Şekil 1. Çevresel Kuznets Eğrisi (EKC)")
    ax.legend(frameon=False, loc="upper left", fontsize=9)
    _save(fig, out, "fig1_ekc")


# --------------------------------------------------------------------------- #
# Şekil 2 — Tahminci karşılaştırması (forest plot)
# --------------------------------------------------------------------------- #
def fig_forest(frame, dep, regs, out):
    pooled, fe, fe_dk, re, _ = A.panel_models(frame, dep, regs)
    ah = A.anderson_hsiao(frame, dep, regs)
    mg, cce = A.mg_ccemg(frame, dep, regs)

    def lm(res, r):
        return (res.params[r], res.std_errors[r]) if r in res.params.index else None
    def ahg(r):
        k = "d_" + r
        return (ah.params[k], ah.std_errors[k]) if k in ah.params.index else None
    def mgg(tbl, r):
        return (tbl.loc[r, "coef"], tbl.loc[r, "se"]) if r in tbl.index else None

    series = [("Havuzlanmış", C["pool"], lambda r: lm(pooled, r)),
              ("FE", C["fe"], lambda r: lm(fe, r)),
              ("RE", C["re"], lambda r: lm(re, r)),
              ("Anderson-Hsiao", C["ah"], ahg),
              ("MG", C["mg"], lambda r: mgg(mg, r)),
              ("CCEMG", C["cce"], lambda r: mgg(cce, r))]

    n = len(regs)
    fig, axes = plt.subplots(1, n, figsize=(3.1*n, 4.4), sharey=True)
    if n == 1: axes = [axes]
    for ax, r in zip(axes, regs):
        for i, (name, col, getter) in enumerate(series):
            res = getter(r)
            if res is None: continue
            b, se = res
            ax.errorbar(b, i, xerr=1.96*se, fmt="o", color=col, capsize=3, ms=6)
        ax.axvline(0, ls="--", color="#888", lw=1)
        ax.set_yticks([])
        ax.set_title(REG_LABELS.get(r, r), fontsize=11)
        ax.set_ylim(-0.6, len(series)-0.4)
        ax.invert_yaxis()
    import matplotlib.lines as mlines
    handles = [mlines.Line2D([], [], color=col, marker="o", ls="", ms=7, label=name)
               for name, col, _ in series]
    fig.legend(handles=handles, ncol=len(series), loc="lower center",
               frameon=False, bbox_to_anchor=(0.5, -0.04), fontsize=9)
    fig.suptitle("Şekil 2. Katsayıların tahminciler arası karşılaştırması (±%95 GA)",
                 fontweight="bold", y=1.02)
    _save(fig, out, "fig2_forest")


# --------------------------------------------------------------------------- #
# Şekil 3 — CCEMG ülke-bazlı eğim heterojenliği
# --------------------------------------------------------------------------- #
def _ccemg_country_slopes(frame, dep, regs, target, min_T=15):
    import statsmodels.api as sm
    d = frame.copy()
    cs = d.groupby("year")[[dep]+regs].transform("mean")
    cs.columns = [c+"_bar" for c in cs.columns]
    d = pd.concat([d, cs], axis=1)
    aug = regs + [c+"_bar" for c in [dep]+regs]
    rows = []
    for iso, gp in d.groupby("iso3"):
        gp = gp.dropna(subset=[dep]+regs)
        if len(gp) < min_T: continue
        try:
            fit = sm.OLS(gp[dep], sm.add_constant(gp[aug])).fit()
            rows.append({"iso3": iso, "slope": fit.params[target],
                         "se": fit.bse[target]})
        except Exception:
            pass
    return pd.DataFrame(rows).sort_values("slope").reset_index(drop=True)


def fig_heterogeneity(frame, dep, regs, out, target="ln_energy_pc", highlight="TUR"):
    if target not in regs:
        target = regs[0]
    sl = _ccemg_country_slopes(frame, dep, regs, target)
    if sl.empty:
        print("  [atlandı] ülke eğimi hesaplanamadı."); return
    mean = sl["slope"].mean()

    fig, ax = plt.subplots(figsize=(7, 5))
    y = np.arange(len(sl))
    ax.errorbar(sl["slope"], y, xerr=1.96*sl["se"], fmt="o", ms=3,
                color=C["fe"], alpha=0.45, elinewidth=0.5, capsize=0)
    ax.axvline(mean, color=C["cce"], lw=2,
               label=f"CCEMG ortalaması = {mean:.2f}")
    ax.axvline(0, ls="--", color="#888", lw=1)
    # ekseni ana kütleye kırp (birkaç ülkenin aşırı GA'sı tüm ekseni açmasın)
    lo, hi = sl["slope"].quantile(0.03), sl["slope"].quantile(0.97)
    pad = (hi - lo) * 0.25
    ax.set_xlim(lo - pad, hi + pad)
    # yalnızca 2 uç + vurgulu ülkeyi etiketle (kırpılmış sınıra yerleştir)
    clip = lambda v: min(max(v, lo - pad*0.6), hi + pad*0.6)
    for _, r in pd.concat([sl.head(2), sl.tail(2)]).iterrows():
        yi = sl.index[sl.iso3 == r.iso3][0]
        ax.annotate(r["iso3"], (clip(r["slope"]), yi), fontsize=7.5, color="#333",
                    xytext=(3, 0), textcoords="offset points", va="center")
    if highlight in set(sl.iso3):
        yi = sl.index[sl.iso3 == highlight][0]
        ax.scatter(clip(sl.loc[yi, "slope"]), yi, color=C["hl"], s=60, zorder=5,
                   edgecolor="k", linewidth=0.6)
        ax.annotate(highlight, (clip(sl.loc[yi, "slope"]), yi), fontsize=9,
                    fontweight="bold", color=C["hl"], xytext=(7, 0),
                    textcoords="offset points", va="center")
    ax.set_yticks([])
    ax.set_xlabel(f"Ülkeye özgü eğim: {REG_LABELS.get(target, target)}  (uçlar kırpıldı)")
    ax.set_ylabel(f"Ülkeler (eğime göre sıralı, N={len(sl)})")
    ax.set_title("Şekil 3. CCEMG ülke-bazlı eğim heterojenliği")
    ax.legend(frameon=False, loc="lower right", fontsize=9)
    _save(fig, out, "fig3_heterogeneity")


# --------------------------------------------------------------------------- #
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csv")
    ap.add_argument("--dep", default="ln_co2_pc")
    ap.add_argument("--target", default="ln_energy_pc", help="Şekil 3 için eğim değişkeni")
    ap.add_argument("--highlight", default="TUR", help="Şekil 3'te vurgulanacak ülke (ISO3)")
    a = ap.parse_args()

    out = Path(a.csv).parent / "figures"; out.mkdir(exist_ok=True)
    raw = pd.read_csv(a.csv)
    frame, regs = A.prep_frame(raw, a.dep)
    print(f"Model: {a.dep} ~ {regs} | {frame['iso3'].nunique()} ülke")

    print("Şekil 1 (EKC) ..."); fig_ekc(frame, raw, a.dep, out)
    print("Şekil 2 (forest) ..."); fig_forest(frame, a.dep, regs, out)
    print("Şekil 3 (heterojenlik) ..."); fig_heterogeneity(frame, a.dep, regs, out,
                                                            a.target, a.highlight)
    print("Bitti ->", out)


if __name__ == "__main__":
    main()
