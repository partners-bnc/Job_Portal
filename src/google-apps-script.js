// Google Apps Script code - Deploy this as a web app
// Spreadsheet ID: 1wGab533KRu2C4qcIF1N0Q6MH9PDdvUMLZJsLJRAZeGo
// Sheets required: "Job detail", "Candidate detail", "Admin Login"

const SPREADSHEET_ID = '1wGab533KRu2C4qcIF1N0Q6MH9PDdvUMLZJsLJRAZeGo';

function doGet(e) {
  console.log('Received GET parameters:', e.parameter);
  const action = e.parameter.action;

  if (action === 'getJobs') {
    return getJobs();
  } else if (action === 'getJob') {
    return getJobById(e.parameter.jobId);
  } else if (action === 'getCandidates') {
    return getCandidates();
  }

  console.log('Invalid GET action received:', action);
  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action', received: action }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    let data;

    // Handle FormData parameters
    if (e.parameter && e.parameter.action) {
      data = e.parameter;
      console.log('Using FormData parameters:', data);
    } else if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
      console.log('Using JSON data:', data);
    } else {
      throw new Error('No data received');
    }

    if (data.action === 'submitApplication') {
      return submitJobApplication(data);
    } else if (data.action === 'adminLogin') {
      return adminLogin(data);
    } else if (data.action === 'addJob') {
      return addJob(data);
    } else if (data.action === 'updateJob') {
      return updateJob(data);
    } else if (data.action === 'deleteJob') {
      return deleteJob(data);
    } else if (data.action === 'saveAiAnalysis') {
      return saveAiAnalysis(data);
    }

    return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid POST action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.log('Error in doPost:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─────────────────────────────────────────────
// ADMIN AUTH
// ─────────────────────────────────────────────

function adminLogin(data) {
  try {
    const loginId = (data.loginId || '').trim();
    const password = (data.password || '').trim();

    if (!loginId || !password) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Login ID and Password are required' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Admin Login');
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: '"Admin Login" sheet not found. Please create it.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const rows = sheet.getDataRange().getValues();
    // Row 0 is header: ["Login ID", "Password"]
    for (let i = 1; i < rows.length; i++) {
      const sheetLoginId = rows[i][0] ? rows[i][0].toString().trim() : '';
      const sheetPassword = rows[i][1] ? rows[i][1].toString().trim() : '';

      if (sheetLoginId === loginId && sheetPassword === password) {
        console.log('Admin login successful for:', loginId);
        return ContentService.createTextOutput(JSON.stringify({ success: true, loginId: loginId }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    console.log('Admin login failed for:', loginId);
    return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid Login ID or Password' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.log('Error in adminLogin:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─────────────────────────────────────────────
// AI SHORTLISTING — SAVE ANALYSIS
// ─────────────────────────────────────────────

function saveAiAnalysis(data) {
  try {
    const email = (data.email || '').trim().toLowerCase();
    const jobApplied = (data.jobApplied || '').trim();

    if (!email) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Email is required to save AI analysis' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Candidate detail');
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: '"Candidate detail" sheet not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const rows = sheet.getDataRange().getValues();

    // Ensure header row has all 20 columns
    if (rows.length > 0 && rows[0].length < 20) {
      sheet.getRange(1, 17, 1, 4).setValues([['AI Score (/ 10)', 'AI Analysis', 'Shortlisting Decision', 'Shortlisting Reason']]);
    }

    // Find the most recent row matching the email (search from bottom)
    let targetRow = -1;
    for (let i = rows.length - 1; i >= 1; i--) {
      const rowEmail = (rows[i][2] || '').toString().trim().toLowerCase();
      if (rowEmail === email) {
        targetRow = i + 1; // 1-indexed for Sheets
        break;
      }
    }

    if (targetRow === -1) {
      console.log('Candidate not found for email:', email);
      return ContentService.createTextOutput(JSON.stringify({ error: 'Candidate not found for email: ' + email }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Write AI columns Q(17), R(18), S(19), T(20)
    sheet.getRange(targetRow, 17, 1, 4).setValues([[
      data.aiScore || '',
      data.aiAnalysis || '',
      data.shortlistDecision || '',
      data.shortlistReason || ''
    ]]);

    console.log('AI analysis saved for:', email, 'Row:', targetRow);
    return ContentService.createTextOutput(JSON.stringify({ success: true, row: targetRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.log('Error in saveAiAnalysis:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}



function addJob(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Job detail');
    if (!sheet) throw new Error('"Job detail" sheet not found');

    // Auto-generate Job ID based on last row
    const lastRow = sheet.getLastRow();
    let newJobId;
    if (lastRow <= 1) {
      newJobId = '3801';
    } else {
      const lastId = sheet.getRange(lastRow, 1).getValue();
      const parsed = parseInt(lastId.toString());
      newJobId = isNaN(parsed) ? String(Date.now()).slice(-6) : String(parsed + 1);
    }

    // Ensure header row exists
    if (lastRow === 0) {
      sheet.getRange(1, 1, 1, 10).setValues([[
        'Job Id', 'Job Role', 'Location', 'Job type', 'Experience',
        'Salary', 'Education Qualification', 'No. Of Vacancy', 'Gender', 'Job Description'
      ]]);
    }

    const rowData = [
      newJobId,
      data.title || '',
      data.location || '',
      data.type || '',
      data.experience || '',
      data.salary || '',
      data.education || '',
      data.vacancy || '',
      data.gender || '',
      data.description || ''
    ];

    sheet.appendRow(rowData);
    console.log('Job added with ID:', newJobId);

    return ContentService.createTextOutput(JSON.stringify({ success: true, jobId: newJobId, message: 'Job posted successfully' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.log('Error in addJob:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateJob(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Job detail');
    if (!sheet) throw new Error('"Job detail" sheet not found');

    const jobId = data.id ? data.id.toString() : null;
    if (!jobId) throw new Error('Job ID is required for update');

    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] && rows[i][0].toString() === jobId) {
        const rowNumber = i + 1;
        sheet.getRange(rowNumber, 1, 1, 10).setValues([[
          jobId,
          data.title || rows[i][1],
          data.location || rows[i][2],
          data.type || rows[i][3],
          data.experience || rows[i][4],
          data.salary || rows[i][5],
          data.education || rows[i][6],
          data.vacancy || rows[i][7],
          data.gender || rows[i][8],
          data.description || rows[i][9]
        ]]);
        console.log('Job updated, ID:', jobId);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Job updated successfully' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ error: 'Job not found for ID: ' + jobId }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.log('Error in updateJob:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function deleteJob(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Job detail');
    if (!sheet) throw new Error('"Job detail" sheet not found');

    const jobId = data.jobId ? data.jobId.toString() : null;
    if (!jobId) throw new Error('Job ID is required for deletion');

    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] && rows[i][0].toString() === jobId) {
        sheet.deleteRow(i + 1);
        console.log('Job deleted, ID:', jobId);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Job deleted successfully' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ error: 'Job not found for ID: ' + jobId }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.log('Error in deleteJob:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─────────────────────────────────────────────
// JOB FETCHING (existing, unchanged)
// ─────────────────────────────────────────────

function getJobs() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Job detail');
    const data = sheet.getDataRange().getValues();
    const jobs = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[1]) {
        jobs.push({
          id: row[0].toString(),
          title: row[1],
          location: row[2],
          type: row[3],
          experience: row[4],
          salary: row[5],
          education: row[6],
          vacancy: row[7],
          gender: row[8],
          description: row[9],
          company: 'BnC Global'
        });
      }
    }

    console.log('Found jobs:', jobs.length);
    return ContentService.createTextOutput(JSON.stringify({ success: true, jobs: jobs }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.log('Error in getJobs:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getJobById(jobId) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Job detail');
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0].toString() == jobId.toString()) {
        const job = {
          id: row[0].toString(),
          title: row[1],
          location: row[2],
          type: row[3],
          experience: row[4],
          salary: row[5],
          education: row[6],
          vacancy: row[7],
          gender: row[8],
          description: row[9],
          company: 'BnC Global',
          responsibilities: [
            'Analyze business processes and recommend improvements',
            'Collaborate with stakeholders to gather requirements',
            'Create detailed documentation and reports',
            'Support project management activities'
          ],
          requirements: [
            row[6] || 'Bachelor\'s degree required',
            (row[4] || 'Experience') + ' required',
            'Strong analytical and problem-solving skills',
            'Excellent communication abilities'
          ]
        };
        return ContentService.createTextOutput(JSON.stringify({ success: true, job: job }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ error: 'Job not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─────────────────────────────────────────────
// CANDIDATE MANAGEMENT
// ─────────────────────────────────────────────

function getCandidates() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Candidate detail');
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ success: true, candidates: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ success: true, candidates: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const candidates = [];
    // Headers: Timestamp, Candidate Name, Email, Contact Number, Current Location,
    //          Recent Education, Total Experience, Current Company, Current Position,
    //          Current CTC, Expected CTC, Notice Period, Job Applied, Resume Link, Email Status, Status,
    //          AI Score(/10), AI Analysis, Shortlisting Decision, Shortlisting Reason
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1]) { // Must have at least a name
        candidates.push({
          timestamp: row[0] ? new Date(row[0]).toISOString() : '',
          name: row[1] || '',
          email: row[2] || '',
          contactNumber: row[3] || '',
          currentLocation: row[4] || '',
          recentEducation: row[5] || '',
          totalExperience: row[6] || '',
          currentCompany: row[7] || '',
          currentPosition: row[8] || '',
          currentCTC: row[9] || '',
          expectedCTC: row[10] || '',
          noticePeriod: row[11] || '',
          jobApplied: row[12] || '',
          resumeLink: row[13] || '',
          emailStatus: row[14] || '',
          status: row[15] || 'Applied',
          aiScore: row[16] !== undefined && row[16] !== '' ? row[16] : null,
          aiAnalysis: row[17] || '',
          shortlistDecision: row[18] || '',
          shortlistReason: row[19] || ''
        });
      }
    }

    console.log('Found candidates:', candidates.length);
    return ContentService.createTextOutput(JSON.stringify({ success: true, candidates: candidates }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.log('Error in getCandidates:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─────────────────────────────────────────────
// JOB APPLICATION SUBMISSION (existing)
// ─────────────────────────────────────────────

function submitJobApplication(data) {
  try {
    console.log('Processing application data:', Object.keys(data));

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Candidate detail');
    if (!sheet) throw new Error('Candidate detail sheet not found');

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    if (lastRow === 0 || lastCol === 0) {
      sheet.getRange(1, 1, 1, 20).setValues([[
        'Timestamp', 'Candidate Name', 'Email', 'Contact Number', 'Current Location',
        'Recent Education', 'Total Experience', 'Current Company', 'Current Position',
        'Current CTC', 'Expected CTC', 'Notice Period', 'Job Applied', 'Resume Link', 'Email Status', 'Status',
        'AI Score (/ 10)', 'AI Analysis', 'Shortlisting Decision', 'Shortlisting Reason'
      ]]);
    }

    let resumeUrl = 'No resume uploaded';
    if (data.resumeData && data.resumeFileName && data.candidateName) {
      console.log('Attempting resume upload...');
      resumeUrl = uploadResumeToGoogleDrive(data.resumeData, data.resumeFileName, data.candidateName);
    }

    let emailStatus = 'Email not sent';
    if (data.email && data.candidateName && data.jobTitle) {
      emailStatus = sendConfirmationEmail(data);
    }

    const rowData = [
      new Date(),
      data.candidateName || 'N/A',
      data.email || 'N/A',
      data.contactNumber || 'N/A',
      data.currentLocation || 'N/A',
      data.recentEducation || 'N/A',
      data.totalExperience || 'N/A',
      data.currentCompany || 'N/A',
      data.currentPosition || 'N/A',
      data.currentCTC || 'N/A',
      data.expectedCTC || 'N/A',
      data.noticePeriod || 'N/A',
      `${data.jobTitle || 'Unknown'} (ID: ${data.jobId || 'Unknown'})`,
      resumeUrl,
      emailStatus,
      'Applied'
    ];

    sheet.appendRow(rowData);
    console.log('Application data saved successfully');

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Application submitted successfully'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.log('Error in submitJobApplication:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function uploadResumeToGoogleDrive(base64Data, fileName, candidateName) {
  try {
    const folderId = '1YtEfQOQSmfXGvgifbm4_ezhcHfSue3_3';
    let folder;
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (folderError) {
      return 'Resume upload failed: Cannot access Google Drive folder';
    }

    let cleanBase64 = base64Data;
    if (base64Data && base64Data.includes(',')) {
      cleanBase64 = base64Data.split(',')[1];
    }
    if (!cleanBase64) return 'Resume upload failed: No file data';

    const binaryData = Utilities.base64Decode(cleanBase64);
    const safeFileName = `${candidateName.replace(/[^a-zA-Z0-9]/g, '_')}_${fileName}`;
    const blob = Utilities.newBlob(binaryData, 'application/pdf', safeFileName);
    const file = folder.createFile(blob);

    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingError) {
      console.log('Warning: Could not set file sharing:', sharingError.toString());
    }

    return `https://drive.google.com/file/d/${file.getId()}/view?usp=sharing`;
  } catch (error) {
    return `Resume upload failed: ${error.toString()}`;
  }
}

function sendConfirmationEmail(data) {
  try {
    const subject = `Application Confirmation - ${data.jobTitle} Position`;
    const body = `
Dear ${data.candidateName},

Greeting! Thank you for applying for the ${data.jobTitle} position with Job ID: ${data.jobId}.

We have successfully received your application. Our team will be reviewing your profile and will get in touch with you shortly.

Meanwhile, feel free to explore BnC Global and all our business services.

Best regards,
BnC Global Recruitment Team

Note: This is an automated email. Please do not reply to this email.
    `;
    MailApp.sendEmail({ to: data.email, subject: subject, body: body });
    return 'Email Sent Successfully';
  } catch (error) {
    return 'Email Failed: ' + error.toString();
  }
}
