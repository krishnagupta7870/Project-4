import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import "../../styles/seller.css";

export default function SellerDashboardPage() {
  const [user, setUser] = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);

          const { data } = await api.get(`/products`);
          const myProducts = data.filter(p => {
            const sellerId = p.seller?._id || p.seller;
            return sellerId === userData._id;
          });
          setProducts(myProducts);

          // Fetch fresh user data with trustScore and sellerStats
          try {
            const profileRes = await api.get(`/users/${userData._id}/profile`);
            // Update user state with fresh data including trustScore
            setUser(prevUser => ({
              ...prevUser,
              trustScore: profileRes.data.user.trustScore,
              sellerStats: profileRes.data.user.sellerStats
            }));
          } catch (err) {
            console.error('Failed to fetch trust score:', err);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading dashboard...</div>;

  // Calculate metrics
  const totalProducts = products.length;
  const totalViews = products.reduce((acc, curr) => acc + (curr.views || 0), 0);

  // Calculate total items (stock + sales across all products)
  const totalItems = products.reduce((sum, p) => sum + (p.stock || 0) + (p.sales || 0), 0);

  // Calculate total items sold (sum of sales field)
  const totalItemsSold = products.reduce((sum, p) => sum + (p.sales || 0), 0);

  // Sold products (for revenue calculation - products with status 'sold')
  const soldProducts = products.filter(p => p.status === 'sold');
  const itemsSold = totalItemsSold;

  // Revenue (use soldPrice if available, otherwise price)
  const totalRevenue = soldProducts.reduce((sum, p) => sum + (p.soldPrice || p.price || 0), 0);

  // On Hold
  const itemsOnHold = products.filter(p => p.status === 'on_hold').length;

  // Stock Value (active products only)
  const activeProducts = products.filter(p => p.status === 'active');
  const stockValue = activeProducts.reduce((sum, p) => {
    const quantity = p.stock || 1;
    return sum + (p.price * quantity);
  }, 0);

  // Interested Users (Unique people who liked your products)
  const interestedUsers = new Set(products.flatMap(p => p.likes || [])).size;

  // Total Product Likes (Total engagement across all ads)
  const totalProductLikes = products.reduce((sum, p) => sum + (p.likes?.length || 0), 0);

  // Conversion Rate (items sold / total items)
  const conversionRate = totalItems > 0 ? ((totalItemsSold / totalItems) * 100).toFixed(1) : 0;

  // Top products by views
  const topProducts = [...products]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 3);

  // Status-based styling
  const getStatusBadge = (status) => {
    const styles = {
      active: { background: '#d1fae5', color: '#059669' },
      sold: { background: '#dbeafe', color: '#1e40af' },
      on_hold: { background: '#fef3c7', color: '#92400e' },
      expired: { background: '#fee2e2', color: '#991b1b' }
    };
    const style = styles[status] || styles.active;
    return (
      <span style={{ ...style, padding: '2px 8px', borderRadius: '10px', fontSize: '12px', textTransform: 'capitalize' }}>
        {status?.replace('_', ' ') || 'Active'}
      </span>
    );
  };

  return (
    <div className="dashboard" style={{ position: 'relative' }}>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Welcome back, <span>{user.name || "Seller"}</span> !</h1>
          <p className="sub">Here's your current overview</p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(16, 185, 129, 0.1)',
          color: '#059669',
          padding: '8px 16px',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          fontSize: '13px',
          fontWeight: '600',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            width: '18px',
            height: '18px',
            background: '#10b981',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          Verified Seller
        </div>
      </div>

      {/* STATS - Row 1 */}
      <div className="stats">
        <div className="card dark">
          <h4>Total Products</h4>
          <h2>{totalProducts}</h2>
          <span className="green">Total: {totalItems} items</span>
        </div>

        <div className="card">
          <h4>Total Views</h4>
          <h2>{totalViews}</h2>
          <span className="green">Across all listings</span>
        </div>

        <div className="card">
          <h4>Items Sold</h4>
          <h2>{totalItemsSold}</h2>
          <span style={{ color: '#10b981' }}>{conversionRate}% conversion rate</span>
        </div>

        <div className="card">
          <h4>Items On Hold</h4>
          <h2 style={{ color: itemsOnHold > 0 ? '#f59e0b' : '#6b7280' }}>{itemsOnHold}</h2>
          <span style={{ color: itemsOnHold > 0 ? '#f59e0b' : '#9ca3af' }}>
            {itemsOnHold > 0 ? 'In negotiation' : 'No pending deals'}
          </span>
        </div>
      </div>

      {/* STATS - Row 2 */}
      <div className="stats" style={{ marginTop: 20 }}>
        <div className="card">
          <h4>Total Revenue</h4>
          <h2 style={{ color: '#10b981' }}>Rs. {totalRevenue.toLocaleString()}</h2>
          <span className="green">From {totalItemsSold} sold items</span>
        </div>

        <div className="card">
          <h4>Interested Users</h4>
          <h2 style={{ color: '#8b5cf6' }}>{interestedUsers}</h2>
          <span style={{ color: '#8b5cf6' }}>Unique people interested</span>
        </div>

        <div className="card">
          <h4>Total Likes</h4>
          <h2 style={{ color: '#ec4899' }}>{totalProductLikes}</h2>
          <span style={{ color: '#ec4899' }}>Total product saves</span>
        </div>

        <div className="card" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none'
        }}>
          <h4 style={{ color: 'rgba(255,255,255,0.9)' }}>Trust Score</h4>
          <h2 style={{ color: 'white', fontSize: '36px' }}>
            {user.trustScore !== undefined ? Math.round(user.trustScore) : '—'}
          </h2>
          <span style={{ color: 'rgba(255,255,255,0.8)' }}>
            {user.trustScore !== undefined ? `${Math.round(user.trustScore)} / 100` : 'No score yet'}
          </span>
        </div>
      </div>

      {/* GRID */}
      <div className="grid">
        <div className="panel">
          <h3>Performance Insights</h3>
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280' }}>Active Products</span>
              <strong>{activeProducts.length}</strong>
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280' }}>Stock Value</span>
              <strong style={{ color: '#10b981' }}>Rs. {stockValue.toLocaleString()}</strong>
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280' }}>Expired Listings</span>
              <strong style={{ color: products.filter(p => p.status === 'expired').length > 0 ? '#ef4444' : '#10b981' }}>
                {products.filter(p => p.status === 'expired').length}
              </strong>
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280' }}>Avg. Views per Product</span>
              <strong>{totalProducts > 0 ? Math.round(totalViews / totalProducts) : 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280' }}>Success Rate</span>
              <strong style={{ color: '#10b981' }}>{conversionRate}%</strong>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3>Top Performing Products</h3>
          {topProducts.length === 0 ? (
            <p style={{ padding: 10, color: '#666' }}>No products listed yet.</p>
          ) : (
            <ul className="products">
              {topProducts.map((p, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                  <div>
                    <span style={{ fontWeight: 500 }}>{p.name.substring(0, 30)}{p.name.length > 30 ? '...' : ''}</span>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      {p.views || 0} views
                    </div>
                  </div>
                  {getStatusBadge(p.status)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* RECENT PRODUCTS */}
      <div className="panel">
        <h3>Recently Added Products</h3>
        {products.length === 0 ? (
          <p style={{ padding: 20 }}>No products found.</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Views</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map((p) => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td>Rs. {p.price?.toLocaleString()}</td>
                    <td>{p.views || 0}</td>
                    <td>{getStatusBadge(p.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
