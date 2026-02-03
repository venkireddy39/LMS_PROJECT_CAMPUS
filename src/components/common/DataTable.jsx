import React from 'react';

const DataTable = ({ columns, data, title, actions }) => {
    return (
        <div className="glass-card mb-4 animate-in">
            <div className="px-4 py-4 d-flex justify-content-between align-items-center border-bottom border-light border-opacity-10">
                <h5 className="mb-0 fw-bold text-main">{title}</h5>
                {actions && <div className="d-flex gap-2">{actions}</div>}
            </div>
            <div className="p-3">
                <div className="table-responsive">
                    <table className="table table-premium align-middle mb-0">
                        <thead>
                            <tr>
                                {columns.map((col, index) => (
                                    <th key={index} scope="col">{col.header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {columns.map((col, colIndex) => {
                                        const cellValue = typeof col.accessor === 'function'
                                            ? col.accessor(row)
                                            : row[col.accessor];
                                        return (
                                            <td key={colIndex}>
                                                {col.render ? col.render(row) : <span className="fw-500">{cellValue}</span>}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {data.length === 0 && (
                    <div className="text-center py-5">
                        <i className="bi bi-inbox fs-1 text-muted opacity-25 d-block mb-3"></i>
                        <p className="text-muted mb-0">No records found matching your workspace.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataTable;
