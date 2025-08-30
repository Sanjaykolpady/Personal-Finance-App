// API Configuration
export const API_CONFIG = {
  // Backend API base URL
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  
  // Default timeout for API requests (in milliseconds)
  TIMEOUT: 10000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

// Feature flags
export const FEATURES = {
  // Enable/disable authentication
  AUTH_ENABLED: true,
  
  // Enable/disable offline mode
  OFFLINE_MODE: false,
  
  // Enable/disable real-time updates
  REALTIME_UPDATES: false,
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
};
