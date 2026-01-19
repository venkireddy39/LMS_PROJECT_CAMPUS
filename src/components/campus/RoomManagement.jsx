import React from 'react';
import DataTable from '../common/DataTable';
import { roomData } from '../../data/hostelData';

const RoomManagement = () => {
    const [rooms, setRooms] = React.useState(roomData);

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
            render: (row) => `${row.sharingType} Sharing`
        },
        { header: 'Capacity', accessor: 'capacity' },
        {
            header: 'Occupied',
            accessor: 'occupied',
            render: (row) => (
                <input
                    type="number"
                    min="0"
                    max={row.capacity}
                    className="form-control form-control-sm"
                    style={{ width: '80px' }}
                    value={row.occupied}
                    onChange={(e) => handleOccupiedChange(row.roomNumber, e.target.value)}
                />
            )
        },
        { header: 'Vacant', accessor: 'vacant' },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => {
                let badgeClass = 'bg-secondary';
                if (row.status === 'Full') badgeClass = 'bg-danger';
                else if (row.status === 'Available') badgeClass = 'bg-success';
                else if (row.status === 'Partially Filled') badgeClass = 'bg-warning text-dark';

                return <span className={`badge ${badgeClass}`}>{row.status}</span>;
            }
        },
    ];

    return (
        <div className="container-fluid position-relative">
            <h3 className="mb-4 fw-bold">Room & Vacancy Management</h3>
            <DataTable
                title="All Rooms"
                columns={columns}
                data={rooms}
                actions={
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <i className="bi bi-plus-lg me-2"></i> Add Room
                    </button>
                }
            />

            {/* Add Room Modal */}
            {showModal && (
                <>
                    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title fw-bold">Add New Room</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <form onSubmit={handleAddRoomSubmit}>
                                        <div className="mb-3">
                                            <label className="form-label">Room Number</label>
                                            <input type="text" className="form-control" name="roomNumber" value={newRoom.roomNumber} onChange={handleAddRoomChange} required />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Sharing Type (e.g., 1, 2, 3)</label>
                                            <input type="number" className="form-control" name="sharingType" value={newRoom.sharingType} onChange={handleAddRoomChange} required />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Capacity</label>
                                            <input type="number" className="form-control" name="capacity" value={newRoom.capacity} onChange={handleAddRoomChange} required />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Occupied Beds</label>
                                            <input type="number" className="form-control" name="occupied" value={newRoom.occupied} onChange={handleAddRoomChange} required min="0" max={newRoom.capacity} />
                                            <div className="form-text">Vacant beds and Status will be calculated automatically.</div>
                                        </div>
                                        <div className="text-end">
                                            <button type="button" className="btn btn-secondary me-2" onClick={() => setShowModal(false)}>Cancel</button>
                                            <button type="submit" className="btn btn-primary">Save Room</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default RoomManagement;
