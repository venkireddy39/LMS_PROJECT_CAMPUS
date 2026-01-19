import React from 'react';

const StatsCard = ({ title, value, icon, color = 'primary', subtext }) => {
    return (
        <div className={`card bg-${color} text-white mb-4 h-100 shadow-sm`}>
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="card-title text-uppercase mb-2 opacity-75">{title}</h6>
                        <h2 className="card-text fw-bold display-6">{value}</h2>
                        {subtext && <p className="card-text small opacity-75">{subtext}</p>}
                    </div>
                    {icon && <i className={`bi ${icon} display-4 opacity-50`}></i>}
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
