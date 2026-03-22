const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxXnrv8UT35fNC5OdgEUdTvrhZCxC0n5EmWnY2jCodvINquAKYfzY-UYEa4O4fvtphE7Q/exec';

export const jobService = {
  async fetchJobs() {
    try {
      console.log('Fetching jobs from:', `${SCRIPT_URL}?action=getJobs`);
      const response = await fetch(`${SCRIPT_URL}?action=getJobs`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Jobs response:', data);
      
      if (data.success && Array.isArray(data.jobs)) {
        return data.jobs;
      } else {
        console.error('Invalid response format:', data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Return fallback data if API fails
      return [
        {
          id: '3801',
          title: 'Business Analyst',
          location: 'Delhi',
          type: 'Onsite',
          experience: '1-2, 2,4-3,4',
          salary: 'Mba',
          education: 'Mba',
          vacancy: '2',
          gender: 'All',
          description: 'We are looking for a talented person who can. Good in analytics.',
          company: 'BnC Global'
        }
      ];
    }
  },

  async fetchJobById(jobId) {
    try {
      console.log('Fetching job:', jobId);
      const response = await fetch(`${SCRIPT_URL}?action=getJob&jobId=${jobId}`);
      const data = await response.json();
      console.log('Job response:', data);
      
      if (data.success && data.job) {
        return data.job;
      } else {
        console.error('Job not found in API, creating fallback');
        // Create fallback job based on ID
        return {
          id: jobId,
          title: jobId === '3801' ? 'Business Analyst' : jobId === '3802' ? 'Data Analyst' : 'Job Position',
          location: jobId === '3801' ? 'Delhi' : jobId === '3802' ? 'Dubai' : 'Location TBD',
          type: jobId === '3801' ? 'Onsite' : jobId === '3802' ? 'Hybrid' : 'TBD',
          experience: jobId === '3801' ? '1-2, 2,4-3,4' : jobId === '3802' ? '3+' : 'TBD',
          salary: jobId === '3801' ? 'Competitive' : jobId === '3802' ? '12' : 'TBD',
          education: jobId === '3801' ? 'MBA' : jobId === '3802' ? 'B.Tech' : 'Graduate',
          vacancy: jobId === '3801' ? '2' : jobId === '3802' ? '1' : '1',
          gender: 'All',
          description: jobId === '3801' ? 'We are looking for a talented person who can. Good in analytics.' : 
                      jobId === '3802' ? 'We are looking for someone who want to become. Data scientist' : 
                      'Job description will be updated soon.',
          company: 'BnC Global',
          responsibilities: [
            'Analyze business processes and recommend improvements',
            'Collaborate with stakeholders to gather requirements',
            'Create detailed documentation and reports',
            'Support project management activities'
          ],
          requirements: [
            'Bachelor\'s degree required',
            'Relevant experience required',
            'Strong analytical and problem-solving skills',
            'Excellent communication abilities'
          ]
        };
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      return null;
    }
  },

  async submitApplication(applicationData) {
    try {
      console.log('Submitting application:', applicationData);
      
      // Use form data approach to avoid CORS issues
      const formData = new FormData();
      formData.append('action', 'submitApplication');
      
      // Add all application data as form fields
      Object.keys(applicationData).forEach(key => {
        if (applicationData[key] !== null && applicationData[key] !== undefined) {
          formData.append(key, applicationData[key]);
        }
      });
      
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      console.log('Application response:', data);
      
      return data;
    } catch (error) {
      console.error('Error submitting application:', error);
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
      console.error('Error in adminLogin:', error);
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
      return await response.json();
    } catch (error) {
      console.error('Error in addJob:', error);
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
      return await response.json();
    } catch (error) {
      console.error('Error in updateJob:', error);
      return { error: error.toString() };
    }
  },

  async deleteJob(jobId) {
    try {
      const formData = new FormData();
      formData.append('action', 'deleteJob');
      formData.append('jobId', jobId);
      const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
      return await response.json();
    } catch (error) {
      console.error('Error in deleteJob:', error);
      return { error: error.toString() };
    }
  },

  async fetchCandidates() {
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getCandidates`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.candidates)) {
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
      return await response.json();
    } catch (error) {
      console.error('Error in uploadCVToDatabase:', error);
      return { error: error.toString() };
    }
  },

  async getDatabaseCandidates() {
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getDatabaseCandidates`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.candidates)) {
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
      return await response.json();
    } catch (error) {
      console.error('Error updating database candidate:', error);
      return { error: error.toString() };
    }
  },

  async getDatabaseCandidateById(applicantId) {
    try {
      const all = await this.getDatabaseCandidates();
      return all.find(c => c.applicantId === applicantId.toString()) || null;
    } catch (error) {
      console.error('Error fetching candidate by ID:', error);
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
      return await response.json();
    } catch (error) {
      console.error('Error shortlisting candidate:', error);
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
      return await response.json();
    } catch (error) {
      console.error('Error removing shortlist:', error);
      return { error: error.toString() };
    }
  },

  async getShortlistedCandidates() {
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getShortlistedCandidates`);
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching shortlisted candidates:', error);
      return [];
    }
  },

  async fetchClients() {
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getClients`);
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      return data.clients || [];
    } catch (error) {
      console.error('Error fetching clients:', error);
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
      return await response.json();
    } catch (error) {
      console.error('Error adding client:', error);
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
      return await response.json();
    } catch (error) {
      console.error('Error updating client:', error);
      return { error: error.toString() };
    }
  },

  async fetchClientJobs() {
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getClientJobs`);
      const data = await response.json();
      return data.success ? data.clientJobs : [];
    } catch (error) {
      console.error('Error fetching client jobs:', error);
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
      return await response.json();
    } catch (error) {
      console.error('Error adding client job:', error);
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
      return await response.json();
    } catch (error) {
      console.error('Error updating client job:', error);
      return { error: error.toString() };
    }
  }
};