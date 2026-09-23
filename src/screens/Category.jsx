import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../css/form.css";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

function Category() {

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    const [name, setName] = useState("");
    const [categories, setCategories] = useState([]);
    const [editId, setEditId] = useState(null);

    // 🔐 Redirect if not logged in
    useEffect(() => {
        if (!user) {
            navigate("/");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (user) fetchCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await axios.get(
                `http://localhost:5000/api/category?userId=${user._id}`
            );
            setCategories(res.data);
        } catch (err) {
            // category list stays empty if this fails
        }
    };

    const submitHandler = async (e) => {
        e.preventDefault();

        const trimmedName = name.trim();

        if (!trimmedName) {
            alert("Category name is required");
            return;
        }

        const isDuplicate = categories.some(
            (cat) =>
                cat.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
                cat._id !== editId
        );

        if (isDuplicate) {
            Swal.fire({
                icon: "error",
                title: "Duplicate Category",
                text: "Category already exists!",
            });
            return;
        }

        try {
            if (editId) {
                await axios.put(
                    `http://localhost:5000/api/category/${editId}`,
                    { name: trimmedName }
                );
                setEditId(null);
            } else {
                await axios.post(
                    "http://localhost:5000/api/category",
                    {
                        name: trimmedName,
                        userId: user._id   // 🔥 IMPORTANT
                    }
                );
            }

            setName("");
            fetchCategories();

            Swal.fire({
                icon: "success",
                title: editId ? "Updated!" : "Added!",
                text: editId
                    ? "Category updated successfully"
                    : "Category added successfully",
                timer: 1500,
                showConfirmButton: false,
            });

        } catch (err) {
            Swal.fire("Error", "Something went wrong!", "error");
        }
    };

    const deleteHandler = async (id) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to recover this category!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes, delete it!",
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`http://localhost:5000/api/category/${id}`);
                fetchCategories();

                Swal.fire({
                    icon: "success",
                    title: "Deleted!",
                    text: "Category has been deleted.",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } catch (err) {
                Swal.fire("Error", "Something went wrong!", "error");
            }
        }
    };

    const editHandler = (cat) => {
        setName(cat.name);
        setEditId(cat._id);
    };

    const cancelEdit = () => {
        setName("");
        setEditId(null);
    };

    return (
        <div className="dashboard">
            <Sidebar />

            <div className="content">
                <Navbar />

                <div className="page-content">

                    {/* Add / Edit Category */}
                    <div className="form-card">
                        <h2 className="section-title">
                            {editId ? "Edit Category" : "Add Category"}
                        </h2>

                        <form onSubmit={submitHandler} className="form-last">
                            <input
                                type="text"
                                placeholder="Enter Category Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />

                            <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                                <button type="submit" className="success-btn">
                                    {editId ? "Update" : "Add"}
                                </button>

                                {editId && (
                                    <button
                                        type="button"
                                        className="secondary-btn"
                                        onClick={cancelEdit}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Category List */}
                    <div className="table-card" style={{ marginTop: "25px" }}>
                        <h2 className="section-title">Category List</h2>

                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th style={{textAlign:"left"}}>#</th>
                                    <th style={{textAlign:"center"}}>Category Name</th>
                                    <th style={{textAlign:"center"}}>Action</th>
                                </tr>
                            </thead>



                            <tbody>
                                {categories.length > 0 ? (
                                    categories.map((cat, index) => (
                                        <tr key={cat._id} style={{ borderBottom: "1px solid #eee" }}>
                                            <td style={{textAlign:"left"}}>{index + 1}</td>
                                            <td style={tdStyle}>{cat.name}</td>
                                            <td style={tdStyle}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "center",
                                                        gap: "10px",
                                                    }}
                                                >
                                                    <button style={{ width: "60px" }}
                                                        className="warning-btn"
                                                        onClick={() => editHandler(cat)}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button style={{ width: "60px" }}
                                                        className="danger-btn"
                                                        onClick={() => deleteHandler(cat._id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" style={{ padding: "20px" }}>
                                            No Categories Found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                    </div>
                </div>
                <Footer/>
            </div>
        </div>
    );
}



const tdStyle = {
    padding: "12px",
    verticalAlign: "middle",
};

export default Category;