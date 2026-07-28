import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import RegularizationRequestModal from "../modal/RegularizationRequestModal";
import RegularizationApprovalModal from "../modal/RegularizationApprovalModal";
import RegularizationBulkModal from "../modal/RegularizationBulkModal";
import { regularizationAPI, employeeAPI } from "../../../shared/utils/api";

// ---------------------------------------------------------------------------
// The UI (this page + its 3 modals) speaks in short, front-end-friendly type
// codes: missing / incorrect / forgot / wfh / on_duty. The backend
// (schema/HR_Automation/regularization.py) speaks in its own fixed list of
// request_type strings (see REQUEST_TYPES in the router). These two maps
// translate between them.
// ---------------------------------------------------------------------------
const TYPE_TO_BACKEND = {
  missing: "Missing Punch",
  incorrect: "Wrong Punch In", // closest match for the UI's generic "Incorrect Time" case
  forgot: "Forgot Punch",
  wfh: "Work From Home",
  on_duty: "On Duty",
};

const BACKEND_TO_TYPE = {
  "Missing Punch": "missing",
  "Forgot Punch": "forgot",
  "Wrong Punch In": "incorrect",
  "Wrong Punch Out": "incorrect",
  "Early Departure": "incorrect",
  "Late Arrival": "incorrect",
  "Work From Home": "wfh",
  "On Duty": "on_duty",
  "Other": "other",
};

const REPORT_FORMAT_TO_BACKEND = { pdf: "PDF", excel: "Excel", csv: "CSV" };

const BULK_ISSUE_LABELS = {
  system: "System Failure",
  device: "Device Malfunction",
  sync: "Sync Error",
  network: "Network Failure",
  other: "Other",
};

// Backend RegularizationRequestResponse -> the shape this page's JSX expects
// (kept close to the original localStorage-era shape so the render functions
// and the 3 modal components below don't need to change).
const mapRequestFromApi = (r) => {
  const rawStatus = (r.status || "pending").toLowerCase(); // pending | approved | rejected
  const isAutoRejected =
    rawStatus === "rejected" &&
    !!r.review_comments &&
    r.review_comments.toLowerCase().startsWith("auto-rejected");

  return {
    id: r.id,
    employeeId: r.employee_id,
    employeeName: r.employee_name || `Employee #${r.employee_id}`,
    department: r.department || "Unknown",
    requestType: BACKEND_TO_TYPE[r.request_type] || "other",
    requestTypeRaw: r.request_type,
    reason: r.reason,
    remarks: r.review_comments || "",
    reviewComments: r.review_comments,
    status: isAutoRejected ? "auto-rejected" : rawStatus,
    submittedAt: r.submitted_at,
    reviewedBy: r.reviewed_by,
    reviewedAt: r.reviewed_at,
    approvedBy: rawStatus === "approved" ? (r.reviewed_by ? `User #${r.reviewed_by}` : "HR") : undefined,
    rejectedBy:
      rawStatus === "rejected"
        ? isAutoRejected
          ? "System"
          : r.reviewed_by
          ? `User #${r.reviewed_by}`
          : "HR"
        : undefined,
    isBulk: r.is_bulk,
    bulkBatchId: r.bulk_batch_id,
    requestDate: r.request_date,
    date: r.request_date,
    originalCheckIn: r.original_check_in,
    originalCheckOut: r.original_check_out,
    requestedCheckIn: r.requested_check_in,
    requestedCheckOut: r.requested_check_out,
    dateTime: r.requested_check_in
      ? `${r.request_date} ${r.requested_check_in}`
      : r.requested_check_out
      ? `${r.request_date} ${r.requested_check_out}`
      : r.request_date,
  };
};

const Regularization = () => {
  const [activeTab, setActiveTab] = useState("requests");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestType, setRequestType] = useState("missing");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [requests, setRequests] = useState([]);
  const [autoRejectRules, setAutoRejectRules] = useState([]);
  const [reports, setReports] = useState([]); // client-side log of reports generated this session

  const [requestForm, setRequestForm] = useState({
    employeeId: "",
    requestType: "missing",
    dateTime: "",
    originalTime: "",
    correctedTime: "",
    date: "",
    punchType: "IN",
    approxTime: "",
    location: "",
    fromTime: "",
    toTime: "",
    dutyType: "",
    purpose: "",
    reason: "",
    remarks: "",
    summary: "",
    attachment: null,
  });

  const [approvalForm, setApprovalForm] = useState({
    action: "",
    remarks: "",
  });

  const [bulkForm, setBulkForm] = useState({
    fromDate: "",
    toDate: "",
    issueType: "",
    employees: [],
    file: null,
  });

  const [reportForm, setReportForm] = useState({
    fromDate: "",
    toDate: "",
    requestType: "",
    format: "pdf",
  });

  // ---- data loading -------------------------------------------------------

  const loadRequests = useCallback(async () => {
    try {
      const res = await regularizationAPI.listRequests();
      setRequests((res?.items || []).map(mapRequestFromApi));
    } catch (err) {
      console.error("Failed to load regularization requests:", err);
      toast.error(err.message || "Failed to load regularization requests");
    }
  }, []);

  const loadAutoRejectRules = useCallback(async () => {
    try {
      const rules = await regularizationAPI.listAutoRejectRules();
      setAutoRejectRules(Array.isArray(rules) ? rules : []);
    } catch (err) {
      console.error("Failed to load auto-reject rules:", err);
      toast.error(err.message || "Failed to load auto-reject rules");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      setIsLoading(true);
      try {
        const [empRes, reqRes, rulesRes] = await Promise.all([
          employeeAPI.list(),
          regularizationAPI.listRequests(),
          regularizationAPI.listAutoRejectRules(),
        ]);
        if (cancelled) return;
        setEmployees(Array.isArray(empRes) ? empRes : empRes?.items || []);
        setRequests((reqRes?.items || []).map(mapRequestFromApi));
        setAutoRejectRules(Array.isArray(rulesRes) ? rulesRes : []);
      } catch (err) {
        console.error("Failed to load regularization data:", err);
        toast.error(err.message || "Failed to load regularization data");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const initialEmployees = useMemo(
    () =>
      employees.map((e) => ({
        id: e.id,
        name: [e.first_name, e.middle_name, e.last_name].filter(Boolean).join(" ") || `Employee #${e.id}`,
        department: e.department || "—",
        isActive: e.is_active !== false,
      })),
    [employees]
  );

  // ---- request submit ------------------------------------------------------

  const buildRequestPayload = (form) => {
    const backendType = TYPE_TO_BACKEND[form.requestType] || "Other";
    let requestDate = null;
    let originalCheckIn = null;
    let requestedCheckIn = null;
    let requestedCheckOut = null;
    let extraNotes = "";

    switch (form.requestType) {
      case "missing": {
        if (form.dateTime) {
          const [d, t] = form.dateTime.split("T");
          requestDate = d;
          requestedCheckIn = t;
        }
        break;
      }
      case "incorrect": {
        if (form.correctedTime) {
          const [d, t] = form.correctedTime.split("T");
          requestDate = d;
          requestedCheckIn = t;
        }
        if (form.originalTime) {
          originalCheckIn = form.originalTime.split("T")[1] || null;
        }
        break;
      }
      case "forgot": {
        requestDate = form.date || null;
        if (form.punchType === "OUT") requestedCheckOut = form.approxTime || null;
        else requestedCheckIn = form.approxTime || null;
        break;
      }
      case "wfh": {
        requestDate = form.date || null;
        extraNotes = ` | Location: ${form.location || "-"}. Work summary: ${form.summary || "-"}`;
        break;
      }
      case "on_duty": {
        requestDate = form.date || null;
        requestedCheckIn = form.fromTime || null;
        requestedCheckOut = form.toTime || null;
        extraNotes = ` | Duty type: ${form.dutyType || "-"}. Purpose/Location: ${form.purpose || "-"}`;
        break;
      }
      default:
        requestDate = form.date || null;
    }

    return {
      requestDate,
      payload: {
        employee_id: parseInt(form.employeeId, 10),
        request_type: backendType,
        request_date: requestDate,
        original_check_in: originalCheckIn,
        requested_check_in: requestedCheckIn,
        requested_check_out: requestedCheckOut,
        reason: `${form.reason}${extraNotes} — Remarks: ${form.remarks}`.trim(),
      },
    };
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.employeeId || !requestForm.reason || !requestForm.remarks) {
      toast.error("Please fill all required fields (Employee, Reason, Remarks)");
      return;
    }

    const { requestDate, payload } = buildRequestPayload(requestForm);
    if (!requestDate) {
      toast.error("Please fill in the date/time details for this request type");
      return;
    }

    setIsSubmittingRequest(true);
    try {
      await regularizationAPI.createRequest(payload);
      await loadRequests();
      setShowRequestModal(false);
      setRequestForm({
        employeeId: "",
        requestType: "missing",
        dateTime: "",
        originalTime: "",
        correctedTime: "",
        date: "",
        punchType: "IN",
        approxTime: "",
        location: "",
        fromTime: "",
        toTime: "",
        dutyType: "",
        purpose: "",
        reason: "",
        remarks: "",
        summary: "",
        attachment: null,
      });
      toast.success("Regularization request submitted successfully");
    } catch (err) {
      toast.error(err.message || "Failed to submit regularization request");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // ---- approve / reject ------------------------------------------------------

  const handleApproveRequest = async (requestId, approved) => {
    try {
      await regularizationAPI.reviewRequest(requestId, {
        status: approved ? "Approved" : "Rejected",
        review_comments: approvalForm.remarks || null,
      });
      await loadRequests();
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setApprovalForm({ action: "", remarks: "" });
      toast.success(`Request ${approved ? "approved" : "rejected"} successfully`);
    } catch (err) {
      toast.error(err.message || "Failed to update the request");
    }
  };

  // ---- bulk processing ------------------------------------------------------
  // The bulk modal collects a date range + an issue type (system-wide problems
  // like device/sync/network failures), but the backend's /bulk-process only
  // accepts ONE request_date per call. We loop over each day in the chosen
  // range and create one bulk batch per day for every active employee.

  const handleBulkProcess = async () => {
    if (!bulkForm.fromDate || !bulkForm.toDate || !bulkForm.issueType) {
      toast.error("Please fill all required fields");
      return;
    }

    const from = new Date(bulkForm.fromDate);
    const to = new Date(bulkForm.toDate);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
      toast.error("From Date must be on or before To Date");
      return;
    }

    const dayCount = Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;
    if (dayCount > 60) {
      toast.error("Please choose a date range of 60 days or less for bulk processing");
      return;
    }

    const activeEmployeeIds = initialEmployees.filter((e) => e.isActive).map((e) => e.id);
    if (activeEmployeeIds.length === 0) {
      toast.error("No active employees found to process");
      return;
    }

    const issueLabel = BULK_ISSUE_LABELS[bulkForm.issueType] || bulkForm.issueType;
    const reason = `Bulk regularization due to ${issueLabel} affecting attendance capture from ${bulkForm.fromDate} to ${bulkForm.toDate}.${
      bulkForm.file ? ` Reference file: ${bulkForm.file.name}.` : ""
    }`;

    setIsBulkSubmitting(true);
    try {
      let totalCreated = 0;
      for (let i = 0; i < dayCount; i++) {
        const d = new Date(from);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
        // eslint-disable-next-line no-await-in-loop
        const result = await regularizationAPI.bulkProcess({
          employee_ids: activeEmployeeIds,
          request_type: "Other",
          request_date: dateStr,
          reason,
          auto_approve: true,
        });
        totalCreated += result?.created_count || 0;
      }

      await loadRequests();
      setShowBulkModal(false);
      setBulkForm({ fromDate: "", toDate: "", issueType: "", employees: [], file: null });
      toast.success(
        `Bulk regularization processed for ${activeEmployeeIds.length} employee(s), ${totalCreated} record(s) created`
      );
    } catch (err) {
      toast.error(err.message || "Failed to process bulk regularization");
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const bulkBatches = useMemo(() => {
    const map = new Map();
    requests.forEach((r) => {
      if (!r.isBulk || !r.bulkBatchId) return;
      if (!map.has(r.bulkBatchId)) {
        map.set(r.bulkBatchId, {
          batchId: r.bulkBatchId,
          dates: [],
          count: 0,
          status: r.status,
          reason: r.reason,
          reviewedBy: r.reviewedBy,
        });
      }
      const entry = map.get(r.bulkBatchId);
      entry.dates.push(r.requestDate);
      entry.count += 1;
    });
    return Array.from(map.values())
      .map((b) => ({
        id: b.batchId,
        fromDate: b.dates.reduce((min, d) => (d < min ? d : min), b.dates[0]),
        toDate: b.dates.reduce((max, d) => (d > max ? d : max), b.dates[0]),
        issueType: b.reason,
        processedCount: b.count,
        status: b.status,
        processedBy: b.reviewedBy ? `User #${b.reviewedBy}` : "HR Admin",
      }))
      .sort((a, b) => (a.fromDate < b.fromDate ? 1 : -1));
  }, [requests]);

  // ---- reports ------------------------------------------------------

  const handleGenerateReport = () => {
    if (!reportForm.fromDate || !reportForm.toDate) {
      toast.error("Please select both From Date and To Date");
      return;
    }

    const backendFormat = REPORT_FORMAT_TO_BACKEND[reportForm.format] || "PDF";
    const backendType = reportForm.requestType ? TYPE_TO_BACKEND[reportForm.requestType] : "";
    const url = regularizationAPI.getReportDownloadUrl(
      reportForm.fromDate,
      reportForm.toDate,
      backendType,
      backendFormat
    );
    window.open(url, "_blank");

    // The backend streams the file straight back and doesn't keep a reports
    // history table, so we log generated reports client-side for this tab,
    // estimating the record count from the requests we already have loaded.
    const matching = requests.filter((r) => {
      if (!r.requestDate) return false;
      const inRange = r.requestDate >= reportForm.fromDate && r.requestDate <= reportForm.toDate;
      const typeOk = !reportForm.requestType || r.requestType === reportForm.requestType;
      return inRange && typeOk;
    });

    setReports((prev) => [
      ...prev,
      {
        id: Date.now(),
        fromDate: reportForm.fromDate,
        toDate: reportForm.toDate,
        requestType: reportForm.requestType,
        format: reportForm.format,
        generatedAt: new Date().toISOString(),
        summary: { totalRequests: matching.length },
      },
    ]);

    toast.success("Report download started");
    setReportForm({
      fromDate: "",
      toDate: "",
      requestType: "",
      format: "pdf",
    });
  };

  // ---- auto-reject rule toggling ------------------------------------------------------

  const handleToggleAutoRejectRule = async (rule) => {
    try {
      const updated = await regularizationAPI.toggleAutoRejectRule(rule.id);
      setAutoRejectRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
    } catch (err) {
      toast.error(err.message || "Failed to update auto-reject rule");
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "All" || req.status === filterStatus.toLowerCase();
    const matchesType =
      filterType === "All" || req.requestType === filterType.toLowerCase();
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Pending', color: 'yellow' },
      approved: { label: 'Approved', color: 'green' },
      rejected: { label: 'Rejected', color: 'red' },
      'auto-rejected': { label: 'Auto-Rejected', color: 'gray' },
    };
    const { label, color } = config[status] || { label: status, color: 'gray' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${color}-50 text-${color}-700 border border-${color}-100`}>
        {label}
      </span>
    );
  };

  const getRequestTypeBadge = (type) => {
    const config = {
      missing: { label: 'Missing Punch', color: 'blue' },
      incorrect: { label: 'Incorrect Time', color: 'amber' },
      forgot: { label: 'Forgot Punch', color: 'purple' },
      wfh: { label: 'WFH', color: 'cyan' },
      on_duty: { label: 'On-Duty', color: 'emerald' },
    };
    const { label, color } = config[type] || { label: type, color: 'gray' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${color}-50 text-${color}-700 border border-${color}-100`}>
        {label}
      </span>
    );
  };

  const renderRequests = () => (
    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h5 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
          <Icon icon="heroicons:document-text" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <span className="hidden xs:inline">Regularization Requests</span>
          <span className="xs:hidden">Requests</span>
        </h5>
        <button
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/10"
          onClick={() => {
            setRequestType("missing");
            setRequestForm({ ...requestForm, requestType: "missing" });
            setShowRequestModal(true);
          }}
        >
          <Icon icon="heroicons:plus-circle" className="w-4 h-4" />
          <span className="hidden xs:inline">New Request</span>
          <span className="xs:hidden">New</span>
        </button>
      </div>

      <div className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Icon icon="heroicons:magnifying-glass" className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:w-40">
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm bg-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="auto-rejected">Auto-Rejected</option>
            </select>
          </div>
          <div className="sm:w-40">
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm bg-white"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="missing">Missing Punch</option>
              <option value="incorrect">Incorrect Time</option>
              <option value="forgot">Forgot Punch</option>
              <option value="wfh">WFH</option>
              <option value="on_duty">On-Duty</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-2 sm:p-3">Employee</th>
                <th className="p-2 sm:p-3 hidden sm:table-cell">Type</th>
                <th className="p-2 sm:p-3 hidden md:table-cell">Date/Time</th>
                <th className="p-2 sm:p-3">Reason</th>
                <th className="p-2 sm:p-3">Status</th>
                <th className="p-2 sm:p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-400">
                    <Icon icon="heroicons:arrow-path" className="w-6 h-6 mx-auto mb-2 animate-spin text-slate-300" />
                    Loading regularization requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-400">
                    <Icon icon="heroicons:inbox" className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No regularization requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-2 sm:p-3">
                      <div className="font-bold text-slate-800 text-xs sm:text-sm">{req.employeeName}</div>
                      <div className="text-[10px] text-slate-400">{req.department}</div>
                    </td>
                    <td className="p-2 sm:p-3 hidden sm:table-cell">
                      {getRequestTypeBadge(req.requestType)}
                    </td>
                    <td className="p-2 sm:p-3 hidden md:table-cell text-slate-600">
                      {req.dateTime || req.date || req.originalTime || "N/A"}
                    </td>
                    <td className="p-2 sm:p-3">
                      <span className="text-xs text-slate-600 line-clamp-2">{req.reason}</span>
                    </td>
                    <td className="p-2 sm:p-3">{getStatusBadge(req.status)}</td>
                    <td className="p-2 sm:p-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        {req.status === "pending" && (
                          <>
                            <button
                              className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                              onClick={() => handleApproveRequest(req.id, true)}
                              title="Approve"
                            >
                              <Icon icon="heroicons:check" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                            <button
                              className="p-1.5 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
                              onClick={() => {
                                setSelectedRequest(req);
                                setShowApprovalModal(true);
                              }}
                              title="Reject"
                            >
                              <Icon icon="heroicons:x-mark" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </>
                        )}
                        <button
                          className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          onClick={() => {
                            setSelectedRequest(req);
                            setShowApprovalModal(true);
                          }}
                          title="View Details"
                        >
                          <Icon icon="heroicons:eye" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="lg:col-span-2">
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-b border-slate-200">
            <h5 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
              <Icon icon="heroicons:cog-6-tooth" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="hidden xs:inline">Auto-Reject Rules</span>
              <span className="xs:hidden">Rules</span>
            </h5>
          </div>
          <div className="p-3 sm:p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-2 sm:p-3">Request Type</th>
                    <th className="p-2 sm:p-3">Days</th>
                    <th className="p-2 sm:p-3">Status</th>
                    <th className="p-2 sm:p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {autoRejectRules.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-6 text-center text-slate-400">
                        No auto-reject rules configured
                      </td>
                    </tr>
                  ) : (
                    autoRejectRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-2 sm:p-3 font-medium">
                          {getRequestTypeBadge(BACKEND_TO_TYPE[rule.request_type] || "other")}
                          <span className="ml-1 text-[10px] text-slate-400">{rule.request_type}</span>
                        </td>
                        <td className="p-2 sm:p-3">{rule.days_threshold} days</td>
                        <td className="p-2 sm:p-3">
                          {getStatusBadge(rule.is_enabled ? "approved" : "rejected")}
                        </td>
                        <td className="p-2 sm:p-3 text-right">
                          <button
                            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            onClick={() => handleToggleAutoRejectRule(rule)}
                          >
                            {rule.is_enabled ? "Disable" : "Enable"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-b border-slate-200">
            <h5 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
              <Icon icon="heroicons:chart-bar" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="hidden xs:inline">Statistics</span>
              <span className="xs:hidden">Stats</span>
            </h5>
          </div>
          <div className="p-3 sm:p-4 space-y-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-blue-600">{requests.length}</p>
              <p className="text-xs text-slate-500">Total Requests</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-sm font-bold text-amber-600">
                  {requests.filter((r) => r.status === "pending").length}
                </p>
                <p className="text-[10px] text-slate-500">Pending</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-sm font-bold text-emerald-600">
                  {requests.filter((r) => r.status === "approved").length}
                </p>
                <p className="text-[10px] text-slate-500">Approved</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-sm font-bold text-rose-600">
                  {requests.filter((r) => r.status === "rejected" || r.status === "auto-rejected").length}
                </p>
                <p className="text-[10px] text-slate-500">Rejected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBulkProcessing = () => (
    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h5 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
          <Icon icon="heroicons:arrow-up-tray" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <span className="hidden xs:inline">Bulk Regularization Processing</span>
          <span className="xs:hidden">Bulk</span>
        </h5>
        <button
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/10"
          onClick={() => setShowBulkModal(true)}
        >
          <Icon icon="heroicons:plus-circle" className="w-4 h-4" />
          <span className="hidden xs:inline">Process Bulk</span>
          <span className="xs:hidden">Bulk</span>
        </button>
      </div>

      <div className="p-3 sm:p-4">
        <p className="text-xs text-slate-500 mb-3">
          Use bulk processing for system-wide issues like device malfunctions, sync errors, or network failures affecting multiple employees.
        </p>
        {bulkBatches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-2 sm:p-3">Date Range</th>
                  <th className="p-2 sm:p-3">Issue</th>
                  <th className="p-2 sm:p-3">Processed</th>
                  <th className="p-2 sm:p-3">Status</th>
                  <th className="p-2 sm:p-3">Processed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {bulkBatches.map((process) => (
                  <tr key={process.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-2 sm:p-3">{process.fromDate} to {process.toDate}</td>
                    <td className="p-2 sm:p-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 max-w-xs truncate">
                        {process.issueType}
                      </span>
                    </td>
                    <td className="p-2 sm:p-3">{process.processedCount} record(s)</td>
                    <td className="p-2 sm:p-3">{getStatusBadge(process.status)}</td>
                    <td className="p-2 sm:p-3">{process.processedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6">
            <Icon icon="heroicons:inbox" className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No bulk processing records</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-b border-slate-200">
        <h5 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
          <Icon icon="heroicons:chart-bar" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <span className="hidden xs:inline">Regularization Reports</span>
          <span className="xs:hidden">Reports</span>
        </h5>
      </div>

      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">From Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              value={reportForm.fromDate}
              onChange={(e) => setReportForm({...reportForm, fromDate: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">To Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              value={reportForm.toDate}
              onChange={(e) => setReportForm({...reportForm, toDate: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Request Type</label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
              value={reportForm.requestType}
              onChange={(e) => setReportForm({...reportForm, requestType: e.target.value})}
            >
              <option value="">All Types</option>
              <option value="missing">Missing Punch</option>
              <option value="incorrect">Incorrect Time</option>
              <option value="forgot">Forgot Punch</option>
              <option value="wfh">WFH</option>
              <option value="on_duty">On-Duty</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Format</label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
              value={reportForm.format}
              onChange={(e) => setReportForm({...reportForm, format: e.target.value})}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>

        <button
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/10"
          onClick={handleGenerateReport}
        >
          <Icon icon="heroicons:arrow-down-tray" className="w-4 h-4" />
          Generate Report
        </button>

        {reports.length > 0 && (
          <div className="mt-4">
            <h6 className="text-xs font-bold text-slate-800 mb-3">Generated Reports</h6>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-2 sm:p-3">Date Range</th>
                    <th className="p-2 sm:p-3">Type</th>
                    <th className="p-2 sm:p-3">Format</th>
                    <th className="p-2 sm:p-3">Generated</th>
                    <th className="p-2 sm:p-3">Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reports.slice().reverse().map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-2 sm:p-3">{report.fromDate} to {report.toDate}</td>
                      <td className="p-2 sm:p-3">{report.requestType || "All Types"}</td>
                      <td className="p-2 sm:p-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 uppercase">
                          {report.format}
                        </span>
                      </td>
                      <td className="p-2 sm:p-3">{new Date(report.generatedAt).toLocaleString()}</td>
                      <td className="p-2 sm:p-3">{report.summary?.totalRequests || report.data?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full mx-auto max-w-7xl space-y-4 sm:space-y-6 md:px-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Icon icon="heroicons:clock" className="w-6 h-6 text-blue-600" />
            Regularization Workflow
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage attendance regularization requests, approvals, and settings
          </p>
        </div>
      </div>

      <div className="border border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm rounded-2xl p-1.5 sm:p-2 overflow-x-auto">
        <div className="flex flex-wrap gap-1 min-w-[420px]">
          {[
            { id: "requests", name: "Requests", icon: "heroicons:document-text" },
            { id: "settings", name: "Settings", icon: "heroicons:cog-6-tooth" },
            { id: "bulk", name: "Bulk Processing", icon: "heroicons:arrow-up-tray" },
            { id: "reports", name: "Reports", icon: "heroicons:chart-bar" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon icon={tab.icon} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {activeTab === "requests" && renderRequests()}
        {activeTab === "settings" && renderSettings()}
        {activeTab === "bulk" && renderBulkProcessing()}
        {activeTab === "reports" && renderReports()}
      </div>

      {showRequestModal && (
        <RegularizationRequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          requestForm={requestForm}
          setRequestForm={setRequestForm}
          requestType={requestType}
          setRequestType={setRequestType}
          handleSubmitRequest={handleSubmitRequest}
          employees={initialEmployees}
          isSubmitting={isSubmittingRequest}
        />
      )}

      {showApprovalModal && selectedRequest && (
        <RegularizationApprovalModal
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedRequest(null);
            setApprovalForm({ action: "", remarks: "" });
          }}
          selectedRequest={selectedRequest}
          approvalForm={approvalForm}
          setApprovalForm={setApprovalForm}
          handleApproveRequest={handleApproveRequest}
        />
      )}

      {showBulkModal && (
        <RegularizationBulkModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          bulkForm={bulkForm}
          setBulkForm={setBulkForm}
          handleBulkProcess={handleBulkProcess}
          isSubmitting={isBulkSubmitting}
        />
      )}

      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        className="text-xs"
      />
    </div>
  );
};

export default Regularization;
