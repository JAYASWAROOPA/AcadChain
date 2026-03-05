import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Ban, ShieldCheck, UserCheck } from 'lucide-react';
import api from '../utils/api';

export default function AdminUsers() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users'); // Uses existing GET /api/users
            setUsers(data);
        } catch (err) {
            console.error(err);
            alert('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
        try {
            await api.delete(`/users/${id}`);
            setUsers(users.filter(u => u._id !== id));
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await api.patch(`/users/${id}/disable`);
            setUsers(users.map(u =>
                u._id === id ? { ...u, accountStatus: currentStatus === 'active' ? 'inactive' : 'active' } : u
            ));
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleChangeRole = async (id, newRole) => {
        try {
            await api.patch(`/users/${id}/role`, { role: newRole });
            setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u));
        } catch (err) {
            alert('Failed to update role');
        }
    };

    return (
        <div style={{ minHeight: '100vh', padding: 'var(--space-xl)', background: 'var(--bg-primary)' }}>
            <div className="container">
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="btn btn-secondary"
                    style={{ marginBottom: 'var(--space-lg)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)' }}
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                <div className="glass-card fade-in">
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 'var(--space-lg)' }}>
                        User Management
                    </h1>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>Loading users...</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ textAlign: 'left', padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>Name / Email</th>
                                        <th style={{ textAlign: 'left', padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>Role</th>
                                        <th style={{ textAlign: 'left', padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>Status</th>
                                        <th style={{ textAlign: 'right', padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user._id} style={{ borderBottom: '1px solid var(--border)', background: user.accountStatus === 'inactive' ? 'rgba(239, 68, 68, 0.05)' : 'transparent', opacity: user.accountStatus === 'inactive' ? 0.8 : 1 }}>
                                            <td style={{ padding: 'var(--space-md)' }}>
                                                <div style={{ fontWeight: 600, color: user.accountStatus === 'inactive' ? 'var(--error)' : 'inherit' }}>{user.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                                            </td>
                                            <td style={{ padding: 'var(--space-md)' }}>
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleChangeRole(user._id, e.target.value)}
                                                    className="input-field"
                                                    style={{ padding: '4px 8px', fontSize: '0.9rem', width: 'auto' }}
                                                >
                                                    <option value="student">Student</option>
                                                    <option value="faculty">Faculty</option>
                                                    <option value="recruiter">Recruiter</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: 'var(--space-md)' }}>
                                                <span className={`badge ${user.accountStatus === 'active' ? 'badge-verified' : 'badge-rejected'}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                                                    {user.accountStatus || 'active'}
                                                </span>
                                            </td>
                                            <td style={{ padding: 'var(--space-md)', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 'var(--space-xs)', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => handleToggleStatus(user._id, user.accountStatus || 'active')}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '6px', borderColor: user.accountStatus === 'active' ? 'var(--error)' : 'var(--success)', color: user.accountStatus === 'active' ? 'var(--error)' : 'var(--success)' }}
                                                        title={user.accountStatus === 'active' ? 'Disable Account' : 'Activate Account'}
                                                    >
                                                        {user.accountStatus === 'active' ? <Ban size={16} /> : <UserCheck size={16} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user._id)}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '6px', color: 'var(--error)', borderColor: 'var(--error)' }}
                                                        title="Delete User & All Records"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
