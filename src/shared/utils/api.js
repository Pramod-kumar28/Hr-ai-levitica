// API Utility for Backend Communication
import { BASE_URL } from "../constants/api.config";
import { getSelectedBranchId } from "./branch";

// Get JWT token from localStorage
const getToken = () => localStorage.getItem('token');

// Generic API call function with error handling
export const apiCall = async (endpoint, options = {}) => {
  const token = getToken();
  const branchId = getSelectedBranchId();
  
  const config = {
    ...options,
    headers: {
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` }),
      // Optional branch filter for the 'company'/'superadmin' branch
      // selector. Backend ignores this header entirely for 'admin' users —
      // they're always forced to their own branch server-side regardless
      // of what's sent here (see get_current_location_id).
      ...(branchId && { 'X-Location-Id': branchId })
    }
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    // Handle successful responses
    if (response.ok) {
      // 204 No Content (e.g. DELETE) has no body - do not call .json()
      if (response.status === 204) {
        return null;
      }
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (!text || !text.trim()) return null;
        try {
          return JSON.parse(text);
        } catch (_) {
          return null;
        }
      }
      // Non-JSON success response (PDF/Excel/zip/CSV file downloads etc.) —
      // return the actual blob rather than discarding it. Previously this
      // branch returned null unconditionally, which silently broke every
      // file-download endpoint in the app (bulk-download, exports, print
      // reports, ...): the request succeeded but the caller got nothing.
      if (contentType && contentType.includes('text/')) {
        return await response.text();
      }
      return await response.blob();
    } else {
      // Handle error responses
      const errorData = await response.json().catch(() => ({}));
      let message = errorData.message || `API Error: ${response.status} ${response.statusText}`;
      const detail = errorData.detail;
      if (detail != null) {
        if (typeof detail === 'string') {
          message = detail;
        } else if (Array.isArray(detail)) {
          message = detail.map((d) => (d && d.msg) ? `${d.msg}${d.loc && d.loc.length ? ` (${d.loc.join('.')})` : ''}` : String(d)).filter(Boolean).join('; ') || message;
        } else if (typeof detail === 'object') {
          message = JSON.stringify(detail);
        }
      }
      throw new Error(message);
    }
  } catch (err) {
    console.error('API Call Error:', err);
    // If it's a network error, provide more helpful message
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(`Failed to connect to backend at ${BASE_URL}. Please ensure the backend server is running.`);
    }
    throw err;
  }
};

// ==========================================
// AUTHENTICATION APIs
// ==========================================
export const authAPI = {
  // Login
  login: (email, password) => 
    apiCall('/api/auth/login-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }),

  // Signup
  signup: (userData) => 
    apiCall('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }),

  // Get current user
  getCurrentUser: () => 
    apiCall('/api/auth/me'),

  // Forgot password
  forgotPassword: (email) => 
    apiCall('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }),

  // Reset password
  resetPassword: (token, newPassword) => 
    apiCall('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword })
    })
};

// ==========================================
// JOB APIs
// ==========================================
export const jobAPI = {
  // Create job (with file upload)
  create: (formData) => 
    apiCall('/api/jobs/create', {
      method: 'POST',
      body: formData // FormData for file upload
    }),

  // List all jobs
  list: () => 
    apiCall('/api/jobs/list'),

  // Get job by ID
  getById: (id) => 
    apiCall(`/api/jobs/${id}`),

  // Update job
  update: (id, formData) =>
  apiCall(`/api/jobs/update/${id}`, {
    method: 'PUT',
    body: formData
  }),

  // Delete job
  delete: (id) => 
    apiCall(`/api/jobs/delete/${id}`, {
      method: 'DELETE'
    }),

  // Search jobs
  search: (query) => 
    apiCall(`/api/jobs/search?q=${encodeURIComponent(query)}`)
};

// ==========================================
// ASSET MANAGEMENT APIs (HR Operations)
// ==========================================
export const assetsAPI = {
  // Assets
  listAssets: () => apiCall('/assets'),
  getAsset: (id) => apiCall(`/assets/${id}`),
  createAsset: (data) =>
    apiCall('/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updateAsset: (id, data) =>
    apiCall(`/assets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteAsset: (id) =>
    apiCall(`/assets/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id),
    }),

  // Allocations
  listAllocations: () => apiCall('/asset-allocations'),
  createAllocation: (data) =>
    apiCall('/asset-allocations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // Returns
  listReturns: () => apiCall('/asset-returns'),
  createReturn: (data) =>
    apiCall('/asset-returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // Maintenances
  listMaintenances: () => apiCall('/asset-maintenances'),
  createMaintenance: (data) =>
    apiCall('/asset-maintenances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // Insurance Policies (asset-insurances)
  listInsurances: () => apiCall('/asset-insurances'),
  getInsurance: (policy_id) => apiCall(`/asset-insurances/${policy_id}`),
  createInsurance: (data) =>
    apiCall('/asset-insurances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteInsurance: (policy_id) =>
    apiCall(`/asset-insurances/${policy_id}`, {
      method: 'DELETE',
    }),
};

// ==========================================
// CANDIDATE APIs
// ==========================================
export const candidateAPI = {
  // List all candidates
  list: () => 
    apiCall('/api/candidates/list'),

  // Get candidate by ID
  getById: (id) => 
    apiCall(`/api/candidates/${id}`),

  // Apply to job
  apply: (jobId, applicationData) => 
    apiCall(`/api/candidates/apply/${jobId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applicationData)
    }),

  // Get candidate profile
  getProfile: () => 
    apiCall('/api/candidates/profile'),

  // Update candidate profile
  updateProfile: (profileData) => 
    apiCall('/api/candidates/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    }),

  // Get job applications
  getApplications: () => 
    apiCall('/api/candidates/applications'),

  // Get saved jobs
  getSavedJobs: () => 
    apiCall('/api/candidates/saved-jobs'),

  // Save job
  saveJob: (jobId) => 
    apiCall(`/api/candidates/save-job/${jobId}`, {
      method: 'POST'
    })
};

// ==========================================
// PIPELINE APIs
// ==========================================
export const pipelineAPI = {
  // Get pipeline stages
  getStages: () => 
    apiCall('/api/pipeline/stages'),

  // Create stage
  createStage: (stageName, order) => 
    apiCall('/api/pipeline/stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: stageName, order })
    }),

  // Update stage
  updateStage: (stageId, stageData) => 
    apiCall(`/api/pipeline/stages/${stageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stageData)
    }),

  // Delete stage
  deleteStage: (stageId) => 
    apiCall(`/api/pipeline/stages/${stageId}`, {
      method: 'DELETE'
    }),

  // Get candidates in pipeline
  getCandidates: (jobId) => 
    apiCall(`/api/pipeline/candidates?job_id=${jobId}`),

  // Move candidate to stage
  moveCandidate: (candidateId, stageId) => 
    apiCall(`/api/pipeline/candidates/${candidateId}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: stageId })
    })
};

// ==========================================
// ANALYTICS APIs
// ==========================================
export const analyticsAPI = {
  // Get hiring funnel data
  getHiringFunnel: () => 
    apiCall('/api/hiring_funnel/'),

  // Get time to hire metrics
  getTimeToHire: () => 
    apiCall('/api/hiring_funnel/time-to-hire'),

  // Get recruiter dashboard stats
  getRecruiterStats: () => 
    apiCall('/api/recruiter_dashboard/analytics'),

  // Get applications over time
  getApplicationsOverTime: (days = 30) => 
    apiCall(`/api/recruiter_dashboard/analytics/applications-over-time?days=${days}`),

  // ==========================================
  // CRM ANALYTICS APIs
  // ==========================================
  // Get all deals (for analytics)
  getDeals: (q = null) => {
    const url = q ? `/analytics/deals?q=${encodeURIComponent(q)}` : '/analytics/deals';
    return apiCall(url);
  },

  // Get deal by ID (for analytics)
  getDeal: (id) =>
    apiCall(`/analytics/deals/${id}`),

  // Get all leads (for analytics)
  getLeads: (skip = 0, limit = 100) =>
    apiCall(`/analytics/leads?skip=${skip}&limit=${limit}`),

  // Get lead by ID (for analytics)
  getLead: (id) =>
    apiCall(`/analytics/leads/${id}`),

  // Get recent contacts
  getRecentContacts: (limit = 10) =>
    apiCall(`/analytics/recent-contacts?limit=${limit}`),

  // Get recent companies
  getRecentCompanies: (limit = 10) =>
    apiCall(`/analytics/recent-companies?limit=${limit}`),

  // Get all activities (for analytics)
  getActivities: (skip = 0, limit = 100) =>
    apiCall(`/analytics/activities?skip=${skip}&limit=${limit}`),

  // Get recent activities
  getRecentActivities: (limit = 10) =>
    apiCall(`/analytics/recent-activities?limit=${limit}`)
};

// ==========================================
// ASSESSMENT APIs
// ==========================================
export const assessmentAPI = {
  // List assessments
  list: () => 
    apiCall('/assessments'),

  // Create assessment
  create: (assessmentData) => 
    apiCall('/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assessmentData)
    }),

  // Get assessment by ID
  getById: (id) =>
    apiCall(`/assessments/${id}`),

  // Update assessment
  update: (id, assessmentData) =>
    apiCall(`/assessments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assessmentData)
    }),

  // Delete assessment
  delete: (id) =>
    apiCall(`/assessments/${id}`, {
      method: 'DELETE'
    }),

  // Assign assessment to candidate
  assign: (candidateId, assessmentId, dueDate) => 
    apiCall('/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_id: candidateId,
        assessment_id: assessmentId,
        due_date: dueDate
      })
    }),

  // List assignments
  listAssignments: () =>
    apiCall('/assignments'),

  // Resume screening preselected candidates (user-scoped)
  savePreselectedCandidates: (candidateIds = [], candidateEmails = []) =>
    apiCall('/assignments/preselect-candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_ids: candidateIds,
        candidate_emails: candidateEmails
      })
    }),

  getPreselectedCandidates: () =>
    apiCall('/assignments/preselect-candidates'),

  clearPreselectedCandidates: () =>
    apiCall('/assignments/preselect-candidates', {
      method: 'DELETE'
    }),

  // List assignments with actual completion status
  listAssignmentsWithStatus: () =>
    apiCall('/assignments/with-status'),

  // Get all assessment results directly from result tables
  getAllResults: () =>
    apiCall('/assignments/all-results'),

  // Get test results
  getTestResults: {
    // Get all aptitude test results
    aptitude: () =>
      apiCall('/api/assessment/aptitude/results/all'),
    
    // Get aptitude result by email
    aptitudeByEmail: (email) =>
      apiCall(`/api/assessment/aptitude/results/by-email/${email}`),
    
    // Get aptitude statistics
    aptitudeStats: () =>
      apiCall('/api/assessment/aptitude/results/statistics')
  },

  // Get assessment results
  getResults: (candidateId) => 
    apiCall(`/api/assessment_results/candidates/${candidateId}`),

  // Aptitude Test APIs
  aptitude: {
    sendOTP: (name, email) =>
      apiCall('/api/assessment/aptitude/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      }),
    
    verifyOTP: (email, otp) =>
      apiCall('/api/assessment/aptitude/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      }),
    
    getInstructions: (email = null) => {
      const url = email 
        ? `/api/assessment/aptitude/instructions?email=${encodeURIComponent(email)}`
        : '/api/assessment/aptitude/instructions';
      return apiCall(url);
    },
    
    startExam: (studentId, email) =>
      apiCall('/api/assessment/aptitude/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, email: email })
      }),
    
    submitExam: (studentId, answers) =>
      apiCall('/api/assessment/aptitude/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, answers })
      })
  },

  // Coding Test APIs
  coding: {
    sendOTP: (name, email) =>
      apiCall('/coding/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      }),
    
    verifyOTP: (email, otp) =>
      apiCall('/coding/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      }),
    
    getQuestions: () =>
      apiCall('/coding/questions'),
    
    runCode: (name, email, questionTitle, language, code) =>
      apiCall('/coding/run_code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, question_title: questionTitle, language, code })
      }),
    
    submitCode: (name, email, questionTitle, language, code) =>
      apiCall('/coding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, question_title: questionTitle, language, code })
      }),
    
    finalize: (name, email) =>
      apiCall('/coding/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      })
  },

  // Communication Test APIs
  communication: {
    sendOTP: (name, email) =>
      apiCall('/comm/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      }),
    
    verifyOTP: (email, otp) =>
      apiCall('/comm/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      }),
    
    getExam: (name, email) =>
      apiCall(`/comm/exam?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`),
    
    submit: (name, email, writingAnswer, listeningAnswer, mcqAnswers) =>
      apiCall('/comm/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          writing_answer: writingAnswer,
          listening_answer: listeningAnswer,
          mcq_answers: mcqAnswers
        })
      })
  }
};

// ==========================================
// AI INTERVIEW APIs
// ==========================================
export const aiInterviewAPI = {
  // Send OTP to candidate
  sendOTP: (email, name) => 
    apiCall('/api/interviews/send_otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name })
    }),

  // Verify OTP
  verifyOTP: (email, otp) => 
    apiCall('/api/interviews/verify_otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    }),

  // Get interview templates
  getTemplates: () => 
    apiCall('/api/interviews/templates'),

  // Get interview questions (from template)
  getQuestions: (templateId = null) => {
    const url = templateId 
      ? `/api/interviews/get_questions?template_id=${templateId}`
      : '/api/interviews/get_questions';
    return apiCall(url);
  },

  // Submit answer (FormData for video upload)
  submitAnswer: (formData) => 
    fetch(`${BASE_URL}/api/interviews/submit_answer`, {
      method: 'POST',
      body: formData
    }).then(res => {
      if (!res.ok) {
        return res.json().then(err => Promise.reject(err));
      }
      return res.json();
    }),

  // Get all interview results
  getResults: () => 
    apiCall('/api/interviews/results'),

  // Get specific candidate interview result
  getCandidateResult: (candidateId) => 
    apiCall(`/api/interviews/results/${candidateId}`)
};

// ==========================================
// HR AUTOMATION APIs
// ==========================================
export const hrAPI = {
  // Attendance
  attendance: {
    mark: (date, status) => 
      apiCall('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, status })
      }),
    
    list: () => 
      apiCall('/api/attendance')
  },

  // Leave Management
  leave: {
    request: (leaveData) => 
      apiCall('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveData)
      }),
    
    list: () => 
      apiCall('/api/leave'),
    
    approve: (leaveId) => 
      apiCall(`/api/leave/${leaveId}/approve`, {
        method: 'PATCH'
      }),
    
    reject: (leaveId) => 
      apiCall(`/api/leave/${leaveId}/reject`, {
        method: 'PATCH'
      })
  },

  // Tasks
  tasks: {
    create: (taskData) => 
      apiCall('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      }),
    
    list: () => 
      apiCall('/api/tasks'),
    
    update: (taskId, taskData) => 
      apiCall(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
  },

  // Onboarding
  onboarding: {
    getCandidates: () => 
      apiCall('/api/candidates'),
    
    uploadDocument: (candidateId, documentData) => 
      apiCall(`/api/uploads/${candidateId}`, {
        method: 'POST',
        body: documentData // FormData
      })
  }
};

// ==========================================
// BACKGROUND VERIFICATION (BGV) APIs
// ==========================================
export const bgvAPI = {
  // Get BGV KPI summary
  getKPI: () => apiCall('/background-verification/kpi'),

  // Get all BGV requests
  getRequests: (search = null, status = null, skip = 0, limit = 50) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status_filter', status);
    params.append('skip', skip);
    params.append('limit', limit);
    return apiCall(`/background-verification/?${params.toString()}`);
  },

  // Get single BGV request by ID
  getRequest: (id) => apiCall(`/background-verification/${id}`),

  // Create a BGV request
  createRequest: (data) =>
    apiCall('/background-verification/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Update a BGV request
  updateRequest: (id, data) =>
    apiCall(`/background-verification/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Delete a BGV request
  deleteRequest: (id) =>
    apiCall(`/background-verification/${id}`, {
      method: 'DELETE'
    }),

  // Upload a document for a BGV request
  uploadDocument: (bgvId, docId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiCall(`/background-verification/${bgvId}/documents/${docId}/upload`, {
      method: 'POST',
      body: formData
    });
  },

  // Add education record
  addEducation: (bgvId, data) =>
    apiCall(`/background-verification/${bgvId}/education`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Delete education record
  deleteEducation: (bgvId, eduId) =>
    apiCall(`/background-verification/${bgvId}/education/${eduId}`, {
      method: 'DELETE'
    }),

  // Save guardian details
  saveGuardian: (bgvId, data) =>
    apiCall(`/background-verification/${bgvId}/guardian`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Save address details
  saveAddress: (bgvId, data) =>
    apiCall(`/background-verification/${bgvId}/address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Send BGV email to candidate
  sendEmail: (bgvId) =>
    apiCall(`/background-verification/${bgvId}/send-email`, {
      method: 'POST'
    }),

  // ------------------------------------------------------------------
  // Employees eligible for BGV.
  // NOTE: There is no `/background-verification/employees` route on the
  // backend — BGV is tracked per-request (getRequests), not per-employee.
  // The employee pool itself lives at GET /api/employees/ and returns
  // { id, employeeId, name, email, phone, department, designation,
  //   location, employmentType, status, joinDate, salary } — a flat
  // `name`, not firstName/middleName/lastName. Callers should read
  // `name` / `email` / `joinDate` directly rather than assuming a split
  // name or an `officialEmail`/`joiningDate` field.
  // ------------------------------------------------------------------
  getEmployees: () => apiCall('/api/employees/'),

  // Create-or-update a BGV request. The backend has no single combined
  // "save" route — POST / creates (and accepts nested education/guardian/
  // current_address/permanent_address on create), PATCH /{id} updates a
  // flat subset of fields (including `status`). This picks the right
  // one based on whether the request already has a numeric backend id.
  // Extra fields the backend schema doesn't recognize (e.g. `documents`,
  // `experienceDetails`, `uploadedFiles`) are silently ignored by
  // Pydantic rather than rejected, but they are NOT persisted this way —
  // document uploads must go through uploadDocument(), and per-item
  // education/guardian/address edits after creation must go through
  // addEducation()/saveGuardian()/saveAddress().
  saveRequest: (request) => {
    const { id, ...rest } = request || {};
    if (id) {
      return apiCall(`/background-verification/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest)
      });
    }
    return apiCall('/background-verification/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rest)
    });
  },

  // Convenience wrapper: update just the status field of a BGV request.
  updateStatus: (bgvId, status) =>
    apiCall(`/background-verification/${bgvId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
};


// ==========================================
// RESUME PARSING API
// ==========================================
export const resumeAPI = {
  // Parse resume
  parse: (resumeFile) => {
    const formData = new FormData();
    formData.append('file', resumeFile);
    
    return apiCall('/api/resume/parse', {
      method: 'POST',
      body: formData
    });
  },

  // Match resume with job
  matchWithJob: (resumeId, jobId) => 
    apiCall('/api/resume/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_id: resumeId, job_id: jobId })
    })
};

// ==========================================
// COMPANY LOCATIONS (BRANCHES) API
// ==========================================
export const locationAPI = {
  // For 'company'/'superadmin' this returns every branch; for a branch-
  // locked 'admin' the backend already filters this down to just their own
  // branch (see routers/Company_Settings/location.py: list_locations).
  list: () => apiCall('/company-settings/locations/')
};

// ==========================================
// CRM ACTIVITIES API
// ==========================================
export const activitiesAPI = {
  // Get all activities
  list: (type = null) => {
    const url = type ? `/activities/?type=${type}` : '/activities/';
    return apiCall(url);
  },

  // Get activity by ID
  getById: (id) =>
    apiCall(`/activities/${id}`),

  // Create activity
  create: (activityData) =>
    apiCall('/activities/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityData)
    }),

  // Update activity
  update: (id, activityData) =>
    apiCall(`/activities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityData)
    }),

  // Delete activity
  delete: (id) =>
    apiCall(`/activities/${id}`, {
      method: 'DELETE'
    }),

  // Delete multiple activities (if backend supports it, otherwise delete one by one)
  deleteMultiple: (ids) => {
    // Backend doesn't have delete-multiple endpoint, so delete one by one
    return Promise.all(ids.map(id => apiCall(`/activities/${id}`, { method: 'DELETE' })));
  }
};

// ==========================================
// CRM CONTACTS API
// ==========================================
export const contactsAPI = {
  // Get all contacts
  list: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.company) params.append('company', filters.company);
    if (filters.industry) params.append('industry', filters.industry);
    if (filters.owner) params.append('owner', filters.owner);
    const queryString = params.toString();
    const url = queryString ? `/contacts/?${queryString}` : '/contacts/';
    return apiCall(url);
  },

  // Get contact by ID
  getById: (id) =>
    apiCall(`/contacts/${id}`),

  // Create contact
  create: (contactData) =>
    apiCall('/contacts/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData)
    }),

  // Update contact
  update: (id, contactData) =>
    apiCall(`/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData)
    }),

  // Delete contact
  delete: (id) =>
    apiCall(`/contacts/${id}`, {
      method: 'DELETE'
    }),

  // Delete multiple contacts (if backend supports it, otherwise delete one by one)
  deleteMultiple: (ids) => {
    // Backend doesn't have delete-multiple endpoint, so delete one by one
    return Promise.all(ids.map(id => apiCall(`/contacts/${id}`, { method: 'DELETE' })));
  },

  // Upload profile photo
  uploadProfilePhoto: async (contactId, file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const config = {
      method: 'PUT',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
        // Don't set Content-Type, let browser set it with boundary for FormData
      },
      body: formData
    };

    try {
      const response = await fetch(`${BASE_URL}/contacts/${contactId}/profile-photo`, config);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        }
        return null;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.status}`);
      }
    } catch (err) {
      console.error('API Call Error:', err);
      throw err;
    }
  }
};

// ==========================================
// CRM LEADS API
// ==========================================
export const leadsAPI = {
  // Get all leads
  list: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.company) params.append('company', filters.company);
    if (filters.owner) params.append('owner', filters.owner);
    const queryString = params.toString();
    const url = queryString ? `/api/leads/?${queryString}` : '/api/leads/';
    return apiCall(url);
  },

  // Get lead by ID
  getById: (id) =>
    apiCall(`/api/leads/${id}`),

  // Create lead
  create: (leadData) =>
    apiCall('/api/leads/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    }),

  // Update lead
  update: (id, leadData) =>
    apiCall(`/api/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    }),

  // Delete lead
  delete: (id) =>
    apiCall(`/api/leads/${id}`, {
      method: 'DELETE'
    })
};

// ==========================================
// CRM DEALS API
// ==========================================
export const dealsAPI = {
  // Get all deals
  list: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.stage) params.append('stage', filters.stage);
    if (filters.owner) params.append('owner', filters.owner);
    if (filters.q) params.append('q', filters.q); // Search query
    const queryString = params.toString();
    const url = queryString ? `/deals/?${queryString}` : '/deals/';
    return apiCall(url);
  },

  // Get deal by ID
  getById: (id) =>
    apiCall(`/deals/${id}`),

  // Create deal
  create: (dealData) =>
    apiCall('/deals/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dealData)
    }),

  // Update deal (backend uses PATCH, not PUT)
  update: (id, dealData) =>
    apiCall(`/deals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dealData)
    }),

  // Delete deal
  delete: (id) =>
    apiCall(`/deals/${id}`, {
      method: 'DELETE'
    })
};

// ==========================================
// CRM COMPANIES API
// ==========================================
export const companiesAPI = {
  // Get all companies
  list: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.industry) params.append('industry', filters.industry);
    if (filters.owner) params.append('owner', filters.owner);
    const queryString = params.toString();
    const url = queryString ? `/companies/?${queryString}` : '/companies/';
    return apiCall(url);
  },

  // Get company by ID
  getById: (id) =>
    apiCall(`/companies/${id}`),

  // Create company (backend uses FormData, not JSON)
  create: (companyData, logoFile = null) => {
    const formData = new FormData();
    
    // Append all company fields to FormData
    Object.keys(companyData).forEach(key => {
      if (companyData[key] !== null && companyData[key] !== undefined) {
        if (key === 'tags' && Array.isArray(companyData[key])) {
          // Convert tags array to comma-separated string
          formData.append(key, companyData[key].join(','));
        } else {
          formData.append(key, companyData[key]);
        }
      }
    });
    
    // Append logo file if provided
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    
    return fetch(`${BASE_URL}/companies/`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type header - browser will set it with boundary for FormData
        ...(getToken() && { 'Authorization': `Bearer ${getToken()}` })
      }
    }).then(async (response) => {
      if (response.ok) {
        return await response.json();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.status}`);
      }
    });
  },

  // Update company (backend uses FormData, not JSON)
  update: (id, companyData, logoFile = null) => {
    const formData = new FormData();
    
    // Append all company fields to FormData
    Object.keys(companyData).forEach(key => {
      if (companyData[key] !== null && companyData[key] !== undefined) {
        if (key === 'tags' && Array.isArray(companyData[key])) {
          // Convert tags array to comma-separated string
          formData.append(key, companyData[key].join(','));
        } else {
          formData.append(key, companyData[key]);
        }
      }
    });
    
    // Append logo file if provided
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    
    return fetch(`${BASE_URL}/companies/${id}`, {
      method: 'PUT',
      body: formData,
      headers: {
        // Don't set Content-Type header - browser will set it with boundary for FormData
        ...(getToken() && { 'Authorization': `Bearer ${getToken()}` })
      }
    }).then(async (response) => {
      if (response.ok) {
        return await response.json();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.status}`);
      }
    });
  },

  // Delete company
  delete: (id) =>
    apiCall(`/companies/${id}`, {
      method: 'DELETE'
    }),

  // Upload company logo
  uploadLogo: async (companyId, file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const config = {
      method: 'PUT',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
        // Don't set Content-Type, let browser set it with boundary for FormData
      },
      body: formData
    };

    try {
      const response = await fetch(`${BASE_URL}/companies/${companyId}/logo`, config);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        }
        return null;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.status}`);
      }
    } catch (err) {
      console.error('API Call Error:', err);
      throw err;
    }
  }
};

// ==========================================
// CRM PIPELINES API
// ==========================================
export const crmPipelinesAPI = {
  // Get all pipelines
  list: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.stage) params.append('stage', filters.stage);
    const queryString = params.toString();
    const url = queryString ? `/pipelines/?${queryString}` : '/pipelines/';
    return apiCall(url);
  },

  // Get pipeline by ID
  getById: (id) =>
    apiCall(`/pipelines/${id}`),

  // Create pipeline
  create: (pipelineData) =>
    apiCall('/pipelines/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pipelineData)
    }),

  // Update pipeline
  update: (id, pipelineData) =>
    apiCall(`/pipelines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pipelineData)
    }),

  // Delete pipeline
  delete: (id) =>
    apiCall(`/pipelines/${id}`, {
      method: 'DELETE'
    })
};

// ==========================================
// ADMIN APIs
// ==========================================
export const adminAPI = {
  // Compatibility users list: preferred legacy path, then current API path
  listUsersCompat: async () => {
    try {
      const legacyUsers = await apiCall('/admin/user/list');
      if (Array.isArray(legacyUsers)) return legacyUsers;
    } catch (_) {
      // Fallback to current API contract
    }
    return apiCall('/api/admin/superadmin/users');
  },

  // Get all users
  getUsers: () => 
    apiCall('/api/admin/users'),

  // Get system summary
  getSummary: () => 
    apiCall('/api/admin/superadmin/summary'),

  // Create user
  createUser: (userData) => 
    apiCall('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }),

  // Update user
  updateUser: (userId, userData) => 
    apiCall(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }),

  // Delete user
  deleteUser: (userId) => 
    apiCall(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    })
};

// ==========================================
// ATTENDANCE APIs
// ==========================================

export const attendanceAPI = {
  // Basic attendance (routers/.../attendance.py — kept for whatever
  // originally used it)
  list: () => apiCall("/api/attendance/"),
  getById: (id) => apiCall(`/api/attendance/${id}`),
  create: (data) =>
    apiCall("/api/attendance/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiCall(`/api/attendance/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  delete: (id) => apiCall(`/api/attendance/${id}`, { method: "DELETE" }),
  checkIn: (data) =>
    apiCall("/api/attendance/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  checkOut: (data) =>
    apiCall("/api/attendance/check-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  // Daily Punches (routers/HR_Automation/attendance/routers/daily_punches.py)
  // — matches the filter set used by DailyPunches.jsx / DailyAttendance.jsx
  // exactly (business unit/location/cost center/department/late/absent/
  // no-punches). THIS was the missing piece causing "daily punch not
  // getting" — these methods didn't exist on attendanceAPI in this upload
  // at all, so every call from DailyPunches.jsx threw a TypeError.
  listDailyPunches: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/api/attendance/daily-punches/list${qs ? `?${qs}` : ''}`);
  },
  getPunchFilterOptions: () => apiCall('/api/attendance/daily-punches/filter-options'),
  getEmployeePunches: (employeeId, punchDate) =>
    apiCall(`/api/attendance/daily-punches/employee/${employeeId}?punch_date=${punchDate}`),
  recordPunch: (data) => apiCall('/api/attendance/daily-punches/punches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  addManualPunch: (data) => apiCall('/api/attendance/daily-punches/manual-punch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updatePunch: (punchId, data) => apiCall(`/api/attendance/daily-punches/punches/${punchId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deletePunch: (punchId) => apiCall(`/api/attendance/daily-punches/punches/${punchId}`, { method: 'DELETE' }),
  regularisePunch: (data) => apiCall('/api/attendance/daily-punches/regularise', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  markProcessed: (summaryIds) => apiCall('/api/attendance/daily-punches/mark-processed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(summaryIds) }),
  exportDailyPunchesUrl: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return `${BASE_URL}/api/attendance/daily-punches/export${qs ? `?${qs}` : ''}`;
  },

  // Attendance Capture & Tracking (routers/.../attendance_capture.py, mounted at /api/attendance/capture)
  getDashboardSummary: () => apiCall('/api/attendance/capture/dashboard/summary'),

  // Biometric devices
  listDevices: (activeOnly = false) => apiCall(`/api/attendance/capture/biometric/devices${activeOnly ? '?active_only=true' : ''}`),
  getDevice: (id) => apiCall(`/api/attendance/capture/biometric/devices/${id}`),
  addDevice: (data) => apiCall('/api/attendance/capture/biometric/devices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateDevice: (id, data) => apiCall(`/api/attendance/capture/biometric/devices/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteDevice: (id) => apiCall(`/api/attendance/capture/biometric/devices/${id}`, { method: 'DELETE' }),
  syncDevice: (id) => apiCall(`/api/attendance/capture/biometric/devices/${id}/sync`, { method: 'POST' }),
  syncAllDevices: () => apiCall('/api/attendance/capture/biometric/sync-all', { method: 'POST' }),
  reconnectOfflineDevices: () => apiCall('/api/attendance/capture/biometric/reconnect-offline', { method: 'POST' }),
  getSyncLogs: (deviceId, limit = 20) => apiCall(`/api/attendance/capture/biometric/sync-logs?${deviceId ? `device_id=${deviceId}&` : ''}limit=${limit}`),
  simulateBiometricPunch: (data) => apiCall('/api/attendance/capture/biometric/simulate-punch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getPunchStatistics: (employeeId) => apiCall(`/api/attendance/capture/biometric/punch-stats/${employeeId}`),

  // GPS / Geo-fencing
  listGeoFences: (activeOnly = true) => apiCall(`/api/attendance/capture/gps/geo-fences?active_only=${activeOnly}`),
  addGeoFence: (data) => apiCall('/api/attendance/capture/gps/geo-fences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateGeoFence: (id, data) => apiCall(`/api/attendance/capture/gps/geo-fences/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteGeoFence: (id) => apiCall(`/api/attendance/capture/gps/geo-fences/${id}`, { method: 'DELETE' }),
  gpsCheckIn: (data) => apiCall('/api/attendance/capture/gps/check-in', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getGpsStatistics: (employeeId) => apiCall(`/api/attendance/capture/gps/statistics${employeeId ? `?employee_id=${employeeId}` : ''}`),
  getGpsRecentActivity: (limit = 20) => apiCall(`/api/attendance/capture/gps/recent-activity?limit=${limit}`),

  // Web portal check-in / IP whitelist
  listIpWhitelist: () => apiCall('/api/attendance/capture/web/ip-whitelist'),
  addIpWhitelist: (data) => apiCall('/api/attendance/capture/web/ip-whitelist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  removeIpWhitelist: (id) => apiCall(`/api/attendance/capture/web/ip-whitelist/${id}`, { method: 'DELETE' }),
  checkMyIp: () => apiCall('/api/attendance/capture/web/check-ip'),
  webCheckIn: (data) => apiCall('/api/attendance/capture/web/check-in', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  markWfh: (employeeId, workDate) => apiCall(`/api/attendance/capture/web/mark-wfh?employee_id=${employeeId}${workDate ? `&work_date=${workDate}` : ''}`, { method: 'POST' }),
  getWebRecentActivity: (limit = 20) => apiCall(`/api/attendance/capture/web/recent-activity?limit=${limit}`),

  // Daily attendance (capture-scoped view) + settings
  getCaptureDailyAttendance: (employeeId, attDate) => {
    const params = new URLSearchParams();
    if (employeeId) params.set('employee_id', employeeId);
    if (attDate) params.set('att_date', attDate);
    return apiCall(`/api/attendance/capture/daily${params.toString() ? `?${params}` : ''}`);
  },
  getCaptureTodayAttendance: () => apiCall('/api/attendance/capture/daily/today'),
  getAttendanceSettings: () => apiCall('/api/attendance/capture/settings'),
  updateAttendanceSettings: (data) => apiCall('/api/attendance/capture/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  resetAttendanceSettings: () => apiCall('/api/attendance/capture/settings/reset', { method: 'POST' }),

  // Bulk CSV upload (routers/.../daily_attendance.py). NOTE: this router is
  // mounted at /api/attendance with an internal prefix of /attendance/daily
  // too, so the real final path really does double up "attendance" — not
  // a typo here, matches the backend as written.
  bulkUploadAttendance: (rows) => apiCall('/api/attendance/attendance/daily/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }) }),

  // Monthly Attendance (routers/.../monthly_attendance.py — also double-
  // prefixed the same way daily_attendance.py is: mounted at /api/attendance
  // with an internal prefix of /attendance/monthly).
  getMonthlyFilterOptions: () => apiCall('/api/attendance/attendance/monthly/filter-options'),
  getMonthlyCalendar: (employeeId, month, year) => apiCall(`/api/attendance/attendance/monthly/calendar?employee_id=${employeeId}&month=${month}&year=${year}`),
  listMonthlyCalendars: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/api/attendance/attendance/monthly/calendars?${qs}`);
  },
  replaceMonthlyDay: (employeeId, attDate, data) => apiCall(`/api/attendance/attendance/monthly/${employeeId}/replace?att_date=${attDate}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  recalculateMonthly: (employeeId, month, year) => apiCall(`/api/attendance/attendance/monthly/${employeeId}/recalculate?month=${month}&year=${year}`, { method: 'POST' }),
  downloadMonthlyCsvUrl: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return `${BASE_URL}/api/attendance/attendance/monthly/download?${qs}`;
  },


  // Shift Management (routers/.../shift_management.py, mounted at
  // /api/attendance with internal prefix /shifts)
  listShifts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/api/attendance/shifts/${qs ? `?${qs}` : ''}`);
  },
  getShift: (id) => apiCall(`/api/attendance/shifts/${id}`),
  createShift: (data) => apiCall('/api/attendance/shifts/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateShift: (id, data) => apiCall(`/api/attendance/shifts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteShift: (id) => apiCall(`/api/attendance/shifts/${id}`, { method: 'DELETE' }),
 
  assignShiftIndividual: (data) => apiCall('/api/attendance/shifts/assignments/individual', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  assignShiftBulk: (data) => apiCall('/api/attendance/shifts/assignments/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listShiftAssignments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/api/attendance/shifts/assignments${qs ? `?${qs}` : ''}`);
  },
  updateShiftAssignment: (id, data) => apiCall(`/api/attendance/shifts/assignments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteShiftAssignment: (id) => apiCall(`/api/attendance/shifts/assignments/${id}`, { method: 'DELETE' }),
 
  generateRoster: (data) => apiCall('/api/attendance/shifts/rosters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listRosters: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/api/attendance/shifts/rosters${qs ? `?${qs}` : ''}`);
  },
  updateRoster: (id, data) => apiCall(`/api/attendance/shifts/rosters/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteRoster: (id) => apiCall(`/api/attendance/shifts/rosters/${id}`, { method: 'DELETE' }),
 
  createShiftSwap: (data) => apiCall('/api/attendance/shifts/swaps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listShiftSwaps: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/api/attendance/shifts/swaps${qs ? `?${qs}` : ''}`);
  },
  updateShiftSwap: (id, data) => apiCall(`/api/attendance/shifts/swaps/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteShiftSwap: (id) => apiCall(`/api/attendance/shifts/swaps/${id}`, { method: 'DELETE' }),
 
  createFlexibleArrangement: (data) => apiCall('/api/attendance/shifts/flexible', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listFlexibleArrangements: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/api/attendance/shifts/flexible${qs ? `?${qs}` : ''}`);
  },
  updateFlexibleArrangement: (id, data) => apiCall(`/api/attendance/shifts/flexible/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteFlexibleArrangement: (id) => apiCall(`/api/attendance/shifts/flexible/${id}`, { method: 'DELETE' }),
 
  getShiftNotifications: () => apiCall('/api/attendance/shifts/notifications'),
  getEmployeesForShiftAssignment: () => apiCall('/api/attendance/shifts/employees-list'),
 
  // Work Hour Rules — standalone router (routers/.../work_hour_rules.py,
  // mounted at /api/attendance with internal prefix /work-hour-rules).
  // NOTE: shift_management.py ALSO exposes a work-hour-rules endpoint at
  // /api/attendance/shifts/work-hour-rules (a simpler config-only GET/PUT).
  // This standalone router is the richer one (full CRUD + per-tab PATCH +
  // stats) and is the better match for a dedicated WorkHourRules.jsx page.
  createWorkHourRule: (data) => apiCall('/api/attendance/work-hour-rules/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listWorkHourRules: (activeOnly = true) => apiCall(`/api/attendance/work-hour-rules/?active_only=${activeOnly}`),
  getActiveWorkHourPolicy: () => apiCall('/api/attendance/work-hour-rules/active'),
  getWorkHourRule: (id) => apiCall(`/api/attendance/work-hour-rules/${id}`),
  updateWorkHourRule: (id, data) => apiCall(`/api/attendance/work-hour-rules/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteWorkHourRule: (id) => apiCall(`/api/attendance/work-hour-rules/${id}`, { method: 'DELETE' }),
  updateWorkHourAttendanceTab: (id, data) => apiCall(`/api/attendance/work-hour-rules/${id}/attendance`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateWorkHourOvertimeTab: (id, data) => apiCall(`/api/attendance/work-hour-rules/${id}/overtime`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateWorkHourBreaksTab: (id, data) => apiCall(`/api/attendance/work-hour-rules/${id}/breaks`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateWorkHourSettingsTab: (id, data) => apiCall(`/api/attendance/work-hour-rules/${id}/settings`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getWorkHourAttendanceStats: (ruleId) => apiCall(`/api/attendance/work-hour-rules/stats/attendance${ruleId ? `?rule_id=${ruleId}` : ''}`),
  getWorkHourOvertimeStats: (ruleId) => apiCall(`/api/attendance/work-hour-rules/stats/overtime${ruleId ? `?rule_id=${ruleId}` : ''}`),
  getWorkHourStorageUsage: () => apiCall('/api/attendance/work-hour-rules/stats/storage'),


  getHolidayTabSummary: () => apiCall('/api/attendance/holiday-calendar/tab-summary'),
  checkTodayHoliday: () => apiCall('/api/attendance/holiday-calendar/quick-actions/today'),

  applyOptionalHoliday: (data) => apiCall('/api/attendance/holiday-calendar/optional-apps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listOptionalHolidayApps: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/api/attendance/holiday-calendar/optional-apps${qs ? `?${qs}` : ''}`);
  },
  updateOptionalHolidayApp: (id, data) => apiCall(`/api/attendance/holiday-calendar/optional-apps/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteOptionalHolidayApp: (id) => apiCall(`/api/attendance/holiday-calendar/optional-apps/${id}`, { method: 'DELETE' }),

  addHolidayCalendar: (data) => apiCall('/api/attendance/holiday-calendar/calendars', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listHolidayCalendars: () => apiCall('/api/attendance/holiday-calendar/calendars'),
  updateHolidayCalendar: (id, data) => apiCall(`/api/attendance/holiday-calendar/calendars/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteHolidayCalendar: (id) => apiCall(`/api/attendance/holiday-calendar/calendars/${id}`, { method: 'DELETE' }),
  linkHolidayToCalendar: (data) => apiCall('/api/attendance/holiday-calendar/calendars/link-holiday', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  unlinkHolidayFromCalendar: (calendarId, holidayId) => apiCall(`/api/attendance/holiday-calendar/calendars/${calendarId}/holidays/${holidayId}`, { method: 'DELETE' }),
  getCalendarHolidays: (calendarId) => apiCall(`/api/attendance/holiday-calendar/calendars/${calendarId}/holidays`),

  createHolidaySwap: (data) => apiCall('/api/attendance/holiday-calendar/swap-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listHolidaySwaps: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/api/attendance/holiday-calendar/swap-requests${qs ? `?${qs}` : ''}`);
  },
  updateHolidaySwap: (id, data) => apiCall(`/api/attendance/holiday-calendar/swap-requests/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  cancelHolidaySwap: (id) => apiCall(`/api/attendance/holiday-calendar/swap-requests/${id}/cancel`, { method: 'POST' }),

  processHolidayCarryForward: (data) => apiCall('/api/attendance/holiday-calendar/carry-forward/process', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listHolidayCarryForward: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/api/attendance/holiday-calendar/carry-forward${qs ? `?${qs}` : ''}`);
  },
  
  // Leave Correction (routers/.../leave_correction.py, mounted at
  // /api/attendance with internal prefix /correction)
  getLeaveCorrectionFilterOptions: () => apiCall('/api/attendance/correction/filter-options'),
  listLeaveCorrections: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/api/attendance/correction/${qs ? `?${qs}` : ''}`);
  },
  saveLeaveCorrection: (data) => apiCall('/api/attendance/correction/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  bulkSaveLeaveCorrections: (data) => apiCall('/api/attendance/correction/bulk-save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  downloadLeaveCorrectionsUrl: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return `${BASE_URL}/api/attendance/correction/download?${qs}`;
  },
  uploadLeaveCorrections: (month, year, leaveTypeCode, rows) =>
    apiCall(`/api/attendance/correction/upload?month=${month}&year=${year}&leave_type_code=${leaveTypeCode}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rows),
    }),

};

// ==========================================
// REGULARIZATION APIs
// (routers/HR_Automation/attendance/routers/regularization.py — mounted at
// /api/attendance/regularization/*)
// ==========================================
export const regularizationAPI = {
  // Requests
  listRequests: (search, status, requestType) => {
    const q = new URLSearchParams();
    if (search) q.append('search', search);
    if (status && status.toLowerCase() !== 'all') q.append('status', status);
    if (requestType && requestType.toLowerCase() !== 'all') q.append('request_type', requestType);
    const qs = q.toString();
    return apiCall(`/api/attendance/regularization/requests${qs ? `?${qs}` : ''}`);
  },
  getRequest: (id) => apiCall(`/api/attendance/regularization/requests/${id}`),
  createRequest: (data) => apiCall('/api/attendance/regularization/requests', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }),
  updateRequest: (id, data) => apiCall(`/api/attendance/regularization/requests/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }),
  reviewRequest: (id, data) => apiCall(`/api/attendance/regularization/requests/${id}/review`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }),
  deleteRequest: (id) => apiCall(`/api/attendance/regularization/requests/${id}`, { method: 'DELETE' }),
  listRequestTypes: () => apiCall('/api/attendance/regularization/request-types'),

  // Auto-reject rule settings
  listAutoRejectRules: () => apiCall('/api/attendance/regularization/settings/auto-reject-rules'),
  createAutoRejectRule: (data) => apiCall('/api/attendance/regularization/settings/auto-reject-rules', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }),
  updateAutoRejectRule: (id, data) => apiCall(`/api/attendance/regularization/settings/auto-reject-rules/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }),
  toggleAutoRejectRule: (id) => apiCall(`/api/attendance/regularization/settings/auto-reject-rules/${id}/toggle`, {
    method: 'POST',
  }),
  deleteAutoRejectRule: (id) => apiCall(`/api/attendance/regularization/settings/auto-reject-rules/${id}`, { method: 'DELETE' }),

  // Statistics
  getStatistics: () => apiCall('/api/attendance/regularization/settings/statistics'),

  // Bulk processing
  bulkProcess: (data) => apiCall('/api/attendance/regularization/bulk-process', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }),
  getBulkBatch: (batchId) => apiCall(`/api/attendance/regularization/bulk-process/${batchId}`),

  // Reports (server streams the file back directly — build a URL for window.open,
  // same pattern used elsewhere for file-download endpoints)
  getReportDownloadUrl: (fromDate, toDate, requestType, format) => {
    const q = new URLSearchParams();
    q.append('from_date', fromDate);
    q.append('to_date', toDate);
    if (requestType && requestType.toLowerCase() !== 'all' && requestType !== '') q.append('request_type', requestType);
    q.append('format', format || 'PDF');
    return `${BASE_URL}/api/attendance/regularization/reports/generate?${q.toString()}`;
  },
};

// ==========================================
// EMPLOYEE MANAGEMENT APIs
// ==========================================
export const employeeAPI = {
  list: () => apiCall('/api/employees/'),
  getById: (id) => apiCall(`/api/employees/${id}`),
  // NOTE: restored from an earlier version of this file — verify these three
  // still exist on the backend before relying on them; the master-record
  // create/update flow below (createMaster/updateMaster) may be the one
  // actually wired up server-side instead.
  create: (data) => apiCall('/api/employees/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/api/employees/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  remove: (id, hard = false) => apiCall(`/api/employees/${id}${hard ? '?hard=true' : ''}`, { method: 'DELETE' }),
  deactivate: (id) => apiCall(`/api/employees/${id}/deactivate`, { method: 'PATCH' }),
  activate: (id) => apiCall(`/api/employees/${id}/activate`, { method: 'PATCH' }),
  createMaster: (data) => apiCall('/api/employees/master/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listMaster: () => apiCall('/api/employees/master/'),
  getMaster: (id) => apiCall(`/api/employees/master/${id}`),
  updateMaster: (id, data) => apiCall(`/api/employees/master/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteMaster: (id) => apiCall(`/api/employees/master/${id}`, { method: 'DELETE' }),
  getDocuments: (employeeId) => apiCall(`/api/employees/documents/${employeeId}`),
  uploadDocument: (data) => apiCall('/api/employees/documents/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  verifyDocument: (docId) => apiCall(`/api/employees/documents/${docId}/verify`, { method: 'PATCH' }),
  deleteDocument: (docId) => apiCall(`/api/employees/documents/${docId}`, { method: 'DELETE' }),
  listDepartments: () => apiCall('/api/employees/departments/'),
  getDepartmentTree: () => apiCall('/api/employees/departments/tree'),
  createDepartment: (data) => apiCall('/api/employees/departments/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateDepartment: (id, data) => apiCall(`/api/employees/departments/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteDepartment: (id) => apiCall(`/api/employees/departments/${id}`, { method: 'DELETE' }),
};

// ==========================================
// PAYROLL APIs
// ==========================================
export const payrollAPI = {
  // ---------------- Salary Structure: dashboard ----------------
  getSalaryStructureDashboard: () => apiCall('/api/payroll/salary-structures/dashboard'),

  // ---------------- Salary Structure: components (master data) ----------------
  getComponentsMaster: () => apiCall('/api/payroll/salary-structures/components'),
  createComponent: (data) => apiCall('/api/payroll/salary-structures/components', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listComponents: (category, isActive) => {
    const q = new URLSearchParams();
    if (category) q.append('category', category);
    if (isActive != null) q.append('is_active', isActive);
    const qs = q.toString();
    return apiCall(`/api/payroll/salary-structures/components/list${qs ? `?${qs}` : ''}`);
  },
  getComponent: (componentId) => apiCall(`/api/payroll/salary-structures/components/${componentId}`),
  updateComponent: (componentId, data) => apiCall(`/api/payroll/salary-structures/components/${componentId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteComponent: (componentId) => apiCall(`/api/payroll/salary-structures/components/${componentId}`, { method: 'DELETE' }),

  // ---------------- Salary Structure: templates ----------------
  getStructureTemplatesOverview: () => apiCall('/api/payroll/salary-structures/templates'),
  createStructureTemplate: (data) => apiCall('/api/payroll/salary-structures/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getStructureTemplate: (templateId) => apiCall(`/api/payroll/salary-structures/templates/${templateId}`),
  updateStructureTemplate: (templateId, data) => apiCall(`/api/payroll/salary-structures/templates/${templateId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  activateStructureTemplate: (templateId) => apiCall(`/api/payroll/salary-structures/templates/${templateId}/activate`, { method: 'POST' }),
  deactivateStructureTemplate: (templateId) => apiCall(`/api/payroll/salary-structures/templates/${templateId}/deactivate`, { method: 'POST' }),
  deleteStructureTemplate: (templateId) => apiCall(`/api/payroll/salary-structures/templates/${templateId}`, { method: 'DELETE' }),

  // ---------------- Salary Structure: assignments (employee <-> template) ----------------
  listAssignments: () => apiCall('/api/payroll/salary-structures/assignments'),
  createAssignment: (data) => apiCall('/api/payroll/salary-structures/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateAssignment: (assignmentId, data) => apiCall(`/api/payroll/salary-structures/assignments/${assignmentId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteAssignment: (assignmentId) => apiCall(`/api/payroll/salary-structures/assignments/${assignmentId}`, { method: 'DELETE' }),

  // ---------------- Salary Structure: simple percent-based structure + employee mapping ----------------
  listStructures: () => apiCall('/api/payroll/salary-structures/'),
  createStructure: (data) => apiCall('/api/payroll/salary-structures/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getStructure: (structureId) => apiCall(`/api/payroll/salary-structures/${structureId}`),
  updateStructure: (structureId, data) => apiCall(`/api/payroll/salary-structures/${structureId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteStructure: (structureId) => apiCall(`/api/payroll/salary-structures/${structureId}`, { method: 'DELETE' }),
  getEmployeeStructure: (employeeId) => apiCall(`/api/payroll/salary-structures/employee/${employeeId}`),

  // NOTE: everything below this line (slips/runs/loans/transfers/reimbursements/
  // settlements/statutory) is the ORIGINAL scaffold and has NOT been verified
  // against the real backend yet — it's a rough placeholder, not confirmed
  // coverage. Two confirmed-wrong entries already found and left as-is pending
  // a real fix pass: `assignStructure` below points at a path that doesn't
  // exist (`/salary-structures/assign` — real route is `/salary-structures/
  // assignments`, superseded by createAssignment() above), and
  // listTransfers/createTransfer point at `/bank-transfers/` (plural) but the
  // real router prefix is `/bank-transfer` (singular). Each of these routers
  // has far more real endpoints (bank_transfer.py alone has ~37) than this
  // 2-method-per-module scaffold covers — treat this whole block as
  // "unverified" until we get to that file.
  assignStructure: (data) => apiCall('/api/payroll/salary-structures/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getSlipDashboard: () => apiCall('/api/payroll/salary-slips/dashboard'),

  // { employee_id, pay_period_month, pay_period_year, distribution_method?, protect_with_dob? }
  generateSlip: (data) => apiCall('/api/payroll/salary-slips/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  // { pay_period_month, pay_period_year, distribution_method?, protect_with_dob?, employee_ids?: [...] }
  generateAllSlips: (data) => apiCall('/api/payroll/salary-slips/generate/all', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getSlipPreview: (employeeId, month, year) => apiCall(`/api/payroll/salary-slips/generate/preview?employee_id=${employeeId}&month=${month}&year=${year}`),

  getSlipHistory: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.slipMonth) q.append('slip_month', params.slipMonth);
    if (params.slipYear) q.append('slip_year', params.slipYear);
    if (params.slipStatus) q.append('slip_status', params.slipStatus);
    if (params.employeeId) q.append('employee_id', params.employeeId);
    const qs = q.toString();
    return apiCall(`/api/payroll/salary-slips/history${qs ? `?${qs}` : ''}`);
  },
  bulkDownloadSlips: (slipIds) => apiCall(`/api/payroll/salary-slips/bulk-download${slipIds?.length ? `?slip_ids=${slipIds.join(',')}` : ''}`),
  bulkDeleteSlips: (slipIds) => apiCall('/api/payroll/salary-slips/bulk-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(slipIds) }),
  // { pay_period_month, pay_period_year, format?, ... }
  exportSlips: (data) => apiCall('/api/payroll/salary-slips/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  printSlipReports: (data) => apiCall('/api/payroll/salary-slips/print-reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),

  getDistributionSettings: () => apiCall('/api/payroll/salary-slips/distribution/settings'),
  updateDistributionSettings: (data) => apiCall('/api/payroll/salary-slips/distribution/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  resetDistributionSettings: () => apiCall('/api/payroll/salary-slips/distribution/settings/reset', { method: 'POST' }),
  resetEmailTemplate: () => apiCall('/api/payroll/salary-slips/distribution/settings/reset-template', { method: 'POST' }),
  // { method?, recipient_email?, recipient_phone? } (slip_id set from the URL, not the body)
  sendSlip: (slipId, data) => apiCall(`/api/payroll/salary-slips/distribution/${slipId}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  bulkDistributeSlips: (data) => apiCall('/api/payroll/salary-slips/distribution/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getDistributionRecords: (slipId) => apiCall(`/api/payroll/salary-slips/distribution/${slipId}/records`),

  getSlipConfig: () => apiCall('/api/payroll/salary-slips/settings'),
  createSlipConfig: (data) => apiCall('/api/payroll/salary-slips/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateSlipConfig: (data) => apiCall('/api/payroll/salary-slips/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  resetSlipConfig: () => apiCall('/api/payroll/salary-slips/settings/reset', { method: 'POST' }),
  updateAdvancedSlipConfig: (data) => apiCall('/api/payroll/salary-slips/settings/advanced', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),

  createSlip: (data) => apiCall('/api/payroll/salary-slips/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listSlips: (employeeId, slipMonth, slipYear) => {
    const q = new URLSearchParams();
    if (employeeId) q.append('employee_id', employeeId);
    if (slipMonth) q.append('slip_month', slipMonth);
    if (slipYear) q.append('slip_year', slipYear);
    const qs = q.toString();
    return apiCall(`/api/payroll/salary-slips/${qs ? `?${qs}` : ''}`);
  },
  getEmployeeSlips: (employeeId) => apiCall(`/api/payroll/salary-slips/employee/${employeeId}`),
  getSlip: (slipId) => apiCall(`/api/payroll/salary-slips/${slipId}`),
  publishSlip: (slipId) => apiCall(`/api/payroll/salary-slips/${slipId}/publish`, { method: 'PATCH' }),
  updateSlip: (slipId, data) => apiCall(`/api/payroll/salary-slips/${slipId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteSlip: (slipId) => apiCall(`/api/payroll/salary-slips/${slipId}`, { method: 'DELETE' }),
  listRuns: (year, status) => {
    const q = new URLSearchParams();
    if (year) q.append('year', year);
    if (status) q.append('status', status);
    const qs = q.toString();
    return apiCall(`/api/payroll/runs/${qs ? `?${qs}` : ''}`);
  },
  createRun: (data) => apiCall('/api/payroll/runs/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getRun: (id) => apiCall(`/api/payroll/runs/${id}`),
  approveRun: (id, approvedBy) => apiCall(`/api/payroll/runs/${id}/approve${approvedBy ? `?approved_by=${encodeURIComponent(approvedBy)}` : ''}`, { method: 'PATCH' }),
  markRunPaid: (id) => apiCall(`/api/payroll/runs/${id}/mark-paid`, { method: 'PATCH' }),
  addEmployeeToRun: (id, data) => apiCall(`/api/payroll/runs/${id}/add-employee`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listRunDetails: (id) => apiCall(`/api/payroll/runs/${id}/details`),
  // NOTE: there is no bulk-compute endpoint anywhere in the backend. Payroll
  // runs are pure bookkeeping — you create a Draft run, then add-employee
  // requires the caller to already have every figure computed (basic, hra,
  // gross_salary, pf_employee, esi_employee, professional_tax, tds, net_pay).
  // Nothing here calculates payroll from attendance/salary structure/loans —
  // that logic doesn't exist server-side yet.

  // ---------------- Payroll Processing: config + lock ----------------
  getPayrollConfig: () => apiCall('/api/payroll/processing/config'),
  updatePayrollConfig: (data) => apiCall('/api/payroll/processing/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  lockPayroll: (reason, actionedBy) => apiCall('/api/payroll/processing/config/lock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason, actioned_by: actionedBy }) }),
  unlockPayroll: (reason, actionedBy) => apiCall('/api/payroll/processing/config/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason, actioned_by: actionedBy }) }),
  getLoanDashboardStats: () => apiCall('/api/payroll/loans/dashboard/stats'),

// { employee_id, loan_type, amount, reason?, interest_rate?, interest_method?, repayment_mode?, requested_tenure_months? }
applyForLoan: (data) => apiCall('/api/payroll/loans/apply', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}),

listLoans: (params = {}) => {
  const q = new URLSearchParams();

  if (params.search) q.append('search', params.search);
  if (params.loanType) q.append('loan_type', params.loanType);
  if (params.status) q.append('status', params.status);
  if (params.tab) q.append('tab', params.tab);
  if (params.skip != null) q.append('skip', params.skip);
  if (params.limit != null) q.append('limit', params.limit);

  const qs = q.toString();

  return apiCall(`/api/payroll/loans/${qs ? `?${qs}` : ''}`);
},

getEmployeeLoans: (employeeId) =>
  apiCall(`/api/payroll/loans/employee/${employeeId}`),

getLoan: (loanId) =>
  apiCall(`/api/payroll/loans/${loanId}`),

updateLoan: (loanId, data) =>
  apiCall(`/api/payroll/loans/${loanId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),

deleteLoan: (loanId) =>
  apiCall(`/api/payroll/loans/${loanId}`, {
    method: 'DELETE'
  }),

// { approved_by, approved_amount, interest_rate?, interest_method?, total_installments, issue_date }
approveLoan: (loanId, data) =>
  apiCall(`/api/payroll/loans/${loanId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),

// { approved_by, rejection_reason }
rejectLoan: (loanId, data) =>
  apiCall(`/api/payroll/loans/${loanId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),

// { installment_number?, paid_amount, paid_date?, payment_reference? }
recordLoanRepayment: (loanId, data) =>
  apiCall(`/api/payroll/loans/${loanId}/repayments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),

getLoanRepayments: (loanId) =>
  apiCall(`/api/payroll/loans/${loanId}/repayments`),

syncOverdueRepayments: () =>
  apiCall('/api/payroll/loans/repayments/sync-overdue', {
    method: 'POST'
  }),

exportLoans: () =>
  apiCall('/api/payroll/loans/export'),
  listTransfers: (params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.append('status', params.status);
    if (params.employeeId) q.append('employee_id', params.employeeId);
    if (params.paymentFileId) q.append('payment_file_id', params.paymentFileId);
    const qs = q.toString();
    return apiCall(`/api/payroll/bank-transfer/transfers/${qs ? `?${qs}` : ''}`);
  },
  createTransfer: (data) => apiCall('/api/payroll/bank-transfer/transfers/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getTransfer: (id) => apiCall(`/api/payroll/bank-transfer/transfers/${id}`),
  updateTransfer: (id, data) => apiCall(`/api/payroll/bank-transfer/transfers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  markTransferSuccess: (id, data) => apiCall(`/api/payroll/bank-transfer/transfers/${id}/mark-success`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) }),
  markTransferFailed: (id, data) => apiCall(`/api/payroll/bank-transfer/transfers/${id}/mark-failed`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) }),
  retryTransfer: (id) => apiCall(`/api/payroll/bank-transfer/transfers/${id}/retry`, { method: 'PATCH' }),
  deleteTransfer: (id) => apiCall(`/api/payroll/bank-transfer/transfers/${id}`, { method: 'DELETE' }),

  listPendingPayments: () => apiCall('/api/payroll/bank-transfer/pending-payments/'),
  createPendingPayment: (data) => apiCall('/api/payroll/bank-transfer/pending-payments/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  resolvePendingPayment: (id, data) => apiCall(`/api/payroll/bank-transfer/pending-payments/${id}/resolve`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) }),
  retryPendingPayment: (id) => apiCall(`/api/payroll/bank-transfer/pending-payments/${id}/retry`, { method: 'PATCH' }),
  downloadPendingPaymentsReport: () => apiCall('/api/payroll/bank-transfer/pending-payments/download-report'),

  getBankTransferSettings: () => apiCall('/api/payroll/bank-transfer/settings/'),
  updateBankTransferSettings: (data) => apiCall('/api/payroll/bank-transfer/settings/', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),

  runReconciliation: (data) => apiCall('/api/payroll/bank-transfer/reconciliation/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) }),
  listReconciliations: () => apiCall('/api/payroll/bank-transfer/reconciliation/'),
  getReconciliation: (id) => apiCall(`/api/payroll/bank-transfer/reconciliation/${id}`),
  verifyReconciliation: (id, data) => apiCall(`/api/payroll/bank-transfer/reconciliation/${id}/verify`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  markAllReconciliationEntriesVerified: (id) => apiCall(`/api/payroll/bank-transfer/reconciliation/${id}/mark-all-verified`, { method: 'PATCH' }),
  listReconciliationEntries: (id) => apiCall(`/api/payroll/bank-transfer/reconciliation/${id}/entries/`),
  updateReconciliationEntry: (entryId, data) => apiCall(`/api/payroll/bank-transfer/reconciliation/entries/${entryId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  exportReconciliation: (id) => apiCall(`/api/payroll/bank-transfer/reconciliation/${id}/export`),

  getBankTransferAnalyticsSummary: () => apiCall('/api/payroll/bank-transfer/analytics/summary'),
  getBankTransferAnalytics: () => apiCall('/api/payroll/bank-transfer/analytics/'),

  listPaymentFiles: () => apiCall('/api/payroll/bank-transfer/payment-files/'),
  createPaymentFile: (data) => apiCall('/api/payroll/bank-transfer/payment-files/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  generatePaymentFile: (data) => apiCall('/api/payroll/bank-transfer/payment-files/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getPaymentFile: (id) => apiCall(`/api/payroll/bank-transfer/payment-files/${id}`),
  updatePaymentFile: (id, data) => apiCall(`/api/payroll/bank-transfer/payment-files/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  approvePaymentFile: (id) => apiCall(`/api/payroll/bank-transfer/payment-files/${id}/approve`, { method: 'PATCH' }),
  deletePaymentFile: (id) => apiCall(`/api/payroll/bank-transfer/payment-files/${id}`, { method: 'DELETE' }),
  exportPaymentFileCsv: (id) => apiCall(`/api/payroll/bank-transfer/payment-files/${id}/export/csv`),
  listPaymentFileEntries: (id) => apiCall(`/api/payroll/bank-transfer/payment-files/${id}/entries/`),
  updatePaymentFileEntry: (entryId, data) => apiCall(`/api/payroll/bank-transfer/payment-files/entries/${entryId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  bulkUpdatePaymentFileEntries: (data) => apiCall('/api/payroll/bank-transfer/payment-files/entries/bulk-update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  retryPaymentFileEntry: (entryId) => apiCall(`/api/payroll/bank-transfer/payment-files/entries/${entryId}/retry`, { method: 'PATCH' }),
  listReimbursements: () => apiCall('/api/payroll/reimbursements/'),
  createReimbursement: (data) => apiCall('/api/payroll/reimbursements/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listSettlements: () => apiCall('/api/payroll/final-settlements/'),
  createSettlement: (data) => apiCall('/api/payroll/final-settlements/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getEmployeeSettlement: (employeeId) => apiCall(`/api/payroll/final-settlements/employee/${employeeId}`),
  getStatutory: () => apiCall('/api/payroll/statutory/'),
  createStatutory: (data) => apiCall('/api/payroll/statutory/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateStatutory: (id, data) => apiCall(`/api/payroll/statutory/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
};

// ==========================================
// PAYROLL REPORTS APIs
// Backend router: routers/Payroll/payroll_reports.py, mounted in main.py as
// app.include_router(payroll_rpt.router, prefix="/api/payroll") — the
// router's own prefix is "/payroll-reports", so every real path here is
// /api/payroll/payroll-reports/... (yes, "payroll" appears twice; that's
// the actual mount, not a typo below).
// PayrollReports.jsx was already written against this exact interface but
// this object didn't exist yet, which broke the production build
// ("payrollReportsAPI is not exported"). Every method below is a real,
// registered endpoint — none of this is a stub.
// ==========================================
export const payrollReportsAPI = {
  // ---- Dashboard ----
  getDashboardKpi: () => apiCall('/api/payroll/payroll-reports/dashboard/kpi'),
  listAiInsights: () => apiCall('/api/payroll/payroll-reports/dashboard/insights'),
  createAiInsight: (data) => apiCall('/api/payroll/payroll-reports/dashboard/insights', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  dismissAiInsight: (insightId, data) => apiCall(`/api/payroll/payroll-reports/dashboard/insights/${insightId}/dismiss`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),

  // ---- Standard Reports tab ----
  listStandardReports: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.category) q.append('category', params.category);
    if (params.department) q.append('department', params.department);
    if (params.frequency) q.append('frequency', params.frequency);
    const qs = q.toString();
    return apiCall(`/api/payroll/payroll-reports/standard/${qs ? `?${qs}` : ''}`);
  },
  getStandardReportCategories: () => apiCall('/api/payroll/payroll-reports/standard/categories'),
  exportStandardReport: (data) => apiCall('/api/payroll/payroll-reports/standard/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),

  // ---- Compliance tab ----
  listComplianceReports: (complianceType) => apiCall(`/api/payroll/payroll-reports/compliance/${complianceType ? `?compliance_type=${complianceType}` : ''}`),
  listOverdueCompliance: () => apiCall('/api/payroll/payroll-reports/compliance/overdue'),
  createComplianceReport: (data) => apiCall('/api/payroll/payroll-reports/compliance/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateComplianceReport: (reportId, data) => apiCall(`/api/payroll/payroll-reports/compliance/${reportId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  generateComplianceReport: (reportId) => apiCall(`/api/payroll/payroll-reports/compliance/${reportId}/generate`, { method: 'PATCH' }),
  deleteComplianceReport: (reportId) => apiCall(`/api/payroll/payroll-reports/compliance/${reportId}`, { method: 'DELETE' }),

  // ---- Analytics tab ----
  listAnalyticsDashboards: () => apiCall('/api/payroll/payroll-reports/analytics/'),
  createAnalyticsDashboard: (data) => apiCall('/api/payroll/payroll-reports/analytics/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateAnalyticsDashboard: (dashboardId, data) => apiCall(`/api/payroll/payroll-reports/analytics/${dashboardId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteAnalyticsDashboard: (dashboardId) => apiCall(`/api/payroll/payroll-reports/analytics/${dashboardId}`, { method: 'DELETE' }),

  // ---- Generated tab ----
  listGeneratedReports: (params = {}) => {
    const q = new URLSearchParams();
    if (params.reportName) q.append('report_name', params.reportName);
    if (params.format) q.append('format', params.format);
    if (params.skip != null) q.append('skip', params.skip);
    if (params.limit != null) q.append('limit', params.limit);
    const qs = q.toString();
    return apiCall(`/api/payroll/payroll-reports/generated/${qs ? `?${qs}` : ''}`);
  },
  recordGeneratedReport: (data) => apiCall('/api/payroll/payroll-reports/generated/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  // NOTE: this only returns JSON metadata and increments download_count server-side
  // — there's no real file storage behind file_path, so there's nothing to stream.
  downloadGeneratedReport: (reportId) => apiCall(`/api/payroll/payroll-reports/generated/${reportId}/download`),
  deleteGeneratedReport: (reportId) => apiCall(`/api/payroll/payroll-reports/generated/${reportId}`, { method: 'DELETE' }),

  // ---- Scheduled tab ----
  listScheduledReports: (isActive) => apiCall(`/api/payroll/payroll-reports/scheduled/${isActive != null ? `?is_active=${isActive}` : ''}`),
  createScheduledReport: (data) => apiCall('/api/payroll/payroll-reports/scheduled/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateScheduledReport: (scheduleId, data) => apiCall(`/api/payroll/payroll-reports/scheduled/${scheduleId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  toggleScheduledReport: (scheduleId) => apiCall(`/api/payroll/payroll-reports/scheduled/${scheduleId}/toggle`, { method: 'PATCH' }),
  deleteScheduledReport: (scheduleId) => apiCall(`/api/payroll/payroll-reports/scheduled/${scheduleId}`, { method: 'DELETE' }),

  // ---- Configuration tab ----
  getReportConfig: () => apiCall('/api/payroll/payroll-reports/config/'),
  updateReportConfig: (data) => apiCall('/api/payroll/payroll-reports/config/', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  exportReportConfig: () => apiCall('/api/payroll/payroll-reports/config/export'),
  resetReportConfig: (updatedBy) => apiCall(`/api/payroll/payroll-reports/config/reset${updatedBy != null ? `?updated_by=${updatedBy}` : ''}`, { method: 'POST' }),

  // ---- Report Builder (custom reports) ----
  getBuilderAvailableColumns: () => apiCall('/api/payroll/payroll-reports/builder/available-columns'),
  createCustomReport: (data) => apiCall('/api/payroll/payroll-reports/builder/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listCustomReports: (isActive = true, category) => {
    const q = new URLSearchParams();
    q.append('is_active', isActive);
    if (category) q.append('category', category);
    return apiCall(`/api/payroll/payroll-reports/builder/?${q.toString()}`);
  },
  getCustomReport: (reportId) => apiCall(`/api/payroll/payroll-reports/builder/${reportId}`),
  updateCustomReport: (reportId, data) => apiCall(`/api/payroll/payroll-reports/builder/${reportId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteCustomReport: (reportId) => apiCall(`/api/payroll/payroll-reports/builder/${reportId}`, { method: 'DELETE' }),
  getCustomReportColumns: (reportId) => apiCall(`/api/payroll/payroll-reports/builder/${reportId}/columns`),
  exportCustomReportCsv: (reportId) => apiCall(`/api/payroll/payroll-reports/builder/${reportId}/export/csv`),

  // ---- Data reports (used by other payroll-reports pages/widgets) ----
  getMonthlySummary: (month, year) => apiCall(`/api/payroll/payroll-reports/data/monthly-summary${month || year ? `?${new URLSearchParams({ ...(month && { month }), ...(year && { year }) }).toString()}` : ''}`),
  getDepartmentWise: () => apiCall('/api/payroll/payroll-reports/data/department-wise'),
  getLocationWise: () => apiCall('/api/payroll/payroll-reports/data/location-wise'),
  getGradeWise: () => apiCall('/api/payroll/payroll-reports/data/grade-wise'),
  getSalaryComponents: (params = {}) => {
    const q = new URLSearchParams();
    if (params.payrollRunId) q.append('payroll_run_id', params.payrollRunId);
    if (params.month) q.append('month', params.month);
    if (params.year) q.append('year', params.year);
    const qs = q.toString();
    return apiCall(`/api/payroll/payroll-reports/data/salary-components${qs ? `?${qs}` : ''}`);
  },
  getBankTransferSummary: () => apiCall('/api/payroll/payroll-reports/data/bank-transfer-summary'),
  getPfRemittance: (month, year) => apiCall(`/api/payroll/payroll-reports/data/pf-remittance${month || year ? `?${new URLSearchParams({ ...(month && { month }), ...(year && { year }) }).toString()}` : ''}`),
  getEsiRemittance: (month, year) => apiCall(`/api/payroll/payroll-reports/data/esi-remittance${month || year ? `?${new URLSearchParams({ ...(month && { month }), ...(year && { year }) }).toString()}` : ''}`),
  getTdsReport: (month, year) => apiCall(`/api/payroll/payroll-reports/data/tds${month || year ? `?${new URLSearchParams({ ...(month && { month }), ...(year && { year }) }).toString()}` : ''}`),
  getPtDeduction: (month, year) => apiCall(`/api/payroll/payroll-reports/data/professional-tax${month || year ? `?${new URLSearchParams({ ...(month && { month }), ...(year && { year }) }).toString()}` : ''}`),
  getPayrollVariance: () => apiCall('/api/payroll/payroll-reports/data/variance'),
  getCostCenter: () => apiCall('/api/payroll/payroll-reports/data/cost-center'),
  getHeadcountTrends: () => apiCall('/api/payroll/payroll-reports/data/headcount-trends'),
  exportPfRemittanceCsv: (month, year) => apiCall(`/api/payroll/payroll-reports/data/pf-remittance/export/csv${month || year ? `?${new URLSearchParams({ ...(month && { month }), ...(year && { year }) }).toString()}` : ''}`),
  exportTdsCsv: (month, year) => apiCall(`/api/payroll/payroll-reports/data/tds/export/csv${month || year ? `?${new URLSearchParams({ ...(month && { month }), ...(year && { year }) }).toString()}` : ''}`),
  exportDepartmentWiseCsv: () => apiCall('/api/payroll/payroll-reports/data/department-wise/export/csv'),

  // ---- Page-level export ----
  exportAllData: (data) => apiCall('/api/payroll/payroll-reports/export-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
};

// ==========================================
// ATTENDANCE-PAYROLL INTEGRATION APIs
// Backend: routers/Payroll/payroll_integration.py, mounted at /api/payroll
// (router prefix "/integration" -> /api/payroll/integration/*)
//
// NOTE: /calculation and /calculation/run-payroll are real endpoints but
// have no computation engine behind them yet — present_days/basic_salary/
// net_pay etc. come back as 0/"Pending" for every employee regardless of
// actual attendance. Freeze/unfreeze, corrections, rules, and settings ARE
// fully implemented.
// ==========================================
const _monthYearQuery = (month, year) => {
  const now = new Date();
  const m = month || now.getMonth() + 1;
  const y = year || now.getFullYear();
  return new URLSearchParams({ month: m, year: y }).toString();
};

export const payrollIntegrationAPI = {
  // ---- Freeze / Unfreeze ----
  getFreezeStatus: (month, year) =>
    apiCall(`/api/payroll/integration/freeze-status?${_monthYearQuery(month, year)}`),

  freezeForPayroll: (requestedBy = 'Payroll Admin', month, year) =>
    apiCall(`/api/payroll/integration/freeze?${_monthYearQuery(month, year)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requested_by: requestedBy })
    }),

  unfreeze: (requestedBy, month, year) =>
    apiCall(`/api/payroll/integration/unfreeze?${_monthYearQuery(month, year)}`, {
      method: 'POST'
    }),

  // ---- Calculation ----
  getCalculation: (params = {}) => {
    const q = new URLSearchParams();
    if (params.department) q.append('department', params.department);
    if (params.location) q.append('location', params.location);
    const qs = q.toString();
    return apiCall(`/api/payroll/integration/calculation${qs ? `?${qs}` : ''}`);
  },

  runPayroll: (month, year, department, location) =>
    apiCall('/api/payroll/integration/calculation/run-payroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month,
        year,
        ...(department && { department }),
        ...(location && { location })
      })
    }),

  exportCalculationCsv: (params = {}) => {
    const q = new URLSearchParams();
    if (params.department) q.append('department', params.department);
    if (params.location) q.append('location', params.location);
    const qs = q.toString();
    return apiCall(`/api/payroll/integration/calculation/export${qs ? `?${qs}` : ''}`);
  },

  // ---- Integration status / data flow ----
  getIntegrationStatus: () => apiCall('/api/payroll/integration/status'),
  refreshStatus: () => apiCall('/api/payroll/integration/refresh-status', { method: 'POST' }),
  getRealtimeDataFlow: () => apiCall('/api/payroll/integration/realtime-data-flow'),
  syncNow: (source) =>
    apiCall('/api/payroll/integration/sync-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(source ? { source } : {})
    }),
  refreshFlowStatus: () => apiCall('/api/payroll/integration/refresh-flow', { method: 'POST' }),

  // ---- Calculation rules ----
  listCalculationRules: () => apiCall('/api/payroll/integration/calculation-rules'),
  updateCalculationRule: (ruleId, data) =>
    apiCall(`/api/payroll/integration/calculation-rules/${ruleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  toggleCalculationRule: (ruleId) =>
    apiCall(`/api/payroll/integration/calculation-rules/${ruleId}/toggle`, { method: 'POST' }),

  // ---- Action items ----
  listActionItems: (activeOnly = true) =>
    apiCall(`/api/payroll/integration/action-items?active_only=${activeOnly}`),
  resolveActionItem: (itemId, resolvedBy) =>
    apiCall(`/api/payroll/integration/action-items/${itemId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resolvedBy ? { resolved_by: resolvedBy } : {})
    }),
  resolveAllActionItems: () =>
    apiCall('/api/payroll/integration/action-items/resolve-all', { method: 'POST' }),

  // ---- Corrections ----
  listCorrections: (status) =>
    apiCall(`/api/payroll/integration/corrections${status ? `?status=${status}` : ''}`),
  createCorrection: (data) =>
    apiCall('/api/payroll/integration/corrections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  updateCorrection: (correctionId, data) =>
    apiCall(`/api/payroll/integration/corrections/${correctionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  approveCorrection: (correctionId, reviewedBy = 'Payroll Admin') =>
    apiCall(`/api/payroll/integration/corrections/${correctionId}/approve?reviewed_by=${encodeURIComponent(reviewedBy)}`, {
      method: 'POST'
    }),
  rejectCorrection: (correctionId, reviewedBy = 'Payroll Admin') =>
    apiCall(`/api/payroll/integration/corrections/${correctionId}/reject?reviewed_by=${encodeURIComponent(reviewedBy)}`, {
      method: 'POST'
    }),
  exportCorrectionsCsv: () => apiCall('/api/payroll/integration/corrections/export'),

  // ---- Reports ----
  listReports: () => apiCall('/api/payroll/integration/reports'),
  generateReport: (reportKey) =>
    apiCall(`/api/payroll/integration/reports/${reportKey}/generate`, { method: 'POST' }),
  exportAllReportsCsv: () => apiCall('/api/payroll/integration/reports/export-all'),

  // ---- Settings ----
  getSettings: () => apiCall('/api/payroll/integration/settings'),
  updateSettings: (data) =>
    apiCall('/api/payroll/integration/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  resetSettings: () => apiCall('/api/payroll/integration/settings/reset', { method: 'POST' }),

  // ---- Dashboard ----
  getDashboardSummary: (params = {}) => {
    const q = new URLSearchParams();
    if (params.month) q.append('month', params.month);
    if (params.year) q.append('year', params.year);
    if (params.department) q.append('department', params.department);
    if (params.location) q.append('location', params.location);
    if (params.status) q.append('status', params.status);
    const qs = q.toString();
    return apiCall(`/api/payroll/integration/dashboard/summary${qs ? `?${qs}` : ''}`);
  },
  getProcessingStatus: () => apiCall('/api/payroll/integration/dashboard/processing-status'),
  getImpactAnalysis: () => apiCall('/api/payroll/integration/dashboard/impact-analysis'),
  getTopDeductionsAdditions: () => apiCall('/api/payroll/integration/dashboard/top-deductions-additions'),
};

// ==========================================
// HR OPERATIONS APIs
// ==========================================
export const hrOpsAPI = {
  listExits: () => apiCall('/api/hr-ops/exit-management/'),
  createExit: (data) => apiCall('/api/hr-ops/exit-management/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateExit: (id, data) => apiCall(`/api/hr-ops/exit-management/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listNotice: () => apiCall('/api/hr-ops/notice-period/'),
  createNotice: (data) => apiCall('/api/hr-ops/notice-period/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listLetters: () => apiCall('/api/hr-ops/letter-generation/'),
  createLetter: (data) => apiCall('/api/hr-ops/letter-generation/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listTickets: () => apiCall('/api/hr-ops/helpdesk/'),
  createTicket: (data) => apiCall('/api/hr-ops/helpdesk/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listConfirmations: () => apiCall('/api/hr-ops/confirmations/'),
  createConfirmation: (data) => apiCall('/api/hr-ops/confirmations/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listTransfers: () => apiCall('/api/hr-ops/transfers/'),
  createTransfer: (data) => apiCall('/api/hr-ops/transfers/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listPromotions: () => apiCall('/api/hr-ops/promotions/'),
  createPromotion: (data) => apiCall('/api/hr-ops/promotions/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
};

// ==========================================
// REPORTS APIs
// ==========================================
export const reportsAPI = {
  getEmployeeReport: () => apiCall('/api/reports/employees/'),
  getAttendanceReport: () => apiCall('/api/reports/attendance/'),
  getLeaveReport: () => apiCall('/api/reports/leave/'),
  getPayrollReport: () => apiCall('/api/reports/payroll/'),
  getComplianceReport: () => apiCall('/api/reports/compliance/'),
  buildCustomReport: (data) => apiCall('/api/reports/custom/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getExecutiveDashboard: () => apiCall('/api/reports/dashboard/'),
  getAIInsights: () => apiCall('/api/reports/ai-insights/'),
};

// ==========================================
// FORMS & WORKFLOWS APIs
// ==========================================
export const formsAPI = {
  listForms: () => apiCall('/api/forms/custom-forms/'),
  createForm: (data) => apiCall('/api/forms/custom-forms/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getForm: (id) => apiCall(`/api/forms/custom-forms/${id}`),
  updateForm: (id, data) => apiCall(`/api/forms/custom-forms/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteForm: (id) => apiCall(`/api/forms/custom-forms/${id}`, { method: 'DELETE' }),
  listWorkflows: () => apiCall('/api/forms/workflows/'),
  createWorkflow: (data) => apiCall('/api/forms/workflows/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listRequests: () => apiCall('/api/forms/requests/'),
  createRequest: (data) => apiCall('/api/forms/requests/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listSurveys: () => apiCall('/api/forms/surveys/'),
  createSurvey: (data) => apiCall('/api/forms/surveys/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  listApprovals: () => apiCall('/api/forms/approvals/'),
  createApproval: (data) => apiCall('/api/forms/approvals/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateApproval: (id, data) => apiCall(`/api/forms/approvals/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
};

// ==========================================
// SUPER ADMIN APIs
// ==========================================
export const superAdminAPI = {
  listRoles: () => apiCall('/api/super-admin/roles/'),
  createRole: (data) => apiCall('/api/super-admin/roles/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateRole: (id, data) => apiCall(`/api/super-admin/roles/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteRole: (id) => apiCall(`/api/super-admin/roles/${id}`, { method: 'DELETE' }),
  listTenants: () => apiCall('/api/super-admin/tenants/'),
  createTenant: (data) => apiCall('/api/super-admin/tenants/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateTenant: (id, data) => apiCall(`/api/super-admin/tenants/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getCompanySettings: () => apiCall('/api/super-admin/company-settings/'),
  updateCompanySettings: (data) => apiCall('/api/super-admin/company-settings/', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
};

// ==========================================
// PROBATION MANAGEMENT APIs
// ==========================================
export const probationAPI = {
  // KPI summary cards
  getKPI: () => apiCall('/probation-management/kpi'),

  // List employees on probation. Backend supports server-side
  // search/status/department/risk_level/sort_by/skip/limit filtering —
  // pass through whatever the UI currently filters client-side if you
  // want to move filtering server-side later.
  listEmployees: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.status) q.append('status', params.status);
    if (params.department) q.append('department', params.department);
    if (params.riskLevel) q.append('risk_level', params.riskLevel);
    if (params.sortBy) q.append('sort_by', params.sortBy);
    if (params.skip != null) q.append('skip', params.skip);
    if (params.limit != null) q.append('limit', params.limit);
    const qs = q.toString();
    return apiCall(`/probation-management/employees${qs ? `?${qs}` : ''}`);
  },

  getEmployee: (confirmationId) =>
    apiCall(`/probation-management/employees/${confirmationId}`),

  // Puts an EXISTING employee onto probation tracking.
  // NOTE: payload.employee_id must be the numeric employee record id
  // (FK to the employees table) — not the human-readable employee code
  // like "LEV076". There is no backend route to create a brand-new
  // employee from this screen; the employee must already exist in
  // Employee Management. { employee_id, probation_start_date,
  // probation_end_date, reviewed_by?, remarks? }
  addEmployee: (payload) =>
    apiCall('/probation-management/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),

  // { status?, performance_rating?, extended_till?, confirmation_date?, remarks? }
  updateStatus: (confirmationId, payload) =>
    apiCall(`/probation-management/employees/${confirmationId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),

  // { confirmation_ids: [...], action: 'schedule_review'|'send_reminder'|'extend_probation'|'confirm_employees'|'export_data' }
  bulkAction: (confirmationIds, action) =>
    apiCall('/probation-management/bulk-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation_ids: confirmationIds, action })
    }),

  // { milestone: '30_day'|'60_day'|'90_day'|'final', rating?, remarks? }
  completeMilestone: (confirmationId, payload) =>
    apiCall(`/probation-management/employees/${confirmationId}/milestone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),

  getDepartments: () => apiCall('/probation-management/departments'),

  getReport: () => apiCall('/probation-management/reports'),
};

// ==========================================
// BUDDY / MENTOR PROGRAM APIs
// ==========================================
export const buddyMentorAPI = {
  getDashboard: () => apiCall('/buddy-mentor/dashboard'),

  listPrograms: () => apiCall('/buddy-mentor/programs'),
  getProgram: (id) => apiCall(`/buddy-mentor/programs/${id}`),
  // { program_name, program_type, description?, department?, location?,
  //   start_date, end_date?, status?, created_by, assignment_rules?: [{rule_text, is_mandatory, weight_score}] }
  createProgram: (payload) =>
    apiCall('/buddy-mentor/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  updateProgram: (id, payload) =>
    apiCall(`/buddy-mentor/programs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  deleteProgram: (id) =>
    apiCall(`/buddy-mentor/programs/${id}`, { method: 'DELETE' }),

  addRule: (programId, payload) =>
    apiCall(`/buddy-mentor/programs/${programId}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  deleteRule: (ruleId) =>
    apiCall(`/buddy-mentor/rules/${ruleId}`, { method: 'DELETE' }),

  getProgramPairings: (programId) =>
    apiCall(`/buddy-mentor/programs/${programId}/pairings`),
  // { program_id, buddy_id, new_joiner_id, assignment_date, match_score?, status? }
  // buddy_id / new_joiner_id are Employee record ids (see employeeAPI.list()) —
  // there is no dedicated "available buddies" / "unassigned new joiners"
  // endpoint on the backend, so the caller has to source and filter that
  // list itself (e.g. from employeeAPI.list() cross-referenced with
  // getProgramPairings() to exclude people already paired).
  createPairing: (payload) =>
    apiCall('/buddy-mentor/pairings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  updatePairing: (pairingId, payload) =>
    apiCall(`/buddy-mentor/pairings/${pairingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  autoMatch: (programId, buddyId, newJoinerId) =>
    apiCall('/buddy-mentor/pairings/auto-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ program_id: programId, buddy_id: buddyId, new_joiner_id: newJoinerId })
    }),

  // { pairing_id, submitted_by, overall_rating(1-5), responsiveness?, knowledge_sharing?, support?, communication?, *_comments? }
  submitFeedback: (payload) =>
    apiCall('/buddy-mentor/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  getPairingFeedback: (pairingId) =>
    apiCall(`/buddy-mentor/pairings/${pairingId}/feedback`),

  // { pairing_id, communication_type, date, duration_minutes?, next_checkin_date?, topics_discussed?, follow_up_actions?, additional_notes? }
  recordCommunication: (payload) =>
    apiCall(`/buddy-mentor/pairings/${payload.pairing_id}/communications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  getPairingCommunications: (pairingId) =>
    apiCall(`/buddy-mentor/pairings/${pairingId}/communications`),

  getProgramAnalytics: (programId) =>
    apiCall(`/buddy-mentor/programs/${programId}/analytics`),
};

// ==========================================
// INDUCTION & ORIENTATION APIs
// ==========================================
export const inductionAPI = {
  getStats: () => apiCall('/api/induction/stats'),

  listPrograms: () => apiCall('/api/induction/programs'),
  // { name, description?, type: 'batch'|'individual', status?, start_date, end_date, max_participants? }
  createProgram: (payload) =>
    apiCall('/api/induction/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  updateProgram: (id, payload) =>
    apiCall(`/api/induction/programs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  deleteProgram: (id) =>
    apiCall(`/api/induction/programs/${id}`, { method: 'DELETE' }),

  listParticipants: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.department) q.append('department', params.department);
    if (params.programId) q.append('program_id', params.programId);
    const qs = q.toString();
    return apiCall(`/api/induction/participants${qs ? `?${qs}` : ''}`);
  },
  // { employee_id, program_id }
  addParticipant: (payload) =>
    apiCall('/api/induction/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  // { employee_ids: [...], program_id }
  bulkAddParticipants: (employeeIds, programId) =>
    apiCall('/api/induction/participants/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_ids: employeeIds, program_id: programId })
    }),
  // { attendance: 'Present' | 'Absent' | 'Not Marked' }
  markAttendance: (participantId, attendance) =>
    apiCall(`/api/induction/participants/${participantId}/attendance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendance })
    }),
  // { updates: [{ participant_id, attendance }, ...] }
  bulkMarkAttendance: (updates) =>
    apiCall('/api/induction/participants/bulk-attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    }),
  removeParticipant: (participantId) =>
    apiCall(`/api/induction/participants/${participantId}`, { method: 'DELETE' }),

  listSessions: () => apiCall('/api/induction/sessions'),
  // { program_id, title, description?, session_date, start_time, end_time, duration_hrs?, mode?, status? }
  createSession: (payload) =>
    apiCall('/api/induction/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  updateSession: (id, payload) =>
    apiCall(`/api/induction/sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  deleteSession: (id) =>
    apiCall(`/api/induction/sessions/${id}`, { method: 'DELETE' }),

  listPolicies: () => apiCall('/api/induction/policies'),
  // { title, category: 'general'|'compliance'|'security', version, effective_date, status?, total_employees?, total_modules? }
  createPolicy: (payload) =>
    apiCall('/api/induction/policies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  updatePolicy: (id, payload) =>
    apiCall(`/api/induction/policies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  deletePolicy: (id) =>
    apiCall(`/api/induction/policies/${id}`, { method: 'DELETE' }),

  // { acknowledged, modules_completed? }
  acknowledgePolicy: (policyId, employeeId, payload) =>
    apiCall(`/api/induction/policies/${policyId}/acknowledge/${employeeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
};

// ==========================================
// Export default for convenience
// ==========================================
// ==========================================
// REIMBURSEMENTS APIs
// ==========================================
export const reimbursementAPI = {
  getDashboard: () => apiCall('/api/payroll/reimbursements/dashboard'),

  listTypes: () => apiCall('/api/payroll/reimbursements/types'),
  // { name, description?, category?, limit_amount, frequency?, is_taxable? }
  createType: (data) => apiCall('/api/payroll/reimbursements/types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getType: (typeId) => apiCall(`/api/payroll/reimbursements/types/${typeId}`),
  updateType: (typeId, data) => apiCall(`/api/payroll/reimbursements/types/${typeId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteType: (typeId) => apiCall(`/api/payroll/reimbursements/types/${typeId}`, { method: 'DELETE' }),

  listClaims: (params = {}) => {
    const q = new URLSearchParams();
    if (params.employeeId != null) q.append('employee_id', params.employeeId);
    if (params.typeId != null) q.append('type_id', params.typeId);
    if (params.status) q.append('status', params.status);
    if (params.dateFrom) q.append('date_from', params.dateFrom);
    if (params.dateTo) q.append('date_to', params.dateTo);
    if (params.search) q.append('search', params.search);
    if (params.skip != null) q.append('skip', params.skip);
    if (params.limit != null) q.append('limit', params.limit);
    const qs = q.toString();
    return apiCall(`/api/payroll/reimbursements/claims${qs ? `?${qs}` : ''}`);
  },
  // { employee_id, employee_code, employee_name, type_id, claimed_amount, description?, receipt_path?, receipt_filename? }
  submitClaim: (data) => apiCall('/api/payroll/reimbursements/claims', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  exportClaims: (params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.append('status', params.status);
    if (params.typeId != null) q.append('type_id', params.typeId);
    const qs = q.toString();
    return apiCall(`/api/payroll/reimbursements/claims/export${qs ? `?${qs}` : ''}`);
  },
  getClaim: (claimId) => apiCall(`/api/payroll/reimbursements/claims/${claimId}`),
  getClaimLogs: (claimId) => apiCall(`/api/payroll/reimbursements/claims/${claimId}/logs`),
  // { approved_by?, remarks? }
  managerApprove: (claimId, data) => apiCall(`/api/payroll/reimbursements/claims/${claimId}/manager-approve`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) }),
  managerReject: (claimId, data) => apiCall(`/api/payroll/reimbursements/claims/${claimId}/manager-reject`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) }),
  financeApprove: (claimId, data) => apiCall(`/api/payroll/reimbursements/claims/${claimId}/finance-approve`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) }),
  financeReject: (claimId, data) => apiCall(`/api/payroll/reimbursements/claims/${claimId}/finance-reject`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) }),
  // { payroll_run_id, payroll_processed_date?, processed_by? }
  markPaid: (claimId, data) => apiCall(`/api/payroll/reimbursements/claims/${claimId}/mark-paid`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  downloadReceipt: (claimId) => apiCall(`/api/payroll/reimbursements/receipts/${claimId}`),

  listBalances: (params = {}) => {
    const q = new URLSearchParams();
    if (params.employeeId != null) q.append('employee_id', params.employeeId);
    if (params.typeId != null) q.append('type_id', params.typeId);
    if (params.period) q.append('period', params.period);
    const qs = q.toString();
    return apiCall(`/api/payroll/reimbursements/balances${qs ? `?${qs}` : ''}`);
  },
  getEmployeeBalances: (employeeId) => apiCall(`/api/payroll/reimbursements/balances/employee/${employeeId}`),

  getReports: () => apiCall('/api/payroll/reimbursements/reports'),
};

// ==========================================
// FINAL SETTLEMENT APIs
// ==========================================
export const finalSettlementAPI = {
  getStats: (settlementId) => apiCall(`/api/payroll/final-settlements/stats${settlementId != null ? `?settlement_id=${settlementId}` : ''}`),
  exportAllReport: () => apiCall('/api/payroll/final-settlements/export/report'),
 
  list: (params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.append('status', params.status);
    if (params.exitType) q.append('exit_type', params.exitType);
    if (params.search) q.append('search', params.search);
    if (params.page) q.append('page', params.page);
    if (params.pageSize) q.append('page_size', params.pageSize);
    const qs = q.toString();
    return apiCall(`/api/payroll/final-settlements${qs ? `?${qs}` : ''}`);
  },
  // { employee_id, employee_code, employee_name, last_working_date, exit_type?, ...+ optional nested notice_period/salary_breakdown/leave_encashment/bonus/gratuity/deduction/assets/payment }
  create: (data) => apiCall('/api/payroll/final-settlements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getByEmployee: (employeeId) => apiCall(`/api/payroll/final-settlements/employee/${employeeId}`),
  get: (settlementId) => apiCall(`/api/payroll/final-settlements/${settlementId}`),
  update: (settlementId, data) => apiCall(`/api/payroll/final-settlements/${settlementId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  remove: (settlementId) => apiCall(`/api/payroll/final-settlements/${settlementId}`, { method: 'DELETE' }),
 
  recalculate: (settlementId) => apiCall(`/api/payroll/final-settlements/${settlementId}/recalculate`, { method: 'POST' }),
  submit: (settlementId, submittedByName) => apiCall(`/api/payroll/final-settlements/${settlementId}/submit${submittedByName ? `?submitted_by_name=${encodeURIComponent(submittedByName)}` : ''}`, { method: 'POST' }),
  approve: (settlementId, data) => apiCall(`/api/payroll/final-settlements/${settlementId}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) }),
  reject: (settlementId, data) => apiCall(`/api/payroll/final-settlements/${settlementId}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  pay: (settlementId, data) => apiCall(`/api/payroll/final-settlements/${settlementId}/pay`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) }),
  cancel: (settlementId, reason, cancelledByName) => {
    const q = new URLSearchParams({ reason });
    if (cancelledByName) q.append('cancelled_by_name', cancelledByName);
    return apiCall(`/api/payroll/final-settlements/${settlementId}/cancel?${q.toString()}`, { method: 'POST' });
  },
 
  updateNoticePeriod: (settlementId, data) => apiCall(`/api/payroll/final-settlements/${settlementId}/notice-period`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateSalaryBreakdown: (settlementId, data) => apiCall(`/api/payroll/final-settlements/${settlementId}/salary-breakdown`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateLeaveEncashment: (settlementId, data) => apiCall(`/api/payroll/final-settlements/${settlementId}/leave-encashment`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateBonus: (settlementId, data) => apiCall(`/api/payroll/final-settlements/${settlementId}/bonus`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateGratuity: (settlementId, data) => apiCall(`/api/payroll/final-settlements/${settlementId}/gratuity`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  // NOTE: do not pass notice_period_recovery/asset_penalty — those are computed automatically.
  updateDeductions: (settlementId, data) => apiCall(`/api/payroll/final-settlements/${settlementId}/deductions`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
 
  addAsset: (settlementId, data) => apiCall(`/api/payroll/final-settlements/${settlementId}/assets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  // return_status: 'returned' | 'lost' | 'damaged'
  updateAsset: (settlementId, assetId, data) => apiCall(`/api/payroll/final-settlements/${settlementId}/assets/${assetId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  removeAsset: (settlementId, assetId) => apiCall(`/api/payroll/final-settlements/${settlementId}/assets/${assetId}`, { method: 'DELETE' }),
 
  updatePaymentInfo: (settlementId, data) => apiCall(`/api/payroll/final-settlements/${settlementId}/payment`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
 
  // doc_type: 'Form16' | 'Form19' | 'Form10C' | 'Experience Letter' | 'Relieving Letter'
  generateDocument: (settlementId, docType, generatedBy) => apiCall(`/api/payroll/final-settlements/${settlementId}/documents/${encodeURIComponent(docType)}/generate${generatedBy ? `?generated_by=${encodeURIComponent(generatedBy)}` : ''}`, { method: 'POST' }),
  issueDocument: (settlementId, docType) => apiCall(`/api/payroll/final-settlements/${settlementId}/documents/${encodeURIComponent(docType)}/issue`, { method: 'POST' }),
 
  exportSingle: (settlementId) => apiCall(`/api/payroll/final-settlements/${settlementId}/export`),
};
 
// ==========================================
// STATUTORY COMPLIANCE APIs (PF/ESI/ECR/VPF/UAN)
// ==========================================
export const statutoryComplianceAPI = {
  getDashboard: () => apiCall('/api/payroll/statutory/dashboard'),
 
  getConfig: () => apiCall('/api/payroll/statutory/config'),
  createConfig: (data) => apiCall('/api/payroll/statutory/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateConfig: (configId, data) => apiCall(`/api/payroll/statutory/config/${configId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
 
  getEligibilityRule: () => apiCall('/api/payroll/statutory/eligibility'),
  // { config_id, minimum_salary?, maximum_salary?, allow_permanent?, allow_contract?, allow_intern?, allow_part_time?, probation_period_days?, auto_enroll_eligible? }
  createEligibilityRule: (data) => apiCall('/api/payroll/statutory/eligibility', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateEligibilityRule: (ruleId, data) => apiCall(`/api/payroll/statutory/eligibility/${ruleId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
 
  listPfStatements: (params = {}) => {
    const q = new URLSearchParams();
    if (params.month) q.append('month', params.month);
    if (params.year) q.append('year', params.year);
    if (params.employeeId != null) q.append('employee_id', params.employeeId);
    const qs = q.toString();
    return apiCall(`/api/payroll/statutory/pf-statements${qs ? `?${qs}` : ''}`);
  },
  createPfStatement: (data) => apiCall('/api/payroll/statutory/pf-statements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updatePfStatement: (statementId, data) => apiCall(`/api/payroll/statutory/pf-statements/${statementId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  // Real server-side generation from actual payroll data for the given month/year.
  generatePfStatements: (month, year) => apiCall(`/api/payroll/statutory/pf-statements/generate?month=${month}&year=${year}`, { method: 'POST' }),
 
  listRemittance: (year) => apiCall(`/api/payroll/statutory/remittance${year ? `?year=${year}` : ''}`),
  createRemittance: (data) => apiCall('/api/payroll/statutory/remittance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateRemittance: (summaryId, data) => apiCall(`/api/payroll/statutory/remittance/${summaryId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  generateRemittance: (month, year) => apiCall(`/api/payroll/statutory/remittance/generate?month=${month}&year=${year}`, { method: 'POST' }),
 
  listEcrRecords: (year) => apiCall(`/api/payroll/statutory/ecr${year ? `?year=${year}` : ''}`),
  createEcrRecord: (data) => apiCall('/api/payroll/statutory/ecr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateEcrRecord: (ecrId, data) => apiCall(`/api/payroll/statutory/ecr/${ecrId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  // Real server-side generation from the PF statements already on file.
  generateEcr: (month, year) => apiCall(`/api/payroll/statutory/ecr/generate?month=${month}&year=${year}`, { method: 'POST' }),
  submitEcr: (ecrId) => apiCall(`/api/payroll/statutory/ecr/${ecrId}/submit`, { method: 'POST' }),
 
  listVpfRecords: () => apiCall('/api/payroll/statutory/vpf'),
  createVpfRecord: (data) => apiCall('/api/payroll/statutory/vpf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateVpfRecord: (vpfId, data) => apiCall(`/api/payroll/statutory/vpf/${vpfId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
 
  listUanRecords: () => apiCall('/api/payroll/statutory/uan'),
  createUanRecord: (data) => apiCall('/api/payroll/statutory/uan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateUanRecord: (uanId, data) => apiCall(`/api/payroll/statutory/uan/${uanId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  activateUan: (uanId) => apiCall(`/api/payroll/statutory/uan/${uanId}/activate`, { method: 'POST' }),
};

 
// ==========================================
// PAYROLL REPORTS (Reports module) — /api/reports/payroll
// Distinct from payrollReportsAPI (/api/payroll/payroll-reports) above.
// IMPORTANT: stats(), listCatalogue(), getCategorySummary(), and
// getRecentActivity() are backend-hardcoded placeholders as of this
// backend version — e.g. get_payroll_report_stats() always returns
// total_reports=25 as a literal, list() returns a static Python array
// with the same fake status="New"/last_generated="2024-01-15" for every
// entry regardless of real data, and recent-activity returns 4 fixed
// canned entries. Wiring the frontend to them is correct (they're real
// endpoints, not 404s) but they won't reflect actual usage until the
// backend itself implements real queries — that's backend work, not
// something fixable from here.
// Also note: pf_employer in getPfRemittance()'s response appears to be a
// backend bug — it's set to the same value as pf_employee (a likely
// copy-paste error in the router), not a real employer contribution.
// ==========================================
export const reportsPayrollAPI = {
  getStats: () => apiCall('/api/reports/payroll/stats'),
  listCatalogue: (params = {}) => {
    const q = new URLSearchParams();
    if (params.category) q.append('category', params.category);
    if (params.reportType) q.append('report_type', params.reportType);
    if (params.frequency) q.append('frequency', params.frequency);
    const qs = q.toString();
    return apiCall(`/api/reports/payroll/list${qs ? `?${qs}` : ''}`);
  },
  getCategorySummary: () => apiCall('/api/reports/payroll/category-summary'),
  getRecentActivity: () => apiCall('/api/reports/payroll/recent-activity'),
 
  getMonthlyPayrollSummary: (month, year) => {
    const q = new URLSearchParams();
    if (month) q.append('month', month);
    if (year) q.append('year', year);
    const qs = q.toString();
    return apiCall(`/api/reports/payroll/monthly-payroll-summary${qs ? `?${qs}` : ''}`);
  },
  getDepartmentWisePayroll: () => apiCall('/api/reports/payroll/department-wise-payroll'),
  getGradeWiseSalary: () => apiCall('/api/reports/payroll/grade-wise-salary'),
  getBankTransferSummary: () => apiCall('/api/reports/payroll/bank-transfer-summary'),
  getLoanOutstanding: () => apiCall('/api/reports/payroll/loan-outstanding'),
  getPfRemittance: (month, year) => {
    const q = new URLSearchParams();
    if (month) q.append('month', month);
    if (year) q.append('year', year);
    const qs = q.toString();
    return apiCall(`/api/reports/payroll/pf-remittance${qs ? `?${qs}` : ''}`);
  },
  getTdsReport: (month, year) => {
    const q = new URLSearchParams();
    if (month) q.append('month', month);
    if (year) q.append('year', year);
    const qs = q.toString();
    return apiCall(`/api/reports/payroll/tds-report${qs ? `?${qs}` : ''}`);
  },
  getPayrollVariance: () => apiCall('/api/reports/payroll/payroll-variance'),
};

const apiServices = {
  authAPI,
  locationAPI,
  jobAPI,
  assetsAPI,
  candidateAPI,
  pipelineAPI,
  analyticsAPI,
  assessmentAPI,
  aiInterviewAPI,
  hrAPI,
  resumeAPI,
  activitiesAPI,
  contactsAPI,
  leadsAPI,
  dealsAPI,
  companiesAPI,
  crmPipelinesAPI,
  adminAPI,
  employeeAPI,
  attendanceAPI,
  regularizationAPI,
  payrollAPI,
  payrollReportsAPI,
  hrOpsAPI,
  reportsAPI,
  formsAPI,
  superAdminAPI,
  bgvAPI,
  probationAPI,
  buddyMentorAPI,
  inductionAPI,
  reimbursementAPI,
  finalSettlementAPI,
  statutoryComplianceAPI,
  reportsPayrollAPI,
};

export default apiServices;