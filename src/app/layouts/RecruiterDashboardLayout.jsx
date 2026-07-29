import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineRocketLaunch, HiOutlineFolderOpen } from 'react-icons/hi2';
import DashboardLayoutBase from "../../shared/components/DashboardLayoutBase";
import { getUserRole } from "../../shared/utils/auth";
import {
  HiOutlineHome,
  HiOutlineClipboardDocumentList,
  HiOutlineUsers,
  HiOutlineDocumentMagnifyingGlass,
  HiOutlineQueueList,
  HiOutlineChartBarSquare,
  HiOutlineBriefcase,
  HiOutlineDocumentText,
  HiOutlineUserPlus,
  HiOutlineClipboardDocumentCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineCog6Tooth,
  HiOutlineEye,
  HiOutlineDocumentDuplicate,
  HiOutlineBuildingOffice2,
  HiOutlineLink,
  HiOutlineCreditCard,
  HiOutlineFunnel,
  HiOutlineCalendarDays,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineDocumentCheck,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCalendar,
  HiOutlineAcademicCap,
  HiOutlineClock,
  HiOutlineCamera,
  HiOutlinePencilSquare,
  HiOutlineExclamationCircle,
  HiOutlineArrowPathRoundedSquare,
  HiOutlineGift,
  HiOutlineChartBar,
  HiOutlineUserCircle,
  HiOutlineRectangleStack,
  HiOutlineArchiveBox,
  HiOutlineArrowPath,
  HiOutlineComputerDesktop,
  HiOutlineBanknotes,
  HiOutlineCog,
  HiOutlineReceiptRefund,
  HiOutlineCurrencyDollar,
  HiOutlineBuildingLibrary,
  HiOutlineChartPie,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowRightCircle,
  HiOutlineLifebuoy,
  HiOutlineEnvelope,
  HiOutlineCube,
  HiOutlineExclamationTriangle,
  HiOutlineArrowRightOnRectangle,
  HiOutlineArrowsRightLeft,
  HiOutlineCheckCircle,
  HiOutlinePresentationChartBar,
  HiOutlineSparkles,
  HiOutlinePlus,
  HiOutlineCheckBadge,
  HiOutlineBell
} from 'react-icons/hi2';

const RecruiterDashboardLayout = ({ children, internalNav = false, activeTab, onTabChange }) => {
  const navigate = useNavigate();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const [companyLogo, setCompanyLogo] = useState(() => {
    const savedLogo = localStorage.getItem('companyLogo');
    if (savedLogo) {
      try {
        const logoData = JSON.parse(savedLogo);
        return logoData.preview || 'assets/images/asset/NewLogo.png';
      } catch (e) {
        return 'assets/images/asset/NewLogo.png';
      }
    }
    return 'assets/images/asset/NewLogo.png';
  });

  useEffect(() => {
    const handleLogoUpdate = () => {
      const savedLogo = localStorage.getItem('companyLogo');
      if (savedLogo) {
        try {
          const logoData = JSON.parse(savedLogo);
          setCompanyLogo(logoData.preview || 'assets/images/asset/NewLogo.png');
        } catch (e) {
          setCompanyLogo('assets/images/asset/NewLogo.png');
        }
      } else {
        setCompanyLogo('assets/images/asset/NewLogo.png');
      }
    };

    window.addEventListener('companyLogoUpdated', handleLogoUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'companyLogo') {
        handleLogoUpdate();
      }
    });

    return () => {
      window.removeEventListener('companyLogoUpdated', handleLogoUpdate);
      window.removeEventListener('storage', handleLogoUpdate);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      navigate('/login');
    } catch (error) {
      navigate('/login');
    }
  };

  const allSidebarItems = [
    
    {
      type: 'link',
      to: '/dashboard',
      tabKey: 'dashboard',
      section: 'dashboard',
      label: 'Dashboard',
      icon: HiOutlineHome
    },
    {
      type: 'title',
      label: 'Recruitment',
      section: 'recruitment'
    },
    {
      type: 'link',
      to: '/jobslist',
      tabKey: 'jobs',
      section: 'recruitment',
      label: 'Jobs',
      icon: HiOutlineClipboardDocumentList,
      isParent: true
    },
    {
      type: 'link',
      to: '/candidates',
      tabKey: 'candidates',
      section: 'recruitment',
      label: 'Candidates',
      icon: HiOutlineUsers
    },
    {
      type: 'link',
      to: '/resume-screening',
      tabKey: 'resume-screening',
      section: 'recruitment',
      label: 'AI Resume Screening',
      icon: HiOutlineDocumentMagnifyingGlass
    },
    {
      type: 'link',
      to: '/pipeline/view',
      tabKey: 'pipeline',
      section: 'recruitment',
      label: 'Pipeline View',
      icon: HiOutlineQueueList
    },
    {
      type: 'link',
      to: '/analytics/recruiter-performance',
      tabKey: 'recruiter-performance',
      section: 'recruitment',
      label: 'Analytics',
      icon: HiOutlineChartBarSquare
    },
    {
      type: 'dropdown',
      label: 'Assessment',
      icon: HiOutlineBriefcase,
      section: 'recruitment',
      items: [
        { to: '/recruiter/assessments-library', tabKey: 'assessments-library', label: 'Assessments Library', icon: HiOutlineDocumentText },
        { to: '/recruiter/assign-assessment', tabKey: 'assign-assessment', label: 'Assign Assessment', icon: HiOutlineUserPlus },
        { to: '/recruiter/test-results', tabKey: 'test-results', label: 'Test Results', icon: HiOutlineClipboardDocumentCheck },
        { to: '/recruiter/prescreening', tabKey: 'prescreening', label: 'AI Prescreening', icon: HiOutlineMagnifyingGlass },
        { to: '/recruiter/ai-interview-configure', tabKey: 'ai-interview-configure', label: 'Configure AI Interview', icon: HiOutlineCog6Tooth },
        { to: '/recruiter/ai-interview-review', tabKey: 'ai-interview-review', label: 'Review AI Interview', icon: HiOutlineEye },
        { to: '/recruiter/offer-templates', tabKey: 'offer-templates', label: 'Offer Templates', icon: HiOutlineDocumentDuplicate },
        { to: '/recruiter/offer-tracking', tabKey: 'offer-tracking', label: 'Offer Tracking', icon: HiOutlineClipboardDocumentList }
      ]
    },

    {
      type: 'title',
      label: 'CRM',
      section: 'crm'
    },
    {
      type: 'dropdown',
      label: 'CRM',
      icon: HiOutlineBuildingOffice2,
      section: 'crm',
      items: [
        { to: '/crm/contacts', tabKey: 'crm-contacts', label: 'Contacts', icon: HiOutlineBuildingOffice2 },
        { to: '/crm/companies', tabKey: 'crm-companies', label: 'Companies', icon: HiOutlineLink },
        { to: '/crm/deals', tabKey: 'crm-deals', label: 'Deals', icon: HiOutlineCreditCard },
        { to: '/crm/leads', tabKey: 'crm-leads', label: 'Leads', icon: HiOutlineFunnel },
        { to: '/crm/pipeline', tabKey: 'crm-pipeline', label: 'Pipeline', icon: HiOutlineLink },
        { to: '/crm/analytics', tabKey: 'crm-analytics', label: 'Analytics', icon: HiOutlineCreditCard },
        { to: '/crm/activities', tabKey: 'crm-activities', label: 'Activities', icon: HiOutlineCalendarDays }
      ]
    },
    {
      type: 'title',
      label: 'HR Management',
      section: 'hr'
    },
    {
      type: 'link',
      to: '/hrms/all-employees',
      tabKey: 'all-employees',
      section: 'hr',
      label: 'All Employees',
      icon: HiOutlineUserGroup
    },
    {
      type: 'dropdown',
      label: 'Attendance',
      icon: HiOutlineClock,
      section: 'hr',
      items: [
        { to: '/hrms/attendance/daily', tabKey: 'daily-attendance', label: 'Daily Attendance', icon: HiOutlineCalendar },
        { to: '/hrms/attendance/capture', tabKey: 'attendance-capture', label: 'Attendance Capture', icon: HiOutlineCalendar },
        { to: '/hrms/attendance/punches', tabKey: 'daily-punches', label: 'Daily Punches', icon: HiOutlineClock },
        { to: '/hrms/attendance/monthly', tabKey: 'monthly-attendance', label: 'Monthly Attendance', icon: HiOutlineCalendar },
        { to: '/hrms/attendance/manual', tabKey: 'manual-attendance', label: 'Manual Attendance', icon: HiOutlineCalendar },
        { to: '/hrms/attendance/leave-correction', tabKey: 'leave-correction', label: 'Leave Correction', icon: HiOutlineCalendar },
        { to: '/hrms/attendance/shifts', tabKey: 'shift-management', label: 'Shift Management', icon: HiOutlineClock },
        { to: '/hrms/attendance/work-hour-rules', tabKey: 'work-hour-rules', label: 'Work Hour Rules', icon: HiOutlineClock },
        { to: '/hrms/attendance/regularization', tabKey: 'regularization', label: 'Regularization', icon: HiOutlineCalendar },
        { to: '/hrms/attendance/holiday-calendar', tabKey: 'holiday-calendar', label: 'Holiday Calendar', icon: HiOutlineCalendar },
        { to: '/hrms/attendance/reports', tabKey: 'attendance-reports', label: 'Attendance Reports', icon: HiOutlineChartBar },
        { to: '/hrms/leave', tabKey: 'leave-management', label: 'Leave Management', icon: HiOutlineCalendar },
      ]
    },
    {
      type: 'dropdown',
      label: 'Onboarding & Pre-Joining',
      section: 'hr',
      icon: HiOutlineUserPlus,
      items: [
        { to: '/onboarding/background-verification', tabKey: 'bg-verify', label: 'Background Verification', icon: HiOutlineShieldCheck },
        { to: '/onboarding/offer-letters', tabKey: 'offer-letters', label: 'Offer Letters', icon: HiOutlineDocumentCheck },
        { to: '/onboarding/pre-joining', tabKey: 'pre-joining', label: 'On Boarding Form', icon: HiOutlineChatBubbleLeftRight },
        { to: '/onboarding/joining-day', tabKey: 'joining-day', label: 'Add Employee', icon: HiOutlineCalendar },
        { to: '/onboarding/induction', tabKey: 'induction', label: 'Induction & Orientation', icon: HiOutlineAcademicCap },
        { to: '/onboarding/probation', tabKey: 'probation', label: 'Probation Management', icon: HiOutlineClock },
        { to: '/onboarding/buddy', tabKey: 'buddy-mentor', label: 'Buddy/Mentor Program', icon: HiOutlineUserGroup }
      ]
    },
    {
      type: 'dropdown',
      label: 'Employee Management',
      icon: HiOutlineUsers,
      section: 'hr',
      items: [
        { to: '/employee/master', tabKey: 'emp-master', label: 'Employee Master Data', icon: HiOutlineUserCircle },
        { to: '/employee/hierarchy', tabKey: 'emp-hierarchy', label: 'Org Hierarchy', icon: HiOutlineRectangleStack },
        { to: '/employee/documents', tabKey: 'emp-docs', label: 'Document Vault', icon: HiOutlineArchiveBox },
        { to: '/employee/lifecycle', tabKey: 'emp-lifecycle', label: 'Employee Lifecycle', icon: HiOutlineArrowPath },
        { to: '/employee/self-service', tabKey: 'emp-self-service', label: 'Employee Self-Service', icon: HiOutlineComputerDesktop }
      ]
    },
    {
      type: 'dropdown',
      label: 'Payroll Management',
      section: 'hr',
      icon: HiOutlineBanknotes,
      items: [
        { to: '/payroll/structure', tabKey: 'payroll-struct', label: 'Salary Structure', icon: HiOutlineCog6Tooth },
        { to: '/payroll/processing', tabKey: 'payroll-process', label: 'Payroll Processing', icon: HiOutlineCog },
        { to: '/payroll/compliance', tabKey: 'payroll-compliance', label: 'Statutory Compliance', icon: HiOutlineShieldCheck },
        { to: '/payroll/slips', tabKey: 'payroll-slips', label: 'Salary Slips', icon: HiOutlineDocumentText },
        { to: '/payroll/reimbursements', tabKey: 'payroll-reimb', label: 'Reimbursements', icon: HiOutlineReceiptRefund },
        { to: '/payroll/loans', tabKey: 'payroll-loans', label: 'Loans & Advances', icon: HiOutlineCurrencyDollar },
        { to: '/payroll/settlement', tabKey: 'payroll-settle', label: 'Final Settlement', icon: HiOutlineDocumentCheck },
        { to: '/payroll/bank-transfer', tabKey: 'payroll-transfer', label: 'Bank Transfer', icon: HiOutlineBuildingLibrary },
        { to: '/payroll/reports', tabKey: 'payroll-reports', label: 'Payroll Reports', icon: HiOutlineChartPie },
        { to: '/payroll/payroll-integration', tabKey: 'payroll-integrate', label: 'Payroll Integration', icon: HiOutlineGift }
      ]
    },
    {
      type: 'dropdown',
      label: 'HR Operations',
      section: 'hr',
      icon: HiOutlineBriefcase,
      items: [
        { to: '/hr-ops/confirmation', tabKey: 'ops-confirm', label: 'Employee Confirmation', icon: HiOutlineCheckBadge },
        { to: '/hr-ops/promotions', tabKey: 'ops-promo', label: 'Promotions & Career', icon: HiOutlineArrowTrendingUp },
        { to: '/hr-ops/transfers', tabKey: 'ops-transfer', label: 'Transfers & Movement', icon: HiOutlineArrowRightCircle },
        { to: '/hr-ops/helpdesk', tabKey: 'ops-help', label: 'HR Helpdesk', icon: HiOutlineLifebuoy },
        { to: '/hr-ops/letters', tabKey: 'ops-letters', label: 'Letter Generation', icon: HiOutlineEnvelope },
        { to: '/hr-ops/assets', tabKey: 'ops-assets', label: 'Asset Management', icon: HiOutlineCube },
        { to: '/hr-ops/notice', tabKey: 'ops-notice', label: 'Notice Period Tracking', icon: HiOutlineExclamationTriangle },
        { to: '/hr-ops/exit', tabKey: 'ops-exit', label: 'Exit Management', icon: HiOutlineArrowRightOnRectangle }
      ]
    },
    {
      type: 'dropdown',
      label: 'Forms & Workflows',
      section: 'hr',
      icon: HiOutlineArrowPath,
      items: [
        { to: '/forms/builder', tabKey: 'form-builder', label: 'Custom Form Builder', icon: HiOutlinePencilSquare },
        { to: '/forms/requests', tabKey: 'form-requests', label: 'Request Management', icon: HiOutlineClipboardDocumentList },
        { to: '/forms/workflow', tabKey: 'form-workflow', label: 'Workflow Engine', icon: HiOutlineArrowsRightLeft },
        { to: '/forms/surveys', tabKey: 'form-surveys', label: 'Surveys & Pulse Checks', icon: HiOutlineChartBarSquare },
        { to: '/forms/approvals', tabKey: 'form-approvals', label: 'Approvals Dashboard', icon: HiOutlineCheckCircle }
      ]
    },
    {
      type: 'dropdown',
      label: 'Reports & Analytics',
      section: 'hr',
      icon: HiOutlineChartBar,
      items: [
        { to: '/reports/employee', tabKey: 'rep-emp', label: 'Employee Reports', icon: HiOutlineUserGroup },
        { to: '/reports/attendance', tabKey: 'rep-att', label: 'Attendance Reports', icon: HiOutlineClock },
        { to: '/reports/leave', tabKey: 'rep-leave', label: 'Leave Reports', icon: HiOutlineCalendar },
        { to: '/reports/payroll', tabKey: 'rep-pay', label: 'Payroll Reports', icon: HiOutlineBanknotes },
        { to: '/reports/compliance', tabKey: 'rep-comp', label: 'Compliance Reports', icon: HiOutlineShieldCheck },
        { to: '/reports/custom', tabKey: 'rep-custom', label: 'Custom Report Builder', icon: HiOutlinePencilSquare },
        { to: '/reports/dashboards', tabKey: 'rep-dash', label: 'Executive Dashboards', icon: HiOutlinePresentationChartBar },
        { to: '/reports/ai-insights', tabKey: 'rep-insights', label: 'AI-Driven Insights', icon: HiOutlineSparkles }
      ]
    },
    {
      type: 'link',
      to: '/Tenant/Company',
      tabKey: 'company-settings',
      section: 'company-settings',
      label: 'Company Settings',
      icon: HiOutlineCog6Tooth
    },
    {
      type: 'title',
      label: 'Productivity',
      section: 'productivity'
    },
    {
      type: 'dropdown',
      label: 'Productivity',
      icon: HiOutlineRocketLaunch,
      section: 'productivity',
      items: [
        { to: '/productivity/dashboard', tabKey: 'productivity', label: 'Dashboard', icon: HiOutlineRocketLaunch },
        { to: '/productivity/tasks', tabKey: 'prod-tasks', label: 'Task Tracker', icon: HiOutlineClipboardDocumentList },
        { to: '/productivity/projects', tabKey: 'prod-projects', label: 'Projects', icon: HiOutlineFolderOpen },
        { to: '/productivity/time-tracking', tabKey: 'prod-time', label: 'Time Tracking', icon: HiOutlineClock },
        { to: '/productivity/activity', tabKey: 'prod-activity', label: 'Activity', icon: HiOutlineComputerDesktop },
      ]
    },
    {
      type: 'title',
      label: 'Quick Actions',
      section: 'quick-actions'
    },
    {
      type: 'link',
      to: '/jobs/new',
      tabKey: 'create-job',
      section: 'quick-actions',
      label: 'Create Job',
      icon: HiOutlinePlus
    }
  ];

  // Which sidebar sections each role is allowed to see.
  // 'dashboard' is always included for every role.
  const ROLE_SECTIONS = {
    recruiter: ['dashboard', 'recruitment', 'quick-actions'],
    hr_admin: ['dashboard', 'hr'],
    admin: ['dashboard', 'recruitment', 'crm', 'hr', 'productivity', 'company-settings', 'quick-actions'],
    company: ['dashboard', 'recruitment', 'crm', 'hr', 'productivity', 'company-settings', 'quick-actions'],
    superadmin: ['dashboard', 'recruitment', 'crm', 'hr', 'productivity', 'company-settings', 'quick-actions'],
  };

  const userRole = getUserRole();
  // Unknown/missing role -> safest default is recruiter-level access only.
  const allowedSections = ROLE_SECTIONS[userRole] || ROLE_SECTIONS.recruiter;

  // Keep an item if its section is allowed. For 'title' items, only keep
  // them if at least one non-title item in that same section is also kept
  // (otherwise you get an empty section header with nothing under it).
  const sidebarItems = allSidebarItems.filter((item) => {
    if (!allowedSections.includes(item.section)) return false;
    if (item.type === 'title') {
      return allSidebarItems.some(
        (other) => other.section === item.section && other.type !== 'title' && allowedSections.includes(other.section)
      );
    }
    return true;
  });

  const topbarRightContent = (
    <div className="flex items-center gap-3.5">
      <div className="relative" ref={notificationRef}>
        <button
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          className="w-10 h-10 bg-slate-100/80 hover:bg-slate-200/80 active:bg-slate-300/80 rounded-full flex items-center justify-center border border-slate-200/50 text-slate-600 transition-all duration-150 relative"
          type="button"
        >
          <HiOutlineBell className="text-xl" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
            3
          </span>
        </button>

        {notificationsOpen && (
          <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-xl shadow-lg border border-slate-200/70 overflow-hidden py-1 z-50 animate-slide-up">
            <div className="p-3 bg-primary-50 border-b border-primary-100/60 flex items-center justify-between">
              <h6 className="text-sm text-slate-800 font-semibold mb-0">Notifications</h6>
              <span className="text-[10px] text-primary-600 font-bold px-2 py-0.5 bg-white rounded-full border border-primary-200">
                03 New
              </span>
            </div>
            
            <div className="max-h-80 overflow-y-auto scrollbar-hide divide-y divide-slate-100">
              <Link
                to="#"
                onClick={() => setNotificationsOpen(false)}
                className="p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors"
              >
                <span className="w-8 h-8 bg-green-50 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 border border-green-100">
                  <HiOutlineCheckBadge className="text-lg" />
                </span>
                <div className="flex-1">
                  <h6 className="text-xs font-semibold text-slate-800 mb-0.5">New candidate applied</h6>
                  <p className="mb-0 text-[11px] text-slate-500 leading-relaxed">You have 5 new applications today.</p>
                  <span className="text-[10px] text-slate-400 block mt-1">10 mins ago</span>
                </div>
              </Link>
            </div>
            <div className="text-center p-2.5 border-t border-slate-100 bg-slate-50/50">
              <Link to="#" onClick={() => setNotificationsOpen(false)} className="text-primary-600 hover:text-primary-700 font-semibold text-xs transition-colors">
                See All Notifications
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center rounded-full border border-slate-200 p-0.5 hover:ring-2 hover:ring-primary-500/20 active:ring-4 transition-all duration-150"
          type="button"
        >
          <img
            src="assets/images/user.png"
            alt="Recruiter"
            className="w-8 h-8 object-cover rounded-full"
          />
        </button>

        {profileOpen && (
          <div className="absolute right-0 mt-2.5 w-56 bg-white rounded-xl shadow-lg border border-slate-200/70 overflow-hidden py-1.5 z-50 animate-slide-up">
            <div className="py-2.5 px-4 bg-primary-50 border-b border-primary-100/60 flex flex-col">
              <h6 className="text-xs text-slate-800 font-bold mb-0.5">Recruiter</h6>
              <span className="text-[10px] text-slate-500 font-medium">Talent & Hiring</span>
            </div>
            <div className="py-1">
              <Link
                className="px-4 py-2 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-2.5 transition-colors no-underline"
                to="/view-profile"
                onClick={() => setProfileOpen(false)}
              >
                <HiOutlineUsers className="text-base text-slate-400" />
                <span>My Profile</span>
              </Link>
              <button
                className="w-full px-4 py-2 hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-semibold flex items-center gap-2.5 transition-colors border-0 bg-transparent text-start"
                onClick={() => {
                  setProfileOpen(false);
                  handleLogout();
                }}
              >
                <HiOutlineArrowRightOnRectangle className="text-base text-red-400" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayoutBase
      sidebarItems={sidebarItems}
      companyLogo={companyLogo}
      logoLink="/dashboard"
      topbarLeftContent={null}
      topbarRightContent={topbarRightContent}
      activeTab={internalNav ? activeTab : null}
      onTabChange={internalNav ? onTabChange : null}
    >
      {children}
    </DashboardLayoutBase>
  );
};

export default RecruiterDashboardLayout;