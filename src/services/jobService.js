const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBk0vDJYVc1lHFCMz5ij4qdg_iiTP0OKfvw-opBq3iEGe5uCUdp0xRK4Pw__NuyU1pTg/exec';

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
  }
};