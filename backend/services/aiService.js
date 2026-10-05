const axios = require('axios');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL    = process.env.OLLAMA_MODEL    || 'qwen3:4b';

// Strip <think>...</think> tags that qwen3 emits in thinking mode
function stripThinking(text) {
  return (text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

async function ollamaChat(messages, options = {}) {
  try {
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/chat`,
      {
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
          top_p:       options.top_p       ?? 0.9,
          num_predict: options.num_predict ?? 1024,
        },
      },
      { timeout: 120000 }
    );
    return stripThinking(response.data.message.content);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || (err.message && err.message.includes('ECONNREFUSED'))) {
      throw new Error(`connect ECONNREFUSED 127.0.0.1:11434; connect ECONNREFUSED ::1:11434`);
    }
    throw err;
  }
}

// ─── ADAPTIVE ASSESSMENT ─────────────────────────────────────────────────────
async function generateNextAssessmentQuestion(history, studentProfile) {
  const historyText = history
    .map((h, i) => `Q${i + 1}: ${h.question}\nAnswer: ${h.answer}`)
    .join('\n\n');

  const prompt = `You are an expert career counselor AI helping identify a student's ideal career domain through adaptive questioning.

Student Name: ${studentProfile.name}
Questions answered so far: ${history.length}/10

Previous Q&A History:
${historyText || 'No questions answered yet.'}

TASK: Generate ONE concise, thoughtful question to better understand this student's interests, strengths, and career preferences.

Rules:
- The question must naturally evolve from previous answers
- Do NOT repeat topics already covered
- Keep it short and clear — answerable with Yes/No or a few words
- Cover: problem-solving style, creativity vs logic, teamwork vs solo, tech interests, passions

Respond with ONLY the question text. No preamble, no numbering, no explanation.`;

  return ollamaChat([{ role: 'user', content: prompt }], { temperature: 0.8, num_predict: 200 });
}

async function analyzeAssessmentAndIdentifyDomain(history, studentProfile) {
  const historyText = history
    .map((h, i) => `Q${i + 1}: ${h.question}\nAnswer: ${h.answer}`)
    .join('\n\n');

  const prompt = `You are an expert career counselor AI. Analyze this student's complete assessment and identify their ideal career domain.

Student Name: ${studentProfile.name}
Complete Assessment (${history.length} questions):
${historyText}

Based on ALL answers, identify the most suitable career domain.

Respond ONLY with valid JSON (no markdown fences, no extra text):
{
  "domain": "Primary career domain name",
  "confidence": 85,
  "reasoning": "Brief explanation based on their answers",
  "alternativeDomains": ["Second domain", "Third domain"],
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "suggestedSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"]
}`;

  const raw = await ollamaChat([{ role: 'user', content: prompt }], { temperature: 0.4, num_predict: 600 });
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      domain: 'Software Development',
      confidence: 70,
      reasoning: raw,
      alternativeDomains: [],
      keyStrengths: [],
      suggestedSkills: []
    };
  }
}

// ─── ROADMAP ──────────────────────────────────────────────────────────────────
async function generatePersonalizedRoadmap(domain, studentProfile) {
  const prompt = `You are an expert career mentor AI. Create a detailed 4-year personalized learning roadmap.

Student: ${studentProfile.name}
Career Domain: ${domain}
Key Skills: ${(studentProfile.skills || []).join(', ') || 'Not yet assessed'}

Generate a comprehensive 4-year roadmap. Respond ONLY with valid JSON (no markdown fences):
{
  "domain": "${domain}",
  "overview": "Brief overview sentence",
  "years": [
    {
      "year": 1,
      "title": "Foundation",
      "description": "Focus description",
      "quarters": [
        {
          "quarter": 1,
          "title": "Quarter title",
          "topics": ["topic1", "topic2", "topic3"],
          "projects": ["project1"],
          "resources": ["resource1"],
          "milestones": ["milestone1"]
        },
        {
          "quarter": 2,
          "title": "Quarter title",
          "topics": ["topic1", "topic2"],
          "projects": ["project1"],
          "resources": ["resource1"],
          "milestones": ["milestone1"]
        },
        {
          "quarter": 3,
          "title": "Quarter title",
          "topics": ["topic1", "topic2"],
          "projects": ["project1"],
          "resources": ["resource1"],
          "milestones": ["milestone1"]
        },
        {
          "quarter": 4,
          "title": "Quarter title",
          "topics": ["topic1", "topic2"],
          "projects": ["project1"],
          "resources": ["resource1"],
          "milestones": ["milestone1"]
        }
      ],
      "skills": ["skill1", "skill2"],
      "certifications": ["cert1"]
    }
  ]
}

Include all 4 years with 4 quarters each. Be specific to ${domain}.`;

  const raw = await ollamaChat([{ role: 'user', content: prompt }], { temperature: 0.6, num_predict: 3000 });
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { domain, overview: 'AI-generated roadmap', years: [] };
  }
}

// ─── INTERVIEW ────────────────────────────────────────────────────────────────
async function generateInterviewQuestion(domain, history, completedTopics, language = 'English') {
  const historyText = history
    .map((h, i) => `Q${i + 1}: ${h.question}\nAnswer: ${h.answer}\nEval: ${h.evaluation || 'Pending'}`)
    .join('\n\n');

  const topicsText = completedTopics?.length > 0
    ? `Topics completed: ${completedTopics.join(', ')}`
    : '';

  const prompt = `You are an expert technical interviewer conducting a ${domain} interview in ${language}.
${topicsText}

Previous Q&A:
${historyText || 'Interview just started.'}

Generate ONE adaptive interview question based on the student's domain and previous answers.
Mix technical, conceptual, and problem-solving questions. Go deeper if they answered well, simpler if they struggled.

Respond with ONLY the question. No preamble, no numbering.`;

  return ollamaChat([{ role: 'user', content: prompt }], { temperature: 0.75, num_predict: 300 });
}

async function evaluateInterviewAnswer(question, answer, domain, language = 'English') {
  const prompt = `You are an expert ${domain} interviewer. Evaluate this interview answer.

Question: ${question}
Student Answer: ${answer}

Respond ONLY with valid JSON (no markdown fences):
{
  "score": 7,
  "feedback": "Detailed constructive feedback",
  "correct": true,
  "keyPoints": ["point1", "point2"],
  "improvement": "What could be improved"
}

Score 1-10. Be fair and constructive.`;

  const raw = await ollamaChat([{ role: 'user', content: prompt }], { temperature: 0.4, num_predict: 500 });
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { score: 5, feedback: raw, correct: true, keyPoints: [], improvement: '' };
  }
}

async function generateInterviewResult(domain, history) {
  const historyText = history
    .map((h, i) => `Q${i + 1}: ${h.question}\nAnswer: ${h.answer}\nScore: ${h.score || 0}/10`)
    .join('\n\n');

  const prompt = `You are an expert career assessor. Analyze this complete ${domain} interview.

${historyText}

Respond ONLY with valid JSON (no markdown fences):
{
  "overallScore": 72,
  "level": "Intermediate",
  "strongAreas": ["area1", "area2"],
  "improvementAreas": ["area1", "area2"],
  "overallFeedback": "Comprehensive feedback paragraph",
  "recommendation": "Job readiness recommendation",
  "nextSteps": ["step1", "step2", "step3"]
}`;

  const raw = await ollamaChat([{ role: 'user', content: prompt }], { temperature: 0.5, num_predict: 800 });
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { overallScore: 0, level: 'Beginner', strongAreas: [], improvementAreas: [], overallFeedback: raw, recommendation: '', nextSteps: [] };
  }
}

// ─── PROJECT VALIDATION ───────────────────────────────────────────────────────
async function validateProject(projectData) {
  const prompt = `You are an expert code reviewer. Analyze this project submission.

Title: ${projectData.title}
Description: ${projectData.description}
Language: ${projectData.language}
Domain: ${projectData.domain || 'General'}

Code:
\`\`\`${projectData.language}
${projectData.code.substring(0, 3000)}
\`\`\`

Respond ONLY with valid JSON (no markdown fences):
{
  "score": 75,
  "status": "validated",
  "codeQuality": "Good",
  "strengths": ["strength1", "strength2"],
  "issues": ["issue1"],
  "suggestions": ["suggestion1"],
  "feedback": "Overall detailed feedback",
  "completeness": 80,
  "bestPractices": 70
}

status must be: "validated", "needs_improvement", or "rejected"`;

  const raw = await ollamaChat([{ role: 'user', content: prompt }], { temperature: 0.4, num_predict: 800 });
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { score: 50, status: 'needs_improvement', feedback: raw, strengths: [], issues: [] };
  }
}

// ─── TASK VALIDATION ─────────────────────────────────────────────────────────
async function validateTaskAnswer(task, studentAnswer, language) {
  const prompt = `You are an expert programming mentor. Validate this student's answer.

Task: ${task}
Student's Code/Answer (${language || 'text'}):
${studentAnswer.substring(0, 2000)}

Respond ONLY with valid JSON (no markdown fences):
{
  "correct": true,
  "score": 85,
  "feedback": "Detailed feedback",
  "explanation": "What the correct approach is",
  "improvements": ["improvement1", "improvement2"],
  "passed": true
}`;

  const raw = await ollamaChat([{ role: 'user', content: prompt }], { temperature: 0.4, num_predict: 600 });
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { correct: false, score: 0, feedback: raw, passed: false, improvements: [] };
  }
}

// ─── JD VALIDATION ───────────────────────────────────────────────────────────
async function validateJobDescription(jdText) {
  const prompt = `You are an expert HR analyst. Analyze this job description thoroughly.

Job Description:
${jdText.substring(0, 3000)}

Respond ONLY with valid JSON (no markdown fences):
{
  "jobTitle": "Extracted job title",
  "requiredSkills": ["skill1", "skill2"],
  "experienceRequired": "X years",
  "educationRequired": "Degree type",
  "responsibilities": ["resp1", "resp2"],
  "technicalRequirements": ["tech1", "tech2"],
  "otherRequirements": ["req1"],
  "salaryRange": "If mentioned or Not specified",
  "validationScore": 85,
  "issues": ["issue1"],
  "suspicious": [],
  "overallValidity": "Valid",
  "feedback": "Overall assessment",
  "recommendations": ["rec1"]
}

overallValidity must be: "Valid", "Partially Valid", or "Invalid/Suspicious"`;

  const raw = await ollamaChat([{ role: 'user', content: prompt }], { temperature: 0.4, num_predict: 1000 });
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { jobTitle: 'Unknown', validationScore: 0, feedback: raw, overallValidity: 'Unknown', requiredSkills: [], issues: [] };
  }
}

// ─── CHATBOT ─────────────────────────────────────────────────────────────────
async function chatWithAI(messages, studentProfile) {
  const systemMsg = {
    role: 'system',
    content: `You are ProPath AI, a friendly and knowledgeable career guidance assistant.
You help students with career advice, learning recommendations, technical questions, project ideas, interview tips, and job search strategies.
Student: ${studentProfile.name}
Career Domain: ${studentProfile.careerDomain || 'Not yet determined'}
Be helpful, encouraging, and concise.`
  };

  return ollamaChat([systemMsg, ...messages], { temperature: 0.8, num_predict: 1000 });
}

module.exports = {
  generateNextAssessmentQuestion,
  analyzeAssessmentAndIdentifyDomain,
  generatePersonalizedRoadmap,
  generateInterviewQuestion,
  evaluateInterviewAnswer,
  generateInterviewResult,
  validateProject,
  validateTaskAnswer,
  validateJobDescription,
  chatWithAI,
  ollamaChat,
};
