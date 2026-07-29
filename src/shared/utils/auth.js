// Authentication and Authorization Utilities
import { clearSelectedBranch } from './branch';

// Get JWT token
export const getToken = () => {
  return localStorage.getItem('token');
};

// Get refresh token
export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

// Get user role
export const getUserRole = () => {
  return localStorage.getItem('userRole');
};

// Get user email
export const getUserEmail = () => {
  return localStorage.getItem('userEmail');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

// Check if user is super admin
export const isSuperAdmin = () => {
  return localStorage.getItem('userRole') === 'superadmin';
};

// Check if user is recruiter
export const isRecruiter = () => {
  return localStorage.getItem('userRole') === 'recruiter';
};

// Check if user is company
export const isCompany = () => {
  return localStorage.getItem('userRole') === 'company';
};

// Check if user is HR admin
export const isHrAdmin = () => {
  return localStorage.getItem('userRole') === 'hr_admin';
};

// Check if user is regular user
export const isRegularUser = () => {
  const role = getUserRole();
  return role === 'user' || role === 'recruiter' || role === 'company';
};

// Logout function - clear all auth data
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userEmail');
  clearSelectedBranch();
};

// Check super admin access
export const checkSuperAdminAccess = (navigate) => {
  const role = getUserRole();
  if (role !== 'superadmin') {
    alert('Access denied. Super Admin only.');
    navigate('/login');
    return false;
  }
  return true;
};

// Check user access
export const checkUserAccess = (navigate) => {
  if (!isAuthenticated()) {
    alert('Access denied. Please login.');
    navigate('/login');
    return false;
  }
  return true;
};

// Check recruiter access
export const checkRecruiterAccess = (navigate) => {
  const role = getUserRole();
  if (role !== 'recruiter' && role !== 'company' && role !== 'admin') {
    alert('Access denied. Recruiter access only.');
    navigate('/login');
    return false;
  }
  return true;
};