import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: 1,
    title: "Tell us what you need",
    desc: "Share your role, goals, what makes a great hire for you.",
  },
  {
    number: 2,
    title: "We shortlist top matches",
    desc: "Every candidate is pre-vetted - no spam, no scrolling.",
  },
  {
    number: 3,
    title: "You connect & hire fast",
    desc: "Skip the job boards. Interview, decide, done.",
  },
];

export default function TalentBridgeWorks() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="tbw-section" ref={sectionRef}>
      <style>{`
        .tbw-section {
          background: #f7f2ed;
          padding: 12px 24px 72px;
          font-family: "Inter", sans-serif;
        }
        .tbw-shell {
          max-width: 1180px;
          margin: 0 auto;
        }
        .tbw-head,
        .tbw-cards {
          max-width: 1120px;
        }
        .tbw-head h2 {
          margin: 0 0 10px;
          font-size: 42px;
          font-weight: 600;
          color: #111827;
        }
        .tbw-head p {
          margin: 0 0 30px;
          max-width: 620px;
          color: #6b7280;
          font-size: 15px;
          line-height: 1.6;
        }
        .tbw-cards {
          position: relative;
          display: flex;
          gap: 110px;
          align-items: stretch;
          justify-content: flex-start;
        }
        .tbw-wave {
          position: absolute;
          left: 50%;
          width: 100vw;
          top: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 0;
          opacity: 0.7;
        }
        .tbw-wave svg {
          width: 100%;
          height: 90px;
          display: block;
        }
        .tbw-card {
          position: relative;
          z-index: 1;
          flex: 0 1 340px;
          width: 100%;
          max-width: 360px;
          min-width: 260px;
          background: #ffffff;
          border: 1px solid #e4dbd2;
          border-radius: 18px;
          padding: 22px 22px 24px;
          box-shadow: 0 18px 30px -28px rgba(15, 23, 42, 0.35);
          opacity: 0;
          transform: translateX(60px) translateY(8px);
          transform-origin: right center;
        }
        .tbw-card h3 {
          margin: 14px 0 6px;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }
        .tbw-card p {
          margin: 0;
          color: #6b7280;
          font-size: 13px;
          line-height: 1.45;
        }
        .tbw-badge {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: #111827;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 6px 12px -8px rgba(15, 23, 42, 0.8);
        }
        .tbw-visible .tbw-card {
          animation: tbwCurveIn 1.15s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
          animation-delay: var(--delay, 0s);
        }
        @keyframes tbwCurveIn {
          0% {
            opacity: 0;
            transform: translateX(220px) translateY(24px) rotate(1deg);
          }
          55% {
            opacity: 1;
            transform: translateX(70px) translateY(-12px) rotate(-0.6deg);
          }
          75% {
            transform: translateX(18px) translateY(6px) rotate(0.2deg);
          }
          100% {
            opacity: 1;
            transform: translateX(0) translateY(0) rotate(0deg);
          }
        }
        @media (max-width: 900px) {
          .tbw-cards {
            flex-direction: column;
            gap: 14px;
          }
          .tbw-wave {
            display: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .tbw-card {
            opacity: 1;
            transform: none;
          }
          .tbw-visible .tbw-card {
            animation: none;
          }
        }
      `}</style>
      <div className="tbw-shell">
        <div className="tbw-head">
          <h2>How TalentBridge Works</h2>
          <p>
            From curated intros to faster hiring - here&apos;s how we match standout
            talent with forward-thinking companies.
          </p>
        </div>
        <div className={`tbw-cards ${isVisible ? "tbw-visible" : ""}`}>
          <div className="tbw-wave" aria-hidden="true">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path
                d="M0 60 C 110 5, 230 115, 360 60 S 590 5, 740 60 S 940 115, 1200 60"
                fill="none"
                stroke="#d8cfc7"
                strokeWidth="3"
                strokeDasharray="5 10"
                strokeLinecap="round"
              />
            </svg>
          </div>
          {steps.map((step, index) => (
            <article
              key={step.number}
              className="tbw-card"
              style={{ "--delay": `${index * 0.7}s` } as React.CSSProperties}
            >
              <div className="tbw-badge">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
