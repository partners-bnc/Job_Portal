import { supabase, SUPABASE_URL } from './supabaseClient.js';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const SUPABASE_PAGE_SIZE = 1000;
const cache = {
  jobs: { data: null, timestamp: 0 },
  candidates: { data: null, timestamp: 0 },
  databaseCandidates: { data: null, timestamp: 0 },
  shortlisted: { data: null, timestamp: 0 },
  clients: { data: null, timestamp: 0 },
  clientJobs: { data: null, timestamp: 0 },
  hrs: { data: null, timestamp: 0 }
};

export const jobService = {
  clearCache(key) {
    if (key && cache[key]) {
      cache[key] = { data: null, timestamp: 0 };
    } else {
      Object.keys(cache).forEach(k => cache[k] = { data: null, timestamp: 0 });
    }
  },

  // ─────────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────────
  async adminLogin(loginId, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginId.toLowerCase().trim(),
        password: password,
      });
      if (error) return { error: error.message };

      // Fetch admin profile
      const { data: admin, error: adminError } = await supabase
        .from('admin_users')
        .select('hr_name, email, role, designation')
        .eq('auth_id', data.user.id)
        .eq('is_active', true)
        .single();

      if (adminError || !admin) {
        await supabase.auth.signOut();
        return { error: 'Account not authorized. Contact your administrator.' };
      }

      return {
        success: true,
        loginId: admin.email,
        hrName: admin.hr_name,
        role: admin.role,
        designation: admin.designation,
      };
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async adminLogout() {
    await supabase.auth.signOut();
    this.clearCache();
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // ─────────────────────────────────────────────
  // JOBS (Public Job Listings)
  // ─────────────────────────────────────────────
  async fetchJobs() {
    if (cache.jobs.data && Date.now() - cache.jobs.timestamp < CACHE_DURATION) {
      return cache.jobs.data;
    }
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const jobs = (data || []).map(j => ({
        id: j.job_id, title: j.title, location: j.location,
        type: j.job_type, experience: j.experience, salary: j.salary,
        education: j.education, vacancy: j.vacancy, gender: j.gender,
        description: j.description, company: 'BnC Global',
        _uuid: j.id,
      }));
      cache.jobs = { data: jobs, timestamp: Date.now() };
      return jobs;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }
  },

  async fetchJobById(jobId) {
    if (cache.jobs.data && Date.now() - cache.jobs.timestamp < CACHE_DURATION) {
      const job = cache.jobs.data.find(j => j.id.toString() === jobId.toString());
      if (job) return job;
    }
    try {
      const { data, error } = await supabase.from('jobs').select('*').eq('job_id', jobId).single();
      if (error || !data) return null;
      return {
        id: data.job_id, title: data.title, location: data.location,
        type: data.job_type, experience: data.experience, salary: data.salary,
        education: data.education, vacancy: data.vacancy, gender: data.gender,
        description: data.description, company: 'BnC Global', _uuid: data.id,
        responsibilities: [
          'Analyze business processes and recommend improvements',
          'Collaborate with stakeholders to gather requirements',
          'Create detailed documentation and reports',
          'Support project management activities'
        ],
        requirements: [
          data.education || "Bachelor's degree required",
          (data.experience || 'Experience') + ' required',
          'Strong analytical and problem-solving skills',
          'Excellent communication abilities'
        ]
      };
    } catch (error) {
      console.error('Error fetching job:', error);
      return null;
    }
  },

  async addJob(jobData) {
    try {
      const { data, error } = await supabase.from('jobs').insert({
        title: jobData.title || '', location: jobData.location || '',
        job_type: jobData.type || '', experience: jobData.experience || '',
        salary: jobData.salary || '', education: jobData.education || '',
        vacancy: jobData.vacancy || '', gender: jobData.gender || '',
        description: jobData.description || '',
      }).select('job_id').single();

      if (error) return { error: error.message };
      this.clearCache('jobs');
      return { success: true, jobId: data.job_id, message: 'Job posted successfully' };
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async updateJob(jobData) {
    try {
      const { error } = await supabase.from('jobs').update({
        title: jobData.title, location: jobData.location,
        job_type: jobData.type, experience: jobData.experience,
        salary: jobData.salary, education: jobData.education,
        vacancy: jobData.vacancy, gender: jobData.gender,
        description: jobData.description,
      }).eq('job_id', jobData.id);

      if (error) return { error: error.message };
      this.clearCache('jobs');
      return { success: true, message: 'Job updated successfully' };
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async deleteJob(jobId) {
    try {
      const { error } = await supabase.from('jobs').update({ is_active: false }).eq('job_id', jobId);
      if (error) return { error: error.message };
      this.clearCache('jobs');
      return { success: true, message: 'Job deleted successfully' };
    } catch (error) {
      return { error: error.toString() };
    }
  },

  // ─────────────────────────────────────────────
  // RESUME UPLOAD (Supabase Storage)
  // ─────────────────────────────────────────────
  async uploadResume(base64Data, fileName, candidateName, overrideStorageName = null) {
    try {
      let cleanBase64 = base64Data;
      if (base64Data && base64Data.includes(',')) {
        cleanBase64 = base64Data.split(',')[1];
      }
      if (!cleanBase64) throw new Error('No base64 data provided for resume upload.');

      const binaryStr = atob(cleanBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

      // Sanitize: keep only alphanumeric, underscores, hyphens, dots — strip everything else
      const ext = fileName.toLowerCase().endsWith('.pdf') ? '.pdf'
        : fileName.toLowerCase().endsWith('.docx') ? '.docx' : '.doc';

      // Use the override name if provided (e.g. after we know the applicant ID)
      const safeBase = overrideStorageName
        ? overrideStorageName.replace(/[^a-zA-Z0-9_\-]/g, '_')
        : `${(candidateName || 'Resume').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

      const filePath = `resumes/${safeBase}${ext}`;

      const { error } = await supabase.storage.from('resumes').upload(filePath, bytes.buffer, {
        contentType: ext === '.pdf' ? 'application/pdf' : 'application/octet-stream',
        upsert: true,
      });

      if (error) throw new Error(`Resume storage failed: ${error.message}`);

      const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(filePath);
      return urlData.publicUrl;
    } catch (error) {
      // Re-throw so callers can skip DB insert
      throw new Error(`Resume upload failed: ${error.message}`);
    }
  },


  // ─────────────────────────────────────────────
  // JOB APPLICATION (Public — uses RPC)
  // ─────────────────────────────────────────────
  async submitApplication(applicationData) {
    try {
      // Upload resume first
      let resumeUrl = 'No resume uploaded';
      if (applicationData.resumeData && applicationData.resumeFileName && applicationData.candidateName) {
        resumeUrl = await this.uploadResume(
          applicationData.resumeData, applicationData.resumeFileName, applicationData.candidateName
        );
      }

      // Call RPC function
      const { data, error } = await supabase.rpc('submit_job_application', {
        p_name: applicationData.candidateName || null,
        p_email: applicationData.email || null,
        p_contact_number: applicationData.contactNumber || null,
        p_current_location: applicationData.currentLocation || null,
        p_recent_education: applicationData.recentEducation || null,
        p_total_experience: applicationData.totalExperience || null,
        p_current_company: applicationData.currentCompany || null,
        p_current_position: applicationData.currentPosition || null,
        p_current_ctc: applicationData.currentCTC || null,
        p_expected_ctc: applicationData.expectedCTC || null,
        p_notice_period: applicationData.noticePeriod || null,
        p_job_title: applicationData.jobTitle || null,
        p_job_id: applicationData.jobId || null,
        p_resume_link: resumeUrl !== 'No resume uploaded' ? resumeUrl : null,
      });

      if (error) return { error: error.message };

      // Send confirmation email (fire-and-forget)
      if (applicationData.email && applicationData.candidateName && applicationData.jobTitle) {
        this._sendEmail(applicationData.email, applicationData.candidateName,
          applicationData.jobTitle, applicationData.jobId).catch(() => {});
      }

      this.clearCache('candidates');
      this.clearCache('databaseCandidates');
      return { success: true, message: 'Application submitted successfully' };
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async _sendEmail(to, candidateName, jobTitle, jobId) {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to, 
          candidateName, 
          jobTitle, 
          jobId,
          templateType: 'candidate_confirmation'
        }),
      });
    } catch (e) {
      console.error('Email send failed:', e);
    }
  },

  async sendDirectEmail(to, subject, html) {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to, subject, html }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('sendDirectEmail error:', error);
      return { error: error.toString() };
    }
  },

  // ─────────────────────────────────────────────
  // CANDIDATES (from Candidate detail sheet equivalent)
  // ─────────────────────────────────────────────
  async fetchCandidates() {
    if (cache.candidates.data && Date.now() - cache.candidates.timestamp < CACHE_DURATION) {
      return cache.candidates.data;
    }
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      const candidates = (data || []).map(c => ({
        timestamp: c.timestamp || '', name: c.name || '', email: c.email || '',
        contactNumber: c.contact_number || '', currentLocation: c.current_location || '',
        recentEducation: c.recent_education || '', totalExperience: c.total_experience || '',
        currentCompany: c.current_company || '', currentPosition: c.current_position || '',
        currentCTC: c.current_ctc || '', expectedCTC: c.expected_ctc || '',
        noticePeriod: c.notice_period || '', jobApplied: c.job_applied || '',
        resumeLink: c.resume_link || '', emailStatus: c.email_status || '',
        status: c.status || 'Applied',
        aiScore: c.ai_score, aiAnalysis: c.ai_analysis || '',
        shortlistDecision: c.shortlist_decision || '', shortlistReason: c.shortlist_reason || '',
      }));
      cache.candidates = { data: candidates, timestamp: Date.now() };
      return candidates;
    } catch (error) {
      console.error('Error fetching candidates:', error);
      return [];
    }
  },

  // ─────────────────────────────────────────────
  // CV UPLOAD TO DATABASE (HR Upload)
  // ─────────────────────────────────────────────
  async uploadCVToDatabase(cvData) {
    const cleanEmail = (cvData.email || '').trim().toLowerCase();
    const cleanPhone = (cvData.contactNumber || '').replace(/[^0-9]/g, '').trim();

    // ── Check for duplicate first ──────────────────────────────────────
    let existing = null;
    if (cleanEmail || cleanPhone) {
      let query = supabase.from('applicants').select('id, applicant_code, created_on');
      if (cleanEmail && cleanPhone) {
        query = query.or(`email.ilike.${cleanEmail},mobile_number.eq.${cleanPhone}`);
      } else if (cleanEmail) {
        query = query.ilike('email', cleanEmail);
      } else {
        query = query.eq('mobile_number', cleanPhone);
      }
      const { data } = await query.limit(1).maybeSingle();
      existing = data;
    }

    const applicantCode = existing ? existing.applicant_code : null;

    // ── EXISTING RECORD → UPDATE ───────────────────────────────────────
    if (existing) {
      // Upload PDF named CandidateName_ExistingID.pdf — THROW on failure
      let resumeUrl = null;
      if (cvData.resumeData && cvData.resumeFileName) {
        const safeName = (cvData.candidateName || 'Resume').replace(/[^a-zA-Z0-9]/g, '_');
        const storageName = `${applicantCode}_${safeName}`;
        resumeUrl = await this.uploadResume(cvData.resumeData, cvData.resumeFileName, cvData.candidateName, storageName);
        // uploadResume throws on failure — so if we reach here, it succeeded
      }

      const updateData = {
        full_name: cvData.candidateName || undefined,
        email: cleanEmail || undefined,
        mobile_number: cleanPhone || undefined,
        current_location: cvData.currentLocation || undefined,
        current_company: cvData.currentCompany || undefined,
        current_position: cvData.currentPosition || undefined,
        total_experience: cvData.totalExperience || undefined,
        education: cvData.education || undefined,
        skills: cvData.skills || undefined,
        cv_summary: cvData.summary || undefined,
        certification: cvData.certifications || undefined,
        source: cvData.source || undefined,
        uploaded_by: cvData.uploadedBy || undefined,
        updated_on: new Date().toISOString(),
        ai_score: null, ai_analysis: null,
        shortlist_decision: null, shortlist_reason: null,
      };
      if (resumeUrl) updateData.resume_link = resumeUrl;

      // Remove undefined values
      Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

      const { error } = await supabase.from('applicants').update(updateData).eq('id', existing.id);
      if (error) return { error: error.message };

      this.clearCache('databaseCandidates');
      return {
        success: true, isUpdate: true, applicantId: applicantCode,
        message: 'Duplicate found — existing record updated successfully'
      };
    }

    // ── NEW RECORD → INSERT first to get the ID ────────────────────────
    const { data: inserted, error: insertError } = await supabase.from('applicants').insert({
      source: cvData.source || 'HR Upload',
      full_name: cvData.candidateName || '',
      email: cleanEmail,
      mobile_number: cleanPhone,
      current_location: cvData.currentLocation || '',
      current_company: cvData.currentCompany || '',
      current_position: cvData.currentPosition || '',
      total_experience: cvData.totalExperience || '',
      education: cvData.education || '',
      skills: cvData.skills || '',
      cv_summary: cvData.summary || '',
      certification: cvData.certifications || '',
      resume_link: '',           // placeholder — will be updated after upload
      uploaded_by: cvData.uploadedBy || 'Admin',
      status: 'In Database',
    }).select('id, applicant_code').single();

    if (insertError) return { error: insertError.message };

    const newId = inserted.applicant_code;
    const rowId = inserted.id;

    // ── Upload PDF now that we have the applicant ID ───────────────────
    if (cvData.resumeData && cvData.resumeFileName) {
      try {
        const safeName = (cvData.candidateName || 'Resume').replace(/[^a-zA-Z0-9]/g, '_');
        const storageName = `${newId}_${safeName}`;
        const resumeUrl = await this.uploadResume(cvData.resumeData, cvData.resumeFileName, cvData.candidateName, storageName);

        // Update the record with the real resume URL
        await supabase.from('applicants').update({ resume_link: resumeUrl }).eq('id', rowId);
      } catch (uploadErr) {
        // PDF upload failed — ROLLBACK the inserted row so no half-record stays
        await supabase.from('applicants').delete().eq('id', rowId);
        return { error: `PDF upload failed — candidate NOT saved. Reason: ${uploadErr.message}` };
      }
    }

    this.clearCache('databaseCandidates');
    return {
      success: true, isUpdate: false, applicantId: newId,
      message: 'CV uploaded and saved to database successfully'
    };
  },


  // ─────────────────────────────────────────────
  // DATABASE CANDIDATES (Applicants — centralised)
  // ─────────────────────────────────────────────
  async getDatabaseCandidates() {
    if (cache.databaseCandidates.data && Date.now() - cache.databaseCandidates.timestamp < CACHE_DURATION) {
      return cache.databaseCandidates.data;
    }
    try {
      const rows = [];
      let from = 0;

      while (true) {
        const to = from + SUPABASE_PAGE_SIZE - 1;
        const { data, error } = await supabase
          .from('applicants')
          .select('*')
          .order('created_on', { ascending: false })
          .range(from, to);

        if (error) throw error;
        if (!data?.length) break;

        rows.push(...data);

        if (data.length < SUPABASE_PAGE_SIZE) break;
        from += SUPABASE_PAGE_SIZE;
      }

      const candidates = rows.map(r => ({
        applicantId: r.applicant_code || '', _uuid: r.id,
        timestamp: r.timestamp || '', source: r.source || '',
        name: r.full_name || '', email: r.email || '',
        contactNumber: r.mobile_number || '',
        currentLocation: r.current_location || '',
        currentCompany: r.current_company || '',
        currentPosition: r.current_position || '',
        totalExperience: r.total_experience || '',
        education: r.education || '', skills: r.skills || '',
        summary: r.cv_summary || '', jobAppliedFor: r.job_applied_for || '',
        jobId: r.job_id || '', resumeLink: r.resume_link || '',
        uploadedBy: r.uploaded_by || '',
        createdOn: r.created_on || '',
        aiScore: r.ai_score, aiAnalysis: r.ai_analysis || '',
        shortlistDecision: r.shortlist_decision || '',
        shortlistReason: r.shortlist_reason || '',
        status: r.status || 'Applied',
        certification: r.certification || '',
        relevantExperience: r.relevant_experience || '',
        currentCTC: r.current_ctc || '', expectedPay: r.expected_pay || '',
        noticePeriod: r.notice_period || '',
        processKnowledge: r.process_knowledge || '',
        reasonForChange: r.reason_for_change || '',
        workAuthorization: r.work_authorization || '',
        recruiterComments: r.recruiter_comments || '',
        aadharNumber: r.aadhar_number || '',
        nationality: r.nationality || '',
        language: r.language_details || '',
        technicalRating: r.technical_rating ?? '',
        communicationRating: r.communication_rating ?? '',
        professionalismRating: r.professionalism_rating ?? '',
        overallRating: r.overall_rating ?? '',
        lastViewedBy: r.last_viewed_by || '',
      }));
      cache.databaseCandidates = { data: candidates, timestamp: Date.now() };
      return candidates;
    } catch (error) {
      console.error('Error fetching database candidates:', error);
      return [];
    }
  },

  async getDatabaseCandidateById(applicantId) {
    try {
      const all = await this.getDatabaseCandidates();
      return all.find(c => c.applicantId.toString() === applicantId.toString()) || null;
    } catch (error) {
      return null;
    }
  },

  async updateDatabaseCandidate(updateData) {
    try {
      const applicantCode = updateData.applicantId;
      if (!applicantCode) return { error: 'Applicant ID is required' };

      const dbUpdate = {};
      if (updateData.name !== undefined) dbUpdate.full_name = updateData.name;
      if (updateData.email !== undefined) dbUpdate.email = updateData.email;
      if (updateData.contactNumber !== undefined) dbUpdate.mobile_number = updateData.contactNumber;
      if (updateData.currentLocation !== undefined) dbUpdate.current_location = updateData.currentLocation;
      if (updateData.currentCompany !== undefined) dbUpdate.current_company = updateData.currentCompany;
      if (updateData.currentPosition !== undefined) dbUpdate.current_position = updateData.currentPosition;
      if (updateData.totalExperience !== undefined) dbUpdate.total_experience = updateData.totalExperience;
      if (updateData.education !== undefined) dbUpdate.education = updateData.education;
      if (updateData.skills !== undefined) dbUpdate.skills = updateData.skills;
      if (updateData.summary !== undefined) dbUpdate.cv_summary = updateData.summary;
      if (updateData.jobAppliedFor !== undefined) dbUpdate.job_applied_for = updateData.jobAppliedFor;
      if (updateData.jobId !== undefined) dbUpdate.job_id = updateData.jobId;
      if (updateData.aiScore !== undefined) dbUpdate.ai_score = updateData.aiScore;
      if (updateData.aiAnalysis !== undefined) dbUpdate.ai_analysis = updateData.aiAnalysis;
      if (updateData.shortlistDecision !== undefined) dbUpdate.shortlist_decision = updateData.shortlistDecision;
      if (updateData.shortlistReason !== undefined) dbUpdate.shortlist_reason = updateData.shortlistReason;
      if (updateData.status !== undefined) dbUpdate.status = updateData.status;
      if (updateData.certification !== undefined) dbUpdate.certification = updateData.certification;
      if (updateData.relevantExperience !== undefined) dbUpdate.relevant_experience = updateData.relevantExperience;
      if (updateData.currentCTC !== undefined) dbUpdate.current_ctc = updateData.currentCTC;
      if (updateData.expectedPay !== undefined) dbUpdate.expected_pay = updateData.expectedPay;
      if (updateData.noticePeriod !== undefined) dbUpdate.notice_period = updateData.noticePeriod;
      if (updateData.processKnowledge !== undefined) dbUpdate.process_knowledge = updateData.processKnowledge;
      if (updateData.reasonForChange !== undefined) dbUpdate.reason_for_change = updateData.reasonForChange;
      if (updateData.workAuthorization !== undefined) dbUpdate.work_authorization = updateData.workAuthorization;
      if (updateData.recruiterComments !== undefined) dbUpdate.recruiter_comments = updateData.recruiterComments;
      if (updateData.aadharNumber !== undefined) dbUpdate.aadhar_number = updateData.aadharNumber;
      if (updateData.nationality !== undefined) dbUpdate.nationality = updateData.nationality;
      if (updateData.language !== undefined) dbUpdate.language_details = updateData.language;
      if (updateData.technicalRating !== undefined) dbUpdate.technical_rating = updateData.technicalRating || null;
      if (updateData.communicationRating !== undefined) dbUpdate.communication_rating = updateData.communicationRating || null;
      if (updateData.professionalismRating !== undefined) dbUpdate.professionalism_rating = updateData.professionalismRating || null;
      if (updateData.overallRating !== undefined) dbUpdate.overall_rating = updateData.overallRating || null;

      dbUpdate.updated_on = new Date().toISOString();

      const { error } = await supabase.from('applicants').update(dbUpdate).eq('applicant_code', applicantCode);
      if (error) return { error: error.message };

      // Optimistic cache update
      if (cache.databaseCandidates.data) {
        const idx = cache.databaseCandidates.data.findIndex(c => c.applicantId === applicantCode);
        if (idx !== -1) {
          cache.databaseCandidates.data[idx] = { ...cache.databaseCandidates.data[idx], ...updateData };
        }
      }
      if (updateData.status) this.clearCache('shortlisted');
      return { success: true, message: 'Candidate updated successfully', applicantId: applicantCode };
    } catch (error) {
      return { error: error.toString() };
    }
  },

  // ─────────────────────────────────────────────
  // COMMUNICATION LOGS
  // ─────────────────────────────────────────────
  async getCommunicationLogs(applicantCode) {
    try {
      const { data, error } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('applicant_code', applicantCode)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching communication logs:', error);
      return { success: false, error: error.toString(), data: [] };
    }
  },

  async addCommunicationLog(logData) {
    try {
      const { error } = await supabase
        .from('communication_logs')
        .insert({
          applicant_code: logData.applicantCode,
          hr_name: logData.hrName,
          communication_type: logData.communicationType || 'Call',
          notes: logData.notes
        });

      if (error) throw error;
      return { success: true, message: 'Log added successfully' };
    } catch (error) {
      return { success: false, error: error.toString() };
    }
  },

  // ─────────────────────────────────────────────
  // AI ANALYSIS
  // ─────────────────────────────────────────────
  async saveAiResults(email, jobApplied, aiData) {
    try {
      const cleanEmail = email.trim().toLowerCase();

      // Update applicants table
      const { error: appErr } = await supabase.from('applicants').update({
        ai_score: aiData.score ?? null,
        ai_analysis: aiData.analysis ?? '',
        shortlist_decision: aiData.decision ?? '',
        shortlist_reason: aiData.reason ?? '',
      }).ilike('email', cleanEmail);

      // Update candidates table
      await supabase.from('candidates').update({
        ai_score: aiData.score ?? null,
        ai_analysis: aiData.analysis ?? '',
        shortlist_decision: aiData.decision ?? '',
        shortlist_reason: aiData.reason ?? '',
      }).ilike('email', cleanEmail);

      if (appErr) return { error: appErr.message };
      this.clearCache('databaseCandidates');
      this.clearCache('candidates');
      return { success: true };
    } catch (error) {
      return { error: error.toString() };
    }
  },

  // ─────────────────────────────────────────────
  // SHORTLISTING
  // ─────────────────────────────────────────────
  async shortlistCandidate(data) {
    try {
      // Get the applicant UUID from code
      const { data: app } = await supabase
        .from('applicants').select('id').eq('applicant_code', data.applicantId).single();

      const jobCodeStr = (data.jobCode || '').toString().trim();

      // Check for duplicate tag
      const { data: existingTag } = await supabase
        .from('tagged_candidates')
        .select('id')
        .eq('applicant_code', data.applicantId)
        .eq('job_code', jobCodeStr)
        .single();
        
      if (existingTag) {
        return { error: 'Candidate is already tagged for this specific job opening.' };
      }

      const { error } = await supabase.from('tagged_candidates').insert({
        applicant_id: app?.id || null,
        applicant_code: data.applicantId || '',
        name: data.name || '',
        job_role: data.jobRole || '',
        company: data.company || '',
        shortlisted_by: data.shortlistedBy || 'Admin',
        job_code: jobCodeStr,
      });

      if (error) return { error: error.message };

      // Update applicant status
      if (app?.id) {
        await supabase.from('applicants').update({ status: 'Tagged' }).eq('id', app.id);
      }

      if (cache.databaseCandidates.data) {
        const idx = cache.databaseCandidates.data.findIndex(c => c.applicantId === data.applicantId);
        if (idx !== -1) cache.databaseCandidates.data[idx].status = 'Tagged';
      }
      this.clearCache('shortlisted');
      return { success: true };
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async removeShortlist(params) {
    try {
      let query = supabase.from('tagged_candidates').delete()
        .eq('applicant_code', params.applicantId);
      if (params.jobCode) query = query.eq('job_code', params.jobCode);

      const { error } = await query;
      if (error) return { error: error.message };

      // Check if still has other shortlists
      const { data: remaining } = await supabase.from('tagged_candidates')
        .select('id').eq('applicant_code', params.applicantId).limit(1);

      const hasOtherShortlists = remaining && remaining.length > 0;

      if (!hasOtherShortlists) {
        await supabase.from('applicants').update({ status: 'In Database' })
          .eq('applicant_code', params.applicantId);
        if (cache.databaseCandidates.data) {
          const idx = cache.databaseCandidates.data.findIndex(c => c.applicantId === params.applicantId);
          if (idx !== -1) cache.databaseCandidates.data[idx].status = 'In Database';
        }
      }

      this.clearCache('shortlisted');
      return { success: true, hasOtherShortlists };
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async getShortlistedCandidates() {
    if (cache.shortlisted.data && Date.now() - cache.shortlisted.timestamp < CACHE_DURATION) {
      return cache.shortlisted.data;
    }
    try {
      const { data, error } = await supabase.from('tagged_candidates')
        .select('*').order('created_at', { ascending: false });

      if (error) throw error;
      const items = (data || []).map(s => ({
        applicantId: s.applicant_code || '',
        name: s.name || '', jobRole: s.job_role || '',
        company: s.company || '', shortlistedBy: s.shortlisted_by || '',
        date: s.created_at || null, jobCode: s.job_code || '',
        currentStage: s.current_stage || 'Pipeline',
        managerSubmittedAt: s.manager_submitted_at || null,
        clientSubmittedAt: s.client_submitted_at || null,
        feedbackReceivedAt: s.feedback_received_at || null,
        id: s.id
      }));
      cache.shortlisted = { data: items, timestamp: Date.now() };
      return items;
    } catch (error) {
      console.error('Error fetching shortlisted:', error);
      return [];
    }
  },

  async updateShortlistStage(applicantId, jobCode, stage) {
    try {
      const updateData = { current_stage: stage };
      const now = new Date().toISOString();
      if (stage === 'Manager Submit') updateData.manager_submitted_at = now;
      if (stage === 'Client Submission') updateData.client_submitted_at = now;
      if (stage === 'Feedback') updateData.feedback_received_at = now;

      const { error } = await supabase.from('tagged_candidates')
        .update(updateData)
        .eq('applicant_code', applicantId)
        .eq('job_code', jobCode);
      
      if (error) throw error;
      this.clearCache('shortlisted');
      return { success: true };
    } catch (error) {
      return { error: error.toString() };
    }
  },

  // ─────────────────────────────────────────────
  // CLIENTS
  // ─────────────────────────────────────────────
  async fetchClients() {
    if (cache.clients.data && Date.now() - cache.clients.timestamp < CACHE_DURATION) {
      return cache.clients.data;
    }
    try {
      const { data, error } = await supabase.from('clients')
        .select('*, client_reporting_contact(*)').order('created_on', { ascending: false });

      if (error) throw error;
      const clients = (data || []).map(c => ({
        clientId: c.client_id, clientName: c.client_name || '',
        website: c.website || '', industry: c.industry || '',
        status: c.status || '', primaryOwner: c.managed_by || '',
        businessUnit: c.business_unit || '',
        displayOnJobPosting: c.display_on_job_posting || '',
        reportingContacts: (c.client_reporting_contact || []).map(rc => ({
           id: rc.id,
           name: rc.contact_name,
           email: rc.email,
           contact: rc.phone,
           department: rc.department || ''
        })),
        createdBy: c.created_by || '', createdOn: c.created_on || '',
        modifiedOn: c.modified_on || '', modifiedBy: c.modified_by || '',
      }));
      cache.clients = { data: clients, timestamp: Date.now() };
      return clients;
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  },

  async addClient(clientData) {
    try {
      const insertObj = {
        client_name: clientData.clientName || '',
        website: clientData.website || '',
        industry: clientData.industry || '',
        status: clientData.status || 'Active',
        managed_by: clientData.primaryOwner || '',
        business_unit: clientData.businessUnit || '',
        display_on_job_posting: clientData.displayOnJobPosting || 'No',
        created_by: clientData.createdBy || 'Admin',
      };
      if (clientData.clientId) insertObj.client_id = clientData.clientId;

      const { data, error } = await supabase.from('clients').insert(insertObj).select('client_id').single();
      if (error) return { error: error.message };

      const contactsToInsert = (clientData.reportingContacts || []).map(rc => ({
          client_id: data.client_id,
          contact_name: rc.name,
          email: rc.email,
          phone: rc.contact,
          department: rc.department || ''
      }));
      if (contactsToInsert.length > 0) {
         const { error: contactError } = await supabase.from('client_reporting_contact').insert(contactsToInsert);
         if (contactError) return { error: 'Failed to save contacts: ' + contactError.message };
      }

      this.clearCache('clients');
      return { success: true, clientId: data.client_id, message: 'Client added successfully' };
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async updateClient(clientData) {
    try {
      const { error } = await supabase.from('clients').update({
        client_name: clientData.clientName,
        website: clientData.website,
        industry: clientData.industry, status: clientData.status,
        managed_by: clientData.primaryOwner,
        business_unit: clientData.businessUnit,
        display_on_job_posting: clientData.displayOnJobPosting,
        modified_on: new Date().toISOString(),
        modified_by: clientData.modifiedBy || 'Admin',
      }).eq('client_id', clientData.clientId);

      if (error) return { error: error.message };

      // Update contacts: drop old, insert new
      await supabase.from('client_reporting_contact').delete().eq('client_id', clientData.clientId);
      const contactsToInsert = (clientData.reportingContacts || []).map(rc => ({
          client_id: clientData.clientId,
          contact_name: rc.name,
          email: rc.email,
          phone: rc.contact,
          department: rc.department || ''
      }));
      if (contactsToInsert.length > 0) {
         const { error: contactError } = await supabase.from('client_reporting_contact').insert(contactsToInsert);
         if (contactError) return { error: 'Failed to update contacts: ' + contactError.message };
      }

      this.clearCache('clients');
      return { success: true, message: 'Client updated successfully' };
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async deleteClient(clientId) {
    try {
      const { error } = await supabase.from('clients').delete().eq('client_id', clientId);
      if (error) return { error: error.message };
      this.clearCache('clients');
      return { success: true, message: 'Client deleted successfully' };
    } catch (error) {
      return { error: error.toString() };
    }
  },

  // ─────────────────────────────────────────────
  // HRs (Admin Users)
  // ─────────────────────────────────────────────
  async fetchHRs() {
    if (cache.hrs.data && Date.now() - cache.hrs.timestamp < CACHE_DURATION) {
      return cache.hrs.data;
    }
    try {
      const { data, error } = await supabase.from('admin_users')
        .select('hr_name, email').eq('is_active', true);

      if (error) throw error;
      const hrs = (data || []).map(h => ({ hrName: h.hr_name, email: h.email }));
      cache.hrs = { data: hrs, timestamp: Date.now() };
      return hrs;
    } catch (error) {
      console.error('Error fetching HRs:', error);
      return [];
    }
  },

  // ─────────────────────────────────────────────
  // CLIENT JOBS
  // ─────────────────────────────────────────────
  async fetchClientJobs() {
    if (cache.clientJobs.data && Date.now() - cache.clientJobs.timestamp < CACHE_DURATION) {
      return cache.clientJobs.data;
    }

    const processJob = (j) => ({
      jobCode: j.job_code || '', jobTitle: j.job_title || '',
      businessUnit: j.business_unit || '', clientName: j.client_name || '',
      clientId: j.client_id || '', location: j.location || '',
      state: j.state || '', country: j.country || '',
      payRate: j.pay_rate || '', experience: j.experience || '',
      jobDescription: j.job_description || '',
      createdBy: j.created_by || '', createdOn: j.created_on || '',
      recruitmentManager: j.recruitment_manager || '',
      status: j.status || '', modifiedOn: j.modified_on || '',
      modifiedBy: j.modified_by || '', priority: j.priority || 'Medium',
      assignedTo: j.assigned_to || '',
      reportingClientName: j.reporting_client_name || '',
      reportingClientEmail: j.reporting_client_email || '',
      reportingClientContact: j.reporting_client_contact || '',
    });

    try {
      const { data, error } = await supabase.from('client_jobs')
        .select(`
          *,
          reporting_contacts:client_id (
            contact_name,
            email,
            phone
          )
        `).order('created_on', { ascending: false });

      if (error) {
        console.warn('Relational fetch failed, falling back to flat fetch:', error.message);
        const { data: flatData, error: flatError } = await supabase.from('client_jobs').select('*').order('created_on', { ascending: false });
        if (flatError) throw flatError;
        const jobs = (flatData || []).map(processJob);
        cache.clientJobs = { data: jobs, timestamp: Date.now() };
        return jobs;
      }

      const jobs = (data || []).map(j => {
        const base = processJob(j);
        if (j.reporting_contacts) {
          base.reportingClientName = j.reporting_contacts.contact_name || base.reportingClientName;
          base.reportingClientEmail = j.reporting_contacts.email || base.reportingClientEmail;
          base.reportingClientContact = j.reporting_contacts.phone || base.reportingClientContact;
        }
        return base;
      });

      cache.clientJobs = { data: jobs, timestamp: Date.now() };
      return jobs;
    } catch (error) {
      console.error('Error fetching client jobs:', error);
      return [];
    }
  },

  async addClientJob(jobData) {
    try {
      const { data, error } = await supabase.from('client_jobs').insert({
        job_code: jobData.jobCode || '',
        job_title: jobData.jobTitle || '',
        business_unit: jobData.businessUnit || '',
        client_name: jobData.clientName || '',
        client_id: jobData.clientId || '',
        location: jobData.location || '',
        state: jobData.state || '',
        country: jobData.country || 'India',
        pay_rate: jobData.payRate || '',
        experience: jobData.experience || '',
        job_description: jobData.jobDescription || '',
        created_by: jobData.createdBy || 'Admin',
        recruitment_manager: jobData.recruitmentManager || '',
        status: jobData.status || 'Active',
        priority: jobData.priority || 'Medium',
        assigned_to: jobData.assignedTo || '',
        reporting_client_name: jobData.reportingClientName || '',
        reporting_client_email: jobData.reportingClientEmail || '',
        reporting_client_contact: jobData.reportingClientContact || '',
      }).select('job_code').single();

      if (error) return { error: error.message };
      this.clearCache('clientJobs');
      return { success: true, jobCode: data.job_code, message: 'Client Job added successfully' };
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async updateClientJob(jobData) {
    try {
      const { error } = await supabase.from('client_jobs').update({
        job_title: jobData.jobTitle, business_unit: jobData.businessUnit,
        client_name: jobData.clientName, client_id: jobData.clientId,
        location: jobData.location, state: jobData.state,
        country: jobData.country, pay_rate: jobData.payRate,
        experience: jobData.experience, job_description: jobData.jobDescription,
        recruitment_manager: jobData.recruitmentManager,
        status: jobData.status, modified_on: new Date().toISOString(),
        modified_by: jobData.modifiedBy || 'Admin',
        priority: jobData.priority, assigned_to: jobData.assignedTo,
        reporting_client_name: jobData.reportingClientName,
        reporting_client_email: jobData.reportingClientEmail,
        reporting_client_contact: jobData.reportingClientContact,
      }).eq('job_code', jobData.jobCode);

      if (error) return { error: error.message };
      if (cache.clientJobs.data) {
        const idx = cache.clientJobs.data.findIndex(c => c.jobCode === jobData.jobCode);
        if (idx !== -1) cache.clientJobs.data[idx] = { ...cache.clientJobs.data[idx], ...jobData };
      }
      return { success: true, message: 'Client Job updated successfully' };
    } catch (error) {
      return { error: error.toString() };
    }
  },

  // ─────────────────────────────────────────────
  // LAST VIEWED BY
  // ─────────────────────────────────────────────
  async updateLastViewedBy(applicantId, viewedBy) {
    try {
      const { error } = await supabase.from('applicants')
        .update({ last_viewed_by: viewedBy })
        .eq('applicant_code', applicantId);

      if (error) return { error: error.message };
      if (cache.databaseCandidates.data) {
        const idx = cache.databaseCandidates.data.findIndex(c => c.applicantId === applicantId);
        if (idx !== -1) cache.databaseCandidates.data[idx].lastViewedBy = viewedBy;
      }
      return { success: true };
    } catch (error) {
      return { error: error.toString() };
    }
  },

  // ─────────────────────────────────────────────
  // ADMIN MANAGEMENT
  // ─────────────────────────────────────────────
  async fetchAllAdmins() {
    try {
      const { data, error } = await supabase.from('admin_users')
        .select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching admins:', error);
      return [];
    }
  },

  async createAdmin(adminData) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/manage-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          email: adminData.email,
          password: adminData.password,
          hr_name: adminData.hrName,
          phone: adminData.phone,
          department: adminData.department,
          designation: adminData.designation,
          role: adminData.role || 'hr',
        }),
      });
      const data = await res.json();
      if (data.error) return { error: data.error };
      this.clearCache('hrs');
      return { success: true };
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async toggleAdminStatus(adminId, activate) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/manage-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: activate ? 'reactivate' : 'deactivate',
          admin_id: adminId,
        }),
      });
      const data = await res.json();
      if (data.error) return { error: data.error };
      this.clearCache('hrs');
      return { success: true };
    } catch (error) {
      return { error: error.toString() };
    }
  },
};
