import { useState, useEffect } from "react";
import { jobService } from "../../services/jobService.js";

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    hrName: "", email: "", password: "", phone: "",
    department: "Talent Acquisition", designation: "", role: "hr",
  });
  
  const userRole = sessionStorage.getItem("bnc_admin_role");
  const isSuperAdmin = userRole === "super_admin";

  useEffect(() => { loadAdmins(); }, []);

  const loadAdmins = async () => {
    setLoading(true);
    const data = await jobService.fetchAllAdmins();
    setAdmins(data);
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setMessage("Error: Only Super Admins can add new admins.");
      return;
    }
    if (!form.hrName || !form.email || !form.password) {
      setMessage("Name, Email and Password are required.");
      return;
    }
    setSaving(true);
    setMessage("");
    const result = await jobService.createAdmin(form);
    if (result.success) {
      setMessage("Admin added successfully!");
      setForm({ hrName: "", email: "", password: "", phone: "", department: "Talent Acquisition", designation: "", role: "hr" });
      setShowAddForm(false);
      loadAdmins();
    } else {
      setMessage("Error: " + (result.error || "Failed to add admin"));
    }
    setSaving(false);
  };

  const handleToggle = async (admin) => {
    if (!isSuperAdmin) {
      alert("Only Super Admins can perform this action.");
      return;
    }
    const result = await jobService.toggleAdminStatus(admin.id, !admin.is_active);
    if (result.success) loadAdmins();
    else setMessage("Error: " + result.error);
  };

  const s = {
    page: { padding: "24px 40px", maxWidth: "1600px", margin: "0 auto", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" },

    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
    title: { fontSize: "22px", fontWeight: 700, color: "#0b2f5b", margin: 0 },
    subtitle: { fontSize: "13px", color: "#6b7280", margin: "4px 0 0" },
    addBtn: { 
      padding: "10px 22px", 
      background: "linear-gradient(135deg, #0b2f5b, #1a4a8a)", 
      color: "#fff", 
      border: "none", 
      borderRadius: "12px", 
      fontWeight: 700, 
      fontSize: "13px", 
      cursor: "pointer",
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: "0 4px 14px rgba(11, 47, 91, 0.35), inset 0 2px 4px rgba(255,255,255,0.2)",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    card: { background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
    th: { padding: "12px 16px", textAlign: "left", background: "#f8f9fb", borderBottom: "1px solid #e5e7eb", color: "#374151", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" },
    td: { padding: "12px 16px", borderBottom: "1px solid #f3f4f6", color: "#374151" },
    badge: (active) => ({ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, background: active ? "#ecfdf5" : "#fef2f2", color: active ? "#059669" : "#dc2626" }),
    toggleBtn: (active) => ({
      padding: "6px 14px", borderRadius: "10px", border: "none", fontSize: "11px", fontWeight: 700, 
      cursor: "pointer", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", 
      background: active ? "linear-gradient(135deg, #f87171, #ef4444)" : "linear-gradient(135deg, #34d399, #10b981)", 
      color: "#fff", 
      boxShadow: active 
        ? "0 3px 6px -1px rgba(239, 68, 68, 0.3), inset 0 1px 2px rgba(255,255,255,0.3)"
        : "0 3px 6px -1px rgba(16, 185, 129, 0.3), inset 0 1px 2px rgba(255,255,255,0.3)",
      textTransform: "uppercase", letterSpacing: "0.5px",
      display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "110px"
    }),
    form: { background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "24px", marginBottom: "20px" },
    input: { width: "100%", boxSizing: "border-box", border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", fontFamily: "inherit", outline: "none", background: "#f9fafb" },
    label: { display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "16px" },
    msg: { padding: "10px 14px", borderRadius: "10px", marginBottom: "16px", fontSize: "13px" },
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Admin Management</h1>
          <p style={s.subtitle}>Manage HR admin accounts ({admins.length} total)</p>
        </div>
        {isSuperAdmin && (
          <button 
            style={s.addBtn} 
            onClick={() => setShowAddForm(!showAddForm)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(11, 47, 91, 0.45), inset 0 2px 4px rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = s.addBtn.boxShadow;
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.96)"}
            onMouseUp={(e) => e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"}
          >
            {showAddForm ? "✕ Cancel" : "+ Add Admin"}
          </button>
        )}
      </div>

      {message && (
        <div style={{ ...s.msg, background: message.startsWith("Error") ? "#fef2f2" : "#ecfdf5", color: message.startsWith("Error") ? "#dc2626" : "#059669", border: `1px solid ${message.startsWith("Error") ? "#fecaca" : "#a7f3d0"}` }}>
          {message}
        </div>
      )}

      {showAddForm && (
        <form style={s.form} onSubmit={handleAdd}>
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "#0b2f5b" }}>Add New Admin</h3>
          <div style={s.grid}>
            <div>
              <label style={s.label}>Full Name *</label>
              <input style={s.input} value={form.hrName} onChange={e => setForm({ ...form, hrName: e.target.value })} placeholder="e.g. John Doe" />
            </div>
            <div>
              <label style={s.label}>Email *</label>
              <input style={s.input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@company.com" />
            </div>
            <div>
              <label style={s.label}>Password *</label>
              <input style={s.input} type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 characters" />
            </div>
            <div>
              <label style={s.label}>Phone</label>
              <input style={s.input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
            </div>
            <div>
              <label style={s.label}>Department</label>
              <input style={s.input} value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <label style={s.label}>Designation</label>
              <input style={s.input} value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Senior Recruitment" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ ...s.addBtn, opacity: saving ? 0.7 : 1 }}>{saving ? "Adding..." : "Add Admin"}</button>
          </div>
        </form>
      )}

      <div style={s.card}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading admins...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>#</th>
                  <th style={s.th}>Name</th>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>Phone</th>
                  <th style={s.th}>Designation</th>
                  <th style={s.th}>Role</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>{isSuperAdmin ? "Actions" : "Access"}</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin, i) => (
                  <tr key={admin.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                    <td style={s.td}>{i + 1}</td>
                    <td style={{ ...s.td, fontWeight: 600 }}>{admin.hr_name}</td>
                    <td style={s.td}>{admin.email}</td>
                    <td style={s.td}>{admin.phone || "—"}</td>
                    <td style={s.td}>{admin.designation || "—"}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge(true), background: admin.role === 'super_admin' ? '#eff6ff' : '#f5f3ff', color: admin.role === 'super_admin' ? '#2563eb' : '#7c3aed' }}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'HR'}
                      </span>
                    </td>
                    <td style={s.td}><span style={s.badge(admin.is_active)}>{admin.is_active ? "Active" : "Inactive"}</span></td>
                    <td style={s.td}>
                      {isSuperAdmin ? (
                        <button
                          style={s.toggleBtn(admin.is_active)}
                          onClick={() => handleToggle(admin)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.03)";
                            e.currentTarget.style.boxShadow = admin.is_active 
                              ? "0 6px 10px -2px rgba(239, 68, 68, 0.4)" 
                              : "0 6px 10px -2px rgba(16, 185, 129, 0.4)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = s.toggleBtn(admin.is_active).boxShadow;
                          }}
                          onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
                          onMouseUp={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                        >
                          {admin.is_active ? "Deactivate" : "Activate"}
                        </button>
                      ) : (
                        <span style={{ color: "#9ca3af", fontStyle: "italic" }}>No Permission</span>
                      )}
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
