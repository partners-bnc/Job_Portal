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

// ─────────────────────────────────────────────
// GROQ AI LLM EXTRACTION
// ─────────────────────────────────────────────

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

/**
 * Send extracted text to Groq AI to intelligently parse resume fields
 */
async function extractFieldsWithGroq(resumeText) {
  const prompt = `You are a resume parser. Analyze the following resume text and extract the requested information.

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
  "currentPosition": "Most recent or current job title/designation (string or null)"
}

IMPORTANT RULES:
- Return ONLY valid JSON, no markdown, no explanation, no code blocks
- For candidateName: This is usually the very first prominent text in the resume
- For email: Must be a valid email format
- For contactNumber: Include the full number as written in the resume
- For currentLocation: Return only the city name, not full address
- For recentEducation: Include degree (B.Tech, MBA, etc.), institution name, specialization, and year
- For totalExperience: Must be one of the exact allowed values listed above
- For currentCompany and currentPosition: Take from the most recent/first listed experience entry
- If education text has broken words (like "Arti fi cial"), merge them correctly (e.g., "Artificial")
- If you are not confident about a field, return null for that field`;

  try {
    const response = await fetch('/api/groq/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are a precise resume parser that extracts structured data from resume text. You only return valid JSON. Never guess or hallucinate information.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1, // Low temperature for consistent, factual extraction
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Groq API error:', response.status, errorBody);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from Groq');
    }

    // Parse JSON response
    const parsed = JSON.parse(content);
    return parsed;
  } catch (error) {
    console.error('Groq extraction failed:', error);
    throw error;
  }
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
    
    const extracted = await extractFieldsWithGroq(text);
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
