const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    partNumber: {
      type: String,
      required: true,
    },
    category: String,
    price: Number,
    stock: Number,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Unique Part Number per user
productSchema.index(
  { user: 1, partNumber: 1 },
  { unique: true }
);

// Fast search by Product Name
productSchema.index(
  { user: 1, name: 1 }
);

// Fast search by Part Number

module.exports = mongoose.model("Product", productSchema);