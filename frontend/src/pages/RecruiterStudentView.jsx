import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink, CheckCircle, Copy, FileText, UserCheck, Briefcase, XCircle, UserPlus, Clock } from 'lucide-react';
import api from '../utils/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function RecruiterStudentView() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const driveId = searchParams.get('driveId');
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudentData();
    }, [id, driveId]);

    const fetchStudentData = async () => {
        try {
            const { data } = await api.get(`/reputation/report/${id}`);
            setData(data);

            if (driveId) {
                try {
                    const { data: appData } = await api.get(`/drives/recruiter/applications/${driveId}/${id}`);
                    setApplication(appData);
                } catch (appErr) {
                    console.warn('No application found for this drive context');
                }
            }
        } catch (err) {
            console.error(err);
            alert('Failed to load student data');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyHash = (hash) => {
        navigator.clipboard.writeText(hash);
        alert('Hash copied to clipboard!');
    };

    const handleDownloadReport = () => {
        if (!data) return;
        const doc = new jsPDF();
        const primaryColor = [79, 70, 229]; // Indigo-600

        // Header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text('ACADCHAIN', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text('Official Verified Academic Transcript', 105, 30, { align: 'center' });

        // Student Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(data.student.name, 14, 55);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Email: ${data.student.email}`, 14, 62);
        doc.text(`University: ${data.student.university || 'N/A'}`, 14, 68);
        doc.text(`Department: ${data.student.department || 'N/A'}`, 14, 74);

        // Reputation Score Box
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.roundedRect(140, 50, 56, 30, 3, 3, 'D');
        doc.setTextColor(...primaryColor);
        doc.setFontSize(22);
        doc.text(data.reputation.score.toFixed(1), 168, 68, { align: 'center' });
        doc.setFontSize(8);
        doc.text('REPUTATION SCORE', 168, 75, { align: 'center' });

        // Table
        const tableRows = data.verifiedRecords.map(rec => [
            rec.type.toUpperCase(),
            rec.data,
            rec.subject || rec.organization || '-',
            rec.verifiedBy?.name || 'Faculty',
            new Date(rec.updatedAt).toLocaleDateString(),
            (rec.blockchainTx || 'N/A').substring(0, 12) + '...'
        ]);

        doc.autoTable({
            startY: 90,
            head: [['Type', 'Details', 'Subject/Org', 'Verified By', 'Date', 'Hash']],
            body: tableRows,
            headStyles: { fillColor: primaryColor },
            styles: { fontSize: 8 },
            columnStyles: {
                5: { font: 'courier' }
            }
        });

        // Verification Footer
        const finalY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text('Verification Summary:', 14, finalY);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Total Records: ${data.verifiedRecords.length}`, 14, finalY + 8);
        doc.text(`Blockchain Network: Private AcadChain Ledger`, 14, finalY + 14);
        doc.text(`Report Timestamp: ${new Date().toLocaleString()}`, 14, finalY + 20);

        // Footer QR Simulation / Seal
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 280, 196, 280);
        doc.setFontSize(7);
        doc.text('This document is electronically generated and verified via AcadChain Blockchain implementation.', 105, 285, { align: 'center' });

        doc.save(`${data.student.name.replace(/\s+/g, '_')}_AcadChain_Report.pdf`);
    };

    const updateAppStatus = async (status) => {
        if (!application) return;
        try {
            await api.patch(`/drives/applications/${application._id}/status`, { status });
            setApplication({ ...application, status });
            alert(`Application status updated to ${status}`);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    if (loading) return <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>Loading student profile...</div>;
    if (!data) return <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>Student profile not found</div>;

    const { student, reputation, verifiedRecords } = data;

    return (
        <div style={{ minHeight: '100vh', padding: 'var(--space-xl)', background: 'var(--bg-primary)' }}>
            <div className="container" style={{ maxWidth: '1100px' }}>
                <button
                    onClick={() => navigate('/recruiter/dashboard')}
                    className="btn btn-secondary"
                    style={{ marginBottom: 'var(--space-lg)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)' }}
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                {application && (
                    <div className="glass-card fade-in" style={{ marginBottom: 'var(--space-lg)', borderLeft: '4px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(79, 70, 229, 0.05)' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '4px' }}>
                                <Briefcase size={18} color="var(--primary)" />
                                <span style={{ fontWeight: 600 }}>Candidate Application: {application.driveId.jobTitle}</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                <Clock size={14} /> Applied on {new Date(application.appliedDate).toLocaleDateString()}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                            <div style={{ marginRight: 'var(--space-md)' }}>
                                <span className={`badge badge-${application.status === 'hired' ? 'verified' : application.status === 'rejected' ? 'rejected' : 'pending'}`}>
                                    {application.status.toUpperCase()}
                                </span>
                            </div>
                            <button
                                onClick={() => updateAppStatus('shortlisted')}
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                                disabled={application.status === 'shortlisted'}
                            >
                                <UserCheck size={14} /> Shortlist
                            </button>
                            <button
                                onClick={() => updateAppStatus('hired')}
                                className="btn btn-primary"
                                style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--success)', borderColor: 'var(--success)' }}
                                disabled={application.status === 'hired'}
                            >
                                <UserPlus size={14} /> Hire
                            </button>
                            <button
                                onClick={() => updateAppStatus('rejected')}
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--error)', borderColor: 'var(--error)' }}
                                disabled={application.status === 'rejected'}
                            >
                                <XCircle size={14} /> Reject
                            </button>
                        </div>
                    </div>
                )}

                {/* Profile Header */}
                <div className="glass-card fade-in" style={{ marginBottom: 'var(--space-xl)', borderTop: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'center' }}>
                            <div style={{ width: '100px', height: '100px', background: 'var(--bg-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                <FileText size={48} color="var(--primary)" style={{ opacity: 0.5 }} />
                            </div>
                            <div>
                                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', marginBottom: 'var(--space-xs)' }}>{student.name}</h1>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {student.university} <span style={{ opacity: 0.3 }}>|</span> {student.department}
                                </p>
                                <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                                    <span className="badge badge-verified" style={{ background: 'var(--success)', color: 'white' }}>VERIFIED STUDENT</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{student.email}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', padding: 'var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Reputation Score</div>
                            <div className="gradient-text" style={{ fontSize: '3rem', fontWeight: 'bold' }}>{reputation.score.toFixed(1)}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>TOP {Math.max(1, 100 - reputation.score).toFixed(0)}% PERCENTILE</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)', marginTop: 'var(--space-xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border)' }}>
                        {Object.entries(reputation.breakdown).map(([key, val]) => (
                            <div key={key} style={{ textAlign: 'center' }}>
                                <div style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{key}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--primary)' }}>{val}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Report Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-lg)', gap: 'var(--space-md)' }}>
                    <button onClick={handleDownloadReport} className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: '30px', boxShadow: '0 4px 15px rgba(var(--primary-rgb), 0.3)' }}>
                        <Download size={18} /> Download Verified Report (PDF)
                    </button>
                </div>

                {/* Verified Records */}
                <div className="glass-card fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Verified Academic Portfolio</h2>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{verifiedRecords.length} Authenticated Entries</span>
                    </div>

                    {verifiedRecords.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                            No verified records have been published for this student yet.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            {verifiedRecords.map(rec => (
                                <div key={rec._id} className="detail-item" style={{ padding: 'var(--space-lg)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                                                <span className="badge" style={{ background: 'var(--primary)', color: 'white', fontSize: '0.7rem' }}>{rec.type.toUpperCase()}</span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verified on {new Date(rec.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                            <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-xs)' }}>{rec.data}</h3>
                                            <p style={{ color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 'var(--space-sm)' }}>{rec.subject || rec.organization}</p>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                                    <UserCheck size={14} color="var(--success)" />
                                                    <span>Verified by: <strong>{rec.verifiedBy?.name || 'Academic Faculty'}</strong></span>
                                                </div>
                                                {rec.proofFile && (
                                                    <a
                                                        href={`http://localhost:5000/api/records/file/${rec._id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}
                                                    >
                                                        View Proof <ExternalLink size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', color: 'var(--success)', justifyContent: 'flex-end', marginBottom: 'var(--space-md)', fontWeight: 600 }}>
                                                <CheckCircle size={18} /> AUTHENTICATED
                                            </div>
                                            {rec.blockchainTx && (
                                                <div
                                                    style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' }}
                                                    onClick={() => handleCopyHash(rec.blockchainTx)}
                                                    title="Click to copy hash"
                                                >
                                                    <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', marginBottom: '2px', opacity: 0.6 }}>Blockchain Hash</div>
                                                    {rec.blockchainTx.substring(0, 16)}... <Copy size={10} style={{ marginLeft: '4px' }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {rec.facultyComment && (
                                        <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                            "{rec.facultyComment}"
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
