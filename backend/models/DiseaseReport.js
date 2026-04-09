const mongoose = require("mongoose");

const diseaseReportSchema = new mongoose.Schema({

farmerId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Farmer"
},

crop:String,
location:String,
problem:String,
symptomLocation:String,
spread:String,
weather:String,
image:String,

status:{
type:String,
default:"Pending"
},

researchResponse:{
type:String,
default:""
},

probableDisease:{
type:String,
default:""
},

severity:{
type:String,
enum:["Low","Medium","High"],
default:"Low"
},

confidenceScore:{
type:Number,
default:0
},

triageNotes:{
type:String,
default:""
},

recommendedAction:{
type:String,
default:""
},

reviewedAt: Date,

resolvedAt: Date,

createdAt:{
type:Date,
default:Date.now
}

}, { timestamps: true });

module.exports = mongoose.model("DiseaseReport",diseaseReportSchema);
