import React, { createContext, useContext, useState, useEffect } from 'react';
import campusService from '../services/campusService';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing token on load
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const data = await campusService.login({ email, password });
            console.log("DEBUG LOGIN RESPONSE:", data);

            let token = null;
            let userObj = null;

            // Handle case where data is just the token string
            if (typeof data === 'string') {
                token = data;
                try {
                    // Simple JWT decode with safety checks
                    if (!token || !token.includes('.')) {
                        throw new Error('Invalid token format');
                    }
                    const parts = token.split('.');
                    if (parts.length < 2) {
                        throw new Error('Invalid JWT structure');
                    }
                    const base64Url = parts[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    const payload = JSON.parse(jsonPayload);

                    // Map backend roles to frontend structure
                    const role = payload.roles && payload.roles.includes('ROLE_ADMIN') ? 'ADMIN' : 'STUDENT';

                    userObj = {
                        email: payload.sub,
                        role: role,
                        name: payload.sub, // Use email as name if no name provided
                        id: payload.userId
                    };
                } catch (e) {
                    console.error("Failed to parse JWT", e);
                    // Fallback if parsing fails but we have a token
                    userObj = { email, role: 'ADMIN' };
                }
            } else if (data.token) {
                // Handle object response { token, user }
                token = data.token;
                userObj = data.user || { email, role: 'ADMIN' };
            }

            if (token) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(userObj));
                setUser(userObj);
                return userObj;
            }

            throw new Error('No token received');
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login'; // Force reload/redirect
    };

    const value = {
        user,
        login,
        logout,
        isAuthenticated: !!user,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
