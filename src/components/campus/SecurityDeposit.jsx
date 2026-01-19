import React from 'react';
import DataTable from '../common/DataTable';
import { securityDepositData } from '../../data/feeData';

const SecurityDeposit = () => {
    const columns = [
        { header: 'Student Name', accessor: 'studentName' },
        { header: 'Deposit Amount', accessor: 'depositAmount', render: (row) => `₹${row.depositAmount}` },
        {
            header: 'Paid Status',
            accessor: 'paidStatus',
            render: (row) => (
                <span className={`badge ${row.paidStatus === 'Yes' ? 'bg-success' : 'bg-danger'}`}>
                    {row.paidStatus === 'Yes' ? 'Paid' : 'Unpaid'}
                </span>
            )
        },
        {
            header: 'Refund Eligibility',
            accessor: 'refundEligibility',
            render: (row) => (
                <span className={`badge ${row.refundEligibility === 'Yes' ? 'bg-info text-dark' : 'bg-warning text-dark'}`}>
                    {row.refundEligibility === 'Yes' ? 'Eligible' : 'Not Eligible'}
                </span>
            )
        },
    ];

    return (
        <div className="container-fluid">
            <h3 className="mb-4 fw-bold">Security Deposit</h3>
            <div className="alert alert-info mb-4">
                <i className="bi bi-info-circle me-2"></i>
                Security deposits are refundable only upon vacating the hostel with no dues pending.
            </div>
            <DataTable
                title="Deposit Records"
                columns={columns}
                data={securityDepositData}
            />
        </div>
    );
};

export default SecurityDeposit;
