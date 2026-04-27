"""
CLI prediction helper — uses the trained Pipeline (scaler + model).

Usage
-----
    python predict_crop.py <N> <P> <K> <temperature> <humidity> <ph> <rainfall>

Example
-------
    python predict_crop.py 90 42 43 21 82 6.5 203
    → Rice (92.5%), Jute (4.0%), Maize (2.0%)

The pipeline contains StandardScaler so raw agronomic values are passed
directly — no manual scaling needed.

Pre-requisites
--------------
Run these scripts first (in order):
    python generate_crop_dataset.py
    python train_crop_model.py
"""

import os
import pickle
import sys

import pandas as pd

# ---------------------------------------------------------------------------
# Feature names and hard agronomic bounds for input validation
# ---------------------------------------------------------------------------
FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

BOUNDS = {
    "N":           (0,   200),   # kg/ha
    "P":           (0,   150),   # kg/ha
    "K":           (0,   250),   # kg/ha
    "temperature": (-10, 55),    # °C
    "humidity":    (0,   100),   # %
    "ph":          (0,   14),    # pH units
    "rainfall":    (0,   500),   # mm/month
}

UNITS = {
    "N": "kg/ha", "P": "kg/ha", "K": "kg/ha",
    "temperature": "°C", "humidity": "%", "ph": "", "rainfall": "mm/mo",
}


def load_artefacts(script_dir: str):
    pipeline_path = os.path.join(script_dir, "crop_pipeline.pkl")
    le_path       = os.path.join(script_dir, "label_encoder.pkl")

    if not os.path.exists(pipeline_path):
        print("ERROR: crop_pipeline.pkl not found.")
        print("Run  python train_crop_model.py  first.")
        sys.exit(1)

    if not os.path.exists(le_path):
        print("ERROR: label_encoder.pkl not found.")
        print("Run  python train_crop_model.py  first.")
        sys.exit(1)

    with open(pipeline_path, "rb") as f:
        pipeline = pickle.load(f)
    with open(le_path, "rb") as f:
        le = pickle.load(f)

    return pipeline, le


def validate_inputs(values: list[float]) -> list[str]:
    """Return a list of validation error messages (empty list = all OK)."""
    errors = []
    for feat, val in zip(FEATURES, values):
        lo, hi = BOUNDS[feat]
        if not (lo <= val <= hi):
            errors.append(f"  {feat} = {val} is outside valid range [{lo}, {hi}]")
    return errors


def predict(pipeline, le, values: list[float]) -> dict:
    """Run inference and return a structured result dict."""
    df   = pd.DataFrame([values], columns=FEATURES)
    proba = pipeline.predict_proba(df)[0]

    top_indices = proba.argsort()[::-1][:5]
    top3 = [
        {"crop": le.classes_[i], "confidence": round(float(proba[i]), 4)}
        for i in top_indices
        if proba[i] > 0.001          # skip near-zero candidates
    ][:3]

    return {
        "recommended_crop": top3[0]["crop"],
        "confidence":       top3[0]["confidence"],
        "top3":             top3,
    }


def print_result(result: dict, values: list[float]) -> None:
    bar = "─" * 48
    print(f"\n{bar}")
    print(f"  Crop Recommendation")
    print(bar)

    print("\n  Input values:")
    for feat, val in zip(FEATURES, values):
        unit = UNITS[feat]
        print(f"    {feat:12s} {val:>8.2f}  {unit}")

    print(f"\n  Top recommendation : {result['recommended_crop'].upper()}")
    print(f"  Confidence         : {result['confidence'] * 100:.1f}%")

    print("\n  All candidates:")
    for rank, item in enumerate(result["top3"], 1):
        bar_len = int(item["confidence"] * 30)
        bar_str = "█" * bar_len + "░" * (30 - bar_len)
        print(f"    {rank}. {item['crop']:14s} {item['confidence']*100:5.1f}%  {bar_str}")

    print(f"\n{'─' * 48}\n")


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    pipeline, le = load_artefacts(script_dir)

    if len(sys.argv) < 8:
        print(__doc__)
        print("Usage: python predict_crop.py N P K temperature humidity ph rainfall")
        sys.exit(1)

    try:
        values = [float(sys.argv[i]) for i in range(1, 8)]
    except ValueError:
        print("ERROR: All 7 arguments must be numbers.")
        sys.exit(1)

    errors = validate_inputs(values)
    if errors:
        print("Input validation failed:")
        print("\n".join(errors))
        sys.exit(1)

    result = predict(pipeline, le, values)
    print_result(result, values)


if __name__ == "__main__":
    main()
