# 04 - Yerelde Calistir, Sonra GitHub'a Push Et

Bu dersin amaci projeyi bilgisayarda ucundan sonuna calistirmak ve sonra
GitHub'a gondermektir.

## 1. Proje klasorune gir

```powershell
cd "C:\Users\ibrah\OneDrive\Belgeler\New project\adim-adim-nanogpt"
```

## 2. Sanal ortamdaki Python'u kullan

Bu projede sanal ortam hazir:

```powershell
.\.venv\Scripts\python.exe --version
```

## 3. Ilk LLM dersini calistir

```powershell
.\.venv\Scripts\python.exe -m src.lesson_01_next_token
```

Burada gorulmesi gereken ana fikir:

```text
x: modele verilen tokenler
y: modelin tahmin etmeye calistigi siradaki tokenler
loss: modelin yanilma miktari
```

## 4. Testleri calistir

```powershell
.\.venv\Scripts\python.exe -m unittest discover tests
```

## 5. Mini egitim yap

Hizli deneme:

```powershell
.\.venv\Scripts\python.exe -m src.train --data data/turkce-mini.txt --out-dir checkpoints/turkce-mini --block-size 16 --batch-size 4 --max-iters 20 --eval-interval 10 --eval-iters 2 --n-layer 1 --n-head 2 --n-embd 32
```

Daha uzun deneme:

```powershell
.\.venv\Scripts\python.exe -m src.train --data data/turkce-mini.txt --out-dir checkpoints/turkce-mini --max-iters 300
```

## 6. Metin uret

```powershell
.\.venv\Scripts\python.exe -m src.generate --checkpoint checkpoints/turkce-mini --prompt "m" --tokens 120
```

## 7. GitHub'a gonder

Repo kok klasorune don:

```powershell
cd "C:\Users\ibrah\OneDrive\Belgeler\New project"
```

Sadece bu projeyi stage et:

```powershell
git add adim-adim-nanogpt
```

Commit olustur:

```powershell
git commit -m "Adim adim nanoGPT projesini ekle"
```

Branch'i GitHub'a push et:

```powershell
git push -u origin codex/publish-akillab
```

Not: `.venv` ve `checkpoints` klasorleri `.gitignore` icinde oldugu icin GitHub'a
gonderilmez. Kod, dokumantasyon, testler ve ornek veri gonderilir.
