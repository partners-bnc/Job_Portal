import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../Component/Header.jsx";
import Footer from "../Component/Footer.tsx";
import JobApplicationForm from "../Component/JobApplicationForm.jsx";
import { jobService } from "../services/jobService.js";

const styles = {
  page: { 
    minHeight: "100vh", 
    backgroundColor: '#F7F1EC',
    paddingTop: "96px",
    fontFamily: "Inter, sans-serif"
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 24px"
  },
  header: {
    padding: "24px 0 32px"
  },
  heroCard: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "40px 0",
    minHeight: "250px",
    boxShadow: "0 10px 28px rgba(0, 0, 0, 0.08)",
    width: "100vw",
    marginLeft: "calc(50% - 50vw)",
    position: "relative",
    overflow: "hidden"
  },
  heroInner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 24px",
    position: "relative",
    zIndex: 2
  },
  heroContent: {
    padding: "0 24px"
  },
  heroTopRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "24px",
    flexWrap: "wrap"
  },
  heroLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    minWidth: "240px",
    flex: "1",
    justifyContent: "flex-start"
  },
  heroText: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    alignItems: "flex-start",
    textAlign: "left",
    width: "100%"
  },
  heroMetaRow: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "6px",
    justifyContent: "flex-start",
    flexWrap: "wrap"
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "999px",
    background: "#f2f4f7",
    fontSize: "20px",
    cursor: "pointer",
    color: "#333333",
    textDecoration: "none",
    flexShrink: 0,
    marginLeft: "-16px",
    marginTop: "4px"
  },
  title: {
    fontSize: "34px",
    fontWeight: 600,
    color: "#333333",
    margin: "0",
    width: "100%",
    textAlign: "left"
  },
  location: {
    fontSize: "16px",
    color: "#475467",
    margin: "0",
    opacity: 0.8
  },
  jobIdText: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#333333",
    margin: "8px 0 0 0"
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-start",
    flexWrap: "wrap"
  },
  content: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "24px",
    marginBottom: "40px"
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "0"
  },
  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  card: {
    border: "1px solid #000000",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "0",
    minHeight: "550px"
  },
  rightCard: {
    border: "1px solid #000000",
    borderRadius: "12px",
    padding: "20px"
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#333333",
    margin: "0 0 16px 0"
  },
  cardText: {
    fontSize: "14px",
    color: "#666666",
    lineHeight: 1.6,
    margin: "0 0 16px 0"
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#333333",
    margin: "24px 0 12px 0"
  },
  list: {
    margin: "0",
    paddingLeft: "20px",
    color: "#666666",
    fontSize: "14px",
    lineHeight: 1.6
  },
  rightCardSmall: {
    fontSize: "14px",
    color: "#666666",
    margin: "0"
  },
  rightCardValue: {
    fontSize: "14px",
    color: "#333333",
    fontWeight: 600,
    margin: "4px 0 0 0"
  }
};

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApplicationFormOpen, setIsApplicationFormOpen] = useState(false);

  useEffect(() => {
    const loadJob = async () => {
      try {
        // First check if data is preloaded in sessionStorage
        const cachedJob = sessionStorage.getItem(`job_${id}`);
        if (cachedJob) {
          const jobData = JSON.parse(cachedJob);
          setJob(jobData);
          setLoading(false);
          return;
        }
        
        // Fallback to API if no cached data
        setLoading(true);
        console.log('Loading job with ID:', id);
        const fetchedJob = await jobService.fetchJobById(id);
        console.log('Fetched job:', fetchedJob);
        
        if (fetchedJob) {
          setJob(fetchedJob);
        } else {
          console.error('Job not found, using fallback');
          setJob({
            id: id,
            title: 'Job Not Found',
            location: 'N/A',
            type: 'N/A',
            experience: 'N/A',
            salary: 'N/A',
            education: 'N/A',
            vacancy: 'N/A',
            gender: 'N/A',
            description: 'Job details could not be loaded from the server.',
            company: 'BnC Global',
            responsibilities: ['Job details unavailable'],
            requirements: ['Please contact HR for more information']
          });
        }
      } catch (error) {
        console.error('Error loading job:', error);
        setJob(null);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      loadJob();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={styles.page}>
        <Header />
        <div style={{ ...styles.container, textAlign: 'center', paddingTop: '100px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading job details...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!job) {
    return (
      <div style={styles.page}>
        <Header />
        <div style={{ ...styles.container, textAlign: 'center', paddingTop: '100px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Job not found</div>
          <Link to="/candidate-jobs" style={{ color: '#0B2F5B', textDecoration: 'none' }}>
            ← Back to Jobs
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{...styles.page, overflowX: 'hidden', width: '100%'}}>
      <Header />
      
      <div style={{...styles.container, width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 24px'}}>
        <div style={styles.header}>
          <div style={{...styles.heroCard, maxWidth: '100vw', overflowX: 'hidden'}}>
            <div style={{
              position: 'absolute',
              top: '70px',
              left: '-170px',
              width: '280px',
              height: '250px',
              borderRadius: '50%',
              background: '#E5E0F0',
              opacity: 0.6,
              zIndex: 1,
              pointerEvents: 'none'
            }}></div>
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-120px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: '#F0E5E0',
              opacity: 0.5,
              zIndex: 1,
              pointerEvents: 'none'
            }}></div>
            <div style={{...styles.heroInner, width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 24px'}}>
              <div style={styles.heroContent}>
                <div style={styles.heroTopRow}>
                  <div style={styles.heroLeft}>
                    <Link to="/candidate-jobs" style={styles.backButton}>
                      ←
                    </Link>
                    <div style={styles.heroText}>
                      <h1 style={styles.title}>{job.title}</h1>
                      <div style={styles.heroMetaRow}>
                        <p style={styles.location}>{job.location}</p>
                        <p style={styles.jobIdText}>Job ID: {job.id}</p>
                      </div>
                    </div>
                  </div>

                  <div style={{...styles.buttonGroup, marginLeft: "-16px"}}>
                    <button 
                      onClick={() => setIsApplicationFormOpen(true)}
                      style={{
                      padding: "16px 40px",
                      borderRadius: "50px",
                      border: "none",
                      fontSize: "16px",
                      fontWeight: 600,
                      cursor: "pointer",
                      background: "#0B2F5B",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: "0 4px 15px rgba(11, 47, 91, 0.3)",
                      transition: "all 0.3s ease"
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={styles.content}>
          <div style={styles.leftColumn}>
            <div style={styles.card}>
              <h2 style={{...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px'}}>
                <svg width="20" height="20" fill="#0B2F5B" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Job Description
              </h2>
              <div style={{...styles.cardText, paddingLeft: '28px', whiteSpace: 'pre-wrap', lineHeight: 1.8}}>
                {(job.description || '').split('\n').map((line, i) => {
                  const trimmed = line.trim();
                  if (!trimmed) return <div key={i} style={{height: '8px'}} />;
                  const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');
                  if (isBullet) {
                    return (
                      <div key={i} style={{display: 'flex', gap: '8px', marginBottom: '4px', paddingLeft: '8px'}}>
                        <span style={{color: '#0b2f5b', fontWeight: 700, flexShrink: 0}}>•</span>
                        <span>{trimmed.replace(/^[•\-\*]\s*/, '')}</span>
                      </div>
                    );
                  }
                  return <div key={i} style={{marginBottom: '4px', fontWeight: trimmed.length < 60 && !trimmed.includes(':') ? 400 : 400}}>{trimmed}</div>;
                })}
              </div>

            </div>
          </div>
          
          <div style={styles.rightColumn}>
            <div style={styles.rightCard}>
              <h3 style={{...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px'}}>
                <svg width="18" height="18" fill="#0B2F5B" viewBox="0 0 24 24">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Education Qualification
              </h3>
              <p style={{...styles.rightCardValue, paddingLeft: '26px'}}>{job.education || 'Bachelor\'s Degree - Qualified'}</p>
            </div>
            
            <div style={styles.rightCard}>
              <h3 style={{...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px'}}>
                <svg width="18" height="18" fill="#0B2F5B" viewBox="0 0 24 24">
                  <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v6a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Job Type
              </h3>
              <p style={{...styles.rightCardValue, paddingLeft: '26px'}}>{job.type}</p>
            </div>
            
            <div style={styles.rightCard}>
              <h3 style={{...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px'}}>
                <svg width="18" height="18" fill="#0B2F5B" viewBox="0 0 24 24">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Overview
              </h3>
              <div style={{paddingLeft: '26px'}}>
                <div style={{marginBottom: '12px'}}>
                  <p style={styles.rightCardSmall}>No. Of Vacancy</p>
                  <p style={styles.rightCardValue}>{job.vacancy || '5'}</p>
                </div>
                <div style={{marginBottom: '12px'}}>
                  <p style={styles.rightCardSmall}>Offered Salary</p>
                  <p style={styles.rightCardValue}>{job.salary}</p>
                </div>
                <div style={{marginBottom: '12px'}}>
                  <p style={styles.rightCardSmall}>Experience</p>
                  <p style={styles.rightCardValue}>{job.experience}</p>
                </div>
                <div>
                  <p style={styles.rightCardSmall}>Gender</p>
                  <p style={styles.rightCardValue}>{job.gender || 'All Gender Welcome'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <JobApplicationForm 
        isOpen={isApplicationFormOpen}
        onClose={() => setIsApplicationFormOpen(false)}
        jobTitle={job.title}
        jobId={job.id}
        company={job.company}
      />
      
      <Footer />
    </div>
  );
}