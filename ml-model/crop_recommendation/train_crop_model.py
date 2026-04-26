"""
Production-grade training script for the Crop Recommendation model.

What this script does
---------------------
1. Loads Crop_recommendation.csv (run generate_crop_dataset.py first)
2. Encodes class labels with LabelEncoder
3. Builds a sklearn Pipeline:
       StandardScaler  →  RandomForestClassifier
   Bundling the scaler in the pipeline ensures that inference always
   uses the same scaling as training — no "forgot to scale" bugs.
4. Tunes hyper-parameters with RandomizedSearchCV (5-fold stratified CV)
5. Re-trains on the full training split using the best params
6. Reports: test accuracy, cross-val mean ± std, per-class precision/recall,
   and feature importance
7. Saves three artefacts:
       crop_pipeline.pkl     — scaler + model (use this for inference)
       label_encoder.pkl     — maps integer → crop name
       model_metrics.json    — accuracy, cv scores, feature importance

Why RandomForest?
-----------------
- Naturally handles multi-class without one-vs-rest wrappers
- Non-parametric — no assumption about feature distributions
- Feature importance is built-in (mean impurity decrease)
- Robust to outliers and doesn't need feature scaling,
  but wrapping in a Pipeline with StandardScaler still helps if
  we later swap to an SVM or logistic regression without code changes

Usage
-----
    python train_crop_model.py
Expected output: Test accuracy ≥ 99 %  (with 6,600-row synthetic dataset)
"""

import json
import os
import pickle
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import (
    RandomizedSearchCV,
    StratifiedKFold,
    cross_val_score,
    train_test_split,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
FEATURES   = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TEST_SIZE  = 0.20
CV_FOLDS   = 5
N_ITER     = 30       # RandomizedSearchCV iterations
RANDOM_STATE = 42

script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path   = os.path.join(script_dir, "Crop_recommendation.csv")

# ---------------------------------------------------------------------------
# 1. Load data
# ---------------------------------------------------------------------------
if not os.path.exists(csv_path):
    raise FileNotFoundError(
        f"Dataset not found at {csv_path}.\n"
        "Run  python generate_crop_dataset.py  first."
    )

df = pd.read_csv(csv_path)
print(f"\nLoaded {len(df):,} rows, {df['label'].nunique()} crop classes")
print(df["label"].value_counts().to_string())

# ---------------------------------------------------------------------------
# 2. Encode labels
# ---------------------------------------------------------------------------
le = LabelEncoder()
y  = le.fit_transform(df["label"])
X  = df[FEATURES].values.astype(np.float32)

n_classes = len(le.classes_)
print(f"\nClasses ({n_classes}): {', '.join(le.classes_)}")

# ---------------------------------------------------------------------------
# 3. Train / test split  (stratified so each crop is represented equally)
# ---------------------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
)
print(f"\nTrain: {len(X_train):,} samples   Test: {len(X_test):,} samples")

# ---------------------------------------------------------------------------
# 4. Hyper-parameter search
#    StandardScaler is inside the Pipeline so CV never leaks test stats.
# ---------------------------------------------------------------------------
pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("clf",    RandomForestClassifier(random_state=RANDOM_STATE, n_jobs=-1)),
])

param_dist = {
    "clf__n_estimators":      [100, 200, 300, 500],
    "clf__max_depth":         [None, 10, 15, 20, 30],
    "clf__min_samples_split": [2, 4, 6],
    "clf__min_samples_leaf":  [1, 2, 3],
    "clf__max_features":      ["sqrt", "log2", None],
}

cv_splitter = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)

search = RandomizedSearchCV(
    pipeline,
    param_distributions=param_dist,
    n_iter=N_ITER,
    scoring="accuracy",
    cv=cv_splitter,
    n_jobs=-1,
    random_state=RANDOM_STATE,
    verbose=1,
)

print(f"\nRunning RandomizedSearchCV ({N_ITER} iterations, {CV_FOLDS}-fold CV)…")
search.fit(X_train, y_train)

best_params = search.best_params_
print(f"\nBest CV accuracy : {search.best_score_ * 100:.4f}%")
print(f"Best params      : {best_params}")

best_pipeline = search.best_estimator_

# ---------------------------------------------------------------------------
# 5. Cross-validation on the full training set with best model
# ---------------------------------------------------------------------------
cv_scores = cross_val_score(
    best_pipeline, X_train, y_train,
    cv=cv_splitter, scoring="accuracy", n_jobs=-1
)
print(f"\nCross-val accuracy: {cv_scores.mean() * 100:.4f}% ± {cv_scores.std() * 100:.4f}%")

# ---------------------------------------------------------------------------
# 6. Final evaluation on held-out test set
# ---------------------------------------------------------------------------
y_pred = best_pipeline.predict(X_test)
test_acc = accuracy_score(y_test, y_pred)
print(f"\nTest accuracy     : {test_acc * 100:.4f}%")

report = classification_report(y_test, y_pred, target_names=le.classes_, digits=4)
print("\nPer-class report:\n")
print(report)

# ---------------------------------------------------------------------------
# 7. Feature importance (from the RF inside the pipeline)
# ---------------------------------------------------------------------------
rf_model  = best_pipeline.named_steps["clf"]
importances = rf_model.feature_importances_
sorted_idx  = importances.argsort()[::-1]

print("Feature importances (descending):")
feature_importance_dict = {}
for rank, idx in enumerate(sorted_idx, 1):
    feat = FEATURES[idx]
    imp  = round(float(importances[idx]), 6)
    feature_importance_dict[feat] = imp
    print(f"  {rank}. {feat:15s} {imp:.6f}")

# ---------------------------------------------------------------------------
# 8. Save artefacts
# ---------------------------------------------------------------------------
pipeline_path = os.path.join(script_dir, "crop_pipeline.pkl")
le_path       = os.path.join(script_dir, "label_encoder.pkl")
metrics_path  = os.path.join(script_dir, "model_metrics.json")

with open(pipeline_path, "wb") as f:
    pickle.dump(best_pipeline, f)

with open(le_path, "wb") as f:
    pickle.dump(le, f)

metrics = {
    "trained_at":          datetime.now(tz=timezone.utc).isoformat(),
    "model_type":          "Pipeline(StandardScaler + RandomForestClassifier)",
    "n_classes":           n_classes,
    "class_names":         list(le.classes_),
    "features":            FEATURES,
    "n_samples_train":     int(len(X_train)),
    "n_samples_test":      int(len(X_test)),
    "test_accuracy":       round(float(test_acc), 6),
    "cv_mean_accuracy":    round(float(cv_scores.mean()), 6),
    "cv_std_accuracy":     round(float(cv_scores.std()), 6),
    "best_cv_accuracy":    round(float(search.best_score_), 6),
    "best_params":         {k: (None if v is None else v) for k, v in best_params.items()},
    "feature_importance":  feature_importance_dict,
}

with open(metrics_path, "w") as f:
    json.dump(metrics, f, indent=2)

print(f"\nSaved pipeline      → {pipeline_path}")
print(f"Saved label encoder → {le_path}")
print(f"Saved metrics       → {metrics_path}")
print(f"\nDone. Test accuracy = {test_acc * 100:.4f}%")
