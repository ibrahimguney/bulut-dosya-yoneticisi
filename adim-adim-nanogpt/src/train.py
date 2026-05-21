from __future__ import annotations

import argparse
from dataclasses import asdict
from pathlib import Path

import torch

from .model import GPTConfig, MiniGPT
from .tokenizer import CharTokenizer


def get_batch(data: torch.Tensor, block_size: int, batch_size: int, device: str):
    ix = torch.randint(len(data) - block_size, (batch_size,))
    x = torch.stack([data[i : i + block_size] for i in ix])
    y = torch.stack([data[i + 1 : i + block_size + 1] for i in ix])
    return x.to(device), y.to(device)


@torch.no_grad()
def estimate_loss(model: MiniGPT, train_data: torch.Tensor, val_data: torch.Tensor, args) -> dict[str, float]:
    out = {}
    model.eval()
    for split, data in [("train", train_data), ("val", val_data)]:
        losses = torch.zeros(args.eval_iters)
        for k in range(args.eval_iters):
            x, y = get_batch(data, args.block_size, args.batch_size, args.device)
            _, loss = model(x, y)
            losses[k] = loss.item()
        out[split] = float(losses.mean())
    model.train()
    return out


def train(args) -> None:
    text = Path(args.data).read_text(encoding="utf-8")
    tokenizer = CharTokenizer.train(text)
    ids = torch.tensor(tokenizer.encode(text), dtype=torch.long)
    split = int(0.9 * len(ids))
    train_data = ids[:split]
    val_data = ids[split:]

    config = GPTConfig(
        vocab_size=tokenizer.vocab_size,
        block_size=args.block_size,
        n_layer=args.n_layer,
        n_head=args.n_head,
        n_embd=args.n_embd,
        dropout=args.dropout,
    )
    model = MiniGPT(config).to(args.device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    tokenizer.save(out_dir / "tokenizer.json")

    for step in range(args.max_iters + 1):
        if step % args.eval_interval == 0:
            losses = estimate_loss(model, train_data, val_data, args)
            print(f"step {step}: train loss {losses['train']:.4f}, val loss {losses['val']:.4f}")

        xb, yb = get_batch(train_data, args.block_size, args.batch_size, args.device)
        _, loss = model(xb, yb)
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        optimizer.step()

    checkpoint = {
        "model": model.state_dict(),
        "config": asdict(config),
    }
    torch.save(checkpoint, out_dir / "model.pt")
    print(f"checkpoint kaydedildi: {out_dir / 'model.pt'}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Adim adim mini nanoGPT egitimi")
    parser.add_argument("--data", default="data/turkce-mini.txt")
    parser.add_argument("--out-dir", default="checkpoints/turkce-mini")
    parser.add_argument("--device", default="cuda" if torch.cuda.is_available() else "cpu")
    parser.add_argument("--block-size", type=int, default=64)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--max-iters", type=int, default=300)
    parser.add_argument("--eval-interval", type=int, default=50)
    parser.add_argument("--eval-iters", type=int, default=10)
    parser.add_argument("--learning-rate", type=float, default=3e-4)
    parser.add_argument("--n-layer", type=int, default=4)
    parser.add_argument("--n-head", type=int, default=4)
    parser.add_argument("--n-embd", type=int, default=128)
    parser.add_argument("--dropout", type=float, default=0.1)
    return parser


def main() -> int:
    train(build_parser().parse_args())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
