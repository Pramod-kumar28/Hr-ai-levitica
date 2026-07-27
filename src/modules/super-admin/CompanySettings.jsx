import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BASE_URL } from '../../shared/constants/api.config';

const authHeader = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// The company-settings/profile/ backend endpoint takes multipart/form-data
// (it also accepts an optional logo file upload), not JSON — this builds
// the FormData payload from our camelCase UI state.
const buildProfileFormData = (profile) => {
  const fd = new FormData();
  const map = {
    company_name: profile.name,
    company_type: profile.companyType,
    company_website: profile.website,
    email: profile.email,
    phone: profile.phone,
    address: profile.address,
    about_company: profile.about,
    registration_number: profile.registrationNumber,
    tax_id: profile.taxId,
    vat_gst_number: profile.vatNumber,
    industry: profile.industry,
    legal_entity_name: profile.legalEntity,
    year_founded: profile.foundedYear,
    registration_date: profile.registrationDate,
    registration_authority: profile.registrationAuthority,
    incorporation_number: profile.incorporationNumber,
  };
  Object.entries(map).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') fd.append(key, value);
  });
  return fd;
};

const fromBackendProfile = (p) => ({
  name: p.company_name || '',
  registrationNumber: p.registration_number || '',
  taxId: p.tax_id || '',
  vatNumber: p.vat_gst_number || '',
  companyType: p.company_type || '',
  industry: p.industry || '',
  foundedYear: p.year_founded ? String(p.year_founded) : '',
  legalEntity: p.legal_entity_name || '',
  registrationDate: p.registration_date || '',
  registrationAuthority: p.registration_authority || '',
  incorporationNumber: p.incorporation_number || '',
  website: p.company_website || '',
  email: p.email || '',
  phone: p.phone || '',
  address: p.address || '',
  about: p.about_company || '',
});

const CURRENCY_LABELS = {
  USD: 'USD - US Dollar',
  EUR: 'EUR - Euro',
  GBP: 'GBP - British Pound',
  INR: 'INR - Indian Rupee',
  JPY: 'JPY - Japanese Yen',
};

const fromBackendCurrencySettings = (c) => ({
  primaryCurrency: CURRENCY_LABELS[c.primary_currency] || c.primary_currency || 'USD - US Dollar',
  secondaryCurrency: c.secondary_currency ? (CURRENCY_LABELS[c.secondary_currency] || c.secondary_currency) : '',
  multiCurrencyEnabled: !!c.multi_currency_enabled,
  autoUpdateRates: !!c.auto_update,
  updateFrequency: (c.update_frequency || 'Daily').toLowerCase(),
  lastUpdated: c.last_updated || '',
});

// The UI's currency dropdowns use full labels like "USD - US Dollar" as
// the value, but the backend's primary_currency/secondary_currency
// columns are VARCHAR(10) — only enough room for the code. Extract just
// the code portion before sending.
const currencyCode = (value) => (value || '').split(' - ')[0].trim();

const toBackendCurrencySettings = (c) => ({
  primary_currency: currencyCode(c.primaryCurrency),
  secondary_currency: c.secondaryCurrency ? currencyCode(c.secondaryCurrency) : null,
  multi_currency_enabled: c.multiCurrencyEnabled,
  auto_update: c.autoUpdateRates,
  // backend only accepts "Daily" | "Weekly" | "Monthly" (capitalized)
  update_frequency: c.updateFrequency
    ? c.updateFrequency.charAt(0).toUpperCase() + c.updateFrequency.slice(1).toLowerCase()
    : 'Daily',
});

const PERIOD_TYPE_MAP = { fiscal: 'Fiscal Year', calendar: 'Calendar Year', custom: 'Fiscal Year' };
const PERIOD_TYPE_MAP_REVERSE = { 'Fiscal Year': 'fiscal', 'Calendar Year': 'calendar', '52-Week Year': 'custom' };
const TAX_ALIGN_MAP = { calendar: 'Calendar Year', fiscal: 'Fiscal Year', different: 'Custom' };
const TAX_ALIGN_MAP_REVERSE = { 'Calendar Year': 'calendar', 'Fiscal Year': 'fiscal', Custom: 'different' };

const fromBackendFinancialYear = (f) => ({
  startMonth: f.start_month,
  startDay: f.start_day,
  endMonth: f.end_month,
  endDay: f.end_day,
  currentYear: f.current_year,
  previousYear: f.previous_year,
  nextYear: f.next_year,
  periodType: PERIOD_TYPE_MAP_REVERSE[f.period_type] || 'fiscal',
  taxYear: TAX_ALIGN_MAP_REVERSE[f.tax_year_alignment] || 'calendar',
});

const toBackendFinancialYear = (f) => ({
  start_month: f.startMonth,
  start_day: f.startDay,
  end_month: f.endMonth,
  end_day: f.endDay,
  // backend has no "Custom Period" equivalent — "custom" UI selection
  // falls back to Fiscal Year rather than being rejected outright.
  period_type: PERIOD_TYPE_MAP[f.periodType] || 'Fiscal Year',
  tax_year_alignment: TAX_ALIGN_MAP[f.taxYear] || 'Calendar Year',
});

const TIME_FORMAT_MAP = { '12h': '12-hour', '24h': '24-hour' };
const TIME_FORMAT_MAP_REVERSE = {
  '12-hour (hh:mm AM/PM)': '12h', '12-hour': '12h',
  '24-hour (HH:mm)': '24h', '24-hour': '24h',
};

const fromBackendLocalization = (l) => ({
  defaultLanguage: l.default_language,
  dateFormat: l.date_format,
  timeFormat: TIME_FORMAT_MAP_REVERSE[l.time_format] || '12h',
  numberFormat: l.number_format,
  decimalPlaces: l.decimal_places,
  currencyFormat: l.currency_format,
  firstDayOfWeek: l.first_day_of_week,
  timezone: l.default_timezone,
});

const toBackendLocalization = (l) => ({
  default_language: l.defaultLanguage,
  default_timezone: l.timezone,
  date_format: l.dateFormat,
  time_format: TIME_FORMAT_MAP[l.timeFormat] || '12-hour',
  number_format: l.numberFormat,
  decimal_places: l.decimalPlaces,
  currency_format: l.currencyFormat,
  first_day_of_week: l.firstDayOfWeek,
});

const POLICY_STATUS_TO_BACKEND = { active: 'Active', draft: 'Draft', archived: 'Archived', expired: 'Expired' };
const POLICY_STATUS_FROM_BACKEND = { Active: 'active', Draft: 'draft', Archived: 'archived', Expired: 'expired' };

const fromBackendPolicy = (p) => ({
  id: p.id,
  title: p.title,
  category: p.category,
  version: p.version,
  effectiveDate: p.effective_date,
  status: POLICY_STATUS_FROM_BACKEND[p.status] || p.status.toLowerCase(),
  fileSize: p.document_size_bytes ? `${(p.document_size_bytes / (1024 * 1024)).toFixed(2)} MB` : 'N/A',
  lastUpdated: p.updated_at ? p.updated_at.split('T')[0] : '',
  description: p.description || '',
});

const buildPolicyFormData = (policy, isUpdate = false) => {
  const fd = new FormData();
  if (policy.title !== undefined) fd.append('title', policy.title);
  if (policy.category !== undefined) fd.append('category', policy.category);
  if (policy.version !== undefined) fd.append('version', policy.version);
  if (policy.effectiveDate !== undefined) fd.append('effective_date', policy.effectiveDate);
  if (policy.description) fd.append('description', policy.description);
  if (isUpdate && policy.status) fd.append('status', POLICY_STATUS_TO_BACKEND[policy.status] || policy.status);
  if (policy.file) fd.append('document', policy.file);
  return fd;
};

const fromBackendNotifications = (n) => ({
  emailNotifications: {
    systemAlerts: n.email_system_alerts,
    payrollUpdates: n.email_payroll_updates,
    leaveApprovals: n.email_leave_approvals,
    attendanceReminders: n.email_attendance_reminders,
    policyUpdates: n.email_policy_updates,
    securityAlerts: n.email_security_alerts,
    weeklyReports: n.email_weekly_reports,
    monthlySummaries: n.email_monthly_summaries,
  },
  pushNotifications: {
    mobileAlerts: n.push_mobile_alerts,
    desktopAlerts: n.push_desktop_alerts,
    instantUpdates: n.push_instant_updates,
    scheduledSummary: n.push_scheduled_summary,
  },
  smsNotifications: {
    urgentAlerts: n.sms_urgent_alerts,
    otpVerification: n.sms_otp_verification,
    payrollCredits: n.sms_payroll_credits,
    attendanceReminders: n.sms_attendance_reminders,
  },
});

const toBackendNotifications = (n) => ({
  email: {
    system_alerts: n.emailNotifications.systemAlerts,
    payroll_updates: n.emailNotifications.payrollUpdates,
    leave_approvals: n.emailNotifications.leaveApprovals,
    attendance_reminders: n.emailNotifications.attendanceReminders,
    policy_updates: n.emailNotifications.policyUpdates,
    security_alerts: n.emailNotifications.securityAlerts,
    weekly_reports: n.emailNotifications.weeklyReports,
    monthly_summaries: n.emailNotifications.monthlySummaries,
  },
  push: {
    mobile_alerts: n.pushNotifications.mobileAlerts,
    desktop_alerts: n.pushNotifications.desktopAlerts,
    instant_updates: n.pushNotifications.instantUpdates,
    scheduled_summary: n.pushNotifications.scheduledSummary,
  },
  sms: {
    urgent_alerts: n.smsNotifications.urgentAlerts,
    otp_verification: n.smsNotifications.otpVerification,
    payroll_credits: n.smsNotifications.payrollCredits,
    attendance_reminders: n.smsNotifications.attendanceReminders,
  },
});

const fromBackendLocation = (l) => ({
  id: l.id,
  name: l.name,
  address: l.address || '',
  timezone: l.timezone,
  weekendDays: l.weekend_days ? l.weekend_days.split(',').map(d => d.trim()).filter(Boolean) : [],
  workingHours: { start: l.working_hours_start || '09:00', end: l.working_hours_end || '18:00' },
  isDefault: !!l.is_default,
  status: l.is_active ? 'active' : 'inactive',
  employeeCount: l.employee_count || 0,
});

const toBackendLocation = (loc) => ({
  name: loc.name,
  address: loc.address,
  timezone: loc.timezone,
  working_hours_start: loc.workingHours?.start,
  working_hours_end: loc.workingHours?.end,
  weekend_days: (loc.weekendDays || []).join(','),
  is_default: !!loc.isDefault,
  is_active: loc.status ? loc.status === 'active' : true,
});

const CONSENT_KEYS = ['marketing', 'data_sharing', 'analytics', 'third_party', 'profiling', 'automated_decisions'];

const fromBackendDataPrivacy = (d) => ({
  dataRetentionPeriod: d.data_retention_period_years,
  autoDeleteInactiveAccounts: d.auto_delete_inactive_accounts,
  inactiveAccountPeriod: d.inactive_account_period_days,
  gdprCompliance: d.gdpr_compliance_enabled,
  dataProcessingConsent: d.require_data_processing_consent,
  dataExportEnabled: d.allow_data_export,
  dataAnonymization: d.enable_data_anonymization,
  consentRequiredFor: CONSENT_KEYS.filter(key => d[`consent_${key}`]),
  privacyPolicyVersion: d.privacy_policy_version,
  lastConsentUpdate: d.last_consent_update || '',
});

const toBackendDataPrivacy = (d) => ({
  data_retention_period_years: d.dataRetentionPeriod,
  inactive_account_period_days: d.inactiveAccountPeriod,
  auto_delete_inactive_accounts: d.autoDeleteInactiveAccounts,
  gdpr_compliance_enabled: d.gdprCompliance,
  require_data_processing_consent: d.dataProcessingConsent,
  allow_data_export: d.dataExportEnabled,
  enable_data_anonymization: d.dataAnonymization,
  consent: Object.fromEntries(
    CONSENT_KEYS.map(key => [key, (d.consentRequiredFor || []).includes(key)])
  ),
  privacy_policy_version: d.privacyPolicyVersion,
  last_consent_update: d.lastConsentUpdate || null,
});

const fromBackendRate = (r) => ({
  id: r.id,
  from: r.from_currency,
  to: r.to_currency,
  rate: r.rate,
  lastUpdated: r.last_updated ? r.last_updated.split('T')[0] : '',
  status: r.status,
});

const CompanySettings = () => {
  // ---------------- INITIAL STATES ----------------
  const [activeTab, setActiveTab] = useState('company-profile');
  const [profileExists, setProfileExists] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // ---------------- COMPANY PROFILE ----------------
  const [companyProfile, setCompanyProfile] = useState({
    name: 'TechCorp Solutions',
    registrationNumber: 'REG-2024-001234',
    taxId: 'TAX-789456123',
    vatNumber: 'VAT-456789123',
    companyType: 'Private Limited',
    industry: 'Information Technology',
    foundedYear: '2015',
    legalEntity: 'TechCorp Solutions Pvt. Ltd.',
    registrationDate: '2015-03-15',
    registrationAuthority: 'Ministry of Corporate Affairs',
    incorporationNumber: 'INC-789456123',
    website: '',
    email: '',
    phone: '',
    address: '',
    about: ''
  });

  // ---------------- LOGO UPLOAD ----------------
  const [logo, setLogo] = useState(() => {
    const savedLogo = localStorage.getItem('companyLogo');
    if (savedLogo) {
      try {
        return JSON.parse(savedLogo);
      } catch (e) {
        // If parsing fails, use default
      }
    }
    return {
      file: null,
      preview: 'assets/images/asset/NewLogo.png',
      name: 'company_logo.png',
      size: '1.2 MB'
    };
  });

  // ---------------- CURRENCY SETTINGS ----------------
  const [currencySettings, setCurrencySettings] = useState({
    primaryCurrency: 'USD - US Dollar',
    secondaryCurrency: 'INR - Indian Rupee',
    multiCurrencyEnabled: true,
    autoUpdateRates: true,
    updateFrequency: 'daily',
    lastUpdated: '2024-12-15 10:30:00'
  });

  const [exchangeRates, setExchangeRates] = useState([
    { id: 1, from: 'USD', to: 'INR', rate: 83.45, lastUpdated: '2024-12-15', status: 'active' },
    { id: 2, from: 'USD', to: 'EUR', rate: 0.92, lastUpdated: '2024-12-15', status: 'active' },
    { id: 3, from: 'USD', to: 'GBP', rate: 0.79, lastUpdated: '2024-12-15', status: 'active' },
    { id: 4, from: 'USD', to: 'JPY', rate: 142.50, lastUpdated: '2024-12-14', status: 'active' },
    { id: 5, from: 'USD', to: 'AED', rate: 3.67, lastUpdated: '2024-12-15', status: 'active' }
  ]);

  // ---------------- LOCATION SETTINGS ----------------
 const [locations, setLocations] = useState([
    { 
      id: 1, 
      name: 'Headquarters', 
      address: '123 Tech Street, Silicon Valley, CA 94000',
      timezone: 'America/Los_Angeles',
      weekendDays: ['Saturday', 'Sunday'],
      workingHours: { start: '09:00', end: '18:00' },
      isDefault: true,
      status: 'active'
    },
    { 
      id: 2, 
      name: 'India Development Center', 
      address: '456 IT Park, Bangalore, Karnataka 560001',
      timezone: 'Asia/Kolkata',
      weekendDays: ['Sunday'],
      workingHours: { start: '09:30', end: '18:30' },
      isDefault: false,
      status: 'active'
    },
    { 
      id: 3, 
      name: 'EMEA Office', 
      address: '789 Business Ave, London, UK EC1A',
      timezone: 'Europe/London',
      weekendDays: ['Saturday', 'Sunday'],
      workingHours: { start: '08:30', end: '17:30' },
      isDefault: false,
      status: 'active'
    }
  ]);

  // ---------------- FINANCIAL YEAR SETTINGS ----------------
  const [financialYear, setFinancialYear] = useState({
    startMonth: 'April',
    startDay: 1,
    endMonth: 'March',
    endDay: 31,
    currentYear: '2024-2025',
    previousYear: '2023-2024',
    nextYear: '2025-2026',
    periodType: 'fiscal',
    taxYear: 'calendar'
  });

  // ---------------- LOCALIZATION SETTINGS ----------------
  const [localization, setLocalization] = useState({
    defaultLanguage: 'en-US',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    numberFormat: '1,234.56',
    decimalPlaces: 2,
    currencyFormat: '$1,234.56',
    firstDayOfWeek: 'Monday',
    timezone: 'America/Los_Angeles'
  });

  // ---------------- POLICIES & GUIDELINES ----------------
  const [policies, setPolicies] = useState([
    {
      id: 1,
      title: 'Employee Code of Conduct',
      category: 'HR Policies',
      version: '2.1',
      effectiveDate: '2024-01-01',
      status: 'active',
      fileSize: '1.5 MB',
      lastUpdated: '2024-11-15',
      description: 'This policy outlines the expected behavior and conduct for all employees...'
    },
    {
      id: 2,
      title: 'Data Privacy Policy',
      category: 'Compliance',
      version: '3.0',
      effectiveDate: '2024-03-01',
      status: 'active',
      fileSize: '2.1 MB',
      lastUpdated: '2024-10-20',
      description: 'This policy describes how we collect, use, and protect personal data...'
    },
    {
      id: 3,
      title: 'Information Security Policy',
      category: 'IT Policies',
      version: '1.5',
      effectiveDate: '2024-02-15',
      status: 'active',
      fileSize: '1.8 MB',
      lastUpdated: '2024-09-10',
      description: 'This policy establishes guidelines for protecting company information assets...'
    },
    {
      id: 4,
      title: 'Remote Work Policy',
      category: 'HR Policies',
      version: '1.2',
      effectiveDate: '2024-04-01',
      status: 'active',
      fileSize: '0.9 MB',
      lastUpdated: '2024-08-05',
      description: 'This policy provides guidelines for employees working remotely...'
    },
    {
      id: 5,
      title: 'Expense Reimbursement Policy',
      category: 'Finance',
      version: '2.3',
      effectiveDate: '2024-01-15',
      status: 'draft',
      fileSize: '1.1 MB',
      lastUpdated: '2024-12-01',
      description: 'This policy outlines the process for employee expense reimbursement...'
    }
  ]);

  // ---------------- NOTIFICATION PREFERENCES ----------------
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: {
      systemAlerts: true,
      payrollUpdates: true,
      leaveApprovals: true,
      attendanceReminders: true,
      policyUpdates: true,
      securityAlerts: true,
      weeklyReports: false,
      monthlySummaries: true
    },
    pushNotifications: {
      mobileAlerts: true,
      desktopAlerts: false,
      instantUpdates: true,
      scheduledSummary: false
    },
    smsNotifications: {
      urgentAlerts: true,
      otpVerification: true,
      payrollCredits: false,
      attendanceReminders: false
    }
  });

  // ---------------- DATA PRIVACY SETTINGS ----------------
  const [dataPrivacy, setDataPrivacy] = useState({
    dataRetentionPeriod: 7, // Years
    autoDeleteInactiveAccounts: true,
    inactiveAccountPeriod: 365, // Days
    gdprCompliance: true,
    dataProcessingConsent: true,
    dataExportEnabled: true,
    dataAnonymization: false,
    consentRequiredFor: ['marketing', 'data_sharing', 'analytics', 'third_party'],
    privacyPolicyVersion: '3.0',
    lastConsentUpdate: '2024-11-20'
  });

  // ---------------- TIMEZONES LIST ----------------
  const timezones = [
    'America/Los_Angeles',
    'America/New_York',
    'Europe/London',
    'Europe/Berlin',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Africa/Cairo',
    'Pacific/Auckland'
  ];

  // ---------------- LANGUAGES LIST ----------------
  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'ar-SA', name: 'Arabic' }
  ];

  // ---------------- DATE FORMATS ----------------
  const dateFormats = [
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY-MM-DD',
    'DD MMM YYYY',
    'MMMM DD, YYYY'
  ];

  // ---------------- UI STATES ----------------
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showEditLocation, setShowEditLocation] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [showAddExchangeRate, setShowAddExchangeRate] = useState(false);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showDataPrivacyModal, setShowDataPrivacyModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showEditExchangeRate, setShowEditExchangeRate] = useState(false);
  const [showViewPolicyModal, setShowViewPolicyModal] = useState(false);
  const [showEditPolicyModal, setShowEditPolicyModal] = useState(false);

  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedExchangeRate, setSelectedExchangeRate] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [editingExchangeRate, setEditingExchangeRate] = useState(null);
  const [viewingPolicy, setViewingPolicy] = useState(null);
  const [editingPolicy, setEditingPolicy] = useState(null);

  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    timezone: '',
    weekendDays: ['Saturday', 'Sunday'],
    workingHours: { start: '09:00', end: '18:00' }
  });

  const [newExchangeRate, setNewExchangeRate] = useState({
    from: 'USD',
    to: '',
    rate: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  const [newPolicy, setNewPolicy] = useState({
    title: '',
    category: 'HR Policies',
    version: '1.0',
    effectiveDate: new Date().toISOString().split('T')[0],
    description: '',
    file: null
  });

  // ---------------- HANDLERS ----------------
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newLogo = {
          file: file,
          preview: reader.result,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        };
        setLogo(newLogo);
        localStorage.setItem('companyLogo', JSON.stringify(newLogo));
        window.dispatchEvent(new Event('companyLogoUpdated'));
      };
      reader.readAsDataURL(file);
    }
    setShowLogoUpload(false);
  };

  const handleCompanyProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/company-settings/profile/`, {
        method: profileExists ? 'PUT' : 'POST',
        headers: authHeader(),
        body: buildProfileFormData(companyProfile),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to save company profile');
      }
      const saved = await res.json();
      setCompanyProfile(fromBackendProfile(saved));
      setProfileExists(true);

      if (logo.preview) {
        localStorage.setItem('companyLogo', JSON.stringify(logo));
        window.dispatchEvent(new Event('companyLogoUpdated'));
      }
      alert('Company profile updated successfully!');
    } catch (err) {
      alert(`Failed to save company profile: ${err.message}`);
    }
  };

  // Load the real company profile on mount (falls back to the placeholder
  // defaults above if none has been created yet for this tenant).
  useEffect(() => {
    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/company-settings/profile/`, {
          headers: authHeader(),
        });
        if (res.status === 404) {
          setProfileExists(false);
          return;
        }
        if (!res.ok) throw new Error('Failed to load company profile');
        const data = await res.json();
        setCompanyProfile(fromBackendProfile(data));
        setProfileExists(true);
      } catch (err) {
        console.error(err);
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Load real currency settings + exchange rates on mount.
  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const res = await fetch(`${BASE_URL}/company-settings/currency/settings`, {
          headers: authHeader(),
        });
        if (res.ok) {
          setCurrencySettings(fromBackendCurrencySettings(await res.json()));
        }
        // 404 (not configured yet) is fine — keep the placeholder defaults.
      } catch (err) {
        console.error(err);
      }

      try {
        const res = await fetch(`${BASE_URL}/company-settings/currency/rates`, {
          headers: authHeader(),
        });
        if (res.ok) {
          const data = await res.json();
          setExchangeRates(data.map(fromBackendRate));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadCurrency();
  }, []);

  // Load real financial year on mount.
  useEffect(() => {
    const loadFinancialYear = async () => {
      try {
        const res = await fetch(`${BASE_URL}/company-settings/financial-year/current`, {
          headers: authHeader(),
        });
        if (res.ok) {
          setFinancialYear(fromBackendFinancialYear(await res.json()));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadFinancialYear();
  }, []);

  // Load real localization settings on mount.
  useEffect(() => {
    const loadLocalization = async () => {
      try {
        const res = await fetch(`${BASE_URL}/company-settings/localization/`, {
          headers: authHeader(),
        });
        if (res.ok) {
          setLocalization(fromBackendLocalization(await res.json()));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadLocalization();
  }, []);

  // Load real policies list on mount.
  useEffect(() => {
    const loadPolicies = async () => {
      try {
        const res = await fetch(`${BASE_URL}/company-settings/policies/`, {
          headers: authHeader(),
        });
        if (res.ok) {
          const data = await res.json();
          setPolicies(data.policies.map(fromBackendPolicy));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadPolicies();
  }, []);

  // Load real notification preferences on mount.
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await fetch(`${BASE_URL}/company-settings/notifications/`, {
          headers: authHeader(),
        });
        if (res.ok) {
          setNotificationPrefs(fromBackendNotifications(await res.json()));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadNotifications();
  }, []);

  // Load real locations list on mount.
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const res = await fetch(`${BASE_URL}/company-settings/locations/`, {
          headers: authHeader(),
        });
        if (res.ok) {
          const data = await res.json();
          setLocations(data.locations.map(fromBackendLocation));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadLocations();
  }, []);

  // Load real data privacy settings on mount.
  useEffect(() => {
    const loadDataPrivacy = async () => {
      try {
        const res = await fetch(`${BASE_URL}/company-settings/data-privacy/`, {
          headers: authHeader(),
        });
        if (res.ok) {
          setDataPrivacy(fromBackendDataPrivacy(await res.json()));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadDataPrivacy();
  }, []);

  const handleCurrencySettingsUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/company-settings/currency/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(toBackendCurrencySettings(currencySettings)),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to save currency settings');
      }
      const saved = await res.json();
      setCurrencySettings(fromBackendCurrencySettings(saved));
      alert('Currency settings updated successfully!');
    } catch (err) {
      alert(`Failed to save currency settings: ${err.message}`);
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/company-settings/locations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(toBackendLocation({ ...newLocation, isDefault: false, status: 'active' })),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to add location');
      }
      const created = await res.json();
      setLocations([...locations, fromBackendLocation(created)]);
      setShowAddLocation(false);
      setNewLocation({
        name: '',
        address: '',
        timezone: '',
        weekendDays: ['Saturday', 'Sunday'],
        workingHours: { start: '09:00', end: '18:00' }
      });
    } catch (err) {
      alert(`Failed to add location: ${err.message}`);
    }
  };

  const handleOpenEditLocation = (location) => {
    setEditingLocationId(location.id);
    setNewLocation({
      name: location.name,
      address: location.address,
      timezone: location.timezone,
      weekendDays: location.weekendDays,
      workingHours: { ...location.workingHours },
    });
    setShowEditLocation(true);
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/company-settings/locations/${editingLocationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(toBackendLocation({ ...newLocation, isDefault: false, status: 'active' })),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to update location');
      }
      const updated = await res.json();
      setLocations(locations.map(loc => (loc.id === editingLocationId ? fromBackendLocation(updated) : loc)));
      setShowEditLocation(false);
      setEditingLocationId(null);
      setNewLocation({
        name: '',
        address: '',
        timezone: '',
        weekendDays: ['Saturday', 'Sunday'],
        workingHours: { start: '09:00', end: '18:00' }
      });
    } catch (err) {
      alert(`Failed to update location: ${err.message}`);
    }
  };

  const handleAddExchangeRate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/company-settings/currency/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          from_currency: newExchangeRate.from,
          to_currency: newExchangeRate.to,
          rate: parseFloat(newExchangeRate.rate),
          effective_date: newExchangeRate.effectiveDate
            ? new Date(newExchangeRate.effectiveDate).toISOString()
            : new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to add exchange rate');
      }
      const created = await res.json();
      setExchangeRates([...exchangeRates, fromBackendRate(created)]);
      setShowAddExchangeRate(false);
      setNewExchangeRate({
        from: 'USD',
        to: '',
        rate: '',
        effectiveDate: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      alert(`Failed to add exchange rate: ${err.message}`);
    }
  };

  const handleEditExchangeRate = (rate) => {
    setEditingExchangeRate({ ...rate });
    setShowEditExchangeRate(true);
  };

  const handleUpdateExchangeRate = async (e) => {
    e.preventDefault();
    if (!editingExchangeRate) return;
    try {
      const res = await fetch(`${BASE_URL}/company-settings/currency/rates/${editingExchangeRate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          rate: parseFloat(editingExchangeRate.rate),
          status: editingExchangeRate.status,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to update exchange rate');
      }
      const updated = await res.json();
      setExchangeRates(exchangeRates.map(rate =>
        rate.id === updated.id ? fromBackendRate(updated) : rate
      ));
      setShowEditExchangeRate(false);
      setEditingExchangeRate(null);
      alert('Exchange rate updated successfully!');
    } catch (err) {
      alert(`Failed to update exchange rate: ${err.message}`);
    }
  };

  const handleAddPolicy = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/company-settings/policies/`, {
        method: 'POST',
        headers: authHeader(),
        body: buildPolicyFormData(newPolicy, false),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to add policy');
      }
      const created = await res.json();
      setPolicies([...policies, fromBackendPolicy(created)]);
      setShowAddPolicy(false);
      setNewPolicy({
        title: '',
        category: 'HR Policies',
        version: '1.0',
        effectiveDate: new Date().toISOString().split('T')[0],
        description: '',
        file: null
      });
    } catch (err) {
      alert(`Failed to add policy: ${err.message}`);
    }
  };

  const handleViewPolicy = (policy) => {
    setViewingPolicy(policy);
    setShowViewPolicyModal(true);
  };

  const handleEditPolicy = (policy) => {
    setEditingPolicy({ ...policy });
    setShowEditPolicyModal(true);
  };

  const handleUpdatePolicy = async (e) => {
    e.preventDefault();
    if (!editingPolicy) return;
    try {
      const res = await fetch(`${BASE_URL}/company-settings/policies/${editingPolicy.id}`, {
        method: 'PUT',
        headers: authHeader(),
        body: buildPolicyFormData(editingPolicy, true),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to update policy');
      }
      const updated = await res.json();
      setPolicies(policies.map(policy =>
        policy.id === updated.id ? fromBackendPolicy(updated) : policy
      ));
      setShowEditPolicyModal(false);
      setEditingPolicy(null);
      alert('Policy updated successfully!');
    } catch (err) {
      alert(`Failed to update policy: ${err.message}`);
    }
  };

  const handleNotificationPrefsUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/company-settings/notifications/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(toBackendNotifications(notificationPrefs)),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to save notification preferences');
      }
      const saved = await res.json();
      setNotificationPrefs(fromBackendNotifications(saved));
      alert('Notification preferences updated successfully!');
    } catch (err) {
      alert(`Failed to save notification preferences: ${err.message}`);
    }
  };

  const handleDataPrivacyUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/company-settings/data-privacy/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(toBackendDataPrivacy(dataPrivacy)),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to save data privacy settings');
      }
      const saved = await res.json();
      setDataPrivacy(fromBackendDataPrivacy(saved));
      alert('Data privacy settings updated successfully!');
    } catch (err) {
      alert(`Failed to save data privacy settings: ${err.message}`);
    }
  };

  const handleLocalizationUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/company-settings/localization/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(toBackendLocalization(localization)),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to save localization settings');
      }
      const saved = await res.json();
      setLocalization(fromBackendLocalization(saved));
      alert('Localization settings updated successfully!');
    } catch (err) {
      alert(`Failed to save localization settings: ${err.message}`);
    }
  };

  const handleFinancialYearUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/company-settings/financial-year/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(toBackendFinancialYear(financialYear)),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to save financial year settings');
      }
      const saved = await res.json();
      setFinancialYear(fromBackendFinancialYear(saved));
      alert('Financial year settings updated successfully!');
    } catch (err) {
      alert(`Failed to save financial year settings: ${err.message}`);
    }
  };

  const handleViewMap = (address) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const handleViewMapWithModal = (address) => {
    setSelectedAddress(address);
    setShowMapModal(true);
  };

  const removeLocation = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/company-settings/locations/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to delete location');
      }
      setLocations(locations.filter(loc => loc.id !== id));
    } catch (err) {
      alert(`Failed to delete location: ${err.message}`);
    }
  };

  const removeExchangeRate = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/company-settings/currency/rates/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to delete exchange rate');
      }
      setExchangeRates(exchangeRates.filter(rate => rate.id !== id));
    } catch (err) {
      alert(`Failed to delete exchange rate: ${err.message}`);
    }
  };

  const removePolicy = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/company-settings/policies/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to delete policy');
      }
      setPolicies(policies.filter(policy => policy.id !== id));
    } catch (err) {
      alert(`Failed to delete policy: ${err.message}`);
    }
  };

  const setDefaultLocation = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/company-settings/locations/${id}/set-default`, {
        method: 'PATCH',
        headers: authHeader(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to set default location');
      }
      setLocations(locations.map(loc => ({
        ...loc,
        isDefault: loc.id === id
      })));
    } catch (err) {
      alert(`Failed to set default location: ${err.message}`);
    }
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-3">
      {/* ---------------- HEADER ---------------- */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h5 className="fw-bold mb-1 d-flex align-items-center">
            <Icon
              icon="heroicons:building-office"
              className="me-2 text-dark"
            />
            <span>Company Settings & Configuration</span>
          </h5>
          <p className="text-muted mb-0 small">Manage company profile, locations, currencies, and policies</p>
        </div>
      </div>

      {/* ---------------- TABS ---------------- */}
      <div className="card border mb-4">
        <div className="card-body p-0">
          <ul className="nav nav-tabs" id="settingsTab" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link d-flex align-items-center gap-2 ${
                  activeTab === "company-profile" ? "active" : ""
                }`}
                onClick={() => setActiveTab("company-profile")}
              >
                <Icon icon="heroicons:building-office" />
                <span>Company Profile</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link d-flex align-items-center gap-2 ${
                  activeTab === "currency" ? "active" : ""
                }`}
                onClick={() => setActiveTab("currency")}
              >
                <Icon icon="heroicons:currency-dollar" />
                <span>Currency</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link d-flex align-items-center gap-2 ${
                  activeTab === "locations" ? "active" : ""
                }`}
                onClick={() => setActiveTab("locations")}
              >
                <Icon icon="heroicons:map-pin" />
                <span>Locations</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link d-flex align-items-center gap-2 ${
                  activeTab === "financial-year" ? "active" : ""
                }`}
                onClick={() => setActiveTab("financial-year")}
              >
                <Icon icon="heroicons:calendar" />
                <span>Financial Year</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link d-flex align-items-center gap-2 ${
                  activeTab === "localization" ? "active" : ""
                }`}
                onClick={() => setActiveTab("localization")}
              >
                <Icon icon="heroicons:language" />
                <span>Localization</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link d-flex align-items-center gap-2 ${
                  activeTab === "policies" ? "active" : ""
                }`}
                onClick={() => setActiveTab("policies")}
              >
                <Icon icon="heroicons:document-text" />
                <span>Policies</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link d-flex align-items-center gap-2 ${
                  activeTab === "notifications" ? "active" : ""
                }`}
                onClick={() => setActiveTab("notifications")}
              >
                <Icon icon="heroicons:bell" />
                <span>Notifications</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link d-flex align-items-center gap-2 ${
                  activeTab === "data-privacy" ? "active" : ""
                }`}
                onClick={() => setActiveTab("data-privacy")}
              >
                <Icon icon="heroicons:shield-check" />
                <span>Data Privacy</span>
              </button>
            </li>
          </ul>

          {/* ---------------- TAB CONTENT ---------------- */}
          <div className="tab-content p-3 p-md-4">
            
            {/* COMPANY PROFILE TAB */}
            {activeTab === 'company-profile' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h6 className="fw-bold mb-0">Company Profile & Registration Details</h6>
                  <button
                    className="btn btn-primary btn-sm d-flex align-items-center justify-content-center gap-1"
                    onClick={() => setShowLogoUpload(true)}
                  >
                    <Icon icon="heroicons:photo" />
                    <span>Change Logo</span>
                  </button>
                </div>

                <form onSubmit={handleCompanyProfileUpdate}>
                  <div className="row g-3 mb-4">
                    {/* Logo Preview */}
                    <div className="col-12">
                      <div className="d-flex flex-column flex-md-row align-items-center gap-4 mb-4">
                        <div className="text-center">
                          <div className="mb-3">
                            <img
                              src={logo.preview}
                              alt="Company Logo"
                              className="rounded border p-2"
                              style={{ width: '150px', height: '150px', objectFit: 'contain' }}
                            />
                          </div>
                          <div className="text-muted small">
                            <div>{logo.name}</div>
                            <div>{logo.size}</div>
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <div className="alert alert-info">
                            <Icon icon="heroicons:information-circle" className="me-2" />
                            Recommended logo size: 300x300px, Max 5MB. Supports PNG, JPG, SVG.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Company Basic Info */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Company Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={companyProfile.name}
                        onChange={(e) => setCompanyProfile({ ...companyProfile, name: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Company Type</label>
                      <select
                        className="form-select"
                        value={companyProfile.companyType}
                        onChange={(e) => setCompanyProfile({ ...companyProfile, companyType: e.target.value })}
                      >
                        <option value="Private Limited">Private Limited</option>
                        <option value="Public Limited">Public Limited</option>
                        <option value="LLP">Limited Liability Partnership</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Company Website</label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://example.com"
                        value={companyProfile.website}
                        onChange={(e) => setCompanyProfile({ ...companyProfile, website: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="hr@example.com"
                        value={companyProfile.email}
                        onChange={(e) => setCompanyProfile({ ...companyProfile, email: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Registration Number *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={companyProfile.registrationNumber}
                        onChange={(e) => setCompanyProfile({ ...companyProfile, registrationNumber: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Tax ID (TIN) *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={companyProfile.taxId}
                        onChange={(e) => setCompanyProfile({ ...companyProfile, taxId: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">VAT/GST Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={companyProfile.vatNumber}
                        onChange={(e) => setCompanyProfile({ ...companyProfile, vatNumber: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Industry</label>
                      <select
                        className="form-select"
                        value={companyProfile.industry}
                        onChange={(e) => setCompanyProfile({ ...companyProfile, industry: e.target.value })}
                      >
                        <option value="Information Technology">Information Technology</option>
                        <option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Retail">Retail</option>
                        <option value="Education">Education</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Year Founded</label>
                      <input
                        type="number"
                        className="form-control"
                        value={companyProfile.foundedYear}
                        onChange={(e) => setCompanyProfile({ ...companyProfile, foundedYear: e.target.value })}
                        min="1900"
                        max="2024"
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Legal Entity Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={companyProfile.legalEntity}
                        onChange={(e) => setCompanyProfile({ ...companyProfile, legalEntity: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Registration Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={companyProfile.registrationDate}
                        onChange={(e) => setCompanyProfile({ ...companyProfile, registrationDate: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Registration Authority</label>
                      <input
                        type="text"
                        className="form-control"
                        value={companyProfile.registrationAuthority}
                        onChange={(e) => setCompanyProfile({ ...companyProfile, registrationAuthority: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Incorporation Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={companyProfile.incorporationNumber}
                        onChange={(e) => setCompanyProfile({ ...companyProfile, incorporationNumber: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="+91 98765 43210"
                        value={companyProfile.phone}
                        onChange={(e) => setCompanyProfile({ ...companyProfile, phone: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-medium">Address</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Plot 45, Tech Park Road, Hyderabad, Telangana"
                        value={companyProfile.address}
                        onChange={(e) => setCompanyProfile({ ...companyProfile, address: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-medium">About Company</label>
                      <textarea
                        className="form-control"
                        rows="4"
                        placeholder="We specialize in modern web solutions using React, Node, and Python..."
                        value={companyProfile.about}
                        onChange={(e) => setCompanyProfile({ ...companyProfile, about: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                    <button type="button" className="btn btn-outline-secondary">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* CURRENCY SETTINGS TAB */}
            {activeTab === 'currency' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h6 className="fw-bold mb-0">Currency & Exchange Rate Management</h6>
                  <button
                    className="btn btn-primary btn-sm d-flex align-items-center"
                    onClick={() => setShowAddExchangeRate(true)}
                  >
                    <Icon icon="heroicons:plus" className="me-1" />
                    <span>Add Exchange Rate</span>
                  </button>
                </div>

                <form onSubmit={handleCurrencySettingsUpdate} className="mb-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Primary Currency *</label>
                      <select
                        className="form-select"
                        value={currencySettings.primaryCurrency}
                        onChange={(e) => setCurrencySettings({...currencySettings, primaryCurrency: e.target.value})}
                      >
                        <option value="USD - US Dollar">USD - US Dollar</option>
                        <option value="EUR - Euro">EUR - Euro</option>
                        <option value="GBP - British Pound">GBP - British Pound</option>
                        <option value="INR - Indian Rupee">INR - Indian Rupee</option>
                        <option value="JPY - Japanese Yen">JPY - Japanese Yen</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Secondary Currency</label>
                      <select
                        className="form-select"
                        value={currencySettings.secondaryCurrency}
                        onChange={(e) => setCurrencySettings({...currencySettings, secondaryCurrency: e.target.value})}
                      >
                        <option value="">Select Secondary Currency</option>
                        <option value="USD - US Dollar">USD - US Dollar</option>
                        <option value="EUR - Euro">EUR - Euro</option>
                        <option value="GBP - British Pound">GBP - British Pound</option>
                        <option value="INR - Indian Rupee">INR - Indian Rupee</option>
                        <option value="JPY - Japanese Yen">JPY - Japanese Yen</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="multiCurrencyEnabled"
                          checked={currencySettings.multiCurrencyEnabled}
                          onChange={(e) => setCurrencySettings({...currencySettings, multiCurrencyEnabled: e.target.checked})}
                        />
                        <label className="form-check-label fw-medium" htmlFor="multiCurrencyEnabled">
                          Enable Multi-Currency Support
                        </label>
                      </div>
                    </div>

                    {currencySettings.multiCurrencyEnabled && (
                      <>
                        <div className="col-12">
                          <div className="form-check form-switch">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id="autoUpdateRates"
                              checked={currencySettings.autoUpdateRates}
                              onChange={(e) => setCurrencySettings({...currencySettings, autoUpdateRates: e.target.checked})}
                            />
                            <label className="form-check-label fw-medium" htmlFor="autoUpdateRates">
                              Auto-Update Exchange Rates
                            </label>
                          </div>
                        </div>

                        {currencySettings.autoUpdateRates && (
                          <div className="col-12 col-md-6">
                            <label className="form-label fw-medium">Update Frequency</label>
                              <select
                              className="form-select"
                              value={currencySettings.updateFrequency}
                              onChange={(e) => setCurrencySettings({...currencySettings, updateFrequency: e.target.value})}
                            >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                              <option value="manual">Manual Only</option>
                            </select>
                          </div>
                        )}

                        <div className="col-12">
                          <div className="alert alert-info">
                            <Icon icon="heroicons:information-circle" className="me-2" />
                            Last updated: {currencySettings.lastUpdated}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="col-12">
                      <button type="submit" className="btn btn-primary">
                        Save Currency Settings
                      </button>
                    </div>
                  </div>
                </form>

                {/* Exchange Rates Table */}
                <h6 className="fw-bold mb-3">Exchange Rates</h6>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>From</th>
                        <th>To</th>
                        <th>Exchange Rate</th>
                        <th>Last Updated</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exchangeRates.map(rate => (
                        <tr key={rate.id}>
                          <td>{rate.from}</td>
                          <td>{rate.to}</td>
                          <td>{rate.rate}</td>
                          <td>{rate.lastUpdated}</td>
                          <td>
                            <span className={`badge bg-${rate.status === 'active' ? 'success' : 'secondary'}`}>
                              {rate.status}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button 
                                className="btn btn-outline-primary"
                                onClick={() => handleEditExchangeRate(rate)}
                              >
                                <Icon icon="heroicons:pencil-square" />
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this rate?")) {
                                    removeExchangeRate(rate.id);
                                  }
                                }}
                              >
                                <Icon icon="heroicons:trash" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* LOCATIONS TAB */}
            {activeTab === 'locations' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h6 className="fw-bold mb-0">Company Locations & Timezone Configuration</h6>
                  <button
                    className="btn btn-primary btn-sm d-flex align-items-center justify-content-center gap-1"
                    onClick={() => setShowAddLocation(true)}
                  >
                    <Icon icon="heroicons:plus" />
                    <span>Add Location</span>
                  </button>
                </div>

                <div className="row g-3">
                  {locations.map(location => (
                    <div key={location.id} className="col-12 col-md-6 col-lg-4">
                      <div className={`card border h-100 ${location.isDefault ? 'border-primary' : ''}`}>
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h6 className="card-title mb-1">
                                {location.name}
                                {location.isDefault && (
                                  <span className="badge bg-primary ms-2">Default</span>
                                )}
                              </h6>
                              <small className="text-muted">{location.address}</small>
                            </div>
                            <div className="dropdown">
                              <button className="btn btn-sm btn-outline-secondary border-0" type="button" data-bs-toggle="dropdown">
                                <Icon icon="heroicons:ellipsis-vertical" />
                              </button>
                              <ul className="dropdown-menu">
                                <li>
                                  <button 
                                    className="dropdown-item"
                                    onClick={() => setDefaultLocation(location.id)}
                                  >
                                    <Icon icon="heroicons:star" className="me-2" />
                                    Set as Default
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handleOpenEditLocation(location)}
                                  >
                                    <Icon icon="heroicons:pencil-square" className="me-2" />
                                    Edit
                                  </button>
                                </li>
                                <li>
                                  <button 
                                    className="dropdown-item text-danger"
                                    onClick={() => removeLocation(location.id)}
                                  >
                                    <Icon icon="heroicons:trash" className="me-2" />
                                    Delete
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </div>
                          
                          <div className="mb-2">
                            <small className="text-muted d-block">Timezone</small>
                            <span className="fw-medium">{location.timezone}</span>
                          </div>
                          
                          <div className="mb-2">
                            <small className="text-muted d-block">Weekend Days</small>
                            <span className="fw-medium">{location.weekendDays.join(', ')}</span>
                          </div>
                          
                          <div className="mb-3">
                            <small className="text-muted d-block">Working Hours</small>
                            <span className="fw-medium">{location.workingHours.start} - {location.workingHours.end}</span>
                          </div>

                          <div className="mb-3">
                            <small className="text-muted d-block">Employees Assigned</small>
                            <span className="fw-medium">{location.employeeCount}</span>
                          </div>
                          
                          <div className="d-flex justify-content-center gap-1">
                            <button
                              className="btn btn-primary btn-sm w-50 d-flex align-items-center justify-content-center"
                              onClick={() => handleViewMap(location.address)}
                            >
                              <Icon icon="heroicons:map-pin" className="me-1" />
                              <span>View Map</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FINANCIAL YEAR TAB */}
            {activeTab === 'financial-year' && (
              <div>
                <h6 className="fw-bold mb-4">Financial Year Configuration</h6>
                
                <form onSubmit={handleFinancialYearUpdate}>
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <div className="alert alert-info">
                        <Icon icon="heroicons:information-circle" className="me-2" />
                        Current Financial Year: <strong>{financialYear.currentYear}</strong> | 
                        Previous: {financialYear.previousYear} | 
                        Next: {financialYear.nextYear}
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Financial Year Start</label>
                      <div className="row g-2">
                        <div className="col-6">
                          <select
                            className="form-select"
                            value={financialYear.startMonth}
                            onChange={(e) => setFinancialYear({...financialYear, startMonth: e.target.value})}
                          >
                            <option value="January">January</option>
                            <option value="February">February</option>
                            <option value="March">March</option>
                            <option value="April">April</option>
                            <option value="May">May</option>
                            <option value="June">June</option>
                            <option value="July">July</option>
                            <option value="August">August</option>
                            <option value="September">September</option>
                            <option value="October">October</option>
                            <option value="November">November</option>
                            <option value="December">December</option>
                          </select>
                        </div>
                        <div className="col-6">
                          <input
                            type="number"
                            className="form-control"
                            min="1"
                            max="31"
                            value={financialYear.startDay}
                            onChange={(e) => setFinancialYear({...financialYear, startDay: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Financial Year End</label>
                      <div className="row g-2">
                        <div className="col-6">
                          <select
                            className="form-select"
                            value={financialYear.endMonth}
                            onChange={(e) => setFinancialYear({...financialYear, endMonth: e.target.value})}
                          >
                            <option value="January">January</option>
                            <option value="February">February</option>
                            <option value="March">March</option>
                            <option value="April">April</option>
                            <option value="May">May</option>
                            <option value="June">June</option>
                            <option value="July">July</option>
                            <option value="August">August</option>
                            <option value="September">September</option>
                            <option value="October">October</option>
                            <option value="November">November</option>
                            <option value="December">December</option>
                          </select>
                        </div>
                        <div className="col-6">
                          <input
                            type="number"
                            className="form-control"
                            min="1"
                            max="31"
                            value={financialYear.endDay}
                            onChange={(e) => setFinancialYear({...financialYear, endDay: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Period Type</label>
                      <select
                        className="form-select"
                        value={financialYear.periodType}
                        onChange={(e) => setFinancialYear({...financialYear, periodType: e.target.value})}
                      >
                        <option value="fiscal">Fiscal Year</option>
                        <option value="calendar">Calendar Year</option>
                        <option value="custom">Custom Period</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Tax Year Alignment</label>
                      <select
                        className="form-select"
                        value={financialYear.taxYear}
                        onChange={(e) => setFinancialYear({...financialYear, taxYear: e.target.value})}
                      >
                        <option value="calendar">Calendar Year</option>
                        <option value="fiscal">Fiscal Year</option>
                        <option value="different">Different Tax Year</option>
                      </select>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      Save Financial Year Settings
                    </button>
                    <button type="button" className="btn btn-outline-secondary">
                      Reset to Default
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* LOCALIZATION TAB */}
            {activeTab === 'localization' && (
              <div>
                <h6 className="fw-bold mb-4">Language & Localization Preferences</h6>
                
                <form onSubmit={handleLocalizationUpdate}>
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Default Language *</label>
                      <select
                        className="form-select"
                        value={localization.defaultLanguage}
                        onChange={(e) => setLocalization({...localization, defaultLanguage: e.target.value})}
                      >
                        {languages.map(lang => (
                          <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Default Timezone *</label>
                      <select
                        className="form-select"
                        value={localization.timezone}
                        onChange={(e) => setLocalization({...localization, timezone: e.target.value})}
                      >
                        {timezones.map(tz => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Date Format *</label>
                      <select
                        className="form-select"
                        value={localization.dateFormat}
                        onChange={(e) => setLocalization({...localization, dateFormat: e.target.value})}
                      >
                        {dateFormats.map(format => (
                          <option key={format} value={format}>{format}</option>
                        ))}
                      </select>
                      <small className="text-muted">Preview: {new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit' 
                      })}</small>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Time Format</label>
                      <select
                        className="form-select"
                        value={localization.timeFormat}
                        onChange={(e) => setLocalization({...localization, timeFormat: e.target.value})}
                      >
                        <option value="12h">12-hour (hh:mm AM/PM)</option>
                        <option value="24h">24-hour (HH:mm)</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Number Format</label>
                      <input
                        type="text"
                        className="form-control"
                        value={localization.numberFormat}
                        onChange={(e) => setLocalization({...localization, numberFormat: e.target.value})}
                        placeholder="e.g., 1,234.56"
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Decimal Places</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        max="4"
                        value={localization.decimalPlaces}
                        onChange={(e) => setLocalization({...localization, decimalPlaces: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Currency Format</label>
                      <input
                        type="text"
                        className="form-control"
                        value={localization.currencyFormat}
                        onChange={(e) => setLocalization({...localization, currencyFormat: e.target.value})}
                        placeholder="e.g., $1,234.56"
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">First Day of Week</label>
                      <select
                        className="form-select"
                        value={localization.firstDayOfWeek}
                        onChange={(e) => setLocalization({...localization, firstDayOfWeek: e.target.value})}
                      >
                        <option value="Monday">Monday</option>
                        <option value="Sunday">Sunday</option>
                        <option value="Saturday">Saturday</option>
                      </select>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      Save Localization Settings
                    </button>
                    <button type="button" className="btn btn-outline-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* POLICIES TAB */}
            {activeTab === 'policies' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h6 className="fw-bold mb-0">Company Policies & Guidelines Repository</h6>
                  <button
                    className="btn btn-primary btn-sm d-flex align-items-center"
                    onClick={() => setShowAddPolicy(true)}
                  >
                    <Icon icon="heroicons:plus" className="me-1" />
                    <span>Add Policy</span>
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Policy Title</th>
                        <th>Category</th>
                        <th>Version</th>
                        <th>Effective Date</th>
                        <th>Status</th>
                        <th>File Size</th>
                        <th>Last Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {policies.map(policy => (
                        <tr key={policy.id}>
                          <td>{policy.title}</td>
                          <td>
                            <span className="badge bg-light text-dark border">{policy.category}</span>
                          </td>
                          <td>v{policy.version}</td>
                          <td>{policy.effectiveDate}</td>
                          <td>
                            <span className={`badge bg-${policy.status === 'active' ? 'success' : 'warning'}`}>
                              {policy.status}
                            </span>
                          </td>
                          <td>{policy.fileSize}</td>
                          <td>{policy.lastUpdated}</td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button 
                                className="btn btn-outline-primary"
                                onClick={() => handleViewPolicy(policy)}
                              >
                                <Icon icon="heroicons:eye" />
                              </button>
                              <button 
                                className="btn btn-outline-secondary"
                                onClick={() => handleEditPolicy(policy)}
                              >
                                <Icon icon="heroicons:pencil-square" />
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to remove this policy?")) {
                                    removePolicy(policy.id);
                                  }
                                }}
                              >
                                <Icon icon="heroicons:trash" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div>
                <h6 className="fw-bold mb-4">Email & Notification Preferences</h6>
                
                <form onSubmit={handleNotificationPrefsUpdate}>
                  <div className="row g-3">
                    {/* Email Notifications */}
                    <div className="col-12">
                      <h6 className="fw-bold mb-3">
                        <Icon icon="heroicons:envelope" className="me-2" />
                        Email Notifications
                      </h6>
                      <div className="row g-2">
                        {Object.entries(notificationPrefs.emailNotifications).map(([key, value]) => (
                          <div key={key} className="col-12 col-md-6 col-lg-4">
                            <div className="form-check form-switch">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id={`email-${key}`}
                                checked={value}
                                onChange={(e) => setNotificationPrefs({
                                  ...notificationPrefs,
                                  emailNotifications: {
                                    ...notificationPrefs.emailNotifications,
                                    [key]: e.target.checked
                                  }
                                })}
                              />
                              <label className="form-check-label" htmlFor={`email-${key}`}>
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Push Notifications */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold mb-3">
                        <Icon icon="heroicons:device-phone-mobile" className="me-2" />
                        Push Notifications
                      </h6>
                      <div className="row g-2">
                        {Object.entries(notificationPrefs.pushNotifications).map(([key, value]) => (
                          <div key={key} className="col-12 col-md-6 col-lg-4">
                            <div className="form-check form-switch">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id={`push-${key}`}
                                checked={value}
                                onChange={(e) => setNotificationPrefs({
                                  ...notificationPrefs,
                                  pushNotifications: {
                                    ...notificationPrefs.pushNotifications,
                                    [key]: e.target.checked
                                  }
                                })}
                              />
                              <label className="form-check-label" htmlFor={`push-${key}`}>
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SMS Notifications */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold mb-3">
                        <Icon icon="heroicons:chat-bubble-left-right" className="me-2" />
                        SMS Notifications
                      </h6>
                      <div className="row g-2">
                        {Object.entries(notificationPrefs.smsNotifications).map(([key, value]) => (
                          <div key={key} className="col-12 col-md-6 col-lg-4">
                            <div className="form-check form-switch">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id={`sms-${key}`}
                                checked={value}
                                onChange={(e) => setNotificationPrefs({
                                  ...notificationPrefs,
                                  smsNotifications: {
                                    ...notificationPrefs.smsNotifications,
                                    [key]: e.target.checked
                                  }
                                })}
                              />
                              <label className="form-check-label" htmlFor={`sms-${key}`}>
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="col-12 mt-4">
                      <button type="submit" className="btn btn-primary">
                        Save Notification Preferences
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* DATA PRIVACY TAB */}
            {activeTab === 'data-privacy' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h6 className="fw-bold mb-0">Data Privacy Settings & Consent Management</h6>
                  <button
                    className="btn btn-primary btn-sm d-flex align-items-center justify-content-center gap-1"
                    onClick={() => setShowDataPrivacyModal(true)}
                  >
                    <Icon icon="heroicons:document-text" />
                    <span>View Privacy Policy</span>
                  </button>
                </div>

                <form onSubmit={handleDataPrivacyUpdate}>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Data Retention Period (Years)</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        max="10"
                        value={dataPrivacy.dataRetentionPeriod}
                        onChange={(e) => setDataPrivacy({...dataPrivacy, dataRetentionPeriod: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Inactive Account Period (Days)</label>
                      <input
                        type="number"
                        className="form-control"
                        min="30"
                        max="730"
                        value={dataPrivacy.inactiveAccountPeriod}
                        onChange={(e) => setDataPrivacy({...dataPrivacy, inactiveAccountPeriod: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="col-12">
                      <div className="form-check form-switch mb-2">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="autoDeleteInactiveAccounts"
                          checked={dataPrivacy.autoDeleteInactiveAccounts}
                          onChange={(e) => setDataPrivacy({...dataPrivacy, autoDeleteInactiveAccounts: e.target.checked})}
                        />
                        <label className="form-check-label fw-medium" htmlFor="autoDeleteInactiveAccounts">
                          Auto-delete Inactive Accounts
                        </label>
                      </div>

                      <div className="form-check form-switch mb-2">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="gdprCompliance"
                          checked={dataPrivacy.gdprCompliance}
                          onChange={(e) => setDataPrivacy({...dataPrivacy, gdprCompliance: e.target.checked})}
                        />
                        <label className="form-check-label fw-medium" htmlFor="gdprCompliance">
                          GDPR Compliance Enabled
                        </label>
                      </div>

                      <div className="form-check form-switch mb-2">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="dataProcessingConsent"
                          checked={dataPrivacy.dataProcessingConsent}
                          onChange={(e) => setDataPrivacy({...dataPrivacy, dataProcessingConsent: e.target.checked})}
                        />
                        <label className="form-check-label fw-medium" htmlFor="dataProcessingConsent">
                          Require Data Processing Consent
                        </label>
                      </div>

                      <div className="form-check form-switch mb-2">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="dataExportEnabled"
                          checked={dataPrivacy.dataExportEnabled}
                          onChange={(e) => setDataPrivacy({...dataPrivacy, dataExportEnabled: e.target.checked})}
                        />
                        <label className="form-check-label fw-medium" htmlFor="dataExportEnabled">
                          Allow Data Export (Right to Access)
                        </label>
                      </div>

                      <div className="form-check form-switch mb-4">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="dataAnonymization"
                          checked={dataPrivacy.dataAnonymization}
                          onChange={(e) => setDataPrivacy({...dataPrivacy, dataAnonymization: e.target.checked})}
                        />
                        <label className="form-check-label fw-medium" htmlFor="dataAnonymization">
                          Enable Data Anonymization for Deleted Accounts
                        </label>
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-medium">Consent Required For</label>
                      <div className="row g-2">
                        {['marketing', 'data_sharing', 'analytics', 'third_party', 'profiling', 'automated_decisions'].map(consentType => (
                          <div key={consentType} className="col-12 col-md-6 col-lg-4">
                            <div className="form-check">
                              <input
                                type="checkbox"
                                id={`consent-${consentType}`}
                                checked={dataPrivacy.consentRequiredFor.includes(consentType)}
                                onChange={(e) => {
                                  const newConsents = e.target.checked
                                    ? [...dataPrivacy.consentRequiredFor, consentType]
                                    : dataPrivacy.consentRequiredFor.filter(c => c !== consentType);
                                  setDataPrivacy({ ...dataPrivacy, consentRequiredFor: newConsents });
                                }}
                                style={{
                                  appearance: "auto",
                                  WebkitAppearance: "auto",
                                  MozAppearance: "auto",
                                  width: "16px",
                                  height: "16px",
                                  cursor: "pointer",
                                  accentColor: "#2563eb",
                                }}
                              />
                              <label className="form-check-label" htmlFor={`consent-${consentType}`}>
                                {consentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Privacy Policy Version</label>
                      <input
                        type="text"
                        className="form-control"
                        value={dataPrivacy.privacyPolicyVersion}
                        onChange={(e) => setDataPrivacy({...dataPrivacy, privacyPolicyVersion: e.target.value})}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Last Consent Update</label>
                      <input
                        type="date"
                        className="form-control"
                        value={dataPrivacy.lastConsentUpdate}
                        onChange={(e) => setDataPrivacy({...dataPrivacy, lastConsentUpdate: e.target.value})}
                      />
                    </div>

                    <div className="col-12 mt-4">
                      <button type="submit" className="btn btn-primary">
                        Save Data Privacy Settings
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- LOGO UPLOAD MODAL ---------------- */}
      {showLogoUpload && (
        <div className="modal show d-block fade" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-0 p-2 p-md-3">
                <h5 className="modal-title fw-bold">Upload Company Logo</h5>
                <button className="btn-close" onClick={() => setShowLogoUpload(false)}></button>
              </div>
              <div className="modal-body pt-0 p-2 p-md-3">
                <div className="d-flex align-items-center justify-content-center mb-3 gap-2">
                  <Icon icon="heroicons:photo" className="text-primary" style={{ fontSize: '2.5rem' }} />
                  <p className="text-muted small mb-0">
                    Upload your company logo. Supported formats: PNG, JPG, SVG
                  </p>
                </div>
                <div className="mb-2">
                  <input
                    type="file"
                    className="form-control form-control-sm"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                </div>
                <div className="alert alert-info py-2 px-3">
                  <Icon icon="heroicons:information-circle" className="me-2" />
                  <small>For best results, use a square logo with transparent background (300x300px recommended)</small>
                </div>
              </div>
              <div className="modal-footer border-0 p-2 p-md-3">
                <button className="btn btn-secondary w-100 btn-sm" onClick={() => setShowLogoUpload(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- ADD LOCATION MODAL ---------------- */}
      {showAddLocation && (
        <div className="modal show d-block fade" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header d-flex align-items-center justify-content-between border-0 pb-2 p-2 p-md-3">
                <div className="d-flex flex-column w-100 me-2">
                  <h5 className="modal-title fw-bold mb-2">Add New Location</h5>
                  <hr style={{ borderTop: "1px solid #aaa", margin: "0" }} />
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddLocation(false)}
                ></button>
              </div>
              <form onSubmit={handleAddLocation}>
                <div className="modal-body pt-2">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-medium">Location Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={newLocation.name}
                        onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium">Address *</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        required
                        value={newLocation.address}
                        onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                      />
                    </div>
                 <div className="col-12">
  <label className="form-label fw-medium">Timezone *</label>
  <input
    type="text"
    className="form-control"
    required
    placeholder="Enter timezone"
    value={newLocation.timezone}
    onChange={(e) => setNewLocation({ ...newLocation, timezone: e.target.value })}
  />
</div>

                    <div className="col-12">
                      <label className="form-label fw-medium">Weekend Days</label>
                      <div className="row g-2">
                        {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((day) => {
                          const isChecked = newLocation.weekendDays.includes(day);
                          return (
                            <div key={day} className="col-6 col-md-4">
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  gap: '0.5rem',
                                }}
                                onClick={() => {
                                  const updatedDays = isChecked
                                    ? newLocation.weekendDays.filter(d => d !== day)
                                    : [...newLocation.weekendDays, day];
                                  setNewLocation({ ...newLocation, weekendDays: updatedDays });
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  readOnly
                                  style={{ display: 'none' }}
                                />
                                <span
                                  style={{
                                    width: '22px',
                                    height: '22px',
                                    display: 'inline-block',
                                    borderRadius: '4px',
                                    border: '2px solid #0d6efd',
                                    backgroundColor: isChecked ? '#0d6efd' : '#fff',
                                    position: 'relative',
                                    flexShrink: 0,
                                  }}
                                >
                                  {isChecked && (
                                    <svg
                                      viewBox="0 0 16 16"
                                      width="16"
                                      height="16"
                                      style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        fill: 'white',
                                      }}
                                    >
                                      <path d="M6.003 11.803l-3.24-3.24 1.415-1.414L6.003 8.976l5.824-5.823 1.414 1.414z" />
                                    </svg>
                                  )}
                                </span>
                                <label style={{ cursor: 'pointer', userSelect: 'none' }}>{day}</label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Working Hours Start</label>
                      <input
                        type="time"
                        className="form-control"
                        value={newLocation.workingHours.start}
                        onChange={(e) => setNewLocation({
                          ...newLocation,
                          workingHours: { ...newLocation.workingHours, start: e.target.value }
                        })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Working Hours End</label>
                      <input
                        type="time"
                        className="form-control"
                        value={newLocation.workingHours.end}
                        onChange={(e) => setNewLocation({
                          ...newLocation,
                          workingHours: { ...newLocation.workingHours, end: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAddLocation(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Add Location</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditLocation && (
        <div className="modal show d-block fade" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header d-flex align-items-center justify-content-between border-0 pb-2 p-2 p-md-3">
                <div className="d-flex flex-column w-100 me-2">
                  <h5 className="modal-title fw-bold mb-2">Edit Location</h5>
                  <hr style={{ borderTop: "1px solid #aaa", margin: "0" }} />
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => { setShowEditLocation(false); setEditingLocationId(null); }}
                ></button>
              </div>
              <form onSubmit={handleUpdateLocation}>
                <div className="modal-body pt-2">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-medium">Location Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={newLocation.name}
                        onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium">Address *</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        required
                        value={newLocation.address}
                        onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium">Timezone *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="Enter timezone"
                        value={newLocation.timezone}
                        onChange={(e) => setNewLocation({ ...newLocation, timezone: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-medium">Weekend Days</label>
                      <div className="row g-2">
                        {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((day) => {
                          const isChecked = newLocation.weekendDays.includes(day);
                          return (
                            <div key={day} className="col-6 col-md-4">
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  gap: '0.5rem',
                                }}
                                onClick={() => {
                                  const updatedDays = isChecked
                                    ? newLocation.weekendDays.filter(d => d !== day)
                                    : [...newLocation.weekendDays, day];
                                  setNewLocation({ ...newLocation, weekendDays: updatedDays });
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  readOnly
                                  style={{ display: 'none' }}
                                />
                                <span
                                  style={{
                                    width: '22px',
                                    height: '22px',
                                    display: 'inline-block',
                                    borderRadius: '4px',
                                    border: '2px solid #0d6efd',
                                    backgroundColor: isChecked ? '#0d6efd' : '#fff',
                                    position: 'relative',
                                    flexShrink: 0,
                                  }}
                                >
                                  {isChecked && (
                                    <svg
                                      viewBox="0 0 16 16"
                                      width="16"
                                      height="16"
                                      style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        fill: 'white',
                                      }}
                                    >
                                      <path d="M6.003 11.803l-3.24-3.24 1.415-1.414L6.003 8.976l5.824-5.823 1.414 1.414z" />
                                    </svg>
                                  )}
                                </span>
                                <label style={{ cursor: 'pointer', userSelect: 'none' }}>{day}</label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Working Hours Start</label>
                      <input
                        type="time"
                        className="form-control"
                        value={newLocation.workingHours.start}
                        onChange={(e) => setNewLocation({
                          ...newLocation,
                          workingHours: { ...newLocation.workingHours, start: e.target.value }
                        })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Working Hours End</label>
                      <input
                        type="time"
                        className="form-control"
                        value={newLocation.workingHours.end}
                        onChange={(e) => setNewLocation({
                          ...newLocation,
                          workingHours: { ...newLocation.workingHours, end: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowEditLocation(false); setEditingLocationId(null); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- ADD EXCHANGE RATE MODAL ---------------- */}
      {showAddExchangeRate && (
        <div className="modal show d-block fade" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-2 p-2 p-md-3">
                <div className="w-100">
                  <h5 className="modal-title fw-bold mb-1">Add Exchange Rate</h5>
                  <hr style={{ borderTop: "1px solid #aaa", margin: "0" }} />
                </div>
                <button className="btn-close" onClick={() => setShowAddExchangeRate(false)}></button>
              </div>
              <form onSubmit={handleAddExchangeRate}>
                <div className="modal-body pt-2 p-2 p-md-3">
                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium small">From Currency</label>
                      <select
                        className="form-select form-select-sm"
                        value={newExchangeRate.from}
                        onChange={(e) => setNewExchangeRate({ ...newExchangeRate, from: e.target.value })}
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="INR">INR - Indian Rupee</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium small">To Currency *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={newExchangeRate.to}
                        onChange={(e) => setNewExchangeRate({ ...newExchangeRate, to: e.target.value.toUpperCase() })}
                        placeholder="e.g., INR"
                        maxLength="3"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium small">Exchange Rate *</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        required
                        step="0.0001"
                        value={newExchangeRate.rate}
                        onChange={(e) => setNewExchangeRate({ ...newExchangeRate, rate: e.target.value })}
                        placeholder="e.g., 83.4567"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium small">Effective Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={newExchangeRate.effectiveDate}
                        onChange={(e) => setNewExchangeRate({ ...newExchangeRate, effectiveDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 p-2 p-md-3">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowAddExchangeRate(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">Add Exchange Rate</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- EDIT EXCHANGE RATE MODAL ---------------- */}
      {showEditExchangeRate && editingExchangeRate && (
        <div className="modal show d-block fade" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Edit Exchange Rate</h5>
                <button className="btn-close" onClick={() => setShowEditExchangeRate(false)}></button>
              </div>
              <form onSubmit={handleUpdateExchangeRate}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">From Currency</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingExchangeRate.from}
                        onChange={(e) => setEditingExchangeRate({...editingExchangeRate, from: e.target.value})}
                        disabled
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">To Currency</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingExchangeRate.to}
                        onChange={(e) => setEditingExchangeRate({...editingExchangeRate, to: e.target.value})}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium">Exchange Rate</label>
                      <input
                        type="number"
                        className="form-control"
                        step="0.0001"
                        value={editingExchangeRate.rate}
                        onChange={(e) => setEditingExchangeRate({...editingExchangeRate, rate: parseFloat(e.target.value)})}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium">Status</label>
                      <select
                        className="form-select"
                        value={editingExchangeRate.status}
                        onChange={(e) => setEditingExchangeRate({...editingExchangeRate, status: e.target.value})}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditExchangeRate(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Rate
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- ADD POLICY MODAL ---------------- */}
      {showAddPolicy && (
        <div className="modal show d-block fade" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header d-flex align-items-center justify-content-between border-0 pb-2 p-2 p-md-3">
                <div className="d-flex flex-column w-100 me-2">
                  <h5 className="modal-title fw-bold mb-2">Add New Policy</h5>
                  <hr style={{ borderTop: "1px solid #aaa", margin: "0" }} />
                </div>
                <button type="button" className="btn-close" onClick={() => setShowAddPolicy(false)}></button>
              </div>
              <form onSubmit={handleAddPolicy}>
                <div className="modal-body pt-2">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-medium">Policy Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={newPolicy.title}
                        onChange={(e) => setNewPolicy({ ...newPolicy, title: e.target.value })}
                        placeholder="e.g., Employee Code of Conduct"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Category *</label>
                      <select
                        className="form-select"
                        required
                        value={newPolicy.category}
                        onChange={(e) => setNewPolicy({ ...newPolicy, category: e.target.value })}
                      >
                        <option value="HR Policies">HR Policies</option>
                        <option value="Compliance">Compliance</option>
                        <option value="IT Policies">IT Policies</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                        <option value="Security">Security</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Version *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={newPolicy.version}
                        onChange={(e) => setNewPolicy({ ...newPolicy, version: e.target.value })}
                        placeholder="e.g., 1.0"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Effective Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={newPolicy.effectiveDate}
                        onChange={(e) => setNewPolicy({ ...newPolicy, effectiveDate: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Upload Document</label>
                      <input
                        type="file"
                        className="form-control"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setNewPolicy({ ...newPolicy, file: e.target.files[0] })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium">Description</label>
                      <textarea
                        className="form-control"
                        rows="4"
                        value={newPolicy.description}
                        onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                        placeholder="Brief description of the policy..."
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAddPolicy(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Add Policy</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- VIEW POLICY MODAL ---------------- */}
      {showViewPolicyModal && viewingPolicy && (
        <div className="modal show d-block fade" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">{viewingPolicy.title}</h5>
                <button className="btn-close" onClick={() => setShowViewPolicyModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-4">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-2">
                        <span className="text-muted small">Category:</span>
                        <span className="badge bg-light text-dark border ms-2">{viewingPolicy.category}</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-2">
                        <span className="text-muted small">Version:</span>
                        <strong className="ms-2">v{viewingPolicy.version}</strong>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-2">
                        <span className="text-muted small">Effective Date:</span>
                        <strong className="ms-2">{viewingPolicy.effectiveDate}</strong>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-2">
                        <span className="text-muted small">Status:</span>
                        <span className={`badge bg-${viewingPolicy.status === 'active' ? 'success' : 'warning'} ms-2`}>
                          {viewingPolicy.status}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-2">
                        <span className="text-muted small">File Size:</span>
                        <strong className="ms-2">{viewingPolicy.fileSize}</strong>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-2">
                        <span className="text-muted small">Last Updated:</span>
                        <strong className="ms-2">{viewingPolicy.lastUpdated}</strong>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-top pt-3">
                  <h6 className="fw-bold mb-3">Policy Description</h6>
                  <div className="bg-light p-3 rounded">
                    <p className="mb-0">
                      {viewingPolicy.description || 'No description available.'}
                    </p>
                  </div>
                </div>
              </div>
             
            </div>
          </div>
        </div>
      )}

      {/* ---------------- EDIT POLICY MODAL ---------------- */}
      {showEditPolicyModal && editingPolicy && (
        <div className="modal show d-block fade" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">Edit Policy</h5>
                <button className="btn-close" onClick={() => setShowEditPolicyModal(false)}></button>
              </div>
              <form onSubmit={handleUpdatePolicy}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-medium">Policy Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={editingPolicy.title}
                        onChange={(e) => setEditingPolicy({...editingPolicy, title: e.target.value})}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Category *</label>
                      <select
                        className="form-select"
                        required
                        value={editingPolicy.category}
                        onChange={(e) => setEditingPolicy({...editingPolicy, category: e.target.value})}
                      >
                        <option value="HR Policies">HR Policies</option>
                        <option value="Compliance">Compliance</option>
                        <option value="IT Policies">IT Policies</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                        <option value="Security">Security</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Version *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={editingPolicy.version}
                        onChange={(e) => setEditingPolicy({...editingPolicy, version: e.target.value})}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Effective Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={editingPolicy.effectiveDate}
                        onChange={(e) => setEditingPolicy({...editingPolicy, effectiveDate: e.target.value})}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Status</label>
                      <select
                        className="form-select"
                        value={editingPolicy.status}
                        onChange={(e) => setEditingPolicy({...editingPolicy, status: e.target.value})}
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium">Description</label>
                      <textarea
                        className="form-control"
                        rows="4"
                        value={editingPolicy.description || ''}
                        onChange={(e) => setEditingPolicy({...editingPolicy, description: e.target.value})}
                        placeholder="Add or update policy description..."
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditPolicyModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Policy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- DATA PRIVACY MODAL ---------------- */}
      {showDataPrivacyModal && (
        <div className="modal show fade d-flex align-items-center justify-content-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl m-0">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header d-flex align-items-center justify-content-between border-0 pb-2 p-2 p-md-3">
                <div className="d-flex flex-column w-100 me-2">
                  <h5 className="modal-title fw-bold mb-2">Data Privacy Policy</h5>
                  <hr style={{ borderTop: "1px solid #aaa", margin: "0" }} />
                </div>
                <button type="button" className="btn-close" onClick={() => setShowDataPrivacyModal(false)}></button>
              </div>
              <div className="modal-body pt-0">
                <div className="p-2 p-md-3">
                  <h5 className="mb-3">Data Privacy Policy v{dataPrivacy.privacyPolicyVersion}</h5>
                  <div className="mb-3">
                    <h6 className="fw-bold mb-1">1. Data Collection</h6>
                    <p className="text-muted small">
                      We collect personal data that you provide directly to us, such as when you create an account, 
                      update your profile, or interact with our services.
                    </p>
                  </div>
                  <div className="mb-3">
                    <h6 className="fw-bold mb-1">2. Data Usage</h6>
                    <p className="text-muted small">
                      Your data is used to provide and improve our services, communicate with you, 
                      and comply with legal obligations.
                    </p>
                  </div>
                  <div className="mb-3">
                    <h6 className="fw-bold mb-1">3. Data Sharing</h6>
                    <p className="text-muted small">
                      We do not sell your personal data. We may share data with trusted third-party 
                      service providers who assist in our operations.
                    </p>
                  </div>
                  <div className="mb-3">
                    <h6 className="fw-bold mb-1">4. Data Retention</h6>
                    <p className="text-muted small">
                      We retain your personal data for {dataPrivacy.dataRetentionPeriod} years from the date of collection 
                      or as required by law.
                    </p>
                  </div>
                  <div className="mb-3">
                    <h6 className="fw-bold mb-1">5. Your Rights</h6>
                    <ul className="text-muted small ps-3">
                      <li>Right to access your personal data</li>
                      <li>Right to rectification of inaccurate data</li>
                      <li>Right to erasure ('right to be forgotten')</li>
                      <li>Right to restrict processing</li>
                      <li>Right to data portability</li>
                      <li>Right to object to processing</li>
                    </ul>
                  </div>
                  <div className="mb-3">
                    <h6 className="fw-bold mb-1">6. Consent Management</h6>
                    <p className="text-muted small">
                      You can manage your consent preferences at any time through your account settings.
                    </p>
                  </div>
                  <div className="alert alert-info py-2 px-3">
                    <Icon icon="heroicons:information-circle" className="me-2" />
                    <small>Last updated: {dataPrivacy.lastConsentUpdate}</small>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 p-2 p-md-3">
                <button className="btn btn-primary w-100 btn-sm" onClick={() => setShowDataPrivacyModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- GOOGLE MAPS MODAL ---------------- */}
      {showMapModal && (
        <div className="modal show d-block fade" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  <Icon icon="heroicons:map" className="me-2" />
                  View Location on Map
                </h5>
                <button className="btn-close" onClick={() => setShowMapModal(false)}></button>
              </div>
              <div className="modal-body pt-0">
                <div className="mb-3">
                  <p className="text-muted mb-2">
                    <Icon icon="heroicons:map-pin" className="me-2 text-danger" />
                    {selectedAddress}
                  </p>
                </div>
                <div className="ratio ratio-16x9">
                  <iframe
                    title="Google Maps"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedAddress)}&output=embed`}
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
                <div className="mt-3">
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-primary btn-sm"
                  >
                    <Icon icon="heroicons:arrow-top-right-on-square" className="me-1" />
                    Open in Google Maps
                  </a>
                  <button 
                    className="btn btn-outline-secondary btn-sm ms-2"
                    onClick={() => setShowMapModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySettings;