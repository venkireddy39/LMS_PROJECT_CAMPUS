import React from 'react';
import DataTable from '../common/DataTable';
import { useStudentContext } from '../../context/StudentContext';
import { FaTrash, FaEdit } from 'react-icons/fa';
import { MdOutlineDelete } from "react-icons/md";
const StudentDetails = () => {
    const { students, addStudent, updateStudent, deleteStudent } = useStudentContext();
    const [showModal, setShowModal] = React.useState(false);
    const [deleteMode, setDeleteMode] = React.useState(false);
    const [editingStudent, setEditingStudent] = React.useState(null);
    const [formData, setFormData] = React.useState({
        name: '',
        phone: '',
        fatherName: '',
        fatherPhone: '',
        roomNumber: '',
        joiningDate: '',
        stayStatus: 'Active'
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingStudent) {
            updateStudent(editingStudent.id, formData);
        } else {
            addStudent(formData);
        }
        setShowModal(false);
        setEditingStudent(null);
        setFormData({
            name: '',
            phone: '',
            fatherName: '',
            fatherPhone: '',
            roomNumber: '',
            joiningDate: '',
            stayStatus: 'Active'
        });
    };

    const handleStatusChange = (id, newStatus) => {
        updateStudent(id, { stayStatus: newStatus });
    };

    const handleEdit = (student) => {
        setEditingStudent(student);
        setFormData({
            name: student.name,
            phone: student.phone,
            fatherName: student.fatherName,
            fatherPhone: student.fatherPhone,
            roomNumber: student.roomNumber,
            joiningDate: student.joiningDate,
            stayStatus: student.stayStatus
        });
        setShowModal(true);
    };

    const handleDelete = (id, studentName) => {
        if (window.confirm(`Are you sure you want to delete ${studentName}?`)) {
            deleteStudent(id);
        }
    };

    const toggleDeleteMode = () => {
        setDeleteMode(!deleteMode);
    };

    const columns = [
        { header: 'Name', accessor: 'name' },
        { header: 'Phone', accessor: 'phone' },
        { header: 'Father Name', accessor: 'fatherName' },
        { header: 'Father Phone', accessor: 'fatherPhone' },
        { header: 'Room No.', accessor: 'roomNumber' },
        { header: 'Joining Date', accessor: 'joiningDate' },
        {
            header: 'Status',
            accessor: 'stayStatus',
            render: (row) => (
                <select
                    className={`form-select form-select-sm fw-bold ${row.stayStatus === 'Active' ? 'text-success border-success bg-success-subtle' : 'text-danger border-danger bg-danger-subtle'}`}
                    value={row.stayStatus}
                    onChange={(e) => handleStatusChange(row.id, e.target.value)}
                    style={{ width: '130px', cursor: 'pointer' }}
                >
                    <option value="Active" className="text-success fw-bold">Active</option>
                    <option value="Vacated" className="text-danger fw-bold">Vacated</option>
                </select>
            )
        },
    ];

    // Add actions column with edit and delete buttons
    columns.push({
        header: 'Actions',
        accessor: 'actions',
        render: (row) => (
            <div className="d-flex gap-2">
                <button
                    className="btn btn-sm btn-warning"
                    onClick={() => handleEdit(row)}
                    title="Edit Student"
                >
                    <FaEdit />
                </button>
                {deleteMode && (
                    <button
                        className="btn btn-sm btn-white"
                        onClick={() => handleDelete(row.id, row.name)}
                        title="Delete Student"
                    >
                        <MdOutlineDelete size={20} />
                    </button>

                )}
            </div>
        )
    });

    return (
        <div className="container-fluid py-4 animate-in">
            <header className="mb-4 d-flex justify-content-between align-items-center">
                <div>
                    <h3 className="fw-bold text-main mb-1">Student Hostel Details</h3>
                    <p className="text-muted small">Manage student profiles, room assignments, and stay status.</p>
                </div>
            </header>

            <DataTable
                title="Resident Students"
                columns={columns}
                data={students}
                actions={
                    <div className="d-flex gap-2">
                        <button className="btn-premium btn-premium-primary" onClick={() => setShowModal(true)}>
                            <i className="bi bi-person-plus"></i> Add Student
                        </button>
                        <button
                            className={`btn-premium ${deleteMode ? 'btn-secondary shadow-sm' : 'btn-outline-danger'}`}
                            onClick={toggleDeleteMode}
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
                        <div className="modal-content glass-card border-0 shadow-2xl" style={{ overflow: 'hidden' }}>
                            <div className="p-4 border-bottom border-light d-flex justify-content-between align-items-center bg-primary bg-opacity-10">
                                <h5 className="modal-title fw-bold text-main mb-0">
                                    {editingStudent ? (
                                        <><i className="bi bi-pencil-square text-primary me-2"></i>Edit Student Profile</>
                                    ) : (
                                        <><i className="bi bi-person-plus-fill text-primary me-2"></i>Register New Student</>
                                    )}
                                </h5>
                                <button type="button" className="btn-close shadow-none" onClick={() => { setShowModal(false); setEditingStudent(null); }}></button>
                            </div>
                            <div className="p-4">
                                <form onSubmit={handleSubmit}>
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Student Name</label>
                                            <input type="text" className="form-control" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. John Doe" required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Phone Number</label>
                                            <input type="tel" className="form-control" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 00000 00000" required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Father's Name</label>
                                            <input type="text" className="form-control" name="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="Father's Full Name" required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Father's Phone</label>
                                            <input type="tel" className="form-control" name="fatherPhone" value={formData.fatherPhone} onChange={handleInputChange} placeholder="+91 00000 00000" required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Room Assignment</label>
                                            <input type="text" className="form-control" name="roomNumber" value={formData.roomNumber} onChange={handleInputChange} placeholder="e.g. 101" required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Joining Date</label>
                                            <input type="date" className="form-control" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} required />
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Resident Status</label>
                                            <div className="d-flex gap-3 mt-1">
                                                {['Active', 'Vacated'].map((status) => (
                                                    <label key={status} className={`flex-fill p-3 border rounded-3 cursor-pointer transition-all ${formData.stayStatus === status ? 'border-primary bg-primary bg-opacity-5 text-primary fw-bold' : 'text-muted'}`}>
                                                        <input
                                                            type="radio"
                                                            name="stayStatus"
                                                            value={status}
                                                            checked={formData.stayStatus === status}
                                                            onChange={handleInputChange}
                                                            className="d-none"
                                                        />
                                                        <i className={`bi ${status === 'Active' ? 'bi-check-circle-fill' : 'bi-x-circle'} me-2`}></i>
                                                        {status}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 d-flex gap-2 justify-content-end">
                                        <button type="button" className="btn btn-light px-4 rounded-pill fw-500" onClick={() => { setShowModal(false); setEditingStudent(null); }}>Discard</button>
                                        <button type="submit" className="btn-premium btn-premium-primary rounded-pill px-5">
                                            {editingStudent ? 'Save Changes' : 'Confirm Registration'}
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
                .cursor-pointer { cursor: pointer; }
                .smaller { font-size: 0.7rem; }
            `}</style>
        </div>
    );
};

export default StudentDetails;
