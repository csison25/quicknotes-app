require("dotenv").config();

const express = require("express");
const Stripe = require("stripe");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// CREATE PAYMENT INTENT
router.post(
  "/create-payment-intent",
  authMiddleware,
  async (req, res) => {
    try {
      const { amount } = req.body;
      const userId = req.user.id;
      const username = req.user.username;
      const role = req.user.role;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          message: "Invalid amount"
        });
      }

      const paymentIntent =
        await stripe.paymentIntents.create({
          amount,
          currency: "usd",

          automatic_payment_methods: {
            enabled: true,
          },

          metadata: {
            userId: String(userId),
            username,
            role,
            app: "QuickNotes"
          }
        });

      res.json({
        clientSecret: paymentIntent.client_secret
      });

    } catch (err) {
      console.error("Stripe error:", err);

      res.status(500).json({
        message: "Payment intent creation failed"
      });
    }
  }
);

// STRIPE WEBHOOK
router.post(
  "/webhook",
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
      console.error("Webhook signature verification failed:", err.message);

      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ✅ HANDLE EVENTS
    switch (event.type) {

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;

        console.log("✅ PAYMENT SUCCEEDED");
        console.log("Payment ID:", paymentIntent.id);
        console.log("Amount:", paymentIntent.amount);
        console.log("Currency:", paymentIntent.currency);

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;

        console.log("❌ PAYMENT FAILED");
        console.log("Payment ID:", paymentIntent.id);

        console.log(
          "Failure message:",
          paymentIntent.last_payment_error?.message
        );

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }
);

module.exports = router;