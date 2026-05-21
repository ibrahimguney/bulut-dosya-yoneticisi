# 01 - Kurulum

Bu proje nanoGPT fikrini daha kucuk ve okunur bir sekilde ogretir.

## 1. Sanal ortam olustur

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

## 2. PyTorch kur

CPU ile baslamak en kolay yoldur:

```powershell
python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
```

NVIDIA GPU kullanacaksan resmi PyTorch kurulum sayfasindan Windows + Pip +
CUDA secenegini sec.

## 3. Test et

```powershell
python -c "import torch; print(torch.__version__); print(torch.cuda.is_available())"
```

## 4. Proje testlerini calistir

```powershell
python -m unittest discover tests
```
