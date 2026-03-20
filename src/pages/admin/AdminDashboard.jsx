import { useState, useEffect } from "react";
import { jobService } from "../../services/jobService.js";

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
  const [loading, setLoading] = useState(true);
  const adminId = sessionStorage.getItem("bnc_admin_id") || "Admin";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [j, c] = await Promise.all([jobService.fetchJobs(), jobService.fetchCandidates()]);
      setJobs(j || []);
      setCandidates(c || []);
      setLoading(false);
    };
    load();
  }, []);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // Recent 5 candidates
  const recent = candidates.slice(-5).reverse();

  return (
    <div style={{ padding: "32px", maxWidth: "1200px" }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          <StatCard icon="💼" label="Active Job Listings" value={jobs.length} color="#0b2f5b" bg="#e8f0ff" />
          <StatCard icon="👥" label="Total Candidates" value={candidates.length} color="#059669" bg="#ecfdf5" />
          <StatCard icon="📋" label="Applications Today" value={candidates.filter(c => {
            if (!c.timestamp) return false;
            const d = new Date(c.timestamp);
            const now = new Date();
            return d.toDateString() === now.toDateString();
          }).length} color="#d97706" bg="#fffbeb" />
          <StatCard icon="✨" label="AI Shortlisted" value={candidates.filter(c => c.shortlistDecision === 'Shortlisted').length} color="#7c3aed" bg="#f5f3ff" />
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
                      background: c.status === 'Applied' ? '#e0f2fe' : '#dcfce7',
                      color: c.status === 'Applied' ? '#0369a1' : '#15803d'
                    }}>{c.status || 'Applied'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
