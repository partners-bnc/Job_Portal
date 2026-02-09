import { useState } from 'react';
import { jobService } from '../services/jobService.js';

export default function JobApplicationForm({ isOpen, onClose, jobTitle, jobId, company }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Details
    candidateName: '',
    email: '',
    contactNumber: '',
    currentLocation: '',
    
    // Education
    recentEducation: '',
    
    // Experience
    totalExperience: '',
    currentCompany: '',
    currentPosition: '',
    currentCTC: '',
    expectedCTC: '',
    noticePeriod: '',
    
    // Resume
    resume: null
  });

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
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
    
    if (step === 2) {
      if (!formData.recentEducation.trim()) newErrors.recentEducation = 'Education details are required';
    }
    
    if (step === 4) {
      if (!formData.resume) newErrors.resume = 'Resume upload is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (file) => {
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload only PDF, DOC, or DOCX files.');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
        return;
      }
      
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target.result;
        const base64Data = result.split(',')[1]; // Remove data:mime;base64, prefix
        console.log('File converted to base64, size:', base64Data.length);
        setFormData(prev => ({ 
          ...prev, 
          resume: file,
          resumeData: base64Data,
          resumeFileName: file.name,
          resumeUrl: result // Store full data URL for preview
        }));
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        alert('Error reading file. Please try again.');
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ 
        ...prev, 
        resume: null,
        resumeData: null,
        resumeFileName: null,
        resumeUrl: null
      }));
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(4)) {
      alert('Please fill all required fields and upload your resume.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepare application data
      const applicationData = {
        candidateName: formData.candidateName,
        email: formData.email,
        contactNumber: formData.contactNumber,
        currentLocation: formData.currentLocation,
        recentEducation: formData.recentEducation,
        totalExperience: formData.totalExperience,
        currentCompany: formData.currentCompany,
        currentPosition: formData.currentPosition,
        currentCTC: formData.currentCTC,
        expectedCTC: formData.expectedCTC,
        noticePeriod: formData.noticePeriod,
        jobTitle: jobTitle,
        jobId: jobId,
        resumeData: formData.resumeData,
        resumeFileName: formData.resumeFileName
      };
      
      console.log('Submitting application:', applicationData);
      const result = await jobService.submitApplication(applicationData);
      
      if (result.success) {
        setIsSubmitted(true);
      } else {
        console.error('Application submission failed:', result.error);
        alert('Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setIsSubmitted(false);
    setIsSubmitting(false);
    setFormData({
      candidateName: '', email: '', contactNumber: '', currentLocation: '',
      recentEducation: '', totalExperience: '', currentCompany: '',
      currentPosition: '', currentCTC: '', expectedCTC: '', noticePeriod: '', resume: null
    });
    onClose();
  };

  if (!isOpen) return null;

  const steps = [
    { number: 1, title: 'Personal Details', icon: '👤' },
    { number: 2, title: 'Education', icon: '🎓' },
    { number: 3, title: 'Experience', icon: '💼' },
    { number: 4, title: 'Resume Upload', icon: '📄' }
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
              padding: '30px 30px 20px', borderBottom: '1px solid #f0f0f0',
              position: 'sticky', top: 0, background: '#ffffff', zIndex: 10
            }}>
              <button onClick={onClose} style={{
                position: 'absolute', top: '20px', right: '20px',
                background: 'none', border: 'none', fontSize: '24px',
                cursor: 'pointer', color: '#666'
              }}>×</button>
              
              <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 600, color: '#333' }}>
                Apply for {jobTitle}
              </h2>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                {company} • Job ID: {jobId}
              </p>

              {/* Progress Steps */}
              <div style={{ display: 'flex', gap: '20px', marginTop: '25px' }}>
                {steps.map((step) => (
                  <div key={step.number} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', flex: 1
                  }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: currentStep >= step.number ? '#0B2F5B' : '#f0f0f0',
                      color: currentStep >= step.number ? '#fff' : '#999',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: 600
                    }}>
                      {step.number}
                    </div>
                    <span style={{
                      fontSize: '12px', fontWeight: 500,
                      color: currentStep >= step.number ? '#0B2F5B' : '#999'
                    }}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div style={{ padding: '30px', flex: 1, overflow: 'auto' }}>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              {currentStep === 1 && (
                <div>
                  <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600, color: '#333' }}>
                    👤 Personal Details
                  </h3>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <input
                      type="text"
                      placeholder="Candidate Name *"
                      value={formData.candidateName}
                      onChange={(e) => handleInputChange('candidateName', e.target.value)}
                      style={{
                        padding: '12px 16px', border: `1px solid ${errors.candidateName ? '#dc3545' : '#e0e0e0'}`,
                        borderRadius: '8px', fontSize: '14px', outline: 'none'
                      }}
                    />
                    {errors.candidateName && <div style={{color: '#dc3545', fontSize: '12px', marginTop: '4px'}}>{errors.candidateName}</div>}
                    <input
                      type="email"
                      placeholder="Email *"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      style={{
                        padding: '12px 16px', border: `1px solid ${errors.email ? '#dc3545' : '#e0e0e0'}`,
                        borderRadius: '8px', fontSize: '14px', outline: 'none'
                      }}
                    />
                    {errors.email && <div style={{color: '#dc3545', fontSize: '12px', marginTop: '4px'}}>{errors.email}</div>}
                    <input
                      type="tel"
                      placeholder="Contact Number *"
                      value={formData.contactNumber}
                      onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                      style={{
                        padding: '12px 16px', border: `1px solid ${errors.contactNumber ? '#dc3545' : '#e0e0e0'}`,
                        borderRadius: '8px', fontSize: '14px', outline: 'none'
                      }}
                    />
                    {errors.contactNumber && <div style={{color: '#dc3545', fontSize: '12px', marginTop: '4px'}}>{errors.contactNumber}</div>}
                    <input
                      type="text"
                      placeholder="Current Location *"
                      value={formData.currentLocation}
                      onChange={(e) => handleInputChange('currentLocation', e.target.value)}
                      style={{
                        padding: '12px 16px', border: `1px solid ${errors.currentLocation ? '#dc3545' : '#e0e0e0'}`,
                        borderRadius: '8px', fontSize: '14px', outline: 'none'
                      }}
                    />
                    {errors.currentLocation && <div style={{color: '#dc3545', fontSize: '12px', marginTop: '4px'}}>{errors.currentLocation}</div>}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600, color: '#333' }}>
                    🎓 Education
                  </h3>
                  <textarea
                    placeholder="Recent Education * (e.g., MBA in Finance from XYZ University, 2020)"
                    value={formData.recentEducation}
                    onChange={(e) => handleInputChange('recentEducation', e.target.value)}
                    rows={4}
                    style={{
                      width: '100%', padding: '12px 16px', border: '1px solid #e0e0e0',
                      borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical'
                    }}
                  />
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600, color: '#333' }}>
                    💼 Experience
                  </h3>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <select
                      value={formData.totalExperience}
                      onChange={(e) => handleInputChange('totalExperience', e.target.value)}
                      style={{
                        padding: '12px 16px', border: '1px solid #e0e0e0',
                        borderRadius: '8px', fontSize: '14px', outline: 'none'
                      }}
                    >
                      <option value="">Total Experience (Years)</option>
                      <option value="0">Fresher</option>
                      <option value="1">1 Year</option>
                      <option value="2">2 Years</option>
                      <option value="3">3 Years</option>
                      <option value="4">4 Years</option>
                      <option value="5">5 Years</option>
                      <option value="6-10">6-10 Years</option>
                      <option value="10+">10+ Years</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Current Company"
                      value={formData.currentCompany}
                      onChange={(e) => handleInputChange('currentCompany', e.target.value)}
                      style={{
                        padding: '12px 16px', border: '1px solid #e0e0e0',
                        borderRadius: '8px', fontSize: '14px', outline: 'none'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Current Position"
                      value={formData.currentPosition}
                      onChange={(e) => handleInputChange('currentPosition', e.target.value)}
                      style={{
                        padding: '12px 16px', border: '1px solid #e0e0e0',
                        borderRadius: '8px', fontSize: '14px', outline: 'none'
                      }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <input
                        type="number"
                        placeholder="Current CTC (LPA)"
                        value={formData.currentCTC}
                        onChange={(e) => handleInputChange('currentCTC', e.target.value)}
                        style={{
                          padding: '12px 16px', border: '1px solid #e0e0e0',
                          borderRadius: '8px', fontSize: '14px', outline: 'none'
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Expected CTC (LPA)"
                        value={formData.expectedCTC}
                        onChange={(e) => handleInputChange('expectedCTC', e.target.value)}
                        style={{
                          padding: '12px 16px', border: '1px solid #e0e0e0',
                          borderRadius: '8px', fontSize: '14px', outline: 'none'
                        }}
                      />
                    </div>
                    <select
                      value={formData.noticePeriod}
                      onChange={(e) => handleInputChange('noticePeriod', e.target.value)}
                      style={{
                        padding: '12px 16px', border: '1px solid #e0e0e0',
                        borderRadius: '8px', fontSize: '14px', outline: 'none'
                      }}
                    >
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

              {currentStep === 4 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#333' }}>
                      📄 Resume Upload
                    </h3>
                    {formData.resume && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setIsFullscreen(true)}
                          style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            border: '1px solid #0B2F5B', color: '#0B2F5B', background: 'none',
                            cursor: 'pointer', fontSize: '16px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          ⛶
                        </button>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileUpload(e.target.files[0])}
                          style={{ display: 'none' }}
                          id="resume-replace"
                        />
                        <label htmlFor="resume-replace" style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          border: '1px solid #0B2F5B', color: '#0B2F5B', background: 'none',
                          cursor: 'pointer', fontSize: '12px', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontWeight: 600
                        }}>
                          ↻
                        </label>
                        <button
                          onClick={() => handleFileUpload(null)}
                          style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            border: '1px solid #dc3545', color: '#dc3545', background: 'none',
                            cursor: 'pointer', fontSize: '16px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{
                    border: formData.resume ? 'none' : `2px dashed ${errors.resume ? '#dc3545' : '#e0e0e0'}`,
                    borderRadius: '12px',
                    padding: formData.resume ? '0' : '20px',
                    textAlign: 'center',
                    background: formData.resume ? 'transparent' : '#fafafa',
                    height: '450px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {!formData.resume ? (
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                        <p style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 500, color: '#333' }}>
                          Upload your resume *
                        </p>
                        <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#666' }}>
                          PDF, DOC, DOCX up to 5MB
                        </p>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileUpload(e.target.files[0])}
                          style={{ display: 'none' }}
                          id="resume-upload"
                        />
                        <label htmlFor="resume-upload" style={{
                          display: 'inline-block', padding: '12px 24px',
                          background: '#0B2F5B', color: '#fff', borderRadius: '8px',
                          cursor: 'pointer', fontSize: '14px', fontWeight: 600
                        }}>
                          Choose File
                        </label>
                      </div>
                    ) : (
                      <div 
                        style={{ 
                          height: '100%', position: 'relative',
                          borderRadius: '12px', overflow: 'hidden',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexDirection: 'column', background: '#fff'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(11, 47, 91, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        }}
                      >
                        <div style={{
                          width: '80px', height: '80px', border: '3px solid #0B2F5B',
                          borderRadius: '50%', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', color: '#0B2F5B', fontSize: '32px',
                          marginBottom: '20px', fontWeight: 'bold'
                        }}>
                          ✓
                        </div>
                        <p style={{ fontSize: '18px', fontWeight: 600, color: '#333', margin: '0 0 8px', textAlign: 'center', padding: '0 20px' }}>
                          {formData.resume.name}
                        </p>
                        <p style={{ fontSize: '14px', color: '#666', margin: '0 0 8px' }}>
                          {formData.resume.type === 'application/pdf' ? 'PDF Document' : 'Word Document'}
                        </p>
                        <p style={{ fontSize: '14px', color: '#666', margin: '0 0 20px' }}>
                          {(formData.resume.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div 
                            onClick={() => setIsFullscreen(true)}
                            style={{
                              background: 'none', border: '1px solid #0B2F5B', color: '#0B2F5B',
                              padding: '8px 16px', borderRadius: '20px', fontSize: '14px',
                              fontWeight: 500, cursor: 'pointer'
                            }}
                          >
                            View Resume
                          </div>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => handleFileUpload(e.target.files[0])}
                            style={{ display: 'none' }}
                            id="resume-replace-bottom"
                          />
                          <label 
                            htmlFor="resume-replace-bottom"
                            style={{
                              background: 'none', border: '1px solid #0B2F5B', color: '#0B2F5B',
                              padding: '8px 16px', borderRadius: '20px', fontSize: '14px',
                              fontWeight: 500, cursor: 'pointer'
                            }}
                          >
                            Replace
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.resume && <div style={{color: '#dc3545', fontSize: '12px', marginTop: '8px', textAlign: 'center'}}>{errors.resume}</div>}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div style={{
              padding: '20px 30px', borderTop: '1px solid #f0f0f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                style={{
                  padding: '12px 24px', border: '1px solid #e0e0e0',
                  background: '#fff', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 500,
                  opacity: currentStep === 1 ? 0.5 : 1
                }}
              >
                Previous
              </button>
              
              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  style={{
                    padding: '12px 24px', border: 'none',
                    background: '#0B2F5B', color: '#fff', borderRadius: '8px',
                    cursor: 'pointer', fontSize: '14px', fontWeight: 600
                  }}
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{
                    padding: '12px 24px', border: 'none',
                    background: isSubmitting ? '#ccc' : '#0B2F5B', 
                    color: '#fff', borderRadius: '8px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                    fontSize: '14px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div style={{
                        width: '16px', height: '16px', border: '2px solid #fff',
                        borderTop: '2px solid transparent', borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              )}
            </div>
          </>
        ) : (
          // Success Message
          <div style={{ padding: '60px 30px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
            <h2 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: 600, color: '#333' }}>
              Thank You for Submitting!
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: '16px', color: '#666', lineHeight: 1.5 }}>
              Your application for <strong>{jobTitle}</strong> has been successfully submitted.
              Our team will review your profile and get back to you shortly.
            </p>
            <p style={{ margin: '0 0 32px', fontSize: '14px', color: '#666' }}>
              Kindly check your email for further communication.
            </p>
            <button
              onClick={resetForm}
              style={{
                padding: '12px 32px', border: 'none',
                background: '#0B2F5B', color: '#fff', borderRadius: '8px',
                cursor: 'pointer', fontSize: '14px', fontWeight: 600
              }}
            >
              Close
            </button>
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
              padding: '20px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', background: 'rgba(0,0,0,0.8)'
            }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '18px' }}>
                {formData.resume.name}
              </h3>
              <button
                onClick={() => setIsFullscreen(false)}
                style={{
                  background: 'none', border: '2px solid #fff', color: '#fff',
                  width: '40px', height: '40px', borderRadius: '50%',
                  cursor: 'pointer', fontSize: '20px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ flex: 1, padding: '20px' }}>
              {formData.resume.type === 'application/pdf' ? (
                <iframe
                  src={formData.resumeUrl}
                  style={{
                    width: '100%', height: '100%', border: 'none',
                    borderRadius: '8px', background: '#fff'
                  }}
                  title="Resume Fullscreen"
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%', background: '#fff',
                  borderRadius: '8px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexDirection: 'column'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '24px', color: '#0B2F5B' }}>📄</div>
                  <p style={{ fontSize: '24px', fontWeight: 600, color: '#333', margin: '0 0 16px' }}>
                    {formData.resume.name}
                  </p>
                  <p style={{ fontSize: '18px', color: '#666', margin: 0 }}>
                    Word Document Preview Not Available
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}