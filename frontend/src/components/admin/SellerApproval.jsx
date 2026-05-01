import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { CheckCircle, XCircle, Eye, X } from "lucide-react";

export default function SellerApproval() {
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSellers = async () => {
    try {
        setLoading(true);
        // Fetch all verifications (remove status filter to get all)
        const res = await api.get("/admin/verifications");
        if (res.data && Array.isArray(res.data)) {
            setSellers(res.data);
        } else {
            setSellers([]);
        }
    } catch (e) {
        console.error("Failed to fetch sellers", e);
        setSellers([]);
    } finally {
        setLoading(false);
    }
  };

  const approveSeller = async (id) => {
    if (!window.confirm("Are you sure you want to approve this seller?")) return;
    try {
        await api.put(`/admin/verifications/${id}/approve`, {});
        // Refresh list
        fetchSellers();
        setSelectedSeller(null); // Close modal if open
    } catch (e) {
        alert(e.response?.data?.message || "Failed to approve seller");
    }
  };

  const rejectSeller = async (id) => {
    const reason = window.prompt("Enter rejection reason:", "Document mismatch");
    if (!reason) return;

    try {
        await api.put(`/admin/verifications/${id}/reject`, { reason });
        fetchSellers();
        setSelectedSeller(null);
    } catch (e) {
        alert(e.response?.data?.message || "Failed to reject seller");
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  // Helper to construct image URL
  const getImageUrl = (path) => {
    if (!path) return null;
    // If path is absolute or has backslashes, try to normalize
    // Assuming backend serves 'uploads' folder at /uploads
    // and path stored might be 'uploads\seller-kyc\...' or just 'seller-kyc\...'
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    // Simple heuristic: keep part after 'uploads' or just use as is if relative
    const normalizedPath = path.replace(/\\/g, '/');
    const uploadsIndex = normalizedPath.indexOf('uploads/');
    
    let relativePath = normalizedPath;
    if (uploadsIndex !== -1) {
        relativePath = normalizedPath.substring(uploadsIndex); // e.g. uploads/seller-kyc/file.png
    } else {
        // If path doesn't start with uploads, maybe prepend it? 
        // Or it might be an absolute path we can't easily serve without mapping.
        // Let's assume standard structure for now.
    }
    
    return `http://localhost:5000/${relativePath}`; 
    // In production, use environment variable for backend URL
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="section-title">Seller Verification Requests</h3>
          <button className="btn btn-sm btn-outline" onClick={fetchSellers}>Refresh</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : sellers.length === 0 ? (
        <p className="text-muted">No verification requests found.</p>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Seller Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div className="product-cell">
                        <div className="avatar-placeholder">
                            {s.userId?.name?.charAt(0) || '?'}
                        </div>
                        <span className="product-name">{s.userId?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>{s.userId?.email || 'No Email'}</td>
                  <td>
                      <span className={`status-badge ${
                          s.status === 'approved' ? 'status-active' : 
                          s.status === 'rejected' ? 'status-rejected' : 'status-draft'
                      }`}>
                          {s.status}
                      </span>
                  </td>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => setSelectedSeller(s)}
                            title="View Details"
                        >
                            <Eye size={14} /> Details
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {selectedSeller && (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <h4>Verification Details</h4>
                    <button className="close-btn" onClick={() => setSelectedSeller(null)}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label className="text-muted">Full Name</label>
                            <p>{selectedSeller.firstName} {selectedSeller.lastName}</p>
                        </div>
                        <div>
                            <label className="text-muted">Phone</label>
                            <p>{selectedSeller.phone}</p>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label className="text-muted">Address</label>
                            <p>{selectedSeller.address}</p>
                        </div>
                        <div>
                            <label className="text-muted">Document Type</label>
                            <p>{selectedSeller.documentType}</p>
                        </div>
                        <div>
                            <label className="text-muted">Status</label>
                            <p style={{ textTransform: 'capitalize' }}>{selectedSeller.status}</p>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h5 style={{ marginBottom: '10px' }}>Documents</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label className="text-muted">Front Side</label>
                                <div style={{ border: '1px solid #ddd', padding: '5px', borderRadius: '4px', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9' }}>
                                    {selectedSeller.documentFront ? (
                                        <a href={getImageUrl(selectedSeller.documentFront)} target="_blank" rel="noreferrer">
                                            <img 
                                                src={getImageUrl(selectedSeller.documentFront)} 
                                                alt="Document Front" 
                                                style={{ maxWidth: '100%', maxHeight: '200px', display: 'block' }}
                                                onError={(e) => {
                                                    e.target.onerror = null; 
                                                    e.target.src = "https://placehold.co/400x300?text=Image+Not+Found";
                                                    e.target.parentElement.onclick = (evt) => evt.preventDefault(); // Disable link if image fails
                                                }}
                                            />
                                        </a>
                                    ) : <p className="text-muted">No image</p>}
                                </div>
                            </div>
                            <div>
                                <label className="text-muted">Back Side</label>
                                <div style={{ border: '1px solid #ddd', padding: '5px', borderRadius: '4px', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9' }}>
                                    {selectedSeller.documentBack ? (
                                        <a href={getImageUrl(selectedSeller.documentBack)} target="_blank" rel="noreferrer">
                                            <img 
                                                src={getImageUrl(selectedSeller.documentBack)} 
                                                alt="Document Back" 
                                                style={{ maxWidth: '100%', maxHeight: '200px', display: 'block' }}
                                                onError={(e) => {
                                                    e.target.onerror = null; 
                                                    e.target.src = "https://placehold.co/400x300?text=Image+Not+Found";
                                                    e.target.parentElement.onclick = (evt) => evt.preventDefault();
                                                }}
                                            />
                                        </a>
                                    ) : <p className="text-muted">No image (Optional)</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Allow reject for both pending and approved. Allow approve only for pending/rejected? Usually approve is only for pending. */}
                    {/* The user specifically asked to allow reject even after approval. */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                        {(selectedSeller.status === 'pending' || selectedSeller.status === 'approved') && (
                            <button 
                                className="btn btn-danger-outline"
                                onClick={() => rejectSeller(selectedSeller._id)}
                            >
                                <XCircle size={16} style={{ marginRight: '5px' }} /> Reject
                            </button>
                        )}
                        
                        {selectedSeller.status === 'pending' && (
                            <button 
                                className="btn btn-primary"
                                onClick={() => approveSeller(selectedSeller._id)}
                            >
                                <CheckCircle size={16} style={{ marginRight: '5px' }} /> Approve
                            </button>
                        )}
                    </div>
                    
                    {selectedSeller.status === 'rejected' && (
                         <div style={{ marginTop: '20px', padding: '10px', background: '#fee2e2', borderRadius: '4px', color: '#991b1b' }}>
                            <strong>Rejection Reason:</strong> {selectedSeller.adminComment}
                         </div>
                    )}
                </div>
            </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .modal-content {
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .close-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            color: #666;
        }
        .close-btn:hover {
            color: #000;
        }
        .text-muted {
            color: #64748b;
            font-size: 0.875rem;
            margin-bottom: 4px;
            display: block;
        }
      `}</style>
    </div>
  );
}
