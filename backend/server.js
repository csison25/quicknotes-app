require("dotenv").config();

const express = require("express");
const cors = require("cors");
const noteRoutes = require("./routes/noteRoutes");
const app = express();
const path = require("path");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
// ✅ Import routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// ✅ Middleware
app.use(cors());

// ✅ Stripe webhook BEFORE express.json()
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

    } catch (err) {
      console.error("❌ Webhook signature verification failed.");
      console.error(err.message);

      return res
        .status(400)
        .send(`Webhook Error: ${err.message}`);
    }

    // ✅ PAYMENT SUCCESS
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;

      console.log("✅ PAYMENT SUCCEEDED");
      console.log("Payment ID:", paymentIntent.id);
      console.log("Amount:", paymentIntent.amount);
      console.log("Currency:", paymentIntent.currency);
    }

    // ❌ PAYMENT FAILED
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;

      console.log("❌ PAYMENT FAILED");
      console.log("Payment ID:", paymentIntent.id);

      console.log(
        "Reason:",
        paymentIntent.last_payment_error?.message
      );
    }

    res.json({ received: true });
  }
);

// ✅ Normal JSON parsing AFTER
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payments/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Stripe webhook routes FIRST
app.use("/api/payments", paymentRoutes);

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