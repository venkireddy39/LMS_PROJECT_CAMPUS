import React from 'react';
import Navbar from './Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';

const Layout = ({ children }) => {
    return (
        <div className="min-vh-100 d-flex flex-column">
            <Navbar />
            <main className="container-fluid py-4 px-md-5 mt-5 pt-5">
                {children}
            </main>
        </div>
    );
};

export default Layout;
