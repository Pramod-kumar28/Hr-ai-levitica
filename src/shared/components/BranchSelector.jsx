import React, { useEffect, useState } from 'react';
import { locationAPI } from '../utils/api';
import { getUserRole } from '../utils/auth';
import { getSelectedBranchId, setSelectedBranchId } from '../utils/branch';

// Shown in the dashboard topbar.
// - 'company': dropdown to switch between "All Branches" and any single
//   branch. Selecting a branch narrows every list/report to that branch via
//   the X-Location-Id header (see api.js); "All Branches" clears it.
// - 'admin': a plain read-only badge with their one branch name. They are
//   branch-locked server-side regardless of any header, so there is
//   nothing for them to switch — this just makes their scope visible.
// - anyone else (hr_admin/recruiter/candidate/superadmin outside the
//   company dashboard): renders nothing.
const BranchSelector = () => {
  const role = getUserRole();
  const [branches, setBranches] = useState([]);
  const [selected, setSelected] = useState(getSelectedBranchId());
  const [loading, setLoading] = useState(true);

  const showSelector = role === 'company';
  const showBadge = role === 'admin';

  useEffect(() => {
    if (!showSelector && !showBadge) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    locationAPI.list()
      .then((res) => {
        if (cancelled) return;
        const list = res?.locations || res || [];
        setBranches(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setBranches([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [showSelector, showBadge]);

  if (loading || (!showSelector && !showBadge)) return null;

  if (showBadge) {
    const branchName = branches[0]?.name || branches[0]?.branch_name || 'Your Branch';
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 6,
          background: '#eef2ff',
          color: '#3730a3',
          fontSize: 13,
          fontWeight: 500
        }}
        title="You are scoped to this branch"
      >
        📍 {branchName}
      </span>
    );
  }

  const handleChange = (e) => {
    const value = e.target.value;
    const next = value === 'all' ? null : value;
    setSelected(next);
    setSelectedBranchId(next);
    // Simplest correct way to make every already-mounted list/report page
    // (which fetched its data before the branch changed) reflect the new
    // scope without threading a live subscription through every page.
    window.location.reload();
  };

  return (
    <select
      value={selected || 'all'}
      onChange={handleChange}
      style={{
        padding: '6px 10px',
        borderRadius: 6,
        border: '1px solid #d1d5db',
        fontSize: 13,
        background: '#fff',
        cursor: 'pointer'
      }}
      title="Filter by branch"
    >
      <option value="all">All Branches</option>
      {branches.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name || b.branch_name || `Branch #${b.id}`}
        </option>
      ))}
    </select>
  );
};

export default BranchSelector;