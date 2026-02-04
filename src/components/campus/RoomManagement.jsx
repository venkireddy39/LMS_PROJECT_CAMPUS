import React, { useEffect } from 'react';
import DataTable from '../common/DataTable';
import campusService from '../../services/campusService';
import { useStudentContext } from '../../context/StudentContext';
import { FaEdit } from 'react-icons/fa';

const RoomManagement = () => {
    const { students } = useStudentContext();
    const [rooms, setRooms] = React.useState([]);

    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = async () => {
        try {
            const data = await campusService.getAllRooms();
            const roomsData = Array.isArray(data) ? data : (data.data || []);

            // Map data to ensure occupied and vacant fields exist
            const processedRooms = roomsData.map(room => {
                const capacity = room.capacity || room.sharingType || 0;
                // Check if backend provides occupied count, otherwise default to 0
                // Use 'currentOccupancy' as potential fallback key
                const occupied = room.occupied !== undefined ? room.occupied : (room.currentOccupancy || 0);
                // Calculate vacant if not provided
                const vacant = room.vacant !== undefined ? room.vacant : Math.max(0, capacity - occupied);

                return {
                    ...room,
                    occupied,
                    vacant,
                    // Ensure status is display-ready if needed
                    status: room.status || (occupied >= capacity ? 'Full' : 'Available')
                };
            });

            setRooms(processedRooms);
        } catch (error) {
            console.error("Failed to load rooms", error);
        }
    };

    // Synchronize room occupancy with context students
    // Note: If backend handles occupancy, this might be redundant, but keeping for frontend sync if needed
    const syncRoomsWithStudents = React.useCallback((currentRooms) => {
        return currentRooms.map(room => {
            // If backend already provides occupancy, we might trust it. 
            // However, if we want real-time sync with local student context changes:
            const occupiedCount = students.filter(s =>
                s.roomNumber === room.roomNumber && s.stayStatus === 'Active'
            ).length;

            // If backend data is sufficient, we can skip this calculation
            // For now, assuming backend 'occupied' might need client-side adjustment if student context is fresher
            // But let's rely on backend data primarily if possible. 
            // If the logic was purely frontend before, we should check if backend returns 'occupied' count.
            // campusService.getAllRooms() should return similar structure.

            return {
                ...room,
                // occupied: occupiedCount, // Commenting out override to trust backend first
                // vacant: room.capacity - occupiedCount,
                // status: occupiedCount >= room.capacity ? 'Full' : (occupiedCount === 0 ? 'Available' : 'Partially Filled')
            };
        });
    }, [students]);

    // Use backend data directly for now to ensure we test API integration
    const displayRooms = rooms; // React.useMemo(() => syncRoomsWithStudents(rooms), [rooms, syncRoomsWithStudents]);


    const [filterStatus, setFilterStatus] = React.useState('All');
    const [filterSharing, setFilterSharing] = React.useState('All');
    const [sortBy, setSortBy] = React.useState('roomNumber');
    const [sortOrder, setSortOrder] = React.useState('asc');

    // Filter and Sort Logic
    const filteredAndSortedRooms = React.useMemo(() => {
        let result = [...displayRooms];

        // Apply Filters
        if (filterStatus !== 'All') {
            result = result.filter(room => room.status === filterStatus);
        }
        if (filterSharing !== 'All') {
            result = result.filter(room => room.sharingType && room.sharingType.toString() === filterSharing);
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
    }, [displayRooms, filterStatus, filterSharing, sortBy, sortOrder]);

    const [showModal, setShowModal] = React.useState(false);
    const [newRoom, setNewRoom] = React.useState({
        roomNumber: '',
        sharingType: '',
        occupied: 0,
        status: 'AVAILABLE'
    });
    const [isEditing, setIsEditing] = React.useState(false);
    const [editId, setEditId] = React.useState(null);

    const resetForm = () => {
        setNewRoom({ roomNumber: '', sharingType: '', occupied: 0, status: 'AVAILABLE' });
        setIsEditing(false);
        setEditId(null);
    };

    const handleEdit = (room) => {
        const sharingMap = { 'SINGLE': 1, 'DOUBLE': 2, 'TRIPLE': 3, 'QUAD': 4 };
        const sharingTypeVal = sharingMap[room.sharingType] || room.sharingType;

        setIsEditing(true);
        // Ensure we capture the correct ID, falling back to roomId if id is missing
        setEditId(room.roomId || room.id);
        setNewRoom({
            roomNumber: room.roomNumber,
            sharingType: sharingTypeVal,
            occupied: room.occupied,
            status: room.status
        });
        setShowModal(true);
    };

    const handleAddRoomChange = (e) => {
        const { name, value } = e.target;
        setNewRoom({ ...newRoom, [name]: value });
    };

    const handleAddRoomSubmit = async (e) => {
        e.preventDefault();
        const occupied = parseInt(newRoom.occupied);
        const sharingTypeInt = parseInt(newRoom.sharingType);
        const capacity = sharingTypeInt; // Auto-infer capacity from sharing type

        const vacant = capacity - occupied;

        // Map numeric value to Backend Enum String
        const sharingTypeMap = {
            1: 'SINGLE',
            2: 'DOUBLE',
            3: 'TRIPLE',
            4: 'QUAD'
        };
        const sharingType = sharingTypeMap[sharingTypeInt] || 'SINGLE';

        const roomData = {
            ...newRoom,
            sharingType,
            capacity,
            occupied,
            vacant,
            status: newRoom.status
        };

        try {
            if (isEditing) {
                await campusService.updateRoom(editId, roomData);
            } else {
                await campusService.createRoom(roomData);
            }
            loadRooms();
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error("Failed to save room", error);
            alert("Failed to save room");
        }
    };

    const columns = [
        { header: 'Room No.', accessor: 'roomNumber' },
        {
            header: 'Sharing Type',
            accessor: 'sharingType',
            render: (row) => <span className="fw-500">{row.sharingType} Sharing</span>
        },
        // Removed Capacity Column
        {
            header: 'Occupied',
            accessor: 'occupied',
            render: (row) => (
                <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold text-primary">{row.occupied}</span>
                </div>
            )
        },
        // { header: 'Vacant', accessor: 'vacant' },
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
        {
            header: 'Actions',
            accessor: 'actions',
            render: (row) => (
                <button
                    className="btn btn-sm btn-warning"
                    onClick={() => handleEdit(row)}
                    title="Edit Room"
                >
                    <FaEdit />
                </button>
            )
        },
    ];

    return (
        <div className="container-fluid py-4 animate-in">
            <header className="mb-4 d-flex justify-content-between align-items-center">
                <div>
                    <h3 className="fw-bold text-main mb-1">Room & Vacancy Management</h3>
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
                            {/* Removed Capacity Sort Option */}
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
                        <div className="modal-content glass-card border-0 shadow-2xl p-0" style={{ overflow: 'hidden' }}>
                            <div className="p-4 border-bottom border-light d-flex justify-content-between align-items-center bg-primary bg-opacity-10">
                                <h5 className="modal-title fw-bold text-main mb-0">
                                    <i className={`${isEditing ? 'bi-pencil-square' : 'bi-house-add-fill'} text-primary me-2`}></i>
                                    {isEditing ? 'Update Room Details' : 'Provision New Room'}
                                </h5>
                                <button type="button" className="btn-close shadow-none" onClick={() => { setShowModal(false); resetForm(); }}></button>
                            </div>
                            <div className="p-4">
                                <form onSubmit={handleAddRoomSubmit}>
                                    <div className="mb-4">
                                        <label className="form-label fw-600 smaller text-uppercase text-muted">Room Number</label>
                                        <input type="text" className="form-control" name="roomNumber" value={newRoom.roomNumber} onChange={handleAddRoomChange} placeholder="e.g. 204-B" required />
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label fw-600 smaller text-uppercase text-muted">Sharing Type</label>
                                        <select className="form-select" name="sharingType" value={newRoom.sharingType} onChange={handleAddRoomChange} required>
                                            <option value="">Select...</option>
                                            <option value="1">Single</option>
                                            <option value="2">Double</option>
                                            <option value="3">Triple</option>
                                            <option value="4">Quad</option>
                                        </select>
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label fw-600 smaller text-uppercase text-muted">Currently Occupied</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="occupied"
                                            value={newRoom.occupied}
                                            onChange={handleAddRoomChange}
                                            required
                                            min="0"
                                            max={newRoom.sharingType || 10}
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label fw-600 smaller text-uppercase text-muted">Status</label>
                                        <select className="form-select" name="status" value={newRoom.status} onChange={handleAddRoomChange} required>
                                            <option value="AVAILABLE">Available</option>
                                            <option value="PARTIALLY_FILLED">Partially Filled</option>
                                            <option value="FULL">Full</option>
                                        </select>
                                    </div>
                                    <div className="mt-5 d-flex gap-2 justify-content-end">
                                        <button type="button" className="btn btn-light px-4 rounded-pill fw-500" onClick={() => { setShowModal(false); resetForm(); }}>Discard</button>
                                        <button type="submit" className="btn-premium btn-premium-primary rounded-pill px-5">{isEditing ? 'Update Room' : 'Register Room'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .fw-600 { font-weight: 600; }
                .fw-500 { font-weight: 500; }
                .smaller { font-size: 0.7rem; }
                .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
            `}</style>
        </div>
    );
};

export default RoomManagement;
