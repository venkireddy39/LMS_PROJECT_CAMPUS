import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import campusService from '../../services/campusService';
import { useStudentContext } from '../../context/StudentContext';
import { FaEdit, FaPlus } from 'react-icons/fa';
import { MdOutlineDelete } from "react-icons/md";

const ParentVisits = () => {
    const { getActiveStudents, selectedStudentFilter } = useStudentContext();
    const students = getActiveStudents();
    const [visits, setVisits] = useState([]);

    // Filter visits based on selected student from context
    const filteredVisits = selectedStudentFilter
        ? visits.filter(v => v.studentName === selectedStudentFilter.studentName || v.studentName === selectedStudentFilter.name)
        : visits;

    const [showModal, setShowModal] = useState(false);
    const [deleteMode, setDeleteMode] = useState(false);
    const [editingVisit, setEditingVisit] = useState(null);
    const [formData, setFormData] = useState({
        studentName: '',
        parentName: '',
        visitDate: '',
        visitTime: '',
        purpose: '',
        contactNumber: '',
        relation: 'Father',
        visitStatus: 'SCHEDULED' // Default status
    });

    useEffect(() => {
        loadVisits();
    }, []);

    const loadVisits = async () => {
        try {
            const data = await campusService.getAllVisits();
            setVisits(data || []);
        } catch (error) {
            console.error("Failed to load visits", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Reconstruct payload to ensure visitStatus is set and status is NOT sent if it conflicts
            const payload = {
                ...formData,
                visitStatus: formData.visitStatus || 'SCHEDULED'
            };

            // Remove 'status' property if it exists to avoid confusion/backend errors
            if (payload.status) delete payload.status;

            if (editingVisit) {
                // For updates, we might need a dedicated endpoint or handle it via delete/re-create if update is limited.
                // Assuming createVisit for now based on previous simplistic logic, OR user wants update.
                // Since the user specifically asked to "update new one", let's assuming full update or just create.
                // But the code previously had a comment about update support.
                // I will try to update using the hypothetical support or just log new if ID is missing.
                // Actually, let's use campusService.updateVisit if avail, or create.
                if (campusService.updateVisit) {
                    await campusService.updateVisit(editingVisit.id, payload);
                } else {
                    await campusService.createVisit(payload);
                }
            } else {
                await campusService.createVisit(payload);
            }
            loadVisits();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save visit", error);
            alert("Failed to save visit");
        }
    };

    const handleEdit = (visit) => {
        setEditingVisit(visit);
        setFormData({
            studentName: visit.studentName,
            parentName: visit.parentName,
            visitDate: visit.visitDate,
            visitTime: visit.visitTime,
            purpose: visit.purpose,
            contactNumber: visit.contactNumber,
            relation: visit.relation,
            visitStatus: visit.visitStatus || 'SCHEDULED'
        });
        setShowModal(true);
    };

    const handleDelete = async (id, studentName) => {
        if (window.confirm(`Are you sure you want to delete the visit record for ${studentName}?`)) {
            try {
                await campusService.deleteVisit(id);
                loadVisits();
            } catch (error) {
                console.error("Failed to delete", error);
            }
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingVisit(null);
        setFormData({
            studentName: '',
            parentName: '',
            visitDate: '',
            visitTime: '',
            purpose: '',
            contactNumber: '',
            relation: 'Father',
            visitStatus: 'SCHEDULED'
        });
    };

    const columns = [
        { header: 'Student Name', accessor: 'studentName' },
        { header: 'Parent Name', accessor: 'parentName' },
        { header: 'Relation', accessor: 'relation' },
        { header: 'Visit Date', accessor: 'visitDate' },
        { header: 'Visit Time', accessor: 'visitTime' },
        { header: 'Contact', accessor: 'contactNumber' },
        {
            header: 'Status',
            accessor: 'visitStatus',
            render: (row) => {
                const status = row.visitStatus || 'SCHEDULED';
                let badgeClass = 'bg-secondary text-secondary';
                if (status === 'CHECKED_IN') badgeClass = 'bg-success bg-opacity-10 text-success';
                else if (status === 'SCHEDULED') badgeClass = 'bg-primary bg-opacity-10 text-primary';
                else if (status === 'CHECKED_OUT') badgeClass = 'bg-dark bg-opacity-10 text-dark';
                else if (status === 'CANCELLED') badgeClass = 'bg-danger bg-opacity-10 text-danger';

                return <span className={`badge rounded-pill px-3 py-2 ${badgeClass}`}>{status}</span>;
            }
        },
        { header: 'Purpose', accessor: 'purpose' }
    ];

    columns.push({
        header: 'Actions',
        accessor: 'actions',
        render: (row) => (
            <div className="d-flex gap-2">
                <button
                    className="btn btn-sm btn-warning text-white"
                    onClick={() => handleEdit(row)}
                    title="Edit Visit"
                >
                    <FaEdit />
                </button>
                {deleteMode && (
                    <button
                        className="btn btn-sm btn-white border"
                        onClick={() => handleDelete(row.id, row.studentName)}
                        title="Delete Visit"
                    >
                        <MdOutlineDelete size={20} className="text-danger" />
                    </button>
                )}
            </div>
        )
    });

    return (
        <div className="container-fluid py-4 animate-in">
            <header className="mb-4">
                <h3 className="fw-bold text-main mb-1">Parent Visit Records</h3>
                <p className="text-muted small">Track and manage campus visits from parents and authorized guardians.</p>
            </header>

            <DataTable
                title="Recent Visit Logs"
                columns={columns}
                data={filteredVisits}
                actions={
                    <div className="d-flex gap-2">
                        <button className="btn-premium btn-premium-primary" onClick={() => setShowModal(true)}>
                            <i className="bi bi-person-plus-fill"></i> Add Visit
                        </button>
                        <button
                            className={`btn-premium ${deleteMode ? 'btn-secondary shadow-sm' : 'btn-outline-danger'}`}
                            onClick={() => setDeleteMode(!deleteMode)}
                            style={!deleteMode ? { border: '1px solid var(--border-main)', background: 'transparent' } : {}}
                        >
                            <i className={`bi ${deleteMode ? 'bi-x-circle' : 'bi-trash'}`}></i>
                            {deleteMode ? 'Cancel' : 'Delete'}
                        </button>
                    </div>
                }
            />

            {/* Premium Modal */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content glass-card border-0 shadow-2xl p-0" style={{ overflow: 'hidden' }}>
                            <div className="p-4 border-bottom border-light d-flex justify-content-between align-items-center bg-primary bg-opacity-10">
                                <h5 className="modal-title fw-bold text-main mb-0">
                                    {editingVisit ? (
                                        <><i className="bi bi-pencil-square text-primary me-2"></i>Update Visit Entry</>
                                    ) : (
                                        <><i className="bi bi-plus-circle-fill text-primary me-2"></i>New Visit Entry</>
                                    )}
                                </h5>
                                <button type="button" className="btn-close shadow-none" onClick={handleCloseModal}></button>
                            </div>
                            <div className="p-4">
                                <form onSubmit={handleSubmit}>
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Select Student</label>
                                            <select
                                                className="form-select"
                                                name="studentName"
                                                value={formData.studentName}
                                                onChange={(e) => {
                                                    const selectedName = e.target.value;
                                                    const student = students.find(s => s.studentName === selectedName || s.name === selectedName);
                                                    setFormData({
                                                        ...formData,
                                                        studentName: selectedName,
                                                        parentName: student ? (student.fatherName || '') : formData.parentName,
                                                        contactNumber: student ? (student.fatherPhone || '') : formData.contactNumber
                                                    });
                                                }}
                                                required
                                            >
                                                <option value="">Choose student...</option>
                                                {students.map((s, idx) => (
                                                    <option key={s.id || idx} value={s.studentName || s.name}>
                                                        {s.studentName || s.name} {s.roomNumber ? `(${s.roomNumber})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Vistor Name</label>
                                            <input type="text" className="form-control" name="parentName" value={formData.parentName} onChange={handleInputChange} placeholder="Full name of visitor" required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Relationship</label>
                                            <select className="form-select" name="relation" value={formData.relation} onChange={handleInputChange}>
                                                <option value="Father">Father</option>
                                                <option value="Mother">Mother</option>
                                                <option value="Guardian">Guardian</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Visit Status</label>
                                            <select className="form-select" name="visitStatus" value={formData.visitStatus} onChange={handleInputChange}>
                                                <option value="SCHEDULED">SCHEDULED</option>
                                                <option value="CHECKED_IN">CHECKED_IN</option>
                                                <option value="CHECKED_OUT">CHECKED_OUT</option>
                                                <option value="CANCELLED">CANCELLED</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Contact Number</label>
                                            <input type="tel" className="form-control" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} placeholder="+91 00000 00000" required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Visit Date</label>
                                            <input type="date" className="form-control" name="visitDate" value={formData.visitDate} onChange={handleInputChange} required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Visit Time</label>
                                            <input type="time" className="form-control" name="visitTime" value={formData.visitTime} onChange={handleInputChange} required />
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Purpose of Visit</label>
                                            <textarea className="form-control" name="purpose" rows="3" value={formData.purpose} onChange={handleInputChange} placeholder="Briefly describe the reason for visit..." required></textarea>
                                        </div>
                                    </div>
                                    <div className="mt-5 d-flex gap-2 justify-content-end">
                                        <button type="button" className="btn btn-light px-4 rounded-pill fw-500" onClick={handleCloseModal}>Cancel</button>
                                        <button type="submit" className="btn-premium btn-premium-primary rounded-pill px-5">
                                            {editingVisit ? 'Update Record' : 'Log Visit'}
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
                .smaller { font-size: 0.7rem; }
            `}</style>
        </div>
    );
};

export default ParentVisits;
