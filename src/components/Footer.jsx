import React from "react";

const Footer = () => {
  return (
    <footer
      style={{
        
        
        padding: "20px 0",
        marginTop: "40px"
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "auto",
          padding: "0 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap"
        }}
      >
        {/* Left */}
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} Idarat Bills Inventory. Created by Shakib Ansari. Version 1.0
        </p>

        {/* Right - Social Icons */}
        
      </div>
    </footer>
  );
};

export default Footer;