import React from 'react';
import DataTable from '../common/DataTable';
import { studentData } from '../../data/studentData';

const StudentDetails = () => {
    const [students, setStudents] = React.useState(studentData);
    const [showModal, setShowModal] = React.useState(false);
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
        const newStudent = {
            id: students.length + 1,
            ...formData
        };
        setStudents([...students, newStudent]);
        setShowModal(false);
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
        setStudents(prevStudents =>
            prevStudents.map(student =>
                student.id === id ? { ...student, stayStatus: newStatus } : student
            )
        );
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

    return (
        <div className="container-fluid position-relative">
            <h3 className="mb-4 fw-bold">Student Hostel Details</h3>

            <DataTable
                title="Student List"
                columns={columns}
                data={students}
                actions={
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <i className="bi bi-person-plus me-2"></i> Add Student
                    </button>
                }
            />

            {/* Modal Overlay */}
            {showModal && (
                <>
                    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-lg" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title fw-bold">Add New Student</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <form onSubmit={handleSubmit}>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label">Student Name</label>
                                                <input type="text" className="form-control" name="name" value={formData.name} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Phone Number</label>
                                                <input type="tel" className="form-control" name="phone" value={formData.phone} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Father's Name</label>
                                                <input type="text" className="form-control" name="fatherName" value={formData.fatherName} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Father's Phone</label>
                                                <input type="tel" className="form-control" name="fatherPhone" value={formData.fatherPhone} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Room Number</label>
                                                <input type="text" className="form-control" name="roomNumber" value={formData.roomNumber} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Joining Date</label>
                                                <input type="date" className="form-control" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-12">
                                                <label className="form-label">Initial Status</label>
                                                <select className="form-select" name="stayStatus" value={formData.stayStatus} onChange={handleInputChange}>
                                                    <option value="Active">Active</option>
                                                    <option value="Vacated">Vacated</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mt-4 text-end">
                                            <button type="button" className="btn btn-secondary me-2" onClick={() => setShowModal(false)}>Cancel</button>
                                            <button type="submit" className="btn btn-primary">Save Student</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default StudentDetails;
