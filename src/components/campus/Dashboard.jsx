import React from 'react';
import StatsCard from '../common/StatsCard';
import { hostelStats } from '../../data/hostelData';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const Dashboard = () => {
    // Data for Bar Chart
    const sharingData = [
        { name: 'Single', count: hostelStats.sharingBreakdown.single },
        { name: 'Double', count: hostelStats.sharingBreakdown.double },
        { name: 'Triple', count: hostelStats.sharingBreakdown.triple },
        { name: 'Quad', count: hostelStats.sharingBreakdown.quad },
    ];

    // Data for Pie Chart
    const occupancyData = [
        { name: 'Occupied', value: hostelStats.occupiedBeds },
        { name: 'Vacant', value: hostelStats.vacantBeds },
    ];

    const COLORS = ['#4361ee', '#ff9f1c']; // Premium Blue and Vibrant Orange

    return (
        <div className="container-fluid pb-5 animate-in">
            <header className="mb-5">
                <h2 className="fw-bold text-dark mb-1">Campus Insights</h2>
                <p className="text-muted">Real-time overview of your hostel's performance and occupancy.</p>
            </header>

            <div className="row g-4 mb-5">
                {/* Stats Cards Row */}
                {[
                    { title: "Total Capacity", value: hostelStats.totalCapacity, icon: "bi-building", color: "primary", sub: "Total Beds" },
                    { title: "Active Rooms", value: hostelStats.totalRooms, icon: "bi-house-heart", color: "success", sub: "Fully Managed" },
                    { title: "Occupancy", value: `${((hostelStats.occupiedBeds / hostelStats.totalCapacity) * 100).toFixed(1)}%`, icon: "bi-graph-up-arrow", color: "info", sub: `${hostelStats.occupiedBeds} Beds Filled` },
                    { title: "Vacant Units", value: hostelStats.vacantBeds, icon: "bi-door-open", color: "warning", sub: "Ready to Move" }
                ].map((stat, i) => (
                    <div className="col-md-6 col-lg-3" key={i}>
                        <div className="glass-card p-4 h-100 border-0">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div className={`bg-${stat.color} bg-opacity-10 p-3 rounded-4`}>
                                    <i className={`bi ${stat.icon} fs-4 text-${stat.color}`}></i>
                                </div>
                                <span className="badge bg-light text-dark border rounded-pill">+{Math.floor(Math.random() * 10)}%</span>
                            </div>
                            <h4 className="fw-bold mb-1">{stat.value}</h4>
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
                                <h5 className="fw-bold mb-1">Room Distribution</h5>
                                <p className="text-muted smaller">Beds available per sharing category</p>
                            </div>
                            <button className="btn btn-light btn-sm rounded-pill px-3">View Detailed Report</button>
                        </div>
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer>
                                <BarChart data={sharingData}>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#4361ee" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#4361ee" stopOpacity={0.3} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        cursor={{ fill: 'rgba(67, 97, 238, 0.05)' }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="url(#barGradient)"
                                        radius={[10, 10, 0, 0]}
                                        barSize={60}
                                        name="Rooms"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Pie Chart Section */}
                <div className="col-lg-4">
                    <div className="glass-card p-4 h-100 border-0 d-flex flex-column">
                        <h5 className="fw-bold mb-1">Occupancy Analytics</h5>
                        <p className="text-muted smaller mb-4">Current bed availability status</p>
                        <div style={{ width: '100%', height: 300 }} className="my-auto">
                            <ResponsiveContainer>
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
                        <div className="mt-4 p-3 bg-light bg-opacity-50 rounded-4 text-center">
                            <p className="mb-0 text-muted smaller fw-500">UTILIZATION RATE</p>
                            <h3 className="fw-bold text-primary mb-0">{((hostelStats.occupiedBeds / hostelStats.totalCapacity) * 100).toFixed(0)}%</h3>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .tracking-wider { letter-spacing: 0.05em; }
                .uppercase { text-transform: uppercase; }
                .fw-500 { font-weight: 500; }
            `}</style>
        </div>
    );
};

export default Dashboard;
