import { useEffect, useRef, useState } from "react";

const stats = [
  {
    value: 7,
    suffix: " days",
    label: "Average time to fill\nin a role",
  },
  {
    value: 69,
    suffix: "%",
    label: "Of clients return to\nhire again",
  },
  {
    value: 500,
    suffix: "+",
    label: "Companies found\nperfect hires",
  },
];

const highlights = [
  {
    title: "Transparent Hiring Process",
    desc: "Real-time updates, honest feedback, clear communication at every step.",
  },
  {
    title: "Future-Ready Talent Pool",
    desc: "Vetted professionals with the skills and mindset to grow with you.",
  },
  {
    title: "Human-Centered Matching",
    desc: "We connect people to teams based on values, not just job titles.",
  },
  {
    title: "Speed Without Sacrifices",
    desc: "Hire fast without cutting corners. We vet, so you don’t have to.",
  },
];

const statCardStyle = {
  "--stat-card-width": "260px",
  "--stat-card-height": "10px",
  "--stat-card-padding": "30px 25px",
};

export default function WhyChooseUs() {
  const [counts, setCounts] = useState(stats.map(() => 0));
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
          const duration = 1400;
          const start = performance.now();

          const animate = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCounts(stats.map((item) => Math.round(item.value * eased)));
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="why-section" ref={sectionRef}>
      <style>{`
        .why-section {
          background: #f7f2ed;
          padding: 24px 24px 72px;
          font-family: "Inter", sans-serif;
        }
        .why-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          justify-content: center;
          max-width: 1180px;
          margin: 0 auto 80px;
        }
        .why-stat-card {
          background: radial-gradient(circle at top left, #f5f3ff 0%, #f7f3ed 58%, #ffffff 100%);
          border: 2px solid #e9d5ff;
          border-radius: 24px;
          padding: var(--stat-card-padding, 24px 20px);
          width: var(--stat-card-width, 240px);
          min-height: var(--stat-card-height, 140px);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 18px 30px -25px rgba(15, 23, 42, 0.25);
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(0);
          transition: transform 0.8s ease, opacity 0.8s ease;
        }
        .why-anim-left {
          transform: translateX(-120%);
        }
        .why-anim-up {
          transform: translateY(70px);
        }
        .why-anim-right {
          transform: translateX(120%);
        }
        .why-stats.why-visible .why-stat-card {
          opacity: 1;
          transform: translate(0, 0);
        }
        @media (prefers-reduced-motion: reduce) {
          .why-stat-card,
          .why-anim-left,
          .why-anim-up,
          .why-anim-right {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
        .why-stat-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 18% 18%, rgba(233, 213, 255, 0.6), transparent 45%),
            radial-gradient(circle at 80% 25%, rgba(243, 232, 255, 0.5), transparent 42%),
            radial-gradient(circle at 30% 85%, rgba(233, 213, 255, 0.45), transparent 40%);
          opacity: 0.7;
          z-index: 0;
        }
        .why-stat-card > * {
          position: relative;
          z-index: 2;
        }
        .why-stat-card h3 {
          margin: 0;
          font-size: 29px;
          color: #111827;
          font-weight: 700;
        }
        .why-stat-card p {
          margin: 0;
          font-size: 16px;
          color: #6b7280;
          line-height: 1.4;
          font-weight: 400;
        }
        .bubble {
          position: absolute;
          bottom: -20px;
          background: radial-gradient(circle at 30% 30%, rgba(192, 132, 252, 0.7) 0%, rgba(233, 213, 255, 0.6) 60%, transparent 75%);
          border-radius: 50%;
          opacity: 0.7;
          filter: blur(0.2px);
          animation: bubbleUp 6.5s linear infinite;
          pointer-events: none;
          z-index: 1;
        }
        .bubble.b1 {
          width: 24px;
          height: 24px;
          left: 14%;
          animation-duration: 6.2s;
        }
        .bubble.b2 {
          width: 14px;
          height: 14px;
          left: 46%;
          animation-duration: 7.4s;
          animation-delay: 0.8s;
        }
        .bubble.b3 {
          width: 18px;
          height: 18px;
          left: 74%;
          animation-duration: 6.8s;
          animation-delay: 1.6s;
        }
        @keyframes bubbleUp {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          20% {
            opacity: 0.65;
          }
          100% {
            transform: translateY(-160%);
            opacity: 0;
          }
        }
        .why-panel {
          max-width: none;
          width: calc(100% + 24px);
          margin: 0 -12px;
          background: #ffffff;
          border-radius: 28px;
          padding: 60px 32px 50px 112px;
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          align-items: center;
          position: relative;
          overflow: hidden;
          min-height: 400px;
        }
        .why-copy h2 {
          margin: -6px 0 18px 34px;
          font-size: 42px;
          color: #111827;
          font-weight: 600;
        }
        .why-grid {
          display: grid;
          gap: 16px 22px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin-left: 60px;
        }
        .why-item {
          display: flex;
          gap: 12px;
        }
        .why-plus {
          display: inline-flex;
          width: 22px;
          height: 22px;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #e9e3ff;
          color: #5b4af7;
          font-weight: 700;
          font-size: 14px;
          flex: 0 0 auto;
          margin-top: 4px;
        }
        .why-item h4 {
          margin: 0 0 8px;
          font-size: 18px;
          color: #111827;
          font-weight: 600;
          line-height: 1.3;
        }
        .why-item p {
          margin: 0;
          font-size: 15px;
          color: #6b7280;
          line-height: 1.6;
          font-weight: 400;
        }
        .why-image {
          display: flex;
          justify-content: center;
          position: relative;
          align-items: flex-end;
          min-height: 280px;
          padding-bottom: 0;
        }
        .why-image img {
          width: auto;
          height: 350px;
          border-radius: 0;
          object-fit: contain;
          position: absolute;
          right: -32px;
          bottom: -100px;
          z-index: 2;
          display: block;
        }
        .why-image-blob {
          position: absolute;
          right: -120px;
          top: -85px;
          width: 400px;
          height: 350px;
          border-radius:50%;
          background: radial-gradient(circle at 30% 30%, #e7e0ff 0%, #f4efff 55%, transparent 72%);
          z-index: 1;
        }
      `}</style>
      <div className={`why-stats ${isVisible ? "why-visible" : ""}`}>
        {stats.map((item, index) => (
          <div
            key={item.value}
            className={`why-stat-card ${
              index === 0 ? "why-anim-left" : index === 1 ? "why-anim-up" : "why-anim-right"
            }`}
            style={statCardStyle}
          >
            <span className="bubble b1" />
            <span className="bubble b2" />
            <span className="bubble b3" />
            <h3>
              {counts[index]}
              {item.suffix}
            </h3>
            <p>
              {item.label.split("\n").map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>

      <div className="why-panel">
        <div className="why-copy">
          <h2>Why Choose Us?</h2>
          <div className="why-grid">
            {highlights.map((item) => (
              <div key={item.title} className="why-item">
                <span className="why-plus">+</span>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="why-image">
          <div className="why-image-blob" />
          <img src="/public/Gemini_Generated_Image_ov92zbov92zbov92-removebg-preview.png" alt="BnC Global" />
        </div>
      </div>
    </section>
  );
}
