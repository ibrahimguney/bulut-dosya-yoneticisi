from __future__ import annotations

import torch
from torch.nn import functional as F

from .tokenizer import CharTokenizer


def print_matrix(title: str, matrix: torch.Tensor) -> None:
    print(title)
    for row in matrix.tolist():
        print([round(value, 3) for value in row])
    print()


def main() -> int:
    torch.manual_seed(7)

    text = "merhaba"
    tokenizer = CharTokenizer.train(text)
    ids = torch.tensor([tokenizer.encode(text)], dtype=torch.long)
    tokens = list(text)

    batch, time = ids.shape
    n_embd = 8
    token_embedding = torch.nn.Embedding(tokenizer.vocab_size, n_embd)
    x = token_embedding(ids)

    print("1) Tokenler")
    print(tokens)
    print()

    print("2) Embedding tensoru")
    print("shape:", tuple(x.shape))
    print("Anlam: her token artik 8 boyutlu bir vektor.")
    print()

    # Tek attention head'i elle kuruyoruz.
    head_size = 8
    key = torch.nn.Linear(n_embd, head_size, bias=False)
    query = torch.nn.Linear(n_embd, head_size, bias=False)
    value = torch.nn.Linear(n_embd, head_size, bias=False)

    k = key(x)
    q = query(x)
    v = value(x)

    scores = q @ k.transpose(-2, -1) * (head_size**-0.5)
    causal_mask = torch.tril(torch.ones(time, time))
    masked_scores = scores.masked_fill(causal_mask == 0, float("-inf"))
    weights = F.softmax(masked_scores, dim=-1)
    out = weights @ v

    print("3) Ham attention skorlari")
    print("shape:", tuple(scores.shape))
    print("Her token, diger tokenlerle benzerlik skoru hesaplar.")
    print()

    print_matrix("4) Causal mask", causal_mask)

    print_matrix("5) Attention agirliklari", weights[0])

    print("6) Attention cikisi")
    print("shape:", tuple(out.shape))
    print("Anlam: her token, onceki tokenlerden agirlikli bilgi topladi.")
    print()

    last_token_weights = weights[0, -1]
    print("7) Son token hangi tokenlere bakti?")
    for token, weight in zip(tokens, last_token_weights.tolist()):
        print(f"{token!r}: {weight:.3f}")
    print()

    print("Ozet: Self-attention, her tokenin baglamdaki onceki tokenlerden bilgi toplamasidir.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
