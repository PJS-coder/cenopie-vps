import mongoose from 'mongoose';
import dotenv from 'dotenv';
import InterviewQuestion from '../src/models/InterviewQuestion.js';

// Load environment variables
dotenv.config({ path: '.env.production' });

const productManagementQuestions = [
  // A. Product Strategy (20 questions)
  {
    question: "If you were the CEO of this company for a day, what is the ONE thing you would change and why?",
    domain: "Product Strategy",
    category: "Strategic Thinking",
    difficulty: "Medium",
    order: 1
  },
  {
    question: "Pick a company that failed recently (e.g., Kodak, Nokia, WeWork). Analyze why it happened in 3 points.",
    domain: "Product Strategy",
    category: "Business Analysis",
    difficulty: "Medium",
    order: 2
  },
  {
    question: "How do you stay updated with industry trends? Tell me a recent trend affecting our sector.",
    domain: "Product Strategy",
    category: "Industry Knowledge",
    difficulty: "Easy",
    order: 3
  },
  {
    question: "Explain the business model of a company like Swiggy/Zomato. Where do they bleed money?",
    domain: "Product Strategy",
    category: "Business Models",
    difficulty: "Medium",
    order: 4
  },
  {
    question: "If our revenue is increasing but profit is decreasing, what are the possible reasons?",
    domain: "Product Strategy",
    category: "Financial Analysis",
    difficulty: "Medium",
    order: 5
  },
  {
    question: "What is the difference between 'Top-line' and 'Bottom-line' growth?",
    domain: "Product Strategy",
    category: "Financial Concepts",
    difficulty: "Easy",
    order: 6
  },
  {
    question: "How would you launch a premium coffee brand in a rural market? Is it a good idea?",
    domain: "Product Strategy",
    category: "Market Entry",
    difficulty: "Hard",
    order: 7
  },
  {
    question: "What does 'Scalability' mean to you? Give an example of a non-scalable business.",
    domain: "Product Strategy",
    category: "Business Concepts",
    difficulty: "Medium",
    order: 8
  },
  {
    question: "Explain 'Competitive Advantage'. What is ours compared to our rivals?",
    domain: "Product Strategy",
    category: "Competitive Analysis",
    difficulty: "Medium",
    order: 9
  },
  {
    question: "How do you measure the success of a new product launch? Which KPIs matter most?",
    domain: "Product Strategy",
    category: "Product Metrics",
    difficulty: "Medium",
    order: 10
  },
  {
    question: "What is 'Disruptive Innovation'? Give a modern example.",
    domain: "Product Strategy",
    category: "Innovation",
    difficulty: "Medium",
    order: 11
  },
  {
    question: "If you have to enter a new market, would you prefer an acquisition or organic growth?",
    domain: "Product Strategy",
    category: "Growth Strategy",
    difficulty: "Hard",
    order: 12
  },
  {
    question: "What are the macro-economic factors currently affecting Indian businesses?",
    domain: "Product Strategy",
    category: "Economic Analysis",
    difficulty: "Hard",
    order: 13
  },
  {
    question: "Explain the concept of 'Opportunity Cost' with a real-life business example.",
    domain: "Product Strategy",
    category: "Economic Concepts",
    difficulty: "Medium",
    order: 14
  },
  {
    question: "Why do mergers often fail? (Cultural clash vs. Financial mismatch).",
    domain: "Product Strategy",
    category: "M&A Strategy",
    difficulty: "Hard",
    order: 15
  },
  {
    question: "What is 'Vertical Integration' vs. 'Horizontal Integration'?",
    domain: "Product Strategy",
    category: "Business Strategy",
    difficulty: "Medium",
    order: 16
  },
  {
    question: "How do you value a company that has no assets (like a software firm)?",
    domain: "Product Strategy",
    category: "Valuation",
    difficulty: "Hard",
    order: 17
  },
  {
    question: "What is ESG (Environmental, Social, and Governance)? Why is it becoming critical?",
    domain: "Product Strategy",
    category: "Sustainability",
    difficulty: "Medium",
    order: 18
  },
  {
    question: "If you had Rs. 10 Lakhs to invest in this company, which department would you give it to?",
    domain: "Product Strategy",
    category: "Resource Allocation",
    difficulty: "Hard",
    order: 19
  },
  {
    question: "Explain the 'Pareto Principle' (80/20 Rule) in the context of business efficiency.",
    domain: "Product Strategy",
    category: "Efficiency Principles",
    difficulty: "Medium",
    order: 20
  },

  // B. Sales & Marketing (15 questions)
  {
    question: "Sell me a subscription to a service I don't need.",
    domain: "Sales & Marketing",
    category: "Sales Skills",
    difficulty: "Medium",
    order: 21
  },
  {
    question: "How would you handle a distributor who refuses to stock our new product?",
    domain: "Sales & Marketing",
    category: "Channel Management",
    difficulty: "Hard",
    order: 22
  },
  {
    question: "What is the difference between 'Consumer' and 'Customer'?",
    domain: "Sales & Marketing",
    category: "Marketing Concepts",
    difficulty: "Easy",
    order: 23
  },
  {
    question: "Design a Go-To-Market (GTM) strategy for a new energy drink.",
    domain: "Sales & Marketing",
    category: "GTM Strategy",
    difficulty: "Hard",
    order: 24
  },
  {
    question: "How do you handle a price war initiated by a competitor?",
    domain: "Sales & Marketing",
    category: "Competitive Strategy",
    difficulty: "Hard",
    order: 25
  },
  {
    question: "What is 'Brand Equity'? How do you measure it?",
    domain: "Sales & Marketing",
    category: "Brand Management",
    difficulty: "Medium",
    order: 26
  },
  {
    question: "Explain the '4 Ps of Marketing'. Which one is most critical for a startup?",
    domain: "Sales & Marketing",
    category: "Marketing Mix",
    difficulty: "Easy",
    order: 27
  },
  {
    question: "How would you increase market share in a saturated market?",
    domain: "Sales & Marketing",
    category: "Market Strategy",
    difficulty: "Hard",
    order: 28
  },
  {
    question: "Digital Marketing vs. Traditional Marketing – where should we spend our budget?",
    domain: "Sales & Marketing",
    category: "Marketing Budget",
    difficulty: "Medium",
    order: 29
  },
  {
    question: "What is 'Customer Lifetime Value' (CLV)? Why is it important?",
    domain: "Sales & Marketing",
    category: "Customer Metrics",
    difficulty: "Medium",
    order: 30
  },
  {
    question: "How do you deal with negative PR or a social media crisis?",
    domain: "Sales & Marketing",
    category: "Crisis Management",
    difficulty: "Hard",
    order: 31
  },
  {
    question: "What is 'Trade Marketing'? How is it different from general marketing?",
    domain: "Sales & Marketing",
    category: "Trade Marketing",
    difficulty: "Medium",
    order: 32
  },
  {
    question: "Scenario: Your sales team is demoralized due to high targets. How do you motivate them without lowering targets?",
    domain: "Sales & Marketing",
    category: "Team Management",
    difficulty: "Hard",
    order: 33
  },
  {
    question: "Analyze a recent advertisement campaign you liked. Why did it work?",
    domain: "Sales & Marketing",
    category: "Campaign Analysis",
    difficulty: "Medium",
    order: 34
  },
  {
    question: "What is 'Churn Rate'? How do you reduce it?",
    domain: "Sales & Marketing",
    category: "Customer Retention",
    difficulty: "Medium",
    order: 35
  },

  // C. Operations & Supply Chain (15 questions)
  {
    question: "What is the 'Bottleneck' in a process? How do you identify it?",
    domain: "Operations & Supply Chain",
    category: "Process Optimization",
    difficulty: "Medium",
    order: 36
  },
  {
    question: "Explain 'Just-in-Time' (JIT) inventory. What are the risks?",
    domain: "Operations & Supply Chain",
    category: "Inventory Management",
    difficulty: "Medium",
    order: 37
  },
  {
    question: "How do you optimize a warehouse layout for efficiency?",
    domain: "Operations & Supply Chain",
    category: "Warehouse Management",
    difficulty: "Hard",
    order: 38
  },
  {
    question: "Scenario: A strike at the logistics partner has halted deliveries. What is your contingency plan?",
    domain: "Operations & Supply Chain",
    category: "Crisis Management",
    difficulty: "Hard",
    order: 39
  },
  {
    question: "What is 'Six Sigma'? Explain DMAIC.",
    domain: "Operations & Supply Chain",
    category: "Quality Management",
    difficulty: "Hard",
    order: 40
  },
  {
    question: "How do you decide between 'Make or Buy' (Outsourcing)?",
    domain: "Operations & Supply Chain",
    category: "Strategic Decisions",
    difficulty: "Medium",
    order: 41
  },
  {
    question: "What is the difference between 'Procurement' and 'Purchasing'?",
    domain: "Operations & Supply Chain",
    category: "Procurement",
    difficulty: "Easy",
    order: 42
  },
  {
    question: "How would you reduce wastage in a manufacturing line?",
    domain: "Operations & Supply Chain",
    category: "Waste Reduction",
    difficulty: "Medium",
    order: 43
  },
  {
    question: "Explain the 'Bullwhip Effect' in supply chain.",
    domain: "Operations & Supply Chain",
    category: "Supply Chain Concepts",
    difficulty: "Hard",
    order: 44
  },
  {
    question: "How do you evaluate a vendor? Price vs. Quality vs. Reliability.",
    domain: "Operations & Supply Chain",
    category: "Vendor Management",
    difficulty: "Medium",
    order: 45
  },
  {
    question: "What is 'Last Mile Delivery'? Why is it the most expensive part?",
    domain: "Operations & Supply Chain",
    category: "Logistics",
    difficulty: "Medium",
    order: 46
  },
  {
    question: "How do you manage quality control without slowing down production?",
    domain: "Operations & Supply Chain",
    category: "Quality Control",
    difficulty: "Hard",
    order: 47
  },
  {
    question: "What is 'Inventory Turnover Ratio'? Why is a high ratio good?",
    domain: "Operations & Supply Chain",
    category: "Inventory Metrics",
    difficulty: "Medium",
    order: 48
  },
  {
    question: "Scenario: Raw material prices have shot up 20%. How do you protect margins without raising prices?",
    domain: "Operations & Supply Chain",
    category: "Cost Management",
    difficulty: "Hard",
    order: 49
  },
  {
    question: "What is 'Lean Management'?",
    domain: "Operations & Supply Chain",
    category: "Management Concepts",
    difficulty: "Medium",
    order: 50
  },

  // D. Finance & HR Basics (10 questions)
  {
    question: "Read this P&L statement. Where is the company spending too much?",
    domain: "Finance & HR Basics",
    category: "Financial Analysis",
    difficulty: "Hard",
    order: 51
  },
  {
    question: "What is EBITDA? Why do investors look at it?",
    domain: "Finance & HR Basics",
    category: "Financial Metrics",
    difficulty: "Medium",
    order: 52
  },
  {
    question: "Difference between 'Capex' and 'Opex'.",
    domain: "Finance & HR Basics",
    category: "Financial Concepts",
    difficulty: "Easy",
    order: 53
  },
  {
    question: "How do you calculate ROI?",
    domain: "Finance & HR Basics",
    category: "Financial Calculations",
    difficulty: "Easy",
    order: 54
  },
  {
    question: "What is 'Working Capital'? Why is cash flow more important than profit?",
    domain: "Finance & HR Basics",
    category: "Financial Management",
    difficulty: "Medium",
    order: 55
  },
  {
    question: "How do you handle an underperforming team member?",
    domain: "Finance & HR Basics",
    category: "Performance Management",
    difficulty: "Medium",
    order: 56
  },
  {
    question: "Scenario: You have to fire an employee. Roleplay the conversation.",
    domain: "Finance & HR Basics",
    category: "HR Management",
    difficulty: "Hard",
    order: 57
  },
  {
    question: "How do you resolve a conflict between two senior managers?",
    domain: "Finance & HR Basics",
    category: "Conflict Resolution",
    difficulty: "Hard",
    order: 58
  },
  {
    question: "What is 'Attrition'? How does it impact the bottom line?",
    domain: "Finance & HR Basics",
    category: "HR Metrics",
    difficulty: "Medium",
    order: 59
  },
  {
    question: "How do you ensure diversity in your team?",
    domain: "Finance & HR Basics",
    category: "Diversity & Inclusion",
    difficulty: "Medium",
    order: 60
  },

  // E. Behavioral & Situational (20 questions)
  {
    question: "Describe a time you failed. What did you learn?",
    domain: "Behavioral & Situational",
    category: "Learning from Failure",
    difficulty: "Medium",
    order: 61
  },
  {
    question: "How do you handle pressure? Give an example.",
    domain: "Behavioral & Situational",
    category: "Stress Management",
    difficulty: "Medium",
    order: 62
  },
  {
    question: "Scenario: Your boss asks you to do something unethical. What do you do?",
    domain: "Behavioral & Situational",
    category: "Ethics",
    difficulty: "Hard",
    order: 63
  },
  {
    question: "Describe a situation where you had to lead without authority.",
    domain: "Behavioral & Situational",
    category: "Leadership",
    difficulty: "Hard",
    order: 64
  },
  {
    question: "How do you prioritize when you have 5 urgent tasks?",
    domain: "Behavioral & Situational",
    category: "Time Management",
    difficulty: "Medium",
    order: 65
  },
  {
    question: "Tell me about a time you had to persuade someone to change their mind.",
    domain: "Behavioral & Situational",
    category: "Persuasion",
    difficulty: "Medium",
    order: 66
  },
  {
    question: "What is your biggest weakness? (Don't say 'I work too hard').",
    domain: "Behavioral & Situational",
    category: "Self-Awareness",
    difficulty: "Medium",
    order: 67
  },
  {
    question: "How do you handle constructive criticism?",
    domain: "Behavioral & Situational",
    category: "Feedback Reception",
    difficulty: "Medium",
    order: 68
  },
  {
    question: "Describe a time you solved a complex problem with a simple solution.",
    domain: "Behavioral & Situational",
    category: "Problem Solving",
    difficulty: "Medium",
    order: 69
  },
  {
    question: "Where do you see yourself in 5 years? Be specific.",
    domain: "Behavioral & Situational",
    category: "Career Planning",
    difficulty: "Easy",
    order: 70
  },
  {
    question: "How do you manage work-life balance during a crunch period?",
    domain: "Behavioral & Situational",
    category: "Work-Life Balance",
    difficulty: "Medium",
    order: 71
  },
  {
    question: "What motivates you more: Recognition or Money?",
    domain: "Behavioral & Situational",
    category: "Motivation",
    difficulty: "Easy",
    order: 72
  },
  {
    question: "Tell me about a time you took a calculated risk.",
    domain: "Behavioral & Situational",
    category: "Risk Taking",
    difficulty: "Medium",
    order: 73
  },
  {
    question: "How do you deal with a difficult colleague?",
    domain: "Behavioral & Situational",
    category: "Interpersonal Skills",
    difficulty: "Medium",
    order: 74
  },
  {
    question: "What makes you angry at work?",
    domain: "Behavioral & Situational",
    category: "Emotional Intelligence",
    difficulty: "Medium",
    order: 75
  },
  {
    question: "Scenario: You are given a project with zero guidelines. How do you proceed?",
    domain: "Behavioral & Situational",
    category: "Initiative",
    difficulty: "Hard",
    order: 76
  },
  {
    question: "Have you ever stepped out of your comfort zone? When?",
    domain: "Behavioral & Situational",
    category: "Growth Mindset",
    difficulty: "Medium",
    order: 77
  },
  {
    question: "What is the most boring part of a job for you?",
    domain: "Behavioral & Situational",
    category: "Job Preferences",
    difficulty: "Easy",
    order: 78
  },
  {
    question: "How do you handle boredom in routine tasks?",
    domain: "Behavioral & Situational",
    category: "Task Management",
    difficulty: "Medium",
    order: 79
  },
  {
    question: "What are your hobbies? How do they help you in your career?",
    domain: "Behavioral & Situational",
    category: "Personal Development",
    difficulty: "Easy",
    order: 80
  },

  // F. Leadership & Critical Thinking (20 questions)
  {
    question: "What is your leadership style? Autocratic or Democratic?",
    domain: "Leadership & Critical Thinking",
    category: "Leadership Style",
    difficulty: "Medium",
    order: 81
  },
  {
    question: "How do you build trust in a new team?",
    domain: "Leadership & Critical Thinking",
    category: "Trust Building",
    difficulty: "Medium",
    order: 82
  },
  {
    question: "Scenario: The team is missing deadlines. How do you fix it?",
    domain: "Leadership & Critical Thinking",
    category: "Performance Management",
    difficulty: "Hard",
    order: 83
  },
  {
    question: "How do you delegate? What tasks do you keep for yourself?",
    domain: "Leadership & Critical Thinking",
    category: "Delegation",
    difficulty: "Medium",
    order: 84
  },
  {
    question: "What is 'Emotional Intelligence'? Why is it crucial for leaders?",
    domain: "Leadership & Critical Thinking",
    category: "Emotional Intelligence",
    difficulty: "Medium",
    order: 85
  },
  {
    question: "How do you handle a star performer who is toxic to the culture?",
    domain: "Leadership & Critical Thinking",
    category: "Culture Management",
    difficulty: "Hard",
    order: 86
  },
  {
    question: "What is the difference between a Manager and a Leader?",
    domain: "Leadership & Critical Thinking",
    category: "Leadership Concepts",
    difficulty: "Medium",
    order: 87
  },
  {
    question: "How do you make decisions with incomplete data?",
    domain: "Leadership & Critical Thinking",
    category: "Decision Making",
    difficulty: "Hard",
    order: 88
  },
  {
    question: "Scenario: You are managing people older and more experienced than you. How do you gain their respect?",
    domain: "Leadership & Critical Thinking",
    category: "Authority Building",
    difficulty: "Hard",
    order: 89
  },
  {
    question: "How do you foster innovation in your team?",
    domain: "Leadership & Critical Thinking",
    category: "Innovation Management",
    difficulty: "Medium",
    order: 90
  },
  {
    question: "What book have you read recently that changed your thinking?",
    domain: "Leadership & Critical Thinking",
    category: "Continuous Learning",
    difficulty: "Easy",
    order: 91
  },
  {
    question: "How do you define 'Integrity' in a workplace?",
    domain: "Leadership & Critical Thinking",
    category: "Values",
    difficulty: "Medium",
    order: 92
  },
  {
    question: "What legacy do you want to leave in this company?",
    domain: "Leadership & Critical Thinking",
    category: "Vision",
    difficulty: "Medium",
    order: 93
  },
  {
    question: "If you could have any superpower for business, what would it be?",
    domain: "Leadership & Critical Thinking",
    category: "Creative Thinking",
    difficulty: "Easy",
    order: 94
  },
  {
    question: "How do you handle failure in your team? Blame or Support?",
    domain: "Leadership & Critical Thinking",
    category: "Failure Management",
    difficulty: "Medium",
    order: 95
  },
  {
    question: "What is 'Change Management'? How do you lead change?",
    domain: "Leadership & Critical Thinking",
    category: "Change Management",
    difficulty: "Hard",
    order: 96
  },
  {
    question: "How do you align personal goals with company goals?",
    domain: "Leadership & Critical Thinking",
    category: "Goal Alignment",
    difficulty: "Medium",
    order: 97
  },
  {
    question: "What is the importance of networking within the organization?",
    domain: "Leadership & Critical Thinking",
    category: "Networking",
    difficulty: "Medium",
    order: 98
  },
  {
    question: "How do you prepare for a meeting with the CEO?",
    domain: "Leadership & Critical Thinking",
    category: "Executive Communication",
    difficulty: "Medium",
    order: 99
  },
  {
    question: "Why should we hire YOU as an MT over an MBA topper?",
    domain: "Leadership & Critical Thinking",
    category: "Self-Positioning",
    difficulty: "Hard",
    order: 100
  }
];

async function seedProductManagementQuestions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing Product & Management questions
    const deleteResult = await InterviewQuestion.deleteMany({
      domain: {
        $in: [
          'Product Strategy',
          'Sales & Marketing', 
          'Operations & Supply Chain',
          'Finance & HR Basics',
          'Behavioral & Situational',
          'Leadership & Critical Thinking'
        ]
      }
    });
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing Product & Management questions`);

    // Insert new questions
    const insertResult = await InterviewQuestion.insertMany(productManagementQuestions);
    console.log(`✅ Inserted ${insertResult.length} Product & Management questions`);

    // Display summary by domain
    const domains = [...new Set(productManagementQuestions.map(q => q.domain))];
    console.log('\n📊 Questions by Domain:');
    for (const domain of domains) {
      const count = productManagementQuestions.filter(q => q.domain === domain).length;
      console.log(`   • ${domain}: ${count} questions`);
    }

    console.log('\n🎯 Question Selection Logic:');
    console.log('   • Total questions available: 100');
    console.log('   • Questions per interview: 10 (randomly selected)');
    console.log('   • Questions are shuffled for each interview');
    console.log('   • Balanced selection across difficulty levels');

    console.log('\n✅ Product & Management questions seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding questions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seeding function
seedProductManagementQuestions();