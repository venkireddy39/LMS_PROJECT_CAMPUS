import React from 'react';
import campusService from '../../services/campusService';
import DataTable from '../common/DataTable';

const FeeManagement = () => {
    // Note: We are switching from using StudentContext to fetching allocations directly from backend.
    // The backend allocations likely contain the student and fee details.
    const [fees, setFees] = React.useState([]);
    const [showModal, setShowModal] = React.useState(false);
    const [currentFee, setCurrentFee] = React.useState(null);

    React.useEffect(() => {
        loadFees();
    }, []);

    const loadFees = async () => {
        try {
            // Fetch allocations which should serve as the source of truth for fees
            const data = await campusService.getAllAllocations();
            // Transform data if necessary. Assuming backend returns list with fee fields.
            // If backend returns raw allocations without calculated fees, we might need to map it.
            // For now, assuming direct mapping or simple transformation.
            setFees(data || []);
        } catch (error) {
            console.error("Failed to load fee records", error);
        }
    };

    const handleEditClick = (feeRecord) => {
        setCurrentFee({ ...feeRecord });
        setShowModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentFee({ ...currentFee, [name]: value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // Use updatePayment or updateAllocationStatus based on what changed, 
            // or a generic update if available. Service has updatePayment.
            // currentFee might have fields mapped to what backend expects.
            // Let's assume we update payment info.
            if (currentFee.id) {
                await campusService.updatePayment(currentFee.id, currentFee.amountPaid, currentFee.lastPaymentDate);
                // If status update is separate:
                // await campusService.updateAllocationStatus(currentFee.id, currentFee.status);
                // For now, calling updatePayment.
            }
            loadFees();
            setShowModal(false);
            setCurrentFee(null);
        } catch (error) {
            console.error("Failed to update fee record", error);
            alert("Failed to update fee record");
        }
    };

    const columns = [
        { header: 'Student Name', accessor: 'studentName' },
        { header: 'Monthly Fee', accessor: 'monthlyFee', render: (row) => <span className="fw-500">₹{row.monthlyFee}</span> },
        { header: 'Total Fee', accessor: 'totalFee', render: (row) => <span>₹{row.totalFee}</span> },
        { header: 'Amt Paid', accessor: 'amountPaid', render: (row) => <span className="text-success">₹{row.amountPaid}</span> },
        { header: 'Due', accessor: 'monthlyDue', render: (row) => <span className="text-danger fw-600">₹{row.monthlyDue}</span> },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => {
                let badgeClass = 'bg-secondary bg-opacity-10 text-secondary';
                if (row.status === 'Paid') badgeClass = 'bg-success bg-opacity-10 text-success';
                else if (row.status === 'Due') badgeClass = 'bg-danger bg-opacity-10 text-danger';
                else if (row.status === 'Partial') badgeClass = 'bg-warning bg-opacity-10 text-warning-emphasis';
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
            </header>

            <DataTable
                title="Resident Accounts"
                columns={columns}
                data={fees}
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
                                                <input type="number" className="form-control border-start-0 ps-0 text-danger fw-bold" name="monthlyDue" value={currentFee.monthlyDue} onChange={handleInputChange} required />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Collection Date</label>
                                            <input type="date" className="form-control" name="lastPaymentDate" value={currentFee.lastPaymentDate} onChange={handleInputChange} />
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Payment Status</label>
                                            <div className="d-flex gap-3">
                                                {['Paid', 'Partial', 'Due'].map((status) => (
                                                    <label key={status} className={`flex-fill p-3 border rounded-3 cursor-pointer transition-all ${currentFee.status === status ? 'border-primary bg-primary bg-opacity-10 fw-bold text-primary' : 'bg-primary bg-opacity-5'}`} style={{ cursor: 'pointer' }}>
                                                        <input type="radio" value={status} name="status" checked={currentFee.status === status} onChange={handleInputChange} className="d-none" />
                                                        <div className="text-center">{status}</div>
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
