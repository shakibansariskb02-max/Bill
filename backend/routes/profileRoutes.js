const express = require("express");
const router = express.Router();
const User = require("../models/User");
const multer = require("multer");
const bcrypt = require("bcryptjs");

/* ===============================
   Multer Setup
================================ */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* =========================================================
   GET PROFILE
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -masterPassword");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


/* =========================================================
   UPDATE PROFILE (MASTER PASSWORD REQUIRED)
========================================================= */
router.put("/:id", upload.single("logo"), async (req, res) => {
  try {
    const { name, businessName, masterPassword } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔒 VERIFY MASTER PASSWORD
    const isMatch = await bcrypt.compare(
      masterPassword,
      user.masterPassword
    );

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid master password" });
    }

    // ✅ Only update if password correct
    user.name = name;
    user.businessName = businessName;

    if (req.file) {
      user.logo = req.file.filename;
    }

    await user.save();

    res.json({ message: "Profile updated successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;