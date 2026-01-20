import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const Navbar = () => {
    const location = useLocation();
    const [activeHash, setActiveHash] = React.useState(window.location.hash.replace('#', '') || 'dashboard');

    React.useEffect(() => {
        const handleHashChange = () => {
            setActiveHash(window.location.hash.replace('#', '') || 'dashboard');
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const menuItems = [
        { path: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
        { path: 'rooms', label: 'Rooms', icon: 'bi-door-open' },
        { path: 'students', label: 'Students', icon: 'bi-people' },
        { path: 'fees', label: 'Fees', icon: 'bi-cash-coin' },
        { path: 'security', label: 'Security', icon: 'bi-shield-lock' },
        { path: 'maintenance', label: 'Maintenance', icon: 'bi-tools' },
        { path: 'attendance', label: 'Attendance', icon: 'bi-calendar-check' },
        { path: 'health', label: 'Health', icon: 'bi-heart-pulse' },
        { path: 'parent-visits', label: 'Visits', icon: 'bi-people' },
        { path: 'mess', label: 'Mess', icon: 'bi-egg-fried' },
    ];

    const handleScroll = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            window.history.pushState(null, null, `#${id}`);
            setActiveHash(id);
        }
    };

    return (
        <nav className="navbar navbar-expand-lg glass-navbar sticky-top py-3">
            <div className="container-fluid px-4">
                <a href="#dashboard" onClick={(e) => { e.preventDefault(); handleScroll('dashboard'); }} className="navbar-brand fw-bold d-flex align-items-center text-primary fs-4">
                    <div className="bg-primary text-white p-2 rounded-3 me-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-building"></i>
                    </div>
                    Campus <span className="text-muted ms-1 font-monospace fs-6 fw-normal">LMS</span>
                </a>

                <button className="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-1">
                        {menuItems.map((item) => {
                            const isActive = activeHash === item.path;
                            return (
                                <li className="nav-item" key={item.path}>
                                    <a
                                        href={`#${item.path}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleScroll(item.path);
                                        }}
                                        className={`nav-link px-3 rounded-pill d-flex align-items-center transition-all ${isActive ? 'bg-primary text-white shadow-sm' : 'text-muted hover-bg-light'}`}
                                    >
                                        <i className={`bi ${item.icon} me-2 ${isActive ? 'text-white' : 'text-primary'}`}></i>
                                        <span className="fw-500">{item.label}</span>
                                    </a>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="d-flex align-items-center gap-3">
                        <div className="dropdown">
                            <a href="#" className="d-flex align-items-center link-dark text-decoration-none dropdown-toggle glass-card p-1 pe-3 rounded-pill" id="dropdownUser1" data-bs-toggle="dropdown">
                                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80" alt="admin" width="36" height="36" className="rounded-circle me-2 object-fit-cover" />
                                <div className="d-none d-sm-block">
                                    <p className="mb-0 small fw-bold text-dark">Super Admin</p>
                                    <p className="mb-0 smaller text-muted" style={{ fontSize: '10px' }}>Online</p>
                                </div>
                            </a>
                            <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2 p-2">
                                <li><a className="dropdown-item rounded-2" href="#"><i className="bi bi-person me-2"></i>My Profile</a></li>
                                <li><a className="dropdown-item rounded-2" href="#"><i className="bi bi-gear me-2"></i>Settings</a></li>
                                <li><hr className="dropdown-divider mx-2" /></li>
                                <li><a className="dropdown-item rounded-2 text-danger" href="#"><i className="bi bi-box-arrow-right me-2"></i>Log Out</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .nav-link.hover-bg-light:hover {
                    background: rgba(0,0,0,0.04);
                    color: var(--primary) !important;
                }
                .transition-all {
                    transition: all 0.2s ease-in-out;
                }
                .fw-500 {
                    font-weight: 500;
                }
                .smaller {
                    font-size: 0.75rem;
                }
            `}</style>
        </nav>
    );
};

export default Navbar;
