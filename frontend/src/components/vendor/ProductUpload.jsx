import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { API_ORIGIN } from "../../utils/api";
import { Search, Pencil, Eye, Trash2, Plus, ArrowUpDown, ArrowUp, ArrowDown, Clock } from "lucide-react";
import BoostModal from "./BoostModal";

export default function ProductUpload({
    sellerVerified,
    verificationPending,
    onRequestVerification,
    onListProduct,
    onEditProduct
}) {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [subCategoryFilter, setSubCategoryFilter] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    const [boostingProduct, setBoostingProduct] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const userStr = localStorage.getItem("user");
                if (!userStr) return;

                const user = JSON.parse(userStr);
                // Fetch all products (backend doesn't filter by seller yet, so we filter here)
                const { data } = await api.get(`/products`);

                // Filter for current seller
                const myProducts = data.filter(p => {
                    const sellerId = p.seller?._id || p.seller;
                    return sellerId === user._id;
                });

                setProducts(myProducts);
            } catch (err) {
                console.error("Failed to fetch products", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);


    const timeAgo = (dateStr) => {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };

    // Get unique categories for filter
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

    // Get unique sub-categories based on selected category
    const subCategories = [...new Set(products
        .filter(p => !categoryFilter || p.category === categoryFilter)
        .map(p => p.subCategory)
        .filter(Boolean))];

    const getImageSrc = (img) => {
        if (!img) return "/placeholder.jpg";
        if (img.startsWith("http")) return img;
        return `${API_ORIGIN}${img}`;
    };

    const getStatusBadge = (status) => {
        const styles = {
            active: { bg: '#dcfce7', color: '#166534', label: 'Available' },
            on_hold: { bg: '#ffedd5', color: '#9a3412', label: 'On Hold' },
            sold: { bg: '#f3f4f6', color: '#374151', label: 'Sold' },
            expired: { bg: '#fee2e2', color: '#991b1b', label: 'Expired' }
        };
        const config = styles[status] || styles.active;
        return (
            <span style={{
                backgroundColor: config.bg,
                color: config.color,
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-block'
            }}>
                {config.label}
            </span>
        );
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filter products based on search and category
    const filteredProducts = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = categoryFilter ? p.category === categoryFilter : true;
        const matchSubCategory = subCategoryFilter ? p.subCategory === subCategoryFilter : true;
        return matchSearch && matchCategory && matchSubCategory;
    });

    // Check if property is a number-like string (e.g. "1200") for numeric sorting
    const isNumeric = (n) => !isNaN(parseFloat(n)) && isFinite(n);

    // Apply sorting
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (!a[sortConfig.key] && sortConfig.key !== 'items' && !b[sortConfig.key]) return 0;

        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Specific handling for stock and sales
        if (sortConfig.key === 'items') {
            const stockA = a.stock !== undefined ? a.stock : (a.countInStock || 0);
            const salesA = a.sales || 0;
            valA = stockA + salesA;

            const stockB = b.stock !== undefined ? b.stock : (b.countInStock || 0);
            const salesB = b.sales || 0;
            valB = stockB + salesB;
        }

        if (isNumeric(valA) && isNumeric(valB)) {
            valA = parseFloat(valA);
            valB = parseFloat(valB);
        } else {
            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();
        }

        if (valA < valB) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <ArrowUpDown size={14} style={{ opacity: 0.3, marginLeft: 4 }} />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} style={{ marginLeft: 4 }} />
            : <ArrowDown size={14} style={{ marginLeft: 4 }} />;
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            await api.delete(`/products/${id}`);
            setProducts(products.filter(p => p._id !== id));
        } catch (err) {
            console.error("Failed to delete", err);
            alert("Failed to delete product");
        }
    }

    if (loading) {
        return <div style={{ padding: "40px", textAlign: "center" }}>Loading products...</div>;
    }

    // Handle "ADD PRODUCT" click
    const handleAddProduct = () => {
        if (!sellerVerified) {
            if (onRequestVerification) onRequestVerification();
            return;
        }
        if (onListProduct) {
            onListProduct();
        } else {
            navigate("/list-your-product");
        }
    };

    return (
        <>
            <div className="seller-product-list">
                {/* Header */}
                <div className="list-header">
                    <h2>Products</h2>
                    <button className="btn-add-product" onClick={handleAddProduct}>
                        ADD PRODUCT
                    </button>
                </div>

                {/* Filters */}
                <div className="list-filters">
                    <select
                        value={categoryFilter}
                        onChange={(e) => {
                            setCategoryFilter(e.target.value);
                            setSubCategoryFilter("");
                        }}
                    >
                        <option value="">Category By</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                        value={subCategoryFilter}
                        onChange={(e) => {
                            setSubCategoryFilter(e.target.value);
                        }}
                        disabled={!categoryFilter}
                    >
                        <option value="">Sub Category By</option>
                        {subCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <div className="search-box">
                        <Search size={18} />
                        <input
                            placeholder="Search here..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                {sortedProducts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🛒</div>
                        <h3>No Products Found</h3>
                        <p>Start selling by listing your first product.</p>
                    </div>
                ) : (
                    <div className="modern-table-container admin-product-table">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                                        PRODUCT <SortIcon column="name" />
                                    </th>
                                    <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                                        CATEGORY <SortIcon column="category" />
                                    </th>
                                    <th onClick={() => handleSort('subCategory')} style={{ cursor: 'pointer' }}>
                                        SUB CATEGORY <SortIcon column="subCategory" />
                                    </th>
                                    <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>
                                        PRICE <SortIcon column="price" />
                                    </th>
                                    <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                                        STATUS <SortIcon column="status" />
                                    </th>
                                    <th onClick={() => handleSort('items')} style={{ cursor: 'pointer' }}>
                                        ITEMS <SortIcon column="items" />
                                    </th>
                                    <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
                                        LISTED <SortIcon column="createdAt" />
                                    </th>
                                    <th>BOOST</th>
                                    <th>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedProducts.map(p => {
                                    const stock = p.stock !== undefined ? p.stock : (p.countInStock || 0);
                                    const sales = p.sales || 0;
                                    const totalItems = stock + sales;

                                    return (
                                        <tr key={p._id}>
                                            <td>
                                                <div className="product-info">
                                                    <img
                                                        src={getImageSrc(p.image || (p.images && p.images[0]))}
                                                        alt={p.name}
                                                    />
                                                    <div>
                                                        <div className="p-name">{p.name}</div>
                                                        <div className="p-brand">{p.brand || "Generic"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{p.category}</td>
                                            <td>{p.subCategory || "-"}</td>
                                            <td>
                                                <div className="price-group">
                                                    {p.originalPrice && (
                                                        <span className="original-price">Rs. {p.originalPrice.toLocaleString()}</span>
                                                    )}
                                                    <span className="current-price">Rs. {p.price.toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td>{getStatusBadge(p.status)}</td>
                                            <td>
                                                <span className="stock-val">
                                                    {totalItems}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: '#6b7280' }}>
                                                    <Clock size={14} style={{ marginRight: 4 }} />
                                                    {timeAgo(p.createdAt)}
                                                </div>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="boost-small-btn"
                                                    onClick={() => setBoostingProduct(p)}
                                                    disabled={p.status?.toLowerCase() === 'sold' || p.status?.toLowerCase() === 'expired'}
                                                    title={p.status?.toLowerCase() === 'sold' || p.status?.toLowerCase() === 'expired' ? "Cannot boost sold or expired items" : "Boost this ad"}
                                                >
                                                    Boost
                                                </button>
                                            </td>
                                            <td className="action-cell">
                                                <button className="action-btn" title="Edit" onClick={() => onEditProduct && onEditProduct(p)}>
                                                    <Pencil size={18} />
                                                </button>
                                                <button className="action-btn" title="View" onClick={() => navigate(`/product/${p._id}`)}>
                                                    <Eye size={18} />
                                                </button>
                                                <button className="action-btn" title="Delete" onClick={() => handleDelete(p._id)}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {boostingProduct && (
                <BoostModal
                    product={boostingProduct}
                    onClose={() => setBoostingProduct(null)}
                    onBoosted={() => {
                        setBoostingProduct(null);
                        (async () => {
                            try {
                                const userStr = localStorage.getItem("user");
                                if (!userStr) return;
                                const user = JSON.parse(userStr);
                                const { data } = await api.get(`/products`);
                                const myProducts = data.filter(p => {
                                    const sellerId = p.seller?._id || p.seller;
                                    return sellerId === user._id;
                                });
                                setProducts(myProducts);
                            } catch { }
                        })();
                    }}
                />
            )}
        </>
    );
}
