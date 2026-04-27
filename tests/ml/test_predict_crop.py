import importlib.util
import pathlib
import unittest

import numpy as np


SCRIPT_PATH = pathlib.Path(__file__).resolve().parents[2] / "ml-model" / "crop_recommendation" / "predict_crop.py"
SPEC = importlib.util.spec_from_file_location("predict_crop", SCRIPT_PATH)
predict_crop = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(predict_crop)


class DummyPipeline:
    def predict_proba(self, df):
        self.last_columns = list(df.columns)
        return np.array([[0.7, 0.2, 0.1]])


class DummyLabelEncoder:
    classes_ = ["rice", "maize", "cotton"]


class PredictCropTests(unittest.TestCase):
    def test_validate_inputs_accepts_values_within_bounds(self):
        values = [90, 45, 55, 25, 82, 6.5, 180]
        errors = predict_crop.validate_inputs(values)
        self.assertEqual(errors, [])

    def test_validate_inputs_rejects_out_of_range_values(self):
        values = [90, 45, 55, 25, 82, 15.0, 180]
        errors = predict_crop.validate_inputs(values)
        self.assertEqual(len(errors), 1)
        self.assertIn("ph", errors[0].lower())

    def test_predict_returns_ranked_result(self):
        pipeline = DummyPipeline()
        le = DummyLabelEncoder()
        values = [90, 45, 55, 25, 82, 6.5, 180]

        result = predict_crop.predict(pipeline, le, values)

        self.assertEqual(result["recommended_crop"], "rice")
        self.assertAlmostEqual(result["confidence"], 0.7, places=4)
        self.assertEqual(len(result["top3"]), 3)
        self.assertEqual(pipeline.last_columns, predict_crop.FEATURES)

    def test_print_result_executes_without_error(self):
        result = {
            "recommended_crop": "rice",
            "confidence": 0.7,
            "top3": [
                {"crop": "rice", "confidence": 0.7},
                {"crop": "maize", "confidence": 0.2},
            ],
        }
        values = [90, 45, 55, 25, 82, 6.5, 180]

        # Should only print output, not raise.
        predict_crop.print_result(result, values)


if __name__ == "__main__":
    unittest.main()
