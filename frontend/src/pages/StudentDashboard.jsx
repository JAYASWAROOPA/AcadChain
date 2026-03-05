import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, LogOut, Upload, FileText, Edit, User as UserIcon, BadgeCheck, AlertTriangle, Building2, Calendar, Check } from 'lucide-react';
import api from '../utils/api';
import ProfileModal from '../components/ProfileModal';

export default function StudentDashboard({ user, setUser }) {
    const [reputation, setReputation] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [records, setRecords] = useState([]);
    const [drives, setDrives] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [repRes, recRes, drivesRes] = await Promise.all([
                    api.get(`/reputation/${user._id}`),
                    api.get('/records/my'),
                    api.get('/drives/student/eligible')
                ]);
                setReputation(repRes.data);
                setRecords(recRes.data);
                setDrives(drivesRes.data);
            } catch (err) {
                console.error('Failed to fetch dashboard data', err); // Added err to console.error
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user._id]);

    const verifiedRecords = records.filter(r => r.status === 'verified');
    const rejectedRecords = records.filter(r => r.status === 'rejected');

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    const handleProfileUpdate = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const handleApply = async (driveId) => {
        try {
            await api.post(`/drives/${driveId}/apply`);
            alert('Application submitted successfully!');
            const { data } = await api.get('/drives/student/eligible');
            setDrives(data);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to apply');
        }
    };

    return (
        <div style={{ minHeight: '100vh', padding: 'var(--space-xl)', background: 'var(--bg-primary)' }}>
            <div className="container">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xl)' }}>
                    <div>
                        <h1 className="gradient-text" style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem' }}>
                            Student Dashboard
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-xs)' }}>
                            Welcome back, {user.name}
                        </p>
                    </div>
                    <button onClick={handleLogout} className="btn btn-secondary">
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-xl)' }}>

                    {/* Section 1: Profile Card */}
                    <div className="glass-card fade-in" style={{ height: 'fit-content' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                <UserIcon size={20} color="var(--primary)" />
                                Student Profile
                            </h2>
                            <button onClick={() => setShowProfileModal(true)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                                <Edit size={14} /> Edit
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Full Name</div>
                                <div style={{ fontWeight: 600 }}>{user.name}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</div>
                                <div>{user.email}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>University</div>
                                <div>{user.university || 'Not set'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Department</div>
                                <div>{user.department || 'Not set'}</div>
                            </div>
                            <div className="grid-2">
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Year</div>
                                    <div>{user.academicYear || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</div>
                                    <span className="badge badge-verified" style={{ textTransform: 'capitalize' }}>
                                        {user.accountStatus || 'Active'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Reputation Overview */}
                    <div className="glass-card fade-in">
                        {reputation ? (
                            <>
                                <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                                        <Award size={24} color="var(--accent)" />
                                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Reputation Score</h2>
                                    </div>
                                    <div className="gradient-text" style={{ fontSize: '4rem', fontWeight: 'bold', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                                        {reputation.score.toFixed(1)}
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 'var(--space-xs)' }}>
                                        This score represents your verified academic credibility
                                    </p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-lg)' }}>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Attendance</div>
                                        <div style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>{reputation.breakdown.attendance}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Assignments</div>
                                        <div style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>{reputation.breakdown.assignments}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Internships</div>
                                        <div style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>{reputation.breakdown.internships}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Certs</div>
                                        <div style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>{reputation.breakdown.certifications}</div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>Loading reputation...</div>
                        )}
                    </div>
                </div>

                {/* Recruitment Opportunities Section */}
                <div style={{ marginTop: 'var(--space-xl)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <Building2 size={24} color="var(--primary)" />
                            Recruitment Opportunities
                        </h2>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Matches your profile & eligibility</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
                        {drives.length === 0 ? (
                            <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                                No active recruitment drives at the moment.
                            </div>
                        ) : (
                            drives.map(drive => (
                                <div key={drive._id} className="glass-card fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: drive.isApplied ? '1px solid var(--success)' : '1px solid var(--border)' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>{drive.companyName}</div>
                                            <span className={`badge badge-${drive.status === 'open' ? 'verified' : 'rejected'}`} style={{ fontSize: '0.7rem' }}>
                                                {drive.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '4px' }}>{drive.jobTitle}</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 'var(--space-sm) 0', lineHeight: 1.4 }}>
                                            {drive.jobDescription.substring(0, 100)}...
                                        </div>

                                        <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-sm)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                <Calendar size={14} /> Deadline: {new Date(drive.applicationEndDate).toLocaleDateString()}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: drive.isEligible ? 'var(--success)' : 'var(--error)' }}>
                                                {drive.isEligible ? <Check size={14} /> : <AlertTriangle size={14} />}
                                                {drive.isEligible ? 'Eligible to Apply' : 'Ineligible'}
                                            </div>
                                            {!drive.isEligible && drive.reasons.map((reason, i) => (
                                                <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '20px' }}>• {reason}</div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 'var(--space-lg)' }}>
                                        {drive.isApplied ? (
                                            <button className="btn btn-secondary" disabled style={{ width: '100%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderColor: 'var(--success)' }}>
                                                <Check size={18} /> Already Applied
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleApply(drive._id)}
                                                className="btn btn-primary"
                                                style={{ width: '100%' }}
                                                disabled={!drive.isEligible}
                                            >
                                                Apply Now
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Section 3: Quick Actions */}
                <div style={{ marginTop: 'var(--space-xl)' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 'var(--space-md)' }}>Quick Actions</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-lg)' }}>
                        <div
                            className="glass-card fade-in"
                            style={{ cursor: 'pointer', textAlign: 'center', transition: 'transform 0.2s' }}
                            onClick={() => navigate('/student/upload')}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <Upload size={32} color="var(--primary)" style={{ marginBottom: 'var(--space-sm)' }} />
                            <h3>Upload Record</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Submit new assignments, certs, or attendance data</p>
                        </div>

                        <div
                            className="glass-card fade-in"
                            style={{ cursor: 'pointer', textAlign: 'center', transition: 'transform 0.2s' }}
                            onClick={() => navigate('/student/records')}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <FileText size={32} color="var(--secondary)" style={{ marginBottom: 'var(--space-sm)' }} />
                            <h3>My Submissions</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>View status of your pending and verified records</p>
                        </div>
                    </div>
                </div>

                {/* Section 4: Verification Panel */}
                <div style={{ marginTop: 'var(--space-xl)' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 'var(--space-lg)' }}>Verification Status</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
                        {/* Approved Records Column */}
                        <div className="glass-card" style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                            <h3 style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
                                <BadgeCheck size={20} /> Approved Records
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                {verifiedRecords.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: 'var(--space-md)' }}>No approved records yet.</div>
                                ) : (
                                    verifiedRecords.map(record => (
                                        <div key={record._id} className="glass-card" style={{ padding: 'var(--space-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                                            <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{record.type.toUpperCase()}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(record.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{ fontSize: '0.9rem' }}>{record.subject || record.data}</div>
                                            {record.facultyComment && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '4px', fontStyle: 'italic' }}>
                                                    "{record.facultyComment}"
                                                </div>
                                            )}
                                            {record.blockchainTx && (
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', fontFamily: 'monospace', wordBreak: 'break-all', background: 'rgba(0,0,0,0.1)', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                                    TX: {record.blockchainTx}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Rejected Records Column */}
                        <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                            <h3 style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
                                <AlertTriangle size={20} /> Rejected Records
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                {rejectedRecords.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: 'var(--space-md)' }}>No rejected records.</div>
                                ) : (
                                    rejectedRecords.map(record => (
                                        <div key={record._id} className="glass-card" style={{ padding: 'var(--space-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                                            <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{record.type.toUpperCase()}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(record.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{ fontSize: '0.9rem' }}>{record.subject || record.data}</div>
                                            <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '4px' }}>
                                                Reason: {record.rejectionReason}
                                            </div>
                                            {record.facultyComment && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                                                    Faculty Comment: "{record.facultyComment}"
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modals */}
                {showProfileModal && (
                    <ProfileModal
                        user={user}
                        onClose={() => setShowProfileModal(false)}
                        onUpdate={handleProfileUpdate}
                    />
                )}
            </div>
        </div>
    );
}
