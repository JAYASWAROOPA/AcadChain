import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, Filter, User, Award, Building2, Users, CheckSquare, Clock, ArrowRight } from 'lucide-react';
import api from '../utils/api';

export default function RecruiterDashboard({ user, setUser }) {
    const [activeTab, setActiveTab] = useState('drives'); // drives, search
    const [drives, setDrives] = useState([]);
    const [applications, setApplications] = useState([]);
    const [filters, setFilters] = useState({
        email: '',
        university: '',
        year: '',
        minScore: '',
        department: ''
    });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (activeTab === 'drives') fetchRecruiterData();
    }, [activeTab]);

    const fetchRecruiterData = async () => {
        setLoading(true);
        try {
            const [drivesRes, appsRes] = await Promise.all([
                api.get('/drives/recruiter/my'),
                api.get('/drives/recruiter/applications')
            ]);
            setDrives(drivesRes.data);
            setApplications(appsRes.data);
        } catch (err) {
            console.error('Failed to fetch recruiter data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setHasSearched(true);
        try {
            const query = new URLSearchParams(filters).toString();
            const { data } = await api.get(`/reputation/search?${query}`);
            setResults(data);
        } catch (err) {
            alert('Search failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    return (
        <div style={{ minHeight: '100vh', padding: 'var(--space-xl)', background: 'var(--bg-primary)' }}>
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xl)' }}>
                    <div>
                        <h1 className="gradient-text" style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem' }}>
                            Recruiter Dashboard
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-xs)' }}>
                            Welcome, {user.name}
                        </p>
                    </div>
                    <button onClick={handleLogout} className="btn btn-secondary">
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-sm)' }}>
                    <button
                        onClick={() => setActiveTab('drives')}
                        style={{ background: 'none', border: 'none', color: activeTab === 'drives' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'drives' ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', borderBottom: activeTab === 'drives' ? '2px solid var(--primary)' : 'none', paddingBottom: 'var(--space-xs)' }}
                    >
                        <Building2 size={18} /> My Drives
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        style={{ background: 'none', border: 'none', color: activeTab === 'search' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'search' ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', borderBottom: activeTab === 'search' ? '2px solid var(--primary)' : 'none', paddingBottom: 'var(--space-xs)' }}
                    >
                        <Search size={18} /> Candidate Search
                    </button>
                </div>

                {activeTab === 'drives' && (
                    <div className="fade-in">
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-xl)' }}>
                            {/* Left Column: Drives */}
                            <div>
                                <h2 style={{ marginBottom: 'var(--space-md)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <CheckSquare size={20} color="var(--primary)" /> Managed Drives
                                </h2>
                                <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                                    {drives.map(drive => (
                                        <div key={drive._id} className="glass-card">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{drive.jobTitle}</div>
                                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{drive.companyName}</div>
                                                </div>
                                                <span className={`badge badge-${drive.status === 'open' ? 'verified' : 'rejected'}`}>
                                                    {drive.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div style={{ marginTop: 'var(--space-md)', display: 'flex', gap: 'var(--space-xl)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Users size={14} /> {drive.applicantCount || 0} Applicants
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={14} /> Ends: {new Date(drive.applicationEndDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {drives.length === 0 && <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>No assigned drives.</div>}
                                </div>
                            </div>

                            {/* Right Column: Recent Applications */}
                            <div>
                                <h2 style={{ marginBottom: 'var(--space-md)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <Clock size={20} color="var(--secondary)" /> Recent Applications
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                    {applications.slice(0, 10).map(app => (
                                        <div key={app._id} className="glass-card" style={{ padding: 'var(--space-sm)', cursor: 'pointer' }} onClick={() => navigate(`/recruiter/student/${app.studentId._id}?driveId=${app.driveId._id}`)}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{app.studentId.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        Applied for: {app.driveId.jobTitle}
                                                    </div>
                                                </div>
                                                <ArrowRight size={16} color="var(--primary)" />
                                            </div>
                                            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>{app.status}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(app.appliedDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {applications.length === 0 && <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--text-muted)' }}>No applications yet.</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'search' && (
                    <div className="fade-in">
                        <div className="glass-card fade-in">
                            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <Search size={24} color="var(--primary)" />
                                Find Candidates
                            </h2>

                            <form onSubmit={handleSearch}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                    <div className="input-group">
                                        <label className="input-label">Email (Optional)</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="student@example.com"
                                            value={filters.email}
                                            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">University</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g. Stanford"
                                            value={filters.university}
                                            onChange={(e) => setFilters({ ...filters, university: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Graduation Year</label>
                                        <select
                                            className="input-field"
                                            value={filters.year}
                                            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                                        >
                                            <option value="">Any Year</option>
                                            <option value="1st Year">1st Year</option>
                                            <option value="2nd Year">2nd Year</option>
                                            <option value="3rd Year">3rd Year</option>
                                            <option value="4th Year">4th Year</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Department</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g. Computer Science"
                                            value={filters.department}
                                            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Min Reputation Score</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            placeholder="e.g. 50"
                                            value={filters.minScore}
                                            onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                                    {loading ? 'Searching...' : 'Search Candidates'}
                                </button>
                            </form>
                        </div>

                        <div style={{ marginTop: 'var(--space-xl)' }}>
                            {loading ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading results...</div>
                            ) : hasSearched && results.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No candidates found matching your criteria.</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
                                    {results.map((item) => (
                                        <div key={item.student._id} className="glass-card fade-in" style={{ transition: 'transform 0.2s', cursor: 'pointer' }} onClick={() => navigate(`/recruiter/student/${item.student._id}`)}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{item.student.name}</h3>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{item.student.university || 'University N/A'}</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{item.reputation.score.toFixed(1)}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SCORE</div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: 'var(--space-sm)', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                                                <span>{item.student.academicYear || 'Year N/A'}</span>
                                                <span>•</span>
                                                <span>{item.student.department || 'Dept N/A'}</span>
                                            </div>

                                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                                    <Award size={14} color="var(--success)" />
                                                    {item.recordCount} Verified Records
                                                </div>
                                                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>View Profile</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
