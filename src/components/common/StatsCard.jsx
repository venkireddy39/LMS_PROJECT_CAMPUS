import React from 'react';

const StatsCard = ({ title, value, icon, color = 'primary', subtext }) => {
    return (
        <div className="glass-card p-4 border-0 h-100 d-flex flex-column overflow-hidden position-relative animate-in">
            <div className={`position-absolute top-0 start-0 h-100 bg-${color}`} style={{ width: '4px', opacity: 0.6 }}></div>
            <div className="d-flex justify-content-between align-items-start mb-3">
                <div className={`bg-${color} bg-opacity-10 p-3 rounded-4`}>
                    {icon ? <i className={`bi ${icon} fs-4 text-${color}`}></i> : <i className="bi bi-graph-up text-primary fs-4"></i>}
                </div>
                {subtext && <span className="badge bg-light text-dark border rounded-pill smaller opacity-75">{subtext}</span>}
            </div>
            <h4 className="fw-bold mb-1 text-main">{value}</h4>
            <p className="text-muted small mb-0 fw-500 uppercase tracking-wider">{title}</p>
        </div>
    );
};

export default StatsCard;
