const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AcademicRecord = require('../models/AcademicRecord');
const Reputation = require('../models/Reputation');
const Application = require('../models/DriveApplication');
const RecruitmentDrive = require('../models/RecruitmentDrive');
const htmlToPdf = require('html-pdf-node');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Generate full student progress report
// @route   GET /api/reports/student/:studentId
router.get('/student/:studentId', protect, authorize('faculty'), async (req, res) => {
    try {
        const { studentId } = req.params;
        const facultyId = req.user._id;

        // Verify the student is assigned to this faculty
        const student = await User.findOne({ _id: studentId, mentorId: facultyId, role: 'student' });
        if (!student) {
            return res.status(403).json({ message: 'Unauthorized. Student not assigned to you.' });
        }

        // Get all data for the report
        const reputation = await Reputation.findOne({ studentId });
        const records = await AcademicRecord.find({ studentId }).sort({ createdAt: -1 }).populate({
            path: 'verifiedBy',
            select: 'name',
            model: 'User'
        });
        const applications = await Application.find({ studentId }).populate('recruitmentId');

        // Calculate reputation statistics
        const reputationStats = {
            current: reputation?.score || 0,
            highest: reputation?.score || 0, // TODO: Track historical max - using current for now
            average: reputation?.score || 0, // TODO: Calculate average over time - using current for now
            breakdown: reputation?.breakdown || {
                attendance: 0,
                assignments: 0,
                internships: 0,
                certifications: 0
            }
        };

        // Group academic achievements
        const achievements = {
            internships: records.filter(r => r.type === 'internship' && r.status === 'verified'),
            certifications: records.filter(r => r.type === 'certification' && r.status === 'verified'),
            courses: records.filter(r => r.type === 'workshop' && r.status === 'verified'),
            assignments: records.filter(r => r.type === 'assignment' && r.status === 'verified'),
            attendance: records.filter(r => r.type === 'attendance' && r.status === 'verified')
        };

        // Submission history
        const submissionHistory = records.map(record => ({
            name: record.subject || record.organization || record.issuer || 'N/A',
            type: record.type,
            status: record.status,
            verifiedBy: record.verifiedBy ? record.verifiedBy.name : 'Pending',
            date: record.createdAt.toLocaleDateString(),
            description: record.description || ''
        }));

        // Recruitment history
        const recruitmentHistory = applications.map(app => ({
            company: app.recruitmentId.companyName,
            role: app.recruitmentId.role,
            eligible: 'Yes', // Student applied, so they were eligible
            applied: 'Yes',
            status: app.status,
            appliedDate: app.appliedDate.toLocaleDateString()
        }));

        // Generate HTML report
        const htmlContent = generateReportHTML({
            student,
            reputationStats,
            achievements,
            submissionHistory,
            recruitmentHistory,
            facultyName: req.user.name
        });

        // Convert to PDF
        const options = {
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            }
        };

        const file = { content: htmlContent };
        const pdfBuffer = await htmlToPdf.generatePdf(file, options);

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${student.name}_progress_report.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ message: 'Failed to generate report' });
    }
});

// @desc    Get student timeline data
// @route   GET /api/reports/timeline/:studentId
router.get('/timeline/:studentId', protect, authorize('faculty'), async (req, res) => {
    try {
        const { studentId } = req.params;
        const facultyId = req.user._id;

        // Verify the student is assigned to this faculty
        const student = await User.findOne({ _id: studentId, mentorId: facultyId, role: 'student' });
        if (!student) {
            return res.status(403).json({ message: 'Unauthorized. Student not assigned to you.' });
        }

        // Get all records and applications for timeline
        const records = await AcademicRecord.find({ studentId }).sort({ createdAt: -1 }).populate({
            path: 'verifiedBy',
            select: 'name',
            model: 'User'
        });
        const applications = await Application.find({ studentId }).populate('recruitmentId').sort({ appliedDate: -1 });

        // Build timeline events
        const timelineEvents = [];

        // Add record events
        records.forEach(record => {
            let eventTitle = '';
            let eventDescription = '';

            switch (record.type) {
                case 'internship':
                    eventTitle = `Internship Submitted: ${record.organization}`;
                    eventDescription = `Role: ${record.role}, Duration: ${record.duration}`;
                    break;
                case 'certification':
                    eventTitle = `Certification Submitted: ${record.issuer}`;
                    eventDescription = `Certificate ID: ${record.certificateId}`;
                    break;
                case 'assignment':
                    eventTitle = `Assignment Submitted: ${record.subject}`;
                    eventDescription = record.description || '';
                    break;
                case 'workshop':
                    eventTitle = `Workshop/Course Submitted: ${record.subject}`;
                    eventDescription = record.description || '';
                    break;
                case 'attendance':
                    eventTitle = `Attendance Record: ${record.subject}`;
                    eventDescription = `Score: ${record.data}`;
                    break;
            }

            timelineEvents.push({
                date: record.createdAt,
                type: 'submission',
                title: eventTitle,
                description: eventDescription,
                status: record.status,
                statusColor: getStatusColor(record.status)
            });

            // Add verification event if verified
            if (record.status === 'verified' && record.verifiedBy) {
                timelineEvents.push({
                    date: record.updatedAt,
                    type: 'verification',
                    title: 'Record Verified',
                    description: `${eventTitle} was approved`,
                    status: 'verified',
                    statusColor: '#10b981'
                });
            }

            // Add rejection event if rejected
            if (record.status === 'rejected') {
                timelineEvents.push({
                    date: record.updatedAt,
                    type: 'rejection',
                    title: 'Record Rejected',
                    description: `${eventTitle} was rejected. Reason: ${record.rejectionReason || 'N/A'}`,
                    status: 'rejected',
                    statusColor: '#ef4444'
                });
            }
        });

        // Add application events
        applications.forEach(app => {
            timelineEvents.push({
                date: app.appliedDate,
                type: 'application',
                title: `Applied for ${app.recruitmentId.companyName}`,
                description: `Position: ${app.recruitmentId.role}`,
                status: app.status,
                statusColor: getApplicationStatusColor(app.status)
            });
        });

        // Sort timeline by date (most recent first)
        timelineEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            student: {
                _id: student._id,
                name: student.name,
                email: student.email
            },
            timeline: timelineEvents
        });

    } catch (error) {
        console.error('Timeline generation error:', error);
        res.status(500).json({ message: 'Failed to generate timeline' });
    }
});

// Helper function to get status color
function getStatusColor(status) {
    switch (status) {
        case 'verified': return '#10b981'; // green
        case 'pending': return '#f59e0b'; // amber
        case 'rejected': return '#ef4444'; // red
        default: return '#6b7280'; // gray
    }
}

// Helper function to get application status color
function getApplicationStatusColor(status) {
    switch (status) {
        case 'applied': return '#3b82f6'; // blue
        case 'shortlisted': return '#f59e0b'; // amber
        case 'rejected': return '#ef4444'; // red
        case 'hired': return '#10b981'; // green
        default: return '#6b7280'; // gray
    }
}

// Generate HTML report content
function generateReportHTML(data) {
    const { student, reputationStats, achievements, submissionHistory, recruitmentHistory, facultyName } = data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Progress Report - ${student.name}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 28px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .section {
            margin-bottom: 30px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
        }
        .section h2 {
            color: #1f2937;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 10px;
            margin-top: 0;
            font-size: 20px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-box {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
        }
        .stat-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .achievement-item {
            background: #f8fafc;
            padding: 12px;
            margin-bottom: 8px;
            border-radius: 6px;
            border-left: 4px solid #10b981;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .table th, .table td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        .table th {
            background: #f8fafc;
            font-weight: 600;
            color: #374151;
        }
        .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }
        .status-verified { background: #d1fae5; color: #065f46; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-rejected { background: #fee2e2; color: #991b1b; }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .progress-bar {
            background: #e5e7eb;
            border-radius: 10px;
            height: 20px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #2563eb, #3b82f6);
            width: ${reputationStats.current}%;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Student Progress Report</h1>
        <p><strong>${student.name}</strong></p>
        <p>${student.email} | ${student.department} | ${student.academicYear}</p>
        <p><em>Mentor: ${facultyName}</em></p>
        <p><em>Report Generated: ${new Date().toLocaleDateString()}</em></p>
    </div>

    <div class="section">
        <h2>Reputation Summary</h2>
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-value">${reputationStats.current}</div>
                <div class="stat-label">Current Score</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">${reputationStats.highest}</div>
                <div class="stat-label">Highest Score</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">${reputationStats.average}</div>
                <div class="stat-label">Average Score</div>
            </div>
        </div>
        <div>
            <strong>Progress Bar:</strong>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <small>Score Breakdown: Attendance (${reputationStats.breakdown.attendance}), Assignments (${reputationStats.breakdown.assignments}), Internships (${reputationStats.breakdown.internships}), Certifications (${reputationStats.breakdown.certifications})</small>
        </div>
    </div>

    <div class="section">
        <h2>Academic Achievements</h2>

        ${achievements.internships.length > 0 ? `
        <h3>Internships (${achievements.internships.length})</h3>
        ${achievements.internships.map(item => `
            <div class="achievement-item">
                <strong>${item.organization}</strong> - ${item.role}<br>
                <small>Duration: ${item.duration} | Issued: ${item.issueDate ? new Date(item.issueDate).toLocaleDateString() : 'N/A'}</small>
            </div>
        `).join('')}
        ` : '<p>No verified internships</p>'}

        ${achievements.certifications.length > 0 ? `
        <h3>Certifications (${achievements.certifications.length})</h3>
        ${achievements.certifications.map(item => `
            <div class="achievement-item">
                <strong>${item.issuer}</strong><br>
                <small>Certificate ID: ${item.certificateId} | Issued: ${item.issueDate ? new Date(item.issueDate).toLocaleDateString() : 'N/A'}</small>
            </div>
        `).join('')}
        ` : '<p>No verified certifications</p>'}

        ${achievements.courses.length > 0 ? `
        <h3>Courses/Workshops (${achievements.courses.length})</h3>
        ${achievements.courses.map(item => `
            <div class="achievement-item">
                <strong>${item.subject}</strong><br>
                <small>${item.description || 'No description'}</small>
            </div>
        `).join('')}
        ` : '<p>No verified courses/workshops</p>'}
    </div>

    <div class="section">
        <h2>Submission History</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Record Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Verified By</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${submissionHistory.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.type}</td>
                    <td><span class="status-badge status-${item.status}">${item.status}</span></td>
                    <td>${item.verifiedBy}</td>
                    <td>${item.date}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Recruitment History</h2>
        ${recruitmentHistory.length > 0 ? `
        <table class="table">
            <thead>
                <tr>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Eligible</th>
                    <th>Applied</th>
                    <th>Status</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${recruitmentHistory.map(item => `
                <tr>
                    <td>${item.company}</td>
                    <td>${item.role}</td>
                    <td>${item.eligible}</td>
                    <td>${item.applied}</td>
                    <td><span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span></td>
                    <td>${item.appliedDate}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : '<p>No recruitment applications</p>'}
    </div>

    <div class="footer">
        <p>This report was generated by the AcadChain Mentorship System</p>
        <p>For any questions, please contact your faculty mentor.</p>
    </div>
</body>
</html>`;
}

module.exports = router;