import React, { useEffect } from 'react';
import Dashboard from './Dashboard';
import RoomManagement from './RoomManagement';
import StudentDetails from './StudentDetails';
import FeeManagement from './FeeManagement';
import Complaints from './Complaints';
import Attendance from './Attendance';
import HealthIssues from './HealthIssues';
import ParentVisits from './ParentVisits';
import MessManagement from './MessManagement';
import HostelManagement from './HostelManagement';

const CampusHome = () => {
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px', // Trigger when section is in middle of screen
            threshold: 0
        };

        const observerCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    window.history.replaceState(null, null, `#${id}`);
                    // Trigger a custom event or just let the hash change handle it if using hash routing
                    // In this case, we'll manually dispatch a hashchange if needed or just rely on state in Navbar
                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        const sections = document.querySelectorAll('section[id]');
        sections.forEach(section => observer.observe(section));

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        // Initial scroll if hash exists
        if (window.location.hash) {
            const id = window.location.hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }, []);

    return (
        <div className="campus-single-page">
            <section id="dashboard" className="section-padding">
                <Dashboard />
            </section>

            <section id="hostels" className="section-padding border-top">
                <HostelManagement />
            </section>

            <section id="rooms" className="section-padding border-top">
                <RoomManagement />
            </section>

            <section id="students" className="section-padding border-top">
                <StudentDetails />
            </section>

            <section id="fees" className="section-padding border-top">
                <FeeManagement />
            </section>


            <section id="complaints" className="section-padding border-top">
                <Complaints />
            </section>

            <section id="attendance" className="section-padding border-top">
                <Attendance />
            </section>

            <section id="health" className="section-padding border-top">
                <HealthIssues />
            </section>

            <section id="parent-visits" className="section-padding border-top">
                <ParentVisits />
            </section>

            <section id="mess" className="section-padding border-top">
                <MessManagement />
            </section>


        </div>
    );
};

export default CampusHome;
