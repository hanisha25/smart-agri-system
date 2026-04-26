"""
CLI prediction helper for manual testing.
Usage: python predict_crop.py <N> <P> <K> <temperature> <humidity> <ph> <rainfall>
Example: python predict_crop.py 90 42 43 21 82 6.5 203
"""
import pickle
import sys
import os
import pandas as pd

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

try:
    script_dir = os.path.dirname(__file__)
    model = pickle.load(open(os.path.join(script_dir, "crop_model.pkl"), "rb"))
    le    = pickle.load(open(os.path.join(script_dir, "label_encoder.pkl"), "rb"))

    if len(sys.argv) < 8:
        print("Usage: python predict_crop.py N P K temperature humidity ph rainfall")
        sys.exit(1)

    values = [float(sys.argv[i]) for i in range(1, 8)]
    data = pd.DataFrame([values], columns=FEATURES)

    proba = model.predict_proba(data)[0]
    top_indices = proba.argsort()[::-1][:3]

    top_crop = le.classes_[top_indices[0]]
    confidence = round(float(proba[top_indices[0]]), 4)
    top3 = [
        {"crop": le.classes_[i], "confidence": round(float(proba[i]), 4)}
        for i in top_indices
    ]

    print(f"Recommended crop : {top_crop}")
    print(f"Confidence       : {confidence * 100:.1f}%")
    print("Top 3 candidates:")
    for item in top3:
        print(f"  {item['crop']}: {item['confidence'] * 100:.1f}%")

except Exception as e:
    print(f"Prediction error: {e}")
    sys.exit(1)
