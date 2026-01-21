import React, { useState } from 'react';
import StatsCard from '../common/StatsCard';
import DataTable from '../common/DataTable';
import { attendanceData, attendanceStats } from '../../data/attendanceData';
import { useStudentContext } from '../../context/StudentContext';
import { MdCommentBank } from "react-icons/md";

const Attendance = () => {
    const { getActiveStudents } = useStudentContext();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [filter, setFilter] = useState('All');

    // State for managing data and modal
    const [data, setData] = useState(attendanceData);
    const [showRemarkModal, setShowRemarkModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [remarkText, setRemarkText] = useState('');
    const [notifiedStudents, setNotifiedStudents] = useState({}); // Tracking notification status

    // Handle Status Toggle
    const handleStatusToggle = (record) => {
        const newStatus = record.status === 'Present' ? 'Absent' : 'Present';

        // Update local status
        const updatedData = data.map(item => {
            if (item.id === record.id) {
                return { ...item, status: newStatus };
            }
            return item;
        });
        setData(updatedData);

        // Auto-trigger notification if marked absent
        if (newStatus === 'Absent') {
            sendParentNotification(record);
        }
    };

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
    const handleSaveRemark = (e) => {
        e.preventDefault();
        if (!editingRecord) return;

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
    };

    // Handle Mark Attendance for a new day
    const handleMarkAttendance = () => {
        const existingRecords = data.filter(item => item.date === date);
        if (existingRecords.length > 0) {
            alert('Attendance already exists for this date!');
            return;
        }

        const activeStudents = getActiveStudents();
        if (activeStudents.length === 0) {
            alert('No active residents found in the system. Please add students first.');
            return;
        }

        const newRecords = activeStudents.map((student, index) => ({
            id: data.length + index + 1,
            studentName: student.name,
            rollNo: `CS${100 + student.id}`,
            roomNo: student.roomNumber,
            date: date,
            status: 'Present',
            remarks: ''
        }));

        setData([...data, ...newRecords]);
        setFilter('All'); // Reset filter to show all newly added students
        alert(`Successfully logged attendance for ${activeStudents.length} residents.`);
    };

    // Filter data by selected date and status
    const filteredData = data.filter(item => {
        const dateMatch = item.date === date;
        const statusMatch = filter === 'All' || item.status === filter;
        return dateMatch && statusMatch;
    });

    const dateStats = {
        total: getActiveStudents().length,
        present: filteredData.filter(item => item.status === 'Present').length,
        absent: filteredData.filter(item => item.status === 'Absent').length,
    };

    const columns = [
        { header: 'Student Name', accessor: 'studentName', render: (row) => <span className="fw-600">{row.studentName}</span> },
        { header: 'Room No.', accessor: 'roomNo', render: (row) => <span className="text-muted">{row.roomNo}</span> },
        {
            header: 'Attendance Status',
            accessor: 'status',
            render: (row) => (
                <div className="btn-group rounded-pill overflow-hidden border shadow-sm" style={{ maxWidth: 'fit-content' }}>
                    <button
                        className={`btn btn-sm px-3 py-1 border-0 fw-bold transition-all ${row.status === 'Present' ? 'btn-success' : 'btn-light text-muted'}`}
                        onClick={() => handleStatusToggle(row)}
                    >
                        <i className={`bi ${row.status === 'Present' ? 'bi-check-circle-fill' : 'bi-check-circle'} me-1`}></i> Present
                    </button>
                    <button
                        className={`btn btn-sm px-3 py-1 border-0 fw-bold transition-all ${row.status === 'Absent' ? 'btn-danger' : 'btn-light text-muted'}`}
                        onClick={() => handleStatusToggle(row)}
                    >
                        <i className={`bi ${row.status === 'Absent' ? 'bi-x-circle-fill' : 'bi-x-circle'} me-1`}></i> Absent
                    </button>
                </div>
            )
        },
        {
            header: 'Notification',
            accessor: 'notification',
            render: (row) => {
                if (row.status !== 'Absent') return null;
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
            <DataTable
                title={`Resident Roster (${new Date(date).toLocaleDateString()})`}
                columns={columns}
                data={filteredData}
                actions={
                    <select className="form-select form-select-sm rounded-pill px-3 shadow-sm" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: '140px' }}>
                        <option value="All">All Students</option>
                        <option value="Present">Present Only</option>
                        <option value="Absent">Absent Only</option>
                    </select>
                }
            />
            {/* Premium Remark Modal */}
            {showRemarkModal && editingRecord && (
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
            )}

            <style jsx>{`
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
        </div>
    );
};
export default Attendance;
