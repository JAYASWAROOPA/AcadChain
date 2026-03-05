import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
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
            <div className="glass-card" style={{ textAlign: 'center', maxWidth: '500px' }}>
                <AlertCircle size={64} color="var(--error)" style={{ margin: '0 auto var(--space-lg)' }} />
                <h1 className="gradient-text" style={{ fontFamily: 'var(--font-display)', fontSize: '4rem', marginBottom: 'var(--space-md)' }}>404</h1>
                <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)' }}>Page Not Found</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>
                <button onClick={() => navigate('/')} className="btn btn-primary">
                    Return to Home
                </button>
            </div>
        </div>
    );
}
