import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

// ─────────────────────────────────────────────
// TEXT EXTRACTION (improved with Y-coordinate line breaks)
// ─────────────────────────────────────────────

/**
 * Extract raw text from a PDF file with proper line breaks
 * Uses Y-coordinate positions to reconstruct the document layout
 */
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const allLines = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items.filter((item) => item.str.trim().length > 0);

    if (items.length === 0) continue;

    // Group items by Y position (same Y = same line)
    // PDF Y coordinates go bottom-to-top, so we sort descending
    const lineMap = new Map();
    const Y_THRESHOLD = 3; // items within 3 units of Y are on the same line

    for (const item of items) {
      const y = Math.round(item.transform[5]); // Y position
      const x = item.transform[4]; // X position

      // Find existing line within threshold
      let foundKey = null;
      for (const key of lineMap.keys()) {
        if (Math.abs(key - y) <= Y_THRESHOLD) {
          foundKey = key;
          break;
        }
      }

      if (foundKey !== null) {
        lineMap.get(foundKey).push({ x, text: item.str });
      } else {
        lineMap.set(y, [{ x, text: item.str }]);
      }
    }

    // Sort lines top-to-bottom (descending Y in PDF coords)
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);

    for (const y of sortedYs) {
      const lineItems = lineMap.get(y).sort((a, b) => a.x - b.x);

      // Join items with smart spacing
      let lineText = '';
      for (let j = 0; j < lineItems.length; j++) {
        const item = lineItems[j];
        if (j > 0) {
          const prevItem = lineItems[j - 1];
          const gap = item.x - (prevItem.x + prevItem.text.length * 3.5); // rough char width
          // Add space only if there's a meaningful gap
          if (gap > 2 || lineText.length === 0 || !lineText.endsWith(' ')) {
            lineText += ' ';
          }
        }
        lineText += item.text;
      }

      const cleaned = lineText.replace(/\s+/g, ' ').trim();
      if (cleaned.length > 0) {
        allLines.push(cleaned);
      }
    }

    // Add page separator
    if (i < pdf.numPages) {
      allLines.push('');
    }
  }

  return allLines.join('\n');
}

/**
 * Extract raw text from a DOCX file
 */
async function extractTextFromDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Extract text from any supported file
 */
async function extractText(file) {
  if (file.type === 'application/pdf') {
    return await extractTextFromPDF(file);
  } else if (
    file.type === 'application/msword' ||
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return await extractTextFromDOCX(file);
  }
  throw new Error('Unsupported file type');
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

/**
 * Common prompt for both OpenAI and Groq
 */
function getResumePrompt(resumeText, extended = false) {
  const extraFields = extended ? `,
  "skills": "Comma-separated list of all technical skills, tools, technologies, soft skills, and domain keywords found in the resume (string or null)",
  "certifications": "Comma-separated list of all certifications, courses, and licenses found in the resume (string or null)",
  "summary": "A concise 2-3 sentence professional summary of the candidate based on their experience, skills, and background (string or null)"` : '';

  return `You are a resume parser. Analyze the following resume text and extract the requested information.

RESUME TEXT:
"""
${resumeText.substring(0, 6000)}
"""

Extract the following fields from the resume. Return ONLY a valid JSON object with these exact keys. If a field cannot be confidently determined from the resume, set its value to null. Do NOT guess or make up information.

{
  "candidateName": "Full name of the candidate (string or null)",
  "email": "Email address (string or null)",
  "contactNumber": "Phone/mobile number with country code if present (string or null)",
  "currentLocation": "Current city or location (string or null)",
  "recentEducation": "Most recent education details including degree, institution, specialization, and year if available. Include all education entries found, separated by newlines (string or null)",
  "totalExperience": "Total years of professional experience as a number. Use one of these exact values: '0' for fresher, '1', '2', '3', '4', '5' for exact years, '6-10' for 6 to 10 years, '10+' for more than 10 years. (string or null)",
  "currentCompany": "Most recent or current company/organization name (string or null)",
  "currentPosition": "Most recent or current job title/designation (string or null)"${extraFields}
}

IMPORTANT RULES:
- Return ONLY valid JSON, no markdown, no explanation, no code blocks
- For candidateName: This is usually the very first prominent text in the resume
- For totalExperience: Must be one of the exact allowed values listed above
- If you are not confident about a field, return null for that field`;
}

/**
 * Generic fetch with retry logic for 429
 */
async function fetchWithRetry(url, options, maxRetries = 1) {
  let attempts = 0;
  while (attempts <= maxRetries) {
    const response = await fetch(url, options);
    if (response.status === 429 && attempts < maxRetries) {
      console.warn(`Rate limited (429). Retrying in 5s... (Attempt ${attempts + 1})`);
      await new Promise(r => setTimeout(r, 5000));
      attempts++;
      continue;
    }
    return response;
  }
}

/**
 * Intelligent field extraction — Uses OpenAI if available, else falls back to Groq.
 */
async function extractFieldsWithAI(resumeText, extended = false) {
  const prompt = getResumePrompt(resumeText, extended);
  
  // Try OpenAI first if key exists
  if (OPENAI_API_KEY && OPENAI_API_KEY.length > 10) {
    try {
      const response = await fetchWithRetry('/api/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: 'You are a precise resume parser. Return only JSON.' }, { role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
      }
      console.warn('OpenAI failed, falling back to Groq...');
    } catch (err) {
      console.error('OpenAI error:', err);
    }
  }

  // Fallback to Groq
  if (!GROQ_API_KEY) throw new Error('No AI API keys configured.');

  const response = await fetchWithRetry('/api/groq/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'system', content: 'You are a precise resume parser. Return only JSON.' }, { role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),

  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorBody.substring(0, 50)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from AI');
  return JSON.parse(content);
}


// ─────────────────────────────────────────────
// MAIN PARSE FUNCTION
// ─────────────────────────────────────────────

/**
 * Parse a resume file and extract all available fields using Groq AI.
 * Returns an object with extracted data and a set of auto-filled field names.
 */
export async function parseResume(file, onProgress) {
  const result = {
    data: {},
    autoFilledFields: new Set(),
  };

  try {
    // Step 1: Extract text from file
    if (onProgress) onProgress('extracting');
    const text = await extractText(file);

    if (!text || text.trim().length < 20) {
      console.warn('Not enough text extracted from resume');
      return result;
    }

    console.log('Extracted resume text length:', text.length);
    console.log('First 500 chars:', text.substring(0, 500));

    // Step 2: Send to Groq AI for intelligent extraction
    if (onProgress) onProgress('contact');
    
    const extracted = await extractFieldsWithAI(text, false);
    console.log('Groq extracted fields:', extracted);

    if (onProgress) onProgress('education');

    // Step 3: Map extracted fields to form data
    const fieldMap = {
      candidateName: extracted.candidateName,
      email: extracted.email,
      contactNumber: extracted.contactNumber,
      currentLocation: extracted.currentLocation,
      recentEducation: extracted.recentEducation,
      totalExperience: extracted.totalExperience,
      currentCompany: extracted.currentCompany,
      currentPosition: extracted.currentPosition,
    };

    if (onProgress) onProgress('experience');

    // Only include fields that were actually extracted (non-null)
    for (const [key, value] of Object.entries(fieldMap)) {
      if (value !== null && value !== undefined && value !== '') {
        // Validate specific fields
        if (key === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) continue;
        }

        if (key === 'totalExperience') {
          const validValues = [
            '0',
            '1',
            '2',
            '3',
            '4',
            '5',
            '6-10',
            '10+',
          ];
          if (!validValues.includes(value)) continue;
        }

        result.data[key] = value;
        result.autoFilledFields.add(key);
      }
    }

    if (onProgress) onProgress('done');
  } catch (error) {
    console.error('Resume parsing error:', error);
    if (onProgress) onProgress('error');
  }

  return result;
}

/**
 * Extended resume parser for HR CV uploads.
 * Returns all standard fields PLUS skills and summary.
 * THROWS on AI failure or insufficient parsed data so callers can skip DB insert.
 */
export async function parseResumeForDatabase(file, onProgress) {
  const result = {
    data: {},
    autoFilledFields: new Set(),
  };

  if (onProgress) onProgress('extracting');
  const text = await extractText(file);

  if (!text || text.trim().length < 20) {
    throw new Error('Could not extract readable text from this resume. The PDF may be image-based or corrupted.');
  }

  if (onProgress) onProgress('contact');

  // This will throw if Groq API fails — caller handles it
  const extracted = await extractFieldsWithAI(text, true);


  if (onProgress) onProgress('education');

  const fieldMap = {
    candidateName: extracted.candidateName,
    email: extracted.email,
    contactNumber: extracted.contactNumber,
    currentLocation: extracted.currentLocation,
    education: extracted.recentEducation,
    totalExperience: extracted.totalExperience,
    currentCompany: extracted.currentCompany,
    currentPosition: extracted.currentPosition,
    skills: extracted.skills,
    certifications: extracted.certifications,
    summary: extracted.summary,
  };

  if (onProgress) onProgress('experience');

  for (const [key, value] of Object.entries(fieldMap)) {
    if (value !== null && value !== undefined && value !== '') {
      if (key === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) continue;
      }
      if (key === 'totalExperience') {
        const validValues = ['0','1','2','3','4','5','6-10','10+'];
        if (!validValues.includes(value)) continue;
      }
      result.data[key] = value;
      result.autoFilledFields.add(key);
    }
  }

  // Minimum data gate: need at least name OR email OR phone
  const hasMinimum = result.data.candidateName || result.data.email || result.data.contactNumber;
  if (!hasMinimum) {
    throw new Error('AI could not extract any identifying information (name, email, or phone) from this resume. Please check the file quality.');
  }

  if (onProgress) onProgress('done');
  return result;
}

