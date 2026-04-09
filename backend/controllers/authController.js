const Farmer = require("../models/Farmer");
const Researcher = require("../models/Researcher");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* SIGNUP */

exports.signup = async (req, res) => {
  try {
    const { name, mobile, farmerId, email, password, role } = req.body;

    if (!password || !role || !name?.trim()) {
      return res.status(400).json({ message: "Name, password, and role are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let user;
    if (role === "farmer") {
      if (!farmerId?.trim() || !mobile?.trim()) {
        return res.status(400).json({ message: "Farmer ID and mobile are required" });
      }

      // Prevent duplicate farmerId
      const existing = await Farmer.findOne({ farmerId });
      if (existing) return res.status(400).json({ message: "Farmer ID already exists" });
      user = new Farmer({ name, mobile, farmerId, password: hashedPassword, role });
      await user.save();
    } else if (role === "researcher") {
      if (!email?.trim()) {
        return res.status(400).json({ message: "Researcher email is required" });
      }

      // Prevent duplicate email
      const existing = await Researcher.findOne({ email });
      if (existing) return res.status(400).json({ message: "Researcher email already exists" });
      user = new Researcher({ name, email, password: hashedPassword });
      await user.save();
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }
    res.json({ message: "Signup Successful" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Signup failed" });
  }
};

/* LOGIN */

exports.login = async (req, res) => {
  try {
    const { farmerId, email, password } = req.body;

    if (!password || (!farmerId && !email)) {
      return res.status(400).json({ message: "Credentials are required" });
    }

    let user = null;
    let role = "";
    if (farmerId) {
      user = await Farmer.findOne({ farmerId });
      role = "farmer";
    }
    if (email && !user) {
      user = await Researcher.findOne({ email });
      role = user?.role || "researcher";
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({
      message: "Login Successful",
      token,
      role,
      user: { name: user.name }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Login failed" });
  }
};
