import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    //baseURL: 'http://192.168.137.118:8080/api',
    withCredentials: false,
});

export default api;