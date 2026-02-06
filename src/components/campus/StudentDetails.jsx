import React from 'react';
import DataTable from '../common/DataTable';
import { useStudentContext } from '../../context/StudentContext';
import { FaTrash, FaEdit } from 'react-icons/fa';
import { MdOutlineDelete } from "react-icons/md";
import campusService from '../../services/campusService';

const StudentDetails = () => {
    const { students, addStudent, updateStudent, deleteStudent, setSelectedStudentFilter } = useStudentContext();
    const [showModal, setShowModal] = React.useState(false);
    // const [deleteMode, setDeleteMode] = React.useState(false);
    const [editingStudent, setEditingStudent] = React.useState(null);
    const [hostels, setHostels] = React.useState([]);
    const [rooms, setRooms] = React.useState([]);
    const [formData, setFormData] = React.useState({
        studentId: '', // Hidden ID for DB1 reference
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

    // DB1 Search State
    const [db1SearchTerm, setDb1SearchTerm] = React.useState('');
    const [db1SearchResults, setDb1SearchResults] = React.useState([]);
    const [isSearchingDB1, setIsSearchingDB1] = React.useState(false);

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

    // DB1 Search Function (Called when typing in New Student Modal)
    React.useEffect(() => {
        const searchDB1 = async () => {
            if (db1SearchTerm.length < 2) {
                setDb1SearchResults([]);
                return;
            }
            setIsSearchingDB1(true);
            try {
                // Fetch all and filter client-side (Optimizable via backend search API)
                const response = await campusService.getAllStudents(); // DB1
                const allStudents = Array.isArray(response) ? response : (response.data || response.students || []);

                const filtered = allStudents.filter(s => {
                    const firstName = s.user?.firstName || s.firstName || s.name || '';
                    const lastName = s.user?.lastName || s.lastName || '';
                    const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
                    const email = (s.user?.email || s.email || '').toLowerCase();
                    const query = db1SearchTerm.toLowerCase();

                    return fullName.includes(query) || email.includes(query);
                });

                // Fetch parents only if we have results to map (Optimization)
                // For simplicity, we might just assume the user object has parent info or fetch parent on selection
                // We need to fetch parents to get fatherName... this is tricky without a dedicated "Get Full Student" API.
                // Let's rely on what getAllStudents returns for now, or fetch parents in parallel if affordable.
                // Plan: Fetch parents once on mount (cached) or on search? 
                // Better: Fetch parents ONLY when selecting the student? 
                // Let's fetch all parents for lookup if term > 2
                if (filtered.length > 0) {
                    // const parents = await campusService.getAllParents();
                    // Simplified: Just use student info first. 
                }

                setDb1SearchResults(filtered.slice(0, 5)); // Limit to 5
            } catch (error) {
                console.error("DB1 Search failed", error);
            } finally {
                setIsSearchingDB1(false);
            }
        };

        const timeoutId = setTimeout(searchDB1, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [db1SearchTerm]);

    const handleSelectDB1Student = async (student) => {
        // Fetch parent details for this specific student if not present
        // Or assume user inputs it. 
        // Let's try to find parent info from getAllParents() 
        let parentName = '';
        let parentPhone = '';

        try {
            const allParents = await campusService.getAllParents();
            const parentsList = Array.isArray(allParents) ? allParents : (allParents.parent ? [allParents] : []);
            // Logic to find parent... reused from old context
            // This is heavy but correct per requirement to get data from DB1
            // Iterate to find relation
            for (const pItem of parentsList) {
                const pData = pItem.user ? pItem : (pItem.parent || null);
                if (pData && pData.students) {
                    const isParent = pData.students.some(rel => rel.relId === (student.parents?.[0]?.relId));
                    // Or match by student ID if available in relation?
                    // Assuming structure
                    if (isParent) {
                        parentName = `${pData.user.firstName} ${pData.user.lastName}`;
                        parentPhone = pData.user.phone;
                        break;
                    }
                }
            }
        } catch (e) { console.warn("Could not fetch parents for autofill", e); }

        setFormData({
            ...formData,
            studentId: student.id || student.studentId || student.userId,
            studentName: `${student.user?.firstName || student.firstName || ''} ${student.user?.lastName || student.lastName || ''}`.trim(),
            studentEmail: student.user?.email || student.email || '',
            fatherName: parentName || student.fatherName || '',
            fatherPhone: parentPhone || student.fatherPhone || '',
        });
        setDb1SearchTerm('');
        setDb1SearchResults([]);
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

        // Validate required fields
        if (!formData.hostelId || !formData.roomId) {
            alert("Please select both a Hostel and a Room.");
            return;
        }

        // Robust ID extraction
        // If isAllocation is false, editingStudent.id IS the studentId (dbId)
        // For NEW allocations, use the studentId from the selected DB1 student (formData)
        const sId = editingStudent?.studentId ||
            (editingStudent && !editingStudent.isAllocation ? editingStudent.id : null) ||
            formData.studentId;

        const payload = {
            ...formData,
            // Explicitly map IDs for backend
            studentId: sId,
            student: sId ? { id: sId } : null,

            // Send ONLY IDs for existing entities to avoid transient value errors
            // JPA/Hibernate often fails if we send full objects with nulls or detached states
            hostel: {
                id: Number(formData.hostelId),
                hostelId: Number(formData.hostelId)
            },

            room: {
                id: Number(formData.roomId),
                roomId: Number(formData.roomId),
                roomNumber: formData.roomNumber
            },

            // Ensure numeric values are parsed
            monthlyFee: parseFloat(formData.monthlyFee) || 0,
            totalFee: parseFloat(formData.totalFee) || 0,
            amountPaid: parseFloat(formData.amountPaid) || 0,
            dueAmount: parseFloat(formData.dueAmount) || 0,
        };

        console.log("Submitting Allocation Payload:", payload); // Debug log

        if (editingStudent && students.some(s => s.id === editingStudent.id)) {
            // Update existing allocation (It's in the DB2 list)
            updateStudent(editingStudent.id, payload);
        } else {
            // Create new allocation
            // Note: createAllocation requires a valid studentId. 
            if (!sId) {
                console.error("Cannot create allocation: Missing Student ID", editingStudent);
                alert("Error: Cannot identify the student account. Please ensure the student is registered correctly.");
                return;
            }
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
            hostelId: student.hostel?.hostelId || student.hostel?.id || student.hostelId || '',
            roomId: student.room?.roomId || student.room?.id || student.roomId || '',
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
            // Check if this student is a stored resident (exists in global 'students' context)
            const isResident = students.some(s => s.id === id);

            if (isResident) {
                // It's a real allocation: delete from backend
                deleteStudent(id);
            } else {
                // It's a transient view (unsaved): just remove from the list
                setDisplayedStudents(prev => prev.filter(s => s.id !== id));
            }
        }
    };

    // const toggleDeleteMode = () => {
    //     setDeleteMode(!deleteMode);
    // };

    const [displayedStudents, setDisplayedStudents] = React.useState([]);
    const [selectedStudentForView, setSelectedStudentForView] = React.useState('');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [studentSelectionSearch, setStudentSelectionSearch] = React.useState('');

    // DB1 Data State
    const [allDB1Students, setAllDB1Students] = React.useState([]);
    const [allDB1Parents, setAllDB1Parents] = React.useState([]);

    // Fetch DB1 Students AND Parents for the Dropdown/Lookup
    React.useEffect(() => {
        const fetchDB1 = async () => {
            try {
                // Parallel fetch for better performance
                const [studentsRes, parentsRes] = await Promise.all([
                    campusService.getAllStudents(),
                    campusService.getAllParents()
                ]);

                const studentData = Array.isArray(studentsRes) ? studentsRes : (studentsRes.data || studentsRes.students || []);
                setAllDB1Students(studentData);

                const parentData = Array.isArray(parentsRes) ? parentsRes : (parentsRes.data || parentsRes.parents || []);
                setAllDB1Parents(parentData);
            } catch (error) {
                console.error("Failed to fetch DB1 data", error);
            }
        };
        fetchDB1();
    }, []);

    // Sync displayedStudents with global students (DB2 residents) context
    // AND keep manually added DB1 students visible (until they are saved and become residents)
    React.useEffect(() => {
        setDisplayedStudents(prevDisplayed => {
            // 1. Get all current DB2 residents (fresh data)
            const freshResidents = students;

            // 2. Identify transient (unsaved) students currently in the view
            // These are students from DB1 who are NOT yet in the DB2 list.
            // FIX: Only keep transients that are explicitly marked as NEW_ENTRY (unsaved).
            // This prevents deleted residents (who were ACTIVE) from reappearing as 'unsaved' items.
            const residentStudentIds = new Set(freshResidents.map(r => r.studentId));
            const transients = prevDisplayed.filter(d =>
                d.status === 'NEW_ENTRY' &&
                d.studentId &&
                !residentStudentIds.has(d.studentId)
            );

            // 3. Merge: Residents + Transients
            return [...freshResidents, ...transients];
        });
    }, [students]);


    const handleAddStudentToView = () => {
        if (!selectedStudentForView) return;

        // Find in DB1 list first
        const db1Student = allDB1Students.find(s => (s.id || s.studentId).toString() === selectedStudentForView);

        // Check if this student is ALREADY a resident (in DB2 list)
        // If so, prefer the resident object as it has room details
        const existingResident = students.find(s =>
            (s.studentId && db1Student && s.studentId === (db1Student.id || db1Student.studentId))
        );

        // Find Parent Info from DB1 Logic
        let parentName = '';
        let parentPhone = '';
        if (db1Student && allDB1Parents.length > 0) {
            try {
                // Try to find via relationship ID (most reliable if structure holds)
                const studentRelId = db1Student.parents?.[0]?.relId;

                for (const p of allDB1Parents) {
                    const pUser = p.user || p; // Handle nested user object
                    const pStudents = p.students || pUser.students || [];

                    // Check relation
                    const match = pStudents.some(s => s.relId === studentRelId) ||
                        pStudents.some(s => (s.id || s.studentId) === (db1Student.id || db1Student.studentId));

                    if (match) {
                        parentName = `${pUser.firstName || ''} ${pUser.lastName || ''}`.trim();
                        parentPhone = pUser.phone || '';
                        break;
                    }
                }
            } catch (e) {
                console.warn("Parent lookup failed", e);
            }
        }

        const studentToAdd = existingResident || (db1Student ? {
            ...db1Student,
            id: db1Student.id || db1Student.studentId, // Temporary ID for table key
            studentId: db1Student.id || db1Student.studentId, // DB1 ID

            // Map for TABLE DISPLAY (accessors are lowercase)
            firstname: db1Student.user?.firstName || db1Student.firstName,
            lastname: db1Student.user?.lastName || db1Student.lastName,
            email: db1Student.user?.email || db1Student.email,

            // Map for FORM/EDIT
            studentName: `${db1Student.user?.firstName || db1Student.firstName} ${db1Student.user?.lastName || db1Student.lastName}`,
            studentEmail: db1Student.user?.email || db1Student.email,

            // Populate fetched Parent Info
            fatherName: parentName || db1Student.fatherName || '',
            fatherPhone: parentPhone || db1Student.fatherPhone || '',

            status: 'NEW_ENTRY', // distiguish in UI?
            roomNumber: '-',
            hostel: null,
            room: null
        } : null);

        if (studentToAdd) {
            // Check existence
            const alreadyDisplayed = displayedStudents.some(s => (s.studentId || s.id) === (studentToAdd.studentId || studentToAdd.id));

            if (!alreadyDisplayed) {
                // AUTO-SAVE ATTEMPT
                if (!existingResident) {
                    // Try to save to DB2 immediately
                    // Try to save to DB2 immediately
                    const today = new Date().toISOString().split('T')[0];
                    addStudent({
                        studentId: studentToAdd.studentId,
                        studentName: studentToAdd.studentName,
                        firstname: studentToAdd.firstname, // Send explicit parts too just in case
                        lastname: studentToAdd.lastname,
                        studentEmail: studentToAdd.studentEmail,
                        fatherName: studentToAdd.fatherName,
                        fatherPhone: studentToAdd.fatherPhone,
                        status: 'ACTIVE',
                        hostel: null,
                        room: null,
                        // Defaults for required fields
                        joinDate: today,
                        monthlyFee: 0,
                        totalFee: 0,
                        amountPaid: 0,
                        dueAmount: 0
                    }).then(() => {
                        console.log("Auto-saved student to DB2");
                    }).catch(err => {
                        console.warn("Auto-save failed.", err);
                        const msg = err.response?.data?.message || err.message || "Unknown error";
                        alert(`Auto-save failed: ${msg}. Added to view. Please assign a Room and Save manually.`);
                    });
                }

                // Add to local view immediately (optimistic update)
                setDisplayedStudents(prev => [...prev, studentToAdd]);
            }

            setSelectedStudentForView(''); // Reset dropdown
            setSelectedStudentFilter(studentToAdd);
        }
    };

    const handleClearView = () => {
        setDisplayedStudents([]);
    };

    const filteredStudents = displayedStudents.filter(student =>
        (student.id?.toString()?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (student.studentName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (student.studentEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    ) || [];

    const availableRooms = rooms.filter(r => {
        // Show rooms that match the selected hostel OR have no hostel assigned (global rooms)
        // Also ensure we only show rooms that are not FULL (optional, but good UX)
        const hId = r.hostel?.id || r.hostelId || r.hostel;
        const matchesHostel = !hId || (formData.hostelId && String(hId) === String(formData.hostelId));
        // const isAvailable = r.status !== 'FULL' && (r.vacant > 0 || r.capacity > r.occupied);
        return matchesHostel; // && isAvailable;
    });

    const columns = [
        { header: 'ID', accessor: 'id' },
        { header: 'First Name', accessor: 'firstname' },
        { header: 'Last Name', accessor: 'lastname' },
        { header: 'Email', accessor: 'email' },
        { header: 'Parent Name', accessor: (row) => row.fatherName || '-' },
        { header: 'Parent Number', accessor: (row) => row.fatherPhone || '-' },
        { header: 'Room Number', accessor: (row) => row.room?.roomNumber || row.roomNumber || '-' },
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

            {/* Student Selection Control */}
            <div className="card border-0 shadow-sm mb-4 glass-card">
                <div className="card-body p-4">
                    <div className="row g-3 align-items-center">
                        <div className="col-md-6">
                            <label className="form-label text-muted small fw-bold">SELECT STUDENT TO VIEW</label>
                            <div className="input-group mb-2">
                                <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-search"></i></span>
                                <input
                                    type="text"
                                    className="form-control border-start-0 ps-0 text-muted"
                                    placeholder="Type to search student name..."
                                    value={studentSelectionSearch}
                                    onChange={(e) => setStudentSelectionSearch(e.target.value)}
                                />
                            </div>
                            <select
                                className="form-select"
                                value={selectedStudentForView}
                                onChange={(e) => setSelectedStudentForView(e.target.value)}
                                size={5}
                                style={{ maxHeight: '150px' }}
                            >
                                <option value="" disabled>-- Select from results --</option>
                                {allDB1Students
                                    .filter(s => {
                                        if (!studentSelectionSearch) return true;
                                        const term = studentSelectionSearch.toLowerCase();
                                        const name = (s.user?.firstName || s.firstName || s.name || '').toLowerCase();
                                        const lname = (s.user?.lastName || s.lastName || '').toLowerCase();
                                        const email = (s.user?.email || s.email || '').toLowerCase();
                                        return name.includes(term) || lname.includes(term) || email.includes(term);
                                    })
                                    .slice(0, 50) // Performance optimization
                                    .map(s => {
                                        const name = `${s.user?.firstName || s.firstName || s.name || ''} ${s.user?.lastName || s.lastName || ''}`.trim();
                                        const email = s.user?.email || s.email || '';
                                        return (
                                            <option key={s.id || s.studentId} value={s.id || s.studentId}>
                                                {name} {email ? `(${email})` : ''}
                                            </option>
                                        );
                                    })}
                            </select>
                            <div className="form-text text-muted small mt-1 d-flex justify-content-between">
                                <span>
                                    {studentSelectionSearch
                                        ? `Found ${allDB1Students.filter(s => {
                                            const term = studentSelectionSearch.toLowerCase();
                                            const name = (s.user?.firstName || s.firstName || s.name || '').toLowerCase();
                                            const email = (s.user?.email || s.email || '').toLowerCase();
                                            return name.includes(term) || email.includes(term);
                                        }).length} matches`
                                        : `Total Students (DB1): ${allDB1Students.length}`}
                                </span>
                                {studentSelectionSearch && <span className="text-secondary cursor-pointer" onClick={() => setStudentSelectionSearch('')}>Clear Search</span>}
                            </div>
                        </div>
                        <div className="col-md-6 d-flex gap-2 align-items-end" style={{ paddingTop: '28px' }}>
                            <button
                                className="btn btn-primary px-4"
                                onClick={handleAddStudentToView}
                                disabled={!selectedStudentForView}
                            >
                                <i className="bi bi-plus-lg me-2"></i>
                                Add to View
                            </button>
                            {displayedStudents.length > 0 && (
                                <button
                                    className="btn btn-light border text-danger"
                                    onClick={handleClearView}
                                >
                                    Clear List
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <DataTable
                title="Resident Students List"
                columns={columns}
                data={filteredStudents}
                actions={
                    <div className="d-flex gap-2 align-items-center">
                        <div className="input-group input-group-sm me-2" style={{ width: '250px' }}>
                            <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-search"></i></span>
                            <input
                                type="text"
                                className="form-control border-start-0 ps-0"
                                placeholder="Filter displayed list..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
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

                                                {/* DB1 Search (Only for New Registration) */}
                                                {!editingStudent && (
                                                    <div className="mb-4 position-relative">
                                                        <label className="form-label fw-bold text-info"><i className="bi bi-search me-1"></i>Search from Student Database (DB1)</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Type name or email to search..."
                                                            value={db1SearchTerm}
                                                            onChange={(e) => setDb1SearchTerm(e.target.value)}
                                                        />
                                                        {isSearchingDB1 && <div className="text-muted small mt-1">Searching...</div>}
                                                        {db1SearchResults.length > 0 && (
                                                            <ul className="list-group position-absolute w-100 shadow-lg" style={{ zIndex: 1050, maxHeight: '200px', overflowY: 'auto' }}>
                                                                {db1SearchResults.map(s => (
                                                                    <button
                                                                        key={s.id || s.studentId}
                                                                        type="button"
                                                                        className="list-group-item list-group-item-action"
                                                                        onClick={() => handleSelectDB1Student(s)}
                                                                    >
                                                                        <strong>{s.user?.firstName || s.firstName} {s.user?.lastName || s.lastName}</strong>
                                                                        <br />
                                                                        <small className="text-muted">{s.user?.email || s.email}</small>
                                                                    </button>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="row g-4">
                                                    <div className="col-md-6 col-lg-3">
                                                        <label className="form-label fw-600 smaller text-uppercase text-muted ps-1">Student Name</label>
                                                        <input type="text" className="form-control form-control-lg fs-6" name="studentName" value={formData.studentName} onChange={handleInputChange} placeholder="e.g. John Doe" required readOnly={!editingStudent} />
                                                    </div>
                                                    <div className="col-md-6 col-lg-3">
                                                        <label className="form-label fw-600 smaller text-uppercase text-muted ps-1">Email Address</label>
                                                        <input type="email" className="form-control form-control-lg fs-6" name="studentEmail" value={formData.studentEmail} onChange={handleInputChange} placeholder="name@example.com" required readOnly={!editingStudent} />
                                                    </div>
                                                    <div className="col-md-6 col-lg-3">
                                                        <label className="form-label fw-600 smaller text-uppercase text-muted ps-1">Parent Name</label>
                                                        <input type="text" className="form-control form-control-lg fs-6" name="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="Parent/Guardian Name" required />
                                                    </div>
                                                    <div className="col-md-6 col-lg-3">
                                                        <label className="form-label fw-600 smaller text-uppercase text-muted ps-1">Parent Number</label>
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
