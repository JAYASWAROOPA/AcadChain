import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, Award, ArrowRight, Lock, Database } from 'lucide-react';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            {/* Navbar */}
            <nav style={{
                padding: 'var(--space-md) var(--space-xl)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                position: 'fixed',
                width: '100%',
                zIndex: 100,
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <Shield size={32} className="gradient-text" />
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-display)' }} className="gradient-text">
                        AcadChain
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                    <button onClick={() => navigate('/login')} className="btn btn-secondary">
                        Login
                    </button>
                    <button onClick={() => navigate('/register')} className="btn btn-primary">
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                padding: '160px var(--space-xl) 100px',
                textAlign: 'center',
                background: 'radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.15), transparent 60%)'
            }}>
                <div className="container">
                    <h1 className="gradient-text fade-in" style={{
                        fontSize: '4rem',
                        fontFamily: 'var(--font-display)',
                        marginBottom: 'var(--space-lg)',
                        lineHeight: 1.1
                    }}>
                        Verified Academic Records <br /> on the Blockchain
                    </h1>
                    <p style={{
                        fontSize: '1.25rem',
                        color: 'var(--text-secondary)',
                        maxWidth: '700px',
                        margin: '0 auto var(--space-2xl)',
                        lineHeight: 1.6
                    }} className="fade-in">
                        AcadChain allows students, faculties, and recruiters to issue, verify, and validate academic achievements with the immutable trust of blockchain technology.
                    </p>
                    <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-md)' }}>
                        <button
                            onClick={() => navigate('/register?role=student')}
                            className="btn btn-primary"
                            style={{ padding: '16px 32px', fontSize: '1.1rem' }}
                        >
                            Register as Student <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                            className="btn btn-secondary"
                            style={{ padding: '16px 32px', fontSize: '1.1rem' }}
                        >
                            Learn How It Works
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="how-it-works" style={{ padding: '100px var(--space-xl)', background: 'var(--bg-secondary)' }}>
                <div className="container">
                    <h2 style={{
                        textAlign: 'center',
                        fontSize: '2.5rem',
                        fontFamily: 'var(--font-display)',
                        marginBottom: 'var(--space-2xl)'
                    }}>
                        Why Choose AcadChain?
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-xl)' }}>
                        <FeatureCard
                            icon={<Lock size={40} color="var(--primary)" />}
                            title="Immutable Security"
                            description="Records are hashed and stored using blockchain technology, preventing any tampering or fraud."
                        />
                        <FeatureCard
                            icon={<CheckCircle size={40} color="var(--secondary)" />}
                            title="Instant Verification"
                            description="Recruiters and institutions can instantly verify the authenticity of a student's claims."
                        />
                        <FeatureCard
                            icon={<Award size={40} color="var(--accent)" />}
                            title="Reputation Scoring"
                            description="Our unique algorithm calculates a Student Reputation Score based on verified achievements."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{ padding: '100px var(--space-xl)', textAlign: 'center' }}>
                <div className="container glass-card" style={{ padding: 'var(--space-2xl)' }}>
                    <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', marginBottom: 'var(--space-md)' }}>
                        Ready to secure your future?
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)', fontSize: '1.1rem' }}>
                        Join thousands of students and institutions trusting AcadChain.
                    </p>
                    <button onClick={() => navigate('/register')} className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '1.2rem' }}>
                        Join the Network
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: 'var(--space-2xl) var(--space-xl)',
                background: 'var(--bg-tertiary)',
                borderTop: '1px solid var(--border)',
                textAlign: 'center',
                color: 'var(--text-muted)'
            }}>
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                        <Database size={24} />
                        <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-primary)' }}>AcadChain</span>
                    </div>
                    <p>&copy; {new Date().getFullYear()} AcadChain decentralized network. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }) {
    return (
        <div className="glass-card fade-in" style={{ padding: 'var(--space-xl)', textAlign: 'left' }}>
            <div style={{ marginBottom: 'var(--space-md)' }}>{icon}</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-sm)', fontFamily: 'var(--font-display)' }}>{title}</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{description}</p>
        </div>
    );
}
