import React, { useState } from "react";
import axios from "axios";
import "../css/auth.css";
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import Swal from "sweetalert2";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const submitHandler = async (e) => {
  e.preventDefault();

  if (formData.password !== formData.confirmPassword) {
    return Swal.fire({
      icon: "error",
      title: "Password Mismatch",
      text: "Passwords do not match!"
    });
  }

  try {
    const res = await axios.post(
      "http://localhost:5000/api/users/register",
      {
        name: formData.name,
        email: formData.email,
        password: formData.password
      }
    );

    Swal.fire({
      icon: "success",
      title: "Account Created",
      text: res.data.message,
      confirmButtonColor: "#3085d6"
    }).then(() => {
      window.location.href = "/";
    });

  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Signup Failed",
      text: error.response?.data?.message || "Error creating account"
    });
  }
};

  return (
    <div className="auth-container">
      <h1 className="Main-name"> Idarat Al </h1>
      <p className="Main-subtitle">Best Inventory Software</p>
      <div className="auth-box">
        <h2>Create Account</h2>

        <form onSubmit={submitHandler}>

          {/* Full Name */}
          <div style={{ position: "relative", marginBottom: "15px" }}>
            <FaUser
              style={{
                position: "absolute",
                top: "20px",
                left: "12px",
                color: "#666"
              }}
            />
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ paddingLeft: "35px" }}
            />
          </div>

          {/* Email */}
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
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              style={{ paddingLeft: "35px" }}
            />
          </div>

          {/* Password */}
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
    name="password"
    placeholder="Password"
    value={formData.password}
    onChange={handleChange}
    required
    style={{
      paddingLeft: "35px",
      paddingRight: "40px"
    }}
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

          {/* Confirm Password */}
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
    type={showConfirmPassword ? "text" : "password"}
    name="confirmPassword"
    placeholder="Confirm Password"
    value={formData.confirmPassword}
    onChange={handleChange}
    required
    style={{
      paddingLeft: "35px",
      paddingRight: "40px"
    }}
  />

  <span
    onClick={() =>
      setShowConfirmPassword(!showConfirmPassword)
    }
    style={{
      position: "absolute",
      top: "20px",
      right: "12px",
      cursor: "pointer",
      color: "#666"
    }}
  >
    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
  </span>
</div>

          <button type="submit">Sign Up</button>
        </form>

        <p style={{ marginTop: "15px", textAlign: "center" }}>
        Already have an account?{" "}
        <span
          style={{ color: "#2563eb", cursor: "pointer" }}
          onClick={() => (window.location.href = "/")}
        >
          Login
        </span>
      </p>
      </div>

      
    </div>
    
  );
}

export default Signup;