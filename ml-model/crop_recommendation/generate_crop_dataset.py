"""
Generate a high-quality synthetic crop recommendation dataset.

Design choices:
- 22 crop classes × 300 samples = 6,600 rows total (3× more than the original 2,200)
- Feature ranges sourced from peer-reviewed agronomic literature (FAO, ICAR guides)
- Each sample is a 70/30 blend of Gaussian (realistic peak) + Uniform (full-range coverage)
  so the model sees both ideal and edge-case conditions during training
- All values are clipped to hard agronomic bounds so no sample is physically impossible
- Dataset is shuffled before saving to prevent ordering bias during training

Features
--------
N           Nitrogen content of soil (kg/ha)
P           Phosphorus content of soil (kg/ha)
K           Potassium content of soil (kg/ha)
temperature Mean temperature during growing season (°C)
humidity    Relative humidity during growing season (%)
ph          Soil pH
rainfall    Average monthly rainfall (mm)

Usage
-----
    python generate_crop_dataset.py
Outputs: Crop_recommendation.csv  (in same directory)
"""

import os
import random
import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Agronomic profiles — (lo, hi) for each feature per crop
# Sources: FAO crop manuals, ICAR package-of-practices, Kaggle crop-rec paper
# ---------------------------------------------------------------------------
CROP_PROFILES = {
    # Cereals & staples
    "rice":        dict(N=(60,120),  P=(30,60),  K=(30,60),  temperature=(20,27), humidity=(80,90),  ph=(5.5,6.5), rainfall=(150,300)),
    "maize":       dict(N=(80,140),  P=(40,70),  K=(30,60),  temperature=(18,28), humidity=(55,75),  ph=(5.8,7.0), rainfall=(50,100)),
    "jute":        dict(N=(60,120),  P=(30,60),  K=(30,60),  temperature=(24,37), humidity=(70,90),  ph=(6.0,7.0), rainfall=(150,250)),

    # Pulses (each distinguished by temperature / humidity / rainfall band)
    "chickpea":    dict(N=(10,30),   P=(40,80),  K=(20,40),  temperature=(18,26), humidity=(14,22),  ph=(6.0,7.5), rainfall=(60,100)),
    "kidneybeans": dict(N=(10,30),   P=(40,80),  K=(20,40),  temperature=(15,23), humidity=(18,24),  ph=(5.5,7.0), rainfall=(100,150)),
    "pigeonpeas":  dict(N=(15,40),   P=(30,60),  K=(20,40),  temperature=(25,35), humidity=(40,60),  ph=(6.0,7.5), rainfall=(60,100)),
    "mothbeans":   dict(N=(15,35),   P=(30,60),  K=(20,40),  temperature=(28,40), humidity=(45,65),  ph=(6.0,7.5), rainfall=(40,75)),
    "mungbean":    dict(N=(10,30),   P=(30,60),  K=(20,40),  temperature=(25,35), humidity=(80,90),  ph=(6.0,7.5), rainfall=(60,100)),
    "blackgram":   dict(N=(10,30),   P=(30,60),  K=(20,40),  temperature=(25,35), humidity=(65,75),  ph=(6.0,7.5), rainfall=(65,100)),
    "lentil":      dict(N=(10,30),   P=(40,80),  K=(20,40),  temperature=(13,23), humidity=(55,70),  ph=(6.0,7.5), rainfall=(35,60)),

    # Cash crops
    "cotton":      dict(N=(80,160),  P=(40,80),  K=(40,80),  temperature=(21,30), humidity=(50,70),  ph=(6.0,7.5), rainfall=(60,110)),
    "coffee":      dict(N=(60,120),  P=(30,60),  K=(30,60),  temperature=(15,28), humidity=(78,92),  ph=(5.5,6.5), rainfall=(150,250)),

    # Fruits
    "pomegranate": dict(N=(60,120),  P=(30,60),  K=(40,80),  temperature=(25,38), humidity=(40,70),  ph=(5.5,7.0), rainfall=(50,90)),
    "banana":      dict(N=(80,140),  P=(40,80),  K=(80,160), temperature=(25,35), humidity=(75,85),  ph=(5.5,7.0), rainfall=(100,200)),
    "mango":       dict(N=(60,120),  P=(30,60),  K=(30,60),  temperature=(24,35), humidity=(48,68),  ph=(5.5,7.5), rainfall=(90,200)),
    "grapes":      dict(N=(60,120),  P=(30,60),  K=(40,80),  temperature=(15,25), humidity=(62,78),  ph=(5.5,7.5), rainfall=(55,95)),
    "watermelon":  dict(N=(50,100),  P=(40,80),  K=(60,120), temperature=(24,35), humidity=(78,90),  ph=(6.0,7.0), rainfall=(40,70)),
    "muskmelon":   dict(N=(50,100),  P=(40,80),  K=(60,120), temperature=(28,38), humidity=(88,97),  ph=(6.0,7.0), rainfall=(18,38)),
    "apple":       dict(N=(40,80),   P=(40,80),  K=(40,80),  temperature=(0,20),  humidity=(88,97),  ph=(5.5,6.5), rainfall=(100,200)),
    "orange":      dict(N=(60,120),  P=(30,60),  K=(30,60),  temperature=(10,30), humidity=(88,97),  ph=(6.0,7.5), rainfall=(110,200)),
    "papaya":      dict(N=(60,120),  P=(30,60),  K=(60,120), temperature=(22,32), humidity=(88,97),  ph=(5.5,6.5), rainfall=(140,200)),
    "coconut":     dict(N=(50,100),  P=(30,60),  K=(80,160), temperature=(25,35), humidity=(88,97),  ph=(5.5,7.5), rainfall=(130,200)),
}

SAMPLES_PER_CROP = 300      # 300 × 22 = 6,600 rows total
GAUSSIAN_FRACTION = 0.70    # 70 % near ideal centre, 30 % uniform full-range

rng = np.random.default_rng(seed=42)  # reproducible


def _sample_feature(lo: float, hi: float, n: int) -> np.ndarray:
    """
    Blend Gaussian (centred, sigma ≈ range/6) with Uniform (full range).
    All values clipped to [lo, hi].
    """
    n_gauss = int(n * GAUSSIAN_FRACTION)
    n_unif  = n - n_gauss

    mid   = (lo + hi) / 2.0
    sigma = (hi - lo) / 6.0

    gauss = rng.normal(loc=mid, scale=sigma, size=n_gauss)
    unif  = rng.uniform(low=lo, high=hi, size=n_unif)

    samples = np.concatenate([gauss, unif])
    rng.shuffle(samples)
    return np.clip(samples, lo, hi)


def build_dataframe() -> pd.DataFrame:
    rows = []
    for crop, profile in CROP_PROFILES.items():
        n_arr   = _sample_feature(*profile["N"],           SAMPLES_PER_CROP)
        p_arr   = _sample_feature(*profile["P"],           SAMPLES_PER_CROP)
        k_arr   = _sample_feature(*profile["K"],           SAMPLES_PER_CROP)
        t_arr   = _sample_feature(*profile["temperature"], SAMPLES_PER_CROP)
        h_arr   = _sample_feature(*profile["humidity"],    SAMPLES_PER_CROP)
        ph_arr  = _sample_feature(*profile["ph"],          SAMPLES_PER_CROP)
        r_arr   = _sample_feature(*profile["rainfall"],    SAMPLES_PER_CROP)

        for i in range(SAMPLES_PER_CROP):
            rows.append({
                "N":           round(float(n_arr[i]),  2),
                "P":           round(float(p_arr[i]),  2),
                "K":           round(float(k_arr[i]),  2),
                "temperature": round(float(t_arr[i]),  2),
                "humidity":    round(float(h_arr[i]),  2),
                "ph":          round(float(ph_arr[i]), 2),
                "rainfall":    round(float(r_arr[i]),  2),
                "label":       crop,
            })

    df = pd.DataFrame(rows)
    # Shuffle so label order doesn't leak into train/test split
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    return df


if __name__ == "__main__":
    df = build_dataframe()
    script_dir = os.path.dirname(os.path.abspath(__file__))
    out_path   = os.path.join(script_dir, "Crop_recommendation.csv")
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df):,} rows × {df['label'].nunique()} crops  →  {out_path}")
    print("\nClass distribution:")
    print(df["label"].value_counts().to_string())
