import React from 'react';
import DataTable from '../common/DataTable';
import campusService from '../../services/campusService';
import { useStudentContext } from '../../context/StudentContext';

const Complaints = () => {
    const { students, refreshStudents, selectedStudentFilter } = useStudentContext();
    const [issues, setIssues] = React.useState([]);
    const [hostels, setHostels] = React.useState([]);
    const [showModal, setShowModal] = React.useState(false);
    const [currentIssue, setCurrentIssue] = React.useState(null);
    const [isNewIssue, setIsNewIssue] = React.useState(false);

    React.useEffect(() => {
        refreshStudents(); // Ensure we have the latest student list
        loadComplaints();
        loadHostels();
    }, []);

    const filteredIssues = selectedStudentFilter
        ? issues.filter(i => i.studentName === selectedStudentFilter.studentName || i.studentId === selectedStudentFilter.studentId)
        : issues;

    const loadComplaints = async () => {
        try {
            const data = await campusService.getAllComplaints();
            setIssues(data || []);
        } catch (error) {
            console.error("Failed to load complaints", error);
        }
    };

    const loadHostels = async () => {
        try {
            const data = await campusService.getAllHostels(); // Assuming this endpoint exists in service
            setHostels(data || []);
        } catch (error) {
            console.error("Failed to load hostels", error);
        }
    };

    const handleEditClick = (issue) => {
        setCurrentIssue({ ...issue });
        setIsNewIssue(false);
        setShowModal(true);
    };

    const handleAddNewClick = () => {
        setCurrentIssue({
            studentName: '',
            hostelName: '',
            roomNumber: '',
            category: 'PLUMBING',
            description: '',
            reportedDate: new Date().toISOString().split('T')[0],
            priority: 'MEDIUM',
            status: 'OPEN',
            remarks: ''
        });
        setIsNewIssue(true);
        setShowModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentIssue({ ...currentIssue, [name]: value });
    };

    const handleStudentSelect = (e) => {
        const selectedName = e.target.value;
        const student = students.find(s => s.studentName === selectedName || s.name === selectedName);

        setCurrentIssue({
            ...currentIssue,
            studentName: selectedName,
            // Auto-fill room/hostel if available in student data
            roomNumber: student?.roomNumber || student?.roomNo || currentIssue.roomNumber,
            hostelName: student?.hostel?.hostelName || student?.hostelName || currentIssue.hostelName
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isNewIssue) {
                await campusService.createComplaint(currentIssue);
            } else {
                await campusService.updateComplaint(currentIssue.id, currentIssue.status, currentIssue.remarks);
            }
            loadComplaints();
            setShowModal(false);
            setCurrentIssue(null);
            setIsNewIssue(false);
        } catch (error) {
            console.error("Failed to save complaint", error);
            alert("Failed to save complaint");
        }
    };

    const columns = [
        { header: 'Student Name', accessor: 'studentName', render: (row) => <span className="fw-600 text-primary">{row.studentName || 'N/A'}</span> },
        { header: 'Hostel Name', accessor: 'hostelName', render: (row) => <span className="fw-500">{row.hostelName}</span> },
        { header: 'Room No.', accessor: 'roomNumber' },
        {
            header: 'Category',
            accessor: 'category',
            render: (row) => <span className="fw-600 text-main">{row.category}</span>
        },
        { header: 'Description', accessor: 'description', render: (row) => <span className="small text-muted">{row.description}</span> },
        { header: 'Reported Date', accessor: 'reportedDate' },
        {
            header: 'Priority',
            accessor: 'priority',
            render: (row) => {
                let badgeClass = 'bg-secondary bg-opacity-10 text-secondary';
                if (row.priority === 'HIGH') badgeClass = 'bg-danger bg-opacity-10 text-danger';
                if (row.priority === 'MEDIUM') badgeClass = 'bg-warning bg-opacity-10 text-warning-emphasis';
                return <span className={`badge rounded-pill px-3 py-2 fw-bold ${badgeClass}`}>{row.priority}</span>;
            }
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => {
                let badgeClass = 'bg-secondary bg-opacity-10 text-secondary';
                if (row.status === 'RESOLVED') badgeClass = 'bg-success bg-opacity-10 text-success';
                if (row.status === 'IN_PROGRESS') badgeClass = 'bg-primary bg-opacity-10 text-primary';
                if (row.status === 'CLOSED') badgeClass = 'bg-dark bg-opacity-10 text-dark';
                return <span className={`badge rounded-pill px-3 py-2 fw-bold ${badgeClass}`}>{row.status}</span>;
            }
        },
        {
            header: 'Actions',
            accessor: 'actions',
            render: (row) => (
                <button className="btn btn-sm btn-light border rounded-pill px-3 fw-500 shadow-sm" onClick={() => handleEditClick(row)}>
                    <i className="bi bi-pencil-square me-1"></i> Edit
                </button>
            )
        }
    ];

    return (
        <div className="container-fluid py-4 animate-in">
            <header className="mb-4 d-flex justify-content-between align-items-center">
                <div>
                    <h3 className="fw-bold text-main mb-1">Complaints & Issues</h3>
                    <p className="text-muted small">Track and resolve facility-related complaints and repair requests.</p>
                </div>
            </header>

            <DataTable
                title="Service Tickets"
                columns={columns}
                data={filteredIssues}
                actions={
                    <button className="btn-premium btn-premium-primary" onClick={handleAddNewClick}>
                        <i className="bi bi-plus-circle"></i> Add Ticket
                    </button>
                }
            />

            {/* Premium Add/Edit Issue Modal */}
            {showModal && currentIssue && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content glass-card border-0 shadow-2xl p-0" style={{ overflow: 'hidden' }}>
                            <div className="p-4 border-bottom border-light d-flex justify-content-between align-items-center bg-primary bg-opacity-10">
                                <h5 className="modal-title fw-bold text-main mb-0">
                                    {isNewIssue ? (
                                        <><i className="bi bi-tools text-primary me-2"></i>New Service Request</>
                                    ) : (
                                        <><i className="bi bi-pencil-square text-primary me-2"></i>Update Ticket Status</>
                                    )}
                                </h5>
                                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="p-4">
                                <form onSubmit={handleSave}>
                                    <div className="row g-4">
                                        <div className="col-md-12">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Student Name</label>
                                            <select
                                                className="form-select"
                                                name="studentName"
                                                value={currentIssue.studentName || ''}
                                                onChange={handleStudentSelect}
                                                required
                                                disabled={!isNewIssue}
                                            >
                                                <option value="">Select Student...</option>
                                                {students && students.length > 0 ? (
                                                    students.map((s, idx) => (
                                                        <option key={s.id || idx} value={s.studentName || s.name}>
                                                            {s.studentName || s.name} {s.roomNumber ? `(Room: ${s.roomNumber})` : ''}
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option disabled>No students found</option>
                                                )}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Hostel Name</label>
                                            <select
                                                className="form-select"
                                                name="hostelName"
                                                value={currentIssue.hostelName || ''}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Select Hostel...</option>
                                                {hostels && hostels.length > 0 ? (
                                                    hostels.map(h => (
                                                        <option key={h.id || h.hostelId} value={h.hostelName}>
                                                            {h.hostelName}
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option disabled>No hostels loaded</option>
                                                )}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Room Number</label>
                                            <input type="text" className="form-control" name="roomNumber" value={currentIssue.roomNumber} onChange={handleInputChange} placeholder="e.g. 302-A" required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Issue Category</label>
                                            <select className="form-select" name="category" value={currentIssue.category} onChange={handleInputChange}>
                                                <option value="PLUMBING">PLUMBING</option>
                                                <option value="ELECTRICAL">ELECTRICAL</option>
                                                <option value="FURNITURE">FURNITURE</option>
                                                <option value="CLEANING">CLEANING</option>
                                                <option value="OTHERS">OTHERS</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Priority Level</label>
                                            <select className="form-select" name="priority" value={currentIssue.priority} onChange={handleInputChange}>
                                                <option value="LOW">LOW (STANDARD)</option>
                                                <option value="MEDIUM">MEDIUM (URGENT)</option>
                                                <option value="HIGH">HIGH (IMMEDIATE)</option>
                                            </select>
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Issue Description</label>
                                            <textarea className="form-control" name="description" value={currentIssue.description} onChange={handleInputChange} rows="3" placeholder="Explain the problem in detail..." required></textarea>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Reported Date</label>
                                            <input type="date" className="form-control" name="reportedDate" value={currentIssue.reportedDate} onChange={handleInputChange} required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Workflow Status</label>
                                            <select className="form-select" name="status" value={currentIssue.status} onChange={handleInputChange}>
                                                <option value="OPEN">🆕 OPEN TICKET</option>
                                                <option value="IN_PROGRESS">⚙️ IN PROGRESS</option>
                                                <option value="RESOLVED">✅ RESOLVED</option>
                                                <option value="CLOSED">🔒 CLOSED</option>
                                            </select>
                                        </div>
                                        {!isNewIssue && (
                                            <div className="col-md-12">
                                                <label className="form-label fw-600 smaller text-uppercase text-muted">Admin Remarks</label>
                                                <textarea className="form-control" name="remarks" value={currentIssue.remarks} onChange={handleInputChange} rows="2" placeholder="Resolution details or internal notes..."></textarea>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-5 d-flex gap-2 justify-content-end">
                                        <button type="button" className="btn btn-light px-4 rounded-pill fw-500" onClick={() => setShowModal(false)}>Cancel</button>
                                        <button type="submit" className="btn-premium btn-premium-primary rounded-pill px-5">
                                            {isNewIssue ? 'Create Ticket' : 'Update Record'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .fw-600 { font-weight: 600; }
                .fw-500 { font-weight: 500; }
                .smaller { font-size: 0.7rem; }
            `}</style>
        </div>
    );
};

export default Complaints;
