import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Modal from '../../../shared/components/Modal';

// Matches FinalSettlementCreate (schema/Payroll/final_settlement.py). The
// Employee model doesn't carry UAN/PF/PAN, so those stay optional manual
// inputs here rather than being auto-filled from the employee record.
const EXIT_TYPES = ['Resignation', 'Termination', 'Retirement', 'Absconding', 'Contract End'];

const InitiateSettlementModal = ({ isOpen, onClose, onSubmit, employees = [], preselectedEmployeeId = '' }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    exitType: 'Resignation',
    resignationDate: '',
    lastWorkingDate: '',
    noticePeriodRequiredDays: 90,
    uanNumber: '',
    pfNumber: '',
    panNumber: '',
    remarks: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        employeeId: preselectedEmployeeId || '',
        exitType: 'Resignation',
        resignationDate: '',
        lastWorkingDate: '',
        noticePeriodRequiredDays: 90,
        uanNumber: '',
        pfNumber: '',
        panNumber: '',
        remarks: '',
      });
      setIsSubmitting(false);
    }
  }, [isOpen, preselectedEmployeeId]);

  const selectedEmployee = employees.find((e) => String(e.id) === String(formData.employeeId));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.employeeId) {
      alert('Please select an employee');
      return;
    }
    if (!formData.lastWorkingDate) {
      alert('Please select the last working date');
      return;
    }
    setIsSubmitting(true);
    onSubmit(formData, selectedEmployee);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Initiate Final Settlement" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 p-2">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Employee <span className="text-rose-500">*</span>
          </label>
          <select
            name="employeeId"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
            value={formData.employeeId}
            onChange={handleChange}
            required
          >
            <option value="">Select an employee...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.employeeId}) - {emp.department}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Exit Type</label>
            <select
              name="exitType"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
              value={formData.exitType}
              onChange={handleChange}
            >
              {EXIT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notice Period Required (days)</label>
            <input
              type="number"
              name="noticePeriodRequiredDays"
              min="0"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              value={formData.noticePeriodRequiredDays}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Resignation Date</label>
            <input
              type="date"
              name="resignationDate"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              value={formData.resignationDate}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Last Working Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="lastWorkingDate"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              value={formData.lastWorkingDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">UAN Number</label>
            <input
              type="text"
              name="uanNumber"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              value={formData.uanNumber}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">PF Number</label>
            <input
              type="text"
              name="pfNumber"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              value={formData.pfNumber}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">PAN Number</label>
            <input
              type="text"
              name="panNumber"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              value={formData.panNumber}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Remarks</label>
          <textarea
            name="remarks"
            rows="2"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-none"
            value={formData.remarks}
            onChange={handleChange}
          />
        </div>

        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <Icon icon="heroicons:information-circle" className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            This creates the settlement in Draft status with default sub-blocks (salary, leave, bonus,
            gratuity, deductions) all zeroed out — fill those in from the workspace tabs afterwards, then
            Recalculate.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Icon icon="heroicons:plus-circle" className="w-4 h-4" />
                Initiate Settlement
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default InitiateSettlementModal;
