import React, { useState } from 'react';
import { messData as initialData } from '../../data/messData';
import { FaUtensils, FaClock, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { MdRestaurant, MdRestaurantMenu, MdOutlineUpdate } from 'react-icons/md';

const MessManagement = () => {
    const [mess, setMess] = useState(initialData);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(initialData);

    const toggleMessStatus = () => {
        setMess(prev => ({
            ...prev,
            isOpen: !prev.isOpen,
            lastUpdated: new Date().toLocaleString()
        }));
    };

    const handleStatusChange = (meal, status) => {
        setMess(prev => ({
            ...prev,
            menu: {
                ...prev.menu,
                [meal]: {
                    ...prev.menu[meal],
                    status: status
                }
            },
            lastUpdated: new Date().toLocaleString()
        }));
    };

    const handleEditClick = () => {
        setEditData({ ...mess });
        setIsEditing(true);
    };

    const handleSave = () => {
        setMess({
            ...editData,
            lastUpdated: new Date().toLocaleString()
        });
        setIsEditing(false);
    };

    const handleInputChange = (e, section) => {
        const { name, value } = e.target;
        if (section) {
            setEditData(prev => ({
                ...prev,
                menu: {
                    ...prev.menu,
                    [section]: {
                        ...prev.menu[section],
                        [name]: value
                    }
                }
            }));
        } else {
            setEditData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    return (
        <div className="container-fluid py-4 animate-in overflow-hidden">
            <header className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h2 className="fw-bold text-dark mb-1"><MdRestaurantMenu className="text-primary me-2" />Mess Control Center</h2>
                    <p className="text-muted mb-0">Monitor service status and manage daily dining menus.</p>
                </div>
                <div className="d-flex gap-3 align-items-center">
                    <div className="text-end d-none d-md-block">
                        <p className="mb-0 smaller text-muted fw-bold text-uppercase tracking-wider">Operational Status</p>
                        <p className="mb-0 small text-dark"><MdOutlineUpdate className="text-primary" /> {mess.lastUpdated}</p>
                    </div>
                    <button
                        className={`btn-premium ${mess.isOpen ? 'btn-premium-primary' : 'btn-danger shadow-lg'}`}
                        onClick={toggleMessStatus}
                        style={!mess.isOpen ? { background: 'linear-gradient(45deg, #ef4444, #b91c1c)' } : {}}
                    >
                        {mess.isOpen ? <FaCheck /> : <FaTimes />} {mess.isOpen ? 'Mess opened' : 'Mess closed'}
                    </button>
                </div>
            </header>

            <div className="row g-4 mb-5">
                {/* Menu Cards */}
                {Object.keys(mess.menu).map((meal, index) => (
                    <div key={meal} className="col-lg-4 col-md-6" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="glass-card h-100 border-0 p-0 overflow-hidden">
                            <div className={`py-3 px-4 text-white d-flex justify-content-between align-items-center ${meal === 'breakfast' ? 'bg-primary' : meal === 'lunch' ? 'bg-info' : 'bg-dark'}`}>
                                <h5 className="mb-0 text-capitalize fw-bold">{meal}</h5>
                                <FaClock className="opacity-50" />
                            </div>
                            <div className="p-4">
                                <div className="mb-4">
                                    <label className="smaller fw-bold text-muted text-uppercase tracking-wider mb-2 d-block">Serving Time</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="form-control form-control-sm rounded-pill px-3"
                                            name="time"
                                            value={editData.menu[meal].time}
                                            onChange={(e) => handleInputChange(e, meal)}
                                        />
                                    ) : (
                                        <div className="d-flex align-items-center gap-2 text-dark fw-bold h5 mb-0">
                                            {mess.menu[meal].time}
                                        </div>
                                    )}
                                </div>
                                <label className="smaller fw-bold text-muted text-uppercase tracking-wider mb-2 d-block">Today's Menu</label>
                                <div className={`p-3 rounded-4 ${isEditing ? 'bg-white shadow-inner' : 'bg-light bg-opacity-50'}`} style={{ minHeight: '120px' }}>
                                    {isEditing ? (
                                        <textarea
                                            className="form-control border-0 bg-transparent shadow-none"
                                            rows="4"
                                            name="items"
                                            value={editData.menu[meal].items}
                                            onChange={(e) => handleInputChange(e, meal)}
                                            style={{ resize: 'none' }}
                                        ></textarea>
                                    ) : (
                                        <p className="mb-0 fw-500 text-dark" style={{ whiteSpace: 'pre-line' }}>{mess.menu[meal].items}</p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="smaller fw-bold text-muted text-uppercase tracking-wider mb-2 d-block">Service Status</label>
                                    <div className="btn-group w-100 rounded-3 overflow-hidden border shadow-sm">
                                        <button
                                            className={`btn btn-sm py-2 fw-bold ${mess.menu[meal].status === 'Not Served' ? 'btn-danger' : 'btn-light text-muted'}`}
                                            onClick={() => handleStatusChange(meal, 'Not Served')}
                                        >
                                            Not Served
                                        </button>
                                        <button
                                            className={`btn btn-sm py-2 fw-bold ${mess.menu[meal].status === 'Served' ? 'btn-success' : 'btn-light text-muted'}`}
                                            onClick={() => handleStatusChange(meal, 'Served')}
                                        >
                                            Served
                                        </button>
                                        <button
                                            className={`btn btn-sm py-2 fw-bold ${mess.menu[meal].status === 'Food Completed' ? 'btn-dark' : 'btn-light text-muted'}`}
                                            onClick={() => handleStatusChange(meal, 'Food Completed')}
                                        >
                                            Completed
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Specials Bar */}
                <div className="col-12 mt-2">
                    <div className="glass-card border-0 p-4" style={{ background: 'linear-gradient(90deg, #fffcf0 0%, #fff 100%)' }}>
                        <div className="row align-items-center g-4">
                            <div className="col-md-auto">
                                <div className="bg-warning bg-opacity-20 p-4 rounded-circle text-warning shadow-sm border border-warning border-opacity-10 d-flex align-items-center justify-content-center" style={{ width: '70px', height: '70px' }}>
                                    <MdRestaurant size={32} />
                                </div>
                            </div>
                            <div className="col">
                                <h6 className="text-warning-emphasis fw-bold text-uppercase tracking-widest smaller mb-1">Chef's Special Recommendation</h6>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="form-control form-control-lg border-warning border-opacity-25"
                                        name="special"
                                        value={editData.special}
                                        onChange={(e) => handleInputChange(e)}
                                    />
                                ) : (
                                    <h3 className="mb-0 fw-bold text-dark">{mess.special}</h3>
                                )}
                            </div>
                            <div className="col-md-auto">
                                {isEditing ? (
                                    <div className="d-flex gap-2">
                                        <button className="btn btn-light px-4 rounded-pill fw-bold" onClick={() => setIsEditing(false)}>Discard</button>
                                        <button className="btn-premium btn-premium-primary rounded-pill px-4" onClick={handleSave}>Apply Menu</button>
                                    </div>
                                ) : (
                                    <button className="btn-premium bg-dark text-white rounded-pill px-4 shadow-sm" onClick={handleEditClick}>
                                        <FaEdit /> Update Daily Board
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Board Preview */}
            <div className="mt-5 glass-card border-0 p-5 text-center bg-white">
                <div className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mb-3 fw-bold text-uppercase smaller tracking-widest">
                    Live Digital Signage Preview
                </div>
                <h3 className="fw-bold mb-5">Student Display View</h3>

                <div className="mx-auto shadow-2xl rounded-5 overflow-hidden border border-light" style={{ maxWidth: '800px', backgroundColor: '#0f172a' }}>
                    <div className={`p-5 text-center ${mess.isOpen ? 'bg-success bg-opacity-75' : 'bg-danger bg-opacity-75'}`} style={{ backdropFilter: 'blur(10px)' }}>
                        <h1 className="display-3 mb-1 fw-bold text-white tracking-tighter">{mess.isOpen ? 'MESS OPEN' : 'MESS CLOSED'}</h1>
                        <p className="text-white text-opacity-75 mb-0 text-uppercase tracking-widest">Campus Central Dining</p>
                    </div>

                    <div className="p-5 text-white bg-slate-900">
                        <div className="row g-5 text-start">
                            {Object.keys(mess.menu).map(meal => (
                                <div key={meal} className="col-md-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="text-primary text-uppercase tracking-widest mb-0 fw-bold">{meal}</h6>
                                        <span className={`badge rounded-pill smaller ${mess.menu[meal].status === 'Served' ? 'bg-success' :
                                            mess.menu[meal].status === 'Food Completed' ? 'bg-secondary' : 'bg-danger'
                                            }`} style={{ fontSize: '0.6rem' }}>
                                            {mess.menu[meal].status}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 smaller mb-2 font-monospace">{mess.menu[meal].time}</p>
                                    <p className="fw-500 fs-5 lh-base text-white">{mess.menu[meal].items}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 pt-5 border-top border-slate-700 border-opacity-50">
                            <div className="d-flex align-items-center justify-content-center gap-3">
                                <span className="p-2 bg-warning rounded-circle shadow-sm">
                                    <MdRestaurant className="text-dark" />
                                </span>
                                <div className="text-center">
                                    <p className="smaller text-warning text-uppercase tracking-widest mb-1 fw-bold">Today's Special Highlight</p>
                                    <h4 className="fw-bold text-white mb-0">{mess.special}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <p className="text-muted mt-4 small">This board is automatically updated on all digital screens across the campus.</p>
            </div>

            <style jsx>{`
                .tracking-tighter { letter-spacing: -0.05em; }
                .tracking-wider { letter-spacing: 0.1em; }
                .tracking-widest { letter-spacing: 0.2em; }
                .fw-500 { font-weight: 500; }
                .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
                .bg-slate-900 { background-color: #0f172a; }
                .text-slate-400 { color: #94a3b8; }
            `}</style>
        </div>
    );
};

export default MessManagement;
