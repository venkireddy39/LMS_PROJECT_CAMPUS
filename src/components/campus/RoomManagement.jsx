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

    const [filterStatus, setFilterStatus] = React.useState('All');
    const [filterSharing, setFilterSharing] = React.useState('All');
    const [searchQuery, setSearchQuery] = React.useState(''); // Added Search State
    const [sortBy, setSortBy] = React.useState('roomNumber');
    const [sortOrder, setSortOrder] = React.useState('asc');

    // Filter and Sort Logic
    const filteredAndSortedRooms = React.useMemo(() => {
        if (!rooms) return [];
        let result = [...rooms];

        // Apply Search (Room Number)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(room =>
                String(room.roomNumber).toLowerCase().includes(query)
            );
        }

        // Apply Status Filter
        if (filterStatus !== 'All') {
            result = result.filter(room => room.status === filterStatus);
        }

        // Apply Sharing Filter
        if (filterSharing !== 'All') {
            // Compare normalized numeric sharing value
            result = result.filter(room => room.normalizedSharing === parseInt(filterSharing));
        }

        // Apply Sorting
        result.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];

            // Handle numeric sorting for room number if possible
            if (sortBy === 'roomNumber') {
                // Extract number part from room string (e.g. "101-A" -> 101)
                const numA = parseInt(String(valA).match(/\d+/)?.[0] || 0);
                const numB = parseInt(String(valB).match(/\d+/)?.[0] || 0);
                if (numA !== numB) {
                    valA = numA;
                    valB = numB;
                } else {
                    // Check fallback string comparison for suffixes
                    valA = valA.toString();
                    valB = valB.toString();
                }
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [rooms, filterStatus, filterSharing, sortBy, sortOrder, searchQuery]);

    const loadRooms = async () => {
        try {
            const data = await campusService.getAllRooms();
            const roomsData = Array.isArray(data) ? data : (data.data || []);

            // Map data to ensure occupied and vacant fields exist and normalize for filtering
            const processedRooms = roomsData.map(room => {
                // Normalize Sharing Type -> Number
                let sharingInt = 0;
                const sType = String(room.sharingType || '').toUpperCase();
                if (sType.includes('SINGLE') || sType === '1') sharingInt = 1;
                else if (sType.includes('DOUBLE') || sType === '2') sharingInt = 2;
                else if (sType.includes('TRIPLE') || sType === '3') sharingInt = 3;
                else if (sType.includes('QUAD') || sType === '4') sharingInt = 4;
                else sharingInt = parseInt(room.capacity) || 1;

                const capacity = sharingInt;

                // Check if backend provides occupied count
                const occupied = room.occupied !== undefined ? parseInt(room.occupied) : (parseInt(room.currentOccupancy) || 0);
                const vacant = capacity - occupied;

                // Normalize Status
                let normStatus = 'AVAILABLE';
                if (occupied >= capacity) normStatus = 'FULL';
                else if (occupied > 0) normStatus = 'PARTIALLY_FILLED';

                // Allow backend override if it sends one of our standard keys
                if (room.status) {
                    const backendStatus = room.status.toUpperCase();
                    if (['FULL', 'AVAILABLE', 'PARTIALLY_FILLED'].includes(backendStatus)) {
                        normStatus = backendStatus;
                    }
                }

                return {
                    ...room,
                    occupied,
                    vacant,
                    normalizedSharing: sharingInt, // Helper for filter
                    sharingType: room.sharingType || (sharingInt === 1 ? 'SINGLE' : sharingInt === 2 ? 'DOUBLE' : sharingInt === 3 ? 'TRIPLE' : 'QUAD'), // Ensure display string
                    status: normStatus
                };
            });

            setRooms(processedRooms);
        } catch (error) {
            console.error("Failed to load rooms", error);
        }
    };

    // ... (Sync logic removed/hidden as per previous view) ...

    // ... (Modal Logic remains mostly same, just ensure we use standard status values) ...
    // Note: Skipping modal logic changes in this block for brevity, focusing on Filter/Table props

    // ...

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

    // Update DataTable actions to include Search Input
    const tableActions = (
        <div className="d-flex gap-2 flex-wrap justify-content-end align-items-center">
            {/* Search Input */}
            <div className="position-relative">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                <input
                    type="text"
                    className="form-control form-control-sm rounded-pill ps-5 shadow-sm border-0"
                    placeholder="Search Room No..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '180px' }}
                />
            </div>

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
                <option value="AVAILABLE">Available</option>
                <option value="FULL">Full</option>
                <option value="PARTIALLY_FILLED">Partially Filled</option>
            </select>
            <select
                className="form-select form-select-sm rounded-pill px-3 shadow-sm"
                style={{ width: '140px' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
            >
                <option value="roomNumber">Sort: Room No.</option>
                <option value="sharingType">Sort: Sharing</option>
                <option value="occupied">Sort: Occupied</option>
                <option value="status">Sort: Status</option>
            </select>
            <button className="btn-premium btn-premium-primary" onClick={() => setShowModal(true)}>
                <i className="bi bi-plus-lg"></i> Add Room
            </button>
        </div>
    );

    const columns = [
        { header: 'Room No.', accessor: 'roomNumber' },
        {
            header: 'Sharing Type',
            accessor: 'sharingType',
            render: (row) => <span className="fw-500">{row.sharingType}</span>
        },
        {
            header: 'Occupied',
            accessor: 'occupied',
            render: (row) => (
                <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold text-primary">{row.occupied}</span>
                </div>
            )
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => {
                let badgeClass = 'bg-secondary bg-opacity-10 text-secondary';
                if (row.status === 'FULL') badgeClass = 'bg-danger bg-opacity-10 text-danger';
                else if (row.status === 'AVAILABLE') badgeClass = 'bg-success bg-opacity-10 text-success';
                else if (row.status === 'PARTIALLY_FILLED') badgeClass = 'bg-warning bg-opacity-10 text-warning-emphasis';

                return <span className={`badge rounded-pill px-3 py-2 fw-bold ${badgeClass}`}>{row.status.replace('_', ' ')}</span>;
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
                actions={tableActions}
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
