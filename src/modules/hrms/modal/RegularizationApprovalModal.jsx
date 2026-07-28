import React from 'react';
import { Icon } from '@iconify/react';
import Modal from '../../../shared/components/Modal';

const RegularizationApprovalModal = ({
  isOpen,
  onClose,
  selectedRequest,
  approvalForm,
  setApprovalForm,
  handleApproveRequest
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Details & Approval"
      size="md"
    >
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-slate-500">Employee</p>
            <p className="font-bold text-slate-800">{selectedRequest?.employeeName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Department</p>
            <p className="font-bold text-slate-800">{selectedRequest?.department}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500">Request Type</p>
          <p className="font-bold text-slate-800 capitalize">{selectedRequest?.requestType?.replace('_', ' ')}</p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Reason</p>
          <p className="text-sm text-slate-700">{selectedRequest?.reason}</p>
        </div>

        {selectedRequest?.status === "pending" && (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Action <span className="text-rose-500">*</span></label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
                value={approvalForm.action}
                onChange={(e) => setApprovalForm({ ...approvalForm, action: e.target.value })}
              >
                <option value="">Select action...</option>
                <option value="approve">Approve</option>
                <option value="reject">Reject</option>
                <option value="request_changes">Request Changes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Remarks</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-y"
                rows="3"
                value={approvalForm.remarks}
                onChange={(e) => setApprovalForm({ ...approvalForm, remarks: e.target.value })}
                placeholder="Enter approval remarks"
              />
            </div>
          </>
        )}

        {selectedRequest?.status !== "pending" && (
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-sm text-slate-600">This request has been <span className="font-bold capitalize">{selectedRequest?.status}</span></p>
            <p className="text-xs text-slate-400 mt-1">
              {selectedRequest?.status === "approved" ? `Approved by ${selectedRequest?.approvedBy || "Manager"}` :
                `Rejected by ${selectedRequest?.rejectedBy || "Manager"}`}
            </p>
            {selectedRequest?.reviewComments && (
              <p className="text-xs text-slate-500 mt-2 italic">"{selectedRequest.reviewComments}"</p>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
            onClick={onClose}
          >
            Close
          </button>
          {selectedRequest?.status === "pending" && (
            <>
              <button
                type="button"
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/10"
                onClick={() => handleApproveRequest(selectedRequest.id, true)}
              >
                <Icon icon="heroicons:check" className="w-4 h-4" />
                Approve
              </button>
              <button
                type="button"
                className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm shadow-rose-500/10"
                onClick={() => handleApproveRequest(selectedRequest.id, false)}
              >
                <Icon icon="heroicons:x-mark" className="w-4 h-4" />
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default RegularizationApprovalModal;