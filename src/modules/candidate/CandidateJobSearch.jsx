import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from "../../shared/constants/api.config";

const CandidateJobSearch = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('candidate_token');
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [appliedJobIds, setAppliedJobIds] = useState([]);

  useEffect(() => {
    if (!token) { navigate('/candidate/login'); return; }
    // /api/jobs/list requires a company/recruiter token and only returns
    // that recruiter's own jobs — a candidate would always get 403'd there.
    // /api/jobs/public is the candidate-facing listing: no auth required,
    // returns every published job across all recruiters.
    fetch(`${BASE_URL}/api/jobs/public`)
      .then(r => r.json())
      .then(data => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const filtered = jobs.filter(j =>
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.department?.toLowerCase().includes(search.toLowerCase())
  );

  const applyToJob = async (jobId) => {
    try {
      const res = await fetch(`${BASE_URL}/api/candidates/apply/${jobId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAppliedJobIds(prev => [...prev, jobId]);
        alert('Application submitted!');
      } else if (res.status === 409) {
        alert('You have already applied to this job.');
      } else if (res.status === 401) {
        alert('Your session has expired. Please log in again.');
        navigate('/candidate/login');
      } else {
        alert('Failed to apply. Please try again.');
      }
    } catch (err) {
      alert('Failed to apply. Please check your connection and try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <nav className='navbar navbar-light bg-white shadow-sm px-4'>
        <span className='navbar-brand fw-bold'>Browse Jobs</span>
        <button className='btn btn-outline-secondary btn-sm' onClick={() => navigate('/candidate/dashboard')}>← Back</button>
      </nav>
      <div className='container py-4'>
        <input className='form-control mb-4 py-3' placeholder='Search jobs by title or department...'
          value={search} onChange={e => setSearch(e.target.value)} style={{ borderRadius: '0.5rem', maxWidth: '500px' }} />
        {loading && <p className='text-muted'>Loading jobs...</p>}
        <div className='row g-3'>
          {filtered.map(job => (
            <div key={job.id} className='col-md-6 col-lg-4'>
              <div className='bg-white rounded-3 p-4 shadow-sm h-100 d-flex flex-column'>
                <h6 className='fw-bold mb-1'>{job.title}</h6>
                <p className='text-muted mb-1' style={{ fontSize: '0.85rem' }}>{job.department} · {job.location || 'Remote'}</p>
                <p className='text-muted mb-3' style={{ fontSize: '0.8rem' }}>{job.employment_type}</p>
                <button
                  className='btn btn-primary btn-sm mt-auto'
                  onClick={() => applyToJob(job.id)}
                  disabled={appliedJobIds.includes(job.id)}
                >
                  {appliedJobIds.includes(job.id) ? 'Applied ✓' : 'Apply'}
                </button>
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && <p className='text-muted'>No jobs found.</p>}
        </div>
      </div>
    </div>
  );
};

export default CandidateJobSearch;