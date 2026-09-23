const express = require("express");
const router = express.Router();
const Category = require("../models/Category");

// ADD CATEGORY
router.post("/", async (req, res) => {
  try {
    const { name, userId } = req.body;

    const category = new Category({
      name,
      user: userId,
    });

    await category.save();
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET CATEGORY (FILTER BY USER)
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    const categories = await Category.find({ user: userId });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// UPDATE
router.put("/:id", async (req, res) => {
  const updated = await Category.findByIdAndUpdate(
    req.params.id,
    { name: req.body.name },
    { new: true }
  );
  res.json(updated);
});
router.get("/", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "User ID required" });
  }

  const categories = await Category.find({ user: userId });
  res.json(categories);
});

module.exports = router;