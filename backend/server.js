require("dotenv").config();

const express = require("express");
const cors = require("cors");
const noteRoutes = require("./routes/noteRoutes");
const app = express();
const path = require("path");

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Import routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const mediaRoutes = require("./routes/mediaRoutes");

// ✅ Use routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/media", mediaRoutes);

// ✅ Test routes
app.get("/", (req, res) => {
  res.send("Backend is running on port 5001");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ✅ Protected route test
const authMiddleware = require("./middleware/authMiddleware");

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You are authenticated!",
    user: req.user
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});