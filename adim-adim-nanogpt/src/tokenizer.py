from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


@dataclass
class CharTokenizer:
    stoi: dict[str, int]
    itos: dict[int, str]

    @classmethod
    def train(cls, text: str) -> "CharTokenizer":
        chars = sorted(set(text))
        stoi = {char: index for index, char in enumerate(chars)}
        itos = {index: char for char, index in stoi.items()}
        return cls(stoi=stoi, itos=itos)

    @property
    def vocab_size(self) -> int:
        return len(self.stoi)

    def encode(self, text: str) -> list[int]:
        unknown = sorted({char for char in text if char not in self.stoi})
        if unknown:
            raise ValueError(f"Bilinmeyen karakterler: {unknown}")
        return [self.stoi[char] for char in text]

    def decode(self, ids: list[int]) -> str:
        return "".join(self.itos[int(index)] for index in ids)

    def save(self, path: str | Path) -> None:
        payload = {"stoi": self.stoi}
        Path(path).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    @classmethod
    def load(cls, path: str | Path) -> "CharTokenizer":
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
        stoi = {char: int(index) for char, index in payload["stoi"].items()}
        itos = {index: char for char, index in stoi.items()}
        return cls(stoi=stoi, itos=itos)
