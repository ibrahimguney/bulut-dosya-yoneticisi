# 03 - Ilk Ders: Next-Token Prediction

Buyuk dil modellerinin ana egitim hedefi basittir:

```text
Gecmis tokenlere bak, siradaki tokeni tahmin et.
```

Ornek metin:

```text
merhaba dunya
```

Tokenizer bu metni sayilara cevirir:

```text
m -> 8
e -> 4
r -> 9
...
```

Model egitimi icin iki dizi hazirlanir:

```text
x: m e r h a b a
y: e r h a b a
```

Yani model `m` gorunce `e`, `me` baglaminda `r`, `mer` baglaminda `h`
tahmin etmeyi ogrenir.

## Loss nedir?

Loss, modelin yanilma miktaridir. Loss yuksekse model siradaki tokeni iyi
tahmin edemiyordur. Egitimin amaci loss'u dusurmektir.

## Dersi calistir

```powershell
.\.venv\Scripts\python.exe -m src.lesson_01_next_token
```

Gorecegin ana fikir:

```text
logits shape: (1, 8, vocab_size)
loss: ...
```

`logits`, her konum icin sozlukteki her tokenin ham skorudur.

## Neden bu LLM'in kalbi?

ChatGPT gibi modeller de cok daha buyuk veri, daha buyuk model ve daha iyi
tokenizer ile ayni temel problemi cozer: siradaki tokeni tahmin etmek.
