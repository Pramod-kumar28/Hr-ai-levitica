import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Signup from './modules/auth/Signup';
import Login from './modules/auth/Login';
import ForgotPassword from './modules/auth/ForgotPassword';
import PricingPage from './modules/auth/PricingPage';
import ProtectedRoute from './modules/auth/ProtectedRoute';
import SuperAdminPanel from './modules/super-admin/SuperAdminPanel';
import SuperAdminLayout from './modules/super-admin/SuperAdminLayout';
import MultiTenantSetup from './modules/super-admin/MultiTenantSetup';
import RolesPermissions from './modules/super-admin/RolesPermissions';
import CompanySettings from './modules/super-admin/CompanySettings';
import Authentication from './modules/super-admin/Authentication';
import Candidates from './modules/ai-recruitment/candidates/Candidates';
import DashboardRouter from './app/layouts/DashboardRouter';
import PipelineOverview from './modules/ai-recruitment/analytics/PipelineOverview';
import JobAnalytics from './modules/ai-recruitment/analytics/JobAnalytics';
import RecruiterDashboardLayout from './app/layouts/RecruiterDashboardLayout';
import ResumeScreening from './modules/ai-recruitment/interviews/ResumeScreening';
import CreateJob from './modules/ai-recruitment/jobs/CreateJob';
import JobList from './modules/ai-recruitment/jobs/JobList';
import Stages from './modules/ai-recruitment/analytics/Stages';
import DragDrop from './modules/ai-recruitment/analytics/DragDrop';
import CollaborationTools from './modules/ai-recruitment/analytics/CollaborationTools';
import RecruiterPerformance from './modules/ai-recruitment/analytics/RecruiterPerformance';
import TimeToHire from './modules/ai-recruitment/analytics/TimeToHire';
import CandidateSourcing from './modules/ai-recruitment/analytics/CandidateSourcing';
import JobPerformance from './modules/ai-recruitment/analytics/JobPerformance';
import Settings from "./shared/components/Settings";
import OrgInfo from './modules/ai-recruitment/dashboard/OrgInfo';
import Integrations from './modules/ai-recruitment/dashboard/Integrations';
import Billing from './modules/ai-recruitment/dashboard/Billing';
import RecruiterProfile from './modules/ai-recruitment/dashboard/RecruiterProfile';
import AssessmentManagement from './modules/ai-recruitment/assessments/AssessmentManagement';
import AssessmentLibrary from './modules/ai-recruitment/assessments/AssessmentLibrary';
import AssignAssessments from './modules/ai-recruitment/assessments/AssignAssessments';
import TestResultsViewer from './modules/ai-recruitment/assessments/TestResultsViewer';
import AptitudeTest from "./modules/ai-recruitment/assessments/aptitude/AptitudeTest";
import AptitudeLoginPage from "./modules/ai-recruitment/assessments/aptitude/LoginPage";
import AptitudeInstructionPage from "./modules/ai-recruitment/assessments/aptitude/InstructionPage";
import AptitudeExamPage from "./modules/ai-recruitment/assessments/aptitude/ExamPage";
import CodingTest from './modules/ai-recruitment/assessments/CodingTest';
import CommunicationTest from './modules/ai-recruitment/assessments/CommunicationTest';
import AIPrescreening from './modules/ai-recruitment/interviews/AIPrescreening';
import ConfigureAIInterview from './modules/ai-recruitment/interviews/ConfigureAIInterview';
import ReviewAIInterview from './modules/ai-recruitment/interviews/ReviewAIInterview';
import AIInterviewPortal from './modules/ai-recruitment/interviews/AIInterviewPortal';
import OfferTemplates from './modules/ai-recruitment/onboarding/OfferTemplates';
import OfferTracking from './modules/ai-recruitment/onboarding/OfferTracking';

import Activities from './modules/crm/activities/Activities';
import Analytics from './modules/crm/analytics/Analytics';
import Companies from './modules/crm/companies/Companies';
import Contacts from './modules/crm/contacts/Contacts';
import Deals from './modules/crm/deals/Deals';
import Leads from './modules/crm/leads/Leads';
import Pipeline from './modules/crm/pipeline/Pipeline';
// Tenant & User Management - Moved to superAdmin folder
// Employee Management
import AllEmployees from './modules/hrms/employees/AllEmployees';
import EmployeeLifecycle from './modules/hrms/employees/EmployeeLifecycle';
import EmployeeMasterData from './modules/hrms/employees/EmployeeMasterData';
import EmployeeSelfService from './modules/hrms/employees/EmployeeSelfService';
import OrganizationHierarchy from './modules/hrms/employees/OrganizationHierarchy';
import DocumentVault from './modules/hrms/employees/DocumentVault';
// Onboarding & Joining
import OnboardingDashboard from './modules/ai-recruitment/onboarding/OnboardingDashboard';
import NewOnboardingForm from './modules/ai-recruitment/onboarding/NewOnboardingForm';
import PersonalInformationForm from './modules/ai-recruitment/onboarding/PersonalInformationForm';
import OfferManagement from './modules/ai-recruitment/onboarding/OfferManagement';
import Newhire from './modules/ai-recruitment/onboarding/Newhire';
import Basicdetails from './modules/ai-recruitment/onboarding/Basicdetails';
import Onboardingcontactdetails from './modules/ai-recruitment/onboarding/Onboardingcontactdetails';
import OnboardingPersonaldetails from './modules/ai-recruitment/onboarding/OnboardingPersonaldetails';
import OnboardingStatutorydetails from './modules/ai-recruitment/onboarding/OnboardingStatutorydetails';
import Familydetails from './modules/ai-recruitment/onboarding/Familydetails';
import Onboardingpresentaddress from './modules/ai-recruitment/onboarding/Onboardingpresentaddress';
import Permanentaddress from './modules/ai-recruitment/onboarding/Permanentaddress';
import Onboardingbankdetails from './modules/ai-recruitment/onboarding/Onboardingbankdetails';
import Uploaddocument from './modules/ai-recruitment/onboarding/Uploaddocument';
import Final from './modules/ai-recruitment/onboarding/Final';
import JoiningDayManagement from './modules/ai-recruitment/onboarding/JoiningDayManagement';
import ProbationManagement from './modules/ai-recruitment/onboarding/ProbationManagement';
import PreJoiningEngagement from './modules/ai-recruitment/onboarding/PreJoiningEngagement';
import InductionOrientation from './modules/ai-recruitment/onboarding/InductionOrientation';
import BuddyMentorAssignment from './modules/ai-recruitment/onboarding/BuddyMentorAssignment';
import BackgroundVerification from './modules/ai-recruitment/onboarding/BackgroundVerification';
// Payroll Management
// HR Operations (HROperations)
import AssestManagement from './modules/hrms/employees/AssestManagement';
import EmployeeConfirmation from './modules/hrms/employees/EmployeeConfirmation';
import ExitManagement from './modules/hrms/employees/ExitManagement';
import HRHelpdesk from './modules/hrms/employees/HRHelpdesk';
import LetterGeneration from './modules/hrms/employees/LetterGeneration';
import NoticePeriodTracking from './modules/hrms/employees/NoticePeriodTracking';
import PromotionsCareer from './modules/hrms/employees/PromotionsCareer';
import TranfersMovement from './modules/hrms/employees/TranfersMovement';

import Salaryslip from './modules/hrms/payroll/Salaryslip';
import StatutoryCompliance from './modules/hrms/payroll/StatutoryCompliance';
import SalaryStructure from './modules/hrms/payroll/SalaryStructure';
import Reimbursements from './modules/hrms/payroll/Reimbursements';
import PayrollProcessingEngine from './modules/hrms/payroll/PayrollProcessingEngine';
import LoansAdvances from './modules/hrms/payroll/LoansAdvances';
import PayrollReports from './modules/hrms/payroll/PayrollReports';
import BankTransfer from './modules/hrms/payroll/BankTransfer';
import FinalSettlement from './modules/hrms/payroll/FinalSettlement';
// Attendance & Leave Management
import AttendanceCapture from './modules/hrms/attendance/AttendanceCapture';
import DailyPunches from './modules/hrms/attendance/DailyPunches';
import DailyAttendance from './modules/hrms/attendance/DailyAttendance';
import MonthlyAttendance from './modules/hrms/attendance/MonthlyAttendance';
import ManualAttendance from './modules/hrms/attendance/ManualAttendance';
import LeaveCorrection from './modules/hrms/attendance/LeaveCorrection';
import ShiftManagement from './modules/hrms/attendance/ShiftManagement';
import WorkHourRules from './modules/hrms/attendance/WorkHourRules';
import LeaveManagement from './modules/hrms/leave/LeaveManagement';
import Regularization from './modules/hrms/attendance/Regularization';
import HolidayCalendar from './modules/hrms/attendance/HolidayCalendar';
import AttendanceReports from './modules/hrms/reports/AttendanceReports';
import PayrollIntegration from './modules/hrms/attendance/PayrollIntegration';
// Reports & Analytics
import AIDrivenInsights from './modules/hrms/reports/AIDrivenInsights';
import ReportsAttendance from './modules/hrms/reports/AttendanceAnalyticsReports';
import ComplianceReports from './modules/hrms/reports/ComplianceReports';
import CustomReportBuilder from './modules/hrms/reports/CustomReportBuilder';
import EmployeeReports from './modules/hrms/reports/EmployeeReports';
import LeaveReports from './modules/hrms/reports/LeaveReports';
import ReportsPayroll from './modules/hrms/reports/PayrollReports';
import ExecutiveDashboards from './modules/hrms/reports/ExecutiveDashboards';
// Forms & Workflows
import ApprovalsDashboard from './modules/hrms/dashboard/ApprovalsDashboard';
import CustomFromBuilder from './modules/hrms/dashboard/CustomFromBuilder';
import RequestManagement from './modules/hrms/dashboard/RequestManagement';
import SurveysPulseChecks from './modules/hrms/dashboard/SurveysPulseChecks';
import WorkflowEngine from './modules/hrms/dashboard/WorkflowEngine';

import HRAutomation from './modules/landing/HRAutomation'
import CrmLanding from './modules/landing/Crmlanding'
import Navbar from './modules/landing/Navbar'
import Bookademo from './modules/landing/Bookademo'
import Footer from './modules/landing/Footer'
import ContactPage from './modules/landing/ContactPage';
import Human from './modules/landing/Human'
import HomePage from './modules/landing/HomePage';

import ResetPassword from './modules/auth/ResetPassword';

import CandidateLogin from './modules/candidate/CandidateLogin';
import CandidateDashboard from './modules/candidate/CandidateDashboard';
import CandidateJobSearch from './modules/candidate/CandidateJobSearch';
import CandidateApplications from './modules/candidate/CandidateApplications';
import CandidateProfile from './modules/candidate/CandidateProfile';

//productivity
import ProductivityDashboard from "./modules/productivity/dashboard/ProductivityDashboard";
import TaskTracker from "./modules/productivity/tasks/TaskTracker";
import Projects from "./modules/productivity/projects/Projects";
import TimeTracking from "./modules/productivity/timetracking/TimeTracking";
import Activity from "./modules/productivity/activity/Activity";


const App = () => {
  return (
    <div>
      <Routes>
     <Route path='/' element={<HomePage />}/>
      <Route path='/signup' element={<Signup />} />
      <Route path='/login' element={<Login />} />
      <Route path='/ForgotPassword' element={<ForgotPassword />} />
      <Route path='/pricing' element={<PricingPage />} />
      <Route path='/hrAutomation' element={<HRAutomation />}/>
      <Route path='/crmlanding' element={<CrmLanding />}/>
      <Route path='/navbar' element={<Navbar/>}/>
      <Route path='/bookademo' element={<Bookademo />}/>
      <Route path='/footer' element={<Footer />}/>
      <Route path='/contactpage'element={<ContactPage/>}/>
      <Route path='/human'element={<Human/>}/>







      <Route
        path='/dashboard'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <DashboardRouter />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route path='/productivity/dashboard' element={<ProtectedRoute><RecruiterDashboardLayout><ProductivityDashboard /></RecruiterDashboardLayout></ProtectedRoute>} />
      <Route path='/productivity/tasks' element={<ProtectedRoute><RecruiterDashboardLayout><TaskTracker /></RecruiterDashboardLayout></ProtectedRoute>} />
      <Route path='/productivity/projects' element={<ProtectedRoute><RecruiterDashboardLayout><Projects /></RecruiterDashboardLayout></ProtectedRoute>} />
      <Route path='/productivity/time-tracking' element={<ProtectedRoute><RecruiterDashboardLayout><TimeTracking /></RecruiterDashboardLayout></ProtectedRoute>} />
      <Route path='/productivity/activity' element={<ProtectedRoute><RecruiterDashboardLayout><Activity /></RecruiterDashboardLayout></ProtectedRoute>} />
      <Route
        path='/candidates'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <Candidates />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/resume-screening'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <ResumeScreening />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/jobs/new'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <CreateJob />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/jobslist'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <JobList />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/pipeline/view'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <PipelineOverview />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/pipeline/stages'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <Stages />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/pipeline/drag-drop'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <DragDrop />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/pipeline/collaboration'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <CollaborationTools />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/analytics/jobs'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <JobAnalytics />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/analytics/recruiter-performance'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <RecruiterPerformance />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/analytics/time-to-hire'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <TimeToHire />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/analytics/job-sourcing'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <CandidateSourcing />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/analytics/job-performance'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <JobPerformance />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/settings'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <Settings />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/settings/org-info'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <OrgInfo />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/settings/integrations'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <Integrations />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/settings/billing'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <Billing />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/view-profile'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <RecruiterProfile />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      {/* Assessment Management Routes - Recruiter */}
      <Route
        path='/assessments'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <AssessmentManagement />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/recruiter/assessments-library'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <AssessmentLibrary />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/recruiter/assign-assessment'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <AssignAssessments />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/recruiter/test-results'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <TestResultsViewer />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/recruiter/prescreening'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <AIPrescreening />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/recruiter/ai-interview-configure'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <ConfigureAIInterview />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/recruiter/ai-interview-review'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <ReviewAIInterview />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/recruiter/offer-templates'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <OfferTemplates />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/recruiter/offer-tracking'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <OfferTracking />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />


      {/*  CRM Routes Section  */}


      <Route
        path='/crm/activities'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              < Activities />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path='/crm/analytics'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              < Analytics />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/crm/companies'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              < Companies />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/crm/contacts'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              < Contacts />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/crm/deals'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              < Deals />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/crm/leads'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              < Leads />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path='/crm/pipeline'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              < Pipeline />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />


      {/* Legacy sidebar routes for Tenant links (match RecruiterDashboardLayout NavLinks) */}
      <Route
        path='/Tenant/MultiTenant'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <MultiTenantSetup />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/Tenant/Authentication'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <Authentication />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/Tenant/RolesPermission'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <RolesPermissions />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/Tenant/Company'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <CompanySettings />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* HRMS Routes */}
      <Route
        path='/hrms/all-employees'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <AllEmployees />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Attendance Routes — components existed and were imported but had
          no <Route> at all (confirmed zero registrations, zero sidebar
          links) until this pass. */}
      <Route
        path='/hrms/attendance/daily'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <DailyAttendance />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/hrms/attendance/capture'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <AttendanceCapture />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/hrms/attendance/punches'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <DailyPunches />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/hrms/attendance/monthly'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <MonthlyAttendance />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/hrms/attendance/manual'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <ManualAttendance />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/hrms/attendance/leave-correction'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <LeaveCorrection />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/hrms/attendance/shifts'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <ShiftManagement />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/hrms/attendance/work-hour-rules'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <WorkHourRules />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/hrms/attendance/regularization'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <Regularization />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/hrms/attendance/holiday-calendar'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <HolidayCalendar />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/hrms/attendance/reports'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <AttendanceReports />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />     
      <Route
        path='/hrms/leave'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <LeaveManagement />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Employee Management Routes (match sidebar links) */}
      <Route
        path='/employee/master'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <EmployeeMasterData />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/employee/hierarchy'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <OrganizationHierarchy />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/employee/documents'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <DocumentVault />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/employee/lifecycle'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <EmployeeLifecycle />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/employee/self-service'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <EmployeeSelfService />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />


      {/* Onboarding & Joining Routes (canonical) */}
      <Route
        path='/onboarding/offer-management'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <OfferManagement />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/onboarding/pre-joining-engagement'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <PreJoiningEngagement />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/onboarding/joining-day'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <JoiningDayManagement />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/onboarding/induction-orientation'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <InductionOrientation />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/onboarding/probation-management'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <ProbationManagement />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/onboarding/buddy-assignment'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <BuddyMentorAssignment />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
 
      {/* Sidebar legacy HR-Ops paths -> render same protected components directly */}
      <Route
        path='/hr-ops/confirmation'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <EmployeeConfirmation />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/hr-ops/promotions'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <PromotionsCareer />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/hr-ops/transfers'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <TranfersMovement />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/hr-ops/helpdesk'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <HRHelpdesk />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/hr-ops/letters'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <LetterGeneration />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/hr-ops/assets'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <AssestManagement />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/hr-ops/notice'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <NoticePeriodTracking />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/hr-ops/exit'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <ExitManagement />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />    

      {/* Sidebar legacy forms paths -> render same protected components directly (avoid redirect fallthrough) */}
      <Route
        path='/forms/builder'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <CustomFromBuilder />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/forms/custom'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <CustomFromBuilder />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/forms/requests'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <RequestManagement />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/forms/workflow'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <WorkflowEngine />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/forms/surveys'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <SurveysPulseChecks />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/forms/approvals'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <ApprovalsDashboard />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />


      {/* Canonical lowercase Payroll routes (match sidebar links) */}
      <Route
        path='/payroll/structure'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <SalaryStructure />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/payroll/processing'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <PayrollProcessingEngine />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/payroll/compliance'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <StatutoryCompliance />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/payroll/slips'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <Salaryslip />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/payroll/reimbursements'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <Reimbursements />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/payroll/loans'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <LoansAdvances />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/payroll/settlement'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <FinalSettlement />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/payroll/bank-transfer'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <BankTransfer />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/payroll/reports'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <PayrollReports />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/payroll/payroll-integration'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <PayrollIntegration />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
    
    {/* Canonical lowercase onboarding routes (match sidebar links) */}
      <Route
        path='/onboarding'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <OnboardingDashboard />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/onboarding/form/new'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <NewOnboardingForm />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/onboarding/form/personal-info'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <PersonalInformationForm />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/newhire'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <Newhire />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/basicdetails'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <Basicdetails />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/onboardingcontactdetails'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <Onboardingcontactdetails />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/onboardingPersonaldetails'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <OnboardingPersonaldetails />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/onboardingstatutorydetails'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <OnboardingStatutorydetails />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/familydetails'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <Familydetails />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/onboardingPresentaddress'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <Onboardingpresentaddress />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/permanentaddress'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <Permanentaddress />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/onboardingbankdetails'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <Onboardingbankdetails />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/uploaddocument'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <Uploaddocument />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/final'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <Final />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/onboarding/offer-letters'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <OfferManagement />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/onboarding/pre-joining'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <PreJoiningEngagement />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/onboarding/joining-day'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <JoiningDayManagement />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/onboarding/induction'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <InductionOrientation />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/onboarding/probation'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <ProbationManagement />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/onboarding/buddy'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <BuddyMentorAssignment />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/onboarding/background-verification'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <BackgroundVerification />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />

        {/* Sidebar legacy reports paths -> render same protected components directly */}
      <Route
        path='/reports/employee'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <EmployeeReports />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/reports/attendance'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <ReportsAttendance />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }

        
      />
      
      <Route
      />


      <Route
        path='/reports/leave'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <LeaveReports />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/reports/payroll'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <ReportsPayroll />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/reports/compliance'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <ComplianceReports />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/reports/custom'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <CustomReportBuilder />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/reports/dashboards'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <ExecutiveDashboards />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/reports/ai-insights'
        element={
          <ProtectedRoute>
            <RecruiterDashboardLayout>
              <AIDrivenInsights />
            </RecruiterDashboardLayout>
          </ProtectedRoute>
        }
      />



      {/* Assessment Test Routes - Public/Candidate */}
      <Route path='/assessment/aptitude' element={<AptitudeTest />} />
      {/*
        NOTE: AptitudeTest.jsx above (the route actually used today) is a separate,
        still-unwired mock component. LoginPage.js / InstructionPage.js / ExamPage.js
        are a second, now fully backend-wired implementation of the same candidate
        flow that was previously orphaned (no route pointed to them at all). They're
        registered here under /assessment/aptitude/login so they're reachable and
        testable; swap AptitudeTest.jsx for this flow (or vice versa) once the team
        decides which one to keep — see report Section 2.
      */}
      <Route path='/assessment/aptitude/login' element={<AptitudeLoginPage />} />
      <Route path='/assessment/aptitude/instructions' element={<AptitudeInstructionPage />} />
      <Route path='/assessment/aptitude/exam' element={<AptitudeExamPage />} />
      <Route path='/assessment/coding' element={<CodingTest />} />
      <Route path='/assessment/communication' element={<CommunicationTest />} />

      {/* AI Interview Portal - Public Route */}
      <Route path='/ai-interview' element={<AIInterviewPortal />} />

      {/* Super Admin Routes */}
      <Route
        path='/super-admin'
        element={
          <ProtectedRoute superAdminOnly={true}>
            <SuperAdminLayout>
              <SuperAdminPanel />
            </SuperAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/super-admin/tenants'
        element={
          <ProtectedRoute superAdminOnly={true}>
            <SuperAdminLayout>
              <MultiTenantSetup />
            </SuperAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/super-admin/users'
        element={
          <ProtectedRoute superAdminOnly={true}>
            <SuperAdminLayout>
              <SuperAdminPanel />
            </SuperAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/super-admin/roles'
        element={
          <ProtectedRoute superAdminOnly={true}>
            <SuperAdminLayout>
              <RolesPermissions />
            </SuperAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/super-admin/settings'
        element={
          <ProtectedRoute superAdminOnly={true}>
            <SuperAdminLayout>
              <CompanySettings />
            </SuperAdminLayout>
          </ProtectedRoute>
        }
      />



      <Route
        path='/super-admin/authentication'
        element={
          <ProtectedRoute superAdminOnly={true}>
            <SuperAdminLayout>
              <Authentication />
            </SuperAdminLayout>
          </ProtectedRoute>
        }
      />


      <Route path='/reset-password' element={<ResetPassword />} />

      {/* Candidate Portal Routes */}
      <Route path='/candidate/login' element={<CandidateLogin />} />
      <Route path='/candidate/dashboard' element={<CandidateDashboard />} />
      <Route path='/candidate/jobs' element={<CandidateJobSearch />} />
      <Route path='/candidate/applications' element={<CandidateApplications />} />
      <Route path='/candidate/profile' element={<CandidateProfile />} />

      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
    </div>
  );
  
};

export default App;