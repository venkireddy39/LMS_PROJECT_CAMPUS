// Config handled in vite.config.js via proxy and .env
// Config handled in vite.config.js via proxy and .env
const BASE_URL = `/campus`;

/**
 * Generic request handler for API calls
 * @param {string} endpoint - The endpoint path (e.g., '/hostels')
 * @param {object} options - Fetch options (method, headers, body)
 * @returns {Promise<any>} - The response data
 */
const request = async (endpoint, options = {}) => {
    // Allow overriding base URL for different services (e.g. /student)
    const { baseUrl = BASE_URL, ...fetchOptions } = options;
    const url = `${baseUrl}${endpoint}`;
    const token = localStorage.getItem('token') || import.meta.env.VITE_JWT_TOKEN;
    if (endpoint === '/students' || endpoint === '/login' || endpoint === '/getstudents') {
        console.log(`[Request] ${endpoint} Token: ${token ? 'Present (' + token.substring(0, 10) + '...)' : 'Missing'}`);
    }
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
    };

    // ONLY add token if NOT logging in
    if (token && endpoint !== '/login') {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...fetchOptions,
        headers: {
            ...defaultHeaders,
            ...fetchOptions.headers,
        },
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            console.error(`Status ${response.status} from ${endpoint}.`);
            if (response.status === 401) {
                console.error(`[401 Unauthorized] Request to ${url} failed.`);
                console.warn("Session expired. Redirecting to login...");

                // Clear storage
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                // Redirect if not already on login page
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                    // Return a pending promise to halt execution chain
                    return new Promise(() => { });
                }
            }
            const errorText = await response.text();
            throw new Error(errorText || `HTTP Error: ${response.status} from ${endpoint}`);
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }
        return await response.text();
    } catch (error) {
        console.error(`API Call Error [${endpoint}]:`, error);
        throw error;
    }
};

export const campusService = {
    // ================= HOSTEL =================

    createHostel: (hostelData) => request('/hostel', {
        method: 'POST',
        body: JSON.stringify(hostelData)
    }),

    getAllHostels: () => request('/hostels', { method: 'GET' }),

    getHostelById: (id) => request(`/hostels/${id}`, { method: 'GET' }),

    updateHostel: (id, hostelData) => request(`/hostel/${id}`, {
        method: 'PUT',
        body: JSON.stringify(hostelData)
    }),

    updateHostelPartial: (id, hostelData) => request(`/hostel/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(hostelData)
    }),

    deleteHostel: (id) => request(`/hostel/${id}`, { method: 'DELETE' }),

    // ================= HOSTEL ROOM =================

    createRoom: (roomData) => request('/room', {
        method: 'POST',
        body: JSON.stringify(roomData)
    }),

    getAllRooms: () => request('/rooms', { method: 'GET' }),

    getRoomById: (id) => request(`/rooms/${id}`, { method: 'GET' }),

    updateRoom: (id, roomData) => request(`/rooms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(roomData)
    }),

    updateRoomPartial: (id, roomData) => request(`/rooms/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(roomData)
    }),

    updateRoomStatus: (id, status) => request(`/rooms/${id}/status?status=${status}`, {
        method: 'PATCH'
    }),

    deleteRoom: (id) => request(`/rooms/${id}`, { method: 'DELETE' }),

    // ================= HOSTEL ATTENDANCE =================

    markAttendance: (attendanceData) => request('/attendance', {
        method: 'POST',
        body: JSON.stringify(attendanceData)
    }),

    getAllAttendance: (date = null) => {
        const query = date ? `?date=${date}` : '';
        return request(`/attendances${query}`, { method: 'GET' });
    },

    getAttendanceById: (id) => request(`/attendance/${id}`, { method: 'GET' }),

    updateAttendance: (id, attendanceData) => request(`/attendance/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(attendanceData)
    }),

    deleteAttendance: (id) => request(`/attendance/${id}`, { method: 'DELETE' }),

    // ================= HOSTEL COMPLAINTS =================

    createComplaint: (complaintData) => request('/complaint', { // Maps to POST /complaint (root of controller) for complaints per backend code
        method: 'POST',
        body: JSON.stringify(complaintData)
    }),

    getAllComplaints: (status = null) => {
        const query = status ? `?status=${status}` : '';
        return request(`/complaints${query}`, { method: 'GET' });
    },

    getComplaintById: (id) => request(`/complaint/${id}`, { method: 'GET' }),

    updateComplaintFull: (id, complaintData) => request(`/complaint/${id}`, {
        method: 'PUT',
        body: JSON.stringify(complaintData)
    }),

    updateComplaint: (id, status = null, adminRemarks = null) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (adminRemarks) params.append('adminRemarks', adminRemarks);
        return request(`/complaint/${id}?${params.toString()}`, { method: 'PATCH' });
    },

    deleteComplaint: (id) => request(`/complaint/${id}`, { method: 'DELETE' }),

    // ================= MESS MENU =================

    createMenu: (menuData) => request('/mess-menu', {
        method: 'POST',
        body: JSON.stringify(menuData)
    }),

    getAllMenus: () => request('/mess-menus', { method: 'GET' }),

    getMenuById: (id) => request(`/mess-menus/${id}`, { method: 'GET' }),

    updateMenuFull: (id, menuData) => request(`/mess-menu/${id}`, {
        method: 'PUT',
        body: JSON.stringify(menuData)
    }),

    updateMenu: (id, menuData) => request(`/mess-menu/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(menuData)
    }),

    deleteMenu: (id) => request(`/mess-menu/${id}`, { method: 'DELETE' }),

    // ================= STUDENT HEALTH INCIDENTS =================

    createIncident: (incidentData) => request('/health', {
        method: 'POST',
        body: JSON.stringify(incidentData)
    }),

    getAllIncidents: () => request('/health', { method: 'GET' }),

    getIncidentById: (id) => request(`/health/${id}`, { method: 'GET' }),

    updateIncidentFull: (id, incidentData) => request(`/health/${id}`, {
        method: 'PUT',
        body: JSON.stringify(incidentData)
    }),

    updateIncident: (id, status = null, clinicalNotes = null) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (clinicalNotes) params.append('clinicalNotes', clinicalNotes);
        return request(`/health/${id}?${params.toString()}`, { method: 'PATCH' });
    },

    deleteIncident: (id) => request(`/health/${id}`, { method: 'DELETE' }),

    // ================= STUDENT HOSTEL ALLOCATION =================

    createAllocation: (allocationData) => request('/allocations', {
        method: 'POST',
        body: JSON.stringify(allocationData)
    }),

    getAllAllocations: (status = null) => {
        const query = status ? `?status=${status}` : '';
        return request(`/allocations${query}`, { method: 'GET' });
    },

    getAllocationById: (id) => request(`/allocations/${id}`, { method: 'GET' }),

    updateAllocation: (id, allocationData) => request(`/allocations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(allocationData)
    }),

    updateAllocationStatus: (id, status, leaveDate = null) => {
        const params = new URLSearchParams();
        params.append('status', status);
        if (leaveDate) params.append('leaveDate', leaveDate);
        return request(`/allocations/${id}/status?${params.toString()}`, { method: 'PATCH' });
    },

    deleteAllocation: (id) => request(`/allocations/${id}`, { method: 'DELETE' }),

    // ================= HOSTEL FEES =================

    createFee: (feeData) => request('/fees', {
        method: 'POST',
        body: JSON.stringify(feeData)
    }),

    getAllFees: (status = null) => {
        const query = status ? `?status=${status}` : '';
        return request(`/fees${query}`, { method: 'GET' });
    },

    getFeeById: (id) => request(`/fees/${id}`, { method: 'GET' }),

    // Matches PATCH /fees/{id}/payment?amount=...
    updateFeePayment: (id, amount) => {
        return request(`/fees/${id}/payment?amount=${amount}`, { method: 'PATCH' });
    },

    // Matches PUT /fees/{id}
    updateFee: (id, feeData) => request(`/fees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(feeData)
    }),

    deleteFee: (id) => request(`/fees/${id}`, { method: 'DELETE' }),

    // ================= STUDENT VISIT ENTRY =================

    createVisit: (visitData) => request('/visits', {
        method: 'POST',
        body: JSON.stringify(visitData)
    }),

    getAllVisits: (date = null) => {
        const query = date ? `?date=${date}` : '';
        return request(`/visits${query}`, { method: 'GET' });
    },

    getVisitById: (id) => request(`/visits/${id}`, { method: 'GET' }),

    updateVisit: (id, visitData) => request(`/visits/${id}`, {
        method: 'PUT',
        body: JSON.stringify(visitData)
    }),

    updateVisitStatus: (id, status) => request(`/visits/${id}/status?status=${status}`, {
        method: 'PATCH'
    }),

    deleteVisit: (id) => request(`/visits/${id}`, { method: 'DELETE' }),

    // ================= STUDENT DETAILS (VIA /admin) =================
    getAllStudents: () => request('/getstudents', {
        method: 'GET',
        baseUrl: '/admin'
    }),

    getAllParents: () => request('/getparents', {
        method: 'GET',
        baseUrl: '/admin'
    }),

    // ================= AUTHENTICATION =================
    login: async (credentials) => {
        console.log("Attempting login with:", { email: credentials.email, passwordLength: credentials.password.length });

        try {
            const response = await request('/login', {
                method: 'POST',
                baseUrl: '/auth',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password
                })
            });
            return response;
        } catch (error) {
            console.error("Login Request Failed:", error);
            throw error;
        }
    },
};

export default campusService;
