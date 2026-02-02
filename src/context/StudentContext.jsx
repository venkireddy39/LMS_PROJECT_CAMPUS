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
            // Fetch student details from the student service
            const data = await campusService.getAllStudents();
            console.log("DEBUG: Raw API Student Data:", data); // Debug log

            let validData = [];
            if (Array.isArray(data)) {
                validData = data;
            } else if (data && Array.isArray(data.data)) {
                // Handle wrapped response like { data: [...] }
                validData = data.data;
            } else if (data && Array.isArray(data.students)) {
                // Handle wrapped response like { students: [...] }
                validData = data.students;
            }

            if (validData.length > 0) {
                // Map the student data to the format used by the UI
                const mappedStudents = validData.map(s => ({
                    ...s,
                    // Prioritize allocationId if it exists, as this is likely the primary key for the allocation record
                    id: s.allocationId || s.studentId || s.userId || s.id,
                    studentId: s.studentId, // Keep original studentId accessible
                    // Access nested user object if present
                    firstname: s.user?.firstName || s.firstName || '',
                    lastname: s.user?.lastName || s.lastName || '',
                    email: s.user?.email || s.email || '',
                    // Extract father details from parents array if available
                    fatherPhone: Array.isArray(s.parents) ? s.parents.find(p => p.relation === 'Father')?.phone : (s.father_phone || s.fatherPhone || ''),
                    fatherName: Array.isArray(s.parents) ? s.parents.find(p => p.relation === 'Father')?.parentName : (s.father_name || s.fatherName || ''),
                    // Fallbacks for older references
                    studentName: (s.user?.firstName || s.firstName) || (s.user?.name || s.name) || 'Unknown',
                    studentEmail: s.user?.email || s.email,
                }));
                console.log("DEBUG: Mapped Students:", mappedStudents);
                setStudents(mappedStudents);
            } else {
                console.warn('Expected array for students but got:', data);
                setStudents([]);
            }
        } catch (error) {
            console.error("Failed to load students", error);
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
        // Assuming backend returns an 'status' field in allocation
        return students.filter(student => student.stayStatus === 'Active' || student.status === 'Active');
    };

    return (
        <StudentContext.Provider value={{
            students,
            loading,
            addStudent,
            updateStudent,
            deleteStudent,
            getActiveStudents,
            refreshStudents: loadStudents
        }}>
            {children}
        </StudentContext.Provider>
    );
};
