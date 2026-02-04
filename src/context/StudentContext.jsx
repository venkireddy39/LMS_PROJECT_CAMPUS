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
            // Fetch student details AND parent details in parallel
            const [studentsData, parentsData] = await Promise.all([
                campusService.getAllStudents(),
                campusService.getAllParents().catch(err => {
                    console.error("Failed to fetch parents:", err);
                    return []; // Return empty array if parents fetch fails
                })
            ]);

            console.log("DEBUG: Raw API Student Data:", studentsData);
            console.log("DEBUG: Raw API Parent Data:", parentsData);

            let validStudents = [];
            if (Array.isArray(studentsData)) {
                validStudents = studentsData;
            } else if (studentsData && Array.isArray(studentsData.data)) {
                validStudents = studentsData.data;
            } else if (studentsData && Array.isArray(studentsData.students)) {
                validStudents = studentsData.students;
            }

            // Create a lookup map for Parent Details based on Relation ID (relId)
            // Structure expected from /getparents: [{ parent: { students: [{ relId: ... }] }, ... }, ...]
            const relIdParentMap = new Map();

            if (Array.isArray(parentsData)) {
                parentsData.forEach(item => {
                    // Check if item IS the parent object (direct structure) or if it's wrapped in 'parent' key
                    const parentData = item.user ? item : (item.parent || null);

                    if (parentData && parentData.user) {
                        const parentInfo = {
                            name: `${parentData.user.firstName || ''} ${parentData.user.lastName || ''}`.trim(),
                            phone: parentData.user.phone || '',
                            email: parentData.user.email || ''
                        };

                        // Map each relationship ID associated with this parent to the parent info
                        if (Array.isArray(parentData.students)) {
                            parentData.students.forEach(rel => {
                                if (rel.relId) {
                                    relIdParentMap.set(rel.relId, parentInfo);
                                }
                            });
                        }
                    }
                });
            }

            console.log("DEBUG: RelID Map Size:", relIdParentMap.size);

            if (validStudents.length > 0) {
                const mappedStudents = validStudents.map(s => {

                    // Find parent by checking the student's 'parents' array for a matching relId
                    let parent = { name: '', phone: '', email: '' };
                    if (Array.isArray(s.parents)) {
                        for (const pRel of s.parents) {
                            if (pRel.relId && relIdParentMap.has(pRel.relId)) {
                                parent = relIdParentMap.get(pRel.relId);
                                break; // Found a matching parent, stop searching
                            }
                        }
                    }

                    const allocationObj = s.allocation || {};
                    const allocationId = s.allocationId || allocationObj.id || allocationObj.allocationId || null;
                    const dbId = s.studentId || s.userId || s.id;
                    const isAllocation = !!allocationId;

                    return {
                        ...s,
                        id: allocationId || dbId, // Prefer allocationId for table actions if available
                        allocationId: allocationId,
                        studentId: dbId,
                        isAllocation: isAllocation,

                        firstname: s.user?.firstName || s.firstName || '',
                        lastname: s.user?.lastName || s.lastName || '',
                        email: s.user?.email || s.email || '',

                        // Parent Details from the merged map
                        fatherName: parent.name || (s.fatherName || ''),
                        fatherPhone: parent.phone || (s.fatherPhone || ''),

                        studentName: (s.user?.firstName || s.firstName) ? `${s.user?.firstName || s.firstName} ${s.user?.lastName || s.lastName || ''}`.trim() : (s.user?.name || s.name || 'Unknown'),
                        studentEmail: s.user?.email || s.email,
                        hostel: s.hostel || null,
                        room: s.room || null,
                        roomNumber: s.room?.roomNumber || s.roomNumber || '',
                        status: s.status || 'ACTIVE',
                    };
                });

                console.log("DEBUG: Mapped Students with Parents (via relId):", mappedStudents);
                setStudents(mappedStudents);
            } else {
                console.warn('Expected array for students but got:', studentsData);
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
        return students.filter(student =>
            (student.stayStatus && student.stayStatus.toUpperCase() === 'ACTIVE') ||
            (student.status && student.status.toUpperCase() === 'ACTIVE')
        );
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
