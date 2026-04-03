import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, Eye, ArrowLeft, RotateCcw } from 'lucide-react';
import api, { API_URL } from '../utils/api';

export default function StudentRecords({ user }) {
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const { data } = await api.get('/records/my');
            setRecords(data);
        } catch (err) {
            console.error('Failed to fetch records');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (id) => {
        if (!window.confirm('Are you sure you want to withdraw this submission?')) return;
        try {
            await api.patch(`/records/${id}/withdraw`);
            fetchRecords();
        } catch (err) {
            alert('Failed to withdraw record');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this record permanently?')) return;
        try {
            await api.delete(`/records/${id}`);
            fetchRecords();
        } catch (err) {
            alert('Failed to delete record');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            draft: 'var(--text-secondary)',
            pending: 'var(--accent)',
            verified: 'var(--success)',
            rejected: 'var(--error)',
            withdrawn: 'var(--text-muted)'
        };
        return (
            <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                backgroundColor: `${colors[status] || colors.draft}20`,
                color: colors[status] || colors.draft
            }}>
                {status}
            </span>
        );
    };

    return (
        <div style={{ minHeight: '100vh', padding: 'var(--space-xl)', background: 'var(--bg-primary)' }}>
            <div className="container">
                <button
                    onClick={() => navigate('/student/dashboard')}
                    className="btn btn-secondary"
                    style={{ marginBottom: 'var(--space-lg)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)' }}
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                <div className="glass-card fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <FileText size={32} color="var(--primary)" />
                            My Submissions
                        </h1>
                        <button onClick={() => navigate('/student/upload')} className="btn btn-primary">
                            + Upload New
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>Loading records...</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ textAlign: 'left', padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>Type</th>
                                        <th style={{ textAlign: 'left', padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>Subject / Data</th>
                                        <th style={{ textAlign: 'left', padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>Date</th>
                                        <th style={{ textAlign: 'left', padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>Status</th>
                                        <th style={{ textAlign: 'right', padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                                                No records found. Start by uploading one!
                                            </td>
                                        </tr>
                                    ) : (
                                        records.map(record => (
                                            <tr key={record._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: 'var(--space-md)', textTransform: 'capitalize' }}>{record.type}</td>
                                                <td style={{ padding: 'var(--space-md)' }}>
                                                    <div style={{ fontWeight: 500 }}>{record.data}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{record.subject || record.organization}</div>
                                                </td>
                                                <td style={{ padding: 'var(--space-md)' }}>
                                                    {new Date(record.createdAt).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: 'var(--space-md)' }}>
                                                    {getStatusBadge(record.status)}
                                                </td>
                                                <td style={{ padding: 'var(--space-md)', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: 'var(--space-xs)', justifyContent: 'flex-end' }}>
                                                        {record.proofFile && (
                                                            <a href={`${API_URL}/records/file/${record._id}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '4px 8px' }} title="View Proof">
                                                                <Eye size={14} />
                                                            </a>
                                                        )}
                                                        {(record.status === 'pending' || record.status === 'draft') && (
                                                            <>
                                                                <button onClick={() => handleWithdraw(record._id)} className="btn btn-secondary" style={{ padding: '4px 8px' }} title="Withdraw">
                                                                    <RotateCcw size={14} />
                                                                </button>
                                                                <button onClick={() => handleDelete(record._id)} className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--error)', borderColor: 'var(--error)' }} title="Delete">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
