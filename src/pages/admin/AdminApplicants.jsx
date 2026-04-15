import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobService } from '../../services/jobService.js';
import { AdminTableSkeleton } from '../../Component/AdminSkeletons.jsx';
import {
  FiSearch, FiFilter, FiX, FiUser, FiMail, FiPhone, FiMapPin,
  FiBriefcase, FiBookOpen, FiTag, FiAlignLeft, FiCalendar,
  FiExternalLink, FiChevronLeft, FiChevronRight, FiRefreshCw,
  FiDatabase, FiClock, FiAward, FiEye, FiChevronUp, FiChevronDown
} from 'react-icons/fi';

// ── Helpers ──────────────────────────────────
function cvAge(dateStr) {
  if (!dateStr) return '—';
  const now = new Date();
  const then = new Date(dateStr);
  if (isNaN(then.getTime())) return '—';
  
  now.setHours(0, 0, 0, 0);
  then.setHours(0, 0, 0, 0);
  const diffDays = Math.round((now - then) / 864e5);
  
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  return `${Math.floor(diffDays / 30)} months ago`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const SOURCE_COLORS = {
  'Job Application': { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  'HR Upload':       { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  'LinkedIn':        { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  'Naukri':          { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  'Referral':        { bg: '#fdf4ff', color: '#701a75', border: '#f0abfc' },
  'Walk-in':         { bg: '#fff7ed', color: '#9a3412', border: '#fed7aa' },
  default:           { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
};

const STATUS_COLORS = {
  Applied:        { bg: '#eff6ff', color: '#1e40af' },
  'In Database':  { bg: '#f0fdf4', color: '#166534' },
  Tagged:         { bg: '#f0fdf4', color: '#166534' },
  Rejected:       { bg: '#fef2f2', color: '#dc2626' },

  Hired:          { bg: '#fdf4ff', color: '#7e22ce' },
  default:        { bg: '#f8fafc', color: '#475569' },
};

function SourceBadge({ source }) {
  const c = SOURCE_COLORS[source] || SOURCE_COLORS.default;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '10px',
      fontSize: '11px', fontWeight: 700, border: `1px solid ${c.border}`,
      background: c.bg, color: c.color, whiteSpace: 'nowrap'
    }}>{source || '—'}</span>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.default;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: '10px',
      fontSize: '11px', fontWeight: 700, background: c.bg, color: c.color, whiteSpace: 'nowrap'
    }}>{status || 'Applied'}</span>
  );
}

function AiScore({ score }) {
  if (score === null || score === undefined || score === '') return <span style={{ color: '#cbd5e1', fontSize: '12px' }}>—</span>;
  const n = parseFloat(score);
  const color = n >= 7 ? '#059669' : n >= 5 ? '#f59e0b' : '#dc3545';
  return (
    <span style={{
      fontWeight: 800, fontSize: '13px', color,
      background: color + '15', padding: '2px 8px', borderRadius: '8px'
    }}>{n}/10</span>
  );
}

const PAGE_SIZE = 25;

// ══════════════════════════════════════════════
// PROFILE MODAL
// ══════════════════════════════════════════════
function ProfileModal({ candidate, onClose }) {
  if (!candidate) return null;

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{children}</div>
    </div>
  );

  const Field = ({ icon, label, value, link }) => {
    if (!value) return null;
    return (
      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ color: '#94a3b8', flexShrink: 0, marginTop: '2px' }}>{icon}</div>
        <div>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '1px' }}>{label}</div>
          {link ? (
            <a href={value} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#0B2F5B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
              View Resume <FiExternalLink size={11} />
            </a>
          ) : (
            <div style={{ fontSize: '13px', color: '#1e293b', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{value}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '640px',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #f0f4f8',
          background: 'linear-gradient(135deg, #0B2F5B, #1a4a8a)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: 800, color: '#fff'
            }}>
              {(candidate.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#fff' }}>{candidate.name || '—'}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                Applicant ID #{candidate.applicantId} &nbsp;•&nbsp; {cvAge(candidate.createdOn)}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}><FiX size={16} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Badges Row */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <SourceBadge source={candidate.source} />
            <StatusBadge status={candidate.status} />
            {candidate.aiScore !== null && candidate.aiScore !== undefined && candidate.aiScore !== '' && (
              <AiScore score={candidate.aiScore} />
            )}
            {candidate.shortlistDecision && (
              <span style={{ padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, background: candidate.shortlistDecision === 'Shortlisted' ? '#f0fdf4' : '#fef2f2', color: candidate.shortlistDecision === 'Shortlisted' ? '#166534' : '#dc2626' }}>
                AI: {candidate.shortlistDecision}
              </span>
            )}
          </div>

          <Section title="Contact Information">
            <Field icon={<FiMail size={14} />} label="Email" value={candidate.email} />
            <Field icon={<FiPhone size={14} />} label="Mobile" value={candidate.contactNumber} />
            <Field icon={<FiMapPin size={14} />} label="Location" value={candidate.currentLocation} />
          </Section>

          <Section title="Professional Info">
            <Field icon={<FiBriefcase size={14} />} label="Current Company" value={candidate.currentCompany} />
            <Field icon={<FiBriefcase size={14} />} label="Position / Job Title" value={candidate.currentPosition} />
            <Field icon={<FiAward size={14} />} label="Total Experience" value={candidate.totalExperience ? `${candidate.totalExperience} Year(s)` : null} />
            {candidate.jobAppliedFor && <Field icon={<FiBriefcase size={14} />} label="Job Applied For" value={candidate.jobAppliedFor} />}
          </Section>

          <Section title="Education">
            <Field icon={<FiBookOpen size={14} />} label="Education" value={candidate.education} />
          </Section>

          {candidate.skills && (
            <Section title="Skills & Keywords">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {candidate.skills.split(',').map((s, i) => s.trim() && (
                  <span key={i} style={{ padding: '3px 10px', background: '#eff6ff', color: '#1e40af', borderRadius: '20px', fontSize: '11px', fontWeight: 600, border: '1px solid #bfdbfe' }}>
                    {s.trim()}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {candidate.summary && (
            <Section title="Professional Summary">
              <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.7 }}>{candidate.summary}</p>
            </Section>
          )}

          {candidate.aiAnalysis && (
            <Section title="AI Analysis">
              <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.7, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>{candidate.aiAnalysis}</p>
              {candidate.shortlistReason && (
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}><strong>Reason:</strong> {candidate.shortlistReason}</p>
              )}
            </Section>
          )}

          <Section title="Record Info">
            <Field icon={<FiUser size={14} />} label="Uploaded By" value={candidate.uploadedBy} />
            <Field icon={<FiCalendar size={14} />} label="Created On" value={formatDate(candidate.createdOn)} />
            {candidate.resumeLink && candidate.resumeLink !== 'No resume uploaded' && (
              <Field icon={<FiExternalLink size={14} />} label="Resume" value={candidate.resumeLink} link />
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════
export default function AdminApplicants() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [searchHr, setSearchHr] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAI, setFilterAI] = useState('');
  const [filterExp, setFilterExp] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterJobTitle, setFilterJobTitle] = useState('');
  const [filterSkills, setFilterSkills] = useState('');

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'createdOn', direction: 'desc' });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await jobService.getDatabaseCandidates();
      setCandidates(data);
    } catch (e) {
      setError('Failed to load applicants. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    let list = [...candidates];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        [c.name, c.email, c.contactNumber, c.skills, c.currentPosition, c.jobAppliedFor, c.currentCompany]
          .some(f => f && f.toString().toLowerCase().includes(q))
      );
    }
    
    if (searchHr) {
      const q = searchHr.toLowerCase();
      list = list.filter(c => c.uploadedBy && c.uploadedBy.toLowerCase().includes(q));
    }
    
    if (searchDate) {
      list = list.filter(c => {
        if (!c.createdOn) return false;
        const d = new Date(c.createdOn);
        return d.toISOString().split('T')[0] === searchDate;
      });
    }

    if (filterSource) list = list.filter(c => c.source === filterSource || c.source?.startsWith(filterSource));
    if (filterStatus) list = list.filter(c => (c.status || 'Applied') === filterStatus);
    if (filterAI) list = list.filter(c => c.shortlistDecision === filterAI);
    if (filterExp) list = list.filter(c => c.totalExperience === filterExp);
    if (filterDateFrom) list = list.filter(c => c.createdOn && new Date(c.createdOn) >= new Date(filterDateFrom));
    if (filterDateTo) list = list.filter(c => c.createdOn && new Date(c.createdOn) <= new Date(filterDateTo + 'T23:59:59'));
    if (filterJobTitle) {
      const q = filterJobTitle.toLowerCase();
      list = list.filter(c => (c.jobAppliedFor || c.currentPosition || '').toLowerCase().includes(q));
    }
    if (filterSkills) {
      const neededSkills = filterSkills.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
      list = list.filter(c => {
        const cSkills = (c.skills || '').toLowerCase();
        return neededSkills.every(s => cSkills.includes(s));
      });
    }

    // Sort
    if (sortConfig.key) {
      list.sort((a, b) => {
        let valA = a[sortConfig.key] || '';
        let valB = b[sortConfig.key] || '';

        // Handle special cases for comparison
        if (sortConfig.key === 'applicantId' || sortConfig.key === 'totalExperience') {
          valA = parseFloat(valA) || 0;
          valB = parseFloat(valB) || 0;
        } else if (sortConfig.key === 'createdOn') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        } else {
          valA = valA.toString().toLowerCase();
          valB = valB.toString().toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [candidates, search, searchHr, searchDate, filterSource, filterStatus, filterAI, filterExp, filterDateFrom, filterDateTo, filterJobTitle, filterSkills, sortConfig]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasActiveFilters = filterSource || filterStatus || filterAI || filterExp || filterDateFrom || filterDateTo || filterJobTitle || filterSkills;
  const clearFilters = () => {
    setFilterSource(''); setFilterStatus(''); setFilterAI('');
    setFilterExp(''); setFilterDateFrom(''); setFilterDateTo('');
    setFilterJobTitle(''); setFilterSkills('');
    setSortConfig({ key: 'createdOn', direction: 'desc' });
    setPage(1);
  };

  const inputStyle = { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' };

  const sources = [...new Set(candidates.map(c => c.source).filter(Boolean))];
  const statuses = [...new Set(candidates.map(c => c.status || 'Applied').filter(Boolean))];

  return (
    <div style={{ padding: '28px 30px' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .row-hover:hover { background: #f8fafc !important; cursor: pointer; }
        .row-hover:hover td { color: #0B2F5B !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #0B2F5B, #1a4a8a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
          }}><FiDatabase size={20} /></div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1e293b' }}>Applicants database</h1>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#94a3b8' }}>
              {loading ? <div style={{display:'inline-block', width:'12px', height:'12px', border:'2px solid transparent', borderTopColor:'#0B2F5B', borderRadius:'50%', animation:'spin 1s linear infinite'}}></div> : `${filtered.length} of ${candidates.length} total candidates`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowFilters(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
            border: `1px solid ${hasActiveFilters ? '#0B2F5B' : '#e2e8f0'}`,
            background: hasActiveFilters ? '#0B2F5B' : '#fff',
            color: hasActiveFilters ? '#fff' : '#475569', cursor: 'pointer'
          }}>
            <FiFilter size={13} /> Filters {hasActiveFilters && `(${[filterSource,filterStatus,filterAI,filterExp,filterDateFrom,filterDateTo].filter(Boolean).length})`}
          </button>
          <button onClick={fetchData} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 16px', border: '1px solid #e2e8f0', borderRadius: '10px',
            background: '#fff', color: '#475569', cursor: 'pointer', fontSize: '13px', fontWeight: 600
          }}>
            <FiRefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>
      </div>

      {/* Search Bars */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {/* Global Search */}
        <div style={{ position: 'relative', flex: '2 1 300px' }}>
          <FiSearch size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            placeholder="Search by name, email, mobile, skills..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ ...inputStyle, paddingLeft: '40px', paddingRight: search ? '36px' : '14px', fontSize: '13px', padding: '11px 12px 11px 40px' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
              <FiX size={14} />
            </button>
          )}
        </div>
        
        {/* HR Search */}
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <FiUser size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            placeholder="Added by HR..."
            value={searchHr}
            onChange={e => { setSearchHr(e.target.value); setPage(1); }}
            style={{ ...inputStyle, paddingLeft: '40px', paddingRight: searchHr ? '36px' : '14px', fontSize: '13px', padding: '11px 12px 11px 40px' }}
          />
          {searchHr && (
            <button onClick={() => setSearchHr('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
              <FiX size={14} />
            </button>
          )}
        </div>

        {/* Date Filter */}
        <div style={{ flex: '0 1 180px' }}>
          <input
            type="date"
            value={searchDate}
            onChange={e => { setSearchDate(e.target.value); setPage(1); }}
            style={{ ...inputStyle, fontSize: '13px', padding: '10px 12px', height: '100%' }}
          />
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px 18px', marginBottom: '14px', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Advanced Filters</span>
            {hasActiveFilters && (
              <button onClick={clearFilters} style={{ fontSize: '11px', color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Clear All
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '5px' }}>Source</label>
              <select value={filterSource} onChange={e => { setFilterSource(e.target.value); setPage(1); }} style={inputStyle}>
                <option value="">All Sources</option>
                {sources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '5px' }}>Status</label>
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} style={inputStyle}>
                <option value="">All Statuses</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '5px' }}>AI Decision</label>
              <select value={filterAI} onChange={e => { setFilterAI(e.target.value); setPage(1); }} style={inputStyle}>
                <option value="">All</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Not Shortlisted">Not Shortlisted</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '5px' }}>Experience</label>
              <select value={filterExp} onChange={e => { setFilterExp(e.target.value); setPage(1); }} style={inputStyle}>
                <option value="">Any</option>
                <option value="0">Fresher</option>
                <option value="1">1 Year</option>
                <option value="2">2 Years</option>
                <option value="3">3 Years</option>
                <option value="4">4 Years</option>
                <option value="5">5 Years</option>
                <option value="6-10">6-10 Years</option>
                <option value="10+">10+ Years</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '5px' }}>From Date</label>
              <input type="date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '5px' }}>To Date</label>
              <input type="date" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setPage(1); }} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '5px' }}>Job Title</label>
              <input placeholder="e.g. Developer" value={filterJobTitle} onChange={e => { setFilterJobTitle(e.target.value); setPage(1); }} style={inputStyle} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '5px' }}>Skills (comma separated)</label>
              <input placeholder="e.g. React, Node" value={filterSkills} onChange={e => { setFilterSkills(e.target.value); setPage(1); }} style={inputStyle} />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', fontSize: '13px', marginBottom: '14px' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 16px rgba(11,47,91,0.05)' }}>
        {loading ? (
          <AdminTableSkeleton rows={8} columns={11} />
        ) : paged.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <FiDatabase size={36} style={{ marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{candidates.length === 0 ? 'No applicants in Database yet.' : 'No results match your filters.'}</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {[
                    { label: 'ID', key: 'applicantId' },
                    { label: 'Name', key: 'name' },
                    { label: 'Mobile', key: 'contactNumber' },
                    { label: 'Position / Job', key: 'currentPosition' },
                    { label: 'Source', key: 'source' },
                    { label: 'Added By', key: 'uploadedBy' },
                    { label: 'Exp.', key: 'totalExperience' },
                    { label: 'Status', key: 'status' },
                    { label: 'CV Age', key: 'createdOn' },
                    { label: 'Added On', key: 'createdOn' },
                    { label: '', key: null }
                  ].map((h, idx) => (
                    <th
                      key={h.label || idx}
                      onClick={() => h.key && requestSort(h.key)}
                      style={{
                        padding: h.label === 'Mobile' ? '11px 6px 11px 14px' : 
                                 h.label === 'Position / Job' ? '11px 14px 11px 6px' : '11px 14px',
                        textAlign: 'left', fontSize: '11px', fontWeight: 700,
                        color: '#64748b', letterSpacing: '0.4px', textTransform: 'uppercase',
                        whiteSpace: 'nowrap', cursor: h.key ? 'pointer' : 'default',
                        userSelect: 'none'
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {h.label}
                        {h.key && sortConfig.key === h.key && (
                          sortConfig.direction === 'asc' ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />
                        )}
                        {h.key && sortConfig.key !== h.key && (
                          <FiChevronDown size={12} style={{ opacity: 0.3 }} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((c, i) => (
                  <tr
                    key={c.applicantId || i}
                    className="row-hover"
                    onClick={() => navigate(`/admin/applicants/${c.applicantId}`)}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s', background: '#fff' }}
                  >
                    <td style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap' }}>{c.applicantId}</td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, #0B2F5B20, #1a4a8a30)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 800, color: '#0B2F5B'
                        }}>{(c.name || 'A').charAt(0).toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '13px' }}>{c.name || '—'}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{c.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 6px 12px 14px', color: '#475569', whiteSpace: 'nowrap', fontSize: '12px' }}>{c.contactNumber || '—'}</td>
                    <td style={{ padding: '12px 14px 12px 6px', maxWidth: '180px' }}>
                      <div style={{ fontWeight: 600, color: '#334155', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.currentPosition || c.jobAppliedFor || '—'}
                      </div>
                      {c.currentCompany && <div style={{ fontSize: '11px', color: '#94a3b8' }}>{c.currentCompany}</div>}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}><SourceBadge source={c.source} /></td>
                    <td style={{ padding: '12px 14px', color: '#475569', whiteSpace: 'nowrap', fontSize: '12px' }}>{c.uploadedBy || '—'}</td>
                    <td style={{ padding: '12px 14px', color: '#475569', whiteSpace: 'nowrap', fontSize: '12px' }}>{c.totalExperience ? `${c.totalExperience} yr` : '—'}</td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}><StatusBadge status={c.status} /></td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '12px' }}>
                        <FiClock size={11} /> {cvAge(c.createdOn)}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDate(c.createdOn)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <button style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: '7px',
                        background: '#fff', color: '#475569', cursor: 'pointer', fontSize: '11px', fontWeight: 600
                      }}>
                        <FiEye size={11} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding: '14px 18px', borderTop: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{
                width: '32px', height: '32px', borderRadius: '8px',
                border: '1px solid #e2e8f0', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer',
                color: page === 1 ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}><FiChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, k) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + k;
                return (
                  <button key={p} onClick={() => setPage(p)} style={{
                    width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                    background: page === p ? '#0B2F5B' : '#f8fafc',
                    color: page === p ? '#fff' : '#475569',
                    fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>{p}</button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{
                width: '32px', height: '32px', borderRadius: '8px',
                border: '1px solid #e2e8f0', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                color: page === totalPages ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}><FiChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
