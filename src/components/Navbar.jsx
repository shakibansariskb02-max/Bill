import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/dashboard.css";

function Navbar() {
    const userData = JSON.parse(localStorage.getItem("user"));
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (userData) {
            fetchProfile();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchProfile = async () => {
  try {
    if (!userData?._id) return;

    const res = await axios.get(
      `http://localhost:5000/api/profile/${userData._id}`
    );

    setUser(res.data);
  } catch (err) {
    // profile is optional; silently fall back to defaults
  }
};

    

    return (
        <div className="navbar">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

                {/* Logo */}
                {user?.logo && (
                    <img
                        src={`http://localhost:5000/uploads/${user.logo}`}
                        alt="logo"
                        style={{ width: "200px", height: "60px", objectFit: "cover" }}
                    />
                )}

                <div>
                    <h3 style={{fontWeight:"bold"}} >{user?.businessName || "Inventory System"}</h3>
                    <small >{new Date().toLocaleDateString()}</small>
                </div>
            </div>

            <div className="nav-right">
                <span className="user-name" style={{color:"white"}} >
                    {user ? `Welcome, ${user.name}` : ""}
                </span>

                
            </div>
        </div>
    );
}

export default Navbar;