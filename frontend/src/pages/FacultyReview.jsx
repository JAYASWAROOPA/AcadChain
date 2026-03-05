import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, FileText, AlertTriangle } from 'lucide-react';
import api from '../utils/api';

export default function FacultyReview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form States
    const [remarks, setRemarks] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showRejectionInput, setShowRejectionInput] = useState(false);
    const [proofUrl, setProofUrl] = useState('');

    useEffect(() => {
        const fetchRecord = async () => {
            try {
                const { data } = await api.get(`/records/${id}`);
                setRecord(data);
                if (data.facultyComment) setRemarks(data.facultyComment);
                if (data.rejectionReason) setRejectionReason(data.rejectionReason);

                // Fetch proof file blob
                if (data.proofFile) {
                    const response = await api.get(`/records/file/${id}`, { responseType: 'blob' });
                    const url = URL.createObjectURL(response.data);
                    setProofUrl(url);
                }
            } catch (err) {
                console.error('Fetch Record Error:', err);
                alert('Failed to load record details or proof file');
            } finally {
                setLoading(false);
            }
        };
        fetchRecord();

        // Cleanup blob URL on unmount
        return () => {
            if (proofUrl) URL.revokeObjectURL(proofUrl);
        };
    }, [id]);

    const handleDecision = async (status) => {
        console.log(`[DECISION] status: ${status}, remarks: "${remarks}", rejectionReason: "${rejectionReason}"`);

        if (!remarks || remarks.trim() === '') {
            console.warn('[DECISION] Blocked: Remarks are empty');
            alert('Please provide verification remarks before approving/rejecting.');
            return;
        }
        if (status === 'rejected' && !rejectionReason) {
            console.warn('[DECISION] Blocked: Rejection reason missing');
            alert('Rejection reason is mandatory for rejections');
            return;
        }

        console.log(`[DECISION] Sending request to /api/records/verify/${id}...`);
        setSubmitting(true);
        try {
            const response = await api.post(`/records/verify/${id}`, {
                status,
                remarks: remarks.trim(),
                rejectionReason: status === 'rejected' ? rejectionReason : ''
            });
            console.log('[DECISION] Success:', response.data);
            alert(`Record ${status === 'verified' ? 'Verified' : 'Rejected'} successfully!`);
            navigate('/faculty/pending');
        } catch (err) {
            console.error('[DECISION] Error:', err);
            const msg = err.response?.data?.message || 'Verification failed';
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>Loading...</div>;
    if (!record) return <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>Record not found</div>;

    return (
        <div style={{ minHeight: '100vh', padding: 'var(--space-xl)', background: 'var(--bg-primary)' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                <button
                    onClick={() => navigate('/faculty/pending')}
                    className="btn btn-secondary"
                    style={{ marginBottom: 'var(--space-lg)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)' }}
                >
                    <ArrowLeft size={16} /> Back to Pending List
                </button>

                <div className="glass-card fade-in">
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem' }}>Review Submission</h1>
                        <span className={`badge badge-${record.status}`} style={{ textTransform: 'uppercase' }}>{record.status}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.2fr) 1fr', gap: 'var(--space-xl)' }}>
                        {/* Left: Proof Preview */}
                        <div style={{ borderRight: '1px solid var(--border)', paddingRight: 'var(--space-xl)' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)', fontSize: '1.1rem' }}>
                                <FileText size={20} color="var(--primary)" /> Proof Document
                            </h3>
                            {record.proofFile ? (
                                <div style={{
                                    width: '100%',
                                    height: '600px',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    overflow: 'hidden',
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <div style={{ padding: '8px 12px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{record.proofOriginalName}</span>
                                        <button
                                            onClick={() => window.open(proofUrl, '_blank')}
                                            className="btn btn-secondary"
                                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                        >
                                            View Fullscreen
                                        </button>
                                    </div>
                                    <div style={{ flex: 1, background: '#f0f0f0' }}>
                                        {record.proofOriginalName?.toLowerCase().endsWith('.pdf') ? (
                                            <iframe
                                                src={`${proofUrl}#toolbar=0`}
                                                width="100%"
                                                height="100%"
                                                style={{ border: 'none' }}
                                                title="PDF Preview"
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                                                <img
                                                    src={proofUrl}
                                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    alt="Proof Preview"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
                                    <FileText size={48} style={{ opacity: 0.2, marginBottom: 'var(--space-sm)' }} />
                                    <div>No proof document available</div>
                                </div>
                            )}
                        </div>

                        {/* Right: Info & Decision */}
                        <div>
                            <div style={{ marginBottom: 'var(--space-xl)' }}>
                                <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1.1rem' }}>Student & Record Info</h3>
                                <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                                    <div className="glass-card" style={{ padding: 'var(--space-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student</div>
                                        <div style={{ fontWeight: 600 }}>{record.studentId?.name}</div>
                                        <div style={{ fontSize: '0.85rem' }}>{record.studentId?.email}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{record.studentId?.department} | Year {record.studentId?.academicYear}</div>
                                    </div>

                                    <div className="glass-card" style={{ padding: 'var(--space-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Details</div>
                                        <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{record.type}</div>
                                        <div style={{ fontSize: '0.9rem' }}>Value: <strong>{record.data}</strong></div>
                                        <div style={{ fontSize: '0.85rem' }}>Subject/Org: {record.subject || record.organization || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: 'var(--space-xl)' }}>
                                <h3 style={{ marginBottom: 'var(--space-sm)', fontSize: '1.1rem' }}>Description</h3>
                                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5, background: 'var(--bg-secondary)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)' }}>
                                    {record.description || 'No description provided by student.'}
                                </p>
                            </div>

                            {/* Decision Area */}
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-xl)' }}>
                                {record.status === 'pending' ? (
                                    <>
                                        <div className="input-group">
                                            <label className="input-label" style={{ fontWeight: 600 }}>Verification Remarks (Visible to Student)</label>
                                            <textarea
                                                className="input-field"
                                                style={{ minHeight: '120px' }}
                                                value={remarks}
                                                onChange={(e) => setRemarks(e.target.value)}
                                                placeholder="Explain your decision..."
                                                required
                                            ></textarea>
                                        </div>

                                        {showRejectionInput && (
                                            <div className="input-group fade-in">
                                                <label className="input-label" style={{ fontWeight: 600, color: 'var(--error)' }}>Rejection Category</label>
                                                <select
                                                    className="input-field"
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select Category</option>
                                                    <option value="Incorrect Data">Incorrect Data</option>
                                                    <option value="Poor Document Visibility">Poor Document Visibility</option>
                                                    <option value="Invalid Proof">Invalid Proof</option>
                                                    <option value="Incomplete Information">Incomplete Information</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                                            <button
                                                onClick={() => setShowRejectionInput(!showRejectionInput)}
                                                className="btn btn-secondary"
                                                style={{ flex: 1, borderColor: 'var(--error)', color: 'var(--error)' }}
                                                disabled={submitting}
                                            >
                                                {showRejectionInput ? 'Back' : 'Reject'}
                                            </button>

                                            <button
                                                onClick={() => handleDecision(showRejectionInput ? 'rejected' : 'verified')}
                                                className="btn btn-primary"
                                                style={{ flex: 2, opacity: submitting ? 0.7 : 1 }}
                                                disabled={submitting}
                                            >
                                                {submitting ? 'Processing...' : (showRejectionInput ? 'Confirm Rejection' : 'Verify & Approve')}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="glass-card" style={{ padding: 'var(--space-md)', background: record.status === 'verified' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${record.status === 'verified' ? 'var(--success)' : 'var(--error)'}` }}>
                                        <h3 style={{ color: record.status === 'verified' ? 'var(--success)' : 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-sm)' }}>
                                            {record.status === 'verified' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                            {record.status === 'verified' ? 'VERIFIED' : 'REJECTED'}
                                        </h3>
                                        <div style={{ fontSize: '0.9rem', marginBottom: 'var(--space-sm)' }}>
                                            <strong>Remarks:</strong> {record.facultyComment}
                                        </div>
                                        {record.status === 'rejected' && (
                                            <div style={{ fontSize: '0.9rem', marginBottom: 'var(--space-sm)' }}>
                                                <strong>Reason:</strong> {record.rejectionReason}
                                            </div>
                                        )}
                                        {record.blockchainTx && (
                                            <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-sm)', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Blockchain Transaction Hash</div>
                                                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', wordBreak: 'break-all', background: 'rgba(0,0,0,0.05)', padding: '6px', borderRadius: '4px' }}>
                                                    {record.blockchainTx}
                                                </div>
                                            </div>
                                        )}
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'right' }}>
                                            Processed on {new Date(record.updatedAt).toLocaleString()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
