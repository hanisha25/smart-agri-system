const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const fieldRoutes = require("./routes/fieldRoutes");
const weatherRoutes = require("./routes/weatherRoutes");
const diseaseRoutes = require("./routes/diseaseRoutes");
const researchRoutes = require("./routes/researchRoutes");
const farmerDiseaseReports = require("./routes/farmerDiseaseReports");
const analyticsRoutes = require("./routes/analyticsRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const port = process.env.PORT || 5400;

app.use(cors());
app.use(express.json());

app.use("/uploads",express.static("uploads"));

app.use("/api/auth",authRoutes);
app.use("/api/field",fieldRoutes);
app.use("/api/weather",weatherRoutes);
app.use("/api/disease",diseaseRoutes);
app.use("/api/research",researchRoutes);
app.use("/api/farmer-reports", farmerDiseaseReports);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

app.listen(port,()=>{
console.log(`Server running on port ${port}`);
});
