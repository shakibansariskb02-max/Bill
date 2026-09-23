import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../css/form.css";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { FaArrowUp } from "react-icons/fa";
import Footer from "../components/Footer";

function Product() {

  const navigate = useNavigate();
  const LOW_STOCK_LIMIT = 3;
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) navigate("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeTab, setActiveTab] = useState("all"); // NEW

  const [formData, setFormData] = useState({
    name: "",
    partNumber: "",
    category: "",
    price: "",
    stock: ""
  });

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [visibleCount, setVisibleCount] = useState(10);
  const [sortOrder, setSortOrder] = useState("");

  const [importRows, setImportRows] = useState([]);
const [showImportModal, setShowImportModal] = useState(false);
const [importLoading, setImportLoading] = useState(false);
const [bulkCategory, setBulkCategory] = useState("");
const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
  setVisibleCount(10);
}, [search, activeTab]);

  const fetchProducts = async () => {
    const res = await axios.get(
      `http://localhost:5000/api/product?userId=${user._id}&search=${search}`
    );



    setProducts(res.data);
  };

  const fetchCategories = async () => {
    const res = await axios.get(
      `http://localhost:5000/api/category?userId=${user._id}`
    );
    setCategories(res.data);
  };

  const submitHandler = async (e) => {
  e.preventDefault();

  try {
    await axios.post("http://localhost:5000/api/product", {
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock),
      userId: user._id
    });

    Swal.fire("Success", "Product Added", "success");

    setFormData({
      name: "",
      partNumber: "",
      category: "",
      price: "",
      stock: ""
    });

    fetchProducts();
  } catch (error) {
    Swal.fire(
      "Error",
      error.response?.data?.message || "Something went wrong",
      "error"
    );
  }
};

const deleteAllHandler = async () => {
  const result = await Swal.fire({
    title: "Delete ALL products?",
    text: `This will permanently delete all ${products.length} product(s). This cannot be undone.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    confirmButtonText: "Yes, delete everything",
  });

  if (!result.isConfirmed) return;

  try {
    const res = await axios.delete(
      `http://localhost:5000/api/product/all/clear?userId=${user._id}`
    );
    Swal.fire("Deleted!", `${res.data.deletedCount} product(s) removed.`, "success");
    fetchProducts();
  } catch (error) {
    Swal.fire(
      "Error",
      error.response?.data?.message || "Something went wrong",
      "error"
    );
  }
};

  const deleteHandler = async (id) => {
    const result = await Swal.fire({
      title: "Delete this product?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
    });

    if (result.isConfirmed) {
      await axios.delete(
        `http://localhost:5000/api/product/${id}?userId=${user._id}`
      );
      Swal.fire("Deleted!", "", "success");
      fetchProducts();
    }
  };

  const startEdit = (product) => {
    setEditId(product._id);
    setEditData(product);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditData({});
  };

  const saveEdit = async () => {
  try {
    await axios.put(
      "http://localhost:5000/api/product/" + editId,
      {
        ...editData,
        price: Number(editData.price),
        stock: Number(editData.stock),
        userId: user._id
      }
    );

    Swal.fire("Success", "Product Updated", "success");

    setEditId(null);        // ✅ CLOSE EDIT MODE
    setEditData({});        // ✅ Optional reset
    fetchProducts();        // ✅ Refresh list

  } catch (error) {
    Swal.fire(
      "Error",
      error.response?.data?.message || "Something went wrong",
      "error"
    );
  }
};

const handleFileSelected = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const data = new FormData();
  data.append("file", file);
  setImportLoading(true);

  try {
    const res = await axios.post(
  "http://localhost:5000/api/product/import",
  data
);

    const rows = res.data.items.map((item, idx) => ({
  _tempId: idx,
  selected: true,
  name: item.name,
  partNumber: item.partNumber,
  price: item.price,
  stock: 10,
  category: "",
}));

    setImportRows(rows);
    setBulkCategory("");
    setShowImportModal(true);

    Swal.fire("File Parsed", `Found ${rows.length} product row(s). Please review before importing.`, "success");
  } catch (error) {
    Swal.fire("Couldn't Read File", error.response?.data?.message || "Something went wrong while parsing the file", "error");
  } finally {
    setImportLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
};

const updateImportRow = (tempId, field, value) => {
  setImportRows((prev) => prev.map((row) => (row._tempId === tempId ? { ...row, [field]: value } : row)));
};

const toggleImportRow = (tempId) => {
  setImportRows((prev) => prev.map((row) => (row._tempId === tempId ? { ...row, selected: !row.selected } : row)));
};

const toggleSelectAllImportRows = (checked) => {
  setImportRows((prev) => prev.map((row) => ({ ...row, selected: checked })));
};

const removeImportRow = (tempId) => {
  setImportRows((prev) => prev.filter((row) => row._tempId !== tempId));
};

const applyBulkCategory = (categoryName) => {
  setBulkCategory(categoryName);
  setImportRows((prev) => prev.map((row) => (row.selected ? { ...row, category: categoryName } : row)));
};

const closeImportModal = () => {
  setShowImportModal(false);
  setImportRows([]);
};

const submitImport = async () => {
  const selectedRows = importRows.filter((r) => r.selected);

  if (!selectedRows.length) {
    Swal.fire("Nothing Selected", "Select at least one row to import", "info");
    return;
  }

  const missingCategory = selectedRows.some((r) => !r.category);
  if (missingCategory) {
    Swal.fire("Category Required", "Please set a category for every selected row.", "warning");
    return;
  }

  try {
    const res = await axios.post("http://localhost:5000/api/product/bulk", {
      userId: user._id,
      items: selectedRows.map((r) => ({
        name: r.name,
        partNumber: r.partNumber,
        price: r.price,
        stock: r.stock,
        category: r.category,
      })),
    });

    Swal.fire("Import Finished", `${res.data.createdCount} product(s) added. ${res.data.skippedCount} skipped (duplicates or errors).`, "success");
    closeImportModal();
    fetchProducts();
  } catch (error) {
    Swal.fire("Error", error.response?.data?.message || "Something went wrong during import", "error");
  }
};

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const lowStockProducts = products.filter(
    (p) => Number(p.stock) <= LOW_STOCK_LIMIT
  );

  // NEW filtered list
  const filteredProducts =
  activeTab === "low" ? lowStockProducts : products;

// SORTING
const sortedProducts = [...filteredProducts].sort((a, b) => {
  if (sortOrder === "az") {
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }

  if (sortOrder === "za") {
    return b.name.localeCompare(a.name, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }

  return 0;
});

const displayedProducts = sortedProducts.slice(0, visibleCount);

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content">
        <Navbar />
        <div className="page-content">

          {/* ---------------- FORM SECTION (UNCHANGED) ---------------- */}
          <div className="form-card">
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
    <h2 style={{ margin: 0 }}>Add Product</h2>
    <div style={{ display: "flex", alignItems: "center" }}>
      <input
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
        ref={fileInputRef}
        onChange={handleFileSelected}
        style={{ display: "none" }}
        id="importFileInput"
      />
      <label
        htmlFor="importFileInput"
        className="primary-small small-btn"
        style={{
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: "normal",
        }}
      >
        {importLoading ? "Reading File..." : "Import from Excel"}
      </label>
    </div>
</div>

  <form onSubmit={submitHandler} className="form-last">
              {/* your form unchanged */}
              {/* KEEPING YOUR ORIGINAL FORM */}
              <p style={{fontWeight:"bold"}}>Product Name:</p>
              <input
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />

              <p style={{fontWeight:"bold"}}>Part Number:</p>
              <input
                placeholder="Part Number"
                value={formData.partNumber}
                onChange={(e) =>
                  setFormData({ ...formData, partNumber: e.target.value })
                }
                required
              />

              <p style={{ marginBottom: "10px", fontWeight:'bold' }}>Select Category:</p>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <p style={{ marginTop: "10px", fontWeight:"bold" }}>Maximum Retail Price (MRP): ₹</p>
              <input
                type="number"
                placeholder="MRP"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                onWheel={(e) => {
                          e.target.blur();
                          setTimeout(() => e.target.focus(), 0);
                        }}
                required
              />

              <p style={{fontWeight:"bold"}}>Product Stock:</p>
              <input
                type="number"
                placeholder="Stock"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
                onWheel={(e) => {
                          e.target.blur();
                          setTimeout(() => e.target.focus(), 0);
                        }}
                required
              />

              <button className="success-btn">Save Product</button>
            </form>
          </div>

          {/* ---------------- PRODUCT LIST SECTION ---------------- */}
          <div className="table-card">
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
    <h2 style={{ margin: 0 }}>Product List</h2>
    <button
      className="danger-btn"
      style={{ width: "auto", padding: "8px 16px" }}
      onClick={deleteAllHandler}
      disabled={products.length === 0}
    >
      Delete All Products
    </button>
  </div>

            {/* ----------- TAB NAVIGATION (INLINE STYLE) ----------- */}
            <div style={{
              display: "flex",
              borderBottom: "2px solid #e5e7eb",
              marginBottom: "15px",
              position: "relative"
            }}>
              <div
                onClick={() => setActiveTab("all")}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "12px",
                  cursor: "pointer",
                  fontWeight: activeTab === "all" ? "600" : "500",
                  color: activeTab === "all" ? "#2563eb" : "#555",
                  borderBottom: activeTab === "all" ? "3px solid #2563eb" : "3px solid transparent",
                  transition: "0.3s"
                }}
              >
                All Products ({products.length})
              </div>

              <div
                onClick={() => setActiveTab("low")}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "12px",
                  cursor: "pointer",
                  fontWeight: activeTab === "low" ? "600" : "500",
                  color: activeTab === "low" ? "red" : "#555",
                  borderBottom: activeTab === "low" ? "3px solid red" : "3px solid transparent",
                  transition: "0.3s"
                }}
              >
                Low Stock ({lowStockProducts.length})
              </div>
            </div>

                <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
    gap: "10px",
    flexWrap: "wrap"
  }}
>
  
</div>

            <input
              placeholder="Search Product here..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <select
    value={sortOrder}
    onChange={(e) => setSortOrder(e.target.value)}
    style={{
      width: "120px",
      height: "40px",
      borderRadius: "10px",
      padding: "0 10px",
      border: "1px solid #d1d5db",
      marginBottom:"10px",
      marginLeft:"1050px"
    }}
  >
    <option value="">Sort By</option>
    <option value="az">Name (A-Z)</option>
    <option value="za">Name (Z-A)</option>
  </select>

            <table className="styled-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Name</th>
                  <th style={{ textAlign: "center" }}>Part No.</th>
                  <th style={{ textAlign: "center" }}>Category</th>
                  <th style={{ textAlign: "center" }}>MRP</th>
                  <th style={{ textAlign: "center" }}>Stock</th>
                  <th style={{ textAlign: "center" }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {displayedProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                      No products found
                    </td>
                  </tr>
                ) : (
                  displayedProducts.map((item) => {
                    const isLow = Number(item.stock) <= LOW_STOCK_LIMIT;

                    return (
                      <tr
                        key={item._id}
                        style={{ backgroundColor: isLow ? "#fff5f5" : "white" }}
                      >
                        {editId === item._id ? (
                          <>
                            <td>
                              <input
                                style={{ width: "200px", height: "40px", borderRadius: "15px" }}
                                value={editData.name}
                                onChange={(e) =>
                                  setEditData({ ...editData, name: e.target.value })
                                }
                              />
                            </td>

                            <td>
                              <input
                                style={{ width: "150px", height: "40px", borderRadius: "15px" }}
                                value={editData.partNumber}
                                onChange={(e) =>
                                  setEditData({ ...editData, partNumber: e.target.value })
                                }
                              />
                            </td>

                            <td>
                              <select
                                style={{ width: "150px", height: "40px", borderRadius: "15px" }}
                                value={editData.category}
                                onChange={(e) =>
                                  setEditData({ ...editData, category: e.target.value })
                                }
                              >
                                {categories.map((cat) => (
                                  <option key={cat._id} value={cat.name}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td>
                              <input
                                style={{ width: "100px", height: "40px", borderRadius: "15px" }}
                                type="number"
                                value={editData.price}
                                onChange={(e) =>
                                  setEditData({ ...editData, price: e.target.value })
                                }
                                onWheel={(e) => e.target.blur()} 
                              />
                            </td>

                            <td>
                              <input
                                style={{ width: "70px", height: "40px", borderRadius: "15px" }}
                                type="number"
                                value={editData.stock}
                                onChange={(e) =>
                                  setEditData({ ...editData, stock: e.target.value })
                                }
                                onWheel={(e) => e.target.blur()} 
                              />
                            </td>

                            <td>
                              <button
                                style={{ width: "60px", marginRight: "5px" }}
                                className="success-btn"
                                onClick={saveEdit}
                              >
                                Save
                              </button>

                              <button
                                style={{ width: "60px" }}
                                className="danger-btn"
                                onClick={cancelEdit}
                              >
                                Cancel
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ textAlign: "left" }}>{item.name}</td>
                            <td style={{ textAlign: "center" }}>{item.partNumber}</td>
                            <td>{item.category}</td>
                            <td>₹ {Number(item.price).toFixed(2)}</td>
                            <td
                              style={{
                                color: isLow ? "red" : "black",
                                fontWeight: isLow ? "600" : "normal",
                                textAlign: "center"
                              }}
                            >
                              {item.stock}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                style={{ width: "60px", marginRight: "5px" }}
                                className="warning-btn"
                                onClick={() => startEdit(item)}
                              >
                                Edit
                              </button>

                              <button
                                style={{ width: "60px" }}
                                className="danger-btn"
                                onClick={() => deleteHandler(item._id)}
                              >
                                Delete
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {visibleCount < filteredProducts.length && (
  <div style={{ textAlign: "center", marginTop: "20px" }}>
    <button
      className="success-btn"
      onClick={() => setVisibleCount((prev) => prev.length)}
      style={{
        width: "150px",
        height: "45px",
        borderRadius: "10px"
      }}
    >
      Show More
    </button>
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
          fontSize: "18px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          zIndex: "1000"
        }}
      >
        <FaArrowUp />
      </button>
      {showImportModal && (
  <div className="modal-overlay">
    <div className="modal-box" style={{ maxWidth: "1100px" }}>
      <h3 style={{ marginTop: 0 }}>Review Imported Products ({importRows.length} found)</h3>
      <p style={{ color: "#6b7280", fontSize: "13px" }}>
        This file was parsed automatically, so please double-check the Part No, Name and MRP before importing.
      </p>

      <div style={{ display: "flex", gap: "15px", alignItems: "center", marginBottom: "15px", flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <input
            type="checkbox"
            checked={importRows.length > 0 && importRows.every((r) => r.selected)}
            onChange={(e) => toggleSelectAllImportRows(e.target.checked)}
          />
          Select All
        </label>

        <span style={{ fontSize: "13px", color: "#374151" }}>Set category for all selected rows:</span>
        <select className="custom-select" value={bulkCategory} onChange={(e) => applyBulkCategory(e.target.value)}>
          <option value="">-- Select Category --</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
        <table className="styled-table">
          <thead>
            <tr>
              <th></th><th>Part No.</th><th>Name</th><th>MRP</th><th>Category</th><th>Stock</th><th></th>
            </tr>
          </thead>
          <tbody>
            {importRows.map((row) => (
              <tr key={row._tempId}>
                <td>
                  <input type="checkbox" checked={row.selected} onChange={() => toggleImportRow(row._tempId)} />
                </td>
                <td>
                  <input className="table-input" value={row.partNumber} onChange={(e) => updateImportRow(row._tempId, "partNumber", e.target.value)} />
                </td>
                <td>
                  <input className="table-input" style={{ width: "220px" }} value={row.name} onChange={(e) => updateImportRow(row._tempId, "name", e.target.value)} />
                </td>
                <td>
                  <input className="table-input" type="number" value={row.price} onChange={(e) => updateImportRow(row._tempId, "price", e.target.value)} />
                </td>
                <td>
                  <select className="custom-select" value={row.category} onChange={(e) => updateImportRow(row._tempId, "category", e.target.value)}>
                    <option value="">-- Select --</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input className="table-input" type="number" value={row.stock} onChange={(e) => updateImportRow(row._tempId, "stock", e.target.value)} />
                </td>
                <td>
                  <button type="button" className="danger-btn" onClick={() => removeImportRow(row._tempId)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
        <button className="secondary-btn" onClick={closeImportModal}>Cancel</button>
        <button className="success-btn" style={{ width: "auto" }} onClick={submitImport}>
          Import Selected ({importRows.filter((r) => r.selected).length})
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default Product;