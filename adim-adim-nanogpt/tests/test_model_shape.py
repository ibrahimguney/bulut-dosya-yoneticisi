import importlib.util
import unittest


@unittest.skipIf(importlib.util.find_spec("torch") is None, "torch kurulu degil")
class ModelShapeTests(unittest.TestCase):
    def test_forward_shape(self):
        import torch

        from src.model import GPTConfig, MiniGPT

        config = GPTConfig(vocab_size=20, block_size=8, n_layer=1, n_head=2, n_embd=16)
        model = MiniGPT(config)
        x = torch.randint(0, 20, (4, 8))
        logits, loss = model(x, x)
        self.assertEqual(tuple(logits.shape), (4, 8, 20))
        self.assertIsNotNone(loss)


if __name__ == "__main__":
    unittest.main()
