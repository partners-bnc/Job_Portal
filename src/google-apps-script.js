// Google Apps Script code - Deploy this as a web app

function doGet(e) {
  console.log('Received parameters:', e.parameter);
  const action = e.parameter.action;
  
  if (action === 'getJobs') {
    return getJobs();
  } else if (action === 'getJob') {
    const jobId = e.parameter.jobId;
    return getJobById(jobId);
  }
  
  console.log('Invalid action received:', action);
  return ContentService.createTextOutput(JSON.stringify({error: 'Invalid action', received: action}))
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
      // Handle JSON data
      data = JSON.parse(e.postData.contents);
      console.log('Using JSON data:', data);
    } else {
      throw new Error('No data received');
    }
    
    if (data.action === 'submitApplication') {
      return submitJobApplication(data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({error: 'Invalid POST action'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.log('Error in doPost:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function submitJobApplication(data) {
  try {
    console.log('Processing application data:', Object.keys(data));
    
    // Get the Candidate detail sheet
    const sheet = SpreadsheetApp.openById('1wGab533KRu2C4qcIF1N0Q6MH9PDdvUMLZJsLJRAZeGo')
                                .getSheetByName('Candidate detail');
    
    if (!sheet) {
      throw new Error('Candidate detail sheet not found');
    }
    
    // Check if headers exist
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    if (lastRow === 0 || lastCol === 0) {
      sheet.getRange(1, 1, 1, 16).setValues([[
        'Timestamp', 'Candidate Name', 'Email', 'Contact Number', 'Current Location',
        'Recent Education', 'Total Experience', 'Current Company', 'Current Position',
        'Current CTC', 'Expected CTC', 'Notice Period', 'Job Applied', 'Resume Link', 'Email Status', 'Status'
      ]]);
    }
    
    // Handle resume upload if provided
    let resumeUrl = 'No resume uploaded';
    if (data.resumeData && data.resumeFileName && data.candidateName) {
      console.log('Attempting resume upload...');
      resumeUrl = uploadResumeToGoogleDrive(data.resumeData, data.resumeFileName, data.candidateName);
    } else {
      console.log('Resume data missing:', {
        hasResumeData: !!data.resumeData,
        hasFileName: !!data.resumeFileName,
        hasName: !!data.candidateName
      });
    }
    
    // Send confirmation email and get status
    let emailStatus = 'Email not sent';
    if (data.email && data.candidateName && data.jobTitle) {
      console.log('Attempting to send email...');
      emailStatus = sendConfirmationEmail(data);
    } else {
      console.log('Email data missing:', {
        hasEmail: !!data.email,
        hasName: !!data.candidateName,
        hasJobTitle: !!data.jobTitle
      });
    }
    
    // Add the application data
    const timestamp = new Date();
    const rowData = [
      timestamp,
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
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function uploadResumeToGoogleDrive(base64Data, fileName, candidateName) {
  try {
    console.log('Starting resume upload for:', candidateName);
    
    // Get the target folder with proper error handling
    const folderId = '1YtEfQOQSmfXGvgifbm4_ezhcHfSue3_3';
    let folder;
    
    try {
      folder = DriveApp.getFolderById(folderId);
      console.log('Folder accessed successfully');
    } catch (folderError) {
      console.log('Error accessing folder:', folderError.toString());
      return 'Resume upload failed: Cannot access Google Drive folder';
    }
    
    // Clean the base64 data
    let cleanBase64 = base64Data;
    if (base64Data && base64Data.includes(',')) {
      cleanBase64 = base64Data.split(',')[1];
    }
    
    if (!cleanBase64) {
      console.log('No base64 data provided');
      return 'Resume upload failed: No file data';
    }
    
    // Convert base64 to blob
    const binaryData = Utilities.base64Decode(cleanBase64);
    const safeFileName = `${candidateName.replace(/[^a-zA-Z0-9]/g, '_')}_${fileName}`;
    const blob = Utilities.newBlob(binaryData, 'application/pdf', safeFileName);
    
    // Create file in Google Drive
    const file = folder.createFile(blob);
    console.log('File created successfully:', file.getId());
    
    // Make file publicly viewable
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      console.log('File sharing set successfully');
    } catch (sharingError) {
      console.log('Warning: Could not set file sharing:', sharingError.toString());
    }
    
    // Return the shareable link
    const fileUrl = `https://drive.google.com/file/d/${file.getId()}/view?usp=sharing`;
    console.log('Resume uploaded successfully:', fileUrl);
    return fileUrl;
    
  } catch (error) {
    console.log('Error uploading resume:', error.toString());
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
    
    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      body: body
    });
    
    console.log('Confirmation email sent to:', data.email);
    return 'Email Sent Successfully';
  } catch (error) {
    console.log('Error sending email:', error.toString());
    return 'Email Failed: ' + error.toString();
  }
}

function getJobs() {
  try {
    const sheet = SpreadsheetApp.openById('1wGab533KRu2C4qcIF1N0Q6MH9PDdvUMLZJsLJRAZeGo')
                                .getSheetByName('Job detail');
    
    const data = sheet.getDataRange().getValues();
    const jobs = [];
    
    // Skip header row (row 0) and process data rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Check if Job Id (column A) and Job Role (column B) exist
      if (row[0] && row[1]) {
        jobs.push({
          id: row[0].toString(), // Job Id (A)
          title: row[1], // Job Role (B)
          location: row[2], // Location (C)
          type: row[3], // Job type (D)
          experience: row[4], // Experience (E)
          salary: row[5], // Salary (F)
          education: row[6], // Education Qualification (G)
          vacancy: row[7], // No. Of Vacancy (H)
          gender: row[8], // Gender (I)
          description: row[9], // Job Description (J)
          company: 'BnC Global'
        });
      }
    }
    
    console.log('Found jobs:', jobs.length);
    return ContentService.createTextOutput(JSON.stringify({success: true, jobs: jobs}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.log('Error in getJobs:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getJobById(jobId) {
  try {
    const sheet = SpreadsheetApp.openById('1wGab533KRu2C4qcIF1N0Q6MH9PDdvUMLZJsLJRAZeGo')
                                .getSheetByName('Job detail');
    
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
        
        return ContentService.createTextOutput(JSON.stringify({success: true, job: job}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({error: 'Job not found'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

