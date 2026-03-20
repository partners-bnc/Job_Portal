import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jobService } from "../services/jobService.js";

const navItems = [
  { label: "Home" },
  { label: "For Employers" },
  { label: "For Candidates" },
  { label: "Contact us" },
];

export default function Header() {
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openModal = () => {
    setLoginId("");
    setPassword("");
    setError("");
    setShowPass(false);
    setLoginOpen(true);
  };

  const closeModal = () => setLoginOpen(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginId.trim() || !password.trim()) {
      setError("Please enter both Login ID and Password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await jobService.adminLogin(loginId.trim(), password.trim());
      if (result.success) {
        sessionStorage.setItem("bnc_admin_auth", "true");
        sessionStorage.setItem("bnc_admin_id", result.loginId || loginId);
        setLoginOpen(false);
        navigate("/admin");
      } else {
        setError(result.error || "Invalid Login ID or Password.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="absolute inset-x-0 top-0 z-50 bg-transparent">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-8 py-5">
          <Link
            to="/"
            className="flex items-center gap-3 text-lg font-semibold tracking-tight text-[#1f2937]"
          >
            <img
              src="/download.png"
              alt="BnC Global"
              className="h-14 w-14 rounded-xl object-contain"
              loading="lazy"
            />
            <span className="uppercase tracking-wide">BnC Global</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#4b5563] lg:flex">
            {navItems.map((item) => {
              const content = (
                <>
                  <span>{item.label}</span>
                  {item.hasCaret && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </>
              );

              if (item.label === "For Candidates") {
                return (
                  <Link key={item.label} to="/candidate-jobs" className="flex items-center gap-1 transition hover:text-[#111827]">
                    {content}
                  </Link>
                );
              }
              if (item.label === "For Employers") {
                return (
                  <Link key={item.label} to="/employers" className="flex items-center gap-1 transition hover:text-[#111827]">
                    {content}
                  </Link>
                );
              }
              if (item.label === "Home") {
                return (
                  <Link key={item.label} to="/" className="flex items-center gap-1 transition hover:text-[#111827]">
                    {content}
                  </Link>
                );
              }
              if (item.label === "Contact us") {
                return (
                  <Link key={item.label} to="/contact" className="flex items-center gap-1 transition hover:text-[#111827]">
                    {content}
                  </Link>
                );
              }
              return (
                <button key={item.label} type="button" className="flex items-center gap-1 transition hover:text-[#111827]">
                  {content}
                </button>
              );
            })}
          </nav>

          {/* Admin Login Button */}
          <button
            type="button"
            onClick={openModal}
            className="rounded-full border border-[#d1c6bd] px-5 py-2 text-sm font-semibold text-[#111827] transition hover:border-[#111827] hover:bg-[#111827] hover:text-white"
          >
            Log In
          </button>
        </div>
      </header>

      {/* Admin Login Modal */}
      {loginOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            style={{
              background: "#ffffff", borderRadius: "22px", width: "100%", maxWidth: "400px",
              boxShadow: "0 40px 80px rgba(0,0,0,0.3)", overflow: "hidden",
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              animation: "modalIn 0.22s ease"
            }}
          >
            {/* Modal Header */}
            <div style={{
              background: "linear-gradient(135deg, #0b2f5b 0%, #1a4a8a 100%)",
              padding: "28px 28px 24px", position: "relative"
            }}>
              <button onClick={closeModal} style={{
                position: "absolute", top: "16px", right: "16px",
                background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px",
                width: "30px", height: "30px", cursor: "pointer", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px"
              }}>✕</button>

              <div style={{
                width: "46px", height: "46px", borderRadius: "13px",
                background: "rgba(255,255,255,0.15)", display: "flex",
                alignItems: "center", justifyContent: "center", marginBottom: "14px"
              }}>
                <svg width="22" height="22" fill="white" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </div>
              <h2 style={{ margin: "0 0 4px", color: "white", fontSize: "20px", fontWeight: 700 }}>Admin Login</h2>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>BnC Global · HR Dashboard Access</p>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleLogin} style={{ padding: "24px 28px 28px" }}>
              {/* Login ID */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Login ID
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>
                    <svg width="15" height="15" fill="#9ca3af" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={loginId}
                    onChange={e => setLoginId(e.target.value)}
                    placeholder="Enter Login ID"
                    style={{
                      width: "100%", boxSizing: "border-box", border: "1.5px solid #e5e7eb",
                      borderRadius: "10px", padding: "11px 12px 11px 36px", fontSize: "14px",
                      outline: "none", fontFamily: "inherit", background: "#f9fafb",
                      transition: "border 0.2s"
                    }}
                    onFocus={e => e.target.style.borderColor = "#0b2f5b"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>
                    <svg width="15" height="15" fill="#9ca3af" viewBox="0 0 24 24">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                  </span>
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    style={{
                      width: "100%", boxSizing: "border-box", border: "1.5px solid #e5e7eb",
                      borderRadius: "10px", padding: "11px 40px 11px 36px", fontSize: "14px",
                      outline: "none", fontFamily: "inherit", background: "#f9fafb",
                      transition: "border 0.2s"
                    }}
                    onFocus={e => e.target.style.borderColor = "#0b2f5b"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{
                    position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0
                  }}>
                    {showPass ? (
                      <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: "#fff1f1", border: "1px solid #fecaca", borderRadius: "9px",
                  padding: "9px 13px", marginBottom: "16px",
                  color: "#dc2626", fontSize: "13px", display: "flex", gap: "7px", alignItems: "center"
                }}>
                  <svg width="13" height="13" fill="#dc2626" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "13px",
                  background: loading ? "#93a8c4" : "linear-gradient(135deg, #0b2f5b, #1a4a8a)",
                  color: "#fff", border: "none", borderRadius: "11px",
                  fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit", boxShadow: loading ? "none" : "0 4px 14px rgba(11,47,91,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.35)",
                      borderTop: "2px solid white", borderRadius: "50%",
                      animation: "spin 0.8s linear infinite", display: "inline-block"
                    }} />
                    Verifying...
                  </>
                ) : "Sign in →"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
