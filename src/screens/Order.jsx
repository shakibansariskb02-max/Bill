import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaSearch,
  FaShoppingCart,
  FaTrash,
  FaPlus,
  FaMinus,
  FaBoxOpen,
  FaReceipt,
} from "react-icons/fa";
import "../css/dashboard.css";
import "../css/form.css";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PAGE_SIZE = 24;

// A small fixed palette so each category gets a consistent, pleasant color.
const CARD_GRADIENTS = [
  "linear-gradient(135deg, #f97316, #fb923c)",
  "linear-gradient(135deg, #2563eb, #60a5fa)",
  "linear-gradient(135deg, #16a34a, #4ade80)",
  "linear-gradient(135deg, #db2777, #f472b6)",
  "linear-gradient(135deg, #7c3aed, #a78bfa)",
  "linear-gradient(135deg, #0891b2, #22d3ee)",
  "linear-gradient(135deg, #ca8a04, #facc15)",
  "linear-gradient(135deg, #dc2626, #f87171)",
];

const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const cardGradientFor = (key) =>
  CARD_GRADIENTS[hashString(key || "x") % CARD_GRADIENTS.length];

function Order() {
  const navigate = useNavigate();

  const location = useLocation();
  const editOrder = location.state?.editOrder;

  const user = JSON.parse(localStorage.getItem("user"));

  // ================= PRODUCT BROWSING =================
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // ================= CART =================
  const [cart, setCart] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // ================= ORDER MODAL =================
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [discount, setDiscount] = useState("");

  const mobileDebounceRef = useRef(null);

  // ================= FETCH PRODUCTS / CATEGORIES =================
  useEffect(() => {
    if (!user) return navigate("/");
    fetchProducts();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await axios.get("http://localhost:5000/api/product", {
        params: { userId: user._id },
      });
      setProducts(res.data);
    } catch (err) {
      // product list stays empty if this fails
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/category", {
        params: { userId: user._id },
      });
      setCategories(res.data);
    } catch (err) {
      // category filter list stays empty if this fails
    }
  };

  // ================= LOAD ORDER FOR EDIT =================
  useEffect(() => {
    if (!editOrder) return;

    setEditingId(editOrder._id);

    setCustomerName(editOrder.customerName);
    setMobile(editOrder.mobile);
    setDiscount(editOrder.discount || 0);
    setPaidAmount(editOrder.paidAmount || 0);
    setPaymentMode(editOrder.paymentMode);

    const loadedCart = editOrder.products.map((p) => ({
      productId: p.productId,
      name: p.name,
      partNumber: p.partNumber,
      price: p.price,
      quantity: p.quantity,
      discountPercent: p.discountPercent || 0,
      discountRupee: p.discountRupee || 0,
      totalMrp: (p.price * p.quantity).toFixed(2),
      total: (p.price * p.quantity - (p.discountRupee || 0)).toFixed(2),
    }));

    setCart(loadedCart);
  }, [editOrder]);

  // ================= MOBILE -> LOOKUP PAST CUSTOMER NAME =================
  useEffect(() => {
    if (!showOrderModal) return;
    if (!/^\d{10}$/.test(mobile)) return;

    if (mobileDebounceRef.current) clearTimeout(mobileDebounceRef.current);

    mobileDebounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/order/lookup-customer",
          { params: { userId: user._id, mobile } }
        );
        if (res.data && res.data.customerName) {
          setCustomerName(res.data.customerName);
        }
      } catch (err) {
        // no previous order for this number - customer types name manually
      }
    }, 400);

    return () => clearTimeout(mobileDebounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobile, showOrderModal]);

  // reset pagination whenever the filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, productSearch]);

  const showError = (message) => {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: message,
      confirmButtonColor: "#d33",
    });
  };

  const handleOnlyNumbers = (value, setter) => {
    if (value === "") return setter("");
    if (/^\d*\.?\d*$/.test(value)) {
      setter(value);
    }
  };

  const handleMobileChange = (value) => {
    if (value === "") return setMobile("");
    if (/^\d{0,10}$/.test(value)) {
      setMobile(value);
    }
  };

  // ================= FAST LOOKUPS =================
  const cartMap = useMemo(() => {
    const map = {};
    cart.forEach((item) => {
      map[item.productId] = item;
    });
    return map;
  }, [cart]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        (p.partNumber || "").toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, productSearch]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );

  // ================= CART ACTIONS =================
  const addToCart = (product, qty = 1) => {
    const existing = cartMap[product._id];
    const alreadyInCart = existing ? Number(existing.quantity) : 0;

    if (alreadyInCart + qty > Number(product.stock)) {
      return showError("Not enough stock available");
    }

    const price = Number(product.price);

    if (existing) {
      const newQty = alreadyInCart + qty;
      const percent = Number(existing.discountPercent) || 0;
      const perUnitDiscount = (price * percent) / 100;
      const newDiscountRupee = perUnitDiscount * newQty;

      setCart((prev) =>
        prev.map((item) =>
          item.productId === product._id
            ? {
                ...item,
                quantity: newQty,
                totalMrp: (price * newQty).toFixed(2),
                discountRupee: newDiscountRupee.toFixed(2),
                total: (price * newQty - newDiscountRupee).toFixed(2),
              }
            : item
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          partNumber: product.partNumber || "-",
          category: product.category || "",
          price: price,
          quantity: qty,
          discountPercent: 0,
          discountRupee: 0,
          totalMrp: (price * qty).toFixed(2),
          total: (price * qty).toFixed(2),
        },
      ]);
    }
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    Swal.fire({
      icon: "warning",
      title: "Clear cart?",
      text: "All items in the current cart will be removed.",
      showCancelButton: true,
      confirmButtonText: "Yes, clear it",
      confirmButtonColor: "#dc2626",
    }).then((res) => {
      if (res.isConfirmed) setCart([]);
    });
  };

  const updateCartQty = (productId, value) => {
    if (value !== "" && !/^\d*$/.test(value)) return;

    if (value === "") {
      setCart((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity: "" } : item
        )
      );
      return;
    }

    const qty = Number(value);
    const product = products.find((p) => p._id === productId);

    if (product && qty > Number(product.stock)) {
      showError("Not enough stock available");
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;

        const percent = Number(item.discountPercent) || 0;
        const perUnitDiscount = (item.price * percent) / 100;
        const totalDiscount = perUnitDiscount * qty;

        return {
          ...item,
          quantity: qty,
          totalMrp: (item.price * qty).toFixed(2),
          discountRupee: totalDiscount.toFixed(2),
          total: (item.price * qty - totalDiscount).toFixed(2),
        };
      })
    );
  };

  const bumpCartQty = (productId, delta) => {
    const item = cartMap[productId];
    if (!item) return;
    const newQty = (Number(item.quantity) || 0) + delta;
    if (newQty <= 0) return removeFromCart(productId);
    updateCartQty(productId, String(newQty));
  };

  // field is "percent" or "rupee". discountRupee is stored as the TOTAL discount for the line.
  const updateCartDiscount = (productId, field, rawValue) => {
    if (rawValue !== "" && !/^\d*\.?\d*$/.test(rawValue)) return;

    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;

        const qty = Number(item.quantity) || 0;
        const price = item.price;

        if (field === "percent") {
          const percentNum = Number(rawValue) || 0;
          const perUnit = (price * percentNum) / 100;
          const totalRupee = perUnit * qty;

          return {
            ...item,
            discountPercent: rawValue,
            discountRupee: totalRupee.toFixed(2),
            total: (price * qty - totalRupee).toFixed(2),
          };
        } else {
          const rupeeNum = Number(rawValue) || 0;
          const perUnit = qty > 0 ? rupeeNum / qty : 0;
          const percentNum = price > 0 ? (perUnit / price) * 100 : 0;

          return {
            ...item,
            discountRupee: rawValue,
            discountPercent: percentNum.toFixed(2),
            total: (price * qty - rupeeNum).toFixed(2),
          };
        }
      })
    );
  };

  // ================= TOTALS =================
  const totalAmount = cart.reduce((acc, item) => acc + Number(item.total || 0), 0);
  const productsDiscountTotal = cart.reduce(
    (acc, item) => acc + Number(item.discountRupee || 0),
    0
  );
  const cartItemCount = cart.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);

  const discountAmount = Number(discount) || 0;
  const finalAmount = totalAmount - discountAmount;
  const paid = Number(paidAmount) || 0;
  const remainingAmount = finalAmount - paid;

  // ================= SUBMIT ORDER =================
  const submitOrder = async () => {
    if (!user) return showError("Please login again");
    if (cart.length === 0) return showError("Cart is empty");
    if (!customerName) return showError("Enter customer name");
    if (!/^\d{10}$/.test(mobile))
      return showError("Mobile number must be exactly 10 digits");

    try {
      const payload = {
        customerName,
        mobile,
        discount: discountAmount,
        paidAmount: paid,
        paymentMode,
        products: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          discountPercent: Number(item.discountPercent) || 0,
          discountRupee: Number(item.discountRupee) || 0,
        })),
      };

      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/order/${editingId}?userId=${user._id}`,
          payload
        );
      } else {
        await axios.post("http://localhost:5000/api/order", {
          ...payload,
          userId: user._id,
        });
      }

      setShowOrderModal(false);

      Swal.fire({
        icon: "success",
        title: editingId ? "Order Updated!" : "Order Saved!",
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => {
        navigate("/order-History");
      }, 1500);
    } catch (error) {
      showError(error.response?.data?.message || "Order Failed");
    }
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content">
        <Navbar />
        <div className="page-content">
          <div className="form-card" style={{ marginBottom: "18px" }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>
              {editingId ? "Edit Order" : "Point of Sale"}
            </h2>
          </div>

          <div className="order-layout">
            {/* ================= LEFT: PRODUCT BROWSER ================= */}
            <div className="order-left">
              <div className="form-card order-toolbar-card">
                <div className="order-toolbar">
                  <div className="order-search-box">
                    <FaSearch className="order-search-icon" />
                    <input
                      type="text"
                      placeholder="Search products by name or part number..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="search-input"
                      style={{ paddingLeft: "34px" }}
                    />
                  </div>

                  <select
                    className="custom-select order-category-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="order-pill-row">
                  <button
                    type="button"
                    className={`order-pill ${selectedCategory === "" ? "active" : ""}`}
                    onClick={() => setSelectedCategory("")}
                  >
                    Show All
                  </button>
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat._id}
                      className={`order-pill ${
                        selectedCategory === cat.name ? "active" : ""
                      }`}
                      onClick={() => setSelectedCategory(cat.name)}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="table-card order-product-card">
                <div className="order-product-heading">
                  <h3 style={{ margin: 0 }}>Products</h3>
                  <span className="order-count-badge">{filteredProducts.length}</span>
                </div>

                <div className="order-product-scroll">
                  {loadingProducts ? (
                    <p className="no-data">Loading products...</p>
                  ) : visibleProducts.length === 0 ? (
                    <p className="no-data">
                      <FaBoxOpen style={{ marginRight: "6px" }} />
                      No products found
                    </p>
                  ) : (
                    <div className="order-product-grid">
                      {visibleProducts.map((p, index) => {
                        const inCartItem = cartMap[p._id];
                        const inCartQty = inCartItem
                          ? Number(inCartItem.quantity) || 0
                          : 0;
                        const available = Number(p.stock) - inCartQty;
                        const isOut = available <= 0;

                        return (
                          <div
                            className={`order-product-tile ${isOut ? "out" : ""}`}
                            key={p._id}
                            style={{ animationDelay: `${(index % PAGE_SIZE) * 25}ms` }}
                            onClick={() => {
                              if (!isOut) addToCart(p, 1);
                            }}
                          >
                            {inCartQty > 0 && (
                              <span className="order-tile-badge">{inCartQty}</span>
                            )}

                            <div
                              className="order-tile-thumb"
                              style={{ background: cardGradientFor(p.category || p.name) }}
                            >
                              {isOut ? (
                                <span className="order-tile-outbadge">Out of Stock</span>
                              ) : (
                                <>
                                  {p.name.charAt(0).toUpperCase()}
                                  <button
                                    type="button"
                                    className="order-tile-add"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addToCart(p, 1);
                                    }}
                                    title="Add to cart"
                                  >
                                    <FaPlus size={11} />
                                  </button>
                                </>
                              )}
                            </div>

                            <div className="order-tile-name" title={p.name}>
                              {p.name}
                            </div>
                            <div className="order-tile-meta">
                              <span className="order-tile-price">
                                ₹{Number(p.price).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {!loadingProducts && visibleCount < filteredProducts.length && (
                  <div style={{ textAlign: "center", marginTop: "18px" }}>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    >
                      Show More
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ================= RIGHT: STICKY CART ================= */}
            <div className="order-right">
              <div className="table-card order-cart-card">
                <div className="order-cart-header">
                  <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaShoppingCart /> Cart
                    {cartItemCount > 0 && (
                      <span className="order-count-badge">{cartItemCount}</span>
                    )}
                  </h3>
                  {cart.length > 0 && (
                    <button type="button" className="order-clear-link" onClick={clearCart}>
                      Clear
                    </button>
                  )}
                </div>
                <div className="order-cart-subheading">
                  <FaReceipt size={12} /> {new Date().toLocaleDateString()}
                </div>

                {cart.length === 0 ? (
                  <div className="order-empty-cart">
                    <FaShoppingCart size={34} />
                    <p>Your cart is empty</p>
                    <span>Tap any product on the left to add it here.</span>
                  </div>
                ) : (
                  <>
                    <div className="order-cart-scroll">
                      {cart.map((item) => (
                        <div className="order-cart-item" key={item.productId}>
                          <div className="order-cart-item-top">
                            <div>
                              <div className="order-cart-item-name">{item.name}</div>
                              <div className="order-cart-item-sub">
                                ₹{Number(item.price).toFixed(2)} × {item.quantity || 0} = ₹
                                {item.total}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="order-remove-btn"
                              onClick={() => removeFromCart(item.productId)}
                              title="Remove"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>

                          <div className="order-cart-item-row">
                            <div className="order-qty-stepper">
                              <button
                                type="button"
                                onClick={() => bumpCartQty(item.productId, -1)}
                              >
                                <FaMinus size={10} />
                              </button>
                              <input
                                type="text"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateCartQty(item.productId, e.target.value)
                                }
                              />
                              <button
                                type="button"
                                onClick={() => bumpCartQty(item.productId, 1)}
                              >
                                <FaPlus size={10} />
                              </button>
                            </div>

                            <div className="order-discount-inputs">
                              <div className="order-discount-field">
                                <span>%</span>
                                <input
                                  type="text"
                                  placeholder="0"
                                  value={item.discountPercent}
                                  onChange={(e) =>
                                    updateCartDiscount(item.productId, "percent", e.target.value)
                                  }
                                />
                              </div>
                              <div className="order-discount-field">
                                <span>₹</span>
                                <input
                                  type="text"
                                  placeholder="0"
                                  value={item.discountRupee}
                                  onChange={(e) =>
                                    updateCartDiscount(item.productId, "rupee", e.target.value)
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="order-cart-summary">
                      <div className="order-summary-row">
                        <span>Sub Total (MRP)</span>
                        <span>
                          ₹{" "}
                          {cart
                            .reduce((acc, item) => acc + Number(item.totalMrp || 0), 0)
                            .toFixed(2)}
                        </span>
                      </div>
                      <div className="order-summary-row order-summary-muted">
                        <span>Product Discount</span>
                        <span>− ₹ {productsDiscountTotal.toFixed(2)}</span>
                      </div>
                      <div className="order-summary-row order-summary-total">
                        <span>Total</span>
                        <span>₹ {totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="order-make-order-btn"
                      onClick={() => setShowOrderModal(true)}
                    >
                      {editingId ? "Update Order" : "Make Order"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= MAKE ORDER MODAL ================= */}
        {showOrderModal && (
          <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth: "480px" }}>
              <h3 style={{ marginTop: 0 }}>
                {editingId ? "Update Order" : "New Order"}
              </h3>

              <div className="order-modal-fields">
                <div>
                  <label className="order-field-label">Mobile Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={mobile}
                    onChange={(e) => handleMobileChange(e.target.value)}
                    className="table-input"
                    style={{ width: "100%", marginTop: "4px" }}
                  />
                  <div className="order-field-hint">
                    If this number has ordered before, the name fills in automatically — you can still edit it.
                  </div>
                </div>

                <div>
                  <label className="order-field-label">Customer Name</label>
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="table-input"
                    style={{ width: "100%", marginTop: "4px" }}
                  />
                </div>

                <div>
                  <label className="order-field-label">Date</label>
                  <input
                    type="text"
                    value={new Date().toLocaleDateString()}
                    disabled
                    className="table-input"
                    style={{ width: "100%", marginTop: "4px" }}
                  />
                </div>

                <div className="order-modal-divider">
                  <div className="order-summary-row">
                    <span>Total Amount:</span>
                    <strong>₹ {totalAmount.toFixed(2)}</strong>
                  </div>
                  <div className="order-summary-row" style={{ marginTop: "6px" }}>
                    <span>Total Product Discount:</span>
                    <strong>₹ {productsDiscountTotal.toFixed(2)}</strong>
                  </div>
                </div>

                <div>
                  <label className="order-field-label">Additional Discount (₹)</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={discount}
                    onChange={(e) => handleOnlyNumbers(e.target.value, setDiscount)}
                    className="table-input"
                    style={{ width: "100%", marginTop: "4px" }}
                  />
                </div>

                <div className="order-summary-row">
                  <span>Final Amount:</span>
                  <strong>₹ {finalAmount.toFixed(2)}</strong>
                </div>

                <div>
                  <label className="order-field-label">Amount Given by Customer (₹)</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={paidAmount}
                    onChange={(e) => handleOnlyNumbers(e.target.value, setPaidAmount)}
                    className="table-input"
                    style={{ width: "100%", marginTop: "4px" }}
                  />
                </div>

                <div className="order-summary-row">
                  <span>Remaining Amount:</span>
                  <strong style={{ color: remainingAmount > 0 ? "#dc2626" : "#16a34a" }}>
                    ₹ {remainingAmount.toFixed(2)}
                  </strong>
                </div>

                <div>
                  <label className="order-field-label">Payment Mode</label>
                  <select
                    className="custom-select"
                    style={{ width: "100%", marginTop: "4px" }}
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option>Cash</option>
                    <option>UPI</option>
                  </select>
                </div>
              </div>

              <div className="order-modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowOrderModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="order-confirm-btn"
                  onClick={submitOrder}
                >
                  {editingId ? "Update Order" : "Confirm Order"}
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>

      {/* ================= SCOPED STYLES ================= */}
      <style>{`
        .order-layout {
          display: grid;
          grid-template-columns: 1.7fr 1fr;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 980px) {
          .order-layout {
            grid-template-columns: 1fr;
          }
        }

        .order-toolbar-card {
          margin-bottom: 18px;
        }

        .order-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }

        .order-search-box {
          position: relative;
          flex: 1;
          min-width: 220px;
        }

        .order-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          font-size: 13px;
        }

        .order-category-select {
          width: 190px;
        }

        .order-pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .order-pill {
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #374151;
          padding: 7px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .order-pill:hover {
          background: #f1f5f9;
          transform: translateY(-1px);
        }

        .order-pill.active {
          background: linear-gradient(135deg, #f97316, #fb923c);
          border-color: transparent;
          color: #ffffff;
          box-shadow: 0 4px 10px rgba(249, 115, 22, 0.35);
        }

        .order-product-card {
          padding-bottom: 20px;
        }

        .order-product-heading {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }

        .order-count-badge {
          display: inline-block;
          background: #eff6ff;
          color: #2563eb;
          font-size: 12px;
          font-weight: 600;
          padding: 2px 9px;
          border-radius: 999px;
        }

        .order-product-scroll {
          max-height: 560px;
          overflow-y: auto;
          padding: 2px;
        }

        .order-product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 14px;
        }

        .order-product-tile {
          border: 1px solid #eef0f3;
          border-radius: 14px;
          padding: 12px;
          cursor: pointer;
          position: relative;
          background: #ffffff;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
          animation: fadeInUp 0.35s ease both;
        }

        .order-product-tile:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
          border-color: #fdba74;
        }

        .order-product-tile.out {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .order-product-tile.out:hover {
          transform: none;
          box-shadow: none;
        }

        .order-tile-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: #16a34a;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          min-width: 20px;
          height: 20px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          z-index: 2;
        }

        .order-tile-thumb {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 30px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .order-tile-add {
          position: absolute;
          bottom: -8px;
          right: -8px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #f97316;
          color: #fff;
          border: 2px solid #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
          transition: transform 0.15s ease, background 0.15s ease;
        }

        .order-tile-add:hover {
          background: #ea580c;
          transform: scale(1.1);
        }

        .order-tile-name {
          font-size: 13.5px;
          font-weight: 600;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .order-tile-meta {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-top: 4px;
        }

        .order-tile-price {
          color: #f97316;
          font-weight: 700;
          font-size: 13px;
        }

        .order-tile-outbadge {
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          color: #fff;
          background: rgba(17, 24, 39, 0.55);
          padding: 4px 8px;
          border-radius: 999px;
        }

        .order-right {
          position: sticky;
          top: 20px;
        }

        .order-cart-card {
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
        }

        .order-cart-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #f97316, #fb923c, #16a34a);
        }

        .order-cart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .order-cart-subheading {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #9ca3af;
          margin: 6px 0 14px;
        }

        .order-clear-link {
          background: transparent;
          border: none;
          color: #dc2626;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .order-clear-link:hover {
          text-decoration: underline;
        }

        .order-cart-scroll {
          max-height: 400px;
          overflow-y: auto;
          margin-bottom: 14px;
        }

        .order-cart-item {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 12px;
          margin-bottom: 10px;
          animation: slideInRight 0.25s ease both;
        }

        .order-cart-item-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }

        .order-cart-item-name {
          font-weight: 600;
          font-size: 14px;
          color: #111827;
        }

        .order-cart-item-sub {
          font-size: 12px;
          color: #f97316;
          margin-top: 2px;
          font-weight: 600;
        }

        .order-remove-btn {
          background: transparent;
          border: none;
          color: #dc2626;
          cursor: pointer;
          padding: 4px;
        }

        .order-remove-btn:hover {
          color: #991b1b;
        }

        .order-cart-item-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .order-qty-stepper {
          display: flex;
          align-items: center;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          overflow: hidden;
        }

        .order-qty-stepper button {
          background: #f3f4f6;
          border: none;
          padding: 6px 8px;
          cursor: pointer;
        }

        .order-qty-stepper button:hover {
          background: #e5e7eb;
        }

        .order-qty-stepper input {
          width: 40px;
          text-align: center;
          border: none;
          outline: none;
          padding: 6px 0;
          font-size: 13px;
        }

        .order-discount-inputs {
          display: flex;
          gap: 8px;
          margin-left: auto;
        }

        .order-discount-field {
          display: flex;
          align-items: center;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          background: #f9fafb;
          transition: border-color 0.15s ease, background 0.15s ease;
        }

        .order-discount-field:focus-within {
          border-color: #fb923c;
          background: #fff;
        }

        .order-discount-field span {
          padding: 0 7px;
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          border-right: 1px solid #e5e7eb;
        }

        .order-discount-field input {
          width: 44px;
          border: none;
          background: transparent;
          outline: none;
          padding: 6px 6px;
          font-size: 13px;
          text-align: center;
        }

        .order-empty-cart {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 50px 10px;
          color: #cbd5e1;
          text-align: center;
        }

        .order-empty-cart p {
          margin: 4px 0 0;
          font-weight: 600;
          color: #6b7280;
        }

        .order-empty-cart span {
          font-size: 12.5px;
          color: #9ca3af;
        }

        .order-cart-summary {
          border-top: 1px dashed #e5e7eb;
          padding-top: 12px;
          margin-bottom: 14px;
        }

        .order-summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          padding: 3px 0;
        }

        .order-summary-muted {
          color: #6b7280;
          font-size: 13px;
        }

        .order-summary-total {
          font-weight: 700;
          font-size: 16px;
          border-top: 1px solid #e5e7eb;
          margin-top: 6px;
          padding-top: 8px;
          color: #111827;
        }

        .order-make-order-btn {
          width: 100%;
          height: 48px;
          font-size: 15px;
          font-weight: 700;
          border: none;
          border-radius: 10px;
          color: #fff;
          background: linear-gradient(135deg, #16a34a, #22c55e);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.2s ease;
          box-shadow: 0 6px 16px rgba(22, 163, 74, 0.3);
        }

        .order-make-order-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 22px rgba(22, 163, 74, 0.38);
        }

        .order-make-order-btn:active {
          transform: scale(0.98);
        }

        .order-confirm-btn {
          border: none;
          border-radius: 8px;
          padding: 8px 20px;
          font-weight: 600;
          font-size: 14px;
          color: #fff;
          background: linear-gradient(135deg, #16a34a, #22c55e);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.2s ease;
        }

        .order-confirm-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(22, 163, 74, 0.3);
        }

        .order-modal-fields {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 15px;
          text-align: left;
        }

        .order-field-label {
          font-weight: 600;
          font-size: 13px;
        }

        .order-field-hint {
          font-size: 12px;
          color: #6b7280;
          margin-top: 3px;
        }

        .order-modal-divider {
          border-top: 1px solid #e5e7eb;
          padding-top: 10px;
        }

        .order-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}

export default Order;
