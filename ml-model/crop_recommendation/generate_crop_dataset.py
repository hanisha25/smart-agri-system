"""
Generate a synthetic crop recommendation dataset based on agronomic research ranges.
22 crop classes, 100 samples each = 2200 rows.
Features: N, P, K (kg/ha), temperature (°C), humidity (%), ph, rainfall (mm)
"""
import random
import pandas as pd

CROP_PROFILES = {
    "rice":        dict(n=(60,120),  p=(30,60),  k=(30,60),  t=(20,27), h=(80,90), ph=(5.5,6.5), r=(150,300)),
    "maize":       dict(n=(80,140),  p=(40,70),  k=(30,60),  t=(18,28), h=(55,75), ph=(5.8,7.0), r=(50,100)),
    "chickpea":    dict(n=(10,30),   p=(40,80),  k=(20,40),  t=(18,26), h=(14,22), ph=(6.0,7.5), r=(60,100)),
    "kidneybeans": dict(n=(10,30),   p=(40,80),  k=(20,40),  t=(18,27), h=(18,24), ph=(5.5,7.0), r=(100,150)),
    "pigeonpeas":  dict(n=(15,40),   p=(30,60),  k=(20,40),  t=(25,35), h=(40,60), ph=(6.0,7.5), r=(60,100)),
    "mothbeans":   dict(n=(15,35),   p=(30,60),  k=(20,40),  t=(24,38), h=(45,65), ph=(6.0,7.5), r=(50,80)),
    "mungbean":    dict(n=(10,30),   p=(30,60),  k=(20,40),  t=(25,35), h=(80,90), ph=(6.0,7.5), r=(60,100)),
    "blackgram":   dict(n=(10,30),   p=(30,60),  k=(20,40),  t=(25,35), h=(65,75), ph=(6.0,7.5), r=(65,100)),
    "lentil":      dict(n=(10,30),   p=(40,80),  k=(20,40),  t=(15,25), h=(60,70), ph=(6.0,7.5), r=(35,60)),
    "pomegranate": dict(n=(60,120),  p=(30,60),  k=(40,80),  t=(18,38), h=(85,95), ph=(5.5,7.5), r=(100,200)),
    "banana":      dict(n=(80,140),  p=(40,80),  k=(80,160), t=(25,35), h=(75,85), ph=(5.5,7.0), r=(100,200)),
    "mango":       dict(n=(60,120),  p=(30,60),  k=(30,60),  t=(24,35), h=(50,70), ph=(5.5,7.5), r=(90,200)),
    "grapes":      dict(n=(60,120),  p=(30,60),  k=(40,80),  t=(15,25), h=(65,80), ph=(5.5,7.5), r=(60,100)),
    "watermelon":  dict(n=(50,100),  p=(40,80),  k=(60,120), t=(24,35), h=(80,90), ph=(6.0,7.0), r=(40,70)),
    "muskmelon":   dict(n=(50,100),  p=(40,80),  k=(60,120), t=(28,38), h=(90,95), ph=(6.0,7.0), r=(20,40)),
    "apple":       dict(n=(40,80),   p=(40,80),  k=(40,80),  t=(0,20),  h=(90,95), ph=(5.5,6.5), r=(100,200)),
    "orange":      dict(n=(60,120),  p=(30,60),  k=(30,60),  t=(10,30), h=(90,95), ph=(6.0,7.5), r=(110,200)),
    "papaya":      dict(n=(60,120),  p=(30,60),  k=(60,120), t=(25,35), h=(90,95), ph=(5.5,6.5), r=(140,200)),
    "coconut":     dict(n=(50,100),  p=(30,60),  k=(80,160), t=(25,35), h=(90,95), ph=(5.5,7.5), r=(130,200)),
    "cotton":      dict(n=(80,160),  p=(40,80),  k=(40,80),  t=(21,30), h=(75,85), ph=(6.0,7.5), r=(60,110)),
    "jute":        dict(n=(60,120),  p=(30,60),  k=(30,60),  t=(24,37), h=(70,90), ph=(6.0,7.0), r=(150,250)),
    "coffee":      dict(n=(60,120),  p=(30,60),  k=(30,60),  t=(15,28), h=(95,100),ph=(5.5,6.5), r=(150,250)),
}

SAMPLES_PER_CROP = 100
random.seed(42)

rows = []
for crop, ranges in CROP_PROFILES.items():
    for _ in range(SAMPLES_PER_CROP):
        noise = lambda lo, hi: round(random.gauss((lo + hi) / 2, (hi - lo) / 6), 2)
        n   = max(0, noise(ranges["n"][0], ranges["n"][1]))
        p   = max(0, noise(ranges["p"][0], ranges["p"][1]))
        k   = max(0, noise(ranges["k"][0], ranges["k"][1]))
        t   = noise(ranges["t"][0], ranges["t"][1])
        h   = min(100, max(0, noise(ranges["h"][0], ranges["h"][1])))
        ph  = round(min(14, max(0, noise(ranges["ph"][0], ranges["ph"][1]))), 2)
        r   = max(0, noise(ranges["r"][0], ranges["r"][1]))
        rows.append([round(n,2), round(p,2), round(k,2), round(t,2), round(h,2), ph, round(r,2), crop])

df = pd.DataFrame(rows, columns=["N","P","K","temperature","humidity","ph","rainfall","label"])
df.to_csv("Crop_recommendation.csv", index=False)
print(f"✅ Generated {len(df)} rows across {len(CROP_PROFILES)} crops → Crop_recommendation.csv")
