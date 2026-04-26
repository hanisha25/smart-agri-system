# Smart Agriculture Platform

A production-grade farm operations platform built for Indian smallholder farmers. The system combines rule-based agronomic knowledge with a machine-learning crop recommendation engine to give data-driven planting guidance — no internet connection needed for the rule-based layer, and full ML accuracy when soil test data and weather are available.

---

## Table of Contents

1. [What Was Built](#what-was-built)
2. [System Architecture](#system-architecture)
3. [Crop Recommendation System](#crop-recommendation-system)
   - [How It Works](#how-it-works)
   - [ML Model Deep Dive](#ml-model-deep-dive)
   - [Rule-Based Engine](#rule-based-engine)
   - [Fixes and Improvements Made](#fixes-and-improvements-made)
4. [Technology Stack](#technology-stack)
5. [Project Structure](#project-structure)
6. [Setup and Installation](#setup-and-installation)
7. [API Reference](#api-reference)
8. [Model Performance](#model-performance)
9. [Environment Variables](#environment-variables)

---

## What Was Built

### Core Platform

| Module | Description |
|--------|-------------|
| **Field Management** | Create and manage farm fields with soil type, irrigation, GPS coordinates, crop history |
| **Crop Planning** | Two-layer crop recommendation — ML + rule-based fallback |
| **Crop Rotation** | Automated rotation plans that warn against soil-depleting repeat crops |
| **Weather Integration** | Live temperature and humidity from OpenWeatherMap for real-time ML predictions |
| **Auth System** | JWT-based authentication with farmer / researcher / admin roles |

### Crop Recommendation System (Primary Focus)

The crop recommendation system was built and then significantly improved to production quality. It combines:

- A **machine learning pipeline** (StandardScaler + RandomForestClassifier) trained on 6,600 agronomic samples across 22 crop classes
- A **rule-based scoring engine** that evaluates soil type, water needs, crop rotation, NPK levels, pH, and regional suitability
- A **dual-layer fallback**: if the ML service is offline, the rule-based engine still returns ranked recommendations
- **Graceful degradation**: if soil test data (N/P/K/pH) is missing, the system still gives recommendations based on soil type, irrigation, and season — and tells the user exactly what data to add for better precision

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│  CropPlanning.js  ─  Tailwind CSS  ─  Framer Motion     │
└──────────────────────────┬──────────────────────────────┘
                           │  HTTP (JWT)
┌──────────────────────────▼──────────────────────────────┐
│               Node.js / Express Backend                  │
│                                                          │
│  ┌─────────────────┐    ┌──────────────────────────┐    │
│  │  crop-planning  │    │  cropRecommendation       │    │
│  │  routes.js      │───▶│  Controller.js            │    │
│  └─────────────────┘    └────────────┬─────────────┘    │
│                                      │                   │
│  ┌─────────────────────────────────┐ │                   │
│  │  cropPlanningService.js         │◀┘                   │
│  │  (rule-based scoring engine)    │                     │
│  └─────────────────────────────────┘                     │
│                          │                               │
│                          │  POST /predict-crop           │
└──────────────────────────┼──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│            Python Flask ML Sidecar  (port 5401)          │
│                                                          │
│  app.py  →  crop_pipeline.pkl  →  label_encoder.pkl      │
│           (StandardScaler + RandomForestClassifier)      │
└─────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                      MongoDB Atlas                        │
│           Fields  ·  Users  ·  Crop History              │
└─────────────────────────────────────────────────────────┘
```

The ML model runs in a **separate Flask process** because Node.js cannot execute scikit-learn natively. The two processes communicate over localhost HTTP. This separation also means the ML service can be updated, restarted, or scaled independently without touching the main API server.

---

## Crop Recommendation System

### How It Works

```
User clicks "Get Recommendation" for a field
        │
        ▼
1. Always run rule-based engine
   (soil type + irrigation + NPK + pH + season + district)
        │
        ▼
2. Does the field have N, P, K, and pH values?
   ├─ No  → return rule-based result, inform user to add soil test data
   └─ Yes ─────────────────────────────────────────────────────────────┐
                                                                        │
3. Fetch live weather (OpenWeatherMap)                                  │
   ├─ Unavailable → return rule-based result                            │
   └─ Temperature + Humidity retrieved ───────────────────────────────┐ │
                                                                      │ │
4. Look up district average monthly rainfall                          │ │
   (NOT live 1h rain — see "Fixes Made" section)                      │ │
        │                                                             │ │
        ▼                                                             │ │
5. POST to Flask ML service:                                          │ │
   { N, P, K, ph, temperature, humidity, rainfall }  ◀───────────────┘ │
        │                                                               │
        ▼                                                               │
6. Pipeline: StandardScaler → RandomForestClassifier                    │
   Returns: recommended_crop, confidence, top3                          │
        │                                                               │
7. confidence ≥ 35%?                                                    │
   ├─ Yes → return ML result + rule-based result                        │
   └─ No  → return flagged low-confidence ML + rule-based result ◀──────┘
```

### ML Model Deep Dive

#### Training Dataset

| Property | Value |
|----------|-------|
| Total samples | 6,600 |
| Samples per crop | 300 |
| Crop classes | 22 |
| Features | N, P, K, temperature, humidity, pH, rainfall |
| Data type | Synthetic (agronomic literature ranges) |

Each sample is generated using a **70/30 blend of Gaussian + Uniform sampling**:
- 70% Gaussian centred on each crop's ideal conditions (σ = range/6) — realistic peak behaviour
- 30% Uniform across the full valid range — ensures the model sees edge cases

This approach produces better generalisation than pure Gaussian sampling (which clusters too tightly around the midpoint) or pure Uniform (which loses the realistic peak signal).

Feature ranges are sourced from **FAO crop management guidelines** and **ICAR (Indian Council of Agricultural Research) package-of-practices** for each crop.

#### Model Architecture

```
Pipeline([
    ("scaler", StandardScaler()),
    ("clf",    RandomForestClassifier(
                   n_estimators=tuned,
                   max_depth=tuned,
                   min_samples_split=tuned,
                   ...
               ))
])
```

**Why StandardScaler inside the Pipeline?**
Bundling the scaler in the Pipeline guarantees that the exact same scaling parameters (mean, std) used during training are applied at inference time. If the scaler were separate, it would be easy to accidentally forget to scale inputs — a silent bug that degrades accuracy.

**Why RandomForestClassifier?**
- Handles 22-class multi-class natively without one-vs-rest wrappers
- Non-parametric — makes no assumption about feature distributions
- Built-in feature importance analysis
- Robust to outliers; consistent accuracy even on the rare edge-case inputs
- With 300+ samples per class and well-separated feature ranges, achieves >99% test accuracy

**Why RandomizedSearchCV for tuning?**
GridSearchCV over a full parameter grid for a 200-tree forest on 5,280 training samples would take hours. RandomizedSearchCV samples `n_iter=30` random combinations, which finds near-optimal parameters in a fraction of the time while still significantly outperforming default settings.

#### Hyper-parameter Search Space

```python
{
    "clf__n_estimators":      [100, 200, 300, 500],
    "clf__max_depth":         [None, 10, 15, 20, 30],
    "clf__min_samples_split": [2, 4, 6],
    "clf__min_samples_leaf":  [1, 2, 3],
    "clf__max_features":      ["sqrt", "log2", None],
}
```

#### Saved Artefacts

| File | Contents | Used by |
|------|----------|---------|
| `crop_pipeline.pkl` | StandardScaler + tuned RF (inference-ready) | `app.py`, `predict_crop.py` |
| `label_encoder.pkl` | int → crop name mapping | `app.py`, `predict_crop.py` |
| `model_metrics.json` | accuracy, CV scores, feature importance, train date | `app.py /metrics` endpoint |

### Rule-Based Engine

`cropPlanningService.js` scores each of 16 crop profiles against a field using a weighted point system:

| Factor | Points |
|--------|--------|
| Soil type match | +20 / −10 |
| Water need + irrigation match | +10 |
| Season alignment (Kharif/Rabi) | +8 to +10 |
| Crop rotation conflict | −25 |
| Nitrogen in ideal range | +8 / −8 |
| Phosphorus in ideal range | +8 / −8 |
| Potassium in ideal range | +8 / −8 |
| pH in ideal range | +10 / −10 |
| Regional preference (AP delta) | +5 |

The top-3 scoring crops are returned with reasons. If NPK/pH data is missing, those scoring factors are skipped and the user is told exactly what to add.

---

### Fixes and Improvements Made

This section documents everything that was changed from the original implementation and why.

#### 1. Critical Bug: Wrong Rainfall Input to ML Model

**Problem:**
The original controller used `response.data.rain?.["1h"] || 0` — the live one-hour accumulated rainfall from OpenWeatherMap. This is almost always `0` (it's only non-zero when it's actively raining during the API call). The ML model was trained on **monthly-average rainfall in mm/month** (ranging from 18 to 300 mm), not hourly accumulation.

Sending `0` every time told the model "this field gets zero rain per month" — causing it to systematically recommend drought-tolerant crops (chickpea, moth beans, muskmelon) regardless of the actual climate.

**Fix:**
Added `DISTRICT_AVG_MONTHLY_RAINFALL` — a lookup table with average monthly rainfall (mm/month) for 80+ Indian agricultural districts based on IMD rainfall normals. The controller now looks up this value and sends it to the ML model instead of the live 1h rain.

#### 2. ML Confidence Threshold

**Problem:**
The original code accepted any ML result regardless of the model's confidence score. A prediction of 12% confidence (the model is essentially guessing) was returned the same as a 95% prediction.

**Fix:**
Added `MIN_ML_CONFIDENCE = 0.35`. Results below 35% are flagged as `mlSource: "ml_low_confidence"` so the frontend can communicate the uncertainty to the user. Results above 35% are treated as reliable recommendations.

#### 3. Only 10 Hardcoded Districts (All Andhra Pradesh)

**Problem:**
The original district → coordinates map only covered 10 AP districts. Any field in a different state had no weather fetched and defaulted to rule-based only.

**Fix:**
Expanded the map to **80+ major agricultural districts** across 15 Indian states: AP, Telangana, Karnataka, Maharashtra, Tamil Nadu, Kerala, Punjab, Haryana, UP, MP, Rajasthan, Gujarat, West Bengal, Bihar, Odisha, Assam.

Additionally, the controller now checks if the field has explicit `latitude` / `longitude` values and uses those directly, making it work for any location in the world without needing to be in the lookup table.

#### 4. No StandardScaler in Training Pipeline

**Problem:**
The original `train_crop_model.py` trained a bare `RandomForestClassifier` without any feature scaling, and saved it as `crop_model.pkl`. The Flask service then loaded just the model and sent raw values. While RF doesn't strictly require scaling, separating the scaler from the model created a risk: any future model that does need scaling (SVM, logistic regression) would silently produce wrong results.

**Fix:**
Wrapped the entire train → predict chain in a `sklearn.pipeline.Pipeline`:
```python
Pipeline([("scaler", StandardScaler()), ("clf", RandomForestClassifier(...))])
```
The saved artefact is now `crop_pipeline.pkl`. Calling `pipeline.predict_proba(X)` automatically applies scaling — no separate scaler step needed at inference.

#### 5. No Hyperparameter Tuning or Cross-Validation

**Problem:**
The original script used hardcoded `n_estimators=200, max_depth=15, min_samples_split=4`. These weren't tuned — they were default-ish values. The script also only did a single 80/20 split, so there was no way to know if accuracy was stable across different data splits.

**Fix:**
- `RandomizedSearchCV` with 30 iterations over a 5-fold stratified CV grid finds near-optimal parameters
- `cross_val_score` on the full training set reports mean ± std accuracy, confirming stability
- All metrics (test accuracy, CV mean, CV std, feature importances, best params) are saved to `model_metrics.json`

#### 6. Only 100 Samples Per Crop (2,200 Total)

**Problem:**
100 samples per class is marginal for a 22-class classifier. The dataset had too little coverage of edge-case conditions within each crop's valid range.

**Fix:**
Increased to 300 samples per crop (6,600 total). Each sample is generated using a 70/30 Gaussian/Uniform blend instead of pure Gaussian, giving better coverage across the full feature space.

#### 7. `force=True` in Flask JSON Parsing

**Problem:**
`request.get_json(force=True)` bypasses HTTP Content-Type validation and tries to parse any request body as JSON, even if it's form data, plain text, or binary. This is a security risk — it can hide client bugs, accept malformed payloads silently, and potentially expose the service to unexpected behaviour.

**Fix:**
Replaced with a content-type check (`request.is_json`) followed by `request.get_json(silent=True)`. Non-JSON requests now receive a proper `415 Unsupported Media Type` response.

#### 8. No Input Bounds Validation on ML Service

**Problem:**
The Flask service accepted any numeric value for all features. Sending `N=99999` or `temperature=-500` would produce a prediction without any warning — the model would just extrapolate wildly outside its training distribution.

**Fix:**
Added `FEATURE_BOUNDS` validation in `app.py`:
```
N: [0, 200]  P: [0, 150]  K: [0, 250]
temperature: [-10, 55]  humidity: [0, 100]
ph: [0, 14]  rainfall: [0, 500]
```
Out-of-range values return a `400 Bad Request` with a specific message.

#### 9. No Model Metadata Endpoint

**Problem:**
There was no way for the Node.js backend or a developer to inspect what model version was loaded, when it was trained, or what accuracy it achieved — without SSH-ing into the server.

**Fix:**
Added `GET /metrics` endpoint on the Flask service that returns the full contents of `model_metrics.json`:
```json
{
  "trained_at": "2026-04-26T...",
  "test_accuracy": 0.9985,
  "cv_mean_accuracy": 0.9978,
  "cv_std_accuracy": 0.0012,
  "n_classes": 22,
  "features": ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"],
  "feature_importance": { "humidity": 0.24, "rainfall": 0.22, ... }
}
```

#### 10. No Logging in Flask Service

**Problem:**
The original Flask app used `print()` statements and had no structured logging. In production, `print()` output is hard to route to log aggregators (CloudWatch, Datadog, etc.).

**Fix:**
Replaced all `print()` with Python's `logging` module using a standardised format:
```
2026-04-26 14:32:01  INFO      Crop recommendation model loaded (test accuracy: 0.9985)
2026-04-26 14:32:05  INFO      Prediction: rice (92.5%) | N=90 P=42 K=43 T=21 H=82 pH=6.5 R=130
```

---

## Technology Stack

### Frontend

| Technology | Why |
|------------|-----|
| **React 19** | Component model makes it easy to build the field-by-field recommendation cards |
| **Tailwind CSS** | Utility-first CSS keeps styling co-located with markup; no separate stylesheet files to maintain |
| **Framer Motion** | Fade-in animations on recommendation cards improve perceived loading performance |
| **Axios** | Promise-based HTTP client; simpler interceptors than fetch for auth token injection |
| **i18next** | Internationalization support so the platform can be localised to regional languages (Telugu, Hindi, etc.) |

### Backend (Node.js)

| Technology | Why |
|------------|-----|
| **Express 5** | Minimal, fast HTTP framework; async error handling is cleaner in v5 |
| **Mongoose** | ODM for MongoDB; schema validation catches bad field data before it hits the DB |
| **JWT (jsonwebtoken)** | Stateless auth — no session store needed; tokens carry role info for RBAC |
| **Axios** | Used server-side for calling OpenWeatherMap and the Flask ML sidecar |
| **bcryptjs** | Password hashing; pure JS so no native build dependencies |

### ML Service (Python)

| Technology | Why |
|------------|-----|
| **scikit-learn** | Industry-standard ML library; Pipeline API bundles preprocessing with the model so inference is always consistent with training |
| **RandomForestClassifier** | Excellent accuracy on tabular multi-class data; native feature importance; no hyperparameter sensitivity cliffs |
| **StandardScaler** | Normalises features so any future swap to a distance-based model (SVM, KNN) works without code changes |
| **RandomizedSearchCV** | Finds near-optimal hyperparameters much faster than full grid search |
| **Flask** | Lightweight WSGI server; minimal overhead for a single-endpoint sidecar |
| **Flask-CORS** | Allows the Node.js backend to call the Flask service across origins in development |
| **pandas** | Used to construct the feature DataFrame for prediction; `.predict_proba()` expects a DataFrame |

### Database

| Technology | Why |
|------------|-----|
| **MongoDB** | Schema-flexible document store suits agricultural data (fields have highly variable attributes); good fit for Next.js/React full-stack patterns |
| **Mongoose** | Adds schema validation, virtuals, and middleware on top of the native MongoDB driver |

---

## Project Structure

```
smart-agri-system/
│
├── frontend/
│   ├── src/
│   │   └── components/
│   │       ├── CropPlanning.js        # Crop recommendation UI
│   │       └── AddField.js            # Field creation form
│   └── package.json
│
├── backend/
│   ├── app.py                         # Flask ML sidecar
│   ├── controllers/
│   │   └── cropRecommendationController.js
│   ├── services/
│   │   └── cropPlanningService.js     # Rule-based scoring engine
│   ├── models/
│   │   └── Field.js                   # Mongoose schema
│   ├── routes/
│   │   └── cropPlanningRoutes.js
│   └── .env.example
│
└── ml-model/
    ├── requirements.txt
    └── crop_recommendation/
        ├── generate_crop_dataset.py   # Step 1: generate training data
        ├── train_crop_model.py        # Step 2: train and save model
        ├── predict_crop.py            # CLI tool for manual testing
        ├── Crop_recommendation.csv    # Generated dataset (6,600 rows)
        ├── crop_pipeline.pkl          # Saved model (after training)
        ├── label_encoder.pkl          # Label encoder (after training)
        └── model_metrics.json         # Accuracy + metadata (after training)
```

---

## Setup and Installation

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10
- MongoDB (local or Atlas)
- OpenWeatherMap API key (free tier is sufficient)

### 1. Clone and install dependencies

```bash
git clone https://github.com/harikrishna-au/smart-agri-system.git
cd smart-agri-system

# Node backend
cd backend && npm install && cd ..

# React frontend
cd frontend && npm install && cd ..

# Python ML
pip install -r ml-model/requirements.txt
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — see Environment Variables section below
```

### 3. Train the ML model

```bash
cd ml-model/crop_recommendation

# Generate the 6,600-row training dataset
python generate_crop_dataset.py

# Train the model (~2–5 minutes depending on hardware)
# This saves crop_pipeline.pkl, label_encoder.pkl, and model_metrics.json
python train_crop_model.py
```

Expected output:
```
Loaded 6,600 rows, 22 crop classes
Running RandomizedSearchCV (30 iterations, 5-fold CV)…
Best CV accuracy: 99.XXX%
Test accuracy   : 99.XXX%
Saved pipeline  → crop_pipeline.pkl
```

### 4. Start services

```bash
# Terminal 1 — Flask ML sidecar
cd backend && python app.py

# Terminal 2 — Node.js API server
cd backend && node server.js   # or: npm start

# Terminal 3 — React dev server
cd frontend && npm start
```

### 5. Verify the ML service

```bash
# Health check
curl http://localhost:5401/health
# → {"status":"ok","model_ready":true,"test_accuracy":0.9985,"n_classes":22}

# Model metadata
curl http://localhost:5401/metrics

# Manual prediction
cd ml-model/crop_recommendation
python predict_crop.py 90 42 43 21 82 6.5 130
```

---

## API Reference

### Crop Recommendation

#### `POST /api/crop-planning/recommend`

Requires JWT auth. Returns both ML and rule-based recommendations for a field.

**Request body:**
```json
{ "fieldId": "64f3a2b8e1d2c3a4b5c6d7e8" }
```

**Response:**
```json
{
  "fieldId": "64f3a2b8e1d2c3a4b5c6d7e8",
  "fieldName": "North Block",
  "mlSource": "ml",
  "mlRecommendation": {
    "recommended_crop": "rice",
    "confidence": 0.9250,
    "top3": [
      { "crop": "rice",  "confidence": 0.9250 },
      { "crop": "jute",  "confidence": 0.0430 },
      { "crop": "maize", "confidence": 0.0210 }
    ]
  },
  "ruleRecommendations": [
    {
      "crop": "Paddy",
      "score": 86,
      "reasons": [
        "Matches clay soil",
        "Nitrogen level (90) suits Paddy",
        "Soil pH (6.2) is ideal for Paddy"
      ]
    }
  ],
  "rotationPlan": {
    "currentCrop": "Paddy",
    "lastCrop": "Paddy",
    "nextCropOptions": ["Pulses", "Groundnut", "Millets"],
    "notes": ["Insert a pulse or legume crop to restore soil nitrogen."]
  }
}
```

**`mlSource` values:**

| Value | Meaning |
|-------|---------|
| `ml` | ML prediction returned, confidence ≥ 35% |
| `ml_low_confidence` | ML prediction returned but confidence < 35% |
| `ml_unavailable` | Flask sidecar is offline |
| `weather_unavailable` | OpenWeatherMap call failed |
| `missing_npk` | Field has no N/P/K/pH values |

#### `GET /api/crop-planning/overview`

Returns all fields with pre-computed rule-based recommendations and rotation plans.

---

### ML Sidecar Endpoints

#### `GET /health`
```json
{ "status": "ok", "model_ready": true, "test_accuracy": 0.9985, "n_classes": 22 }
```

#### `GET /metrics`
Returns full `model_metrics.json` including training date, CV scores, feature importances.

#### `POST /predict-crop`

**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "N": 90, "P": 42, "K": 43,
  "temperature": 21.4, "humidity": 82,
  "ph": 6.5, "rainfall": 130
}
```

**Response:**
```json
{
  "recommended_crop": "rice",
  "confidence": 0.925,
  "top3": [
    { "crop": "rice",  "confidence": 0.925 },
    { "crop": "jute",  "confidence": 0.043 },
    { "crop": "maize", "confidence": 0.021 }
  ]
}
```

**Error responses:**

| Code | Reason |
|------|--------|
| 400 | Missing fields or out-of-range values |
| 415 | Content-Type is not application/json |
| 503 | Model not loaded (training script not run) |

---

## Model Performance

After running `train_crop_model.py` with the 6,600-row dataset:

| Metric | Expected value |
|--------|----------------|
| Test accuracy | ≥ 99.0% |
| CV mean accuracy (5-fold) | ≥ 98.5% |
| CV std accuracy | ≤ 0.5% |

The high accuracy is achievable because the 22 crop classes have well-separated feature distributions — particularly along the `humidity`, `rainfall`, and `temperature` axes. For example:
- **Apple** (temperature 0–20°C, humidity 88–97%) does not overlap with **Moth beans** (temperature 28–40°C, humidity 45–65%)
- **Chickpea** (humidity 14–22%, rainfall 60–100 mm) is cleanly separated from **Coconut** (humidity 88–97%, rainfall 130–200 mm)

The most informative features (by mean impurity decrease) are typically:
1. `humidity` — strongest discriminator (fruit crops vs. pulse crops)
2. `rainfall` — separates arid-zone crops from monsoon crops
3. `temperature` — separates apple / grapes from tropical crops
4. `K` (potassium) — separates banana / coconut from cereals
5. `ph` — separates coffee / paddy from dryland crops

---

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/smartagri

# JWT
JWT_SECRET=your_jwt_secret_here

# OpenWeatherMap (free tier)
WEATHER_API_KEY=your_openweathermap_api_key

# ML sidecar (default: localhost:5401)
ML_SERVICE_URL=http://localhost:5401

# Flask port (must match ML_SERVICE_URL)
ML_PORT=5401

# Node server port
PORT=5000
```
