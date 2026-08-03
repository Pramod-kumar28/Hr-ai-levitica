import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { employeeSelfServiceAPI } from '../../shared/utils/api';
import { setNeedsProfileCompletion } from '../../shared/utils/auth';

const STEP_BANK = 'bank';
const STEP_EMERGENCY = 'emergency';
const STEP_DOCUMENT = 'document';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [bankForm, setBankForm] = useState({
    account_holder_name: '', account_number: '', ifsc_code: '', bank_name: '', branch_name: '',
  });
  const [emergencyForm, setEmergencyForm] = useState({
    contact_name: '', relationship: '', phone_number: '', alternate_phone_number: '', address: '',
  });
  const [documentType, setDocumentType] = useState('ID Proof');
  const [documentName, setDocumentName] = useState('');
  const [documentFile, setDocumentFile] = useState(null);

  const refreshStatus = async () => {
    try {
      const s = await employeeSelfServiceAPI.getProfileCompletionStatus();
      setStatus(s);
      if (s.profileCompleted) {
        setNeedsProfileCompletion(false);
      }
      return s;
    } catch (err) {
      setError(err.message || 'Could not load profile completion status.');
      return null;
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => { refreshStatus(); }, []);

  const saveStep = async (step) => {
    setError('');
    setSaving(true);
    try {
      if (step === STEP_BANK) {
        const { account_holder_name, account_number, ifsc_code, bank_name } = bankForm;
        if (!account_holder_name || !account_number || !ifsc_code || !bank_name) {
          throw new Error('Account holder name, account number, IFSC code, and bank name are required.');
        }
        await employeeSelfServiceAPI.saveBankDetails(bankForm);
      } else if (step === STEP_EMERGENCY) {
        const { contact_name, relationship, phone_number } = emergencyForm;
        if (!contact_name || !relationship || !phone_number) {
          throw new Error('Contact name, relationship, and phone number are required.');
        }
        await employeeSelfServiceAPI.saveEmergencyContact(emergencyForm);
      } else if (step === STEP_DOCUMENT) {
        if (!documentFile || !documentName) {
          throw new Error('Choose a file and give it a name first.');
        }
        await employeeSelfServiceAPI.uploadDocument(documentType, documentName, 'Onboarding', documentFile);
        setDocumentFile(null);
        setDocumentName('');
      }
      const s = await refreshStatus();
      if (s?.profileCompleted) {
        setTimeout(() => navigate('/dashboard'), 1200);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong saving that step.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingStatus) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const StepBadge = ({ done }) => (
    <span
      className={`badge rounded-pill ${done ? 'bg-success' : 'bg-secondary'}`}
      style={{ width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {done ? '✓' : ''}
    </span>
  );

  return (
    <section className="min-vh-100 py-5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="bg-white p-4 p-md-5 rounded-4 shadow">
          <Link to="/"><img src="/assets/images/leviticalogo_removebg.png" alt="Logo" style={{ height: 44, marginBottom: 20 }} /></Link>
          <h2 className="fw-bold mb-2">Complete your profile</h2>
          <p className="text-muted mb-4">
            Welcome aboard! Before you can access the rest of the HRMS, please fill in your
            bank details, emergency contact, and upload at least one document.
          </p>

          {error && <div className="alert alert-danger">{error}</div>}
          {status?.profileCompleted && (
            <div className="alert alert-success">All set — redirecting to your dashboard…</div>
          )}

          {/* Bank details */}
          <div className="border rounded-3 p-3 p-md-4 mb-3">
            <div className="d-flex align-items-center gap-2 mb-3">
              <StepBadge done={status?.bankDetails} />
              <h5 className="mb-0 fw-semibold">Bank Details</h5>
            </div>
            <div className="row g-2">
              <div className="col-md-6">
                <label className="form-label small">Account Holder Name</label>
                <input className="form-control" value={bankForm.account_holder_name}
                  onChange={(e) => setBankForm({ ...bankForm, account_holder_name: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label small">Account Number</label>
                <input className="form-control" value={bankForm.account_number}
                  onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label small">IFSC Code</label>
                <input className="form-control" value={bankForm.ifsc_code}
                  onChange={(e) => setBankForm({ ...bankForm, ifsc_code: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label small">Bank Name</label>
                <input className="form-control" value={bankForm.bank_name}
                  onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })} />
              </div>
              <div className="col-md-12">
                <label className="form-label small">Branch Name (optional)</label>
                <input className="form-control" value={bankForm.branch_name}
                  onChange={(e) => setBankForm({ ...bankForm, branch_name: e.target.value })} />
              </div>
            </div>
            <button className="btn btn-primary btn-sm mt-3" disabled={saving} onClick={() => saveStep(STEP_BANK)}>
              {status?.bankDetails ? 'Update Bank Details' : 'Save Bank Details'}
            </button>
          </div>

          {/* Emergency contact */}
          <div className="border rounded-3 p-3 p-md-4 mb-3">
            <div className="d-flex align-items-center gap-2 mb-3">
              <StepBadge done={status?.emergencyContact} />
              <h5 className="mb-0 fw-semibold">Emergency Contact</h5>
            </div>
            <div className="row g-2">
              <div className="col-md-6">
                <label className="form-label small">Contact Name</label>
                <input className="form-control" value={emergencyForm.contact_name}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, contact_name: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label small">Relationship</label>
                <input className="form-control" placeholder="e.g. Parent, Spouse, Sibling" value={emergencyForm.relationship}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, relationship: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label small">Phone Number</label>
                <input className="form-control" value={emergencyForm.phone_number}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, phone_number: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label small">Alternate Phone (optional)</label>
                <input className="form-control" value={emergencyForm.alternate_phone_number}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, alternate_phone_number: e.target.value })} />
              </div>
              <div className="col-md-12">
                <label className="form-label small">Address (optional)</label>
                <textarea className="form-control" rows={2} value={emergencyForm.address}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, address: e.target.value })} />
              </div>
            </div>
            <button className="btn btn-primary btn-sm mt-3" disabled={saving} onClick={() => saveStep(STEP_EMERGENCY)}>
              {status?.emergencyContact ? 'Update Emergency Contact' : 'Save Emergency Contact'}
            </button>
          </div>

          {/* Document upload */}
          <div className="border rounded-3 p-3 p-md-4 mb-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <StepBadge done={status?.documents} />
              <h5 className="mb-0 fw-semibold">Documents</h5>
            </div>
            <div className="row g-2">
              <div className="col-md-4">
                <label className="form-label small">Document Type</label>
                <select className="form-select" value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
                  <option>ID Proof</option>
                  <option>Address Proof</option>
                  <option>Education Certificate</option>
                  <option>Previous Employment</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label small">Document Name</label>
                <input className="form-control" placeholder="e.g. Aadhaar Card" value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label small">File</label>
                <input type="file" className="form-control" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <button className="btn btn-primary btn-sm mt-3" disabled={saving} onClick={() => saveStep(STEP_DOCUMENT)}>
              Upload Document
            </button>
            {status?.documents && (
              <p className="text-success small mt-2 mb-0">You already have at least one document on file — feel free to add more, or move on once bank details and emergency contact are done.</p>
            )}
          </div>

          <p className="text-muted small mb-0">
            You can save each step independently — your dashboard unlocks automatically once all three are complete.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CompleteProfile;