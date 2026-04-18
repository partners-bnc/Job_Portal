import { Link, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Home" },
  { label: "For Employers" },
  { label: "For Candidates" },
  { label: "Contact us" },
];

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="absolute inset-x-0 top-0 z-50 bg-transparent">
      <div className="mx-auto flex h-28 max-w-7xl items-center justify-between gap-6 px-8">
        <Link
          to="/"
          className="relative h-24 w-36 shrink-0 text-lg font-semibold tracking-tight text-[#1f2937]"
        >
          <img
            src="/logo.png"
            alt="Ciedeck"
            className="absolute -left-5 top-[45%] h-[100px] w-auto max-w-none -translate-y-[38%] object-contain"
            loading="lazy"
          />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-[#4b5563] lg:flex">
          {navItems.map((item) => {
            const content = (
              <>
                <span>{item.label}</span>
                {item.hasCaret && (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <button
          type="button"
          onClick={() => navigate("/admin/login")}
          className="rounded-full border border-[#d1c6bd] px-5 py-2 text-sm font-semibold text-[#111827] transition hover:border-[#111827] hover:bg-[#111827] hover:text-white"
        >
          Log In
        </button>
      </div>
    </header>
  );
}
