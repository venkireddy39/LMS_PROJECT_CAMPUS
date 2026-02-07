import React, { useState, useEffect, useMemo } from 'react';
import StatsCard from '../common/StatsCard';
import DataTable from '../common/DataTable';
import campusService from '../../services/campusService';
import { useStudentContext } from '../../context/StudentContext';
import { MdCommentBank } from "react-icons/md";

const Attendance = () => {
    const { getActiveStudents, selectedStudentFilter } = useStudentContext();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [filter, setFilter] = useState('All');

    // State for managing data and modal
    const [data, setData] = useState([]);
    const [hostels, setHostels] = useState([]);
    const [hostelFilter, setHostelFilter] = useState('All');

    // ... modal states
    const [showRemarkModal, setShowRemarkModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [remarkText, setRemarkText] = useState('');
    const [notifiedStudents, setNotifiedStudents] = useState({}); // Tracking notification status

    useEffect(() => {
        loadHostels();
    }, []);

    useEffect(() => {
        loadAttendance();
    }, [date]);

    const loadHostels = async () => {
        try {
            console.log("Fetching Hostels List...");
            const response = await campusService.getAllHostels();
            // console.log("Hostels Response:", response);
            const hostelList = Array.isArray(response) ? response : (response.data || []);
            setHostels(hostelList);
        } catch (err) {
            console.error("Failed to load hostels", err);
        }
    };

    // Filter data by selected date and status
    const filteredData = data.filter(item => {
        // Handle both 'date' and 'attendanceDate' for backward compatibility/API variance
        // Normalize comparison to YYYY-MM-DD string
        const recordDateStr = String(item.attendanceDate || item.date || '').split('T')[0];
        const selectedDateStr = String(date).split('T')[0];

        const dateMatch = recordDateStr === selectedDateStr;
        const statusMatch = filter === 'All' || item.status === filter;

        // Added student filter logic
        const studentMatch = selectedStudentFilter
            ? (item.studentName === selectedStudentFilter.studentName || item.studentId === selectedStudentFilter.studentId)
            : true;

        // Robust Hostel Filter Logic
        // Check all possible locations for hostel name in the complex object graph
        const itemHostel = item.hostelName ||
            item.room?.hostel?.name ||
            item.student?.room?.hostel?.name ||
            item.room?.hostelName ||
            '';

        const hostelMatch = hostelFilter === 'All' || (itemHostel && itemHostel === hostelFilter);

        // Debug logging primarily for first item if debug needed, but keeping it clean for production
        // if (!dateMatch) console.log("Date mismatch:", recordDateStr, selectedDateStr);

        return dateMatch && statusMatch && studentMatch && hostelMatch;
    });

    // Group residents by room for the "Room Cards" view
    const roomStats = useMemo(() => {
        if (hostelFilter === 'All') return [];

        const stats = {};
        filteredData.forEach(item => {
            // Normalize room number extraction
            const room = item.roomNo || item.roomNumber || 'N/A';
            if (!stats[room]) {
                stats[room] = { room, total: 0, present: 0, absent: 0 };
            }
            stats[room].total++;
            if (item.status === 'PRESENT' || item.status === 'present') stats[room].present++;
            else stats[room].absent++;
        });

        // Sort naturally (101, 102, 110)
        return Object.values(stats).sort((a, b) =>
            String(a.room).localeCompare(String(b.room), undefined, { numeric: true })
        );
    }, [filteredData, hostelFilter]);

    const loadAttendance = async () => {
        try {
            // Fetch Attendance (ALL dates to ensure no filter mismatch) AND Rooms AND Allocations (for roster)
            const [attendanceRes, roomsRes, allocationsRes] = await Promise.all([
                campusService.getAllAttendance(), // Fetch all, let frontend filter
                campusService.getAllRooms().catch(() => []),
                campusService.getAllAllocations().catch(() => [])
            ]);

            // console.log("Raw Attendance Data:", attendanceRes);
            const allRooms = Array.isArray(roomsRes) ? roomsRes : (roomsRes.data || []);
            const allAllocations = Array.isArray(allocationsRes) ? allocationsRes : (allocationsRes.data || []);

            let attendanceData = [];
            if (Array.isArray(attendanceRes)) {
                attendanceData = attendanceRes;
            } else if (attendanceRes && Array.isArray(attendanceRes.data)) {
                attendanceData = attendanceRes.data;
            } else if (attendanceRes && Array.isArray(attendanceRes.content)) {
                attendanceData = attendanceRes.content;
            }

            // Filter attendance for CURRENT selected date to see if we have records
            const selectedDateStr = String(date).split('T')[0];
            const recordsForDate = attendanceData.filter(item => {
                const itemDate = String(item.attendanceDate || item.date || '').split('T')[0];
                return itemDate === selectedDateStr;
            });

            let finalData = [];

            if (recordsForDate.length > 0) {
                // If we have records, just show them
                finalData = attendanceData;
            } else {
                // If NO records for this date, show the ROSTER from Allocations
                const activeAllocations = allAllocations.filter(a => a.status === 'ACTIVE' || a.status === 'active');

                // Map allocations to "Draft" attendance records
                const rosterData = activeAllocations.map(alloc => {
                    const properStudentId = alloc.studentId || alloc.student?.id;

                    // Resolve Name
                    const fName = alloc.firstName || alloc.student?.firstName || (alloc.studentName ? alloc.studentName.split(' ')[0] : '');
                    const lName = alloc.lastName || alloc.student?.lastName || (alloc.studentName ? alloc.studentName.split(' ').slice(1).join(' ') : '');
                    let fullName = `${fName} ${lName}`.trim();
                    if (!fullName) fullName = alloc.studentName || 'Unknown';

                    // Resolve Room
                    const roomId = alloc.roomId || alloc.room?.id || alloc.room?.roomId;
                    const roomNumber = alloc.roomNumber || alloc.room?.roomNumber || '-';

                    if (!properStudentId) return null; // Skip invalid

                    return {
                        id: `temp-${properStudentId}`, // Temp ID
                        isDraft: true,
                        attendanceDate: date,
                        studentName: fullName,
                        studentId: properStudentId,
                        roomId: roomId,
                        room: alloc.room || { id: roomId, roomNumber: roomNumber },
                        roomNumber: roomNumber,
                        roomNo: roomNumber,
                        status: 'NOT_MARKED',
                        remarks: '',
                        hostelName: alloc.hostelName || alloc.hostel?.hostelName || alloc.room?.hostel?.hostelName || ''
                    };
                }).filter(Boolean);

                finalData = rosterData;
            }

            // Normalize data for the table
            const normalizedData = finalData.map(item => {
                // ... (Existing normalization logic, adapted) ... 
                const roomNumber = item.roomNo || item.roomNumber || item.room?.roomNumber || '-';
                const roomId = item.roomId || item.room?.id;

                // Find matching room in full list to get Hostel Name
                const matchedRoom = allRooms.find(r =>
                    (roomId && (r.id === roomId || r.roomId === roomId)) ||
                    (r.roomNumber === roomNumber)
                );
                const resolvedHostelName = item.hostelName || matchedRoom?.hostel?.name || matchedRoom?.hostelName || matchedRoom?.hostel?.hostelName || 'Unknown';

                return {
                    ...item,
                    studentName: item.studentName || 'Unknown', // Ensure name
                    roomNo: roomNumber,
                    hostelName: resolvedHostelName,
                    status: item.status ? item.status.toUpperCase() : 'PRESENT',
                    isDraft: item.isDraft
                };
            });

            setData(normalizedData);
        } catch (error) {
            console.error("Failed to load attendance", error);
        }
    };

    // Handle Status Toggle
    const handleStatusToggle = async (record) => {
        // If it's a DRAFT, clicking means "Mark as X". Default to PRESENT if currently NOT_MARKED/DRAFT
        let newStatus = record.status === 'PRESENT' ? 'ABSENT' : 'PRESENT';

        if (record.isDraft || record.status === 'NOT_MARKED') {
            // First interaction with draft -> Create Record
            // If they click on "Absent" button (which we will add), status becomes ABSENT.
            // But here we are toggling. If status is NOT_MARKED, what did they click?
            // We will simplify: The UI will show "Mark Present" / "Mark Absent" buttons.
            // If they click Present button, newStatus = PRESENT.
            // Ideally, we accept the desired status as an arg.
            // Let's modify the signature or assume Toggle behavior is "Mark Present" from "Not Marked"
            newStatus = 'PRESENT'; // Default first click
        }

        // Helper to allow passing specific status override
        const performUpdate = async (targetStatus) => {
            try {
                if (record.isDraft) {
                    // CREATE logic specific for single record from draft
                    const attendancePayload = {
                        studentId: record.studentId,
                        student: { id: record.studentId },
                        studentName: record.studentName,
                        roomId: record.roomId || record.room?.id,
                        room: record.room, // Pass full object if available
                        roomNumber: record.roomNo,
                        attendanceDate: date,
                        status: targetStatus
                    };
                    await campusService.markAttendance(attendancePayload);
                } else {
                    // UPDATE logic
                    const updatedRecord = { ...record, status: targetStatus };
                    await campusService.updateAttendance(record.id, updatedRecord);
                }

                // Reload to reflect changes (and turn draft into real record)
                loadAttendance();

                if (targetStatus === 'ABSENT') {
                    sendParentNotification(record);
                }

            } catch (error) {
                console.error("Failed to update status", error);
                alert("Failed to update status");
            }
        };

        performUpdate(newStatus);
    };

    // Modified to accept status explicitly
    const setStatus = (record, status) => {
        // Just reuse logic
        const performUpdate = async () => {
            try {
                if (record.isDraft) {
                    const attendancePayload = {
                        studentId: record.studentId,
                        student: { id: record.studentId },
                        studentName: record.studentName,
                        roomId: record.roomId || record.room?.id,
                        room: record.room,
                        roomNumber: record.roomNo,
                        attendanceDate: date,
                        status: status
                    };
                    await campusService.markAttendance(attendancePayload);
                } else {
                    const updatedRecord = { ...record, status: status };
                    await campusService.updateAttendance(record.id, updatedRecord);
                }
                loadAttendance();
                if (status === 'ABSENT') sendParentNotification(record);
            } catch (e) { console.error(e); alert("Action failed"); }
        }
        performUpdate();
    }

    // Simulate Sending Notification
    const sendParentNotification = (record) => {
        const student = getActiveStudents().find(s => s.name === record.studentName);
        const parentPhone = student?.fatherPhone || 'Unknown';

        setNotifiedStudents(prev => ({ ...prev, [record.id]: 'Sending...' }));

        console.log(`[SMS Gateway] Sending alert to ${parentPhone}: "Dear Parent, ${record.studentName} is marked ABSENT on ${record.date}."`);

        // Simulate network delay
        setTimeout(() => {
            setNotifiedStudents(prev => ({ ...prev, [record.id]: 'Delivered' }));
        }, 1500);
    };

    // Handle Add/Edit Remark
    const handleAddRemark = (record) => {
        setEditingRecord(record);
        setRemarkText(record.remarks || '');
        setShowRemarkModal(true);
    };

    // Handle Save Remark
    const handleSaveRemark = async (e) => {
        e.preventDefault();
        if (!editingRecord) return;

        try {
            // Assuming updateAttendance updates remarks too
            const updatedItem = { ...editingRecord, remarks: remarkText };
            await campusService.updateAttendance(editingRecord.id, updatedItem);

            const updatedData = data.map(item => {
                if (item.id === editingRecord.id) {
                    return { ...item, remarks: remarkText };
                }
                return item;
            });

            setData(updatedData);
            setShowRemarkModal(false);
            setEditingRecord(null);
            setRemarkText('');
        } catch (error) {
            console.error("Failed to save remark", error);
            alert("Failed to save remark");
        }
    };

    // Handle Mark Attendance for a new day
    const handleMarkAttendance = async () => {
        // Check if we have REAL records (not drafts)
        const hasRealData = data.some(d => !d.isDraft && d.status !== 'NOT_MARKED');
        if (hasRealData) {
            alert('Attendance already exists for this date!');
            return;
        }

        try {
            // Fetch fresh list of residents - FROM ALL STUDENTS (to allow those without rooms)
            console.log("Fetching resident list for attendance...");

            let residents = [];
            let allRooms = [];

            try {
                // USER REQUEST: Fetch students form the Fee & Payment Management logic
                // Fetch Fees and Allocations and merge to get the robust student list
                console.log("Fetching resident list from Fees & Allocations...");

                const [feesResponse, allocationsResponse, roomsResponse] = await Promise.all([
                    campusService.getAllFees(),
                    campusService.getAllAllocations(), // Get all allocations to match Fees
                    campusService.getAllRooms().catch(() => [])
                ]);

                const feesList = Array.isArray(feesResponse) ? feesResponse : (feesResponse.data || []);
                const allocationsList = Array.isArray(allocationsResponse) ? allocationsResponse : (allocationsResponse.data || []);
                allRooms = Array.isArray(roomsResponse) ? roomsResponse : (roomsResponse.data || []);

                // Deduplicate and Merge (Logic from FeeManagement.jsx)
                const processedStudents = new Set();
                residents = [];

                // 1. Process from Allocations first (Primary source for Room Info)
                // Filter by ACTIVE manually since we fetched all
                const activeAllocations = allocationsList.filter(a => a.status === 'ACTIVE' || a.status === 'active');

                activeAllocations.forEach(alloc => {
                    // Use robust ID extraction: explicit studentId > nested student.id
                    // CRITICAL: Do NOT use alloc.id as fallback, that is the Allocation ID, not Student ID.
                    const properStudentId = alloc.studentId || alloc.student?.id;

                    if (!properStudentId) {
                        console.warn("Skipping resident with missing Student ID (alloc.id=" + alloc.id + ")", alloc);
                        return;
                    }

                    const uniqueKey = properStudentId.toString();
                    if (processedStudents.has(uniqueKey)) return;

                    // Resolve Name
                    const fName = alloc.firstName || alloc.firstname || alloc.student?.firstName || (alloc.studentName ? alloc.studentName.split(' ')[0] : '');
                    const lName = alloc.lastName || alloc.lastname || alloc.student?.lastName || (alloc.studentName ? alloc.studentName.split(' ').slice(1).join(' ') : '');
                    let fullName = `${fName} ${lName}`.trim();
                    if (!fullName) fullName = alloc.studentName || 'Unknown';

                    residents.push({
                        ...alloc,
                        studentName: fullName,
                        studentId: properStudentId,
                        roomId: alloc.roomId || alloc.room?.id,
                        roomNumber: alloc.roomNumber || alloc.room?.roomNumber || '-'
                    });
                    processedStudents.add(uniqueKey);
                });

                // 2. Add students from Fees list who might be missing in active allocations
                // (User specifically asked for Fee list source)
                feesList.forEach(fee => {
                    // Try to identify student
                    const studentId = fee.studentId || fee.student?.id;
                    const studentName = fee.studentName || fee.student?.name;

                    if (!studentId && !studentName) return;

                    const uniqueKey = (studentId || studentName).toString();

                    if (!processedStudents.has(uniqueKey)) {
                        residents.push({
                            studentName: studentName || 'Unknown',
                            studentId: studentId,
                            roomNumber: '-', // Room unknown if only in Fee
                            roomId: null,
                            status: 'ACTIVE'
                        });
                        processedStudents.add(uniqueKey);
                    }
                });

            } catch (err) {
                console.error("Error fetching resident list:", err);
                alert(`Error loading data: ${err.message}`);
                return; // Stop if data load fails
            }

            if (!residents || residents.length === 0) {
                alert('No students found in the system. Please add students first.');
                return;
            }

            // Process each resident sequentially with validation
            let successCount = 0;
            let failures = [];

            // Use the rooms list we already fetched
            const allRoomsForLookup = allRooms;

            for (const alloc of residents) {
                // ⛔ STOP if no room / no allocation (Backend Requirement)
                // Attempt robust extraction including fallback to roomNumber lookup
                let roomId = alloc.roomId || alloc.room?.id || alloc.room?.roomId;
                const roomNumber = alloc.roomNumber || alloc.room?.roomNumber;

                // Fallback: If ID is missing, try to find it via Room Number
                if (!roomId && roomNumber && roomNumber !== '-') {
                    const matched = allRoomsForLookup.find(r => String(r.roomNumber) === String(roomNumber));
                    if (matched) {
                        roomId = matched.id || matched.roomId;
                        console.log(`Recovered Room ID for ${alloc.studentName} using Room Number ${roomNumber}: ${roomId}`);
                    }
                }

                const allocationStatus = alloc.status || 'ACTIVE'; // Default to ACTIVE if missing

                // STRICT CHECK: Room ID must be present
                if (!roomId) {
                    console.warn(
                        `Skipping attendance for ${alloc.studentName || 'Student'}: No Room ID found (RoomNo: ${roomNumber})`
                    );
                    failures.push(`${alloc.studentName || 'Unknown'} (Missing Room ID)`);
                    continue;
                }

                // Check for ACTIVE status
                if (allocationStatus !== "ACTIVE" && allocationStatus !== "active") {
                    console.warn(
                        `Skipping attendance for ${alloc.studentName}: Status is ${allocationStatus}`
                    );
                    continue;
                }

                try {
                    // specific payload structure required by backend
                    // Sending BOTH nested room object and top-level roomId to ensure backend finds it
                    const attendancePayload = {
                        // Direct ID for reference
                        studentId: alloc.studentId,
                        // Nested object for JPA @ManyToOne resolution
                        student: { id: alloc.studentId },

                        studentName: alloc.studentName || `${alloc.firstName || ''} ${alloc.lastName || ''}`.trim(),

                        // Critical for Backend Validation
                        roomId: roomId,
                        // Nested Room with ID and Number (Kitchen sink approach)
                        room: { id: roomId, roomNumber: roomNumber },

                        roomNumber: roomNumber,
                        attendanceDate: date,
                        status: 'PRESENT'
                    };

                    console.log("Sending Attendance Payload:", attendancePayload);

                    await campusService.markAttendance(attendancePayload);
                    successCount++;
                } catch (err) {
                    const msg = err.response?.data?.message || err.message || "Unknown Error";
                    console.error(
                        `Failed to mark attendance for: ${alloc.studentName}`,
                        msg
                    );
                    failures.push(`${alloc.studentName} (${msg})`);
                }
            }

            // Reload to show the new list
            loadAttendance();
            setFilter('All');

            // Only alert if there were failures OR meaningful successes
            if (failures.length > 0) {
                const errorMsg = `Logged: ${successCount}. Failed: ${failures.length}.\n\nIssues:\n${failures.join('\n')}`;
                alert(errorMsg);
            } else if (successCount > 0) {
                // Success Toast/Alert
                alert(`✅ Successfully logged attendance for ${successCount} residents.`);
            } else {
                alert("⚠️ No active residents found eligible for attendance.");
            }

        } catch (error) {
            console.error("Failed to mark attendance", error);
            alert(`Failed to mark attendance. ${error.message}`);
        }
    };


    const dateStats = {
        total: getActiveStudents().length,
        present: filteredData.filter(item => item.status === 'PRESENT').length,
        absent: filteredData.filter(item => item.status === 'ABSENT').length,
    };

    const columns = [
        { header: 'Student Name', accessor: 'studentName', render: (row) => <span className="fw-600">{row.studentName}</span> },
        {
            header: 'Room No.',
            accessor: 'roomNo',
            render: (row) => (
                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-2 fw-bold shadow-sm">
                    <i className="bi bi-door-closed me-1"></i> {row.roomNo}
                </span>
            )
        },
        {
            header: 'Attendance Status',
            accessor: 'status',
            render: (row) => (

                <div className="btn-group rounded-pill overflow-hidden border shadow-sm" style={{ maxWidth: 'fit-content' }} >
                    {
                        row.status === 'NOT_MARKED' ? (
                            <>
                                <button className="btn btn-sm px-3 py-1 border-0 fw-bold btn-light text-muted" onClick={() => setStatus(row, 'PRESENT')}>
                                    <i className="bi bi-check-circle me-1"></i> Mark Present
                                </button>
                                <button className="btn btn-sm px-3 py-1 border-0 fw-bold btn-light text-muted border-start" onClick={() => setStatus(row, 'ABSENT')}>
                                    <i className="bi bi-x-circle me-1"></i> Mark Absent
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className={`btn btn-sm px-3 py-1 border-0 fw-bold transition-all ${row.status === 'PRESENT' ? 'btn-success' : 'btn-light text-muted'}`}
                                    onClick={() => setStatus(row, 'PRESENT')}
                                >
                                    <i className={`bi ${row.status === 'PRESENT' ? 'bi-check-circle-fill' : 'bi-check-circle'} me-1`}></i> Present
                                </button>
                                <button
                                    className={`btn btn-sm px-3 py-1 border-0 fw-bold transition-all ${row.status === 'ABSENT' ? 'btn-danger' : 'btn-light text-muted'}`}
                                    onClick={() => setStatus(row, 'ABSENT')}
                                >
                                    <i className={`bi ${row.status === 'ABSENT' ? 'bi-x-circle-fill' : 'bi-x-circle'} me-1`}></i> Absent
                                </button>
                            </>
                        )
                    }
                </div >
            )

        },
        {
            header: 'Notification',
            accessor: 'notification',
            render: (row) => {
                if (row.status !== 'ABSENT') return null;
                const status = notifiedStudents[row.id];
                return (
                    <div className="d-flex align-items-center gap-2">
                        {status === 'Delivered' ? (
                            <span className="badge bg-success bg-opacity-10 text-success rounded-pill smaller px-2">
                                <i className="bi bi-check2-all me-1"></i> Sent to Parent
                            </span>
                        ) : status === 'Sending...' ? (
                            <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill smaller px-2 animate-pulse">
                                <i className="bi bi-send me-1"></i> Alerting...
                            </span>
                        ) : (
                            <button
                                className="btn btn-sm btn-outline-primary border-0 smaller py-0 px-2"
                                onClick={() => sendParentNotification(row)}
                            >
                                <i className="bi bi-arrow-clockwise me-1"></i> Resend Alert
                            </button>
                        )}
                    </div>
                );
            }
        },
        {
            header: 'Remarks',
            accessor: 'remarks',
            render: (row) => (
                <div className="d-flex align-items-center gap-2">
                    <span className="text-truncate d-inline-block small text-muted" style={{ maxWidth: '150px' }}>
                        {row.remarks || <><MdCommentBank className="me-1" /> No remarks added</>}
                    </span>
                    <button className="btn btn-sm btn-light border rounded-circle shadow-sm" onClick={() => handleAddRemark(row)} title="Edit Remarks">
                        <i className="bi bi-chat-left-text"></i>
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="container-fluid py-4 animate-in">
            <header className="mb-4 d-flex justify-content-between align-items-center">
                <div>
                    <h3 className="fw-bold text-main mb-1">Daily Attendance Logging</h3>
                    <p className="text-muted small">Real-time presence tracking for campus residents.</p>
                </div>
                <div className="d-flex gap-3 align-items-center">
                    <div className="d-flex align-items-center gap-2 glass-card px-3 py-2 rounded-pill shadow-sm">
                        <i className="bi bi-calendar-event text-primary"></i>
                        <input type="date" className="form-control form-control-sm border-0 bg-transparent p-0 text-main" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '130px' }} />
                    </div>
                    <button className="btn-premium btn-premium-primary" onClick={handleMarkAttendance}>
                        <i className="bi bi-plus-lg"></i> Take Attendance
                    </button>
                </div>
            </header>
            <div className="row g-4 mb-4">
                {[
                    { label: 'Total Strength', value: dateStats.total, color: 'primary', icon: 'bi-people-fill' },
                    { label: 'Present Today', value: dateStats.present, color: 'success', icon: 'bi-person-check-fill' },
                    { label: 'Absent Count', value: dateStats.absent, color: 'danger', icon: 'bi-person-x-fill' },
                ].map((item, idx) => (
                    <div className="col-md-4" key={idx}>
                        <div className="glass-card p-4 border-0 h-100 d-flex align-items-center justify-content-between overflow-hidden position-relative">
                            <div className={`position-absolute top-0 start-0 h-100 bg-${item.color}`} style={{ width: '4px', opacity: 0.6 }}></div>
                            <div>
                                <p className="text-muted smaller text-uppercase fw-bold mb-1 ls-1">{item.label}</p>
                                <h2 className="fw-bold mb-0 text-main">{item.value}</h2>
                            </div>
                            <div className={`bg-${item.color} bg-opacity-10 p-3 rounded-circle text-${item.color}`}>
                                <i className={`bi ${item.icon} fs-3`}></i>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Room Cards Overview (Visible when Hostel is selected) */}
            {hostelFilter !== 'All' && roomStats.length > 0 && (
                <div className="mb-4 animate-in">
                    <div className="d-flex align-items-center mb-3">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary me-2">
                            <i className="bi bi-grid-3x3-gap-fill"></i>
                        </div>
                        <h5 className="fw-bold text-main mb-0">
                            Rooms in {hostelFilter}
                        </h5>
                        <span className="badge bg-light text-muted border ms-2 rounded-pill">
                            {roomStats.length} Rooms
                        </span>
                    </div>

                    <div className="row g-3">
                        {roomStats.map(stat => (
                            <div key={stat.room} className="col-auto">
                                <div className={`glass-card p-3 d-flex align-items-center gap-3 border shadow-sm transition-all hover-scale ${stat.absent > 0 ? 'border-danger border-opacity-25 bg-danger bg-opacity-5' : 'border-light'}`} style={{ minWidth: '160px' }}>
                                    <div className={`p-3 rounded-circle d-flex align-items-center justify-content-center ${stat.absent > 0 ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`} style={{ width: '50px', height: '50px' }}>
                                        <i className="bi bi-door-open-fill fs-4"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold text-main fs-5 mb-0">Room {stat.room}</div>
                                        <div className="d-flex align-items-center gap-1 mt-1">
                                            <span className="smaller text-muted fw-bold">{stat.total} Occupants</span>
                                        </div>
                                        {/* Visual Status Dots */}
                                        <div className="d-flex gap-1 mt-2">
                                            {Array.from({ length: stat.present }).map((_, i) => (
                                                <div key={`p-${i}`} className="bg-success rounded-circle" style={{ width: 6, height: 6 }} title="Present"></div>
                                            ))}
                                            {Array.from({ length: stat.absent }).map((_, i) => (
                                                <div key={`a-${i}`} className="bg-danger rounded-circle" style={{ width: 6, height: 6 }} title="Absent"></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .hover-scale { transition: transform 0.2s; }
                .hover-scale:hover { transform: translateY(-2px); }
            `}</style>
            <DataTable
                title={`Resident Roster (${new Date(date).toLocaleDateString()})`}
                columns={columns}
                data={filteredData}
                actions={
                    <div className="d-flex gap-2">
                        <select className="form-select form-select-sm rounded-pill px-3 shadow-sm" value={hostelFilter} onChange={(e) => setHostelFilter(e.target.value)} style={{ width: '160px' }}>
                            <option value="All">All Hostels</option>
                            {hostels.map(h => (
                                <option key={h.id || h.hostelId} value={h.name || h.hostelName}>{h.name || h.hostelName}</option>
                            ))}
                        </select>
                        <select className="form-select form-select-sm rounded-pill px-3 shadow-sm" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: '140px' }}>
                            <option value="All">All Status</option>
                            <option value="PRESENT">Present Only</option>
                            <option value="ABSENT">Absent Only</option>
                        </select>
                    </div>
                }
            />
            {/* Premium Remark Modal */}
            {
                showRemarkModal && editingRecord && (
                    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content glass-card border-0 shadow-2xl p-0" style={{ overflow: 'hidden' }}>
                                <div className="p-4 border-bottom border-light d-flex justify-content-between align-items-center bg-primary bg-opacity-10">
                                    <h5 className="modal-title fw-bold text-main mb-0">
                                        <i className="bi bi-chat-dots-fill text-primary me-2"></i>Log Remark
                                    </h5>
                                    <button type="button" className="btn-close shadow-none" onClick={() => setShowRemarkModal(false)}></button>
                                </div>
                                <div className="p-4">
                                    <form onSubmit={handleSaveRemark}>
                                        <div className="mb-4">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Resident Name</label>
                                            <div className="p-3 bg-primary bg-opacity-5 rounded-3 border fw-500 text-main">
                                                {editingRecord.studentName} <span className="text-muted smaller ms-2">(Room {editingRecord.roomNo})</span>
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Notes / Explanation</label>
                                            <textarea
                                                className="form-control"
                                                rows="4"
                                                value={remarkText}
                                                onChange={(e) => setRemarkText(e.target.value)}
                                                placeholder="Enter reason for absence or other relevant notes..."
                                                autoFocus
                                            ></textarea>
                                        </div>
                                        <div className="mt-5 d-flex gap-2 justify-content-end">
                                            <button type="button" className="btn btn-light px-4 rounded-pill fw-500" onClick={() => setShowRemarkModal(false)}>Discard</button>
                                            <button type="submit" className="btn-premium btn-premium-primary rounded-pill px-5">Archive Remark</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <style>{`
                .fw-600 { font-weight: 600; }
                .fw-500 { font-weight: 500; }
                .smaller { font-size: 0.7rem; }
                .ls-1 { letter-spacing: 0.5px; }
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
            `}</style>
        </div >
    );
};
export default Attendance;
