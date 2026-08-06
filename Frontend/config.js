// Frontend API Configuration
// Automatically targets localhost when testing locally, or Render backend when deployed.
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://intervue-evaulation.onrender.com';
