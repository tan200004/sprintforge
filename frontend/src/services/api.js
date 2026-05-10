import axios from 'axios';

const forgeApiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
forgeApiClient.interceptors.request.use(
  (config) => {
    const storedToken = localStorage.getItem('sf_access_token');
    if (storedToken) {
      config.headers.Authorization = `Bearer ${storedToken}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

let isRefreshingToken = false;
let pendingRequestQueue = [];

const processPendingQueue = (err, newToken = null) => {
  pendingRequestQueue.forEach(({ resolve, reject }) => {
    if (err) reject(err);
    else resolve(newToken);
  });
  pendingRequestQueue = [];
};

// Auto-refresh on 401
forgeApiClient.interceptors.response.use(
  (response) => response,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retryAttempted) {
      if (isRefreshingToken) {
        return new Promise((resolve, reject) => {
          pendingRequestQueue.push({ resolve, reject });
        }).then((freshToken) => {
          originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          return forgeApiClient(originalRequest);
        });
      }

      originalRequest._retryAttempted = true;
      isRefreshingToken = true;

      try {
        const refreshResponse = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const freshToken = refreshResponse.data.data.accessToken;
        localStorage.setItem('sf_access_token', freshToken);
        forgeApiClient.defaults.headers.common.Authorization = `Bearer ${freshToken}`;
        processPendingQueue(null, freshToken);
        originalRequest.headers.Authorization = `Bearer ${freshToken}`;
        return forgeApiClient(originalRequest);
      } catch (refreshErr) {
        processPendingQueue(refreshErr, null);
        localStorage.removeItem('sf_access_token');
        window.dispatchEvent(new Event('forge:session:expired'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshingToken = false;
      }
    }

    return Promise.reject(err);
  }
);

export default forgeApiClient;
