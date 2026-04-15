function shimmerStyle() {
  return {
    background: "linear-gradient(90deg, #f8fafc 25%, #e2e8f0 37%, #f8fafc 63%)",
    backgroundSize: "400% 100%",
    animation: "adminSkeletonShimmer 1.4s ease infinite",
  };
}

function SkeletonBlock({ width = "100%", height = 16, radius = 10, style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        ...shimmerStyle(),
        ...style,
      }}
    />
  );
}

function SkeletonStyles() {
  return (
    <style>{`
      @keyframes adminSkeletonShimmer {
        0% { background-position: 100% 0; }
        100% { background-position: -100% 0; }
      }
    `}</style>
  );
}

export function AdminTableSkeleton({ rows = 6, columns = 5, showHeader = true }) {
  return (
    <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 16px rgba(11,47,91,0.05)" }}>
      <SkeletonStyles />
      {showHeader && (
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: "14px" }}>
          {Array.from({ length: columns }).map((_, idx) => (
            <SkeletonBlock key={idx} width={idx === 0 ? "50%" : "70%"} height={12} radius={8} />
          ))}
        </div>
      )}
      <div style={{ padding: "10px 16px 14px" }}>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gap: "14px",
              alignItems: "center",
              padding: "14px 0",
              borderBottom: rowIdx < rows - 1 ? "1px solid #f1f5f9" : "none",
            }}
          >
            {Array.from({ length: columns }).map((__, colIdx) => (
              <SkeletonBlock
                key={`${rowIdx}-${colIdx}`}
                width={colIdx === 0 ? "82%" : colIdx === columns - 1 ? "56%" : "68%"}
                height={colIdx === 0 ? 16 : 14}
                radius={10}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div>
      <SkeletonStyles />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              padding: "24px",
              border: "1px solid #e5dfd8",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              boxShadow: "0 20px 40px -35px rgba(31,41,55,0.5)",
            }}
          >
            <SkeletonBlock width={52} height={52} radius={14} />
            <div style={{ flex: 1 }}>
              <SkeletonBlock width="42%" height={28} radius={10} />
              <SkeletonBlock width="70%" height={12} radius={8} style={{ marginTop: "10px" }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "32px" }}>
        <div style={{ flex: "1 1 500px", background: "#ffffff", borderRadius: "18px", border: "1px solid #e8ecf0", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <SkeletonBlock width={140} height={16} />
            <SkeletonBlock width={120} height={34} radius={10} />
          </div>
          <div style={{ padding: "18px 20px" }}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "16px", padding: "14px 0", borderBottom: idx < 4 ? "1px solid #f3f4f6" : "none" }}>
                <SkeletonBlock width="74%" height={15} />
                <SkeletonBlock width="46%" height={15} />
                <SkeletonBlock width="46%" height={15} />
                <SkeletonBlock width="46%" height={15} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: "1 1 min(100%, 400px)", background: "#ffffff", borderRadius: "18px", border: "1px solid #e8ecf0", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6" }}>
            <SkeletonBlock width={170} height={16} />
          </div>
          <div style={{ padding: "24px", minHeight: "320px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SkeletonBlock width={220} height={220} radius={999} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <SkeletonBlock width={150} height={16} />
          <SkeletonBlock width={90} height={14} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} style={{ background: "#ffffff", borderRadius: "16px", padding: "20px", border: "1px solid #e5dfd8", boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}>
              <SkeletonBlock width="78%" height={16} />
              <SkeletonBlock width="30%" height={12} style={{ marginTop: "10px" }} />
              <SkeletonBlock width="62%" height={12} style={{ marginTop: "16px" }} />
              <SkeletonBlock width="58%" height={12} style={{ marginTop: "10px" }} />
            </div>
          ))}
        </div>
      </div>

      <AdminTableSkeleton rows={5} columns={5} />
    </div>
  );
}
