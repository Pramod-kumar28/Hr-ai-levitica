import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import StatCard from '../../../shared/components/StatCard';
import { employeeAPI, attendanceAPI, hrAPI } from '../../../shared/utils/api';

const HrAdminDashboardOverview = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    presentToday: 0,
    pendingLeaves: 0,
    departmentBreakdown: [],
    loading: true,
    error: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);

      // Each call is independent - if one endpoint isn't reachable for this
      // tenant yet, the rest of the dashboard should still render.
      const [employeesRes, departmentsRes, todayAttendanceRes, leavesRes] = await Promise.allSettled([
        employeeAPI.list(),
        employeeAPI.listDepartments(),
        attendanceAPI.getCaptureTodayAttendance(),
        hrAPI.leave.list(),
      ]);

      const employees = employeesRes.status === 'fulfilled' && Array.isArray(employeesRes.value) ? employeesRes.value : [];
      const departments = departmentsRes.status === 'fulfilled' && Array.isArray(departmentsRes.value) ? departmentsRes.value : [];
      const leaves = leavesRes.status === 'fulfilled' && Array.isArray(leavesRes.value) ? leavesRes.value : [];

      let presentToday = 0;
      if (todayAttendanceRes.status === 'fulfilled' && todayAttendanceRes.value) {
        const todayData = todayAttendanceRes.value;
        presentToday = Array.isArray(todayData)
          ? todayData.filter((r) => (r.status || '').toLowerCase() === 'present').length
          : (todayData.present_count ?? 0);
      }

      const pendingLeaves = leaves.filter((l) => (l.status || '').toLowerCase() === 'pending').length;

      const deptCounts = {};
      employees.forEach((e) => {
        const dept = e.department || 'Unassigned';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });
      const departmentBreakdown = Object.entries(deptCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

      setData({
        totalEmployees: employees.length,
        totalDepartments: departments.length || Object.keys(deptCounts).length,
        presentToday,
        pendingLeaves,
        departmentBreakdown,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('HR Admin dashboard fetch error:', err);
      setData((prev) => ({ ...prev, loading: false, error: 'Could not load HR dashboard data.' }));
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
        <p className="text-gray-500">Loading HR dashboard...</p>
      </div>
    );
  }

  const maxDeptCount = data.departmentBreakdown.length ? data.departmentBreakdown[0][1] : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-midnight_text">HR Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Workforce overview</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={data.totalEmployees}
          subtitle="All branches"
          icon="heroicons:user-group"
          color="blue"
        />
        <StatCard
          title="Departments"
          value={data.totalDepartments}
          subtitle="Active"
          icon="heroicons:building-office-2"
          color="purple"
        />
        <StatCard
          title="Present Today"
          value={data.presentToday}
          subtitle="Checked in"
          icon="heroicons:check-circle"
          color="green"
        />
        <StatCard
          title="Pending Leaves"
          value={data.pendingLeaves}
          subtitle="Awaiting approval"
          icon="heroicons:calendar"
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-100 p-4 shadow-deatail_shadow">
          <h2 className="text-base font-semibold text-midnight_text mb-4">Employees by Department</h2>
          <div className="space-y-3">
            {data.departmentBreakdown.map(([dept, count]) => (
              <div key={dept}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">{dept}</span>
                  <span className="font-semibold text-midnight_text">{count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${(count / maxDeptCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {data.departmentBreakdown.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">No employee data available</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-deatail_shadow">
          <h2 className="text-sm font-semibold text-midnight_text mb-3">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'All Employees', path: '/hrms/all-employees', icon: 'heroicons:user-group' },
              { label: 'Daily Attendance', path: '/hrms/attendance/daily', icon: 'heroicons:clock' },
              { label: 'Leave Management', path: '/hrms/leave', icon: 'heroicons:calendar-days' },
              { label: 'Add Employee', path: '/onboarding/joining-day', icon: 'heroicons:user-plus' },
            ].map((action, idx) => (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-primary/10 rounded-lg text-sm text-gray-700 hover:text-primary transition-all"
              >
                <Icon icon={action.icon} className="h-4 w-4" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HrAdminDashboardOverview;