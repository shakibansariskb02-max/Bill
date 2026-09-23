const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {

    invoiceNumber: {
      type: Number,
      unique: true,
      
    },
    customerName: String,
    mobile: String,

    products: [
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    name: String,          // ✅ product snapshot
    partNumber: String,    // ✅ product snapshot
    price: Number,         // ✅ product snapshot

    quantity: Number,

    discountPercent: {
      type: Number,
      default: 0,
    },

    discountRupee: {
      type: Number,
      default: 0,
    },
  },
],

    totalAmount: Number,
    discount: Number,
    finalAmount: Number,
    paidAmount: Number,
    remainingAmount: Number,
    paymentMode: String,

    // 🔥 LINK ORDER TO USER
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);