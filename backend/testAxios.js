const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const api = axios.create({
    baseURL: API_URL,
});

console.log('Testing resolution:');
console.log('Path: "/drives" ->', api.getUri({ url: '/drives' }));
console.log('Path: "drives" ->', api.getUri({ url: 'drives' }));
