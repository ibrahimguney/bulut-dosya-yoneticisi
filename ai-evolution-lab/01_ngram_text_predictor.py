from collections import Counter, defaultdict
import random


class CharNGramModel:
    """Karakter seviyesinde basit bir n-gram metin tahmin modeli."""

    def __init__(self, n=4):
        if n < 2:
            raise ValueError("n en az 2 olmalidir.")

        self.n = n
        self.table = defaultdict(Counter)

    def fit(self, texts):
        """Egitim metinlerinden context -> next character sayim tablosu olusturur."""
        for text in texts:
            prepared = "~" * (self.n - 1) + text.lower() + "$"

            for index in range(len(prepared) - self.n + 1):
                context = prepared[index : index + self.n - 1]
                next_char = prepared[index + self.n - 1]
                self.table[context][next_char] += 1

    def next_char_probs(self, context):
        """Verilen context icin sonraki karakter olasiliklarini dondurur."""
        context = context.lower()[-(self.n - 1) :]
        counts = self.table.get(context)

        if not counts:
            return {}

        total = sum(counts.values())
        return {char: count / total for char, count in counts.items()}

    def predict_next(self, context):
        """En yuksek olasilikli sonraki karakteri secer."""
        probs = self.next_char_probs(context)

        if not probs:
            return "?"

        return max(probs, key=probs.get)

    def sample_next(self, context, temperature=1.0):
        """Temperature kullanarak sonraki karakteri ornekler."""
        if temperature <= 0:
            raise ValueError("temperature 0'dan buyuk olmalidir.")

        probs = self.next_char_probs(context)

        if not probs:
            return "?"

        chars = list(probs.keys())
        weights = [prob ** (1 / temperature) for prob in probs.values()]
        total = sum(weights)
        normalized_weights = [weight / total for weight in weights]

        return random.choices(chars, weights=normalized_weights, k=1)[0]

    def generate(self, seed, max_len=80, temperature=1.0):
        """Baslangic metninden karakter karakter devam uretir."""
        output = seed.lower()

        for _ in range(max_len):
            next_char = self.sample_next(output, temperature=temperature)

            if next_char in ["$", "?"]:
                break

            output += next_char

        return output

    def explain_context(self, context):
        """Bir context icin sayim ve olasiliklari okunabilir bicimde verir."""
        context = context.lower()[-(self.n - 1) :]
        counts = self.table.get(context, Counter())
        probs = self.next_char_probs(context)

        return {
            "context": context,
            "counts": dict(counts),
            "probabilities": {char: round(prob, 3) for char, prob in probs.items()},
        }


def build_training_texts():
    return [
        "bulut dosya yukle",
        "bulut dosya indir",
        "bulut klasor olustur",
        "dosya paylas",
        "dosya sil",
        "dosya ara",
        "depolama alani doldu",
        "kullanici giris yapti",
        "sifre ile kayit ol",
        "paylasim linki olustur",
        "klasor yeniden adlandir",
        "bos klasoru sil",
    ]


def run_demo():
    random.seed(7)

    texts = build_training_texts()
    model = CharNGramModel(n=4)
    model.fit(texts)

    print("=== Egitim metinleri ===")
    for text in texts:
        print("-", text)

    print("\n=== Context aciklamalari ===")
    for context in ["bul", "dos", "kla", "pay"]:
        print(model.explain_context(context))

    print("\n=== Deterministik tahmin ===")
    for context in ["bul", "dos", "kla", "sif"]:
        print(f"{context!r} -> {model.predict_next(context)!r}")

    print("\n=== Metin uretimi ===")
    seeds = ["bul", "dos", "kla", "pay"]
    temperatures = [0.6, 1.0, 1.4]

    for temperature in temperatures:
        print(f"\nTemperature: {temperature}")
        for seed in seeds:
            generated = model.generate(seed, temperature=temperature)
            print(f"{seed!r} -> {generated}")


if __name__ == "__main__":
    run_demo()
