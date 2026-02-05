import React, { createContext, useContext, useState } from 'react';
import campusService from '../services/campusService';
import { useAuth } from './AuthContext';

const StudentContext = createContext();

export const useStudentContext = () => {
    const context = useContext(StudentContext);
    if (!context) {
        throw new Error('useStudentContext must be used within StudentProvider');
    }
    return context;
};

export const StudentProvider = ({ children }) => {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        if (!authLoading && isAuthenticated) {
            loadStudents();
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [authLoading, isAuthenticated]);

    const loadStudents = async () => {
        try {
            // New Flow: Fetch ONLY from Allocation DB (DB2)
            // The backend now provides full resident details in this endpoint
            const response = await campusService.getAllAllocations();

            console.log("DEBUG: Fetched Resident Data (DB2):", response);

            let residents = [];
            if (Array.isArray(response)) {
                residents = response;
            } else if (response && Array.isArray(response.data)) {
                residents = response.data;
            }

            // Map backend fields to frontend expected structure if necessary
            // Assuming backend now returns studentName, fatherName etc. directly in the object
            const mappedResidents = residents.map(r => ({
                ...r,
                // Ensure ID consistency
                id: r.allocationId || r.id,
                studentId: r.studentId, // Keep reference to DB1 ID

                // Fields from DB2 Snapshot
                studentName: r.studentName || r.name || 'Unknown',
                studentEmail: r.studentEmail || '',
                fatherName: r.fatherName || '',
                fatherPhone: r.fatherPhone || '',

                // Allocation Details
                hostel: r.hostel || null,
                room: r.room || null,
                roomNumber: r.room?.roomNumber || r.roomNumber || '',
                status: r.status || 'ACTIVE'
            }));

            setStudents(mappedResidents);
        } catch (error) {
            console.error("Failed to load residents from DB2", error);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const addStudent = async (studentData) => {
        try {
            await campusService.createAllocation(studentData);
            loadStudents();
        } catch (error) {
            console.error("Failed to add student", error);
            throw error;
        }
    };

    const updateStudent = async (id, updates) => {
        try {
            console.log("DEBUG: Updating student allocation:", id, updates);
            // Use updateAllocation for editing existing records
            await campusService.updateAllocation(id, updates);

            // Small delay to allow backend propagation (consistency check)
            await new Promise(resolve => setTimeout(resolve, 500));

            loadStudents();
        } catch (error) {
            console.error("Failed to update student", error);
            alert("Failed to update student details.");
        }
    };

    const deleteStudent = async (id) => {
        try {
            await campusService.deleteAllocation(id);
            loadStudents();
        } catch (error) {
            console.error("Failed to delete student allocation", error);
            alert("Failed to delete student allocation.");
        }
    };

    const getActiveStudents = () => {
        // Return all loaded residents for now to ensure dropdown population
        // Filtering by 'ACTIVE' status can be creating issues if status is inconsistent
        return students;
    };

    const [selectedStudentFilter, setSelectedStudentFilter] = useState(null);

    return (
        <StudentContext.Provider value={{
            students,
            loading,
            addStudent,
            updateStudent,
            deleteStudent,
            getActiveStudents,
            refreshStudents: loadStudents,
            selectedStudentFilter,
            setSelectedStudentFilter
        }}>
            {children}
        </StudentContext.Provider>
    );
};
