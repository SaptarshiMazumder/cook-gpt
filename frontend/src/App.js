import { useEffect, useState } from 'react';
import EncryptForServer from './components/EncryptForServer';
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import LoginWithGoogle from './components/LoginWithGoogle';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthSuccess from './components/AuthSuccess';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';
function App() {
    return (
        <Router>
            
            <div>
                <h1>Browser Frontend</h1>
                <h1>Encryption/Decryption Demo</h1>
                <EncryptForServer />
                <LoginWithGoogle />
                {/* <GoogleLogin onSuccess={handleLogin} onError={() => console.error('Login Failed')} /> */}

            </div>
            <Routes>
                <Route path="/" element={<LoginWithGoogle />} />
                <Route path="/auth-success" element={<AuthSuccess />} />
                {/* Protected Routes */}
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
