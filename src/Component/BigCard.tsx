import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

const testimonials = [
  {
    id: 1,
    quote:
      "We've hired faster and smarter since switching to TalentBridge -- it's like having a recruiter built into our hiring process.",
    name: "Maya Lin",
    role: "VP of People",
    company: "SeedFlow",
    image:
      "https://t3.ftcdn.net/jpg/16/10/03/78/240_F_1610037814_il4IQ1xmnf8jk7yLBtYI95u4bfsjgNp5.jpg",
  },
  {
    id: 2,
    quote:
      "The shortlist was so strong that we made two offers in the same week. The process felt effortless.",
    name: "Ravi Desai",
    role: "Head of Talent",
    company: "ClearLake",
    image:
      "https://t3.ftcdn.net/jpg/05/95/01/12/240_F_595011253_eKBTTflO6sC18iz0CV1mRRUtdKKxC0re.jpg",
  },
  {
    id: 3,
    quote:
      "Every candidate was aligned with our values and role needs. We filled a critical hire in days.",
    name: "Sophia Park",
    role: "People Ops Lead",
    company: "Northwell",
    image:
      "https://t3.ftcdn.net/jpg/16/55/13/76/240_F_1655137673_ZlFnVNiMY2PClo7WOoI98G6sKq4qUIo8.jpg",
  },
  {
    id: 4,
    quote:
      "TalentBridge saved our team hours each week. The candidates were prepared and excited to join.",
    name: "Daniel Wu",
    role: "Recruiting Manager",
    company: "PulseGrid",
    image:
      "https://as1.ftcdn.net/v2/jpg/16/11/31/76/1000_F_1611317619_homWT5r4vLupEEfMNSktrWnvKZpZWVOi.webp",
  },
  {
    id: 5,
    quote:
      "We scaled a whole department without the usual hiring chaos. The experience was smooth end-to-end.",
    name: "Isabella Moore",
    role: "Chief People Officer",
    company: "Lumenly",
    image:
      "https://t4.ftcdn.net/jpg/15/83/17/79/240_F_1583177976_8Ozi9GYgcyZi5q0ujGBM7BjyEUjmOqyg.jpg",
  },
];

const bigCardVars: CSSProperties = {
  "--bigcard-max-width": "1180px",
  "--bigcard-section-bg": "#f7f2ed",
  "--bigcard-card-bg": "#ffffff",
  "--bigcard-border-color": "#d7ccf6",
  "--bigcard-border-width": "2px",
  "--bigcard-border-right-width": "6px",
  "--bigcard-border-bottom-width": "6px",
  "--bigcard-radius": "22px",
  "--bigcard-padding": "24px 34px",
  "--bigcard-gap": "26px",
  "--bigcard-min-height": "350px",
  "--bigcard-photo-col": "30%",
  "--bigcard-image-size": "170px",
  "--bigcard-photo-radius": "18px",
  "--bigcard-quote-size": "22px",
  "--bigcard-meta-size": "14px",
  "--bigcard-quote-max-width": "520px",
  "--bigcard-arrow-size": "30px",
  "--bigcard-shadow": "0 22px 45px -35px rgba(76, 29, 149, 0.4)",
  "--bigcard-photo-col-sm": "40%",
  "--bigcard-image-size-sm": "140px",
  "--bigcard-padding-sm": "20px 24px",
  "--bigcard-quote-size-sm": "19px",
} as CSSProperties;

export default function BigCard() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const hasAnimatedRef = useRef(false);
  const total = testimonials.length;

  const active = useMemo(() => testimonials[activeIndex], [activeIndex]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

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
      { threshold: 0.55 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="bigcard-section" style={bigCardVars} ref={sectionRef}>
      <style>{`
        .bigcard-section {
          background: var(--bigcard-section-bg, #f7f2ed);
          padding: 16px 24px 90px;
          font-family: "Inter", sans-serif;
        }
        .bigcard-shell {
          max-width: var(--bigcard-max-width, 1180px);
          margin: 0 auto;
        }
        .bigcard-card {
          display: grid;
          grid-template-columns: var(--bigcard-photo-col, 180px) 1fr;
          gap: var(--bigcard-gap, 26px);
          align-items: stretch;
          min-height: var(--bigcard-min-height, 190px);
          background: var(--bigcard-card-bg, #ffffff);
          border-style: solid;
          border-color: var(--bigcard-border-color, #d7ccf6);
          border-top-width: var(--bigcard-border-width, 2px);
          border-left-width: var(--bigcard-border-width, 2px);
          border-right-width: var(--bigcard-border-right-width, 4px);
          border-bottom-width: var(--bigcard-border-bottom-width, 4px);
          border-radius: var(--bigcard-radius, 22px);
          box-shadow: var(--bigcard-shadow, 0 22px 45px -35px rgba(76, 29, 149, 0.4));
          overflow: hidden;
        }
        .bigcard-photo {
          width: 100%;
          height: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bigcard-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .bigcard-photo,
        .bigcard-content {
          opacity: 0;
          transform: translateY(22px);
        }
        .bigcard-visible .bigcard-photo {
          animation: bigcardRise 0.9s ease forwards;
        }
        .bigcard-visible .bigcard-content {
          animation: bigcardRise 0.9s ease forwards;
          animation-delay: 0.3s;
        }
        @keyframes bigcardRise {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .bigcard-content {
          padding: var(--bigcard-padding, 24px 34px);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .bigcard-animate {
          animation: bigcardFade 0.4s ease;
        }
        .bigcard-quote {
          margin: 0 0 12px;
          font-size: var(--bigcard-quote-size, 18px);
          line-height: 1.55;
          color: #1f2937;
          font-weight: 500;
          max-width: var(--bigcard-quote-max-width, 520px);
        }
        .bigcard-meta {
          margin: 0 0 16px;
          font-size: var(--bigcard-meta-size, 13px);
          color: #6b7280;
        }
        .bigcard-meta span {
          color: #1f2937;
          font-weight: 600;
        }
        .bigcard-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 30px;
        }
        .bigcard-arrow {
          width: var(--bigcard-arrow-size, 30px);
          height: var(--bigcard-arrow-size, 30px);
          border-radius: 999px;
          border: 1px solid var(--bigcard-border-color, #d7ccf6);
          background: var(--bigcard-card-bg, #ffffff);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
        }
        .bigcard-arrow:hover {
          border-color: #b8a4f2;
          box-shadow: 0 8px 16px -12px rgba(76, 29, 149, 0.4);
          transform: translateY(-1px);
        }
        .bigcard-arrow svg {
          width: 14px;
          height: 14px;
          stroke: #4b5563;
          stroke-width: 2.4px;
          fill: none;
        }
        .bigcard-count {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
        }
        @keyframes bigcardFade {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 900px) {
          .bigcard-card {
            grid-template-columns: var(--bigcard-photo-col-sm, 140px) 1fr;
          }
          .bigcard-content {
            padding: var(--bigcard-padding-sm, 20px 24px);
          }
          .bigcard-quote {
            font-size: var(--bigcard-quote-size-sm, 16px);
          }
        }
        @media (max-width: 640px) {
          .bigcard-card {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .bigcard-photo {
            min-height: 220px;
          }
          .bigcard-controls {
            justify-content: center;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .bigcard-photo,
          .bigcard-content {
            opacity: 1;
            transform: none;
            animation: none;
          }
        }
      `}</style>
      <div className="bigcard-shell">
        <div className={`bigcard-card ${isVisible ? "bigcard-visible" : ""}`}>
          <div className="bigcard-photo">
            <img src={active.image} alt={active.name} />
          </div>
          <div className="bigcard-content bigcard-animate" key={active.id}>
            <p className="bigcard-quote">{active.quote}</p>
            <p className="bigcard-meta">
              <span>{active.name}</span>, {active.role}, {active.company}
            </p>
            <div className="bigcard-controls">
              <button
                type="button"
                className="bigcard-arrow"
                onClick={handlePrev}
                aria-label="Previous testimonial"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M14.5 6.5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="bigcard-count">
                {activeIndex + 1}/{total}
              </span>
              <button
                type="button"
                className="bigcard-arrow"
                onClick={handleNext}
                aria-label="Next testimonial"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M9.5 6.5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
