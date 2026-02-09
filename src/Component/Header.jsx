import { Link } from "react-router-dom";

const navItems = [
  { label: "Home" },
  { label: "For Employers" },
  { label: "For Candidates" },
  { label: "Contact us" }
];

export default function Header() {
  return (
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
                <Link
                  key={item.label}
                  to="/candidate-jobs"
                  className="flex items-center gap-1 transition hover:text-[#111827]"
                >
                  {content}
                </Link>
              );
            }

            if (item.label === "For Employers") {
              return (
                <Link
                  key={item.label}
                  to="/employers"
                  className="flex items-center gap-1 transition hover:text-[#111827]"
                >
                  {content}
                </Link>
              );
            }

            if (item.label === "Home") {
              return (
                <Link
                  key={item.label}
                  to="/"
                  className="flex items-center gap-1 transition hover:text-[#111827]"
                >
                  {content}
                </Link>
              );
            }

            if (item.label === "Contact us") {
              return (
                <Link
                  key={item.label}
                  to="/contact"
                  className="flex items-center gap-1 transition hover:text-[#111827]"
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                className="flex items-center gap-1 transition hover:text-[#111827]"
              >
                {content}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          className="rounded-full border border-[#d1c6bd] px-5 py-2 text-sm font-semibold text-[#111827] transition hover:border-[#111827]"
        >
          Log In
        </button>
      </div>
    </header>
  );
}
