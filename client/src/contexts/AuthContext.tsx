import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'SUPERADMIN' | 'ADMIN' | 'TRAINER' | 'RECEPTION';
    gymId?: number | null;
    gym?: {
        id: number;
        name: string;
        slug: string;
        logoUrl?: string;
    } | null;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const cached = localStorage.getItem('user');
        return cached ? JSON.parse(cached) : null;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await api.get('/auth/me');
                    setUser(response.data);
                    localStorage.setItem('user', JSON.stringify(response.data));
                } catch (err: any) {
                    // Only log out if the token is definitively invalid
                    const status = err?.response?.status;
                    if (status === 401) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setUser(null);
                    }
                    // For 403/404/network errors, keep the cached user
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = (token: string, user: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
