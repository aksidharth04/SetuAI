import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
console.log('API Base URL:', baseURL);

const api = axios.create({ 
  baseURL: baseURL + "/api",
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for logging
api.interceptors.request.use(config => {
  console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
  console.log('Request headers:', config.headers);
  console.log('Authorization header:', config.headers.Authorization);
  console.log('Request data:', config.data);
  console.log('Full request config:', config);
  return config;
});

// Add response interceptor for logging
api.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Token management
export const setAuthToken = (token) => {
  console.log('setAuthToken called with:', token ? 'token exists' : 'no token');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Auth token set in headers:', api.defaults.headers.common['Authorization']);
  } else {
    delete api.defaults.headers.common['Authorization'];
    console.log('Auth token removed from headers');
  }
};

// Initialize token from localStorage
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

// API endpoints
export const loginUser = (credentials) => {
  console.log('API: Sending login request');
  return api.post("/auth/login", credentials);
};

export const registerUser = (data) => {
  console.log('API: Sending register request');
  return api.post("/auth/register", data);
};

export const getComplianceChecklist = () => {
  console.log('API: Fetching compliance checklist');
  return api.get("/compliance/checklist");
};

export const getVendorProfile = () => {
  console.log('API: Fetching vendor profile');
  return api.get("/vendor/profile");
};

export const getVendorDocuments = () => {
  console.log('API: Fetching vendor documents');
  return api.get("/document/vendor-documents");
};

export const uploadDocument = (formData) => {
  console.log('API: Uploading document');
  return api.post("/document/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getVendorReport = () => {
  console.log('API: Fetching vendor report');
  return api.get("/vendor/report");
};

// Vendor buyer requests
export const getBuyerRequests = () => {
  console.log('API: Fetching buyer requests');
  return api.get("/vendor/buyer-requests");
};

export const respondToBuyerRequest = (engagementId, data) => {
  console.log('API: Responding to buyer request');
  return api.put(`/vendor/buyer-requests/${engagementId}/respond`, data);
};

export const getVendorEngagements = () => {
  console.log('🔵 [API_DEBUG] Getting vendor engagements');
  return api.get('/vendor/engagements');
};

export const getVendorEngagementDetails = (engagementId) => {
  console.log('🔵 [API_DEBUG] Getting vendor engagement details:', engagementId);
  return api.get(`/vendor/engagements/${engagementId}`);
};

// Marketplace API endpoints
export const getMarketplaceVendors = (params) => {
  console.log('API: Fetching marketplace vendors');
  return api.get("/marketplace/vendors", { params });
};

export const getMarketplaceVendor = (vendorId) => {
  console.log('API: Fetching marketplace vendor details');
  return api.get(`/marketplace/vendors/${vendorId}`);
};

// Profile management API endpoints
export const getProfile = () => {
  console.log('API: Fetching vendor profile');
  return api.get("/profile");
};

export const updateProfile = (profileData) => {
  console.log('API: Updating vendor profile');
  return api.put("/profile", profileData);
};

export const togglePublish = () => {
  console.log('API: Toggling vendor publish status');
  return api.post("/profile/publish");
};

// Buyer Engagements API endpoints
export const getBuyerEngagements = () => {
  console.log('API: Fetching buyer engagements');
  return api.get("/engagement");
};

export const createEngagement = (engagementData) => {
  console.log('🔵 [API_DEBUG] Creating new engagement');
  console.log('🔵 [API_DEBUG] Engagement data:', engagementData);
  return api.post("/engagement", engagementData);
};

export const updateEngagement = (engagementId, engagementData) => {
  console.log('🔵 [API_DEBUG] Updating engagement');
  return api.put(`/engagement/${engagementId}`, engagementData);
};

export const completeEngagement = (engagementId, completionNotes) => {
  console.log('🔵 [API_DEBUG] Completing engagement');
  return api.put(`/engagement/${engagementId}/complete`, { completionNotes });
};

export const getEngagementDetails = (engagementId) => {
  console.log('API: Fetching engagement details');
  return api.get(`/engagement/${engagementId}`);
};

export const deleteEngagement = (engagementId) => {
  console.log('API: Deleting engagement');
  return api.delete(`/engagement/${engagementId}`);
};

// Invoice API endpoints
export const uploadInvoice = (engagementId, formData) => {
  console.log('🔵 [API_DEBUG] Uploading invoice for engagement:', engagementId);
  return api.post(`/invoice/engagements/${engagementId}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getInvoiceDetails = (invoiceId) => {
  console.log('🔵 [API_DEBUG] Getting invoice details:', invoiceId);
  return api.get(`/invoice/${invoiceId}`);
};

export const getEngagementInvoices = (engagementId) => {
  console.log('🔵 [API_DEBUG] Getting invoices for engagement:', engagementId);
  return api.get(`/invoice/engagements/${engagementId}`);
};

export const rateInvoice = (invoiceId, ratingData) => {
  console.log('🔵 [API_DEBUG] Rating invoice:', invoiceId);
  return api.post(`/invoice/${invoiceId}/rate`, ratingData);
};

export const getInvoiceStats = () => {
  console.log('🔵 [API_DEBUG] Getting invoice statistics');
  return api.get('/invoice/stats/vendor');
};

export const deleteInvoice = (invoiceId) => {
  console.log('🔵 [API_DEBUG] Deleting invoice:', invoiceId);
  return api.delete(`/invoice/${invoiceId}`);
};

// Wage Verification API endpoints
export const uploadWageFile = (formData) => {
  console.log('API: Uploading wage file');
  return api.post('/wage-verification/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getVendorWageVerifications = () => {
  console.log('API: Fetching vendor wage verifications');
  return api.get('/wage-verification/vendor');
};

export const getWageVerification = (verificationId) => {
  console.log('API: Fetching wage verification details');
  return api.get(`/wage-verification/${verificationId}`);
};

export const updateWageVerificationStatus = (verificationId, status) => {
  console.log('API: Updating wage verification status');
  return api.put(`/wage-verification/${verificationId}/status`, { status });
};

export const getWageVerificationStats = () => {
  console.log('API: Fetching wage verification statistics');
  return api.get('/wage-verification/stats');
};

export const deleteWageVerification = (verificationId) => {
  console.log('API: Deleting wage verification');
  return api.delete(`/wage-verification/${verificationId}`);
};

// Export the api instance for debugging
export { api };
