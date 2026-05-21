# 06 - Self-Attention Nedir?

Self-attention, Transformer modelinin ana fikridir.

Basit soru:

```text
Her token, onceki tokenlerin hangilerine ne kadar dikkat etmeli?
```

Ornek:

```text
merhaba
```

Model `a` tokenine geldiginde onceki tokenlere bakabilir:

```text
m e r h a b a
            ^
```

Ama gelecege bakamaz. Buna **causal attention** denir.

## Query, Key, Value

Attention uc vektor uretir:

- `query`: Ben ne ariyorum?
- `key`: Ben hangi bilgiye sahibim?
- `value`: Benim tasidigim bilgi ne?

Skor hesaplama:

```text
score = query @ key
```

Sonra skorlar softmax ile olasiliga benzer agirliklara donusur:

```text
weights = softmax(scores)
```

Son cikti:

```text
output = weights @ value
```

## Causal mask

Dil modeli egitiminde model gelecegi gormemeli.

Bu yuzden attention matrisi boyle kisitlanir:

```text
1 0 0 0
1 1 0 0
1 1 1 0
1 1 1 1
```

Her satir bir tokeni temsil eder. Token sadece kendisine ve oncekilere bakabilir.

## Dersi calistir

```powershell
.\.venv\Scripts\python.exe -m src.lesson_03_attention
```

Gorecegin ana parcalar:

```text
attention scores
causal mask
attention weights
attention output
```

## Neden onemli?

Embedding tokenleri vektore cevirir. Self-attention ise bu vektorlerin birbirinden
bilgi almasini saglar. LLM'in baglami anlamaya basladigi yer burasidir.
