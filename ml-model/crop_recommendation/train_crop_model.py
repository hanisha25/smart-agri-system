"""
Train a RandomForestClassifier on the crop recommendation dataset.
Outputs: crop_model.pkl (trained model), label_encoder.pkl (LabelEncoder)
"""
import os
import pickle
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

script_dir = os.path.dirname(__file__)
csv_path = os.path.join(script_dir, "Crop_recommendation.csv")

if not os.path.exists(csv_path):
    raise FileNotFoundError(
        f"Dataset not found at {csv_path}.\n"
        "Run generate_crop_dataset.py first."
    )

df = pd.read_csv(csv_path)
print(f"Loaded {len(df)} rows, {df['label'].nunique()} crop classes")

le = LabelEncoder()
df["label_enc"] = le.fit_transform(df["label"])

X = df[FEATURES]
y = df["label_enc"].values

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_split=4,
    random_state=42,
    n_jobs=-1,
)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"✅ Test accuracy: {acc * 100:.2f}%")
print(classification_report(y_test, y_pred, target_names=le.classes_))

model_path = os.path.join(script_dir, "crop_model.pkl")
le_path = os.path.join(script_dir, "label_encoder.pkl")

pickle.dump(model, open(model_path, "wb"))
pickle.dump(le, open(le_path, "wb"))
print(f"✅ Saved model  → {model_path}")
print(f"✅ Saved encoder→ {le_path}")
