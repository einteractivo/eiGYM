import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 402 && error.response?.data?.error === 'LICENSE_EXPIRED') {
            localStorage.setItem('license_expired', 'true');
            // We don't redirect here anymore to allow "Limited Access" (Read-only)
            // The UI will handle showing a banner/modal.
        }
        if (error.response?.status === 403 && error.response?.data?.error === 'UNAUTHORIZED_MACHINE') {
            localStorage.setItem('machine_unauthorized', 'true');
            if (error.response.data.machineId) {
                localStorage.setItem('current_machine_id', error.response.data.machineId);
            }
            window.location.href = '/unauthorized-machine';
        }
        return Promise.reject(error);
    }
);

// Build the full URL for an upload path like /uploads/logo_123.png
export const getUploadUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = (api.defaults.baseURL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default api;
