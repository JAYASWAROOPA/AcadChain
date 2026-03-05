import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Clock, CheckCircle, XCircle, BarChart2 } from 'lucide-react';
import api from '../utils/api';

export default function FacultyDashboard({ user, setUser }) {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        pending: 0,
        approvedToday: 0,
        rejectedToday: 0,
        total: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Get Pending
            const pendingRes = await api.get('/records/pending');
            const pendingCount = pendingRes.data.length;

            // Get History
            const historyRes = await api.get('/records/history');
            const history = historyRes.data;

            // Calculate Today's Stats
            const today = new Date().toDateString();
            const approvedToday = history.filter(r => r.status === 'verified' && new Date(r.updatedAt).toDateString() === today).length;
            const rejectedToday = history.filter(r => r.status === 'rejected' && new Date(r.updatedAt).toDateString() === today).length;

            setStats({
                pending: pendingCount,
                approvedToday,
                rejectedToday,
                total: history.length
            });
        } catch (err) {
            console.error(err);
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
                            Faculty Dashboard
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

                {/* Overview Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-2xl)' }}>
                    <div className="glass-card fade-in" style={{ textAlign: 'center' }}>
                        <Clock size={32} color="var(--accent)" style={{ margin: '0 auto var(--space-md)' }} />
                        <h3 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.pending}</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Pending Requests</p>
                    </div>
                    <div className="glass-card fade-in" style={{ textAlign: 'center' }}>
                        <CheckCircle size={32} color="var(--success)" style={{ margin: '0 auto var(--space-md)' }} />
                        <h3 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.approvedToday}</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Approved Today</p>
                    </div>
                    <div className="glass-card fade-in" style={{ textAlign: 'center' }}>
                        <XCircle size={32} color="var(--error)" style={{ margin: '0 auto var(--space-md)' }} />
                        <h3 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.rejectedToday}</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Rejected Today</p>
                    </div>
                    <div className="glass-card fade-in" style={{ textAlign: 'center' }}>
                        <BarChart2 size={32} color="var(--primary)" style={{ margin: '0 auto var(--space-md)' }} />
                        <h3 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total}</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Total Processed</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="glass-card fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 'var(--space-xs)' }}>
                                Verification Queue
                            </h2>
                            <p style={{ color: 'var(--text-secondary)' }}>Review and verify pending academic records from students.</p>
                        </div>
                        <button onClick={() => navigate('/faculty/pending')} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1.1rem' }}>
                            View Pending Requests
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
