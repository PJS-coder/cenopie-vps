import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';
config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
});

// Generate interview questions based on domain
export const generateInterviewQuestions = async (domain, jobTitle = '', jobDescription = '') => {
  try {
    const prompt = `Generate exactly 10 professional interview questions for a ${domain} position${jobTitle ? ` as a ${jobTitle}` : ''}.

${jobDescription ? `Job Description: ${jobDescription}\n\n` : ''}

Requirements:
- Questions should be relevant to ${domain}
- Mix of technical and behavioral questions
- Progressive difficulty (easy to hard)
- Clear and concise
- Professional tone

Return ONLY a JSON array of 10 question strings, nothing else. Format:
["Question 1", "Question 2", ..., "Question 10"]`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0].text;
    
    // Parse the JSON response
    const questions = JSON.parse(content);
    
    if (!Array.isArray(questions) || questions.length !== 10) {
      throw new Error('Invalid response format');
    }

    return questions;

  } catch (error) {
    console.error('AI question generation error:', error);
    
    // Fallback questions if AI fails
    return getFallbackQuestions(domain);
  }
};

// Analyze interview responses
export const analyzeInterviewResponse = async (interview) => {
  try {
    const answeredQuestions = interview.questions.filter(q => q.answer);
    
    if (answeredQuestions.length === 0) {
      return {
        overallScore: 0,
        overallFeedback: 'No answers provided',
        strengths: [],
        improvements: ['Complete the interview questions'],
        technicalScore: 0,
        communicationScore: 0,
        confidenceScore: 0
      };
    }

    const prompt = `Analyze this ${interview.domain} interview performance:

Questions and Answers:
${answeredQuestions.map((q, i) => `
Q${i + 1}: ${q.question}
A${i + 1}: ${q.answer || 'No answer provided'}
`).join('\n')}

Provide a detailed analysis in JSON format:
{
  "overallScore": <number 0-100>,
  "overallFeedback": "<2-3 sentences summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "technicalScore": <number 0-100>,
  "communicationScore": <number 0-100>,
  "confidenceScore": <number 0-100>
}

Be constructive, specific, and professional.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0].text;
    const analysis = JSON.parse(content);

    return analysis;

  } catch (error) {
    console.error('AI analysis error:', error);
    
    // Fallback analysis
    return {
      overallScore: 70,
      overallFeedback: 'Thank you for completing the interview. Your responses show good understanding of the domain.',
      strengths: ['Completed all questions', 'Clear communication', 'Professional demeanor'],
      improvements: ['Provide more specific examples', 'Elaborate on technical details', 'Show more enthusiasm'],
      technicalScore: 70,
      communicationScore: 75,
      confidenceScore: 70
    };
  }
};

// Fallback questions by domain
const getFallbackQuestions = (domain) => {
  const questionBank = {
    'Software': [
      'Tell me about yourself and your experience in software development.',
      'What programming languages are you most proficient in?',
      'Explain the difference between object-oriented and functional programming.',
      'How do you approach debugging a complex issue?',
      'Describe your experience with version control systems like Git.',
      'What is your understanding of RESTful APIs?',
      'How do you ensure code quality in your projects?',
      'Explain a challenging technical problem you solved recently.',
      'What testing methodologies are you familiar with?',
      'Where do you see yourself in your software development career in 5 years?'
    ],
    'Design': [
      'Tell me about your design background and experience.',
      'What design tools are you most comfortable with?',
      'How do you approach a new design project?',
      'Explain your understanding of user-centered design.',
      'Describe a design project you\'re most proud of.',
      'How do you handle design feedback and criticism?',
      'What is your process for creating a design system?',
      'How do you stay updated with design trends?',
      'Explain the importance of accessibility in design.',
      'What are your career goals in design?'
    ],
    'Marketing': [
      'Tell me about your marketing experience.',
      'What marketing channels have you worked with?',
      'How do you measure marketing campaign success?',
      'Describe a successful marketing campaign you led.',
      'What is your approach to target audience research?',
      'How do you stay current with marketing trends?',
      'Explain your experience with digital marketing tools.',
      'How do you handle a campaign that isn\'t performing well?',
      'What is your understanding of SEO and SEM?',
      'Where do you see the future of marketing heading?'
    ],
    'Data Science': [
      'Tell me about your background in data science.',
      'What programming languages do you use for data analysis?',
      'Explain the difference between supervised and unsupervised learning.',
      'Describe a data science project you\'ve completed.',
      'How do you handle missing or incomplete data?',
      'What is your experience with machine learning algorithms?',
      'How do you communicate complex data insights to non-technical stakeholders?',
      'What tools do you use for data visualization?',
      'Explain your approach to feature engineering.',
      'What are your career aspirations in data science?'
    ]
  };

  return questionBank[domain] || questionBank['Software'];
};

export default {
  generateInterviewQuestions,
  analyzeInterviewResponse
};
