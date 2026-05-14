import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Login() {
  const navigate = useNavigate();

  // ✅ Always initialized (prevents uncontrolled warning)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault(); // ✅ prevents page reload

    try {
      const res = await API.post("/auth/login", {
        email,
        password
      });

      // ✅ Save token
      localStorage.setItem("token", res.data.token);

      // ✅ Redirect
      navigate("/dashboard");

    } catch (err) {
      console.error(
        "Login error:",
        err.response?.data || err.message || err
      );
      alert("Login failed");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Login</h2>

      {/* ✅ FORM handles submission */}
      <form onSubmit={handleLogin} style={styles.form}>

        <input
          type="email"
          placeholder="Email"
          value={email || ""} // ✅ prevents uncontrolled warning
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password || ""} // ✅ prevents uncontrolled warning
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        {/* ✅ Must be type="submit" */}
        <button type="submit" style={styles.button}>
          Login
        </button>

      </form>

      <p style={styles.link} onClick={() => navigate("/register")}>
        Don't have an account? Register
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "50px auto",
    padding: "20px",
    textAlign: "center"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "20px"
  },
  input: {
    padding: "10px",
    fontSize: "16px"
  },
  button: {
    padding: "10px",
    fontSize: "16px",
    cursor: "pointer"
  },
  link: {
    marginTop: "15px",
    cursor: "pointer",
    color: "green"
  }
};

export default Login;