import { useState, useEffect } from 'react';
import { jobService } from '../../services/jobService';
import { FiCheckCircle, FiSearch, FiRefreshCw, FiExternalLink, FiX, FiCalendar, FiBriefcase, FiTrash2, FiLoader } from 'react-icons/fi';

import { useNavigate } from 'react-router-dom';

export default function AdminShortlisted() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await jobService.getShortlistedCandidates();
      setCandidates(data);
    } catch (e) {
      setError('Failed to load shortlisted candidates.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (applicantId, jobCode) => {
    if (!window.confirm(`Are you sure you want to remove this candidate (ID: ${applicantId}) from this job? This will revert their status in the database to "In Database".`)) return;
    
    setDeletingId(`${applicantId}-${jobCode}`);
    try {
      const result = await jobService.removeShortlist({ applicantId, jobCode });
      if (result.success) {
        setCandidates(prev => prev.filter(c => !(c.applicantId === applicantId && c.jobCode === jobCode)));
      } else {
        alert('Failed to remove: ' + (result.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Error: ' + e.toString());
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = candidates.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [c.name, c.jobRole, c.company, c.shortlistedBy, c.jobCode].some(f => f && f.toString().toLowerCase().includes(q));
  });

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div style={{ padding: '28px 30px' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .row-hover:hover { background: #f8fafc !important; }
      `}</style>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #059669, #047857)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
          }}><FiCheckCircle size={20} /></div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1e293b' }}>Tagged Candidates</h1>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#94a3b8' }}>
              {loading ? 'Loading...' : `${filtered.length} total finalized tagged candidates`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchData} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 16px', border: '1px solid #e2e8f0', borderRadius: '10px',
            background: '#fff', color: '#475569', cursor: 'pointer', fontSize: '13px', fontWeight: 600
          }}>
            <FiRefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <FiSearch size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          placeholder="Search by name, role, company, HR..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '11px 12px 11px 40px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            <FiX size={14} />
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', fontSize: '13px', marginBottom: '14px' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 16px rgba(11,47,91,0.05)' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <FiRefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontSize: '14px' }}>Loading tagged candidates...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <FiCheckCircle size={36} style={{ marginBottom: '12px', display: 'block', margin: '0 auto 12px', color: '#cbd5e1' }} />
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{candidates.length === 0 ? 'No candidates have been tagged yet.' : 'No results match your search.'}</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Candidate', 'Job Code', 'Target Role', 'Target Company', 'Tagged By', 'Action Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.4px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={i} className="row-hover" style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.2s' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{c.name || 'Unnamed'}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>ID: {c.applicantId}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '12px' }}>{c.jobCode || '—'}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, fontSize: '12px' }}>
                        <FiBriefcase size={12} /> {c.jobRole || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>{c.company || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#334155' }}>{c.shortlistedBy || 'Admin'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FiCalendar size={13} /> {formatDate(c.date)}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={() => navigate(`/admin/applicants/${c.applicantId}`)} style={{
                          padding: '6px 12px', background: '#0B2F5B', color: '#fff',
                          border: 'none', borderRadius: '6px', cursor: 'pointer',
                          fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px'
                        }}>
                          View <FiExternalLink size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.applicantId, c.jobCode)} 
                          disabled={deletingId === `${c.applicantId}-${c.jobCode}`}
                          style={{
                            padding: '6px 8px', background: '#fff', color: '#ef4444',
                            border: '1px solid #fee2e2', borderRadius: '6px', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          {deletingId === `${c.applicantId}-${c.jobCode}` ? <FiLoader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <FiTrash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
