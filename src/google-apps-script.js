// Google Apps Script code - Deploy this as a web app
// Spreadsheet ID: 1wGab533KRu2C4qcIF1N0Q6MH9PDdvUMLZJsLJRAZeGo
// Sheets required: "Job detail", "Candidate detail", "Admin Login", "Database"

const SPREADSHEET_ID = '1wGab533KRu2C4qcIF1N0Q6MH9PDdvUMLZJsLJRAZeGo';

const DATABASE_HEADERS = [
  'Applicant ID', 'Timestamp', 'Source', 'Full Name', 'Email', 'Mobile Number',
  'Current Location', 'Current Company', 'Current Position', 'Total Experience',
  'Education', 'Skills', 'CV Summary', 'Job Applied For', 'Job ID', 'Resume Link',
  'Uploaded By', 'Created On', 'AI Score', 'AI Analysis', 'Shortlisting Decision',
  'Shortlisting Reason', 'Status'
];

function doGet(e) {
  console.log('Received GET parameters:', e.parameter);
  const action = e.parameter.action;

  if (action === 'getJobs') {
    return getJobs();
  } else if (action === 'getJob') {
    return getJobById(e.parameter.jobId);
  } else if (action === 'getCandidates') {
    return getCandidates();
  } else if (action === 'getDatabaseCandidates') {
    return getDatabaseCandidates();
  } else if (action === 'getShortlistedCandidates') {
    return getShortlistedCandidates();
  } else if (action === 'getClients') {
    return getClients();
  } else if (action === 'getClientJobs') {
    return getClientJobs();
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
    } else if (data.action === 'uploadCV') {
      return uploadCVToDatabase(data);
    } else if (data.action === 'updateDatabaseCandidate') {
      return updateDatabaseCandidate(data);
    } else if (data.action === 'shortlistCandidate') {
      return shortlistCandidate(data);
    } else if (data.action === 'addClient') {
      return addClient(data);
    } else if (data.action === 'updateClient') {
      return updateClient(data);
    } else if (data.action === 'addClientJob') {
      return addClientJob(data);
    } else if (data.action === 'updateClientJob') {
      return updateClientJob(data);
    } else if (data.action === 'removeShortlist') {
      return removeShortlist(data);
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
// HELPERS
// ─────────────────────────────────────────────

function getOrCreateDatabaseSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Database');
  if (!sheet) {
    sheet = ss.insertSheet('Database');
  }
  // Ensure headers exist
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, DATABASE_HEADERS.length).setValues([DATABASE_HEADERS]);
  }
  return sheet;
}

function getNextApplicantId(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1; // Only header or empty
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let maxId = 0;
  for (let i = 0; i < ids.length; i++) {
    const val = parseInt(ids[i][0]);
    if (!isNaN(val) && val > maxId) maxId = val;
  }
  return maxId + 1;
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
// CV UPLOAD TO DATABASE (HR Upload)
// ─────────────────────────────────────────────

function uploadCVToDatabase(data) {
  try {
    const dbSheet = getOrCreateDatabaseSheet();
    const applicantId = getNextApplicantId(dbSheet);
    const now = new Date();

    let resumeUrl = 'No resume uploaded';
    if (data.resumeData && data.resumeFileName && data.candidateName) {
      resumeUrl = uploadResumeToGoogleDrive(data.resumeData, data.resumeFileName, data.candidateName);
    }

    const rowData = [
      applicantId,
      now,
      data.source || 'HR Upload',
      data.candidateName || '',
      data.email || '',
      data.contactNumber ? `'${data.contactNumber}` : '',
      data.currentLocation || '',
      data.currentCompany || '',
      data.currentPosition || '',
      data.totalExperience || '',
      data.education || '',
      data.skills || '',
      data.summary || '',
      '', // Job Applied For — N/A for HR uploads
      '', // Job ID — N/A for HR uploads
      resumeUrl,
      data.uploadedBy || 'Admin',
      now,
      '', '', '', '', // AI fields — empty initially
      'In Database'  // Status
    ];

    dbSheet.appendRow(rowData);
    console.log('CV uploaded to Database, Applicant ID:', applicantId);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      applicantId: applicantId,
      message: 'CV uploaded and saved to database successfully'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.log('Error in uploadCVToDatabase:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─────────────────────────────────────────────
// UPDATE DATABASE CANDIDATE BY ID
// ─────────────────────────────────────────────

function updateDatabaseCandidate(data) {
  try {
    var applicantId = data.applicantId ? data.applicantId.toString() : null;
    if (!applicantId) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Applicant ID is required' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var dbSheet = getOrCreateDatabaseSheet();
    var rows = dbSheet.getDataRange().getValues();
    var targetRow = -1;

    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] && rows[i][0].toString() === applicantId) {
        targetRow = i + 1;
        break;
      }
    }

    if (targetRow === -1) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Applicant not found: ' + applicantId }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Update columns D(4) through W(23) — keeping A(ID), B(timestamp), C(source) untouched
    // Col mapping: D=name, E=email, F=mobile, G=location, H=company, I=position,
    //  J=experience, K=education, L=skills, M=summary, N=jobApplied, O=jobId,
    //  P=resumeLink(skip), Q=uploadedBy(skip), R=createdOn(skip),
    //  S=aiScore, T=aiAnalysis, U=shortlistDecision, V=shortlistReason, W=status
    var existingRow = rows[targetRow - 1];

    var updatedValues = [
      data.name !== undefined ? data.name : existingRow[3],
      data.email !== undefined ? data.email : existingRow[4],
      data.contactNumber !== undefined ? (data.contactNumber.toString().startsWith("'") ? data.contactNumber : "'" + data.contactNumber) : existingRow[5],
      data.currentLocation !== undefined ? data.currentLocation : existingRow[6],
      data.currentCompany !== undefined ? data.currentCompany : existingRow[7],
      data.currentPosition !== undefined ? data.currentPosition : existingRow[8],
      data.totalExperience !== undefined ? data.totalExperience : existingRow[9],
      data.education !== undefined ? data.education : existingRow[10],
      data.skills !== undefined ? data.skills : existingRow[11],
      data.summary !== undefined ? data.summary : existingRow[12],
      data.jobAppliedFor !== undefined ? data.jobAppliedFor : existingRow[13],
      data.jobId !== undefined ? data.jobId : existingRow[14],
      existingRow[15], // Resume Link — don't change
      existingRow[16], // Uploaded By — don't change
      existingRow[17], // Created On — don't change
      data.aiScore !== undefined ? data.aiScore : existingRow[18],
      data.aiAnalysis !== undefined ? data.aiAnalysis : existingRow[19],
      data.shortlistDecision !== undefined ? data.shortlistDecision : existingRow[20],
      data.shortlistReason !== undefined ? data.shortlistReason : existingRow[21],
      data.status !== undefined ? data.status : existingRow[22]
    ];

    dbSheet.getRange(targetRow, 4, 1, 20).setValues([updatedValues]);
    console.log('Database candidate updated, ID:', applicantId);

    return ContentService.createTextOutput(JSON.stringify({
      success: true, message: 'Candidate updated successfully', applicantId: applicantId
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.log('Error in updateDatabaseCandidate:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─────────────────────────────────────────────
// GET ALL DATABASE CANDIDATES
// ─────────────────────────────────────────────

function getDatabaseCandidates() {
  try {
    const sheet = getOrCreateDatabaseSheet();
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ success: true, candidates: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const candidates = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue; // skip empty rows
      candidates.push({
        applicantId: row[0] !== undefined ? row[0].toString() : '',
        timestamp:   row[1] ? new Date(row[1]).toISOString() : '',
        source:      row[2] || '',
        name:        row[3] || '',
        email:       row[4] || '',
        contactNumber: row[5] ? row[5].toString().replace(/^'/, '') : '',
        currentLocation: row[6] || '',
        currentCompany:  row[7] || '',
        currentPosition: row[8] || '',
        totalExperience: row[9] !== undefined ? row[9].toString() : '',
        education:    row[10] || '',
        skills:       row[11] || '',
        summary:      row[12] || '',
        jobAppliedFor: row[13] || '',
        jobId:        row[14] !== undefined ? row[14].toString() : '',
        resumeLink:   row[15] || '',
        uploadedBy:   row[16] || '',
        createdOn:    row[17] ? new Date(row[17]).toISOString() : '',
        aiScore:      row[18] !== undefined && row[18] !== '' ? row[18] : null,
        aiAnalysis:   row[19] || '',
        shortlistDecision: row[20] || '',
        shortlistReason:   row[21] || '',
        status:       row[22] || 'Applied'
      });
    }

    console.log('Found database candidates:', candidates.length);
    return ContentService.createTextOutput(JSON.stringify({ success: true, candidates: candidates }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.log('Error in getDatabaseCandidates:', error.toString());
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

    // ── Update Candidate detail sheet ──
    const candidateSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Candidate detail');
    if (candidateSheet) {
      const rows = candidateSheet.getDataRange().getValues();
      if (rows.length > 0 && rows[0].length < 20) {
        candidateSheet.getRange(1, 17, 1, 4).setValues([['AI Score (/ 10)', 'AI Analysis', 'Shortlisting Decision', 'Shortlisting Reason']]);
      }
      let targetRow = -1;
      for (let i = rows.length - 1; i >= 1; i--) {
        const rowEmail = (rows[i][2] || '').toString().trim().toLowerCase();
        if (rowEmail === email) { targetRow = i + 1; break; }
      }
      if (targetRow !== -1) {
        candidateSheet.getRange(targetRow, 17, 1, 4).setValues([[
          data.aiScore || '', data.aiAnalysis || '',
          data.shortlistDecision || '', data.shortlistReason || ''
        ]]);
        console.log('AI analysis saved to Candidate detail, Row:', targetRow);
      }
    }

    // ── Also update Database sheet ──
    const dbSheet = getOrCreateDatabaseSheet();
    const dbRows = dbSheet.getDataRange().getValues();
    let dbTargetRow = -1;
    for (let i = dbRows.length - 1; i >= 1; i--) {
      const rowEmail = (dbRows[i][4] || '').toString().trim().toLowerCase();
      if (rowEmail === email) { dbTargetRow = i + 1; break; }
    }
    if (dbTargetRow !== -1) {
      // Cols S(19), T(20), U(21), V(22) = index 18,19,20,21 = columns 19,20,21,22
      dbSheet.getRange(dbTargetRow, 19, 1, 4).setValues([[
        data.aiScore || '', data.aiAnalysis || '',
        data.shortlistDecision || '', data.shortlistReason || ''
      ]]);
      console.log('AI analysis saved to Database, Row:', dbTargetRow);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.log('Error in saveAiAnalysis:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─────────────────────────────────────────────
// JOB MANAGEMENT
// ─────────────────────────────────────────────

function addJob(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Job detail');
    if (!sheet) throw new Error('"Job detail" sheet not found');

    const lastRow = sheet.getLastRow();
    let newJobId;
    if (lastRow <= 1) {
      newJobId = '3801';
    } else {
      const lastId = sheet.getRange(lastRow, 1).getValue();
      const parsed = parseInt(lastId.toString());
      newJobId = isNaN(parsed) ? String(Date.now()).slice(-6) : String(parsed + 1);
    }

    if (lastRow === 0) {
      sheet.getRange(1, 1, 1, 10).setValues([[
        'Job Id', 'Job Role', 'Location', 'Job type', 'Experience',
        'Salary', 'Education Qualification', 'No. Of Vacancy', 'Gender', 'Job Description'
      ]]);
    }

    sheet.appendRow([
      newJobId, data.title || '', data.location || '', data.type || '',
      data.experience || '', data.salary || '', data.education || '',
      data.vacancy || '', data.gender || '', data.description || ''
    ]);
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
          jobId, data.title || rows[i][1], data.location || rows[i][2],
          data.type || rows[i][3], data.experience || rows[i][4],
          data.salary || rows[i][5], data.education || rows[i][6],
          data.vacancy || rows[i][7], data.gender || rows[i][8],
          data.description || rows[i][9]
        ]]);
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
// JOB FETCHING
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
          id: row[0].toString(), title: row[1], location: row[2],
          type: row[3], experience: row[4], salary: row[5],
          education: row[6], vacancy: row[7], gender: row[8],
          description: row[9], company: 'BnC Global'
        });
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, jobs: jobs }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
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
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          job: {
            id: row[0].toString(), title: row[1], location: row[2],
            type: row[3], experience: row[4], salary: row[5],
            education: row[6], vacancy: row[7], gender: row[8],
            description: row[9], company: 'BnC Global',
            responsibilities: [
              'Analyze business processes and recommend improvements',
              'Collaborate with stakeholders to gather requirements',
              'Create detailed documentation and reports',
              'Support project management activities'
            ],
            requirements: [
              row[6] || "Bachelor's degree required",
              (row[4] || 'Experience') + ' required',
              'Strong analytical and problem-solving skills',
              'Excellent communication abilities'
            ]
          }
        })).setMimeType(ContentService.MimeType.JSON);
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
// CANDIDATE MANAGEMENT (existing Candidate detail sheet)
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
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1]) {
        candidates.push({
          timestamp: row[0] ? new Date(row[0]).toISOString() : '',
          name: row[1] || '', email: row[2] || '',
          contactNumber: row[3] ? row[3].toString().replace(/^'/, '') : '',
          currentLocation: row[4] || '', recentEducation: row[5] || '',
          totalExperience: row[6] || '', currentCompany: row[7] || '',
          currentPosition: row[8] || '', currentCTC: row[9] || '',
          expectedCTC: row[10] || '', noticePeriod: row[11] || '',
          jobApplied: row[12] || '', resumeLink: row[13] || '',
          emailStatus: row[14] || '', status: row[15] || 'Applied',
          aiScore: row[16] !== undefined && row[16] !== '' ? row[16] : null,
          aiAnalysis: row[17] || '', shortlistDecision: row[18] || '',
          shortlistReason: row[19] || ''
        });
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, candidates: candidates }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.log('Error in getCandidates:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─────────────────────────────────────────────
// JOB APPLICATION SUBMISSION
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
      resumeUrl = uploadResumeToGoogleDrive(data.resumeData, data.resumeFileName, data.candidateName);
    }

    let emailStatus = 'Email not sent';
    if (data.email && data.candidateName && data.jobTitle) {
      emailStatus = sendConfirmationEmail(data);
    }

    // Write to Candidate detail sheet (existing behaviour)
    const contactStr = data.contactNumber ? data.contactNumber.toString() : 'N/A';
    sheet.appendRow([
      new Date(),
      data.candidateName || 'N/A',
      data.email || 'N/A',
      contactStr.startsWith("'") ? contactStr : `'${contactStr}`,
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
    ]);

    // Also write to Database sheet (centralised)
    try {
      const dbSheet = getOrCreateDatabaseSheet();
      const applicantId = getNextApplicantId(dbSheet);
      const now = new Date();

      dbSheet.appendRow([
        applicantId,
        now,
        'Job Application',
        data.candidateName || '',
        data.email || '',
        contactStr.startsWith("'") ? contactStr : `'${contactStr}`,
        data.currentLocation || '',
        data.currentCompany || '',
        data.currentPosition || '',
        data.totalExperience || '',
        data.recentEducation || '',
        '', // skills — will be added by AI analysis later
        '', // summary — will be added by AI analysis later
        `${data.jobTitle || ''} (ID: ${data.jobId || ''})`,
        data.jobId || '',
        resumeUrl,
        'Self Applied',
        now,
        '', '', '', '', // AI fields
        'Applied'
      ]);
      console.log('Application also saved to Database, Applicant ID:', applicantId);
    } catch (dbErr) {
      console.log('Warning: Could not save to Database sheet:', dbErr.toString());
    }

    console.log('Application data saved successfully');
    return ContentService.createTextOutput(JSON.stringify({
      success: true, message: 'Application submitted successfully'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.log('Error in submitJobApplication:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─────────────────────────────────────────────
// GOOGLE DRIVE RESUME UPLOAD
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// EMAIL CONFIRMATION
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// SHORTLISTING
// ─────────────────────────────────────────────

function getOrCreateShortlistedSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Shortlisted Candidates');
  if (!sheet) {
    sheet = ss.insertSheet('Shortlisted Candidates');
    sheet.getRange(1, 1, 1, 7).setValues([['Applicant ID', 'Name', 'Job Role', 'Company', 'Shortlisted By', 'Date', 'Job Code']]);
    // Format headers
    sheet.getRange('A1:G1').setFontWeight('bold').setBackground('#f3f4f6');
  }
  return sheet;
}

function shortlistCandidate(data) {
  try {
    const applicantId = data.applicantId ? data.applicantId.toString() : '';
    const now = new Date();

    // 1. Append to Shortlisted sheet
    const shortSheet = getOrCreateShortlistedSheet();
    shortSheet.appendRow([
      applicantId,
      data.name || '',
      data.jobRole || '',
      data.company || '',
      data.shortlistedBy || 'Admin',
      now,
      data.jobCode || ''
    ]);

    // 2. Update status in Database sheet
    var dbSheet = getOrCreateDatabaseSheet();
    var rows = dbSheet.getDataRange().getValues();
    var targetRow = -1;

    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] && rows[i][0].toString() === applicantId) {
        targetRow = i + 1;
        break;
      }
    }
    
    if (targetRow > -1) {
      dbSheet.getRange(targetRow, 23).setValue('Shortlisted'); // Column W (23) is Status
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.log('Error in shortlistCandidate:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function removeShortlist(data) {
  try {
    const applicantId = data.applicantId ? data.applicantId.toString() : '';
    const jobCode = data.jobCode || '';
    
    // 1. Remove from Shortlisted sheet
    const shortSheet = getOrCreateShortlistedSheet();
    const shortRows = shortSheet.getDataRange().getValues();
    let rowToDelete = -1;
    
    for (let i = 1; i < shortRows.length; i++) {
      // Column index 0 is Applicant ID, index 6 is Job Code
      const rowAppId = shortRows[i][0] ? shortRows[i][0].toString() : '';
      const rowJobCode = shortRows[i][6] ? shortRows[i][6].toString() : '';
      
      if (rowAppId === applicantId && rowJobCode === jobCode) {
        rowToDelete = i + 1;
        break;
      }
    }
    
    if (rowToDelete > -1) {
      shortSheet.deleteRow(rowToDelete);
    }

    // 2. Revert status in Database sheet
    const dbSheet = getOrCreateDatabaseSheet();
    const dbRows = dbSheet.getDataRange().getValues();
    let targetDbRow = -1;

    for (let i = 1; i < dbRows.length; i++) {
      if (dbRows[i][0] && dbRows[i][0].toString() === applicantId) {
        targetDbRow = i + 1;
        break;
      }
    }
    
    if (targetDbRow > -1) {
      // Set status back to 'In Database' (reverting from 'Shortlisted')
      dbSheet.getRange(targetDbRow, 23).setValue('In Database'); 
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.log('Error in removeShortlist:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getShortlistedCandidates() {
  try {
    const sheet = getOrCreateShortlistedSheet();
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return ContentService.createTextOutput(JSON.stringify({ data: [] })).setMimeType(ContentService.MimeType.JSON);

    const data = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const obj = {};
      obj.applicantId = row[0] ? row[0].toString() : '';
      obj.name = row[1];
      obj.jobRole = row[2];
      obj.company = row[3];
      obj.shortlistedBy = row[4];
      obj.date = row[5] ? new Date(row[5]).toISOString() : null;
      obj.jobCode = row[6] || '';
      data.push(obj);
    }
    
    // Reverse array to show newest first
    return ContentService.createTextOutput(JSON.stringify({ data: data.reverse() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─────────────────────────────────────────────
// CLIENT MANAGEMENT
// ─────────────────────────────────────────────

function getOrCreateClientsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Clients');
  if (!sheet) {
    sheet = ss.insertSheet('Clients');
    const headers = ['Client Id', 'Client Name', 'Contact Number', 'Email', 'Website', 'Industry', 'Status', 'Manage by', 'Business Unit', 'Display on Job Posting', 'Created by', 'Created On', 'Modified On', 'Modified By'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange('A1:N1').setFontWeight('bold');
  } else {
    // Ensure header row is correct if appending new column manually
    const headers = ['Client Id', 'Client Name', 'Contact Number', 'Email', 'Website', 'Industry', 'Status', 'Manage by', 'Business Unit', 'Display on Job Posting', 'Created by', 'Created On', 'Modified On', 'Modified By'];
    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (currentHeaders.length < headers.length || currentHeaders[3] !== 'Email') {
       // Just update headers safely. The user must rearrange columns. 
       sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }
  return sheet;
}

function getNextClientId(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1001;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let maxId = 1000;
  for (let i = 0; i < ids.length; i++) {
    const val = parseInt(ids[i][0]);
    if (!isNaN(val) && val > maxId) maxId = val;
  }
  return maxId + 1;
}

function getClients() {
  try {
    const sheet = getOrCreateClientsSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify({ success: true, clients: [] })).setMimeType(ContentService.MimeType.JSON);

    const clients = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) {
        clients.push({
          clientId: row[0] !== undefined ? row[0].toString() : '',
          clientName: row[1] || '',
          contactNumber: row[2] ? row[2].toString().replace(/^'/, '') : '',
          email: row[3] || '',
          website: row[4] || '',
          industry: row[5] || '',
          status: row[6] || '',
          primaryOwner: row[7] || '',
          businessUnit: row[8] || '',
          displayOnJobPosting: row[9] || '',
          createdBy: row[10] || '',
          createdOn: row[11] ? new Date(row[11]).toISOString() : '',
          modifiedOn: row[12] ? new Date(row[12]).toISOString() : '',
          modifiedBy: row[13] || ''
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, clients: clients.reverse() })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function addClient(data) {
  try {
    const sheet = getOrCreateClientsSheet();
    // Use provided clientId if exists, otherwise generate
    const newClientId = data.clientId ? data.clientId : getNextClientId(sheet);
    const now = new Date();

    const contactStr = data.contactNumber ? data.contactNumber.toString() : '';
    sheet.appendRow([
      newClientId,
      data.clientName || '',
      contactStr.startsWith("'") ? contactStr : `'${contactStr}`,
      data.email || '',
      data.website || '',
      data.industry || '',
      data.status || 'Active',
      data.primaryOwner || '',
      data.businessUnit || '',
      data.displayOnJobPosting || 'No',
      data.createdBy || 'Admin',
      now,
      '',
      ''
    ]);

    return ContentService.createTextOutput(JSON.stringify({ success: true, clientId: newClientId, message: 'Client added successfully' })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateClient(data) {
  try {
    const sheet = getOrCreateClientsSheet();
    const rows = sheet.getDataRange().getValues();
    const clientIdStr = data.clientId ? data.clientId.toString() : null;

    if (!clientIdStr) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Client ID is required for update' })).setMimeType(ContentService.MimeType.JSON);
    }

    let targetRow = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] && rows[i][0].toString() === clientIdStr) {
        targetRow = i + 1; // +1 because array is 0-indexed and rows are 1-indexed
        break;
      }
    }

    if (targetRow === -1) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Client ID not found: ' + clientIdStr })).setMimeType(ContentService.MimeType.JSON);
    }

    const now = new Date();
    const rowData = rows[targetRow - 1]; // current data
    const contactStr = data.contactNumber !== undefined ? data.contactNumber.toString() : (rowData[2] ? rowData[2].toString() : '');

    const updatedRow = [
      clientIdStr,
      data.clientName !== undefined ? data.clientName : rowData[1],
      contactStr.startsWith("'") ? contactStr : `'${contactStr}`,
      data.email !== undefined ? data.email : rowData[3],
      data.website !== undefined ? data.website : rowData[4],
      data.industry !== undefined ? data.industry : rowData[5],
      data.status !== undefined ? data.status : rowData[6],
      data.primaryOwner !== undefined ? data.primaryOwner : rowData[7],
      data.businessUnit !== undefined ? data.businessUnit : rowData[8],
      data.displayOnJobPosting !== undefined ? data.displayOnJobPosting : rowData[9],
      rowData[10], // createdBy
      rowData[11], // createdOn
      now,         // modifiedOn
      data.modifiedBy || 'Admin'  // modifiedBy
    ];

    sheet.getRange(targetRow, 1, 1, 14).setValues([updatedRow]);

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Client updated successfully' })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ─────────────────────────────────────────────
// CLIENT JOBS
// ─────────────────────────────────────────────

function getOrCreateClientJobsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('ClientJobs');
  if (!sheet) {
    sheet = ss.insertSheet('ClientJobs');
    const headers = ['Job Code', 'Job Title', 'Business Unit', 'Client Name', 'Client ID', 'Location', 'State', 'Country', 'Pay Rate / Salary', 'Years of Experience', 'Job Description', 'Created By', 'Created On', 'Recruitment Manager', 'Status', 'Modified On', 'Modified By'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange('A1:Q1').setFontWeight('bold');
  }
  return sheet;
}

function getClientJobs() {
  try {
    const sheet = getOrCreateClientJobsSheet();
    const rows = sheet.getDataRange().getValues();
    const jobs = [];
    if (rows.length > 1) {
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0]) continue; // Skip empty rows
        jobs.push({
          jobCode: row[0] ? row[0].toString() : '',
          jobTitle: row[1] || '',
          businessUnit: row[2] || '',
          clientName: row[3] || '',
          clientId: row[4] ? row[4].toString() : '',
          location: row[5] || '',
          state: row[6] || '',
          country: row[7] || '',
          payRate: row[8] || '',
          experience: row[9] || '',
          jobDescription: row[10] || '',
          createdBy: row[11] || '',
          createdOn: row[12] ? new Date(row[12]).toISOString() : '',
          recruitmentManager: row[13] || '',
          status: row[14] || '',
          modifiedOn: row[15] ? new Date(row[15]).toISOString() : '',
          modifiedBy: row[16] || ''
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, clientJobs: jobs.reverse() })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function addClientJob(data) {
  try {
    const sheet = getOrCreateClientJobsSheet();
    const now = new Date();

    sheet.appendRow([
      data.jobCode || '',
      data.jobTitle || '',
      data.businessUnit || '',
      data.clientName || '',
      data.clientId ? data.clientId.toString() : '',
      data.location || '',
      data.state || '',
      data.country || 'India',
      data.payRate || '',
      data.experience || '',
      data.jobDescription || '',
      data.createdBy || 'Admin',
      now, // createdOn
      data.recruitmentManager || '',
      data.status || 'Active',
      '', // modifiedOn
      ''  // modifiedBy
    ]);

    return ContentService.createTextOutput(JSON.stringify({ success: true, jobCode: data.jobCode, message: 'Client Job added successfully' })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateClientJob(data) {
  try {
    const sheet = getOrCreateClientJobsSheet();
    const rows = sheet.getDataRange().getValues();
    const jobCodeStr = data.jobCode ? data.jobCode.toString() : null;

    if (!jobCodeStr) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Job Code is required for update' })).setMimeType(ContentService.MimeType.JSON);
    }

    let targetRow = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] && rows[i][0].toString() === jobCodeStr) {
        targetRow = i + 1; // +1 because array is 0-indexed and rows are 1-indexed
        break;
      }
    }

    if (targetRow === -1) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Job Code not found: ' + jobCodeStr })).setMimeType(ContentService.MimeType.JSON);
    }

    const now = new Date();
    const rowData = rows[targetRow - 1]; // current data

    const updatedRow = [
      jobCodeStr,
      data.jobTitle !== undefined ? data.jobTitle : rowData[1],
      data.businessUnit !== undefined ? data.businessUnit : rowData[2],
      data.clientName !== undefined ? data.clientName : rowData[3],
      data.clientId !== undefined ? data.clientId : rowData[4],
      data.location !== undefined ? data.location : rowData[5],
      data.state !== undefined ? data.state : rowData[6],
      data.country !== undefined ? data.country : rowData[7],
      data.payRate !== undefined ? data.payRate : rowData[8],
      data.experience !== undefined ? data.experience : rowData[9],
      data.jobDescription !== undefined ? data.jobDescription : rowData[10],
      rowData[11], // createdBy
      rowData[12], // createdOn
      data.recruitmentManager !== undefined ? data.recruitmentManager : rowData[13],
      data.status !== undefined ? data.status : rowData[14],
      now,         // modifiedOn
      data.modifiedBy || 'Admin'  // modifiedBy
    ];

    sheet.getRange(targetRow, 1, 1, 17).setValues([updatedRow]);

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Client Job updated successfully' })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

