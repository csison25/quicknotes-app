import { useState } from "react";
import {
  CardElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";

import API from "../services/api";

import { useNavigate } from "react-router-dom";

function Checkout() {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (loading) return;

    if (!stripe || !elements) return;

    setLoading(true);
    setMessage("");

    try {
      // Create PaymentIntent
      const res = await API.post("/payments/create-payment-intent", {
        amount: 1999
      });

      const clientSecret = res.data.clientSecret;

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        setMessage(result.error.message);
      } else if (result.paymentIntent.status === "succeeded") {
        setMessage("Payment successful!");
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
        // Clear card field
        elements.getElement(CardElement).clear();
      }

    } catch (err) {
      console.error(err);
      setMessage("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div style={styles.page}>
    <div style={styles.checkoutCard}>
      <button
        onClick={() => navigate("/dashboard")}
        style={styles.backButton}
        >
        ← Back to Dashboard
      </button>
      <h2 style={styles.title}>Checkout</h2>

      <form onSubmit={handleSubmit}>
        <div style={styles.cardContainer}>
          <CardElement options={cardElementOptions} />
        </div>

        <button
          type="submit"
          disabled={!stripe || loading}
          style={{
            ...styles.payButton,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Processing..." : "Pay $19.99"}
        </button>
      </form>

      {message && (
        <p
          style={
            message.includes("successful")
              ? styles.successMessage
              : styles.errorMessage
          }
        >
          {message}
        </p>
      )}
    </div>
  </div>
);
}
const cardElementOptions = {
  style: {
    base: {
      color: "#f5f5f5",
      fontSize: "18px",
      fontFamily: "Arial, sans-serif",
      "::placeholder": {
        color: "#888",
      },
    },
    invalid: {
      color: "#ff6b6b",
    },
  },
};

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#121212",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px",
  },

  checkoutCard: {
    width: "100%",
    maxWidth: "650px",
    backgroundColor: "#1e1e1e",
    border: "1px solid #333",
    borderRadius: "16px",
    padding: "40px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  },

  title: {
    textAlign: "center",
    marginBottom: "30px",
    fontSize: "32px",
    color: "#f5f5f5",
  },

  cardContainer: {
    backgroundColor: "#2a2a2a",
    padding: "22px",
    borderRadius: "12px",
    border: "1px solid #444",
    marginBottom: "24px",
  },

  payButton: {
    width: "100%",
    padding: "16px",
    fontSize: "18px",
    fontWeight: "bold",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    backgroundColor: "#635bff",
    color: "#fff",
    opacity: 0.95,
    transition: "opacity 0.2s ease",
  },
  backButton: {
  marginBottom: "20px",
  padding: "10px 16px",
  borderRadius: "8px",
  border: "1px solid #444",
  backgroundColor: "#2a2a2a",
  color: "#f5f5f5",
  cursor: "pointer",
  fontSize: "14px",
  },
  successMessage: {
  marginTop: "20px",
  textAlign: "center",
  color: "#4caf50",
  fontWeight: "bold",
  fontSize: "16px",
  },
  errorMessage: {
  marginTop: "20px",
  textAlign: "center",
  color: "#ff6b6b",
  fontWeight: "bold",
  fontSize: "16px",
   },
};

export default Checkout;