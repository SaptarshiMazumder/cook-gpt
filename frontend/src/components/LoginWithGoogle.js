import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { saveToken } from '../utils/auth'; // Replace with your token saving logic
import { jwtDecode } from "jwt-decode";

const LoginWithGoogle = () => {
    const [user, setUser] = useState(null);
    const [message, setMessage] = useState('');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate(); // Initialize the navigate function

    useEffect(() => {
        const msg = searchParams.get('message');
        if (msg === 'login-first') {
            setMessage('Please log in first to access this page.');
        }
    }, [searchParams]);

    const handleLogin = async () => {
        try {
            const { data } = await axios.get(`http://localhost:4000/auth/google`);
            const googleLoginUrl = data.url;
    
            const newWindow = window.open(
                googleLoginUrl,
                '_blank',
                'width=500,height=600,scrollbars=yes,resizable=yes'
            );
    
            // Listen for the message from the popup
            window.addEventListener('message', (event) => {
                console.log('Received message from popup:', event.data);
                console.log('Origin:', event.origin);

                if (event.origin !== 'http://localhost:4000') return; // Restrict messages to trusted origins
                console.log('Origin matched!');
                const { token } = event.data;
    
                if (token) {
                    saveToken(token);
                     // Decode the token to extract user details
                    const decodedUser = jwtDecode(token);
                    console.log('Decoded User:', decodedUser);
                    setUser({ token });
                    newWindow.close();
                    navigate('/dashboard');
                }
            });
        } catch (error) {
            console.error('Error fetching Google login URL:', error.message);
        }
    };
    
    

    return (
        <div>
            <h2>Login with Google</h2>
            {message && <p style={{ color: 'red', fontWeight: 'bold' }}>{message}</p>}
            <button onClick={handleLogin}>Login with Google</button>

            {user && (
                <div>
                    <h3>Welcome, User!</h3>
                    <p>You are now logged in.</p>
                </div>
            )}
        </div>
    );
};

export default LoginWithGoogle;
