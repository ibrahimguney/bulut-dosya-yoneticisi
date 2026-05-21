from __future__ import annotations

import torch

from .model import GPTConfig, MiniGPT
from .tokenizer import CharTokenizer


def main() -> int:
    text = "merhaba dunya"
    tokenizer = CharTokenizer.train(text)
    ids = tokenizer.encode(text)

    print("1) Ham metin")
    print(text)
    print()

    print("2) Token sozlugu")
    for char, token_id in tokenizer.stoi.items():
        visible = "\\n" if char == "\n" else char
        print(f"{visible!r} -> {token_id}")
    print()

    print("3) Encode / decode")
    print("ids:", ids)
    print("decode:", tokenizer.decode(ids))
    print()

    block_size = 8
    x = torch.tensor([ids[:block_size]], dtype=torch.long)
    y = torch.tensor([ids[1 : block_size + 1]], dtype=torch.long)

    print("4) Next-token prediction verisi")
    print("x:", x.tolist()[0], "=>", tokenizer.decode(x.tolist()[0]))
    print("y:", y.tolist()[0], "=>", tokenizer.decode(y.tolist()[0]))
    print("Model x'e bakip y'yi tahmin etmeye calisir.")
    print()

    config = GPTConfig(
        vocab_size=tokenizer.vocab_size,
        block_size=block_size,
        n_layer=1,
        n_head=2,
        n_embd=16,
        dropout=0.0,
    )
    model = MiniGPT(config)
    logits, loss = model(x, y)

    print("5) Model cikisi")
    print("logits shape:", tuple(logits.shape))
    print("loss:", round(float(loss.item()), 4))
    print()

    print("Ozet: LLM egitimi, siradaki tokeni daha iyi tahmin etmek icin loss'u dusurme isidir.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
