import axios from 'axios'

export const baseURL = 'http://3.144.113.147'

// Instance for file uploads (multipart/form-data)
export const uploadClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'multipart/form-data',
  }
})

// Instance for regular JSON requests
export const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Add auth interceptor
const addAuthHeader = (config) => {
  // Skip auth header if specifically requested (e.g., for S3 uploads)
  if (config.skipAuthHeader) {
    return config;
  }
  
  const user = JSON.parse(localStorage.getItem('user'));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
};

// Add interceptors for auth
apiClient.interceptors.request.use(addAuthHeader);
uploadClient.interceptors.request.use(addAuthHeader);

// Error handling interceptor
const handleError = (error) => {
  if (error.response) {
    console.error('Response error:', error.response.data);
    throw error.response.data;
  } else if (error.request) {
    console.error('Request error:', error.request);
    throw new Error('No response from server');
  } else {
    console.error('Error:', error.message);
    throw error;
  }
}

uploadClient.interceptors.response.use(response => response, handleError);
apiClient.interceptors.response.use(response => response, handleError); 