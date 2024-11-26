import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthSuccess = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Parse the token from the URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (token) {
            // Store the token (e.g., localStorage)
            localStorage.setItem('authToken', token);
            console.log('Authentication Successful');
            console.log('JWT Token:', token);

            // Redirect to the main app
            navigate('/');
        } else {
            console.error('No token found in the URL');
        }
    }, [navigate]);

    return <div>Processing authentication...</div>;
};

export default AuthSuccess;
