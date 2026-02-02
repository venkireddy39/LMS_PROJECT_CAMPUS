import React from 'react';
import DataTable from '../common/DataTable';
import { useStudentContext } from '../../context/StudentContext';
import { FaTrash, FaEdit } from 'react-icons/fa';
import { MdOutlineDelete } from "react-icons/md";
import campusService from '../../services/campusService';

const StudentDetails = () => {
    const { students, addStudent, updateStudent, deleteStudent } = useStudentContext();
    const [showModal, setShowModal] = React.useState(false);
    // const [deleteMode, setDeleteMode] = React.useState(false);
    const [editingStudent, setEditingStudent] = React.useState(null);
    const [hostels, setHostels] = React.useState([]);
    const [rooms, setRooms] = React.useState([]);
    const [formData, setFormData] = React.useState({
        studentName: '',
        studentEmail: '',
        fatherName: '',
        fatherPhone: '',
        hostelId: '', // Changed from hostelName to hostelId
        roomId: '', // Added roomId for selection
        roomNumber: '',
        joinDate: '',
        leaveDate: '',
        paymentStatus: 'DUE',
        status: 'ACTIVE'
    });

    React.useEffect(() => {
        fetchHostels();
        fetchRooms();
    }, []);

    const fetchHostels = async () => {
        try {
            const data = await campusService.getAllHostels();
            setHostels(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch hostels", error);
        }
    };

    const fetchRooms = async () => {
        try {
            const data = await campusService.getAllRooms();
            setRooms(Array.isArray(data) ? data : (data.data || []));
        } catch (error) {
            console.error("Failed to fetch rooms", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleRoomChange = (e) => {
        const selectedRoomId = e.target.value;
        const selectedRoom = rooms.find(r => (r.id || r.roomId).toString() === selectedRoomId);
        setFormData({
            ...formData,
            roomId: selectedRoomId,
            roomNumber: selectedRoom ? selectedRoom.roomNumber : ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Construct payload matching the JSON structure provided
        const payload = {
            ...formData,
            // Map flat fields for backend
            studentId: editingStudent?.studentId || null,
            hostel: {
                id: parseInt(formData.hostelId),
                hostelId: parseInt(formData.hostelId)
            },
            room: {
                id: parseInt(formData.roomId)
            },
            // Include student reference if needed by some backend logic (keeping for safety, though studentId is primary)
            ...(editingStudent ? { student: { id: editingStudent.studentId } } : {}),

            // Ensure numeric values are parsed
            monthlyFee: parseFloat(formData.monthlyFee) || 0,
            totalFee: parseFloat(formData.totalFee) || 0,
            amountPaid: parseFloat(formData.amountPaid) || 0,
            dueAmount: parseFloat(formData.dueAmount) || 0,
        };

        if (editingStudent) {
            // Use editingStudent.id (which maps to allocationId in Context) for the update
            updateStudent(editingStudent.id, payload);
        } else {
            addStudent(payload);
        }
        setShowModal(false);
        setEditingStudent(null);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            studentName: '',
            studentEmail: '',
            fatherName: '',
            fatherPhone: '',
            hostelId: '',
            roomId: '',
            roomNumber: '',
            joinDate: '',
            leaveDate: '',
            paymentStatus: 'DUE',
            status: 'ACTIVE'
        });
    };

    const handleStatusChange = (id, newStatus) => {
        updateStudent(id, { status: newStatus });
    };

    const handleEdit = (student) => {
        setEditingStudent(student);
        setFormData({
            studentName: student.studentName || '',
            studentEmail: student.studentEmail || '',
            fatherName: student.fatherName || '',
            fatherPhone: student.fatherPhone || '',
            hostelId: student.hostel?.id || student.hostelId || '',
            roomId: student.room?.id || student.roomId || '',
            roomNumber: student.room?.roomNumber || student.roomNumber || '',
            joinDate: student.joinDate || '',
            leaveDate: student.leaveDate || '',
            paymentStatus: student.paymentStatus || 'DUE',
            status: student.status || 'ACTIVE'
        });
        setShowModal(true);
    };

    const handleDelete = (id, studentName) => {
        if (window.confirm(`Are you sure you want to delete ${studentName}?`)) {
            deleteStudent(id);
        }
    };

    // const toggleDeleteMode = () => {
    //     setDeleteMode(!deleteMode);
    // };

    const [searchTerm, setSearchTerm] = React.useState('');

    const filteredStudents = students.filter(student =>
        student.id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastname?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const availableRooms = rooms.filter(r => {
        // Show rooms that match the selected hostel OR have no hostel assigned (global rooms)
        // Also ensure we only show rooms that are not FULL (optional, but good UX)
        const hId = r.hostel?.id || r.hostelId || r.hostel;
        const matchesHostel = !hId || (formData.hostelId && String(hId) === String(formData.hostelId));
        // const isAvailable = r.status !== 'FULL' && (r.vacant > 0 || r.capacity > r.occupied);
        return matchesHostel; // && isAvailable;
    });

    const columns = [
        { header: 'ID', accessor: 'id' }, // Added ID column
        { header: 'First Name', accessor: 'firstname' },
        { header: 'Last Name', accessor: 'lastname' },
        { header: 'Email', accessor: 'email' },
        { header: 'Father Name', accessor: 'fatherName' },
        { header: 'Father Phone', accessor: 'fatherPhone' }, // Added Father Phone
        { header: 'Room No.', accessor: (row) => row.room?.roomNumber || row.roomNumber },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => (
                <select
                    className={`form-select form-select-sm fw-bold ${row.status === 'ACTIVE' ? 'text-success border-success bg-success-subtle' :
                        row.status === 'CHECKED_OUT' ? 'text-dark border-dark bg-secondary-subtle' :
                            'text-danger border-danger bg-danger-subtle'}`}
                    value={row.status}
                    onChange={(e) => handleStatusChange(row.id, e.target.value)}
                    style={{ width: '140px', cursor: 'pointer' }}
                >
                    <option value="ACTIVE" className="text-success fw-bold">ACTIVE</option>
                    <option value="CHECKED_OUT" className="text-dark fw-bold">CHECKED OUT</option>
                    <option value="CANCELLED" className="text-danger fw-bold">CANCELLED</option>
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
                <button
                    className="btn btn-sm btn-white text-danger shadow-sm"
                    onClick={() => handleDelete(row.id, row.studentName)}
                    title="Delete Student"
                >
                    <FaTrash />
                </button>
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
                data={filteredStudents}
                actions={
                    <div className="d-flex gap-2 align-items-center">
                        <div className="input-group input-group-sm me-2" style={{ width: '250px' }}>
                            <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-search"></i></span>
                            <input
                                type="text"
                                className="form-control border-start-0 ps-0"
                                placeholder="Search by ID or Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {/* Delete button removed */}
                    </div>
                }
            />

            {/* Premium Modal */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)' }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content glass-card border-0 shadow-2xl" style={{ overflow: 'hidden' }}>
                            <div className="px-5 py-4 border-bottom border-light d-flex justify-content-between align-items-center bg-white bg-opacity-5">
                                <div>
                                    <h5 className="modal-title fw-bold text-main mb-1 fs-4">
                                        {editingStudent ? (
                                            <><i className="bi bi-pencil-square text-primary me-2"></i>Edit Profile</>
                                        ) : (
                                            <><i className="bi bi-person-plus-fill text-primary me-2"></i>New Student Registration</>
                                        )}
                                    </h5>
                                    <p className="mb-0 text-muted small">Enter the student's personal, allocation, and fee details below.</p>
                                </div>
                                <button type="button" className="btn-close shadow-none bg-white opacity-75" onClick={() => { setShowModal(false); setEditingStudent(null); }}></button>
                            </div>

                            <div className="modal-body p-5 custom-scrollbar">
                                <form onSubmit={handleSubmit} id="studentForm">
                                    <div className="row g-4">
                                        {/* Personal Details Section */}
                                        <div className="col-12">
                                            <div className="p-4 rounded-4 bg-white bg-opacity-5 border border-white border-opacity-10">
                                                <h6 className="text-primary fw-bold mb-4 d-flex align-items-center">
                                                    <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                                        <i className="bi bi-person-vcard-fill fs-6"></i>
                                                    </span>
                                                    Personal Information
                                                </h6>
                                                <div className="row g-4">
                                                    <div className="col-md-6 col-lg-3">
                                                        <label className="form-label fw-600 smaller text-uppercase text-muted ps-1">Student Name</label>
                                                        <input type="text" className="form-control form-control-lg fs-6" name="studentName" value={formData.studentName} onChange={handleInputChange} placeholder="e.g. John Doe" required />
                                                    </div>
                                                    <div className="col-md-6 col-lg-3">
                                                        <label className="form-label fw-600 smaller text-uppercase text-muted ps-1">Email Address</label>
                                                        <input type="email" className="form-control form-control-lg fs-6" name="studentEmail" value={formData.studentEmail} onChange={handleInputChange} placeholder="name@example.com" required />
                                                    </div>
                                                    <div className="col-md-6 col-lg-3">
                                                        <label className="form-label fw-600 smaller text-uppercase text-muted ps-1">Father's Name</label>
                                                        <input type="text" className="form-control form-control-lg fs-6" name="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="Parent/Guardian Name" required />
                                                    </div>
                                                    <div className="col-md-6 col-lg-3">
                                                        <label className="form-label fw-600 smaller text-uppercase text-muted ps-1">Father's Phone</label>
                                                        <input type="tel" className="form-control form-control-lg fs-6" name="fatherPhone" value={formData.fatherPhone} onChange={handleInputChange} placeholder="+91 00000 00000" required />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Allocation Details Section */}
                                        <div className="col-12">
                                            <div className="p-4 rounded-4 bg-white bg-opacity-5 border border-white border-opacity-10">
                                                <h6 className="text-info fw-bold mb-4 d-flex align-items-center">
                                                    <span className="bg-info bg-opacity-10 p-2 rounded-circle me-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                                        <i className="bi bi-building-fill fs-6"></i>
                                                    </span>
                                                    Room Allocation
                                                </h6>
                                                <div className="row g-4">
                                                    <div className="col-md-6 col-lg-3">
                                                        <label className="form-label fw-600 smaller text-uppercase text-muted ps-1">Hostel</label>
                                                        <div className="input-group">
                                                            <span className="input-group-text bg-white bg-opacity-10 border-end-0 text-muted"><i className="bi bi-buildings"></i></span>
                                                            <select className="form-select form-select-lg fs-6 border-start-0 ps-0" name="hostelId" value={formData.hostelId} onChange={handleInputChange} required>
                                                                <option value="">Select Hostel</option>
                                                                {hostels.map((hostel, index) => (
                                                                    <option key={hostel.hostelId || hostel.id || index} value={hostel.hostelId || hostel.id}>{hostel.hostelName}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6 col-lg-3">
                                                        <label className="form-label fw-600 smaller text-uppercase text-muted ps-1">Room Number</label>
                                                        <div className="input-group">
                                                            <span className="input-group-text bg-white bg-opacity-10 border-end-0 text-muted"><i className="bi bi-door-open"></i></span>
                                                            <select
                                                                className="form-select form-select-lg fs-6 border-start-0 ps-0"
                                                                name="roomId"
                                                                value={formData.roomId}
                                                                onChange={handleRoomChange}
                                                                required
                                                            >
                                                                <option value="">Select Room</option>
                                                                {availableRooms.map(r => (
                                                                    <option key={r.id || r.roomId} value={r.id || r.roomId}>
                                                                        {r.roomNumber} {r.type ? `(${r.type.toUpperCase()})` : ''}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6 col-lg-3">
                                                        <label className="form-label fw-600 smaller text-uppercase text-muted ps-1">Join Date</label>
                                                        <input type="date" className="form-control form-control-lg fs-6" name="joinDate" value={formData.joinDate} onChange={handleInputChange} required />
                                                    </div>
                                                    <div className="col-md-6 col-lg-3">
                                                        <label className="form-label fw-600 smaller text-uppercase text-muted ps-1">Status</label>
                                                        <select className="form-select form-select-lg fs-6 cursor-pointer" name="status" value={formData.status} onChange={handleInputChange}>
                                                            <option value="ACTIVE">ACTIVE</option>
                                                            <option value="CHECKED_OUT">CHECKED OUT</option>
                                                            <option value="CANCELLED">CANCELLED</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>


                            <div className="p-4 border-top border-light bg-white bg-opacity-5 d-flex justify-content-between align-items-center">
                                <div className="text-muted small">
                                    <i className="bi bi-info-circle me-1"></i>
                                    All fields marked with * are mandatory
                                </div>
                                <div className="d-flex gap-3">
                                    <button type="button" className="btn btn-light px-4 rounded-pill fw-500 shadow-sm" onClick={() => { setShowModal(false); setEditingStudent(null); }}>Discard Changes</button>
                                    <button type="submit" form="studentForm" className="btn-premium btn-premium-primary rounded-pill px-5 shadow-lg">
                                        {editingStudent ? 'Update Student' : 'Confirm Registration'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div >
                </div >
            )}

            <style>{`
                .modal-xl { max-width: 1140px; }
                .fw-600 { font-weight: 600; }
                .cursor-pointer { cursor: pointer; }
                .smaller { font-size: 0.7rem; letter-spacing: 0.5px; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(var(--primary-rgb), 0.4); }
                .input-group-text { background-color: transparent; }
                .form-control:focus, .form-select:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 0.25rem rgba(var(--primary-rgb), 0.1);
                }
            `}</style>
        </div >
    );


};

export default StudentDetails;
