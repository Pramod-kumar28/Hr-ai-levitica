import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { Icon } from "@iconify/react";
import Modal from "../../../shared/components/Modal";
import { apiCall } from "../../../shared/utils/api";
import { API_ENDPOINTS } from "../../../shared/constants/api.config";


export default function OnboardingFormsTable() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showHelp, setShowHelp] = useState(false);
  const [forms, setForms] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const [showFormModal, setShowFormModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    candidateName: "",
    email: "",
    mobile: "",
    mobileVerification: true,
    panVerification: false,
    bankVerification: false,
    aadhaarVerification: false,
    selectedCredits: 0,
    availableCredits: 0,
    totalCredits: 0,
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formIdToEdit, setFormIdToEdit] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formToDelete, setFormToDelete] = useState(null);
  const [deleteCandidateName, setDeleteCandidateName] = useState("");

  // NOTE: this file previously declared an entire second copy of the
  // 9-step onboarding wizard's local state (basicData, contactData,
  // personalData, statutoryData, familyData, addresses, bankData,
  // documents, currentStep, showNewhireForm, etc.) — roughly 90 lines.
  // None of it was ever referenced anywhere in this file's render or
  // handlers; "View Form" below navigates to the real wizard at
  // /newhire instead. Removed as dead/duplicate code rather than wiring
  // a third copy of the same flow.

  const { formId } = useParams();
  const candidate = location.state?.candidate;

  // Backend status values (SENT/SUBMITTED/APPROVED/REJECTED) don't match
  // this UI's display labels (Pending/Sent/Approved/Rejected) 1:1 — there's
  // no "PENDING" state on the backend at all. SUBMITTED (candidate finished
  // the wizard, awaiting HR review) maps to what this UI calls "Pending".
  const backendToUiStatus = (status) => {
    switch (status) {
      case "SENT": return "Sent";
      case "SUBMITTED": return "Pending";
      case "APPROVED": return "Approved";
      case "CONVERTED": return "Converted";
      case "REJECTED": return "Rejected";
      default: return status;
    }
  };
  const uiToBackendStatus = (status) => {
    switch (status) {
      case "Sent": return "SENT";
      case "Pending": return "SUBMITTED";
      case "Approved": return "APPROVED";
      case "Rejected": return "REJECTED";
      default: return null;
    }
  };

  const mapCandidateToRow = (c) => ({
    id: c.id,
    candidate: c.full_name,
    created: new Date(c.created_at).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    }),
    email: c.email,
    mobile: c.mobile,
    info: "View Form",
    status: backendToUiStatus(c.status),
    mobileVerification: (c.verification_options || []).includes("mobile"),
    panVerification: (c.verification_options || []).includes("pan"),
    bankVerification: (c.verification_options || []).includes("bank"),
    aadhaarVerification: (c.verification_options || []).includes("aadhaar"),
    selectedCredits: c.credits_used,
    availableCredits: 0,
    totalCredits: c.credits_used,
  });

  const [loadingForms, setLoadingForms] = useState(false);
  const [loadFormsError, setLoadFormsError] = useState(null);

  const loadCandidates = async () => {
    setLoadingForms(true);
    setLoadFormsError(null);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "All") {
        const backendStatus = uiToBackendStatus(filterStatus);
        if (backendStatus) params.set("status", backendStatus);
      }
      if (searchQuery) params.set("search", searchQuery);
      params.set("page", "1");
      params.set("per_page", "100");

      const data = await apiCall(`${API_ENDPOINTS.ONBOARDING_CANDIDATE_INVITES.LIST}?${params.toString()}`);
      setForms((data.results || []).map(mapCandidateToRow));
    } catch (err) {
      setLoadFormsError(err.message);
      setForms([]);
    } finally {
      setLoadingForms(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  useEffect(() => {
    loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, searchQuery]);

  // NewOnboardingForm.jsx already persists new/edited candidates to the
  // real backend before navigating here; on arrival, just refetch the
  // authoritative list instead of trusting/merging the router-state blob
  // (which previously lived only in localStorage and would go stale).
  useEffect(() => {
    if (location.state?.newForm || location.state?.updatedForm) {
      loadCandidates();
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.newForm?.id, location.state?.updatedForm]);

  const filteredForms = forms.filter((f) => {
    const matchesStatus = filterStatus === "All" || f.status === filterStatus;
    const matchesSearch =
      f.candidate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.mobile.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const updatedFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };

    if (type === "checkbox") {
      let selectedCredits = 0;

      if (updatedFormData.panVerification) selectedCredits += 5;
      if (updatedFormData.bankVerification) selectedCredits += 5;
      if (updatedFormData.aadhaarVerification) selectedCredits += 10;

      const totalCredits = selectedCredits - updatedFormData.availableCredits;

      updatedFormData.selectedCredits = selectedCredits;
      updatedFormData.totalCredits = totalCredits > 0 ? totalCredits : 0;
    }

    setFormData(updatedFormData);
  };


  const handleContinue = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  const handleCancelForm = () => {
    setShowFormModal(false);
    resetForm();
  };

  const [savingForm, setSavingForm] = useState(false);

  const buildVerificationOptions = () => {
    const options = [];
    if (formData.mobileVerification) options.push("mobile");
    if (formData.panVerification) options.push("pan");
    if (formData.bankVerification) options.push("bank");
    if (formData.aadhaarVerification) options.push("aadhaar");
    return options;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSavingForm(true);

    const payload = {
      full_name: formData.candidateName,
      email: formData.email,
      mobile: formData.mobile,
      verification_options: buildVerificationOptions(),
    };

    try {
      if (editMode && formIdToEdit) {
        await apiCall(API_ENDPOINTS.ONBOARDING_CANDIDATE_INVITES.UPDATE(formIdToEdit), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await apiCall(API_ENDPOINTS.ONBOARDING_CANDIDATE_INVITES.CREATE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      await loadCandidates();
      resetForm();
      setShowFormModal(false);
      setShowConfirmModal(false);
    } catch (err) {
      alert(`Failed to save onboarding form: ${err.message}`);
    } finally {
      setSavingForm(false);
    }
  };


  const resetForm = () => {
    setFormData({
      candidateName: "",
      email: "",
      mobile: "",
      mobileVerification: true,
      panVerification: false,
      bankVerification: false,
      aadhaarVerification: false,
      selectedCredits: 0,
      availableCredits: 0,
      totalCredits: 0,
    });
    setEditMode(false);
    setFormIdToEdit(null);
  };

  const handleEdit = (formId) => {
    const form = forms.find((f) => f.id === formId);
    if (form) {
      const mobileVerification = form.mobileVerification !== undefined ? form.mobileVerification : true;
      const panVerification = form.panVerification !== undefined ? form.panVerification : false;
      const bankVerification = form.bankVerification !== undefined ? form.bankVerification : false;
      const aadhaarVerification = form.aadhaarVerification !== undefined ? form.aadhaarVerification : false;

      let selectedCredits = 0;
      if (panVerification) selectedCredits += 5;
      if (bankVerification) selectedCredits += 5;
      if (aadhaarVerification) selectedCredits += 10;

      const availableCredits = form.availableCredits || 0;
      const totalCredits = Math.max(0, selectedCredits - availableCredits);

      setFormData({
        candidateName: form.candidate,
        email: form.email,
        mobile: form.mobile,
        mobileVerification: mobileVerification,
        panVerification: panVerification,
        bankVerification: bankVerification,
        aadhaarVerification: aadhaarVerification,
        selectedCredits: selectedCredits,
        availableCredits: availableCredits,
        totalCredits: totalCredits,
      });
      setEditMode(true);
      setFormIdToEdit(formId);
      setShowFormModal(true);
    }
  };

  const handleViewForm = (formId) => {
    const form = forms.find((f) => f.id === formId);
    navigate("/newhire", {
      state: {
        formId,
        candidateName: form?.candidate || "",
      },
    });
  };

  const handleReject = async (formId) => {
    const form = forms.find((f) => f.id === formId);
    if (!form) return;

    // NOTE: the backend only allows reject from SUBMITTED, not from SENT
    // (routers/onboarding/admin_candidates.py). A "Sent" invite the
    // candidate hasn't filled in yet can't be rejected on the server;
    // surfacing the real error rather than pretending it succeeded.
    try {
      await apiCall(API_ENDPOINTS.ONBOARDING_CANDIDATE_INVITES.REJECT(formId), {
        method: "PUT",
      });
      await loadCandidates();
      alert(`Form for ${form.candidate} has been rejected.`);
    } catch (err) {
      alert(`Could not reject this form: ${err.message}`);
    }
  };

  const handleApprove = async (formId) => {
    const form = forms.find((f) => f.id === formId);
    if (!form) return;

    try {
      await apiCall(API_ENDPOINTS.ONBOARDING_CANDIDATE_INVITES.APPROVE(formId), {
        method: "PUT",
      });
      await loadCandidates();
      alert(`Form for ${form.candidate} has been approved successfully!`);
    } catch (err) {
      alert(`Could not approve this form: ${err.message}`);
    }
  };

  const handleConvertToEmployee = async (formId) => {
    const form = forms.find((f) => f.id === formId);
    if (!form) return;

    if (!window.confirm(
      `Convert ${form.candidate} to an employee? This creates their Employee ID and login account, and emails them their credentials.`
    )) return;

    try {
      const result = await apiCall(API_ENDPOINTS.ONBOARDING_CANDIDATE_INVITES.CONVERT_TO_EMPLOYEE(formId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await loadCandidates();
      alert(
        result.email_sent
          ? `${form.candidate} is now Employee ${result.employee_code}. Login credentials were emailed to ${result.login_email}.`
          : `${form.candidate} is now Employee ${result.employee_code}. Email delivery failed — share these credentials manually:\n\nLogin: ${result.login_email}\nTemporary password: ${result.temporary_password}`
      );
    } catch (err) {
      alert(`Could not convert this candidate to an employee: ${err.message}`);
    }
  };

  const handleDelete = (formId) => {
    const form = forms.find((f) => f.id === formId);
    if (!form) return;

    setFormToDelete(formId);
    setDeleteCandidateName(form.candidate);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!formToDelete) return;

    try {
      await apiCall(API_ENDPOINTS.ONBOARDING_CANDIDATE_INVITES.DELETE(formToDelete), {
        method: "DELETE",
      });
      await loadCandidates();
    } catch (err) {
      alert(`Failed to delete this form: ${err.message}`);
    } finally {
      setShowDeleteModal(false);
      setFormToDelete(null);
      setDeleteCandidateName("");
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setFormToDelete(null);
    setDeleteCandidateName("");
  };

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pageNumbers.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pageNumbers.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }

    return pageNumbers;
  };

  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return (
        <Icon
          icon="heroicons:arrows-up-down"
          style={{ fontSize: 12, marginLeft: 4, opacity: 0.3 }}
        />
      );
    }

    return sortConfig.direction === "ascending" ? (
      <Icon
        icon="heroicons:chevron-up"
        style={{ fontSize: 12, marginLeft: 4, color: "#3B82F6" }}
      />
    ) : (
      <Icon
        icon="heroicons:chevron-down"
        style={{ fontSize: 12, marginLeft: 4, color: "#3B82F6" }}
      />
    );
  };

  const sortedForms = useMemo(() => {
    let sortableForms = [...filteredForms];

    if (sortConfig.key) {
      sortableForms.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === "created") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableForms;
  }, [filteredForms, sortConfig]);

  const totalPages = Math.ceil(sortedForms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, sortedForms.length);
  const paginatedForms = sortedForms.slice(startIndex, endIndex);

  return (
    <div className="w-full min-h-screen">
      <div className="flex flex-col mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div className="mb-4">
            <h5 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 mt-3 flex items-center gap-2">
              <Icon icon="heroicons:chat-bubble-left-right" />
              Forms
            </h5>
            <p className="text-gray-500 text-sm">
              Create onboarding forms for new hires. Approve or reject submitted forms.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              className="inline-flex items-center gap-2 px-3 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => { resetForm(); setShowFormModal(true); }}
            >
              <Icon icon="heroicons:plus" className="w-4 h-4" />
              Add New
            </button>
            <button
              className="inline-flex items-center gap-2 px-3 py-2.5 border border-blue-600 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors"
              onClick={() => setShowHelp((prev) => !prev)}
            >
              Help
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 mb-6 p-3">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Form Status</label>
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option>All</option>
                <option>Sent</option>
                <option>Approved</option>
                <option>Rejected</option>
                <option>Pending</option>
              </select>
            </div>
            <div className="flex-1 min-w-[280px]">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Search</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Candidate name, mobile or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              onClick={() => { }}
            >
              <Icon icon="heroicons:arrow-path" className="w-4 h-4" />
              Load
            </button>
          </div>
        </div>

        <div className="w-full rounded-xl border border-gray-200 overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 font-semibold">
                <tr>
                  <th className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wide border-b-2 border-gray-200 cursor-pointer select-none" onClick={() => handleSort("id")}>
                    <span className="flex items-center">ID <SortIndicator columnKey="id" /></span>
                  </th>
                  <th className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wide border-b-2 border-gray-200 cursor-pointer select-none" onClick={() => handleSort("candidate")}>
                    <span className="flex items-center">CANDIDATE <SortIndicator columnKey="candidate" /></span>
                  </th>
                  <th className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wide border-b-2 border-gray-200">CONTACT DETAILS</th>
                  <th className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wide border-b-2 border-gray-200">INFO</th>
                  <th className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wide border-b-2 border-gray-200 cursor-pointer select-none" onClick={() => handleSort("status")}>
                    <span className="flex items-center">STATUS <SortIndicator columnKey="status" /></span>
                  </th>
                  <th className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wide border-b-2 border-gray-200 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedForms.length > 0 ? (
                  paginatedForms.map((row, idx) => (
                    <tr key={row.id} className={idx % 2 === 1 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-3 py-2 text-sm text-gray-400 font-medium align-middle">{row.id}</td>
                      <td className="px-3 py-2 align-middle">
                        <div className="font-semibold text-gray-900 mb-0.5">{row.candidate}</div>
                        <div className="text-xs text-gray-500">Created: {row.created}</div>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <div className="text-sm text-gray-800 mb-0.5">{row.email}</div>
                        <div className="text-xs text-gray-500">{row.mobile}</div>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <span onClick={() => handleViewForm(row.id)} className="inline-flex items-center text-blue-600 font-medium text-sm cursor-pointer hover:underline">
                          {row.info}
                          <Icon icon="heroicons:arrow-top-right-on-square" className="ml-1 w-3.5 h-3.5" />
                        </span>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-medium text-white ${row.status === "Approved" ? "bg-emerald-500"
                          : row.status === "Converted" ? "bg-purple-500"
                          : row.status === "Rejected" ? "bg-red-500"
                            : row.status === "Pending" ? "bg-amber-500"
                              : "bg-blue-500"}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-middle text-center min-w-[140px]">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(row.id)} title="Edit" className="p-1.5 rounded border border-blue-400 text-blue-600 hover:bg-blue-50 transition-colors">
                            <Icon icon="heroicons:pencil" className="w-4 h-4" />
                          </button>
                          {row.status === "Approved" ? (
                            <button onClick={() => handleConvertToEmployee(row.id)} title="Convert to Employee" className="p-1.5 rounded border border-purple-400 text-purple-600 hover:bg-purple-50 transition-colors">
                              <Icon icon="heroicons:user-plus" className="w-4 h-4" />
                            </button>
                          ) : row.status === "Rejected" ? (
                            <button onClick={() => handleReject(row.id)} title="Reject" className="p-1.5 rounded border border-amber-400 text-amber-600 hover:bg-amber-50 transition-colors">
                              <Icon icon="heroicons:x-mark" className="w-4 h-4" />
                            </button>
                          ) : (
                            <button onClick={() => handleApprove(row.id)} title="Approve" className="p-1.5 rounded border border-emerald-400 text-emerald-600 hover:bg-emerald-50 transition-colors">
                              <Icon icon="heroicons:check" className="w-4 h-4" />
                            </button>
                          )}
                          {(row.status === "Pending" || row.status === "Sent") && (
                            <button onClick={() => handleReject(row.id)} title="Reject" className="p-1.5 rounded border border-amber-400 text-amber-600 hover:bg-amber-50 transition-colors">
                              <Icon icon="heroicons:x-mark" className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleDelete(row.id)} title="Delete" className="p-1.5 rounded border border-red-400 text-red-600 hover:bg-red-50 transition-colors">
                            <Icon icon="heroicons:trash" className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-16 px-5">
                      <div className="flex justify-center mb-3 text-gray-400">
                        <Icon icon="heroicons:document-magnifying-glass" className="w-12 h-12" />
                      </div>
                      <div className="text-gray-500 font-medium mb-1">No forms found</div>
                      <div className="text-gray-400 text-sm">
                        {searchQuery || filterStatus !== "All"
                          ? "Try adjusting your search or filters"
                          : "Create your first onboarding form to get started"}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {sortedForms.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="text-gray-500 font-medium">
                Showing <span className="text-emerald-600 font-semibold">{Math.min((currentPage - 1) * itemsPerPage + 1, sortedForms.length)}</span>{" "}
                to <span className="text-emerald-600 font-semibold">{Math.min(currentPage * itemsPerPage, sortedForms.length)}</span>{" "}
                of <span className="text-emerald-600 font-semibold">{sortedForms.length}</span> results
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs">Show:</span>
                <select className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white" value={itemsPerPage} onChange={(e) => handleItemsPerPageChange(e.target.value)}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-gray-500 text-xs">per page</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="text-gray-500 text-xs">
                Page <span className="text-blue-600 font-semibold">{currentPage}</span> of <span className="text-blue-600 font-semibold">{totalPages}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} title="Previous Page"
                  className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-md bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors">
                  <Icon icon="heroicons:chevron-left" className="w-3.5 h-3.5" />
                </button>
                {getPageNumbers().map((pageNum, index) => (
                  <React.Fragment key={index}>
                    {pageNum === "..." ? (
                      <span className="w-9 h-9 flex items-center justify-center text-gray-500">...</span>
                    ) : (
                      <button onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 flex items-center justify-center rounded-md border text-sm font-medium transition-colors ${currentPage === pageNum ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}>
                        {pageNum}
                      </button>
                    )}
                  </React.Fragment>
                ))}
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} title="Next Page"
                  className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-md bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors">
                  <Icon icon="heroicons:chevron-right" className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs">Go to:</span>
                <input type="number" className="w-16 border border-gray-300 rounded-md px-2 py-1 text-xs text-center" min={1} max={totalPages} value={currentPage}
                  onChange={(e) => { const page = parseInt(e.target.value); if (!isNaN(page) && page >= 1 && page <= totalPages) handlePageChange(page); }}
                  onKeyPress={(e) => { if (e.key === "Enter") { const page = parseInt(e.target.value); if (!isNaN(page) && page >= 1 && page <= totalPages) handlePageChange(page); } }} />
              </div>
            </div>
          </div>
        )}
      </div>
      <Modal
        isOpen={showFormModal}
        onClose={handleCancelForm}
        title={editMode ? "Edit Form" : "New Form"}
        size="lg"
      >
        <p className="text-gray-500 text-sm mb-4">
          {editMode ? "Update the onboarding form details for the candidate." : "Generate and send self-onboarding form to a candidate."}
        </p>
        <form onSubmit={handleContinue}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h6 className="font-bold text-gray-900 mb-4">Part A - Candidate Details</h6>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Candidate Name <span className="text-red-500">*</span></label>
                <input type="text" className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" name="candidateName" value={formData.candidateName} onChange={handleChange} placeholder="Enter candidate name" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-Mail Address</label>
                <input type="email" className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                <input type="tel" className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Enter mobile number" maxLength="10" />
              </div>
            </div>

            <div>
              <h6 className="font-bold text-gray-900 mb-4">Select Verification Options</h6>
              <div className="space-y-3 mb-4">
                {[
                  { name: "mobileVerification", label: "Mobile Verification", cost: "FREE", costClass: "text-emerald-600" },
                  { name: "panVerification", label: "PAN Verification", cost: "5 Credits", costClass: "text-amber-600" },
                  { name: "bankVerification", label: "Bank Verification", cost: "5 Credits", costClass: "text-amber-600" },
                  { name: "aadhaarVerification", label: "Aadhaar Verification", cost: "10 Credits", costClass: "text-amber-600" },
                ].map(({ name, label, cost, costClass }) => (
                  <label key={name} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <input type="checkbox" name={name} id={name} checked={formData[name]} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700"><span className="font-semibold">{label}</span> - <span className={costClass}>{cost}</span></span>
                  </label>
                ))}
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Credit Balance:</span>
                  <span className={`font-bold ${formData.totalCredits > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {formData.totalCredits > 0 ? `-₹${formData.totalCredits}` : "₹0"}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between"><span>Selected Credits:</span><span className="font-semibold">₹{formData.selectedCredits}</span></div>
                  <div className="flex justify-between"><span>Available Credits:</span><span className="font-semibold">₹{formData.availableCredits}</span></div>
                </div>
                <a href="#" className="text-blue-600 text-xs mt-2 inline-block hover:underline">Buy Credits</a>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={handleCancelForm} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">Continue</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showConfirmModal} onClose={handleCancel} title="Confirmation" size="sm">
        <div className="flex items-center gap-3 mb-3">
          <Icon icon="heroicons:exclamation-triangle" className="w-8 h-8 text-amber-500 shrink-0" />
          <p className="text-gray-700 font-medium">Are You Sure?</p>
        </div>
        <p className="text-gray-500 text-sm mb-5">
          {editMode
            ? "Do you want to save the changes to this form?"
            : "Do you want to submit this form and add it to the forms table?"}
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={handleCancel} className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="button" onClick={handleSubmit} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">{editMode ? "Update" : "Submit"}</button>
        </div>
      </Modal>

      <Modal isOpen={showHelp} onClose={() => setShowHelp(false)} title="Onboarding Forms Guide" size="xl">
        <div className="text-sm text-gray-500 mb-4">Everything you need to know about managing onboarding forms</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-gray-100 border-b border-gray-200 px-3 py-2">
              <h6 className="font-bold text-gray-800 text-sm">Basic Operations</h6>
            </div>
            <div className="p-5">
              <ul className="space-y-3">
                {[
                  { icon: "heroicons:magnifying-glass", bg: "bg-blue-100", color: "text-blue-700", label: "Search", desc: "Find candidates by name, email, or mobile number" },
                  { icon: "heroicons:funnel", bg: "bg-emerald-100", color: "text-emerald-700", label: "Filter", desc: "Sort forms by status: Sent, Pending, Approved, Rejected" },
                  { icon: "heroicons:document-text", bg: "bg-amber-100", color: "text-amber-700", label: "View Form", desc: "Click to see complete onboarding details" },
                  { icon: "heroicons:trash", bg: "bg-red-100", color: "text-red-700", label: "Delete", desc: "Permanently remove onboarding forms from the system" },
                ].map(({ icon, bg, color, label, desc }) => (
                  <li key={label} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-md ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon icon={icon} className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="text-sm text-gray-700"><strong className={color}>{label}</strong> - {desc}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-gray-100 border-b border-gray-200 px-3 py-2">
              <h6 className="font-bold text-gray-800 text-sm">Action Buttons</h6>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex flex-col items-center p-4 border border-gray-200 rounded-xl bg-blue-50">
                <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center mb-3">
                  <Icon icon="heroicons:pencil" className="w-5 h-5 text-white" />
                </div>
                <h6 className="font-bold text-gray-900 mb-1">Edit</h6>
                <p className="text-gray-500 text-xs text-center">Update form details and information</p>
              </div>
              <div className="flex flex-col items-center p-4 border border-gray-200 rounded-xl bg-amber-50">
                <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center mb-3">
                  <Icon icon="heroicons:bolt" className="w-5 h-5 text-white" />
                </div>
                <h6 className="font-bold text-gray-900 mb-1">Approve</h6>
                <p className="text-gray-500 text-xs text-center">Approve submitted onboarding forms</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 mb-6">
          <h6 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
            <Icon icon="heroicons:flag" className="w-4 h-4 text-gray-500" /> Status Guide
          </h6>
          <div className="flex flex-wrap gap-2">
            <span className="inline-block px-3 py-1.5 rounded-full text-xs font-medium text-white bg-emerald-500">Approved</span>
            <span className="inline-block px-3 py-1.5 rounded-full text-xs font-medium text-white bg-amber-500">Pending</span>
            <span className="inline-block px-3 py-1.5 rounded-full text-xs font-medium text-white bg-red-500">Rejected</span>
            <span className="inline-block px-3 py-1.5 rounded-full text-xs font-medium text-white bg-blue-500">Sent</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Icon icon="heroicons:light-bulb" className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h6 className="font-bold text-gray-900 mb-2">Pro Tips</h6>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {["Forms auto-sync across browser tabs", "Use Load button to refresh data", "Export option available in settings", "Bulk actions coming soon"].map(tip => (
                <div key={tip} className="flex items-center gap-2 text-sm text-gray-600">
                  <Icon icon="heroicons:check-circle" className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
          <button onClick={() => setShowHelp(false)} className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors">
            <Icon icon="heroicons:check" className="w-4 h-4" />
            Got it, thanks!
          </button>
        </div>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={cancelDelete} title="Delete Form" size="sm">
        <div className="text-center mb-5">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Icon icon="heroicons:user-circle" className="w-5 h-5 text-gray-500" />
              <span className="text-gray-500 font-medium">Candidate</span>
            </div>
            <h4 className="font-bold text-red-600 text-lg">{deleteCandidateName}</h4>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed">Are you sure you want to permanently delete this onboarding form?</p>
        </div>
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-md bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
              <Icon icon="heroicons:exclamation-triangle" className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h6 className="font-bold text-amber-800 text-sm mb-1">Irreversible Action</h6>
              <p className="text-amber-700 text-xs leading-relaxed">This action cannot be undone. All associated data will be permanently removed from the system.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={cancelDelete} className="flex-1 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={confirmDelete} className="flex-1 py-3 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
            <Icon icon="heroicons:trash" className="w-4 h-4" />
            Delete
          </button>
        </div>
        <div className="text-center mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-center gap-2">
          <Icon icon="heroicons:information-circle" className="w-4 h-4 text-gray-400" />
          <span>You can restore from backup if needed</span>
        </div>
      </Modal>
    </div>
  );
}