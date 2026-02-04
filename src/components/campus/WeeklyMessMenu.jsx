import React, { useState, useEffect } from 'react';
import campusService from '../../services/campusService';
import { FaEdit, FaSave, FaUtensils, FaCoffee, FaMoon, FaSun, FaCalendarDay, FaClock, FaCheck, FaTrash } from 'react-icons/fa';

const WeeklyMessMenu = () => {
    // --- State Management ---
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // activeDay is synced globally via localStorage
    const [activeDay, setActiveDay] = useState('Monday');

    // Menu Data State
    const [menuData, setMenuData] = useState({});

    // Helper to map backend ENUM to frontend Display value
    const normalizeStatus = (backendStatus) => {
        if (!backendStatus) return 'Not Served';
        const statusMap = {
            'NOT_SERVED': 'Not Served',
            'SERVED': 'Served',
            'COMPLETED': 'Completed'
        };
        // Return mapped value or fallback to Title Case if essentially same
        return statusMap[backendStatus] || backendStatus;
    };

    // Helper to map frontend Display value to backend ENUM
    const toBackendStatus = (frontendStatus) => {
        const statusMap = {
            'Not Served': 'NOT_SERVED',
            'Served': 'SERVED',
            'Completed': 'COMPLETED'
        };
        return statusMap[frontendStatus] || frontendStatus.toUpperCase().replace(' ', '_');
    };

    // Fetch Menu Logic
    const loadMenu = async () => {
        try {
            const data = await campusService.getAllMenus();
            if (data && data.length > 0) {
                const menusConfig = {};
                days.forEach(d => {
                    // Match day case-insensitively (Backend sends MONDAY, frontend uses Monday)
                    const dayMenu = data.find(m => m.day.toUpperCase() === d.toUpperCase()) || { title: d, breakfast: '', lunch: '', dinner: '', breakfastStatus: 'Not Served', lunchStatus: 'Not Served', dinnerStatus: 'Not Served' };
                    menusConfig[d] = {
                        Breakfast: { items: dayMenu.breakfast, status: normalizeStatus(dayMenu.breakfastStatus) },
                        Lunch: { items: dayMenu.lunch, status: normalizeStatus(dayMenu.lunchStatus) },
                        Dinner: { items: dayMenu.dinner, status: normalizeStatus(dayMenu.dinnerStatus) },
                        id: dayMenu.id // Keep ID for updates
                    };
                });
                setMenuData(menusConfig);
            } else {
                // Initialize empty if no data
                const empty = {};
                days.forEach(d => {
                    empty[d] = {
                        Breakfast: { items: '', status: 'Not Served' },
                        Lunch: { items: '', status: 'Not Served' },
                        Dinner: { items: '', status: 'Not Served' }
                    };
                });
                setMenuData(empty);
            }
        } catch (error) {
            console.error("Failed to load menu", error);
            // Fallback to empty menu if fetch fails to prevent infinite loading
            const empty = {};
            days.forEach(d => {
                empty[d] = {
                    Breakfast: { items: '', status: 'Not Served' },
                    Lunch: { items: '', status: 'Not Served' },
                    Dinner: { items: '', status: 'Not Served' },
                    id: null
                };
            });
            setMenuData(empty);
        }
    }

    useEffect(() => {
        loadMenu();
    }, []);

    // Edit Mode State (Admin Only)
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(null);

    // --- Handlers ---

    // Guard clause for loading state
    if (!menuData[activeDay]) {
        return <div className="p-5 text-center text-muted">Loading menu data...</div>;
    }

    const handleDayChange = (day) => {
        setActiveDay(day);
        setIsEditing(false);
    };

    const handleEditClick = () => {
        if (!menuData[activeDay]) return;
        setEditForm({
            Breakfast: menuData[activeDay].Breakfast.items || '',
            Lunch: menuData[activeDay].Lunch.items || '',
            Dinner: menuData[activeDay].Dinner.items || ''
        });
        setIsEditing(true);
    };

    const handleInputChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleStatusChange = async (meal, newStatus) => {
        const currentParams = menuData[activeDay];
        console.log(`[MessMenu] Updating ${meal} status to ${newStatus} for ${activeDay} (ID: ${currentParams.id})`);

        const updatePayload = {
            day: activeDay.toUpperCase(), // Backend expects uppercase Enum
            breakfast: currentParams.Breakfast.items || '',
            lunch: currentParams.Lunch.items || '',
            dinner: currentParams.Dinner.items || '',
            breakfastStatus: meal === 'Breakfast' ? toBackendStatus(newStatus) : toBackendStatus(currentParams.Breakfast.status),
            lunchStatus: meal === 'Lunch' ? toBackendStatus(newStatus) : toBackendStatus(currentParams.Lunch.status),
            dinnerStatus: meal === 'Dinner' ? toBackendStatus(newStatus) : toBackendStatus(currentParams.Dinner.status)
        };

        console.log('[MessMenu] Payload:', updatePayload);

        try {
            if (currentParams.id) {
                // Using PUT (updateMenuFull) as we are sending the complete object
                const response = await campusService.updateMenuFull(currentParams.id, updatePayload);
                console.log('[MessMenu] Update Response:', response);
            } else {
                const response = await campusService.createMenu(updatePayload);
                console.log('[MessMenu] Create Response:', response);
            }
            loadMenu();
        } catch (e) {
            console.error("Failed to update status", e);
            alert(`Failed to update status: ${e.message}`);
        }
    };

    const handleSave = async () => {
        const currentParams = menuData[activeDay];
        const updatePayload = {
            day: activeDay.toUpperCase(), // Backend expects uppercase Enum
            breakfast: editForm.Breakfast,
            lunch: editForm.Lunch,
            dinner: editForm.Dinner,
            breakfastStatus: toBackendStatus(currentParams.Breakfast.status),
            lunchStatus: toBackendStatus(currentParams.Lunch.status),
            dinnerStatus: toBackendStatus(currentParams.Dinner.status)
        };

        try {
            if (currentParams.id) {
                await campusService.updateMenu(currentParams.id, updatePayload);
            } else {
                await campusService.createMenu(updatePayload);
            }
            loadMenu();
            setIsEditing(false);
        } catch (e) {
            console.error("Failed to save menu", e);
            alert("Failed to save menu");
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to clear the menu for this day?')) {
            const currentParams = menuData[activeDay];
            if (currentParams.id) {
                await campusService.deleteMenu(currentParams.id);
                loadMenu();
            }
            setIsEditing(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Served': return 'success'; // Green
            case 'Completed': return 'secondary'; // Grey
            case 'Not Served': default: return 'warning'; // Yellow/Orange
        }
    };


    // --- Render Helpers ---
    const MealCard = ({ title, icon: Icon, data, colorClass }) => (
        <div className={`p-3 rounded-4 w-100 h-100 flex-grow-1 ${colorClass} bg-opacity-10 border border-${colorClass.replace('bg-', '')} border-opacity-20 shadow-sm transition-all hover-shadow-md d-flex flex-column overflow-hidden`} style={{ minHeight: '140px' }}>
            <div className={`d-flex align-items-center justify-content-between mb-4`}>
                <div className={`d-flex align-items-center gap-2 ${colorClass.replace('bg-', 'text-')} fw-bold text-uppercase tracking-wider smaller`}>
                    <Icon size={18} /> <span style={{ fontSize: '0.9rem' }}>{title}</span>
                </div>
                {/* Student View Status Badge */}
                <span className={`badge bg-${getStatusColor(data.status)} bg-opacity-75 rounded-pill px-3 py-2 smaller shadow-sm`}>
                    {data.status}
                </span>
            </div>
            {data.items ? (
                <p className="fw-500 text-dark mb-0 lh-lg text-break text-wrap flex-grow-1" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-line', fontSize: '1.05rem' }}>{data.items}</p>
            ) : (
                <div className="d-flex align-items-center justify-content-center h-100 text-muted opacity-50">
                    <span className="fst-italic small">Menu pending...</span>
                </div>
            )}
        </div>
    );

    return (
        <div className="container-fluid py-4 animate-in">
            {/* --- ADMIN SECTION --- */}
            <div className="mb-5">
                <header className="mb-4 d-flex justify-content-between align-items-center">
                    <div>
                        <div className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mb-2 fw-bold text-uppercase smaller tracking-widest">
                            Admin Control Panel
                        </div>
                        <h3 className="fw-bold text-main mb-1">Weekly Menu Planner</h3>
                        <p className="text-muted small">Manage items and service status. Status updates reflect instantly.</p>
                    </div>
                </header>

                {/* Day Selector */}
                <div className="d-flex gap-2 overflow-auto pb-3 mb-4 hide-scrollbar">
                    {days.map(day => (
                        <button
                            key={day}
                            onClick={() => handleDayChange(day)}
                            className={`btn rounded-pill px-4 fw-bold transition-all whitespace-nowrap ${activeDay === day
                                ? 'btn-premium-primary text-white shadow-lg scale-105'
                                : 'btn-light text-muted border'
                                }`}
                            style={{ minWidth: '120px' }}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                {/* Admin Editor / View */}
                <div className="glass-card border-0 p-4 mb-5 h-auto d-block overflow-hidden">
                    <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                        <h4 className="fw-bold text-main mb-0 d-flex align-items-center gap-2">
                            <FaCalendarDay className="text-primary" /> {activeDay}'s Menu
                        </h4>
                        {!isEditing ? (
                            <div className="d-flex gap-2">
                                <button className="btn btn-light text-danger fw-bold rounded-pill px-3" onClick={handleDelete}>
                                    <FaTrash className="me-2" /> Delete Menu
                                </button>
                                <button className="btn-premium btn-premium-primary rounded-pill px-4" onClick={handleEditClick}>
                                    <FaEdit className="me-2" /> Edit Menu
                                </button>
                            </div>
                        ) : (
                            <div className="d-flex gap-2">
                                <button className="btn btn-light rounded-pill px-4" onClick={() => setIsEditing(false)}>Cancel</button>
                                <button className="btn-premium btn-premium-primary rounded-pill px-4" onClick={handleSave}>
                                    <FaSave className="me-2" /> Save Changes
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="row g-5">
                        {menuData[activeDay] && ['Breakfast', 'Lunch', 'Dinner'].map((meal) => (
                            <div key={meal} className="col-md-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="form-label fw-bold text-uppercase smaller text-muted tracking-wider mb-0">
                                        {meal}
                                    </label>
                                    {/* Status Selector UI */}
                                    <div className="d-flex bg-white rounded-pill p-2 border shadow-sm" style={{ width: 'fit-content' }}>
                                        {[
                                            { label: 'Not Served', value: 'Not Served', icon: FaClock, color: 'warning' },
                                            { label: 'Served', value: 'Served', icon: FaUtensils, color: 'success' },
                                            { label: 'Completed', value: 'Completed', icon: FaCheck, color: 'secondary' }
                                        ].map((statusOption) => {
                                            const isActive = menuData[activeDay][meal].status === statusOption.value;
                                            const StatusIcon = statusOption.icon;
                                            return (
                                                <button
                                                    key={statusOption.value}
                                                    onClick={() => !isEditing && handleStatusChange(meal, statusOption.value)}
                                                    disabled={isEditing}
                                                    className={`btn btn-sm rounded-pill d-flex align-items-center gap-2 fw-bold transition-all ${isActive
                                                        ? `btn-${statusOption.color} text-white shadow-sm px-4 py-2`
                                                        : 'btn-light text-muted bg-transparent border-0 px-3 py-2'
                                                        }`}
                                                    style={{ fontSize: '0.85rem' }}
                                                    title={`Mark as ${statusOption.label}`}
                                                >
                                                    <StatusIcon size={14} />
                                                    {/* {isActive && <span>{statusOption.label}</span>} */}
                                                    {/* Hide label to save space on mobile/cards */}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {isEditing ? (
                                    <textarea
                                        className="form-control border-0 bg-secondary bg-opacity-10 rounded-4 p-3 shadow-inner"
                                        rows="5"
                                        name={meal}
                                        value={editForm[meal]}
                                        onChange={handleInputChange}
                                        placeholder={`Enter ${meal} items...`}
                                        style={{ resize: 'none' }}
                                    ></textarea>
                                ) : (
                                    <div className={`p-3 rounded-4 d-flex flex-column overflow-hidden ${meal === 'Breakfast' ? 'bg-warning' :
                                        meal === 'Lunch' ? 'bg-danger' : 'bg-primary'
                                        } bg-opacity-10 border border-opacity-10`} style={{ height: '140px' }}>
                                        <p className="fw-500 mb-0 lh-lg text-break text-wrap" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-line', fontSize: '1rem' }}>{menuData[activeDay][meal].items || <span className="text-muted fst-italic opacity-50">Not Set</span>}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>


            {/* --- STUDENT LIVE VIEW SECTION --- */}
            <div className="pt-4 border-top border-light">
                <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill fw-bold text-uppercase smaller tracking-widest">
                        Student View Live Preview
                    </div>
                    <span className="text-muted small fst-italic">
                        *Students see this view automatically updated.
                    </span>
                </div>

                <div className="glass-card border-0 p-0 overflow-hidden shadow-2xl" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="p-4 bg-slate-900 text-white d-flex justify-content-between align-items-center" style={{ background: '#0f172a' }}>
                        <div>
                            <p className="text-success text-uppercase tracking-widest fw-bold smaller mb-1">Live Menu Board</p>
                            <h2 className="fw-bold mb-0 text-white">{activeDay}</h2>
                        </div>
                        <div className="text-end">
                            <p className="mb-0 text-white text-opacity-50 small">Campus Dining</p>
                            <div className="d-flex align-items-center gap-2 text-warning small">
                                <FaUtensils /> <span className="fw-bold">Serving Fresh</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-white">
                        <div className="row g-5">
                            <div className="col-md-4 d-flex">
                                <MealCard
                                    title="Breakfast"
                                    icon={FaCoffee}
                                    colorClass="bg-warning"
                                    data={menuData[activeDay].Breakfast}
                                />
                            </div>
                            <div className="col-md-4 d-flex">
                                <MealCard
                                    title="Lunch"
                                    icon={FaSun}
                                    colorClass="bg-danger"
                                    data={menuData[activeDay].Lunch}
                                />
                            </div>
                            <div className="col-md-4 d-flex">
                                <MealCard
                                    title="Dinner"
                                    icon={FaMoon}
                                    colorClass="bg-primary"
                                    data={menuData[activeDay].Dinner}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-light text-center border-top">
                        <p className="small text-muted mb-0">
                            Balanced Diet • Hygienic Preparation • No Daily Repetition
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                .tracking-wider { letter-spacing: 0.05em; }
                .tracking-widest { letter-spacing: 0.15em; }
                .fw-500 { font-weight: 500; }
                .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); }
                .hover-shadow-md:hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); transform: translateY(-2px); }
                .scale-105 { transform: scale(1.05); }
                .whitespace-nowrap { white-space: nowrap; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05); }
            `}</style>
        </div>
    );
};

export default WeeklyMessMenu;
