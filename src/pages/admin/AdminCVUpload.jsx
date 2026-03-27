import { useState, useRef } from 'react';
import { jobService } from '../../services/jobService.js';
import { parseResumeForDatabase } from '../../services/resumeParser.js';
import {
  FiUpload, FiFile, FiX, FiCheck, FiZap, FiLoader, FiUser,
  FiPhone, FiMail, FiMapPin, FiBriefcase, FiBookOpen, FiTag,
  FiAward, FiAlignLeft, FiCheckCircle, FiAlertCircle, FiChevronRight, FiDatabase
} from 'react-icons/fi';

// ── Helpers ──
const SOURCE_OPTIONS = ['LinkedIn', 'Naukri', 'Indeed', 'Referral', 'Walk-in', 'Company Website', 'Other'];

function cvAge(dateStr) {
  if (!dateStr) return '—';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const then = new Date(dateStr);
  then.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  return `${Math.floor(diffDays / 30)} months ago`;
}

const PROGRESS_STAGES = [
  { key: 'extracting', label: 'Reading resume content' },
  { key: 'contact',    label: 'Extracting contact details' },
  { key: 'education',  label: 'Parsing education info' },
  { key: 'experience', label: 'Analyzing work experience' },
  { key: 'done',       label: 'Completed' },
];

function ScanBar({ parseProgress, label }) {
  const currentIndex = PROGRESS_STAGES.findIndex(s => s.key === parseProgress);
  const pct = parseProgress === 'done' ? 100 : Math.max(8, ((currentIndex + 1) / PROGRESS_STAGES.length) * 100);
  return (
    <div style={{ padding: '16px 18px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: parseProgress === 'done' ? '#0B2F5B' : '#fff',
          border: parseProgress === 'done' ? 'none' : '2px solid #0B2F5B',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: parseProgress === 'done' ? '#fff' : '#0B2F5B',
          animation: parseProgress === 'done' ? 'none' : 'spin 2s linear infinite',
        }}>
          {parseProgress === 'done' ? <FiCheck size={14} /> : <FiLoader size={14} />}
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
            {label || (parseProgress === 'done' ? 'Parsing Complete' : 'AI Scanning...')}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            {PROGRESS_STAGES.find(s => s.key === parseProgress)?.label || ''}
          </div>
        </div>
      </div>
      <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: 'linear-gradient(90deg, #0B2F5B, #1a4a8a)',
          borderRadius: '2px', transition: 'width 0.5s ease'
        }} />
      </div>
    </div>
  );
}

function FieldRow({ icon, label, value, editable, onChange, multiline }) {
  const inputStyle = {
    width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px',
    padding: '8px 10px', fontSize: '13px', outline: 'none',
    fontFamily: 'inherit', resize: multiline ? 'vertical' : 'none',
    boxSizing: 'border-box', background: '#fff', color: '#1e293b'
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', alignItems: 'start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '9px', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
        {icon} {label}
      </div>
      {editable ? (
        multiline
          ? <textarea rows={3} value={value || ''} onChange={e => onChange(e.target.value)} style={inputStyle} />
          : <input value={value || ''} onChange={e => onChange(e.target.value)} style={inputStyle} />
      ) : (
        <div style={{ padding: '9px 10px', fontSize: '13px', color: value ? '#1e293b' : '#cbd5e1' }}>
          {value || '—'}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// SINGLE CV UPLOAD
// ═══════════════════════════════════════════
function SingleUpload({ adminName }) {
  const [file, setFile] = useState(null);
  const [source, setSource] = useState('');
  const [parseProgress, setParseProgress] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [wasUpdate, setWasUpdate] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const handleFile = (f) => {
    if (!f) { setFile(null); setParsed(null); return; }
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(f.type)) { setError('Only PDF, DOC, or DOCX files are allowed.'); return; }
    if (f.size > 5 * 1024 * 1024) { setError('File must be under 5MB.'); return; }
    setFile(f);
    setParsed(null);
    setSavedId(null);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleParse = async () => {
    if (!file) return;
    if (!source) { setError('Please select a source before parsing.'); return; }
    setError('');
    setIsParsing(true);
    setParseProgress('extracting');
    setParsed(null);
    try {
      const result = await parseResumeForDatabase(file, (stage) => setParseProgress(stage));
      setParsed({ ...result.data });
    } catch (e) {
      setError('Failed to parse resume. Please try again.');
      setParseProgress('');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    if (!parsed) return;
    setIsSaving(true);
    setError('');
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1];
        const result = await jobService.uploadCVToDatabase({
          ...parsed,
          source,
          uploadedBy: adminName,
          resumeData: base64,
          resumeFileName: file.name,
        });
        if (result.success) {
          setSavedId(result.applicantId);
          setWasUpdate(result.isUpdate === true);
          setFile(null); setParsed(null); setSource(''); setParseProgress('');
        } else {
          setError(result.error || 'Failed to save. Please try again.');
        }
        setIsSaving(false);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setError('Error saving CV: ' + e.message);
      setIsSaving(false);
    }
  };

  const updateField = (key, val) => setParsed(prev => ({ ...prev, [key]: val }));

  if (savedId) {
    const isUpdated = wasUpdate;
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', animation: 'fadeIn 0.4s ease' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: isUpdated
            ? 'linear-gradient(135deg, #d97706, #f59e0b)'
            : 'linear-gradient(135deg, #0B2F5B, #1a4a8a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', color: '#fff'
        }}>
          <FiCheckCircle size={28} />
        </div>
        <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>
          {isUpdated ? 'Existing Record Updated!' : 'CV Saved Successfully!'}
        </h3>
        <div style={{
          display: 'inline-block', margin: '8px 0 12px',
          background: isUpdated
            ? 'linear-gradient(135deg, #fffbeb, #fef3c7)'
            : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          border: isUpdated ? '1px solid #fcd34d' : '1px solid #93c5fd',
          borderRadius: '12px',
          padding: '10px 24px', fontSize: '15px', fontWeight: 700,
          color: isUpdated ? '#b45309' : '#1e40af'
        }}>
          Applicant ID: #{savedId}
        </div>
        <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 8px' }}>
          {isUpdated
            ? 'A matching candidate was found in the database. Their record has been updated with the latest data & resume.'
            : 'The candidate has been added to the Database sheet.'}
        </p>
        {isUpdated && (
          <div style={{
            display: 'inline-block', margin: '0 0 20px',
            background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px',
            padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: '#92400e'
          }}>
            ⚡ Matched via Email or Phone Number — old AI analysis has been cleared for re-evaluation.
          </div>
        )}
        <br />
        <button onClick={() => { setSavedId(null); setWasUpdate(false); }} style={{
          padding: '10px 24px', background: '#0B2F5B', color: '#fff',
          border: 'none', borderRadius: '10px', cursor: 'pointer',
          fontSize: '13px', fontWeight: 600
        }}>
          Upload Another CV
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* File Upload Zone */}
      {!isParsing && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => !file && fileInputRef.current?.click()}
          style={{
            border: file ? '2px solid #0B2F5B40' : '2px dashed #d1d5db',
            borderRadius: '14px', padding: file ? '14px 16px' : '32px 20px',
            background: file ? '#f8fafc' : '#fafbfc',
            cursor: file ? 'default' : 'pointer', textAlign: 'center',
            transition: 'all 0.2s'
          }}>
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx"
            onChange={e => handleFile(e.target.files[0])}
            style={{ display: 'none' }} />
          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                background: 'linear-gradient(135deg, #0B2F5B, #1a4a8a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
              }}><FiFile size={18} /></div>
              <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <button onClick={e => { e.stopPropagation(); handleFile(null); setParseProgress(''); }} style={{
                width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #fecaca',
                background: '#fff', color: '#dc3545', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}><FiX size={14} /></button>
            </div>
          ) : (
            <>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px', margin: '0 auto 12px',
                background: '#0B2F5B10', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B2F5B'
              }}><FiUpload size={22} /></div>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>Drop resume here or click to browse</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>PDF, DOC, DOCX • Max 5MB</p>
            </>
          )}
        </div>
      )}

      {/* Source & Uploaded By */}
      {!isParsing && file && !parsed && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>Source *</label>
            <select value={source} onChange={e => setSource(e.target.value)} style={{
              width: '100%', padding: '10px 12px', border: `1px solid ${!source && error ? '#dc3545' : '#e2e8f0'}`,
              borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff', boxSizing: 'border-box'
            }}>
              <option value="">Select source...</option>
              {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>Uploaded By</label>
            <div style={{
              padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px',
              fontSize: '13px', color: '#1e293b', background: '#f8fafc',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <FiUser size={13} style={{ color: '#0B2F5B' }} />
              {adminName}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
          <FiAlertCircle size={14} style={{ color: '#dc3545', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: '#dc2626' }}>{error}</span>
        </div>
      )}

      {/* Scanning */}
      {isParsing && <ScanBar parseProgress={parseProgress} />}

      {/* Parse Button */}
      {file && !isParsing && !parsed && (
        <button onClick={handleParse} style={{
          padding: '12px 20px', background: 'linear-gradient(135deg, #0B2F5B, #1a4a8a)',
          color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer',
          fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '8px'
        }}>
          <FiZap size={14} /> Parse Resume with AI
        </button>
      )}

      {/* Parsed Preview */}
      {parsed && !isParsing && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <div style={{
            padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: '10px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <FiCheckCircle size={16} style={{ color: '#0B2F5B' }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e40af' }}>Resume parsed successfully! Review & edit before saving.</div>
            </div>
          </div>

          <div style={{
            border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden'
          }}>
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 700, color: '#475569', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Extracted Data — Click any field to edit
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <FieldRow icon={<FiUser size={12} />} label="Full Name" value={parsed.candidateName} editable onChange={v => updateField('candidateName', v)} />
              <FieldRow icon={<FiMail size={12} />} label="Email" value={parsed.email} editable onChange={v => updateField('email', v)} />
              <FieldRow icon={<FiPhone size={12} />} label="Mobile" value={parsed.contactNumber} editable onChange={v => updateField('contactNumber', v)} />
              <FieldRow icon={<FiMapPin size={12} />} label="Location" value={parsed.currentLocation} editable onChange={v => updateField('currentLocation', v)} />
              <FieldRow icon={<FiBriefcase size={12} />} label="Company" value={parsed.currentCompany} editable onChange={v => updateField('currentCompany', v)} />
              <FieldRow icon={<FiBriefcase size={12} />} label="Position" value={parsed.currentPosition} editable onChange={v => updateField('currentPosition', v)} />
              <FieldRow icon={<FiBookOpen size={12} />} label="Education" value={parsed.education} editable multiline onChange={v => updateField('education', v)} />
              <FieldRow icon={<FiTag size={12} />} label="Skills" value={parsed.skills} editable multiline onChange={v => updateField('skills', v)} />
              <FieldRow icon={<FiAward size={12} />} label="Certifications" value={parsed.certifications} editable multiline onChange={v => updateField('certifications', v)} />
              <FieldRow icon={<FiAlignLeft size={12} />} label="Summary" value={parsed.summary} editable multiline onChange={v => updateField('summary', v)} />
            </div>
          </div>

          <button onClick={handleSave} disabled={isSaving} style={{
            marginTop: '14px', padding: '12px 20px', width: '100%',
            background: isSaving ? '#94a3b8' : 'linear-gradient(135deg, #059669, #047857)',
            color: '#fff', border: 'none', borderRadius: '10px', cursor: isSaving ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '8px'
          }}>
            {isSaving ? <><FiLoader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><FiCheck size={14} /> Confirm & Save to Database</>}
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// BULK CV UPLOAD
// ═══════════════════════════════════════════
function BulkUpload({ adminName }) {
  const [files, setFiles] = useState([]);
  const [source, setSource] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const STATUS = { WAITING: 'waiting', PARSING: 'parsing', SAVING: 'saving', DONE: 'done', UPDATED: 'updated', FAILED: 'failed' };

  const handleFiles = (fileList) => {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const valid = Array.from(fileList).filter(f => allowed.includes(f.type) && f.size <= 5 * 1024 * 1024);
    if (valid.length < fileList.length) setError(`${fileList.length - valid.length} file(s) skipped (invalid type or >5MB).`);
    else setError('');
    setFiles(valid);
    setResults(valid.map(f => ({ name: f.name, status: STATUS.WAITING, id: null, error: null })));
    setStarted(false);
  };

  const statusColor = { [STATUS.WAITING]: '#94a3b8', [STATUS.PARSING]: '#f59e0b', [STATUS.SAVING]: '#3b82f6', [STATUS.DONE]: '#059669', [STATUS.UPDATED]: '#d97706', [STATUS.FAILED]: '#dc3545' };
  const statusLabel = { [STATUS.WAITING]: 'Waiting', [STATUS.PARSING]: 'Parsing...', [STATUS.SAVING]: 'Saving...', [STATUS.DONE]: 'Added', [STATUS.UPDATED]: 'Updated', [STATUS.FAILED]: 'Failed' };

  const updateResult = (i, patch) => setResults(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const handleStart = async () => {
    if (!source) { setError('Please select a source.'); return; }
    if (!files.length) { setError('No files selected.'); return; }
    setError('');
    setStarted(true);
    setProcessing(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Parse
        updateResult(i, { status: STATUS.PARSING });
        const result = await parseResumeForDatabase(file, () => {});

        // Read file as base64
        updateResult(i, { status: STATUS.SAVING });
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Save
        const saveResult = await jobService.uploadCVToDatabase({
          ...result.data,
          source,
          uploadedBy: adminName,
          resumeData: base64,
          resumeFileName: file.name,
        });

        if (saveResult.success) {
          const finalStatus = saveResult.isUpdate ? STATUS.UPDATED : STATUS.DONE;
          updateResult(i, { status: finalStatus, id: saveResult.applicantId });
        } else {
          updateResult(i, { status: STATUS.FAILED, error: saveResult.error || 'Save failed' });
        }
      } catch (e) {
        // AI parsing failed (e.g., rate limit) — stop processing, mark remaining as failed
        updateResult(i, { status: STATUS.FAILED, error: e.message });
        for (let j = i + 1; j < files.length; j++) {
          updateResult(j, { status: STATUS.FAILED, error: 'Stopped — AI parsing failed on previous resume' });
        }
        break;
      }
    }

    setProcessing(false);
  };

  const doneCount = results.filter(r => r.status === STATUS.DONE).length;
  const updatedCount = results.filter(r => r.status === STATUS.UPDATED).length;
  const failedCount = results.filter(r => r.status === STATUS.FAILED).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* File Drop Zone */}
      {!started && (
        <div
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: files.length ? '2px solid #0B2F5B40' : '2px dashed #d1d5db',
            borderRadius: '14px', padding: '32px 20px',
            background: '#fafbfc', cursor: 'pointer', textAlign: 'center'
          }}>
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" multiple
            onChange={e => handleFiles(e.target.files)}
            style={{ display: 'none' }} />
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px', margin: '0 auto 12px',
            background: '#0B2F5B10', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B2F5B'
          }}><FiUpload size={22} /></div>
          {files.length > 0 ? (
            <>
              <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#0B2F5B' }}>{files.length} file{files.length > 1 ? 's' : ''} selected</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Click to change selection</p>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>Drop multiple resumes or click to browse</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>PDF, DOC, DOCX • Max 5MB each</p>
            </>
          )}
        </div>
      )}

      {/* Source & Controls */}
      {files.length > 0 && !started && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>Source (applies to all) *</label>
            <select value={source} onChange={e => setSource(e.target.value)} style={{
              width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
              borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff', boxSizing: 'border-box'
            }}>
              <option value="">Select source...</option>
              {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>Uploaded By</label>
            <div style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#1e293b', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiUser size={13} style={{ color: '#0B2F5B' }} /> {adminName}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', gap: '8px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
          <FiAlertCircle size={14} style={{ color: '#dc3545', flexShrink: 0, marginTop: '1px' }} />
          <span style={{ fontSize: '12px', color: '#dc2626' }}>{error}</span>
        </div>
      )}

      {/* Progress List */}
      {files.length > 0 && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          {started && (
            <div style={{ padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Progress: {doneCount + updatedCount + failedCount} / {files.length}</span>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>
                <span style={{ color: '#059669' }}>{doneCount} added</span>
                {updatedCount > 0 && <span style={{ color: '#d97706' }}> • {updatedCount} updated</span>}
                {failedCount > 0 && <span style={{ color: '#dc3545' }}> • {failedCount} failed</span>}
              </span>
            </div>
          )}
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {results.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 16px', borderBottom: i < results.length - 1 ? '1px solid #f1f5f9' : 'none',
                background: r.status === STATUS.PARSING || r.status === STATUS.SAVING ? '#fffbeb' : r.status === STATUS.UPDATED ? '#fffbeb' : '#fff'
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                  background: r.status === STATUS.DONE ? '#059669' : r.status === STATUS.UPDATED ? '#d97706' : r.status === STATUS.FAILED ? '#dc3545' : r.status === STATUS.WAITING ? '#f1f5f9' : '#f59e0b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                }}>
                  {r.status === STATUS.DONE ? <FiCheck size={12} /> :
                   r.status === STATUS.FAILED ? <FiX size={12} /> :
                   r.status === STATUS.WAITING ? <FiFile size={12} style={{ color: '#94a3b8' }} /> :
                   <FiLoader size={12} style={{ animation: 'spin 1s linear infinite' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                  {r.error && <div style={{ fontSize: '11px', color: '#dc2626' }}>{r.error}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {r.id && (
                    <span style={{
                      fontSize: '11px', fontWeight: 700,
                      color: r.status === STATUS.UPDATED ? '#b45309' : '#059669',
                      background: r.status === STATUS.UPDATED ? '#fffbeb' : '#f0fdf4',
                      padding: '2px 8px', borderRadius: '10px'
                    }}>
                      {r.status === STATUS.UPDATED ? '↻' : '+'} ID #{r.id}
                    </span>
                  )}
                  <span style={{ fontSize: '11px', fontWeight: 600, color: statusColor[r.status] }}>{statusLabel[r.status]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {files.length > 0 && !started && (
        <button onClick={handleStart} style={{
          padding: '12px', background: 'linear-gradient(135deg, #0B2F5B, #1a4a8a)',
          color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer',
          fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }}>
          <FiZap size={14} /> Parse & Upload All {files.length} CVs
        </button>
      )}

      {started && !processing && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginBottom: '8px' }}>
            ✓ Batch complete — {doneCount} added{updatedCount > 0 ? `, ${updatedCount} updated` : ''}{failedCount > 0 ? `, ${failedCount} failed` : ''}
          </div>
          <button onClick={() => { setFiles([]); setResults([]); setStarted(false); }} style={{
            padding: '10px 24px', background: '#0B2F5B', color: '#fff',
            border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600
          }}>Upload Another Batch</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════
export default function AdminCVUpload() {
  const [mode, setMode] = useState('single');
  const adminName = sessionStorage.getItem('bnc_admin_name') || sessionStorage.getItem('bnc_admin_id') || 'Admin';

  const tabStyle = (active) => ({
    flex: 1, padding: '11px 16px', border: 'none', cursor: 'pointer',
    borderRadius: '10px', fontWeight: 700, fontSize: '13px',
    transition: 'all 0.2s', fontFamily: 'inherit',
    background: active ? '#0B2F5B' : 'transparent',
    color: active ? '#fff' : '#64748b',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
  });

  return (
    <div style={{ padding: '28px 30px', maxWidth: '760px' }}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
        <div style={{
          width: '46px', height: '46px', borderRadius: '14px',
          background: 'linear-gradient(135deg, #0B2F5B, #1a4a8a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
        }}><FiDatabase size={20} /></div>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1e293b' }}>Upload Candidate CVs</h1>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#94a3b8' }}>
            Parse & store resumes into the central Database
          </p>
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0',
        boxShadow: '0 4px 24px rgba(11,47,91,0.06)', overflow: 'hidden'
      }}>
        {/* Mode Toggle */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f4f8' }}>
          <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', borderRadius: '12px', padding: '4px' }}>
            <button style={tabStyle(mode === 'single')} onClick={() => setMode('single')}>
              <FiFile size={15} /> <span>Single CV</span>
            </button>
            <button style={tabStyle(mode === 'bulk')} onClick={() => setMode('bulk')}>
              <FiUpload size={15} /> <span>Bulk Upload</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '22px 24px' }}>
          {mode === 'single'
            ? <SingleUpload adminName={adminName} key="single" />
            : <BulkUpload adminName={adminName} key="bulk" />
          }
        </div>
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: '16px', padding: '14px 18px', background: '#eff6ff',
        border: '1px solid #bfdbfe', borderRadius: '12px',
        display: 'flex', alignItems: 'flex-start', gap: '10px'
      }}>
        <FiChevronRight size={15} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '1px' }} />
        <p style={{ margin: 0, fontSize: '12px', color: '#1e40af', lineHeight: 1.6 }}>
          Uploaded CVs are parsed by AI and saved to the <strong>Database</strong> Google Sheet with a unique Applicant ID.
          Resumes are stored in Google Drive. View all candidates in the <strong>Applicants</strong> page.
        </p>
      </div>
    </div>
  );
}
