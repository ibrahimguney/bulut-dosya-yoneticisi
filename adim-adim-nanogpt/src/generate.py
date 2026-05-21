from __future__ import annotations

import argparse
from pathlib import Path

import torch

from .model import GPTConfig, MiniGPT
from .tokenizer import CharTokenizer


def generate(args) -> str:
    checkpoint_dir = Path(args.checkpoint)
    tokenizer = CharTokenizer.load(checkpoint_dir / "tokenizer.json")
    checkpoint = torch.load(checkpoint_dir / "model.pt", map_location=args.device)
    config = GPTConfig(**checkpoint["config"])
    model = MiniGPT(config).to(args.device)
    model.load_state_dict(checkpoint["model"])
    model.eval()

    idx = torch.tensor([tokenizer.encode(args.prompt)], dtype=torch.long, device=args.device)
    out = model.generate(idx, args.tokens)[0].tolist()
    return tokenizer.decode(out)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Egitilmis mini GPT ile metin uret")
    parser.add_argument("--checkpoint", default="checkpoints/turkce-mini")
    parser.add_argument("--prompt", default="m")
    parser.add_argument("--tokens", type=int, default=200)
    parser.add_argument("--device", default="cuda" if torch.cuda.is_available() else "cpu")
    return parser


def main() -> int:
    print(generate(build_parser().parse_args()))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
