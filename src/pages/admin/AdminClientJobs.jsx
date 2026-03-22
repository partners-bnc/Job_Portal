import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobService } from '../../services/jobService.js';
import { FiRefreshCw, FiBriefcase, FiEdit2, FiList, FiPlusSquare, FiSearch, FiEye } from 'react-icons/fi';

export default function AdminClientJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 'view' | 'form'
  const [activeTab, setActiveTab] = useState('view');
  // null = Add, object = Edit
  const [editingJob, setEditingJob] = useState(null);

  // Form State
  const initialForm = {
    jobCode: 'JPC-',
    jobTitle: '',
    businessUnit: '',
    clientId: '', // Will hold the selected Client's ID
    clientName: '', // Will hold the selected Client's Name
    location: '',
    state: '',
    country: 'India',
    payRate: '',
    experience: '',
    jobDescription: '',
    recruitmentManager: '',
    status: 'Active'
  };
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [jobsData, clientsData] = await Promise.all([
        jobService.fetchClientJobs(),
        jobService.fetchClients()
      ]);
      setJobs(jobsData || []);
      setClients(clientsData || []);
    } catch (err) {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter jobs based on search term
  const filteredJobs = useMemo(() => {
    if (!searchTerm.trim()) return jobs;
    const term = searchTerm.toLowerCase();
    return jobs.filter(j => 
      j.jobCode?.toLowerCase().includes(term) ||
      j.jobTitle?.toLowerCase().includes(term) ||
      j.clientName?.toLowerCase().includes(term) ||
      j.recruitmentManager?.toLowerCase().includes(term) ||
      j.location?.toLowerCase().includes(term)
    );
  }, [jobs, searchTerm]);

  const handleEditClick = (job) => {
    setEditingJob(job);
    setFormData({
      jobCode: job.jobCode || '',
      jobTitle: job.jobTitle || '',
      businessUnit: job.businessUnit || '',
      clientId: job.clientId || '',
      clientName: job.clientName || '',
      location: job.location || '',
      state: job.state || '',
      country: job.country || 'India',
      payRate: job.payRate || '',
      experience: job.experience || '',
      jobDescription: job.jobDescription || '',
      recruitmentManager: job.recruitmentManager || '',
      status: job.status || 'Active'
    });
    setActiveTab('form');
  };

  const handleAddClick = () => {
    setEditingJob(null);
    setFormData(initialForm);
    setActiveTab('form');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'clientSelection') {
      const selectedClient = clients.find(c => c.clientId === value);
      if (selectedClient) {
        setFormData(prev => ({
          ...prev,
          clientId: selectedClient.clientId,
          clientName: selectedClient.clientName
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          clientId: '',
          clientName: ''
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.jobCode || formData.jobCode === 'JPC-') {
      setError("Job Code is required and cannot be just 'JPC-'");
      return;
    }
    if (!formData.clientId) {
      setError("Please select a Client.");
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      const payload = {
        ...formData,
        createdBy: sessionStorage.getItem('bnc_admin_id') || 'Admin',
        modifiedBy: sessionStorage.getItem('bnc_admin_id') || 'Admin'
      };
      
      let res;
      if (editingJob) {
        res = await jobService.updateClientJob(payload);
      } else {
        res = await jobService.addClientJob(payload);
      }

      if (res && res.success) {
        setFormData(initialForm);
        setEditingJob(null);
        setActiveTab('view');
        fetchData(); // Refresh list
      } else {
        setError(res?.error || 'Failed to save job');
      }
    } catch (err) {
      setError('An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <div style={{ padding: '28px 30px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #0f766e, #042f2e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
          }}>
            <FiBriefcase size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1e293b' }}>Client Jobs</h1>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#94a3b8' }}>Post and manage jobs for onboarding clients</p>
          </div>
        </div>
        
        {/* Top Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
           <button onClick={fetchData} disabled={loading} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', border: '1px solid #e2e8f0', borderRadius: '12px',
              background: '#fff', color: '#475569', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s'
            }}>
              <FiRefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
            </button>
        </div>
      </div>

      {/* Controls Row: Switch Mode & Search */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        alignItems: 'center', 
        gap: '24px', 
        marginBottom: '32px'
      }}>
        {/* Left Area: Switch Mode Toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ 
            background: '#f1f5f9', 
            padding: '6px', 
            borderRadius: '16px', 
            display: 'flex', 
            gap: '4px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <button 
              onClick={() => setActiveTab('view')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 24px', borderRadius: '10px', border: 'none',
                background: activeTab === 'view' ? '#0f766e' : 'transparent', 
                color: activeTab === 'view' ? '#fff' : '#64748b', 
                cursor: 'pointer', fontSize: '14px', fontWeight: 800,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeTab === 'view' ? '0 4px 12px rgba(15, 118, 110, 0.2)' : 'none'
              }}
            >
              <FiList size={18} /> View Jobs
            </button>
            <button 
              onClick={handleAddClick}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 24px', borderRadius: '10px', border: 'none',
                background: activeTab === 'form' ? '#0f766e' : 'transparent', 
                color: activeTab === 'form' ? '#fff' : '#64748b', 
                cursor: 'pointer', fontSize: '14px', fontWeight: 800,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeTab === 'form' ? '0 4px 12px rgba(15, 118, 110, 0.2)' : 'none'
              }}
            >
              <FiPlusSquare size={18} /> {editingJob ? 'Edit Job' : 'Post Job'}
            </button>
          </div>
        </div>

        {/* Right Area: Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          {activeTab === 'view' ? (
            <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
              <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
              <input 
                type="text" 
                placeholder="Search by Job Code, Title, Client, Location..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 48px',
                  borderRadius: '16px',
                  border: '2px solid #e2e8f0',
                  fontSize: '14px',
                  background: '#fff',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0f766e'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          ) : <div />}
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#dc2626', fontSize: '13px', marginBottom: '20px', maxWidth: '800px', margin: '0 auto 20px' }}>
          {error}
        </div>
      )}

      {/* View Jobs Tab */}
      {activeTab === 'view' && (
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1400px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Actions</th>
                  {[
                    'Job Code', 'Job Title', 'Client', 'Location', 'Experience', 'Pay Rate', 
                    'Manager', 'Status', 'Created On'
                  ].map(h => (
                    <th key={h} style={{ 
                      padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, 
                      color: '#475569', whiteSpace: 'nowrap'
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>
                      <FiRefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
                      <span style={{ fontSize: '15px', fontWeight: 600 }}>Syncing Client Jobs...</span>
                    </td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '80px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                      {searchTerm ? 'No matches found.' : 'No job postings found. Switch to "Post Job" to create one!'}
                    </td>
                  </tr>
                ) : filteredJobs.map((j, i) => (
                  <tr key={j.jobCode || i} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => navigate(`/admin/client-jobs/${j.jobCode}`)} style={{
                          background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '6px 12px', 
                          borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                          fontSize: '12px', fontWeight: 700, transition: 'all 0.2s'
                        }} title="View Info">
                          <FiEye size={13} /> View
                        </button>
                        <button onClick={() => handleEditClick(j)} style={{
                          background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 12px', 
                          borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                          fontSize: '12px', fontWeight: 700, transition: 'all 0.2s'
                        }} title="Quick Edit">
                          <FiEdit2 size={13} />
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#0f766e', fontWeight: 800 }}>{j.jobCode}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#0f172a', fontWeight: 700 }}>{j.jobTitle}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569', fontWeight: 600 }}>{j.clientName}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>
                      {j.location}{j.state ? `, ${j.state}` : ''}{j.country ? `, ${j.country}` : ''}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{j.experience || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{j.payRate || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{j.recruitmentManager || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 800,
                        background: j.status?.toLowerCase() === 'active' ? '#ecfdf5' : '#fff1f2',
                        color: j.status?.toLowerCase() === 'active' ? '#059669' : '#e11d48',
                        border: `1px solid ${j.status?.toLowerCase() === 'active' ? '#a7f3d0' : '#fecdd3'}`,
                      }}>{j.status?.toUpperCase() || 'ACTIVE'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(j.createdOn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Form Tab */}
      {activeTab === 'form' && (
        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ borderBottom: '1px solid #f1f5f9', marginBottom: '32px', paddingBottom: '16px' }}>
            <h2 style={{ margin: '0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
              {editingJob ? `Update Job: ${formData.jobCode}` : 'Post New Client Job'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
              Fill out the required information perfectly.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Row 1 */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Job Code *</label>
              <input required name="jobCode" value={formData.jobCode} onChange={handleChange} disabled={!!editingJob}
                placeholder="e.g. JPC-113" 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', background: editingJob ? '#f8fafc' : '#fff', outline: 'none' }} />
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                {editingJob ? 'ID cannot be changed.' : 'Must start with JPC-'}
              </p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Job Title *</label>
              <input required name="jobTitle" value={formData.jobTitle} onChange={handleChange} placeholder="e.g. Senior Software Engineer" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            {/* Row 2 */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Client Database Reference *</label>
              <select 
                name="clientSelection" 
                value={formData.clientId} 
                onChange={handleChange} 
                required
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', background: '#fff', outline: 'none' }}
              >
                <option value="">-- Select an onboarded Client --</option>
                {clients.map(c => (
                  <option key={c.clientId} value={c.clientId}>{c.clientName} ({c.clientId})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Business Unit</label>
              <input list="buOptionsJob" name="businessUnit" value={formData.businessUnit} onChange={handleChange} placeholder="Select business branch..." style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
              <datalist id="buOptionsJob">
                <option value="Brocoli and Carrots Global Services" />
                <option value="IEDGE Knowledge center Pvt Ltd" />
              </datalist>
            </div>

            {/* Row 3 Location Details */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>City Location</label>
              <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Gurgaon" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>State</label>
                <input name="state" value={formData.state} onChange={handleChange} placeholder="e.g. Haryana" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Country</label>
                <input name="country" value={formData.country} onChange={handleChange} placeholder="India" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
            </div>

            {/* Row 4 Metrics */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Pay Rate / Salary</label>
              <input name="payRate" value={formData.payRate} onChange={handleChange} placeholder="e.g. ₹ 1000000-1200000" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Years of Experience</label>
              <input list="expOptions" name="experience" value={formData.experience} onChange={handleChange} placeholder="e.g. 3 Years 6 Months" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
              <datalist id="expOptions">
                <option value="0-2 Years" />
                <option value="3-5 Years" />
                <option value="5-8 Years" />
                <option value="8-12 Years" />
                <option value="12+ Years" />
              </datalist>
            </div>

            {/* Row 5 Management */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Recruitment Manager</label>
              <input list="rmOptions" name="recruitmentManager" value={formData.recruitmentManager} onChange={handleChange} placeholder="Select Manager..." style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
              <datalist id="rmOptions">
                <option value="Karan" />
                <option value="Neha Srivastava" />
                <option value="Preetima Gupata" />
                <option value="Afzal khan" />
              </datalist>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', background: '#fff', outline: 'none' }}>
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            {/* Row 6 Textarea */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Job Description Detailed</label>
              <textarea name="jobDescription" value={formData.jobDescription} onChange={handleChange} rows={6} placeholder="We're Hiring | Role Description..." style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }} />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '16px', marginTop: '16px', background: '#f8fafc', padding: '24px', borderRadius: '16px' }}>
              <button type="button" onClick={() => setActiveTab('view')} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>Cancel</button>
              <button type="submit" disabled={isSubmitting} style={{ flex: 1.5, padding: '14px', borderRadius: '12px', border: 'none', background: '#0f766e', color: '#fff', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(15, 118, 110, 0.2)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                {isSubmitting ? 'Saving Job...' : (editingJob ? 'Update Client Job' : 'Post Job')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
