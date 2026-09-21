export const API_BASE_URL = 'http://localhost:8080/api';

export const CAMERA_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};