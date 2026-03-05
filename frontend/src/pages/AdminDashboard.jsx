import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, CheckCircle, Clock, LogOut, Shield, UserPlus, UserCheck, XCircle, Trash2, Mail, ExternalLink, Linkedin, Building2 } from 'lucide-react';
import api from '../utils/api';

export default function AdminDashboard({ user, setUser }) {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('stats'); // stats, whitelist, requests, drives
    const [whitelist, setWhitelist] = useState([]);
    const [requests, setRequests] = useState([]);
    const [drives, setDrives] = useState([]);
    const [selectedDriveApplicants, setSelectedDriveApplicants] = useState(null); // { driveId, applicants: [] }
    const [whitelistData, setWhitelistData] = useState({
        whitelistedEmail: '',
        whitelistedRole: 'student',
        university: '',
        department: '',
        academicYear: ''
    });
    const [newDrive, setNewDrive] = useState({
        companyName: '',
        jobTitle: '',
        recruiterEmail: '',
        jobDescription: '',
        applicationStartDate: '',
        applicationEndDate: '',
        minReputationScore: 0,
        departments: '',
        graduationYear: ''
    });

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (activeTab === 'whitelist') fetchWhitelist();
        if (activeTab === 'requests') fetchRequests();
        if (activeTab === 'drives') fetchDrives();
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/admin/stats');
            setStats(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWhitelist = async () => {
        try {
            const { data } = await api.get('/admin/whitelist');
            setWhitelist(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchRequests = async () => {
        try {
            const { data } = await api.get('/admin/access-requests');
            setRequests(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDrives = async () => {
        try {
            const { data } = await api.get('/drives/admin/all');
            setDrives(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateDrive = async (e) => {
        e.preventDefault();
        try {
            // Clean up payload to match schema and avoid extra fields
            const driveData = {
                companyName: newDrive.companyName.trim(),
                jobTitle: newDrive.jobTitle.trim(),
                recruiterEmail: newDrive.recruiterEmail.trim(),
                jobDescription: newDrive.jobDescription.trim(),
                applicationStartDate: newDrive.applicationStartDate,
                applicationEndDate: newDrive.applicationEndDate,
                eligibilityCriteria: {
                    departments: newDrive.departments ? newDrive.departments.split(',').map(d => d.trim()).filter(d => d) : [],
                    minReputationScore: parseFloat(newDrive.minReputationScore) || 0,
                    graduationYear: (newDrive.graduationYear || '').toString().trim()
                }
            };

            alert('DEBUG: Sending POST to /api/drives/create');
            await api.post('/drives/create', driveData);
            setNewDrive({
                companyName: '', jobTitle: '', recruiterEmail: '', jobDescription: '',
                applicationStartDate: '', applicationEndDate: '', minReputationScore: 0,
                departments: '', graduationYear: ''
            });
            fetchDrives();
            alert('Drive created successfully!');
        } catch (err) {
            console.error('Create Drive Error:', err);
            const errMsg = err.response?.data?.message || err.message || 'Unknown network error';
            alert(`Failed to create drive: ${errMsg}`);
        }
    };

    const toggleDriveStatus = async (id) => {
        try {
            await api.patch(`/drives/${id}/status`);
            fetchDrives();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const fetchApplicants = async (driveId) => {
        if (selectedDriveApplicants?.driveId === driveId) {
            setSelectedDriveApplicants(null);
            return;
        }
        try {
            const { data } = await api.get(`/drives/${driveId}/applicants`);
            setSelectedDriveApplicants({ driveId, applicants: data });
        } catch (err) {
            alert('Failed to fetch applicants');
        }
    };

    const addToWhitelist = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/whitelist', {
                email: whitelistData.whitelistedEmail,
                role: whitelistData.whitelistedRole,
                university: whitelistData.university,
                department: whitelistData.department,
                academicYear: whitelistData.academicYear
            });
            setWhitelistData({ whitelistedEmail: '', whitelistedRole: 'student', university: '', department: '', academicYear: '' });
            fetchWhitelist();
            alert('User added to whitelist successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add to whitelist');
        }
    };

    const removeFromWhitelist = async (id) => {
        if (!window.confirm('Remove this email from whitelist?')) return;
        try {
            await api.delete(`/admin/whitelist/${id}`);
            fetchWhitelist();
        } catch (err) {
            alert('Failed to remove');
        }
    };

    const handleRequestAction = async (id, action) => {
        try {
            await api.post(`/admin/access-requests/${id}/${action}`);
            fetchRequests();
            fetchStats();
        } catch (err) {
            alert(`Failed to ${action} request`);
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
                            Admin Dashboard
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-xs)' }}>
                            System Overview & Control Panel
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        <button onClick={() => navigate('/admin/users')} className="btn btn-secondary">
                            <Users size={18} />
                            Manage Active Users
                        </button>
                        <button onClick={handleLogout} className="btn btn-secondary" style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-sm)' }}>
                    <button
                        onClick={() => setActiveTab('stats')}
                        style={{ background: 'none', border: 'none', color: activeTab === 'stats' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'stats' ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', borderBottom: activeTab === 'stats' ? '2px solid var(--primary)' : 'none', paddingBottom: 'var(--space-xs)' }}
                    >
                        <FileText size={18} /> Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('whitelist')}
                        style={{ background: 'none', border: 'none', color: activeTab === 'whitelist' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'whitelist' ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', borderBottom: activeTab === 'whitelist' ? '2px solid var(--primary)' : 'none', paddingBottom: 'var(--space-xs)' }}
                    >
                        <Mail size={18} /> Whitelist
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        style={{ background: 'none', border: 'none', color: activeTab === 'requests' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'requests' ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', borderBottom: activeTab === 'requests' ? '2px solid var(--primary)' : 'none', paddingBottom: 'var(--space-xs)' }}
                    >
                        <Clock size={18} /> Access Requests
                        {stats?.pendingRequests > 0 && <span style={{ background: 'var(--error)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px' }}>{stats.pendingRequests}</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('drives')}
                        style={{ background: 'none', border: 'none', color: activeTab === 'drives' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'drives' ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', borderBottom: activeTab === 'drives' ? '2px solid var(--primary)' : 'none', paddingBottom: 'var(--space-xs)' }}
                    >
                        <Building2 size={18} /> Recruitment Drives
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>Loading...</div>
                ) : (
                    <>
                        {activeTab === 'stats' && stats && (
                            <div className="fade-in">
                                <h2 style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <Users size={20} color="var(--primary)" /> User Statistics
                                </h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
                                    <div className="glass-card" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.users.total}</div>
                                        <div style={{ color: 'var(--text-secondary)' }}>Total Registered</div>
                                    </div>
                                    <div className="glass-card" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.users.students}</div>
                                        <div style={{ color: 'var(--text-secondary)' }}>Students</div>
                                    </div>
                                    <div className="glass-card" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.users.faculty}</div>
                                        <div style={{ color: 'var(--text-secondary)' }}>Faculty</div>
                                    </div>
                                    <div className="glass-card" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.users.recruiters}</div>
                                        <div style={{ color: 'var(--text-secondary)' }}>Recruiters</div>
                                    </div>
                                </div>

                                <h2 style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <FileText size={20} color="var(--secondary)" /> Record Statistics
                                </h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
                                    <div className="glass-card" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.records.total}</div>
                                        <div style={{ color: 'var(--text-secondary)' }}>Total Records</div>
                                    </div>
                                    <div className="glass-card" style={{ textAlign: 'center' }}>
                                        <CheckCircle size={32} color="var(--success)" style={{ margin: '0 auto var(--space-xs)' }} />
                                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.records.verified}</div>
                                        <div style={{ color: 'var(--text-secondary)' }}>Verified</div>
                                    </div>
                                    <div className="glass-card" style={{ textAlign: 'center' }}>
                                        <Clock size={32} color="var(--accent)" style={{ margin: '0 auto var(--space-xs)' }} />
                                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.records.pending}</div>
                                        <div style={{ color: 'var(--text-secondary)' }}>Pending</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'whitelist' && (
                            <div className="fade-in">
                                <div className="glass-card" style={{ marginBottom: 'var(--space-lg)' }}>
                                    <h3 style={{ marginBottom: 'var(--space-md)' }}>Whitelist New User</h3>
                                    <form onSubmit={addToWhitelist}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                            <div className="input-group">
                                                <label className="input-label">Email</label>
                                                <input
                                                    type="email"
                                                    className="input-field"
                                                    value={whitelistData.whitelistedEmail}
                                                    onChange={(e) => setWhitelistData({ ...whitelistData, whitelistedEmail: e.target.value })}
                                                    placeholder="user@example.com"
                                                    required
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">Role</label>
                                                <select
                                                    className="input-field"
                                                    value={whitelistData.whitelistedRole}
                                                    onChange={(e) => setWhitelistData({ ...whitelistData, whitelistedRole: e.target.value })}
                                                    required
                                                >
                                                    <option value="student">Student</option>
                                                    <option value="faculty">Faculty</option>
                                                    <option value="recruiter">Recruiter</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </div>
                                        </div>

                                        {whitelistData.whitelistedRole === 'student' && (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                                                <div className="input-group">
                                                    <label className="input-label">University</label>
                                                    <input
                                                        type="text"
                                                        className="input-field"
                                                        value={whitelistData.university}
                                                        onChange={(e) => setWhitelistData({ ...whitelistData, university: e.target.value })}
                                                        placeholder="e.g. BIT"
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">Department</label>
                                                    <input
                                                        type="text"
                                                        className="input-field"
                                                        value={whitelistData.department}
                                                        onChange={(e) => setWhitelistData({ ...whitelistData, department: e.target.value })}
                                                        placeholder="e.g. ECE"
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">Year</label>
                                                    <input
                                                        type="text"
                                                        className="input-field"
                                                        value={whitelistData.academicYear}
                                                        onChange={(e) => setWhitelistData({ ...whitelistData, academicYear: e.target.value })}
                                                        placeholder="e.g. 3rd Year"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-md)' }}>
                                            <UserPlus size={18} />
                                            Add to Whitelist
                                        </button>
                                    </form>
                                </div>

                                <div className="glass-card">
                                    <h3 style={{ marginBottom: 'var(--space-md)' }}>Allowed Emails</h3>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                                <th style={{ textAlign: 'left', padding: 'var(--space-md)' }}>Email</th>
                                                <th style={{ textAlign: 'left', padding: 'var(--space-md)' }}>Role</th>
                                                <th style={{ textAlign: 'left', padding: 'var(--space-md)' }}>Added By</th>
                                                <th style={{ textAlign: 'right', padding: 'var(--space-md)' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {whitelist.map(item => (
                                                <tr key={item._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: 'var(--space-md)' }}>{item.email}</td>
                                                    <td style={{ padding: 'var(--space-md)' }}><span className="badge badge-pending">{item.role}</span></td>
                                                    <td style={{ padding: 'var(--space-md)' }}>{item.addedByAdminId?.name}</td>
                                                    <td style={{ padding: 'var(--space-md)', textAlign: 'right' }}>
                                                        <button onClick={() => removeFromWhitelist(item._id)} className="btn btn-secondary" style={{ color: 'var(--error)' }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {whitelist.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>No whitelisted emails yet.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'requests' && (
                            <div className="fade-in">
                                <div className="glass-card">
                                    <h3 style={{ marginBottom: 'var(--space-md)' }}>Pending Access Requests</h3>
                                    <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
                                        {requests.filter(r => r.status === 'pending').map(request => (
                                            <div key={request._id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{request.name}</div>
                                                        <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginTop: '4px' }}>
                                                            <Mail size={14} /> {request.email}
                                                        </div>
                                                        <div style={{ marginTop: 'var(--space-sm)' }}>
                                                            <span className="badge badge-pending" style={{ marginRight: 'var(--space-sm)' }}>{request.requestedRole}</span>
                                                            {request.requestedRole === 'recruiter' && (
                                                                <span style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                                                    <Building2 size={14} /> {request.companyName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                                        <button onClick={() => handleRequestAction(request._id, 'approve')} className="btn btn-primary" style={{ background: 'var(--success)', borderColor: 'var(--success)' }}>
                                                            <UserCheck size={18} /> Approve
                                                        </button>
                                                        <button onClick={() => handleRequestAction(request._id, 'reject')} className="btn btn-secondary" style={{ color: 'var(--error)', borderColor: 'var(--error)' }}>
                                                            <XCircle size={18} /> Reject
                                                        </button>
                                                    </div>
                                                </div>

                                                <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)' }}>
                                                    <strong>Reason:</strong> {request.reason}
                                                </div>

                                                {request.requestedRole === 'recruiter' && (
                                                    <div style={{ marginTop: 'var(--space-md)', display: 'flex', gap: 'var(--space-lg)', fontSize: '0.9rem' }}>
                                                        {request.website && (
                                                            <a href={request.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
                                                                <ExternalLink size={14} /> Website
                                                            </a>
                                                        )}
                                                        {request.linkedin && (
                                                            <a href={request.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
                                                                <Linkedin size={14} /> LinkedIn
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {requests.filter(r => r.status === 'pending').length === 0 && <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>No pending requests.</div>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'drives' && (
                            <div className="fade-in">
                                <div className="glass-card" style={{ marginBottom: 'var(--space-lg)' }}>
                                    <h3 style={{ marginBottom: 'var(--space-md)' }}>Open New Recruitment Drive</h3>
                                    <form onSubmit={handleCreateDrive} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                        <div className="input-group">
                                            <label className="input-label">Company Name</label>
                                            <input type="text" className="input-field" value={newDrive.companyName} onChange={e => setNewDrive({ ...newDrive, companyName: e.target.value })} required />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Recruiter Email</label>
                                            <input type="email" className="input-field" value={newDrive.recruiterEmail} onChange={e => setNewDrive({ ...newDrive, recruiterEmail: e.target.value })} required />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Job Title</label>
                                            <input type="text" className="input-field" value={newDrive.jobTitle} onChange={e => setNewDrive({ ...newDrive, jobTitle: e.target.value })} required />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Graduation Year</label>
                                            <input type="text" className="input-field" placeholder="e.g. 2025" value={newDrive.graduationYear} onChange={e => setNewDrive({ ...newDrive, graduationYear: e.target.value })} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Start Date & Time</label>
                                            <input type="datetime-local" className="input-field" value={newDrive.applicationStartDate} onChange={e => setNewDrive({ ...newDrive, applicationStartDate: e.target.value })} required />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Registration Closing (Date & Time)</label>
                                            <input type="datetime-local" className="input-field" value={newDrive.applicationEndDate} onChange={e => setNewDrive({ ...newDrive, applicationEndDate: e.target.value })} required />
                                        </div>
                                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                            <label className="input-label">Job Description</label>
                                            <textarea className="input-field" style={{ minHeight: '80px' }} value={newDrive.jobDescription} onChange={e => setNewDrive({ ...newDrive, jobDescription: e.target.value })} required />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Eligible Departments (comma separated)</label>
                                            <input type="text" className="input-field" placeholder="CSE, ECE" value={newDrive.departments} onChange={e => setNewDrive({ ...newDrive, departments: e.target.value })} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Min Reputation Score</label>
                                            <input type="number" className="input-field" value={newDrive.minReputationScore} onChange={e => setNewDrive({ ...newDrive, minReputationScore: e.target.value })} />
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Launch Recruitment Drive</button>
                                        </div>
                                    </form>
                                </div>

                                <div className="glass-card">
                                    <h3 style={{ marginBottom: 'var(--space-md)' }}>Active & Past Drives</h3>
                                    <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                                        {drives.map(drive => (
                                            <div key={drive._id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                                <div className="glass-card" style={{ background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{drive.jobTitle}</div>
                                                        <div style={{ color: 'var(--primary)', fontWeight: 500 }}>{drive.companyName}</div>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                            Recipient: {drive.recruiterEmail} | Ends: {new Date(drive.applicationEndDate).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                                        <span className={`badge badge-${drive.status === 'open' ? 'verified' : 'rejected'}`}>
                                                            {drive.status.toUpperCase()}
                                                        </span>
                                                        <button
                                                            onClick={() => fetchApplicants(drive._id)}
                                                            className="btn btn-secondary"
                                                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                        >
                                                            {selectedDriveApplicants?.driveId === drive._id ? 'Hide Applicants' : 'View Applicants'}
                                                        </button>
                                                        <button
                                                            onClick={() => toggleDriveStatus(drive._id)}
                                                            className="btn btn-secondary"
                                                            style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--border)' }}
                                                        >
                                                            {drive.status === 'open' ? 'Close Drive' : 'Open Drive'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {selectedDriveApplicants?.driveId === drive._id && (
                                                    <div className="fade-in" style={{ padding: 'var(--space-md)', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                                        <h4 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>Registered Students</h4>
                                                        {selectedDriveApplicants.applicants.length > 0 ? (
                                                            <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                                                                {selectedDriveApplicants.applicants.map(app => (
                                                                    <div key={app._id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-sm)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                                                                        <div>
                                                                            <div style={{ fontWeight: 500 }}>{app.studentId.name}</div>
                                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{app.studentId.email}</div>
                                                                        </div>
                                                                        <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                                                                            <div>{app.studentId.department}</div>
                                                                            <div style={{ color: 'var(--text-secondary)' }}>Class of {app.studentId.academicYear}</div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No students registered yet.</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {drives.length === 0 && <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>No drives created yet.</div>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
