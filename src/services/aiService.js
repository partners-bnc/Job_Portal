const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Analyzes a candidate's application against a job description using Groq AI.
 * @param {Object} applicationData - Candidate's submitted form data
 * @param {Object} jobData - The job's data from the portal
 * @returns {Object} { score, analysis, decision, reason, error? }
 */
export async function analyzeCandidate(applicationData, jobData) {
  try {
    if (!GROQ_API_KEY) {
      console.error('AI Shortlisting: VITE_GROQ_API_KEY is not set in .env');
      return buildFailedResult('API key not configured');
    }

    const prompt = buildPrompt(applicationData, jobData);

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert senior HR recruiter and talent acquisition specialist at BnC Global, a leading executive search and staffing firm. 
Your task is to perform a precise, objective, and professional evaluation of a candidate's resume and profile against a specific job requirement.
You must return ONLY a valid JSON object with no extra text, comments, or markdown formatting.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 600,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API Error:', response.status, errText);
      let parsedErr = errText;
      try { parsedErr = JSON.parse(errText).error?.message || errText; } catch (e) {}
      return buildFailedResult(`Groq API: ${parsedErr}`);
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;

    if (!rawContent) {
      return buildFailedResult('Empty response from AI');
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (e) {
      console.error('Failed to parse AI JSON response:', rawContent);
      return buildFailedResult('AI returned invalid JSON');
    }

    const score = Math.min(10, Math.max(0, parseInt(parsed.score) || 0));
    const decision = score >= 6 ? 'Shortlisted' : 'Not Shortlisted';

    return {
      success: true,
      score: score,
      analysis: (parsed.analysis || 'No analysis provided.').slice(0, 500),
      decision: decision,
      reason: (parsed.reason || 'No reason provided.').slice(0, 300),
    };
  } catch (error) {
    console.error('AI Analysis error:', error);
    return buildFailedResult(error.message);
  }
}

function buildPrompt(app, job) {
  return `
You are evaluating a candidate for a specific job role. Please analyze thoroughly and return a JSON object.

=== JOB REQUIREMENTS ===
- Job Title: ${job?.title || 'Not specified'}
- Required Experience: ${job?.experience || 'Not specified'}
- Required Education: ${job?.education || 'Not specified'}
- Salary Offered: ${job?.salary || 'Not specified'}
- Job Type: ${job?.type || 'Not specified'}
- Job Description: ${(job?.description || 'Not provided').slice(0, 1000)}

=== CANDIDATE PROFILE ===
- Candidate Name: ${app.candidateName || 'N/A'}
- Education: ${app.recentEducation || 'N/A'}
- Total Experience: ${app.totalExperience || 'N/A'} years
- Current Company: ${app.currentCompany || 'N/A'}
- Current Role: ${app.currentPosition || 'N/A'}
- Current CTC: ${app.currentCTC || 'N/A'} LPA
- Expected CTC: ${app.expectedCTC || 'N/A'} LPA
- Notice Period: ${app.noticePeriod || 'N/A'}
- Location: ${app.currentLocation || 'N/A'}

=== SCORING CRITERIA ===
Score from 0–10 based on:
- Education match vs required qualification (25%)
- Experience match (years + domain relevance) (30%)
- Role/company relevance vs job description (25%)
- CTC alignment with offered salary (10%)
- Location and availability (10%)

Scoring scale:
- 9–10: Exceptional match, exceeds all criteria
- 7–8: Strong match, meets most criteria with minor gaps
- 5–6: Moderate match, some criteria met but notable gaps
- 3–4: Weak match, significant gaps in key areas
- 1–2: Poor match, does not meet most criteria
- 0: Completely irrelevant application

=== DECISION RULE ===
- If score >= 6: decision MUST be "Shortlisted"
- If score < 6: decision MUST be "Not Shortlisted"

Return ONLY this exact JSON structure:
{
  "score": <integer from 0 to 10>,
  "analysis": "<2-4 professional sentences comparing the candidate's qualifications to EACH major job requirement>",
  "decision": "<exactly 'Shortlisted' or 'Not Shortlisted'>",
  "reason": "<1-2 sentences; if Shortlisted, highlight the strongest matching qualifications; if Not Shortlisted, cite the specific gaps>"
}
`;
}

function buildFailedResult(errorMsg) {
  return {
    success: false,
    score: 0,
    analysis: 'AI Analysis Failed',
    decision: 'Failed',
    reason: errorMsg || 'Unknown error during AI analysis',
    error: errorMsg
  };
}
