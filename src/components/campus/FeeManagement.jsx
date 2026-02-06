import React from 'react';
import campusService from '../../services/campusService';
import DataTable from '../common/DataTable';

import { useStudentContext } from '../../context/StudentContext';

const FeeManagement = () => {
    // Note: We are switching from using StudentContext to fetching allocations directly from backend.
    // The backend allocations likely contain the student and fee details.
    const [fees, setFees] = React.useState([]);
    const [showModal, setShowModal] = React.useState(false);
    const [currentFee, setCurrentFee] = React.useState(null);

    const { selectedStudentFilter, getActiveStudents } = useStudentContext();

    React.useEffect(() => {
        loadFees();
    }, []);

    const loadFees = async () => {
        try {
            // Fetch both Fees and Allocations (Residents)
            const [feesData, allocationsData] = await Promise.all([
                campusService.getAllFees(),
                campusService.getAllAllocations()
            ]);

            const feesList = feesData || [];
            const allocationsList = allocationsData || [];

            // Deduplication: Use a Map/Set to ensure unique students
            const processedStudents = new Set();
            const mergedData = [];

            allocationsList.forEach(student => {
                // Create a unique key (fallback to name if ID missing)
                const uniqueKey = (student.studentId || student.id || student.studentName).toString();

                if (processedStudents.has(uniqueKey)) return; // Skip duplicate

                // Find matching fee record
                const feeRecord = feesList.find(f =>
                    (f.studentId && f.studentId === student.studentId) ||
                    (f.studentName === student.studentName)
                );

                if (feeRecord) {
                    mergedData.push({ ...student, ...feeRecord, id: feeRecord.feeId });
                } else {
                    // Create placeholder for resident without fee record
                    mergedData.push({
                        id: `temp-${student.id}`,
                        studentName: student.studentName,
                        studentId: student.studentId || student.id,
                        monthlyFee: 0,
                        totalFee: 0,
                        amountPaid: 0,
                        dueAmount: 0,
                        status: 'DUE',
                        lastPaymentDate: '',
                        isNew: true // Flag to trigger create instead of update
                    });
                }
                processedStudents.add(uniqueKey);
            });

            setFees(mergedData);
        } catch (error) {
            console.error("Failed to load fee records", error);
        }
    };

    const filteredFees = selectedStudentFilter
        ? fees.filter(f => f.studentName === selectedStudentFilter.studentName || f.studentName === selectedStudentFilter.name)
        : fees;

    const handleEditClick = (feeRecord) => {
        setCurrentFee({ ...feeRecord });
        setShowModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Auto-calculate Due Amount if Total or Paid changes
        if (name === 'totalFee' || name === 'amountPaid') {
            const total = name === 'totalFee' ? parseFloat(value || 0) : parseFloat(currentFee.totalFee || 0);
            const paid = name === 'amountPaid' ? parseFloat(value || 0) : parseFloat(currentFee.amountPaid || 0);

            setCurrentFee({
                ...currentFee,
                [name]: value,
                dueAmount: total - paid
            });
        } else {
            setCurrentFee({ ...currentFee, [name]: value });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // Determine if it's new based on flag or if ID starts with 'temp-'
            // Ensure we treat it as new if feeId is null/undefined
            const isNewRecord = currentFee.isNew || String(currentFee.id).startsWith('temp-') || !currentFee.feeId;
            const feeId = isNewRecord ? null : (currentFee.feeId || currentFee.id);

            // Prepare payload
            // Construct nested 'student' object to ensure JPA mapping works if backend expects a relation
            const cleanStudentId = currentFee.studentId || (String(currentFee.id).startsWith('temp-') ? currentFee.id.replace('temp-', '') : currentFee.studentId);

            const payload = {
                // If update, include feeId in body just in case backend needs it
                ...(isNewRecord ? {} : { feeId: feeId }),

                // Flat field (if DTO uses it)
                studentId: cleanStudentId,
                studentName: currentFee.studentName,

                // Nested object (if Entity uses it) - This fixes "data not stored" if relation is missing
                student: { id: cleanStudentId },

                monthlyFee: parseFloat(currentFee.monthlyFee || 0),
                totalFee: parseFloat(currentFee.totalFee || 0),
                amountPaid: parseFloat(currentFee.amountPaid || 0),
                dueAmount: parseFloat(currentFee.dueAmount || 0),
                status: currentFee.status,
                lastPaymentDate: currentFee.lastPaymentDate || null
            };

            console.log("Submitting Fee Payload:", payload, "IsNew:", isNewRecord);

            if (isNewRecord) {
                const response = await campusService.createFee(payload);
                console.log("Create Response:", response);

                // CRITICAL FIX: Backend createFee ignores payment details (sets to 0/DUE).
                // We must IMMEDIATELY call updateFee with the full payload to save the user's entered payment info.
                if (response && (response.feeId || response.id)) {
                    const newFeeId = response.feeId || response.id;
                    console.log(`Forcing update on new record ${newFeeId} to save payment details...`);

                    // Add the new ID to payload
                    const updatePayload = { ...payload, feeId: newFeeId };
                    const updateResponse = await campusService.updateFee(newFeeId, updatePayload);
                    console.log("Force Update Response:", updateResponse);
                }
            } else {
                // Try full update (PUT) as per controller
                const response = await campusService.updateFee(feeId, payload);
                console.log("Update Response:", response);
            }

            // Removed invalid PATCH call as user confirmed controller does not have it.
            // relies on PUT (updateFee) to work correctly with the fix in payload.

            // Add slight delay to allow DB propagation
            await new Promise(resolve => setTimeout(resolve, 500));
            loadFees();
            setShowModal(false);
            setCurrentFee(null);
        } catch (error) {
            console.error("Failed to save fee record", error);
            alert("Failed to save fee record");
        }
    };

    const columns = [
        { header: 'Student Name', accessor: 'studentName' },
        { header: 'Monthly Fee', accessor: 'monthlyFee', render: (row) => <span className="fw-500">₹{row.monthlyFee}</span> },
        { header: 'Total Fee', accessor: 'totalFee', render: (row) => <span>₹{row.totalFee}</span> },
        { header: 'Amt Paid', accessor: 'amountPaid', render: (row) => <span className="text-success">₹{row.amountPaid}</span> },
        { header: 'Due', accessor: 'dueAmount', render: (row) => <span className="text-danger fw-600">₹{row.dueAmount}</span> },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => {
                let badgeClass = 'bg-secondary bg-opacity-10 text-secondary';
                if (row.status === 'PAID') badgeClass = 'bg-success bg-opacity-10 text-success';
                else if (row.status === 'DUE') badgeClass = 'bg-danger bg-opacity-10 text-danger';
                else if (row.status === 'PARTIALLY_PAID') badgeClass = 'bg-warning bg-opacity-10 text-warning-emphasis';
                return <span className={`badge rounded-pill px-3 py-2 fw-bold ${badgeClass}`}>{row.status}</span>;
            }
        },
        { header: 'Last Payment', accessor: 'lastPaymentDate' },
        {
            header: 'Actions',
            accessor: 'actions',
            render: (row) => (
                <button className="btn btn-sm btn-light border rounded-pill px-3 fw-500 shadow-sm" onClick={() => handleEditClick(row)}>
                    <i className="bi bi-pencil-square me-1"></i> Edit
                </button>
            )
        }
    ];

    return (
        <div className="container-fluid py-4 animate-in">
            <header className="mb-4">
                <h3 className="fw-bold text-main mb-1">Fee & Payment Management</h3>
                <p className="text-muted small">Centralized collection and due tracking for campus residents.</p>

                {/* Quick Edit Dropdown */}
                <div className="mt-3 col-md-4">
                    <label className="form-label fw-600 smaller text-uppercase text-muted">Quick Edit by Student</label>
                    <select
                        className="form-select border-primary bg-primary bg-opacity-5 rounded-pill text-primary fw-bold"
                        onChange={(e) => {
                            const selectedName = e.target.value;
                            // Find the fee record based on the selected student name
                            // Using find since names should be unique or best effort
                            const record = fees.find(f => f.studentName === selectedName);

                            if (record) {
                                handleEditClick(record);
                            } else {
                                // Optional: Handle case where student exists but no fee record yet
                                alert("No fee record found for this student.");
                            }

                            // Reset value so the change event fires again if needed
                            e.target.value = "";
                        }}
                    >
                        <option value="">Select a student to edit fees...</option>
                        {getActiveStudents().map((s) => (
                            <option key={s.id || s.studentId} value={s.name || s.studentName} className="text-dark fw-normal">
                                {s.name || s.studentName}
                            </option>
                        ))}
                    </select>
                </div>
            </header>

            <DataTable
                title="Resident Accounts"
                columns={columns}
                data={filteredFees}
            />

            {/* Premium Edit Fee Modal */}
            {showModal && currentFee && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content glass-card border-0 shadow-2xl p-0" style={{ overflow: 'hidden' }}>
                            <div className="p-4 border-bottom border-light d-flex justify-content-between align-items-center bg-primary bg-opacity-10">
                                <h5 className="modal-title fw-bold text-main mb-0">
                                    <i className="bi bi-wallet2 text-primary me-2"></i>Update Billing Details
                                </h5>
                                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="p-4">
                                <form onSubmit={handleSave}>
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Student Name</label>
                                            <input type="text" className="form-control" name="studentName" value={currentFee.studentName} onChange={handleInputChange} required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Monthly Rental</label>
                                            <div className="input-group">
                                                <span className="input-group-text glass-card border-end-0 rounded-start-pill">₹</span>
                                                <input type="number" className="form-control border-start-0 ps-0" name="monthlyFee" value={currentFee.monthlyFee} onChange={handleInputChange} required />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Total Billing</label>
                                            <div className="input-group">
                                                <span className="input-group-text glass-card border-end-0 rounded-start-pill">₹</span>
                                                <input type="number" className="form-control border-start-0 ps-0" name="totalFee" value={currentFee.totalFee} onChange={handleInputChange} required />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Amount Collected</label>
                                            <div className="input-group">
                                                <span className="input-group-text glass-card border-end-0 rounded-start-pill">₹</span>
                                                <input type="number" className="form-control border-start-0 ps-0 text-success fw-bold" name="amountPaid" value={currentFee.amountPaid} onChange={handleInputChange} required />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Balance Due</label>
                                            <div className="input-group">
                                                <span className="input-group-text glass-card border-end-0 rounded-start-pill">₹</span>
                                                <input type="number" className="form-control border-start-0 ps-0 text-danger fw-bold" name="dueAmount" value={currentFee.dueAmount} onChange={handleInputChange} required />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Last Payment Date</label>
                                            <input type="date" className="form-control" name="lastPaymentDate" value={currentFee.lastPaymentDate || ''} onChange={handleInputChange} />
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Payment Status</label>
                                            <div className="d-flex gap-3">
                                                {['PAID', 'PARTIALLY_PAID', 'DUE'].map((status) => (
                                                    <label key={status} className={`flex-fill p-3 border rounded-3 cursor-pointer transition-all ${currentFee.status === status ? 'border-primary bg-primary bg-opacity-10 fw-bold text-primary' : 'bg-primary bg-opacity-5'}`} style={{ cursor: 'pointer' }}>
                                                        <input type="radio" value={status} name="status" checked={currentFee.status === status} onChange={handleInputChange} className="d-none" />
                                                        <div className="text-center">{status.replace('_', ' ')}</div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 d-flex gap-2 justify-content-end">
                                        <button type="button" className="btn btn-light px-4 rounded-pill fw-500" onClick={() => setShowModal(false)}>Discard</button>
                                        <button type="submit" className="btn-premium btn-premium-primary rounded-pill px-5">Commit Changes</button>
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
            `}</style>
        </div>
    );
};

export default FeeManagement;
