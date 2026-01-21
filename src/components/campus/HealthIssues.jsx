import React, { useState } from 'react';
import StatsCard from '../common/StatsCard';
import DataTable from '../common/DataTable';
import { healthIssuesData, healthStats } from '../../data/healthIssuesData';
import { useStudentContext } from '../../context/StudentContext';

const HealthIssues = () => {
    const { getActiveStudents } = useStudentContext();
    const [records, setRecords] = useState(healthIssuesData);
    const [showModal, setShowModal] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [isNewRecord, setIsNewRecord] = useState(false);

    const handleAddNewClick = () => {
        setCurrentRecord({
            studentName: '',
            issue: '',
            severity: 'Low',
            status: 'Under Observation',
            reportedDate: new Date().toISOString().split('T')[0],
            studentPhone: '',
            parentPhone: '',
            remarks: ''
        });
        setIsNewRecord(true);
        setShowModal(true);
    };

    const handleEditClick = (record) => {
        setCurrentRecord({ ...record });
        setIsNewRecord(false);
        setShowModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentRecord({ ...currentRecord, [name]: value });
    };

    const handleStudentSelect = (e) => {
        const studentName = e.target.value;
        const student = getActiveStudents().find(s => s.name === studentName);
        if (student) {
            setCurrentRecord({
                ...currentRecord,
                studentName: student.name,
                studentPhone: student.phone || 'N/A',
                parentPhone: student.fatherPhone || 'N/A'
            });
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (isNewRecord) {
            const newRecord = {
                id: records.length + 1,
                ...currentRecord
            };
            setRecords([...records, newRecord]);
        } else {
            setRecords(records.map(r => r.id === currentRecord.id ? currentRecord : r));
        }
        setShowModal(false);
        setCurrentRecord(null);
    };

    const stats = {
        total: records.length,
        pending: records.filter(r => r.status === 'Under Observation').length,
        resolved: records.filter(r => r.status === 'Resolved').length,
        hospitalized: records.filter(r => r.status === 'Hospitalized').length
    };

    const columns = [
        { header: 'Student Name', accessor: 'studentName', render: (row) => <span className="fw-600">{row.studentName}</span> },
        { header: 'Medical Issue', accessor: 'issue' },
        {
            header: 'Severity',
            accessor: 'severity',
            render: (row) => {
                let badgeClass = 'bg-secondary bg-opacity-10 text-secondary';
                if (row.severity === 'High') badgeClass = 'bg-danger bg-opacity-10 text-danger';
                if (row.severity === 'Medium') badgeClass = 'bg-warning bg-opacity-10 text-warning-emphasis';
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
                let badgeClass = 'bg-secondary bg-opacity-10 text-secondary';
                if (row.status === 'Resolved') badgeClass = 'bg-success bg-opacity-10 text-success';
                if (row.status === 'Under Observation') badgeClass = 'bg-primary bg-opacity-10 text-primary';
                if (row.status === 'Hospitalized') badgeClass = 'bg-danger bg-opacity-10 text-danger';
                return <span className={`badge rounded-pill px-3 py-2 fw-bold ${badgeClass}`}>{row.status}</span>;
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
                data={records}
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
                                                    <option key={s.id} value={s.name}>{s.name} (Room {s.roomNo || s.roomNumber})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Nature of Complaint</label>
                                            <input type="text" className="form-control" name="issue" value={currentRecord.issue} onChange={handleInputChange} placeholder="e.g. Sharp Headache, High Fever" required />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Severity</label>
                                            <select className="form-select" name="severity" value={currentRecord.severity} onChange={handleInputChange}>
                                                <option value="Low">Low (Minor)</option>
                                                <option value="Medium">Medium (Moderate)</option>
                                                <option value="High">High (Urgent)</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Current Status</label>
                                            <select className="form-select" name="status" value={currentRecord.status} onChange={handleInputChange}>
                                                <option value="Under Observation">Observation</option>
                                                <option value="Resolved">Resolved</option>
                                                <option value="Hospitalized">Hospitalized</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Reporting Date</label>
                                            <input type="date" className="form-control" name="reportedDate" value={currentRecord.reportedDate} onChange={handleInputChange} required />
                                        </div>
                                        <div className="col-md-6">
                                            <div className="p-3 bg-primary bg-opacity-5 rounded-3 border-dashed">
                                                <label className="form-label fw-600 smaller text-uppercase text-muted mb-2">Student Contact</label>
                                                <div className="fw-bold text-main">{currentRecord.studentPhone || '---'}</div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="p-3 bg-primary bg-opacity-5 rounded-3 border-dashed">
                                                <label className="form-label fw-600 smaller text-uppercase text-muted mb-2">Parent Contact</label>
                                                <div className="fw-bold text-main">{currentRecord.parentPhone || '---'}</div>
                                            </div>
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

            <style jsx>{`
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
