import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, ArrowLeft } from 'lucide-react';
import api from '../utils/api';

export default function FacultyPending() {
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchName, setSearchName] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterDept, setFilterDept] = useState('');

    useEffect(() => {
        fetchPending();
    }, []);

    useEffect(() => {
        filterData();
    }, [searchName, filterType, filterDept, records]);

    const fetchPending = async () => {
        try {
            const { data } = await api.get('/records/pending');
            setRecords(data);
            setFilteredRecords(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filterData = () => {
        let result = records;
        if (searchName) {
            result = result.filter(r => r.studentId.name.toLowerCase().includes(searchName.toLowerCase()));
        }
        if (filterType) {
            result = result.filter(r => r.type === filterType);
        }
        if (filterDept) {
            result = result.filter(r => r.studentId.department && r.studentId.department.toLowerCase().includes(filterDept.toLowerCase()));
        }
        setFilteredRecords(result);
    };

    return (
        <div style={{ minHeight: '100vh', padding: 'var(--space-xl)', background: 'var(--bg-primary)' }}>
            <div className="container">
                <button
                    onClick={() => navigate('/faculty/dashboard')}
                    className="btn btn-secondary"
                    style={{ marginBottom: 'var(--space-lg)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)' }}
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                <div className="glass-card fade-in">
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 'var(--space-lg)' }}>
                        Pending Verifications
                    </h1>

                    {/* Filter Bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', padding: 'var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    className="input-field"
                                    style={{ paddingLeft: '40px' }}
                                    placeholder="Search Student Name"
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <select className="input-field" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                <option value="">All Record Types</option>
                                <option value="attendance">Attendance</option>
                                <option value="assignment">Assignment</option>
                                <option value="internship">Internship</option>
                                <option value="certification">Certification</option>
                                <option value="workshop">Workshop / Seminar</option>
                            </select>
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Filter Department"
                                value={filterDept}
                                onChange={(e) => setFilterDept(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>Loading pending records...</div>
                    ) : filteredRecords.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>No pending records found.</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ textAlign: 'left', padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>Student</th>
                                        <th style={{ textAlign: 'left', padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>Dept</th>
                                        <th style={{ textAlign: 'left', padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>Record Type</th>
                                        <th style={{ textAlign: 'left', padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>Details</th>
                                        <th style={{ textAlign: 'left', padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>Submitted</th>
                                        <th style={{ textAlign: 'right', padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.map(record => (
                                        <tr key={record._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: 'var(--space-md)', fontWeight: 600 }}>{record.studentId?.name}</td>
                                            <td style={{ padding: 'var(--space-md)' }}>{record.studentId?.department || '-'}</td>
                                            <td style={{ padding: 'var(--space-md)', textTransform: 'capitalize' }}>{record.type}</td>
                                            <td style={{ padding: 'var(--space-md)' }}>{record.data}</td>
                                            <td style={{ padding: 'var(--space-md)' }}>{new Date(record.createdAt).toLocaleDateString()}</td>
                                            <td style={{ padding: 'var(--space-md)', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => navigate(`/faculty/review/${record._id}`)}
                                                    className="btn btn-primary"
                                                    style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                                                >
                                                    Review
                                                </button>
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
