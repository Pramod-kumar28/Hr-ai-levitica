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

// Whether the current login must change its password before doing anything
// else (set right after "Convert to Employee" issues a temporary password,
// or from any /api/auth/login-json /login /me response). Stored as a plain
// string flag since localStorage only holds strings.
export const requiresPasswordChange = () => {
  return localStorage.getItem('requiresPasswordChange') === 'true';
};

export const setRequiresPasswordChange = (value) => {
  if (value) {
    localStorage.setItem('requiresPasswordChange', 'true');
  } else {
    localStorage.removeItem('requiresPasswordChange');
  }
};

// Whether an 'employee' login still needs to complete their profile (bank
// details + emergency contact + at least one document) before reaching the
// full self-service dashboard — mirrors requiresPasswordChange, one step
// later in the same "Convert to Employee" flow. Only ever meaningful for
// role === 'employee'; other roles' backend responses default this to true
// so it's always a no-op for them.
export const needsProfileCompletion = () => {
  return localStorage.getItem('needsProfileCompletion') === 'true';
};

export const setNeedsProfileCompletion = (value) => {
  if (value) {
    localStorage.setItem('needsProfileCompletion', 'true');
  } else {
    localStorage.removeItem('needsProfileCompletion');
  }
};

// Check if user is employee (self-service login created via "Convert to
// Employee", distinct from the recruiter/hr_admin/admin/company/superadmin
// staff roles)
export const isEmployee = () => {
  return localStorage.getItem('userRole') === 'employee';
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
  localStorage.removeItem('requiresPasswordChange');
  localStorage.removeItem('needsProfileCompletion');
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