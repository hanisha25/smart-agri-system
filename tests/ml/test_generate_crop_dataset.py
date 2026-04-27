import importlib.util
import pathlib
import unittest


SCRIPT_PATH = pathlib.Path(__file__).resolve().parents[2] / "ml-model" / "crop_recommendation" / "generate_crop_dataset.py"
SPEC = importlib.util.spec_from_file_location("generate_crop_dataset", SCRIPT_PATH)
generate_crop_dataset = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(generate_crop_dataset)


class GenerateCropDatasetTests(unittest.TestCase):
    def test_build_dataframe_shape(self):
        df = generate_crop_dataset.build_dataframe()
        self.assertEqual(len(df), 6600)
        self.assertEqual(df["label"].nunique(), 22)

    def test_required_columns_exist(self):
        df = generate_crop_dataset.build_dataframe()
        expected = {"N", "P", "K", "temperature", "humidity", "ph", "rainfall", "label"}
        self.assertTrue(expected.issubset(set(df.columns)))

    def test_all_values_are_within_bounds(self):
        df = generate_crop_dataset.build_dataframe()
        self.assertTrue(df["ph"].between(0, 14).all())
        self.assertTrue(df["humidity"].between(0, 100).all())


if __name__ == "__main__":
    unittest.main()
