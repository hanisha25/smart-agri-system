const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema({

  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  fieldName: String,
  cropName: String,
  variety: String,
  season: String,
  sowingDate: Date,

  state: String,
district: String,
mandal: String,
village: String,
latitude: String,
longitude: String,

  soilType: String,
  irrigation: String,
  area: String,

  nitrogen: Number,
  phosphorus: Number,
  potassium: Number,
  ph: Number

}, { timestamps: true });

module.exports = mongoose.model("Field", fieldSchema);