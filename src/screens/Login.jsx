import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import "../css/auth.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 🔒 Prevent logged-in users from seeing login page
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/users/login",
        { email, password }
      );

      if (res.data.user) {
        localStorage.clear();
        localStorage.setItem("user", JSON.stringify(res.data.user));

        // 🔥 Replace history so back button won't go to login
        navigate("/dashboard", { replace: true });
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Login Failed");
    }
  };

  return (
    <div className="auth-container">
      
      <h1 className="Main-name"> Idarat Al </h1>
      <p className="Main-subtitle">Best Inventory Software</p>

      <div className="auth-box">
        <h2>Login</h2>

        <form onSubmit={submitHandler}>

          {/* Email Field */}
          <div style={{ position: "relative", marginBottom: "15px" }}>
            <FaEnvelope
              style={{
                position: "absolute",
                top: "20px",
                left: "12px",
                color: "#666"
              }}
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ paddingLeft: "35px" }}
            />
          </div>

          {/* Password Field */}
          <div style={{ position: "relative", marginBottom: "15px" }}>
            <FaLock
              style={{
                position: "absolute",
                top: "20px",
                left: "12px",
                color: "#666"
              }}
            />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingLeft: "35px", paddingRight: "35px" }}
            />

            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                top: "20px",
                right: "12px",
                cursor: "pointer",
                color: "#666"
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <p
  style={{
    textAlign: "right",
    marginBottom: "15px",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px"
  }}
  onClick={() => navigate("/forgot-password")}
>
  Forgot Password?
</p>

          <button type="submit">Login</button>
        </form>

        <p style={{ marginTop: "15px", textAlign: "center" }}>
          Don’t have an account?{" "}
          <span
            style={{
              color: "#2563eb",
              cursor: "pointer",
              fontWeight: "bold"
            }}
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </span>
        </p>

      </div>

    </div>
  );
}

export default Login;