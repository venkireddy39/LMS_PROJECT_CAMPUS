import React from 'react';
import DataTable from '../common/DataTable';
import { roomData } from '../../data/hostelData';

const RoomManagement = () => {
    const [rooms, setRooms] = React.useState(roomData);

    const [filterStatus, setFilterStatus] = React.useState('All');
    const [filterSharing, setFilterSharing] = React.useState('All');
    const [sortBy, setSortBy] = React.useState('roomNumber');
    const [sortOrder, setSortOrder] = React.useState('asc');

    // Filter and Sort Logic
    const filteredAndSortedRooms = React.useMemo(() => {
        let result = [...rooms];

        // Apply Filters
        if (filterStatus !== 'All') {
            result = result.filter(room => room.status === filterStatus);
        }
        if (filterSharing !== 'All') {
            result = result.filter(room => room.sharingType.toString() === filterSharing);
        }

        // Apply Sorting
        result.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];

            // Handle numeric sorting for room number if possible
            if (sortBy === 'roomNumber') {
                const numA = parseInt(valA);
                const numB = parseInt(valB);
                if (!isNaN(numA) && !isNaN(numB)) {
                    valA = numA;
                    valB = numB;
                }
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [rooms, filterStatus, filterSharing, sortBy, sortOrder]);

    const handleOccupiedChange = (roomNumber, newOccupied) => {
        const val = parseInt(newOccupied);
        if (isNaN(val) || val < 0) return; // Basic validation

        setRooms(prevRooms => prevRooms.map(room => {
            if (room.roomNumber === roomNumber) {
                if (val > room.capacity) return room; // Prevent exceeding capacity

                const newVacant = room.capacity - val;
                let newStatus = 'Partially Filled';
                if (val === 0) newStatus = 'Available';
                if (val === room.capacity) newStatus = 'Full';

                return {
                    ...room,
                    occupied: val,
                    vacant: newVacant,
                    status: newStatus
                };
            }
            return room;
        }));
    };

    const [showModal, setShowModal] = React.useState(false);
    const [newRoom, setNewRoom] = React.useState({
        roomNumber: '',
        sharingType: '',
        capacity: '',
        occupied: 0
    });

    const handleAddRoomChange = (e) => {
        const { name, value } = e.target;
        setNewRoom({ ...newRoom, [name]: value });
    };

    const handleAddRoomSubmit = (e) => {
        e.preventDefault();
        const capacity = parseInt(newRoom.capacity);
        const occupied = parseInt(newRoom.occupied);
        const sharingType = parseInt(newRoom.sharingType);

        const vacant = capacity - occupied;
        let status = 'Partially Filled';
        if (occupied === 0) status = 'Available';
        if (occupied === capacity) status = 'Full';

        const roomToAdd = {
            ...newRoom,
            sharingType,
            capacity,
            occupied,
            vacant,
            status
        };

        setRooms([...rooms, roomToAdd]);
        setShowModal(false);
        setNewRoom({ roomNumber: '', sharingType: '', capacity: '', occupied: 0 });
    };

    const columns = [
        { header: 'Room No.', accessor: 'roomNumber' },
        {
            header: 'Sharing Type',
            accessor: 'sharingType',
            render: (row) => <span className="fw-500">{row.sharingType} Sharing</span>
        },
        { header: 'Capacity', accessor: 'capacity' },
        {
            header: 'Occupied',
            accessor: 'occupied',
            render: (row) => (
                <div className="d-flex align-items-center gap-2">
                    <input
                        type="number"
                        min="0"
                        max={row.capacity}
                        className="form-control form-control-sm rounded-pill px-3 py-1 shadow-sm border-light"
                        style={{ width: '85px', fontSize: '0.9rem' }}
                        value={row.occupied}
                        onChange={(e) => handleOccupiedChange(row.roomNumber, e.target.value)}
                    />
                </div>
            )
        },
        { header: 'Vacant', accessor: 'vacant' },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => {
                let badgeClass = 'bg-secondary bg-opacity-10 text-secondary';
                if (row.status === 'Full') badgeClass = 'bg-danger bg-opacity-10 text-danger';
                else if (row.status === 'Available') badgeClass = 'bg-success bg-opacity-10 text-success';
                else if (row.status === 'Partially Filled') badgeClass = 'bg-warning bg-opacity-10 text-warning-emphasis';

                return <span className={`badge rounded-pill px-3 py-2 fw-bold ${badgeClass}`}>{row.status}</span>;
            }
        },
    ];

    return (
        <div className="container-fluid py-4 animate-in">
            <header className="mb-4 d-flex justify-content-between align-items-center">
                <div>
                    <h3 className="fw-bold text-dark mb-1">Room & Vacancy Management</h3>
                    <p className="text-muted small">Real-time room occupancy tracking and accommodation management.</p>
                </div>
            </header>

            <DataTable
                title="Hostel Inventory"
                columns={columns}
                data={filteredAndSortedRooms}
                actions={
                    <div className="d-flex gap-2 flex-wrap justify-content-end">
                        <select
                            className="form-select form-select-sm rounded-pill px-3 shadow-sm"
                            style={{ width: '140px' }}
                            value={filterSharing}
                            onChange={(e) => setFilterSharing(e.target.value)}
                        >
                            <option value="All">All Sharing</option>
                            <option value="1">Single</option>
                            <option value="2">Double</option>
                            <option value="3">Triple</option>
                            <option value="4">Quad</option>
                        </select>
                        <select
                            className="form-select form-select-sm rounded-pill px-3 shadow-sm"
                            style={{ width: '140px' }}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="All">All Status</option>
                            <option value="Available">Available</option>
                            <option value="Full">Full</option>
                            <option value="Partially Filled">Partially Filled</option>
                        </select>
                        <select
                            className="form-select form-select-sm rounded-pill px-3 shadow-sm"
                            style={{ width: '140px' }}
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="roomNumber">Room No.</option>
                            <option value="sharingType">Sharing</option>
                            <option value="capacity">Capacity</option>
                            <option value="occupied">Occupied</option>
                            <option value="status">Status</option>
                        </select>
                        <button className="btn-premium btn-premium-primary" onClick={() => setShowModal(true)}>
                            <i className="bi bi-plus-lg"></i> Add Room
                        </button>
                    </div>
                }
            />

            {/* Add Room Modal */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content glass-card border-0 shadow-2xl p-0" style={{ background: 'white', overflow: 'hidden' }}>
                            <div className="p-4 border-bottom border-light d-flex justify-content-between align-items-center bg-light bg-opacity-50">
                                <h5 className="modal-title fw-bold text-dark mb-0">
                                    <i className="bi bi-house-add-fill text-primary me-2"></i>Provision New Room
                                </h5>
                                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="p-4">
                                <form onSubmit={handleAddRoomSubmit}>
                                    <div className="mb-4">
                                        <label className="form-label fw-600 smaller text-uppercase text-muted">Room Number</label>
                                        <input type="text" className="form-control" name="roomNumber" value={newRoom.roomNumber} onChange={handleAddRoomChange} placeholder="e.g. 204-B" required />
                                    </div>
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Sharing Type</label>
                                            <select className="form-select" name="sharingType" value={newRoom.sharingType} onChange={handleAddRoomChange} required>
                                                <option value="">Select...</option>
                                                <option value="1">Single</option>
                                                <option value="2">Double</option>
                                                <option value="3">Triple</option>
                                                <option value="4">Quad</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Bed Capacity</label>
                                            <input type="number" className="form-control" name="capacity" value={newRoom.capacity} onChange={handleAddRoomChange} placeholder="Total Beds" required />
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label fw-600 smaller text-uppercase text-muted">Currently Occupied</label>
                                        <input type="number" className="form-control" name="occupied" value={newRoom.occupied} onChange={handleAddRoomChange} required min="0" max={newRoom.capacity} />
                                        <div className="form-text smaller text-muted pt-2 border-top mt-2">
                                            <i className="bi bi-info-circle me-1"></i> System will auto-calculate vacancy status.
                                        </div>
                                    </div>
                                    <div className="mt-5 d-flex gap-2 justify-content-end">
                                        <button type="button" className="btn btn-light px-4 rounded-pill fw-500" onClick={() => setShowModal(false)}>Discard</button>
                                        <button type="submit" className="btn-premium btn-premium-primary rounded-pill px-5">Register Room</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .fw-600 { font-weight: 600; }
                .fw-500 { font-weight: 500; }
                .smaller { font-size: 0.7rem; }
                .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
            `}</style>
        </div>
    );
};

export default RoomManagement;
