const Field = require("../models/Field");
const { createNotification } = require("../services/notificationService");

const districtLatLonMap = {
  "east godavari": { lat: 16.9891, lon: 81.7787 },
  "west godavari": { lat: 16.7107, lon: 81.0952 },
  krishna: { lat: 16.5062, lon: 80.648 },
  guntur: { lat: 16.3067, lon: 80.4365 },
  prakasam: { lat: 15.5057, lon: 80.0499 },
  nellore: { lat: 14.4426, lon: 79.9865 },
  kurnool: { lat: 15.8281, lon: 78.0373 },
  anantapur: { lat: 14.6819, lon: 77.6006 },
  chittoor: { lat: 13.2172, lon: 79.1003 },
  visakhapatnam: { lat: 17.6868, lon: 83.2185 },
};

function enrichField(field) {
  const lat = Number(field.latitude);
  const lon = Number(field.longitude);

  if (!Number.isNaN(lat) && !Number.isNaN(lon) && lat && lon) {
    return {
      ...field,
      mapLatitude: lat,
      mapLongitude: lon,
      mapSource: "field",
    };
  }

  const districtKey = field.district?.trim().toLowerCase();
  const fallback = districtLatLonMap[districtKey];

  return {
    ...field,
    mapLatitude: fallback?.lat ?? null,
    mapLongitude: fallback?.lon ?? null,
    mapSource: fallback ? "district" : "none",
  };
}

// Add New Field
exports.addField = async (req,res) => {

  try {
    const { fieldName, cropName, district, village } = req.body;

    if (!fieldName?.trim() || !cropName?.trim() || !district?.trim() || !village?.trim()) {
      return res.status(400).json({
        message: "Field name, crop name, district, and village are required",
      });
    }

    const newField = new Field({
      ...req.body,
      farmerId: req.user.id   // ✅ FIXED
    });

    await newField.save();

    await createNotification({
      userId: req.user.id,
      role: "farmer",
      type: "field",
      title: "Field added successfully",
      message: `${newField.fieldName} for ${newField.cropName} is now part of your farm records.`,
      meta: { fieldId: newField._id },
    });

    res.json({ message:"Field Added Successfully", field: newField });

  } catch(err){

    console.log("Add Field Error:", err);

    res.status(500).json({ error: err.message });
  }

};

// Get My Fields
exports.getMyFields = async (req,res) => {

  try {

    console.log("Fetching fields for:", req.user.id);  // ✅ FIXED

    const fields = await Field.find({ farmerId: req.user.id });

    res.json(fields);

  } catch(err){

    console.log("Get Fields Error:", err);

    res.status(500).json({ error: err.message });
  }

};

exports.getMapFields = async (req, res) => {
  try {
    const query = req.user.role === "farmer" ? { farmerId: req.user.id } : {};
    const fields = await Field.find(query).lean();

    res.json(fields.map(enrichField));
  } catch (error) {
    res.status(500).json({ message: "Failed to load map fields" });
  }
};
