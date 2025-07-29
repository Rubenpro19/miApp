import axios from 'axios';

const api = axios.create({
    baseURL: 'http://192.168.100.67:8000/api',
    withCredentials: false,
});

export default api;