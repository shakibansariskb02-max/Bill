const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");

/* =========================
   CREATE ORDER
========================= */
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      customerName,
      mobile,
      products,
      discount = 0,
      paidAmount = 0,
      paymentMode,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    let totalAmount = 0;
let orderProducts = [];

for (let item of products) {
      const product = await Product.findById(item.productId);

if (!product) {
  return res.status(404).json({ message: "Product not found" });
}

if (product.stock - item.quantity < 0){
  return res.status(400).json({
    message: `Not enough stock for ${product.name}`,
  });
}

product.stock -= item.quantity;
await product.save();

const quantity = Number(item.quantity) || 0;
const totalPrice = product.price * quantity;
const discountRupee = Number(item.discountRupee) || 0;

const finalProductTotal = totalPrice - discountRupee;
totalAmount += finalProductTotal;

/* ✅ SAVE PRODUCT SNAPSHOT */
orderProducts.push({
  productId: product._id,
  name: product.name,
  partNumber: product.partNumber,
  price: product.price,
  quantity: quantity,
  discountPercent: item.discountPercent || 0,
  discountRupee: discountRupee
});
    }

    /* =========================
   GENERATE INVOICE NUMBER
========================= */

const lastOrder = await Order.findOne({ user: userId }).sort({
  invoiceNumber: -1,
});

const nextInvoiceNumber = lastOrder
  ? lastOrder.invoiceNumber + 1
  : 1;

    const finalAmount = totalAmount - Number(discount);
    const remainingAmount = finalAmount - Number(paidAmount);

    const order = new Order({
      invoiceNumber: nextInvoiceNumber,

      user: userId,
      customerName,
      mobile,
      products: orderProducts, 
      totalAmount,
      discount: Number(discount),
      finalAmount,
      paidAmount: Number(paidAmount),
      remainingAmount,
      paymentMode,
      isDeleted: false,
    });

    await order.save();
    res.json(order);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   LOOKUP CUSTOMER NAME BY MOBILE
   - used by the Order page to auto-fill the customer's
     name when a returning customer's mobile number is entered
========================= */
router.get("/lookup-customer", async (req, res) => {
  try {
    const { userId, mobile } = req.query;

    if (!userId || !mobile) {
      return res
        .status(400)
        .json({ message: "userId and mobile are required" });
    }

    const order = await Order.findOne({ user: userId, mobile })
      .sort({ createdAt: -1 })
      .select("customerName");

    if (!order) {
      return res.status(404).json({ message: "No previous order found" });
    }

    res.json({ customerName: order.customerName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   GET TRASH ORDERS
========================= */
router.get("/trash", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const orders = await Order.find({
      user: userId,
      isDeleted: true,
    })
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   GET ACTIVE ORDERS
========================= */
router.get("/", async (req, res) => {
  try {
    const { userId, search = "" } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    let filter = {
      user: userId,
      isDeleted: false,
    };

    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    const orders = await Order.find(filter)
      
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   DELETE ORDER
   - restoreStock=true  -> restock products, PERMANENTLY delete (skip trash)
   - restoreStock=false -> move to trash (no stock change), can be restored later
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const { userId, restoreStock } = req.query;

    const order = await Order.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const shouldRestoreStock = restoreStock === "true";

    if (shouldRestoreStock) {
      // Put products back in stock
      for (let item of order.products) {
        const product = await Product.findById(
          item.productId._id || item.productId
        );

        if (product) {
          product.stock += Number(item.quantity);
          await product.save();
        }
      }

      // Permanently delete — do NOT send to trash
      await Order.deleteOne({ _id: order._id, user: userId });

      return res.json({
        message: "Order permanently deleted and stock restored",
      });
    }

    // No restock — move to trash as before
    order.isDeleted = true;
    await order.save();

    res.json({ message: "Order moved to Trash without restocking" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   RESTORE ORDER
========================= */
router.put("/restore/:id", async (req, res) => {
  try {
    const { userId } = req.query;

    const order = await Order.findOne({
      _id: req.params.id,
      user: userId,
      isDeleted: true,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.isDeleted = false;
    await order.save();

    res.json({ message: "Order restored successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   PERMANENT DELETE
========================= */
router.delete("/permanent/:id", async (req, res) => {
  try {
    const { userId } = req.query;

    const order = await Order.findOneAndDelete({
      _id: req.params.id,
      user: userId,
      isDeleted: true,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order permanently deleted" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   UPDATE ORDER
========================= */
/* =========================
   UPDATE ORDER
========================= */
/* =========================
   UPDATE ORDER
========================= */
/* =========================
   UPDATE ORDER
========================= */
router.put("/:id", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const {
      customerName,
      mobile,
      products,
      discount = 0,
      paidAmount = 0,
      paymentMode,
    } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      user: userId,
      isDeleted: false,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    /* ===============================
       STEP 1: RESTORE OLD STOCK
    =============================== */
    for (let oldItem of order.products) {
      const product = await Product.findById(
        oldItem.productId._id || oldItem.productId
      );

      if (product) {
        product.stock += Number(oldItem.quantity);
        await product.save();
      }
    }

    /* ===============================
       STEP 2: APPLY NEW STOCK
    =============================== */

    let totalAmount = 0;   // ✅ FIXED ERROR HERE

    let updatedProducts = [];

for (let item of products) {

  const product = await Product.findById(item.productId);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (product.stock - item.quantity < 0){
    return res.status(400).json({
      message: `Not enough stock for ${product.name}`,
    });
  }

  product.stock -= item.quantity;
  await product.save();

  const quantity = Number(item.quantity) || 0;
  const totalPrice = product.price * quantity;
  const discountRupee = Number(item.discountRupee) || 0;

  const finalProductTotal = totalPrice - discountRupee;
  totalAmount += finalProductTotal;

  // ✅ SAVE SNAPSHOT
  updatedProducts.push({
    productId: product._id,
    name: product.name,
    partNumber: product.partNumber,
    quantity: quantity,
    price: product.price,
    discountPercent: item.discountPercent || 0,
    discountRupee: discountRupee
  });

}

    const finalAmount = totalAmount - Number(discount);
    const remainingAmount = finalAmount - Number(paidAmount);

    /* ===============================
       STEP 3: UPDATE ORDER
    =============================== */

    order.customerName = customerName;
    order.mobile = mobile;
    order.products = updatedProducts;
    order.totalAmount = totalAmount;
    order.discount = Number(discount);
    order.finalAmount = finalAmount;
    order.paidAmount = Number(paidAmount);
    order.remainingAmount = remainingAmount;
    order.paymentMode = paymentMode;

    await order.save();

    res.json({ message: "Order updated successfully", order });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;