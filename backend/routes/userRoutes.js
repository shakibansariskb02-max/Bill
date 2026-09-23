const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ===============================
// Register (Master Password Auto Set)
// ===============================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔒 Fixed Master Password
    const MASTER_PASSWORD = "$h@kib@n$";
    const hashedMasterPassword = await bcrypt.hash(MASTER_PASSWORD, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      masterPassword: hashedMasterPassword, // ✅ added
      businessName: "",
      logo: ""
    });

    await user.save();
    res.json({ message: "User Registered Successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// Login (No Change)
// ===============================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid Email or Password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Email or Password" });
    }

    res.json({
      message: "Login Successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName || "",
        logo: user.logo || ""
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// Logout (No Change)
// ===============================
router.post("/logout", (req, res) => {
  res.json({ message: "Logout successful" });
});

// ===============================
// Delete Account (No Change)
// ===============================
router.delete("/delete/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "Account deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// Send OTP (Dummy OTP = 123456)
// ===============================
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "Email not found"
      });
    }

    // Dummy OTP
    const otp = "123456";

    res.status(200).json({
      message: "OTP Sent Successfully",
      otp
    });

  } catch (error) {
    res.status(500).json({
      message: "Server Error"
    });
  }
});

// ===============================
// Reset Password
// ===============================
router.post("/reset-password", async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Encrypt new password
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    await user.save();

    res.json({
      message: "Password Updated Successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Server Error"
    });
  }
});

module.exports = router;