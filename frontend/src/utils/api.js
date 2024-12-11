import axios from 'axios';

// Backend URL from environment variable or fallback to localhost
const API_BASE_URL = 'http://localhost:4000';

// API functions for backend endpoints
export const getClientPublicKey = () => axios.get(`${API_BASE_URL}/client-public-key`);



