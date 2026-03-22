import { useState, useEffect } from "react";
import { jobService } from "../../services/jobService.js";

const STATUS_COLORS = {
  'Applied':    { bg: "#e0f2fe", color: "#0369a1" },
  'Reviewed':   { bg: "#fef9c3", color: "#92400e" },
  'Shortlisted':{ bg: "#dcfce7", color: "#15803d" },
  'Rejected':   { bg: "#fee2e2", color: "#dc2626" },
  'Hired':      { bg: "#f3e8ff", color: "#7c3aed" },
};

function Badge({ status }) {
  const { bg, color } = STATUS_COLORS[status] || STATUS_COLORS['Applied'];
  return (
    <span style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: bg, color }}>{status || 'Applied'}</span>
  );
}

function ResumeLink({ url }) {
  if (!url || url === 'No resume uploaded' || url.startsWith('Resume upload failed')) {
    return <span style={{ color: "#9ca3af", fontSize: "12px" }}>No resume</span>;
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{
      color: "#0b2f5b", fontWeight: 600, fontSize: "12px", textDecoration: "none",
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "4px 10px", background: "#e8f0ff", borderRadius: "8px", transition: "background 0.15s"
    }}
      onMouseEnter={e => e.currentTarget.style.background = "#dbeafe"}
      onMouseLeave={e => e.currentTarget.style.background = "#e8f0ff"}
    >
      <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
      </svg>
      PDF
    </a>
  );
}

export default function AdminCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterJob, setFilterJob] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAi, setFilterAi] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const loadCandidates = async () => {
    setLoading(true);
    const data = await jobService.fetchCandidates();
    setCandidates((data || []).reverse()); // newest first
    setLoading(false);
  };

  useEffect(() => { loadCandidates(); }, []);

  const allJobs = [...new Set(candidates.map(c => c.jobApplied).filter(Boolean))];
  const allStatuses = [...new Set(candidates.map(c => c.status || 'Applied').filter(Boolean))];

  const filtered = candidates.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.jobApplied?.toLowerCase().includes(q) ||
      c.currentLocation?.toLowerCase().includes(q) ||
      c.currentCompany?.toLowerCase().includes(q);
    const matchJob = !filterJob || c.jobApplied === filterJob;
    const matchStatus = !filterStatus || (c.status || 'Applied') === filterStatus;
    const matchAi = !filterAi || c.shortlistDecision === filterAi;
    return matchSearch && matchJob && matchStatus && matchAi;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSearch = (v) => { setSearch(v); setPage(1); };
  const handleFilterJob = (v) => { setFilterJob(v); setPage(1); };
  const handleFilterStatus = (v) => { setFilterStatus(v); setPage(1); };
  const handleFilterAi = (v) => { setFilterAi(v); setPage(1); };

  return (
    <div style={{ padding: "32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 700, color: "#111827" }}>Portal Candidate: - Candidate applying job on our portal</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "13px" }}>
            {loading ? "Loading..." : `${filtered.length} candidate${filtered.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
        <button onClick={loadCandidates} style={{
          padding: "9px 18px", background: "#f1f5f9", border: "1px solid #e2e8f0",
          borderRadius: "10px", fontWeight: 600, fontSize: "13px", cursor: "pointer",
          fontFamily: "inherit", color: "#374151", display: "flex", alignItems: "center", gap: "6px"
        }}>
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1", minWidth: "200px", maxWidth: "340px" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>
            <svg width="15" height="15" fill="#9ca3af" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </span>
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by name, email, job..."
            style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "9px 12px 9px 36px", fontSize: "13px", outline: "none", fontFamily: "inherit", background: "#fff" }}
            onFocus={e => e.target.style.borderColor = "#0b2f5b"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"}
          />
        </div>
        {/* Job Filter */}
        <select value={filterJob} onChange={e => handleFilterJob(e.target.value)} style={{
          border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "9px 12px",
          fontSize: "13px", outline: "none", fontFamily: "inherit", background: "#fff",
          cursor: "pointer", color: filterJob ? "#111827" : "#6b7280", minWidth: "180px"
        }}>
          <option value="">All Jobs</option>
          {allJobs.map(j => <option key={j} value={j}>{j.length > 35 ? j.slice(0,35)+'...' : j}</option>)}
        </select>
        {/* Status Filter */}
        <select value={filterStatus} onChange={e => handleFilterStatus(e.target.value)} style={{
          border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "9px 12px",
          fontSize: "13px", outline: "none", fontFamily: "inherit", background: "#fff",
          cursor: "pointer", color: filterStatus ? "#111827" : "#6b7280"
        }}>
          <option value="">All Statuses</option>
          {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {/* AI Filter */}
        <select value={filterAi} onChange={e => handleFilterAi(e.target.value)} style={{
          border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "9px 12px",
          fontSize: "13px", outline: "none", fontFamily: "inherit", background: "#fff",
          cursor: "pointer", color: filterAi ? "#111827" : "#6b7280"
        }}>
          <option value="">AI: All Decisions</option>
          <option value="Shortlisted">AI: Shortlisted</option>
          <option value="Not Shortlisted">AI: Not Shortlisted</option>
        </select>
        {(search || filterJob || filterStatus || filterAi) && (
          <button onClick={() => { setSearch(""); setFilterJob(""); setFilterStatus(""); setFilterAi(""); setPage(1); }} style={{
            padding: "9px 14px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: "10px",
            cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "#6b7280", fontFamily: "inherit"
          }}>Clear ✕</button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "18px", border: "1px solid #e8ecf0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Candidate", "Contact", "Job", "Experience", "CTC", "Notice", "Resume", "Status", "AI Score", "AI Decision", ""].map(h => (
                  <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>⏳ Loading candidates from Google Sheet...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={11} style={{ padding: "48px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
                  {search || filterJob || filterStatus || filterAi ? "No candidates match your filters." : "No applications yet."}
                </td></tr>
              ) : paged.map((c, i) => (
                <>
                  <tr key={i}
                    style={{ borderTop: "1px solid #f3f4f6", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafbff"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>{c.name}</div>
                      <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                        {c.timestamp ? new Date(c.timestamp).toLocaleDateString("en-IN") : ""}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: "12px", color: "#374151" }}>{c.email}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{c.contactNumber}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: "12px", color: "#374151", maxWidth: "160px", lineHeight: 1.4 }}>{c.jobApplied}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: "#374151" }}>{c.totalExperience}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: "12px", color: "#374151" }}>₹{c.currentCTC}</div>
                      <div style={{ fontSize: "12px", color: "#059669" }}>₹{c.expectedCTC}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "12px", color: "#374151" }}>{c.noticePeriod}</td>
                    <td style={{ padding: "14px 16px" }}><ResumeLink url={c.resumeLink} /></td>
                    <td style={{ padding: "14px 16px" }}><Badge status={c.status || 'Applied'} /></td>
                    <td style={{ padding: "14px 16px" }}>
                      {c.aiScore ? (
                        <div style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: "28px", height: "28px", borderRadius: "50%", fontWeight: 700, fontSize: "13px",
                          color: c.aiScore >= 8 ? "#15803d" : c.aiScore >= 6 ? "#0369a1" : c.aiScore >= 4 ? "#b45309" : "#b91c1c",
                          background: c.aiScore >= 8 ? "#dcfce7" : c.aiScore >= 6 ? "#e0f2fe" : c.aiScore >= 4 ? "#fef3c7" : "#fee2e2"
                        }}>
                          {c.aiScore}
                        </div>
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: "12px" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {c.shortlistDecision ? (
                        <span style={{
                          padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700,
                          background: c.shortlistDecision === 'Shortlisted' ? "#dcfce7" : "#fee2e2",
                          color: c.shortlistDecision === 'Shortlisted' ? "#15803d" : "#dc2626"
                        }}>{c.shortlistDecision}</span>
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: "12px" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button
                        onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                        style={{
                          background: "none", border: "none", cursor: "pointer", color: "#6b7280",
                          fontSize: "18px", padding: "2px 6px", borderRadius: "6px",
                          transform: expandedRow === i ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s"
                        }}
                      >›</button>
                    </td>
                  </tr>
                  {expandedRow === i && (
                    <tr key={`expand-${i}`} style={{ background: "#f8faff", borderTop: "1px solid #e8f0ff" }}>
                      <td colSpan={11} style={{ padding: "20px 24px", borderBottom: "1px solid #e8f0ff" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px", marginBottom: c.aiAnalysis ? "20px" : "0" }}>
                          {[
                            ["Current Location", c.currentLocation],
                            ["Education", c.recentEducation],
                            ["Current Company", c.currentCompany],
                            ["Current Position", c.currentPosition],
                            ["Email Status", c.emailStatus],
                          ].map(([label, val]) => (
                            <div key={label}>
                              <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", marginBottom: "3px" }}>{label}</div>
                              <div style={{ fontSize: "13px", color: "#374151", fontWeight: 500 }}>{val || "—"}</div>
                            </div>
                          ))}
                        </div>
                        {c.aiAnalysis && (
                          <div style={{
                            background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px",
                            padding: "16px", marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px"
                          }}>
                            <div>
                              <div style={{ fontSize: "11px", color: "#0B2F5B", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                AI Analysis
                              </div>
                              <div style={{ fontSize: "13px", color: "#333", lineHeight: 1.5 }}>{c.aiAnalysis}</div>
                            </div>
                            {c.shortlistReason && (
                              <div style={{ background: c.shortlistDecision === 'Shortlisted' ? "#f0fdf4" : "#fef2f2", padding: "10px 14px", borderRadius: "8px", borderLeft: c.shortlistDecision === 'Shortlisted' ? "3px solid #16a34a" : "3px solid #dc2626" }}>
                                <div style={{ fontSize: "11px", color: c.shortlistDecision === 'Shortlisted' ? "#16a34a" : "#dc2626", fontWeight: 700, textTransform: "uppercase", marginBottom: "2px" }}>Reasoning</div>
                                <div style={{ fontSize: "12px", color: "#374151", lineHeight: 1.4 }}>{c.shortlistReason}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: "#6b7280" }}>
              Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              {[...Array(totalPages)].map((_, idx) => (
                <button key={idx} onClick={() => setPage(idx+1)} style={{
                  width: "32px", height: "32px", borderRadius: "8px", border: "1px solid",
                  borderColor: page === idx+1 ? "#0b2f5b" : "#e5e7eb",
                  background: page === idx+1 ? "#0b2f5b" : "#fff",
                  color: page === idx+1 ? "#fff" : "#374151",
                  fontWeight: 600, fontSize: "13px", cursor: "pointer", fontFamily: "inherit"
                }}>{idx+1}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
