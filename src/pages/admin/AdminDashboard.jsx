import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { jobService } from "../../services/jobService.js";
import { supabase } from "../../services/supabaseClient.js";

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div style={{
      background: "#ffffff", borderRadius: "18px", padding: "24px",
      boxShadow: "0 20px 40px -35px rgba(31,41,55,0.5)",
      border: "1px solid #e5dfd8", display: "flex", alignItems: "center", gap: "16px"
    }}>
      <div style={{
        width: "52px", height: "52px", borderRadius: "14px", background: bg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
      }}>
        <span style={{ fontSize: "22px" }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: "28px", fontWeight: 700, color: color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{label}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [dbCandidates, setDbCandidates] = useState([]);
  const [shortlisted, setShortlisted] = useState([]);
  const [commLogs, setCommLogs] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientJobs, setClientJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const adminId = sessionStorage.getItem("bnc_admin_name") || sessionStorage.getItem("bnc_admin_id") || "Admin";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [j, c, db, s, clientsData, cj, { data: logsData }] = await Promise.all([
        jobService.fetchJobs(), 
        jobService.fetchCandidates(),
        jobService.getDatabaseCandidates(),
        jobService.getShortlistedCandidates(),
        jobService.fetchClients(),
        jobService.fetchClientJobs(),
        supabase.from('communication_logs').select('hr_name, created_at')
      ]);
      setJobs(j || []);
      setCandidates(c || []);
      setDbCandidates(db || []);
      setShortlisted(s || []);
      setCommLogs(logsData || []);
      setClients(clientsData || []);
      setClientJobs((cj || []).filter(j => j.status?.toLowerCase() === 'active'));
      setLoading(false);
    };
    load();
  }, []);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const [hrDateFilter, setHrDateFilter] = useState("");

  const hrStats = useMemo(() => {
    const stats = {};
    
    // Process Uploads
    dbCandidates.forEach(c => {
      if (hrDateFilter) {
        const d = new Date(c.createdOn);
        if (isNaN(d.getTime()) || d.toISOString().split('T')[0] !== hrDateFilter) return;
      }
      const hr = c.uploadedBy || 'Portal / Unknown';
      if (!stats[hr]) stats[hr] = { uploaded: 0, tagged: 0, calls: 0 };
      stats[hr].uploaded += 1;
    });

    // Process Tagged
    shortlisted.forEach(s => {
      if (hrDateFilter) {
        const d = new Date(s.date);
        if (isNaN(d.getTime()) || d.toISOString().split('T')[0] !== hrDateFilter) return;
      }
      const hr = s.shortlistedBy || 'Portal / Unknown';
      if (!stats[hr]) stats[hr] = { uploaded: 0, tagged: 0, calls: 0 };
      stats[hr].tagged += 1;
    });

    // Process Calls Logged
    commLogs.forEach(log => {
      if (hrDateFilter) {
        const d = new Date(log.created_at);
        if (isNaN(d.getTime()) || d.toISOString().split('T')[0] !== hrDateFilter) return;
      }
      if (log.hr_name) {
        const hr = log.hr_name;
        if (!stats[hr]) stats[hr] = { uploaded: 0, tagged: 0, calls: 0 };
        stats[hr].calls += 1;
      }
    });

    return Object.entries(stats).sort((a, b) => b[1].uploaded - a[1].uploaded);
  }, [dbCandidates, shortlisted, commLogs, hrDateFilter]);

  const COLORS = ['#0b2f5b', '#059669', '#d97706', '#7c3aed', '#db2777', '#2563eb', '#ea580c'];

  const sourceStats = useMemo(() => {
    const stats = {};
    dbCandidates.forEach(c => {
      const src = c.source || 'Portal / Unknown';
      stats[src] = (stats[src] || 0) + 1;
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [dbCandidates]);

  // Recent 5 candidates
  const recent = candidates.slice(-5).reverse();

  return (
    <div style={{ padding: "32px", maxWidth: "1250px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: "26px", fontWeight: 700, color: "#111827" }}>
          👋 Welcome back, {adminId}
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>{today}</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div style={{ color: "#6b7280", fontSize: "15px", padding: "20px 0" }}>Loading stats...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          <StatCard icon="💼" label="Active Job Listings" value={jobs.length} color="#0b2f5b" bg="#e8f0ff" />
          <StatCard icon="👥" label="Total Candidates" value={candidates.length} color="#059669" bg="#ecfdf5" />
          <StatCard icon="📋" label="Applications Today" value={candidates.filter(c => {
            const ts = c.createdOn || c.timestamp;
            if (!ts) return false;
            const d = new Date(ts);
            const now = new Date();
            return d.toDateString() === now.toDateString();
          }).length} color="#d97706" bg="#fffbeb" />
          <StatCard icon="✨" label="AI Shortlisted" value={candidates.filter(c => c.shortlistDecision === 'Shortlisted').length} color="#7c3aed" bg="#f5f3ff" />
          
          <StatCard icon="📈" label="Total Applicant" value={dbCandidates.length} color="#2563eb" bg="#dbeafe" />
          <StatCard icon="🏆" label="Tagged Candidates" value={shortlisted.length} color="#16a34a" bg="#dcfce7" />
          <StatCard icon="📅" label="Month CV Upload" value={dbCandidates.filter(c => {
            const d = new Date(c.createdOn);
            if (isNaN(d.getTime())) return false;
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length} color="#ca8a04" bg="#fef08a" />
          <StatCard icon="🏢" label="Total Client" value={clients.length} color="#9333ea" bg="#f3e8ff" />
        </div>
      )}

      {/* Lower Split Section */}
      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "32px", alignItems: "stretch" }}>
        
        {/* Left: HR Performance Table */}
        <div style={{
          flex: "1 1 500px", background: "#ffffff", borderRadius: "18px",
          border: "1px solid #e8ecf0", overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column"
        }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#111827" }}>HR Performance</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input 
                type="date" 
                value={hrDateFilter}
                onChange={(e) => setHrDateFilter(e.target.value)}
                style={{
                  padding: "6px 10px", border: "1px solid #e5dfd8", borderRadius: "8px", 
                  fontSize: "12px", outline: "none", color: "#374151"
                }}
              />
              {hrDateFilter && (
                <button 
                  onClick={() => setHrDateFilter("")}
                  style={{ fontSize: "11px", color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>Loading...</div>
          ) : hrStats.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#6b7280", fontSize: "14px" }}>
              No performance data found for the selected criteria.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>HR Name</th>
                    <th style={{ padding: "12px 20px", textAlign: "center", fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Uploaded</th>
                    <th style={{ padding: "12px 20px", textAlign: "center", fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tagged CVs</th>
                    <th style={{ padding: "12px 20px", textAlign: "center", fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Calls Logged</th>
                  </tr>
                </thead>
                <tbody>
                  {hrStats.map(([hrName, data], idx) => (
                    <tr key={hrName} style={{ borderTop: "1px solid #f3f4f6", background: idx % 2 === 0 ? "#fff" : "#fafafa", transition: "background 0.2s" }}>
                      <td style={{ padding: "14px 20px", fontWeight: 600, fontSize: "14px", color: "#111827" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                             width: "32px", height: "32px", borderRadius: "50%", 
                             background: "linear-gradient(135deg, #0b2f5b20, #0b2f5b30)", 
                             color: "#0b2f5b", display: "flex", alignItems: "center", 
                             justifyContent: "center", fontSize: "13px", fontWeight: 700 
                          }}>
                            {(hrName || "A").charAt(0).toUpperCase()}
                          </div>
                          {hrName}
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "center", fontSize: "15px", fontWeight: 700, color: "#0b2f5b" }}>
                        {data.uploaded}
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "center", fontSize: "15px", fontWeight: 700, color: "#16a34a" }}>
                        {data.tagged}
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "center", fontSize: "15px", fontWeight: 700, color: "#7c3aed" }}>
                        {data.calls}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Candidates by Source Chart */}
        <div style={{
          flex: "1 1 min(100%, 400px)", background: "#ffffff", borderRadius: "18px",
          border: "1px solid #e8ecf0", overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column"
        }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>Candidates by Source</h2>
          </div>
          <div style={{ flex: 1, padding: "24px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "320px" }}>
            {loading ? (
              <div style={{ color: "#6b7280" }}>Loading chart...</div>
            ) : sourceStats.length === 0 ? (
              <div style={{ color: "#6b7280" }}>No sourcing data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sourceStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sourceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontWeight: 600 }}
                    itemStyle={{ color: '#111827' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        
      </div>

      {/* Active Client Jobs */}
      {!loading && clientJobs.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>Active Client Jobs</h2>
            <a href="/admin/client-jobs" style={{ fontSize: "13px", color: "#0b2f5b", fontWeight: 600, textDecoration: "none" }}>View all →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
            {clientJobs.map(job => {
              const taggedCount = shortlisted.filter(s => s.jobCode === job.jobCode).length;
              const hasTagged = taggedCount > 0;
              return (
                <a key={job.jobCode} href={`/admin/client-jobs/${job.jobCode}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "#ffffff", borderRadius: "16px", padding: "20px",
                    border: "1px solid #e5dfd8", boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
                    transition: "box-shadow 0.2s, transform 0.2s", cursor: "pointer",
                    display: "flex", flexDirection: "column", gap: "12px"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.jobTitle}</div>
                        <div style={{ fontSize: "12px", color: "#0f766e", fontWeight: 700, marginTop: "4px" }}>{job.jobCode}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, marginLeft: "8px" }}>
                        <div style={{
                          width: "12px", height: "12px", borderRadius: "50%",
                          background: hasTagged ? "#16a34a" : "#f97316",
                          boxShadow: hasTagged ? "0 0 0 3px #dcfce7" : "0 0 0 3px #ffedd5"
                        }} />
                        <span style={{ fontSize: "13px", fontWeight: 700, color: hasTagged ? "#16a34a" : "#f97316" }}>
                          {taggedCount}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                      <span style={{ fontWeight: 600, color: "#374151" }}>Created by: </span>{job.createdBy || "—"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      <span style={{ fontWeight: 600, color: "#374151" }}>Client: </span>{job.clientName || "—"}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Applications */}
      <div style={{
        background: "#ffffff", borderRadius: "18px",
        border: "1px solid #e8ecf0", overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
      }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>Recent Applications</h2>
          <a href="/admin/candidates" style={{ fontSize: "13px", color: "#0b2f5b", fontWeight: 600, textDecoration: "none" }}>View all →</a>
        </div>
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>Loading...</div>
        ) : recent.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#6b7280", fontSize: "14px" }}>
            No applications yet. They'll appear here once candidates apply.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Candidate", "Job Applied", "Location", "Experience", "Status"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((c, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>{c.name}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>{c.email}</div>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#374151" }}>{c.jobApplied}</td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#374151" }}>{c.currentLocation}</td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#374151" }}>{c.totalExperience}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600,
                        background: (c.status === 'Applied' || !c.status) ? '#e0f2fe' : (c.status === 'Tagged' ? '#dcfce7' : '#f1f5f9'),
                        color: (c.status === 'Applied' || !c.status) ? '#0369a1' : (c.status === 'Tagged' ? '#15803d' : '#475569')
                      }}>{c.status || 'Applied'}</span>
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
