import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./screens/Login";
import Signup from "./screens/Signup";
import Dashboard from "./screens/Dashboard";
import Category from "./screens/Category";
import Product from "./screens/Product";
import Order from "./screens/Order";
import Bill from "./screens/Bill";
import OrderHistory from "./screens/orderHistory";
import Profile from "./components/Profile";
import TrashBin from "./screens/TrashBin";
import ForgotPassword from "./screens/ForgotPassword";

// Simple Auth Check
const PrivateRoute = ({ children }) => {
  const user = localStorage.getItem("user");
  return user ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/category"
          element={
            <PrivateRoute>
              <Category />
            </PrivateRoute>
          }
        />

        <Route
          path="/product"
          element={
            <PrivateRoute>
              <Product />
            </PrivateRoute>
          }
        />

        <Route
          path="/order"
          element={
            <PrivateRoute>
              <Order />
            </PrivateRoute>
          }
        />

        <Route
          path="/bill"
          element={
            <PrivateRoute>
              <Bill />
            </PrivateRoute>
          }
        />
        <Route path="/order-History" element={<OrderHistory />} />
       <Route path="/profile" element={<Profile/>}/>
       <Route path="/Trash-Bin" element={<TrashBin/>} />
       <Route
    path="/forgot-password"
    element={<ForgotPassword />}
/>

      </Routes>
    </Router>
  );
}

export default App;