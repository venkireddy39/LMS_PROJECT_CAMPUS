import React, { useState, useEffect } from 'react';
import StatsCard from '../common/StatsCard';
import DataTable from '../common/DataTable';
import campusService from '../../services/campusService';
import { useStudentContext } from '../../context/StudentContext';

const HealthIssues = () => {
    const { getActiveStudents, selectedStudentFilter, setSelectedStudentFilter } = useStudentContext();
    const [records, setRecords] = useState([]);
    const [hostels, setHostels] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [isNewRecord, setIsNewRecord] = useState(false);

    useEffect(() => {
        loadRecords();
        loadHostels();
    }, []);

    const filteredRecords = selectedStudentFilter
        ? records.filter(r => r.studentName === selectedStudentFilter.name || r.studentName === selectedStudentFilter.studentName)
        : records;

    const loadRecords = async () => {
        try {
            const response = await campusService.getAllIncidents();
            console.log("Fetched Health Records:", response);

            let data = [];
            if (Array.isArray(response)) {
                data = response;
            } else if (response?.data && Array.isArray(response.data)) {
                data = response.data;
            } else if (response?.content && Array.isArray(response.content)) {
                data = response.content;
            }

            setRecords(data || []);
        } catch (error) {
            console.error("Failed to load health records", error);
            setRecords([]);
        }
    };

    const loadHostels = async () => {
        try {
            const response = await campusService.getAllHostels();
            let data = [];
            if (Array.isArray(response)) {
                data = response;
            } else if (response?.data && Array.isArray(response.data)) {
                data = response.data;
            } else if (response?.content && Array.isArray(response.content)) {
                data = response.content;
            }
            setHostels(data || []);
        } catch (error) {
            console.error("Failed to load hostels", error);
            setHostels([]);
        }
    };

    const handleAddNewClick = () => {
        setCurrentRecord({
            studentName: '',
            hostelName: '',
            roomNumber: '',
            medicalIssueType: '',
            severity: 'LOW',
            status: 'OBSERVATION',
            reportedDate: new Date().toISOString().split('T')[0],
            studentPhone: '',
            parentPhone: '',
            remarks: ''
        });
        setIsNewRecord(true);
        setShowModal(true);
    };

    const handleEditClick = (record) => {
        setCurrentRecord({
            ...record,
            // Normalize status: use existing status or fallback to currentStatus, defaulted to OBSERVATION
            status: record.status || record.currentStatus || 'OBSERVATION',
            // Normalize remarks: use proper key alias if needed
            remarks: record.remarks || record.clinicalNotes || ''
        });
        setIsNewRecord(false);
        setShowModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentRecord({ ...currentRecord, [name]: value });
    };

    const handleStudentSelect = (e) => {
        const studentName = e.target.value;
        const student = getActiveStudents().find(s => s.name === studentName || s.studentName === studentName);
        if (student) {
            setCurrentRecord({
                ...currentRecord,
                studentName: student.name || student.studentName,
                studentPhone: student.phone || 'N/A',
                parentPhone: student.fatherPhone || 'N/A',
                // Auto-fill location
                roomNumber: student.roomNumber || student.roomNo || '',
                hostelName: student.hostel?.hostelName || student.hostelName || ''
            });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // Prepare payload with aliases to satisfy potential backend field names
            const payload = {
                ...currentRecord,
                // Ensure status is sent in both common keys
                status: currentRecord.status,
                currentStatus: currentRecord.status,
                // Map remarks to clinicalNotes as backend often uses that term
                clinicalNotes: currentRecord.remarks
            };

            console.log("Submitting Health Record Payload:", payload);

            if (isNewRecord) {
                // Ensure ID is not sent for new creation if backend generates it
                const { id, ...recordData } = payload;
                await campusService.createIncident(recordData);
            } else {
                // Standard details update
                await campusService.updateIncidentFull(currentRecord.id, payload);
                // FORCE status update via specialized PATCH endpoint (fixes persistence issue)
                await campusService.updateIncident(currentRecord.id, currentRecord.status, currentRecord.remarks);
            }
            // Small delay to ensure backend commit
            await new Promise(resolve => setTimeout(resolve, 500));
            loadRecords();
            setShowModal(false);
            setCurrentRecord(null);
        } catch (error) {
            console.error("Failed to save record", error);
            alert("Failed to save record");
        }
    };

    const stats = {
        total: records.length,
        pending: records.filter(r => r.status === 'OBSERVATION' || r.status === 'MEDICATED').length,
        resolved: records.filter(r => r.status === 'RECOVERED').length,
        hospitalized: records.filter(r => r.status === 'HOSPITALIZED').length
    };

    const columns = [
        { header: 'Student Name', accessor: 'studentName', render: (row) => <span className="fw-600">{row.studentName}</span> },
        { header: 'Hostel Name', accessor: 'hostelName' },
        { header: 'Medical Issue Type', accessor: 'medicalIssueType' },
        {
            header: 'Severity',
            accessor: 'severity',
            render: (row) => {
                let badgeClass = 'bg-secondary bg-opacity-10 text-secondary';
                if (row.severity === 'CRITICAL') badgeClass = 'bg-danger text-danger border border-danger';
                else if (row.severity === 'HIGH') badgeClass = 'bg-danger bg-opacity-10 text-danger';
                else if (row.severity === 'MEDIUM') badgeClass = 'bg-warning bg-opacity-10 text-warning-emphasis';
                return <span className={`badge rounded-pill px-3 py-2 fw-bold ${badgeClass}`}>{row.severity}</span>;
            }
        },
        {
            header: 'Emergency Contacts',
            accessor: 'phone',
            render: (row) => (
                <div className="smaller lh-sm py-1">
                    <div className="text-main fw-500 mb-1"><i className="bi bi-person-fill text-primary me-2"></i>{row.studentPhone || 'N/A'}</div>
                    <div className="text-muted"><i className="bi bi-people-fill text-success me-2"></i>{row.parentPhone || 'N/A'}</div>
                </div>
            )
        },
        {
            header: 'Current Status',
            accessor: 'status',
            render: (row) => {
                const status = row.status || row.currentStatus || 'N/A';
                const upperStatus = String(status).toUpperCase();

                let badgeClass = 'bg-secondary bg-opacity-10 text-secondary';
                if (upperStatus === 'RECOVERED') badgeClass = 'bg-success bg-opacity-10 text-success';
                else if (upperStatus === 'OBSERVATION') badgeClass = 'bg-primary bg-opacity-10 text-primary';
                else if (upperStatus === 'MEDICATED') badgeClass = 'bg-info bg-opacity-10 text-info';
                else if (upperStatus === 'HOSPITALIZED') badgeClass = 'bg-danger bg-opacity-10 text-danger';

                return <span className={`badge rounded-pill px-3 py-2 fw-bold ${badgeClass}`}>{status}</span>;
            }
        },
        {
            header: 'Actions',
            accessor: 'actions',
            render: (row) => (
                <button className="btn btn-sm btn-light border rounded-pill px-3 fw-500 shadow-sm transition-all" onClick={() => handleEditClick(row)}>
                    <i className="bi bi-pencil-square me-1"></i> Edit
                </button>
            )
        }
    ];

    return (
        <div className="container-fluid py-4 animate-in">
            <header className="mb-4 d-flex justify-content-between align-items-center">
                <div>
                    <h3 className="fw-bold text-main mb-1">Health & Wellness Tracker</h3>
                    <p className="text-muted small">Centralized monitoring for student health and medical emergencies.</p>
                    {selectedStudentFilter && (
                        <div className="d-flex align-items-center gap-2 mt-2">
                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">
                                <i className="bi bi-funnel-fill me-1"></i>
                                Filtered by: {selectedStudentFilter.studentName || selectedStudentFilter.name}
                            </span>
                            <button className="btn btn-sm btn-link text-muted text-decoration-none p-0" onClick={() => setSelectedStudentFilter(null)}>
                                Clear Filter
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="row g-4 mb-4">
                {[
                    { label: 'Total Incidents', value: stats.total, color: 'primary', icon: 'bi-clipboard2-pulse' },
                    { label: 'Active Cases', value: stats.pending, color: 'warning', icon: 'bi-eye-fill' },
                    { label: 'Recovered', value: stats.resolved, color: 'success', icon: 'bi-check-circle-fill' },
                    { label: 'Emergency', value: stats.hospitalized, color: 'danger', icon: 'bi-exclamation-triangle-fill' },
                ].map((item, idx) => (
                    <div className="col-md-3" key={idx}>
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
                title="Resident Medical Records"
                columns={columns}
                data={filteredRecords}
                actions={
                    <button className="btn-premium btn-premium-primary" onClick={handleAddNewClick}>
                        <i className="bi bi-heart-pulse"></i> Log New Case
                    </button>
                }
            />

            {/* Premium Modal */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content glass-card border-0 shadow-2xl p-0" style={{ overflow: 'hidden' }}>
                            <div className="p-4 border-bottom border-light d-flex justify-content-between align-items-center bg-primary bg-opacity-10">
                                <h5 className="modal-title fw-bold text-main mb-0">
                                    {isNewRecord ? (
                                        <><i className="bi bi-plus-circle-fill text-primary me-2"></i>Report New Incident</>
                                    ) : (
                                        <><i className="bi bi-pencil-square text-primary me-2"></i>Update Incident Details</>
                                    )}
                                </h5>
                                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="p-4">
                                <form onSubmit={handleSave}>
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Select Student</label>
                                            <select className="form-select" name="studentName" value={currentRecord.studentName} onChange={handleStudentSelect} required disabled={!isNewRecord}>
                                                <option value="">Choose resident...</option>
                                                {getActiveStudents().map(s => (
                                                    <option key={s.id} value={s.name}>{s.name || s.studentName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Medical Issue Type</label>
                                            <select className="form-select" name="medicalIssueType" value={currentRecord.medicalIssueType} onChange={handleInputChange} required>
                                                <option value="">SELECT ISSUE...</option>
                                                <option value="FEVER">FEVER</option>
                                                <option value="HEADACHE">HEADACHE</option>
                                                <option value="COLD_FLU">COLD_FLU</option>
                                                <option value="STOMACH_PAIN">STOMACH_PAIN</option>
                                                <option value="INJURY">INJURY</option>
                                                <option value="BODY_PAIN">BODY_PAIN</option>
                                                <option value="DIZZINESS">DIZZINESS</option>
                                                <option value="FOOD_POISONING">FOOD_POISONING</option>
                                                <option value="ALLERGY">ALLERGY</option>
                                                <option value="OTHER">OTHER</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Severity</label>
                                            <select className="form-select" name="severity" value={currentRecord.severity} onChange={handleInputChange}>
                                                <option value="LOW">LOW</option>
                                                <option value="MEDIUM">MEDIUM</option>
                                                <option value="HIGH">HIGH</option>
                                                <option value="CRITICAL">CRITICAL</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Current Status</label>
                                            <select className="form-select" name="status" value={currentRecord.status} onChange={handleInputChange}>
                                                <option value="OBSERVATION">OBSERVATION</option>
                                                <option value="MEDICATED">MEDICATED</option>
                                                <option value="HOSPITALIZED">HOSPITALIZED</option>
                                                <option value="RECOVERED">RECOVERED</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Reporting Date</label>
                                            <input type="date" className="form-control" name="reportedDate" value={currentRecord.reportedDate} onChange={handleInputChange} required />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Parent Contact</label>
                                            <input type="text" className="form-control" name="parentPhone" value={currentRecord.parentPhone || ''} onChange={handleInputChange} placeholder="Enter parent contact" required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Hostel Name</label>
                                            <select
                                                className="form-select"
                                                name="hostelName"
                                                value={currentRecord.hostelName || ''}
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
                                            <input type="text" className="form-control" name="roomNumber" value={currentRecord.roomNumber || ''} onChange={handleInputChange} placeholder="e.g. 302-A" required />
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Clinical Notes / Action Taken</label>
                                            <textarea className="form-control" name="remarks" value={currentRecord.remarks} onChange={handleInputChange} rows="3" placeholder="Describe medication, first aid, or doctor referrals..."></textarea>
                                        </div>
                                    </div>
                                    <div className="mt-5 d-flex gap-2 justify-content-end">
                                        <button type="button" className="btn btn-light px-4 rounded-pill fw-500" onClick={() => setShowModal(false)}>Discard</button>
                                        <button type="submit" className="btn-premium btn-premium-primary rounded-pill px-5">
                                            {isNewRecord ? 'Record Incident' : 'Update Record'}
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
                .ls-1 { letter-spacing: 0.5px; }
                .border-dashed { border: 1px dashed #dee2e6; }
            `}</style>
        </div>
    );
};

export default HealthIssues;
