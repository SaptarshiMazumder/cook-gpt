import { jwtDecode } from "jwt-decode";

export const isAuthenticated = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    try {
        const decoded = jwtDecode(token);
        const currentTime = Math.floor(Date.now() / 1000);
        return decoded.exp > currentTime;
    } catch (error) {
        console.error('Error decoding token:', error.message);
        return false;
    }
};

export const saveToken = (token) => {
    localStorage.setItem('authToken', token);
};

export const getToken = () => localStorage.getItem('authToken');
