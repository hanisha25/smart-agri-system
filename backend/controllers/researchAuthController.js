const Researcher = require("../models/Researcher");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


exports.signup = async(req,res)=>{

try{

if (!req.body.name?.trim() || !req.body.email?.trim() || !req.body.password) {
return res.status(400).json({ message: "Name, email, and password are required" });
}

const existing = await Researcher.findOne({ email: req.body.email });

if (existing) {
return res.status(400).json({ message: "Researcher email already exists" });
}

const hashed = await bcrypt.hash(req.body.password,10);

const researcher = new Researcher({

name:req.body.name,
email:req.body.email,
password:hashed,
center:req.body.center,
location:req.body.location,
role:"researcher"

});

await researcher.save();

res.json({
message:"Researcher created"
});

}catch(err){

res.status(500).json({error:"Signup failed"});

}

};



exports.login = async(req,res)=>{

try{

if (!req.body.email?.trim() || !req.body.password) {
return res.status(400).json({ message: "Email and password are required" });
}

const researcher = await Researcher.findOne({

email:req.body.email

});

if(!researcher){

return res.status(400).json({
message:"Researcher not found"
});

}

const match = await bcrypt.compare(

req.body.password,
researcher.password

);

if(!match){

return res.status(400).json({
message:"Wrong password"
});

}

const token = jwt.sign(

{id:researcher._id, role:researcher.role || "researcher"},

process.env.JWT_SECRET,
{ expiresIn:"1d" }

);

res.json({

token,
role:researcher.role || "researcher",
user:{ name: researcher.name },
researcher

});

}catch(err){

res.status(500).json({
error:"Login failed"
});

}

};
