import React from 'react';
import StatsCard from '../common/StatsCard';
import { hostelStats } from '../../data/hostelData';

const Dashboard = () => {
    return (
        <div className="container-fluid">
            <h3 className="mb-4 fw-bold">Dashboard Overview</h3>

            <div className="row g-4">
                <div className="col-md-6 col-lg-4">
                    <StatsCard
                        title="Total Capacity"
                        value={hostelStats.totalCapacity}
                        icon="bi-building"
                        color="primary"
                        subtext="Total Beds"
                    />
                </div>
                <div className="col-md-6 col-lg-4">
                    <StatsCard
                        title="Total Rooms"
                        value={hostelStats.totalRooms}
                        icon="bi-door-closed"
                        color="success"
                    />
                </div>
                <div className="col-md-6 col-lg-4">
                    <StatsCard
                        title="Occupied Beds"
                        value={hostelStats.occupiedBeds}
                        icon="bi-person-check"
                        color="info"
                        subtext={`${((hostelStats.occupiedBeds / hostelStats.totalCapacity) * 100).toFixed(1)}% Occupancy`}
                    />
                </div>
                <div className="col-md-6 col-lg-4">
                    <StatsCard
                        title="Vacant Beds"
                        value={hostelStats.vacantBeds}
                        icon="bi-person-dash"
                        color="warning"
                    />
                </div>
                <div className="col-md-6 col-lg-8">
                    <div className="card h-100 shadow-sm border-0">
                        <div className="card-body">
                            <h5 className="card-title text-uppercase opacity-75 mb-3">Room Sharing Breakdown</h5>
                            <div className="row text-center">
                                <div className="col-3">
                                    <h3 className="fw-bold">{hostelStats.sharingBreakdown.single}</h3>
                                    <p className="text-muted small">Single</p>
                                </div>
                                <div className="col-3">
                                    <h3 className="fw-bold">{hostelStats.sharingBreakdown.double}</h3>
                                    <p className="text-muted small">Double</p>
                                </div>
                                <div className="col-3">
                                    <h3 className="fw-bold">{hostelStats.sharingBreakdown.triple}</h3>
                                    <p className="text-muted small">Triple</p>
                                </div>
                                <div className="col-3">
                                    <h3 className="fw-bold">{hostelStats.sharingBreakdown.quad}</h3>
                                    <p className="text-muted small">Quad</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
