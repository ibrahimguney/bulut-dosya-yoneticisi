import unittest

from src.tokenizer import CharTokenizer


class TokenizerTests(unittest.TestCase):
    def test_round_trip(self):
        tokenizer = CharTokenizer.train("merhaba")
        ids = tokenizer.encode("merhaba")
        self.assertEqual(tokenizer.decode(ids), "merhaba")

    def test_unknown_character_is_clear_error(self):
        tokenizer = CharTokenizer.train("abc")
        with self.assertRaises(ValueError):
            tokenizer.encode("abcd")


if __name__ == "__main__":
    unittest.main()
