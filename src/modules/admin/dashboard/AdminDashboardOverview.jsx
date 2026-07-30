import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import StatCard from '../../../shared/components/StatCard';
import { employeeAPI, jobAPI, candidateAPI, hrAPI } from '../../../shared/utils/api';

// Admin sees company-wide modules (Recruitment + CRM + HR + Productivity +
// Company Settings) but scoped to their own branch — the branch filter is
// applied server-side via the X-Location-Id header (see api.js), not here.
const AdminDashboardOverview = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    totalEmployees: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalCandidates: 0,
    pendingLeaves: 0,
    loading: true,
    error: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);

      const [employeesRes, jobsRes, candidatesRes, leavesRes] = await Promise.allSettled([
        employeeAPI.list(),
        jobAPI.list(),
        candidateAPI.list(),
        hrAPI.leave.list(),
      ]);

      const employees = employeesRes.status === 'fulfilled' && Array.isArray(employeesRes.value) ? employeesRes.value : [];
      const jobs = jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value) ? jobsRes.value : [];
      const candidates = candidatesRes.status === 'fulfilled' && Array.isArray(candidatesRes.value) ? candidatesRes.value : [];
      const leaves = leavesRes.status === 'fulfilled' && Array.isArray(leavesRes.value) ? leavesRes.value : [];

      setData({
        totalEmployees: employees.length,
        totalJobs: jobs.length,
        activeJobs: jobs.filter((j) => (j.status || '').toLowerCase() === 'active').length,
        totalCandidates: candidates.length,
        pendingLeaves: leaves.filter((l) => (l.status || '').toLowerCase() === 'pending').length,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Admin dashboard fetch error:', err);
      setData((prev) => ({ ...prev, loading: false, error: 'Could not load branch dashboard data.' }));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (data.loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4" />
        <p className="text-gray-500">Loading branch dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-midnight_text">Branch Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview for your branch</p>
        </div>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:text-primary hover:border-primary transition-all"
        >
          <Icon icon="heroicons:arrow-path" className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {data.error && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-700 text-sm">
          <Icon icon="heroicons:exclamation-circle" className="h-5 w-5 text-amber-500 flex-shrink-0" />
          {data.error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Employees" value={data.totalEmployees} subtitle="This branch" icon="heroicons:user-group" color="blue" />
        <StatCard title="Total Jobs" value={data.totalJobs} subtitle={`${data.activeJobs} active`} icon="heroicons:briefcase" color="purple" />
        <StatCard title="Candidates" value={data.totalCandidates} subtitle="In pipeline" icon="heroicons:users" color="green" />
        <StatCard title="Pending Leaves" value={data.pendingLeaves} subtitle="Awaiting approval" icon="heroicons:calendar" color="yellow" />
        <StatCard title="Active Jobs" value={data.activeJobs} subtitle="Currently hiring" icon="heroicons:check-badge" color="cyan" />
      </div>

      <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-deatail_shadow">
        <h2 className="text-base font-semibold text-midnight_text mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Create Job', path: '/jobs/new', icon: 'heroicons:plus' },
            { label: 'All Employees', path: '/hrms/all-employees', icon: 'heroicons:user-group' },
            { label: 'CRM', path: '/crm/leads', icon: 'heroicons:building-office-2' },
            { label: 'Leave Management', path: '/hrms/leave', icon: 'heroicons:calendar-days' },
            { label: 'Company Settings', path: '/Tenant/Company', icon: 'heroicons:cog-6-tooth' },
            { label: 'Reports', path: '/reports/dashboards', icon: 'heroicons:chart-bar' },
          ].map((action, idx) => (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-primary/10 rounded-lg text-sm text-gray-700 hover:text-primary transition-all"
            >
              <Icon icon={action.icon} className="h-4 w-4" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardOverview;