import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Save, ArrowLeft, FileText, FileCheck, CheckCircle } from 'lucide-react';
import api from '../utils/api';

export default function StudentUpload() {
    const [formData, setFormData] = useState({
        type: 'attendance',
        data: '',
        semester: '',
        department: '',
        subject: '',
        maxScore: '',
        submissionDate: '',
        organization: '',
        role: '',
        duration: '',
        mode: 'offline',
        issuer: '',
        issueDate: '',
        certificateId: '',
        referenceUrl: '',
        description: ''
    });
    const [proofFile, setProofFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('File size exceeds 5MB limit');
                return;
            }
            setProofFile(file);
        }
    };

    const handleSubmit = async (mode) => {
        setLoading(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            if (proofFile) data.append('proofFile', proofFile);

            const endpoint = mode === 'draft' ? '/records/draft' : '/records/upload';
            await api.post(endpoint, data);

            setSuccess(true);
            setTimeout(() => navigate('/student/records'), 2000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit record');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', padding: 'var(--space-xl)', background: 'var(--bg-primary)' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <button
                    onClick={() => navigate('/student/dashboard')}
                    className="btn btn-secondary"
                    style={{ marginBottom: 'var(--space-lg)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)' }}
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                <div className="glass-card fade-in">
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <Upload size={32} color="var(--primary)" />
                        Upload Academic Record
                    </h1>

                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit('upload'); }}>
                        {/* Section 1: Classification */}
                        <div style={{ marginBottom: 'var(--space-xl)' }}>
                            <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                                1. Record Classification
                            </h3>
                            <div className="grid-2">
                                <div className="input-group">
                                    <label className="input-label">Record Type</label>
                                    <select name="type" className="input-field" value={formData.type} onChange={handleChange}>
                                        <option value="attendance">Attendance</option>
                                        <option value="assignment">Assignment</option>
                                        <option value="internship">Internship</option>
                                        <option value="certification">Certification</option>
                                        <option value="workshop">Workshop / Seminar</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Semester</label>
                                    <input type="text" name="semester" className="input-field" placeholder="e.g. Sem 5" value={formData.semester} onChange={handleChange} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Department</label>
                                    <input type="text" name="department" className="input-field" value={formData.department} onChange={handleChange} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Subject / Course Name</label>
                                    <input type="text" name="subject" className="input-field" value={formData.subject} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Performance Data */}
                        <div style={{ marginBottom: 'var(--space-xl)' }}>
                            <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                                2. Performance Details
                            </h3>

                            {/* Attendance Fields */}
                            {formData.type === 'attendance' && (
                                <div className="grid-2">
                                    <div className="input-group">
                                        <label className="input-label">Attendance Percentage</label>
                                        <input type="text" name="data" className="input-field" placeholder="e.g. 85%" value={formData.data} onChange={handleChange} required />
                                    </div>
                                </div>
                            )}

                            {/* Assignment Fields */}
                            {(formData.type === 'assignment') && (
                                <div className="grid-2">
                                    <div className="input-group">
                                        <label className="input-label">Score Obtained</label>
                                        <input type="text" name="data" className="input-field" placeholder="e.g. 25" value={formData.data} onChange={handleChange} required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Maximum Score</label>
                                        <input type="text" name="maxScore" className="input-field" placeholder="e.g. 30" value={formData.maxScore} onChange={handleChange} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Submission Date</label>
                                        <input type="date" name="submissionDate" className="input-field" value={formData.submissionDate} onChange={handleChange} />
                                    </div>
                                </div>
                            )}

                            {/* Internship Fields */}
                            {formData.type === 'internship' && (
                                <div className="grid-2">
                                    <div className="input-group">
                                        <label className="input-label">Company / Organization</label>
                                        <input type="text" name="data" className="input-field" placeholder="Company Name" value={formData.data} onChange={handleChange} required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Role / Position</label>
                                        <input type="text" name="role" className="input-field" value={formData.role} onChange={handleChange} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Duration</label>
                                        <input type="text" name="duration" className="input-field" placeholder="e.g. 8 weeks" value={formData.duration} onChange={handleChange} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Mode</label>
                                        <select name="mode" className="input-field" value={formData.mode} onChange={handleChange}>
                                            <option value="offline">Offline</option>
                                            <option value="online">Online</option>
                                            <option value="hybrid">Hybrid</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Certification/Workshop Fields */}
                            {(formData.type === 'certification' || formData.type === 'workshop') && (
                                <div className="grid-2">
                                    <div className="input-group">
                                        <label className="input-label">Title / Name</label>
                                        <input type="text" name="data" className="input-field" placeholder="e.g. AWS Cloud Practitioner" value={formData.data} onChange={handleChange} required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Issuing Organization</label>
                                        <input type="text" name="issuer" className="input-field" value={formData.issuer} onChange={handleChange} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Issue Date</label>
                                        <input type="date" name="issueDate" className="input-field" value={formData.issueDate} onChange={handleChange} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Credential ID</label>
                                        <input type="text" name="certificateId" className="input-field" value={formData.certificateId} onChange={handleChange} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 3: Proof & Declaration */}
                        <div style={{ marginBottom: 'var(--space-xl)' }}>
                            <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                                3. Evidence & Declaration
                            </h3>
                            <div className="grid-2">
                                <div className="input-group">
                                    <label className="input-label">Proof Document (PDF, JPG, PNG - Max 5MB)</label>
                                    <div style={{
                                        border: '2px dashed var(--border)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: 'var(--space-md)',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        background: proofFile ? 'rgba(16, 185, 129, 0.05)' : 'transparent'
                                    }}
                                        onClick={() => document.getElementById('file-upload').click()}
                                    >
                                        <input
                                            id="file-upload"
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                        />
                                        {proofFile ? (
                                            <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <FileCheck size={20} />
                                                <span>{proofFile.name} ({(proofFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                                            </div>
                                        ) : (
                                            <div style={{ color: 'var(--text-secondary)' }}>
                                                <Upload size={24} style={{ marginBottom: '8px' }} />
                                                <div>Click to upload proof document</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Reference URL (Optional)</label>
                                    <input type="text" name="referenceUrl" className="input-field" value={formData.referenceUrl} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Description / Notes</label>
                                <textarea name="description" className="input-field" rows="3" value={formData.description} onChange={handleChange}></textarea>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', marginTop: 'var(--space-md)' }}>
                                <input type="checkbox" required id="declaration" />
                                <label htmlFor="declaration" style={{ color: 'var(--text-secondary)' }}>
                                    I confirm that the information provided is accurate and verifiable.
                                </label>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => handleSubmit('draft')}
                                disabled={loading}
                            >
                                <Save size={18} />
                                {loading ? 'Saving...' : 'Save as Draft'}
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                                disabled={loading || !proofFile} // Disable submit if no file is selected
                            >
                                <Upload size={18} />
                                {loading ? 'Submitting...' : 'Submit for Verification'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
