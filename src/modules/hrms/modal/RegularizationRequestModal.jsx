import React from 'react';
import { Icon } from '@iconify/react';
import Modal from '../../../shared/components/Modal';

const RegularizationRequestModal = ({
  isOpen,
  onClose,
  requestForm,
  setRequestForm,
  requestType,
  setRequestType,
  handleSubmitRequest,
  employees,
  isSubmitting = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Regularization Request"
      size="lg"
    >
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Request Type <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
              value={requestForm.requestType}
              onChange={(e) => {
                setRequestType(e.target.value);
                setRequestForm({ ...requestForm, requestType: e.target.value });
              }}
            >
              <option value="missing">Missing Punch</option>
              <option value="incorrect">Incorrect Time</option>
              <option value="forgot">Forgot Punch</option>
              <option value="wfh">WFH Regularization</option>
              <option value="on_duty">On-Duty</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Employee <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
              value={requestForm.employeeId}
              onChange={(e) => setRequestForm({ ...requestForm, employeeId: e.target.value })}
            >
              <option value="">Select employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic fields based on request type */}
        {requestType === "missing" && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              value={requestForm.dateTime}
              onChange={(e) => setRequestForm({ ...requestForm, dateTime: e.target.value })}
            />
          </div>
        )}

        {requestType === "incorrect" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Original Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                value={requestForm.originalTime}
                onChange={(e) => setRequestForm({ ...requestForm, originalTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Corrected Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                value={requestForm.correctedTime}
                onChange={(e) => setRequestForm({ ...requestForm, correctedTime: e.target.value })}
              />
            </div>
          </div>
        )}

        {requestType === "forgot" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                value={requestForm.date}
                onChange={(e) => setRequestForm({ ...requestForm, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Punch Type</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
                value={requestForm.punchType}
                onChange={(e) => setRequestForm({ ...requestForm, punchType: e.target.value })}
              >
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Approx Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                value={requestForm.approxTime}
                onChange={(e) => setRequestForm({ ...requestForm, approxTime: e.target.value })}
              />
            </div>
          </div>
        )}

        {requestType === "wfh" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  value={requestForm.date}
                  onChange={(e) => setRequestForm({ ...requestForm, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  value={requestForm.location}
                  onChange={(e) => setRequestForm({ ...requestForm, location: e.target.value })}
                  placeholder="Work location"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Work Summary <span className="text-rose-500">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-y"
                rows="3"
                value={requestForm.summary}
                onChange={(e) => setRequestForm({ ...requestForm, summary: e.target.value })}
                placeholder="Enter work summary"
              />
            </div>
          </div>
        )}

        {requestType === "on_duty" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  value={requestForm.date}
                  onChange={(e) => setRequestForm({ ...requestForm, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  From Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  value={requestForm.fromTime}
                  onChange={(e) => setRequestForm({ ...requestForm, fromTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  To Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  value={requestForm.toTime}
                  onChange={(e) => setRequestForm({ ...requestForm, toTime: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Duty Type <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
                  value={requestForm.dutyType}
                  onChange={(e) => setRequestForm({ ...requestForm, dutyType: e.target.value })}
                >
                  <option value="">Select...</option>
                  <option value="client_visit">Client Visit</option>
                  <option value="training">Training</option>
                  <option value="business_travel">Business Travel</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Purpose/Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  value={requestForm.purpose}
                  onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
                  placeholder="Enter purpose/location"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Reason <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
            value={requestForm.reason}
            onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
            placeholder="Enter reason"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Remarks <span className="text-rose-500">*</span>
          </label>
          <textarea
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-y"
            rows="3"
            value={requestForm.remarks}
            onChange={(e) => setRequestForm({ ...requestForm, remarks: e.target.value })}
            placeholder="Enter remarks"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Attachment</label>
          <input
            type="file"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => setRequestForm({ ...requestForm, attachment: e.target.files[0] })}
          />
          <p className="text-xs text-slate-400 mt-1">Travel bills, Client emails, etc.</p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-500/10"
            onClick={handleSubmitRequest}
          >
            <Icon icon={isSubmitting ? "heroicons:arrow-path" : "heroicons:paper-airplane"} className={`w-4 h-4 ${isSubmitting ? "animate-spin" : ""}`} />
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RegularizationRequestModal;