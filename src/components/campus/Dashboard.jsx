import React, { useEffect, useState } from 'react';
import StatsCard from '../common/StatsCard';
import campusService from '../../services/campusService';
import { useStudentContext } from '../../context/StudentContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const Dashboard = () => {
    // Note: Dashboard stats ideally should come from a dedicated API endpoint 
    // to avoid fetching all data. For now, we will fetch lists to calculate.

    const [stats, setStats] = useState({
        totalCapacity: 0,
        totalRooms: 0,
        sharingBreakdown: { single: 0, double: 0, triple: 0, quad: 0 }
    });

    const { students } = useStudentContext(); // This might also need to be replaced with API call if students are in DB
    // Assuming student context is still valid or needs migration. 
    // For now, let's mix: real room data + context students (or maybe students need an API too?)
    // The previous code used context for students. 

    // Let's assume we fetch allocations effectively or rely on what we have.
    // Ideally we should create a getDashboardStats() endpoint later.

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch Rooms to calculate capacity and breakdown
                const rooms = await campusService.getAllRooms();

                let totalCapacity = 0;
                let single = 0, double = 0, triple = 0, quad = 0;

                if (rooms && Array.isArray(rooms)) {
                    rooms.forEach(room => {
                        // Handle sharingType being a string or number
                        let sharingRef = room.sharingType;
                        let cap = 0;

                        // Parse sharing type to capacity number
                        if (typeof sharingRef === 'string') {
                            sharingRef = sharingRef.toUpperCase();
                            if (sharingRef.includes('SINGLE')) cap = 1;
                            else if (sharingRef.includes('DOUBLE')) cap = 2;
                            else if (sharingRef.includes('TRIPLE')) cap = 3;
                            else if (sharingRef.includes('QUAD')) cap = 4;
                            else cap = 1; // Default
                        } else {
                            cap = parseInt(sharingRef) || 1;
                        }

                        // Use explicit capacity if valid number, else derived cap
                        const finalCap = (room.capacity && !isNaN(room.capacity)) ? parseInt(room.capacity) : cap;

                        totalCapacity += finalCap;

                        // Categorize for breakdown
                        if (cap === 1) single += finalCap;
                        else if (cap === 2) double += finalCap;
                        else if (cap === 3) triple += finalCap;
                        else if (cap >= 4) quad += finalCap;
                    });

                    setStats({
                        totalCapacity,
                        totalRooms: rooms.length,
                        sharingBreakdown: { single, double, triple, quad }
                    });
                }

            } catch (error) {
                console.error("Error fetching dashboard data", error);
            }
        };

        fetchStats();
    }, []);

    const occupiedBeds = students.filter(s => s.stayStatus === 'Active').length;
    const vacantBeds = stats.totalCapacity - occupiedBeds;

    // Data for Bar Chart
    const sharingData = [
        { name: 'Single', count: stats.sharingBreakdown.single },
        { name: 'Double', count: stats.sharingBreakdown.double },
        { name: 'Triple', count: stats.sharingBreakdown.triple },
        { name: 'Quad', count: stats.sharingBreakdown.quad },
    ];

    // Data for Pie Chart
    const occupancyData = [
        { name: 'Occupied', value: occupiedBeds },
        { name: 'Vacant', value: vacantBeds > 0 ? vacantBeds : 0 },
    ];

    const COLORS = ['#4361ee', '#ff9f1c']; // Premium Blue and Vibrant Orange

    return (
        <div className="container-fluid pb-5 animate-in">
            <header className="mb-5">
                <h2 className="fw-bold text-main mb-1">Campus Insights</h2>
                <p className="text-muted">Real-time overview of your hostel's performance and occupancy.</p>
            </header>

            <div className="row g-4 mb-5">
                {/* Stats Cards Row */}
                {[
                    { title: "Total Capacity", value: stats.totalCapacity, icon: "bi-building", color: "primary", sub: "Total Beds" },
                    { title: "Active Rooms", value: stats.totalRooms, icon: "bi-house-heart", color: "success", sub: "Fully Managed" },
                    { title: "Occupancy", value: stats.totalCapacity > 0 ? `${((occupiedBeds / stats.totalCapacity) * 100).toFixed(1)}%` : "0%", icon: "bi-graph-up-arrow", color: "info", sub: `${occupiedBeds} Beds Filled` },
                    { title: "Vacant Units", value: vacantBeds > 0 ? vacantBeds : 0, icon: "bi-door-open", color: "warning", sub: "Ready to Move" }
                ].map((stat, i) => (
                    <div className="col-md-6 col-lg-3" key={i}>
                        <div className="glass-card p-4 h-100 border-0">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div className={`bg-${stat.color} bg-opacity-10 p-3 rounded-4`}>
                                    <i className={`bi ${stat.icon} fs-4 text-${stat.color}`}></i>
                                </div>
                                <span className="badge glass-card border rounded-pill smaller">+{Math.floor(Math.random() * 10)}%</span>
                            </div>
                            <h4 className="fw-bold mb-1 text-main">{stat.value}</h4>
                            <p className="text-muted small mb-0 fw-500 uppercase tracking-wider">{stat.title}</p>
                            <p className="smaller text-muted mt-2">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                {/* Bar Chart Section */}
                <div className="col-lg-8">
                    <div className="glass-card p-4 h-100 border-0">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h5 className="fw-bold mb-1 text-main">Room Distribution</h5>
                                <p className="text-muted smaller">Beds available per sharing category</p>
                            </div>
                            <button className="btn glass-card btn-sm rounded-pill px-3 border">View Detailed Report</button>
                        </div>
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <BarChart data={sharingData}>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#4361ee" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#4361ee" stopOpacity={0.3} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" opacity={0.5} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        cursor={{ fill: 'rgba(67, 97, 238, 0.05)' }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="url(#barGradient)"
                                        radius={[10, 10, 0, 0]}
                                        barSize={60}
                                        name="Beds"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Pie Chart Section */}
                <div className="col-lg-4">
                    <div className="glass-card p-4 h-100 border-0 d-flex flex-column">
                        <h5 className="fw-bold mb-1 text-main">Occupancy Analytics</h5>
                        <p className="text-muted smaller mb-4">Current bed availability status</p>
                        <div style={{ width: '100%', height: 300 }} className="my-auto">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <PieChart>
                                    <Pie
                                        data={occupancyData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={8}
                                        dataKey="value"
                                        animationBegin={0}
                                        animationDuration={1500}
                                    >
                                        {occupancyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 p-3 bg-primary bg-opacity-5 rounded-4 text-center">
                            <p className="mb-0 text-muted smaller fw-500">UTILIZATION RATE</p>
                            <h3 className="fw-bold text-primary mb-0">{stats.totalCapacity > 0 ? ((occupiedBeds / stats.totalCapacity) * 100).toFixed(0) : 0}%</h3>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .tracking-wider { letter-spacing: 0.05em; }
                .uppercase { text-transform: uppercase; }
                .fw-500 { font-weight: 500; }
            `}</style>
        </div>
    );
};

export default Dashboard;
