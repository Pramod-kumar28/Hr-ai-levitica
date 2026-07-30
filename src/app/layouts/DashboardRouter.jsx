import React from 'react';
import { getUserRole } from '../../shared/utils/auth';
import DashboardOverview from '../../modules/ai-recruitment/dashboard/DashboardOverview';
import AdminDashboardOverview from '../../modules/admin/dashboard/AdminDashboardOverview';
import HrAdminDashboardOverview from '../../modules/hrms/dashboard/HrAdminDashboardOverview';
import CompanyDashboardOverview from '../../modules/company/dashboard/CompanyDashboardOverview';

// Renders a genuinely different dashboard component per role, rather than
// one shared component with the same recruitment-only stats for everyone.
// Mounted once at the single /dashboard route in App.jsx.
const DashboardRouter = () => {
  const role = getUserRole();

  switch (role) {
    case 'hr_admin':
      return <HrAdminDashboardOverview />;
    case 'admin':
      return <AdminDashboardOverview />;
    case 'company':
      return <CompanyDashboardOverview />;
    case 'recruiter':
    default:
      // Unknown/missing role falls back to the recruiter view, matching
      // the same safe default used for sidebar filtering.
      return <DashboardOverview />;
  }
};

export default DashboardRouter;