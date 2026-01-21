import React, { useState } from 'react';
import DataTable from '../common/DataTable';
import { parentVisitData as initialData } from '../../data/parentVisitData';
import { FaEdit, FaPlus } from 'react-icons/fa';
import { MdOutlineDelete } from "react-icons/md";

const ParentVisits = () => {
    const [visits, setVisits] = useState(initialData);
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
        relation: 'Father'
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingVisit) {
            setVisits(visits.map(v => v.id === editingVisit.id ? { ...v, ...formData } : v));
        } else {
            const newVisit = {
                id: Date.now(),
                ...formData
            };
            setVisits([...visits, newVisit]);
        }
        handleCloseModal();
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
            relation: visit.relation
        });
        setShowModal(true);
    };

    const handleDelete = (id, studentName) => {
        if (window.confirm(`Are you sure you want to delete the visit record for ${studentName}?`)) {
            setVisits(visits.filter(v => v.id !== id));
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
            relation: 'Father'
        });
    };

    const columns = [
        { header: 'Student Name', accessor: 'studentName' },
        { header: 'Parent Name', accessor: 'parentName' },
        { header: 'Relation', accessor: 'relation' },
        { header: 'Visit Date', accessor: 'visitDate' },
        { header: 'Visit Time', accessor: 'visitTime' },
        { header: 'Contact', accessor: 'contactNumber' },
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
                data={visits}
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
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Student Name</label>
                                            <input type="text" className="form-control" name="studentName" value={formData.studentName} onChange={handleInputChange} placeholder="Full name of student" required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Parent/Guardian Name</label>
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

            <style jsx>{`
                .fw-600 { font-weight: 600; }
                .smaller { font-size: 0.7rem; }
            `}</style>
        </div>
    );
};

export default ParentVisits;
