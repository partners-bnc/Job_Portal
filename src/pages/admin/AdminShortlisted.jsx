import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobService } from '../../services/jobService';
import { AdminTableSkeleton } from '../../Component/AdminSkeletons.jsx';
import {
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiExternalLink,
  FiFilter,
  FiLoader,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX
} from 'react-icons/fi';

const PAGE_SIZE = 25;

function toCsvValue(value) {
  const stringValue = `${value ?? ''}`.replace(/"/g, '""');
  return `"${stringValue}"`;
}

export default function AdminShortlisted() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [periodYear, setPeriodYear] = useState('');
  const [periodMonth, setPeriodMonth] = useState('');
  const [taggedBy, setTaggedBy] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [targetContact, setTargetContact] = useState('');

  const hasActiveFilters = Boolean(
    search || dateFrom || dateTo || periodYear || periodMonth || taggedBy || targetCompany || targetContact
  );

  const fetchData = async (nextPage = page, nextSearch = search) => {
    setLoading(true);
    setError('');
    try {
      const result = await jobService.fetchTaggedCandidatesPage({
        page: nextPage,
        pageSize: PAGE_SIZE,
        search: nextSearch,
        dateFrom,
        dateTo,
        periodYear,
        periodMonth,
        taggedBy,
        targetCompany,
        targetContact
      });
      setCandidates(result.data || []);
      setTotalCount(result.total || 0);
    } catch (e) {
      setError('Failed to load tagged candidates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchData(page, search);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [page, search, dateFrom, dateTo, periodYear, periodMonth, taggedBy, targetCompany, targetContact]);

  const handleDelete = async (applicantId, jobCode) => {
    if (!window.confirm(`Are you sure you want to remove this candidate (ID: ${applicantId}) from this job? This will revert their status in the database to "In Database".`)) {
      return;
    }

    setDeletingId(`${applicantId}-${jobCode}`);
    try {
      const result = await jobService.removeShortlist({ applicantId, jobCode });
      if (result.success) {
        const nextTotal = Math.max(0, totalCount - 1);
        const nextPage = page > 1 && candidates.length === 1 ? page - 1 : page;
        setPage(nextPage);
        setTotalCount(nextTotal);
        await fetchData(nextPage, search);
      } else {
        alert('Failed to remove: ' + (result.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Error: ' + e.toString());
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setPeriodYear('');
    setPeriodMonth('');
    setTaggedBy('');
    setTargetCompany('');
    setTargetContact('');
    setPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const rows = await jobService.exportTaggedCandidates({
        search,
        dateFrom,
        dateTo,
        periodYear,
        periodMonth,
        taggedBy,
        targetCompany,
        targetContact
      });

      const header = [
        'Applicant ID',
        'Candidate Name',
        'Job Code',
        'Target Role',
        'Target Company',
        'Contact Name',
        'Tagged By',
        'Action Date',
        'Current Stage'
      ];

      const body = rows.map((candidate) => ([
        candidate.applicantId,
        candidate.name,
        candidate.jobCode,
        candidate.jobRole,
        candidate.company,
        candidate.contactName,
        candidate.shortlistedBy,
        candidate.date,
        candidate.currentStage
      ].map(toCsvValue).join(',')));

      const csv = [header.map(toCsvValue).join(','), ...body].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tagged-candidates-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to export tagged candidates.');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fff'
  };

  return (
    <div style={{ padding: '28px 30px' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .row-hover:hover { background: #f8fafc !important; }
      `}</style>

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
              {loading ? 'Loading...' : `${totalCount} total tagged candidates`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowFilters((value) => !value)} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
            border: `1px solid ${hasActiveFilters ? '#059669' : '#e2e8f0'}`,
            background: hasActiveFilters ? '#059669' : '#fff',
            color: hasActiveFilters ? '#fff' : '#475569', cursor: 'pointer'
          }}>
            <FiFilter size={13} /> Filters
          </button>
          <button onClick={handleExport} disabled={exporting || loading} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 16px', border: '1px solid #e2e8f0', borderRadius: '10px',
            background: '#fff', color: '#475569', cursor: 'pointer', fontSize: '13px', fontWeight: 600
          }}>
            <FiDownload size={13} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button onClick={() => fetchData(page, search)} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 16px', border: '1px solid #e2e8f0', borderRadius: '10px',
            background: '#fff', color: '#475569', cursor: 'pointer', fontSize: '13px', fontWeight: 600
          }}>
            <FiRefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <FiSearch size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          placeholder="Search by name, role, company, contact, HR..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ width: '100%', padding: '11px 12px 11px 40px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
        />
        {search && (
          <button onClick={() => { setSearch(''); setPage(1); }} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            <FiX size={14} />
          </button>
        )}
      </div>

      {showFilters && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px 18px', marginBottom: '14px', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Advanced Filters</span>
            {hasActiveFilters && (
              <button onClick={clearFilters} style={{ fontSize: '11px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Clear All
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '5px' }}>From Date</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPeriodYear(''); setPeriodMonth(''); setPage(1); }} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '5px' }}>To Date</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPeriodYear(''); setPeriodMonth(''); setPage(1); }} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '5px' }}>Yearly</label>
              <input type="number" min="2000" max="2100" placeholder="2026" value={periodYear} onChange={(e) => { setPeriodYear(e.target.value); setPeriodMonth(''); setDateFrom(''); setDateTo(''); setPage(1); }} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '5px' }}>Monthly</label>
              <input type="month" value={periodMonth} onChange={(e) => { setPeriodMonth(e.target.value); setPeriodYear(''); setDateFrom(''); setDateTo(''); setPage(1); }} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '5px' }}>Tagged By</label>
              <input value={taggedBy} onChange={(e) => { setTaggedBy(e.target.value); setPage(1); }} placeholder="HR name" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '5px' }}>Target Company</label>
              <input value={targetCompany} onChange={(e) => { setTargetCompany(e.target.value); setPage(1); }} placeholder="Company name" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '5px' }}>Contact Name</label>
              <input value={targetContact} onChange={(e) => { setTargetContact(e.target.value); setPage(1); }} placeholder="Reporting contact" style={inputStyle} />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', fontSize: '13px', marginBottom: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 16px rgba(11,47,91,0.05)' }}>
        {loading ? (
          <AdminTableSkeleton rows={6} columns={8} />
        ) : candidates.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <FiCheckCircle size={36} style={{ marginBottom: '12px', display: 'block', margin: '0 auto 12px', color: '#cbd5e1' }} />
            <div style={{ fontSize: '14px', fontWeight: 600 }}>
              {totalCount === 0 ? 'No candidates have been tagged yet.' : 'No results match your search or filters.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Candidate', 'Job Code', 'Target Role', 'Target Company', 'Contact Name', 'Tagged By', 'Action Date', 'Actions'].map((header) => (
                    <th key={header} style={{ padding: '12px 16px', textAlign: header === 'Actions' ? 'right' : 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.4px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate, index) => (
                  <tr key={`${candidate.applicantId}-${candidate.jobCode}-${index}`} className="row-hover" style={{ borderBottom: index < candidates.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.2s' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{candidate.name || 'Unnamed'}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>ID: {candidate.applicantId}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '12px' }}>{candidate.jobCode || '-'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1d4ed8', fontSize: '12px' }}>
                      {candidate.jobRole || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>{candidate.company || '-'}</td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontSize: '12px' }}>{candidate.contactName || '-'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#334155' }}>{candidate.shortlistedBy || 'Admin'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FiCalendar size={13} /> {formatDate(candidate.date)}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={() => navigate(`/admin/applicants/${candidate.applicantId}`)} style={{
                          padding: '6px 12px', background: '#0B2F5B', color: '#fff',
                          border: 'none', borderRadius: '6px', cursor: 'pointer',
                          fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px'
                        }}>
                          View <FiExternalLink size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(candidate.applicantId, candidate.jobCode)}
                          disabled={deletingId === `${candidate.applicantId}-${candidate.jobCode}`}
                          style={{
                            padding: '6px 8px', background: '#fff', color: '#ef4444',
                            border: '1px solid #fee2e2', borderRadius: '6px', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          {deletingId === `${candidate.applicantId}-${candidate.jobCode}`
                            ? <FiLoader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            : <FiTrash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && !loading && (
          <div style={{
            padding: '14px 18px', borderTop: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} style={{
                width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff',
                cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#cbd5e1' : '#475569',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}><FiChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, offset) => {
                const start = Math.max(1, Math.min(totalPages - 4, page - 2));
                const pageNumber = start + offset;
                return (
                  <button key={pageNumber} onClick={() => setPage(pageNumber)} style={{
                    width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                    background: page === pageNumber ? '#059669' : '#f8fafc',
                    color: page === pageNumber ? '#fff' : '#475569',
                    fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>{pageNumber}</button>
                );
              })}
              <button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} style={{
                width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff',
                cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#cbd5e1' : '#475569',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}><FiChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
