# Adim Adim nanoGPT

Bu proje, nanoGPT tarzinda kucuk bir GPT modelini sifirdan kurarak ogrenmek
icin hazirlandi. Amac hemen devasa LLM egitmek degil; LLM'in kalbini olusturan
parcalari tek tek anlamak.

## Neyi kuruyoruz?

- karakter tabanli tokenizer
- mini Transformer / GPT modeli
- causal self-attention
- training loop
- checkpoint kaydetme
- metin uretme scripti
- adim adim dokumantasyon

## 1. Kurulum

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
```

## 2. Test

```powershell
python -m unittest discover tests
```

## 3. Egitim

```powershell
python -m src.train --data data/turkce-mini.txt --out-dir checkpoints/turkce-mini
```

## 4. Uretim

```powershell
python -m src.generate --checkpoint checkpoints/turkce-mini --prompt "m" --tokens 200
```

## Proje yapisi

```text
adim-adim-nanogpt/
  data/turkce-mini.txt
  src/tokenizer.py
  src/model.py
  src/train.py
  src/generate.py
  tests/
  docs/
```

## Ogrenme sirasi

1. `docs/03-ilk-ders-next-token.md`
2. `src/lesson_01_next_token.py`
3. `docs/05-embedding-nedir.md`
4. `src/lesson_02_embeddings.py`
5. `docs/06-self-attention.md`
6. `src/lesson_03_attention.py`
7. `src/tokenizer.py`
8. `src/model.py` icindeki `CausalSelfAttention`
9. `src/model.py` icindeki `Block`
10. `src/train.py` icindeki `get_batch`
11. `src/generate.py`

Ilk dersi calistir:

```powershell
.\.venv\Scripts\python.exe -m src.lesson_01_next_token
```

Ikinci dersi calistir:

```powershell
.\.venv\Scripts\python.exe -m src.lesson_02_embeddings
```

Ucuncu dersi calistir:

```powershell
.\.venv\Scripts\python.exe -m src.lesson_03_attention
```

## Sonraki adimlar

- BPE tokenizer ekle
- daha buyuk veriyle egit
- validation loss grafigi ekle
- checkpoint resume ekle
- config dosyasi ekle
- nanoGPT reposundaki yapisal fikirlere yaklastir

## Yerelde calistirip GitHub'a gonderme

Adim adim komutlar icin:

[docs/04-yerelde-calisma-ve-github.md](docs/04-yerelde-calisma-ve-github.md)
