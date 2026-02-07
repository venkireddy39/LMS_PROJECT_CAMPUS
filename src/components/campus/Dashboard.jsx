import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import campusService from '../../services/campusService';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalCapacity: 0,
        activeRooms: 0,
        occupiedBeds: 0,
        vacantBeds: 0,
        sharingBreakdown: { single: 0, double: 0, triple: 0, quad: 0 },
        occupancyRate: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Rooms and Active Allocations
                const [roomsRes, allocationsRes] = await Promise.all([
                    campusService.getAllRooms(),
                    campusService.getAllAllocations()
                ]);

                const rooms = Array.isArray(roomsRes) ? roomsRes : (roomsRes.data || []);
                const allocations = Array.isArray(allocationsRes) ? allocationsRes : (allocationsRes.data || []);

                // 1. Calculate Room Stats
                let totalCapacity = 0;
                let activeRooms = 0;
                let single = 0, double = 0, triple = 0, quad = 0;

                rooms.forEach(room => {
                    if (room.isDeleted) return; // Skip deleted rooms

                    activeRooms++;

                    // Normalize Capacity and Type
                    let cap = parseInt(room.capacity);
                    // If capacity is missing/invalid, infer from sharingType
                    if (isNaN(cap) || cap <= 0) {
                        const typeStr = (room.sharingType || '').toUpperCase();
                        if (typeStr.includes('SINGLE')) cap = 1;
                        else if (typeStr.includes('DOUBLE')) cap = 2;
                        else if (typeStr.includes('TRIPLE')) cap = 3;
                        else if (typeStr.includes('QUAD')) cap = 4;
                        else cap = 1; // Default
                    }

                    totalCapacity += cap;

                    // Breakdown by capacity/type
                    // We categorize based on the actual capacity number
                    if (cap === 1) single += cap;
                    else if (cap === 2) double += cap;
                    else if (cap === 3) triple += cap;
                    else if (cap >= 4) quad += cap;
                });

                // 2. Calculate Occupancy (Active Students)
                // Filter for ACTIVE status only
                const activeAllocations = allocations.filter(a =>
                    (a.status === 'ACTIVE' || a.status === 'active') &&
                    !a.isDeleted // Assuming logical delete exists or just status
                );
                const occupiedBeds = activeAllocations.length;

                // 3. Derived Stats
                const vacantBeds = Math.max(0, totalCapacity - occupiedBeds);
                const occupancyRate = totalCapacity > 0 ? ((occupiedBeds / totalCapacity) * 100).toFixed(1) : 0;

                setStats({
                    totalCapacity,
                    activeRooms,
                    occupiedBeds,
                    vacantBeds,
                    sharingBreakdown: { single, double, triple, quad },
                    occupancyRate
                });

            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Chart Data Config
    const sharingData = [
        { name: 'Single', count: stats.sharingBreakdown.single },
        { name: 'Double', count: stats.sharingBreakdown.double },
        { name: 'Triple', count: stats.sharingBreakdown.triple },
        { name: 'Quad', count: stats.sharingBreakdown.quad },
    ];

    const occupancyData = [
        { name: 'Occupied', value: stats.occupiedBeds },
        { name: 'Vacant', value: stats.vacantBeds },
    ];

    const COLORS = ['#4361ee', '#e2e8f0']; // Blue for Occupied, Light Slate for Vacant

    // Custom Tooltip for Recharts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-card p-3 border-0 shadow-sm text-dark">
                    <p className="mb-0 fw-bold small">{label}</p>
                    <p className="mb-0 small text-primary">{`${payload[0].value} Beds`}</p>
                </div>
            );
        }
        return null;
    };

    // Export Dashboard Data to CSV
    const handleExport = () => {
        if (!stats) return;

        const csvContent = [
            ["Campus Insights Report", `Generated on ${new Date().toLocaleDateString()}`],
            [],
            ["Metric", "Value"],
            ["Total Capacity", stats.totalCapacity],
            ["Active Rooms", stats.activeRooms],
            ["Occupied Beds", stats.occupiedBeds],
            ["Vacant Beds", stats.vacantBeds],
            ["Occupancy Rate", `${stats.occupancyRate}%`],
            [],
            ["Room Distribution (Beds)", "Count"],
            ["Single Sharing", stats.sharingBreakdown.single],
            ["Double Sharing", stats.sharingBreakdown.double],
            ["Triple Sharing", stats.sharingBreakdown.triple],
            ["Quad Sharing", stats.sharingBreakdown.quad]
        ]
            .map(e => e.join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `campus_insights_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container-fluid pb-5 animate-in">
            <header className="mb-5">
                <h2 className="fw-bold text-main mb-1">Campus Insights</h2>
                <p className="text-muted">Real-time overview of your hostel's performance and occupancy.</p>
            </header>

            {/* Quick Stats Row */}
            <div className="row g-4 mb-5">
                {[
                    {
                        title: "Total Capacity",
                        value: stats.totalCapacity,
                        icon: "bi-building-fill",
                        color: "primary",
                        change: "+2%", // Hardcoded trend for now (requires historical data)
                        sub: "Total Beds"
                    },
                    {
                        title: "Active Rooms",
                        value: stats.activeRooms,
                        icon: "bi-door-open-fill",
                        color: "info",
                        change: "+0%",
                        sub: "Fully Managed"
                    },
                    {
                        title: "Occupancy",
                        value: `${stats.occupancyRate}%`,
                        icon: "bi-pie-chart-fill",
                        color: "success",
                        change: "+6%",
                        sub: `${stats.occupiedBeds} Beds Filled`
                    },
                    {
                        title: "Vacant Units",
                        value: stats.vacantBeds,
                        icon: "bi-grid-fill",
                        color: "warning",
                        change: "+6%",
                        sub: "Ready to Move"
                    }
                ].map((stat, i) => (
                    <div className="col-md-6 col-lg-3" key={i}>
                        <div className="glass-card p-4 h-100 border-0 position-relative overflow-hidden">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div className={`bg-${stat.color} bg-opacity-10 p-3 rounded-4`}>
                                    <i className={`bi ${stat.icon} fs-4 text-${stat.color}`}></i>
                                </div>
                                <span className={`badge bg-${stat.color} bg-opacity-10 text-${stat.color} rounded-pill border border-${stat.color} border-opacity-25`}>
                                    {stat.change}
                                </span>
                            </div>
                            <h3 className="fw-bold mb-1 text-main">{stat.value}</h3>
                            <p className="text-muted small mb-0 fw-600 uppercase tracking-wider opacity-75">{stat.title}</p>
                            <div className="mt-3 pt-3 border-top border-light opacity-75">
                                <small className="text-muted">{stat.sub}</small>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="row g-4">
                {/* Bar Chart: Room Distribution */}
                <div className="col-lg-8">
                    <div className="glass-card p-4 h-100 border-0">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h5 className="fw-bold mb-1 text-main">Room Distribution</h5>
                                <p className="text-muted smaller mb-0">Beds available per sharing category</p>
                            </div>
                            <button className="btn btn-sm btn-light border rounded-pill px-3" onClick={handleExport}>
                                <i className="bi bi-download me-1"></i> Export
                            </button>
                        </div>
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sharingData}>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#4361ee" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#4361ee" stopOpacity={0.2} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                                    <Bar
                                        dataKey="count"
                                        fill="url(#barGradient)"
                                        radius={[8, 8, 0, 0]}
                                        barSize={50}
                                        name="Capacity"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Pie Chart: Occupancy Analytics */}
                <div className="col-lg-4">
                    <div className="glass-card p-4 h-100 border-0 d-flex flex-column">
                        <h5 className="fw-bold mb-1 text-main">Occupancy Analytics</h5>
                        <p className="text-muted smaller mb-4">Current bed availability status</p>

                        <div className="flex-grow-1 position-relative d-flex align-items-center justify-content-center">
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={occupancyData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            startAngle={90}
                                            endAngle={-270}
                                        >
                                            {occupancyData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Center Text Overlay */}
                            <div className="position-absolute top-50 start-50 translate-middle text-center">
                                <h2 className="fw-bold text-main mb-0">{stats.occupancyRate}%</h2>
                                <small className="text-muted fw-bold smaller uppercase">UTILIZATION</small>
                            </div>
                        </div>

                        {/* Custom Legend */}
                        <div className="mt-3 d-flex justify-content-center gap-4">
                            <div className="d-flex align-items-center gap-2">
                                <div className="rounded-circle" style={{ width: 10, height: 10, backgroundColor: COLORS[0] }}></div>
                                <span className="small fw-600 text-muted">Occupied</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <div className="rounded-circle" style={{ width: 10, height: 10, backgroundColor: COLORS[1] }}></div>
                                <span className="small fw-600 text-muted">Vacant</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .tracking-wider { letter-spacing: 0.05em; }
                .uppercase { text-transform: uppercase; }
                .fw-600 { font-weight: 600; }
                .fw-500 { font-weight: 500; }
                .smaller { font-size: 0.75rem; }
            `}</style>
        </div>
    );
};

export default Dashboard;
