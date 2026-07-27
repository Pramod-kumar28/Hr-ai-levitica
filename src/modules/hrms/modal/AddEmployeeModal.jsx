import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import Modal from '../../../shared/components/Modal';
import { BASE_URL } from '../../../shared/constants/api.config';

const authHeader = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const AddEmployeeModal = ({
  showAddModal,
  setShowAddModal,
  activeAddTab,
  setActiveAddTab,
  newEmployee,
  setNewEmployee,
  handleAddEmployee,
  employees,
  formatDate,
  formatCurrency
}) => {
  // Branches (company locations/offices) for the Location dropdown — loaded once on mount.
  const [branches, setBranches] = useState([]);
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await fetch(`${BASE_URL}/company-settings/locations/`, {
          headers: authHeader(),
        });
        if (res.ok) {
          const data = await res.json();
          setBranches(data.locations || []);
        }
      } catch (err) {
        console.error('Failed to load branches', err);
      }
    };
    loadBranches();
  }, []);

  return (
    <Modal
      isOpen={showAddModal}
      onClose={() => {
        setShowAddModal(false);
        setActiveAddTab('personal');
      }}
      title={<div className="flex items-center gap-2"><Icon icon="heroicons:user-plus" /> Add New Employee</div>}
      size="2xl"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          {/* Tab Navigation */}
          <ul className="nav nav-tabs border-bottom px-3 pt-3" style={{ flexShrink: 0 }}>
                <li className="nav-item">
                  <button
                    className={`nav-link d-flex align-items-center gap-2 ${activeAddTab === 'personal' ? 'active' : ''}`}
                    onClick={() => setActiveAddTab('personal')}
                  >
                    <Icon icon="heroicons:user-circle" />
                    Personal Info
                  </button>
                </li>

                <li className="nav-item">
                  <button
                    className={`nav-link d-flex align-items-center gap-2 ${activeAddTab === 'employment' ? 'active' : ''}`}
                    onClick={() => setActiveAddTab('employment')}
                  >
                    <Icon icon="heroicons:briefcase" />
                    Employment
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link d-flex align-items-center gap-2 ${activeAddTab === 'jobHistory' ? 'active' : ''}`}
                    onClick={() => setActiveAddTab('jobHistory')}
                  >
                    <Icon icon="heroicons:clock" />
                    Service History
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link d-flex align-items-center gap-2 ${activeAddTab === 'salary' ? 'active' : ''}`}
                    onClick={() => setActiveAddTab('salary')}
                  >
                    <Icon icon="heroicons:currency-dollar" />
                    Salary & Compensation
                  </button>
                </li>

                <li className="nav-item">
                  <button
                    className={`nav-link d-flex align-items-center gap-2 ${activeAddTab === 'statutory' ? 'active' : ''}`}
                    onClick={() => setActiveAddTab('statutory')}
                  >
                    <Icon icon="heroicons:document-check" />
                    Statutory & Compliance
                  </button>
                </li>
              </ul>


              {/* Tab Content */}
              <div className="p-4" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>

                {/* Personal Information Tab */}

                {activeAddTab === 'personal' && (
                  <div className="row g-3">

                    {/* Profile Photo Upload */}
                    <div className="col-12 mb-3">
                      <label className="form-label fw-bold">Profile Photo</label>
                      <div className="d-flex align-items-center gap-3">
                        <div className="position-relative">
                          {newEmployee.personalInfo.profilePhoto ? (
                            <img
                              src={newEmployee.personalInfo.profilePhoto}
                              alt="Profile"
                              className="rounded-circle border"
                              style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="rounded-circle border d-flex align-items-center justify-content-center bg-light" style={{ width: '100px', height: '100px' }}>
                              <Icon icon="heroicons:user" className="fs-1 text-muted" />
                            </div>
                          )}
                        </div>
                        <div>
                          <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setNewEmployee({
                                    ...newEmployee,
                                    personalInfo: {
                                      ...newEmployee.personalInfo,
                                      profilePhoto: reader.result
                                    }
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <small className="text-muted">Upload employee profile photo (JPG, PNG, max 5MB)</small>
                        </div>
                      </div>
                    </div>

                    {/* === Basic Information === */}
                    <div className="col-12">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:identification" />
                        </span>
                        Basic Information
                      </h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        Full Name <span className="text-danger">*</span>
                      </label>

                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.name}
                        onChange={(e) =>
                          setNewEmployee((prev) => ({
                            ...prev,
                            name: e.target.value
                          }))
                        }
                        placeholder="Enter full name"
                        autoComplete="new-name"
                        name="employee_full_name"
                      />

                    </div>


                    <div className="col-md-6">
                      <label className="form-label fw-bold">Date of Birth</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newEmployee.personalInfo.dateOfBirth}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          personalInfo: { ...newEmployee.personalInfo, dateOfBirth: e.target.value }
                        })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">Gender</label>
                      <select
                        className="form-select"
                        value={newEmployee.personalInfo.gender}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          personalInfo: { ...newEmployee.personalInfo, gender: e.target.value }
                        })}
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">Blood Group</label>
                      <select
                        className="form-select"
                        value={newEmployee.personalInfo.bloodGroup}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          personalInfo: { ...newEmployee.personalInfo, bloodGroup: e.target.value }
                        })}
                      >
                        <option value="">Select</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">Marital Status</label>
                      <select
                        className="form-select"
                        value={newEmployee.personalInfo.maritalStatus}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          personalInfo: { ...newEmployee.personalInfo, maritalStatus: e.target.value }
                        })}
                      >
                        <option value="">Select</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Separated">Separated</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Nationality</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.personalInfo.nationality}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          personalInfo: { ...newEmployee.personalInfo, nationality: e.target.value }
                        })}
                        placeholder="Enter nationality"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Languages</label>
                      <div className="d-flex gap-2 mb-2">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter a language"
                          id="languageInput"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                              e.preventDefault();
                              const newLanguage = e.target.value.trim();
                              if (!newEmployee.personalInfo.languages.includes(newLanguage)) {
                                setNewEmployee({
                                  ...newEmployee,
                                  personalInfo: {
                                    ...newEmployee.personalInfo,
                                    languages: [...newEmployee.personalInfo.languages, newLanguage]
                                  }
                                });
                              }
                              e.target.value = '';
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="job-listings-btn"
                          onClick={(e) => {
                            const input = document.getElementById('languageInput');
                            const newLanguage = input.value.trim();
                            if (newLanguage && !newEmployee.personalInfo.languages.includes(newLanguage)) {
                              setNewEmployee({
                                ...newEmployee,
                                personalInfo: {
                                  ...newEmployee.personalInfo,
                                  languages: [...newEmployee.personalInfo.languages, newLanguage]
                                }
                              });
                              input.value = '';
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {newEmployee.personalInfo.languages.map((language, index) => (
                          <div key={index} className="badge bg-primary d-flex align-items-center gap-1">
                            {language}
                            <button
                              type="button"
                              className="btn-close btn-close-white btn-sm"
                              onClick={() => {
                                setNewEmployee({
                                  ...newEmployee,
                                  personalInfo: {
                                    ...newEmployee.personalInfo,
                                    languages: newEmployee.personalInfo.languages.filter((_, i) => i !== index)
                                  }
                                });
                              }}
                            ></button>
                          </div>
                        ))}
                      </div>
                      {newEmployee.personalInfo.languages.length === 0 && (
                        <small className="text-muted">No languages added yet. Type a language and press Enter or click Add.</small>
                      )}
                    </div>

                    {/* === Contact Information === */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:phone" />
                        </span>
                        Contact Information
                      </h6>
                    </div>


                    <div className="col-md-6">
                      <label className="form-label fw-bold"> Email <span className="text-danger">*</span></label>
                      <input
                        type="email"
                        className="form-control"
                        value={newEmployee.employmentInfo.workEmail || newEmployee.email}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          email: e.target.value,
                          employmentInfo: { ...newEmployee.employmentInfo, workEmail: e.target.value }
                        })}
                        placeholder="employee@company.com"
                        required
                      />
                      {
                        newEmployee.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(newEmployee.email) && (
                          <div className="text-danger small mt-1">
                            Please enter a valid email address.
                          </div>
                        )
                      }
                    </div>




                    <div className="col-md-6">
                      <label className="form-label fw-bold">Primary Phone <span className="text-danger">*</span></label>
                      <input
                        type="tel"
                        className="form-control"
                        value={newEmployee.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 10) {
                            setNewEmployee({
                              ...newEmployee,
                              phone: value,
                              personalInfo: { ...newEmployee.personalInfo, phonePrimary: value }
                            });
                          }
                        }}
                        placeholder="Enter 10-digit phone number"
                        maxLength="10"
                        required
                      />
                      {
                        newEmployee.phone && newEmployee.phone.length !== 10 && (
                          <div className="text-danger small mt-1">
                            Primary phone number must be exactly 10 digits.
                          </div>
                        )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Secondary Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={newEmployee.personalInfo.phoneSecondary}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 10) {
                            setNewEmployee({
                              ...newEmployee,
                              personalInfo: { ...newEmployee.personalInfo, phoneSecondary: value }
                            });
                          }
                        }}
                        placeholder="Enter 10-digit phone number"
                        maxLength="10"
                      />
                      {
                        newEmployee.personalInfo.phoneSecondary && newEmployee.personalInfo.phoneSecondary.length !== 10 && (
                          <div className="text-danger small mt-1">
                            Secondary phone number must be exactly 10 digits.
                          </div>
                        )
                      }
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Emergency Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={newEmployee.personalInfo.phoneEmergency}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 10) {
                            setNewEmployee({
                              ...newEmployee,
                              personalInfo: { ...newEmployee.personalInfo, phoneEmergency: value }
                            });
                          }
                        }}
                        placeholder="Enter 10-digit emergency phone"
                        maxLength="10"
                      />
                      {
                        newEmployee.personalInfo.phoneEmergency && newEmployee.personalInfo.phoneEmergency.length !== 10 && (
                          <div className="text-danger small mt-1">
                            Emergency phone number must be exactly 10 digits.
                          </div>
                        )}
                    </div>

                    {/* === Current Address === */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:map-pin" />
                        </span>
                        Current Address
                      </h6>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold">Address Line 1</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.personalInfo.currentAddress.line1}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          personalInfo: {
                            ...newEmployee.personalInfo,
                            currentAddress: { ...newEmployee.personalInfo.currentAddress, line1: e.target.value }
                          }
                        })}
                        placeholder="Enter address line 1"
                      />

                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold">Address Line 2</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.personalInfo.currentAddress.line2}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          personalInfo: {
                            ...newEmployee.personalInfo,
                            currentAddress: { ...newEmployee.personalInfo.currentAddress, line2: e.target.value }
                          }
                        })}
                        placeholder="Enter address line 2"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">City</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.personalInfo.currentAddress.city}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          personalInfo: {
                            ...newEmployee.personalInfo,
                            currentAddress: { ...newEmployee.personalInfo.currentAddress, city: e.target.value }
                          }
                        })}
                        placeholder="Enter city"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">State</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.personalInfo.currentAddress.state}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          personalInfo: {
                            ...newEmployee.personalInfo,
                            currentAddress: { ...newEmployee.personalInfo.currentAddress, state: e.target.value }
                          }
                        })}
                        placeholder="Enter state"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Pincode</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.personalInfo.currentAddress.pincode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 6) {
                            setNewEmployee({
                              ...newEmployee,
                              personalInfo: {
                                ...newEmployee.personalInfo,
                                currentAddress: { ...newEmployee.personalInfo.currentAddress, pincode: value }
                              }
                            });
                          }
                        }}
                        placeholder="Enter pincode"
                        maxLength="6"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Country</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.personalInfo.currentAddress.country}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          personalInfo: {
                            ...newEmployee.personalInfo,
                            currentAddress: { ...newEmployee.personalInfo.currentAddress, country: e.target.value }
                          }
                        })}
                        placeholder="Enter country"
                      />
                    </div>

                    {/* Permanent Address Section */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:home" />
                        </span>
                        Permanent Address
                      </h6>
                    </div>

                    <div className="col-12 mb-3">
                      <label
                        htmlFor="sameAsCurrent"
                        className="d-flex align-items-center form-check"
                        style={{ cursor: "pointer" }}
                      >
                        {/* Custom Checkbox Box */}
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "4px",
                            border: `2px solid ${JSON.stringify(newEmployee.personalInfo.currentAddress) ===
                                JSON.stringify(newEmployee.personalInfo.permanentAddress) &&
                                Object.values(newEmployee.personalInfo.currentAddress).some(
                                  (val) => val !== ""
                                )
                                ? "#3B82F6"
                                : "#9CA3AF"
                              }`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: "10px",
                            transition: "all 0.3s ease",
                            background:
                              JSON.stringify(newEmployee.personalInfo.currentAddress) ===
                                JSON.stringify(newEmployee.personalInfo.permanentAddress) &&
                                Object.values(newEmployee.personalInfo.currentAddress).some(
                                  (val) => val !== ""
                                )
                                ? "#3B82F6"
                                : "transparent",
                          }}
                        >
                          {(JSON.stringify(newEmployee.personalInfo.currentAddress) ===
                            JSON.stringify(newEmployee.personalInfo.permanentAddress) &&
                            Object.values(newEmployee.personalInfo.currentAddress).some(
                              (val) => val !== ""
                            )) && (
                              <span
                                style={{
                                  color: "white",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  lineHeight: 1,
                                }}
                              >
                                ✓
                              </span>
                            )}
                        </div>

                        {/* Hidden Native Checkbox */}
                        <input
                          type="checkbox"
                          id="sameAsCurrent"
                          className="form-check-input"
                          style={{ display: "none" }}
                          checked={
                            JSON.stringify(newEmployee.personalInfo.currentAddress) ===
                            JSON.stringify(newEmployee.personalInfo.permanentAddress) &&
                            Object.values(newEmployee.personalInfo.currentAddress).some(
                              (val) => val !== ""
                            )
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewEmployee({
                                ...newEmployee,
                                personalInfo: {
                                  ...newEmployee.personalInfo,
                                  permanentAddress: {
                                    ...newEmployee.personalInfo.currentAddress,
                                  },
                                },
                              });
                            } else {
                              setNewEmployee({
                                ...newEmployee,
                                personalInfo: {
                                  ...newEmployee.personalInfo,
                                  permanentAddress: {
                                    line1: "",
                                    line2: "",
                                    city: "",
                                    state: "",
                                    pincode: "",
                                    country: "",
                                  },
                                },
                              });
                            }
                          }}
                        />

                        {/* Label Text */}
                        <span className="fw-semibold">Same as Current Address</span>
                      </label>
                    </div>


                    <div className="col-12">
                      <label className="form-label fw-bold">Address Line 1</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.personalInfo.permanentAddress.line1}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          personalInfo: {
                            ...newEmployee.personalInfo,
                            permanentAddress: { ...newEmployee.personalInfo.permanentAddress, line1: e.target.value }
                          }
                        })}
                        placeholder="Enter address line 1"
                        disabled={
                          JSON.stringify(newEmployee.personalInfo.currentAddress) ===
                          JSON.stringify(newEmployee.personalInfo.permanentAddress) &&
                          Object.values(newEmployee.personalInfo.currentAddress).some(val => val !== "")
                        }
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold">Address Line 2</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.personalInfo.permanentAddress.line2}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          personalInfo: {
                            ...newEmployee.personalInfo,
                            permanentAddress: { ...newEmployee.personalInfo.permanentAddress, line2: e.target.value }
                          }
                        })}
                        placeholder="Enter address line 2"
                        disabled={
                          JSON.stringify(newEmployee.personalInfo.currentAddress) ===
                          JSON.stringify(newEmployee.personalInfo.permanentAddress) &&
                          Object.values(newEmployee.personalInfo.currentAddress).some(val => val !== "")
                        }
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">City</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.personalInfo.permanentAddress.city}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          personalInfo: {
                            ...newEmployee.personalInfo,
                            permanentAddress: { ...newEmployee.personalInfo.permanentAddress, city: e.target.value }
                          }
                        })}
                        placeholder="Enter city"
                        disabled={
                          JSON.stringify(newEmployee.personalInfo.currentAddress) ===
                          JSON.stringify(newEmployee.personalInfo.permanentAddress) &&
                          Object.values(newEmployee.personalInfo.currentAddress).some(val => val !== "")
                        }
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">State</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.personalInfo.permanentAddress.state}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          personalInfo: {
                            ...newEmployee.personalInfo,
                            permanentAddress: { ...newEmployee.personalInfo.permanentAddress, state: e.target.value }
                          }
                        })}
                        placeholder="Enter state"
                        disabled={
                          JSON.stringify(newEmployee.personalInfo.currentAddress) ===
                          JSON.stringify(newEmployee.personalInfo.permanentAddress) &&
                          Object.values(newEmployee.personalInfo.currentAddress).some(val => val !== "")
                        }
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">Pincode</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.personalInfo.permanentAddress.pincode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 6) {
                            setNewEmployee({
                              ...newEmployee,
                              personalInfo: {
                                ...newEmployee.personalInfo,
                                permanentAddress: { ...newEmployee.personalInfo.permanentAddress, pincode: value }
                              }
                            });
                          }
                        }}
                        placeholder="Enter pincode"
                        maxLength="6"
                        disabled={
                          JSON.stringify(newEmployee.personalInfo.currentAddress) ===
                          JSON.stringify(newEmployee.personalInfo.permanentAddress) &&
                          Object.values(newEmployee.personalInfo.currentAddress).some(val => val !== "")
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Country</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.personalInfo.permanentAddress.country}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          personalInfo: {
                            ...newEmployee.personalInfo,
                            permanentAddress: { ...newEmployee.personalInfo.permanentAddress, country: e.target.value }
                          }
                        })}
                        placeholder="Enter country"
                        disabled={
                          JSON.stringify(newEmployee.personalInfo.currentAddress) ===
                          JSON.stringify(newEmployee.personalInfo.permanentAddress) &&
                          Object.values(newEmployee.personalInfo.currentAddress).some(val => val !== "")
                        }
                      />
                    </div>

                    {/* === Emergency Contacts === */}
                    <div className="col-12 mt-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                          <span className="text-primary">
                            <Icon icon="heroicons:user-group" />
                          </span>
                          Emergency Contacts
                        </h6>

                        <button
                          type="button"
                          className="job-listings-btn"
                          onClick={() => {
                            if (newEmployee.personalInfo.emergencyContacts.length >= 5) {
                              alert("Maximum 5 emergency contacts allowed");
                              return;
                            }
                            const newContact = {
                              id: Date.now(),
                              name: "",
                              relation: "",
                              phone: "",
                              priority: "Primary",
                            };
                            setNewEmployee({
                              ...newEmployee,
                              personalInfo: {
                                ...newEmployee.personalInfo,
                                emergencyContacts: [
                                  ...newEmployee.personalInfo.emergencyContacts,
                                  newContact,
                                ],
                              },
                            });
                          }}
                        >
                          <Icon icon="heroicons:plus" />
                          <span>Add Contact</span>
                        </button>


                      </div>

                      {newEmployee.personalInfo.emergencyContacts.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-sm table-bordered">
                            <thead className="bg-light">
                              <tr>
                                <th className="text-muted">Name</th>
                                <th className="text-muted">Relation</th>
                                <th className="text-muted">Phone No </th>
                                <th className="text-muted">Priority</th>
                                <th className="text-muted">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {newEmployee.personalInfo.emergencyContacts.map((contact, index) => (
                                <tr key={contact.id}>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      value={contact.name}
                                      onChange={(e) => {
                                        const updatedContacts = [...newEmployee.personalInfo.emergencyContacts];
                                        updatedContacts[index] = { ...contact, name: e.target.value };
                                        setNewEmployee({
                                          ...newEmployee,
                                          personalInfo: {
                                            ...newEmployee.personalInfo,
                                            emergencyContacts: updatedContacts
                                          }
                                        });
                                      }}
                                      placeholder="Enter name"
                                    />
                                  </td>
                                  <td>
                                    <select
                                      className="form-select form-select-sm"
                                      value={contact.relation}
                                      onChange={(e) => {
                                        const updatedContacts = [...newEmployee.personalInfo.emergencyContacts];
                                        updatedContacts[index] = { ...contact, relation: e.target.value };
                                        setNewEmployee({
                                          ...newEmployee,
                                          personalInfo: {
                                            ...newEmployee.personalInfo,
                                            emergencyContacts: updatedContacts
                                          }
                                        });
                                      }}
                                    >
                                      <option value="">Select</option>
                                      <option value="Spouse">Spouse</option>
                                      <option value="Parent">Parent</option>
                                      <option value="Sibling">Sibling</option>
                                      <option value="Child">Child</option>
                                      <option value="Friend">Friend</option>
                                      <option value="Other">Other</option>
                                    </select>
                                  </td>
                                  <td>
                                    <input
                                      type="tel"
                                      className="form-control form-control-sm"
                                      value={contact.phone}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        if (value.length <= 10) {
                                          const updatedContacts = [...newEmployee.personalInfo.emergencyContacts];
                                          updatedContacts[index] = { ...contact, phone: value };
                                          setNewEmployee({
                                            ...newEmployee,
                                            personalInfo: {
                                              ...newEmployee.personalInfo,
                                              emergencyContacts: updatedContacts
                                            }
                                          });
                                        }
                                      }}
                                      placeholder="10 digits"
                                      maxLength="10"
                                    />
                                    {
                                      contact.phone && contact.phone.length !== 10 && (
                                        <div className="text-danger small mt-1">
                                          Phone number must be exactly 10 digits.
                                        </div>
                                      )
                                    }
                                  </td>
                                  <td>
                                    <select
                                      className="form-select form-select-sm"
                                      value={contact.priority}
                                      onChange={(e) => {
                                        const updatedContacts = [...newEmployee.personalInfo.emergencyContacts];
                                        updatedContacts[index] = { ...contact, priority: e.target.value };
                                        setNewEmployee({
                                          ...newEmployee,
                                          personalInfo: {
                                            ...newEmployee.personalInfo,
                                            emergencyContacts: updatedContacts
                                          }
                                        });
                                      }}
                                    >
                                      <option value="Primary">Primary</option>
                                      <option value="Secondary">Secondary</option>
                                      <option value="Tertiary">Tertiary</option>
                                    </select>
                                  </td>
                                  <td>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => {
                                        const updatedContacts = newEmployee.personalInfo.emergencyContacts.filter((_, i) => i !== index);
                                        setNewEmployee({
                                          ...newEmployee,
                                          personalInfo: {
                                            ...newEmployee.personalInfo,
                                            emergencyContacts: updatedContacts
                                          }
                                        });
                                      }}
                                    >
                                      <Icon icon="heroicons:trash" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="alert alert-light border d-flex align-items-center gap-2">
                          <Icon icon="heroicons:information-circle" className="me-2 text-muted" />
                          No emergency contacts added. Click "Add Contact" to add one (Max 5 contacts allowed).
                        </div>
                      )}
                    </div>

                    {/* === Family Members (Optional) === */}
                    <div className="col-12 mt-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                          <span className="text-primary">
                            <Icon icon="heroicons:home" />
                          </span>
                          Family Members (Optional)
                        </h6>

                        <button
                          type="button"
                          className="job-listings-btn"
                          onClick={() => {
                            if (newEmployee.personalInfo.familyMembers.length >= 5) {
                              alert("Maximum 5 family members allowed");
                              return;
                            }
                            const newMember = {
                              id: Date.now(),
                              name: "",
                              relation: "",
                              dateOfBirth: "",
                            };
                            setNewEmployee({
                              ...newEmployee,
                              personalInfo: {
                                ...newEmployee.personalInfo,
                                familyMembers: [
                                  ...newEmployee.personalInfo.familyMembers,
                                  newMember,
                                ],
                              },
                            });
                          }}
                        >
                          <Icon icon="heroicons:plus" />
                          <span>Add Member</span>
                        </button>


                      </div>

                      {newEmployee.personalInfo.familyMembers.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-sm table-bordered">
                            <thead className="bg-light">
                              <tr>
                                <th className="text-muted">Name</th>
                                <th className="text-muted">Relation</th>
                                <th className="text-muted">Date of Birth</th>
                                <th className="text-muted">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {newEmployee.personalInfo.familyMembers.map((member, index) => (
                                <tr key={member.id}>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      value={member.name}
                                      onChange={(e) => {
                                        const updatedMembers = [...newEmployee.personalInfo.familyMembers];
                                        updatedMembers[index] = { ...member, name: e.target.value };
                                        setNewEmployee({
                                          ...newEmployee,
                                          personalInfo: {
                                            ...newEmployee.personalInfo,
                                            familyMembers: updatedMembers
                                          }
                                        });
                                      }}
                                      placeholder="Enter name"
                                    />
                                  </td>
                                  <td>
                                    <select
                                      className="form-select form-select-sm"
                                      value={member.relation}
                                      onChange={(e) => {
                                        const updatedMembers = [...newEmployee.personalInfo.familyMembers];
                                        updatedMembers[index] = { ...member, relation: e.target.value };
                                        setNewEmployee({
                                          ...newEmployee,
                                          personalInfo: {
                                            ...newEmployee.personalInfo,
                                            familyMembers: updatedMembers
                                          }
                                        });
                                      }}
                                    >
                                      <option value="">Select</option>
                                      <option value="Spouse">Spouse</option>
                                      <option value="Father">Father</option>
                                      <option value="Mother">Mother</option>
                                      <option value="Son">Son</option>
                                      <option value="Daughter">Daughter</option>
                                      <option value="Brother">Brother</option>
                                      <option value="Sister">Sister</option>
                                      <option value="Other">Other</option>
                                    </select>
                                  </td>

                                  <td>
                                    <input
                                      type="date"
                                      className="form-control form-control-sm"
                                      value={member.dateOfBirth}
                                      onChange={(e) => {
                                        const updatedMembers = [...newEmployee.personalInfo.familyMembers];
                                        updatedMembers[index] = { ...member, dateOfBirth: e.target.value };
                                        setNewEmployee({
                                          ...newEmployee,
                                          personalInfo: {
                                            ...newEmployee.personalInfo,
                                            familyMembers: updatedMembers
                                          }
                                        });
                                      }}
                                    />
                                  </td>
                                  <td>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => {
                                        const updatedMembers = newEmployee.personalInfo.familyMembers.filter((_, i) => i !== index);
                                        setNewEmployee({
                                          ...newEmployee,
                                          personalInfo: {
                                            ...newEmployee.personalInfo,
                                            familyMembers: updatedMembers
                                          }
                                        });
                                      }}
                                    >
                                      <Icon icon="heroicons:trash" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="alert alert-light border d-flex align-items-center gap-2">
                          <Icon icon="heroicons:information-circle" className="me-2 text-muted" />
                          No family members added. Optional section (Max 5 members).
                        </div>
                      )}
                    </div>

                    {/* === Nominee Information === */}
                    <div className="col-12 mt-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold fs-5 text-muted d-flex align-items-center gap-2 mb-0">
                          <span className="text-primary">
                            <Icon icon="heroicons:gift" />
                          </span>
                          Nominee Information
                        </h6>

                        <button
                          type="button"
                          className="job-listings-btn"
                          onClick={() => {
                            if (newEmployee.personalInfo.nominees.length >= 3) {
                              alert("Maximum 3 nominees allowed");
                              return;
                            }
                            const newNominee = {
                              id: Date.now(),
                              name: "",
                              relation: "",
                              phone: "",
                              isNomineeAccepted: false,
                              percentage: "",
                            };
                            setNewEmployee({
                              ...newEmployee,
                              personalInfo: {
                                ...newEmployee.personalInfo,
                                nominees: [
                                  ...newEmployee.personalInfo.nominees,
                                  newNominee,
                                ],
                              },
                            });
                          }}
                        >
                          <Icon icon="heroicons:plus" />
                          <span>Add Nominee</span>
                        </button>


                      </div>

                      {newEmployee.personalInfo.nominees.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-sm table-bordered">
                            <thead className="bg-light">
                              <tr>
                                <th className="text-muted">Name</th>
                                <th className="text-muted">Relation</th>
                                <th className="text-muted">Phone No</th>
                                <th className="text-muted">Nominee Accepted</th>
                                <th className="text-muted">Percentage %</th>
                                <th className="text-muted">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {newEmployee.personalInfo.nominees.map((nominee, index) => (
                                <tr key={nominee.id}>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      value={nominee.name}
                                      onChange={(e) => {
                                        const updatedNominees = [...newEmployee.personalInfo.nominees];
                                        updatedNominees[index] = { ...nominee, name: e.target.value };
                                        setNewEmployee({
                                          ...newEmployee,
                                          personalInfo: {
                                            ...newEmployee.personalInfo,
                                            nominees: updatedNominees
                                          }
                                        });
                                      }}
                                      placeholder="Enter name"
                                    />
                                  </td>
                                  <td>
                                    <select
                                      className="form-select form-select-sm"
                                      value={nominee.relation}
                                      onChange={(e) => {
                                        const updatedNominees = [...newEmployee.personalInfo.nominees];
                                        updatedNominees[index] = { ...nominee, relation: e.target.value };
                                        setNewEmployee({
                                          ...newEmployee,
                                          personalInfo: {
                                            ...newEmployee.personalInfo,
                                            nominees: updatedNominees
                                          }
                                        });
                                      }}
                                    >
                                      <option value="">Select</option>
                                      <option value="Spouse">Spouse</option>
                                      <option value="Father">Father</option>
                                      <option value="Mother">Mother</option>
                                      <option value="Son">Son</option>
                                      <option value="Daughter">Daughter</option>
                                      <option value="Other">Other</option>
                                    </select>
                                  </td>
                                  <td>
                                    <input
                                      type="tel"
                                      className="form-control form-control-sm"
                                      value={nominee.contactNo}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        if (value.length <= 10) {
                                          const updatedNominees = [...newEmployee.personalInfo.nominees];
                                          updatedNominees[index] = { ...nominee, contactNo: value };
                                          setNewEmployee({
                                            ...newEmployee,
                                            personalInfo: {
                                              ...newEmployee.personalInfo,
                                              nominees: updatedNominees
                                            }
                                          });
                                        }
                                      }}
                                      placeholder="10 digits"
                                      maxLength="10"
                                    />
                                    {
                                      nominee.contactNo && nominee.contactNo.length !== 10 && (
                                        <div className="text-danger small mt-1">
                                          Phone number must be exactly 10 digits.
                                        </div>
                                      )
                                    }
                                  </td>
                                  <td>
                                    <select
                                      className="form-select form-select-sm"
                                      value={nominee.isNomineeAccepted ? 'Yes' : 'No'}
                                      onChange={(e) => {
                                        const updatedNominees = [...newEmployee.personalInfo.nominees];
                                        updatedNominees[index] = {
                                          ...nominee,
                                          isNomineeAccepted: e.target.value === 'Yes'
                                        };
                                        setNewEmployee({
                                          ...newEmployee,
                                          personalInfo: {
                                            ...newEmployee.personalInfo,
                                            nominees: updatedNominees
                                          }
                                        });
                                      }}
                                    >
                                      <option value="Yes">Yes</option>
                                      <option value="No">No</option>
                                    </select>
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control form-control-sm"
                                      value={nominee.percentage}
                                      onChange={(e) => {
                                        const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                        const updatedNominees = [...newEmployee.personalInfo.nominees];
                                        updatedNominees[index] = { ...nominee, percentage: value };
                                        setNewEmployee({
                                          ...newEmployee,
                                          personalInfo: {
                                            ...newEmployee.personalInfo,
                                            nominees: updatedNominees
                                          }
                                        });
                                      }}
                                      placeholder="0-100"
                                      min="0"
                                      max="100"
                                    />
                                  </td>
                                  <td>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => {
                                        const updatedNominees = newEmployee.personalInfo.nominees.filter((_, i) => i !== index);
                                        setNewEmployee({
                                          ...newEmployee,
                                          personalInfo: {
                                            ...newEmployee.personalInfo,
                                            nominees: updatedNominees
                                          }
                                        });
                                      }}
                                    >
                                      <Icon icon="heroicons:trash" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {(() => {
                            const totalPercentage = newEmployee.personalInfo.nominees.reduce(
                              (sum, nominee) => sum + (parseInt(nominee.percentage) || 0),
                              0
                            );
                            if (totalPercentage !== 100) {
                              return (
                                <div className={`alert ${totalPercentage > 100 ? 'alert-danger' : 'alert-warning'} mt-2`}>
                                  <Icon icon="heroicons:exclamation-triangle" className="me-2" />
                                  Total percentage: {totalPercentage}% (Should be exactly 100%)
                                </div>
                              );
                            }
                          })()}
                        </div>
                      ) : (
                        <div className="alert alert-light border d-flex align-items-center gap-2">
                          <Icon icon="heroicons:information-circle" className="me-2 text-muted" />
                          No nominees added. Click "Add Nominee" to add one (Max 3 nominees).
                        </div>
                      )}
                    </div>

                    {/* === Identification Documents === */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:document-text" />
                        </span>
                        Identification Documents
                      </h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">PAN Number <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control text-uppercase"
                        value={newEmployee.personalInfo.identification.pan.number}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                          if (value.length <= 10) {
                            setNewEmployee({
                              ...newEmployee,
                              personalInfo: {
                                ...newEmployee.personalInfo,
                                identification: {
                                  ...newEmployee.personalInfo.identification,
                                  pan: { ...newEmployee.personalInfo.identification.pan, number: value }
                                }
                              }
                            });
                          }
                        }}
                        placeholder="ABCDE1234F"
                        maxLength="10"
                        required
                      />
                      {
                        newEmployee.personalInfo.identification.pan.number && newEmployee.personalInfo.identification.pan.number.length !== 10 && (
                          <div className="text-danger small mt-1">PAN number must be exactly 10 characters</div>
                        )
                      }
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Aadhaar Number <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.personalInfo.identification.aadhaar.number}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 12) {
                            setNewEmployee({
                              ...newEmployee,
                              personalInfo: {
                                ...newEmployee.personalInfo,
                                identification: {
                                  ...newEmployee.personalInfo.identification,
                                  aadhaar: { ...newEmployee.personalInfo.identification.aadhaar, number: value }
                                }
                              }
                            });
                          }
                        }}
                        placeholder="123456789012"
                        maxLength="12"
                        required
                      />
                      {
                        newEmployee.personalInfo.identification.aadhaar.number && newEmployee.personalInfo.identification.aadhaar.number.length !== 12 && (
                          <div className="text-danger small mt-1">Aadhaar number must be exactly 12 digits</div>
                        )
                      }
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Passport Number (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.personalInfo.identification.passport.number}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          personalInfo: {
                            ...newEmployee.personalInfo,
                            identification: {
                              ...newEmployee.personalInfo.identification,
                              passport: { ...newEmployee.personalInfo.identification.passport, number: e.target.value }
                            }
                          }
                        })}
                        placeholder="Enter passport number"
                      />
                      {
                        newEmployee.personalInfo.identification.passport.number && newEmployee.personalInfo.identification.passport.number.length < 6 && (
                          <div className="text-danger small mt-1">Passport number must be at least 6 characters</div>
                        )
                      }
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Passport Expiry Date (Optional)</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newEmployee.personalInfo.identification.passport.expiryDate}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          personalInfo: {
                            ...newEmployee.personalInfo,
                            identification: {
                              ...newEmployee.personalInfo.identification,
                              passport: { ...newEmployee.personalInfo.identification.passport, expiryDate: e.target.value }
                            }
                          }
                        })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Voter ID Number (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.personalInfo.identification.voterId.number}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          personalInfo: {
                            ...newEmployee.personalInfo,
                            identification: {
                              ...newEmployee.personalInfo.identification,
                              voterId: { ...newEmployee.personalInfo.identification.voterId, number: e.target.value }
                            }
                          }
                        })}
                        placeholder="Enter voter ID number"
                      />
                      {
                        newEmployee.personalInfo.identification.voterId.number && newEmployee.personalInfo.identification.voterId.number.length < 6 && (
                          <div className="text-danger small mt-1">Voter ID number must be at least 6 characters</div>
                        )
                      }
                    </div>



                  </div>
                )}

                {/* Employment Information Tab */}

                {activeAddTab === 'employment' && (

                  <div className="row g-3">
                    <div className="col-12">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:briefcase" />
                        </span>
                        <span>Employment Details</span>
                      </h6>
                    </div>
                    {/* Row 1 */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Employee ID <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          value={newEmployee.employmentInfo.employeeId}
                          onChange={(e) => setNewEmployee({
                            ...newEmployee,
                            employmentInfo: { ...newEmployee.employmentInfo, employeeId: e.target.value }
                          })}
                          placeholder="EMP001"
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            const prefix = 'EMP';
                            const nextNum = employees.length + 1;
                            const employeeId = `${prefix}${String(nextNum).padStart(4, '0')}`;
                            setNewEmployee({
                              ...newEmployee,
                              employmentInfo: {
                                ...newEmployee.employmentInfo,
                                employeeId
                              }
                            });
                          }}
                        >
                          <Icon icon="heroicons:arrow-path" className="me-1" />
                          Generate
                        </button>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Date of Joining <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        value={newEmployee.employmentInfo.dateOfJoining}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          employmentInfo: { ...newEmployee.employmentInfo, dateOfJoining: e.target.value }
                        })}
                        required
                      />
                    </div>

                    {/* Row 2 */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Confirmation Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newEmployee.employmentInfo.confirmationDate}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          employmentInfo: { ...newEmployee.employmentInfo, confirmationDate: e.target.value }
                        })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Probation Period (months)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newEmployee.employmentInfo.probationPeriod}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          employmentInfo: { ...newEmployee.employmentInfo, probationPeriod: parseInt(e.target.value) || 0 }
                        })}
                        min="0"
                        max="12"
                      />
                    </div>

                    {/* Row 3 */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Employment Type <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={newEmployee.employmentInfo.employmentType}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          employmentInfo: { ...newEmployee.employmentInfo, employmentType: e.target.value },
                          employmentType: e.target.value
                        })}
                        required
                      >
                        <option value="">Select</option>
                        <option value="Permanent">Permanent</option>
                        <option value="Contract">Contract</option>
                        <option value="Intern">Intern</option>
                        <option value="Consultant">Consultant</option>
                        <option value="Temporary">Temporary</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Employment Status</label>
                      <select
                        className="form-select"
                        value={newEmployee.employmentInfo.employmentStatus}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          employmentInfo: { ...newEmployee.employmentInfo, employmentStatus: e.target.value },
                          status: e.target.value
                        })}
                      >
                        <option value="Active">Active</option>
                        <option value="Probation">Probation</option>
                        <option value="On-Hold">On-Hold</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Terminated">Terminated</option>
                      </select>
                    </div>

                    {/* Row 4 */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Department <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={newEmployee.employmentInfo.department || newEmployee.department}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          department: e.target.value,
                          employmentInfo: { ...newEmployee.employmentInfo, department: e.target.value }
                        })}
                        required
                      >
                        <option value="">Select</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Marketing">Marketing</option>
                        <option value="HR">HR</option>
                        <option value="Finance">Finance</option>
                        <option value="Sales">Sales</option>
                        <option value="Operations">Operations</option>
                        <option value="IT">IT</option>
                        <option value="Customer Support">Customer Support</option>
                        <option value="Product">Product</option>
                        <option value="Legal">Legal</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Sub-Department</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.employmentInfo.subDepartment}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          employmentInfo: { ...newEmployee.employmentInfo, subDepartment: e.target.value }
                        })}
                        placeholder="Enter sub-department"
                      />
                    </div>

                    {/* Row 5 */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Cost Center</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.employmentInfo.costCenter}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          employmentInfo: { ...newEmployee.employmentInfo, costCenter: e.target.value }
                        })}
                        placeholder="Enter cost center code"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Designation <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.employmentInfo.designation || newEmployee.designation}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          designation: e.target.value,
                          employmentInfo: { ...newEmployee.employmentInfo, designation: e.target.value }
                        })}
                        placeholder="Enter designation"
                        required
                      />
                    </div>

                    {/* Row 6 */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Grade</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.employmentInfo.grade}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          employmentInfo: { ...newEmployee.employmentInfo, grade: e.target.value }
                        })}
                        placeholder="e.g., P1, M2, E3"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Level</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.employmentInfo.level}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          employmentInfo: { ...newEmployee.employmentInfo, level: e.target.value }
                        })}
                        placeholder="e.g., Junior, Mid, Senior"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Branch / Location <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={newEmployee.employmentInfo.locationId || ''}
                        onChange={(e) => {
                          const selectedId = e.target.value ? Number(e.target.value) : null;
                          const selectedBranch = branches.find(b => b.id === selectedId);
                          setNewEmployee({
                            ...newEmployee,
                            location: selectedBranch ? selectedBranch.name : '',
                            employmentInfo: {
                              ...newEmployee.employmentInfo,
                              locationId: selectedId,
                              location: selectedBranch ? selectedBranch.name : ''
                            }
                          });
                        }}
                        required
                      >
                        <option value="">Select a branch...</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}{b.is_default ? ' (Default)' : ''}
                          </option>
                        ))}
                      </select>
                      {branches.length === 0 && (
                        <small className="text-muted">
                          No branches found — add one under Company Settings &rsaquo; Locations first.
                        </small>
                      )}
                    </div>

                    {/* Row 7 */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Workplace Type</label>
                      <select
                        className="form-select"
                        value={newEmployee.employmentInfo.workplaceType}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          employmentInfo: { ...newEmployee.employmentInfo, workplaceType: e.target.value }
                        })}
                      >
                        <option value="">Select</option>
                        <option value="Office">Office</option>
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Field">Field</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Email <span className="text-danger">*</span></label>
                      <input
                        type="email"
                        className="form-control"
                        value={newEmployee.employmentInfo.workEmail || newEmployee.email}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          email: e.target.value,
                          employmentInfo: { ...newEmployee.employmentInfo, workEmail: e.target.value }
                        })}
                        placeholder="employee@company.com"
                        required
                      />
                      {
                        newEmployee.employmentInfo.workEmail && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(newEmployee.employmentInfo.workEmail) && (
                          <div className="text-danger small mt-1">Please enter a valid email address.</div>
                        )
                      }
                    </div>

                    {/* Row 8 */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Extension Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.employmentInfo.extensionNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 6) {
                            setNewEmployee({
                              ...newEmployee,
                              employmentInfo: { ...newEmployee.employmentInfo, extensionNumber: value }
                            });
                          }
                        }}
                        placeholder="Enter extension number"
                        maxLength="6"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Desk Location</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.employmentInfo.deskLocation}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          employmentInfo: { ...newEmployee.employmentInfo, deskLocation: e.target.value }
                        })}
                        placeholder="e.g., Floor 3, Desk 12A"
                      />
                    </div>

                    {/* Row 9 */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Employee Category</label>
                      <select
                        className="form-select"
                        value={newEmployee.employmentInfo.employeeCategory}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          employmentInfo: { ...newEmployee.employmentInfo, employeeCategory: e.target.value }
                        })}
                      >
                        <option value="">Select</option>
                        <option value="Regular">Regular</option>
                        <option value="Trainee">Trainee</option>
                        <option value="Executive">Executive</option>
                        <option value="Manager">Manager</option>
                        <option value="Director">Director</option>
                        <option value="Contractor">Contractor</option>
                        <option value="Apprentice">Apprentice</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Notice Period (days)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newEmployee.employmentInfo.noticePeriod}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          employmentInfo: { ...newEmployee.employmentInfo, noticePeriod: parseInt(e.target.value) || 0 }
                        })}
                        min="0"
                        max="180"
                      />
                      <small className="text-muted">Typically 30, 60, or 90 days</small>
                    </div>

                    {/* Row 10 */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Direct Reporting Manager</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.employmentInfo.reportingManager.direct}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          employmentInfo: {
                            ...newEmployee.employmentInfo,
                            reportingManager: {
                              ...newEmployee.employmentInfo.reportingManager,
                              direct: e.target.value
                            }
                          }
                        })}
                        placeholder="Enter direct manager name"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Functional Reporting Manager</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.employmentInfo.reportingManager.functional}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          employmentInfo: {
                            ...newEmployee.employmentInfo,
                            reportingManager: {
                              ...newEmployee.employmentInfo.reportingManager,
                              functional: e.target.value
                            }
                          }
                        })}
                        placeholder="Enter functional manager name"
                      />
                    </div>

                    {/* Row 11 */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">HR Business Partner</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.employmentInfo.hrBusinessPartner}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          employmentInfo: { ...newEmployee.employmentInfo, hrBusinessPartner: e.target.value }
                        })}
                        placeholder="Enter HR business partner name"
                      />
                    </div>
                  </div>
                )}

                {/* Job History Tab */}

                {activeAddTab === 'jobHistory' && (
                  <div className="row g-3">
                    <div className="col-12 d-flex justify-content-between align-items-center">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:clock" />
                        </span>
                        Complete Job History
                      </h6>

                      <button
                        type="button"
                        className="create-job-btn"
                        onClick={() => {
                          // Ensure jobHistory exists as array
                          const currentHistory = Array.isArray(newEmployee.jobHistory)
                            ? newEmployee.jobHistory
                            : [];

                          setNewEmployee(prev => ({
                            ...prev,
                            jobHistory: [
                              ...currentHistory,
                              {
                                id: Date.now(),
                                date: new Date().toISOString().split("T")[0],
                                endDate: '',
                                type: "Joining",
                                organisation: '',
                                department: "",
                                designation: "",
                                location: "",
                                manager: "",
                                salaryChange: "",
                                notes: "",
                                achievements: "",
                                reasonForLeaving: "",
                                isEditing: true
                              }
                            ]
                          }));
                        }}
                      >
                        <Icon icon="heroicons:plus" />
                        Add Job History
                      </button>
                    </div>

                    {/* Current Job History Entries */}
                    <div className="col-12">
                      {Array.isArray(newEmployee.jobHistory) && newEmployee.jobHistory.length > 0 ? (
                        newEmployee.jobHistory.map((history, idx) => {
                          // Calculate duration for display
                          const calculateDuration = () => {
                            if (!history.date) return '-';

                            const startDate = new Date(history.date);
                            const endDate = history.endDate === 'Present' || !history.endDate
                              ? new Date()
                              : new Date(history.endDate);

                            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '-';

                            const durationInMonths = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24 * 30.44));
                            const years = Math.floor(durationInMonths / 12);
                            const months = durationInMonths % 12;

                            if (years > 0) {
                              return `${years} yr ${months > 0 ? `${months} mo` : ''}`.trim();
                            } else {
                              return `${months} mo`;
                            }
                          };

                          return (
                            <div key={history.id || idx} className="card border mb-3">
                              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                  <span className={`badge ${history.type === 'Promotion' ? 'bg-success' :
                                      history.type === 'Transfer' ? 'bg-info' :
                                        history.type === 'Joining' ? 'bg-primary' :
                                          history.type === 'Salary Revision' ? 'bg-warning' :
                                            'bg-secondary'
                                    }`}>
                                    {history.type || 'Unknown'}
                                  </span>
                                  <span className="text-muted">
                                    {history.date ? formatDate(history.date) : 'No date'}
                                  </span>
                                  {history.endDate && (
                                    <span className="text-muted">
                                      to {history.endDate === 'Present' ? 'Present' : formatDate(history.endDate)}
                                    </span>
                                  )}
                                </div>
                                <div className="d-flex gap-1">
                                  {history.isEditing ? (
                                    <>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-success"
                                        onClick={() => {
                                          const updatedHistory = [...newEmployee.jobHistory];
                                          updatedHistory[idx] = { ...history, isEditing: false };
                                          setNewEmployee(prev => ({
                                            ...prev,
                                            jobHistory: updatedHistory
                                          }));
                                        }}
                                        title="Save"
                                      >
                                        <Icon icon="heroicons:check" />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => {
                                          // If this is a new entry with empty required fields, remove it
                                          if (!history.date || !history.type) {
                                            const updatedHistory = newEmployee.jobHistory.filter((_, i) => i !== idx);
                                            setNewEmployee(prev => ({
                                              ...prev,
                                              jobHistory: updatedHistory
                                            }));
                                          } else {
                                            const updatedHistory = [...newEmployee.jobHistory];
                                            updatedHistory[idx] = { ...history, isEditing: false };
                                            setNewEmployee(prev => ({
                                              ...prev,
                                              jobHistory: updatedHistory
                                            }));
                                          }
                                        }}
                                        title="Cancel"
                                      >
                                        <Icon icon="heroicons:x-mark" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => {
                                          const updatedHistory = [...newEmployee.jobHistory];
                                          updatedHistory[idx] = { ...history, isEditing: true };
                                          setNewEmployee(prev => ({
                                            ...prev,
                                            jobHistory: updatedHistory
                                          }));
                                        }}
                                        title="Edit"
                                      >
                                        <Icon icon="heroicons:pencil" />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => {
                                          if (window.confirm('Are you sure you want to delete this job history entry?')) {
                                            const updatedHistory = newEmployee.jobHistory.filter((_, i) => i !== idx);
                                            setNewEmployee(prev => ({
                                              ...prev,
                                              jobHistory: updatedHistory
                                            }));
                                          }
                                        }}
                                        title="Delete"
                                      >
                                        <Icon icon="heroicons:trash" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="card-body">
                                {history.isEditing ? (
                                  <div className="row g-3">
                                    {/* Row 1: Start Date, End Date and Type */}
                                    <div className="col-md-4">
                                      <label className="form-label fw-bold small">
                                        Start Date <span className="text-danger">*</span>
                                      </label>
                                      <input
                                        type="date"
                                        className="form-control"
                                        value={history.date || ''}
                                        onChange={(e) => {
                                          const updatedHistory = [...newEmployee.jobHistory];
                                          updatedHistory[idx] = { ...history, date: e.target.value };
                                          setNewEmployee(prev => ({
                                            ...prev,
                                            jobHistory: updatedHistory
                                          }));
                                        }}
                                        required
                                      />
                                    </div>

                                    <div className="col-md-4">
                                      <label className="form-label fw-bold small">End Date</label>
                                      <div className="d-flex gap-2">
                                        <select
                                          className="form-select"
                                          value={history.endDate === 'Present' ? 'present' : (history.endDate ? 'date' : 'empty')}
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            const updatedHistory = [...newEmployee.jobHistory];
                                            let newEndDate = '';

                                            if (value === 'present') {
                                              newEndDate = 'Present';
                                            } else if (value === 'date') {
                                              newEndDate = new Date().toISOString().split('T')[0];
                                            } else {
                                              newEndDate = '';
                                            }

                                            updatedHistory[idx] = { ...history, endDate: newEndDate };
                                            setNewEmployee(prev => ({
                                              ...prev,
                                              jobHistory: updatedHistory
                                            }));
                                          }}
                                        >
                                          <option value="empty">Select End Date</option>
                                          <option value="present">Present</option>
                                          <option value="date">Specific Date</option>
                                        </select>
                                        {history.endDate && history.endDate !== 'Present' && history.endDate !== '' && (
                                          <input
                                            type="date"
                                            className="form-control"
                                            value={history.endDate}
                                            onChange={(e) => {
                                              const updatedHistory = [...newEmployee.jobHistory];
                                              updatedHistory[idx] = { ...history, endDate: e.target.value };
                                              setNewEmployee(prev => ({
                                                ...prev,
                                                jobHistory: updatedHistory
                                              }));
                                            }}
                                          />
                                        )}
                                      </div>
                                    </div>

                                    <div className="col-md-4">
                                      <label className="form-label fw-bold small">
                                        Type <span className="text-danger">*</span>
                                      </label>
                                      <select
                                        className="form-select"
                                        value={history.type || 'Joining'}
                                        onChange={(e) => {
                                          const updatedHistory = [...newEmployee.jobHistory];
                                          updatedHistory[idx] = { ...history, type: e.target.value };
                                          setNewEmployee(prev => ({
                                            ...prev,
                                            jobHistory: updatedHistory
                                          }));
                                        }}
                                        required
                                      >
                                        <option value="Joining">Joining</option>
                                        <option value="Promotion">Promotion</option>
                                        <option value="Transfer">Transfer</option>
                                        <option value="Salary Revision">Salary Revision</option>
                                        <option value="Department Change">Department Change</option>
                                        <option value="Location Transfer">Location Transfer</option>
                                        <option value="Designation Change">Designation Change</option>
                                        <option value="Resignation">Resignation</option>
                                        <option value="Previous Experience">Previous Experience</option>
                                      </select>
                                    </div>

                                    {/* Row 2: Organisation, Department, and Designation */}
                                    <div className="col-md-4">
                                      <label className="form-label fw-bold small">Organisation</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={history.organisation || ''}
                                        onChange={(e) => {
                                          const updatedHistory = [...newEmployee.jobHistory];
                                          updatedHistory[idx] = { ...history, organisation: e.target.value };
                                          setNewEmployee(prev => ({
                                            ...prev,
                                            jobHistory: updatedHistory
                                          }));
                                        }}
                                        placeholder="Enter organisation name"
                                      />
                                    </div>

                                    <div className="col-md-4">
                                      <label className="form-label fw-bold small">Department</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={history.department || ''}
                                        onChange={(e) => {
                                          const updatedHistory = [...newEmployee.jobHistory];
                                          updatedHistory[idx] = { ...history, department: e.target.value };
                                          setNewEmployee(prev => ({
                                            ...prev,
                                            jobHistory: updatedHistory
                                          }));
                                        }}
                                        placeholder="Enter department"
                                      />
                                    </div>

                                    <div className="col-md-4">
                                      <label className="form-label fw-bold small">Designation</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={history.designation || ''}
                                        onChange={(e) => {
                                          const updatedHistory = [...newEmployee.jobHistory];
                                          updatedHistory[idx] = { ...history, designation: e.target.value };
                                          setNewEmployee(prev => ({
                                            ...prev,
                                            jobHistory: updatedHistory
                                          }));
                                        }}
                                        placeholder="Enter designation"
                                      />
                                    </div>

                                    {/* Row 3: Location, Manager, and Salary */}
                                    <div className="col-md-4">
                                      <label className="form-label fw-bold small">Location</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={history.location || ''}
                                        onChange={(e) => {
                                          const updatedHistory = [...newEmployee.jobHistory];
                                          updatedHistory[idx] = { ...history, location: e.target.value };
                                          setNewEmployee(prev => ({
                                            ...prev,
                                            jobHistory: updatedHistory
                                          }));
                                        }}
                                        placeholder="Enter location"
                                      />
                                    </div>

                                    <div className="col-md-4">
                                      <label className="form-label fw-bold small">Manager</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={history.manager || ''}
                                        onChange={(e) => {
                                          const updatedHistory = [...newEmployee.jobHistory];
                                          updatedHistory[idx] = { ...history, manager: e.target.value };
                                          setNewEmployee(prev => ({
                                            ...prev,
                                            jobHistory: updatedHistory
                                          }));
                                        }}
                                        placeholder="Enter manager name"
                                      />
                                    </div>

                                    <div className="col-md-4">
                                      <label className="form-label fw-bold small">Salary</label>
                                      <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <input
                                          type="number"
                                          className="form-control"
                                          value={history.salaryChange || ''}
                                          onChange={(e) => {
                                            const updatedHistory = [...newEmployee.jobHistory];
                                            updatedHistory[idx] = { ...history, salaryChange: e.target.value };
                                            setNewEmployee(prev => ({
                                              ...prev,
                                              jobHistory: updatedHistory
                                            }));
                                          }}
                                          placeholder="Enter amount"
                                          min="0"
                                        />
                                      </div>
                                    </div>

                                    {/* Row 4: Duration (Read-only), Notes, and Achievements */}
                                    <div className="col-md-4">
                                      <label className="form-label fw-bold small">Duration</label>
                                      <div className="form-control bg-light">
                                        <div className="d-flex justify-content-between align-items-center">
                                          <span>{calculateDuration()}</span>
                                          {(history.endDate === 'Present' || !history.endDate) && (
                                            <small className="text-muted">Ongoing</small>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="col-md-4">
                                      <label className="form-label fw-bold small">Notes</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={history.notes || ''}
                                        onChange={(e) => {
                                          const updatedHistory = [...newEmployee.jobHistory];
                                          updatedHistory[idx] = { ...history, notes: e.target.value };
                                          setNewEmployee(prev => ({
                                            ...prev,
                                            jobHistory: updatedHistory
                                          }));
                                        }}
                                        placeholder="Enter notes"
                                      />
                                    </div>

                                    <div className="col-md-4">
                                      <label className="form-label fw-bold small">Achievements</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={history.achievements || ''}
                                        onChange={(e) => {
                                          const updatedHistory = [...newEmployee.jobHistory];
                                          updatedHistory[idx] = { ...history, achievements: e.target.value };
                                          setNewEmployee(prev => ({
                                            ...prev,
                                            jobHistory: updatedHistory
                                          }));
                                        }}
                                        placeholder="Enter achievements"
                                      />
                                    </div>

                                    {/* Row 5: Reason for Leaving (Conditional) */}
                                    {(history.type === 'Resignation' || history.reasonForLeaving) && (
                                      <div className="col-md-12">
                                        <label className="form-label fw-bold small">Reason for Leaving</label>
                                        <input
                                          type="text"
                                          className="form-control"
                                          value={history.reasonForLeaving || ''}
                                          onChange={(e) => {
                                            const updatedHistory = [...newEmployee.jobHistory];
                                            updatedHistory[idx] = { ...history, reasonForLeaving: e.target.value };
                                            setNewEmployee(prev => ({
                                              ...prev,
                                              jobHistory: updatedHistory
                                            }));
                                          }}
                                          placeholder="Enter reason for leaving"
                                        />
                                        <small className="text-muted">Only applicable for resignations or job changes</small>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="row">
                                    {/* Read-only display */}
                                    <div className="col-md-6 mb-2">
                                      <div className="d-flex">
                                        <strong className="text-muted me-2" style={{ minWidth: '100px' }}>Start Date:</strong>
                                        <span>{history.date ? formatDate(history.date) : '-'}</span>
                                      </div>
                                    </div>
                                    <div className="col-md-6 mb-2">
                                      <div className="d-flex">
                                        <strong className="text-muted me-2" style={{ minWidth: '100px' }}>End Date:</strong>
                                        <span>
                                          {history.endDate === 'Present' ? (
                                            <span className="badge bg-success">Present</span>
                                          ) : history.endDate ? (
                                            formatDate(history.endDate)
                                          ) : (
                                            '-'
                                          )}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="col-md-6 mb-2">
                                      <div className="d-flex">
                                        <strong className="text-muted me-2" style={{ minWidth: '100px' }}>Type:</strong>
                                        <span className={`badge ${history.type === 'Promotion' ? 'bg-success' :
                                            history.type === 'Transfer' ? 'bg-info' :
                                              history.type === 'Joining' ? 'bg-primary' :
                                                history.type === 'Salary Revision' ? 'bg-warning' :
                                                  'bg-secondary'
                                          }`}>
                                          {history.type || '-'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="col-md-6 mb-2">
                                      <div className="d-flex">
                                        <strong className="text-muted me-2" style={{ minWidth: '100px' }}>Organisation:</strong>
                                        <span>{history.organisation || '-'}</span>
                                      </div>
                                    </div>

                                    <div className="col-md-6 mb-2">
                                      <div className="d-flex">
                                        <strong className="text-muted me-2" style={{ minWidth: '100px' }}>Department:</strong>
                                        <span>{history.department || '-'}</span>
                                      </div>
                                    </div>
                                    <div className="col-md-6 mb-2">
                                      <div className="d-flex">
                                        <strong className="text-muted me-2" style={{ minWidth: '100px' }}>Designation:</strong>
                                        <span><strong>{history.designation || '-'}</strong></span>
                                      </div>
                                    </div>

                                    <div className="col-md-6 mb-2">
                                      <div className="d-flex">
                                        <strong className="text-muted me-2" style={{ minWidth: '100px' }}>Location:</strong>
                                        <span>{history.location || '-'}</span>
                                      </div>
                                    </div>
                                    <div className="col-md-6 mb-2">
                                      <div className="d-flex">
                                        <strong className="text-muted me-2" style={{ minWidth: '100px' }}>Manager:</strong>
                                        <span>{history.manager || '-'}</span>
                                      </div>
                                    </div>

                                    <div className="col-md-6 mb-2">
                                      <div className="d-flex">
                                        <strong className="text-muted me-2" style={{ minWidth: '100px' }}>Salary:</strong>
                                        <span>{history.salaryChange ? formatCurrency(history.salaryChange) : '-'}</span>
                                      </div>
                                    </div>
                                    <div className="col-md-6 mb-2">
                                      <div className="d-flex">
                                        <strong className="text-muted me-2" style={{ minWidth: '100px' }}>Duration:</strong>
                                        <span>
                                          <div className="d-flex flex-column">
                                            <span className="fw-medium">{calculateDuration()}</span>
                                            {(history.endDate === 'Present' || !history.endDate) && (
                                              <small className="text-muted">Ongoing</small>
                                            )}
                                          </div>
                                        </span>
                                      </div>
                                    </div>

                                    <div className="col-md-6 mb-2">
                                      <div className="d-flex">
                                        <strong className="text-muted me-2" style={{ minWidth: '100px' }}>Notes:</strong>
                                        <span>
                                          <small className="text-muted">
                                            {history.notes || '-'}
                                            {history.reasonForLeaving && history.reasonForLeaving !== 'N/A' && (
                                              <div className="mt-1">
                                                <small className="text-danger">
                                                  <Icon icon="heroicons:arrow-right-on-rectangle" className="me-1" />
                                                  Reason: {history.reasonForLeaving}
                                                </small>
                                              </div>
                                            )}
                                          </small>
                                        </span>
                                      </div>
                                    </div>
                                    <div className="col-md-6 mb-2">
                                      <div className="d-flex">
                                        <strong className="text-muted me-2" style={{ minWidth: '100px' }}>Achievements:</strong>
                                        <span>
                                          {history.achievements ? (
                                            <div className="text-truncate" style={{ maxWidth: '200px' }} title={history.achievements}>
                                              <small>{history.achievements}</small>
                                            </div>
                                          ) : (
                                            <small className="text-muted">-</small>
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="alert alert-light border d-flex align-items-center gap-2">
                          <Icon icon="heroicons:information-circle" className="text-muted" />
                          <div>
                            <strong>No job history entries added yet.</strong>
                            <p className="mb-0">Click "Add Job History" button to add job history records.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Summary Table View */}
                    {Array.isArray(newEmployee.jobHistory) && newEmployee.jobHistory.length > 0 && (
                      <div className="col-12 mt-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                            <span className="text-primary">
                              <Icon icon="heroicons:table-cells" className="me-2" />
                            </span>
                            Job History Summary Table
                          </h6>
                          <small className="text-muted">
                            Showing {newEmployee.jobHistory.length} entries
                          </small>
                        </div>
                        <div className="table-responsive">
                          <table className="table table-sm table-bordered">
                            <thead className="bg-light">
                              <tr>
                                <th className="text-muted">Start Date</th>
                                <th className="text-muted">End Date</th>
                                <th className="text-muted">Type</th>
                                <th className="text-muted">Organisation</th>
                                <th className="text-muted">Department</th>
                                <th className="text-muted">Designation</th>
                                <th className="text-muted">Location</th>
                                <th className="text-muted">Manager</th>
                                <th className="text-muted">Salary</th>
                                <th className="text-muted">Duration</th>
                                <th className="text-muted">Notes</th>
                                <th className="text-muted">Achievements</th>
                              </tr>
                            </thead>
                            <tbody>
                              {newEmployee.jobHistory.map((history, idx) => {
                                // Calculate duration for each row
                                const calculateDuration = () => {
                                  if (!history.date) return '-';

                                  const startDate = new Date(history.date);
                                  const endDate = history.endDate === 'Present' || !history.endDate
                                    ? new Date()
                                    : new Date(history.endDate);

                                  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '-';

                                  const durationInMonths = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24 * 30.44));
                                  const years = Math.floor(durationInMonths / 12);
                                  const months = durationInMonths % 12;

                                  if (years > 0) {
                                    return `${years} yr ${months > 0 ? `${months} mo` : ''}`.trim();
                                  } else {
                                    return `${months} mo`;
                                  }
                                };

                                return (
                                  <tr key={history.id || idx}>
                                    <td>{history.date ? formatDate(history.date) : '-'}</td>
                                    <td>
                                      {history.endDate === 'Present' ? (
                                        <span className="badge bg-success">Present</span>
                                      ) : history.endDate ? (
                                        formatDate(history.endDate)
                                      ) : (
                                        '-'
                                      )}
                                    </td>
                                    <td>
                                      <span className={`badge ${history.type === 'Promotion' ? 'bg-success' :
                                          history.type === 'Transfer' ? 'bg-info' :
                                            history.type === 'Joining' ? 'bg-primary' :
                                              history.type === 'Salary Revision' ? 'bg-warning' :
                                                'bg-secondary'
                                        }`}>
                                        {history.type || '-'}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="d-flex align-items-center gap-2">
                                        <span>{history.organisation || '-'}</span>
                                        {history.organisation === newEmployee.employmentInfo?.department && (
                                          <span className="badge bg-primary-subtle text-primary border border-primary">
                                            Current
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td>{history.department || '-'}</td>
                                    <td><strong>{history.designation || '-'}</strong></td>
                                    <td>{history.location || '-'}</td>
                                    <td>{history.manager || '-'}</td>
                                    <td>
                                      {history.salaryChange ? (
                                        <div className="d-flex flex-column">
                                          <span className="text-primary fw-semibold">
                                            {formatCurrency(history.salaryChange)}
                                          </span>
                                          {history.type === 'Promotion' && (
                                            <small className="text-success">
                                              <Icon icon="heroicons:arrow-trending-up" className="me-1" />
                                              Increased
                                            </small>
                                          )}
                                        </div>
                                      ) : '-'}
                                    </td>
                                    <td>
                                      <div className="d-flex flex-column align-items-center">
                                        <span className="fw-medium">{calculateDuration()}</span>
                                        {(history.endDate === 'Present' || !history.endDate) && (
                                          <small className="text-muted">Ongoing</small>
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      <small className="text-muted">
                                        {history.notes || '-'}
                                        {history.reasonForLeaving && history.reasonForLeaving !== 'N/A' && (
                                          <div className="mt-1">
                                            <small className="text-danger">
                                              <Icon icon="heroicons:arrow-right-on-rectangle" className="me-1" />
                                              Reason: {history.reasonForLeaving}
                                            </small>
                                          </div>
                                        )}
                                      </small>
                                    </td>
                                    <td>
                                      {history.achievements ? (
                                        <div className="text-truncate" style={{ maxWidth: '150px' }} title={history.achievements}>
                                          <small>{history.achievements}</small>
                                        </div>
                                      ) : (
                                        <small className="text-muted">-</small>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Salary & Compensation Tab */}

                {activeAddTab === 'salary' && (
                  <div className="row g-3">
                    {/* === Current Compensation === */}
                    <div className="col-12">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:currency-dollar" />
                        </span>
                        Current Compensation
                      </h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Current CTC (Annual) <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text">₹</span>
                        <input
                          type="number"
                          className="form-control"
                          value={newEmployee.salaryInfo.currentCTC || newEmployee.salary || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setNewEmployee({
                              ...newEmployee,
                              salary: value,
                              salaryInfo: {
                                ...newEmployee.salaryInfo,
                                currentCTC: value,
                                // Auto-populate basic salary as 50% of CTC
                                ctcBreakdown: {
                                  ...newEmployee.salaryInfo.ctcBreakdown,
                                  basic: Math.round(value * 0.5),
                                  hra: Math.round(value * 0.2),
                                  specialAllowance: Math.round(value * 0.15),
                                  transportAllowance: Math.round(value * 0.05),
                                  medicalAllowance: Math.round(value * 0.05),
                                  otherAllowances: Math.round(value * 0.05),
                                  providentFund: Math.round(value * 0.12),
                                  gratuity: Math.round(value * 0.048),
                                  otherDeductions: Math.round(value * 0.002)
                                }
                              }
                            });
                          }}
                          placeholder="Enter annual CTC"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Salary Structure</label>
                      <select
                        className="form-select"
                        value={newEmployee.salaryInfo.salaryStructure}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          salaryInfo: { ...newEmployee.salaryInfo, salaryStructure: e.target.value }
                        })}
                      >
                        <option value="">Select Structure</option>
                        <option value="Fixed">Fixed</option>
                        <option value="Fixed + Variable">Fixed + Variable</option>
                        <option value="Performance Based">Performance Based</option>
                        <option value="Commission Based">Commission Based</option>
                      </select>
                    </div>

                    {/* === CTC Breakdown === */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:chart-bar" />
                        </span>
                        CTC Breakdown

                      </h6>
                      <div className="table-responsive">
                        <table className="table table-sm table-bordered">
                          <thead className="bg-light">
                            <tr>
                              <th className="text-muted">Component</th>
                              <th className="text-end text-muted">Amount (Annual)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              {
                                name: 'Basic',
                                key: 'basic',
                                value: newEmployee.salaryInfo.ctcBreakdown?.basic || 0,
                                onChange: (val) => setNewEmployee({
                                  ...newEmployee,
                                  salaryInfo: {
                                    ...newEmployee.salaryInfo,
                                    ctcBreakdown: {
                                      ...newEmployee.salaryInfo.ctcBreakdown,
                                      basic: val
                                    }
                                  }
                                })
                              },
                              {
                                name: 'HRA',
                                key: 'hra',
                                value: newEmployee.salaryInfo.ctcBreakdown?.hra || 0,
                                onChange: (val) => setNewEmployee({
                                  ...newEmployee,
                                  salaryInfo: {
                                    ...newEmployee.salaryInfo,
                                    ctcBreakdown: {
                                      ...newEmployee.salaryInfo.ctcBreakdown,
                                      hra: val
                                    }
                                  }
                                })
                              },
                              {
                                name: 'Special Allowance',
                                key: 'specialAllowance',
                                value: newEmployee.salaryInfo.ctcBreakdown?.specialAllowance || 0,
                                onChange: (val) => setNewEmployee({
                                  ...newEmployee,
                                  salaryInfo: {
                                    ...newEmployee.salaryInfo,
                                    ctcBreakdown: {
                                      ...newEmployee.salaryInfo.ctcBreakdown,
                                      specialAllowance: val
                                    }
                                  }
                                })
                              },
                              {
                                name: 'Transport Allowance',
                                key: 'transportAllowance',
                                value: newEmployee.salaryInfo.ctcBreakdown?.transportAllowance || 0,
                                onChange: (val) => setNewEmployee({
                                  ...newEmployee,
                                  salaryInfo: {
                                    ...newEmployee.salaryInfo,
                                    ctcBreakdown: {
                                      ...newEmployee.salaryInfo.ctcBreakdown,
                                      transportAllowance: val
                                    }
                                  }
                                })
                              },
                              {
                                name: 'Medical Allowance',
                                key: 'medicalAllowance',
                                value: newEmployee.salaryInfo.ctcBreakdown?.medicalAllowance || 0,
                                onChange: (val) => setNewEmployee({
                                  ...newEmployee,
                                  salaryInfo: {
                                    ...newEmployee.salaryInfo,
                                    ctcBreakdown: {
                                      ...newEmployee.salaryInfo.ctcBreakdown,
                                      medicalAllowance: val
                                    }
                                  }
                                })
                              },
                              {
                                name: 'Other Allowances',
                                key: 'otherAllowances',
                                value: newEmployee.salaryInfo.ctcBreakdown?.otherAllowances || 0,
                                onChange: (val) => setNewEmployee({
                                  ...newEmployee,
                                  salaryInfo: {
                                    ...newEmployee.salaryInfo,
                                    ctcBreakdown: {
                                      ...newEmployee.salaryInfo.ctcBreakdown,
                                      otherAllowances: val
                                    }
                                  }
                                })
                              },
                            ].map((item, index) => (
                              <tr key={index}>
                                <td className="fw-semibold">{item.name}</td>
                                <td>
                                  <div className="input-group input-group-sm">
                                    <span className="input-group-text">₹</span>
                                    <input
                                      type="number"
                                      className="form-control text-end"
                                      value={item.value}
                                      onChange={(e) => item.onChange(parseInt(e.target.value) || 0)}
                                      placeholder="0"
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}

                            <tr className="table-secondary fw-bold">
                              <td>Gross Salary</td>
                              <td className="text-end">
                                ₹{(
                                  (newEmployee.salaryInfo.ctcBreakdown?.basic || 0) +
                                  (newEmployee.salaryInfo.ctcBreakdown?.hra || 0) +
                                  (newEmployee.salaryInfo.ctcBreakdown?.specialAllowance || 0) +
                                  (newEmployee.salaryInfo.ctcBreakdown?.transportAllowance || 0) +
                                  (newEmployee.salaryInfo.ctcBreakdown?.medicalAllowance || 0) +
                                  (newEmployee.salaryInfo.ctcBreakdown?.otherAllowances || 0)
                                ).toLocaleString('en-IN')}
                              </td>
                            </tr>

                            {[
                              {
                                name: 'Provident Fund',
                                key: 'providentFund',
                                value: newEmployee.salaryInfo.ctcBreakdown?.providentFund || 0,
                                onChange: (val) => setNewEmployee({
                                  ...newEmployee,
                                  salaryInfo: {
                                    ...newEmployee.salaryInfo,
                                    ctcBreakdown: {
                                      ...newEmployee.salaryInfo.ctcBreakdown,
                                      providentFund: val
                                    }
                                  }
                                })
                              },
                              {
                                name: 'Gratuity',
                                key: 'gratuity',
                                value: newEmployee.salaryInfo.ctcBreakdown?.gratuity || 0,
                                onChange: (val) => setNewEmployee({
                                  ...newEmployee,
                                  salaryInfo: {
                                    ...newEmployee.salaryInfo,
                                    ctcBreakdown: {
                                      ...newEmployee.salaryInfo.ctcBreakdown,
                                      gratuity: val
                                    }
                                  }
                                })
                              },
                              {
                                name: 'Other Deductions',
                                key: 'otherDeductions',
                                value: newEmployee.salaryInfo.ctcBreakdown?.otherDeductions || 0,
                                onChange: (val) => setNewEmployee({
                                  ...newEmployee,
                                  salaryInfo: {
                                    ...newEmployee.salaryInfo,
                                    ctcBreakdown: {
                                      ...newEmployee.salaryInfo.ctcBreakdown,
                                      otherDeductions: val
                                    }
                                  }
                                })
                              },
                            ].map((item, index) => (
                              <tr key={index}>
                                <td className="fw-semibold">{item.name}</td>
                                <td>
                                  <div className="input-group input-group-sm">
                                    <span className="input-group-text">₹</span>
                                    <input
                                      type="number"
                                      className="form-control text-end"
                                      value={item.value}
                                      onChange={(e) => item.onChange(parseInt(e.target.value) || 0)}
                                      placeholder="0"
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* === Bank Account Details === */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:building-library" />
                        </span>
                        Bank Account Details
                      </h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Payment Mode</label>
                      <select
                        className="form-select"
                        value={newEmployee.salaryInfo.paymentMode}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          salaryInfo: { ...newEmployee.salaryInfo, paymentMode: e.target.value }
                        })}
                      >
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Cash">Cash</option>
                      </select>
                    </div>

                    {/* Primary Bank Account */}
                    <div className="col-12 mt-3">
                      <h6 className="fw-bold fs-5 mb-3 text-muted d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:banknotes" />
                        </span>
                        Primary Bank Account
                      </h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Account Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.salaryInfo.bankAccounts.primary.accountNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                          if (value.length <= 18) {
                            setNewEmployee({
                              ...newEmployee,
                              salaryInfo: {
                                ...newEmployee.salaryInfo,
                                bankAccounts: {
                                  ...newEmployee.salaryInfo.bankAccounts,
                                  primary: {
                                    ...newEmployee.salaryInfo.bankAccounts.primary,
                                    accountNumber: value
                                  }
                                }
                              }
                            });
                          }
                        }}
                        placeholder="1234567890"
                        maxLength="18"
                      />
                      {newEmployee.salaryInfo.bankAccounts.primary.accountNumber &&
                        (newEmployee.salaryInfo.bankAccounts.primary.accountNumber.length < 9 ||
                          newEmployee.salaryInfo.bankAccounts.primary.accountNumber.length > 18) && (
                          <div className="text-danger small mt-1">
                            Account number must be 9 to 18 digits
                          </div>
                        )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">IFSC Code</label>
                      <input
                        type="text"
                        className="form-control text-uppercase"
                        value={newEmployee.salaryInfo.bankAccounts.primary.ifscCode}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                          if (value.length <= 11) {
                            setNewEmployee({
                              ...newEmployee,
                              salaryInfo: {
                                ...newEmployee.salaryInfo,
                                bankAccounts: {
                                  ...newEmployee.salaryInfo.bankAccounts,
                                  primary: {
                                    ...newEmployee.salaryInfo.bankAccounts.primary,
                                    ifscCode: value
                                  }
                                }
                              }
                            });
                          }
                        }}
                        placeholder="BANK0001234"
                        maxLength="11"
                      />
                      {newEmployee.salaryInfo.bankAccounts.primary.ifscCode &&
                        newEmployee.salaryInfo.bankAccounts.primary.ifscCode.length !== 11 && (
                          <div className="text-danger small mt-1">
                            IFSC code must be exactly 11 characters
                          </div>
                        )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Bank Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.salaryInfo.bankAccounts.primary.bankName}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          salaryInfo: {
                            ...newEmployee.salaryInfo,
                            bankAccounts: {
                              ...newEmployee.salaryInfo.bankAccounts,
                              primary: {
                                ...newEmployee.salaryInfo.bankAccounts.primary,
                                bankName: e.target.value
                              }
                            }
                          }
                        })}
                        placeholder="State Bank of India"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Branch</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.salaryInfo.bankAccounts.primary.branch}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          salaryInfo: {
                            ...newEmployee.salaryInfo,
                            bankAccounts: {
                              ...newEmployee.salaryInfo.bankAccounts,
                              primary: {
                                ...newEmployee.salaryInfo.bankAccounts.primary,
                                branch: e.target.value
                              }
                            }
                          }
                        })}
                        placeholder="Main Branch, Mumbai"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Account Type</label>
                      <select
                        className="form-select"
                        value={newEmployee.salaryInfo.bankAccounts.primary.accountType}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          salaryInfo: {
                            ...newEmployee.salaryInfo,
                            bankAccounts: {
                              ...newEmployee.salaryInfo.bankAccounts,
                              primary: {
                                ...newEmployee.salaryInfo.bankAccounts.primary,
                                accountType: e.target.value
                              }
                            }
                          }
                        })}
                      >
                        <option value="">Select Account Type</option>
                        <option value="Savings">Savings</option>
                        <option value="Current">Current</option>
                        <option value="Salary">Salary</option>
                      </select>
                    </div>

                    {/* Secondary Bank Account (Optional) */}
                    <div className="col-12 mt-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold fs-5 text-muted d-flex align-items-center gap-2 mb-0">
                          <span className="text-primary">
                            <Icon icon="heroicons:plus-circle" />
                          </span>
                          Secondary Bank Account
                        </h6>
                        <button
                          type="button"
                          className="job-listings-btn"
                          onClick={() => {
                            if (newEmployee.salaryInfo.bankAccounts.secondary) {
                              // Remove secondary account
                              setNewEmployee({
                                ...newEmployee,
                                salaryInfo: {
                                  ...newEmployee.salaryInfo,
                                  bankAccounts: {
                                    ...newEmployee.salaryInfo.bankAccounts,
                                    secondary: null
                                  }
                                }
                              });
                            } else {
                              // Add secondary account
                              setNewEmployee({
                                ...newEmployee,
                                salaryInfo: {
                                  ...newEmployee.salaryInfo,
                                  bankAccounts: {
                                    ...newEmployee.salaryInfo.bankAccounts,
                                    secondary: {
                                      accountNumber: '',
                                      ifscCode: '',
                                      bankName: '',
                                      branch: '',
                                      accountType: ''
                                    }
                                  }
                                }
                              });
                            }
                          }}
                        >
                          <Icon
                            icon={
                              newEmployee.salaryInfo.bankAccounts.secondary
                                ? "heroicons:minus"
                                : "heroicons:plus"
                            }
                          />
                          {newEmployee.salaryInfo.bankAccounts.secondary
                            ? "Remove Account"
                            : "Add Account"}
                        </button>

                      </div>
                    </div>

                    {newEmployee.salaryInfo.bankAccounts.secondary && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Account Number</label>
                          <input
                            type="text"
                            className="form-control"
                            value={newEmployee.salaryInfo.bankAccounts.secondary.accountNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                              if (value.length <= 18) {
                                setNewEmployee({
                                  ...newEmployee,
                                  salaryInfo: {
                                    ...newEmployee.salaryInfo,
                                    bankAccounts: {
                                      ...newEmployee.salaryInfo.bankAccounts,
                                      secondary: {
                                        ...newEmployee.salaryInfo.bankAccounts.secondary,
                                        accountNumber: value
                                      }
                                    }
                                  }
                                });
                              }
                            }}
                            placeholder="1234567890"
                            maxLength="18"
                          />
                          {newEmployee.salaryInfo.bankAccounts.secondary.accountNumber &&
                            (newEmployee.salaryInfo.bankAccounts.secondary.accountNumber.length < 9 ||
                              newEmployee.salaryInfo.bankAccounts.secondary.accountNumber.length > 18) && (
                              <div className="text-danger small mt-1">
                                Account number must be 9 to 18 digits
                              </div>
                            )}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-bold">IFSC Code</label>
                          <input
                            type="text"
                            className="form-control text-uppercase"
                            value={newEmployee.salaryInfo.bankAccounts.secondary.ifscCode}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                              if (value.length <= 11) {
                                setNewEmployee({
                                  ...newEmployee,
                                  salaryInfo: {
                                    ...newEmployee.salaryInfo,
                                    bankAccounts: {
                                      ...newEmployee.salaryInfo.bankAccounts,
                                      secondary: {
                                        ...newEmployee.salaryInfo.bankAccounts.secondary,
                                        ifscCode: value
                                      }
                                    }
                                  }
                                });
                              }
                            }}
                            placeholder="BANK0001234"
                            maxLength="11"
                          />
                          {newEmployee.salaryInfo.bankAccounts.secondary.ifscCode &&
                            newEmployee.salaryInfo.bankAccounts.secondary.ifscCode.length !== 11 && (
                              <div className="text-danger small mt-1">
                                IFSC code must be exactly 11 characters
                              </div>
                            )}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-bold">Bank Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={newEmployee.salaryInfo.bankAccounts.secondary.bankName}
                            onChange={(e) => setNewEmployee({
                              ...newEmployee,
                              salaryInfo: {
                                ...newEmployee.salaryInfo,
                                bankAccounts: {
                                  ...newEmployee.salaryInfo.bankAccounts,
                                  secondary: {
                                    ...newEmployee.salaryInfo.bankAccounts.secondary,
                                    bankName: e.target.value
                                  }
                                }
                              }
                            })}
                            placeholder="Bank Name"
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-bold">Branch</label>
                          <input
                            type="text"
                            className="form-control"
                            value={newEmployee.salaryInfo.bankAccounts.secondary.branch}
                            onChange={(e) => setNewEmployee({
                              ...newEmployee,
                              salaryInfo: {
                                ...newEmployee.salaryInfo,
                                bankAccounts: {
                                  ...newEmployee.salaryInfo.bankAccounts,
                                  secondary: {
                                    ...newEmployee.salaryInfo.bankAccounts.secondary,
                                    branch: e.target.value
                                  }
                                }
                              }
                            })}
                            placeholder="Branch Name"
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-bold">Account Type</label>
                          <select
                            className="form-select"
                            value={newEmployee.salaryInfo.bankAccounts.secondary.accountType}
                            onChange={(e) => setNewEmployee({
                              ...newEmployee,
                              salaryInfo: {
                                ...newEmployee.salaryInfo,
                                bankAccounts: {
                                  ...newEmployee.salaryInfo.bankAccounts,
                                  secondary: {
                                    ...newEmployee.salaryInfo.bankAccounts.secondary,
                                    accountType: e.target.value
                                  }
                                }
                              }
                            })}
                          >
                            <option value="">Select Account Type</option>
                            <option value="Savings">Savings</option>
                            <option value="Current">Current</option>
                            <option value="Salary">Salary</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* === Provident Fund & ESI === */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold fs-5 mb-3 text-muted border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:shield-check" />
                        </span>
                        Provident Fund & ESI
                      </h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">PF Account Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.salaryInfo.pfAccountNumber}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                          if (value.length <= 22) {
                            setNewEmployee({
                              ...newEmployee,
                              salaryInfo: { ...newEmployee.salaryInfo, pfAccountNumber: value }
                            });
                          }
                        }}
                        placeholder="PF123456789"
                        maxLength="22"
                      />
                      {newEmployee.salaryInfo.pfAccountNumber &&
                        (newEmployee.salaryInfo.pfAccountNumber.length < 10 ||
                          newEmployee.salaryInfo.pfAccountNumber.length > 22) && (
                          <div className="text-danger small mt-1">
                            PF Account number must be 10 to 22 characters
                          </div>
                        )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">UAN (Universal Account Number)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.salaryInfo.uan}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                          if (value.length <= 14) {
                            setNewEmployee({
                              ...newEmployee,
                              salaryInfo: { ...newEmployee.salaryInfo, uan: value }
                            });
                          }
                        }}
                        placeholder="123456789012"
                        maxLength="14"
                      />
                      {newEmployee.salaryInfo.uan &&
                        (newEmployee.salaryInfo.uan.length < 12 ||
                          newEmployee.salaryInfo.uan.length > 14) && (
                          <div className="text-danger small mt-1">
                            UAN must be 12 to 14 digits
                          </div>
                        )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">ESI Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.salaryInfo.esiNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                          if (value.length <= 10) {
                            setNewEmployee({
                              ...newEmployee,
                              salaryInfo: { ...newEmployee.salaryInfo, esiNumber: value }
                            });
                          }
                        }}
                        placeholder="ESI123456789"
                        maxLength="10"
                      />
                      {newEmployee.salaryInfo.esiNumber &&
                        newEmployee.salaryInfo.esiNumber.length !== 10 && (
                          <div className="text-danger small mt-1">
                            ESI number must be exactly 10 digits
                          </div>
                        )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">ESI Medical Nominee</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.salaryInfo.esiMedicalNominee}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          salaryInfo: { ...newEmployee.salaryInfo, esiMedicalNominee: e.target.value }
                        })}
                        placeholder="Nominee Name"
                      />
                    </div>

                    {/* === Tax & Benefits === */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:document-check" />
                        </span>
                        Tax & Benefits
                      </h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Tax Regime</label>
                      <select
                        className="form-select"
                        value={newEmployee.salaryInfo.taxDeclaration?.regime || ''}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          salaryInfo: {
                            ...newEmployee.salaryInfo,
                            taxDeclaration: {
                              ...newEmployee.salaryInfo.taxDeclaration,
                              regime: e.target.value
                            }
                          }
                        })}
                      >
                        <option value="">Select Tax Regime</option>
                        <option value="Old Regime">Old </option>
                        <option value="New Regime">New </option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Tax Declaration</label>
                      <select
                        className="form-select"
                        value={newEmployee.salaryInfo.taxDeclaration?.declared ? 'Yes' : 'No'}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          salaryInfo: {
                            ...newEmployee.salaryInfo,
                            taxDeclaration: {
                              ...newEmployee.salaryInfo.taxDeclaration,
                              declared: e.target.value === 'Yes'
                            }
                          }
                        })}
                      >
                        <option value="No">Not Declared</option>
                        <option value="Yes">Declared</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Variable Pay Percentage</label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          value={newEmployee.salaryInfo.variablePay?.percentage || ''}
                          onChange={(e) => {
                            const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                            setNewEmployee({
                              ...newEmployee,
                              salaryInfo: {
                                ...newEmployee.salaryInfo,
                                variablePay: {
                                  eligible: value > 0,
                                  percentage: value
                                }
                              }
                            });
                          }}
                          placeholder="Enter percentage (0-100)"
                          min="0"
                          max="100"
                          step="0.5"
                        />
                        <span className="input-group-text">%</span>
                      </div>
                      <small className="text-muted">
                        {newEmployee.salaryInfo.variablePay?.percentage > 0 ? (
                          <span className="text-success">
                            Eligible ({(newEmployee.salaryInfo.variablePay.percentage || 0)}%)
                          </span>
                        ) : (
                          <span className="text-secondary">Not eligible (0%)</span>
                        )}
                      </small>

                      {/* Show calculated amount based on CTC */}
                      {newEmployee.salaryInfo.currentCTC > 0 && newEmployee.salaryInfo.variablePay?.percentage > 0 && (
                        <div className="mt-2">
                          <small className="text-success">
                            Estimated Variable Pay: ₹{formatCurrency(
                              (newEmployee.salaryInfo.currentCTC * (newEmployee.salaryInfo.variablePay.percentage || 0)) / 100
                            )}
                          </small>
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Bonus Amount</label>
                      <div className="input-group">
                        <span className="input-group-text">₹</span>
                        <input
                          type="number"
                          className="form-control"
                          value={newEmployee.salaryInfo.bonusEligibility?.amount || ''}
                          onChange={(e) => {
                            const value = Math.max(0, parseInt(e.target.value) || 0);
                            setNewEmployee({
                              ...newEmployee,
                              salaryInfo: {
                                ...newEmployee.salaryInfo,
                                bonusEligibility: {
                                  eligible: value > 0,
                                  amount: value
                                }
                              }
                            });
                          }}
                          placeholder="Enter bonus amount"
                          min="0"
                          step="1000"
                        />
                      </div>
                      <small className="text-muted">
                        {newEmployee.salaryInfo.bonusEligibility?.amount > 0 ? (
                          <span className="text-success">
                            Eligible (₹{formatCurrency(newEmployee.salaryInfo.bonusEligibility.amount || 0)})
                          </span>
                        ) : (
                          <span className="text-secondary">Not eligible (₹0)</span>
                        )}
                      </small>

                      {/* Show bonus as percentage of CTC */}
                      {newEmployee.salaryInfo.currentCTC > 0 && newEmployee.salaryInfo.bonusEligibility?.amount > 0 && (
                        <div className="mt-2">
                          <small className="text-success">
                            Bonus as % of CTC: {(
                              ((newEmployee.salaryInfo.bonusEligibility.amount || 0) / newEmployee.salaryInfo.currentCTC) * 100
                            ).toFixed(2)}%
                          </small>
                        </div>
                      )}
                    </div>

                    {/* === Salary Revision History === */}
                    <div className="col-12 mt-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold fs-5 text-muted d-flex align-items-center gap-2 mb-0">
                          <span className="text-primary">
                            <Icon icon="heroicons:chart-bar" />
                          </span>
                          Salary Revision History
                        </h6>
                        <button
                          type="button"
                          className="create-job-btn"
                          onClick={() => {
                            // Get current salary from job history
                            const jobHistoryEntries = newEmployee.jobHistory || [];
                            const salaryHistoryEntries = jobHistoryEntries
                              .filter(entry => entry.salaryChange && parseInt(entry.salaryChange) > 0)
                              .sort((a, b) => new Date(b.date) - new Date(a.date));

                            const previousSalary = salaryHistoryEntries.length > 0
                              ? parseInt(salaryHistoryEntries[0].salaryChange)
                              : (newEmployee.salaryInfo.currentCTC || newEmployee.salary || 0);

                            // Calculate percentage increase from current CTC
                            const currentCTC = newEmployee.salaryInfo.currentCTC || newEmployee.salary || 0;
                            const percentageIncrease = previousSalary > 0
                              ? Math.round(((currentCTC - previousSalary) / previousSalary) * 100)
                              : 0;

                            const newRevision = {
                              id: Date.now(),
                              effectiveDate: new Date().toISOString().split("T")[0],
                              previousCTC: previousSalary,
                              newCTC: currentCTC,
                              percentageIncrease: percentageIncrease,
                              approvedBy: "",
                              status: "Pending",
                              isEditing: true
                            };

                            setNewEmployee({
                              ...newEmployee,
                              salaryInfo: {
                                ...newEmployee.salaryInfo,
                                salaryRevisionHistory: [
                                  ...(newEmployee.salaryInfo.salaryRevisionHistory || []),
                                  newRevision
                                ]
                              }
                            });
                          }}
                        >
                          <Icon icon="heroicons:plus" className="me-1" />
                          Add Salary Revision
                        </button>
                      </div>

                      {/* Salary Revision Cards */}
                      <div className="col-12">
                        {newEmployee.salaryInfo.salaryRevisionHistory && newEmployee.salaryInfo.salaryRevisionHistory.length > 0 ? (
                          newEmployee.salaryInfo.salaryRevisionHistory.map((revision, idx) => (
                            <div key={revision.id} className="card border mb-3">
                              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                  <span className="text-muted">{formatDate(revision.effectiveDate)}</span>
                                  <span className={`badge ${revision.status === 'Approved' ? 'bg-success' :
                                      revision.status === 'Rejected' ? 'bg-danger' :
                                        'bg-warning'
                                    }`}>
                                    {revision.status}
                                  </span>
                                </div>
                                <div className="d-flex gap-1">
                                  {revision.isEditing ? (
                                    <>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-success"
                                        onClick={() => {
                                          const updatedRevisions = [...newEmployee.salaryInfo.salaryRevisionHistory];
                                          updatedRevisions[idx] = { ...revision, isEditing: false };
                                          setNewEmployee({
                                            ...newEmployee,
                                            salaryInfo: {
                                              ...newEmployee.salaryInfo,
                                              salaryRevisionHistory: updatedRevisions
                                            }
                                          });
                                        }}
                                        title="Save"
                                      >
                                        <Icon icon="heroicons:check" />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => {
                                          const updatedRevisions = [...newEmployee.salaryInfo.salaryRevisionHistory];
                                          updatedRevisions[idx] = { ...revision, isEditing: false };
                                          setNewEmployee({
                                            ...newEmployee,
                                            salaryInfo: {
                                              ...newEmployee.salaryInfo,
                                              salaryRevisionHistory: updatedRevisions
                                            }
                                          });
                                        }}
                                        title="Cancel"
                                      >
                                        <Icon icon="heroicons:x-mark" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => {
                                          const updatedRevisions = [...newEmployee.salaryInfo.salaryRevisionHistory];
                                          updatedRevisions[idx] = { ...revision, isEditing: true };
                                          setNewEmployee({
                                            ...newEmployee,
                                            salaryInfo: {
                                              ...newEmployee.salaryInfo,
                                              salaryRevisionHistory: updatedRevisions
                                            }
                                          });
                                        }}
                                        title="Edit"
                                      >
                                        <Icon icon="heroicons:pencil" />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => {
                                          if (window.confirm('Are you sure you want to delete this salary revision entry?')) {
                                            const updatedRevisions = newEmployee.salaryInfo.salaryRevisionHistory.filter((_, i) => i !== idx);
                                            setNewEmployee({
                                              ...newEmployee,
                                              salaryInfo: {
                                                ...newEmployee.salaryInfo,
                                                salaryRevisionHistory: updatedRevisions
                                              }
                                            });
                                          }
                                        }}
                                        title="Delete"
                                      >
                                        <Icon icon="heroicons:trash" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="card-body">
                                {revision.isEditing ? (
                                  <div className="row g-3">
                                    {/* Row 1: Effective Date and Status */}
                                    <div className="col-md-6">
                                      <label className="form-label fw-bold small">Effective Date</label>
                                      <input
                                        type="date"
                                        className="form-control"
                                        value={revision.effectiveDate}
                                        onChange={(e) => {
                                          const updatedRevisions = [...newEmployee.salaryInfo.salaryRevisionHistory];
                                          updatedRevisions[idx] = { ...revision, effectiveDate: e.target.value };
                                          setNewEmployee({
                                            ...newEmployee,
                                            salaryInfo: {
                                              ...newEmployee.salaryInfo,
                                              salaryRevisionHistory: updatedRevisions
                                            }
                                          });
                                        }}
                                      />
                                    </div>
                                    <div className="col-md-6">
                                      <label className="form-label fw-bold small">Status</label>
                                      <select
                                        className="form-select"
                                        value={revision.status}
                                        onChange={(e) => {
                                          const updatedRevisions = [...newEmployee.salaryInfo.salaryRevisionHistory];
                                          updatedRevisions[idx] = { ...revision, status: e.target.value };
                                          setNewEmployee({
                                            ...newEmployee,
                                            salaryInfo: {
                                              ...newEmployee.salaryInfo,
                                              salaryRevisionHistory: updatedRevisions
                                            }
                                          });
                                        }}
                                      >
                                        <option value="Pending">Pending</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                      </select>
                                    </div>

                                    {/* Row 2: Previous CTC and New CTC */}
                                    <div className="col-md-6">
                                      <label className="form-label fw-bold small">Previous CTC</label>
                                      <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <input
                                          type="number"
                                          className="form-control"
                                          value={revision.previousCTC}
                                          onChange={(e) => {
                                            const prevCTC = parseInt(e.target.value) || 0;
                                            const updatedRevisions = [...newEmployee.salaryInfo.salaryRevisionHistory];
                                            const percentageIncrease = revision.newCTC > 0
                                              ? Math.round(((revision.newCTC - prevCTC) / prevCTC) * 100)
                                              : 0;
                                            updatedRevisions[idx] = {
                                              ...revision,
                                              previousCTC: prevCTC,
                                              percentageIncrease
                                            };
                                            setNewEmployee({
                                              ...newEmployee,
                                              salaryInfo: {
                                                ...newEmployee.salaryInfo,
                                                salaryRevisionHistory: updatedRevisions
                                              }
                                            });
                                          }}
                                          placeholder="Previous salary"
                                          min="0"
                                        />
                                      </div>
                                    </div>
                                    <div className="col-md-6">
                                      <label className="form-label fw-bold small">New CTC</label>
                                      <div className="input-group">
                                        <input
                                          type="number"
                                          className="form-control"
                                          value={revision.newCTC}
                                          onChange={(e) => {
                                            const newCTC = parseInt(e.target.value) || 0;
                                            const updatedRevisions = [...newEmployee.salaryInfo.salaryRevisionHistory];
                                            const percentageIncrease = revision.previousCTC > 0
                                              ? Math.round(((newCTC - revision.previousCTC) / revision.previousCTC) * 100)
                                              : 0;
                                            updatedRevisions[idx] = {
                                              ...revision,
                                              newCTC: newCTC,
                                              percentageIncrease
                                            };
                                            setNewEmployee({
                                              ...newEmployee,
                                              salaryInfo: {
                                                ...newEmployee.salaryInfo,
                                                salaryRevisionHistory: updatedRevisions
                                              }
                                            });
                                          }}
                                          placeholder="New salary"
                                          min="0"
                                        />
                                      </div>
                                    </div>

                                    {/* Row 3: Percentage Increase and Approved By */}
                                    <div className="col-md-6">
                                      <label className="form-label fw-bold small">Percentage Increase</label>
                                      <div className="input-group">
                                        <input
                                          type="number"
                                          className="form-control"
                                          value={revision.percentageIncrease}
                                          onChange={(e) => {
                                            const percentage = parseInt(e.target.value) || 0;
                                            const updatedRevisions = [...newEmployee.salaryInfo.salaryRevisionHistory];
                                            const newCTC = revision.previousCTC + (revision.previousCTC * percentage / 100);
                                            updatedRevisions[idx] = {
                                              ...revision,
                                              percentageIncrease: percentage,
                                              newCTC: Math.round(newCTC)
                                            };
                                            setNewEmployee({
                                              ...newEmployee,
                                              salaryInfo: {
                                                ...newEmployee.salaryInfo,
                                                salaryRevisionHistory: updatedRevisions
                                              }
                                            });
                                          }}
                                          placeholder="Percentage"
                                          min="0"
                                        />
                                        <span className="input-group-text">%</span>
                                      </div>
                                    </div>
                                    <div className="col-md-6">
                                      <label className="form-label fw-bold small">Approved By</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={revision.approvedBy}
                                        onChange={(e) => {
                                          const updatedRevisions = [...newEmployee.salaryInfo.salaryRevisionHistory];
                                          updatedRevisions[idx] = { ...revision, approvedBy: e.target.value };
                                          setNewEmployee({
                                            ...newEmployee,
                                            salaryInfo: {
                                              ...newEmployee.salaryInfo,
                                              salaryRevisionHistory: updatedRevisions
                                            }
                                          });
                                        }}
                                        placeholder="Approver name"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="row">
                                    {/* Read-only display */}
                                    <div className="col-md-6 mb-2">
                                      <div className="d-flex">
                                        <strong className="text-muted me-2" style={{ minWidth: '120px' }}>Effective Date:</strong>
                                        <span>{formatDate(revision.effectiveDate)}</span>
                                      </div>
                                    </div>
                                    <div className="col-md-6 mb-2">
                                      <div className="d-flex">
                                        <strong className="text-muted me-2" style={{ minWidth: '120px' }}>Status:</strong>
                                        <span className={`badge ${revision.status === 'Approved' ? 'bg-success' :
                                            revision.status === 'Rejected' ? 'bg-danger' :
                                              'bg-warning'
                                          }`}>
                                          {revision.status}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="col-md-6 mb-2">
                                      <div className="d-flex">
                                        <strong className="text-muted me-2" style={{ minWidth: '120px' }}>Previous CTC:</strong>
                                        <span>₹{formatCurrency(revision.previousCTC)}</span>
                                      </div>
                                    </div>
                                    <div className="col-md-6 mb-2">
                                      <div className="d-flex">
                                        <strong className="text-muted me-2" style={{ minWidth: '120px' }}>New CTC:</strong>
                                        <span className="fw-bold text-success">₹{formatCurrency(revision.newCTC)}</span>
                                      </div>
                                    </div>

                                    <div className="col-md-6 mb-2">
                                      <div className="d-flex">
                                        <strong className="text-muted me-2" style={{ minWidth: '120px' }}>Percentage Increase:</strong>
                                        <span className={`fw-bold ${revision.percentageIncrease >= 0 ? 'text-success' : 'text-danger'}`}>
                                          {revision.percentageIncrease > 0 ? '+' : ''}{revision.percentageIncrease}%
                                        </span>
                                      </div>
                                    </div>
                                    <div className="col-md-6 mb-2">
                                      <div className="d-flex">
                                        <strong className="text-muted me-2" style={{ minWidth: '120px' }}>Approved By:</strong>
                                        <span>{revision.approvedBy || 'Not specified'}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="alert alert-light border d-flex align-items-center gap-2">
                            <Icon icon="heroicons:information-circle" className="me-2 text-muted" />
                            No salary revision history added. Click "Add Salary Revision" to add one.
                          </div>
                        )}
                      </div>

                      {/* Summary Table View */}
                      {newEmployee.salaryInfo.salaryRevisionHistory && newEmployee.salaryInfo.salaryRevisionHistory.length > 0 && (
                        <div className="col-12 mt-4">
                          <h6 className="fw-bold mb-3 text-muted border-bottom pb-2 d-flex align-items-center gap-2">
                            <Icon icon="heroicons:table-cells" className="me-2" />
                            Salary Revision Summary Table
                          </h6>
                          <div className="table-responsive">
                            <table className="table table-sm table-bordered">
                              <thead className="bg-light">
                                <tr>
                                  <th className="text-muted">Effective Date</th>
                                  <th className="text-muted">Previous CTC</th>
                                  <th className="text-muted">New CTC</th>
                                  <th className="text-muted">Percentage Increase</th>
                                  <th className="text-muted">Approved By</th>
                                  <th className="text-muted">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {newEmployee.salaryInfo.salaryRevisionHistory.map((revision) => (
                                  <tr key={revision.id}>
                                    <td>{formatDate(revision.effectiveDate)}</td>
                                    <td>{formatCurrency(revision.previousCTC)}</td>
                                    <td>{formatCurrency(revision.newCTC)}</td>
                                    <td>
                                      <span className={`badge ${revision.percentageIncrease >= 0 ? 'bg-success' : 'bg-danger'}`}>
                                        {revision.percentageIncrease > 0 ? '+' : ''}{revision.percentageIncrease}%
                                      </span>
                                    </td>
                                    <td>{revision.approvedBy || '-'}</td>
                                    <td>
                                      <span className={`badge ${revision.status === 'Approved' ? 'bg-success' :
                                          revision.status === 'Rejected' ? 'bg-danger' :
                                            'bg-warning'
                                        }`}>
                                        {revision.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* Statutory & Compliance Tab */}

                {/* Statutory & Compliance Tab */}
                {activeAddTab === 'statutory' && (
                  <div className="row g-3">
                    {/* Note Section */}
                    <div className="col-12 mb-3">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:shield-check" />
                        </span>
                        Statutory & Compliance Information
                      </h6>
                    </div>

                    {/* === PAN Card Details === */}
                    <div className="col-12">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:credit-card" />
                        </span>
                        PAN Card Details
                      </h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">PAN Number <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control text-uppercase"
                        value={newEmployee.personalInfo.identification.pan.number}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                          if (value.length <= 10) {
                            setNewEmployee({
                              ...newEmployee,
                              personalInfo: {
                                ...newEmployee.personalInfo,
                                identification: {
                                  ...newEmployee.personalInfo.identification,
                                  pan: { ...newEmployee.personalInfo.identification.pan, number: value }
                                }
                              }
                            });
                          }
                        }}
                        placeholder="ABCDE1234F"
                        maxLength="10"
                        required
                      />
                    </div>


                    <div className="col-md-6">
                      <label className="form-label fw-bold">PAN Verified</label>
                      <select
                        className="form-select"
                        value={newEmployee.statutoryInfo.pan.verified}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          statutoryInfo: {
                            ...newEmployee.statutoryInfo,
                            pan: { ...newEmployee.statutoryInfo.pan, verified: e.target.value === 'true' }
                          }
                        })}
                      >
                        <option value={false}>Not Verified</option>
                        <option value={true}>Verified</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">PAN Verification Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newEmployee.statutoryInfo.pan.verifiedDate}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          statutoryInfo: {
                            ...newEmployee.statutoryInfo,
                            pan: { ...newEmployee.statutoryInfo.pan, verifiedDate: e.target.value }
                          }
                        })}
                      />
                    </div>

                    {/* === Aadhaar Card Details === */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:identification" />
                        </span>
                        Aadhaar Card Details
                      </h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Aadhaar Number <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={newEmployee.personalInfo.identification.aadhaar.number}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 12) {
                            setNewEmployee({
                              ...newEmployee,
                              personalInfo: {
                                ...newEmployee.personalInfo,
                                identification: {
                                  ...newEmployee.personalInfo.identification,
                                  aadhaar: { ...newEmployee.personalInfo.identification.aadhaar, number: value }
                                }
                              }
                            });
                          }
                        }}
                        placeholder="123456789012"
                        maxLength="12"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Aadhaar Verified</label>
                      <select
                        className="form-select"
                        value={newEmployee.statutoryInfo.aadhaar.verified}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          statutoryInfo: {
                            ...newEmployee.statutoryInfo,
                            aadhaar: { ...newEmployee.statutoryInfo.aadhaar, verified: e.target.value === 'true' }
                          }
                        })}
                      >
                        <option value={false}>Not Verified</option>
                        <option value={true}>Verified</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Aadhaar Verification Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newEmployee.statutoryInfo.aadhaar.verifiedDate}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          statutoryInfo: {
                            ...newEmployee.statutoryInfo,
                            aadhaar: { ...newEmployee.statutoryInfo.aadhaar, verifiedDate: e.target.value }
                          }
                        })}
                      />
                    </div>

                    {/* === Provident Fund Membership === */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:banknotes" />
                        </span>
                        Provident Fund Membership
                      </h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">PF Enrolled</label>
                      <select
                        className="form-select"
                        value={newEmployee.statutoryInfo.pfMembership.enrolled}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          statutoryInfo: {
                            ...newEmployee.statutoryInfo,
                            pfMembership: {
                              ...newEmployee.statutoryInfo.pfMembership,
                              enrolled: e.target.value === 'true',
                              accountNumber: e.target.value === 'false' ? '' : newEmployee.statutoryInfo.pfMembership.accountNumber,
                              uan: e.target.value === 'false' ? '' : newEmployee.statutoryInfo.pfMembership.uan
                            }
                          }
                        })}
                      >
                        <option value={false}>No</option>
                        <option value={true}>Yes</option>
                      </select>
                    </div>

                    {newEmployee.statutoryInfo.pfMembership.enrolled && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">PF Account Number</label>
                          <input
                            type="text"
                            className="form-control"
                            value={newEmployee.salaryInfo.pfAccountNumber}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                              if (value.length <= 22) {
                                setNewEmployee({
                                  ...newEmployee,
                                  salaryInfo: { ...newEmployee.salaryInfo, pfAccountNumber: value }
                                });
                              }
                            }}
                            placeholder="PF123456789"
                            maxLength="22"
                          />
                          {newEmployee.salaryInfo.pfAccountNumber &&
                            (newEmployee.salaryInfo.pfAccountNumber.length < 10 ||
                              newEmployee.salaryInfo.pfAccountNumber.length > 22) && (
                              <div className="text-danger small mt-1">
                                PF Account number must be 10 to 22 characters
                              </div>
                            )}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-bold">UAN (Universal Account Number)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={newEmployee.salaryInfo.uan}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                              if (value.length <= 14) {
                                setNewEmployee({
                                  ...newEmployee,
                                  salaryInfo: { ...newEmployee.salaryInfo, uan: value }
                                });
                              }
                            }}
                            placeholder="123456789012"
                            maxLength="14"
                          />
                          {newEmployee.salaryInfo.uan &&
                            (newEmployee.salaryInfo.uan.length < 12 ||
                              newEmployee.salaryInfo.uan.length > 14) && (
                              <div className="text-danger small mt-1">
                                UAN must be 12 to 14 digits
                              </div>
                            )}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-bold">PF Enrollment Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={newEmployee.statutoryInfo.pfMembership.enrollmentDate}
                            onChange={(e) => setNewEmployee({
                              ...newEmployee,
                              statutoryInfo: {
                                ...newEmployee.statutoryInfo,
                                pfMembership: { ...newEmployee.statutoryInfo.pfMembership, enrollmentDate: e.target.value }
                              }
                            })}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-bold">PF Account Type</label>
                          <select
                            className="form-select"
                            value={newEmployee.statutoryInfo.pfMembership.accountType}
                            onChange={(e) => setNewEmployee({
                              ...newEmployee,
                              statutoryInfo: {
                                ...newEmployee.statutoryInfo,
                                pfMembership: { ...newEmployee.statutoryInfo.pfMembership, accountType: e.target.value }
                              }
                            })}
                          >
                            <option value="Regular">Regular</option>
                            <option value="Exempted">Exempted</option>
                            <option value="Voluntary">Voluntary</option>
                            <option value="International Worker">International Worker</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* === ESI Registration === */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:heart" />
                        </span>
                        ESI Registration
                      </h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">ESI Enrolled</label>
                      <select
                        className="form-select"
                        value={newEmployee.statutoryInfo.esiRegistration.enrolled}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          statutoryInfo: {
                            ...newEmployee.statutoryInfo,
                            esiRegistration: {
                              ...newEmployee.statutoryInfo.esiRegistration,
                              enrolled: e.target.value === 'true',
                              number: e.target.value === 'false' ? '' : newEmployee.statutoryInfo.esiRegistration.number
                            }
                          }
                        })}
                      >
                        <option value={false}>No</option>
                        <option value={true}>Yes</option>
                      </select>
                    </div>

                    {newEmployee.statutoryInfo.esiRegistration.enrolled && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">ESI Number</label>
                          <input
                            type="text"
                            className="form-control"
                            value={newEmployee.salaryInfo.esiNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                              if (value.length <= 10) {
                                setNewEmployee({
                                  ...newEmployee,
                                  salaryInfo: { ...newEmployee.salaryInfo, esiNumber: value }
                                });
                              }
                            }}
                            placeholder="ESI123456789"
                            maxLength="10"
                          />
                          {newEmployee.salaryInfo.esiNumber &&
                            newEmployee.salaryInfo.esiNumber.length !== 10 && (
                              <div className="text-danger small mt-1">
                                ESI number must be exactly 10 digits
                              </div>
                            )}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-bold">ESI Enrollment Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={newEmployee.statutoryInfo.esiRegistration.enrollmentDate}
                            onChange={(e) => setNewEmployee({
                              ...newEmployee,
                              statutoryInfo: {
                                ...newEmployee.statutoryInfo,
                                esiRegistration: { ...newEmployee.statutoryInfo.esiRegistration, enrollmentDate: e.target.value }
                              }
                            })}
                          />
                        </div>
                      </>
                    )}

                    {/* === Professional Tax === */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:document-text" />
                        </span>
                        Professional Tax
                      </h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Professional Tax Applicable</label>
                      <select
                        className="form-select"
                        value={newEmployee.statutoryInfo.professionalTax.applicable}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          statutoryInfo: {
                            ...newEmployee.statutoryInfo,
                            professionalTax: {
                              ...newEmployee.statutoryInfo.professionalTax,
                              applicable: e.target.value === 'true',
                              state: e.target.value === 'false' ? '' : newEmployee.statutoryInfo.professionalTax.state,
                              ptNumber: e.target.value === 'false' ? '' : newEmployee.statutoryInfo.professionalTax.ptNumber
                            }
                          }
                        })}
                      >
                        <option value={false}>No</option>
                        <option value={true}>Yes</option>
                      </select>
                    </div>

                    {newEmployee.statutoryInfo.professionalTax.applicable && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">State</label>
                          <select
                            className="form-select"
                            value={newEmployee.statutoryInfo.professionalTax.state}
                            onChange={(e) => setNewEmployee({
                              ...newEmployee,
                              statutoryInfo: {
                                ...newEmployee.statutoryInfo,
                                professionalTax: { ...newEmployee.statutoryInfo.professionalTax, state: e.target.value }
                              }
                            })}
                          >
                            <option value="">Select State</option>
                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                            <option value="Telangana">Telangana</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Delhi">Delhi</option>
                            <option value="West Bengal">West Bengal</option>
                          </select>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-bold">PT Number</label>
                          <input
                            type="text"
                            className="form-control"
                            value={newEmployee.statutoryInfo.professionalTax.ptNumber}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase();
                              // Basic validation: alphanumeric, 8-12 characters, no special chars except hyphens
                              if (/^[A-Z0-9-]{0,12}$/.test(value)) {
                                setNewEmployee({
                                  ...newEmployee,
                                  statutoryInfo: {
                                    ...newEmployee.statutoryInfo,
                                    professionalTax: {
                                      ...newEmployee.statutoryInfo.professionalTax,
                                      ptNumber: value
                                    }
                                  }
                                });
                              }
                            }}
                            placeholder="PT12345678"
                            maxLength="12"
                          />  {newEmployee.statutoryInfo.professionalTax.ptNumber &&
                            !/^[A-Z0-9-]{8,12}$/.test(newEmployee.statutoryInfo.professionalTax.ptNumber) && (
                              <div className="text-danger small mt-1">
                                PT Number must be 8 to 12 alphanumeric characters
                              </div>
                            )}

                        </div>

                      </>
                    )}

                    {/* === Labour Welfare Fund === */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:users" />
                        </span>
                        Labour Welfare Fund
                      </h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Labour Welfare Fund Enrolled</label>
                      <select
                        className="form-select"
                        value={newEmployee.statutoryInfo.labourWelfareFund.enrolled}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          statutoryInfo: {
                            ...newEmployee.statutoryInfo,
                            labourWelfareFund: {
                              ...newEmployee.statutoryInfo.labourWelfareFund,
                              enrolled: e.target.value === 'true',
                              enrollmentDate: e.target.value === 'false' ? '' : newEmployee.statutoryInfo.labourWelfareFund.enrollmentDate
                            }
                          }
                        })}
                      >
                        <option value={false}>No</option>
                        <option value={true}>Yes</option>
                      </select>
                    </div>

                    {newEmployee.statutoryInfo.labourWelfareFund.enrolled && (
                      <div className="col-md-6">
                        <label className="form-label fw-bold">Enrollment Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={newEmployee.statutoryInfo.labourWelfareFund.enrollmentDate}
                          onChange={(e) => setNewEmployee({
                            ...newEmployee,
                            statutoryInfo: {
                              ...newEmployee.statutoryInfo,
                              labourWelfareFund: { ...newEmployee.statutoryInfo.labourWelfareFund, enrollmentDate: e.target.value }
                            }
                          })}
                        />
                      </div>
                    )}

                    {/* === Gratuity === */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:gift" />
                        </span>
                        Gratuity
                      </h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Gratuity Eligible</label>
                      <select
                        className="form-select"
                        value={newEmployee.statutoryInfo.gratuity.eligible}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          statutoryInfo: {
                            ...newEmployee.statutoryInfo,
                            gratuity: {
                              ...newEmployee.statutoryInfo.gratuity,
                              eligible: e.target.value === 'true',
                              eligibilityDate: e.target.value === 'false' ? '' : newEmployee.statutoryInfo.gratuity.eligibilityDate
                            }
                          }
                        })}
                      >
                        <option value={false}>No</option>
                        <option value={true}>Yes</option>
                      </select>
                    </div>

                    {newEmployee.statutoryInfo.gratuity.eligible && (
                      <div className="col-md-6">
                        <label className="form-label fw-bold">Eligibility Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={newEmployee.statutoryInfo.gratuity.eligibilityDate}
                          onChange={(e) => setNewEmployee({
                            ...newEmployee,
                            statutoryInfo: {
                              ...newEmployee.statutoryInfo,
                              gratuity: { ...newEmployee.statutoryInfo.gratuity, eligibilityDate: e.target.value }
                            }
                          })}
                        />
                      </div>
                    )}

                    {/* === Bonus Act === */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:currency-rupee" />
                        </span>
                        Bonus Act
                      </h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Bonus Act Applicable</label>
                      <select
                        className="form-select"
                        value={newEmployee.statutoryInfo.bonusAct.applicable}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          statutoryInfo: {
                            ...newEmployee.statutoryInfo,
                            bonusAct: { ...newEmployee.statutoryInfo.bonusAct, applicable: e.target.value === 'true' }
                          }
                        })}
                      >
                        <option value={false}>No</option>
                        <option value={true}>Yes</option>
                      </select>
                    </div>

                    {/* === Shops and Establishment Act === */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:building-office" />
                        </span>
                        Shops and Establishment Act
                      </h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Registered</label>
                      <select
                        className="form-select"
                        value={newEmployee.statutoryInfo.shopsAndEstablishment.registered}
                        onChange={(e) => setNewEmployee({
                          ...newEmployee,
                          statutoryInfo: {
                            ...newEmployee.statutoryInfo,
                            shopsAndEstablishment: {
                              ...newEmployee.statutoryInfo.shopsAndEstablishment,
                              registered: e.target.value === 'true',
                              registrationNumber: e.target.value === 'false' ? '' : newEmployee.statutoryInfo.shopsAndEstablishment.registrationNumber,
                              registrationDate: e.target.value === 'false' ? '' : newEmployee.statutoryInfo.shopsAndEstablishment.registrationDate
                            }
                          }
                        })}
                      >
                        <option value={false}>No</option>
                        <option value={true}>Yes</option>
                      </select>
                    </div>

                    {newEmployee.statutoryInfo.shopsAndEstablishment.registered && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Registration Number</label>

                          <input
                            type="text"
                            className="form-control"
                            value={newEmployee.statutoryInfo?.shopsAndEstablishment?.registrationNumber || ''}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase();

                              if (value.length <= 15 && /^[A-Z0-9-]*$/.test(value)) {
                                setNewEmployee({
                                  ...newEmployee,
                                  statutoryInfo: {
                                    ...newEmployee.statutoryInfo,
                                    shopsAndEstablishment: {
                                      ...newEmployee.statutoryInfo.shopsAndEstablishment,
                                      registrationNumber: value
                                    }
                                  }
                                });
                              }
                            }}
                            placeholder="Registration number"
                            maxLength="15"
                          />

                          {newEmployee.statutoryInfo?.shopsAndEstablishment?.registrationNumber &&
                            !/^[A-Z0-9-]{5,15}$/.test(
                              newEmployee.statutoryInfo.shopsAndEstablishment.registrationNumber
                            ) && (
                              <div className="text-danger small mt-1">
                                Registration number must be 5 to 15 characters, alphanumeric or hyphens only
                              </div>
                            )}
                        </div>


                        <div className="col-md-6">
                          <label className="form-label fw-bold">Registration Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={newEmployee.statutoryInfo.shopsAndEstablishment.registrationDate}
                            onChange={(e) => setNewEmployee({
                              ...newEmployee,
                              statutoryInfo: {
                                ...newEmployee.statutoryInfo,
                                shopsAndEstablishment: { ...newEmployee.statutoryInfo.shopsAndEstablishment, registrationDate: e.target.value }
                              }
                            })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
            <button
              type="button"
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              onClick={() => {
                setShowAddModal(false);
                setActiveAddTab('personal');
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center"
              onClick={handleAddEmployee}
              disabled={!newEmployee.name || !newEmployee.email || !newEmployee.employmentInfo.designation || !newEmployee.salary}
            >
              <Icon icon="heroicons:user-plus" className="mr-2" />
              Add Employee
            </button>
          </div>

    </Modal >
  );
};

export default AddEmployeeModal;
