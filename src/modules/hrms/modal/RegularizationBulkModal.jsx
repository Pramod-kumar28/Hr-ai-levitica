import React from 'react';
import { Icon } from '@iconify/react';
import Modal from '../../../shared/components/Modal';

const RegularizationBulkModal = ({
  isOpen,
  onClose,
  bulkForm,
  setBulkForm,
  handleBulkProcess,
  isSubmitting = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Regularization Processing"
      size="lg"
    >
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              From Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              value={bulkForm.fromDate}
              onChange={(e) => setBulkForm({ ...bulkForm, fromDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              To Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              value={bulkForm.toDate}
              onChange={(e) => setBulkForm({ ...bulkForm, toDate: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Issue Type <span className="text-rose-500">*</span>
          </label>
          <select
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
            value={bulkForm.issueType}
            onChange={(e) => setBulkForm({ ...bulkForm, issueType: e.target.value })}
          >
            <option value="">Select issue type...</option>
            <option value="system">System Failure</option>
            <option value="device">Device Malfunction</option>
            <option value="sync">Sync Error</option>
            <option value="network">Network Failure</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Upload Employee List</label>
          <input
            type="file"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setBulkForm({ ...bulkForm, file: e.target.files[0] })}
          />
          <p className="text-xs text-slate-400 mt-1">Upload file with employee IDs or process all employees for the date range</p>
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
            onClick={handleBulkProcess}
          >
            <Icon icon={isSubmitting ? "heroicons:arrow-path" : "heroicons:arrow-up-tray"} className={`w-4 h-4 ${isSubmitting ? "animate-spin" : ""}`} />
            {isSubmitting ? "Processing..." : "Process Bulk"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RegularizationBulkModal;