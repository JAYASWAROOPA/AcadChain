import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function AccessDenied() {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            padding: 'var(--space-xl)'
        }}>
            <div className="glass-card" style={{ textAlign: 'center', maxWidth: '500px', borderColor: 'var(--error)' }}>
                <ShieldAlert size={64} color="var(--error)" style={{ margin: '0 auto var(--space-lg)' }} />
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', marginBottom: 'var(--space-md)', color: 'var(--error)' }}>Access Denied</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
                    You do not have permission to view this page. Please contact your administrator if you believe this is an error.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                    <button onClick={() => navigate(-1)} className="btn btn-secondary">
                        Go Back
                    </button>
                    <button onClick={() => navigate('/login')} className="btn btn-primary">
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
}
