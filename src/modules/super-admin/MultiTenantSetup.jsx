import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BASE_URL, API_ENDPOINTS } from '../../shared/constants/api.config';

// Tenant management endpoints now require a superadmin-authenticated
// request (previously wide open with no auth check at all).
const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const MultiTenantSetup = () => {
  // ---------------- TENANTS DATA (loaded from the real backend) ----------------
  // The backend's Tenant row only has tenant_name/domain/contact_*/plan/
  // max_employees/is_active — everything else here (companySize, colors,
  // logoUrl, ssoEnabled, dataRetentionPeriod, trialEndsAt, etc.) is stored
  // inside its `extra_settings` JSON column and unpacked back out below.
  const [tenants, setTenants] = useState([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [tenantsError, setTenantsError] = useState(null);

  const mapBackendTenant = (row) => {
    const extra = row.extra_settings || {};
    return {
      id: row.id,
      name: row.tenant_name,
      domain: row.domain || '',
      companySize: extra.companySize || 'Small',
      employeeCount: row.max_employees, // NOTE: this is the configured plan cap, not a live headcount — no per-tenant employee table exists yet to count from
      subscriptionPlan: row.plan,
      status: row.is_active ? (extra.status || 'active') : 'inactive',
      primaryColor: extra.primaryColor || '#1890ff',
      logoUrl: extra.logoUrl || 'https://via.placeholder.com/40',
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone || '',
      createdAt: row.created_at ? row.created_at.split('T')[0] : '',
      trialEndsAt: extra.trialEndsAt || '',
      dataUsage: extra.dataUsage || '0%',
      lastActive: extra.lastActive || '',
      tenantContext: extra.tenantContext || `tenant_${(row.domain || row.tenant_name).replace(/[^a-zA-Z0-9]/g, '_')}`,
      schemaType: extra.schemaType || 'shared',
      dataRetentionPeriod: extra.dataRetentionPeriod ?? 7,
      performanceTier: extra.performanceTier || 'standard',
      billingEnabled: !!extra.billingEnabled,
      ssoEnabled: !!extra.ssoEnabled,
    };
  };

  const loadTenants = useCallback(async () => {
    setTenantsLoading(true);
    setTenantsError(null);
    try {
      const res = await fetch(`${BASE_URL}${API_ENDPOINTS.SUPER_ADMIN.TENANTS}`, {
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('Failed to load tenants');
      const data = await res.json();
      setTenants(data.map(mapBackendTenant));
    } catch (err) {
      console.error(err);
      setTenantsError(err.message || 'Failed to load tenants');
      toast.error('Failed to load tenants from the server');
    } finally {
      setTenantsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  // ---------------- UI STATES ----------------
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedTenant, setSelectedTenant] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterSize, setFilterSize] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ---------------- ADD TENANT STATE ----------------  
  const [newTenant, setNewTenant] = useState({
    name: '',
    domain: '',
    companySize: 'Small',
    subscriptionPlan: 'Starter',
    contactEmail: '',
    contactPhone: '',
    primaryColor: '#1890ff',
    dataRetentionPeriod: 7, // Years
    schemaType: 'shared', // 'shared' or 'separate'
    billingEnabled: false,
    customConfig: {}
  });

  // ---------------- TENANT PROVISIONING STATE ----------------  
  const [showProvisioningModal, setShowProvisioningModal] = useState(false);
  const [showDeprovisioningModal, setShowDeprovisioningModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [provisioningConfig, setProvisioningConfig] = useState({
    setupType: 'standard', // standard, custom, template
    enableBilling: false,
    enableSSO: false,
    dataRetentionYears: 7,
    performanceTier: 'standard', // standard, premium, enterprise
    customSettings: {}
  });

  // ---------------- STATISTICS ----------------
  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    pending: tenants.filter(t => t.status === 'pending').length,
    suspended: tenants.filter(t => t.status === 'suspended').length,
    inactive: tenants.filter(t => t.status === 'inactive').length,
    totalEmployees: tenants.reduce((sum, t) => sum + t.employeeCount, 0)
  };

  // ---------------- SEARCH + FILTER + SORT ----------------
  const filteredTenants = tenants
    .filter(t => {
      const searchMatch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.domain.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = filterStatus === 'all' || t.status === filterStatus;
      const planMatch = filterPlan === 'all' || t.subscriptionPlan === filterPlan;
      const sizeMatch = filterSize === 'all' || t.companySize === filterSize;

      return searchMatch && statusMatch && planMatch && sizeMatch;
    })
    .sort((a, b) => {
      let A = a[sortBy], B = b[sortBy];

      if (sortBy === 'name') {
        A = A.toLowerCase();
        B = B.toLowerCase();
      }

      if (sortBy === 'employeeCount') {
        A = a.employeeCount;
        B = b.employeeCount;
      }

      if (sortBy === 'createdAt') {
        A = new Date(a.createdAt);
        B = new Date(b.createdAt);
      }

      if (sortOrder === 'asc') return A > B ? 1 : -1;
      else return A < B ? 1 : -1;
    });

  // ---------------- PAGINATION ----------------
  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
  const paginatedTenants = filteredTenants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ---------------- TENANT PROVISIONING HANDLER ----------------
  const handleProvisionTenant = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        tenant_name: newTenant.name,
        domain: newTenant.domain || null,
        contact_email: newTenant.contactEmail,
        contact_phone: newTenant.contactPhone || null,
        plan: newTenant.subscriptionPlan,
        max_employees: 50,
        extra_settings: {
          companySize: newTenant.companySize,
          primaryColor: newTenant.primaryColor,
          logoUrl: 'https://via.placeholder.com/40',
          status: 'pending',
          dataUsage: '0%',
          lastActive: new Date().toISOString(),
          trialEndsAt: '2025-03-31',
          schemaType: provisioningConfig.setupType === 'custom' ? 'separate' : 'shared',
          dataRetentionPeriod: provisioningConfig.dataRetentionYears,
          performanceTier: provisioningConfig.performanceTier,
          billingEnabled: provisioningConfig.enableBilling,
          ssoEnabled: provisioningConfig.enableSSO,
          tenantContext: `tenant_${(newTenant.domain || newTenant.name).replace(/[^a-zA-Z0-9]/g, '_')}`,
        },
      };

      const res = await fetch(`${BASE_URL}${API_ENDPOINTS.SUPER_ADMIN.TENANTS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to provision tenant');
      }
      const created = await res.json();

      setShowAddModal(false);
      setShowProvisioningModal(false);

      // Reset forms
      setNewTenant({
        name: "",
        domain: "",
        companySize: "Small",
        subscriptionPlan: "Starter",
        contactEmail: "",
        contactPhone: "",
        primaryColor: "#1890ff",
        dataRetentionPeriod: 7,
        schemaType: 'shared',
        billingEnabled: false,
        customConfig: {}
      });

      setProvisioningConfig({
        setupType: 'standard',
        enableBilling: false,
        enableSSO: false,
        dataRetentionYears: 7,
        performanceTier: 'standard',
        customSettings: {}
      });

      toast.success(`Tenant "${created.tenant_name}" provisioned successfully!`);
      loadTenants();
    } catch (err) {
      toast.error(err.message || 'Failed to provision tenant');
    }
  };

  // ---------------- CRUD HANDLERS ----------------
  const handleAddTenant = (e) => {
    e.preventDefault();
    setShowProvisioningModal(true);
  };

  // ---------------- TENANT DE-PROVISIONING HANDLER ----------------
  const handleDeprovisionTenant = async () => {
    if (!selectedTenant) return;

    try {
      const res = await fetch(`${BASE_URL}${API_ENDPOINTS.SUPER_ADMIN.TENANT(selectedTenant.id)}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to de-provision tenant');
      }

      setShowDeprovisioningModal(false);
      setShowDeleteModal(false);

      toast.success(
        `Tenant "${selectedTenant.name}" has been de-provisioned. Data will be retained for ${selectedTenant.dataRetentionPeriod || 7} years per retention policy.`
      );
      loadTenants();
    } catch (err) {
      toast.error(err.message || 'Failed to de-provision tenant');
    }
  };

  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    if (!selectedTenant) return;

    try {
      const payload = {
        tenant_name: selectedTenant.name,
        domain: selectedTenant.domain || null,
        contact_email: selectedTenant.contactEmail,
        contact_phone: selectedTenant.contactPhone || null,
        plan: selectedTenant.subscriptionPlan,
        extra_settings: {
          companySize: selectedTenant.companySize,
          primaryColor: selectedTenant.primaryColor,
          logoUrl: selectedTenant.logoUrl,
          status: selectedTenant.status,
          dataUsage: selectedTenant.dataUsage,
          lastActive: selectedTenant.lastActive,
          trialEndsAt: selectedTenant.trialEndsAt,
          schemaType: selectedTenant.schemaType,
          dataRetentionPeriod: selectedTenant.dataRetentionPeriod,
          performanceTier: selectedTenant.performanceTier,
          billingEnabled: selectedTenant.billingEnabled,
          ssoEnabled: selectedTenant.ssoEnabled,
          tenantContext: selectedTenant.tenantContext,
        },
      };

      const res = await fetch(`${BASE_URL}${API_ENDPOINTS.SUPER_ADMIN.TENANT(selectedTenant.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to update tenant');
      }

      toast.success(`Tenant "${selectedTenant.name}" updated`);
      setShowEditModal(false);
      loadTenants();
    } catch (err) {
      toast.error(err.message || 'Failed to update tenant');
    }
  };

  const handleDeleteTenant = () => {
    setShowDeprovisioningModal(true);
  };

  // ---------------- BADGES ----------------
  const getStatusBadge = (status) => {
    const colors = {
      active: "success",
      pending: "warning",
      suspended: "secondary",
      inactive: "danger",
    };

    return (
      <span className={`badge bg-${colors[status]}-subtle text-${colors[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getPlanBadge = (plan) => {
    const color = {
      Starter: "info",
      Professional: "primary",
      Business: "warning",
      Enterprise: "success",
      "Enterprise Plus": "dark",
    }[plan] || "secondary";

    return <span className={`badge bg-${color}-subtle text-${color}`}>{plan}</span>;
  };

  const getSizeBadge = (size) => {
    const color = {
      Small: "info",
      Medium: "primary",
      Large: "warning",
      Enterprise: "danger",
    }[size] || "secondary";

    return <span className={`badge bg-${color}-subtle text-${color}`}>{size}</span>;
  };

  // ---------------- FORMATTERS ----------------
  const formatDate = (date) => new Date(date).toLocaleDateString();
  const formatDateTime = (date) => new Date(date).toLocaleString();

  // ---------------- SIDEBAR MENU ITEMS ----------------
  const menuItems = [
    {
      title: 'Dashboard',
      icon: 'heroicons:home',
      link: '/admin/dashboard',
      active: false
    },
    {
      title: 'Tenant Management',
      icon: 'heroicons:building-office',
      link: '/admin/tenants',
      active: true
    },
    {
      title: 'User Management',
      icon: 'heroicons:users',
      link: '/admin/users'
    },
    {
      title: 'Billing',
      icon: 'heroicons:credit-card',
      link: '/admin/billing'
    },
    {
      title: 'Reports',
      icon: 'heroicons:chart-bar',
      link: '/admin/reports'
    },
    {
      title: 'Settings',
      icon: 'heroicons:cog-6-tooth',
      link: '/admin/settings'
    }
  ];

  // ---------------- USER INFO ----------------
  const userInfo = {
    name: 'Admin User',
    role: 'Super Administrator',
    email: 'admin@hrms.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
  };

  return (
    
      <div className="container-fluid p-4">
        <ToastContainer position="top-right" autoClose={3000} />

        {tenantsError && (
          <div className="alert alert-danger" role="alert">
            {tenantsError}
          </div>
        )}
        {tenantsLoading && (
          <div className="text-muted small mb-3">Loading tenants…</div>
        )}

        {/* ---------------- HEADER ---------------- */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="mb-2">
  <i className="ri-team-line m-2"></i> Multi-Tenant Management
</h5>

            <p className="text-muted">Manage all companies using your HRMS</p>
          </div>

          <button
            className="btn btn-primary d-flex align-items-center"
            onClick={() => setShowAddModal(true)}
          >
            <Icon icon="heroicons:plus" className="me-2" /> Add Tenant
          </button>
        </div>

    <div className="row mb-4" style={{ display: "flex", justifyContent: "space-between" }}>

  <div className="col-12 col-md-2">
    <div className="card text-center p-3 shadow-sm" style={{ minHeight: "110px" }}>
      
         <div className="fw-bold text-secondary-light small">Total Tenants</div>
      <h5 style={{ fontSize: "18px", fontWeight: "600" }}>{stats.total}</h5>
    </div>
  </div>

  <div className="col-12 col-md-2">
    <div className="card text-center p-3 shadow-sm" style={{ minHeight: "110px" }}>

      
         <div className="fw-bold text-secondary-light small">Active</div>
      <h5 style={{ fontSize: "18px", fontWeight: "600" }} className="text-success">{stats.active}</h5>
    </div>
  </div>

  <div className="col-12 col-md-2">
    <div className="card text-center p-3 shadow-sm" style={{ minHeight: "110px" }}>
   
      
         <div className="fw-bold text-secondary-light small">Pending</div>
      <h5 style={{ fontSize: "18px", fontWeight: "600" }} className="text-warning">{stats.pending}</h5>
    </div>
  </div>

  <div className="col-12 col-md-2">
    <div className="card text-center p-3 shadow-sm" style={{ minHeight: "110px" }}>
     
      
         <div className="fw-bold text-secondary-light small">Suspended</div>
      <h5 style={{ fontSize: "18px", fontWeight: "600" }} className="text-secondary">{stats.suspended}</h5>
    </div>
  </div>

  <div className="col-12 col-md-2">
    <div className="card text-center p-3 shadow-sm" style={{ minHeight: "110px" }}>

      
         <div className="fw-bold text-secondary-light small">Total Tenants</div>
      <h5 style={{ fontSize: "18px", fontWeight: "600" }}>{stats.totalEmployees}</h5>
    </div>
  </div>

  <div className="col-12 col-md-2">
    <div className="card text-center p-3 shadow-sm" style={{ minHeight: "110px" }}>

      
         <div className="fw-bold text-secondary-light small">Avg Data Usage</div>
      <h5 style={{ fontSize: "18px", fontWeight: "600" }}>
        {(tenants.reduce((a, t) => a + parseInt(t.dataUsage), 0) / tenants.length).toFixed(1)}%
      </h5>
    </div>
  </div>

</div>


        {/* ---------------- FILTER BAR ---------------- */}
        <div className="card p-3 mb-4">
          <div className="row g-2">

            <div className="col-md-4">
              <input
                type="text"
                placeholder="Search by name or domain..."
                className="form-control"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="col-md-2">
              <select className="form-select" value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}>
                <option value="all">All Plans</option>
                <option value="Starter">Starter</option>
                <option value="Professional">Professional</option>
                <option value="Business">Business</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>

            <div className="col-md-2">
              <select className="form-select" value={filterSize} onChange={(e) => setFilterSize(e.target.value)}>
                <option value="all">All Sizes</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>

            <div className="col-md-2 d-flex gap-2">
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Sort by Name</option>
                <option value="employeeCount">Sort by Employees</option>
                <option value="createdAt">Sort by Created</option>
              </select>

              <button
                className="btn btn-outline-secondary"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                <Icon icon={sortOrder === "asc" ? "heroicons:arrow-up" : "heroicons:arrow-down"} />
              </button>
            </div>

          </div>
        </div>
<div className="card">
  <div className="table-responsive">
    <table className="table table-hover align-middle">
      <thead className="table-light">
        <tr>
          <th className="text-center" style={{ minWidth: '200px' }}>Tenant</th>
          <th className="text-center" style={{ minWidth: '100px' }}>Status</th>
          <th className="text-center" style={{ minWidth: '120px' }}>Plan</th>
          <th className="text-center" style={{ minWidth: '100px' }}>Size</th>
          <th className="text-center" style={{ minWidth: '100px' }}>Employees</th>
          <th className="text-center" style={{ minWidth: '80px' }}>Data</th>
          <th className="text-center" style={{ minWidth: '150px' }}>Last Active</th>
          <th className="text-center" style={{ minWidth: '140px' }}>Actions</th>
        </tr>
      </thead>

      <tbody>
        {paginatedTenants.map((t) => (
          <tr key={t.id}>
            {/* Tenant */}
            <td>
              <div className="d-flex align-items-center gap-3">
                <img 
                  src={t.logoUrl} 
                  alt={t.name} 
                  className="rounded-circle border" 
                  width="40" 
                  height="40" 
                  style={{ objectFit: 'cover' }}
                />
                <div>
                  <strong className="d-block">{t.name}</strong>
                  <small className="text-muted">{t.domain}</small>
                </div>
              </div>
            </td>

            {/* Status */}
            <td className="text-center">{getStatusBadge(t.status)}</td>

            {/* Subscription Plan */}
            <td className="text-center">{getPlanBadge(t.subscriptionPlan)}</td>

            {/* Size */}
            <td className="text-center">{getSizeBadge(t.companySize)}</td>

            {/* Employees */}
            <td className="text-center">
              <span className="fw-semibold">{t.employeeCount.toLocaleString()}</span>
            </td>

            {/* Data Usage */}
            <td>
              <div className="d-flex align-items-center justify-content-center gap-2">
                <div className="progress flex-grow-1" style={{ height: '6px', width: '60px' }}>
                  <div 
                    className="progress-bar bg-info" 
                    role="progressbar" 
                    style={{ width: t.dataUsage }}
                    aria-valuenow={parseInt(t.dataUsage)} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>
                <span className="small">{t.dataUsage}</span>
              </div>
            </td>

            {/* Last Active */}
            <td className="text-center">
              <small>{formatDateTime(t.lastActive)}</small>
            </td>

            {/* Actions */}
            <td className="text-center">
              <div className="btn-group btn-group-sm">
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    setSelectedTenant(t);
                    setShowViewModal(true);
                  }}
                  title="View"
                >
                  <Icon icon="heroicons:eye" width="16" />
                </button>

                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setSelectedTenant({ ...t });
                    setShowEditModal(true);
                  }}
                  title="Edit"
                >
                  <Icon icon="heroicons:pencil-square" width="16" />
                </button>

                <button
                  className="btn btn-outline-info"
                  onClick={() => {
                    setSelectedTenant(t);
                    setShowConfigModal(true);
                  }}
                  title="Configuration"
                >
                  <Icon icon="heroicons:cog-6-tooth" width="16" />
                </button>

                <button
                  className="btn btn-outline-danger"
                  onClick={() => {
                    setSelectedTenant(t);
                    setShowDeleteModal(true);
                  }}
                  title="Delete"
                >
                  <Icon icon="heroicons:trash" width="16" />
                </button>
              </div>
            </td>
          </tr>
        ))}

        {paginatedTenants.length === 0 && (
          <tr>
            <td colSpan="8" className="text-center py-5 text-muted">
              <Icon icon="heroicons:magnifying-glass" width="24" className="mb-2" />
              <p className="mb-0">No tenants found matching your criteria</p>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* ---------------- PAGINATION ---------------- */}
  {totalPages > 1 && (
    <div className="card-footer d-flex justify-content-between align-items-center">
      <div className="text-muted small">
        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTenants.length)} of {filteredTenants.length} tenants
      </div>
      
      <nav>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button 
              className="page-link" 
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
            >
              <Icon icon="heroicons:chevron-left" width="14" />
            </button>
          </li>

          {[...Array(totalPages)].map((_, i) => {
            // Show limited page numbers
            if (
              i === 0 || 
              i === totalPages - 1 || 
              (i >= currentPage - 2 && i <= currentPage + 2)
            ) {
              return (
                <li
                  key={i}
                  className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                >
                  <button 
                    className="page-link" 
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              );
            }
            
            // Show ellipsis
            if (i === 1 || i === totalPages - 2) {
              return (
                <li key={i} className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              );
            }
            
            return null;
          })}

          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
            <button 
              className="page-link" 
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
            >
              <Icon icon="heroicons:chevron-right" width="14" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  )}
</div>

        {/* ---------------------------------------------------------- */}
        {/* ------------------------- MODALS -------------------------- */}
        {/* ---------------------------------------------------------- */}

        {/* ---------------- ADD MODAL ---------------- */}
        {showAddModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">

                <div className="modal-header">
                  <h5 className="modal-title">Add New Tenant</h5>
                  <button className="btn-close" onClick={() => setShowAddModal(false)}></button>
                </div>

                <form onSubmit={handleAddTenant}>
                  <div className="modal-body">

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Company Name</label>
                        <input
                          type="text"
                          className="form-control"
                          required
                          value={newTenant.name}
                          onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Domain</label>
                        <input
                          type="text"
                          className="form-control"
                          required
                          value={newTenant.domain}
                          onChange={(e) => setNewTenant({ ...newTenant, domain: e.target.value })}
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Company Size</label>
                        <select
                          className="form-select"
                          value={newTenant.companySize}
                          onChange={(e) =>
                            setNewTenant({ ...newTenant, companySize: e.target.value })
                          }
                        >
                          <option>Small</option>
                          <option>Medium</option>
                          <option>Large</option>
                          <option>Enterprise</option>
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Subscription Plan</label>
                        <select
                          className="form-select"
                          value={newTenant.subscriptionPlan}
                          onChange={(e) =>
                            setNewTenant({ ...newTenant, subscriptionPlan: e.target.value })
                          }
                        >
                          <option>Starter</option>
                          <option>Professional</option>
                          <option>Business</option>
                          <option>Enterprise</option>
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Brand Color</label>
                        <input
                          type="color"
                          className="form-control form-control-color"
                          value={newTenant.primaryColor}
                          onChange={(e) =>
                            setNewTenant({ ...newTenant, primaryColor: e.target.value })
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Contact Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={newTenant.contactEmail}
                          onChange={(e) =>
                            setNewTenant({ ...newTenant, contactEmail: e.target.value })
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Contact Phone</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newTenant.contactPhone}
                          onChange={(e) =>
                            setNewTenant({ ...newTenant, contactPhone: e.target.value })
                          }
                        />
                      </div>
                    </div>

                  </div>

                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" type="submit">
                      Add Tenant
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        )}

        {/* ---------------- EDIT MODAL ---------------- */}
        {showEditModal && selectedTenant && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">

                <div className="modal-header">
                  <h5>Edit Tenant</h5>
                  <button className="btn-close" onClick={() => setShowEditModal(false)}></button>
                </div>

                <form onSubmit={handleUpdateTenant}>
                  <div className="modal-body">

                    <div className="row g-3">

                      <div className="col-md-6">
                        <label className="form-label">Company Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedTenant.name}
                          onChange={(e) =>
                            setSelectedTenant({ ...selectedTenant, name: e.target.value })
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Domain</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedTenant.domain}
                          onChange={(e) =>
                            setSelectedTenant({ ...selectedTenant, domain: e.target.value })
                          }
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Company Size</label>
                        <select
                          className="form-select"
                          value={selectedTenant.companySize}
                          onChange={(e) =>
                            setSelectedTenant({
                              ...selectedTenant,
                              companySize: e.target.value,
                            })
                          }
                        >
                          <option>Small</option>
                          <option>Medium</option>
                          <option>Large</option>
                          <option>Enterprise</option>
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Plan</label>
                        <select
                          className="form-select"
                          value={selectedTenant.subscriptionPlan}
                          onChange={(e) =>
                            setSelectedTenant({
                              ...selectedTenant,
                              subscriptionPlan: e.target.value,
                            })
                          }
                        >
                          <option>Starter</option>
                          <option>Professional</option>
                          <option>Business</option>
                          <option>Enterprise</option>
                          <option>Enterprise Plus</option>
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Brand Color</label>
                        <input
                          type="color"
                          className="form-control form-control-color"
                          value={selectedTenant.primaryColor}
                          onChange={(e) =>
                            setSelectedTenant({
                              ...selectedTenant,
                              primaryColor: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={selectedTenant.contactEmail}
                          onChange={(e) =>
                            setSelectedTenant({
                              ...selectedTenant,
                              contactEmail: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Phone</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedTenant.contactPhone}
                          onChange={(e) =>
                            setSelectedTenant({
                              ...selectedTenant,
                              contactPhone: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                  </div>

                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" type="submit">
                      Save Changes
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        )}

        {/* ---------------- VIEW MODAL ---------------- */}
        {showViewModal && selectedTenant && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">

                <div className="modal-header">
                  <h5>Tenant Details</h5>
                  <button className="btn-close" onClick={() => setShowViewModal(false)}></button>
                </div>

                <div className="modal-body">

                  <div className="text-center mb-3">
                    <img
                      src={selectedTenant.logoUrl}
                      alt=""
                      width={60}
                      className="rounded-circle border"
                    />
                    <h4 className="mt-2">{selectedTenant.name}</h4>
                    <small className="text-muted">{selectedTenant.domain}</small>
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <ul className="list-group">
                        <li className="list-group-item d-flex justify-content-between">
                          <strong>Status:</strong> {getStatusBadge(selectedTenant.status)}
                        </li>
                        <li className="list-group-item d-flex justify-content-between">
                          <strong>Employees:</strong> {selectedTenant.employeeCount}
                        </li>
                        <li className="list-group-item d-flex justify-content-between">
                          <strong>Created:</strong> {formatDate(selectedTenant.createdAt)}
                        </li>
                        <li className="list-group-item d-flex justify-content-between">
                          <strong>Last Active:</strong> {formatDateTime(selectedTenant.lastActive)}
                        </li>
                        <li className="list-group-item d-flex justify-content-between">
                          <strong>Data Usage:</strong> {selectedTenant.dataUsage}
                        </li>
                      </ul>
                    </div>
                    <div className="col-12 col-md-6">
                      <ul className="list-group">
                        <li className="list-group-item d-flex justify-content-between">
                          <strong>Tenant Context:</strong> 
                          <code className="small">{selectedTenant.tenantContext || 'N/A'}</code>
                        </li>
                        <li className="list-group-item d-flex justify-content-between">
                          <strong>Schema Type:</strong> 
                          <span className="badge bg-info">
                            {selectedTenant.schemaType || 'shared'}
                          </span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between">
                          <strong>Performance Tier:</strong> 
                          <span className="badge bg-success">
                            {selectedTenant.performanceTier || 'standard'}
                          </span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between">
                          <strong>Data Retention:</strong> 
                          {selectedTenant.dataRetentionPeriod || 7} years
                        </li>
                        <li className="list-group-item d-flex justify-content-between">
                          <strong>Billing:</strong> 
                          <span className={`badge bg-${selectedTenant.billingEnabled ? 'success' : 'secondary'}`}>
                            {selectedTenant.billingEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between">
                          <strong>SSO:</strong> 
                          <span className={`badge bg-${selectedTenant.ssoEnabled ? 'success' : 'secondary'}`}>
                            {selectedTenant.ssoEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                </div>

                <div className="modal-footer">
                  <button className="btn btn-outline-info" onClick={() => {
                    setShowViewModal(false);
                    setShowConfigModal(true);
                  }}>
                    <Icon icon="heroicons:cog-6-tooth" className="me-2" />
                    Configuration
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                    Close
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ---------------- TENANT CONFIGURATION MODAL ---------------- */}
        {showConfigModal && selectedTenant && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <Icon icon="heroicons:cog-6-tooth" className="me-2" />
                    Tenant Configuration: {selectedTenant.name}
                  </h5>
                  <button className="btn-close" onClick={() => setShowConfigModal(false)}></button>
                </div>

                <div className="modal-body">
                  <div className="alert alert-info">
                    <Icon icon="heroicons:information-circle" className="me-2" />
                    Tenant-level configuration and customization settings. Changes inherit from global defaults.
                  </div>

                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Tenant Context ID</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        value={selectedTenant.tenantContext || `tenant_${selectedTenant.domain.replace(/[^a-zA-Z0-9]/g, '_')}`}
                        readOnly
                      />
                      <small className="text-muted">Used for tenant context injection in all API calls</small>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label">Data Isolation Type</label>
                      <select className="form-select" value={selectedTenant.schemaType || 'shared'}>
                        <option value="shared">Shared Schema (Tenant ID based)</option>
                        <option value="separate">Separate Schema (Full Isolation)</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label">Performance Tier</label>
                      <select className="form-select" value={selectedTenant.performanceTier || 'standard'}>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                      <small className="text-muted">Ensures performance isolation</small>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label">Data Retention Period (Years)</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        max="10"
                        value={selectedTenant.dataRetentionPeriod || 7}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label">Billing Integration</label>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={selectedTenant.billingEnabled || false}
                        />
                        <label className="form-check-label">Enable Billing & Subscription Management</label>
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label">Cross-Tenant User Management</label>
                      <div className="alert alert-warning">
                        <Icon icon="heroicons:users" className="me-2" />
                        Service providers/consultants can access multiple tenants. Configure access permissions per user.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowConfigModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={() => {
                    alert('Tenant configuration updated successfully!');
                    setShowConfigModal(false);
                  }}>
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- DELETE MODAL ---------------- */}
        {showDeleteModal && selectedTenant && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-sm">
              <div className="modal-content">

                <div className="modal-header">
                  <h5>Delete Tenant</h5>
                  <button className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
                </div>

                <div className="modal-body text-center">
                  <p>Are you sure you want to delete</p>
                  <h5 className="text-danger fw-bold">{selectedTenant.name}</h5>
                </div>

                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-danger" onClick={handleDeleteTenant}>
                    Delete
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ---------------- TENANT PROVISIONING MODAL ---------------- */}
        {showProvisioningModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <Icon icon="heroicons:rocket-launch" className="me-2" />
                    Tenant Provisioning Configuration
                  </h5>
                  <button className="btn-close" onClick={() => setShowProvisioningModal(false)}></button>
                </div>

                <form onSubmit={handleProvisionTenant}>
                  <div className="modal-body">
                    <div className="alert alert-info">
                      <Icon icon="heroicons:information-circle" className="me-2" />
                      Configure tenant provisioning settings including data isolation, performance tier, and billing integration.
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-12">
                        <label className="form-label">Setup Type *</label>
                        <select
                          className="form-select"
                          value={provisioningConfig.setupType}
                          onChange={(e) => setProvisioningConfig({...provisioningConfig, setupType: e.target.value})}
                          required
                        >
                          <option value="standard">Standard (Shared Schema)</option>
                          <option value="custom">Custom (Separate Schema)</option>
                          <option value="template">Template-based</option>
                        </select>
                        <small className="text-muted">
                          {provisioningConfig.setupType === 'custom' 
                            ? 'Separate database schema for complete isolation'
                            : 'Shared infrastructure with tenant context isolation'}
                        </small>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label">Performance Tier *</label>
                        <select
                          className="form-select"
                          value={provisioningConfig.performanceTier}
                          onChange={(e) => setProvisioningConfig({...provisioningConfig, performanceTier: e.target.value})}
                          required
                        >
                          <option value="standard">Standard</option>
                          <option value="premium">Premium</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                        <small className="text-muted">Ensures performance isolation</small>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label">Data Retention Period (Years) *</label>
                        <input
                          type="number"
                          className="form-control"
                          min="1"
                          max="10"
                          value={provisioningConfig.dataRetentionYears}
                          onChange={(e) => setProvisioningConfig({...provisioningConfig, dataRetentionYears: parseInt(e.target.value)})}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="enableBilling"
                            checked={provisioningConfig.enableBilling}
                            onChange={(e) => setProvisioningConfig({...provisioningConfig, enableBilling: e.target.checked})}
                          />
                          <label className="form-check-label" htmlFor="enableBilling">
                            Enable Billing & Subscription Management Integration
                          </label>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="enableSSO"
                            checked={provisioningConfig.enableSSO}
                            onChange={(e) => setProvisioningConfig({...provisioningConfig, enableSSO: e.target.checked})}
                          />
                          <label className="form-check-label" htmlFor="enableSSO">
                            Enable SSO (SAML 2.0 / OAuth 2.0)
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowProvisioningModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <Icon icon="heroicons:rocket-launch" className="me-2" />
                      Provision Tenant
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- TENANT DE-PROVISIONING MODAL ---------------- */}
        {showDeprovisioningModal && selectedTenant && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-warning text-dark">
                  <h5 className="modal-title">
                    <Icon icon="heroicons:exclamation-triangle" className="me-2" />
                    Tenant De-Provisioning
                  </h5>
                  <button className="btn-close" onClick={() => setShowDeprovisioningModal(false)}></button>
                </div>

                <div className="modal-body">
                  <div className="alert alert-warning">
                    <Icon icon="heroicons:exclamation-triangle" className="me-2" />
                    <strong>Warning:</strong> This will initiate the de-provisioning workflow for <strong>{selectedTenant.name}</strong>
                  </div>

                  <div className="mb-3">
                    <h6>De-Provisioning Checklist:</h6>
                    <ul>
                      <li>All active user sessions will be terminated</li>
                      <li>Data will be archived according to retention policy ({selectedTenant.dataRetentionPeriod || 7} years)</li>
                      <li>Billing subscriptions will be cancelled</li>
                      <li>Tenant-specific configurations will be removed</li>
                      <li>Cross-tenant access will be revoked</li>
                    </ul>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Tenant Context:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedTenant.tenantContext || `tenant_${selectedTenant.domain.replace(/[^a-zA-Z0-9]/g, '_')}`}
                      readOnly
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Data Retention Policy:</label>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="confirmRetention"
                        defaultChecked
                        readOnly
                      />
                      <label className="form-check-label" htmlFor="confirmRetention">
                        Data will be retained for {selectedTenant.dataRetentionPeriod || 7} years per company policy
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowDeprovisioningModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-danger" onClick={handleDeprovisionTenant}>
                    <Icon icon="heroicons:trash" className="me-2" />
                    Confirm De-Provisioning
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

  );
};

export default MultiTenantSetup;