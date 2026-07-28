import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import StatCard from '../../../shared/components/StatCard';
import SettlementDetailsModal from '../modal/SettlementDetailsModal';
import PaymentModal from '../modal/PaymentModal';
import LastWorkingDayModal from '../modal/LastWorkingDayModal';
import GenerateFormModal from '../modal/GenerateFormModal';
import AssetManagementModal from '../modal/AssetManagementModal';
import InitiateSettlementModal from '../modal/InitiateSettlementModal';
import { finalSettlementAPI, employeeAPI } from '../../../shared/utils/api';

// ---------------------------------------------------------------------------
// The backend (routers/Payroll/final_settlement.py + services/Payroll/
// final_settlement_service.py) already implements the full settlement
// lifecycle: Draft -> Pending Approval -> Approved -> Paid, with Reject
// bouncing Pending Approval/Approved back to Draft, and Cancel available
// anywhere except Paid. This page drives that state machine directly.
// ---------------------------------------------------------------------------

const DOCUMENT_TYPES = ['Form16', 'Form19', 'Form10C', 'Experience Letter', 'Relieving Letter'];
const DOCUMENT_LABELS = {
  Form16: 'Form 16',
  Form19: 'Form 19 (PF)',
  Form10C: 'Form 10C (PF)',
  'Experience Letter': 'Experience Letter',
  'Relieving Letter': 'Relieving Letter',
};
// These three are treated as "issued to the employee" the moment they're
// generated (matches the original UI's document checklist semantics).
const AUTO_ISSUE_ON_GENERATE = new Set(['Form16', 'Experience Letter', 'Relieving Letter']);

const statusKey = (raw) => (raw ? raw.toLowerCase().replace(/\s+/g, '-') : 'draft');

const toNum = (v) => (v === null || v === undefined ? 0 : Number(v));

const downloadTextFile = (content, filename, mime = 'text/csv') => {
  const blob = new Blob([content], { type: mime });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

const mapEmployee = (e) => ({
  id: e.id,
  name: [e.first_name, e.middle_name, e.last_name].filter(Boolean).join(' ') || `Employee #${e.id}`,
  employeeId: e.employee_code,
  department: e.department || '—',
  designation: e.designation || '',
  doj: e.joining_date || '',
});

// FinalSettlementListItem -> flat row shape used across the Employees /
// Pending / Completed tables and the SettlementDetailsModal.
const mapListItem = (s) => {
  const daysPending =
    s.status !== 'Paid' && s.status !== 'Cancelled' && s.created_at
      ? Math.max(0, Math.floor((Date.now() - new Date(s.created_at).getTime()) / 86400000))
      : 0;
  return {
    id: s.id,
    employeeDbId: s.employee_id,
    name: s.employee_name,
    employeeName: s.employee_name,
    employeeId: s.employee_code,
    department: s.department || '—',
    designation: s.designation || '',
    exitType: s.exit_type,
    lastWorkingDay: s.last_working_date,
    settlementAmount: toNum(s.net_settlement),
    netAmount: toNum(s.net_settlement),
    status: statusKey(s.status),
    statusRaw: s.status,
    createdAt: s.created_at,
    daysPending,
    paymentDate: null, // list endpoint doesn't include the payment sub-block; filled in on "View Details"
  };
};

const findDoc = (docs, type) => (docs || []).find((d) => d.document_type === type);

// FinalSettlementResponse (full nested detail) -> the shape this page's JSX
// reads from, kept close to the original mock shape so most of the render
// functions below didn't need to change.
const mapSettlementDetail = (s) => {
  const documents = s.documents || [];
  const assetsRaw = s.assets || [];
  return {
    id: s.id,
    settlementCode: s.settlement_code,
    employee: {
      id: s.employee_id,
      name: s.employee_name,
      employeeId: s.employee_code,
      department: s.department || '',
      designation: s.designation || '',
      doj: s.date_of_joining || '',
      dol: s.last_working_date || '',
      uan: s.uan_number || '',
      pfNumber: s.pf_number || '',
    },
    noticePeriod: {
      verified: s.notice_period?.verified || false,
      daysServed: s.notice_period?.days_served || 0,
      requiredDays: s.notice_period?.required_days ?? s.notice_period_required_days ?? 0,
      shortfallDays: s.notice_period?.shortfall_days || 0,
      recoveryAmount: toNum(s.notice_period?.recovery_amount),
      verificationDate: s.notice_period?.verification_date || '',
    },
    salary: {
      basic: toNum(s.salary_breakdown?.basic),
      hra: toNum(s.salary_breakdown?.hra),
      specialAllowance: toNum(s.salary_breakdown?.special_allowance),
      otherAllowances: toNum(s.salary_breakdown?.other_allowances),
      daysWorked: s.salary_breakdown?.days_worked || 0,
      workingDaysInMonth: s.salary_breakdown?.working_days_in_month || 30,
      dailyRate: toNum(s.salary_breakdown?.daily_rate),
      totalSalary: toNum(s.salary_breakdown?.salary_for_days),
      arrears: toNum(s.salary_breakdown?.arrears),
      lastWorkingDay: s.salary_breakdown?.last_working_day || s.last_working_date || '',
      paymentDueDate: s.salary_breakdown?.payment_due_date || '',
    },
    leave: {
      earnedLeaveBalance: toNum(s.leave_encashment?.earned_leave_balance),
      casualLeaveBalance: toNum(s.leave_encashment?.casual_leave_balance),
      sickLeaveBalance: toNum(s.leave_encashment?.sick_leave_balance),
      encashmentRate: toNum(s.leave_encashment?.encashment_rate),
      totalEncashment: toNum(s.leave_encashment?.total_encashment),
      encashmentPolicy: s.leave_encashment?.encashment_policy || 'Earned leave only',
    },
    bonus: {
      annualBonus: toNum(s.bonus?.annual_bonus),
      proRataDays: s.bonus?.pro_rata_days || 0,
      proRataBonus: toNum(s.bonus?.pro_rata_bonus),
      eligibility: s.bonus?.is_eligible ?? false,
      calculationMethod: s.bonus?.calculation_method || 'Pro-rata based on days worked',
    },
    gratuity: {
      completedYears: toNum(s.gratuity?.completed_years),
      lastDrawnSalary: toNum(s.gratuity?.last_drawn_basic),
      gratuityAmount: toNum(s.gratuity?.gratuity_amount),
      eligibility: s.gratuity?.is_eligible || false,
      eligibilityYears: s.gratuity?.eligibility_years || 5,
    },
    // Not modeled on the backend at all — kept as a static zero block so the
    // existing "Reimbursements" line item in the additions total doesn't
    // silently disappear from the JSX; it just never contributes anything.
    reimbursements: { pendingClaims: 0, approvedClaims: 0, submittedClaims: 0, approvedCount: 0 },
    deductions: {
      loanOutstanding: toNum(s.deduction?.loan_outstanding),
      advanceAmount: toNum(s.deduction?.advance_amount),
      penaltyAmount: toNum(s.deduction?.penalty_amount),
      noticePeriodRecovery: toNum(s.deduction?.notice_period_recovery),
      otherDeductions: toNum(s.deduction?.other_deductions),
      idCardDeduction: toNum(s.deduction?.id_card_deduction),
      uniformDeduction: toNum(s.deduction?.uniform_deduction),
      assetPenalty: toNum(s.deduction?.asset_penalty),
      tdsDeduction: toNum(s.deduction?.tds_deduction),
      totalDeductions: toNum(s.deduction?.total_deductions),
    },
    assets: {
      allocatedAssets: assetsRaw.map((a) => ({
        id: a.id,
        assetName: a.asset_name,
        assetTag: a.asset_tag,
        category: a.category,
        returnStatus: a.return_status,
        condition: a.condition,
        penalty: toNum(a.penalty),
      })),
      totalAssets: assetsRaw.length,
      returnedAssets: assetsRaw.filter((a) => a.return_status === 'returned').length,
      pendingAssets: assetsRaw.filter((a) => a.return_status === 'pending').length,
      totalPenalty: toNum(s.deduction?.asset_penalty),
    },
    lastWorkingDay: {
      confirmed: !!s.salary_breakdown?.last_working_day,
      actualLastWorkingDay: s.salary_breakdown?.last_working_day || '',
      noticeServedFrom: '',
      noticeServedTo: '',
    },
    netSettlement: toNum(s.net_settlement),
    totalAdditions: toNum(s.total_additions),
    totalDeductionsHeader: toNum(s.total_deductions),
    approval: {
      status: statusKey(s.status),
      statusRaw: s.status,
      approvedBy: s.approved_by_name || '',
      approvedDate: s.approved_date || '',
      initiatedBy: s.initiated_by_name || '',
      initiatedDate: s.initiated_date || '',
      rejectionReason: s.rejection_reason || '',
      workflow: ['HR', 'Finance', 'Management'],
    },
    documents: {
      form16Issued: findDoc(documents, 'Form16')?.issued || false,
      pfFormsIssued: !!(findDoc(documents, 'Form19')?.generated && findDoc(documents, 'Form10C')?.generated),
      experienceLetter: findDoc(documents, 'Experience Letter')?.issued || false,
      relievingLetter: findDoc(documents, 'Relieving Letter')?.issued || false,
      form19Generated: findDoc(documents, 'Form19')?.generated || false,
      form10CGenerated: findDoc(documents, 'Form10C')?.generated || false,
    },
    documentsRaw: documents,
    payment: {
      method: s.payment?.payment_method || 'Bank Transfer',
      accountNumber: s.payment?.account_number || '',
      ifscCode: s.payment?.ifsc_code || '',
      bankName: s.payment?.bank_name || '',
      paymentDate: s.payment?.payment_date || '',
      status: s.payment?.status || 'pending',
      referenceNumber: s.payment?.reference_number || '',
      processedBy: s.payment?.processed_by_name || null,
      processedDate: s.payment?.processed_date || null,
      paymentMode: s.payment?.payment_mode || 'NEFT',
      utrNumber: s.payment?.utr_number || null,
    },
    timeline: s.timeline || [],
    approvalLogs: s.approval_logs || [],
  };
};

const FinalSettlement = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [selectedForm, setSelectedForm] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isActionBusy, setIsActionBusy] = useState(false);

  const [modalState, setModalState] = useState({
    type: null,
    isOpen: false,
    data: null,
  });

  const itemsPerPage = 6;

  const [employeesRaw, setEmployeesRaw] = useState([]);
  const [settlementsRaw, setSettlementsRaw] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [selectedSettlementId, setSelectedSettlementId] = useState(null);
  const [settlementData, setSettlementData] = useState(null);
  const [reports, setReports] = useState([]); // client-side log of exports generated this session

  const openModal = (type, data = null) => {
    setModalState({ type, isOpen: true, data });
  };

  const closeModal = () => {
    setModalState({ type: null, isOpen: false, data: null });
  };

  const showNotification = (message, type = 'success') => {
    const options = {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };

    switch (type) {
      case 'success':
        toast.success(message, options);
        break;
      case 'error':
        toast.error(message, options);
        break;
      case 'warning':
        toast.warning(message, options);
        break;
      case 'info':
        toast.info(message, options);
        break;
      default:
        toast(message, options);
    }
  };

  // ---- data loading -------------------------------------------------------

  const loadEmployees = useCallback(async () => {
    try {
      const res = await employeeAPI.list();
      setEmployeesRaw(Array.isArray(res) ? res : res?.items || []);
    } catch (err) {
      console.error('Failed to load employees:', err);
      showNotification(err.message || 'Failed to load employees', 'error');
    }
  }, []);

  const loadSettlements = useCallback(async () => {
    try {
      const res = await finalSettlementAPI.list({ pageSize: 100 });
      setSettlementsRaw(res?.items || []);
    } catch (err) {
      console.error('Failed to load settlements:', err);
      showNotification(err.message || 'Failed to load settlements', 'error');
    }
  }, []);

  const loadStats = useCallback(async (settlementId) => {
    try {
      const stats = await finalSettlementAPI.getStats(settlementId ?? undefined);
      setStatsData(stats);
    } catch (err) {
      console.error('Failed to load settlement stats:', err);
    }
  }, []);

  const loadSettlementDetail = useCallback(async (id) => {
    if (!id) {
      setSettlementData(null);
      setSelectedSettlementId(null);
      return;
    }
    try {
      const detail = await finalSettlementAPI.get(id);
      setSettlementData(mapSettlementDetail(detail));
      setSelectedSettlementId(id);
      await loadStats(id);
    } catch (err) {
      console.error('Failed to load settlement detail:', err);
      showNotification(err.message || 'Failed to load settlement detail', 'error');
    }
  }, [loadStats]);

  useEffect(() => {
    let cancelled = false;
    const loadAll = async () => {
      setIsLoading(true);
      try {
        const [empRes, settlementsRes] = await Promise.all([
          employeeAPI.list(),
          finalSettlementAPI.list({ pageSize: 100 }),
        ]);
        if (cancelled) return;
        setEmployeesRaw(Array.isArray(empRes) ? empRes : empRes?.items || []);
        setSettlementsRaw(settlementsRes?.items || []);
        await loadStats();
      } catch (err) {
        console.error('Failed to load final settlement data:', err);
        showNotification(err.message || 'Failed to load final settlement data', 'error');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadAll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const employees = useMemo(() => employeesRaw.map(mapEmployee), [employeesRaw]);

  const selectSettlement = useCallback(async (id) => {
    await loadSettlementDetail(id);
    setActiveSection('overview');
  }, [loadSettlementDetail]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadEmployees(),
      loadSettlements(),
      selectedSettlementId ? loadSettlementDetail(selectedSettlementId) : loadStats(),
    ]);
  }, [loadEmployees, loadSettlements, loadSettlementDetail, loadStats, selectedSettlementId]);

  // ---- settlement lifecycle ------------------------------------------------------

  const handleInitiateSettlement = async (formData, selectedEmployee) => {
    if (!selectedEmployee) {
      showNotification('Please select an employee', 'error');
      return;
    }
    try {
      const payload = {
        employee_id: parseInt(formData.employeeId, 10),
        employee_code: selectedEmployee.employeeId,
        employee_name: selectedEmployee.name,
        department: selectedEmployee.department,
        designation: selectedEmployee.designation,
        date_of_joining: selectedEmployee.doj || null,
        exit_type: formData.exitType,
        resignation_date: formData.resignationDate || null,
        last_working_date: formData.lastWorkingDate,
        notice_period_required_days: parseInt(formData.noticePeriodRequiredDays, 10) || 90,
        uan_number: formData.uanNumber || null,
        pf_number: formData.pfNumber || null,
        pan_number: formData.panNumber || null,
        remarks: formData.remarks || null,
        initiated_by_name: 'HR Admin',
        initiated_date: new Date().toISOString().slice(0, 10),
      };
      const created = await finalSettlementAPI.create(payload);
      await loadSettlements();
      await selectSettlement(created.id);
      closeModal();
      showNotification('Settlement initiated successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to initiate settlement', 'error');
    }
  };

  const calculateSettlement = async () => {
    if (!selectedSettlementId) {
      showNotification('Select or initiate a settlement first', 'warning');
      return;
    }
    setIsCalculating(true);
    try {
      await finalSettlementAPI.recalculate(selectedSettlementId);
      await loadSettlementDetail(selectedSettlementId);
      await loadSettlements();
      showNotification('Settlement calculated successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to recalculate settlement', 'error');
    } finally {
      setIsCalculating(false);
    }
  };

  // Draft -> Submit -> Pending Approval -> Approve -> Approved -> Pay -> Paid
  const handlePrimaryWorkflowAction = async () => {
    if (!settlementData) return;
    const raw = settlementData.approval.statusRaw;
    setIsActionBusy(true);
    try {
      if (raw === 'Draft') {
        await finalSettlementAPI.submit(selectedSettlementId, 'HR Admin');
        showNotification('Settlement submitted for approval!', 'success');
      } else if (raw === 'Pending Approval') {
        await finalSettlementAPI.approve(selectedSettlementId, { approved_by_name: 'Finance Manager' });
        showNotification('Settlement approved successfully!', 'success');
      } else if (raw === 'Approved') {
        openModal('payment');
        setIsActionBusy(false);
        return;
      } else {
        showNotification('This settlement has already been paid', 'info');
        setIsActionBusy(false);
        return;
      }
      await loadSettlementDetail(selectedSettlementId);
      await loadSettlements();
    } catch (err) {
      showNotification(err.message || 'Action failed', 'error');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleReject = async () => {
    if (!settlementData) return;
    const reason = window.prompt('Reason for rejecting this settlement?');
    if (!reason) return;
    setIsActionBusy(true);
    try {
      await finalSettlementAPI.reject(selectedSettlementId, { rejection_reason: reason, rejected_by_name: 'HR Manager' });
      await loadSettlementDetail(selectedSettlementId);
      await loadSettlements();
      showNotification('Settlement rejected', 'info');
    } catch (err) {
      showNotification(err.message || 'Failed to reject settlement', 'error');
    } finally {
      setIsActionBusy(false);
    }
  };

  // Quick row-level actions from the Pending table (submit / approve directly
  // without opening the full workspace).
  const handleQuickSubmit = async (id) => {
    try {
      await finalSettlementAPI.submit(id, 'HR Admin');
      await loadSettlements();
      if (id === selectedSettlementId) await loadSettlementDetail(id);
      showNotification('Submitted for approval', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to submit', 'error');
    }
  };

  const handleQuickApprove = async (id) => {
    try {
      await finalSettlementAPI.approve(id, { approved_by_name: 'Finance Manager' });
      await loadSettlements();
      if (id === selectedSettlementId) await loadSettlementDetail(id);
      showNotification('Settlement approved', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to approve', 'error');
    }
  };

  const handleConfirmLastWorkingDay = async (data) => {
    if (!selectedSettlementId) return;
    try {
      await finalSettlementAPI.updateSalaryBreakdown(selectedSettlementId, { last_working_day: data.actualLastWorkingDay });
      const noticeUpdate = { verified: true, verification_date: data.actualLastWorkingDay };
      if (data.noticeServedFrom && data.noticeServedTo) {
        const from = new Date(data.noticeServedFrom);
        const to = new Date(data.noticeServedTo);
        const days = Math.max(0, Math.round((to - from) / 86400000) + 1);
        noticeUpdate.days_served = days;
      }
      await finalSettlementAPI.updateNoticePeriod(selectedSettlementId, noticeUpdate);
      await loadSettlementDetail(selectedSettlementId);
      closeModal();
      showNotification('Last working day confirmed successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to confirm last working day', 'error');
    }
  };

  const handleAssetReturn = async (assetId, returnDate, condition) => {
    if (!selectedSettlementId) return;
    const returnStatus = condition === 'Lost' ? 'lost' : condition === 'Damaged' ? 'damaged' : 'returned';
    try {
      await finalSettlementAPI.updateAsset(selectedSettlementId, assetId, {
        return_status: returnStatus,
        return_date: returnDate,
        condition,
      });
      await loadSettlementDetail(selectedSettlementId);
      showNotification('Asset return recorded successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to update asset', 'error');
    }
  };

  const handleAddAsset = async (newAsset) => {
    if (!selectedSettlementId) return;
    try {
      await finalSettlementAPI.addAsset(selectedSettlementId, {
        asset_id: `AST-${Date.now()}`,
        asset_name: newAsset.assetName,
        asset_tag: newAsset.assetTag || null,
        category: newAsset.category,
        return_status: 'pending',
      });
      await loadSettlementDetail(selectedSettlementId);
      showNotification('Asset added to checklist', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to add asset', 'error');
    }
  };

  const handleProcessPayment = async (data) => {
    if (!selectedSettlementId) return;
    try {
      await finalSettlementAPI.updatePaymentInfo(selectedSettlementId, {
        payment_method: data.method,
        payment_mode: data.paymentMode,
        account_number: data.accountNumber,
        ifsc_code: data.ifscCode,
        bank_name: data.bankName,
      });
      await finalSettlementAPI.pay(selectedSettlementId, {
        reference_number: data.utrNumber || undefined,
        utr_number: data.utrNumber || undefined,
        payment_date: data.paymentDate || undefined,
        processed_by_name: 'Finance Manager',
        remarks: data.remarks || undefined,
      });
      await loadSettlementDetail(selectedSettlementId);
      await loadSettlements();
      closeModal();
      showNotification('Payment processed successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to process payment', 'error');
    }
  };

  // "Form16" | "PF" | "Experience" | "Relieving" | "All" -> real backend
  // doc_type(s). PF covers both Form19 and Form10C. Used both by the
  // GenerateFormModal (for "Generate All") and by the direct per-document
  // quick-action buttons below.
  const generateFormsByKey = async (key) => {
    if (!selectedSettlementId) return;
    const typesToGenerate =
      key === 'All' ? DOCUMENT_TYPES :
      key === 'PF' ? ['Form19', 'Form10C'] :
      key === 'Form16' ? ['Form16'] :
      key === 'Experience' ? ['Experience Letter'] :
      key === 'Relieving' ? ['Relieving Letter'] :
      [];

    try {
      // eslint-disable-next-line no-restricted-syntax
      for (const docType of typesToGenerate) {
        // eslint-disable-next-line no-await-in-loop
        await finalSettlementAPI.generateDocument(selectedSettlementId, docType, 'HR Admin');
        if (AUTO_ISSUE_ON_GENERATE.has(docType)) {
          // eslint-disable-next-line no-await-in-loop
          await finalSettlementAPI.issueDocument(selectedSettlementId, docType);
        }
      }
      await loadSettlementDetail(selectedSettlementId);
      showNotification(`${key} document(s) generated successfully!`, 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to generate document', 'error');
    }
  };

  const handleGenerateForm = async () => {
    await generateFormsByKey(selectedForm);
    closeModal();
  };

  const KEY_FOR_DOCTYPE = {
    Form16: 'Form16',
    Form19: 'PF',
    Form10C: 'PF',
    'Experience Letter': 'Experience',
    'Relieving Letter': 'Relieving',
  };

  // ---- exports ------------------------------------------------------

  const handleExportAllSettlements = async () => {
    try {
      const csv = await finalSettlementAPI.exportAllReport();
      downloadTextFile(csv, `final_settlements_report_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
      setReports((prev) => [
        ...prev,
        {
          id: Date.now(),
          reportName: 'All Settlements Report',
          period: 'All time',
          type: 'csv',
          status: 'generated',
          generatedDate: new Date().toISOString().split('T')[0],
          progress: 100,
        },
      ]);
      showNotification('Report exported successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to export report', 'error');
    }
  };

  const handleExportCurrentSettlement = async () => {
    if (!selectedSettlementId || !settlementData) {
      showNotification('Select a settlement first', 'warning');
      return;
    }
    try {
      const csv = await finalSettlementAPI.exportSingle(selectedSettlementId);
      downloadTextFile(csv, `settlement_${settlementData.settlementCode}.csv`, 'text/csv');
      setReports((prev) => [
        ...prev,
        {
          id: Date.now(),
          reportName: `Settlement ${settlementData.settlementCode}`,
          period: settlementData.employee.dol || '—',
          type: 'csv',
          status: 'generated',
          generatedDate: new Date().toISOString().split('T')[0],
          progress: 100,
        },
      ]);
      showNotification('Settlement exported successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to export settlement', 'error');
    }
  };

  const handleDownloadReceipt = async (item) => {
    try {
      const csv = await finalSettlementAPI.exportSingle(item.id);
      downloadTextFile(csv, `settlement_${item.employeeId}_${item.id}.csv`, 'text/csv');
      showNotification('Receipt downloaded!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to download receipt', 'error');
    }
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    try {
      await refreshAll();
      setCurrentPage(1);
      setSearchTerm('');
      setFilterType('All');
      showNotification('Data refreshed successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to refresh data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (item) => {
    // For pending/completed rows the list endpoint doesn't include the
    // payment sub-block, so fetch the full record for an accurate modal.
    try {
      const full = await finalSettlementAPI.get(item.id);
      openModal('details', {
        ...item,
        paymentDate: full.payment?.payment_date || null,
        approvedBy: full.approved_by_name || null,
      });
    } catch (err) {
      openModal('details', item);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      'draft': 'bg-slate-50 text-slate-700 border border-slate-200',
      'pending-approval': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      'approved': 'bg-blue-50 text-blue-700 border border-blue-200',
      'paid': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      'cancelled': 'bg-rose-50 text-rose-700 border border-rose-200',
      'pending': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      'generated': 'bg-blue-50 text-blue-700 border border-blue-200',
      'issued': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      'none': 'bg-slate-50 text-slate-500 border border-slate-200',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-50 text-slate-700 border border-slate-200'}`}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ') : 'N/A'}
      </span>
    );
  };

  // ---- derived table data ------------------------------------------------------

  const pendingList = useMemo(
    () => settlementsRaw.filter((s) => s.status !== 'Paid' && s.status !== 'Cancelled').map(mapListItem),
    [settlementsRaw]
  );
  const completedList = useMemo(
    () => settlementsRaw.filter((s) => s.status === 'Paid').map(mapListItem),
    [settlementsRaw]
  );

  const employeesForTable = useMemo(() => {
    return employees.map((emp) => {
      // Most recently created settlement for this employee, if any.
      const matches = settlementsRaw.filter((s) => s.employee_id === emp.id);
      const latest = matches.sort((a, b) => b.id - a.id)[0];
      if (!latest) {
        return { ...emp, id: emp.id, settlementId: null, status: 'none', settlementAmount: 0, lastWorkingDay: null };
      }
      return {
        ...emp,
        settlementId: latest.id,
        status: statusKey(latest.status),
        settlementAmount: toNum(latest.net_settlement),
        lastWorkingDay: latest.last_working_date,
      };
    });
  }, [employees, settlementsRaw]);

  const formsForTable = useMemo(() => {
    if (!settlementData) return [];
    return DOCUMENT_TYPES.map((docType) => {
      const doc = findDoc(settlementData.documentsRaw, docType) || {};
      const status = doc.issued ? 'issued' : doc.generated ? 'generated' : 'pending';
      return {
        id: docType,
        formName: DOCUMENT_LABELS[docType] || docType,
        docType,
        employeeName: settlementData.employee.name,
        type: 'pdf',
        status,
        generatedDate: doc.generated_date || null,
        issuedDate: doc.issued_date || null,
        dueDate: null,
      };
    });
  }, [settlementData]);

  const kpis = useMemo(() => {
    if (statsData) {
      return {
        totalAdditions: toNum(statsData.total_additions),
        totalDeductions: toNum(statsData.total_deductions),
        netSettlement: Math.max(0, toNum(statsData.current_settlement)),
        approvalStatus: statsData.approval_status || 'N/A',
        pendingSettlements: pendingList.length,
        completedSettlements: completedList.length,
        totalEmployees: employees.length,
      };
    }
    return {
      totalAdditions: 0,
      totalDeductions: 0,
      netSettlement: 0,
      approvalStatus: 'N/A',
      pendingSettlements: pendingList.length,
      completedSettlements: completedList.length,
      totalEmployees: employees.length,
    };
  }, [statsData, pendingList.length, completedList.length, employees.length]);

  const getFilteredData = () => {
    let data = [];
    switch (activeSection) {
      case 'employees':
        data = employeesForTable.filter((item) =>
          (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filterType !== 'All') {
          data = data.filter((item) => item.status === filterType);
        }
        break;
      case 'pending':
        data = pendingList.filter((item) =>
          (item.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filterType !== 'All') {
          data = data.filter((item) => item.status === filterType);
        }
        break;
      case 'completed':
        data = completedList.filter((item) =>
          (item.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        break;
      case 'forms':
        data = formsForTable.filter((item) =>
          (item.formName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filterType !== 'All') {
          data = data.filter((item) => item.status === filterType);
        }
        break;
      case 'reports':
        data = reports.filter((item) =>
          (item.reportName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.period || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        break;
      default:
        data = [];
    }
    return data;
  };

  const filteredData = getFilteredData();
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const workflowActionMeta = (() => {
    if (!settlementData) return { label: 'Approve', icon: 'heroicons:check-circle', disabled: true };
    switch (settlementData.approval.statusRaw) {
      case 'Draft':
        return { label: 'Submit for Approval', icon: 'heroicons:paper-airplane', disabled: false };
      case 'Pending Approval':
        return { label: 'Approve', icon: 'heroicons:check-circle', disabled: false };
      case 'Approved':
        return { label: 'Pay', icon: 'heroicons:banknotes', disabled: false };
      default:
        return { label: 'Paid', icon: 'heroicons:check-badge', disabled: true };
    }
  })();

  const renderStats = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Net Settlement"
        value={formatCurrency(kpis.netSettlement)}
        subtitle={settlementData ? `${settlementData.employee.name} — ${settlementData.settlementCode}` : 'Select a settlement'}
        icon="heroicons:banknotes"
        color="blue"
      />
      <StatCard
        title="Total Additions"
        value={formatCurrency(kpis.totalAdditions)}
        subtitle="All earnings"
        icon="heroicons:plus-circle"
        color="green"
      />
      <StatCard
        title="Total Deductions"
        value={formatCurrency(kpis.totalDeductions)}
        subtitle="All recoveries"
        icon="heroicons:minus-circle"
        color="red"
      />
      <StatCard
        title="Approval Status"
        value={(kpis.approvalStatus || 'N/A').toUpperCase()}
        subtitle="Current stage"
        icon="heroicons:document-check"
        color="yellow"
      />
    </div>
  );

  const renderQuickActions = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {[
        { icon: 'heroicons:user-plus', label: 'New Settlement', action: () => openModal('initiate'), color: 'indigo', disabled: false },
        { icon: 'heroicons:calculator', label: 'Recalculate', action: calculateSettlement, color: 'blue', disabled: !selectedSettlementId || isCalculating },
        { icon: workflowActionMeta.icon, label: workflowActionMeta.label, action: handlePrimaryWorkflowAction, color: 'green', disabled: workflowActionMeta.disabled || isActionBusy },
        { icon: 'heroicons:document-text', label: 'Documents', action: () => setActiveSection('documents'), color: 'amber', disabled: !selectedSettlementId },
        { icon: 'heroicons:arrow-down-tray', label: 'Export', action: selectedSettlementId ? handleExportCurrentSettlement : handleExportAllSettlements, color: 'purple', disabled: false },
        { icon: 'heroicons:arrow-path', label: 'Refresh', action: handleRefreshData, color: 'slate', disabled: false },
      ].map((item, index) => (
        <button
          key={index}
          className={`p-3 bg-${item.color}-50 hover:bg-${item.color}-100 text-${item.color}-700 rounded-xl border border-${item.color}-200 transition-all hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none`}
          onClick={item.action}
          disabled={item.disabled}
        >
          <Icon icon={item.icon} className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">{item.label}</span>
          <span className="text-sm font-medium sm:hidden">{item.label.charAt(0)}</span>
        </button>
      ))}
    </div>
  );

  const renderNoSettlementSelected = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
      <Icon icon="heroicons:document-magnifying-glass" className="w-14 h-14 mx-auto text-slate-300 mb-4" />
      <h5 className="text-slate-600 font-semibold text-lg">No settlement selected</h5>
      <p className="text-slate-400 text-sm mt-1 mb-4">
        Pick an employee from the Employees tab to open or initiate their settlement.
      </p>
      <button
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition"
        onClick={() => setActiveSection('employees')}
      >
        <Icon icon="heroicons:users" className="w-4 h-4" />
        Go to Employees
      </button>
    </div>
  );

  const renderOverview = () => {
    if (!settlementData) return renderNoSettlementSelected();
    return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
            <h5 className="font-bold text-slate-800 flex items-center gap-2">
              <Icon icon="heroicons:user-circle" className="w-5 h-5 text-blue-500" />
              Employee Information
            </h5>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Employee Name:</span>
              <span className="font-semibold text-slate-800">{settlementData.employee.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Employee ID:</span>
              <span className="font-semibold text-slate-800">{settlementData.employee.employeeId || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Department:</span>
              <span className="text-slate-700">{settlementData.employee.department || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Designation:</span>
              <span className="text-slate-700">{settlementData.employee.designation || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date of Joining:</span>
              <span className="text-slate-700">{settlementData.employee.doj || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Last Working Day:</span>
              <span className="font-semibold text-rose-600">{settlementData.employee.dol || 'N/A'}</span>
            </div>
            <button
              className="w-full mt-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
              onClick={() => openModal('lastWorkingDay')}
            >
              <Icon icon="heroicons:calendar-days" className="w-4 h-4" />
              {settlementData.lastWorkingDay.confirmed ? 'Update Last Working Day' : 'Confirm Last Working Day'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
            <h5 className="font-bold text-slate-800 flex items-center gap-2">
              <Icon icon="heroicons:clock" className="w-5 h-5 text-amber-500" />
              Settlement Timeline
            </h5>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {(settlementData.timeline.length > 0 ? settlementData.timeline : []).map((item, index) => (
                <div key={item.id || index} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${item.is_completed ? 'bg-emerald-100' : 'bg-amber-100'} flex items-center justify-center flex-shrink-0`}>
                    <Icon icon={item.is_completed ? 'heroicons:check-circle' : 'heroicons:clock'} className={`w-4 h-4 ${item.is_completed ? 'text-emerald-600' : 'text-amber-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.event}</p>
                    <p className="text-xs text-slate-500">{item.event_date ? formatDate(item.event_date) : 'Pending'}</p>
                  </div>
                </div>
              ))}
              {settlementData.timeline.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No timeline data available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
          <h5 className="font-bold text-slate-800 flex items-center gap-2">
            <Icon icon="heroicons:chart-bar" className="w-5 h-5 text-purple-500" />
            Settlement Summary
          </h5>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-600 font-medium">Total Additions</p>
              <p className="text-lg font-bold text-blue-700">{formatCurrency(kpis.totalAdditions)}</p>
            </div>
            <div className="text-center p-3 bg-rose-50 rounded-xl">
              <p className="text-xs text-rose-600 font-medium">Total Deductions</p>
              <p className="text-lg font-bold text-rose-700">{formatCurrency(kpis.totalDeductions)}</p>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-xl col-span-2 sm:col-span-1">
              <p className="text-xs text-emerald-600 font-medium">Net Settlement</p>
              <p className="text-lg font-bold text-emerald-700">{formatCurrency(kpis.netSettlement)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'calculations': {
        if (!settlementData) return renderNoSettlementSelected();
        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-slate-800 flex items-center gap-2">
                  <Icon icon="heroicons:calculator" className="w-5 h-5 text-blue-500" />
                  Settlement Calculations
                </h5>
                <button
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
                  onClick={calculateSettlement}
                  disabled={isCalculating}
                >
                  <Icon icon="heroicons:calculator" className="w-4 h-4" />
                  {isCalculating ? 'Calculating...' : 'Calculate'}
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h6 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                    <Icon icon="heroicons:user-circle" className="w-4 h-4 text-blue-500" />
                    Employee Details
                  </h6>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name:</span>
                      <span className="font-medium text-slate-800">{settlementData.employee.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Employee ID:</span>
                      <span className="font-medium text-slate-800">{settlementData.employee.employeeId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Department:</span>
                      <span className="font-medium text-slate-800">{settlementData.employee.department || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last Working Day:</span>
                      <span className="font-medium text-rose-600">{settlementData.employee.dol || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h6 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                    <Icon icon="heroicons:currency-dollar" className="w-4 h-4 text-emerald-500" />
                    Salary Details
                  </h6>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Basic Salary:</span>
                      <span className="font-medium text-slate-800">{formatCurrency(settlementData.salary.basic)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">HRA:</span>
                      <span className="font-medium text-slate-800">{formatCurrency(settlementData.salary.hra)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Days Worked:</span>
                      <span className="font-medium text-slate-800">{settlementData.salary.daysWorked}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="font-semibold text-slate-700">Salary Payable:</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(settlementData.salary.totalSalary)}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h6 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                    <Icon icon="heroicons:sun" className="w-4 h-4 text-amber-500" />
                    Leave Encashment
                  </h6>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Earned Leave Balance:</span>
                      <span className="font-medium text-slate-800">{settlementData.leave.earnedLeaveBalance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Encashment Rate/Day:</span>
                      <span className="font-medium text-slate-800">{formatCurrency(settlementData.leave.encashmentRate)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="font-semibold text-slate-700">Total Encashment:</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(settlementData.leave.totalEncashment)}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h6 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                    <Icon icon="heroicons:gift" className="w-4 h-4 text-purple-500" />
                    Bonus & Gratuity
                  </h6>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Annual Bonus:</span>
                      <span className="font-medium text-slate-800">{formatCurrency(settlementData.bonus.annualBonus)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pro-rata Bonus:</span>
                      <span className="font-medium text-slate-800">{formatCurrency(settlementData.bonus.proRataBonus)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gratuity:</span>
                      <span className={`font-medium ${settlementData.gratuity.eligibility ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {formatCurrency(settlementData.gratuity.gratuityAmount)}
                        {!settlementData.gratuity.eligibility && ' (Not eligible)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'deductions': {
        if (!settlementData) return renderNoSettlementSelected();
        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-slate-800 flex items-center gap-2">
                  <Icon icon="heroicons:minus-circle" className="w-5 h-5 text-rose-500" />
                  Deductions & Recovery
                </h5>
                <button
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
                  onClick={calculateSettlement}
                  disabled={isCalculating}
                >
                  <Icon icon="heroicons:calculator" className="w-4 h-4" />
                  Calculate
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h6 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                    <Icon icon="heroicons:credit-card" className="w-4 h-4 text-blue-500" />
                    Loan & Advances
                  </h6>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Loan Outstanding:</span>
                      <span className="font-medium text-slate-800">{formatCurrency(settlementData.deductions.loanOutstanding)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Advance Amount:</span>
                      <span className="font-medium text-slate-800">{formatCurrency(settlementData.deductions.advanceAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="font-semibold text-slate-700">Total:</span>
                      <span className="font-bold text-rose-600">{formatCurrency(settlementData.deductions.loanOutstanding + settlementData.deductions.advanceAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h6 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                    <Icon icon="heroicons:clock" className="w-4 h-4 text-amber-500" />
                    Notice Period Recovery
                  </h6>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Shortfall Days:</span>
                      <span className="font-medium text-slate-800">{settlementData.noticePeriod.shortfallDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Daily Rate:</span>
                      <span className="font-medium text-slate-800">{formatCurrency(settlementData.salary.dailyRate)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="font-semibold text-slate-700">Recovery Amount:</span>
                      <span className="font-bold text-rose-600">{formatCurrency(settlementData.deductions.noticePeriodRecovery)}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h6 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                    <Icon icon="heroicons:cube" className="w-4 h-4 text-purple-500" />
                    Asset Penalty
                  </h6>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Assets:</span>
                      <span className="font-medium text-slate-800">{settlementData.assets.totalAssets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Returned:</span>
                      <span className="font-medium text-emerald-600">{settlementData.assets.returnedAssets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pending:</span>
                      <span className="font-medium text-amber-600">{settlementData.assets.pendingAssets}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="font-semibold text-slate-700">Total Penalty:</span>
                      <span className="font-bold text-rose-600">{formatCurrency(settlementData.assets.totalPenalty)}</span>
                    </div>
                    <button
                      className="w-full mt-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                      onClick={() => openModal('assets')}
                    >
                      <Icon icon="heroicons:cog-6-tooth" className="w-4 h-4" />
                      Manage Assets
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h6 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                    <Icon icon="heroicons:banknotes" className="w-4 h-4 text-emerald-500" />
                    Net Settlement
                  </h6>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Additions:</span>
                      <span className="font-medium text-emerald-600">{formatCurrency(kpis.totalAdditions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Deductions:</span>
                      <span className="font-medium text-rose-600">{formatCurrency(kpis.totalDeductions)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="font-semibold text-slate-700">Net Settlement:</span>
                      <span className="font-bold text-blue-600 text-lg">{formatCurrency(kpis.netSettlement)}</span>
                    </div>
                    <button
                      className="w-full mt-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => openModal('payment')}
                      disabled={settlementData.approval.statusRaw !== 'Approved'}
                    >
                      <Icon icon="heroicons:banknotes" className="w-4 h-4" />
                      Process Payment
                    </button>
                    {settlementData.approval.statusRaw !== 'Approved' && (
                      <p className="text-xs text-amber-600 text-center mt-1">
                        Approval required before payment
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'approval': {
        if (!settlementData) return renderNoSettlementSelected();
        const st = settlementData.approval.status; // 'draft' | 'pending-approval' | 'approved' | 'paid' | 'cancelled'
        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-slate-800 flex items-center gap-2">
                  <Icon icon="heroicons:document-check" className="w-5 h-5 text-blue-500" />
                  Approval Workflow
                </h5>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
                    onClick={handlePrimaryWorkflowAction}
                    disabled={workflowActionMeta.disabled || isActionBusy}
                  >
                    <Icon icon={workflowActionMeta.icon} className="w-4 h-4" />
                    {workflowActionMeta.label}
                  </button>
                  <button
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
                    onClick={handleReject}
                    disabled={!(st === 'pending-approval' || st === 'approved') || isActionBusy}
                  >
                    <Icon icon="heroicons:x-circle" className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 text-center">
                  <div className="mb-3">
                    <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                      st === 'paid' || st === 'approved' ? 'bg-emerald-100' :
                      st === 'cancelled' ? 'bg-rose-100' :
                      st === 'pending-approval' ? 'bg-amber-100' :
                      'bg-slate-100'
                    }`}>
                      <Icon icon={
                        st === 'paid' || st === 'approved' ? 'heroicons:check-circle' :
                        st === 'cancelled' ? 'heroicons:x-circle' :
                        st === 'pending-approval' ? 'heroicons:clock' :
                        'heroicons:pencil'
                      } className={`w-8 h-8 ${
                        st === 'paid' || st === 'approved' ? 'text-emerald-600' :
                        st === 'cancelled' ? 'text-rose-600' :
                        st === 'pending-approval' ? 'text-amber-600' :
                        'text-slate-600'
                      }`} />
                    </div>
                  </div>
                  <h6 className="font-bold text-lg text-slate-800">{(settlementData.approval.statusRaw || '').toUpperCase()}</h6>
                  <p className="text-sm text-slate-500 mt-1">
                    {st === 'paid' && 'Settlement has been paid out'}
                    {st === 'approved' && 'Settlement has been approved for payment'}
                    {st === 'pending-approval' && 'Awaiting approval from management'}
                    {st === 'draft' && 'Settlement is in draft mode'}
                    {st === 'cancelled' && 'Settlement has been cancelled'}
                  </p>
                  {settlementData.approval.rejectionReason && (
                    <p className="text-xs text-rose-500 mt-2 italic">"{settlementData.approval.rejectionReason}"</p>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h6 className="font-semibold text-sm text-slate-700">Workflow Steps</h6>
                  <div className="space-y-3">
                    {[
                      { step: 1, label: 'HR Verification (Draft)', status: st === 'draft' ? 'in-progress' : 'completed' },
                      { step: 2, label: 'Pending Approval', status: st === 'draft' ? 'pending' : st === 'pending-approval' ? 'in-progress' : 'completed' },
                      { step: 3, label: 'Approved', status: (st === 'approved' || st === 'paid') ? 'completed' : st === 'pending-approval' ? 'pending' : 'pending' },
                      { step: 4, label: 'Paid', status: st === 'paid' ? 'completed' : st === 'approved' ? 'in-progress' : 'pending' },
                    ].map((item) => (
                      <div key={item.step} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          item.status === 'completed' ? 'bg-emerald-100' :
                          item.status === 'in-progress' ? 'bg-amber-100' :
                          'bg-slate-100'
                        }`}>
                          <Icon icon={
                            item.status === 'completed' ? 'heroicons:check-circle' :
                            item.status === 'in-progress' ? 'heroicons:arrow-path' :
                            'heroicons:clock'
                          } className={`w-4 h-4 ${
                            item.status === 'completed' ? 'text-emerald-600' :
                            item.status === 'in-progress' ? 'text-amber-600' :
                            'text-slate-400'
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{item.label}</p>
                          <p className="text-xs text-slate-500 capitalize">{item.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'documents': {
        if (!settlementData) return renderNoSettlementSelected();
        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-slate-800 flex items-center gap-2">
                  <Icon icon="heroicons:document-text" className="w-5 h-5 text-blue-500" />
                  Document Management
                </h5>
                <button
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
                  onClick={() => {
                    setSelectedForm('All');
                    openModal('form');
                  }}
                >
                  <Icon icon="heroicons:document-plus" className="w-4 h-4" />
                  Generate All
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h6 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                    <Icon icon="heroicons:clipboard-document-check" className="w-4 h-4 text-blue-500" />
                    Document Checklist
                  </h6>
                  {[
                    { id: 'form16', label: 'Form 16 Issued', checked: settlementData.documents.form16Issued },
                    { id: 'pfForms', label: 'PF Withdrawal Forms', checked: settlementData.documents.pfFormsIssued },
                    { id: 'expLetter', label: 'Experience Letter', checked: settlementData.documents.experienceLetter },
                    { id: 'relLetter', label: 'Relieving Letter', checked: settlementData.documents.relievingLetter },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        readOnly
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{item.label}</span>
                      {item.checked && (
                        <span className="ml-auto text-xs text-emerald-600 flex items-center gap-1">
                          <Icon icon="heroicons:check-circle" className="w-3 h-3" />
                          Completed
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h6 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                    <Icon icon="heroicons:document-plus" className="w-4 h-4 text-purple-500" />
                    Generate Documents
                  </h6>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Form 16', icon: 'heroicons:document-text', key: 'Form16' },
                      { label: 'PF Forms', icon: 'heroicons:building-library', key: 'PF' },
                      { label: 'Experience Letter', icon: 'heroicons:academic-cap', key: 'Experience' },
                      { label: 'Relieving Letter', icon: 'heroicons:document', key: 'Relieving' },
                    ].map((doc) => (
                      <button
                        key={doc.key}
                        className="p-3 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all text-center"
                        onClick={() => generateFormsByKey(doc.key)}
                      >
                        <Icon icon={doc.icon} className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                        <p className="text-xs font-medium text-slate-700">{doc.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'employees':
      case 'pending':
      case 'completed':
      case 'forms':
      case 'reports':
        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h5 className="font-bold text-slate-800 flex items-center gap-2">
                  <Icon icon={
                    activeSection === 'employees' ? 'heroicons:users' :
                    activeSection === 'pending' ? 'heroicons:clock' :
                    activeSection === 'completed' ? 'heroicons:check-circle' :
                    activeSection === 'forms' ? 'heroicons:clipboard-document' :
                    'heroicons:chart-bar'
                  } className="w-5 h-5 text-blue-500" />
                  {activeSection === 'employees' && 'All Employees'}
                  {activeSection === 'pending' && 'Pending Settlements'}
                  {activeSection === 'completed' && 'Completed Settlements'}
                  {activeSection === 'forms' && (settlementData ? `Documents — ${settlementData.employee.name}` : 'Settlement Documents')}
                  {activeSection === 'reports' && 'Reports & Analytics'}
                </h5>
                <div className="flex gap-2">
                  {activeSection === 'employees' && (
                    <button
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
                      onClick={() => openModal('initiate')}
                    >
                      <Icon icon="heroicons:user-plus" className="w-4 h-4" />
                      New Settlement
                    </button>
                  )}
                  {activeSection === 'reports' && (
                    <>
                      <button
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
                        onClick={handleExportAllSettlements}
                      >
                        <Icon icon="heroicons:arrow-down-tray" className="w-4 h-4" />
                        Export All (CSV)
                      </button>
                      <button
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleExportCurrentSettlement}
                        disabled={!selectedSettlementId}
                      >
                        <Icon icon="heroicons:document-arrow-down" className="w-4 h-4" />
                        Export Current
                      </button>
                    </>
                  )}
                  {activeSection !== 'reports' && (
                    <button
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
                      onClick={handleExportAllSettlements}
                    >
                      <Icon icon="heroicons:arrow-down-tray" className="w-4 h-4" />
                      Export
                    </button>
                  )}
                  <button
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                    onClick={handleRefreshData}
                  >
                    <Icon icon="heroicons:arrow-path" className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={`Search ${activeSection === 'employees' ? 'employees' : activeSection === 'pending' ? 'pending settlements' : activeSection === 'completed' ? 'completed settlements' : activeSection === 'forms' ? 'documents' : 'reports'}...`}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                {(activeSection === 'employees' || activeSection === 'pending' || activeSection === 'forms') && (
                  <select
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="All">All Status</option>
                    {activeSection === 'employees' && (
                      <>
                        <option value="none">No Settlement</option>
                        <option value="draft">Draft</option>
                        <option value="pending-approval">Pending Approval</option>
                        <option value="approved">Approved</option>
                        <option value="paid">Paid</option>
                      </>
                    )}
                    {activeSection === 'pending' && (
                      <>
                        <option value="draft">Draft</option>
                        <option value="pending-approval">Pending Approval</option>
                        <option value="approved">Approved</option>
                      </>
                    )}
                    {activeSection === 'forms' && (
                      <>
                        <option value="pending">Pending</option>
                        <option value="generated">Generated</option>
                        <option value="issued">Issued</option>
                      </>
                    )}
                  </select>
                )}
              </div>

              {activeSection === 'forms' && !settlementData && (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-sm text-slate-500">Select a settlement from the Employees tab to see its documents here.</p>
                </div>
              )}

              {paginatedData.length === 0 ? (
                <div className="text-center py-12">
                  <Icon icon="heroicons:inbox" className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <h5 className="text-slate-600 font-medium text-lg">No records found</h5>
                  <p className="text-slate-400 text-sm">Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50/50 border-b border-slate-200">
                      <tr>
                        {activeSection === 'employees' && (
                          <>
                            <th className="px-3 py-2 text-left font-semibold text-slate-600">Employee</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-600">Department</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-600">Last Working Day</th>
                            <th className="px-3 py-2 text-right font-semibold text-slate-600">Amount</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-600">Status</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-600">Actions</th>
                          </>
                        )}
                        {(activeSection === 'pending' || activeSection === 'completed') && (
                          <>
                            <th className="px-3 py-2 text-left font-semibold text-slate-600">Employee</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-600">Last Working Day</th>
                            <th className="px-3 py-2 text-right font-semibold text-slate-600">Net Amount</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-600">Status</th>
                            {activeSection === 'pending' && (
                              <th className="px-3 py-2 text-center font-semibold text-slate-600">Days Pending</th>
                            )}
                            {activeSection === 'completed' && (
                              <th className="px-3 py-2 text-center font-semibold text-slate-600">Payment Date</th>
                            )}
                            <th className="px-3 py-2 text-center font-semibold text-slate-600">Actions</th>
                          </>
                        )}
                        {activeSection === 'forms' && (
                          <>
                            <th className="px-3 py-2 text-left font-semibold text-slate-600">Document</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-600">Employee</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-600">Type</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-600">Status</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-600">Date</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-600">Actions</th>
                          </>
                        )}
                        {activeSection === 'reports' && (
                          <>
                            <th className="px-3 py-2 text-left font-semibold text-slate-600">Report Name</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-600">Period</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-600">Type</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-600">Status</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-600">Date</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-600">Actions</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedData.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          {(activeSection === 'employees' || activeSection === 'pending' || activeSection === 'completed') && (
                            <>
                              <td className="px-3 py-2">
                                <div className="font-medium text-slate-800">{item.name || item.employeeName}</div>
                                <div className="text-xs text-slate-500">{item.employeeId}</div>
                              </td>
                              {activeSection === 'employees' && (
                                <>
                                  <td className="px-3 py-2 text-slate-700">{item.department}</td>
                                  <td className="px-3 py-2 text-slate-700">{formatDate(item.lastWorkingDay)}</td>
                                </>
                              )}
                              {activeSection !== 'employees' && (
                                <td className="px-3 py-2 text-slate-700">{formatDate(item.lastWorkingDay)}</td>
                              )}
                              <td className="px-3 py-2 text-right font-semibold text-emerald-600">
                                {formatCurrency(item.settlementAmount || item.netAmount)}
                              </td>
                              <td className="px-3 py-2 text-center">{getStatusBadge(item.status)}</td>
                              {activeSection === 'pending' && (
                                <td className="px-3 py-2 text-center">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.daysPending > 7 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                                    {item.daysPending} days
                                  </span>
                                </td>
                              )}
                              {activeSection === 'completed' && (
                                <td className="px-3 py-2 text-center text-slate-700">{formatDate(item.paymentDate)}</td>
                              )}
                              <td className="px-3 py-2">
                                <div className="flex items-center justify-center gap-2">
                                  {activeSection === 'employees' ? (
                                    item.settlementId ? (
                                      <button
                                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition"
                                        onClick={() => selectSettlement(item.settlementId)}
                                        title="Open Settlement"
                                      >
                                        <Icon icon="heroicons:arrow-top-right-on-square" className="w-4 h-4" />
                                      </button>
                                    ) : (
                                      <button
                                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition"
                                        onClick={() => openModal('initiate', { employeeId: item.id })}
                                        title="Initiate Settlement"
                                      >
                                        <Icon icon="heroicons:plus-circle" className="w-4 h-4" />
                                      </button>
                                    )
                                  ) : (
                                    <>
                                      <button
                                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                                        onClick={() => handleViewDetails(item)}
                                        title="View Details"
                                      >
                                        <Icon icon="heroicons:eye" className="w-4 h-4" />
                                      </button>
                                      <button
                                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition"
                                        onClick={() => selectSettlement(item.id)}
                                        title="Open Workspace"
                                      >
                                        <Icon icon="heroicons:arrow-top-right-on-square" className="w-4 h-4" />
                                      </button>
                                      {activeSection === 'pending' && item.statusRaw === 'Draft' && (
                                        <button
                                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition"
                                          onClick={() => handleQuickSubmit(item.id)}
                                          title="Submit for Approval"
                                        >
                                          <Icon icon="heroicons:paper-airplane" className="w-4 h-4" />
                                        </button>
                                      )}
                                      {activeSection === 'pending' && item.statusRaw === 'Pending Approval' && (
                                        <button
                                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition"
                                          onClick={() => handleQuickApprove(item.id)}
                                          title="Approve"
                                        >
                                          <Icon icon="heroicons:check-circle" className="w-4 h-4" />
                                        </button>
                                      )}
                                      {activeSection === 'completed' && (
                                        <button
                                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition"
                                          onClick={() => handleDownloadReceipt(item)}
                                          title="Download Settlement CSV"
                                        >
                                          <Icon icon="heroicons:document-arrow-down" className="w-4 h-4" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </>
                          )}

                          {activeSection === 'forms' && (
                            <>
                              <td className="px-3 py-2 font-medium text-slate-800">{item.formName}</td>
                              <td className="px-3 py-2 text-slate-700">{item.employeeName}</td>
                              <td className="px-3 py-2 text-center">
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                  {item.type?.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">{getStatusBadge(item.status)}</td>
                              <td className="px-3 py-2 text-center text-slate-700">
                                {formatDate(item.generatedDate || item.issuedDate || item.dueDate)}
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                                    onClick={() => openModal('details', item)}
                                    title="View Details"
                                  >
                                    <Icon icon="heroicons:eye" className="w-4 h-4" />
                                  </button>
                                  {item.status !== 'issued' && (
                                    <button
                                      className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition"
                                      onClick={() => generateFormsByKey(KEY_FOR_DOCTYPE[item.docType])}
                                      title={item.status === 'generated' ? 'Regenerate' : 'Generate'}
                                    >
                                      <Icon icon="heroicons:document-plus" className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </>
                          )}

                          {activeSection === 'reports' && (
                            <>
                              <td className="px-3 py-2 font-medium text-slate-800">{item.reportName}</td>
                              <td className="px-3 py-2 text-slate-700">{item.period}</td>
                              <td className="px-3 py-2 text-center">
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {item.type?.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">{getStatusBadge(item.status)}</td>
                              <td className="px-3 py-2 text-center text-slate-700">{item.generatedDate || 'N/A'}</td>
                              <td className="px-3 py-2">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                                    onClick={() => openModal('details', item)}
                                    title="View Details"
                                  >
                                    <Icon icon="heroicons:eye" className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                  <div className="text-sm text-slate-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: 'heroicons:squares-2x2' },
    { id: 'calculations', label: 'Calculations', icon: 'heroicons:calculator' },
    { id: 'deductions', label: 'Deductions', icon: 'heroicons:minus-circle' },
    { id: 'approval', label: 'Approval', icon: 'heroicons:document-check' },
    { id: 'documents', label: 'Documents', icon: 'heroicons:document-text' },
    { id: 'employees', label: 'Employees', icon: 'heroicons:users' },
    { id: 'pending', label: 'Pending', icon: 'heroicons:clock' },
    { id: 'completed', label: 'Completed', icon: 'heroicons:check-circle' },
    { id: 'forms', label: 'Forms', icon: 'heroicons:clipboard-document' },
    { id: 'reports', label: 'Reports', icon: 'heroicons:chart-bar' },
  ];

  return (
    <div className="w-full mx-auto max-w-7xl space-y-4 sm:space-y-6 md:px-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Icon icon="heroicons:banknotes" className="w-6 h-6 text-blue-600" />
            Final Settlement
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage employee exit settlements, approvals, payments, and statutory documents
          </p>
        </div>
      </div>

      {renderStats()}
      {renderQuickActions()}

      <div className="border border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm rounded-2xl p-1.5 sm:p-2 overflow-x-auto">
        <div className="flex flex-wrap gap-1 min-w-[600px]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              onClick={() => {
                setActiveSection(tab.id);
                setCurrentPage(1);
                setSearchTerm('');
                setFilterType('All');
              }}
            >
              <Icon icon={tab.icon} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <Icon icon="heroicons:arrow-path" className="w-10 h-10 mx-auto mb-3 animate-spin text-slate-300" />
          <p className="text-sm text-slate-400">Loading final settlement data...</p>
        </div>
      ) : (
        renderContent()
      )}

      <InitiateSettlementModal
        isOpen={modalState.isOpen && modalState.type === 'initiate'}
        onClose={closeModal}
        onSubmit={handleInitiateSettlement}
        employees={employees}
        preselectedEmployeeId={modalState.data?.employeeId ?? ''}
      />

      <LastWorkingDayModal
        isOpen={modalState.isOpen && modalState.type === 'lastWorkingDay'}
        onClose={closeModal}
        onConfirm={handleConfirmLastWorkingDay}
        lastWorkingDay={settlementData?.lastWorkingDay}
      />

      <AssetManagementModal
        isOpen={modalState.isOpen && modalState.type === 'assets'}
        onClose={closeModal}
        assets={settlementData?.assets}
        formatCurrency={formatCurrency}
        onAssetReturn={handleAssetReturn}
        onAddAsset={handleAddAsset}
      />

      <PaymentModal
        isOpen={modalState.isOpen && modalState.type === 'payment'}
        onClose={closeModal}
        onSubmit={handleProcessPayment}
        formatCurrency={formatCurrency}
        settlementData={settlementData}
        mode="settlement"
      />

      <GenerateFormModal
        isOpen={modalState.isOpen && modalState.type === 'form'}
        onClose={closeModal}
        onSubmit={handleGenerateForm}
        formName={selectedForm === 'All' ? 'All Documents' : (DOCUMENT_LABELS[selectedForm] || selectedForm || '')}
        employees={[]}
        mode="settlement"
      />

      <SettlementDetailsModal
        isOpen={modalState.isOpen && modalState.type === 'details'}
        onClose={closeModal}
        item={modalState.data}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        getStatusBadge={getStatusBadge}
        activeSection={activeSection}
      />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        className="text-xs"
      />
    </div>
  );
};

export default FinalSettlement;