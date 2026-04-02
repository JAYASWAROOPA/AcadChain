import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  BarChart2,
  Search,
  ChevronDown,
  Zap,
  AlertCircle,
  Users,
  Building2,
  ChevronUp,
  Check,
  Download,
  FileText,
  History,
} from "lucide-react";
import api from "../utils/api";

export default function FacultyDashboard({ user, setUser }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("verification"); // 'verification', 'mentees', 'recruitment'
  const [stats, setStats] = useState({
    pending: 0,
    approvedToday: 0,
    rejectedToday: 0,
    total: 0,
  });
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [loading, setLoading] = useState(false);
  const [drives, setDrives] = useState([]);
  const [expandedDriveId, setExpandedDriveId] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [remarks, setRemarks] = useState([]);
  const [showRemarkForm, setShowRemarkForm] = useState(false);
  const [remarkForm, setRemarkForm] = useState({
    type: 'feedback',
    title: '',
    content: '',
    isPrivate: false,
    priority: 'medium'
  });

  useEffect(() => {
    fetchStats();
    fetchMyStudents();
    fetchMyDrives();
  }, []);

  const fetchMyDrives = async () => {
    try {
      const { data } = await api.get('/recruitment/mentor-view');
      setDrives(data);
    } catch (err) {
      console.error("Failed to fetch mentor drives:", err);
    }
  };

  const fetchStats = async () => {
    try {
      // Get Pending
      const pendingRes = await api.get("/records/pending");
      const pendingCount = pendingRes.data.length;

      // Get History
      const historyRes = await api.get("/records/history");
      const history = historyRes.data;

      // Calculate Today's Stats
      const today = new Date().toDateString();
      const approvedToday = history.filter(
        (r) =>
          r.status === "verified" &&
          new Date(r.updatedAt).toDateString() === today,
      ).length;
      const rejectedToday = history.filter(
        (r) =>
          r.status === "rejected" &&
          new Date(r.updatedAt).toDateString() === today,
      ).length;

      setStats({
        pending: pendingCount,
        approvedToday,
        rejectedToday,
        total: history.length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyStudents = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/users/faculty/my-students", {
        params: { search: searchQuery, department: filterDept },
      });
      setStudents(data);
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetail = async (studentId) => {
    try {
      const { data } = await api.get(
        `/users/faculty/student-detail/${studentId}`,
      );
      setStudentDetail(data);
      setSelectedStudent(studentId);
      setShowTimeline(false); // Reset timeline when switching students
      fetchRemarks(studentId); // Fetch remarks for this student
    } catch (err) {
      console.error("Failed to fetch student detail:", err);
    }
  };

  const generateReport = async (studentId) => {
    try {
      const response = await api.get(`/reports/student/${studentId}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `student_report_${studentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate report:", err);
      alert("Failed to generate report. Please try again.");
    }
  };

  const fetchTimeline = async (studentId) => {
    try {
      const { data } = await api.get(`/reports/timeline/${studentId}`);
      setTimelineData(data);
      setShowTimeline(true);
    } catch (err) {
      console.error("Failed to fetch timeline:", err);
      alert("Failed to load timeline. Please try again.");
    }
  };

  const fetchRemarks = async (studentId) => {
    try {
      const { data } = await api.get(`/users/faculty/remarks/${studentId}`);
      setRemarks(data);
    } catch (err) {
      console.error("Failed to fetch remarks:", err);
    }
  };

  const submitRemark = async (studentId) => {
    try {
      await api.post(`/users/faculty/remark/${studentId}`, remarkForm);
      setRemarkForm({
        type: 'feedback',
        title: '',
        content: '',
        isPrivate: false,
        priority: 'medium'
      });
      setShowRemarkForm(false);
      fetchRemarks(studentId); // Refresh remarks
    } catch (err) {
      console.error("Failed to submit remark:", err);
      alert("Failed to submit remark. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const getStatusColor = (status) => {
    if (status === "Excellent") return "var(--success)";
    if (status === "Good") return "var(--accent)";
    if (status === "Needs Attention") return "var(--error)";
    return "var(--text-secondary)";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "var(--space-xl)",
        background: "var(--bg-primary)",
      }}
    >
      <div className="container">
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--space-2xl)",
          }}
        >
          <div>
            <h1
              className="gradient-text"
              style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem" }}
            >
              Faculty Dashboard
            </h1>
            <p
              style={{
                color: "var(--text-secondary)",
                marginTop: "var(--space-xs)",
              }}
            >
              Welcome, {user.name}
            </p>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {/* Stats Overview */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "var(--space-xl)",
            marginBottom: "var(--space-2xl)",
          }}
        >
          <div className="glass-card fade-in" style={{ textAlign: "center" }}>
            <Clock
              size={32}
              color="var(--accent)"
              style={{ margin: "0 auto var(--space-md)" }}
            />
            <h3 style={{ fontSize: "2rem", fontWeight: "bold" }}>
              {stats.pending}
            </h3>
            <p style={{ color: "var(--text-secondary)" }}>Pending Requests</p>
          </div>
          <div className="glass-card fade-in" style={{ textAlign: "center" }}>
            <CheckCircle
              size={32}
              color="var(--success)"
              style={{ margin: "0 auto var(--space-md)" }}
            />
            <h3 style={{ fontSize: "2rem", fontWeight: "bold" }}>
              {stats.approvedToday}
            </h3>
            <p style={{ color: "var(--text-secondary)" }}>Approved Today</p>
          </div>
          <div className="glass-card fade-in" style={{ textAlign: "center" }}>
            <XCircle
              size={32}
              color="var(--error)"
              style={{ margin: "0 auto var(--space-md)" }}
            />
            <h3 style={{ fontSize: "2rem", fontWeight: "bold" }}>
              {stats.rejectedToday}
            </h3>
            <p style={{ color: "var(--text-secondary)" }}>Rejected Today</p>
          </div>
          <div className="glass-card fade-in" style={{ textAlign: "center" }}>
            <Users
              size={32}
              color="var(--primary)"
              style={{ margin: "0 auto var(--space-md)" }}
            />
            <h3 style={{ fontSize: "2rem", fontWeight: "bold" }}>
              {students.length}
            </h3>
            <p style={{ color: "var(--text-secondary)" }}>Assigned Students</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-card fade-in">
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border)",
              marginBottom: "var(--space-lg)",
            }}
          >
            <button
              onClick={() => setTab("verification")}
              style={{
                padding: "var(--space-md) var(--space-lg)",
                borderBottom:
                  tab === "verification" ? "3px solid var(--primary)" : "none",
                background: "transparent",
                color:
                  tab === "verification"
                    ? "var(--primary)"
                    : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: tab === "verification" ? "600" : "400",
                transition: "all 0.3s",
              }}
            >
              <Clock
                size={18}
                style={{
                  display: "inline-block",
                  marginRight: "var(--space-xs)",
                }}
              />
              Verification Queue
            </button>
            <button
              onClick={() => setTab("mentees")}
              style={{
                padding: "var(--space-md) var(--space-lg)",
                borderBottom:
                  tab === "mentees" ? "3px solid var(--primary)" : "none",
                background: "transparent",
                color:
                  tab === "mentees"
                    ? "var(--primary)"
                    : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: tab === "mentees" ? "600" : "400",
                transition: "all 0.3s",
              }}
            >
              <Users
                size={18}
                style={{
                  display: "inline-block",
                  marginRight: "var(--space-xs)",
                }}
              />
              My Students ({students.length})
            </button>
            <button
              onClick={() => setTab("recruitment")}
              style={{
                padding: "var(--space-md) var(--space-lg)",
                borderBottom:
                  tab === "recruitment" ? "3px solid var(--primary)" : "none",
                background: "transparent",
                color:
                  tab === "recruitment"
                    ? "var(--primary)"
                    : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: tab === "recruitment" ? "600" : "400",
                transition: "all 0.3s",
              }}
            >
              <Building2
                size={18}
                style={{
                  display: "inline-block",
                  marginRight: "var(--space-xs)",
                }}
              />
              Recruitment Drives
            </button>
          </div>

          {/* Verification Queue Tab */}
          {tab === "verification" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.5rem",
                      marginBottom: "var(--space-xs)",
                    }}
                  >
                    Verification Queue
                  </h2>
                  <p style={{ color: "var(--text-secondary)" }}>
                    Review and verify pending academic records from students.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/faculty/pending")}
                  className="btn btn-primary"
                  style={{ padding: "12px 24px", fontSize: "1.1rem" }}
                >
                  View Pending Requests
                </button>
              </div>
            </div>
          )}

          {/* My Students Tab */}
          {tab === "mentees" && (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: selectedStudent ? "1fr 1fr" : "1fr",
                  gap: "var(--space-lg)",
                }}
              >
                {/* Students List */}
                <div>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.5rem",
                      marginBottom: "var(--space-lg)",
                    }}
                  >
                    My Mentees
                  </h2>

                  {/* Search & Filter */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "var(--space-md)",
                      marginBottom: "var(--space-lg)",
                    }}
                  >
                    <div className="input-group">
                      <label className="input-label">Search by Name</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Department</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Filter by department..."
                        value={filterDept}
                        onChange={(e) => setFilterDept(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    onClick={fetchMyStudents}
                    className="btn btn-primary"
                    style={{ width: "100%", marginBottom: "var(--space-lg)" }}
                    disabled={loading}
                  >
                    {loading ? "Searching..." : "Search"}
                  </button>

                  {/* Students Cards */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-md)",
                    }}
                  >
                    {students.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "var(--space-2xl)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        No students found
                      </div>
                    ) : (
                      students.map((student) => (
                        <div
                          key={student._id}
                          onClick={() => fetchStudentDetail(student._id)}
                          style={{
                            padding: "var(--space-lg)",
                            border:
                              selectedStudent === student._id
                                ? "2px solid var(--primary)"
                                : "1px solid var(--border)",
                            borderRadius: "var(--radius-lg)",
                            cursor: "pointer",
                            transition: "all 0.3s",
                            background:
                              selectedStudent === student._id
                                ? "rgba(124, 58, 237, 0.05)"
                                : "rgba(255, 255, 255, 0.02)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "var(--space-xs)",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(124, 58, 237, 0.08)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              selectedStudent === student._id
                                ? "rgba(124, 58, 237, 0.05)"
                                : "rgba(255, 255, 255, 0.02)")
                          }
                        >
                          <div style={{ flex: 1 }}>
                            <h3
                              style={{
                                fontWeight: "600",
                                marginBottom: "var(--space-xs)",
                              }}
                            >
                              {student.name}
                            </h3>
                            <div
                              style={{
                                fontSize: "0.9rem",
                                color: "var(--text-secondary)",
                                display: "flex",
                                gap: "var(--space-lg)",
                              }}
                            >
                              <span>{student.department}</span>
                              <span>{student.academicYear}</span>
                            </div>
                            <div
                              style={{
                                marginTop: "var(--space-sm)",
                                display: "flex",
                                gap: "var(--space-md)",
                              }}
                            >
                              <div>
                                <span
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  Rep:
                                </span>
                                <span
                                  style={{
                                    fontWeight: "600",
                                    marginLeft: "var(--space-xs)",
                                  }}
                                >
                                  {student.reputation}
                                </span>
                              </div>
                              <div>
                                <span
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  Submissions:
                                </span>
                                <span
                                  style={{
                                    fontWeight: "600",
                                    marginLeft: "var(--space-xs)",
                                  }}
                                >
                                  {student.submissions.total}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div
                              style={{
                                padding: "var(--space-sm) var(--space-md)",
                                borderRadius: "var(--radius-md)",
                                background:
                                  getStatusColor(student.status) + "20",
                                color: getStatusColor(student.status),
                                fontWeight: "600",
                                fontSize: "0.9rem",
                              }}
                            >
                              {student.status}
                            </div>
                            <ChevronDown
                              size={20}
                              style={{
                                marginTop: "var(--space-sm)",
                                color: "var(--text-secondary)",
                              }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Student Detail Card */}
                {selectedStudent && studentDetail && (
                  <div
                    className="glass-card fade-in"
                    style={{ maxHeight: "600px", overflowY: "auto" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" }}>
                      <h2
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "1.5rem",
                          margin: 0,
                        }}
                      >
                        {studentDetail.student.name}
                      </h2>
                      <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                        <button
                          onClick={() => generateReport(selectedStudent)}
                          className="btn btn-primary"
                          style={{ padding: "8px 16px", fontSize: "0.9rem" }}
                        >
                          <Download size={16} style={{ marginRight: "var(--space-xs)" }} />
                          Generate Report
                        </button>
                        <button
                          onClick={() => fetchTimeline(selectedStudent)}
                          className="btn btn-secondary"
                          style={{ padding: "8px 16px", fontSize: "0.9rem" }}
                        >
                          <History size={16} style={{ marginRight: "var(--space-xs)" }} />
                          View Timeline
                        </button>
                      </div>
                    </div>

                    {/* Mentor Alerts */}
                    {studentDetail.mentorAlerts.length > 0 && (
                      <div
                        style={{
                          marginBottom: "var(--space-lg)",
                          padding: "var(--space-lg)",
                          background: "rgba(239, 68, 68, 0.1)",
                          borderRadius: "var(--radius-lg)",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "var(--space-sm)",
                            color: "var(--error)",
                          }}
                        >
                          <AlertCircle
                            size={20}
                            style={{ marginRight: "var(--space-sm)" }}
                          />
                          <span style={{ fontWeight: "600" }}>
                            Mentor Insights
                          </span>
                        </div>
                        <ul
                          style={{
                            marginLeft: "var(--space-lg)",
                            color: "var(--error)",
                            opacity: 0.9,
                          }}
                        >
                          {studentDetail.mentorAlerts.map((alert, i) => (
                            <li
                              key={i}
                              style={{ marginBottom: "var(--space-xs)" }}
                            >
                              • {alert}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Reputation */}
                    <div style={{ marginBottom: "var(--space-lg)" }}>
                      <label
                        style={{
                          display: "block",
                          fontWeight: "600",
                          marginBottom: "var(--space-md)",
                        }}
                      >
                        Reputation Score
                      </label>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--space-md)",
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            background: "rgba(255, 255, 255, 0.05)",
                            borderRadius: "var(--radius-lg)",
                            overflow: "hidden",
                            height: "20px",
                          }}
                        >
                          <div
                            style={{
                              width: `${(studentDetail.reputation.score / 100) * 100}%`,
                              background:
                                "linear-gradient(90deg, var(--primary), var(--secondary))",
                              height: "100%",
                            }}
                          ></div>
                        </div>
                        <span style={{ fontWeight: "600", minWidth: "50px" }}>
                          {studentDetail.reputation.score}/100
                        </span>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div style={{ marginBottom: "var(--space-lg)" }}>
                      <label
                        style={{
                          display: "block",
                          fontWeight: "600",
                          marginBottom: "var(--space-md)",
                        }}
                      >
                        Submission Statistics
                      </label>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "var(--space-md)",
                        }}
                      >
                        <div
                          style={{
                            padding: "var(--space-md)",
                            background: "rgba(34, 197, 94, 0.1)",
                            borderRadius: "var(--radius-md)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.9rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            Approved
                          </div>
                          <div
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: "600",
                              color: "var(--success)",
                            }}
                          >
                            {studentDetail.statistics.approved}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "var(--space-md)",
                            background: "rgba(239, 68, 68, 0.1)",
                            borderRadius: "var(--radius-md)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.9rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            Rejected
                          </div>
                          <div
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: "600",
                              color: "var(--error)",
                            }}
                          >
                            {studentDetail.statistics.rejected}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "var(--space-md)",
                            background: "rgba(251, 146, 60, 0.1)",
                            borderRadius: "var(--radius-md)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.9rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            Pending
                          </div>
                          <div
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: "600",
                              color: "var(--accent)",
                            }}
                          >
                            {studentDetail.statistics.pending}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "var(--space-md)",
                            background: "rgba(124, 58, 237, 0.1)",
                            borderRadius: "var(--radius-md)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.9rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            Rejection Rate
                          </div>
                          <div
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: "600",
                              color: "var(--primary)",
                            }}
                          >
                            {studentDetail.statistics.rejectionRate}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Achievements */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontWeight: "600",
                          marginBottom: "var(--space-md)",
                        }}
                      >
                        Achievements
                      </label>
                      {studentDetail.achievements.internships.length > 0 && (
                        <div style={{ marginBottom: "var(--space-lg)" }}>
                          <h4
                            style={{
                              fontSize: "0.95rem",
                              fontWeight: "600",
                              marginBottom: "var(--space-md)",
                              color: "var(--primary)",
                            }}
                          >
                            <Zap
                              size={16}
                              style={{
                                display: "inline-block",
                                marginRight: "var(--space-xs)",
                              }}
                            />
                            Internships (
                            {studentDetail.achievements.internships.length})
                          </h4>
                          {studentDetail.achievements.internships.map(
                            (intern, i) => (
                              <div
                                key={i}
                                style={{
                                  padding: "var(--space-sm)",
                                  marginBottom: "var(--space-sm)",
                                  background: "rgba(124, 58, 237, 0.05)",
                                  borderRadius: "var(--radius-md)",
                                }}
                              >
                                <div style={{ fontWeight: "500" }}>
                                  {intern.organization} - {intern.role}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.85rem",
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  {intern.duration}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                      {studentDetail.achievements.certifications.length > 0 && (
                        <div>
                          <h4
                            style={{
                              fontSize: "0.95rem",
                              fontWeight: "600",
                              marginBottom: "var(--space-md)",
                              color: "var(--success)",
                            }}
                          >
                            Certifications (
                            {studentDetail.achievements.certifications.length})
                          </h4>
                          {studentDetail.achievements.certifications.map(
                            (cert, i) => (
                              <div
                                key={i}
                                style={{
                                  padding: "var(--space-sm)",
                                  marginBottom: "var(--space-sm)",
                                  background: "rgba(34, 197, 94, 0.05)",
                                  borderRadius: "var(--radius-md)",
                                }}
                              >
                                <div style={{ fontWeight: "500" }}>
                                  {cert.issuer}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.85rem",
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  ID: {cert.certificateId}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timeline View */}
                    {showTimeline && timelineData && (
                      <div style={{ marginTop: "var(--space-lg)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)" }}>
                          <h3 style={{ fontSize: "1.2rem", fontWeight: "600", margin: 0 }}>
                            <History size={18} style={{ display: "inline-block", marginRight: "var(--space-sm)" }} />
                            Activity Timeline
                          </h3>
                          <button
                            onClick={() => setShowTimeline(false)}
                            style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
                          >
                            ✕
                          </button>
                        </div>
                        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                          {timelineData.timeline.length === 0 ? (
                            <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "var(--space-lg)" }}>
                              No activity yet
                            </p>
                          ) : (
                            timelineData.timeline.map((event, index) => (
                              <div
                                key={index}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  padding: "var(--space-md)",
                                  marginBottom: "var(--space-sm)",
                                  background: "rgba(255, 255, 255, 0.02)",
                                  borderRadius: "var(--radius-md)",
                                  borderLeft: `4px solid ${event.statusColor}`
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: "var(--space-xs)" }}>
                                    <span
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: "10px",
                                        fontSize: "0.75rem",
                                        fontWeight: "600",
                                        background: event.statusColor + "20",
                                        color: event.statusColor
                                      }}
                                    >
                                      {event.type}
                                    </span>
                                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                      {new Date(event.date).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <h4 style={{ margin: "var(--space-xs) 0", fontSize: "0.95rem", fontWeight: "600" }}>
                                    {event.title}
                                  </h4>
                                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                    {event.description}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mentor Remarks */}
                    <div style={{ marginTop: "var(--space-lg)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)" }}>
                        <h3 style={{ fontSize: "1.2rem", fontWeight: "600", margin: 0 }}>
                          <FileText size={18} style={{ display: "inline-block", marginRight: "var(--space-sm)" }} />
                          Mentor Remarks ({remarks.length})
                        </h3>
                        <button
                          onClick={() => setShowRemarkForm(!showRemarkForm)}
                          className="btn btn-secondary"
                          style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                        >
                          {showRemarkForm ? 'Cancel' : '+ Add Remark'}
                        </button>
                      </div>

                      {/* Add Remark Form */}
                      {showRemarkForm && (
                        <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "var(--space-md)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-md)" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)", marginBottom: "var(--space-md)" }}>
                            <div className="input-group">
                              <label className="input-label">Type</label>
                              <select
                                className="input-field"
                                value={remarkForm.type}
                                onChange={(e) => setRemarkForm({...remarkForm, type: e.target.value})}
                              >
                                <option value="feedback">Feedback</option>
                                <option value="warning">Warning</option>
                                <option value="praise">Praise</option>
                                <option value="suggestion">Suggestion</option>
                              </select>
                            </div>
                            <div className="input-group">
                              <label className="input-label">Priority</label>
                              <select
                                className="input-field"
                                value={remarkForm.priority}
                                onChange={(e) => setRemarkForm({...remarkForm, priority: e.target.value})}
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                            </div>
                          </div>
                          <div className="input-group" style={{ marginBottom: "var(--space-md)" }}>
                            <label className="input-label">Title</label>
                            <input
                              type="text"
                              className="input-field"
                              value={remarkForm.title}
                              onChange={(e) => setRemarkForm({...remarkForm, title: e.target.value})}
                              placeholder="Brief title for the remark"
                            />
                          </div>
                          <div className="input-group" style={{ marginBottom: "var(--space-md)" }}>
                            <label className="input-label">Content</label>
                            <textarea
                              className="input-field"
                              rows="3"
                              value={remarkForm.content}
                              onChange={(e) => setRemarkForm({...remarkForm, content: e.target.value})}
                              placeholder="Detailed feedback or remark"
                            />
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", fontSize: "0.9rem" }}>
                              <input
                                type="checkbox"
                                checked={remarkForm.isPrivate}
                                onChange={(e) => setRemarkForm({...remarkForm, isPrivate: e.target.checked})}
                              />
                              Private (only visible to you and admin)
                            </label>
                            <button
                              onClick={() => submitRemark(selectedStudent)}
                              className="btn btn-primary"
                              style={{ padding: "8px 16px", fontSize: "0.9rem" }}
                              disabled={!remarkForm.title || !remarkForm.content}
                            >
                              Submit Remark
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Remarks List */}
                      <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                        {remarks.length === 0 ? (
                          <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "var(--space-lg)" }}>
                            No remarks yet
                          </p>
                        ) : (
                          remarks.map((remark) => (
                            <div
                              key={remark._id}
                              style={{
                                padding: "var(--space-md)",
                                marginBottom: "var(--space-sm)",
                                background: "rgba(255, 255, 255, 0.02)",
                                borderRadius: "var(--radius-md)",
                                borderLeft: `4px solid ${
                                  remark.priority === 'high' ? 'var(--error)' :
                                  remark.priority === 'medium' ? 'var(--accent)' : 'var(--success)'
                                }`
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-xs)" }}>
                                <div>
                                  <span
                                    style={{
                                      padding: "2px 8px",
                                      borderRadius: "10px",
                                      fontSize: "0.75rem",
                                      fontWeight: "600",
                                      background: remark.type === 'praise' ? 'rgba(34, 197, 94, 0.2)' :
                                                 remark.type === 'warning' ? 'rgba(239, 68, 68, 0.2)' :
                                                 remark.type === 'suggestion' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(124, 58, 237, 0.2)',
                                      color: remark.type === 'praise' ? 'var(--success)' :
                                             remark.type === 'warning' ? 'var(--error)' :
                                             remark.type === 'suggestion' ? 'var(--accent)' : 'var(--primary)'
                                    }}
                                  >
                                    {remark.type}
                                  </span>
                                  {remark.isPrivate && (
                                    <span
                                      style={{
                                        padding: "2px 6px",
                                        borderRadius: "8px",
                                        fontSize: "0.7rem",
                                        fontWeight: "600",
                                        background: "rgba(239, 68, 68, 0.1)",
                                        color: "var(--error)",
                                        marginLeft: "var(--space-xs)"
                                      }}
                                    >
                                      PRIVATE
                                    </span>
                                  )}
                                </div>
                                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                  {new Date(remark.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <h4 style={{ margin: "var(--space-xs) 0", fontSize: "0.95rem", fontWeight: "600" }}>
                                {remark.title}
                              </h4>
                              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                {remark.content}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recruitment Drives Tab */}
          {tab === "recruitment" && (
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.5rem",
                  marginBottom: "var(--space-lg)",
                }}
              >
                Recruitment Drives (Mentor View)
              </h2>
              <div style={{ display: "grid", gap: "var(--space-lg)" }}>
                {drives.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--text-secondary)" }}>
                    No recruitment drives found.
                  </div>
                ) : (
                  drives.map(drive => (
                    <div key={drive.driveId} className="glass-card fade-in" style={{ padding: "var(--space-lg)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border)", paddingBottom: "var(--space-md)", marginBottom: "var(--space-md)" }}>
                        <div>
                          <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--primary)" }}>{drive.companyDetails.companyName}</h3>
                          <div style={{ fontSize: "1.1rem", fontWeight: "600", marginTop: "4px" }}>{drive.companyDetails.role}</div>
                          <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                            Min Score Required: {drive.companyDetails.minReputation} | Deadline: {new Date(drive.companyDetails.lastDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "var(--space-md)", textAlign: "center" }}>
                          <div style={{ background: "rgba(34, 197, 94, 0.1)", color: "var(--success)", padding: "var(--space-sm) var(--space-md)", borderRadius: "var(--radius-md)" }}>
                            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{drive.stats.eligibleCount}</div>
                            <div style={{ fontSize: "0.8rem" }}>Eligible</div>
                          </div>
                          <div style={{ background: "rgba(124, 58, 237, 0.1)", color: "var(--primary)", padding: "var(--space-sm) var(--space-md)", borderRadius: "var(--radius-md)" }}>
                            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{drive.stats.registeredCount}</div>
                            <div style={{ fontSize: "0.8rem" }}>Registered</div>
                          </div>
                          <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--error)", padding: "var(--space-sm) var(--space-md)", borderRadius: "var(--radius-md)" }}>
                            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{drive.stats.notRegisteredCount}</div>
                            <div style={{ fontSize: "0.8rem" }}>Not Registered</div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setExpandedDriveId(expandedDriveId === drive.driveId ? null : drive.driveId)}
                        style={{ background: "transparent", border: "none", color: "var(--primary)", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "var(--space-xs)" }}
                      >
                        {expandedDriveId === drive.driveId ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {expandedDriveId === drive.driveId ? "Hide Student Details" : "Expand View"}
                      </button>

                      {expandedDriveId === drive.driveId && (
                        <div className="fade-in" style={{ marginTop: "var(--space-md)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "var(--space-md)" }}>
                          {/* Eligible */}
                          <div style={{ background: "rgba(34, 197, 94, 0.05)", padding: "var(--space-md)", borderRadius: "var(--radius-md)", border: "1px solid rgba(34, 197, 94, 0.1)" }}>
                            <h4 style={{ color: "var(--success)", marginBottom: "var(--space-sm)", display: "flex", alignItems: "center", gap: "4px" }}><Check size={16} /> Eligible Students</h4>
                            {drive.lists.eligible.length === 0 ? <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>None</div> : (
                              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                                {drive.lists.eligible.map(s => <li key={s._id} style={{ fontSize: "0.9rem" }}>{s.name}</li>)}
                              </ul>
                            )}
                          </div>
                          {/* Registered */}
                          <div style={{ background: "rgba(124, 58, 237, 0.05)", padding: "var(--space-md)", borderRadius: "var(--radius-md)", border: "1px solid rgba(124, 58, 237, 0.1)" }}>
                            <h4 style={{ color: "var(--primary)", marginBottom: "var(--space-sm)", display: "flex", alignItems: "center", gap: "4px" }}><Check size={16} /> Registered Students</h4>
                            {drive.lists.registered.length === 0 ? <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>None</div> : (
                              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                                {drive.lists.registered.map(s => <li key={s._id} style={{ fontSize: "0.9rem" }}>{s.name}</li>)}
                              </ul>
                            )}
                          </div>
                          {/* Not Registered */}
                          <div style={{ background: "rgba(239, 68, 68, 0.05)", padding: "var(--space-md)", borderRadius: "var(--radius-md)", border: "1px solid rgba(239, 68, 68, 0.1)" }}>
                            <h4 style={{ color: "var(--error)", marginBottom: "var(--space-sm)", display: "flex", alignItems: "center", gap: "4px" }}><AlertTriangle size={16} /> Not Registered</h4>
                            {drive.lists.notRegistered.length === 0 ? <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>None</div> : (
                              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                                {drive.lists.notRegistered.map(s => <li key={s._id} style={{ fontSize: "0.9rem" }}>{s.name}</li>)}
                              </ul>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
