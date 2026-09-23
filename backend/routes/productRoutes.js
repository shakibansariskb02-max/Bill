const express = require("express");
const router = express.Router();
const multer = require("multer");
const Product = require("../models/Product");
const { parseImportFile } = require("../utils/importParser");

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post("/import", importUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { items, sourceType } = await parseImportFile(
      req.file.buffer,
      req.file.originalname
    );

    if (!items.length) {
      return res.status(400).json({
        message:
          "Couldn't find any Part No / Description / MRP rows in this file. Try a different file or check its formatting.",
      });
    }

    res.json({ sourceType, count: items.length, items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Failed to parse file" });
  }
});

router.post("/bulk", async (req, res) => {
  try {
    const { userId, items } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: "No items to import" });
    }

    // Only load part numbers — that's the real unique key.
    // Product Name is allowed to repeat freely.
    const existing = await Product.find({ user: userId }).select("partNumber").lean();
    const existingParts = new Set(existing.map((p) => p.partNumber));

    const toInsert = [];
    const skipped = [];
    const seenParts = new Set();

    for (const raw of items) {
      const name = String(raw.name || "").trim().toUpperCase();
      const partNumber = String(raw.partNumber || "").trim().toUpperCase();
      const price = Number(raw.price) || 0;
      const stock = Number(raw.stock) || 0;
      const category = raw.category || "";

      if (!name || !partNumber) {
        skipped.push({ ...raw, reason: "Missing name or part number" });
        continue;
      }
      if (existingParts.has(partNumber) || seenParts.has(partNumber)) {
        skipped.push({ ...raw, reason: "Part number already exists" });
        continue;
      }

      seenParts.add(partNumber);
      toInsert.push({ name, partNumber, category, price, stock, user: userId });
    }

    let created = [];

    if (toInsert.length) {
      try {
        created = await Product.insertMany(toInsert, { ordered: false });
      } catch (bulkErr) {
        // insertMany still inserts the valid docs even if some fail;
        // mongoose exposes the successful ones here
        created = bulkErr.insertedDocs || [];
        const writeErrors = bulkErr.writeErrors || [];
        writeErrors.forEach((we) => {
          const reason =
            we.code === 11000
              ? "Part number already exists"
              : "Duplicate or validation error";
          skipped.push({ ...toInsert[we.index], reason });
        });
      }
    }

    res.json({ createdCount: created.length, skippedCount: skipped.length, skipped });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

/* ================= CREATE PRODUCT ================= */
router.post("/", async (req, res) => {
  try {
    const { name, partNumber, category, price, stock, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const productName = name.trim().toUpperCase();
    const partNo = partNumber.trim().toUpperCase();

    // Check duplicate Part Number ONLY — Product Name may repeat
    const existingPart = await Product.findOne({
      partNumber: partNo,
      user: userId,
    });

    if (existingPart) {
      return res.status(400).json({
        message: "Part Number already exists!",
      });
    }

    const product = new Product({
      name: productName,
      partNumber: partNo,
      category,
      price,
      stock,
      user: userId,
    });

    try {
      await product.save();
    } catch (saveErr) {
      // Safety net: catches the rare race-condition case where two
      // requests pass the findOne check at the same instant.
      if (saveErr.code === 11000) {
        return res.status(400).json({ message: "Part Number already exists!" });
      }
      throw saveErr;
    }

    res.status(201).json(product);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

/* ================= GET PRODUCTS ================= */
router.get("/", async (req, res) => {
  try {
    const { userId, search = "", limit } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    let filter = { user: userId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { partNumber: { $regex: search, $options: "i" } },
      ];
    }

    let query = Product.find(filter)
      .select("name partNumber price stock category")
      .sort({ createdAt: -1 })
      .lean();

    if (limit) {
      query = query.limit(Number(limit));
    }

    const products = await query;
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ================= UPDATE PRODUCT ================= */
router.put("/:id", async (req, res) => {
  try {
    const { userId, name, partNumber } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const productName = name.trim().toUpperCase();
    const partNo = partNumber.trim().toUpperCase();

    // Check duplicate Part Number ONLY — Product Name may repeat
    const existingPart = await Product.findOne({
      _id: { $ne: req.params.id },
      partNumber: partNo,
      user: userId,
    });

    if (existingPart) {
      return res.status(400).json({
        message: "Part Number already exists!",
      });
    }

    req.body.name = productName;
    req.body.partNumber = partNo;

    let product;
    try {
      product = await Product.findOneAndUpdate(
        {
          _id: req.params.id,
          user: userId,
        },
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );
    } catch (updateErr) {
      if (updateErr.code === 11000) {
        return res.status(400).json({ message: "Part Number already exists!" });
      }
      throw updateErr;
    }

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json(product);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

/* ================= DELETE PRODUCT ================= */

/* ================= DELETE ALL PRODUCTS ================= */
router.delete("/all/clear", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const result = await Product.deleteMany({ user: userId });

    res.json({
      message: "All products deleted",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      user: userId,
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json({
      message: "Product Deleted Successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;