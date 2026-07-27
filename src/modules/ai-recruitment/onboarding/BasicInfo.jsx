import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BASE_URL, API_ENDPOINTS } from "../../../shared/constants/api.config";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function BasicInfo() {
  // Route param wins; falls back to a locally-remembered employee (e.g. set
  // by the employee list page before navigating here), then to 1 so the
  // page still renders something in isolation/dev.
  const { employeeId: routeEmployeeId } = useParams();
  const employeeId =
    routeEmployeeId || localStorage.getItem("selectedEmployeeId") || "1";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState(null);

  // Only the fields the backend's EmployeeMasterUpdate schema actually
  // supports get sent on Save. Everything else on this page is real
  // fetched data, shown read-only, until the backend adds an endpoint
  // that can update names/DOB/contact info.
  const [editable, setEditable] = useState({
    notice_period_days: "",
    work_location: "",
    employment_status: "",
    employment_type: "",
  });

  const fetchEmployee = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BASE_URL}${API_ENDPOINTS.EMPLOYEE_MASTER.GET(employeeId)}`,
        { headers: { ...authHeaders() } }
      );
      if (!res.ok) throw new Error(`Failed to load employee (${res.status})`);
      const data = await res.json();
      setEmployee(data);
      setEditable({
        notice_period_days: data.notice_period_days ?? "",
        work_location: data.work_location ?? "",
        employment_status: data.employment_status ?? "",
        employment_type: data.employment_type ?? "",
      });
    } catch (err) {
      setError(err.message || "Failed to load employee");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const handleEditableChange = (field, value) => {
    setEditable((prev) => ({ ...prev, [field]: value }));
  };

  const handleDownload = () => {
    toast.info("Download statement isn't wired to a backend export endpoint yet.");
  };

  const handleDeactivate = async () => {
    if (!window.confirm("Are you sure you want to deactivate this employee?")) return;
    try {
      const res = await fetch(
        `${BASE_URL}${API_ENDPOINTS.EMPLOYEE_MASTER.UPDATE(employeeId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ employment_status: "Inactive" }),
        }
      );
      if (!res.ok) throw new Error("Failed to deactivate employee");
      toast.success("Employee has been deactivated");
      fetchEmployee();
    } catch (err) {
      toast.error(err.message || "Failed to deactivate employee");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        notice_period_days: editable.notice_period_days === "" ? null : Number(editable.notice_period_days),
        work_location: editable.work_location || null,
        employment_status: editable.employment_status || null,
        employment_type: editable.employment_type || null,
      };
      const res = await fetch(
        `${BASE_URL}${API_ENDPOINTS.EMPLOYEE_MASTER.UPDATE(employeeId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Failed to save changes");
      toast.success("Changes saved successfully");
      fetchEmployee();
    } catch (err) {
      toast.error(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const fullName = employee
    ? [employee.first_name, employee.last_name].filter(Boolean).join(" ")
    : "";
  const initials = fullName
    ? fullName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : "--";

  if (loading) {
    return (
      <div className="bg-light d-flex align-items-center justify-content-center" style={{ minHeight: "50vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-light p-4">
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={fetchEmployee}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="container-fluid">
        <div className="row min-vh-100">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div>
              <i className="bi bi-chevron-double-left fs-4 text-secondary me-2"></i>
              <i className="bi bi-chevron-double-right fs-4 text-primary"></i>
            </div>
            <div>
              <p className="mb-1 text-muted fw-semibold">
                &gt; All Employees / Basic Info
              </p>
              <h4 className="fw-bold mb-1">{fullName || "Unknown Employee"}</h4>
              <p className="text-muted mb-0">
                Find the most relevant information about your business here.
              </p>
            </div>
          </div>

          <main className="col-md-12 p-0 ">
            <section className="p-4">
              <div className="bg-white rounded shadow-sm p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h5 className="fw-bold mb-0">Basic Info</h5>
                    <p className="mb-0 text-muted">
                      Manage Core HR Related Employee Information
                    </p>
                  </div>
                  <div>
                    <button onClick={handleDownload} className="btn btn-outline-secondary btn-sm me-2">
                      <i className="bi bi-download me-1"></i> Download
                      Statement
                    </button>
                    <button onClick={handleDeactivate} className="btn btn-outline-danger btn-sm me-2">
                      <i className="bi bi-trash me-1"></i> Deactivate
                    </button>
                  </div>
                </div>

                <div className="row align-items-start">
                  <div className="col-md-2 text-center">
                    <div
                      className="rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center mx-auto"
                      style={{ width: "80px", height: "80px" }}
                    >
                      {initials}
                    </div>
                    <small className="d-block mt-2 text-muted">
                      Resolution: 400 × 400 px
                      <br />
                      Max Size: 1MB
                    </small>
                  </div>

                  <div className="col-md-10">
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">First Name</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={employee?.first_name || ""}
                          readOnly
                        />
                        <small className="text-danger">
                          Name as per Aadhaar
                          <br />
                          <strong>Not Verified</strong>
                        </small>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Middle Name</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={employee?.middle_name || ""}
                          readOnly
                        />
                        <small className="text-danger">
                          Name as per Bank
                          <br />
                          <strong>Not Verified</strong>
                        </small>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={employee?.last_name || ""}
                          readOnly
                        />
                        <small className="text-danger">
                          Name as per PAN
                          <br />
                          <strong>Not Verified</strong>
                        </small>
                      </div>
                    </div>
                    <small className="text-muted d-block">
                      Name fields are read-only here — the backend's employee-master
                      endpoint doesn't yet support editing identity fields. Edit them
                      from the onboarding form instead.
                    </small>
                  </div>
                </div>
              </div>
            </section>

            <div className="col-md-10">
              <form className="p-4" onSubmit={handleSave}>
                <h6 className="fw-bold mb-3">Official Record</h6>

                {[
                  ["Date of Joining", employee?.joining_date || "—"],
                  ["Date of Confirmation", employee?.confirmation_date || "—"],
                  ["Mobile Number", employee?.mobile_number || "—"],
                  ["Official EmailId", employee?.official_email || "—"],
                  ["Employee code", employee?.employee_code || "—"],
                ].map(([label, value], idx) => (
                  <div className="row mb-3 align-items-center" key={idx}>
                    <div className="col-md-3">
                      <label className="form-label mb-1">{label}</label>
                    </div>
                    <div className="col-md-9">
                      <input type="text" className="form-control" value={value} readOnly />
                    </div>
                  </div>
                ))}

                <div className="row mb-3 align-items-center">
                  <div className="col-md-3">
                    <label className="form-label mb-1">Notice Period (days)</label>
                  </div>
                  <div className="col-md-9">
                    <input
                      type="number"
                      className="form-control"
                      value={editable.notice_period_days}
                      onChange={(e) => handleEditableChange("notice_period_days", e.target.value)}
                    />
                  </div>
                </div>

                <div className="row mb-3 align-items-center">
                  <div className="col-md-3">
                    <label className="form-label mb-1">Work Location</label>
                  </div>
                  <div className="col-md-9">
                    <input
                      type="text"
                      className="form-control"
                      value={editable.work_location}
                      onChange={(e) => handleEditableChange("work_location", e.target.value)}
                    />
                  </div>
                </div>

                <div className="row mb-3 align-items-center">
                  <div className="col-md-3">
                    <label className="form-label mb-1">Employment Status</label>
                  </div>
                  <div className="col-md-9">
                    <select
                      className="form-select"
                      value={editable.employment_status}
                      onChange={(e) => handleEditableChange("employment_status", e.target.value)}
                    >
                      <option value="">Select status</option>
                      {["Active", "Inactive", "On Leave", "Resigned", "Terminated"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row mb-3 align-items-center">
                  <div className="col-md-3">
                    <label className="form-label mb-1">Employment Type</label>
                  </div>
                  <div className="col-md-9">
                    <select
                      className="form-select"
                      value={editable.employment_type}
                      onChange={(e) => handleEditableChange("employment_type", e.target.value)}
                    >
                      <option value="">Select type</option>
                      {["Full-Time", "Part-Time", "Contract", "Intern"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button className="btn btn-primary btn-sm" type="submit" disabled={saving}>
                  <i className="bi bi-save me-1"></i> {saving ? "Saving..." : "Save"}
                </button>
              </form>
            </div>

            <div className="col-md-10">
              <div className="p-4">
                <h6 className="fw-bold mb-3">Personal Record</h6>
                <div className="row mb-3 align-items-center">
                  <div className="col-md-3">
                    <label className="form-label mb-1">Date of Birth</label>
                  </div>
                  <div className="col-md-9">
                    <input type="text" className="form-control" value={employee?.date_of_birth || "—"} readOnly />
                  </div>
                </div>

                <div className="row mb-3 align-items-center">
                  <div className="col-md-3">
                    <label className="form-label mb-1">Gender</label>
                  </div>
                  <div className="col-md-9">
                    <input type="text" className="form-control" value={employee?.gender || "—"} readOnly />
                  </div>
                </div>
                <small className="text-muted">
                  Personal-record fields are display-only until the backend adds
                  update support for them on the employee-master endpoint.
                </small>
              </div>
            </div>
          </main>
        </div>
      </div>

      <div className="container">
        <div className="d-flex flex-column flex-md-row justify-content-center align-items-center gap-2">
          <a href="#" className="text-decoration-none text-muted">About Us</a>
          <span className="text-muted">|</span>
          <a href="#" className="text-decoration-none text-muted">Contact Us</a>
          <span className="text-muted">|</span>
          <a href="#" className="text-decoration-none text-muted">Privacy Policy</a>
          <span className="text-muted">|</span>
          <a href="#" className="text-decoration-none text-muted">Terms of Service</a>
          <span className="text-muted">|</span>
          <a href="#" className="text-decoration-none text-muted">Refunds & Cancellations</a>
        </div>

        <div className="mt-2">
          <small>
            Licensed to <strong>Levitica Technologies Private Limited</strong>{" "}
            | License valid till: <strong>2025-09-23</strong>
          </small>
          <br />
          <small>© 2025 Runtime Software Private Limited</small>
        </div>
      </div>
    </div>
  );
}