import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import Modal from '../../../shared/components/Modal';
import { BASE_URL } from '../../../shared/constants/api.config';

const authHeader = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const EditEmployeeModal = ({
  showEditModal,
  editEmployeeData,
  handleCancelEdit,
  activeEditTab,
  setActiveEditTab,
  handleEditInputChange,
  handleEditEmployee,
  formatDate,
  formatCurrency
}) => {
  // Branches (company locations/offices) for the Location dropdown — loaded once on mount.
  // Declared before the early-return below so hook order stays stable across renders.
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

  if (!editEmployeeData) return null;

  return (
    <Modal
      isOpen={showEditModal}
      onClose={handleCancelEdit}
      title={<div className="flex items-center gap-2"><Icon icon="heroicons:pencil-square" /> Edit Employee: {editEmployeeData?.name}</div>}
      size="2xl"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          {/* Tab Navigation */}
          <ul className="nav nav-tabs border-bottom px-3 pt-3" style={{ flexShrink: 0 }}>
            <li className="nav-item">
              <button
                className={`nav-link d-flex align-items-center gap-2 ${activeEditTab === 'personal' ? 'active' : ''}`}
                onClick={() => setActiveEditTab('personal')}
              >
                <Icon icon="heroicons:user-circle" />
                Personal Info
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link d-flex align-items-center gap-2 ${activeEditTab === 'employment' ? 'active' : ''}`}
                onClick={() => setActiveEditTab('employment')}
              >
                <Icon icon="heroicons:briefcase" />
                Employment
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link d-flex align-items-center gap-2 ${activeEditTab === 'jobHistory' ? 'active' : ''}`}
                onClick={() => setActiveEditTab('jobHistory')}
              >
                <Icon icon="heroicons:clock" />
                Service History
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link d-flex align-items-center gap-2 ${activeEditTab === 'salary' ? 'active' : ''}`}
                onClick={() => setActiveEditTab('salary')}
              >
                <Icon icon="heroicons:currency-dollar" />
                Salary & Compensation
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link d-flex align-items-center gap-2 ${activeEditTab === 'statutory' ? 'active' : ''}`}
                onClick={() => setActiveEditTab('statutory')}
              >
                <Icon icon="heroicons:document-check" />
                Statutory & Compliance
              </button>
            </li>
          </ul>

          {/* Tab Content - REUSING YOUR EXISTING FORM STRUCTURE */}
          <div className="p-4" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>

            {/* Personal Information Tab - Modified for Edit */}
            {activeEditTab === 'personal' && (
              <div className="row g-3">
                {/* Profile Photo Upload - Added from add field */}
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold">Profile Photo</label>
                  <div className="d-flex align-items-center gap-3">
                    <div className="position-relative">
                      {editEmployeeData.personalInfo?.profilePhoto ? (
                        <img
                          src={editEmployeeData.personalInfo.profilePhoto}
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
                            if (file.size > 5 * 1024 * 1024) {
                              alert("File size must be less than 5MB");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              handleEditInputChange('profilePhoto', reader.result, 'personalInfo.profilePhoto');
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
                  <label className="form-label fw-bold">Full Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.name || ''}
                    onChange={(e) => handleEditInputChange('name', e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Date of Birth</label>
                  <input
                    type="date"
                    className="form-control"
                    value={editEmployeeData.personalInfo?.dateOfBirth || ''}
                    onChange={(e) => handleEditInputChange('dateOfBirth', e.target.value, 'personalInfo.dateOfBirth')}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold">Gender</label>
                  <select
                    className="form-select"
                    value={editEmployeeData.personalInfo?.gender || ''}
                    onChange={(e) => handleEditInputChange('gender', e.target.value, 'personalInfo.gender')}
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
                    value={editEmployeeData.personalInfo?.bloodGroup || ''}
                    onChange={(e) => handleEditInputChange('bloodGroup', e.target.value, 'personalInfo.bloodGroup')}
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
                    value={editEmployeeData.personalInfo?.maritalStatus || ''}
                    onChange={(e) => handleEditInputChange('maritalStatus', e.target.value, 'personalInfo.maritalStatus')}
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
                    value={editEmployeeData.personalInfo?.nationality || ''}
                    onChange={(e) => handleEditInputChange('nationality', e.target.value, 'personalInfo.nationality')}
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
                      id="editLanguageInput"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          e.preventDefault();
                          const newLanguage = e.target.value.trim();
                          const currentLanguages = editEmployeeData.personalInfo?.languages || [];
                          if (!currentLanguages.includes(newLanguage)) {
                            handleEditInputChange('languages', [...currentLanguages, newLanguage], 'personalInfo.languages');
                          }
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="job-listings-btn"
                      onClick={() => {
                        const input = document.getElementById('editLanguageInput');
                        const newLanguage = input.value.trim();
                        const currentLanguages = editEmployeeData.personalInfo?.languages || [];
                        if (newLanguage && !currentLanguages.includes(newLanguage)) {
                          handleEditInputChange('languages', [...currentLanguages, newLanguage], 'personalInfo.languages');
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {(editEmployeeData.personalInfo?.languages || []).map((language, index) => (
                      <div key={index} className="badge bg-primary d-flex align-items-center gap-1">
                        {language}
                        <button
                          type="button"
                          className="btn-close btn-close-white btn-sm"
                          onClick={() => {
                            const currentLanguages = editEmployeeData.personalInfo?.languages || [];
                            const updatedLanguages = currentLanguages.filter((_, i) => i !== index);
                            handleEditInputChange('languages', updatedLanguages, 'personalInfo.languages');
                          }}
                        ></button>
                      </div>
                    ))}
                  </div>
                  {(!editEmployeeData.personalInfo?.languages || editEmployeeData.personalInfo.languages.length === 0) && (
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
                  <label className="form-label fw-bold">Email <span className="text-danger">*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    value={editEmployeeData.employmentInfo?.workEmail || editEmployeeData.email || ''}
                    onChange={(e) => {
                      handleEditInputChange('workEmail', e.target.value, 'employmentInfo.workEmail');
                      handleEditInputChange('email', e.target.value);
                    }}
                    placeholder="employee@company.com"
                    required
                  />
                </div>




                <div className="col-md-6">
                  <label className="form-label fw-bold">Primary Phone <span className="text-danger">*</span></label>
                  <input
                    type="tel"
                    className="form-control"
                    value={editEmployeeData.phone || editEmployeeData.personalInfo?.phonePrimary || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        handleEditInputChange('phone', value);
                        handleEditInputChange('phonePrimary', value, 'personalInfo.phonePrimary');
                      }
                    }}
                    placeholder="Enter 10-digit phone number"
                    maxLength="10"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Secondary Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={editEmployeeData.personalInfo?.phoneSecondary || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        handleEditInputChange('phoneSecondary', value, 'personalInfo.phoneSecondary');
                      }
                    }}
                    placeholder="Enter 10-digit phone number"
                    maxLength="10"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Emergency Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={editEmployeeData.personalInfo?.phoneEmergency || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        handleEditInputChange('phoneEmergency', value, 'personalInfo.phoneEmergency');
                      }
                    }}
                    placeholder="Enter 10-digit emergency phone"
                    maxLength="10"
                  />
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
                    value={editEmployeeData.personalInfo?.currentAddress?.line1 || ''}
                    onChange={(e) => handleEditInputChange('line1', e.target.value, 'personalInfo.currentAddress.line1')}
                    placeholder="Enter address line 1"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-bold">Address Line 2</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.personalInfo?.currentAddress?.line2 || ''}
                    onChange={(e) => handleEditInputChange('line2', e.target.value, 'personalInfo.currentAddress.line2')}
                    placeholder="Enter address line 2"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">City</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.personalInfo?.currentAddress?.city || ''}
                    onChange={(e) => handleEditInputChange('city', e.target.value, 'personalInfo.currentAddress.city')}
                    placeholder="Enter city"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">State</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.personalInfo?.currentAddress?.state || ''}
                    onChange={(e) => handleEditInputChange('state', e.target.value, 'personalInfo.currentAddress.state')}
                    placeholder="Enter state"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Pincode</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.personalInfo?.currentAddress?.pincode || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 6) {
                        handleEditInputChange('pincode', value, 'personalInfo.currentAddress.pincode');
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
                    value={editEmployeeData.personalInfo?.currentAddress?.country || ''}
                    onChange={(e) => handleEditInputChange('country', e.target.value, 'personalInfo.currentAddress.country')}
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
                    htmlFor="editSameAsCurrent"
                    className="d-flex align-items-center form-check"
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "4px",
                        border: `2px solid ${JSON.stringify(editEmployeeData.personalInfo?.currentAddress || {}) ===
                            JSON.stringify(editEmployeeData.personalInfo?.permanentAddress || {}) &&
                            Object.values(editEmployeeData.personalInfo?.currentAddress || {}).some(
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
                          JSON.stringify(editEmployeeData.personalInfo?.currentAddress || {}) ===
                            JSON.stringify(editEmployeeData.personalInfo?.permanentAddress || {}) &&
                            Object.values(editEmployeeData.personalInfo?.currentAddress || {}).some(
                              (val) => val !== ""
                            )
                            ? "#3B82F6"
                            : "transparent",
                      }}
                    >
                      {(JSON.stringify(editEmployeeData.personalInfo?.currentAddress || {}) ===
                        JSON.stringify(editEmployeeData.personalInfo?.permanentAddress || {}) &&
                        Object.values(editEmployeeData.personalInfo?.currentAddress || {}).some(
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

                    <input
                      type="checkbox"
                      id="editSameAsCurrent"
                      className="form-check-input"
                      style={{ display: "none" }}
                      checked={
                        JSON.stringify(editEmployeeData.personalInfo?.currentAddress || {}) ===
                        JSON.stringify(editEmployeeData.personalInfo?.permanentAddress || {}) &&
                        Object.values(editEmployeeData.personalInfo?.currentAddress || {}).some(
                          (val) => val !== ""
                        )
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Copy current address to permanent address
                          const currentAddress = editEmployeeData.personalInfo?.currentAddress || {
                            line1: "", line2: "", city: "", state: "", pincode: "", country: ""
                          };
                          handleEditInputChange('permanentAddress', { ...currentAddress }, 'personalInfo.permanentAddress');
                        } else {
                          // Clear permanent address
                          handleEditInputChange('permanentAddress', {
                            line1: "",
                            line2: "",
                            city: "",
                            state: "",
                            pincode: "",
                            country: ""
                          }, 'personalInfo.permanentAddress');
                        }
                      }}
                    />

                    <span className="fw-semibold">Same as Current Address</span>
                  </label>
                </div>

                <div className="col-12">
                  <label className="form-label fw-bold">Address Line 1</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.personalInfo?.permanentAddress?.line1 || ''}
                    onChange={(e) => handleEditInputChange('line1', e.target.value, 'personalInfo.permanentAddress.line1')}
                    placeholder="Enter address line 1"
                    disabled={
                      JSON.stringify(editEmployeeData.personalInfo?.currentAddress || {}) ===
                      JSON.stringify(editEmployeeData.personalInfo?.permanentAddress || {}) &&
                      Object.values(editEmployeeData.personalInfo?.currentAddress || {}).some(val => val !== "")
                    }
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-bold">Address Line 2</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.personalInfo?.permanentAddress?.line2 || ''}
                    onChange={(e) => handleEditInputChange('line2', e.target.value, 'personalInfo.permanentAddress.line2')}
                    placeholder="Enter address line 2"
                    disabled={
                      JSON.stringify(editEmployeeData.personalInfo?.currentAddress || {}) ===
                      JSON.stringify(editEmployeeData.personalInfo?.permanentAddress || {}) &&
                      Object.values(editEmployeeData.personalInfo?.currentAddress || {}).some(val => val !== "")
                    }
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold">City</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.personalInfo?.permanentAddress?.city || ''}
                    onChange={(e) => handleEditInputChange('city', e.target.value, 'personalInfo.permanentAddress.city')}
                    placeholder="Enter city"
                    disabled={
                      JSON.stringify(editEmployeeData.personalInfo?.currentAddress || {}) ===
                      JSON.stringify(editEmployeeData.personalInfo?.permanentAddress || {}) &&
                      Object.values(editEmployeeData.personalInfo?.currentAddress || {}).some(val => val !== "")
                    }
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold">State</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.personalInfo?.permanentAddress?.state || ''}
                    onChange={(e) => handleEditInputChange('state', e.target.value, 'personalInfo.permanentAddress.state')}
                    placeholder="Enter state"
                    disabled={
                      JSON.stringify(editEmployeeData.personalInfo?.currentAddress || {}) ===
                      JSON.stringify(editEmployeeData.personalInfo?.permanentAddress || {}) &&
                      Object.values(editEmployeeData.personalInfo?.currentAddress || {}).some(val => val !== "")
                    }
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold">Pincode</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.personalInfo?.permanentAddress?.pincode || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 6) {
                        handleEditInputChange('pincode', value, 'personalInfo.permanentAddress.pincode');
                      }
                    }}
                    placeholder="Enter pincode"
                    maxLength="6"
                    disabled={
                      JSON.stringify(editEmployeeData.personalInfo?.currentAddress || {}) ===
                      JSON.stringify(editEmployeeData.personalInfo?.permanentAddress || {}) &&
                      Object.values(editEmployeeData.personalInfo?.currentAddress || {}).some(val => val !== "")
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Country</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.personalInfo?.permanentAddress?.country || ''}
                    onChange={(e) => handleEditInputChange('country', e.target.value, 'personalInfo.permanentAddress.country')}
                    placeholder="Enter country"
                    disabled={
                      JSON.stringify(editEmployeeData.personalInfo?.currentAddress || {}) ===
                      JSON.stringify(editEmployeeData.personalInfo?.permanentAddress || {}) &&
                      Object.values(editEmployeeData.personalInfo?.currentAddress || {}).some(val => val !== "")
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
                        const currentContacts = editEmployeeData.personalInfo?.emergencyContacts || [];
                        if (currentContacts.length >= 5) {
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
                        handleEditAddToArray('personalInfo.emergencyContacts', newContact);
                      }}
                    >
                      <Icon icon="heroicons:plus" />
                      <span>Add Contact</span>
                    </button>
                  </div>

                  {(editEmployeeData.personalInfo?.emergencyContacts || []).length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered">
                        <thead className="bg-light">
                          <tr>
                            <th className="text-muted">Name</th>
                            <th className="text-muted">Relation</th>
                            <th className="text-muted">Phone No</th>
                            <th className="text-muted">Priority</th>
                            <th className="text-muted">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(editEmployeeData.personalInfo?.emergencyContacts || []).map((contact, index) => (
                            <tr key={contact.id || index}>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={contact.name || ''}
                                  onChange={(e) => handleEditArrayUpdate('personalInfo.emergencyContacts', index, 'name', e.target.value)}
                                  placeholder="Enter name"
                                />
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={contact.relation || ''}
                                  onChange={(e) => handleEditArrayUpdate('personalInfo.emergencyContacts', index, 'relation', e.target.value)}
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
                                  value={contact.phone || ''}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    if (value.length <= 10) {
                                      handleEditArrayUpdate('personalInfo.emergencyContacts', index, 'phone', value);
                                    }
                                  }}
                                  placeholder="10 digits"
                                  maxLength="10"
                                />
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={contact.priority || 'Primary'}
                                  onChange={(e) => handleEditArrayUpdate('personalInfo.emergencyContacts', index, 'priority', e.target.value)}
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
                                  onClick={() => handleEditRemoveFromArray('personalInfo.emergencyContacts', index)}
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
                        const currentMembers = editEmployeeData.personalInfo?.familyMembers || [];
                        if (currentMembers.length >= 5) {
                          alert("Maximum 5 family members allowed");
                          return;
                        }
                        const newMember = {
                          id: Date.now(),
                          name: "",
                          relation: "",
                          contactNo: "",
                          dateOfBirth: "",
                        };
                        handleEditAddToArray('personalInfo.familyMembers', newMember);
                      }}
                    >
                      <Icon icon="heroicons:plus" />
                      <span>Add Member</span>
                    </button>
                  </div>

                  {(editEmployeeData.personalInfo?.familyMembers || []).length > 0 ? (
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
                          {(editEmployeeData.personalInfo?.familyMembers || []).map((member, index) => (
                            <tr key={member.id || index}>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={member.name || ''}
                                  onChange={(e) => handleEditArrayUpdate('personalInfo.familyMembers', index, 'name', e.target.value)}
                                  placeholder="Enter name"
                                />
                              </td>

                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={member.relation || ''}
                                  onChange={(e) => handleEditArrayUpdate('personalInfo.familyMembers', index, 'relation', e.target.value)}
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
                                  // Use dob instead of dateOfBirth for consistency
                                  value={member.dob || ''}
                                  onChange={(e) => handleEditArrayUpdate('personalInfo.familyMembers', index, 'dob', e.target.value)}
                                  max={new Date().toISOString().split('T')[0]}
                                />
                              </td>

                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleEditRemoveFromArray('personalInfo.familyMembers', index)}
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
                    <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                      <span className="text-primary">
                        <Icon icon="heroicons:gift" />
                      </span>
                      Nominee Information
                    </h6>

                    <button
                      type="button"
                      className="job-listings-btn"
                      onClick={() => {
                        const currentNominees = editEmployeeData.personalInfo?.nominees || [];
                        if (currentNominees.length >= 3) {
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
                        handleEditAddToArray('personalInfo.nominees', newNominee);
                      }}
                    >
                      <Icon icon="heroicons:plus" />
                      <span>Add Nominee</span>
                    </button>
                  </div>

                  {(editEmployeeData.personalInfo?.nominees || []).length > 0 ? (
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
                          {(editEmployeeData.personalInfo?.nominees || []).map((nominee, index) => (
                            <tr key={nominee.id || index}>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={nominee.name || ''}
                                  onChange={(e) => handleEditArrayUpdate('personalInfo.nominees', index, 'name', e.target.value)}
                                  placeholder="Enter name"
                                />
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={nominee.relation || ''}
                                  onChange={(e) => handleEditArrayUpdate('personalInfo.nominees', index, 'relation', e.target.value)}
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
                                  value={nominee.phone || nominee.phoneNo || ''} // Check both fields
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    if (value.length <= 10) {
                                      // Update both fields for backward compatibility
                                      const updatedNominee = {
                                        ...nominee,
                                        phone: value,
                                        phoneNo: value // Also update phoneNo for data consistency
                                      };
                                      const currentNominees = editEmployeeData.personalInfo?.nominees || [];
                                      const updatedNominees = [...currentNominees];
                                      updatedNominees[index] = updatedNominee;
                                      handleEditInputChange('nominees', updatedNominees, 'personalInfo.nominees');
                                    }
                                  }}
                                  placeholder="10 digits"
                                  maxLength="10"
                                />
                              </td>

                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={nominee.isNomineeAccepted ? 'Yes' : 'No'}
                                  onChange={(e) => handleEditArrayUpdate('personalInfo.nominees', index, 'isNomineeAccepted', e.target.value === 'Yes')}
                                >
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={nominee.percentage || ''}
                                  onChange={(e) => {
                                    const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                    handleEditArrayUpdate('personalInfo.nominees', index, 'percentage', value);
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
                                  onClick={() => handleEditRemoveFromArray('personalInfo.nominees', index)}
                                >
                                  <Icon icon="heroicons:trash" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(() => {
                        const totalPercentage = (editEmployeeData.personalInfo?.nominees || []).reduce(
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
                    value={editEmployeeData.personalInfo?.identification?.pan?.number || ''}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      if (value.length <= 10) {
                        handleEditInputChange('number', value, 'personalInfo.identification.pan.number');
                      }
                    }}
                    placeholder="ABCDE1234F"
                    maxLength="10"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Aadhaar Number <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.personalInfo?.identification?.aadhaar?.number || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 12) {
                        handleEditInputChange('number', value, 'personalInfo.identification.aadhaar.number');
                      }
                    }}
                    placeholder="123456789012"
                    maxLength="12"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Passport Number (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.personalInfo?.identification?.passport?.number || ''}
                    onChange={(e) => handleEditInputChange('number', e.target.value, 'personalInfo.identification.passport.number')}
                    placeholder="Enter passport number"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Passport Expiry Date (Optional)</label>
                  <input
                    type="date"
                    className="form-control"
                    value={editEmployeeData.personalInfo?.identification?.passport?.expiryDate || ''}
                    onChange={(e) => handleEditInputChange('expiryDate', e.target.value, 'personalInfo.identification.passport.expiryDate')}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Voter ID Number (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.personalInfo?.identification?.voterId?.number || ''}
                    onChange={(e) => handleEditInputChange('number', e.target.value, 'personalInfo.identification.voterId.number')}
                    placeholder="Enter voter ID number"
                  />
                </div>

              </div>
            )}

            {/* Employment Information Tab - Modified for Edit */}
            {activeEditTab === 'employment' && (
              <div className="row g-3">
                <div className="col-12">
                  <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                    <span className="text-primary">
                      <Icon icon="heroicons:briefcase" />
                    </span>
                    <span>Employment Details</span>
                  </h6>
                </div>
                {/* Row 1: Employee ID and Date of Joining */}

                <div className="col-md-6">
                  <label className="form-label fw-bold">Employee ID <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.employmentInfo?.employeeId || editEmployeeData.employeeId || ''}
                    onChange={(e) => {
                      handleEditInputChange('employeeId', e.target.value, 'employmentInfo.employeeId');
                    }}
                    placeholder="EMP001"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Date of Joining <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={editEmployeeData.employmentInfo?.dateOfJoining || editEmployeeData.joinDate || ''}
                    onChange={(e) => {
                      handleEditInputChange('dateOfJoining', e.target.value, 'employmentInfo.dateOfJoining');
                      handleEditInputChange('joinDate', e.target.value);
                    }}
                    required
                  />
                </div>

                {/* Row 2: Confirmation Date and Probation Period */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">Confirmation Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={editEmployeeData.employmentInfo?.confirmationDate || ''}
                    onChange={(e) => handleEditInputChange('confirmationDate', e.target.value, 'employmentInfo.confirmationDate')}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Probation Period (months)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editEmployeeData.employmentInfo?.probationPeriod || 0}
                    onChange={(e) => handleEditInputChange('probationPeriod', parseInt(e.target.value) || 0, 'employmentInfo.probationPeriod')}
                    min="0"
                    max="12"
                  />
                </div>

                {/* Row 3: Employment Type and Status */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">Employment Type <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={editEmployeeData.employmentInfo?.employmentType || editEmployeeData.employmentType || ''}
                    onChange={(e) => {
                      handleEditInputChange('employmentType', e.target.value, 'employmentInfo.employmentType');
                      handleEditInputChange('employmentType', e.target.value);
                    }}
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
                    value={editEmployeeData.employmentInfo?.employmentStatus || editEmployeeData.status || 'Active'}
                    onChange={(e) => {
                      handleEditInputChange('employmentStatus', e.target.value, 'employmentInfo.employmentStatus');
                      handleEditInputChange('status', e.target.value);
                    }}
                  >
                    <option value="Active">Active</option>
                    <option value="Probation">Probation</option>
                    <option value="On-Hold">On-Hold</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>

                {/* Row 4: Department and Sub-Department */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">Department <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={editEmployeeData.employmentInfo?.department || editEmployeeData.department || ''}
                    onChange={(e) => {
                      handleEditInputChange('department', e.target.value, 'employmentInfo.department');
                      handleEditInputChange('department', e.target.value);
                    }}
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
                    value={editEmployeeData.employmentInfo?.subDepartment || ''}
                    onChange={(e) => handleEditInputChange('subDepartment', e.target.value, 'employmentInfo.subDepartment')}
                    placeholder="Enter sub-department"
                  />
                </div>

                {/* Row 5: Cost Center and Designation */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">Cost Center</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.employmentInfo?.costCenter || ''}
                    onChange={(e) => handleEditInputChange('costCenter', e.target.value, 'employmentInfo.costCenter')}
                    placeholder="Enter cost center code"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Designation <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.employmentInfo?.designation || editEmployeeData.designation || ''}
                    onChange={(e) => {
                      handleEditInputChange('designation', e.target.value, 'employmentInfo.designation');
                      handleEditInputChange('designation', e.target.value);
                    }}
                    placeholder="Enter designation"
                    required
                  />
                </div>

                {/* Row 6: Grade and Level */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">Grade</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.employmentInfo?.grade || ''}
                    onChange={(e) => handleEditInputChange('grade', e.target.value, 'employmentInfo.grade')}
                    placeholder="e.g., P1, M2, E3"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Level</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.employmentInfo?.level || ''}
                    onChange={(e) => handleEditInputChange('level', e.target.value, 'employmentInfo.level')}
                    placeholder="e.g., Junior, Mid, Senior"
                  />
                </div>

                {/* Row 7: Location and Workplace Type */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">Branch / Location <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={editEmployeeData.employmentInfo?.locationId || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value ? Number(e.target.value) : null;
                      const selectedBranch = branches.find(b => b.id === selectedId);
                      const name = selectedBranch ? selectedBranch.name : '';
                      handleEditInputChange('locationId', selectedId, 'employmentInfo.locationId');
                      handleEditInputChange('location', name, 'employmentInfo.location');
                      handleEditInputChange('location', name);
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

                <div className="col-md-6">
                  <label className="form-label fw-bold">Workplace Type</label>
                  <select
                    className="form-select"
                    value={editEmployeeData.employmentInfo?.workplaceType || 'Office'}
                    onChange={(e) => handleEditInputChange('workplaceType', e.target.value, 'employmentInfo.workplaceType')}
                  >
                    <option value="Office">Office</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Field">Field</option>
                  </select>
                </div>

                {/* Row 8: Email and Extension Number */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">Email <span className="text-danger">*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    value={editEmployeeData.employmentInfo?.workEmail || editEmployeeData.email || ''}
                    onChange={(e) => {
                      handleEditInputChange('workEmail', e.target.value, 'employmentInfo.workEmail');
                      handleEditInputChange('email', e.target.value);
                    }}
                    placeholder="employee@company.com"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Extension Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.employmentInfo?.extensionNumber || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 6) {
                        handleEditInputChange('extensionNumber', value, 'employmentInfo.extensionNumber');
                      }
                    }}
                    placeholder="Enter extension number"
                    maxLength="6"
                  />
                </div>

                {/* Row 9: Desk Location and Employee Category */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">Desk Location</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.employmentInfo?.deskLocation || ''}
                    onChange={(e) => handleEditInputChange('deskLocation', e.target.value, 'employmentInfo.deskLocation')}
                    placeholder="e.g., Floor 3, Desk 12A"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Employee Category</label>
                  <select
                    className="form-select"
                    value={editEmployeeData.employmentInfo?.employeeCategory || 'Staff'}
                    onChange={(e) => handleEditInputChange('employeeCategory', e.target.value, 'employmentInfo.employeeCategory')}
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

                {/* Row 10: Notice Period and Direct Reporting Manager */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">Notice Period (days)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editEmployeeData.employmentInfo?.noticePeriod || 30}
                    onChange={(e) => handleEditInputChange('noticePeriod', parseInt(e.target.value) || 0, 'employmentInfo.noticePeriod')}
                    min="0"
                    max="180"
                  />
                  <small className="text-muted">Typically 30, 60, or 90 days</small>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Direct Reporting Manager</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.employmentInfo?.reportingManager?.direct || ''}
                    onChange={(e) => {
                      const currentReportingManager = editEmployeeData.employmentInfo?.reportingManager || { direct: '', functional: '' };
                      handleEditInputChange('reportingManager', {
                        ...currentReportingManager,
                        direct: e.target.value
                      }, 'employmentInfo.reportingManager');
                    }}
                    placeholder="Enter direct manager name"
                  />
                </div>

                {/* Row 11: Functional Reporting Manager and HR Business Partner */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">Functional Reporting Manager</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.employmentInfo?.reportingManager?.functional || ''}
                    onChange={(e) => {
                      const currentReportingManager = editEmployeeData.employmentInfo?.reportingManager || { direct: '', functional: '' };
                      handleEditInputChange('reportingManager', {
                        ...currentReportingManager,
                        functional: e.target.value
                      }, 'employmentInfo.reportingManager');
                    }}
                    placeholder="Enter functional manager name"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">HR Business Partner</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.employmentInfo?.hrBusinessPartner || ''}
                    onChange={(e) => handleEditInputChange('hrBusinessPartner', e.target.value, 'employmentInfo.hrBusinessPartner')}
                    placeholder="Enter HR business partner name"
                  />
                </div>
              </div>
            )}

            {/* Job History Tab - Modified for Edit */}
            {activeEditTab === 'jobHistory' && (
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
                      const currentHistory = editEmployeeData.jobHistory || [];
                      const newHistory = {
                        id: Date.now(),
                        date: new Date().toISOString().split("T")[0],
                        endDate: '',
                        type: "Joining",
                        organisation: '',
                        department: editEmployeeData.employmentInfo?.department || editEmployeeData.department || "",
                        designation: editEmployeeData.employmentInfo?.designation || editEmployeeData.designation || "",
                        location: editEmployeeData.employmentInfo?.location || editEmployeeData.location || "",
                        manager: editEmployeeData.employmentInfo?.reportingManager?.direct || "",
                        salaryChange: editEmployeeData.salaryInfo?.currentCTC || editEmployeeData.salary || "",
                        notes: "",
                        achievements: "",
                        reasonForLeaving: "",
                        isEditing: true
                      };
                      handleEditInputChange('jobHistory', [...currentHistory, newHistory]);
                    }}
                  >
                    <Icon icon="heroicons:plus" />
                    Add Job History
                  </button>
                </div>

                {/* Current Job History Entries */}
                <div className="col-12">
                  {(editEmployeeData.jobHistory || []).length > 0 ? (
                    (editEmployeeData.jobHistory || []).map((history, idx) => {
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
                                        history.type === 'Department Change' ? 'bg-secondary' :
                                          history.type === 'Location Transfer' ? 'bg-secondary' :
                                            history.type === 'Designation Change' ? 'bg-secondary' :
                                              history.type === 'Resignation' ? 'bg-danger' :
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
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this job history entry?')) {
                                    const currentHistory = editEmployeeData.jobHistory || [];
                                    const updatedHistory = currentHistory.filter((_, i) => i !== idx);
                                    handleEditInputChange('jobHistory', updatedHistory);
                                  }
                                }}
                                title="Delete"
                              >
                                <Icon icon="heroicons:trash" />
                              </button>
                            </div>
                          </div>
                          <div className="card-body">
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
                                  onChange={(e) => handleEditArrayUpdate('jobHistory', idx, 'date', e.target.value)}
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
                                      if (value === 'present') {
                                        handleEditArrayUpdate('jobHistory', idx, 'endDate', 'Present');
                                      } else if (value === 'empty') {
                                        handleEditArrayUpdate('jobHistory', idx, 'endDate', '');
                                      } else {
                                        handleEditArrayUpdate('jobHistory', idx, 'endDate', '');
                                      }
                                    }}
                                  >
                                    <option value="empty">Select End Date</option>
                                    <option value="present">Present</option>
                                    <option value="date">Specific Date</option>
                                  </select>
                                  {history.endDate && history.endDate !== 'Present' && (
                                    <input
                                      type="date"
                                      className="form-control"
                                      value={history.endDate || ''}
                                      onChange={(e) => handleEditArrayUpdate('jobHistory', idx, 'endDate', e.target.value)}
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
                                  onChange={(e) => handleEditArrayUpdate('jobHistory', idx, 'type', e.target.value)}
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
                                  onChange={(e) => handleEditArrayUpdate('jobHistory', idx, 'organisation', e.target.value)}
                                  placeholder="Enter organisation name"
                                />
                              </div>

                              <div className="col-md-4">
                                <label className="form-label fw-bold small">Department</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={history.department || ''}
                                  onChange={(e) => handleEditArrayUpdate('jobHistory', idx, 'department', e.target.value)}
                                  placeholder="Enter department"
                                />
                              </div>

                              <div className="col-md-4">
                                <label className="form-label fw-bold small">Designation</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={history.designation || ''}
                                  onChange={(e) => handleEditArrayUpdate('jobHistory', idx, 'designation', e.target.value)}
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
                                  onChange={(e) => handleEditArrayUpdate('jobHistory', idx, 'location', e.target.value)}
                                  placeholder="Enter location"
                                />
                              </div>

                              <div className="col-md-4">
                                <label className="form-label fw-bold small">Manager</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={history.manager || ''}
                                  onChange={(e) => handleEditArrayUpdate('jobHistory', idx, 'manager', e.target.value)}
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
                                    onChange={(e) => handleEditArrayUpdate('jobHistory', idx, 'salaryChange', e.target.value)}
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
                                  onChange={(e) => handleEditArrayUpdate('jobHistory', idx, 'notes', e.target.value)}
                                  placeholder="Enter notes"
                                />
                              </div>

                              <div className="col-md-4">
                                <label className="form-label fw-bold small">Achievements</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={history.achievements || ''}
                                  onChange={(e) => handleEditArrayUpdate('jobHistory', idx, 'achievements', e.target.value)}
                                  placeholder="Enter achievements"
                                />
                              </div>

                              {/* Row 5: Reason for Leaving (Conditional) */}
                              {history.type === 'Resignation' || history.reasonForLeaving ? (
                                <div className="col-md-12">
                                  <label className="form-label fw-bold small">Reason for Leaving</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={history.reasonForLeaving || ''}
                                    onChange={(e) => handleEditArrayUpdate('jobHistory', idx, 'reasonForLeaving', e.target.value)}
                                    placeholder="Enter reason for leaving"
                                  />
                                  <small className="text-muted">Only applicable for resignations or job changes</small>
                                </div>
                              ) : null}
                            </div>
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
                {(editEmployeeData.jobHistory || []).length > 0 && (
                  <div className="col-12 mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          <Icon icon="heroicons:table-cells" className="me-2" />
                        </span>
                        Job History Summary Table
                      </h6>
                      <small className="text-muted">
                        Showing {(editEmployeeData.jobHistory || []).length} entries
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
                          {(editEmployeeData.jobHistory || []).map((history, idx) => {
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
                                            history.type === 'Department Change' ? 'bg-secondary' :
                                              history.type === 'Location Transfer' ? 'bg-secondary' :
                                                history.type === 'Designation Change' ? 'bg-secondary' :
                                                  history.type === 'Resignation' ? 'bg-danger' :
                                                    'bg-secondary'
                                    }`}>
                                    {history.type || '-'}
                                  </span>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <span>{history.organisation || '-'}</span>
                                    {history.organisation === editEmployeeData.employmentInfo?.department && (
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
            {/* Salary & Compensation Tab - Modified for Edit */}

            {activeEditTab === 'salary' && (
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
                      value={editEmployeeData.salaryInfo?.currentCTC || editEmployeeData.salary || 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;

                        // Auto-populate CTC breakdown based on percentage distribution
                        const breakdown = {
                          basic: Math.round(value * 0.5),        // 50% of CTC
                          hra: Math.round(value * 0.2),          // 20% of CTC
                          specialAllowance: Math.round(value * 0.15),  // 15% of CTC
                          transportAllowance: Math.round(value * 0.05), // 5% of CTC
                          medicalAllowance: Math.round(value * 0.05),  // 5% of CTC
                          otherAllowances: Math.round(value * 0.05),   // 5% of CTC
                          providentFund: Math.round(value * 0.12),     // 12% of CTC
                          gratuity: Math.round(value * 0.048),         // 4.8% of CTC
                          otherDeductions: Math.round(value * 0.002)   // 0.2% of CTC
                        };

                        // Calculate total to ensure it matches CTC
                        const totalBreakdown = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

                        // Adjust if there's a rounding difference
                        if (totalBreakdown !== value) {
                          breakdown.otherAllowances += (value - totalBreakdown);
                        }

                        // Update all related fields
                        handleEditInputChange('currentCTC', value, 'salaryInfo.currentCTC');
                        handleEditInputChange('salary', value);
                        handleEditInputChange('ctcBreakdown', breakdown, 'salaryInfo.ctcBreakdown');
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
                    value={editEmployeeData.salaryInfo?.salaryStructure || ''}
                    onChange={(e) => handleEditInputChange('salaryStructure', e.target.value, 'salaryInfo.salaryStructure')}
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
                  <h6 className="fw-bold fs-5 mb-3 text-muted border-bottom pb-2 d-flex align-items-center gap-2">
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
                          <th className="text-end text-muted">% of CTC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Basic Salary */}
                        <tr>
                          <td className="fw-semibold">Basic</td>
                          <td>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">₹</span>
                              <input
                                type="number"
                                className="form-control text-end"
                                value={editEmployeeData.salaryInfo?.ctcBreakdown?.basic || 0}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  const currentBreakdown = editEmployeeData.salaryInfo?.ctcBreakdown || {};
                                  handleEditInputChange('ctcBreakdown', {
                                    ...currentBreakdown,
                                    basic: value
                                  }, 'salaryInfo.ctcBreakdown');
                                }}
                                placeholder="0"
                              />
                            </div>
                          </td>
                          <td className="text-end">
                            {(() => {
                              const ctc = editEmployeeData.salaryInfo?.currentCTC || editEmployeeData.salary || 0;
                              const basic = editEmployeeData.salaryInfo?.ctcBreakdown?.basic || 0;
                              return ctc > 0 ? `${((basic / ctc) * 100).toFixed(1)}%` : '0%';
                            })()}
                          </td>
                        </tr>

                        {/* HRA */}
                        <tr>
                          <td className="fw-semibold">HRA</td>
                          <td>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">₹</span>
                              <input
                                type="number"
                                className="form-control text-end"
                                value={editEmployeeData.salaryInfo?.ctcBreakdown?.hra || 0}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  const currentBreakdown = editEmployeeData.salaryInfo?.ctcBreakdown || {};
                                  handleEditInputChange('ctcBreakdown', {
                                    ...currentBreakdown,
                                    hra: value
                                  }, 'salaryInfo.ctcBreakdown');
                                }}
                                placeholder="0"
                              />
                            </div>
                          </td>
                          <td className="text-end">
                            {(() => {
                              const ctc = editEmployeeData.salaryInfo?.currentCTC || editEmployeeData.salary || 0;
                              const hra = editEmployeeData.salaryInfo?.ctcBreakdown?.hra || 0;
                              return ctc > 0 ? `${((hra / ctc) * 100).toFixed(1)}%` : '0%';
                            })()}
                          </td>
                        </tr>

                        {/* Special Allowance */}
                        <tr>
                          <td className="fw-semibold">Special Allowance</td>
                          <td>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">₹</span>
                              <input
                                type="number"
                                className="form-control text-end"
                                value={editEmployeeData.salaryInfo?.ctcBreakdown?.specialAllowance || 0}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  const currentBreakdown = editEmployeeData.salaryInfo?.ctcBreakdown || {};
                                  handleEditInputChange('ctcBreakdown', {
                                    ...currentBreakdown,
                                    specialAllowance: value
                                  }, 'salaryInfo.ctcBreakdown');
                                }}
                                placeholder="0"
                              />
                            </div>
                          </td>
                          <td className="text-end">
                            {(() => {
                              const ctc = editEmployeeData.salaryInfo?.currentCTC || editEmployeeData.salary || 0;
                              const special = editEmployeeData.salaryInfo?.ctcBreakdown?.specialAllowance || 0;
                              return ctc > 0 ? `${((special / ctc) * 100).toFixed(1)}%` : '0%';
                            })()}
                          </td>
                        </tr>

                        {/* Transport Allowance */}
                        <tr>
                          <td className="fw-semibold">Transport Allowance</td>
                          <td>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">₹</span>
                              <input
                                type="number"
                                className="form-control text-end"
                                value={editEmployeeData.salaryInfo?.ctcBreakdown?.transportAllowance || 0}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  const currentBreakdown = editEmployeeData.salaryInfo?.ctcBreakdown || {};
                                  handleEditInputChange('ctcBreakdown', {
                                    ...currentBreakdown,
                                    transportAllowance: value
                                  }, 'salaryInfo.ctcBreakdown');
                                }}
                                placeholder="0"
                              />
                            </div>
                          </td>
                          <td className="text-end">
                            {(() => {
                              const ctc = editEmployeeData.salaryInfo?.currentCTC || editEmployeeData.salary || 0;
                              const transport = editEmployeeData.salaryInfo?.ctcBreakdown?.transportAllowance || 0;
                              return ctc > 0 ? `${((transport / ctc) * 100).toFixed(1)}%` : '0%';
                            })()}
                          </td>
                        </tr>

                        {/* Medical Allowance */}
                        <tr>
                          <td className="fw-semibold">Medical Allowance</td>
                          <td>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">₹</span>
                              <input
                                type="number"
                                className="form-control text-end"
                                value={editEmployeeData.salaryInfo?.ctcBreakdown?.medicalAllowance || 0}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  const currentBreakdown = editEmployeeData.salaryInfo?.ctcBreakdown || {};
                                  handleEditInputChange('ctcBreakdown', {
                                    ...currentBreakdown,
                                    medicalAllowance: value
                                  }, 'salaryInfo.ctcBreakdown');
                                }}
                                placeholder="0"
                              />
                            </div>
                          </td>
                          <td className="text-end">
                            {(() => {
                              const ctc = editEmployeeData.salaryInfo?.currentCTC || editEmployeeData.salary || 0;
                              const medical = editEmployeeData.salaryInfo?.ctcBreakdown?.medicalAllowance || 0;
                              return ctc > 0 ? `${((medical / ctc) * 100).toFixed(1)}%` : '0%';
                            })()}
                          </td>
                        </tr>

                        {/* Other Allowances */}
                        <tr>
                          <td className="fw-semibold">Other Allowances</td>
                          <td>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">₹</span>
                              <input
                                type="number"
                                className="form-control text-end"
                                value={editEmployeeData.salaryInfo?.ctcBreakdown?.otherAllowances || 0}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  const currentBreakdown = editEmployeeData.salaryInfo?.ctcBreakdown || {};
                                  handleEditInputChange('ctcBreakdown', {
                                    ...currentBreakdown,
                                    otherAllowances: value
                                  }, 'salaryInfo.ctcBreakdown');
                                }}
                                placeholder="0"
                              />
                            </div>
                          </td>
                          <td className="text-end">
                            {(() => {
                              const ctc = editEmployeeData.salaryInfo?.currentCTC || editEmployeeData.salary || 0;
                              const other = editEmployeeData.salaryInfo?.ctcBreakdown?.otherAllowances || 0;
                              return ctc > 0 ? `${((other / ctc) * 100).toFixed(1)}%` : '0%';
                            })()}
                          </td>
                        </tr>

                        {/* Gross Salary Summary */}
                        <tr className="table-secondary fw-bold">
                          <td>Gross Salary</td>
                          <td className="text-end">
                            ₹{(
                              (editEmployeeData.salaryInfo?.ctcBreakdown?.basic || 0) +
                              (editEmployeeData.salaryInfo?.ctcBreakdown?.hra || 0) +
                              (editEmployeeData.salaryInfo?.ctcBreakdown?.specialAllowance || 0) +
                              (editEmployeeData.salaryInfo?.ctcBreakdown?.transportAllowance || 0) +
                              (editEmployeeData.salaryInfo?.ctcBreakdown?.medicalAllowance || 0) +
                              (editEmployeeData.salaryInfo?.ctcBreakdown?.otherAllowances || 0)
                            ).toLocaleString('en-IN')}
                          </td>
                          <td className="text-end">
                            {(() => {
                              const ctc = editEmployeeData.salaryInfo?.currentCTC || editEmployeeData.salary || 0;
                              const gross = (
                                (editEmployeeData.salaryInfo?.ctcBreakdown?.basic || 0) +
                                (editEmployeeData.salaryInfo?.ctcBreakdown?.hra || 0) +
                                (editEmployeeData.salaryInfo?.ctcBreakdown?.specialAllowance || 0) +
                                (editEmployeeData.salaryInfo?.ctcBreakdown?.transportAllowance || 0) +
                                (editEmployeeData.salaryInfo?.ctcBreakdown?.medicalAllowance || 0) +
                                (editEmployeeData.salaryInfo?.ctcBreakdown?.otherAllowances || 0)
                              );
                              return ctc > 0 ? `${((gross / ctc) * 100).toFixed(1)}%` : '0%';
                            })()}
                          </td>
                        </tr>

                        {/* Provident Fund */}
                        <tr>
                          <td className="fw-semibold">Provident Fund</td>
                          <td>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">₹</span>
                              <input
                                type="number"
                                className="form-control text-end"
                                value={editEmployeeData.salaryInfo?.ctcBreakdown?.providentFund || 0}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  const currentBreakdown = editEmployeeData.salaryInfo?.ctcBreakdown || {};
                                  handleEditInputChange('ctcBreakdown', {
                                    ...currentBreakdown,
                                    providentFund: value
                                  }, 'salaryInfo.ctcBreakdown');
                                }}
                                placeholder="0"
                              />
                            </div>
                          </td>
                          <td className="text-end">
                            {(() => {
                              const ctc = editEmployeeData.salaryInfo?.currentCTC || editEmployeeData.salary || 0;
                              const pf = editEmployeeData.salaryInfo?.ctcBreakdown?.providentFund || 0;
                              return ctc > 0 ? `${((pf / ctc) * 100).toFixed(1)}%` : '0%';
                            })()}
                          </td>
                        </tr>

                        {/* Gratuity */}
                        <tr>
                          <td className="fw-semibold">Gratuity</td>
                          <td>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">₹</span>
                              <input
                                type="number"
                                className="form-control text-end"
                                value={editEmployeeData.salaryInfo?.ctcBreakdown?.gratuity || 0}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  const currentBreakdown = editEmployeeData.salaryInfo?.ctcBreakdown || {};
                                  handleEditInputChange('ctcBreakdown', {
                                    ...currentBreakdown,
                                    gratuity: value
                                  }, 'salaryInfo.ctcBreakdown');
                                }}
                                placeholder="0"
                              />
                            </div>
                          </td>
                          <td className="text-end">
                            {(() => {
                              const ctc = editEmployeeData.salaryInfo?.currentCTC || editEmployeeData.salary || 0;
                              const gratuity = editEmployeeData.salaryInfo?.ctcBreakdown?.gratuity || 0;
                              return ctc > 0 ? `${((gratuity / ctc) * 100).toFixed(1)}%` : '0%';
                            })()}
                          </td>
                        </tr>

                        {/* Other Deductions */}
                        <tr>
                          <td className="fw-semibold">Other Deductions</td>
                          <td>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">₹</span>
                              <input
                                type="number"
                                className="form-control text-end"
                                value={editEmployeeData.salaryInfo?.ctcBreakdown?.otherDeductions || 0}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  const currentBreakdown = editEmployeeData.salaryInfo?.ctcBreakdown || {};
                                  handleEditInputChange('ctcBreakdown', {
                                    ...currentBreakdown,
                                    otherDeductions: value
                                  }, 'salaryInfo.ctcBreakdown');
                                }}
                                placeholder="0"
                              />
                            </div>
                          </td>
                          <td className="text-end">
                            {(() => {
                              const ctc = editEmployeeData.salaryInfo?.currentCTC || editEmployeeData.salary || 0;
                              const deductions = editEmployeeData.salaryInfo?.ctcBreakdown?.otherDeductions || 0;
                              return ctc > 0 ? `${((deductions / ctc) * 100).toFixed(1)}%` : '0%';
                            })()}
                          </td>
                        </tr>


                      </tbody>
                    </table>
                  </div>
                </div>

                {/* === Bank Account Details === */}
                <div className="col-12 mt-4">
                  <h6 className="fw-bold fs-5 mb-3 text-muted border-bottom pb-2 d-flex align-items-center gap-2">

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
                    value={editEmployeeData.salaryInfo?.paymentMode || 'Bank Transfer'}
                    onChange={(e) => handleEditInputChange('paymentMode', e.target.value, 'salaryInfo.paymentMode')}
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
                    value={editEmployeeData.salaryInfo?.bankAccounts?.primary?.accountNumber || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                      if (value.length <= 18) {
                        const currentAccounts = editEmployeeData.salaryInfo?.bankAccounts || {};
                        handleEditInputChange('bankAccounts', {
                          ...currentAccounts,
                          primary: {
                            ...(currentAccounts.primary || {}),
                            accountNumber: value
                          }
                        }, 'salaryInfo.bankAccounts');
                      }
                    }}
                    placeholder="1234567890"
                    maxLength="18"
                  />
                  {/* Validation message */}
                  {editEmployeeData.salaryInfo?.bankAccounts?.primary?.accountNumber &&
                    (editEmployeeData.salaryInfo.bankAccounts.primary.accountNumber.length < 9 ||
                      editEmployeeData.salaryInfo.bankAccounts.primary.accountNumber.length > 18) && (
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
                    value={editEmployeeData.salaryInfo?.bankAccounts?.primary?.ifscCode || ''}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      if (value.length <= 11) {
                        const currentAccounts = editEmployeeData.salaryInfo?.bankAccounts || {};
                        handleEditInputChange('bankAccounts', {
                          ...currentAccounts,
                          primary: {
                            ...(currentAccounts.primary || {}),
                            ifscCode: value
                          }
                        }, 'salaryInfo.bankAccounts');
                      }
                    }}
                    placeholder="BANK0001234"
                    maxLength="11"
                  />
                  {/* Validation message */}
                  {editEmployeeData.salaryInfo?.bankAccounts?.primary?.ifscCode &&
                    editEmployeeData.salaryInfo.bankAccounts.primary.ifscCode.length !== 11 && (
                      <div className="text-danger small mt-1">
                        IFSC code must be exactly 11 alphanumeric characters
                      </div>
                    )}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Bank Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.salaryInfo?.bankAccounts?.primary?.bankName || ''}
                    onChange={(e) => {
                      const currentAccounts = editEmployeeData.salaryInfo?.bankAccounts || {};
                      handleEditInputChange('bankAccounts', {
                        ...currentAccounts,
                        primary: {
                          ...(currentAccounts.primary || {}),
                          bankName: e.target.value
                        }
                      }, 'salaryInfo.bankAccounts');
                    }}
                    placeholder="State Bank of India"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Branch</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.salaryInfo?.bankAccounts?.primary?.branch || ''}
                    onChange={(e) => {
                      const currentAccounts = editEmployeeData.salaryInfo?.bankAccounts || {};
                      handleEditInputChange('bankAccounts', {
                        ...currentAccounts,
                        primary: {
                          ...(currentAccounts.primary || {}),
                          branch: e.target.value
                        }
                      }, 'salaryInfo.bankAccounts');
                    }}
                    placeholder="Main Branch, Mumbai"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Account Type</label>
                  <select
                    className="form-select"
                    value={editEmployeeData.salaryInfo?.bankAccounts?.primary?.accountType || 'Savings'}
                    onChange={(e) => {
                      const currentAccounts = editEmployeeData.salaryInfo?.bankAccounts || {};
                      handleEditInputChange('bankAccounts', {
                        ...currentAccounts,
                        primary: {
                          ...(currentAccounts.primary || {}),
                          accountType: e.target.value
                        }
                      }, 'salaryInfo.bankAccounts');
                    }}
                  >
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                    <option value="Salary">Salary</option>
                  </select>
                </div>

                {/* Secondary Bank Account (Optional) */}
                <div className="col-12 mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                      <span className="text-primary">
                        <Icon icon="heroicons:plus-circle" />
                      </span>
                      Secondary Bank Account
                    </h6>
                    <button
                      type="button"
                      className="job-listings-btn"
                      onClick={() => {
                        const currentAccounts = editEmployeeData.salaryInfo?.bankAccounts || {};
                        if (currentAccounts.secondary) {
                          // Remove secondary account
                          const { secondary, ...rest } = currentAccounts;
                          handleEditInputChange('bankAccounts', rest, 'salaryInfo.bankAccounts');
                        } else {
                          // Add secondary account
                          handleEditInputChange('bankAccounts', {
                            ...currentAccounts,
                            secondary: {
                              accountNumber: '',
                              ifscCode: '',
                              bankName: '',
                              branch: '',
                              accountType: 'Savings'
                            }
                          }, 'salaryInfo.bankAccounts');
                        }
                      }}
                    >
                      <Icon
                        icon={
                          editEmployeeData.salaryInfo?.bankAccounts?.secondary
                            ? "heroicons:minus"
                            : "heroicons:plus"
                        }
                      />
                      {editEmployeeData.salaryInfo?.bankAccounts?.secondary
                        ? "Remove Account"
                        : "Add Account"}
                    </button>
                  </div>
                </div>

                {editEmployeeData.salaryInfo?.bankAccounts?.secondary && (
                  <>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Account Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editEmployeeData.salaryInfo?.bankAccounts?.secondary?.accountNumber || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                          if (value.length <= 18) {
                            const currentAccounts = editEmployeeData.salaryInfo?.bankAccounts || {};
                            handleEditInputChange('bankAccounts', {
                              ...currentAccounts,
                              secondary: {
                                ...(currentAccounts.secondary || {}),
                                accountNumber: value
                              }
                            }, 'salaryInfo.bankAccounts');
                          }
                        }}
                        placeholder="1234567890"
                        maxLength="18"
                      />
                      {/* Validation message */}
                      {editEmployeeData.salaryInfo?.bankAccounts?.secondary?.accountNumber &&
                        (editEmployeeData.salaryInfo.bankAccounts.secondary.accountNumber.length < 9 ||
                          editEmployeeData.salaryInfo.bankAccounts.secondary.accountNumber.length > 18) && (
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
                        value={editEmployeeData.salaryInfo?.bankAccounts?.secondary?.ifscCode || ''}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                          if (value.length <= 11) {
                            const currentAccounts = editEmployeeData.salaryInfo?.bankAccounts || {};
                            handleEditInputChange('bankAccounts', {
                              ...currentAccounts,
                              secondary: {
                                ...(currentAccounts.secondary || {}),
                                ifscCode: value
                              }
                            }, 'salaryInfo.bankAccounts');
                          }
                        }}
                        placeholder="BANK0001234"
                        maxLength="11"
                      />
                      {/* Validation message */}
                      {editEmployeeData.salaryInfo?.bankAccounts?.secondary?.ifscCode &&
                        editEmployeeData.salaryInfo.bankAccounts.secondary.ifscCode.length !== 11 && (
                          <div className="text-danger small mt-1">
                            IFSC code must be exactly 11 alphanumeric characters
                          </div>
                        )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Bank Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editEmployeeData.salaryInfo?.bankAccounts?.secondary?.bankName || ''}
                        onChange={(e) => {
                          const currentAccounts = editEmployeeData.salaryInfo?.bankAccounts || {};
                          handleEditInputChange('bankAccounts', {
                            ...currentAccounts,
                            secondary: {
                              ...(currentAccounts.secondary || {}),
                              bankName: e.target.value
                            }
                          }, 'salaryInfo.bankAccounts');
                        }}
                        placeholder="Bank Name"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Branch</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editEmployeeData.salaryInfo?.bankAccounts?.secondary?.branch || ''}
                        onChange={(e) => {
                          const currentAccounts = editEmployeeData.salaryInfo?.bankAccounts || {};
                          handleEditInputChange('bankAccounts', {
                            ...currentAccounts,
                            secondary: {
                              ...(currentAccounts.secondary || {}),
                              branch: e.target.value
                            }
                          }, 'salaryInfo.bankAccounts');
                        }}
                        placeholder="Branch Name"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Account Type</label>
                      <select
                        className="form-select"
                        value={editEmployeeData.salaryInfo?.bankAccounts?.secondary?.accountType || 'Savings'}
                        onChange={(e) => {
                          const currentAccounts = editEmployeeData.salaryInfo?.bankAccounts || {};
                          handleEditInputChange('bankAccounts', {
                            ...currentAccounts,
                            secondary: {
                              ...(currentAccounts.secondary || {}),
                              accountType: e.target.value
                            }
                          }, 'salaryInfo.bankAccounts');
                        }}
                      >
                        <option value="Savings">Savings</option>
                        <option value="Current">Current</option>
                        <option value="Salary">Salary</option>
                      </select>
                    </div>
                  </>
                )}

                {/* === Provident Fund & ESI === */}
                <div className="col-12 mt-4">
                  <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
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
                    value={editEmployeeData.salaryInfo?.pfAccountNumber || ''}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      if (value.length <= 22) {
                        handleEditInputChange('pfAccountNumber', value, 'salaryInfo.pfAccountNumber');
                      }
                    }}
                    placeholder="PF123456789"
                    maxLength="22"
                  />

                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">UAN (Universal Account Number)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.salaryInfo?.uan || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                      if (value.length <= 14) {
                        handleEditInputChange('uan', value, 'salaryInfo.uan');
                      }
                    }}
                    placeholder="123456789012"
                    maxLength="14"
                  />

                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">ESI Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.salaryInfo?.esiNumber || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                      if (value.length <= 10) {
                        handleEditInputChange('esiNumber', value, 'salaryInfo.esiNumber');
                      }
                    }}
                    placeholder="ESI123456789"
                    maxLength="10"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">ESI Medical Nominee</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEmployeeData.salaryInfo?.esiMedicalNominee || ''}
                    onChange={(e) => handleEditInputChange('esiMedicalNominee', e.target.value, 'salaryInfo.esiMedicalNominee')}
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
                    value={editEmployeeData.salaryInfo?.taxDeclaration?.regime || 'New'}
                    onChange={(e) => {
                      const currentTax = editEmployeeData.salaryInfo?.taxDeclaration || {};
                      handleEditInputChange('taxDeclaration', {
                        ...currentTax,
                        regime: e.target.value
                      }, 'salaryInfo.taxDeclaration');
                    }}
                  >
                    <option value="Old Regime">Old Regime</option>
                    <option value="New Regime">New Regime</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Tax Declaration</label>
                  <select
                    className="form-select"
                    value={editEmployeeData.salaryInfo?.taxDeclaration?.declared ? 'Yes' : 'No'}
                    onChange={(e) => {
                      const currentTax = editEmployeeData.salaryInfo?.taxDeclaration || {};
                      handleEditInputChange('taxDeclaration', {
                        ...currentTax,
                        declared: e.target.value === 'Yes'
                      }, 'salaryInfo.taxDeclaration');
                    }}
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
                      value={editEmployeeData.salaryInfo?.variablePay?.percentage || 0}
                      onChange={(e) => {
                        const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                        const currentVariablePay = editEmployeeData.salaryInfo?.variablePay || {};
                        handleEditInputChange('variablePay', {
                          ...currentVariablePay,
                          eligible: value > 0,
                          percentage: value
                        }, 'salaryInfo.variablePay');
                      }}
                      placeholder="Enter percentage (0-100)"
                      min="0"
                      max="100"
                      step="0.5"
                    />
                    <span className="input-group-text">%</span>
                  </div>
                  <small className="text-muted">
                    {editEmployeeData.salaryInfo?.variablePay?.percentage > 0 ? (
                      <span className="text-success">
                        Eligible ({(editEmployeeData.salaryInfo.variablePay.percentage || 0)}%)
                      </span>
                    ) : (
                      <span className="text-secondary">Not eligible (0%)</span>
                    )}
                  </small>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Bonus Amount</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input
                      type="number"
                      className="form-control"
                      value={editEmployeeData.salaryInfo?.bonusEligibility?.amount || 0}
                      onChange={(e) => {
                        const value = Math.max(0, parseInt(e.target.value) || 0);
                        const currentBonus = editEmployeeData.salaryInfo?.bonusEligibility || {};
                        handleEditInputChange('bonusEligibility', {
                          ...currentBonus,
                          eligible: value > 0,
                          amount: value
                        }, 'salaryInfo.bonusEligibility');
                      }}
                      placeholder="Enter bonus amount"
                      min="0"
                      step="1000"
                    />
                  </div>
                  <small className="text-muted">
                    {editEmployeeData.salaryInfo?.bonusEligibility?.amount > 0 ? (
                      <span className="text-success">
                        Eligible ({formatCurrency(editEmployeeData.salaryInfo.bonusEligibility.amount || 0)})
                      </span>
                    ) : (
                      <span className="text-secondary">Not eligible (₹0)</span>
                    )}
                  </small>
                </div>

                {/* === Salary Revision History === */}
                <div className="col-12 mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold fs-5 mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                      <span className="text-primary">
                        <Icon icon="heroicons:chart-bar" />
                      </span>
                      Salary Revision History
                    </h6>
                    <button
                      type="button"
                      className="create-job-btn"
                      onClick={() => {
                        const currentRevisions = editEmployeeData.salaryInfo?.salaryRevisionHistory || [];
                        const newRevision = {
                          id: Date.now(),
                          effectiveDate: new Date().toISOString().split("T")[0],
                          previousCTC: editEmployeeData.salaryInfo?.currentCTC || editEmployeeData.salary || 0,
                          newCTC: editEmployeeData.salaryInfo?.currentCTC || editEmployeeData.salary || 0,
                          percentageIncrease: 0,
                          approvedBy: "",
                          status: "Pending"
                        };
                        handleEditInputChange('salaryRevisionHistory', [...currentRevisions, newRevision], 'salaryInfo.salaryRevisionHistory');
                      }}
                    >
                      <Icon icon="heroicons:plus" className="me-1" />
                      Add Salary Revision
                    </button>
                  </div>

                  {/* Salary Revision Cards */}
                  <div className="col-12">
                    {(editEmployeeData.salaryInfo?.salaryRevisionHistory || []).length > 0 ? (
                      (editEmployeeData.salaryInfo.salaryRevisionHistory || []).map((revision, idx) => (
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
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this salary revision entry?')) {
                                    const currentRevisions = editEmployeeData.salaryInfo?.salaryRevisionHistory || [];
                                    const updatedRevisions = currentRevisions.filter((_, i) => i !== idx);
                                    handleEditInputChange('salaryRevisionHistory', updatedRevisions, 'salaryInfo.salaryRevisionHistory');
                                  }
                                }}
                                title="Delete"
                              >
                                <Icon icon="heroicons:trash" />
                              </button>
                            </div>
                          </div>
                          <div className="card-body">
                            <div className="row g-3">
                              {/* Effective Date */}
                              <div className="col-md-6">
                                <label className="form-label fw-bold small">Effective Date</label>
                                <input
                                  type="date"
                                  className="form-control"
                                  value={revision.effectiveDate}
                                  onChange={(e) => handleEditArrayUpdate('salaryInfo.salaryRevisionHistory', idx, 'effectiveDate', e.target.value)}
                                />
                              </div>

                              {/* Status */}
                              <div className="col-md-6">
                                <label className="form-label fw-bold small">Status</label>
                                <select
                                  className="form-select"
                                  value={revision.status}
                                  onChange={(e) => handleEditArrayUpdate('salaryInfo.salaryRevisionHistory', idx, 'status', e.target.value)}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Approved">Approved</option>
                                  <option value="Rejected">Rejected</option>
                                </select>
                              </div>

                              {/* Previous CTC */}
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
                                      const newCTC = revision.newCTC || prevCTC;
                                      const percentageIncrease = prevCTC > 0
                                        ? Math.round(((newCTC - prevCTC) / prevCTC) * 100)
                                        : 0;

                                      handleEditArrayUpdate('salaryInfo.salaryRevisionHistory', idx, 'previousCTC', prevCTC);
                                      handleEditArrayUpdate('salaryInfo.salaryRevisionHistory', idx, 'percentageIncrease', percentageIncrease);
                                    }}
                                    placeholder="Previous salary"
                                    min="0"
                                  />
                                </div>
                              </div>

                              {/* New CTC */}
                              <div className="col-md-6">
                                <label className="form-label fw-bold small">New CTC</label>
                                <div className="input-group">
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={revision.newCTC}
                                    onChange={(e) => {
                                      const newCTC = parseInt(e.target.value) || 0;
                                      const prevCTC = revision.previousCTC || newCTC;
                                      const percentageIncrease = prevCTC > 0
                                        ? Math.round(((newCTC - prevCTC) / prevCTC) * 100)
                                        : 0;

                                      handleEditArrayUpdate('salaryInfo.salaryRevisionHistory', idx, 'newCTC', newCTC);
                                      handleEditArrayUpdate('salaryInfo.salaryRevisionHistory', idx, 'percentageIncrease', percentageIncrease);
                                    }}
                                    placeholder="New salary"
                                    min="0"
                                  />
                                </div>
                              </div>

                              {/* Percentage Increase */}
                              <div className="col-md-6">
                                <label className="form-label fw-bold small">Percentage Increase</label>
                                <div className="input-group">
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={revision.percentageIncrease}
                                    onChange={(e) => {
                                      const percentage = parseInt(e.target.value) || 0;
                                      const prevCTC = revision.previousCTC || 0;
                                      const newCTC = prevCTC + (prevCTC * percentage / 100);

                                      handleEditArrayUpdate('salaryInfo.salaryRevisionHistory', idx, 'percentageIncrease', percentage);
                                      handleEditArrayUpdate('salaryInfo.salaryRevisionHistory', idx, 'newCTC', Math.round(newCTC));
                                    }}
                                    placeholder="Percentage"
                                    min="0"
                                  />
                                  <span className="input-group-text">%</span>
                                </div>
                              </div>

                              {/* Approved By */}
                              <div className="col-md-6">
                                <label className="form-label fw-bold small">Approved By</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={revision.approvedBy || ''}
                                  onChange={(e) => handleEditArrayUpdate('salaryInfo.salaryRevisionHistory', idx, 'approvedBy', e.target.value)}
                                  placeholder="Approver name"
                                />
                              </div>
                            </div>
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
                </div>
              </div>
            )}
            {/* Statutory & Compliance Tab - Modified for Edit */}
            {activeEditTab === 'statutory' && (
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
                    value={editEmployeeData.personalInfo?.identification?.pan?.number || ''}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      if (value.length <= 10) {
                        handleEditInputChange('number', value, 'personalInfo.identification.pan.number');
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
                    value={editEmployeeData.statutoryInfo?.pan?.verified || false}
                    onChange={(e) => handleEditInputChange('verified', e.target.value === 'true', 'statutoryInfo.pan.verified')}
                  >
                    <option value="false">Not Verified</option>
                    <option value="true">Verified</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">PAN Verification Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={editEmployeeData.statutoryInfo?.pan?.verifiedDate || ''}
                    onChange={(e) => handleEditInputChange('verifiedDate', e.target.value, 'statutoryInfo.pan.verifiedDate')}
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
                    value={editEmployeeData.personalInfo?.identification?.aadhaar?.number || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 12) {
                        handleEditInputChange('number', value, 'personalInfo.identification.aadhaar.number');
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
                    value={editEmployeeData.statutoryInfo?.aadhaar?.verified || false}
                    onChange={(e) => handleEditInputChange('verified', e.target.value === 'true', 'statutoryInfo.aadhaar.verified')}
                  >
                    <option value="false">Not Verified</option>
                    <option value="true">Verified</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Aadhaar Verification Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={editEmployeeData.statutoryInfo?.aadhaar?.verifiedDate || ''}
                    onChange={(e) => handleEditInputChange('verifiedDate', e.target.value, 'statutoryInfo.aadhaar.verifiedDate')}
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
                    value={editEmployeeData.statutoryInfo?.pfMembership?.enrolled || false}
                    onChange={(e) => {
                      const isEnrolled = e.target.value === 'true';
                      handleEditInputChange('enrolled', isEnrolled, 'statutoryInfo.pfMembership.enrolled');

                      // Clear fields if not enrolled
                      if (!isEnrolled) {
                        handleEditInputChange('accountNumber', '', 'statutoryInfo.pfMembership.accountNumber');
                        handleEditInputChange('uan', '', 'statutoryInfo.pfMembership.uan');
                        handleEditInputChange('enrollmentDate', '', 'statutoryInfo.pfMembership.enrollmentDate');
                        handleEditInputChange('accountType', '', 'statutoryInfo.pfMembership.accountType');
                      }
                    }}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>

                {editEmployeeData.statutoryInfo?.pfMembership?.enrolled && (
                  <>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">PF Account Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editEmployeeData.salaryInfo?.pfAccountNumber || ''}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                          if (value.length <= 22) {
                            handleEditInputChange('pfAccountNumber', value, 'salaryInfo.pfAccountNumber');
                          }
                        }}
                        placeholder="PF123456789"
                        maxLength="22"
                      />

                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">UAN (Universal Account Number)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editEmployeeData.salaryInfo?.uan || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                          if (value.length <= 14) {
                            handleEditInputChange('uan', value, 'salaryInfo.uan');
                          }
                        }}
                        placeholder="123456789012"
                        maxLength="14"
                      />

                    </div>


                    <div className="col-md-6">
                      <label className="form-label fw-bold">PF Enrollment Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editEmployeeData.statutoryInfo?.pfMembership?.enrollmentDate || ''}
                        onChange={(e) => handleEditInputChange('enrollmentDate', e.target.value, 'statutoryInfo.pfMembership.enrollmentDate')}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">PF Account Type</label>
                      <select
                        className="form-select"
                        value={editEmployeeData.statutoryInfo?.pfMembership?.accountType || 'Regular'}
                        onChange={(e) => handleEditInputChange('accountType', e.target.value, 'statutoryInfo.pfMembership.accountType')}
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
                    value={editEmployeeData.statutoryInfo?.esiRegistration?.enrolled || false}
                    onChange={(e) => {
                      const isEnrolled = e.target.value === 'true';
                      handleEditInputChange('enrolled', isEnrolled, 'statutoryInfo.esiRegistration.enrolled');

                      // Clear fields if not enrolled
                      if (!isEnrolled) {
                        handleEditInputChange('number', '', 'statutoryInfo.esiRegistration.number');
                        handleEditInputChange('enrollmentDate', '', 'statutoryInfo.esiRegistration.enrollmentDate');
                      }
                    }}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>

                {editEmployeeData.statutoryInfo?.esiRegistration?.enrolled && (
                  <>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">ESI Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editEmployeeData.salaryInfo?.esiNumber || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                          if (value.length <= 10) {
                            handleEditInputChange('esiNumber', value, 'salaryInfo.esiNumber');
                          }
                        }}
                        placeholder="ESI123456789"
                        maxLength="10"
                      />

                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">ESI Enrollment Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editEmployeeData.statutoryInfo?.esiRegistration?.enrollmentDate || ''}
                        onChange={(e) => handleEditInputChange('enrollmentDate', e.target.value, 'statutoryInfo.esiRegistration.enrollmentDate')}
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
                    value={editEmployeeData.statutoryInfo?.professionalTax?.applicable || false}
                    onChange={(e) => {
                      const isApplicable = e.target.value === 'true';
                      handleEditInputChange('applicable', isApplicable, 'statutoryInfo.professionalTax.applicable');

                      // Clear fields if not applicable
                      if (!isApplicable) {
                        handleEditInputChange('state', '', 'statutoryInfo.professionalTax.state');
                        handleEditInputChange('ptNumber', '', 'statutoryInfo.professionalTax.ptNumber');
                      }
                    }}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>

                {editEmployeeData.statutoryInfo?.professionalTax?.applicable && (
                  <>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">State</label>
                      <select
                        className="form-select"
                        value={editEmployeeData.statutoryInfo?.professionalTax?.state || ''}
                        onChange={(e) => handleEditInputChange('state', e.target.value, 'statutoryInfo.professionalTax.state')}
                      >
                        <option value="">Select State</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Delhi">Delhi</option>
                        <option value="West Bengal">West Bengal</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">PT Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editEmployeeData.statutoryInfo?.professionalTax?.ptNumber || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                          if (value.length <= 11) {
                            handleEditInputChange('ptNumber', value, 'statutoryInfo.professionalTax.ptNumber');
                          }
                        }}
                        placeholder="12345678901"
                        maxLength="11"
                      />

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
                    value={editEmployeeData.statutoryInfo?.labourWelfareFund?.enrolled || false}
                    onChange={(e) => {
                      const isEnrolled = e.target.value === 'true';
                      handleEditInputChange('enrolled', isEnrolled, 'statutoryInfo.labourWelfareFund.enrolled');

                      // Clear enrollment date if not enrolled
                      if (!isEnrolled) {
                        handleEditInputChange('enrollmentDate', '', 'statutoryInfo.labourWelfareFund.enrollmentDate');
                      }
                    }}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>

                {editEmployeeData.statutoryInfo?.labourWelfareFund?.enrolled && (
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Enrollment Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={editEmployeeData.statutoryInfo?.labourWelfareFund?.enrollmentDate || ''}
                      onChange={(e) => handleEditInputChange('enrollmentDate', e.target.value, 'statutoryInfo.labourWelfareFund.enrollmentDate')}
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
                    value={editEmployeeData.statutoryInfo?.gratuity?.eligible || false}
                    onChange={(e) => {
                      const isEligible = e.target.value === 'true';
                      handleEditInputChange('eligible', isEligible, 'statutoryInfo.gratuity.eligible');

                      // Clear eligibility date if not eligible
                      if (!isEligible) {
                        handleEditInputChange('eligibilityDate', '', 'statutoryInfo.gratuity.eligibilityDate');
                      }
                    }}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>

                {editEmployeeData.statutoryInfo?.gratuity?.eligible && (
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Eligibility Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={editEmployeeData.statutoryInfo?.gratuity?.eligibilityDate || ''}
                      onChange={(e) => handleEditInputChange('eligibilityDate', e.target.value, 'statutoryInfo.gratuity.eligibilityDate')}
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
                    value={editEmployeeData.statutoryInfo?.bonusAct?.applicable || false}
                    onChange={(e) => handleEditInputChange('applicable', e.target.value === 'true', 'statutoryInfo.bonusAct.applicable')}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
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
                    value={editEmployeeData.statutoryInfo?.shopsAndEstablishment?.registered || false}
                    onChange={(e) => {
                      const isRegistered = e.target.value === 'true';
                      handleEditInputChange('registered', isRegistered, 'statutoryInfo.shopsAndEstablishment.registered');

                      // Clear fields if not registered
                      if (!isRegistered) {
                        handleEditInputChange('registrationNumber', '', 'statutoryInfo.shopsAndEstablishment.registrationNumber');
                        handleEditInputChange('registrationDate', '', 'statutoryInfo.shopsAndEstablishment.registrationDate');
                      }
                    }}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>

                {editEmployeeData.statutoryInfo?.shopsAndEstablishment?.registered && (
                  <>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Registration Number</label>

                      <input
                        type="text"
                        className="form-control"
                        value={
                          editEmployeeData.statutoryInfo?.shopsAndEstablishment?.registrationNumber || ''
                        }
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();

                          // Allow only A–Z, 0–9, and hyphen, max 15 chars
                          if (value.length <= 15 && /^[A-Z0-9-]*$/.test(value)) {
                            handleEditInputChange(
                              'registrationNumber',
                              value,
                              'statutoryInfo.shopsAndEstablishment.registrationNumber'
                            );
                          }
                        }}
                        placeholder="Registration number"
                        maxLength={15}
                      />

                    </div>


                    <div className="col-md-6">
                      <label className="form-label fw-bold">Registration Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editEmployeeData.statutoryInfo?.shopsAndEstablishment?.registrationDate || ''}
                        onChange={(e) => handleEditInputChange('registrationDate', e.target.value, 'statutoryInfo.shopsAndEstablishment.registrationDate')}
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
            onClick={handleCancelEdit}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center"
            onClick={handleSaveEditedEmployee}
            disabled={
              !editEmployeeData.name ||
              !editEmployeeData.email ||
              !editEmployeeData.employmentInfo?.designation ||
              !editEmployeeData.salary
            }
          >
            <Icon icon="heroicons:check-circle" className="mr-2" />
            <span>Save Changes</span>
          </button>
        </div>

    </Modal>
  );
};

export default EditEmployeeModal;