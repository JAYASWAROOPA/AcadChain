import { useState } from 'react';
import { X, Save } from 'lucide-react';
import api from '../utils/api';

export default function ProfileModal({ user, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        name: user.name,
        university: user.university || '',
        department: user.department || '',
        enrollmentNumber: user.enrollmentNumber || '',
        academicYear: user.academicYear || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.patch('/users/profile', formData);
            onUpdate(data);
            onClose();
        } catch (err) {
            alert('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: 'var(--space-lg)', position: 'relative' }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                    <X size={20} />
                </button>

                <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-lg)' }}>Edit Profile</h2>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Full Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">University / Institution</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.university}
                            onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Department</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        />
                    </div>
                    <div className="grid-2">
                        <div className="input-group">
                            <label className="input-label">Enrollment No.</label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.enrollmentNumber}
                                onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Academic Year</label>
                            <select
                                className="input-field"
                                value={formData.academicYear}
                                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                            >
                                <option value="">Select Year</option>
                                <option value="1st Year">1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}
