import { useState } from 'react';
import { jobService } from '../services/jobService.js';
import { parseResume } from '../services/resumeParser.js';
import { analyzeCandidate } from '../services/aiService.js';
import { 
  FiUpload, FiFile, FiEye, FiRefreshCw, FiX, FiCheck, FiZap, FiEdit3,
  FiUser, FiMail, FiPhone, FiMapPin, FiBookOpen, FiBriefcase,
  FiSearch, FiCheckCircle, FiLoader, FiCircle
} from 'react-icons/fi';

// Auto badge component
const AutoBadge = ({ field, autoFilledFields }) => {
  if (!autoFilledFields.has(field)) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      background: 'linear-gradient(135deg, #0B2F5B, #1a4a8a)',
      color: '#fff', fontSize: '9px', fontWeight: 700,
      padding: '2px 7px', borderRadius: '20px', letterSpacing: '0.5px',
      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
      pointerEvents: 'none', textTransform: 'uppercase', lineHeight: '16px'
    }}>
      <FiZap size={8} /> AUTO
    </span>
  );
};

const InputWithBadge = ({ field, autoFilledFields, children }) => (
  <div style={{ position: 'relative' }}>{children}<AutoBadge field={field} autoFilledFields={autoFilledFields} /></div>
);

// ── Scanning Progress Component ──
const ScanningOverlay = ({ parseProgress }) => {
  const stages = [
    { key: 'extracting', label: 'Reading resume content', icon: <FiFile size={15} /> },
    { key: 'contact', label: 'Extracting contact details', icon: <FiUser size={15} /> },
    { key: 'education', label: 'Parsing education info', icon: <FiBookOpen size={15} /> },
    { key: 'experience', label: 'Analyzing work experience', icon: <FiBriefcase size={15} /> },
    { key: 'done', label: 'Completed', icon: <FiCheckCircle size={15} /> },
  ];

  const currentIndex = stages.findIndex(s => s.key === parseProgress);
  const progressPercent = parseProgress === 'done' ? 100 : Math.max(8, ((currentIndex + 1) / stages.length) * 100);

  return (
    <div style={{
      borderRadius: '14px', padding: '28px 24px',
      background: '#f8fafc', border: '1px solid #e2e8f0',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: parseProgress === 'done' ? '#0B2F5B' : '#fff',
          border: parseProgress === 'done' ? 'none' : '2px solid #0B2F5B',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: parseProgress === 'done' ? '#fff' : '#0B2F5B',
          animation: parseProgress === 'done' ? 'none' : 'spin 2s linear infinite',
          flexShrink: 0
        }}>
          {parseProgress === 'done' ? <FiCheck size={18} /> : <FiSearch size={18} />}
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
            {parseProgress === 'done' ? 'AI Scanning Complete' : 'AI is scanning your resume...'}
          </h4>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
            {parseProgress === 'done' ? 'All sections have been processed' : 'Please wait a moment'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden', marginBottom: '18px' }}>
        <div style={{
          width: `${progressPercent}%`, height: '100%',
          background: 'linear-gradient(90deg, #0B2F5B, #1a4a8a)',
          borderRadius: '2px', transition: 'width 0.6s ease'
        }} />
      </div>

      {/* Stage list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {stages.map((stage, i) => {
          const isDone = currentIndex > i || parseProgress === 'done';
          const isCurrent = currentIndex === i && parseProgress !== 'done';

          return (
            <div key={stage.key} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 12px', borderRadius: '8px',
              background: isCurrent ? '#0B2F5B08' : 'transparent',
              border: isCurrent ? '1px solid #0B2F5B20' : '1px solid transparent',
              transition: 'all 0.3s'
            }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                background: isDone ? '#0B2F5B' : isCurrent ? '#fff' : '#f1f5f9',
                border: isCurrent ? '2px solid #0B2F5B' : 'none',
                color: isDone ? '#fff' : isCurrent ? '#0B2F5B' : '#cbd5e1',
                transition: 'all 0.3s'
              }}>
                {isDone ? <FiCheck size={12} /> : isCurrent ? <FiLoader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <FiCircle size={8} />}
              </div>
              <span style={{
                fontSize: '13px', fontWeight: isCurrent ? 600 : 400,
                color: isDone ? '#0B2F5B' : isCurrent ? '#1e293b' : '#94a3b8',
                transition: 'color 0.3s'
              }}>
                {stage.label}
              </span>
              {isDone && (
                <span style={{
                  marginLeft: 'auto', fontSize: '10px', fontWeight: 600,
                  color: '#0B2F5B', background: '#0B2F5B12', padding: '2px 8px',
                  borderRadius: '10px', letterSpacing: '0.3px'
                }}>Done</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function JobApplicationForm({ isOpen, onClose, jobTitle, jobId, company }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  // Auto-fill related states
  const [fillMode, setFillMode] = useState('none'); // 'none' | 'auto' | 'manual'
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState('');
  const [autoFilledFields, setAutoFilledFields] = useState(new Set());

  const [formData, setFormData] = useState({
    candidateName: '',
    email: '',
    contactNumber: '',
    currentLocation: '',
    recentEducation: '',
    totalExperience: '',
    currentCompany: '',
    currentPosition: '',
    currentCTC: '',
    expectedCTC: '',
    noticePeriod: '',
    resume: null
  });

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^[+]?[0-9\s\-\(\)]{10,15}$/.test(phone.replace(/\s/g, ''));

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.resume) newErrors.resume = 'Resume upload is required';
    }
    if (step === 2) {
      if (!formData.candidateName.trim()) newErrors.candidateName = 'Name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!formData.contactNumber.trim()) {
        newErrors.contactNumber = 'Contact number is required';
      } else if (!validatePhone(formData.contactNumber)) {
        newErrors.contactNumber = 'Please enter a valid phone number';
      }
      if (!formData.currentLocation.trim()) newErrors.currentLocation = 'Location is required';
    }
    if (step === 3) {
      if (!formData.recentEducation.trim()) newErrors.recentEducation = 'Education details are required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (autoFilledFields.has(field)) {
      setAutoFilledFields(prev => { const next = new Set(prev); next.delete(field); return next; });
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (file) => {
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) { alert('Please upload only PDF, DOC, or DOCX files.'); return; }
      if (file.size > 5 * 1024 * 1024) { alert('File size must be less than 5MB.'); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target.result;
        const base64Data = result.split(',')[1];
        setFormData(prev => ({ ...prev, resume: file, resumeData: base64Data, resumeFileName: file.name, resumeUrl: result }));
        setFillMode('none');
        setAutoFilledFields(new Set());
      };
      reader.onerror = () => alert('Error reading file. Please try again.');
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ ...prev, resume: null, resumeData: null, resumeFileName: null, resumeUrl: null }));
      setFillMode('none');
      setAutoFilledFields(new Set());
    }
  };

  const handleAutoFill = async () => {
    if (!formData.resume) return;
    setIsParsing(true);
    setParseProgress('extracting');
    setFillMode('auto');
    try {
      await new Promise(r => setTimeout(r, 400));
      const parsed = await parseResume(formData.resume, (stage) => setParseProgress(stage));
      if (parsed.data && Object.keys(parsed.data).length > 0) {
        setFormData(prev => ({ ...prev, ...parsed.data }));
        setAutoFilledFields(parsed.autoFilledFields);
      }
      await new Promise(r => setTimeout(r, 600));
    } catch (error) {
      console.error('Auto-fill error:', error);
      setParseProgress('error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleManualFill = () => setFillMode('manual');

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.resume) { setErrors({ resume: 'Resume upload is required' }); return; }
      if (fillMode === 'none') { setErrors({ fillMode: 'Please choose how you want to fill the form' }); return; }
      if (isParsing) return;
      setCurrentStep(2);
    } else if (validateStep(currentStep)) {
      if (currentStep < 4) setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      alert('Please fill all required fields and upload your resume.'); return;
    }
    try {
      setIsSubmitting(true);
      const applicationData = {
        candidateName: formData.candidateName, email: formData.email,
        contactNumber: `'${formData.contactNumber}`, currentLocation: formData.currentLocation,
        recentEducation: formData.recentEducation, totalExperience: formData.totalExperience,
        currentCompany: formData.currentCompany, currentPosition: formData.currentPosition,
        currentCTC: formData.currentCTC, expectedCTC: formData.expectedCTC,
        noticePeriod: formData.noticePeriod, jobTitle, jobId,
        resumeData: formData.resumeData, resumeFileName: formData.resumeFileName
      };
      const result = await jobService.submitApplication(applicationData);
      if (result.success) {
        setIsSubmitted(true);
        // Non-blocking AI analysis — runs in background after success screen shows
        triggerAiAnalysis(applicationData);
      } else {
        alert('Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally { setIsSubmitting(false); }
  };

  const triggerAiAnalysis = async (applicationData) => {
    try {
      setIsAiAnalyzing(true);
      // We pass jobData we already have (title, id, and whatever was available)
      const jobData = {
        title: applicationData.jobTitle,
        id: applicationData.jobId,
        experience: '', education: '', salary: '', type: '', description: ''
      };
      // Fetch full job data for better analysis if possible
      try {
        const fullJob = await jobService.fetchJobById(applicationData.jobId);
        if (fullJob) {
          Object.assign(jobData, fullJob);
        }
      } catch (e) {
        console.warn('Could not fetch full job for AI analysis, using partial data.');
      }

      const aiResult = await analyzeCandidate(applicationData, jobData);
      console.log('AI analysis complete:', aiResult);

      // Save results to Google Sheet
      const jobAppliedStr = `${applicationData.jobTitle} (ID: ${applicationData.jobId})`;
      await jobService.saveAiResults(
        applicationData.email,
        jobAppliedStr,
        aiResult
      );
      console.log('AI results saved to sheet.');
    } catch (err) {
      console.error('AI analysis pipeline error:', err);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1); setIsSubmitted(false); setIsSubmitting(false);
    setFillMode('none'); setIsParsing(false); setParseProgress('');
    setAutoFilledFields(new Set());
    setFormData({
      candidateName: '', email: '', contactNumber: '', currentLocation: '',
      recentEducation: '', totalExperience: '', currentCompany: '',
      currentPosition: '', currentCTC: '', expectedCTC: '', noticePeriod: '', resume: null
    });
    onClose();
  };

  if (!isOpen) return null;

  const steps = [
    { number: 1, title: 'Resume Upload', icon: <FiUpload size={14} /> },
    { number: 2, title: 'Personal Details', icon: <FiUser size={14} /> },
    { number: 3, title: 'Education', icon: <FiBookOpen size={14} /> },
    { number: 4, title: 'Experience', icon: <FiBriefcase size={14} /> }
  ];


  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff', borderRadius: '20px',
        width: '100%', maxWidth: '800px', height: '95vh',
        overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column'
      }}>
        {!isSubmitted ? (
          <>
            {/* Header */}
            <div style={{
              padding: '24px 30px 18px', borderBottom: '1px solid #f0f0f0',
              position: 'sticky', top: 0, background: '#ffffff', zIndex: 10
            }}>
              <button onClick={onClose} style={{
                position: 'absolute', top: '18px', right: '20px',
                background: 'none', border: 'none', fontSize: '22px',
                cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center'
              }}><FiX size={20} /></button>
              
              <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 600, color: '#333' }}>
                Apply for {jobTitle}
              </h2>
              <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
                {company} • Job ID: {jobId}
              </p>

              {/* Progress Steps */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                {steps.map((step) => (
                  <div key={step.number} style={{
                    display: 'flex', alignItems: 'center', gap: '7px', flex: 1
                  }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '50%',
                      background: currentStep >= step.number ? '#0B2F5B' : '#f0f0f0',
                      color: currentStep >= step.number ? '#fff' : '#999',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 600, flexShrink: 0
                    }}>
                      {currentStep > step.number ? <FiCheck size={14} /> : step.number}
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: 500,
                      color: currentStep >= step.number ? '#0B2F5B' : '#999'
                    }}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div style={{ padding: '24px 30px', flex: 1, overflow: 'auto' }}>
              <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
              `}</style>
              
              {/* ═══ STEP 1: RESUME UPLOAD ═══ */}
              {currentStep === 1 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '10px',
                      background: '#0B2F5B10', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#0B2F5B'
                    }}><FiUpload size={16} /></div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#1e293b' }}>
                      Upload Your Resume
                    </h3>
                  </div>
                  <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, paddingLeft: '42px' }}>
                    Upload your resume to get started, then choose to auto-fill or fill manually.
                  </p>

                  {/* Upload Area */}
                  {!isParsing && (
                    <div style={{
                      border: formData.resume ? 'none' : `2px dashed ${errors.resume ? '#dc3545' : '#d1d5db'}`,
                      borderRadius: '14px',
                      padding: formData.resume ? '0' : '32px 20px',
                      textAlign: 'center',
                      background: formData.resume ? 'transparent' : '#fafbfc',
                      transition: 'border-color 0.3s',
                      marginBottom: '20px'
                    }}>
                      {!formData.resume ? (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                          <div style={{
                            width: '56px', height: '56px', margin: '0 auto 14px',
                            background: '#0B2F5B10', borderRadius: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#0B2F5B'
                          }}><FiFile size={24} /></div>
                          <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 600, color: '#333' }}>
                            Drop your resume here or click to browse
                          </p>
                          <p style={{ margin: '0 0 18px', fontSize: '12px', color: '#94a3b8' }}>
                            PDF, DOC, DOCX • Max 5MB
                          </p>
                          <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFileUpload(e.target.files[0])} style={{ display: 'none' }} id="resume-upload-step1" />
                          <label htmlFor="resume-upload-step1" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '10px 28px', background: '#0B2F5B', color: '#fff',
                            borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(11,47,91,0.3)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                          >
                            <FiUpload size={14} /> Choose File
                          </label>
                        </div>
                      ) : (
                        <div style={{
                          animation: 'fadeIn 0.3s ease', background: '#f8fafc',
                          borderRadius: '12px', border: '1px solid #e2e8f0', padding: '14px 16px',
                          display: 'flex', alignItems: 'center', gap: '12px'
                        }}>
                          <div style={{
                            width: '42px', height: '42px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #0B2F5B, #1a4a8a)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', flexShrink: 0
                          }}><FiFile size={18} /></div>
                          <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                            <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '13px', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {formData.resume.name}
                            </p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                              {formData.resume.type === 'application/pdf' ? 'PDF' : 'Word'} • {(formData.resume.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            {formData.resume.type === 'application/pdf' && (
                              <button onClick={() => setIsFullscreen(true)} style={{
                                width: '32px', height: '32px', borderRadius: '8px',
                                border: '1px solid #e2e8f0', color: '#64748b', background: '#fff',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }} title="View"><FiEye size={14} /></button>
                            )}
                            <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFileUpload(e.target.files[0])} style={{ display: 'none' }} id="resume-replace-step1" />
                            <label htmlFor="resume-replace-step1" style={{
                              width: '32px', height: '32px', borderRadius: '8px',
                              border: '1px solid #e2e8f0', color: '#64748b', background: '#fff',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }} title="Replace"><FiRefreshCw size={13} /></label>
                            <button onClick={() => handleFileUpload(null)} style={{
                              width: '32px', height: '32px', borderRadius: '8px',
                              border: '1px solid #fecaca', color: '#dc3545', background: '#fff',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }} title="Remove"><FiX size={14} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {errors.resume && <div style={{color: '#dc3545', fontSize: '12px', marginTop: '-12px', marginBottom: '12px'}}>{errors.resume}</div>}

                  {/* Parsing Animation */}
                  {isParsing && (
                    <div style={{ animation: 'fadeIn 0.3s ease', marginBottom: '16px' }}>
                      <ScanningOverlay parseProgress={parseProgress} />
                    </div>
                  )}

                  {/* Fill Mode Choice */}
                  {formData.resume && !isParsing && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                      <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#475569', textAlign: 'center' }}>
                        How would you like to fill the application?
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {/* Auto-fill Option */}
                        <button
                          onClick={handleAutoFill}
                          disabled={fillMode === 'auto'}
                          style={{
                            padding: '16px 14px', borderRadius: '12px', cursor: 'pointer',
                            border: fillMode === 'auto' ? '2px solid #0B2F5B' : '2px solid #e5e7eb',
                            background: fillMode === 'auto' ? '#0B2F5B08' : '#fff',
                            transition: 'all 0.25s', textAlign: 'center',
                            position: 'relative', overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => { if (fillMode !== 'auto') { e.currentTarget.style.borderColor = '#0B2F5B80'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(11,47,91,0.1)'; }}}
                          onMouseLeave={(e) => { if (fillMode !== 'auto') { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}}
                        >
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: fillMode === 'auto' ? '#0B2F5B' : '#0B2F5B10',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 10px',
                            color: fillMode === 'auto' ? '#fff' : '#0B2F5B'
                          }}><FiZap size={17} /></div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                            AI Auto-fill
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                            Scan resume & pre-fill all fields
                          </div>
                          {fillMode === 'auto' && (
                            <div style={{
                              position: 'absolute', top: '8px', right: '8px',
                              width: '20px', height: '20px', borderRadius: '50%',
                              background: '#0B2F5B', color: '#fff', display: 'flex',
                              alignItems: 'center', justifyContent: 'center'
                            }}><FiCheck size={11} /></div>
                          )}
                        </button>

                        {/* Manual Fill Option */}
                        <button
                          onClick={handleManualFill}
                          disabled={fillMode === 'manual'}
                          style={{
                            padding: '16px 14px', borderRadius: '12px', cursor: 'pointer',
                            border: fillMode === 'manual' ? '2px solid #64748b' : '2px solid #e5e7eb',
                            background: fillMode === 'manual' ? '#64748b08' : '#fff',
                            transition: 'all 0.25s', textAlign: 'center',
                            position: 'relative', overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => { if (fillMode !== 'manual') { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}}
                          onMouseLeave={(e) => { if (fillMode !== 'manual') { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}}
                        >
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: fillMode === 'manual' ? '#64748b' : '#64748b10',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 10px',
                            color: fillMode === 'manual' ? '#fff' : '#64748b'
                          }}><FiEdit3 size={17} /></div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                            Fill Manually
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                            Type all details yourself
                          </div>
                          {fillMode === 'manual' && (
                            <div style={{
                              position: 'absolute', top: '8px', right: '8px',
                              width: '20px', height: '20px', borderRadius: '50%',
                              background: '#64748b', color: '#fff', display: 'flex',
                              alignItems: 'center', justifyContent: 'center'
                            }}><FiCheck size={11} /></div>
                          )}
                        </button>
                      </div>

                      {errors.fillMode && <div style={{color: '#dc3545', fontSize: '11px', marginTop: '10px', textAlign: 'center'}}>{errors.fillMode}</div>}

                      {/* Success Banner — Blue theme */}
                      {fillMode === 'auto' && autoFilledFields.size > 0 && (
                        <div style={{
                          marginTop: '16px', padding: '12px 16px', borderRadius: '10px',
                          background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                          border: '1px solid #93c5fd', animation: 'fadeIn 0.3s ease',
                          display: 'flex', alignItems: 'center', gap: '10px'
                        }}>
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: '#0B2F5B', color: '#fff', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}><FiCheckCircle size={14} /></div>
                          <div>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>
                              {autoFilledFields.size} field{autoFilledFields.size > 1 ? 's' : ''} auto-filled successfully!
                            </p>
                            <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#3b82f6' }}>
                              Click "Next Step" to review and edit the extracted details.
                            </p>
                          </div>
                        </div>
                      )}

                      {fillMode !== 'none' && (
                        <p style={{ margin: '12px 0 0', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                          {fillMode === 'auto' ? 'You can always edit any auto-filled field in the next steps.' : 'You\'ll fill in your details in the next steps.'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ STEP 2: PERSONAL DETAILS ═══ */}
              {currentStep === 2 && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '10px',
                      background: '#0B2F5B10', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#0B2F5B'
                    }}><FiUser size={16} /></div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#1e293b' }}>
                      Personal Details
                    </h3>
                  </div>
                  {fillMode === 'auto' && autoFilledFields.size > 0 && (
                    <div style={{
                      padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
                      background: '#eff6ff', border: '1px solid #bfdbfe',
                      fontSize: '11px', color: '#1e40af', fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                      <FiZap size={13} />
                      Fields marked <span style={{
                        background: 'linear-gradient(135deg, #0B2F5B, #1a4a8a)',
                        color: '#fff', padding: '1px 6px', borderRadius: '10px',
                        fontSize: '8px', fontWeight: 700, letterSpacing: '0.5px'
                      }}>AUTO</span> were extracted from your resume. Edit freely.
                    </div>
                  )}
                  <div style={{ display: 'grid', gap: '14px' }}>
                    <InputWithBadge field="candidateName" autoFilledFields={autoFilledFields}>
                      <input type="text" placeholder="Candidate Name *" value={formData.candidateName}
                        onChange={(e) => handleInputChange('candidateName', e.target.value)}
                        style={{ width: '100%', padding: '11px 14px', paddingRight: autoFilledFields.has('candidateName') ? '78px' : '14px', border: `1px solid ${errors.candidateName ? '#dc3545' : '#e0e0e0'}`, borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </InputWithBadge>
                    {errors.candidateName && <div style={{color: '#dc3545', fontSize: '11px', marginTop: '-8px'}}>{errors.candidateName}</div>}

                    <InputWithBadge field="email" autoFilledFields={autoFilledFields}>
                      <input type="email" placeholder="Email *" value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        style={{ width: '100%', padding: '11px 14px', paddingRight: autoFilledFields.has('email') ? '78px' : '14px', border: `1px solid ${errors.email ? '#dc3545' : '#e0e0e0'}`, borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </InputWithBadge>
                    {errors.email && <div style={{color: '#dc3545', fontSize: '11px', marginTop: '-8px'}}>{errors.email}</div>}

                    <InputWithBadge field="contactNumber" autoFilledFields={autoFilledFields}>
                      <input type="tel" placeholder="Contact Number *" value={formData.contactNumber}
                        onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                        style={{ width: '100%', padding: '11px 14px', paddingRight: autoFilledFields.has('contactNumber') ? '78px' : '14px', border: `1px solid ${errors.contactNumber ? '#dc3545' : '#e0e0e0'}`, borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </InputWithBadge>
                    {errors.contactNumber && <div style={{color: '#dc3545', fontSize: '11px', marginTop: '-8px'}}>{errors.contactNumber}</div>}

                    <InputWithBadge field="currentLocation" autoFilledFields={autoFilledFields}>
                      <input type="text" placeholder="Current Location *" value={formData.currentLocation}
                        onChange={(e) => handleInputChange('currentLocation', e.target.value)}
                        style={{ width: '100%', padding: '11px 14px', paddingRight: autoFilledFields.has('currentLocation') ? '78px' : '14px', border: `1px solid ${errors.currentLocation ? '#dc3545' : '#e0e0e0'}`, borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </InputWithBadge>
                    {errors.currentLocation && <div style={{color: '#dc3545', fontSize: '11px', marginTop: '-8px'}}>{errors.currentLocation}</div>}
                  </div>
                </div>
              )}

              {/* ═══ STEP 3: EDUCATION ═══ */}
              {currentStep === 3 && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '10px',
                      background: '#0B2F5B10', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#0B2F5B'
                    }}><FiBookOpen size={16} /></div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#1e293b' }}>Education</h3>
                  </div>
                  {fillMode === 'auto' && autoFilledFields.has('recentEducation') && (
                    <div style={{
                      padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
                      background: '#eff6ff', border: '1px solid #bfdbfe',
                      fontSize: '11px', color: '#1e40af', fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                      <FiZap size={13} />
                      Education details were extracted from your resume. Please review.
                    </div>
                  )}
                  <InputWithBadge field="recentEducation" autoFilledFields={autoFilledFields}>
                    <textarea placeholder="Recent Education * (e.g., MBA in Finance from XYZ University, 2020)"
                      value={formData.recentEducation}
                      onChange={(e) => handleInputChange('recentEducation', e.target.value)}
                      rows={4}
                      style={{ width: '100%', padding: '11px 14px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                  </InputWithBadge>
                </div>
              )}

              {/* ═══ STEP 4: EXPERIENCE ═══ */}
              {currentStep === 4 && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '10px',
                      background: '#0B2F5B10', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#0B2F5B'
                    }}><FiBriefcase size={16} /></div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#1e293b' }}>Experience</h3>
                  </div>
                  {fillMode === 'auto' && (autoFilledFields.has('totalExperience') || autoFilledFields.has('currentCompany') || autoFilledFields.has('currentPosition')) && (
                    <div style={{
                      padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
                      background: '#eff6ff', border: '1px solid #bfdbfe',
                      fontSize: '11px', color: '#1e40af', fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                      <FiZap size={13} />
                      Some experience fields were auto-filled. CTC & Notice Period need manual input.
                    </div>
                  )}
                  <div style={{ display: 'grid', gap: '14px' }}>
                    <InputWithBadge field="totalExperience" autoFilledFields={autoFilledFields}>
                      <select value={formData.totalExperience} onChange={(e) => handleInputChange('totalExperience', e.target.value)}
                        style={{ width: '100%', padding: '11px 14px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                        <option value="">Total Experience (Years)</option>
                        <option value="0">Fresher</option>
                        <option value="1">1 Year</option><option value="2">2 Years</option>
                        <option value="3">3 Years</option><option value="4">4 Years</option>
                        <option value="5">5 Years</option><option value="6-10">6-10 Years</option>
                        <option value="10+">10+ Years</option>
                      </select>
                    </InputWithBadge>

                    <InputWithBadge field="currentCompany" autoFilledFields={autoFilledFields}>
                      <input type="text" placeholder="Current Company" value={formData.currentCompany}
                        onChange={(e) => handleInputChange('currentCompany', e.target.value)}
                        style={{ width: '100%', padding: '11px 14px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', outline: 'none', paddingRight: autoFilledFields.has('currentCompany') ? '78px' : '14px', boxSizing: 'border-box' }} />
                    </InputWithBadge>

                    <InputWithBadge field="currentPosition" autoFilledFields={autoFilledFields}>
                      <input type="text" placeholder="Current Position" value={formData.currentPosition}
                        onChange={(e) => handleInputChange('currentPosition', e.target.value)}
                        style={{ width: '100%', padding: '11px 14px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', outline: 'none', paddingRight: autoFilledFields.has('currentPosition') ? '78px' : '14px', boxSizing: 'border-box' }} />
                    </InputWithBadge>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <input type="number" placeholder="Current CTC (LPA)" value={formData.currentCTC}
                        onChange={(e) => handleInputChange('currentCTC', e.target.value)}
                        style={{ width: '100%', padding: '11px 14px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                      <input type="number" placeholder="Expected CTC (LPA)" value={formData.expectedCTC}
                        onChange={(e) => handleInputChange('expectedCTC', e.target.value)}
                        style={{ width: '100%', padding: '11px 14px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <select value={formData.noticePeriod} onChange={(e) => handleInputChange('noticePeriod', e.target.value)}
                      style={{ width: '100%', padding: '11px 14px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                      <option value="">Notice Period</option>
                      <option value="Immediate">Immediate</option>
                      <option value="15 days">15 Days</option>
                      <option value="1 month">1 Month</option>
                      <option value="2 months">2 Months</option>
                      <option value="3 months">3 Months</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div style={{
              padding: '16px 30px', borderTop: '1px solid #f0f0f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <button onClick={prevStep} disabled={currentStep === 1}
                style={{
                  padding: '10px 22px', border: '1px solid #e0e0e0',
                  background: '#fff', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 500, opacity: currentStep === 1 ? 0.5 : 1
                }}>Previous</button>
              
              {currentStep < 4 ? (
                <button onClick={nextStep} disabled={isParsing}
                  style={{
                    padding: '10px 22px', border: 'none',
                    background: isParsing ? '#ccc' : '#0B2F5B', color: '#fff', borderRadius: '8px',
                    cursor: isParsing ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600,
                  }}>Next Step</button>
              ) : (
                <button onClick={handleSubmit} disabled={isSubmitting}
                  style={{
                    padding: '10px 22px', border: 'none',
                    background: isSubmitting ? '#ccc' : '#0B2F5B', color: '#fff', borderRadius: '8px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                  {isSubmitting ? (<><div style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>Submitting...</>) : 'Submit Application'}
                </button>
              )}
            </div>
          </>
        ) : (
          <div style={{ padding: '60px 30px', textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', margin: '0 auto 20px', borderRadius: '50%',
              background: '#0B2F5B', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}><FiCheckCircle size={30} color="#fff" /></div>
            <h2 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: 600, color: '#333' }}>Thank You for Submitting!</h2>
            <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#666', lineHeight: 1.5 }}>
              Your application for <strong>{jobTitle}</strong> has been successfully submitted.
              Our team will review your profile and get back to you shortly.
            </p>
            {isAiAnalyzing && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                border: '1px solid #93c5fd', borderRadius: '10px',
                padding: '8px 16px', marginBottom: '16px', animation: 'pulse 2s infinite'
              }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #0B2F5B', borderTop: '2px solid transparent', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>🤖 AI is analyzing your profile...</span>
              </div>
            )}
            <p style={{ margin: '0 0 28px', fontSize: '13px', color: '#666' }}>Kindly check your email for further communication.</p>
            <button onClick={resetForm} style={{
              padding: '10px 28px', border: 'none', background: '#0B2F5B', color: '#fff',
              borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600
            }}>Close</button>
          </div>
        )}
        
        {/* Fullscreen Resume Viewer */}
        {isFullscreen && formData.resume && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.95)', zIndex: 2000,
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', background: 'rgba(0,0,0,0.8)'
            }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '16px' }}>{formData.resume.name}</h3>
              <button onClick={() => setIsFullscreen(false)} style={{
                background: 'none', border: '2px solid #fff', color: '#fff',
                width: '36px', height: '36px', borderRadius: '50%',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}><FiX size={16} /></button>
            </div>
            <div style={{ flex: 1, padding: '20px' }}>
              {formData.resume.type === 'application/pdf' ? (
                <iframe src={formData.resumeUrl} style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px', background: '#fff' }} title="Resume Fullscreen" />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <FiFile size={48} color="#0B2F5B" style={{ marginBottom: '20px' }} />
                  <p style={{ fontSize: '20px', fontWeight: 600, color: '#333', margin: '0 0 12px' }}>{formData.resume.name}</p>
                  <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>Word Document Preview Not Available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}