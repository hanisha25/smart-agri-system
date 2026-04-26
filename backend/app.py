import os
import pickle
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Load crop recommendation model once at startup
# ---------------------------------------------------------------------------
_MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "ml-model", "crop_recommendation")

_model = None
_label_encoder = None

def _load_model():
    global _model, _label_encoder
    model_path = os.path.join(_MODEL_DIR, "crop_model.pkl")
    le_path    = os.path.join(_MODEL_DIR, "label_encoder.pkl")
    if os.path.exists(model_path) and os.path.exists(le_path):
        _model         = pickle.load(open(model_path, "rb"))
        _label_encoder = pickle.load(open(le_path,    "rb"))
        print("✅ Crop recommendation model loaded")
    else:
        print("⚠️  Crop model not found — run ml-model/crop_recommendation/train_crop_model.py first")

_load_model()

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def home():
    return {"message": "Backend Running 🚀"}


@app.route("/health")
def health():
    model_ready = _model is not None
    return jsonify({"status": "ok", "model_ready": model_ready}), 200


@app.route("/predict-crop", methods=["POST"])
def predict_crop():
    if _model is None or _label_encoder is None:
        return jsonify({"error": "Model not loaded. Run train_crop_model.py first."}), 503

    body = request.get_json(force=True, silent=True) or {}
    missing = [f for f in FEATURES if body.get(f) is None]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    try:
        values = [float(body[f]) for f in FEATURES]
    except (ValueError, TypeError) as exc:
        return jsonify({"error": f"Invalid numeric value: {exc}"}), 400

    data = pd.DataFrame([values], columns=FEATURES)

    proba       = _model.predict_proba(data)[0]
    top_indices = proba.argsort()[::-1][:3]

    recommended_crop = _label_encoder.classes_[top_indices[0]]
    confidence       = round(float(proba[top_indices[0]]), 4)
    top3 = [
        {"crop": _label_encoder.classes_[i], "confidence": round(float(proba[i]), 4)}
        for i in top_indices
    ]

    return jsonify({
        "recommended_crop": recommended_crop,
        "confidence":       confidence,
        "top3":             top3,
    })


if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5401))
    app.run(debug=False, port=port)
