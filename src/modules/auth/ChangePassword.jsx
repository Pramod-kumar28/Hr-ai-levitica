import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../shared/utils/api';
import { setRequiresPasswordChange, needsProfileCompletion } from '../../shared/utils/auth';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSaving(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setRequiresPasswordChange(false);

      // Same gating order ProtectedRoute enforces: password change first,
      // then (for employees) profile completion, then the dashboard.
      if (needsProfileCompletion()) {
        navigate('/employee/complete-profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Could not change your password. Check your current password and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="min-vh-100 d-flex align-items-center py-5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="container" style={{ maxWidth: 480 }}>
        <div className="bg-white p-4 p-md-5 rounded-4 shadow">
          <Link to="/"><img src="/assets/images/leviticalogo_removebg.png" alt="Logo" style={{ height: 44, marginBottom: 20 }} /></Link>
          <h2 className="fw-bold mb-2">Set a new password</h2>
          <p className="text-muted mb-4">
            You're using a temporary password. Set your own before continuing.
          </p>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small">Current (temporary) password</label>
              <input
                type="password"
                className="form-control"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label small">New password</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="mb-4">
              <label className="form-label small">Confirm new password</label>
              <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={saving}>
              {saving ? 'Saving…' : 'Change password'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ChangePassword;