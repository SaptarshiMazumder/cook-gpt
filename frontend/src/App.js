import { useEffect, useState } from 'react';
import SubmitRequest from './components/SubmitRequest';
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import LoginWithGoogle from './components/LoginWithGoogle';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthSuccess from './components/AuthSuccess';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import AudioGenerator from './components/AudioGenerator';
function App() {
    return (
        <Router>
            
            <div>
                <h1></h1>
                <h1></h1>
                <SubmitRequest />
                <LoginWithGoogle />
                {/* <GoogleLogin onSuccess={handleLogin} onError={() => console.error('Login Failed')} /> */}

            </div>
            <Routes>
                <Route path="/" element={<LoginWithGoogle />} />
                <Route path="/auth-success" element={<AuthSuccess />} />
                <Route path="/audio" element={<AudioGenerator />} />
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
