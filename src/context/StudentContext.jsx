import React, { createContext, useContext, useState } from 'react';
import { studentData as initialStudentData } from '../data/studentData';

const StudentContext = createContext();

export const useStudentContext = () => {
    const context = useContext(StudentContext);
    if (!context) {
        throw new Error('useStudentContext must be used within StudentProvider');
    }
    return context;
};

export const StudentProvider = ({ children }) => {
    const [students, setStudents] = useState(initialStudentData);

    const addStudent = (student) => {
        const newStudent = {
            id: students.length + 1,
            ...student
        };
        setStudents([...students, newStudent]);
        return newStudent;
    };

    const updateStudent = (id, updates) => {
        setStudents(prevStudents =>
            prevStudents.map(student =>
                student.id === id ? { ...student, ...updates } : student
            )
        );
    };

    const deleteStudent = (id) => {
        setStudents(prevStudents => prevStudents.filter(student => student.id !== id));
    };

    const getActiveStudents = () => {
        return students.filter(student => student.stayStatus === 'Active');
    };

    return (
        <StudentContext.Provider value={{
            students,
            addStudent,
            updateStudent,
            deleteStudent,
            getActiveStudents
        }}>
            {children}
        </StudentContext.Provider>
    );
};
