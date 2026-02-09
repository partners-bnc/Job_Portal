import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const roles = [
  "HR Technology",
  "Mergers and Acquisitions",
  "Audit",
  "Compliances",
  "Talent acquisition.",
  "Business Analyst.",
  "Business development Execution",
];

export default function SpecializationRole() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = roles[roleIndex];
    const speed = isDeleting ? 70 : 120;
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        const nextText = current.slice(0, text.length + 1);
        setText(nextText);
        if (nextText === current) {
          setIsDeleting(true);
        }
      } else {
        const nextText = current.slice(0, text.length - 1);
        setText(nextText);
        if (nextText.length === 0) {
          setIsDeleting(false);
          setRoleIndex((prev) => (prev + 1) % roles.length);
        }
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [isDeleting, roleIndex, text]);

  return (
    <section className="specialization-section">
      <div className="specialization-card">
        <p className="specialization-kicker">We Specialise In</p>
        <h2 className="specialization-title">
          <span className="typewriter-text">{text}</span>
          <span className="typewriter-caret" aria-hidden="true">
            |
          </span>
        </h2>
        <p className="specialization-subtitle">Profile hiring.</p>
        <div className="specialization-actions">
          <button className="specialization-button light" type="button">
            Refer a Client
          </button>
          <Link to="/employers" className="specialization-button solid" style={{ textDecoration: 'none' }}>
            Hire From Us
          </Link>
        </div>
      </div>
    </section>
  );
}
