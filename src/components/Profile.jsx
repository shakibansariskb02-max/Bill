import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "../css/form.css";
import Swal from "sweetalert2";
import { FaUserCircle } from "react-icons/fa";
import Footer from "./Footer";

const Profile = () => {

    const [formData, setFormData] = useState({
        ownerName: "",
        email: "",
        businessName: "",
        logo: null
    });

    const [userId, setUserId] = useState("");

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));

        // 🔒 PROTECT PAGE
        if (!user) {
            window.location.replace("/login"); // prevents back access
            return;
        }

        setUserId(user._id);
        fetchProfile(user._id);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchProfile = async (id) => {
        try {
            const res = await axios.get(
                `http://localhost:5000/api/profile/${id}`
            );

            setFormData({
                ownerName: res.data.name,
                email: res.data.email,
                businessName: res.data.businessName || "",
                logo: null
            });

        } catch (error) {
            // profile fetch failed - form stays with defaults
        }
    };

    const saveHandler = async () => {

    const { value: password } = await Swal.fire({
        title: "Enter Master Password",
        input: "password",
        inputPlaceholder: "Enter your secure password",
        inputAttributes: {
            autocapitalize: "off",
            autocorrect: "off"
        },
        showCancelButton: true,
        confirmButtonText: "Verify & Save",
        confirmButtonColor: "#28a745",
        cancelButtonText: "Cancel"
    });

    if (!password) return;

    try {
        const data = new FormData();

        data.append("name", formData.ownerName);
        data.append("businessName", formData.businessName);
        data.append("masterPassword", password); // 🔒 Send password

        if (formData.logo) {
            data.append("logo", formData.logo);
        }

        await axios.put(
            `http://localhost:5000/api/profile/${userId}`,
            data
        );

        Swal.fire({
            icon: "success",
            title: "Profile Updated",
            text: "Your profile has been updated successfully!",
            confirmButtonColor: "#28a745"
        }).then(() => {
            window.location.reload();
        });

    } catch (error) {

        if (error.response?.status === 401) {
            Swal.fire({
                icon: "error",
                title: "Access Denied",
                text: "Incorrect master password!"
            });
        } else {
            Swal.fire("Error", "Update failed", "error");
        }
    }
};

    const deleteHandler = async () => {

        const result = await Swal.fire({
            title: "Are you absolutely sure?",
            text: "This action cannot be undone! Your account will be permanently deleted.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, Delete Account",
            cancelButtonText: "Cancel"
        });

        if (result.isConfirmed) {
            try {

                await axios.delete(
                    `http://localhost:5000/api/users/delete/${userId}`
                );

                localStorage.removeItem("user");

                Swal.fire({
                    icon: "success",
                    title: "Account Deleted",
                    text: "Your account has been permanently deleted.",
                    timer: 2000,
                    showConfirmButton: false
                });

                setTimeout(() => {
                    window.location.replace("/");
                }, 2000);

            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Deletion Failed",
                    text: "Something went wrong!"
                });
            }
        }
    };

    const logoutHandler = async () => {

        const result = await Swal.fire({
            title: "Are you sure?",
            text: "You will be logged out of your account!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, Logout",
            cancelButtonText: "Cancel"
        });


        if (result.isConfirmed) {
            try {
                await axios.post("http://localhost:5000/api/users/logout");

                localStorage.removeItem("user");

                Swal.fire({
                    icon: "success",
                    title: "Logged Out",
                    text: "You have been logged out successfully.",
                    timer: 1500,
                    showConfirmButton: false
                });

                setTimeout(() => {
                    window.location.replace("/");
                }, 1500);

            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Logout Failed",
                    text: "Something went wrong!"
                });
            }
        }
    };

    return (
        <div className="dashboard">
            <Sidebar />

            <div className="content">
                <Navbar />

                <div className="page-content">
                    <div className="form-card" style={{ maxWidth: "600px", margin: "auto" }}>

                        <h2 style={{
                            marginBottom: "20px", display: "flex",
                            alignItems: "center"
                        }}> <FaUserCircle style={{ marginRight: "10px" }} size={35} /> Profile Settings </h2>

                        <div className="form-last">

                            <label style={{ fontWeight: "550" }}>Owner Name</label>
                            <input
                                type="text"
                                value={formData.ownerName}
                                onChange={(e) =>
                                    setFormData({ ...formData, ownerName: e.target.value })
                                }
                            />

                            <label style={{ fontWeight: "550" }}>Email</label>
                            <input type="email" value={formData.email} readOnly />

                            <label style={{ fontWeight: "550" }}>Business Name</label>
                            <input
                                type="text"
                                value={formData.businessName}
                                onChange={(e) =>
                                    setFormData({ ...formData, businessName: e.target.value })
                                }
                            />

                            <label style={{ fontWeight: "550" }}>Upload Logo</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setFormData({ ...formData, logo: e.target.files[0] })
                                }
                            />

                            <button
                                className="success-btn"
                                style={{ marginTop: "15px" }}
                                onClick={saveHandler}
                            >
                                Save Changes
                            </button>

                            <button
                                className="danger-btn"
                                style={{ marginTop: "15px" }}
                                onClick={logoutHandler}
                            >
                                Logout
                            </button>
                            <hr
                                style={{
                                    color: "black",
                                    backgroundColor: "black",
                                    height: "1px",
                                    borderColor: "black",
                                    marginTop: "50px"
                                    // Ensures consistent color across browsers
                                }}
                            />
                            <button
                                className="danger-btn"
                                style={{ marginTop: "50px", backgroundColor: "#b91c1c" }}
                                onClick={deleteHandler}
                            >
                                Delete Account
                            </button>

                        </div>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
    );
};

export default Profile;