from __future__ import annotations

import torch

from .model import GPTConfig, MiniGPT
from .tokenizer import CharTokenizer


def main() -> int:
    text = "merhaba dunya"
    tokenizer = CharTokenizer.train(text)
    ids = tokenizer.encode("merhaba ")
    x = torch.tensor([ids], dtype=torch.long)

    config = GPTConfig(
        vocab_size=tokenizer.vocab_size,
        block_size=8,
        n_layer=1,
        n_head=2,
        n_embd=16,
        dropout=0.0,
    )
    model = MiniGPT(config)

    token_vectors = model.token_embedding(x)
    positions = torch.arange(x.shape[1])
    position_vectors = model.position_embedding(positions)
    combined = token_vectors + position_vectors

    print("1) Token ID'leri")
    print(x.tolist()[0], "=>", tokenizer.decode(x.tolist()[0]))
    print()

    print("2) Token embedding")
    print("shape:", tuple(token_vectors.shape))
    print("Anlam: her token id, ogrenilebilir bir vektore donustu.")
    print()

    print("3) Position embedding")
    print("shape:", tuple(position_vectors.shape))
    print("Anlam: model tokenin cumledeki yerini de ogrenir.")
    print()

    print("4) Birlesik temsil")
    print("shape:", tuple(combined.shape))
    print("token_vector + position_vector = Transformer'a giren temsil")
    print()

    first_token = tokenizer.decode([x[0, 0].item()])
    print("5) Ilk tokenin ilk 5 embedding degeri")
    values = token_vectors[0, 0, :5].detach().tolist()
    print(f"token: {first_token!r}")
    print([round(value, 4) for value in values])
    print()

    print("Ozet: LLM metni dogrudan anlamaz; token id'lerini vektorlere cevirip bu vektorleri egitir.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
