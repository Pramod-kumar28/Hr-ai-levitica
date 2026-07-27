import React, { useState } from "react";
import { FaUserCircle, FaMoon } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BASE_URL, API_ENDPOINTS } from "../../../shared/constants/api.config";

const Onboardingdetails = () => {
    const [formData, setFormData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        gender: "",
        dob: "",
        photo: null,
    });

    const [step, setStep] = useState(1); // Track onboarding step
    const [submitting, setSubmitting] = useState(false);
    const [recordId, setRecordId] = useState(
        () => localStorage.getItem("basicDetailsRecordId") || null
    );

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "photo") {
            setFormData({ ...formData, [name]: files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.firstName || !formData.lastName || !formData.gender || !formData.dob) {
            toast.error("Please fill all required fields!");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${BASE_URL}${API_ENDPOINTS.BASIC_DETAILS.SUBMIT}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    first_name: formData.firstName,
                    middle_name: formData.middleName || null,
                    last_name: formData.lastName,
                    gender: formData.gender,
                    date_of_birth: formData.dob,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "Failed to submit basic details");
            }

            const saved = await res.json();
            setRecordId(saved.id);
            localStorage.setItem("basicDetailsRecordId", saved.id);

            // Photo upload has no matching backend field yet (basic_details
            // model only stores name/gender/DOB) — kept local-only until a
            // profile-photo endpoint exists.

            toast.success("Form submitted successfully!");
            setStep(step + 1);
        } catch (err) {
            toast.error(err.message || "Failed to submit basic details");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveDraft = () => {
        localStorage.setItem("onboardingDraft", JSON.stringify(formData));
        toast.info("Progress saved as draft!");
    };

    const handleCancel = () => {
        setFormData({
            firstName: "",
            middleName: "",
            lastName: "",
            gender: "",
            dob: "",
            photo: null,
        });
        toast.warn("Form reset!");
    };

    return (
        <div className="d-flex justify-content-center mt-5">
            <div className="card shadow-sm rounded-4 p-3" style={{ width: "1020px" }}>
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                        <img
                            src="./assets/img/icons/logo-1.png"
                            alt="Company Logo"
                            className="rounded-circle me-2"
                            style={{ height: "50px", width: "50px" }}
                        />
                        <div>
                            <h6 className="mb-0">
                                Onboarding Form{formData.firstName ? `: ${formData.firstName}` : ""}
                                {recordId ? " (saved)" : ""}
                            </h6>
                            <small className="text-muted">Levitica Technologies Private Limited</small>
                        </div>
                    </div>
                    <FaMoon className="fs-5 text-secondary" />
                </div>

                {/* Progress */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold text-primary">Basic Details</span>
                    <small>Step {step} of 11</small>
                </div>
                <div className="progress mb-3" style={{ height: "5px" }}>
                    <div
                        className="progress-bar bg-primary"
                        role="progressbar"
                        style={{ width: `${(step / 11) * 100}%` }}
                    ></div>
                </div>
                <small className="text-muted d-block mb-3">{Math.round((step / 11) * 100)}% completed</small>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Show only Step 1 form fields */}
                    {step === 1 && (
                        <>
                            <div className="row mb-4">
                                <div className="col-6">
                                    <label className="form-label">First Name *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="First Name"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        maxLength="100"
                                    />
                                    <small className="text-muted">
                                        {100 - formData.firstName.length} chars left
                                    </small>
                                </div>

                                {/* Upload Photo */}
                                <div className="col-4 text-center  mx-5">
                                    {formData.photo ? (
                                        <img
                                            src={URL.createObjectURL(formData.photo)}
                                            alt="Preview"
                                            className="rounded-circle mb-2 "
                                            style={{
                                                width: "100px",
                                                height: "100px",
                                                objectFit: "",
                                            }}
                                        />
                                    ) : (
                                        <FaUserCircle size={70} className="text-secondary mb-2" />
                                    )}
                                    <div>
                                        <input
                                            type="file"
                                            name="photo"
                                            onChange={handleChange}
                                            className="form-control form-control-sm"
                                        />
                                        <small className="text-muted">Upload your photo</small>
                                    </div>
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col">
                                    <label className="form-label">Middle Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Middle name"
                                        name="middleName"
                                        value={formData.middleName}
                                        onChange={handleChange}
                                        maxLength="100"
                                    />
                                    <small className="text-muted">
                                        {100 - formData.middleName.length} chars left
                                    </small>
                                </div>
                                <div className="col">
                                    <label className="form-label">Last Name *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Last Name"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        maxLength="100"
                                    />
                                    <small className="text-muted">
                                        {100 - formData.lastName.length} chars left
                                    </small>
                                </div>
                            </div>

                            {/* Gender & DOB */}
                            <div className="row mb-3">
                                <div className="col">
                                    <label className="form-label">Gender *</label>
                                    <select
                                        className="form-select"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                    >
                                        <option value="">Please select</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="col">
                                    <label className="form-label">Date of Birth *</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="dob"
                                        value={formData.dob}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Buttons */}
                    <div className="d-flex justify-content-between">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            disabled={step === 1}
                            onClick={() => setStep(step - 1)}
                        >
                            ← Back
                        </button>

                        <div>
                            <button
                                type="button"
                                className="btn btn-outline-warning me-2"
                                onClick={handleSaveDraft}
                            >
                                Save Draft
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-danger me-2"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                            <button className="btn btn-primary" type="submit" disabled={submitting}>
                                {submitting ? "Submitting..." : "Continue →"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Toastify Container */}
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
};

export default Onboardingdetails;