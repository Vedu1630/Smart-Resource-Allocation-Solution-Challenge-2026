import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

const API_URL = `${API_BASE_URL}/api/auth`;

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing token in localStorage on mount
        const token = localStorage.getItem('impactMatch_token');
        if (token) {
            fetchCurrentUser(token);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchCurrentUser = async (token) => {
        try {
            const response = await fetch(`${API_URL}/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Token invalid');
            
            const data = await response.json();
            setCurrentUser(data.user);
        } catch (err) {
            console.error(err);
            logout(); // clear invalid token
        } finally {
            setLoading(false);
        }
    };

    const signup = async (email, password, name, role) => {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name, role })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create account');
        }

        // Auto-login immediately
        localStorage.setItem('impactMatch_token', data.token);
        setCurrentUser(data.user);
        return data.user;
    };

    const login = async (email, password) => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Invalid email or password');
        }

        localStorage.setItem('impactMatch_token', data.token);
        setCurrentUser(data.user);
        return data.user;
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('impactMatch_token');
    };

    const value = {
        currentUser,
        login,
        signup,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
