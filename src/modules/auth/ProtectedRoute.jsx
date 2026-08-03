import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserRole, requiresPasswordChange, needsProfileCompletion } from "../../shared/utils/auth";

const ChangePasswordPath = '/change-password';
const CompleteProfilePath = '/employee/complete-profile';

const ProtectedRoute = ({ children, requiredRole = null, superAdminOnly = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userRole = getUserRole();
    const loginPath = '/login';

    // Check if user is authenticated
    if (!userRole) {
      alert('Access denied. Please login.');
      navigate(loginPath);
      return;
    }

    // A user with a temporary/forced password can't reach anywhere else
    // until they set their own password — this is the actual enforcement
    // point, since it runs for every protected route regardless of which
    // URL was typed in directly.
    if (requiresPasswordChange() && location.pathname !== ChangePasswordPath) {
      navigate(ChangePasswordPath);
      return;
    }

    // After the forced password change, an employee still can't reach the
    // rest of the HRMS until bank details + emergency contact + at least
    // one document are on file — same "runs on every route" enforcement
    // as the password-change gate above, so it can't be skipped by typing
    // a URL directly.
    if (
      userRole === 'employee' &&
      needsProfileCompletion() &&
      location.pathname !== CompleteProfilePath
    ) {
      navigate(CompleteProfilePath);
      return;
    }

    // Check for Super Admin only routes
    if (superAdminOnly && userRole !== 'superadmin') {
      alert('Access denied. Super Admin only.');
      navigate('/login');
      return;
    }

    // Check for specific role requirements
    if (requiredRole && userRole !== requiredRole && userRole !== 'superadmin') {
      alert(`Access denied. ${requiredRole} role required.`);
      navigate('/login');
      return;
    }
  }, [navigate, location.pathname, requiredRole, superAdminOnly]);

  const userRole = getUserRole();

  // Show loading while checking authentication
  if (!userRole) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (requiresPasswordChange() && location.pathname !== ChangePasswordPath) {
    return null;
  }

  if (
    userRole === 'employee' &&
    needsProfileCompletion() &&
    location.pathname !== CompleteProfilePath
  ) {
    return null;
  }

  // Check authorization again before rendering
  if (superAdminOnly && userRole !== 'superadmin') {
    return null;
  }

  if (requiredRole && userRole !== requiredRole && userRole !== 'superadmin') {
    return null;
  }

  return children;
};

export default ProtectedRoute;