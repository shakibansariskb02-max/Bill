require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const Product = require("./models/Product");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

/* Static Folder for Logo Upload */
app.use("/uploads", express.static("uploads"));

/* Routes */
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/category", require("./routes/categoryRoutes"));
app.use("/api/product", require("./routes/productRoutes"));
app.use("/api/order", require("./routes/orderRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));   // ✅ Added

const PORT = 5000;

const startServer = async () => {
  await connectDB();

  // Sync indexes with the current schema — drops any stale/leftover
  // indexes (like an old unique constraint on "name") and creates
  // any new ones (like the unique partNumber index) automatically.
  try {
    await Product.syncIndexes();
    console.log("✅ Product indexes synced");
  } catch (err) {
    console.error("⚠️ Product index sync failed:", err.message);
  }

  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
};

startServer();