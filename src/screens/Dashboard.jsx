import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../css/dashboard.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import Footer from "../components/Footer";

function Dashboard() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    const cat = await axios.get(
      `http://localhost:5000/api/category?userId=${user._id}`
    );

    const prod = await axios.get(
      `http://localhost:5000/api/product?userId=${user._id}`
    );

    const ord = await axios.get(
      `http://localhost:5000/api/order?userId=${user._id}`
    );

    setCategories(cat.data || []);
    setProducts(prod.data || []);
    setOrders(ord.data || []);
  } catch (error) {
    // dashboard stats stay empty if this fails
  }
};

  // ================= TOTAL SALES =================
  const totalSales = orders.reduce(
    (acc, item) => acc + (Number(item.finalAmount) || 0),
    0
  );

  // ================= TODAY SALES =================
  const today = new Date();
  const todaySales = orders.reduce((acc, order) => {
    if (!order.createdAt) return acc;
    const orderDate = new Date(order.createdAt);
    if (orderDate.toDateString() === today.toDateString()) {
      return acc + (Number(order.finalAmount) || 0);
    }
    return acc;
  }, 0);

  // ================= YEARS =================
  const years = [
    ...new Set(
      orders
        .filter((o) => o.createdAt)
        .map((o) => new Date(o.createdAt).getFullYear())
    ),
  ].sort((a, b) => b - a);

  const monthNames = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  // ================= MONTHLY DATA =================
  const monthlySales = new Array(12).fill(0);

  orders.forEach((order) => {
    if (!order.createdAt) return;
    const date = new Date(order.createdAt);
    if (date.getFullYear() === Number(selectedYear)) {
      monthlySales[date.getMonth()] +=
        Number(order.finalAmount) || 0;
    }
  });

  const monthlyChartData = monthNames.map((month, index) => ({
    month,
    sales: monthlySales[index],
    monthIndex: index,
  }));

  // ================= DAILY DATA =================
  let dailyChartData = [];

  if (selectedMonth !== null) {
    const daysInMonth = new Date(
      selectedYear,
      selectedMonth + 1,
      0
    ).getDate();

    const dailySales = new Array(daysInMonth).fill(0);

    orders.forEach((order) => {
      if (!order.createdAt) return;

      const date = new Date(order.createdAt);
      if (
        date.getFullYear() === Number(selectedYear) &&
        date.getMonth() === selectedMonth
      ) {
        dailySales[date.getDate() - 1] +=
          Number(order.finalAmount) || 0;
      }
    });

    dailyChartData = dailySales.map((sale, index) => ({
      date: index + 1,
      sales: sale,
    }));
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content">
        <Navbar />

        <div className="page-content">

          {/* ================= CARDS ================= */}
          <div className="cards-container">
            <div className="card">
              <h4>Total Categories</h4>
              <p>{categories.length}</p>
            </div>

            <div className="card">
              <h4>Total Products</h4>
              <p>{products.length}</p>
            </div>

            <div className="card">
              <h4>Total Orders</h4>
              <p>{orders.length}</p>
            </div>

            <div className="card">
              <h4>Total Sales</h4>
              <p>₹ {totalSales.toLocaleString()}</p>
            </div>

            <div className="card">
              <h4>Today Sales</h4>
              <p>₹ {todaySales.toLocaleString()}</p>
            </div>
          </div>

          {/* ================= YEAR SELECT ================= */}
          <div style={{ marginTop: "30px", marginBottom: "15px" }}>
           

            {selectedMonth !== null && (
              <button
                style={{
                  marginLeft: "15px",
                  padding: "8px 15px",
                  borderRadius: "6px",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  marginBottom:"10px"
                }}
                onClick={() => setSelectedMonth(null)}
              >
                Back to Monthly View
              </button>
            )}

             <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedMonth(null);
              }}
              style={{ padding: "8px 15px", borderRadius: "6px", marginLeft:"15px" }}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* ================= CHART ================= */}
          <div
            style={{
              width: "100%",
              height: "400px",
              background: "#fff",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 8px 25px rgba(0,0,0,0.05)",
            }}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
              <BarChart
                data={
                  selectedMonth === null
                    ? monthlyChartData
                    : dailyChartData
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey={
                    selectedMonth === null ? "month" : "date"
                  }
                />
                <YAxis />
                <Tooltip />

                <Bar
                  dataKey="sales"
                  fill="#2563eb"
                  radius={[8, 8, 0, 0]}
                  onClick={(data) => {
                    if (selectedMonth === null) {
                      setSelectedMonth(data.monthIndex);
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
        <Footer/>
      </div>
      
    </div>
  );
}

export default Dashboard;