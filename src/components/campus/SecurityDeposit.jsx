import React from 'react';
import DataTable from '../common/DataTable';
import { securityDepositData } from '../../data/feeData';
import { useStudentContext } from '../../context/StudentContext';

const SecurityDeposit = () => {
    const { students } = useStudentContext();
    const [deposits, setDeposits] = React.useState(securityDepositData);
    const [showModal, setShowModal] = React.useState(false);
    const [currentDeposit, setCurrentDeposit] = React.useState(null);

    // Synchronize deposit data with current active students
    const activeStudentDeposits = React.useMemo(() => {
        const activeStudents = students.filter(s => s.stayStatus === 'Active');
        return activeStudents.map(student => {
            const existingDeposit = deposits.find(d => d.studentName === student.name);
            if (existingDeposit) return existingDeposit;

            return {
                id: `dep-${student.id}`,
                studentName: student.name,
                depositAmount: 5000,
                paidStatus: 'No',
                refundEligibility: 'No'
            };
        });
    }, [students, deposits]);

    // Add Modal State
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [newDeposit, setNewDeposit] = React.useState({
        studentName: '',
        depositAmount: '',
        paidStatus: 'No',
        refundEligibility: 'No'
    });

    const handleEditClick = (deposit) => {
        setCurrentDeposit({ ...deposit });
        setShowModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentDeposit({ ...currentDeposit, [name]: value });
    };

    const handleSave = (e) => {
        e.preventDefault();
        setDeposits(prev => {
            const index = prev.findIndex(d => d.studentName === currentDeposit.studentName);
            if (index !== -1) {
                const updated = [...prev];
                updated[index] = currentDeposit;
                return updated;
            } else {
                return [...prev, currentDeposit];
            }
        });
        setShowModal(false);
        setCurrentDeposit(null);
    };

    const handleAddChange = (e) => {
        const { name, value } = e.target;
        setNewDeposit({ ...newDeposit, [name]: value });
    };

    const handleAddSubmit = (e) => {
        e.preventDefault();
        const depositToAdd = {
            id: Date.now(),
            ...newDeposit,
            depositAmount: parseInt(newDeposit.depositAmount)
        };
        setDeposits([...deposits, depositToAdd]);
        setShowAddModal(false);
        setNewDeposit({ studentName: '', depositAmount: '', paidStatus: 'No', refundEligibility: 'No' });
    };

    const columns = [
        { header: 'Student Name', accessor: 'studentName', render: (row) => <span className="fw-600">{row.studentName}</span> },
        { header: 'Deposit Amount', accessor: 'depositAmount', render: (row) => <span className="fw-500">₹{row.depositAmount}</span> },
        {
            header: 'Paid Status',
            accessor: 'paidStatus',
            render: (row) => (
                <span className={`badge rounded-pill px-3 py-2 fw-bold ${row.paidStatus === 'Yes' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                    {row.paidStatus === 'Yes' ? 'Settled' : 'Pending'}
                </span>
            )
        },
        {
            header: 'Refund Eligibility',
            accessor: 'refundEligibility',
            render: (row) => (
                <span className={`badge rounded-pill px-3 py-2 fw-bold ${row.refundEligibility === 'Yes' ? 'bg-info bg-opacity-10 text-info-emphasis' : 'bg-warning bg-opacity-10 text-warning-emphasis'}`}>
                    {row.refundEligibility === 'Yes' ? 'Eligible' : 'Locked'}
                </span>
            )
        },
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
            <header className="mb-4 d-flex justify-content-between align-items-center">
                <div>
                    <h3 className="fw-bold text-main mb-1">Security Deposit</h3>
                    <p className="text-muted small">Manage refundable deposits and financial clearance status.</p>
                </div>
            </header>

            <div className="glass-card mb-4 p-3 border-0 bg-primary bg-opacity-10 text-primary fw-500 d-flex align-items-center" style={{ borderRadius: '12px' }}>
                <i className="bi bi-info-circle-fill me-2 fs-5"></i>
                Security deposits are refundable only upon official vacating of the hostel with no pending dues.
            </div>

            <DataTable
                title="Deposit Ledgers"
                columns={columns}
                data={activeStudentDeposits}
                actions={
                    <button className="btn-premium btn-premium-primary" onClick={() => setShowAddModal(true)}>
                        <i className="bi bi-plus-circle"></i> New Deposit
                    </button>
                }
            />

            {/* Edit Deposit Modal */}
            {showModal && currentDeposit && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content glass-card border-0 shadow-2xl p-0" style={{ overflow: 'hidden' }}>
                            <div className="p-4 border-bottom border-light d-flex justify-content-between align-items-center bg-primary bg-opacity-10">
                                <h5 className="modal-title fw-bold text-main mb-0">
                                    <i className="bi bi-shield-lock-fill text-primary me-2"></i>Modify Deposit Info
                                </h5>
                                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="p-4">
                                <form onSubmit={handleSave}>
                                    <div className="row g-4">
                                        <div className="col-md-12">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Student Name</label>
                                            <input type="text" className="form-control" name="studentName" value={currentDeposit.studentName} onChange={handleInputChange} required />
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Deposit Amount (₹)</label>
                                            <input type="number" className="form-control fw-bold text-primary" name="depositAmount" value={currentDeposit.depositAmount} onChange={handleInputChange} required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Paid Status</label>
                                            <select className="form-select" name="paidStatus" value={currentDeposit.paidStatus} onChange={handleInputChange}>
                                                <option value="Yes">Settled (Paid)</option>
                                                <option value="No">Pending (Unpaid)</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Refund Eligibility</label>
                                            <select className="form-select" name="refundEligibility" value={currentDeposit.refundEligibility} onChange={handleInputChange}>
                                                <option value="Yes">Eligible</option>
                                                <option value="No">Locked</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-5 d-flex gap-2 justify-content-end">
                                        <button type="button" className="btn btn-light px-4 rounded-pill fw-500" onClick={() => setShowModal(false)}>Discard</button>
                                        <button type="submit" className="btn-premium btn-premium-primary rounded-pill px-5">Save Changes</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Deposit Modal */}
            {showAddModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content glass-card border-0 shadow-2xl p-0" style={{ overflow: 'hidden' }}>
                            <div className="p-4 border-bottom border-light d-flex justify-content-between align-items-center bg-primary bg-opacity-10">
                                <h5 className="modal-title fw-bold text-main mb-0">
                                    <i className="bi bi-file-earmark-plus-fill text-primary me-2"></i>New Deposit Record
                                </h5>
                                <button type="button" className="btn-close shadow-none" onClick={() => setShowAddModal(false)}></button>
                            </div>
                            <div className="p-4">
                                <form onSubmit={handleAddSubmit}>
                                    <div className="row g-4">
                                        <div className="col-md-12">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Student Name</label>
                                            <input type="text" className="form-control" name="studentName" value={newDeposit.studentName} onChange={handleAddChange} placeholder="Search student name..." required />
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Deposit Amount (₹)</label>
                                            <input type="number" className="form-control fw-bold" name="depositAmount" value={newDeposit.depositAmount} onChange={handleAddChange} placeholder="5000" required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Paid Status</label>
                                            <select className="form-select" name="paidStatus" value={newDeposit.paidStatus} onChange={handleAddChange}>
                                                <option value="Yes">Paid</option>
                                                <option value="No">Unpaid</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Refund Eligibility</label>
                                            <select className="form-select" name="refundEligibility" value={newDeposit.refundEligibility} onChange={handleAddChange}>
                                                <option value="Yes">Eligible</option>
                                                <option value="No">Not Eligible</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-5 d-flex gap-2 justify-content-end">
                                        <button type="button" className="btn btn-light px-4 rounded-pill fw-500" onClick={() => setShowAddModal(false)}>Cancel</button>
                                        <button type="submit" className="btn-premium btn-premium-primary rounded-pill px-5">Add Record</button>
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
            `}</style>
        </div>
    );
};

export default SecurityDeposit;
