const mongoose = require("mongoose");

const researcherSchema = new mongoose.Schema({

name:String,

email:{
type:String,
unique:true
},

password:String,

center:String,

location:String,

role:{
type:String,
enum:["researcher","admin"],
default:"researcher"
}

});

module.exports = mongoose.model("Researcher",researcherSchema);
