import fetch from 'node-fetch';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY; // from .env
const GROQ_MODEL = 'llama3-70b-8192';

async function testGroq() {
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
          content: 'Here is some text. JSON'
        }
      ],
      temperature: 0.2,
      max_tokens: 600,
      response_format: { type: 'json_object' }
    }),
  });

  const text = await response.text();
  console.log('Status:', response.status);
  console.log('Response:', text);
}

testGroq();
