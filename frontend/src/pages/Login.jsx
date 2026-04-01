import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Shield, ArrowRight, UserPlus, FileText } from 'lucide-react';
import api from '../utils/api';

export default function Login({ setUser }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [step, setStep] = useState('email'); // email, login, setup, request
    const [role, setRole] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [facultyList, setFacultyList] = useState([]);
    const [facultySearch, setFacultySearch] = useState('');

    // Access Request Fields (Recruiter Specific)
    const [requestData, setRequestData] = useState({
        requestedRole: 'student',
        companyName: '',
        website: '',
        linkedin: '',
        reason: ''
    });

    const [setupData, setSetupData] = useState({
        university: '',
        department: '',
        academicYear: '',
        mentorId: ''
    });

    const navigate = useNavigate();

    // Fetch faculty list when student setup is selected
    useEffect(() => {
        if (step === 'setup' && role === 'student') {
            fetchFacultyList();
        }
    }, [step, role]);

    const fetchFacultyList = async () => {
        try {
            const { data } = await api.get('/auth/faculty');
            setFacultyList(data);
        } catch (err) {
            console.error('Failed to fetch faculty:', err);
        }
    };

    const filteredFaculty = facultyList.filter(f =>
        f.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
        f.email.toLowerCase().includes(facultySearch.toLowerCase())
    );

    const handleCheckEmail = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/check-email', { email });
            if (data.exists) {
                setStep('login');
                setRole(data.role);
            } else if (data.whitelisted) {
                setStep('setup');
                setRole(data.role);
                if (data.role === 'student') {
                    setSetupData({
                        university: data.university || '',
                        department: data.department || '',
                        academicYear: data.academicYear || ''
                    });
                }
            } else {
                setStep('request');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            const roleRoutes = { student: '/student', faculty: '/faculty', recruiter: '/recruiter', admin: '/admin' };
            navigate(roleRoutes[data.role]);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSetup = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/setup-password', {
                email,
                password,
                name,
                university: setupData.university,
                department: setupData.department,
                academicYear: setupData.academicYear,
                mentorId: role === 'student' ? setupData.mentorId : undefined
            });
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            const roleRoutes = { student: '/student', faculty: '/faculty', recruiter: '/recruiter', admin: '/admin' };
            navigate(roleRoutes[data.role]);
        } catch (err) {
            setError(err.response?.data?.message || 'Setup failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestAccess = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/request-access', {
                email,
                name,
                ...requestData
            });
            setSuccess('Access request sent successfully! Admin will review it.');
            setTimeout(() => {
                setStep('email');
                setSuccess('');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Request failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at top right, rgba(124, 58, 237, 0.15), transparent 50%), radial-gradient(circle at bottom left, rgba(219, 39, 119, 0.15), transparent 50%)'
        }}>
            <div className="glass-card fade-in" style={{ maxWidth: step === 'request' ? '500px' : '420px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--space-md)',
                        boxShadow: 'var(--shadow-glow)'
                    }}>
                        <Shield size={32} color="white" />
                    </div>
                </div>

                {step === 'email' && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                            <h1 className="gradient-text" style={{ fontSize: '1.75rem', marginBottom: 'var(--space-xs)' }}>Sign In</h1>
                            <p style={{ color: 'var(--text-secondary)' }}>Enter your email to continue</p>
                        </div>
                        <form onSubmit={handleCheckEmail}>
                            <div className="input-group">
                                <label className="input-label">Email</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="you@university.edu"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                                {loading ? 'Checking...' : 'Continue'}
                                <ArrowRight size={18} />
                            </button>
                        </form>
                    </>
                )}

                {step === 'login' && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                            <h1 className="gradient-text" style={{ fontSize: '1.75rem', marginBottom: 'var(--space-xs)' }}>Welcome Back</h1>
                            <p style={{ color: 'var(--text-secondary)' }}>Sign in to your {role} account</p>
                        </div>
                        <form onSubmit={handleLogin}>
                            <div className="input-group">
                                <label className="input-label">Email</label>
                                <input type="email" className="input-field" value={email} disabled />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                                <LogIn size={18} />
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                            <button type="button" className="btn" style={{ width: '100%', marginTop: 'var(--space-sm)', border: 'none' }} onClick={() => setStep('email')}>
                                Back
                            </button>
                        </form>
                    </>
                )}

                {step === 'setup' && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                            <h1 className="gradient-text" style={{ fontSize: '1.75rem', marginBottom: 'var(--space-xs)' }}>Account Setup</h1>
                            <p style={{ color: 'var(--text-secondary)' }}>Finish setting up your {role} profile</p>
                        </div>
                        <form onSubmit={handleSetup}>
                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="John Doe"
                                    autoFocus
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Create a password"
                                />
                            </div>

                            {role === 'student' && (
                                <>
                                    <div className="input-group">
                                        <label className="input-label">University</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={setupData.university}
                                            onChange={(e) => setSetupData({ ...setupData, university: e.target.value })}
                                            required
                                            placeholder="e.g. BIT"
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                        <div className="input-group">
                                            <label className="input-label">Department</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={setupData.department}
                                                onChange={(e) => setSetupData({ ...setupData, department: e.target.value })}
                                                required
                                                placeholder="e.g. ECE"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Current Year</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={setupData.academicYear}
                                                onChange={(e) => setSetupData({ ...setupData, academicYear: e.target.value })}
                                                required
                                                placeholder="e.g. 3rd Year"
                                            />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Faculty Mentor *</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Search faculty member..."
                                            value={facultySearch}
                                            onChange={(e) => setFacultySearch(e.target.value)}
                                        />
                                        {facultySearch && filteredFaculty.length > 0 && (
                                            <div style={{
                                                marginTop: 'var(--space-sm)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius-md)',
                                                maxHeight: '200px',
                                                overflowY: 'auto',
                                                background: 'rgba(255, 255, 255, 0.05)'
                                            }}>
                                                {filteredFaculty.map((faculty) => (
                                                    <div
                                                        key={faculty._id}
                                                        onClick={() => {
                                                            setSetupData({ ...setupData, mentorId: faculty._id });
                                                            setFacultySearch(faculty.name);
                                                        }}
                                                        style={{
                                                            padding: 'var(--space-sm)',
                                                            borderBottom: '1px solid var(--border)',
                                                            cursor: 'pointer',
                                                            transition: 'background 0.2s',
                                                            backgroundColor: setupData.mentorId === faculty._id ? 'rgba(124, 58, 237, 0.1)' : 'transparent'
                                                        }}
                                                        onHover={(e) => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.05)'}
                                                    >
                                                        <div style={{ fontWeight: '500', marginBottom: '2px' }}>{faculty.name}</div>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                            {faculty.department} • {faculty.email}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {setupData.mentorId && (
                                            <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', background: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}>
                                                ✓ Mentor selected: {facultySearch}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                                <UserPlus size={18} />
                                {loading ? 'Creating...' : 'Setup Account'}
                            </button>
                        </form>
                    </>
                )}

                {step === 'request' && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                            <h1 className="gradient-text" style={{ fontSize: '1.75rem', marginBottom: 'var(--space-xs)' }}>Request Access</h1>
                            <p style={{ color: 'var(--text-secondary)' }}>You are not whitelisted. Request access from admin.</p>
                        </div>
                        {success ? (
                            <div style={{ padding: 'var(--space-lg)', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)', color: 'var(--success)', textAlign: 'center' }}>
                                {success}
                            </div>
                        ) : (
                            <form onSubmit={handleRequestAccess}>
                                <div className="input-group">
                                    <label className="input-label">Name</label>
                                    <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Requested Role</label>
                                    <select
                                        className="input-field"
                                        value={requestData.requestedRole}
                                        onChange={(e) => setRequestData({ ...requestData, requestedRole: e.target.value })}
                                    >
                                        <option value="student">Student</option>
                                        <option value="faculty">Faculty</option>
                                        <option value="recruiter">Recruiter</option>
                                    </select>
                                </div>

                                {requestData.requestedRole === 'recruiter' && (
                                    <>
                                        <div className="input-group">
                                            <label className="input-label">Company Name</label>
                                            <input type="text" className="input-field" value={requestData.companyName} onChange={(e) => setRequestData({ ...requestData, companyName: e.target.value })} required />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Official Website</label>
                                            <input type="url" className="input-field" value={requestData.website} onChange={(e) => setRequestData({ ...requestData, website: e.target.value })} placeholder="https://company.com" />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">LinkedIn Profile</label>
                                            <input type="url" className="input-field" value={requestData.linkedin} onChange={(e) => setRequestData({ ...requestData, linkedin: e.target.value })} placeholder="https://linkedin.com/company/..." />
                                        </div>
                                    </>
                                )}

                                <div className="input-group">
                                    <label className="input-label">Reason for Access</label>
                                    <textarea
                                        className="input-field"
                                        style={{ minHeight: '80px', paddingTop: '10px' }}
                                        value={requestData.reason}
                                        onChange={(e) => setRequestData({ ...requestData, reason: e.target.value })}
                                        required
                                        placeholder="Briefly explain why you need access"
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                                    <FileText size={18} />
                                    {loading ? 'Sending...' : 'Send Request'}
                                </button>
                                <button type="button" className="btn" style={{ width: '100%', marginTop: 'var(--space-sm)', border: 'none' }} onClick={() => setStep('email')}>
                                    Cancel
                                </button>
                            </form>
                        )}
                    </>
                )}

                {error && (
                    <div style={{
                        padding: 'var(--space-sm)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--error)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--error)',
                        marginTop: 'var(--space-lg)',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
