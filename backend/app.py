"""
Flask ML sidecar — serves the Crop Recommendation model over HTTP.

Endpoints
---------
GET  /              health check (plain text)
GET  /health        JSON health status + model readiness
GET  /metrics       model metadata (accuracy, features, classes, etc.)
POST /predict-crop  predict best crop for given soil + climate values

Why a separate Flask process?
------------------------------
Node.js cannot run scikit-learn natively.  A lightweight Flask sidecar
keeps the ML runtime isolated from the main Express server, so each can
be updated, scaled, or restarted independently.

Start with:
    ML_PORT=5401 python backend/app.py
"""

import json
import logging
import os
import pickle

import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App init
# ---------------------------------------------------------------------------
app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Feature definitions + agronomic bounds (used for input validation)
# ---------------------------------------------------------------------------
FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

FEATURE_BOUNDS = {
    "N":           (0,   200),
    "P":           (0,   150),
    "K":           (0,   250),
    "temperature": (-10, 55),
    "humidity":    (0,   100),
    "ph":          (0,   14),
    "rainfall":    (0,   500),
}

# Minimum confidence to include a candidate in top-3 results
MIN_CONFIDENCE = 0.05

# ---------------------------------------------------------------------------
# Model loading (once at startup)
# ---------------------------------------------------------------------------
_MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "ml-model", "crop_recommendation")

_pipeline      = None
_label_encoder = None
_model_metrics = {}


def _load_model():
    global _pipeline, _label_encoder, _model_metrics

    pipeline_path = os.path.join(_MODEL_DIR, "crop_pipeline.pkl")
    le_path       = os.path.join(_MODEL_DIR, "label_encoder.pkl")
    metrics_path  = os.path.join(_MODEL_DIR, "model_metrics.json")

    if not os.path.exists(pipeline_path):
        log.warning("crop_pipeline.pkl not found — run train_crop_model.py first")
        return
    if not os.path.exists(le_path):
        log.warning("label_encoder.pkl not found — run train_crop_model.py first")
        return

    with open(pipeline_path, "rb") as f:
        _pipeline = pickle.load(f)
    with open(le_path, "rb") as f:
        _label_encoder = pickle.load(f)

    if os.path.exists(metrics_path):
        with open(metrics_path) as f:
            _model_metrics = json.load(f)

    acc = _model_metrics.get("test_accuracy", "unknown")
    log.info("Crop recommendation model loaded  (test accuracy: %s)", acc)


_load_model()


# ---------------------------------------------------------------------------
# Input validation helper
# ---------------------------------------------------------------------------
def _validate_payload(body: dict) -> tuple[list[float] | None, str | None]:
    """
    Extract and validate the 7 feature values from a request body dict.

    Returns (values_list, None) on success or (None, error_message) on failure.
    """
    missing = [f for f in FEATURES if body.get(f) is None]
    if missing:
        return None, f"Missing fields: {', '.join(missing)}"

    values = []
    for feat in FEATURES:
        try:
            val = float(body[feat])
        except (TypeError, ValueError):
            return None, f"'{feat}' must be a number, got: {body[feat]!r}"

        lo, hi = FEATURE_BOUNDS[feat]
        if not (lo <= val <= hi):
            return None, (
                f"'{feat}' value {val} is outside the valid range [{lo}, {hi}]. "
                "Please check your soil test / weather data."
            )
        values.append(val)

    return values, None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def home():
    return "Crop Recommendation ML Service — see /health for status", 200


@app.route("/health")
def health():
    return jsonify({
        "status":      "ok",
        "model_ready": _pipeline is not None,
        "n_classes":   _model_metrics.get("n_classes"),
        "test_accuracy": _model_metrics.get("test_accuracy"),
    }), 200


@app.route("/metrics")
def metrics():
    if not _model_metrics:
        return jsonify({"error": "Model not loaded — metrics unavailable"}), 503
    return jsonify(_model_metrics), 200


@app.route("/predict-crop", methods=["POST"])
def predict_crop():
    if _pipeline is None or _label_encoder is None:
        return jsonify({
            "error": "Model not loaded. Run ml-model/crop_recommendation/train_crop_model.py first."
        }), 503

    # Require explicit JSON content-type — reject form data, raw text, etc.
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 415

    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Request body must be a JSON object"}), 400

    values, err = _validate_payload(body)
    if err:
        log.warning("Predict-crop validation error: %s", err)
        return jsonify({"error": err}), 400

    # Run inference through the full pipeline (scaler → RF)
    df     = pd.DataFrame([values], columns=FEATURES)
    proba  = _pipeline.predict_proba(df)[0]

    top_indices = proba.argsort()[::-1]
    top3 = [
        {"crop": _label_encoder.classes_[i], "confidence": round(float(proba[i]), 4)}
        for i in top_indices
        if proba[i] >= MIN_CONFIDENCE
    ][:3]

    if not top3:
        # Fallback: just return the highest-probability crop even if low confidence
        best_idx = int(proba.argmax())
        top3 = [{"crop": _label_encoder.classes_[best_idx], "confidence": round(float(proba[best_idx]), 4)}]

    log.info(
        "Prediction: %s (%.1f%%)  | N=%s P=%s K=%s T=%s H=%s pH=%s R=%s",
        top3[0]["crop"], top3[0]["confidence"] * 100, *values,
    )

    return jsonify({
        "recommended_crop": top3[0]["crop"],
        "confidence":       top3[0]["confidence"],
        "top3":             top3,
    }), 200


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5401))
    log.info("Starting ML sidecar on port %d", port)
    # debug=False in production; use gunicorn for real deployments
    app.run(host="0.0.0.0", port=port, debug=False)
