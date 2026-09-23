import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaList,
  FaBox,
  FaShoppingCart,
  FaHistory,
  FaUserCog,
  FaTrash
} from "react-icons/fa";
import "../css/dashboard.css";
import logo from "../myLogo/software.png"

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [systemName, setSystemName] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("systemName");
    if (savedName) {
      setSystemName(savedName);
    }
  }, []);

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <FaTachometerAlt style={{ color: "#f08a25" }} /> },
    { name: "Category", path: "/category", icon: <FaList style={{ color: "#f08a25" }} /> },
    { name: "Product", path: "/product", icon: <FaBox style={{ color: "#f08a25" }} /> },
    { name: "Order", path: "/order", icon: <FaShoppingCart style={{ color: "#f08a25" }} /> },
    { name: "Order History", path: "/order-History", icon: <FaHistory style={{ color: "#f08a25" }} /> },
    { name: "Profile Setting", path: "/profile", icon: <FaUserCog style={{ color: "#f08a25" }} /> },

  ];

  const menuTrash = [
    { name: "Trash Bin", path: "/Trash-Bin", icon: <FaTrash style={{ color: "#16a947" }} /> }
  ]

  return (
    <div className="sidebar">

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "left",
        gap: "10px",
        marginBottom: "10px"
      }}>
        <img src={logo} alt="Logo" style={{ width: "50px", height: "50px" }} />
        <h2 style={{ cursor: "pointer", margin: 0 }}>
          {systemName || "Idarat Bills"}
        </h2>
      </div>


      <ul>
        {menuItems.map((item, index) => (
          <li
            key={index}
            className={location.pathname === item.path ? "active" : ""}
            onClick={() => {
              if (location.pathname !== item.path) {
                navigate(item.path, { replace: true });
              }
            }}
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            {item.icon}
            {item.name}
          </li>
        ))}

        {menuTrash.map((item, index) => (
          <li
            key={index}
            className={location.pathname === item.path ? "active-trash" : ""}
            onClick={() => {
              if (location.pathname !== item.path) {
                navigate(item.path, { replace: true });
              }
            }}
            style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "100px" }}
          >
            {item.icon}
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;