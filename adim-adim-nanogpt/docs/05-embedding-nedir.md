# 05 - Embedding Nedir?

Tokenizer metni sayilara cevirir:

```text
merhaba -> [6, 4, 8, 5, 1, 2, 1]
```

Ama model bu sayilari normal sayi gibi okumaz. `6`, `4`ten buyuktur diye bir
anlam yoktur. Bu sayilar sadece kimliktir.

Embedding katmani her token kimligini ogrenilebilir bir vektore cevirir:

```text
token id -> embedding vector
```

Ornek:

```text
6 -> [0.12, -0.31, 0.44, ...]
```

Bu vektorler egitim sirasinda degisir. Model, hangi tokenlerin hangi baglamlarda
benzer davrandigini bu vektorlerde tasimaya baslar.

## Position embedding

Transformer sirayi kendiliginden bilmez. Bu yuzden token vektorune bir de konum
vektoru eklenir:

```text
token embedding + position embedding
```

Boylece model sunlari ayirt edebilir:

```text
ali veli
veli ali
```

Ayni tokenler var, ama siralari farkli.

## Dersi calistir

```powershell
.\.venv\Scripts\python.exe -m src.lesson_02_embeddings
```

Gorecegin ana sekiller:

```text
token embedding shape: (1, 8, 16)
position embedding shape: (8, 16)
combined shape: (1, 8, 16)
```

Burada:

- `1`: batch sayisi
- `8`: token sayisi
- `16`: her tokenin vektor boyutu

Buyuk LLM'lerde bu son boyut 4096, 8192 veya daha buyuk olabilir.
