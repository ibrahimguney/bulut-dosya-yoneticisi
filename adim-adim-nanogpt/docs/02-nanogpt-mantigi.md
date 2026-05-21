# 02 - nanoGPT Mantigi

nanoGPT'in ana fikri sudur:

```text
gecmis tokenler -> Transformer -> siradaki token olasiliklari
```

Bu projedeki parcalar:

- `tokenizer.py`: Metni karakter tokenlerine cevirir.
- `model.py`: Mini GPT modelini tanimlar.
- `train.py`: Veriden batch alir, loss hesaplar, agirliklari gunceller.
- `generate.py`: Egitilmis modelden yeni metin uretir.

## Model akisi

1. Token embedding: token id -> vektor
2. Position embedding: tokenin siradaki konumunu ekler
3. Causal self-attention: gelecek tokenlere bakmadan gecmisi okur
4. Feed-forward: her token vektorunu donusturur
5. Linear head: her token icin siradaki token olasiliklarini verir

## Neden causal mask var?

Dil modeli egitilirken modelin gelecegi gormemesi gerekir. Eger gorseydi,
siradaki tokeni tahmin etmeyi degil kopyalamayi ogrenirdi.
