import React from 'react';
import DataTable from '../common/DataTable';
import { maintenanceData } from '../../data/maintenanceData';

const Maintenance = () => {
    const columns = [
        { header: 'Hostel Name', accessor: 'hostelName' },
        { header: 'Room No.', accessor: 'roomNumber' },
        {
            header: 'Category',
            accessor: 'category',
            render: (row) => <span className="fw-bold">{row.category}</span>
        },
        { header: 'Description', accessor: 'description' },
        { header: 'Reported Date', accessor: 'reportedDate' },
        {
            header: 'Priority',
            accessor: 'priority',
            render: (row) => {
                let color = 'secondary';
                if (row.priority === 'High') color = 'danger';
                if (row.priority === 'Medium') color = 'warning text-dark';
                return <span className={`badge bg-${color}`}>{row.priority}</span>;
            }
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => {
                let color = 'secondary';
                if (row.status === 'Resolved') color = 'success';
                if (row.status === 'In Progress') color = 'primary';
                return <span className={`badge bg-${color}`}>{row.status}</span>;
            }
        },
        { header: 'Remarks', accessor: 'remarks' },
    ];

    return (
        <div className="container-fluid">
            <h3 className="mb-4 fw-bold">Maintenance & Issues</h3>
            <DataTable
                title="Reported Issues"
                columns={columns}
                data={maintenanceData}
            />
        </div>
    );
};

export default Maintenance;
