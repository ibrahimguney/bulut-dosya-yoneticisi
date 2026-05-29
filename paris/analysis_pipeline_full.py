#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
analysis_pipeline_full.py
=========================
Karbon emisyonu paneli için GENİŞLETİLMİŞ analiz iskeleti.
(analysis_pipeline.py'nin üst sürümüdür; onun yerine bunu kullanın.)

Eklenenler:
  * Gelir karesinde MEAN-CENTERING        -> ln_gdp_pc^2 VIF'i ~214'ten ~1'e düşer
  * Driscoll-Kraay (DK) standart hataları  -> yatay kesit bağımlılığına dayanıklı
  * DİNAMİK PANEL:
      - Anderson-Hsiao IV (her ortamda çalışır; gecikmeli bağımlı değişken)
      - Sistem-GMM (pydynpd, opsiyonel; Hansen + AR(1)/AR(2) testleri)
  * Heterojen eğim / yatay kesit bağımlılığı:
      - Mean Group (MG)  ve  Common Correlated Effects MG (CCEMG)

Tam akış:
  1) Model çerçevesi (mean-centered EKC)      2) Pesaran CD
  3) Panel birim kök (Fisher/IPS)             4) VIF
  5) Pooled/FE/RE + Hausman (kümelenmiş + DK SE)
  6) Dinamik panel: Anderson-Hsiao (+ sistem-GMM varsa)
  7) MG / CCEMG                               8) Sızıntısız LSTM + OLS taban

Kurulum:
    pip install pandas numpy scipy statsmodels linearmodels scikit-learn torch
    pip install pydynpd            # opsiyonel (sistem-GMM); numpy<2 ile en uyumlu

Kullanım:
    python analysis_pipeline_full.py panel_output/panel_clean.csv
    python analysis_pipeline_full.py panel_clean.csv --no-dl --no-gmm
"""

from __future__ import annotations
import argparse, warnings
from pathlib import Path
import numpy as np
import pandas as pd
from scipy import stats

warnings.filterwarnings("ignore")
RNG = 42

CANDIDATE_REGRESSORS = [
    "ln_gdp_pc", "ln_gdp_pc_sq", "ln_energy_pc", "energy_intensity",
    "renew_wb_pct", "renew_share", "urban_pct", "trade_openness",
    "fdi_pct_gdp", "fin_dev_credit", "industry_pct_gdp",
]


# --------------------------------------------------------------------------- #
# 0) Model çerçevesi  (gelir MEAN-CENTERED -> kare teriminin VIF'i çöker)
# --------------------------------------------------------------------------- #
def prep_frame(df, dep, min_cov=0.5):
    df = df.sort_values(["iso3", "year"]).copy()
    gdp_pc = "gdp_pc_ppp" if "gdp_pc_ppp" in df else (
        "gdp_pc_owid" if "gdp_pc_owid" in df else None)
    if gdp_pc:
        lg = np.log(df[gdp_pc].where(df[gdp_pc] > 0))
        df["ln_gdp_pc"] = lg - lg.mean()                 # <-- MEAN-CENTERING
        df["ln_gdp_pc_sq"] = df["ln_gdp_pc"] ** 2        # artık kareyle bağlantı yok
    if "energy_pc" in df:
        df["ln_energy_pc"] = np.log(df["energy_pc"].where(df["energy_pc"] > 0))
    if dep == "ln_co2_pc" and "co2_pc" in df:
        df["ln_co2_pc"] = np.log(df["co2_pc"].where(df["co2_pc"] > 0))
    regs = [c for c in CANDIDATE_REGRESSORS
            if c in df and df[c].notna().mean() >= min_cov]
    frame = df[["iso3", "year", dep] + regs].dropna().copy()
    return frame, regs


# --------------------------------------------------------------------------- #
# 2) Pesaran CD
# --------------------------------------------------------------------------- #
def pesaran_cd(frame, var):
    wide = frame.pivot(index="year", columns="iso3", values=var)
    cols, rhos, Ts = wide.columns, [], []
    for i in range(len(cols)):
        for j in range(i + 1, len(cols)):
            pair = wide[[cols[i], cols[j]]].dropna()
            if len(pair) >= 10:
                r = pair.iloc[:, 0].corr(pair.iloc[:, 1])
                if pd.notna(r):
                    rhos.append(r); Ts.append(len(pair))
    if not rhos:
        return None
    N = len(cols)
    cd = np.sqrt(2 * np.mean(Ts) / (N * (N - 1))) * np.sum(rhos)
    return {"CD": cd, "p_value": 2 * (1 - stats.norm.cdf(abs(cd))), "N": N}


# --------------------------------------------------------------------------- #
# 3) Panel birim kök (Fisher / IPS)
# --------------------------------------------------------------------------- #
def panel_unit_root(frame, var, diff=False, min_T=12):
    from statsmodels.tsa.stattools import adfuller
    pv, tv = [], []
    for _, g in frame.groupby("iso3"):
        s = g.sort_values("year")[var].dropna()
        if diff:
            s = s.diff().dropna()
        if len(s) >= min_T and s.nunique() > 5:
            try:
                r = adfuller(s, autolag="AIC")
                pv.append(min(max(r[1], 1e-10), 1 - 1e-10)); tv.append(r[0])
            except Exception:
                pass
    if len(pv) < 5:
        return None
    N = len(pv); fisher = -2 * np.sum(np.log(pv))
    return {"N": N, "fisher_chi2": fisher,
            "p_value": stats.chi2.sf(fisher, 2 * N), "ips_tbar": np.mean(tv)}


# --------------------------------------------------------------------------- #
# 4) VIF
# --------------------------------------------------------------------------- #
def vif_table(frame, regs):
    from statsmodels.stats.outliers_influence import variance_inflation_factor
    import statsmodels.api as sm
    X = sm.add_constant(frame[regs].astype(float))
    rows = [{"variable": X.columns[i], "VIF": round(variance_inflation_factor(X.values, i), 2)}
            for i in range(X.shape[1])]
    return pd.DataFrame(rows).query("variable != 'const'")


# --------------------------------------------------------------------------- #
# 5) Pooled / FE / RE + Hausman  (kümelenmiş VE Driscoll-Kraay SE)
# --------------------------------------------------------------------------- #
def panel_models(frame, dep, regs):
    from linearmodels.panel import PanelOLS, RandomEffects, PooledOLS
    import statsmodels.api as sm
    pdata = frame.set_index(["iso3", "year"])
    y, Xc, Xfe = pdata[dep], sm.add_constant(pdata[regs]), pdata[regs]

    pooled = PooledOLS(y, Xc).fit(cov_type="clustered", cluster_entity=True)
    fe_cl = PanelOLS(y, Xfe, entity_effects=True).fit(cov_type="clustered", cluster_entity=True)
    # Driscoll-Kraay: cov_type="kernel" (Bartlett çekirdeği, otomatik bant genişliği)
    fe_dk = PanelOLS(y, Xfe, entity_effects=True).fit(cov_type="kernel", kernel="bartlett")
    re = RandomEffects(y, Xc).fit(cov_type="clustered", cluster_entity=True)

    common = [c for c in regs if c in fe_cl.params.index and c in re.params.index]
    b = (fe_cl.params[common] - re.params[common]).values
    vd = (fe_cl.cov.loc[common, common] - re.cov.loc[common, common]).values
    H = float(b @ np.linalg.pinv(vd) @ b)
    return pooled, fe_cl, fe_dk, re, {"chi2": H, "df": len(common),
                                      "p_value": stats.chi2.sf(H, len(common))}


# --------------------------------------------------------------------------- #
# 6a) Anderson-Hsiao dinamik IV  (her ortamda çalışır)
#     Δy_it = ρ Δy_{i,t-1} + β'ΔX_it + Δε_it ;  Δy_{i,t-1} enstrümanı: y_{i,t-2}
# --------------------------------------------------------------------------- #
def anderson_hsiao(frame, dep, regs):
    from linearmodels.iv import IV2SLS
    import statsmodels.api as sm
    d = frame.sort_values(["iso3", "year"]).copy()
    d["dy"] = d.groupby("iso3")[dep].diff()
    d["dy_lag1"] = d.groupby("iso3")["dy"].shift(1)
    d["y_lag2"] = d.groupby("iso3")[dep].shift(2)
    for r in regs:
        d["d_" + r] = d.groupby("iso3")[r].diff()
    need = ["dy", "dy_lag1", "y_lag2"] + ["d_" + r for r in regs]
    dd = d.dropna(subset=need).copy()
    exog = sm.add_constant(dd[["d_" + r for r in regs]])
    res = IV2SLS(dd["dy"], exog, dd[["dy_lag1"]], dd[["y_lag2"]]).fit(
        cov_type="clustered", clusters=dd["iso3"])
    return res


# --------------------------------------------------------------------------- #
# 6b) Sistem-GMM (pydynpd, opsiyonel)  — Blundell-Bond + Hansen/AR testleri
# --------------------------------------------------------------------------- #
def system_gmm(frame, dep, regs):
    import numpy as _np
    if not hasattr(_np, "in1d"):       # NumPy 2.x köprüsü (pydynpd uyumu)
        _np.in1d = _np.isin
    from pydynpd import regression
    d = frame.copy()
    d["id"] = d["iso3"].astype("category").cat.codes + 1
    gmm_regs = " ".join(regs)
    cmd = (f"{dep} L1.{dep} {gmm_regs} | "
           f"gmm({dep}, 2:4) gmm(ln_gdp_pc, 2:4) "
           f"pred({' '.join(r for r in regs if r != 'ln_gdp_pc' and r != 'ln_gdp_pc_sq')}) "
           f"| collapse")
    return regression.abond(cmd, d[["id", "year", dep] + regs], ["id", "year"])


# --------------------------------------------------------------------------- #
# 7) Mean Group (MG) ve CCE Mean Group (CCEMG)
# --------------------------------------------------------------------------- #
def mg_ccemg(frame, dep, regs, min_T=15):
    import statsmodels.api as sm
    d = frame.copy()
    cs = d.groupby("year")[[dep] + regs].transform("mean")
    cs.columns = [c + "_bar" for c in cs.columns]
    d = pd.concat([d, cs], axis=1)
    mg_b, cce_b = [], []
    for _, gp in d.groupby("iso3"):
        gp = gp.dropna(subset=[dep] + regs)
        if len(gp) < min_T:
            continue
        try:
            mg_b.append(sm.OLS(gp[dep], sm.add_constant(gp[regs])).fit().params[regs])
        except Exception:
            pass
        aug = regs + [c + "_bar" for c in [dep] + regs]
        try:
            cce_b.append(sm.OLS(gp[dep], sm.add_constant(gp[aug])).fit().params[regs])
        except Exception:
            pass

    def summarise(blist):
        B = pd.DataFrame(blist)
        mean, se = B.mean(), B.std() / np.sqrt(len(B))
        return pd.DataFrame({"coef": mean, "se": se, "t": mean / se,
                             "p": 2 * (1 - stats.norm.cdf((mean / se).abs())),
                             "N": len(B)})
    return summarise(mg_b), summarise(cce_b)


# --------------------------------------------------------------------------- #
# 8) Sızıntısız LSTM + OLS taban
# --------------------------------------------------------------------------- #
def lstm_forecast(frame, dep, regs, split_year, window=5, epochs=60):
    import torch, torch.nn as nn
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import r2_score, mean_squared_error
    import statsmodels.api as sm
    torch.manual_seed(RNG); np.random.seed(RNG)

    Xs, ys, ty = [], [], []
    for _, g in frame.sort_values("year").groupby("iso3"):
        g = g.dropna(subset=regs + [dep])
        f, t, yr = g[regs].values, g[dep].values, g["year"].values
        for k in range(window - 1, len(g)):
            Xs.append(f[k - window + 1:k + 1]); ys.append(t[k]); ty.append(yr[k])
    Xs, ys, ty = np.array(Xs, np.float32), np.array(ys, np.float32), np.array(ty)
    if len(Xs) < 100:
        return {"error": "Yetersiz örnek."}
    tr, te = ty <= split_year, ty > split_year
    if te.sum() < 20 or tr.sum() < 50:
        return {"error": f"Dengesiz bölme (train={tr.sum()}, test={te.sum()})."}

    nf = Xs.shape[2]
    xs = StandardScaler().fit(Xs[tr].reshape(-1, nf))
    ysz = StandardScaler().fit(ys[tr].reshape(-1, 1))
    Xtr = xs.transform(Xs[tr].reshape(-1, nf)).reshape(-1, window, nf)
    Xte = xs.transform(Xs[te].reshape(-1, nf)).reshape(-1, window, nf)
    ytr = ysz.transform(ys[tr].reshape(-1, 1)).ravel()

    class Net(nn.Module):
        def __init__(s, nf, h=32):
            super().__init__(); s.l = nn.LSTM(nf, h, batch_first=True)
            s.f = nn.Sequential(nn.Linear(h, 16), nn.ReLU(), nn.Linear(16, 1))
        def forward(s, x):
            o, _ = s.l(x); return s.f(o[:, -1, :]).squeeze(-1)

    net = Net(nf); opt = torch.optim.Adam(net.parameters(), 1e-2); lf = nn.MSELoss()
    Xt, yt = torch.tensor(Xtr), torch.tensor(ytr).float()
    for _ in range(epochs):
        opt.zero_grad(); lf(net(Xt), yt).backward(); opt.step()
    net.eval()
    with torch.no_grad():
        pr = ysz.inverse_transform(net(torch.tensor(Xte)).numpy().reshape(-1, 1)).ravel()
    yte = ys[te]
    ols = sm.OLS(ys[tr], sm.add_constant(Xs[tr][:, -1, :])).fit()
    bp = ols.predict(sm.add_constant(Xs[te][:, -1, :], has_constant="add"))
    return {"n_train": int(tr.sum()), "n_test": int(te.sum()),
            "lstm_rmse": float(np.sqrt(mean_squared_error(yte, pr))),
            "lstm_r2": float(r2_score(yte, pr)),
            "ols_rmse": float(np.sqrt(mean_squared_error(yte, bp))),
            "ols_r2": float(r2_score(yte, bp))}


# --------------------------------------------------------------------------- #
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csv")
    ap.add_argument("--dep", default="ln_co2_pc")
    ap.add_argument("--split-year", type=int, default=2015)
    ap.add_argument("--window", type=int, default=5)
    ap.add_argument("--epochs", type=int, default=60)
    ap.add_argument("--no-dl", action="store_true")
    ap.add_argument("--no-gmm", action="store_true")
    a = ap.parse_args()

    out = Path(a.csv).parent / "analysis_output"; out.mkdir(exist_ok=True)
    frame, regs = prep_frame(pd.read_csv(a.csv), a.dep)
    print("=" * 72)
    print(f"MODEL: {a.dep} ~ {regs}")
    print(f"{frame['iso3'].nunique()} ülke | {frame['year'].min()}-{frame['year'].max()}"
          f" | {len(frame):,} gözlem  (gelir MEAN-CENTERED)")

    cd = pesaran_cd(frame, a.dep)
    print(f"\n[2] Pesaran CD={cd['CD']:.2f}, p={cd['p_value']:.4f} -> "
          f"{'bağımlılık VAR -> DK SE & CCEMG önerilir' if cd['p_value']<0.05 else 'yok'}")

    print("\n[3] Panel birim kök (Fisher-ADF)  düzey | 1.fark")
    for v in [a.dep] + regs[:3]:
        lv, dfd = panel_unit_root(frame, v), panel_unit_root(frame, v, diff=True)
        if lv and dfd:
            print(f"   {v:14s} p={lv['p_value']:.3f} | p={dfd['p_value']:.3f}"
                  f" -> {'I(1)' if lv['p_value']>.05 and dfd['p_value']<.05 else 'I(0)'}")

    vt = vif_table(frame, regs); vt.to_csv(out / "04_vif.csv", index=False)
    print("\n[4] VIF (centered):", dict(zip(vt.variable, vt.VIF)), " (>10 sorunlu)")

    pooled, fe_cl, fe_dk, re, hau = panel_models(frame, a.dep, regs)
    with open(out / "05_panel_models.txt", "w") as f:
        for nm, mdl in [("POOLED", pooled), ("FE (clustered)", fe_cl),
                        ("FE (Driscoll-Kraay)", fe_dk), ("RE", re)]:
            f.write(f"\n{'='*26} {nm} {'='*26}\n{mdl.summary}\n")
    print(f"\n[5] Hausman chi2={hau['chi2']:.2f} (df={hau['df']}), p={hau['p_value']:.4f}"
          f" -> {'FE' if hau['p_value']<.05 else 'RE'} tercih | FE within-R2={fe_cl.rsquared_within:.3f}")
    if "ln_gdp_pc" in fe_cl.params and "ln_gdp_pc_sq" in fe_cl.params:
        b1, b2 = fe_cl.params["ln_gdp_pc"], fe_cl.params["ln_gdp_pc_sq"]
        sh = "ters-U (EKC)" if b1 > 0 and b2 < 0 else "EKC yok"
        print(f"   EKC FE: b1={b1:.3f}, b2={b2:.3f} -> {sh}")
        print(f"   DK SE (b1)={fe_dk.std_errors['ln_gdp_pc']:.3f} vs "
              f"kümelenmiş={fe_cl.std_errors['ln_gdp_pc']:.3f}")

    print("\n[6] DİNAMİK PANEL")
    ah = anderson_hsiao(frame, a.dep, regs)
    print(f"   Anderson-Hsiao: gecikmeli bağımlı ρ={ah.params['dy_lag1']:.3f} "
          f"(p={ah.pvalues['dy_lag1']:.3f}) -> {'kalıcılık var' if ah.pvalues['dy_lag1']<.05 else 'zayıf'}")
    if not a.no_gmm:
        try:
            system_gmm(frame, a.dep, regs)   # pydynpd kendi tablosunu basar
            print("   Sistem-GMM (pydynpd): yukarıdaki tablo + Hansen/AR(2) raporlandı.")
        except Exception as e:
            print(f"   Sistem-GMM atlandı ({type(e).__name__}). Ortam uyumsuz olabilir "
                  f"(pydynpd numpy<2 ile en uyumlu); AH ve CCEMG sonuçlarını kullanın.")

    mg, cce = mg_ccemg(frame, a.dep, regs)
    mg.to_csv(out / "07_mg.csv"); cce.to_csv(out / "07_ccemg.csv")
    print("\n[7] MG ve CCEMG (heterojen eğim / yatay kesit bağımlılığı)")
    print("   MG   :", {k: round(v, 3) for k, v in mg["coef"].items()})
    print("   CCEMG:", {k: round(v, 3) for k, v in cce["coef"].items()},
          " (CD anlamlıysa CCEMG'yi esas alın)")

    if not a.no_dl:
        dl = lstm_forecast(frame, a.dep, regs, a.split_year, a.window, a.epochs)
        print("\n[8] LSTM (sızıntısız bölme):",
              dl if "error" in dl else
              f"LSTM R2={dl['lstm_r2']:.3f} RMSE={dl['lstm_rmse']:.4f} | "
              f"OLS taban R2={dl['ols_r2']:.3f} RMSE={dl['ols_rmse']:.4f} "
              f"(train={dl['n_train']}, test={dl['n_test']})")

    print("\n[bitti] Çıktılar:", out)


if __name__ == "__main__":
    main()
