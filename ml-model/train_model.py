import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import pickle

# Load dataset
df = pd.read_csv("dataset.csv")

X = df[["temperature", "humidity", "rainfall"]]
y = df["label"]

# 🔥 Stronger model
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=12,
    random_state=42
)

model.fit(X, y)

pickle.dump(model, open("model.pkl", "wb"))

print("✅ Model trained with realistic dataset")