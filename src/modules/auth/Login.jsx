import React, { useState } from 'react';
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL, API_ENDPOINTS } from "../../shared/constants/api.config";
 
const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
 
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };
 
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
 
    try {
      const response = await fetch(`${BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
 
      const data = await response.json();
 
      if (response.ok) {
        localStorage.setItem('token', data.access_token);

        if (data.refresh_token) {
          localStorage.setItem('refreshToken', data.refresh_token);
        } else {
          localStorage.removeItem('refreshToken');
        }

        let resolvedRole = data.role;
        let resolvedEmail = data.email;
        let resolvedRequiresPasswordChange = data.requires_password_change;
        let resolvedProfileCompleted = data.profile_completed;

        // Fallback for older backend payloads: fetch current user to resolve role routing.
        if ((!resolvedRole || !resolvedEmail) && data.access_token) {
          try {
            const meResponse = await fetch(`${BASE_URL}${API_ENDPOINTS.AUTH.CURRENT_USER}`, {
              headers: {
                'Authorization': `Bearer ${data.access_token}`
              }
            });
            if (meResponse.ok) {
              const meData = await meResponse.json();
              resolvedRole = resolvedRole || meData.role;
              resolvedEmail = resolvedEmail || meData.email;
              if (resolvedRequiresPasswordChange === undefined) {
                resolvedRequiresPasswordChange = meData.requires_password_change;
              }
              if (resolvedProfileCompleted === undefined) {
                resolvedProfileCompleted = meData.profile_completed;
              }
            }
          } catch (meError) {
            console.error('Failed to fetch current user after login:', meError);
          }
        }

        if (!resolvedRole) {
          setError('Login succeeded but role is missing. Please contact admin.');
          return;
        }

        localStorage.setItem('userRole', resolvedRole);
        localStorage.setItem('userEmail', resolvedEmail || formData.email);

        if (resolvedRequiresPasswordChange) {
          localStorage.setItem('requiresPasswordChange', 'true');
        } else {
          localStorage.removeItem('requiresPasswordChange');
        }

        // Only the employee role's dashboard is gated on this — for every
        // other role resolvedProfileCompleted is either true or undefined,
        // both of which correctly result in no gating below.
        if (resolvedRole === 'employee' && resolvedProfileCompleted === false) {
          localStorage.setItem('needsProfileCompletion', 'true');
        } else {
          localStorage.removeItem('needsProfileCompletion');
        }
 
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }
 
        if (resolvedRequiresPasswordChange) {
          navigate('/change-password');
        } else if (resolvedRole === 'employee' && resolvedProfileCompleted === false) {
          navigate('/employee/complete-profile');
        } else if (resolvedRole === 'superadmin') {
          navigate('/super-admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.detail || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <>
      {/* CSS to hide browser's native password reveal icons */}
      <style>
        {`
          input[type="password"]::-ms-reveal,
          input[type="password"]::-ms-clear {
            display: none;
          }
          input[type="password"]::-webkit-credentials-auto-fill-button,
          input[type="password"]::-webkit-strong-password-visual-indicator {
            display: none !important;
          }
        `}
      </style>
 
      <section className='auth bg-base d-flex flex-wrap min-vh-100' style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className='auth-left d-lg-block d-none flex-grow-1 position-relative' style={{
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)',
          overflow: 'hidden'
        }}>
          <div className='d-flex align-items-center flex-column h-100 justify-content-center p-5 position-relative' style={{ zIndex: 2 }}>
            <div className='text-center text-white mb-4'>
              <h4 className='display-4 fw-bold mb-3' style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>Welcome Back!</h4>
              <p className='lead' style={{ opacity: 0.9 }}>Sign in to continue your journey with AI Recruitment</p>
            </div>
            <img
              src='/assets/images/leviticalogo.png'
              alt='Login'
              className='img-fluid login-image rounded-4 shadow-lg'
              style={{
                maxWidth: '600px',
                width: '100%',
                borderRadius: '1rem',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
            />
          </div>
          <div className='position-absolute' style={{
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            zIndex: 1
          }}></div>
          <div className='position-absolute' style={{
            bottom: '-150px',
            left: '-150px',
            width: '500px',
            height: '500px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '50%',
            zIndex: 1
          }}></div>
        </div>
        <div className='auth-right py-5 px-4 px-lg-5 d-flex flex-column justify-content-center' style={{
          backgroundColor: '#ffffff',
          minHeight: '100vh',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.1)'
        }}>
          <div className='max-w-464-px mx-auto w-100'>
            <div className='mb-4 mb-md-5'>
              <Link to="/">
                <div className='d-flex align-items-center justify-center gap-3 mb-3'>
                  <img
                    src='/assets/images/leviticalogo_removebg.png'
                    alt='Logo'
                    className='img-fluid'
                    style={{ height: '50px', width: 'auto' }}
                  />
                </div>
              </Link>
              <h4 className='fw-bold mb-2' style={{ fontSize: '2rem', color: '#1a1a1a' }}>Sign In to your Account</h4>
              <p className='text-muted mb-0' style={{ fontSize: '1rem' }}>
                Welcome back! Please enter your details to continue
              </p>
            </div>
            <form onSubmit={handleSignIn}>
              <div className='mb-3 mb-md-4'>
                <label className='form-label fw-semibold mb-2' style={{ color: '#495057', fontSize: '0.9rem' }}>Email Address</label>
                <div className='position-relative'>
                  <span className='position-absolute top-50 start-0 translate-middle-y ms-3' style={{ zIndex: 5, color: '#6c757d' }}>
                    <Icon icon='mage:email' style={{ fontSize: '20px' }} />
                  </span>
                  <input
                    type='email'
                    name='email'
                    value={formData.email}
                    onChange={handleInputChange}
                    className='form-control ps-5 py-3'
                    style={{
                      borderRadius: '0.5rem',
                      border: '1px solid #dee2e6',
                      fontSize: '0.95rem',
                      transition: 'all 0.3s ease'
                    }}
                    placeholder='Enter your email'
                    required
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 0.2rem rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#dee2e6';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
              <div className='mb-3 mb-md-4'>
                <label className='form-label fw-semibold mb-2' style={{ color: '#495057', fontSize: '0.9rem' }}>Password</label>
                <div className='position-relative'>
                  <span className='position-absolute top-50 start-0 translate-middle-y ms-3' style={{ zIndex: 5, color: '#6c757d' }}>
                    <Icon icon='solar:lock-password-outline' style={{ fontSize: '20px' }} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name='password'
                    value={formData.password}
                    onChange={handleInputChange}
                    className='form-control ps-5 pe-5 py-3'
                    style={{
                      borderRadius: '0.5rem',
                      border: '1px solid #dee2e6',
                      fontSize: '0.95rem',
                      transition: 'all 0.3s ease'
                    }}
                    placeholder='Enter your password'
                    required
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 0.2rem rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#dee2e6';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {/* Only ONE eye button */}
                  <span
                    className='position-absolute top-50 end-0 translate-middle-y me-3'
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      cursor: 'pointer',
                      zIndex: 10,
                      color: '#6c757d',
                      transition: 'color 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#3b82f6'}
                    onMouseLeave={(e) => e.target.style.color = '#6c757d'}
                  >
                    <Icon icon={showPassword ? 'solar:eye-closed-outline' : 'solar:eye-outline'} style={{ fontSize: '20px' }} />
                  </span>
                </div>
              </div>
 
              {error && (
                <div className='alert alert-danger d-flex align-items-center mb-3 mb-md-4' role='alert'>
                  <Icon icon='heroicons:exclamation-circle' className='me-2' style={{ fontSize: '20px' }} />
                  <span>
                    {typeof error === "string"
                      ? error
                      : error?.detail?.[0]?.msg || "Something went wrong"}
                  </span>
                </div>
              )}
 
              <div className='mb-4 mb-md-5'>
                <div className='d-flex justify-content-between align-items-center flex-wrap gap-2'>
                  {/* Custom Checkbox */}
                  <div
                    className={`custom-checkbox ${rememberMe ? 'checked' : ''}`}
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    <div className='checkbox-box'>
                      {rememberMe && <span className='checkmark'>✓</span>}
                    </div>
                    <span className='checkbox-label'>Remember me</span>
                  </div>
 
                  <Link
                    to='/ForgotPassword'
                    className='text-primary fw-semibold text-decoration-none'
                    style={{
                      fontSize: '0.9rem',
                      transition: 'color 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>
 
              <button
                type='submit'
                className='btn btn-primary w-100 py-3 mb-4'
                style={{
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s ease',
                  border: 'none'
                }}
                disabled={loading}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                  }
                }}
              >
                {loading ? (
                  <>
                    <span className='spinner-border spinner-border-sm me-2' role='status' aria-hidden='true'></span>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
 
              <div className='position-relative my-4'>
                <hr className='my-0' />
                <span className='position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted' style={{ fontSize: '0.85rem' }}>
                  Or sign in with
                </span>
              </div>
 
              <div className='text-center'>
                <p className='mb-0 text-muted' style={{ fontSize: '0.95rem' }}>
                  Don't have an account?{" "}
                  <Link
                    to='/signup'
                    className='text-primary fw-bold text-decoration-none'
                    style={{
                      transition: 'color 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
                  >
                    Sign Up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};
 
export default Login