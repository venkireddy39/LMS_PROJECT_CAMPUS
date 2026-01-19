import React from 'react';
import DataTable from '../common/DataTable';
import { feeData } from '../../data/feeData';

const FeeManagement = () => {
    const [fees, setFees] = React.useState(feeData);
    const [showModal, setShowModal] = React.useState(false);
    const [currentFee, setCurrentFee] = React.useState(null);

    const handleEditClick = (feeRecord) => {
        setCurrentFee({ ...feeRecord });
        setShowModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentFee({ ...currentFee, [name]: value });
    };

    const handleSave = (e) => {
        e.preventDefault();
        setFees(prevFees => prevFees.map(f => f.id === currentFee.id ? currentFee : f));
        setShowModal(false);
        setCurrentFee(null);
    };

    const columns = [
        { header: 'Student Name', accessor: 'studentName' },
        { header: 'Monthly Fee', accessor: 'monthlyFee', render: (row) => `₹${row.monthlyFee}` },
        { header: 'Total Fee', accessor: 'totalFee', render: (row) => `₹${row.totalFee}` },
        { header: 'Amt Paid', accessor: 'amountPaid', render: (row) => `₹${row.amountPaid}` },
        { header: 'Due', accessor: 'monthlyDue', render: (row) => <span className="text-danger fw-bold">₹{row.monthlyDue}</span> },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => {
                let badgeClass = 'bg-secondary';
                if (row.status === 'Paid') badgeClass = 'bg-success';
                else if (row.status === 'Due') badgeClass = 'bg-danger';
                else if (row.status === 'Partial') badgeClass = 'bg-warning text-dark';
                return <span className={`badge ${badgeClass}`}>{row.status}</span>;
            }
        },
        { header: 'Last Payment', accessor: 'lastPaymentDate' },
        {
            header: 'Actions',
            accessor: 'actions',
            render: (row) => (
                <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditClick(row)}>
                    <i className="bi bi-pencil-square"></i> Edit
                </button>
            )
        }
    ];

    return (
        <div className="container-fluid position-relative">
            <h3 className="mb-4 fw-bold">Fee & Payment Management</h3>
            <DataTable
                title="Fee Records"
                columns={columns}
                data={fees}
            />

            {/* Edit Fee Modal */}
            {showModal && currentFee && (
                <>
                    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-lg" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title fw-bold">Edit Fee Details</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <form onSubmit={handleSave}>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label">Student Name</label>
                                                <input type="text" className="form-control" name="studentName" value={currentFee.studentName} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Monthly Fee</label>
                                                <input type="number" className="form-control" name="monthlyFee" value={currentFee.monthlyFee} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Total Fee</label>
                                                <input type="number" className="form-control" name="totalFee" value={currentFee.totalFee} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Amount Paid</label>
                                                <input type="number" className="form-control" name="amountPaid" value={currentFee.amountPaid} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Due Amount</label>
                                                <input type="number" className="form-control" name="monthlyDue" value={currentFee.monthlyDue} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Last Payment Date</label>
                                                <input type="date" className="form-control" name="lastPaymentDate" value={currentFee.lastPaymentDate} onChange={handleInputChange} />
                                            </div>
                                            <div className="col-md-12">
                                                <label className="form-label">Payment Status</label>
                                                <select className="form-select" name="status" value={currentFee.status} onChange={handleInputChange}>
                                                    <option value="Paid">Paid</option>
                                                    <option value="Partial">Partial</option>
                                                    <option value="Due">Due</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mt-4 text-end">
                                            <button type="button" className="btn btn-secondary me-2" onClick={() => setShowModal(false)}>Cancel</button>
                                            <button type="submit" className="btn btn-primary">Save Changes</button>
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

export default FeeManagement;
