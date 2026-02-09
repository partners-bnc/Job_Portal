export default function Footer() {
  return (
    <footer className="footer-section">
      <style>{`
        .footer-section {
          background:
            radial-gradient(
              circle at 8% 120%,
              rgba(86, 72, 134, 0.75) 0,
              rgba(86, 72, 134, 0.35) 45%,
              transparent 70%
            ),
            radial-gradient(circle at 94% 18%, rgba(93, 121, 82, 0.6) 0, rgba(93, 121, 82, 0.6) 12px, transparent 13px),
            radial-gradient(circle at 90% 82%, rgba(93, 121, 82, 0.45) 0, rgba(93, 121, 82, 0.45) 9px, transparent 10px),
            #1f1f1f;
          padding: 70px 24px 70px;
          font-family: "Inter", sans-serif;
          color: #e5e7eb;
          border-top-left-radius: 28px;
          border-top-right-radius: 28px;
          position: relative;
          overflow: hidden;
        }
        .footer-circle {
          position: absolute;
          border-radius: 999px;
          background: rgba(93, 121, 82, 0.55);
          pointer-events: none;
        }
        .footer-circle.small {
          width: 12px;
          height: 12px;
          right: 22px;
          top: 22px;
        }
        .footer-circle.medium {
          width: 26px;
          height: 26px;
          left: 18px;
          bottom: 24px;
          background: rgba(93, 121, 82, 0.45);
        }
        .footer-circle.large {
          width: 48px;
          height: 48px;
          left: 14px;
          top: 18px;
          background: rgba(93, 121, 82, 0.5);
        }
        .footer-card {
          max-width: 1320px;
          margin: 0 auto;
          background: transparent;
          border-radius: 0;
          padding: 0;
          display: grid;
          grid-template-columns: 1.2fr repeat(4, 1fr);
          gap: 26px;
          position: relative;
          overflow: hidden;
          z-index: 1;
        }
        .footer-card > *:not(.footer-brand) {
          transform: translateX(20px);
        }
        .footer-bottom {
          max-width: 1320px;
          margin: 32px auto 0;
        }
        .footer-cta-band {
          --footer-cta-side: 100px;
          --footer-left-pad: 40px;
          --footer-right-pad: 40px;
          background: transparent;
          border-radius: 0;
          padding: 0 var(--footer-cta-side, 0);
        }
        .footer-cta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 45px;
          justify-items: stretch;
        }
        .footer-cta-card.is-left {
          padding-left: var(--footer-left-pad, 0px);
          padding-right: var(--footer-left-pad, 0px);
        }
        .footer-cta-card.is-right {
          padding-left: var(--footer-right-pad, 0px);
          padding-right: var(--footer-right-pad, 0px);
        }
        .footer-cta-card {
          background: #F7F2ED;
          color: #111827;
          border-radius: 18px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          min-height: 140px;
          overflow: hidden;
          max-width: none;
          width: 100%;
        }
        .footer-cta-content h3 {
          margin: 0 0 8px;
          font-size: 20px;
          font-family: "Inter", sans-serif;
          font-weight: 400;
          white-space: nowrap;
          color: #111827;
        }
        .footer-cta-content p {
          margin: 0 0 12px;
          font-size: 13px;
          color: #111827;
          line-height: 1.5;
          font-family: "Inter", sans-serif;
          font-weight: 300;
          max-width: 260px;
        }
        .footer-cta-content {
          padding: 18px 16px;
          transform: translateX(-20px);
          background: #F7F2ED;
        }
        .footer-cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 10px 40px;
          border: none;
          background: #0B2F5B;
          color: #ffffff;
          font-family: "Inter", sans-serif;
          font-weight: 600;
          font-size: 12px;
          box-shadow: 0 12px 18px -12px rgba(11, 47, 91, 0.7);
          transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }
        .footer-cta-btn:hover {
          background: #093156;
          transform: translateY(-1px);
          box-shadow: 0 18px 26px -16px rgba(11, 47, 91, 0.75);
        }
        .footer-cta-media {
          width: 220px;
          height: 100%;
          margin: 0;
          border-radius: 0;
          overflow: hidden;
          flex: 0 0 auto;
          align-self: stretch;
          background: #F7F2ED;
        }
        .footer-cta-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          background: #F7F2ED;
          mix-blend-mode: multiply;
        }
        .footer-legal {
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          margin-top: 16px;
          padding-top: 12px;
          font-size: 13px;
          color: #cbd5f5;
          text-align: center;
          font-family: "Inter", sans-serif;
          font-weight: 400;
        }
        .footer-brand {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .footer-logo {
          display: inline-flex;
          align-items: center;
          gap: 0;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.02em;
          font-size: 16px;
        }
        .footer-logo img {
          height: 170px;
          width: auto;
          display: block;
          margin-left: -5px;
        }
        .footer-copy {
          font-size: 13px;
          color: #9ca3af;
        }
        .footer-title {
          font-size: 15px;
          color: #ffffff;
          font-weight: 600;
          margin: 0 0 10px;
        }
        .footer-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 6px;
          font-size: 15px;
          color: #cbd5f5;
        }
        .footer-list li {
          color: #d1d5db;
        }
        .footer-social {
          display: flex;
          gap: 14px;
          align-items: center;
        }
        .footer-social a {
          width: auto;
          height: auto;
          border-radius: 0;
          background: transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #f3f4f6;
          text-decoration: none;
          border: none;
        }
        .footer-social svg {
          width: 18px;
          height: 18px;
          fill: currentColor;
        }
        @media (max-width: 980px) {
          .footer-card {
            grid-template-columns: 1fr 1fr;
            gap: 22px;
          }
        }
        @media (max-width: 640px) {
          .footer-card {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <span className="footer-circle small" aria-hidden="true" />
      <span className="footer-circle medium" aria-hidden="true" />
      <span className="footer-circle large" aria-hidden="true" />
      <div className="footer-card">
        <div className="footer-brand">
          <div className="footer-logo">
            <img src="/footer%20logo.png" alt="TalentBridge" />
          </div>
                    <div className="footer-copy">© 2026 TalentBridge | All Rights Reserved</div>

        </div>
        <div>
          <h4 className="footer-title">Learn More</h4>
          <ul className="footer-list">
            <li>About Us</li>
            <li>How It Works</li>
            <li>Client Results</li>
            <li>Press & Mentions</li>
            <li>Contact Us</li>
            <li>Privacy Policy</li>
          </ul>
        </div>

        <div>
          <h4 className="footer-title">For Employers</h4>
          <ul className="footer-list">
            <li>Start Hiring</li>
            <li>Pricing & Plans</li>
            <li>Career Resources</li>
            <li>Success Stories</li>
            <li>FAQs</li>
          </ul>
        </div>

        <div>
          <h4 className="footer-title">For Candidates</h4>
          <ul className="footer-list">
            <li>Find a Role</li>
            <li>Join Our Talent Pool</li>
            <li>Tips & Advice</li>
          </ul>
        </div>

        <div>
          <h4 className="footer-title">Social</h4>
          <div className="footer-social">
            <a href="#" aria-label="Facebook">
              <svg viewBox="0 0 24 24">
                <path d="M13 9h3V6h-3c-2.2 0-4 1.8-4 4v2H6v3h3v6h3v-6h3l1-3h-4v-2c0-.6.4-1 1-1z" />
              </svg>
            </a>
            <a href="#" aria-label="Twitter">
              <svg viewBox="0 0 24 24">
                <path d="M19 7.1c.8-.5 1.4-1.2 1.8-2-.7.4-1.5.6-2.3.7-.7-.7-1.7-1.1-2.8-1.1-2.1 0-3.8 1.7-3.8 3.8 0 .3 0 .6.1.9-3.1-.2-5.9-1.7-7.7-4-.3.5-.5 1.1-.5 1.8 0 1.3.7 2.5 1.8 3.1-.6 0-1.2-.2-1.7-.5v.1c0 1.8 1.3 3.3 3 3.7-.3.1-.7.1-1 .1-.2 0-.5 0-.7-.1.5 1.5 1.9 2.6 3.6 2.7-1.3 1-3 1.6-4.8 1.6h-1c1.7 1.1 3.7 1.7 5.9 1.7 7.1 0 11-5.9 11-11v-.5c.8-.6 1.4-1.2 1.9-2z" />
              </svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg viewBox="0 0 24 24">
                <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm-5 3.5A4.5 4.5 0 1 1 7.5 13 4.5 4.5 0 0 1 12 8.5zm0 2A2.5 2.5 0 1 0 14.5 13 2.5 2.5 0 0 0 12 10.5zm5-3.8a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" />
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24">
                <path d="M6.5 9.5H3.8V20h2.7V9.5zM5.1 4a1.6 1.6 0 1 0 0 3.2A1.6 1.6 0 0 0 5.1 4zM20 13.4c0-2.2-1.2-3.7-3.4-3.7-1.6 0-2.5.9-2.9 1.6h-.1V9.5h-2.6V20h2.7v-5.3c0-1.4.3-2.8 2-2.8s1.7 1.6 1.7 2.9V20H20v-6.6z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-cta-band">
          <div className="footer-cta-grid">
            <div className="footer-cta-card is-left">
              <div className="footer-cta-content">
                <h3>Subscribe to our newsletter</h3>
                <p>Receive updates and insights from TalentBridge straight to your inbox.</p>
                <button type="button" className="footer-cta-btn">Subscribe</button>
              </div>
              <div className="footer-cta-media">
                <img
                  src="https://t3.ftcdn.net/jpg/06/18/47/90/240_F_618479060_vL4D1czGM00iU3ms3vYaU8k1o2plCfvn.jpg"
                  alt="Newsletter subscriber"
                />
              </div>
            </div>
            <div className="footer-cta-card is-right">
              <div className="footer-cta-content">
                <h3>Get job alerts</h3>
                <p>Be the first to receive the hottest job opportunities from TalentBridge.</p>
                <button type="button" className="footer-cta-btn">Get notified</button>
              </div>
              <div className="footer-cta-media">
                <img
                  src="https://t3.ftcdn.net/jpg/15/85/42/90/240_F_1585429076_xzmXGOg1G6L8Ubdwj8xc8r1WPslDtxRM.jpg"
                  alt="Job alerts"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="footer-legal">
          2026 TalentBridge. All Rights Reserved. | Terms of Service | Privacy Policy | Accessibility Statement | AI Risk Mitigation Policy
        </div>
      </div>
    </footer>
  );
}
