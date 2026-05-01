import React, { useEffect, useState } from 'react';
import api from "../../utils/api";
import { ShieldAlert, Check, User, ShoppingBag, Eye, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ReportManagement = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [adminComment, setAdminComment] = useState("");

    const fetchReports = async () => {
        try {
            const { data } = await api.get('/admin/reports');
            setReports(data);
        } catch (error) {
            toast.error("Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleResolve = async (id, action) => {
        try {
            await api.put(`/admin/reports/${id}/resolve`, { action, adminComment });
            toast.success(`Report ${action}`);
            setAdminComment(""); // Reset comment
            if (selectedReport && selectedReport._id === id) {
                setSelectedReport(null);
            }
            fetchReports();
        } catch (error) {
            toast.error("Failed to update report");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="badge-v2 badge-warning">Pending</span>;
            case 'resolved':
                return <span className="badge-v2 badge-success">Resolved</span>;
            case 'dismissed':
                return <span className="badge-v2 badge-secondary">Dismissed</span>;
            case 'reviewed':
                return <span className="badge-v2 badge-info">Reviewed</span>;
            default:
                return <span className="badge-v2">{status}</span>;
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="admin-page">
            {selectedReport && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: 'white', padding: '24px', borderRadius: '12px',
                        width: '90%', maxWidth: '600px', position: 'relative',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <button
                            onClick={() => setSelectedReport(null)}
                            style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer' }}
                        >
                            <X size={24} color="#666" />
                        </button>
                        
                        <h3 style={{ marginBottom: '24px', fontSize: '1.25rem', fontWeight: '700', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
                            Report Details
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px' }}>
                                <span style={{ fontWeight: '600', color: '#4b5563' }}>Status:</span>
                                <div>{getStatusBadge(selectedReport.status)}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px' }}>
                                <span style={{ fontWeight: '600', color: '#4b5563' }}>Report Type:</span>
                                <span style={{ textTransform: 'capitalize' }}>{selectedReport.reportType}</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px' }}>
                                <span style={{ fontWeight: '600', color: '#4b5563' }}>Target ID:</span>
                                <span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                                    {selectedReport.targetId}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px' }}>
                                <span style={{ fontWeight: '600', color: '#4b5563' }}>Reporter:</span>
                                <div>
                                    <div>{selectedReport.reporter?.name || 'Anonymous'}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{selectedReport.reporter?.email}</div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px' }}>
                                <span style={{ fontWeight: '600', color: '#4b5563' }}>Reason:</span>
                                <span style={{ fontWeight: '500' }}>{selectedReport.reason}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                <span style={{ fontWeight: '600', color: '#4b5563' }}>Full Description:</span>
                                <div style={{ 
                                    background: '#f9fafb', padding: '16px', borderRadius: '8px', 
                                    border: '1px solid #e5e7eb', minHeight: '80px', whiteSpace: 'pre-wrap' 
                                }}>
                                    {selectedReport.description || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No description provided.</span>}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', fontSize: '0.9rem', color: '#6b7280', marginTop: '10px' }}>
                                <span>Reported On:</span>
                                <span>{new Date(selectedReport.createdAt).toLocaleString()}</span>
                            </div>
                            
                            {selectedReport.adminComment && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                    <span style={{ fontWeight: '600', color: '#4b5563' }}>Admin Reply:</span>
                                    <div style={{ 
                                        background: '#eff6ff', padding: '12px', borderRadius: '8px', 
                                        border: '1px solid #bfdbfe', color: '#1e40af' 
                                    }}>
                                        {selectedReport.adminComment}
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedReport.status === 'pending' && (
                            <div style={{ marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontWeight: '600', color: '#4b5563', marginBottom: '8px' }}>
                                        Reply / Reason (Optional):
                                    </label>
                                    <textarea
                                        value={adminComment}
                                        onChange={(e) => setAdminComment(e.target.value)}
                                        placeholder="Enter reason for dismissal or action taken..."
                                        style={{
                                            width: '100%', padding: '10px', borderRadius: '6px',
                                            border: '1px solid #d1d5db', minHeight: '80px',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button 
                                        className="btn btn-outline" 
                                        onClick={() => {
                                            handleResolve(selectedReport._id, 'dismissed');
                                        }}
                                    >
                                        Dismiss Report
                                    </button>
                                    <button 
                                        className="btn btn-danger" 
                                        onClick={() => {
                                            handleResolve(selectedReport._id, 'resolved');
                                        }}
                                    >
                                        Take Action
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="page-header">
                <h2 className="page-title">Moderation Queue</h2>
                <div className="badge badge-danger">{reports.length} Reports</div>
            </div>

            <div className="admin-table-container card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Reported Item</th>
                            <th>Type</th>
                            <th>Reporter</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.length > 0 ? reports.map(report => (
                            <tr key={report._id}>
                                <td>
                                    <div className="item-cell" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div className={`report-icon-bg ${report.reportType}`}>
                                            {report.reportType === 'product' ? <ShoppingBag size={14} /> : <User size={14} />}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                                                {report.reportType === 'product' ? 'Product ID:' : 'User ID:'}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>
                                                {report.targetId}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge-v2 badge-${report.reportType === 'product' ? 'indigo' : 'rose'}`}>
                                        {report.reportType === 'product' ? 'Product' : 'Seller'}
                                    </span>
                                </td>
                                <td>{report.reporter?.name || 'Anonymous'}</td>
                                <td>
                                    <div className="report-reason-box">
                                        <span className="reason-text">{report.reason}</span>
                                    </div>
                                </td>
                                <td>
                                    {getStatusBadge(report.status)}
                                </td>
                                <td>{new Date(report.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                                <td>
                                    <div className="admin-product-buttons">
                                        <button className="btn btn-outline btn-sm" title="View Details" onClick={() => setSelectedReport(report)}>
                                            <Eye size={14} />
                                        </button>
                                        {report.status === 'pending' && (
                                            <>
                                                <button className="btn btn-outline btn-sm" title="Dismiss" onClick={() => handleResolve(report._id, 'dismissed')}>
                                                    <Check size={14} />
                                                </button>
                                                <button className="btn btn-danger btn-sm" title="Take Action" onClick={() => handleResolve(report._id, 'resolved')}>
                                                    <ShieldAlert size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>No reports found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReportManagement;
