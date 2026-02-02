import React, { useState, useMemo, useEffect } from 'react';
import DataTable from '../common/DataTable';
import campusService from '../../services/campusService';

const HostelManagement = () => {
    const [hostelList, setHostelList] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Hostels
    useEffect(() => {
        loadHostels();
    }, []);

    const loadHostels = async () => {
        try {
            const data = await campusService.getAllHostels();
            setHostelList(data || []);
        } catch (error) {
            console.error("Failed to load hostels", error);
        }
    };

    // Form State
    const [newHostel, setNewHostel] = useState({
        hostelName: '',
        hostelType: 'MEN',
        totalBlocks: 0,
        totalRooms: 0,
        wardenName: '',
        contactNumber: '',
        status: 'ACTIVE'
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewHostel({ ...newHostel, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await campusService.createHostel(newHostel);
            loadHostels(); // Refresh list
            setShowModal(false);
            setNewHostel({
                hostelName: '',
                hostelType: 'MEN',
                totalBlocks: 0,
                totalRooms: 0,
                wardenName: '',
                contactNumber: '',
                status: 'ACTIVE'
            });
        } catch (error) {
            console.error("Failed to create hostel", error);
            alert("Failed to create hostel");
        }
    };

    const filteredHostels = useMemo(() => {
        return hostelList.filter(hostel =>
            hostel.hostelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            hostel.wardenName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [hostelList, searchTerm]);

    const columns = [
        { header: 'Hostel Name', accessor: 'hostelName', render: (row) => <span className="fw-bold text-main">{row.hostelName}</span> },
        {
            header: 'Type',
            accessor: 'hostelType',
            render: (row) => {
                let badgeClass = 'bg-secondary';
                if (row.hostelType === 'Men') badgeClass = 'bg-info bg-opacity-10 text-info';
                if (row.hostelType === 'Women') badgeClass = 'bg-danger bg-opacity-10 text-danger';
                if (row.hostelType === 'Co-living') badgeClass = 'bg-warning bg-opacity-10 text-warning';
                return <span className={`badge rounded-pill px-3 py-2 ${badgeClass}`}>{row.hostelType}</span>
            }
        },
        { header: 'Blocks', accessor: 'totalBlocks' },
        { header: 'Rooms', accessor: 'totalRooms' },
        { header: 'Warden', accessor: 'wardenName' },
        { header: 'Contact', accessor: 'contactNumber' },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => (
                <span className={`badge rounded-pill px-3 py-2 ${row.status === 'ACTIVE' ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'}`}>
                    {row.status}
                </span>
            )
        }
    ];

    return (
        <div className="container-fluid py-4 animate-in">
            <header className="mb-4 d-flex justify-content-between align-items-center">
                <div>
                    <h3 className="fw-bold text-main mb-1">Hostel Management</h3>
                    <p className="text-muted small">Manage hostel buildings, wardens, and overall status.</p>
                </div>
            </header>

            <DataTable
                title="Hostels List"
                columns={columns}
                data={filteredHostels}
                actions={
                    <div className="d-flex gap-2">
                        <input
                            type="text"
                            className="form-control form-control-sm rounded-pill px-3 shadow-sm"
                            placeholder="Search Hostel..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '200px' }}
                        />
                        <button className="btn-premium btn-premium-primary" onClick={() => setShowModal(true)}>
                            <i className="bi bi-plus-lg"></i> Add Hostel
                        </button>
                    </div>
                }
            />

            {/* Add Hostel Modal */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content glass-card border-0 shadow-2xl p-0">
                            <div className="p-4 border-bottom border-light d-flex justify-content-between align-items-center bg-primary bg-opacity-10">
                                <h5 className="modal-title fw-bold text-main mb-0">
                                    <i className="bi bi-building-add text-primary me-2"></i>Add New Hostel
                                </h5>
                                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="p-4">
                                <form onSubmit={handleSubmit}>
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Hostel Name</label>
                                            <input type="text" className="form-control" name="hostelName" value={newHostel.hostelName} onChange={handleInputChange} required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Hostel Type</label>
                                            <select className="form-select" name="hostelType" value={newHostel.hostelType} onChange={handleInputChange}>
                                                <option value="MEN">Men</option>
                                                <option value="WOMEN">Women</option>
                                                <option value="CO_LIVING">Co-living</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Total Blocks</label>
                                            <input type="number" className="form-control" name="totalBlocks" value={newHostel.totalBlocks} onChange={handleInputChange} required />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Total Rooms</label>
                                            <input type="number" className="form-control" name="totalRooms" value={newHostel.totalRooms} onChange={handleInputChange} required />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Status</label>
                                            <select className="form-select" name="status" value={newHostel.status} onChange={handleInputChange}>
                                                <option value="ACTIVE">ACTIVE</option>
                                                <option value="INACTIVE">INACTIVE</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Warden Name</label>
                                            <input type="text" className="form-control" name="wardenName" value={newHostel.wardenName} onChange={handleInputChange} required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-600 smaller text-uppercase text-muted">Contact Number</label>
                                            <input type="text" className="form-control" name="contactNumber" value={newHostel.contactNumber} onChange={handleInputChange} required />
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-end gap-2">
                                        <button type="button" className="btn btn-light px-4 rounded-pill fw-500" onClick={() => setShowModal(false)}>Cancel</button>
                                        <button type="submit" className="btn-premium btn-premium-primary rounded-pill px-5">Save Hostel</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HostelManagement;
