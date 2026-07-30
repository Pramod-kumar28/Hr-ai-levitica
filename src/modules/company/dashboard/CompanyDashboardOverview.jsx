import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import StatCard from '../../../shared/components/StatCard';
import { employeeAPI, jobAPI, candidateAPI, locationAPI } from '../../../shared/utils/api';

// Company sees everything, combined across ALL branches (no X-Location-Id
// filter is forced server-side for this role — see api.js / get_current_location_id).
const CompanyDashboardOverview = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    totalEmployees: 0,
    totalBranches: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalCandidates: 0,
    loading: true,
    error: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);

      const [employeesRes, branchesRes, jobsRes, candidatesRes] = await Promise.allSettled([
        employeeAPI.list(),
        locationAPI.list(),
        jobAPI.list(),
        candidateAPI.list(),
      ]);

      const employees = employeesRes.status === 'fulfilled' && Array.isArray(employeesRes.value) ? employeesRes.value : [];
      const branches = branchesRes.status === 'fulfilled' && Array.isArray(branchesRes.value) ? branchesRes.value : [];
      const jobs = jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value) ? jobsRes.value : [];
      const candidates = candidatesRes.status === 'fulfilled' && Array.isArray(candidatesRes.value) ? candidatesRes.value : [];

      setData({
        totalEmployees: employees.length,
        totalBranches: branches.length,
        totalJobs: jobs.length,
        activeJobs: jobs.filter((j) => (j.status || '').toLowerCase() === 'active').length,
        totalCandidates: candidates.length,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Company dashboard fetch error:', err);
      setData((prev) => ({ ...prev, loading: false, error: 'Could not load company-wide dashboard data.' }));
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
        <p className="text-gray-500">Loading company dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-midnight_text">Company Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">All branches combined</p>
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
        <StatCard title="Branches" value={data.totalBranches} subtitle="Total locations" icon="heroicons:building-office-2" color="purple" />
        <StatCard title="Employees" value={data.totalEmployees} subtitle="All branches" icon="heroicons:user-group" color="blue" />
        <StatCard title="Total Jobs" value={data.totalJobs} subtitle={`${data.activeJobs} active`} icon="heroicons:briefcase" color="green" />
        <StatCard title="Candidates" value={data.totalCandidates} subtitle="In pipeline" icon="heroicons:users" color="yellow" />
        <StatCard title="Active Jobs" value={data.activeJobs} subtitle="Currently hiring" icon="heroicons:check-badge" color="cyan" />
      </div>

      <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-deatail_shadow">
        <h2 className="text-base font-semibold text-midnight_text mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Manage Branches', path: '/Tenant/Company', icon: 'heroicons:building-office-2' },
            { label: 'All Employees', path: '/hrms/all-employees', icon: 'heroicons:user-group' },
            { label: 'Create Job', path: '/jobs/new', icon: 'heroicons:plus' },
            { label: 'CRM', path: '/crm/leads', icon: 'heroicons:funnel' },
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

export default CompanyDashboardOverview;