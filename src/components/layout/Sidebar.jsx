import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const Sidebar = () => {
    const location = useLocation();

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: 'bi-speedometer2' },
        { path: '/hostels', label: 'Hostel Management', icon: 'bi-building' },
        { path: '/rooms', label: 'Room Management', icon: 'bi-door-open' },
        { path: '/students', label: 'Student Details', icon: 'bi-people' },
        { path: '/fees', label: 'Fee & Payment', icon: 'bi-cash-coin' },
        { path: '/complaints', label: 'Complaints', icon: 'bi-tools' },
        { path: '/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
        { path: '/health', label: 'Health Issues', icon: <i className="bi bi-heart-pulse"></i> },
        { path: '/parent-visits', label: 'Parent Visits', icon: <i className="bi bi-people"></i> },
        { path: '/mess', label: 'Mess Management', icon: <i className="bi bi-egg-fried"></i> },
    ];

    return (
        <div className="d-flex flex-column flex-shrink-0 p-3 glass-card vh-100 border-0 border-end rounded-0" style={{ width: '280px' }}>
            <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-decoration-none">
                <i className="bi bi-building fs-4 me-2 text-primary"></i>
                <span className="fs-4 fw-bold text-main"> Campus </span>
            </a>
            <hr />
            <ul className="nav nav-pills flex-column mb-auto">
                {menuItems.map((item) => (
                    <li className="nav-item" key={item.path}>
                        <Link
                            to={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : 'text-main opacity-75'}`}
                            aria-current={location.pathname === item.path ? 'page' : undefined}
                        >
                            <span className="me-2 text-primary">{item.icon}</span>
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>
            <hr className="opacity-25" />
            <div className="dropdown">
                <a href="#" className="d-flex align-items-center text-main text-decoration-none dropdown-toggle" id="dropdownUser2" data-bs-toggle="dropdown" aria-expanded="false">
                    <img src="https://github.com/mdo.png" alt="" width="32" height="32" className="rounded-circle me-2" />
                    <strong>Super Admin</strong>
                </a>
                <ul className="dropdown-menu text-small shadow glass-card p-2 border-0" aria-labelledby="dropdownUser2">
                    <li><a className="dropdown-item rounded-2 text-main" href="#">Profile</a></li>
                    <li><a className="dropdown-item rounded-2 text-main" href="#">Settings</a></li>
                    <li><hr className="dropdown-divider opacity-25" /></li>
                    <li><a className="dropdown-item rounded-2 text-danger" href="#">Sign out</a></li>
                </ul>
            </div>
        </div>
    );
};

export default Sidebar;
