import React, { useState, useEffect, useRef } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { adminAPI } from "../../shared/utils/api";
import { BASE_URL } from "../../shared/constants/api.config";
import { API_ENDPOINTS } from "../../shared/constants/api.config";
import { UserPlus } from "lucide-react";

const SuperAdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const hasFetchedRef = useRef(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    role: 'recruiter',
    is_active: true,
    tenant_id: '',
    location_id: ''
  });
  const [tenants, setTenants] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  useEffect(() => {
    const loadTenants = async () => {
      try {
        const res = await fetch(`${BASE_URL}${API_ENDPOINTS.SUPER_ADMIN.TENANTS}`);
        if (res.ok) {
          const data = await res.json();
          setTenants(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load tenants', err);
      }
    };
    loadTenants();
  }, []);

  // Load branches for the selected company whenever it changes (only
  // relevant when role is "admin" — branch-scoped admin).
  useEffect(() => {
    if (formData.role !== 'admin' || !formData.tenant_id) {
      setBranches([]);
      return;
    }
    const loadBranches = async () => {
      setBranchesLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BASE_URL}${API_ENDPOINTS.SUPER_ADMIN.TENANT_LOCATIONS(formData.tenant_id)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          setBranches(await res.json());
        } else {
          setBranches([]);
        }
      } catch (err) {
        console.error('Failed to load branches', err);
        setBranches([]);
      } finally {
        setBranchesLoading(false);
      }
    };
    loadBranches();
  }, [formData.role, formData.tenant_id]);

  // Fetch users and summary
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const usersList = await adminAPI.listUsersCompat();
      const normalizedUsers = Array.isArray(usersList) ? usersList : [];
      setUsers(normalizedUsers);

      try {
        const summaryData = await adminAPI.getSummary();
        if (summaryData && typeof summaryData === 'object') {
          setSummary({
            total_users: Number(summaryData.total_users ?? normalizedUsers.length),
            users: Array.isArray(summaryData.users) ? summaryData.users : normalizedUsers
          });
        } else {
          setSummary({ total_users: normalizedUsers.length, users: normalizedUsers });
        }
      } catch (_) {
        // If summary endpoint is unavailable, derive cards from users list.
        setSummary({ total_users: normalizedUsers.length, users: normalizedUsers });
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      const message = String(err?.message || '');
      if (message.includes('401') || message.includes('403') || message.toLowerCase().includes('permission')) {
        setError('Access denied. Please login with a superadmin account.');
      } else {
        setError('Network error. Please check if backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Guard repeated DEV fetch caused by React.StrictMode double-invocation.
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchData();
  }, []);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role?.toLowerCase() === filterRole.toLowerCase();

    return matchesSearch && matchesRole;
  });

  // Handle form input
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      username: '',
      email: '',
      role: 'recruiter',
      is_active: true,
      tenant_id: '',
      location_id: ''
    });
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'recruiter',
      is_active: user.is_active !== undefined ? user.is_active : true,
      tenant_id: user.tenant_id || '',
      location_id: user.location_id || ''
    });
    setShowModal(true);
  };

  // Save user
  const saveUser = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const url = editingUser
        ? `${BASE_URL}/api/admin/superadmin/users/${editingUser.id}`
        : `${BASE_URL}/api/admin/superadmin/users`;

      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          tenant_id: formData.tenant_id === '' ? null : Number(formData.tenant_id),
          location_id: formData.location_id === '' ? null : Number(formData.location_id)
        })
      });

      if (response.ok) {
        alert(editingUser ? 'User updated successfully' : 'User created successfully');
        setShowModal(false);
        fetchData();
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Error saving user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user');
    }
  };

  // Delete user
  const deleteUser = async (user) => {
    if (user.role?.toLowerCase() === 'superadmin') {
      alert('The Super Admin account cannot be deleted.');
      return;
    }

    const confirmed = window.confirm(
      `Delete ${user.name || user.email}? This action is permanent and cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/admin/superadmin/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok || response.status === 204) {
        alert('User deleted successfully');
        fetchData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.detail || 'Error deleting user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  // Get role badge color
  const getRoleBadge = (role) => {
    const colors = {
      'superadmin': 'danger',
      'admin': 'warning',
      'recruiter': 'primary',
      'company': 'info',
      'candidate': 'secondary'
    };
    return colors[role?.toLowerCase()] || 'secondary';
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="mb-2">Super Admin Panel</h4>
          <p className="text-secondary-light mb-0">Manage users and system settings</p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            className="btn btn-primary"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            className="btn btn-success d-inline-flex align-items-center"
            onClick={openCreateModal}
          >
            Create User
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {summary && (
        <div className="card border shadow-none mb-4">
          <div className="card-body d-flex">
            <div className="text-center w-25">
              <div className="text-secondary-light small">Total Users</div>
              <div className="h4 mb-0">{summary.total_users || 0}</div>
            </div>
            <div className="text-center w-25 border-start ps-4">
              <div className="text-secondary-light small">Active Users</div>
              <div className="h4 mb-0 text-success">
                {users.filter(u => u.is_active).length}
              </div>
            </div>
            <div className="text-center w-25 border-start ps-4">
              <div className="text-secondary-light small">Inactive Users</div>
              <div className="h4 mb-0 text-warning">
                {users.filter(u => !u.is_active).length}
              </div>
            </div>
            <div className="text-center w-25 border-start ps-4">
              <div className="text-secondary-light small">Super Admins</div>
              <div className="h4 mb-0 text-danger">
                {users.filter(u => u.role?.toLowerCase() === 'superadmin').length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card border shadow-none mb-4">
        <div className="card-body d-flex gap-3 align-items-center">
          <div className="flex-grow-1">
            <input
              className="form-control"
              style={{ maxWidth: '400px' }}
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="form-select w-auto"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="recruiter">Recruiter</option>
            <option value="company">Company</option>
            <option value="candidate">Candidate</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-secondary-light">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card border shadow-none">
          <div className="card-body text-center py-5">
            <h5 className="mb-2">No Users Found</h5>
            <p className="text-secondary-light mb-3">
              {searchTerm || filterRole !== 'all'
                ? 'No users match your search criteria.'
                : 'No users found in the system.'}
            </p>
            {!searchTerm && filterRole === 'all' && (
              <button
                className="btn btn-primary d-inline-flex align-items-center gap-2"
                onClick={openCreateModal}
              >
                <UserPlus size={18} />
                <span>Create First User</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card border shadow-none">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-start">USER</th>
                    <th className="text-start">EMAIL</th>
                    <th className="text-center">ROLE</th>
                    <th className="text-center">STATUS</th>
                    <th className="text-center">CREATED</th>
                    <th className="text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td className="text-start">
                        <div className="d-flex align-items-center">
                          <div className="w-40-px h-40-px bg-primary-subtle text-primary rounded-circle d-flex justify-content-center align-items-center fw-bold me-2">
                            {user.name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="fw-medium">{user.name || user.username || 'N/A'}</div>
                            <small className="text-muted">@{user.username || 'N/A'}</small>
                          </div>
                        </div>
                      </td>
                      <td className="text-start">
                        {user.email || 'N/A'}
                      </td>
                      <td className="text-center">
                        <span className={`badge bg-${getRoleBadge(user.role)}`}>
                          {user.role || 'N/A'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${user.is_active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="text-muted small">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => openEditModal(user)}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteUser(user)}
                            title="Delete"
                            disabled={user.role?.toLowerCase() === 'superadmin'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit User Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1050,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          tabIndex="-1"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" style={{
            maxWidth: '600px',
            width: '95%',
            margin: '0 auto'
          }}>
            <div className="modal-content" style={{ borderRadius: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {editingUser ? 'Edit User' : 'Create New User'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Username *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="Enter username"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Role *</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      required
                    >
                      <option value="recruiter">Recruiter</option>
                      <option value="admin">Admin</option>
                      <option value="hr_admin">HR Admin</option>
                      <option value="company">Company</option>
                      <option value="candidate">Candidate</option>
                      {editingUser && editingUser.role?.toLowerCase() === 'superadmin' && (
                        <option value="superadmin">Super Admin</option>
                      )}
                    </select>
                  </div>
                  {['admin', 'hr_admin', 'recruiter', 'company'].includes(formData.role) && (
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Company {['admin', 'hr_admin'].includes(formData.role) && <span className="text-danger">*</span>}
                      </label>
                      <select
                        className="form-select"
                        value={formData.tenant_id}
                        onChange={(e) => handleInputChange('tenant_id', e.target.value)}
                        required={['admin', 'hr_admin'].includes(formData.role)}
                      >
                        <option value="">Select a company...</option>
                        {tenants.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.tenant_name || t.name}
                          </option>
                        ))}
                      </select>
                      <small className="text-muted">
                        Which company this user belongs to — required for HR Admin/Admin to manage
                        branches, Company Settings, and employees.
                      </small>
                    </div>
                  )}
                  {formData.role === 'admin' && formData.tenant_id && (
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Branch (optional)</label>
                      <select
                        className="form-select"
                        value={formData.location_id}
                        onChange={(e) => handleInputChange('location_id', e.target.value)}
                        disabled={branchesLoading}
                      >
                        <option value="">Whole company (all branches)</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}{b.is_default ? ' (Default)' : ''}
                          </option>
                        ))}
                      </select>
                      <small className="text-muted">
                        Leave as "Whole company" for a company-wide admin. Pick a branch to
                        restrict this admin to only that branch's Recruitment, CRM, HR
                        Management, Productivity, and Company Settings data.
                      </small>
                      {branchesLoading && <small className="text-muted d-block">Loading branches…</small>}
                    </div>
                  )}
                  <div className="col-md-12">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => handleInputChange('is_active', e.target.checked)}
                        id="isActive"
                      />
                      <label className="form-check-label" htmlFor="isActive">
                        Active User
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={saveUser}
                >
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default SuperAdminPanel;