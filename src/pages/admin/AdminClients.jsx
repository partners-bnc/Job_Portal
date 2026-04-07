import { useState, useEffect, useMemo } from 'react';
import { jobService } from '../../services/jobService.js';
import { FiRefreshCw, FiExternalLink, FiBriefcase, FiEdit2, FiList, FiPlusSquare, FiSearch, FiTrash2, FiPlus, FiX, FiEye } from 'react-icons/fi';

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 'view' | 'form'
  const [activeTab, setActiveTab] = useState('view');
  // null = Add, object = Edit/View
  const [editingClient, setEditingClient] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  // Form State
  const initialForm = {
    clientId: '',
    clientName: '',
    contactNumber: '',
    email: '',
    website: '',
    industry: '',
    status: 'Active',
    primaryOwner: '',
    businessUnit: '',
    displayOnJobPosting: 'No',
    reportingContacts: [{ name: '', email: '', contact: '', department: '' }]
  };
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await jobService.fetchClients();
      setClients(data || []);
    } catch (err) {
      setError('Failed to load clients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    const term = searchTerm.toLowerCase();
    return clients.filter(c => 
      c.clientId?.toLowerCase().includes(term) ||
      c.clientName?.toLowerCase().includes(term) ||
      c.contactNumber?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.industry?.toLowerCase().includes(term)
    );
  }, [clients, searchTerm]);

  const handleEditClick = (client) => {
    setEditingClient(client);
    setViewMode(false);
    setFormData({
      clientId: client.clientId || '',
      clientName: client.clientName || '',
      website: client.website || '',
      industry: client.industry || '',
      status: client.status || 'Active',
      primaryOwner: client.primaryOwner || '',
      businessUnit: client.businessUnit || '',
      displayOnJobPosting: client.displayOnJobPosting || 'No',
      reportingContacts: client.reportingContacts?.length ? [...client.reportingContacts] : [{ name: '', email: '', contact: '', department: '' }]
    });
    setActiveTab('form');
  };

  const handleViewClick = (client) => {
    setEditingClient(client);
    setViewMode(true);
    setFormData({
      clientId: client.clientId || '',
      clientName: client.clientName || '',
      website: client.website || '',
      industry: client.industry || '',
      status: client.status || 'Active',
      primaryOwner: client.primaryOwner || '',
      businessUnit: client.businessUnit || '',
      displayOnJobPosting: client.displayOnJobPosting || 'No',
      reportingContacts: client.reportingContacts?.length ? [...client.reportingContacts] : [{ name: '', email: '', contact: '', department: '' }]
    });
    setActiveTab('form');
  };

  const handleAddClick = () => {
    setEditingClient(null);
    setViewMode(false);
    setFormData(initialForm);
    setActiveTab('form');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReportingContactChange = (index, field, value) => {
    const newContacts = [...formData.reportingContacts];
    newContacts[index][field] = value;
    setFormData(prev => ({ ...prev, reportingContacts: newContacts }));
  };

  const addReportingContact = () => {
    setFormData(prev => ({ ...prev, reportingContacts: [...prev.reportingContacts, { name: '', email: '', contact: '', department: '' }] }));
  };

  const removeReportingContact = (index) => {
    setFormData(prev => ({ ...prev, reportingContacts: prev.reportingContacts.filter((_, i) => i !== index) }));
  };

  const handleDeleteClient = async (client) => {
    if (!window.confirm("Are you sure you want to permanently delete this client?")) return;
    setLoading(true);
    try {
       const res = await jobService.deleteClient(client.clientId);
       if (res.success) {
           fetchClients();
       } else {
           setError(res.error || "Failed to delete client");
       }
    } catch(err) {
       setError("Error deleting client.");
    } finally {
       setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Ensure proper URL format for website
      let formattedWebsite = formData.website;
      if (formattedWebsite && !formattedWebsite.startsWith('http')) {
        formattedWebsite = `https://${formattedWebsite}`;
      }

      const payload = {
        ...formData,
        website: formattedWebsite,
        createdBy: sessionStorage.getItem('bnc_admin_name') || sessionStorage.getItem('bnc_admin_id') || 'Admin',
        modifiedBy: sessionStorage.getItem('bnc_admin_name') || sessionStorage.getItem('bnc_admin_id') || 'Admin'
      };
      
      let res;
      if (editingClient) {
        res = await jobService.updateClient(payload);
      } else {
        res = await jobService.addClient(payload);
      }

      if (res && res.success) {
        setFormData(initialForm);
        setEditingClient(null);
        setActiveTab('view');
        fetchClients();
      } else {
        setError(res?.error || 'Failed to save client');
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
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  };

  return (
    <div style={{ padding: '28px 30px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #0B2F5B, #1a4a8a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
          }}>
            <FiBriefcase size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1e293b' }}>Client Manager</h1>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#94a3b8' }}>Manage your view or client</p>
          </div>
        </div>
        
        {/* Top Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
           <button onClick={fetchClients} disabled={loading} style={{
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
              onClick={() => {
                setActiveTab('view');
                setEditingClient(null);
                setViewMode(false);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 24px', borderRadius: '10px', border: 'none',
                background: activeTab === 'view' ? '#0B2F5B' : 'transparent', 
                color: activeTab === 'view' ? '#fff' : '#64748b', 
                cursor: 'pointer', fontSize: '14px', fontWeight: 800,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeTab === 'view' ? '0 4px 12px rgba(11, 47, 91, 0.2)' : 'none'
              }}
            >
              <FiList size={18} /> View Client
            </button>
            <button 
              onClick={handleAddClick}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 24px', borderRadius: '10px', border: 'none',
                background: activeTab === 'form' ? '#0B2F5B' : 'transparent', 
                color: activeTab === 'form' ? '#fff' : '#64748b', 
                cursor: 'pointer', fontSize: '14px', fontWeight: 800,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeTab === 'form' ? '0 4px 12px rgba(11, 47, 91, 0.2)' : 'none'
              }}
            >
              {viewMode ? <FiEye size={18} /> : <FiPlusSquare size={18} />} 
              {viewMode ? 'View Details' : (editingClient ? 'Edit Client' : 'Add Client')}
            </button>
          </div>
        </div>

        {/* Right Area: Search Bar (Starts from Centre and goes right) */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          {activeTab === 'view' ? (
            <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
              <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
              <input 
                type="text" 
                placeholder="Search by ID, Name, Contact, Email..." 
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
                onFocus={(e) => e.target.style.borderColor = '#0B2F5B'}
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

      {/* View Clients Tab */}
      {activeTab === 'view' && (
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1600px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Actions</th>
                  {[
                    'Client Id', 'Client Name', 'Reporting Contacts', 'Website', 'Industry', 'Status', 
                    'Manage by', 'Business Unit', 'Display on Job', 'Created by', 
                    'Created On', 'Modified On', 'Modified By'
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
                    <td colSpan={15} style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>
                      <FiRefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
                      <span style={{ fontSize: '15px', fontWeight: 600 }}>Syncing with Database...</span>
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={15} style={{ padding: '80px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                      {searchTerm ? 'No matches found for your search.' : 'No clients found. Switch to "Add Client" to create one!'}
                    </td>
                  </tr>
                ) : filteredClients.map((c, i) => (
                  <tr key={c.clientId || i} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <button title="View" onClick={() => handleViewClick(c)} style={{
                          background: 'transparent', color: '#64748b', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }} onMouseEnter={e => e.currentTarget.style.color = '#334155'} onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
                          <FiEye size={16} />
                        </button>
                        <button title="Edit" onClick={() => handleEditClick(c)} style={{
                          background: 'transparent', color: '#2563eb', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }} onMouseEnter={e => e.currentTarget.style.opacity = '0.7'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                          <FiEdit2 size={16} />
                        </button>
                        <button title="Delete" onClick={() => handleDeleteClient(c)} style={{
                          background: 'transparent', color: '#ef4444', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }} onMouseEnter={e => e.currentTarget.style.opacity = '0.7'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{c.clientId}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#0f172a', fontWeight: 700 }}>{c.clientName}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px' }}>
                        <span style={{ fontWeight: 800, color: '#0B2F5B' }}>{c.reportingContacts?.length || 0}</span> Contact(s)
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                      {c.website ? (
                        <a href={c.website} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          Visit <FiExternalLink size={12} />
                        </a>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{c.industry || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 800,
                        background: c.status?.toLowerCase() === 'active' ? '#ecfdf5' : '#fff1f2',
                        color: c.status?.toLowerCase() === 'active' ? '#059669' : '#e11d48',
                        border: `1px solid ${c.status?.toLowerCase() === 'active' ? '#a7f3d0' : '#fecdd3'}`,
                      }}>{c.status?.toUpperCase() || 'ACTIVE'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{c.primaryOwner || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{c.businessUnit || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{c.displayOnJobPosting || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{c.createdBy || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(c.createdOn)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(c.modifiedOn)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{c.modifiedBy || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Client Tab */}
      {activeTab === 'form' && (
        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ borderBottom: '1px solid #f1f5f9', marginBottom: '32px', paddingBottom: '16px' }}>
            <h2 style={{ margin: '0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
              {viewMode ? 'View Client Details' : (editingClient ? 'Update Existing Client' : 'Onboard New Client')}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
              {viewMode ? 'Reviewing the details synced from the database.' : 'Please fill in the details below to sync with the primary database.'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* ID Input */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Client Id</label>
              <input name="clientId" value={formData.clientId} onChange={handleChange} disabled={!!editingClient}
                placeholder={editingClient ? '' : 'Auto-generating ID...'} 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', background: editingClient ? '#f8fafc' : '#fff', outline: 'none' }} />
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                {editingClient ? 'ID is fixed and cannot be edited for existing records.' : 'You can type a custom ID or leave empty for auto-increment.'}
              </p>
            </div>

            {/* General Info */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Client Company Name *</label>
              <input required name="clientName" value={formData.clientName} onChange={handleChange} disabled={viewMode} placeholder="Enter official company name" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: viewMode ? '#f8fafc' : '#fff' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Website URL</label>
              <input name="website" value={formData.website} onChange={handleChange} disabled={viewMode} placeholder="www.yourlink.com" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: viewMode ? '#f8fafc' : '#fff' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Industry Type</label>
              <input name="industry" value={formData.industry} onChange={handleChange} disabled={viewMode} placeholder="e.g. Fintech, Healthcare" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: viewMode ? '#f8fafc' : '#fff' }} />
            </div>
            
            {/* Multiple Reporting Contacts Section */}
            <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>Reporting Contacts</h3>
                {!viewMode && (
                  <button type="button" onClick={addReportingContact} style={{ padding: '6px 12px', background: '#0B2F5B', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiPlus size={14} /> Add Contact
                  </button>
                )}
              </div>
              
              {formData.reportingContacts.map((contact, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: viewMode ? '1fr 1fr 1fr 1fr' : 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) auto', gap: '12px', paddingBottom: '16px', borderBottom: index !== formData.reportingContacts.length - 1 ? '1px solid #cbd5e1' : 'none', marginBottom: index !== formData.reportingContacts.length - 1 ? '16px' : '0', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>Department</label>
                    <input required value={contact.department} onChange={e => handleReportingContactChange(index, 'department', e.target.value)} disabled={viewMode} placeholder="e.g. Tech, HR" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', outline: 'none', background: viewMode ? '#f1f5f9' : '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>Contact Name</label>
                    <input required value={contact.name} onChange={e => handleReportingContactChange(index, 'name', e.target.value)} disabled={viewMode} placeholder="e.g. John Doe" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', outline: 'none', background: viewMode ? '#f1f5f9' : '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>Email</label>
                    <input type="email" required value={contact.email} onChange={e => handleReportingContactChange(index, 'email', e.target.value)} disabled={viewMode} placeholder="john@company.com" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', outline: 'none', background: viewMode ? '#f1f5f9' : '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>Phone Number</label>
                    <input required value={contact.contact} onChange={e => handleReportingContactChange(index, 'contact', e.target.value)} disabled={viewMode} placeholder="+91 9876543210" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', outline: 'none', background: viewMode ? '#f1f5f9' : '#fff' }} />
                  </div>
                  {!viewMode && (
                    <button type="button" onClick={() => removeReportingContact(index)} disabled={formData.reportingContacts.length === 1} style={{ padding: '10px', background: formData.reportingContacts.length === 1 ? '#f1f5f9' : '#fef2f2', color: formData.reportingContacts.length === 1 ? '#cbd5e1' : '#ef4444', border: formData.reportingContacts.length === 1 ? '1px solid #e2e8f0' : '1px solid #fecaca', borderRadius: '10px', cursor: formData.reportingContacts.length === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}>
                      <FiX size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Custom Dropdowns using datalist */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Manage by</label>
              <input list="manageByOptions" name="primaryOwner" value={formData.primaryOwner} onChange={handleChange} disabled={viewMode} placeholder="Search or add owner..." style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: viewMode ? '#f8fafc' : '#fff' }} />
              <datalist id="manageByOptions">
                <option value="Neha Srivastava" />
                <option value="Preetima Gupata" />
                <option value="Karan" />
                <option value="Afzal khan" />
              </datalist>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Business Unit</label>
              <input list="businessUnitOptions" name="businessUnit" value={formData.businessUnit} onChange={handleChange} disabled={viewMode} placeholder="Select business branch..." style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: viewMode ? '#f8fafc' : '#fff' }} />
              <datalist id="businessUnitOptions">
                <option value="Brocoli and Carrots Global Services" />
                <option value="IEDGE Knowledge center Pvt Ltd" />
              </datalist>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Account Status</label>
              <select name="status" value={formData.status} onChange={handleChange} disabled={viewMode} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', background: viewMode ? '#f8fafc' : '#fff', outline: 'none' }}>
                <option value="Active">Active</option>
                <option value="Deactive">Deactive</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Display on Job Portal</label>
              <select name="displayOnJobPosting" value={formData.displayOnJobPosting} onChange={handleChange} disabled={viewMode} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', background: viewMode ? '#f8fafc' : '#fff', outline: 'none' }}>
                <option value="Yes">Show on Portal</option>
                <option value="No">Hide from Portal</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '16px', marginTop: '16px', background: '#f8fafc', padding: '24px', borderRadius: '16px' }}>
              <button type="button" onClick={() => setActiveTab('view')} style={{ flex: viewMode ? 2 : 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                {viewMode ? 'Back to List' : 'Cancel'}
              </button>
              {!viewMode && (
                <button type="submit" disabled={isSubmitting} style={{ flex: 1.5, padding: '14px', borderRadius: '12px', border: 'none', background: '#0B2F5B', color: '#fff', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(11, 47, 91, 0.2)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  {isSubmitting ? 'Syncing...' : (editingClient ? 'Update Database' : 'Submit Registration')}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
