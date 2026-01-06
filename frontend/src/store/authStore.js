import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/auth" : "/api/auth";

axios.defaults.withCredentials = true;

export const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    error: null,
    isLoading: false,
    isCheckingAuth: true,
    message: null,

    // Admin signup - DO NOT auto-authenticate
    signup: async (email, password, name, phone, address, locationCoords) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/signup`, { 
                email, 
                password, 
                name, 
                phone,
                address,
                location: locationCoords,
                role: "admin" 
            });
            
            // No auto login: backend sends verification code, keep user unauthenticated
            set({ 
                user: null, 
                isAuthenticated: false, 
                isLoading: false,
                message: "Verification code sent to email" 
            });
            
            return true;
        } catch (error) {
            set({ error: error.response.data.message || "Error signing up", isLoading: false });
            throw error;
        }
    },

    // Customer signup - with location coordinates
    customerSignup: async (email, password, name, phone, address, locationCoords) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/costumerSignup`, { 
                email, 
                password, 
                name, 
                phone,
                address,
                location: locationCoords, // ✅ ADD THIS - Send coordinates
                role: "customer"
            });
            
            if (response.data.success) {
                set({ 
                    message: "Verification code sent to email",
                    user: null,
                    isAuthenticated: false,
                    isLoading: false
                });
                return true;
            }
        } catch (error) {
            set({ 
                error: error.response?.data?.message || "Error signing up", 
                isLoading: false 
            });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    // Admin login - with role verification
    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            // Clear any existing session first
            localStorage.clear();
            sessionStorage.clear();
            
            const response = await axios.post(`${API_URL}/login`, { email, password });
            
            // Verify user role is admin
            if (response.data.user.role !== 'admin') {
                throw new Error('Access denied. Admin credentials required.');
            }
            
            // Store token in localStorage
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userRole', 'admin');
            }
            
            set({
                isAuthenticated: true,
                user: response.data.user,
                error: null,
                isLoading: false,
            });
        } catch (error) {
            set({ error: error.response?.data?.message || error.message || "Error logging in", isLoading: false });
            throw error;
        }
    },

    // Customer login - with role verification
    customerLogin: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            // Clear any existing session first
            localStorage.clear();
            sessionStorage.clear();
            
            const response = await axios.post(`${API_URL}/costumerLogin`, { email, password });
            
            // Verify user role is customer
            if (response.data.user.role !== 'customer') {
                throw new Error('Access denied. Customer credentials required.');
            }
            
            // Save token to localStorage
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userRole', 'customer');
            }
            
            set({
                isAuthenticated: true,
                user: response.data.user,
                error: null,
                isLoading: false,
            });
        } catch (error) {
            set({ error: error.response?.data?.message || error.message || "Error logging in", isLoading: false });
            throw error;
        }
    },

    // Driver signup
    driverSignup: async (email, password, name, phone, address, locationCoords) => {
        set({ isLoading: true, error: null });
        try {
            const res = await axios.post(`${API_URL}/driverSignup`, { 
                email, password, name, phone, address, location: locationCoords, role: "driver" 
            });
            if (res.data.success) {
                set({ 
                    message: "Verification code sent to email",
                    isLoading: false,
                    isAuthenticated: false,
                    user: null
                });
                return true;
            }
        } catch (e) {
            set({ error: e.response?.data?.message || "Error signing up", isLoading: false });
            throw e;
        }
    },
    driverLogin: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            // clear previous session
            localStorage.clear();
            sessionStorage.clear();

            const res = await axios.post(`${API_URL}/driverLogin`, { email, password });
            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('userRole', 'driver');
            }
            set({ isAuthenticated: true, user: res.data.user, isLoading: false });
        } catch (e) {
            set({ error: e.response?.data?.message || "Error logging in", isLoading: false });
            throw e;
        }
    },

    // Common logout for both admin and customer
    logout: async () => {
        set({ isLoading: true, error: null });
        try {
            await axios.post(`${API_URL}/logout`);
            
            // Clear ALL stored tokens and user data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            sessionStorage.clear();
            
            // Clear axios default headers if any
            delete axios.defaults.headers.common['Authorization'];
            
            // Reset all auth state
            set({ 
                user: null, 
                isAuthenticated: false, 
                error: null, 
                isLoading: false,
                isCheckingAuth: false,
                message: null
            });
            
            // Force page reload to clear any cached state
            window.location.href = '/';
            
        } catch (error) {
            // Even if logout fails on server, clear local state
            localStorage.clear();
            sessionStorage.clear();
            delete axios.defaults.headers.common['Authorization'];
            
            set({ 
                user: null, 
                isAuthenticated: false, 
                error: null, 
                isLoading: false,
                isCheckingAuth: false 
            });
            
            window.location.href = '/';
        }
    },
    
    checkAuth: async () => {
        set({ isCheckingAuth: true, error: null });
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                set({ error: null, isCheckingAuth: false, isAuthenticated: false });
                return;
            }
            
            // Set authorization header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            const response = await axios.get(`${API_URL}/check-auth`);
            
            // Verify the stored role matches the response
            const storedRole = localStorage.getItem('userRole');
            if (storedRole && storedRole !== response.data.user.role) {
                // Role mismatch, clear session
                localStorage.clear();
                delete axios.defaults.headers.common['Authorization'];
                set({ error: null, isCheckingAuth: false, isAuthenticated: false });
                return;
            }
            
            set({ user: response.data.user, isAuthenticated: true, isCheckingAuth: false });
        } catch (error) {
            localStorage.clear();
            delete axios.defaults.headers.common['Authorization'];
            set({ error: null, isCheckingAuth: false, isAuthenticated: false });
        }
    },
    // Verify email with code
    verifyEmail: async (email, code) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/verify-email`, { email, code });
            if (!response.data.success) throw new Error(response.data.message);
            set({ isLoading: false, message: "Email verified. You can log in now." });
            return true;
        } catch (err) {
            set({ isLoading: false, error: err.response?.data?.message || err.message || "Verification failed" });
            throw err;
        }
    },

    // Resend verification code
    resendCode: async (email) => {
        set({ error: null });
        try {
            const response = await axios.post(`${API_URL}/resend-code`, { email });
            if (!response.data.success) throw new Error(response.data.message);
            set({ message: "New verification code sent" });
            return true;
        } catch (err) {
            set({ error: err.response?.data?.message || err.message || "Resend failed" });
            throw err;
        }
    }
}));