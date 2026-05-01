import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { Search, MoreVertical, Edit, Trash2, RefreshCw, Calendar, Eye, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function InventoryTracker() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("active");
    const [actionOpenId, setActionOpenId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

    // Modal States
    const [showHoldModal, setShowHoldModal] = useState(false);
    const [showSoldModal, setShowSoldModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Hold Modal Inputs
    const [holdReason, setHoldReason] = useState("Meeting Fixed");
    const [holdBuyer, setHoldBuyer] = useState("");

    // Sold Modal Inputs
    const [soldQuantity, setSoldQuantity] = useState(1);
    const [soldPrice, setSoldPrice] = useState("");

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is inside the dropdown or the button
            if (!event.target.closest('.action-dropdown-container') && !event.target.closest('.dropdown-menu')) {
                setActionOpenId(null);
            }
        };
        // Also close on scroll to prevent floating menu staying in fixed position
        const handleScroll = () => {
            if (actionOpenId) setActionOpenId(null);
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true); // true for capture to catch all scrolls
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [actionOpenId]);

    const fetchInventory = async () => {
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr) return;
            const user = JSON.parse(userStr);

            const { data } = await api.get(`/products`);
            // Filter for my products
            const myProducts = data.filter(p => {
                const sellerId = p.seller?._id || p.seller;
                return sellerId === user._id;
            });

            const now = new Date();
            const productsToUpdate = [];

            const processedProducts = myProducts.map(p => {
                // Auto-expire check
                if (p.status === 'active' && p.expiryDate && new Date(p.expiryDate) < now) {
                    productsToUpdate.push(p._id);
                    return { ...p, status: 'expired' };
                }
                return p;
            });

            setProducts(processedProducts);
            setLoading(false);

            // Background update for expired items
            if (productsToUpdate.length > 0) {
                await Promise.all(productsToUpdate.map(id =>
                    api.put(`/products/${id}`, { status: 'expired' })
                ));
            }

        } catch (err) {
            console.error("Failed to fetch inventory", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const updateProductStatus = async (id, status, extraData = {}) => {
        try {
            await api.put(`/products/${id}`, { status, ...extraData });
            fetchInventory();
            setActionOpenId(null);
            closeModals();
        } catch (err) {
            console.error("Failed to update status", err);
            alert(err.response?.data?.message || "Failed to update status");
        }
    };

    const closeModals = () => {
        setShowHoldModal(false);
        setShowSoldModal(false);
        setSelectedProduct(null);
        setHoldReason("Meeting Fixed");
        setHoldBuyer("");
        setSoldQuantity(1);
        setSoldPrice("");
    };

    const openHoldModal = (product) => {
        setSelectedProduct(product);
        setShowHoldModal(true);
        setActionOpenId(null);
    };

    const openSoldModal = (product) => {
        setSelectedProduct(product);
        setSoldPrice(product.price);
        setSoldQuantity(1);
        setShowSoldModal(true);
        setActionOpenId(null);
    };

    const handleConfirmHold = async () => {
        if (!selectedProduct) return;
        await updateProductStatus(selectedProduct._id, 'on_hold', {
            reasonOnHold: holdReason,
            buyerInfo: holdBuyer
        });
    };

    const handleConfirmSold = async () => {
        if (!selectedProduct) return;

        const quantity = parseInt(soldQuantity);
        const price = Number(soldPrice);

        if (isNaN(quantity) || quantity <= 0) {
            alert("Invalid Quantity");
            return;
        }

        if (quantity > selectedProduct.stock) {
            alert("Cannot sell more than available stock");
            return;
        }

        // Logic: If partial sale (quantity < stock), just reduce stock & inc sales.
        // If full sale (quantity === stock), mark as Sold.

        try {
            if (quantity < selectedProduct.stock) {
                // Partial Sale
                await api.put(`/products/${selectedProduct._id}`, {
                    stock: selectedProduct.stock - quantity,
                    sales: (selectedProduct.sales || 0) + quantity
                });
                alert(`Sold ${quantity} items. Remaining stock: ${selectedProduct.stock - quantity}`);
            } else {
                // Full Sale (Stock becomes 0 -> Status 'sold')
                await api.put(`/products/${selectedProduct._id}`, {
                    status: 'sold',
                    stock: 0,
                    sales: (selectedProduct.sales || 0) + quantity,
                    soldPrice: price,
                    soldAt: new Date()
                });
            }
            fetchInventory();
            closeModals();
        } catch (err) {
            console.error("Sold update failed", err);
            alert("Failed to update sale");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            await api.delete(`/products/${id}`);
            setProducts(products.filter(p => p._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const getFilteredProducts = () => {
        let filtered = products.filter(p => {
            const status = p.status || 'active';
            return status === activeTab;
        });

        if (searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return filtered;
    };

    const handleActionClick = (e, id) => {
        e.stopPropagation();
        if (actionOpenId === id) {
            setActionOpenId(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            // Check space below
            const spaceBelow = window.innerHeight - rect.bottom;
            const menuHeight = 160; // Reduced threshold (was 220)

            let top, bottom;

            if (spaceBelow < menuHeight) {
                // Not enough space, show above
                top = 'auto';
                bottom = window.innerHeight - rect.top + 5;
            } else {
                // Show below, default
                top = rect.bottom + 5;
                bottom = 'auto';
            }

            // Calculate position: right aligned with button (plus offset), top/bottom calculated above
            // User requested offset of ~25px to shift it slightly left
            const right = window.innerWidth - rect.right + 25;

            setMenuPosition({ top, bottom, right });
            setActionOpenId(id);
        }
    };

    const filteredProducts = getFilteredProducts();
    const getCount = (status) => products.filter(p => (p.status || 'active') === status).length;

    if (loading) return <div style={{ padding: 20 }}>Loading inventory...</div>;

    return (
        <div className="dashboard">
            <div className="list-header" style={{ marginBottom: 20 }}>
                <h2>Inventory Management</h2>
            </div>

            <div className="inventory-tabs">
                {['active', 'on_hold', 'sold', 'expired'].map(tab => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.replace('_', ' ').toUpperCase()}
                        <span className="count-badge">{getCount(tab)}</span>
                    </button>
                ))}
            </div>

            <div className="list-filters" style={{ marginBottom: 20 }}>
                <div className="search-box">
                    <Search size={18} />
                    <input
                        placeholder="Search inventory..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="modern-table-container">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>PRODUCT</th>
                            <th>PRICE</th>
                            {(activeTab === 'active' || activeTab === 'on_hold' || activeTab === 'expired') && <th>STOCK</th>}
                            {activeTab === 'active' && <th>STATUS</th>}
                            {activeTab === 'active' && <th>VIEWS</th>}
                            {activeTab === 'active' && <th>SOLD</th>}

                            {activeTab === 'on_hold' && <th>REASON</th>}
                            {activeTab === 'on_hold' && <th>BUYER</th>}

                            {activeTab === 'sold' && <th>SOLD PRICE</th>}
                            {activeTab === 'sold' && <th>DATE SOLD</th>}
                            {activeTab === 'sold' && <th>SOLD QTY</th>}

                            {activeTab === 'expired' && <th>DAYS LISTED</th>}

                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(p => (
                            <tr key={p._id}>
                                <td>
                                    <div className="product-info">
                                        <img
                                            src={p.images && p.images[0] ? (p.images[0].startsWith('http') ? p.images[0] : `${API_ORIGIN}${p.images[0]}`) : "/placeholder.jpg"}
                                            alt={p.name}
                                            style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }}
                                        />
                                        <div>
                                            <div className="p-name">{p.name}</div>
                                            <div className="p-brand" style={{ fontSize: 11, color: '#6b7280' }}>
                                                {activeTab === 'expired' ? 'Expired' : `${p.stock} in stock`}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="price-group">
                                        <span className="current-price">Rs. {p.price}</span>
                                    </div>
                                </td>
                                {(activeTab === 'active' || activeTab === 'on_hold' || activeTab === 'expired') && (
                                    <td>{p.stock}</td>
                                )}

                                {activeTab === 'active' && (
                                    <>
                                        <td><span className="status-badge status-active">Available</span></td>
                                        <td>{p.views || 0}</td>
                                        <td>{p.sales || 0} sold</td>
                                    </>
                                )}

                                {activeTab === 'on_hold' && (
                                    <>
                                        <td>{p.reasonOnHold || "Reserved"}</td>
                                        <td>{p.buyerInfo || "—"}</td>
                                    </>
                                )}

                                {activeTab === 'sold' && (
                                    <>
                                        <td>Rs. {p.soldPrice || p.price}</td>
                                        <td>{p.soldAt ? new Date(p.soldAt).toLocaleDateString() : "-"}</td>
                                        <td>{p.sales || 1}</td>
                                    </>
                                )}

                                {activeTab === 'expired' && (
                                    <td>
                                        {p.createdAt ? Math.floor((new Date() - new Date(p.createdAt)) / (1000 * 60 * 60 * 24)) : 0} days
                                    </td>
                                )}

                                <td className="action-cell">
                                    <div className="action-dropdown-container">
                                        <button className="action-btn" onClick={(e) => handleActionClick(e, p._id)}>
                                            <MoreVertical size={18} />
                                        </button>

                                        {actionOpenId === p._id && (
                                            <div
                                                className="dropdown-menu"
                                                style={{
                                                    position: 'fixed',
                                                    top: menuPosition.top,
                                                    bottom: menuPosition.bottom,
                                                    right: menuPosition.right,
                                                    left: 'auto',
                                                    zIndex: 10000,
                                                    marginTop: 0
                                                }}
                                            >
                                                {activeTab === 'active' && (
                                                    <>
                                                        <div className="dropdown-item" onClick={() => navigate(`/list-your-product?editId=${p._id}`)}>
                                                            <Edit size={14} /> Edit Product
                                                        </div>
                                                        <div className="dropdown-item" onClick={() => openHoldModal(p)}>
                                                            <Calendar size={14} /> Mark On Hold
                                                        </div>
                                                        <div className="dropdown-item" onClick={() => openSoldModal(p)}>
                                                            <CheckCircle size={14} /> Mark Sold
                                                        </div>
                                                    </>
                                                )}

                                                {activeTab === 'on_hold' && (
                                                    <>
                                                        <div className="dropdown-item" onClick={() => openSoldModal(p)}>
                                                            <CheckCircle size={14} /> Mark Sold
                                                        </div>
                                                        <div className="dropdown-item" onClick={() => updateProductStatus(p._id, 'active')}>
                                                            <XCircle size={14} /> Cancel / Release
                                                        </div>
                                                    </>
                                                )}

                                                {activeTab === 'sold' && (
                                                    <div className="dropdown-item" onClick={() => navigate(`/product/${p._id}`)}>
                                                        <Eye size={14} /> View Details
                                                    </div>
                                                )}

                                                {activeTab === 'expired' && (
                                                    <>
                                                        <div className="dropdown-item" onClick={() => updateProductStatus(p._id, 'active', { expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })}>
                                                            <RefreshCw size={14} /> Renew
                                                        </div>
                                                        <div className="dropdown-item danger" onClick={() => handleDelete(p._id)}>
                                                            <Trash2 size={14} /> Delete
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredProducts.length === 0 && (
                    <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                        No items in {activeTab.replace('_', ' ')}
                    </div>
                )}
            </div>

            {/* --- HOLD MODAL --- */}
            {showHoldModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Mark Product On Hold</h3>
                        <div className="form-group">
                            <label>Reason</label>
                            <select value={holdReason} onChange={e => setHoldReason(e.target.value)} style={{ width: '100%', padding: 8 }}>
                                <option value="Meeting Fixed">Meeting with Buyer Fixed</option>
                                <option value="Reserved">Reserved for Customer</option>
                                <option value="Checking">Checking Availability</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Buyer Name (Optional)</label>
                            <input
                                type="text"
                                value={holdBuyer}
                                onChange={e => setHoldBuyer(e.target.value)}
                                placeholder="Enter buyer name"
                                style={{ width: '100%', padding: 8 }}
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={closeModals}>Cancel</button>
                            <button className="btn-primary" onClick={handleConfirmHold}>Confirm Hold</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SOLD MODAL --- */}
            {showSoldModal && selectedProduct && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Mark Product as Sold</h3>
                        <div className="form-group">
                            <label>Quantity Sold (Available: {selectedProduct.stock})</label>
                            {selectedProduct.stock > 1 ? (
                                <input
                                    type="number"
                                    min="1"
                                    max={selectedProduct.stock}
                                    value={soldQuantity}
                                    onChange={e => setSoldQuantity(e.target.value)}
                                    style={{ width: '100%', padding: 8 }}
                                />
                            ) : (
                                <div style={{ padding: 8, background: '#f3f4f6' }}>1 Item</div>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Sold Price</label>
                            <input
                                type="number"
                                value={soldPrice}
                                onChange={e => setSoldPrice(e.target.value)}
                                style={{ width: '100%', padding: 8 }}
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={closeModals}>Cancel</button>
                            <button className="btn-primary" onClick={handleConfirmSold}>
                                {Number(soldQuantity) >= selectedProduct.stock ? "Mark Sold Out" : "Update Stock"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
            .modal-overlay {
                position: fixed;
                top:0; left:0; right:0; bottom:0;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            .modal-content {
                background: white;
                padding: 24px;
                border-radius: 12px;
                width: 400px;
                max-width: 90%;
            }
            .form-group { margin-bottom: 16px; }
            .form-group label { display: block; margin-bottom: 6px; font-weight: 500; }
            .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
            .btn-primary { background: #E11D48; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
            .btn-secondary { background: #f3f4f6; color: #374151; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
        `}</style>
        </div>
    );
}
