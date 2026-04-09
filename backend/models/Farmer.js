const mongoose = require("mongoose");

const farmerSchema = new mongoose.Schema({

name: String,

mobile: String,

farmerId: String,

email: String,

password: String,

role: {
type: String,
enum: ["farmer","researcher","admin"],
default: "farmer"
}

});

module.exports = mongoose.model("Farmer",farmerSchema);
