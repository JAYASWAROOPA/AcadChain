import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';
import AccessDenied from './pages/AccessDenied';
import StudentUpload from './pages/StudentUpload';
import StudentRecords from './pages/StudentRecords';
import FacultyPending from './pages/FacultyPending';
import FacultyReview from './pages/FacultyReview';
import RecruiterStudentView from './pages/RecruiterStudentView';
import AdminUsers from './pages/AdminUsers';
import './index.css';

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const ProtectedRoute = ({ children, allowedRoles }) => {
        if (!user) return <Navigate to="/login" />;
        if (allowedRoles && !allowedRoles.includes(user.role)) {
            return <Navigate to="/login" />;
        }
        return children;
    };

    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login setUser={setUser} />} />
                <Route path="/403" element={<AccessDenied />} />
                <Route path="*" element={<NotFound />} />

                <Route path="/student/*" element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <Routes>
                            <Route path="dashboard" element={<StudentDashboard user={user} setUser={setUser} />} />
                            <Route path="upload" element={<StudentUpload />} />
                            <Route path="records" element={<StudentRecords user={user} />} />
                            <Route path="*" element={<Navigate to="dashboard" replace />} />
                        </Routes>
                    </ProtectedRoute>
                } />

                <Route path="/faculty/*" element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                        <Routes>
                            <Route path="dashboard" element={<FacultyDashboard user={user} setUser={setUser} />} />
                            <Route path="pending" element={<FacultyPending />} />
                            <Route path="review/:id" element={<FacultyReview />} />
                            <Route path="*" element={<Navigate to="dashboard" replace />} />
                        </Routes>
                    </ProtectedRoute>
                } />

                <Route path="/recruiter/*" element={
                    <ProtectedRoute allowedRoles={['recruiter']}>
                        <Routes>
                            <Route path="dashboard" element={<RecruiterDashboard user={user} setUser={setUser} />} />
                            <Route path="student/:id" element={<RecruiterStudentView />} />
                            <Route path="*" element={<Navigate to="dashboard" replace />} />
                        </Routes>
                    </ProtectedRoute>
                } />

                <Route path="/admin/*" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Routes>
                            <Route path="dashboard" element={<AdminDashboard user={user} setUser={setUser} />} />
                            <Route path="users" element={<AdminUsers />} />
                            <Route path="*" element={<Navigate to="dashboard" replace />} />
                        </Routes>
                    </ProtectedRoute>
                } />
            </Routes>
        </Router>
    );
}

export default App;
