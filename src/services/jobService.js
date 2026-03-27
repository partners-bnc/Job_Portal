const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbziRkUxbsyIdhaj1t1sN2YVGVbJvcxHRUrN2kJhHiL_Zs3zscTBKNj3D9A8EYg4T-qTnQ/exec';

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
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

  async fetchJobs() {
    if (cache.jobs.data && Date.now() - cache.jobs.timestamp < CACHE_DURATION) {
      return cache.jobs.data;
    }
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getJobs`, {
        method: 'GET', headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.jobs)) {
        cache.jobs = { data: data.jobs, timestamp: Date.now() };
        return data.jobs;
      }
      return [];
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }
  },

  async fetchJobById(jobId) {
    // Return from cache if we have it
    if (cache.jobs.data && Date.now() - cache.jobs.timestamp < CACHE_DURATION) {
      const job = cache.jobs.data.find(j => j.id.toString() === jobId.toString());
      if (job) return job;
    }
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getJob&jobId=${jobId}`);
      const data = await response.json();
      if (data.success && data.job) return data.job;
      return null;
    } catch (error) {
      console.error('Error fetching job:', error);
      return null;
    }
  },

  async submitApplication(applicationData) {
    try {
      const formData = new FormData();
      formData.append('action', 'submitApplication');
      Object.keys(applicationData).forEach(key => {
        if (applicationData[key] !== null && applicationData[key] !== undefined) {
          formData.append(key, applicationData[key]);
        }
      });
      const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success) {
        this.clearCache('candidates');
      }
      return data;
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async adminLogin(loginId, password) {
    try {
      const formData = new FormData();
      formData.append('action', 'adminLogin');
      formData.append('loginId', loginId);
      formData.append('password', password);
      const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
      return await response.json();
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async addJob(jobData) {
    try {
      const formData = new FormData();
      formData.append('action', 'addJob');
      Object.keys(jobData).forEach(key => {
        if (jobData[key] !== null && jobData[key] !== undefined) {
          formData.append(key, jobData[key]);
        }
      });
      const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success) {
        // Optimistic update
        if (cache.jobs.data && data.jobId) {
          cache.jobs.data.push({ id: data.jobId.toString(), ...jobData, company: 'BnC Global' });
        } else {
          this.clearCache('jobs');
        }
      }
      return data;
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async updateJob(jobData) {
    try {
      const formData = new FormData();
      formData.append('action', 'updateJob');
      Object.keys(jobData).forEach(key => {
        if (jobData[key] !== null && jobData[key] !== undefined) {
          formData.append(key, jobData[key]);
        }
      });
      const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success && cache.jobs.data) {
        const idx = cache.jobs.data.findIndex(j => j.id.toString() === (jobData.id || '').toString());
        if (idx !== -1) cache.jobs.data[idx] = { ...cache.jobs.data[idx], ...jobData };
      }
      return data;
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async deleteJob(jobId) {
    try {
      const formData = new FormData();
      formData.append('action', 'deleteJob');
      formData.append('jobId', jobId);
      const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success && cache.jobs.data) {
        cache.jobs.data = cache.jobs.data.filter(j => j.id.toString() !== jobId.toString());
      }
      return data;
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async fetchCandidates() {
    if (cache.candidates.data && Date.now() - cache.candidates.timestamp < CACHE_DURATION) {
      return cache.candidates.data;
    }
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getCandidates`, {
        method: 'GET', headers: { 'Accept': 'application/json' }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.candidates)) {
        cache.candidates = { data: data.candidates, timestamp: Date.now() };
        return data.candidates;
      }
      return [];
    } catch (error) {
      console.error('Error fetching candidates:', error);
      return [];
    }
  },

  async uploadCVToDatabase(cvData) {
    try {
      const formData = new FormData();
      formData.append('action', 'uploadCV');
      Object.keys(cvData).forEach(key => {
        if (cvData[key] !== null && cvData[key] !== undefined) {
          formData.append(key, cvData[key]);
        }
      });
      const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success) {
        this.clearCache('databaseCandidates'); // clear explicitly as adding completely new object is hard
      }
      return data;
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async getDatabaseCandidates() {
    if (cache.databaseCandidates.data && Date.now() - cache.databaseCandidates.timestamp < CACHE_DURATION) {
      return cache.databaseCandidates.data;
    }
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getDatabaseCandidates`, {
        method: 'GET', headers: { 'Accept': 'application/json' }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.candidates)) {
        cache.databaseCandidates = { data: data.candidates, timestamp: Date.now() };
        return data.candidates;
      }
      return [];
    } catch (error) {
      console.error('Error fetching database candidates:', error);
      return [];
    }
  },

  async saveAiResults(email, jobApplied, aiData) {
    try {
      const formData = new FormData();
      formData.append('action', 'saveAiAnalysis');
      formData.append('email', email);
      formData.append('jobApplied', jobApplied);
      formData.append('aiScore', String(aiData.score ?? ''));
      formData.append('aiAnalysis', aiData.analysis ?? '');
      formData.append('shortlistDecision', aiData.decision ?? '');
      formData.append('shortlistReason', aiData.reason ?? '');
      const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
      return await response.json();
    } catch (error) {
      console.error('Error saving AI results:', error);
      return { error: error.toString() };
    }
  },

  async updateDatabaseCandidate(updateData) {
    try {
      const formData = new FormData();
      formData.append('action', 'updateDatabaseCandidate');
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== null && updateData[key] !== undefined) {
          formData.append(key, updateData[key]);
        }
      });
      const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
      const data = await response.json();
      
      // Optimistic update
      if (data.success && cache.databaseCandidates.data) {
        const idStr = (updateData.applicantId || '').toString();
        const idx = cache.databaseCandidates.data.findIndex(c => c.applicantId.toString() === idStr);
        if (idx !== -1) {
          cache.databaseCandidates.data[idx] = { ...cache.databaseCandidates.data[idx], ...updateData };
        }
        // If status changes to or from something that affects shortlists, clear shortlisted cache
        if (updateData.status) this.clearCache('shortlisted');
      }
      return data;
    } catch (error) {
      return { error: error.toString() };
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

  async shortlistCandidate(data) {
    try {
      const formData = new FormData();
      formData.append('action', 'shortlistCandidate');
      formData.append('applicantId', data.applicantId || '');
      formData.append('name', data.name || '');
      formData.append('jobRole', data.jobRole || '');
      formData.append('company', data.company || '');
      formData.append('shortlistedBy', data.shortlistedBy || '');
      formData.append('jobCode', data.jobCode || '');
      
      const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
      const result = await response.json();
      
      if (result.success) {
        // Update database cache status
        if (cache.databaseCandidates.data) {
          const idx = cache.databaseCandidates.data.findIndex(c => c.applicantId.toString() === (data.applicantId || '').toString());
          if (idx !== -1) cache.databaseCandidates.data[idx].status = 'Shortlisted';
        }
        this.clearCache('shortlisted');
      }
      return result;
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async removeShortlist(params) {
    try {
      const formData = new FormData();
      formData.append('action', 'removeShortlist');
      formData.append('applicantId', params.applicantId || '');
      formData.append('jobCode', params.jobCode || '');
      
      const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success) {
        // Update shortlisted cache
        if (cache.shortlisted.data) {
          const appIdStr = (params.applicantId || '').toString();
          const jobCodeStr = (params.jobCode || '').toString();
          if (jobCodeStr) {
            cache.shortlisted.data = cache.shortlisted.data.filter(s => 
              !(s.applicantId.toString() === appIdStr && s.jobCode === jobCodeStr)
            );
          } else {
            cache.shortlisted.data = cache.shortlisted.data.filter(s => 
              s.applicantId.toString() !== appIdStr
            );
          }
        }
        // Update database candidates cache based on backend response
        if (cache.databaseCandidates.data && !data.hasOtherShortlists) {
          const idx = cache.databaseCandidates.data.findIndex(c => c.applicantId.toString() === (params.applicantId || '').toString());
          if (idx !== -1) cache.databaseCandidates.data[idx].status = 'In Database';
        }
      }
      return data;
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async getShortlistedCandidates() {
    if (cache.shortlisted.data && Date.now() - cache.shortlisted.timestamp < CACHE_DURATION) {
      return cache.shortlisted.data;
    }
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getShortlistedCandidates`);
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      if (data.success || data.data) {
        cache.shortlisted = { data: data.data || [], timestamp: Date.now() };
        return data.data || [];
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  async fetchClients() {
    if (cache.clients.data && Date.now() - cache.clients.timestamp < CACHE_DURATION) {
      return cache.clients.data;
    }
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getClients`);
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      if (data.clients) {
        cache.clients = { data: data.clients, timestamp: Date.now() };
        return data.clients;
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  async addClient(clientData) {
    try {
      const formData = new FormData();
      formData.append('action', 'addClient');
      Object.keys(clientData).forEach(key => {
        if (clientData[key] !== null && clientData[key] !== undefined) {
          formData.append(key, clientData[key]);
        }
      });
      const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success) this.clearCache('clients');
      return data;
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async updateClient(clientData) {
    try {
      const formData = new FormData();
      formData.append('action', 'updateClient');
      Object.keys(clientData).forEach(key => {
        if (clientData[key] !== null && clientData[key] !== undefined) {
          formData.append(key, clientData[key]);
        }
      });
      const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success && cache.clients.data) {
        const idx = cache.clients.data.findIndex(c => c.id === clientData.id);
        if (idx !== -1) cache.clients.data[idx] = { ...cache.clients.data[idx], ...clientData };
      }
      return data;
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async fetchHRs() {
    if (cache.hrs.data && Date.now() - cache.hrs.timestamp < CACHE_DURATION) {
      return cache.hrs.data;
    }
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getHRs`);
      const data = await response.json();
      if (data.success && data.hrs) {
        cache.hrs = { data: data.hrs, timestamp: Date.now() };
        return data.hrs;
      }
      return [];
    } catch (error) {
      console.error('Error fetching HRs:', error);
      return [];
    }
  },

  async fetchClientJobs() {
    if (cache.clientJobs.data && Date.now() - cache.clientJobs.timestamp < CACHE_DURATION) {
      return cache.clientJobs.data;
    }
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getClientJobs`);
      const data = await response.json();
      if (data.success) {
        cache.clientJobs = { data: data.clientJobs || [], timestamp: Date.now() };
        return data.clientJobs || [];
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  async addClientJob(jobData) {
    try {
      const formData = new FormData();
      formData.append('action', 'addClientJob');
      Object.keys(jobData).forEach(key => {
        if (jobData[key] !== null && jobData[key] !== undefined) {
          formData.append(key, jobData[key]);
        }
      });
      const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success) this.clearCache('clientJobs');
      return data;
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async updateClientJob(jobData) {
    try {
      const formData = new FormData();
      formData.append('action', 'updateClientJob');
      Object.keys(jobData).forEach(key => {
        if (jobData[key] !== null && jobData[key] !== undefined) {
          formData.append(key, jobData[key]);
        }
      });
      const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success && cache.clientJobs.data) {
        const idx = cache.clientJobs.data.findIndex(c => c.jobCode === jobData.jobCode);
        if (idx !== -1) cache.clientJobs.data[idx] = { ...cache.clientJobs.data[idx], ...jobData };
      }
      return data;
    } catch (error) {
      return { error: error.toString() };
    }
  },

  async updateLastViewedBy(applicantId, viewedBy) {
    try {
      const formData = new FormData();
      formData.append('action', 'updateLastViewedBy');
      formData.append('applicantId', applicantId);
      formData.append('viewedBy', viewedBy);
      const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success && cache.databaseCandidates.data) {
        const idx = cache.databaseCandidates.data.findIndex(c => c.applicantId.toString() === applicantId.toString());
        if (idx !== -1) cache.databaseCandidates.data[idx].lastViewedBy = viewedBy;
      }
      return data;
    } catch (error) {
      return { error: error.toString() };
    }
  }
};