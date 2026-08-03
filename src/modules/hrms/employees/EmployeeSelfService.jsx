import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import StatCard from '../../../shared/components/StatCard';
import { employeeSelfServiceAPI, announcementsAPI } from '../../../shared/utils/api';
import ProfileModal from "../modal/ProfileModal";
import RequestModal from "../modal/RequestModal";
import MessageModal from "../modal/MessageModal";
import TicketModal from "../modal/TicketModal";
import BankModal from "../modal/BankModal";
import DocumentUploadModal from "../modal/DocumentUploadModal";
import PolicyModal from "../modal/PolicyMasterModal";
import CalendarModal from "../modal/CalendarModal";
import DetailsModal from "../modal/DetailsModal";

const EmployeeSelfService = () => {

  const [activeSection, setActiveSection] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [filterType, setFilterType] = useState('All');

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [currentUser, setCurrentUser] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    location: '',
    startDate: '',
    status: '',
    manager: '',
    employmentType: '',
    salary: 0
  });

  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [anniversaries, setAnniversaries] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({});
  const [jobHistory, setJobHistory] = useState([]);
  const [reportingHierarchy, setReportingHierarchy] = useState([]);
  const [policyDocuments, setPolicyDocuments] = useState([]);
  const [formsSurveys, setFormsSurveys] = useState([]);
  const [teamCalendar, setTeamCalendar] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [profileForm, setProfileForm] = useState({
    phone: '',
    address: '',
    emergencyContact: { name: '', phone: '', relationship: '' }
  });
  const [bankForm, setBankForm] = useState({
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    accountType: 'Checking'
  });
  const [newRequest, setNewRequest] = useState({
    type: 'leave',
    startDate: '',
    endDate: '',
    reason: '',
    attachment: null
  });
  const [newMessage, setNewMessage] = useState({
    to: '',
    subject: '',
    content: ''
  });
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'technical',
    priority: 'medium',
    description: ''
  });

  const itemsPerPage = 6;

  const kpis = useMemo(() => {
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const unreadMessages = messages.filter(m => !m.read).length;
    const openTickets = tickets.filter(t => t.status === 'open').length;
    const availablePayslips = payslips.filter(p => p.status === 'available').length;
    
    return {
      pendingRequests,
      unreadMessages,
      openTickets,
      availablePayslips,
      leaveBalance: leaveBalance.annual || 0
    };
  }, [requests, messages, tickets, payslips, leaveBalance]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);
    setLeaveBalance({ annual: 0, casual: 0, sick: 0, taken: 0, total: 0 });
    try {
      const [profileRes, leavesRes, payslipsRes, attendanceRes, ticketsRes, documentsRes, announcementsRes] =
        await Promise.allSettled([
          employeeSelfServiceAPI.getProfile(),
          employeeSelfServiceAPI.getLeaves(),
          employeeSelfServiceAPI.getPayslips(),
          employeeSelfServiceAPI.getAttendance(),
          employeeSelfServiceAPI.getTickets(),
          employeeSelfServiceAPI.getDocuments(),
          announcementsAPI.list(),
        ]);

      if (profileRes.status === 'fulfilled') {
        const p = profileRes.value || {};
        setCurrentUser({
          id: p.id ?? '',
          name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.employeeCode || '',
          email: p.officialEmail || '',
          phone: p.mobileNumber || '',
          department: p.department || '',
          position: p.designation || '',
          location: p.location || p.workLocation || '',
          startDate: p.joiningDate || '',
          status: p.isActive ? 'active' : 'inactive',
          manager: '',
          employmentType: p.employmentType || '',
          salary: 0,
        });
      } else {
        setError(profileRes.reason?.message || 'Could not load your profile.');
      }

      // Requests tab reuses the generic {id, type, date, status, description}
      // shape above for leave/asset/etc. requests — today the backend only
      // has leave requests wired to self-service, so this only ever
      // populates with leave-type entries. Approve/reject flows for other
      // request types don't exist here yet.
      if (leavesRes.status === 'fulfilled') {
        const leaves = leavesRes.value?.leaves || [];
        setRequests(
          leaves.map((l) => ({
            id: l.id,
            type: 'leave',
            date: l.startDate,
            status: l.status,
            description: `${l.leaveType} leave (${l.startDate} to ${l.endDate})${l.reason ? ` — ${l.reason}` : ''}`,
          }))
        );
        setLeaveBalance((prev) => ({ ...prev, taken: leaves.length }));
      }

      if (payslipsRes.status === 'fulfilled') {
        const slips = payslipsRes.value?.slips || [];
        setPayslips(
          slips.map((s) => ({
            id: s.id,
            month: `${s.month} ${s.year}`,
            amount: s.netPay != null ? `₹${s.netPay}` : '—',
            status: s.isPublished ? 'available' : 'pending',
          }))
        );
      }

      if (attendanceRes.status === 'fulfilled') {
        const att = attendanceRes.value || {};
        // getAttendance() hits GET .../attendance, which returns
        // { month, year, summary: { present, absent, late, halfDay, total },
        //   records: [{ date, status, checkIn, checkOut, remarks }] } —
        // NOT the dashboard endpoint's { presentDaysThisMonth } shape.
        // Map the real day-by-day records so the attendance table (which
        // reads record.checkIn/checkOut/status per row) actually has data.
        const records = Array.isArray(att.records) ? att.records : [];
        setAttendanceRecords(
          records.map((r) => ({
            id: r.id,
            date: r.date,
            status: (r.status || '').toLowerCase().replace(' ', '-'), // "Half Day" -> "half-day"
            checkIn: r.checkIn,
            checkOut: r.checkOut,
            hours: 0,
            remarks: r.remarks,
          }))
        );
      }

      if (ticketsRes.status === 'fulfilled') {
        const t = ticketsRes.value?.tickets || ticketsRes.value || [];
        setTickets(
          (Array.isArray(t) ? t : []).map((tk) => ({
            id: tk.id,
            subject: tk.subject,
            status: tk.status,
            description: tk.description,
          }))
        );
      }

      if (documentsRes.status === 'fulfilled') {
        const docs = documentsRes.value?.documents || documentsRes.value || [];
        setDocuments(
          (Array.isArray(docs) ? docs : []).map((d, i) => ({
            id: d.id ?? i,
            name: d.name || d.document_name || 'Document',
            type: d.type || d.document_type || '—',
            date: d.date || d.uploaded_at || '',
            size: d.size || '',
          }))
        );
      }

      if (announcementsRes.status === 'fulfilled') {
        const items = Array.isArray(announcementsRes.value) ? announcementsRes.value : [];
        setAnnouncements(
          items.map((a) => ({
            id: a.id,
            title: a.title,
            body: a.body,
            date: a.created_at ? new Date(a.created_at).toLocaleDateString() : '',
            category: 'Announcement',
          }))
        );
      }

      // Not wired — no backend endpoint exists for any of these yet:
      // messages, directory, holidays, birthdays, anniversaries,
      // jobHistory, reportingHierarchy, policyDocuments, formsSurveys,
      // teamCalendar, notifications. Left as empty state (their existing
      // default) rather than fabricating data.
      setMessages([]);
      setDirectory([]);
      setUpcomingHolidays([]);
      setBirthdays([]);
      setAnniversaries([]);
      setJobHistory([]);
      setReportingHierarchy([]);
      setPolicyDocuments([]);
      setFormsSurveys([]);
      setTeamCalendar([]);
      setNotifications([]);
      setProfileForm({
        phone: '',
        address: '',
        emergencyContact: { name: '', phone: '', relationship: '' }
      });
      setBankForm({
        accountNumber: '',
        bankName: '',
        ifscCode: '',
        accountType: 'Checking'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      'active': { label: 'Active', color: 'emerald' },
      'pending': { label: 'Pending', color: 'amber' },
      'approved': { label: 'Approved', color: 'emerald' },
      'rejected': { label: 'Rejected', color: 'rose' },
      'open': { label: 'Open', color: 'blue' },
      'resolved': { label: 'Resolved', color: 'emerald' },
      'in-progress': { label: 'In Progress', color: 'amber' },
      'present': { label: 'Present', color: 'emerald' },
      'late': { label: 'Late', color: 'amber' },
      'absent': { label: 'Absent', color: 'rose' },
      'available': { label: 'Available', color: 'emerald' },
      'completed': { label: 'Completed', color: 'emerald' },
      'withdrawn': { label: 'Withdrawn', color: 'gray' }
    };
    const { label, color } = config[status] || { label: status || 'Unknown', color: 'gray' };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-${color}-50 text-${color}-700 border border-${color}-100`}>
        {label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const config = {
      'high': { label: 'High', color: 'rose' },
      'medium': { label: 'Medium', color: 'amber' },
      'low': { label: 'Low', color: 'blue' }
    };
    const { label, color } = config[priority] || { label: priority || 'Medium', color: 'gray' };
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-${color}-50 text-${color}-700 border border-${color}-100`}>
        {label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const handleMarkAsRead = (messageId) => {

    setMessages(messages.map(msg => 
      msg.id === messageId ? { ...msg, read: true } : msg
    ));
    toast.success('Message marked as read');
  };

  const handleSubmitRequest = (formData) => {

    const newReq = {
      id: Date.now(),
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      description: `${formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} Request`,
      approvalHistory: [
        { step: 'Submitted', by: currentUser.name || 'User', date: new Date().toISOString().split('T')[0], status: 'completed' }
      ]
    };
    
    setRequests([newReq, ...requests]);
    toast.success('Request submitted successfully');
    setShowRequestModal(false);
  };

  const handleSendMessage = (formData) => {

    const newMsg = {
      id: Date.now(),
      from: currentUser.name || 'User',
      to: formData.to,
      subject: formData.subject,
      content: formData.content,
      date: new Date().toISOString().split('T')[0],
      read: false
    };
    
    setMessages([newMsg, ...messages]);
    toast.success('Message sent successfully');
    setShowMessageModal(false);
  };

  const handleCreateTicket = (formData) => {

    const newTkt = {
      id: `TKT${String(tickets.length + 1).padStart(3, '0')}`,
      subject: formData.subject,
      status: 'open',
      date: new Date().toISOString().split('T')[0],
      priority: formData.priority,
      category: formData.category,
      description: formData.description
    };
    
    setTickets([newTkt, ...tickets]);
    toast.success('Ticket created successfully');
    setShowTicketModal(false);
  };

  const handleUpdateProfile = (formData) => {

    setProfileForm(formData);
    toast.success('Profile update request submitted. Changes will be reviewed by HR.');
    setShowProfileModal(false);
  };

  const handleUpdateBankDetails = (formData) => {

    setBankForm(formData);
    toast.success('Bank details update submitted for approval.');
    setShowBankModal(false);
  };

  const handleUploadDocument = (formData) => {

    const newDoc = {
      id: documents.length + 1,
      name: formData.fileName || 'Uploaded Document',
      type: 'uploaded',
      date: new Date().toISOString().split('T')[0],
      size: '0.5 MB'
    };
    setDocuments([newDoc, ...documents]);
    toast.success('Document uploaded successfully');
    setShowUploadModal(false);
  };

  const handleDownloadPayslip = (payslipId) => {

    toast.info(`Downloading payslip ${payslipId}...`);
  };

  const handleRegularizeAttendance = (recordId) => {

    const updatedRecords = attendanceRecords.map(record =>
      record.id === recordId ? { ...record, status: 'present' } : record
    );
    setAttendanceRecords(updatedRecords);
    toast.success('Attendance regularized successfully');
  };

  const handleCheckIn = async () => {
    try {
      const res = await employeeSelfServiceAPI.checkIn();
      toast.success(`Checked in at ${res.checkIn}`);
      loadInitialData();
    } catch (err) {
      toast.error(err.message || 'Could not check in.');
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await employeeSelfServiceAPI.checkOut();
      toast.success(`Checked out at ${res.checkOut}`);
      loadInitialData();
    } catch (err) {
      toast.error(err.message || 'Could not check out.');
    }
  };

  const handleRefreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      loadInitialData();
      setCurrentPage(1);
      setSearchTerm('');
      setFilterType('All');
      toast.info('Data refreshed successfully');
      setIsLoading(false);
    }, 1000);
  };

  const handleExportData = () => {

    toast.info('Export functionality would download data as CSV');
  };

  const handleWithdrawRequest = (requestId) => {

    setRequests(requests.map(req => 
      req.id === requestId ? { ...req, status: 'withdrawn' } : req
    ));
    toast.info('Request withdrawn successfully');
  };

  const handleResubmitRequest = (requestId) => {

    const request = requests.find(r => r.id === requestId);
    if (request) {
      setNewRequest({
        type: request.type,
        startDate: '',
        endDate: '',
        reason: '',
        attachment: null
      });
      setShowRequestModal(true);
      setRequests(requests.filter(r => r.id !== requestId));
    }
  };

  const getFilteredData = () => {
    let data = [];
    const lowerSearch = searchTerm.toLowerCase();
    
    switch(activeSection) {
      case 'requests':
        data = requests.filter(item => 
          item.type?.toLowerCase().includes(lowerSearch) ||
          item.description?.toLowerCase().includes(lowerSearch)
        );
        if (filterType !== 'All') {
          data = data.filter(item => item.type === filterType);
        }
        break;
      case 'messages':
        data = messages.filter(item => 
          item.from?.toLowerCase().includes(lowerSearch) ||
          item.subject?.toLowerCase().includes(lowerSearch)
        );
        if (filterType !== 'All') {
          data = data.filter(item => filterType === 'unread' ? !item.read : true);
        }
        break;
      case 'tickets':
        data = tickets.filter(item => 
          item.subject?.toLowerCase().includes(lowerSearch) ||
          item.id?.toLowerCase().includes(lowerSearch)
        );
        if (filterType !== 'All') {
          data = data.filter(item => item.status === filterType);
        }
        break;
      case 'payslips':
        data = payslips.filter(item => 
          item.month?.toLowerCase().includes(lowerSearch)
        );
        break;
      case 'attendance':
        data = attendanceRecords.filter(item => 
          item.date?.includes(lowerSearch) ||
          item.status?.toLowerCase().includes(lowerSearch)
        );
        break;
      default:
        data = [];
    }
    return data;
  };

  const filteredData = getFilteredData();
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'heroicons:home' },
    { id: 'profile', label: 'My Profile', icon: 'heroicons:user' },
    { id: 'requests', label: 'My Requests', icon: 'heroicons:document-text', badge: kpis.pendingRequests },
    { id: 'messages', label: 'Messages', icon: 'heroicons:envelope', badge: kpis.unreadMessages },
    { id: 'tickets', label: 'Support Tickets', icon: 'heroicons:ticket' },
    { id: 'payslips', label: 'Payslips', icon: 'heroicons:banknotes' },
    { id: 'attendance', label: 'Attendance', icon: 'heroicons:clock' },
    { id: 'documents', label: 'Documents', icon: 'heroicons:folder' },
    { id: 'directory', label: 'Company Directory', icon: 'heroicons:users' },
  ];

  const renderTopActions = () => (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      <div className="relative flex-1 min-w-[120px]">
        <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="w-full h-8 sm:h-10 pl-8 sm:pl-10 pr-3 sm:pr-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm"
        />
      </div>

      <div className="relative flex-1 min-w-[120px]">
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
          className="w-full h-8 sm:h-10 px-3 sm:px-4 pr-8 sm:pr-10 bg-white border border-slate-200 rounded-xl shadow-sm text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
        >
          <option value="All">All</option>
          {activeSection === 'requests' && (
            <>
              <option value="leave">Leave</option>
              <option value="reimbursement">Reimbursement</option>
              <option value="attendance">Attendance</option>
              <option value="loan">Loan</option>
            </>
          )}
          {activeSection === 'messages' && (
            <option value="unread">Unread</option>
          )}
          {activeSection === 'tickets' && (
            <>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </>
          )}
        </select>
        <Icon icon="heroicons:chevron-down" className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
      </div>

      <button
        onClick={handleRefreshData}
        className="px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1"
      >
        <Icon icon="heroicons:arrow-path" className="w-3 h-3 sm:w-4 sm:h-4" />
        Refresh
      </button>
      
      <button
        onClick={handleExportData}
        className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1"
      >
        <Icon icon="heroicons:document-arrow-down" className="w-3 h-3 sm:w-4 sm:h-4" />
        Export
      </button>
    </div>
  );

  const renderPagination = (total, page, listLength) => (
    <div className="px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="text-[10px] sm:text-xs text-slate-500">
        Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, listLength)} of {listLength} items
      </div>
      <nav className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon="heroicons:chevron-left" className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" />
        </button>
        {[...Array(Math.min(total, 5))].map((_, i) => {
          const pageNum = i + 1;
          return (
            <button
              key={i}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-semibold transition ${
                currentPage === pageNum
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/15'
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        {total > 5 && <span className="text-slate-400 text-xs">...</span>}
        <button
          onClick={() => setCurrentPage(p => Math.min(total, p + 1))}
          disabled={page === total}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon="heroicons:chevron-right" className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" />
        </button>
      </nav>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-4">

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h5 className="text-base sm:text-lg font-bold text-slate-800">
              {currentUser.name ? `Welcome back, ${currentUser.name}!` : 'Welcome to Employee Self-Service'}
            </h5>
            <p className="text-xs sm:text-sm text-slate-500">Here's your self-service dashboard</p>
          </div>
          {currentUser.id && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-500">Employee ID</p>
                <p className="text-sm font-bold text-slate-800">{currentUser.id}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Icon icon="heroicons:user" className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Pending Approvals" value={kpis.pendingRequests} subtitle="Awaiting action" icon="heroicons:clock" color="blue" />
        <StatCard title="Leave Balance" value={kpis.leaveBalance} subtitle="Annual leave days" icon="heroicons:calendar" color="green" />
        <StatCard title="Unread Messages" value={kpis.unreadMessages} subtitle="New messages" icon="heroicons:envelope" color="yellow" />
        <StatCard title="Open Tickets" value={kpis.openTickets} subtitle="Support tickets" icon="heroicons:ticket" color="rose" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm md:p-4 p-3">
        <h6 className="text-xs font-bold text-slate-600 tracking-wider mb-4">Quick Actions</h6>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <button onClick={() => { setActiveSection('requests'); setShowRequestModal(true); }} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl text-center transition border border-blue-100">
            <Icon icon="heroicons:calendar" className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <span className="text-xs font-medium text-slate-700">Apply Leave</span>
          </button>
          <button onClick={() => setActiveSection('attendance')} className="p-4 bg-green-50 hover:bg-green-100 rounded-xl text-center transition border border-green-100">
            <Icon icon="heroicons:clock" className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <span className="text-xs font-medium text-slate-700">Attendance</span>
          </button>
          <button onClick={() => setShowRequestModal(true)} className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl text-center transition border border-purple-100">
            <Icon icon="heroicons:document-plus" className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <span className="text-xs font-medium text-slate-700">Submit Request</span>
          </button>
          <button onClick={() => setShowTicketModal(true)} className="p-4 bg-amber-50 hover:bg-amber-100 rounded-xl text-center transition border border-amber-100">
            <Icon icon="heroicons:ticket" className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <span className="text-xs font-medium text-slate-700">Raise Ticket</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm md:p-4 p-3">
          <h6 className="text-xs font-bold text-slate-600 tracking-wider mb-3">Upcoming Holidays</h6>
          {upcomingHolidays.length > 0 ? (
            <div className="space-y-2">
              {upcomingHolidays.map((holiday, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">{holiday.name}</span>
                  <span className="text-xs text-slate-500">{holiday.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No upcoming holidays</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm md:p-4 p-3">
          <h6 className="text-xs font-bold text-slate-600 tracking-wider mb-3">Latest Announcements</h6>
          {announcements.length > 0 ? (
            <div className="space-y-2">
              {announcements.map(announcement => (
                <div key={announcement.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{announcement.title}</p>
                      <p className="text-xs text-slate-500">{announcement.date}</p>
                    </div>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {announcement.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No announcements</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm md:p-4 p-3">
          <div className="flex justify-between items-center mb-3">
            <h6 className="text-xs font-bold text-slate-600 tracking-wider">Recent Requests</h6>
            <button onClick={() => setActiveSection('requests')} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>
          {requests.length > 0 ? (
            <div className="space-y-2">
              {requests.slice(0, 3).map(request => (
                <div key={request.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-700 capitalize">{request.type}</p>
                    <p className="text-xs text-slate-500">{request.date}</p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No recent requests</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h6 className="text-xs font-bold text-slate-600 tracking-wider mb-3">Celebrations</h6>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">
                <Icon icon="heroicons:cake" className="w-3 h-3 inline mr-1" />
                Birthdays
              </p>
              {birthdays.length > 0 ? (
                birthdays.slice(0, 2).map((birthday, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <Icon icon="heroicons:gift" className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{birthday.name}</p>
                      <p className="text-xs text-slate-500">{birthday.date} • {birthday.department}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-2">No birthdays today</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">
                <Icon icon="heroicons:trophy" className="w-3 h-3 inline mr-1" />
                Work Anniversaries
              </p>
              {anniversaries.length > 0 ? (
                anniversaries.slice(0, 2).map((anniversary, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <Icon icon="heroicons:star" className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{anniversary.name}</p>
                      <p className="text-xs text-slate-500">{anniversary.years} years • {anniversary.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-2">No anniversaries</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRequests = () => {
    const { data, total, page } = { data: paginatedData, total: totalPages, page: currentPage };

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-sm font-bold text-slate-800">My Requests</h3>
          <div className="flex flex-wrap items-center gap-2">
            {renderTopActions()}
            <button
              onClick={() => setShowRequestModal(true)}
              className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1"
            >
              <Icon icon="heroicons:plus" className="w-3 h-3 sm:w-4 sm:h-4" />
              New Request
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 text-left min-w-[120px]">Type</th>
                  <th className="p-3 text-left min-w-[100px]">Date</th>
                  <th className="p-3 text-left min-w-[150px]">Description</th>
                  <th className="p-3 text-center min-w-[100px]">Status</th>
                  <th className="p-3 text-center min-w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.length > 0 ? (
                  data.map((request) => (
                    <tr key={request.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                            <Icon icon={
                              request.type === 'leave' ? 'heroicons:calendar' :
                              request.type === 'reimbursement' ? 'heroicons:banknotes' :
                              request.type === 'attendance' ? 'heroicons:clock' :
                              'heroicons:document-text'
                            } className="w-4 h-4 text-slate-500" />
                          </div>
                          <span className="font-medium text-slate-700 capitalize">{request.type}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">{request.date}</td>
                      <td className="p-3 text-slate-600">{request.description}</td>
                      <td className="p-3 text-center">{getStatusBadge(request.status)}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleViewDetails(request)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
                            title="View"
                          >
                            <Icon icon="heroicons:eye" className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" />
                          </button>
                          {request.status === 'pending' && (
                            <button
                              onClick={() => handleWithdrawRequest(request.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                              title="Withdraw"
                            >
                              <Icon icon="heroicons:x-mark" className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          )}
                          {request.status === 'rejected' && (
                            <button
                              onClick={() => handleResubmitRequest(request.id)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition"
                              title="Resubmit"
                            >
                              <Icon icon="heroicons:arrow-path" className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400">
                      <Icon icon="heroicons:document-text" className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-medium text-slate-600">No requests found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {total > 1 && renderPagination(total, page, filteredData.length)}
        </div>
      </div>
    );
  };

  const renderMessages = () => {
    const { data, total, page } = { data: paginatedData, total: totalPages, page: currentPage };

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-sm font-bold text-slate-800">Messages</h3>
          <div className="flex flex-wrap items-center gap-2">
            {renderTopActions()}
            <button
              onClick={() => setShowMessageModal(true)}
              className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1"
            >
              <Icon icon="heroicons:plus" className="w-3 h-3 sm:w-4 sm:h-4" />
              New Message
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 text-left min-w-[150px]">From</th>
                  <th className="p-3 text-left min-w-[180px]">Subject</th>
                  <th className="p-3 text-left min-w-[100px]">Date</th>
                  <th className="p-3 text-center min-w-[100px]">Status</th>
                  <th className="p-3 text-center min-w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.length > 0 ? (
                  data.map((message) => (
                    <tr key={message.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-medium text-slate-700">{message.from}</td>
                      <td className="p-3 text-slate-600">{message.subject}</td>
                      <td className="p-3 text-slate-500">{message.date}</td>
                      <td className="p-3 text-center">
                        {!message.read ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">New</span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">Read</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              handleViewDetails(message);
                              handleMarkAsRead(message.id);
                            }}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
                            title="View"
                          >
                            <Icon icon="heroicons:eye" className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" />
                          </button>
                          {!message.read && (
                            <button
                              onClick={() => handleMarkAsRead(message.id)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition"
                              title="Mark Read"
                            >
                              <Icon icon="heroicons:check" className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400">
                      <Icon icon="heroicons:envelope" className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-medium text-slate-600">No messages found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {total > 1 && renderPagination(total, page, filteredData.length)}
        </div>
      </div>
    );
  };

  const renderTickets = () => {
    const { data, total, page } = { data: paginatedData, total: totalPages, page: currentPage };

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-sm font-bold text-slate-800">Support Tickets</h3>
          <div className="flex flex-wrap items-center gap-2">
            {renderTopActions()}
            <button
              onClick={() => setShowTicketModal(true)}
              className="px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1"
            >
              <Icon icon="heroicons:plus" className="w-3 h-3 sm:w-4 sm:h-4" />
              New Ticket
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 text-left min-w-[100px]">Ticket ID</th>
                  <th className="p-3 text-left min-w-[160px]">Subject</th>
                  <th className="p-3 text-left min-w-[100px]">Date</th>
                  <th className="p-3 text-center min-w-[80px]">Priority</th>
                  <th className="p-3 text-center min-w-[100px]">Status</th>
                  <th className="p-3 text-center min-w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.length > 0 ? (
                  data.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-medium text-slate-700">{ticket.id}</td>
                      <td className="p-3 text-slate-600">{ticket.subject}</td>
                      <td className="p-3 text-slate-500">{ticket.date}</td>
                      <td className="p-3 text-center">{getPriorityBadge(ticket.priority)}</td>
                      <td className="p-3 text-center">{getStatusBadge(ticket.status)}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleViewDetails(ticket)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
                            title="View"
                          >
                            <Icon icon="heroicons:eye" className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" />
                          </button>
                          {ticket.status === 'open' && (
                            <button className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition" title="Update">
                              <Icon icon="heroicons:pencil" className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      <Icon icon="heroicons:ticket" className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-medium text-slate-600">No tickets found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {total > 1 && renderPagination(total, page, filteredData.length)}
        </div>
      </div>
    );
  };

  const renderPayslips = () => {
    const { data, total, page } = { data: paginatedData, total: totalPages, page: currentPage };

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-sm font-bold text-slate-800">Payslips</h3>
          <div className="flex flex-wrap items-center gap-2">
            {renderTopActions()}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 text-left min-w-[150px]">Month</th>
                  <th className="p-3 text-left min-w-[120px]">Amount</th>
                  <th className="p-3 text-center min-w-[100px]">Status</th>
                  <th className="p-3 text-center min-w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.length > 0 ? (
                  data.map((payslip) => (
                    <tr key={payslip.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-medium text-slate-700">{payslip.month}</td>
                      <td className="p-3 font-semibold text-slate-800">{payslip.amount}</td>
                      <td className="p-3 text-center">{getStatusBadge(payslip.status)}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleDownloadPayslip(payslip.id)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                            title="Download"
                          >
                            <Icon icon="heroicons:arrow-down-tray" className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleViewDetails(payslip)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
                            title="View"
                          >
                            <Icon icon="heroicons:eye" className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-slate-400">
                      <Icon icon="heroicons:banknotes" className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-medium text-slate-600">No payslips found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {total > 1 && renderPagination(total, page, filteredData.length)}
        </div>
      </div>
    );
  };

  const renderAttendance = () => {
    const { data, total, page } = { data: paginatedData, total: totalPages, page: currentPage };
    
    const summary = {
      present: attendanceRecords.filter(r => r.status === 'present').length,
      late: attendanceRecords.filter(r => r.status === 'late').length,
      absent: attendanceRecords.filter(r => r.status === 'absent').length,
      totalHours: attendanceRecords.reduce((sum, r) => sum + (r.hours || 0), 0).toFixed(1)
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-sm font-bold text-slate-800">Attendance Records</h3>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCheckIn}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-medium transition shadow-sm"
            >
              Check In
            </button>
            <button
              onClick={handleCheckOut}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-medium transition shadow-sm"
            >
              Check Out
            </button>
            {renderTopActions()}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-200">
            <p className="text-xl font-bold text-emerald-700">{summary.present}</p>
            <p className="text-xs text-emerald-600">Present</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-200">
            <p className="text-xl font-bold text-amber-700">{summary.late}</p>
            <p className="text-xs text-amber-600">Late</p>
          </div>
          <div className="bg-rose-50 rounded-xl p-3 text-center border border-rose-200">
            <p className="text-xl font-bold text-rose-700">{summary.absent}</p>
            <p className="text-xs text-rose-600">Absent</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
            <p className="text-xl font-bold text-blue-700">{summary.totalHours}</p>
            <p className="text-xs text-blue-600">Total Hours</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 text-left min-w-[100px]">Date</th>
                  <th className="p-3 text-left min-w-[90px]">Check In</th>
                  <th className="p-3 text-left min-w-[90px]">Check Out</th>
                  <th className="p-3 text-center min-w-[80px]">Hours</th>
                  <th className="p-3 text-center min-w-[100px]">Status</th>
                  <th className="p-3 text-center min-w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.length > 0 ? (
                  data.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-slate-600">{record.date}</td>
                      <td className="p-3 text-slate-600">{record.checkIn || '-'}</td>
                      <td className="p-3 text-slate-600">{record.checkOut || '-'}</td>
                      <td className="p-3 text-center text-slate-600">{record.hours || '0'}</td>
                      <td className="p-3 text-center">{getStatusBadge(record.status)}</td>
                      <td className="p-3 text-center">
                        {(record.status === 'absent' || record.status === 'late') && (
                          <button
                            onClick={() => handleRegularizeAttendance(record.id)}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-xs font-medium transition"
                          >
                            Regularize
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      <Icon icon="heroicons:clock" className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-medium text-slate-600">No attendance records found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {total > 1 && renderPagination(total, page, filteredData.length)}
        </div>
      </div>
    );
  };

  const renderDocuments = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-sm font-bold text-slate-800">My Documents</h3>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1"
        >
          <Icon icon="heroicons:plus" className="w-3 h-3 sm:w-4 sm:h-4" />
          Upload Document
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold tracking-wider text-[11px]">
              <tr>
                <th className="p-3 text-left min-w-[180px]">Document</th>
                <th className="p-3 text-left min-w-[100px]">Type</th>
                <th className="p-3 text-left min-w-[100px]">Date</th>
                <th className="p-3 text-left min-w-[80px]">Size</th>
                <th className="p-3 text-center min-w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-medium text-slate-700">{doc.name}</td>
                    <td className="p-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                        {doc.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{doc.date}</td>
                    <td className="p-3 text-slate-500">{doc.size}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition" title="Download">
                          <Icon icon="heroicons:arrow-down-tray" className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button onClick={() => handleViewDetails(doc)} className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition" title="View">
                          <Icon icon="heroicons:eye" className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400">
                    <Icon icon="heroicons:folder" className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No documents found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDirectory = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-sm font-bold text-slate-800">Company Directory</h3>
        <div className="relative w-full sm:w-64">
          <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {directory.length > 0 ? (
          directory
            .filter(person => 
              person.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              person.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              person.role?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((person) => (
              <div key={person.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 flex-shrink-0">
                    <Icon icon="heroicons:user" className="w-6 h-6 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h6 className="font-semibold text-slate-800">{person.name}</h6>
                    <p className="text-xs text-slate-500">{person.role}</p>
                    <p className="text-xs text-slate-400">{person.department}</p>
                    <div className="flex gap-2 mt-2">
                      <a href={`mailto:${person.email}`} className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition">
                        <Icon icon="heroicons:envelope" className="w-3 h-3 inline mr-1" />
                        Email
                      </a>
                      <button className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-medium transition">
                        <Icon icon="heroicons:phone" className="w-3 h-3 inline mr-1" />
                        Call
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="col-span-2 text-center py-8 text-slate-400">
            <Icon icon="heroicons:users" className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium text-slate-600">No employees found</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-sm font-bold text-slate-800">My Profile</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowProfileModal(true)}
            className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1"
          >
            <Icon icon="heroicons:pencil" className="w-3 h-3 sm:w-4 sm:h-4" />
            Edit Profile
          </button>
          <button
            onClick={() => setShowBankModal(true)}
            className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1"
          >
            <Icon icon="heroicons:building-library" className="w-3 h-3 sm:w-4 sm:h-4" />
            Bank Details
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm md:p-4 p-3">
          <h6 className="text-xs font-bold text-slate-600 tracking-wider mb-4">Personal Information</h6>
          {currentUser.name ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Full Name</p>
                <p className="font-medium text-slate-800">{currentUser.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Employee ID</p>
                <p className="font-medium text-slate-800">{currentUser.id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="font-medium text-slate-800">{currentUser.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="font-medium text-slate-800">{currentUser.phone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Department</p>
                <p className="font-medium text-slate-800">{currentUser.department}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Position</p>
                <p className="font-medium text-slate-800">{currentUser.position}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Location</p>
                <p className="font-medium text-slate-800">{currentUser.location}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Employment Type</p>
                <p className="font-medium text-slate-800">{currentUser.employmentType}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No profile information available</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm md:p-4 p-3">
          <h6 className="text-xs font-bold text-slate-600 tracking-wider mb-4">Leave Balance</h6>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-2xl font-bold text-blue-600">{leaveBalance.annual || 0}</p>
              <p className="text-xs text-slate-500">Annual Leave</p>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-2xl font-bold text-emerald-600">{leaveBalance.casual || 0}</p>
              <p className="text-xs text-slate-500">Casual Leave</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-2xl font-bold text-amber-600">{leaveBalance.sick || 0}</p>
              <p className="text-xs text-slate-500">Sick Leave</p>
            </div>
            <div className="text-center p-3 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-2xl font-bold text-rose-600">{leaveBalance.taken || 0}</p>
              <p className="text-xs text-slate-500">Total Taken</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm md:p-4 p-3">
          <h6 className="text-xs font-bold text-slate-600 tracking-wider mb-4">Emergency Contact</h6>
          {profileForm.emergencyContact.name ? (
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-slate-500">Name</p>
                <p className="font-medium text-slate-800">{profileForm.emergencyContact.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="font-medium text-slate-800">{profileForm.emergencyContact.phone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Relationship</p>
                <p className="font-medium text-slate-800">{profileForm.emergencyContact.relationship}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No emergency contact set</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm md:p-4 p-3">
          <h6 className="text-xs font-bold text-slate-600 tracking-wider mb-4">Salary Information</h6>
          {currentUser.salary > 0 ? (
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-slate-500">Annual Salary</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(currentUser.salary)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Monthly</p>
                <p className="font-medium text-slate-800">{formatCurrency(currentUser.salary / 12)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Last Increment</p>
                <p className="font-medium text-slate-800">N/A</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No salary information available</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm md:p-4 p-3">
          <h6 className="text-xs font-bold text-slate-600 tracking-wider mb-4">Reporting Hierarchy</h6>
          {reportingHierarchy.length > 0 ? (
            <div className="space-y-2">
              {reportingHierarchy.map((person, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <Icon icon="heroicons:user" className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{person.name}</p>
                    <p className="text-xs text-slate-500">{person.position}</p>
                  </div>
                  {person.isManager && (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">Manager</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No reporting hierarchy available</p>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm md:p-4 p-3">
          <h6 className="text-xs font-bold text-slate-600 tracking-wider mb-4">Job History</h6>
          {jobHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-2 font-semibold text-slate-600">Position</th>
                    <th className="p-2 font-semibold text-slate-600">Department</th>
                    <th className="p-2 font-semibold text-slate-600">Start Date</th>
                    <th className="p-2 font-semibold text-slate-600">End Date</th>
                    <th className="p-2 font-semibold text-slate-600 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobHistory.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50">
                      <td className="p-2 font-medium text-slate-700">{job.position}</td>
                      <td className="p-2 text-slate-600">{job.department}</td>
                      <td className="p-2 text-slate-500">{job.startDate}</td>
                      <td className="p-2 text-slate-500">{job.endDate || 'Current'}</td>
                      <td className="p-2 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          job.status === 'Current' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No job history available</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeSection) {
      case 'dashboard': return renderDashboard();
      case 'profile': return renderProfile();
      case 'requests': return renderRequests();
      case 'messages': return renderMessages();
      case 'tickets': return renderTickets();
      case 'payslips': return renderPayslips();
      case 'attendance': return renderAttendance();
      case 'documents': return renderDocuments();
      case 'directory': return renderDirectory();
      default: return renderDashboard();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6 min-h-screen pb-8 sm:pb-10">

      <div className="">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-blue-50 flex-shrink-0">
              <Icon icon="heroicons:user-circle" className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight truncate">
                Employee Self-Service Portal
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 flex flex-wrap items-center gap-1 sm:gap-2">
                <span>Access your profile, submit requests</span>
                <span className="w-0.5 h-0.5 rounded-full bg-slate-300 hidden xs:inline"></span>
                <span className="hidden xs:inline">Manage your information</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        className="w-full sm:hidden flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        <span className="text-sm font-semibold text-slate-700">
          {menuItems.find(item => item.id === activeSection)?.label || 'Menu'}
        </span>
        <div className="flex items-center gap-2">
          {menuItems.find(item => item.id === activeSection)?.badge > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-700 rounded-full">
              {menuItems.find(item => item.id === activeSection)?.badge}
            </span>
          )}
          <Icon icon={showMobileMenu ? "heroicons:chevron-up" : "heroicons:chevron-down"} className="w-5 h-5 text-slate-400" />
        </div>
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">

        <div className={`${showMobileMenu ? 'block' : 'hidden'} sm:block sm:col-span-3 lg:col-span-2`}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    activeSection === item.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                  onClick={() => { setActiveSection(item.id); setShowMobileMenu(false); }}
                >
                  <Icon icon={item.icon} className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-700 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="sm:col-span-9 lg:col-span-10">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-4 md:p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Icon icon="svg-spinners:180-ring" className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-xs text-slate-500 mt-2">Loading...</p>
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </div>
      </div>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSubmit={handleUpdateProfile}
        profileForm={profileForm}
        setProfileForm={setProfileForm}
      />

      <RequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSubmit={handleSubmitRequest}
        newRequest={newRequest}
        setNewRequest={setNewRequest}
      />

      <MessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        onSubmit={handleSendMessage}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
      />

      <TicketModal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        onSubmit={handleCreateTicket}
        newTicket={newTicket}
        setNewTicket={setNewTicket}
      />

      <BankModal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        onSubmit={handleUpdateBankDetails}
        bankForm={bankForm}
        setBankForm={setBankForm}
      />

      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handleUploadDocument}
      />

      <PolicyModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        policyDocuments={policyDocuments}
      />

      <CalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        teamCalendar={teamCalendar}
      />

      <DetailsModal
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedItem(null); }}
        item={selectedItem}
        section={activeSection}
        getStatusBadge={getStatusBadge}
        getPriorityBadge={getPriorityBadge}
      />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        className="text-xs sm:text-sm"
        toastClassName="rounded-xl shadow-lg"
      />
    </div>
  );
};

export default EmployeeSelfService;