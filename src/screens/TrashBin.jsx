import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";
import Footer from "../components/Footer";
import { FaArrowUp } from "react-icons/fa";

function TrashBin() {

  const user = JSON.parse(localStorage.getItem("user"));
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTrash();
    }

    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScroll(true);
      } else {
        setShowScroll(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchTrash = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/order/trash?userId=${user._id}`
      );
      setOrders(res.data);
    } catch (error) {
      // trash list stays empty if this fails
    }
  };

  const restoreOrder = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/order/restore/${id}?userId=${user._id}`
      );

      Swal.fire({
        icon: "success",
        title: "Restored!",
        text: "Order restored successfully",
        timer: 1500,
        showConfirmButton: false
      });

      fetchTrash();

    } catch (error) {
      Swal.fire("Error", "Restore failed", "error");
    }
  };

  const permanentDelete = async (id) => {

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete permanently!"
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/order/permanent/${id}?userId=${user._id}`
      );

      Swal.fire("Deleted!", "Order permanently deleted.", "success");
      fetchTrash();

    } catch (error) {
      Swal.fire("Error", "Permanent delete failed", "error");
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.mobile?.includes(searchTerm)
  );

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content">
        <Navbar />
        <div className="page-content">
          <div className="form-card">
            <h2 className="section-title">Trash Bin</h2>

            <div style={{ marginBottom: "15px", textAlign: "right" }}>
              <input
                type="text"
                placeholder="Search by Name or Mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "8px 12px",
                  width: "100%",
                  height:"40px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  outline: "none"
                }}
              />
            </div>

            <div className="table-card">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th style={{textAlign:"left"}}>Date</th>
                    <th style={{textAlign:"center"}}>Customer</th>
                    <th style={{textAlign:"center"}}>Mobile</th>
                    <th style={{textAlign:"center"}}>Total</th>
                    <th style={{textAlign:"center"}}>Final</th>
                    <th style={{textAlign:"center"}}>Paid</th>
                    <th style={{textAlign:"center"}}>Remaining</th>
                    <th style={{textAlign:"center"}}>Payment</th>
                    <th style={{textAlign:"center"}}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center" }}>
                        Trash is empty
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order._id}>
                        <td style={{textAlign:"left"}}>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>{order.customerName}</td>
                        <td>{order.mobile}</td>
                        <td>₹{Number (order.totalAmount).toFixed(2)}</td>
                        <td>₹{Number (order.finalAmount).toFixed(2)}</td>
                        <td>₹{Number (order.paidAmount).toFixed(2)}</td>
                        <td>₹{Number (order.remainingAmount).toFixed(2)}</td>
                        <td>{order.paymentMode}</td>
                        <td>
                          <button
                            style={{
                              background: "#28a745",
                              color: "#fff",
                              padding: "5px 10px",
                              border: "none",
                              borderRadius: "6px",
                              marginRight: "5px",
                              cursor: "pointer",
                              width:"70px",
                            }}
                            onClick={() => restoreOrder(order._id)}
                          >
                            Restore
                          </button>

                          <button
                            style={{
                              background: "#dc3545",
                              color: "#fff",
                              padding: "5px 10px",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              width:"60px",
                            }}
                            onClick={() => permanentDelete(order._id)}
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

          </div>
        </div>
        <Footer />
      </div>

      {showScroll && (
        <button
          onClick={scrollToTop}
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            background: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            zIndex: 1000
          }}
        >
          <FaArrowUp size={18} />
        </button>
      )}

    </div>
  );
}

export default TrashBin;