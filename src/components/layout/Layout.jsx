import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';

const Layout = ({ children }) => {
    return (
        <div className="d-flex">
            <Sidebar />
            <div className="flex-grow-1 d-flex flex-column" style={{ height: '100vh', overflowY: 'auto' }}>
                <Navbar />
                <main className="p-4 bg-light flex-grow-1">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
