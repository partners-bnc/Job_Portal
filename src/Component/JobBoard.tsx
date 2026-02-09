const jobsLeft = [
  { title: "Business Analyst", exp: "4 yrs experience", location: "Chicago" },
  { title: "Internal Audit", exp: "3 yrs experience", location: "Dubai" },
  { title: "Accountant", exp: "2 yrs experience", location: "Riyadh" },
  { title: "Finance Advisory", exp: "6 yrs experience", location: "Paris" },
  { title: "Trainer", exp: "5 yrs experience", location: "London" },
  { title: "Talent Acquisition", exp: "4 yrs experience", location: "Toronto" },
];

const jobsRight = [
  { title: "Business Executive", exp: "3 yrs experience", location: "Singapore" },
  { title: "AI Automation Specialist", exp: "5 yrs experience", location: "Remote / Milan" },
  { title: "Developers", exp: "2 yrs experience", location: "Austin" },
  { title: "Business Setup", exp: "4 yrs experience", location: "Lisbon" },
  { title: "Product Support", exp: "3 yrs experience", location: "Berlin" },
  { title: "Event Operations", exp: "4 yrs experience", location: "Prague" },
];

function JobCard({ title, exp, location }: { title: string; exp: string; location: string }) {
  return (
    <article className="job-card">
      <h4>{title}</h4>
      <div className="job-meta">
        <span>
          <span className="job-icon" aria-hidden="true">⏱</span>
          {exp}
        </span>
        <span>
          <span className="job-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="job-icon-svg">
              <path
                d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <circle cx="12" cy="9" r="2.6" fill="currentColor" />
            </svg>
          </span>
          {location}
        </span>
      </div>
    </article>
  );
}

export default function JobBoard() {
  const jobLeftLoop = [...jobsLeft, ...jobsLeft];
  const jobRightLoop = [...jobsRight, ...jobsRight];

  return (
    <section className="jobboard-section">
      <style>{`
        .jobboard-section {
          background: #f7f2ed;
          padding: 24px 0 60px;
          font-family: "Inter", sans-serif;
        }
        .jobboard-card {
          width: calc(100% - 2px);
          margin: 0 0 0 auto;
          background: #ffffff;
          border-radius: 26px;
          padding: 0 28px;
          display: grid;
          grid-template-columns: 1.2fr 1.5fr;
          gap: 32px;
          height: 340px;
          overflow: hidden;
        }
        .jobboard-left h2 {
          margin: 0 0 18px;
          font-size: 42px;
          font-weight: 600;
          color: #111827;
        }
        .jobboard-left {
          padding: 18px 0 18px 72px;
        }
        .jobboard-left p {
          margin: 0 0 18px;
          color: #6b7280;
          font-size: 20px;
          line-height: 1.75;
          max-width: 560px;
        }
        .jobboard-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 14px 26px;
          border: none;
          background: #0B2F5B;
          color: #ffffff;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }
        .jobboard-right {
          background: transparent;
          border-radius: 0;
          padding: 0 0 0 200px;
          overflow: hidden;
          align-self: stretch;
          display: flex;
        }
        .jobboard-scroll {
          height: 100%;
          min-height: 0;
          overflow: hidden;
          display: grid;
          grid-template-columns: repeat(2, minmax(260px, 1fr));
          gap: 18px;
          align-items: start;
          padding: 0;
        }
        .jobboard-column {
          display: grid;
          gap: 12px;
          padding: 0;
          margin: 0;
          animation: jobScroll 14s linear infinite;
        }
        .jobboard-column.delay {
          animation: jobScrollReverse 14s linear infinite;
        }
        @keyframes jobScroll {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
        @keyframes jobScrollReverse {
          0% {
            transform: translateY(-50%);
          }
          100% {
            transform: translateY(0);
          }
        }
        .job-card {
          background: #ffffff;
          border: 1px solid #efe7e0;
          border-radius: 18px;
          padding: 18px 22px;
          box-shadow: none;
        }
        .job-card h4 {
          margin: 0 0 8px;
          font-family: "Inter", sans-serif;
          font-weight: 600;
          font-size: 16px;
          line-height: 1.4;
          color: #1f2937;
        }
        .job-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 11px;
          color: #6b7280;
        }
        .job-icon {
          margin-right: 6px;
          font-size: 12px;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #7c8aa0;
        }
        .job-icon-svg {
          width: 12px;
          height: 12px;
        }
        @media (max-width: 900px) {
          .jobboard-card {
            grid-template-columns: 1fr;
          }
          .jobboard-left p {
            max-width: none;
          }
          .jobboard-scroll {
            grid-template-columns: 1fr;
          }
          .jobboard-column,
          .jobboard-column.delay {
            animation: none;
          }
        }
      `}</style>
      <div className="jobboard-card">
        <div className="jobboard-left">
          <h2>Job Board</h2>
          <p>
            Explore handpicked candidate profiles for high-impact roles - all
            pre-vetted, ready to interview, and aligned with your needs.
          </p>
          <a href="/candidate-jobs" className="jobboard-btn">
            Browse Open Roles
          </a>
        </div>
        <div className="jobboard-right">
          <div className="jobboard-scroll">
            <div className="jobboard-column">
              {jobLeftLoop.map((job, index) => (
                <JobCard key={`${job.title}-${index}`} {...job} />
              ))}
            </div>
            <div className="jobboard-column delay">
              {jobRightLoop.map((job, index) => (
                <JobCard key={`${job.title}-${index}`} {...job} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
