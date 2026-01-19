import React from 'react';

const DataTable = ({ columns, data, title, actions }) => {
    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-primary">{title}</h5>
                {actions && <div>{actions}</div>}
            </div>
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table table-hover table-striped align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                {columns.map((col, index) => (
                                    <th key={index} scope="col" className="py-3 px-3 border-bottom-0">{col.header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {columns.map((col, colIndex) => (
                                        <td key={colIndex} className="px-3">
                                            {col.render ? col.render(row) : row[col.accessor]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {data.length === 0 && (
                <div className="text-center py-4 text-muted">No data available</div>
            )}
        </div>
    );
};

export default DataTable;
