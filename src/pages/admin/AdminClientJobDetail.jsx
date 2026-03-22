import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobService } from '../../services/jobService.js';
import { FiArrowLeft, FiMapPin, FiBriefcase, FiUser, FiClock, FiSearch, FiRefreshCw } from 'react-icons/fi';

export default function AdminClientJobDetail() {
  const { jobCode } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [shortlistedForJob, setShortlistedForJob] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [jobs, allShortlists, allApplicants] = await Promise.all([
          jobService.fetchClientJobs(),
          jobService.getShortlistedCandidates(),
          jobService.getDatabaseCandidates()
        ]);
        
        const foundJob = jobs.find(j => j.jobCode === jobCode);
        setJob(foundJob || null);

        if (foundJob) {
          // Filter shortlists for this job
          const matches = allShortlists.filter(s => s.jobCode === jobCode);
          
          // Enrich with full applicant data
          const enriched = matches.map(m => {
            const fullData = allApplicants.find(a => a.applicantId === m.applicantId);
            return { ...m, ...fullData };
          });
          
          setShortlistedForJob(enriched);
        }
      } catch (err) {
        console.error('Failed to load job detail or submissions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jobCode]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <FiRefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
        <h2>Loading Job Details...</h2>
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#e11d48' }}>
        <h2>Job not found!</h2>
        <button onClick={() => navigate('/admin/client-jobs')} style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Go Back</button>
      </div>
    );
  }

  const isBoxActive = job.status?.toLowerCase() === 'active';

  return (
    <div style={{ padding: '24px 32px', background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Top Banner Area */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => navigate('/admin/client-jobs')} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', display: 'flex' }}>
              <FiArrowLeft size={24} />
            </button>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiBriefcase color="#f59e0b" /> {job.jobCode} - {job.jobTitle}
            </h1>
          </div>
          <div style={{
            background: isBoxActive ? '#22c55e' : '#ef4444',
            color: '#fff', padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 800
          }}>
            {job.status?.toUpperCase() || 'ACTIVE'}
          </div>
        </div>

        {/* Sub Header (Client & Location) */}
        <div style={{ paddingLeft: '44px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#475569', fontWeight: 500 }}>
            <span style={{ color: '#3b82f6', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}><FiUser /> {job.clientName}</span>
            <span>|</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiMapPin /> {job.location}{job.state ? `, ${job.state}` : ''}, {job.country}
            </span>
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>Assigned To - N/A</div>
          <div style={{ fontSize: '13px', color: '#3b82f6', marginTop: '8px', fontWeight: 600 }}>Matching Applicants {shortlistedForJob.length}</div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 24px 0' }} />

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', paddingLeft: '44px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>Recruitment Manager</div>
            <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 700 }}>{job.recruitmentManager || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>Client Bill Rate / Salary</div>
            <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 700 }}>N/A</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>Pay Rate / Salary</div>
            <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 700 }}>{job.payRate || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>Created By & On</div>
            <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 700 }}>{job.createdBy}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>On {formatDate(job.createdOn)}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>Business Unit</div>
            <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 700 }}>{job.businessUnit || 'N/A'}</div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '24px 0' }} />

        {/* Job Description Box */}
        <div style={{ paddingLeft: '44px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>Job Description</h3>
          <div style={{ 
            fontSize: '14px', color: '#475569', lineHeight: '1.7', 
            whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '16px', borderRadius: '12px',
            maxHeight: isDescExpanded ? 'none' : '100px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {job.jobDescription || 'No description provided.'}
            {!isDescExpanded && (job.jobDescription?.length > 200) && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: 'linear-gradient(transparent, #f8fafc)' }} />
            )}
          </div>
          {(job.jobDescription?.length > 200) && (
            <button 
              onClick={() => setIsDescExpanded(!isDescExpanded)}
              style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 700, fontSize: '13px', cursor: 'pointer', marginTop: '8px', padding: 0 }}
            >
              {isDescExpanded ? 'View Less' : 'View More'}
            </button>
          )}
        </div>
      </div>

      {/* Submissions Section (Static UI as requested) */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Submissions</h2>
        
        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '250px' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder="Search" style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          
          {[
            { label: 'Pipeline', count: 0 },
            { label: 'All', count: shortlistedForJob.length },
            { label: 'Client Submissions', count: 0 },
            { label: 'Interviews', count: 0 },
            { label: 'Confirmations', count: 0 },
            { label: 'Placements', count: 0 },
            { label: 'Not Joined', count: 0 }
          ].map((filter, i) => (
            <div key={filter.label} style={{ 
              padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, 
              background: i === 1 ? '#3b82f6' : '#f1f5f9',
              color: i === 1 ? '#fff' : '#64748b', cursor: 'pointer'
            }}>
              {filter.label} {filter.count}
            </div>
          ))}
        </div>

        {/* Static Submissions Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px', textTransform: 'uppercase' }}>Candidate Name</th>
                <th style={{ padding: '12px', textTransform: 'uppercase' }}>Email Address</th>
                <th style={{ padding: '12px', textTransform: 'uppercase' }}>Phone Number</th>
                <th style={{ padding: '12px', textTransform: 'uppercase' }}>Candidate ID</th>
                <th style={{ padding: '12px', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {shortlistedForJob.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                    No submissions yet. Navigate to the Applicant Database to shortlist candidates for this job.
                  </td>
                </tr>
              ) : (
                shortlistedForJob.map((c, idx) => (
                  <tr key={idx} className="hover-row" style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{c.name}</div>
                    </td>
                    <td style={{ padding: '16px 12px', color: '#475569', fontSize: '13px' }}>
                      {c.email || '—'}
                    </td>
                    <td style={{ padding: '16px 12px', color: '#475569', fontSize: '13px' }}>
                      {c.contactNumber || '—'}
                    </td>
                    <td style={{ padding: '16px 12px', color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>
                      #{c.applicantId}
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                      <button 
                        onClick={() => navigate(`/admin/applicants/${c.applicantId}`)}
                        style={{ padding: '6px 14px', background: '#0B2F5B', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
