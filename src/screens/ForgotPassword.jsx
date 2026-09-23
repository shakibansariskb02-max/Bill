import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function ForgotPassword() {

    const navigate = useNavigate();

    const [step, setStep] = useState(1);

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const sendOtp = async () => {

        try {

            await axios.post(
                "http://localhost:5000/api/users/send-otp",
                { email }
            );

            Swal.fire({
                icon: "success",
                title: "OTP Sent",
                text: "Use OTP to reset your password.",
                confirmButtonColor: "#2563eb",
                confirmButtonText: "OK"
            });

            setStep(2);

        } catch (err) {

            Swal.fire({
                icon: "error",
                title: "Email Not Found",
                text: err.response?.data?.message || "Please enter a registered email.",
                confirmButtonColor: "#dc2626"
            });

        }

    }

    const verifyOtp = () => {

        if (otp === "123456") {

            setStep(3);

        }

        else {

            Swal.fire({
                icon: "error",
                title: "Invalid OTP",
                text: "Please enter the correct OTP.",
                confirmButtonColor: "#dc2626"
            });

        }

    }

    const resetPassword = async () => {

        try {

            await axios.post(
                "http://localhost:5000/api/users/reset-password",
                {
                    email,
                    password: newPassword
                }
            );

            Swal.fire({
                icon: "success",
                title: "Password Reset Successfully",
                text: "You can now login with your new password.",
                confirmButtonColor: "#16a34a"
            }).then(() => {
                navigate("/");
            });

            navigate("/");

        }

        catch (err) {

            Swal.fire({
                icon: "error",
                title: "Oops!",
                text: err.response?.data?.message || "Something went wrong.",
                confirmButtonColor: "#dc2626"
            });

        }

    }

    return (

        <div className="auth-container">

            <div className="auth-box">

                <h2>Forgot Password</h2>

                {step === 1 && (

                    <>
                        <input
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <button onClick={sendOtp}>
                            Send OTP
                        </button>

                    </>

                )}

                {step === 2 && (

                    <>
                        <input
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />

                        <button onClick={verifyOtp}>
                            Verify OTP
                        </button>

                    </>

                )}

                {step === 3 && (

                    <>
                        <div style={{ position: "relative", marginBottom: "15px" }}>
  <input
    type={showPassword ? "text" : "password"}
    placeholder="New Password"
    value={newPassword}
    onChange={(e) => setNewPassword(e.target.value)}
    style={{
      width: "100%",
      padding: "12px 40px 12px 12px",
      boxSizing: "border-box"
    }}
  />

  <span
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      top: "50%",
      right: "15px",
      transform: "translateY(-50%)",
      cursor: "pointer",
      color: "#666",
      fontSize: "18px"
    }}
  >
    {showPassword ? <FaEyeSlash /> : <FaEye />}
  </span>
</div>

                        <button onClick={resetPassword}>
                            Reset Password
                        </button>

                    </>

                )}

            </div>

        </div>

    );

}

export default ForgotPassword;