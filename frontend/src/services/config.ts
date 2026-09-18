// VISTHAAPAN Client Configuration
// Controls mock fallback and backend API targeting

export const USE_MOCK_API: boolean = import.meta.env.VITE_USE_MOCK_API === 'true';

export const API_BASE_URL: string = (
  import.meta.env.VITE_API_BASE_URL && typeof import.meta.env.VITE_API_BASE_URL === 'string'
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
    : 'http://localhost:5000/api/v1'
);

// Simulated network delay for realistic frontend asynchronous simulation
export const MOCK_DELAY_MS: number = 250;
