# 🌾 AgroBrain - Smart Agriculture System

AgroBrain is an AI-powered agriculture support system that helps farmers monitor crop conditions using real-time weather data and machine learning predictions. It provides intelligent farming suggestions to improve crop health and productivity.

---

## 🚀 Features

- 🌦 Real-time weather data using OpenWeather API  
- 🧠 Machine Learning-based crop condition prediction  
- 🤖 Smart AI-based farming suggestions (fallback logic)  
- 🌱 Crop-specific recommendations (paddy, cotton, groundnut)  
- 📊 Risk analysis (Low / Medium / High)  
- 🔄 Hybrid learning (stores real-time data for future improvement)  
- 🎨 Clean and interactive UI using React  

---

## 🧠 How it works

1. User adds field details (crop + district)  
2. Backend fetches real-time weather data  
3. ML model predicts crop condition  
4. AI logic converts prediction into farming advice  
5. Crop-specific rules enhance recommendations  
6. Results are displayed in a dashboard  

---


---

## 🛠 Tech Stack

- **Frontend:** React, Tailwind CSS  
- **Backend:** Node.js, Express  
- **Database:** MongoDB  
- **Machine Learning:** Python, Scikit-learn (Random Forest)  
- **API:** OpenWeather API  

---

## ⚙️ Setup Instructions

### 1. Clone repository

```bash
git clone https://github.com/hanisha25/smart-agri-system.git
cd smart-agri-system

cd backend
npm install

Create .env file inside backend folder:
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5312
WEATHER_API_KEY=your_openweather_api_key
GEMINI_API_KEY=your_gemini_api_key

cd frontend
npm install
npm start


cd ml-model
python3 generate_dataset.py
python3 train_model.py