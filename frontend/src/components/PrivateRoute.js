import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/?message=unauthorized" />;
};

export default PrivateRoute;