import axios from 'axios';

const api = axios.create({
    baseURL: 'http://192.168.100.67:8080/api',
    withCredentials: false,
});

export default api;