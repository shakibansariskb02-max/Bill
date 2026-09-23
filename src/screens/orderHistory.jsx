import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../css/dashboard.css";
import "../css/form.css";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";
import { FaArrowUp } from "react-icons/fa";
import Footer from "../components/Footer";
import { FaFilePdf } from "react-icons/fa";
import Bill from "./Bill"

function OrderHistory() {

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [orders, setOrders] = useState([]);
 
  const [search, setSearch] = useState("");



  const [previewBill, setPreviewBill] = useState(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/order?userId=${user._id}&search=${search}`
      );
      setOrders(res.data);
    } catch (error) {
      // order list stays empty if this fails
    }
  };

  const deleteOrder = async (order) => {
  const result = await Swal.fire({
    title: "Delete this bill?",
    text: "Choose what should happen to the products in this bill.",
    icon: "warning",
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: "Delete & Return to Stock",
    denyButtonText: "Delete (Don't Restock)",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#16a34a",
    denyButtonColor: "#dc3545",
  });

  if (result.isDismissed || (!result.isConfirmed && !result.isDenied)) {
    return;
  }

  const restoreStock = result.isConfirmed;

  try {
    await axios.delete(
      `http://localhost:5000/api/order/${order._id}?userId=${user._id}&restoreStock=${restoreStock}`
    );

    Swal.fire(
      "Deleted!",
      restoreStock
        ? "Stock restored. Bill permanently deleted."
        : "Bill moved to Trash Bin. Stock not changed.",
      "success"
    );

    fetchOrders();
  } catch (error) {
    Swal.fire("Error", "Delete failed", "error");
  }
};

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content">
        <Navbar />
        <div className="page-content">
          <div className="form-card">
            <h2 className="section-title">Order History</h2>

            <div className="search-wrapper">
              <input
                type="text"
                placeholder="Search by Customer Name or Mobile"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="table-card">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Date</th>
                    <th style={{ textAlign: "center" }}>Customer</th>
                    <th style={{ textAlign: "center" }}>Mobile</th>
                    <th style={{ textAlign: "center" }}>Total</th>
                    <th style={{ textAlign: "center" }}>Final</th>
                    <th style={{ textAlign: "center" }}>Paid</th>
                    <th style={{ textAlign: "center" }}>Remaining</th>
                    <th style={{ textAlign: "center" }}>Payment</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center" }}>
                        No details found
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order._id}>
                        <td style={{textAlign:"left"}}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td>{order.customerName}</td>
                        <td>{order.mobile}</td>
                        <td>₹{Number(order.totalAmount).toFixed(2)}</td>
                        <td>₹{Number(order.finalAmount).toFixed(2)}</td>
                        <td>₹{Number(order.paidAmount).toFixed(2)}</td>
                        <td>₹{Number(order.remainingAmount).toFixed(2)}</td>
                        <td>{order.paymentMode}</td>
                        <td>
                          <button
                            onClick={() => setPreviewBill(order)}
                            style={{
                              marginRight: "5px",
                              background: "#16a34a",
                              color: "#fff",
                              border: "none",
                              padding: "5px 8px",
                              borderRadius: "6px",
                              width: "60px"
                            }}
                          >
                            <FaFilePdf />
                          </button>

                          <button
                            onClick={() =>
  navigate("/order", {
    state: {
      editOrder: order,
    },
  })
}
                            style={{
                              marginRight: "5px",
                              
                              color: "#fff",
                              border: "none",
                              padding: "5px 10px",
                              borderRadius: "6px",
                              width: "60px"
                            }}
                            className="warning-btn"
                          >
                            Edit
                          </button>

                          <button
  onClick={() => deleteOrder(order)}
  style={{
    background: "#000000",
    color: "#fff",
    border: "none",
    padding: "5px 10px",
    borderRadius: "6px",
    width: "60px"
  }}
>
  Delete
</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ================= EDIT SECTION ================= */}

            
            {/* ================= BILL PREVIEW MODAL ================= */}
            {previewBill && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "rgba(0,0,0,0.5)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 1000
                }}
              >
                <div
                  style={{
                    background: "#fff",
                    padding: "30px",
                    width: "850px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    borderRadius: "10px",
                    position: "relative"
                  }}
                >
                  <button
                    onClick={() => setPreviewBill(null)}
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "15px",
                      background: "transparent",
                      border: "none",
                      fontSize: "20px",
                      cursor: "pointer"
                    }}
                  >
                    ×
                  </button>

                  {/* ✅ USE BILL COMPONENT HERE */}
                  <Bill
                    order={previewBill}
                    onClose={() => setPreviewBill(null)}
                  />

                </div>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>

      <button
        onClick={scrollToTop}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          cursor: "pointer",
        }}
      >
        <FaArrowUp />
      </button>
    </div>
  );
}

export default OrderHistory;