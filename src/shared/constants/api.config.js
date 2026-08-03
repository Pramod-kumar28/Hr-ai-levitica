// API Configuration
// Base URL for all backend API calls

// Development environment
export const BASE_URL = 'https://ai-hr-backend-2.onrender.com';
// export const BASE_URL = 'http://localhost:8000';
// For production, you can use environment variable:
// export const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
// export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SIGNUP: '/api/auth/signup',
    LOGIN: '/api/auth/login-json',
    LOGIN_FORM: '/api/auth/login',
    CURRENT_USER: '/api/auth/me',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    CHANGE_PASSWORD: '/api/auth/change-password',
  },
  
  // Jobs (Note: create.py and update.py have double prefix, others have single)
  JOBS: {
    CREATE: '/api/jobs/create',  // Double prefix (create.py has prefix)
    LIST: '/api/jobs/list',                // Single prefix
    GET: (id) => `/api/jobs/${id}`,        // Single prefix
    UPDATE: (id) => `/api/jobs/update/${id}`,  // Double prefix (update.py has prefix)
    DELETE: (id) => `/api/jobs/delete/${id}`,  // Single prefix
    SEARCH: '/api/jobs/search',            // Single prefix
  },
  
  // Candidates
  CANDIDATES: {
    LIST: '/api/candidates/list',
    GET: (id) => `/api/candidates/${id}`,
    PROFILE: '/api/candidates/profile',
    APPLICATIONS: '/api/candidates/applications',
    SAVED_JOBS: '/api/candidates/saved-jobs',
    SAVE_JOB: (id) => `/api/candidates/save-job/${id}`,
    APPLY: (jobId) => `/api/candidates/apply/${jobId}`,
  },
  
  // Pipeline
  PIPELINE: {
    STAGES: '/api/pipeline/stages',
    STAGE: (id) => `/api/pipeline/stages/${id}`,
    CANDIDATES: '/api/pipeline/candidates',
    CANDIDATE: (id) => `/api/pipeline/candidates/${id}`,
    MOVE_CANDIDATE: (id) => `/api/pipeline/candidates/${id}/move`,
    CANDIDATE_COMMENTS: (id) => `/api/pipeline/candidates/${id}/comments`,
  },
  
  // Analytics
  ANALYTICS: {
  KPIS: '/analytics/kpis',
  HIRING_FUNNEL: '/api/hiring_funnel/',
  TIME_TO_HIRE: '/api/hiring_funnel/time-to-hire',
  TIME_TO_HIRE_DETAIL: '/analytics/time-to-hire-detail',
  CANDIDATE_SOURCING: '/analytics/candidate-sourcing',
  JOB_PERFORMANCE: '/analytics/job-performance',
    RECRUITER_STATS: '/api/recruiter_dashboard/analytics',
    APPLICATIONS_OVER_TIME: '/api/recruiter_dashboard/analytics/applications-over-time',
  },
  
  // Candidate-facing aptitude test flow (mounted at /api/assessment/aptitude in main.py)
  ASSESSMENT_APTITUDE: {
    SEND_OTP: '/api/assessment/aptitude/send',
    VERIFY_OTP: '/api/assessment/aptitude/verify',
    INSTRUCTIONS: '/api/assessment/aptitude/instructions',
    START: '/api/assessment/aptitude/start',
    SUBMIT: '/api/assessment/aptitude/submit',
  },

  // Assessments (backend mounts at /assessments and /assignments — no /api prefix)
  ASSESSMENTS: {
    LIST: '/assessments',
    CREATE: '/assessments',
    GET: (id) => `/assessments/${id}`,
    UPDATE: (id) => `/assessments/${id}`,
    DELETE: (id) => `/assessments/${id}`,
    ASSIGN: '/assignments',
    ASSIGNMENTS_LIST: '/assignments',
    ASSIGNMENTS_WITH_STATUS: '/assignments/with-status',
    ALL_RESULTS: '/assignments/all-results',
    RESULTS: (candidateId) => `/api/assessment_results/candidates/${candidateId}`,
  },
  
  // AI Interviews
  INTERVIEWS: {
    CREATE: '/api/interviews',
    QUESTIONS: (id) => `/api/interviews/${id}/questions`,
    ANSWERS: (id) => `/api/interviews/${id}/answers`,
    RESULTS: (id) => `/api/interviews/${id}/results`,
  },
  
  // Onboarding Wizard (candidate self-onboarding step forms — no /api prefix)
  ONBOARDING_FORMS: {
    PERSONAL_INFO: '/personal-info/',
    STATUTORY: '/statutory/',
    FAMILY_DETAILS: '/family-details/',
    PRESENT_ADDRESS: '/present-address/',
    PERMANENT_ADDRESS: '/address/',
    BANK_DETAILS: '/bank-details/',
    DOCUMENTS_UPLOAD: '/api/documents/upload',
    BASIC_DETAILS: '/basic-details/',
    CONTACT_DETAILS: '/contact-details/',
    SUBMIT: '/onboarding/',
  },

  // Buddy / Mentor Program
  BUDDY_MENTOR: {
    DASHBOARD: '/buddy-mentor/dashboard',
    PROGRAMS: '/buddy-mentor/programs',
    PROGRAM: (id) => `/buddy-mentor/programs/${id}`,
    PROGRAM_PAIRINGS: (id) => `/buddy-mentor/programs/${id}/pairings`,
    PROGRAM_ANALYTICS: (id) => `/buddy-mentor/programs/${id}/analytics`,
    PAIRINGS: '/buddy-mentor/pairings',
    PAIRING: (id) => `/buddy-mentor/pairings/${id}`,
    AUTO_MATCH: '/buddy-mentor/pairings/auto-match',
    RULES: (programId) => `/buddy-mentor/programs/${programId}/rules`,
    RULE: (id) => `/buddy-mentor/rules/${id}`,
    FEEDBACK: '/buddy-mentor/feedback',
    PAIRING_FEEDBACK: (pairingId) => `/buddy-mentor/pairings/${pairingId}/feedback`,
    COMMUNICATIONS: '/buddy-mentor/communications',
    PAIRING_COMMUNICATIONS: (pairingId) => `/buddy-mentor/pairings/${pairingId}/communications`,
  },

  // Induction & Orientation
  INDUCTION: {
    STATS: '/api/induction/stats',
    PROGRAMS: '/api/induction/programs',
    PROGRAM: (id) => `/api/induction/programs/${id}`,
    PARTICIPANTS: '/api/induction/participants',
    PARTICIPANT: (id) => `/api/induction/participants/${id}`,
    PARTICIPANTS_BULK: '/api/induction/participants/bulk',
    ATTENDANCE: (id) => `/api/induction/participants/${id}/attendance`,
    BULK_ATTENDANCE: '/api/induction/participants/bulk-attendance',
    SESSIONS: '/api/induction/sessions',
    SESSION: (id) => `/api/induction/sessions/${id}`,
    POLICIES: '/api/induction/policies',
    POLICY: (id) => `/api/induction/policies/${id}`,
    ACKNOWLEDGE: (policyId, employeeId) => `/api/induction/policies/${policyId}/acknowledge/${employeeId}`,
  },

  // Probation Management
  PROBATION: {
    KPI: '/probation-management/kpi',
    EMPLOYEES: '/probation-management/employees',
    EMPLOYEE: (id) => `/probation-management/employees/${id}`,
    STATUS: (id) => `/probation-management/employees/${id}/status`,
    BULK_ACTION: '/probation-management/bulk-action',
    MILESTONE: (id) => `/probation-management/employees/${id}/milestone`,
    DEPARTMENTS: '/probation-management/departments',
    REPORTS: '/probation-management/reports',
  },

  // Background Verification
  BACKGROUND_VERIFICATION: {
    KPI: '/background-verification/kpi',
    LIST: '/background-verification',
    GET: (id) => `/background-verification/${id}`,
    CREATE: '/background-verification',
    UPDATE: (id) => `/background-verification/${id}`,
    DELETE: (id) => `/background-verification/${id}`,
    UPLOAD_DOC: (bgvId, docId) => `/background-verification/${bgvId}/documents/${docId}/upload`,
    EDUCATION: (bgvId) => `/background-verification/${bgvId}/education`,
    DELETE_EDUCATION: (bgvId, eduId) => `/background-verification/${bgvId}/education/${eduId}`,
    GUARDIAN: (bgvId) => `/background-verification/${bgvId}/guardian`,
    ADDRESS: (bgvId) => `/background-verification/${bgvId}/address`,
    SEND_EMAIL: (bgvId) => `/background-verification/${bgvId}/send-email`,
  },

  // Offer Letters (distinct from OFFERS templates/tracking above)
  OFFER_LETTERS: {
    KPI: '/offer-letters/kpi',
    TAB_COUNTS: '/offer-letters/tab-counts',
    ANALYTICS: '/offer-letters/analytics',
    EXPORT: '/offer-letters/export',
    BULK_ACTION: '/offer-letters/bulk-action',
    LIST: '/offer-letters',
    GET: (id) => `/offer-letters/${id}`,
    CREATE: '/offer-letters',
    UPDATE: (id) => `/offer-letters/${id}`,
    ACTION: (id) => `/offer-letters/${id}/action`,
    SEND_EMAIL: (id) => `/offer-letters/${id}/send-email`,
    DUPLICATE: (id) => `/offer-letters/${id}/duplicate`,
    DELETE: (id) => `/offer-letters/${id}`,
  },

  // Onboarding candidate invites (admin side, self-onboarding link generator)
  ONBOARDING_CANDIDATE_INVITES: {
    LIST: '/api/onboarding-forms/candidates/',
    GET: (id) => `/api/onboarding-forms/candidates/${id}`,
    CREATE: '/api/onboarding-forms/candidates/',
    UPDATE: (id) => `/api/onboarding-forms/candidates/${id}`,
    APPROVE: (id) => `/api/onboarding-forms/candidates/${id}/approve`,
    REJECT: (id) => `/api/onboarding-forms/candidates/${id}/reject`,
    CONVERT_TO_EMPLOYEE: (id) => `/api/onboarding-forms/candidates/${id}/convert-to-employee`,
    DELETE: (id) => `/api/onboarding-forms/candidates/${id}`,
  },

  // Employees (used by onboarding for reporting-manager dropdown etc.)
  EMPLOYEES: {
    LIST: '/employees',
    MANAGERS: '/employees/managers',
    CREATE: '/employees',
  },

  // Super Admin
  SUPER_ADMIN: {
    USERS: '/api/admin/superadmin/users',
    USER: (id) => `/api/admin/superadmin/users/${id}`,
    ROLES: '/api/super-admin/roles/',
    ROLE: (id) => `/api/super-admin/roles/${id}`,
    ROLE_BULK_ASSIGN: '/api/super-admin/roles/assign/bulk',
    ROLE_ASSIGNMENTS_BY_ROLE: (roleId) => `/api/super-admin/roles/assign/by-role/${roleId}`,
    ROLE_ASSIGNMENTS_BY_USER: (userId) => `/api/super-admin/roles/assign/by-user/${userId}`,
    ROLE_UNASSIGN: (assignmentId) => `/api/super-admin/roles/assign/${assignmentId}`,
    TENANTS: '/api/super-admin/tenants/',
    TENANT: (id) => `/api/super-admin/tenants/${id}`,
    TENANT_LOCATIONS: (id) => `/api/super-admin/tenants/${id}/locations`,
    COMPANY_SETTINGS: '/api/super-admin/company-settings/',
    COMPANY_SETTINGS_ITEM: (id) => `/api/super-admin/company-settings/${id}`,
  },

  // Integrations (toggle-state only — NOT real OAuth connections, see backend note)
  INTEGRATIONS: {
    LIST: '/integrations/',
    CONNECT: (id) => `/integrations/${id}/connect`,
    DISCONNECT: (id) => `/integrations/${id}/disconnect`,
  },

  // Company Settings — Profile (requires admin/hr_admin auth; current_user.tenant_id, added to User model, scopes the record)
  COMPANY_PROFILE: {
    GET: '/company-settings/profile/',
    CREATE: '/company-settings/profile/',
    UPDATE: '/company-settings/profile/',
    DELETE: '/company-settings/profile/',
  },

  // Billing / Subscriptions (records plan choice only — no payment gateway wired up)
  BILLING: {
    SUBSCRIBE: '/subscriptions/',
    BY_EMAIL: (email) => `/subscriptions/by-email/${encodeURIComponent(email)}`,
  },

  // HR Automation
  HR: {
    ATTENDANCE: '/api/attendance',
    LEAVE: '/api/leave',
    LEAVE_APPROVE: (id) => `/api/leave/${id}/approve`,
    LEAVE_REJECT: (id) => `/api/leave/${id}/reject`,
    TASKS: '/api/tasks',
    TASK: (id) => `/api/tasks/${id}`,
    ONBOARDING_CANDIDATES: '/api/candidates',
    UPLOAD_DOCUMENT: (id) => `/api/uploads/${id}`,
  },
  
  // Resume Parsing & AI Screening
  RESUME: {
    PARSE: '/api/resume/parse',
    MATCH: '/api/resume/match',
    PROCESS: '/api/resume/process',      // AI screening endpoint
    CANDIDATES: '/api/resume/candidates', // Get AI-screened candidates
  },
  
  // Admin
  ADMIN: {
    USERS: '/api/admin/users',
    USER: (id) => `/api/admin/users/${id}`,
    SUMMARY: '/api/admin/superadmin/summary',
  },
  
  //Productivity
  PRODUCTIVITY: {
    SUMMARY: '/api/productivity/productivity/summary',
    EMPLOYEE: (employeeId) => `/api/productivity/productivity/employee/${employeeId}`,
    ORG_OVERVIEW: '/api/productivity/admin/productivity/overview',
    TEAM_SUMMARY: (teamId) => `/api/productivity/admin/productivity/team/${teamId}`,
    DEPARTMENT_SUMMARY: (deptId) => `/api/productivity/admin/productivity/department/${deptId}`,
    PROJECTS: '/api/productivity/projectmanagement',
    TASKS: '/api/productivity/taskmanagement',
    TIME_TRACKING_OVERVIEW: (period) => `/api/productivity/time-tracking/overview?period=${period}`,
    TIME_TRACKING_ENTRIES: (period, projectId) => `/api/productivity/time-tracking/entries?period=${period}${projectId ? `&project_id=${projectId}` : ''}`,
    ADMIN_MONITORING: (page, limit, employeeId) => `/api/productivity/admin/monitoring?page=${page}&limit=${limit}${employeeId ? `&employee_id=${employeeId}` : ''}`,
  },

  // Offers
  OFFERS: {
    TEMPLATES: '/api/offers/offer-templates',
    TEMPLATE: (id) => `/api/offers/offer-templates/${id}`,
    TRACKING: '/api/offers/offer-tracking',
    TRACKING_ITEM: (id) => `/api/offers/offer-tracking/${id}`,
    UPDATE_STATUS: (id) => `/api/offers/offer-tracking/${id}/status`,
    STATS: '/api/offers/offer-tracking/stats',
  },

  // Email
  EMAIL: {
    SEND: '/api/send-email',
    SEND_BULK: '/api/send-bulk-email',
    SEND_ASSESSMENT: '/api/send-assessment-email',
  },

  // Asset Management (HR Operations)
  ASSETS: {
    LIST: '/assets',
    CREATE: '/assets',
    GET: (id) => `/assets/${id}`,
    UPDATE: (id) => `/assets/${id}`,
    DELETE: (id) => `/assets/${id}`,
  },
  ASSET_ALLOCATIONS: {
    LIST: '/asset-allocations',
    CREATE: '/asset-allocations',
    GET: (id) => `/asset-allocations/${id}`,
  },
  ASSET_RETURNS: {
    LIST: '/asset-returns',
    CREATE: '/asset-returns',
    GET: (id) => `/asset-returns/${id}`,
  },
  ASSET_MAINTENANCES: {
    LIST: '/asset-maintenances',
    CREATE: '/asset-maintenances',
    GET: (id) => `/asset-maintenances/${id}`,
  },
  ASSET_INSURANCES: {
    LIST: '/asset-insurances',
    GET: (policy_id) => `/asset-insurances/${policy_id}`,
    CREATE: '/asset-insurances',
    DELETE: (policy_id) => `/asset-insurances/${policy_id}`,
  },

  // Company Settings
  COMPANY_SETTINGS: {
    PROFILE: {
      GET: '/company-profile',
      CREATE: '/company-profile',
      UPDATE: (id) => `/company-profile/${id}`,
      DELETE: (id) => `/company-profile/${id}`,
    },
    CURRENCY: {
      SETTINGS: {
        GET: '/currency/settings',
        SAVE: '/currency/settings',
      },
      RATES: {
        LIST: '/currency/rate',
        CREATE: '/currency/rate',
        UPDATE: (id) => `/currency/rate/${id}`,
        DELETE: (id) => `/currency/rate/${id}`,
      },
    },
    FINANCIAL_YEAR: {
      GET: '/financial-year/current',
      SAVE: '/financial-year',
    },
    LOCALIZATION: {
      GET: '/localization',
      SAVE: '/localization',
    },
    POLICIES: {
      LIST: '/policies',
      GET: (id) => `/policies/${id}`,
      CREATE: '/policies',
      UPDATE: (id) => `/policies/${id}`,
      DELETE: (id) => `/policies/${id}`,
    },
  },

  // Test endpoint
  TEST: '/api/test',
};

// Helper function to build full URL
export const buildUrl = (endpoint) => {
  return `${BASE_URL}${endpoint}`;
};

const apiConfig = {
  BASE_URL,
  API_ENDPOINTS,
  buildUrl,
};

export default apiConfig;