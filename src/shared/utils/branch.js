// Branch (Company Location) selection utilities.
// Only meaningful for the 'company' role today — 'admin' users are branch-
// locked server-side (see core/dependencies.py get_current_location_id) and
// never get a selector, they just see a read-only badge for their branch.

const SELECTED_BRANCH_KEY = 'selectedBranchId';

// Returns the selected branch id as a string, or null for "All Branches".
export const getSelectedBranchId = () => {
  const v = localStorage.getItem(SELECTED_BRANCH_KEY);
  return v && v !== 'all' ? v : null;
};

// Pass null/undefined to select "All Branches".
export const setSelectedBranchId = (locationId) => {
  if (locationId === null || locationId === undefined) {
    localStorage.removeItem(SELECTED_BRANCH_KEY);
  } else {
    localStorage.setItem(SELECTED_BRANCH_KEY, String(locationId));
  }
  // Broadcast so any open listeners (e.g. list pages) can react without a
  // full reload if they choose to; BranchSelector itself reloads the page
  // by default to keep this simple and correct everywhere at once.
  window.dispatchEvent(new CustomEvent('branchchange', { detail: { locationId } }));
};

export const clearSelectedBranch = () => {
  localStorage.removeItem(SELECTED_BRANCH_KEY);
};