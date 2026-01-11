import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import InterviewQuestion from '../src/models/InterviewQuestion.js';
import User from '../src/models/User.js';

const questions = [
  // Frontend Development
  {
    domain: 'Frontend Development',
    question: 'Explain the difference between var, let, and const in JavaScript.',
    difficulty: 'easy',
    order: 1,
    isActive: true
  },
  {
    domain: 'Frontend Development',
    question: 'What is the Virtual DOM in React and how does it improve performance?',
    difficulty: 'medium',
    order: 2,
    isActive: true
  },
  {
    domain: 'Frontend Development',
    question: 'Explain CSS Flexbox and Grid. When would you use one over the other?',
    difficulty: 'medium',
    order: 3,
    isActive: true
  },
  {
    domain: 'Frontend Development',
    question: 'What are React Hooks? Explain useState and useEffect.',
    difficulty: 'medium',
    order: 4,
    isActive: true
  },
  {
    domain: 'Frontend Development',
    question: 'How do you optimize the performance of a React application?',
    difficulty: 'hard',
    order: 5,
    isActive: true
  },
  {
    domain: 'Frontend Development',
    question: 'Explain event delegation in JavaScript and why it is useful.',
    difficulty: 'medium',
    order: 6,
    isActive: true
  },
  {
    domain: 'Frontend Development',
    question: 'What is the difference between == and === in JavaScript?',
    difficulty: 'easy',
    order: 7,
    isActive: true
  },
  {
    domain: 'Frontend Development',
    question: 'Explain closures in JavaScript with an example.',
    difficulty: 'medium',
    order: 8,
    isActive: true
  },
  {
    domain: 'Frontend Development',
    question: 'What are promises in JavaScript? How do they differ from callbacks?',
    difficulty: 'medium',
    order: 9,
    isActive: true
  },
  {
    domain: 'Frontend Development',
    question: 'Describe your approach to making a website responsive and accessible.',
    difficulty: 'medium',
    order: 10,
    isActive: true
  },

  // Backend Development
  {
    domain: 'Backend Development',
    question: 'Explain the difference between SQL and NoSQL databases.',
    difficulty: 'easy',
    order: 1,
    isActive: true
  },
  {
    domain: 'Backend Development',
    question: 'What is RESTful API design? What are the main HTTP methods?',
    difficulty: 'easy',
    order: 2,
    isActive: true
  },
  {
    domain: 'Backend Development',
    question: 'Explain middleware in Express.js and give examples of its use.',
    difficulty: 'medium',
    order: 3,
    isActive: true
  },
  {
    domain: 'Backend Development',
    question: 'How do you handle authentication and authorization in a Node.js application?',
    difficulty: 'medium',
    order: 4,
    isActive: true
  },
  {
    domain: 'Backend Development',
    question: 'What is database indexing and why is it important?',
    difficulty: 'medium',
    order: 5,
    isActive: true
  },
  {
    domain: 'Backend Development',
    question: 'Explain the concept of microservices architecture.',
    difficulty: 'hard',
    order: 6,
    isActive: true
  },
  {
    domain: 'Backend Development',
    question: 'How do you handle errors in an asynchronous Node.js application?',
    difficulty: 'medium',
    order: 7,
    isActive: true
  },
  {
    domain: 'Backend Development',
    question: 'What is caching and how would you implement it in a backend application?',
    difficulty: 'medium',
    order: 8,
    isActive: true
  },
  {
    domain: 'Backend Development',
    question: 'Explain CORS and how to handle it in Express.js.',
    difficulty: 'medium',
    order: 9,
    isActive: true
  },
  {
    domain: 'Backend Development',
    question: 'How do you ensure the security of a backend API?',
    difficulty: 'hard',
    order: 10,
    isActive: true
  },

  // Full Stack Development
  {
    domain: 'Full Stack Development',
    question: 'Describe the complete flow of a web request from browser to database and back.',
    difficulty: 'medium',
    order: 1,
    isActive: true
  },
  {
    domain: 'Full Stack Development',
    question: 'How do you manage state in a full-stack application?',
    difficulty: 'medium',
    order: 2,
    isActive: true
  },
  {
    domain: 'Full Stack Development',
    question: 'Explain JWT authentication and how you would implement it.',
    difficulty: 'medium',
    order: 3,
    isActive: true
  },
  {
    domain: 'Full Stack Development',
    question: 'What is your approach to API versioning?',
    difficulty: 'medium',
    order: 4,
    isActive: true
  },
  {
    domain: 'Full Stack Development',
    question: 'How do you handle file uploads in a full-stack application?',
    difficulty: 'medium',
    order: 5,
    isActive: true
  },
  {
    domain: 'Full Stack Development',
    question: 'Explain WebSockets and when you would use them.',
    difficulty: 'medium',
    order: 6,
    isActive: true
  },
  {
    domain: 'Full Stack Development',
    question: 'How do you optimize database queries in a full-stack application?',
    difficulty: 'hard',
    order: 7,
    isActive: true
  },
  {
    domain: 'Full Stack Development',
    question: 'Describe your testing strategy for a full-stack application.',
    difficulty: 'hard',
    order: 8,
    isActive: true
  },
  {
    domain: 'Full Stack Development',
    question: 'How do you handle real-time data synchronization between frontend and backend?',
    difficulty: 'hard',
    order: 9,
    isActive: true
  },
  {
    domain: 'Full Stack Development',
    question: 'Explain your approach to deploying a full-stack application.',
    difficulty: 'medium',
    order: 10,
    isActive: true
  },

  // Data Science
  {
    domain: 'Data Science',
    question: 'Explain the difference between supervised and unsupervised learning.',
    difficulty: 'easy',
    order: 1,
    isActive: true
  },
  {
    domain: 'Data Science',
    question: 'What is overfitting and how do you prevent it?',
    difficulty: 'medium',
    order: 2,
    isActive: true
  },
  {
    domain: 'Data Science',
    question: 'Explain the bias-variance tradeoff.',
    difficulty: 'medium',
    order: 3,
    isActive: true
  },
  {
    domain: 'Data Science',
    question: 'What is feature engineering and why is it important?',
    difficulty: 'medium',
    order: 4,
    isActive: true
  },
  {
    domain: 'Data Science',
    question: 'Describe the process of data cleaning and preprocessing.',
    difficulty: 'medium',
    order: 5,
    isActive: true
  },
  {
    domain: 'Data Science',
    question: 'What evaluation metrics would you use for a classification problem?',
    difficulty: 'medium',
    order: 6,
    isActive: true
  },
  {
    domain: 'Data Science',
    question: 'Explain cross-validation and its importance.',
    difficulty: 'medium',
    order: 7,
    isActive: true
  },
  {
    domain: 'Data Science',
    question: 'What is the difference between bagging and boosting?',
    difficulty: 'hard',
    order: 8,
    isActive: true
  },
  {
    domain: 'Data Science',
    question: 'How do you handle imbalanced datasets?',
    difficulty: 'hard',
    order: 9,
    isActive: true
  },
  {
    domain: 'Data Science',
    question: 'Describe your approach to exploratory data analysis.',
    difficulty: 'medium',
    order: 10,
    isActive: true
  },

  // DevOps
  {
    domain: 'DevOps',
    question: 'Explain the concept of CI/CD and its benefits.',
    difficulty: 'easy',
    order: 1,
    isActive: true
  },
  {
    domain: 'DevOps',
    question: 'What is Docker and how does it differ from virtual machines?',
    difficulty: 'medium',
    order: 2,
    isActive: true
  },
  {
    domain: 'DevOps',
    question: 'Explain Kubernetes and its main components.',
    difficulty: 'hard',
    order: 3,
    isActive: true
  },
  {
    domain: 'DevOps',
    question: 'What is Infrastructure as Code (IaC)?',
    difficulty: 'medium',
    order: 4,
    isActive: true
  },
  {
    domain: 'DevOps',
    question: 'How do you monitor and log applications in production?',
    difficulty: 'medium',
    order: 5,
    isActive: true
  },
  {
    domain: 'DevOps',
    question: 'Explain blue-green deployment and canary deployment.',
    difficulty: 'hard',
    order: 6,
    isActive: true
  },
  {
    domain: 'DevOps',
    question: 'What is your approach to handling secrets and sensitive data?',
    difficulty: 'medium',
    order: 7,
    isActive: true
  },
  {
    domain: 'DevOps',
    question: 'How do you ensure high availability and disaster recovery?',
    difficulty: 'hard',
    order: 8,
    isActive: true
  },
  {
    domain: 'DevOps',
    question: 'Explain the concept of immutable infrastructure.',
    difficulty: 'medium',
    order: 9,
    isActive: true
  },
  {
    domain: 'DevOps',
    question: 'What tools and practices do you use for automated testing in CI/CD?',
    difficulty: 'medium',
    order: 10,
    isActive: true
  }
];

async function seedQuestions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cenopie');
    console.log('✅ Connected to MongoDB');

    // Find or create system admin user
    let systemAdmin = await User.findOne({ email: 'system@cenopie.com' });
    if (!systemAdmin) {
      systemAdmin = await User.create({
        name: 'System Admin',
        email: 'system@cenopie.com',
        password: 'system-generated-' + Date.now(),
        role: 'admin',
        isVerified: true
      });
      console.log('✅ Created system admin user');
    } else {
      console.log('✅ Using existing system admin user');
    }

    // Clear existing questions
    await InterviewQuestion.deleteMany({});
    console.log('🗑️  Cleared existing questions');

    // Add createdBy to all questions
    const questionsWithCreator = questions.map(q => ({
      ...q,
      createdBy: systemAdmin._id
    }));

    // Insert new questions
    await InterviewQuestion.insertMany(questionsWithCreator);
    console.log(`✅ Inserted ${questions.length} interview questions`);

    // Show summary
    const domains = [...new Set(questions.map(q => q.domain))];
    console.log('\n📊 Questions by domain:');
    for (const domain of domains) {
      const count = questions.filter(q => q.domain === domain).length;
      console.log(`   ${domain}: ${count} questions`);
    }

    console.log('\n✨ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding questions:', error);
    process.exit(1);
  }
}

seedQuestions();
