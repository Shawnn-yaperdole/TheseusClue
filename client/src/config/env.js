// Centralized access to Vite environment variables.
// Import from here instead of using import.meta.env directly.

const env = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
};

export default env;