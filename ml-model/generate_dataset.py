import pandas as pd
import random

rows = []

for _ in range(1200):  # 🔥 more data
    temp = round(random.uniform(20, 42), 2)
    humidity = round(random.uniform(40, 90), 2)
    rain = round(random.uniform(0, 30), 2)

    # 🌱 Soft probabilistic labeling (NOT strict rules)
    score = temp * 0.4 + (100 - humidity) * 0.3 + rain * -0.3

    noise = random.uniform(-5, 5)  # randomness
    score += noise

    if score < 15:
        label = "Good conditions"
    elif score < 25:
        label = "Moderate stress"
    elif score < 35:
        label = "Irrigation recommended"
    elif score < 45:
        label = "High heat stress"
    else:
        label = "Extreme heat risk"

    rows.append([temp, humidity, rain, label])

df = pd.DataFrame(rows, columns=[
    "temperature", "humidity", "rainfall", "label"
])

df.to_csv("dataset.csv", index=False)

print("✅ Realistic dataset generated (1200 rows)")