# Smart Agri System

A full-stack application to help farmers report crop diseases and receive expert advice from researchers.

---

## Features

- **Farmer Signup/Login:** Farmers can register and log in to the system.
- **Researcher Signup/Login:** Researchers can register and log in to the system.
- **Disease Reporting:** Farmers can submit crop disease reports with details and optional images.
- **Weather Info:** Farmers can view weather data relevant to their location.
- **Farmer Dashboard:** Farmers can view the status of their submitted reports and see researcher responses.
- **Researcher Dashboard:** Researchers can view all farmer reports, update status, and send responses/cures.
- **Status Tracking:** Reports have statuses like "Pending", "Reviewed", or "Resolved", visible to both farmers and researchers.
- **Image Upload:** Farmers can upload images of affected crops.
- **JWT Authentication:** Secure API access for both roles.
- **MongoDB Database:** All data is stored in MongoDB Atlas.

---

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm
- MongoDB Atlas account (or local MongoDB)
- [Optional] Weather API key

---

### 1. Clone the Repository

```sh
git clone https://github.com/hanisha25/smart-agri-system.git
cd smart-agri-system
```

---

### 2. Backend Setup

```sh
cd backend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend` directory:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5400
WEATHER_API_KEY=your_weather_api_key
```

#### Start the Backend

```sh
node server.js
```

The backend will run on [http://localhost:5400](http://localhost:5400).

---

### 3. Frontend Setup

```sh
cd ../frontend
npm install
```

#### Start the Frontend

```sh
npm start
```

The frontend will run on [http://localhost:3000](http://localhost:3000).

---

## Usage Flow

### For Farmers

1. **Sign Up / Login** as a farmer.
2. **Submit a Disease Report** with crop details, symptoms, spread, weather, and optional image/voice input.
3. **View Your Reports:** See all your submitted reports, their status ("Pending", "Reviewed", "Resolved"), and any researcher responses.

### For Researchers

1. **Sign Up / Login** as a researcher.
2. **View All Reports:** See all farmer disease reports with images and details.
3. **Respond to Reports:** Update the status and provide cure/prevention advice. The response and status update are instantly visible to the respective farmer.

---

## API Endpoints (Key)

- `POST /api/auth/signup` — Register as farmer or researcher
- `POST /api/auth/login` — Login as farmer or researcher
- `POST /api/disease/report` — Farmer submits a disease report (with image)
- `GET /api/farmer-reports/my-reports` — Farmer views their own reports
- `GET /api/disease/all-reports` — Researcher views all reports
- `PUT /api/disease/update/:id` — Researcher updates status/response for a report
- `GET /api/weather/my-weather` — Get weather info for farmer

---

## Technologies Used

- **Frontend:** React, Axios, Framer Motion, Tailwind CSS
- **Backend:** Node.js, Express, Multer, JWT, Mongoose
- **Database:** MongoDB Atlas
- **Authentication:** JWT
- **File Uploads:** Multer

---

## Notes

- Make sure your backend `.env` is configured and the backend is running before starting the frontend.
- Update API URLs in the frontend if your backend is not running on `localhost:5400`.
- For production, use environment variables and secure your secrets.

---

## License

