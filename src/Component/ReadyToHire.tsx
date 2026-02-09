export default function ReadyToHire() {
  return (
    <section className="cta-section">
      <style>{`
        .cta-section {
          --cta-max-width: 1340px;
          --cta-surface-bg: #ffffff;
          --cta-border-color: #a6c59a;
          --cta-border-width: 2px;
          --cta-radius: 40px;
          --cta-padding: 55px 40px 60px;
          --cta-head-size: 55px;
          --cta-copy-size: 20px;
          --cta-btn-size: 16px;
          --cta-btn-padding: 12px 26px;
          --cta-dot-1: rgba(200, 194, 216, 0.45);
          --cta-dot-2: rgba(196, 214, 188, 0.45);
          --cta-dot-3: rgba(200, 194, 216, 0.35);
          --cta-dot-size-1: 130px;
          --cta-dot-size-2: 130px;
          --cta-dot-size-3: 130px;
          --cta-dot-x-1: 8%;
          --cta-dot-y-1: 22%;
          --cta-dot-x-2: 92%;
          --cta-dot-y-2: 66%;
          --cta-dot-x-3: 36%;
          --cta-dot-y-3: 82%;
          --cta-dot-4: rgba(196, 214, 188, 0.45);
          --cta-dot-size-4: 95px;
          --cta-dot-x-4: 70%;
          --cta-dot-y-4: 18%;
          background:
            radial-gradient(
              circle at var(--cta-dot-x-1, 8%) var(--cta-dot-y-1, 22%),
              var(--cta-dot-1) 0,
              transparent var(--cta-dot-size-1, 110px)
            ),
            radial-gradient(
              circle at var(--cta-dot-x-2, 92%) var(--cta-dot-y-2, 66%),
              var(--cta-dot-2) 0,
              transparent var(--cta-dot-size-2, 90px)
            ),
            radial-gradient(
              circle at var(--cta-dot-x-3, 36%) var(--cta-dot-y-3, 82%),
              var(--cta-dot-3) 0,
              transparent var(--cta-dot-size-3, 75px)
            ),
            radial-gradient(
              circle at var(--cta-dot-x-4, 70%) var(--cta-dot-y-4, 18%),
              var(--cta-dot-4) 0,
              transparent var(--cta-dot-size-4, 95px)
            ),
            #f7f2ed;
          padding: 44px 24px 100px;
          font-family: "Inter", sans-serif;
        }
        .cta-shell {
          max-width: var(--cta-max-width, 1340px);
          margin: 0 auto;
          position: relative;
          padding: 5px 18px;
        }
        .cta-surface {
          position: relative;
          background: var(--cta-surface-bg, #ffffff);
          border: var(--cta-border-width, 2px) solid var(--cta-border-color, #a6c59a);
          border-radius: var(--cta-radius, 32px);
          padding: var(--cta-padding, 56px 36px 58px);
          text-align: center;
          overflow: hidden;
          box-shadow: 0 22px 40px -34px rgba(31, 41, 55, 0.4);
        }
        .cta-surface::before,
        .cta-surface::after {
          content: "";
          position: absolute;
          border-radius: 999px;
          background: rgba(186, 196, 220, 0.35);
          filter: blur(0.5px);
        }
        .cta-surface::before {
          width: 180px;
          height: 180px;
          left: -60px;
          top: -40px;
          background: rgba(200, 194, 216, 0.45);
        }
        .cta-surface::after {
          width: 120px;
          height: 120px;
          right: -40px;
          top: 46px;
          background: rgba(196, 214, 188, 0.45);
        }
        .cta-star {
          position: absolute;
          width: 6px;
          height: 6px;
          background: #9ca3af;
          clip-path: polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%);
          opacity: 0.5;
        }
        .cta-star.s1 { left: 18%; top: 18%; transform: scale(0.8); }
        .cta-star.s2 { left: 42%; bottom: 18%; transform: scale(0.7); }
        .cta-star.s3 { right: 20%; bottom: 22%; transform: scale(0.9); }
        .cta-star.s4 { right: 38%; top: 20%; transform: scale(0.6); }
        .cta-headline {
          margin: 0 0 10px;
          font-size: var(--cta-head-size, 40px);
          font-weight: 600;
          color: #111827;
        }
        .cta-copy {
          margin: 0 0 18px;
          font-size: var(--cta-copy-size, 17px);
          color: #6b7280;
        }
        .cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: var(--cta-btn-padding, 12px 26px);
          border: none;
          background: #0B2F5B;
          color: #ffffff;
          font-weight: 600;
          font-size: var(--cta-btn-size, 14px);
          cursor: pointer;
          box-shadow: 0 12px 20px -14px rgba(17, 24, 39, 0.65);
        }
        @media (max-width: 900px) {
          .cta-headline {
            font-size: 30px;
          }
        }
      `}</style>
      <div className="cta-shell">
        <div className="cta-surface">
          <span className="cta-star s1" aria-hidden="true" />
          <span className="cta-star s2" aria-hidden="true" />
          <span className="cta-star s3" aria-hidden="true" />
          <span className="cta-star s4" aria-hidden="true" />
          <h2 className="cta-headline">Ready to make hiring simple?</h2>
          <p className="cta-copy">
            We vet, match, and send you great candidates. No noise — Just results.
          </p>
          <button type="button" className="cta-btn">
            Find My Next Hire
          </button>
        </div>
      </div>
    </section>
  );
}
