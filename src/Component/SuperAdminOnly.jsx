export default function SuperAdminOnly({ children, pageName = "this page" }) {
  const userRole = sessionStorage.getItem("bnc_admin_role");
  const isSuperAdmin = userRole === "super_admin";

  if (isSuperAdmin) {
    return children;
  }

  return (
    <div
      style={{
        minHeight: "100%",
        padding: "32px",
        background: "#F7F2ED",
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(148, 163, 184, 0.24)",
          borderRadius: "24px",
          padding: "42px 38px",
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.10)",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "180px",
            gap: "18px",
          }}
        >
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "999px",
              background: "#EEF2FF",
              color: "#3730A3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1 4 5v6c0 5.05 3.41 9.79 8 11 4.59-1.21 8-5.95 8-11V5l-8-4Zm0 2.18L18 6.18V11c0 4.02-2.6 7.9-6 9.11C8.6 18.9 6 15.02 6 11V6.18l6-3Zm0 3.32a3 3 0 0 0-3 3v1H8v6h8v-6h-1v-1a3 3 0 0 0-3-3Zm-1 4v-1a1 1 0 1 1 2 0v1h-2Z" />
            </svg>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: "20px",
              lineHeight: 1.7,
              color: "#334155",
              maxWidth: "560px",
              marginInline: "auto",
              fontWeight: 600,
            }}
          >
            You are not authorized to access this page. Only Super Admin can view this section.
          </p>
        </div>
      </div>
    </div>
  );
}
