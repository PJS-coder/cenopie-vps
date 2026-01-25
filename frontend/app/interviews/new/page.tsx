'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import {
  ChevronDownIcon
} from '@heroicons/react/24/outline';

// Comprehensive domains organized by fields
const domainsByField = {
  'Software Development': [
    'Frontend Development',
    'Backend Development',
    'Full Stack Development',
    'Mobile App Development (iOS)',
    'Mobile App Development (Android)',
    'React Native Development',
    'Flutter Development',
    'Web Development',
    'Desktop Application Development',
    'Game Development',
    'Embedded Systems Development',
    'API Development',
    'Microservices Architecture',
    'Progressive Web Apps (PWA)',
    'Cross-Platform Development'
  ],
  'Data & Analytics': [
    'Data Science',
    'Data Analytics',
    'Machine Learning',
    'Artificial Intelligence',
    'Deep Learning',
    'Natural Language Processing',
    'Computer Vision',
    'Big Data Engineering',
    'Data Engineering',
    'Business Intelligence',
    'Statistical Analysis',
    'Predictive Analytics',
    'Data Visualization',
    'MLOps',
    'Data Mining'
  ],
  'Cloud & Infrastructure': [
    'DevOps',
    'Cloud Architecture (AWS)',
    'Cloud Architecture (Azure)',
    'Cloud Architecture (GCP)',
    'Site Reliability Engineering (SRE)',
    'Infrastructure as Code',
    'Containerization (Docker/Kubernetes)',
    'CI/CD Pipeline',
    'System Administration',
    'Network Engineering',
    'Cloud Infrastructure Security',
    'Monitoring & Observability',
    'Platform Engineering',
    'Infrastructure Automation'
  ],
  'Design & User Experience': [
    'UI/UX Design',
    'Product Design',
    'Graphic Design',
    'Web Design',
    'Mobile App Design',
    'User Research',
    'Interaction Design',
    'Visual Design',
    'Design Systems',
    'Prototyping',
    'Usability Testing',
    'Brand Design',
    'Motion Graphics',
    'Design Strategy'
  ],
  'Cybersecurity': [
    'Information Security',
    'Ethical Hacking',
    'Penetration Testing',
    'Security Architecture',
    'Network Security',
    'Application Security',
    'Cloud Security & Compliance',
    'Incident Response',
    'Security Compliance',
    'Risk Assessment',
    'Vulnerability Assessment',
    'Security Operations (SOC)',
    'Digital Forensics',
    'Identity & Access Management'
  ],
  'Product & Management': [
    'Product Management',
    'Project Management',
    'Agile/Scrum Master',
    'Technical Program Management',
    'Product Strategy',
    'Product Marketing',
    'Business Analysis',
    'Requirements Engineering',
    'Stakeholder Management',
    'Product Operations',
    'Growth Product Management',
    'Platform Product Management'
  ],
  'Quality Assurance': [
    'Software Testing',
    'Test Automation',
    'Quality Assurance',
    'Performance Testing',
    'Security Testing',
    'Mobile Testing',
    'API Testing',
    'Load Testing',
    'Manual Testing',
    'Test Strategy',
    'Accessibility Testing',
    'Usability Testing'
  ],
  'Database & Systems': [
    'Database Administration',
    'Database Design',
    'SQL Development',
    'NoSQL Databases',
    'Data Warehousing',
    'Database Performance Tuning',
    'Database Security',
    'Distributed Systems',
    'System Design',
    'Microservices',
    'Event-Driven Architecture',
    'Database Migration'
  ],
  'Marketing & Sales': [
    'Digital Marketing',
    'Content Marketing',
    'Social Media Marketing',
    'SEO/SEM',
    'Email Marketing',
    'Marketing Analytics',
    'Growth Marketing',
    'Performance Marketing',
    'Brand Marketing',
    'Sales Engineering',
    'Technical Sales',
    'Customer Success'
  ],
  'Finance & Operations': [
    'Financial Analysis',
    'Business Operations',
    'Supply Chain Management',
    'Operations Research',
    'Process Optimization',
    'Financial Modeling',
    'Risk Management',
    'Compliance',
    'Audit',
    'Corporate Finance',
    'Investment Analysis'
  ],
  'Emerging Technologies': [
    'Blockchain Development',
    'Cryptocurrency',
    'IoT Development',
    'AR/VR Development',
    'Quantum Computing',
    'Edge Computing',
    'Robotics',
    '3D Modeling',
    'Smart Contracts',
    'Web3 Development',
    'Metaverse Development'
  ]
};

export default function NewInterviewPage() {
  return (
    <ProtectedRoute>
      <NewInterviewContent />
    </ProtectedRoute>
  );
}

function NewInterviewContent() {
  const router = useRouter();
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const [isDomainDropdownOpen, setIsDomainDropdownOpen] = useState(false);

  // Get all domains for search
  const allDomains = Object.values(domainsByField).flat();

  // Filter domains based on selected field only
  const filteredDomains = selectedField 
    ? (domainsByField[selectedField as keyof typeof domainsByField] || [])
    : allDomains;

  const handleFieldSelect = (field: string) => {
    setSelectedField(field);
    setSelectedDomain(''); // Reset domain when field changes
    setIsFieldDropdownOpen(false);
  };

  const handleDomainSelect = (domain: string) => {
    setSelectedDomain(domain);
    setIsDomainDropdownOpen(false);
  };

  const handleCreate = async () => {
    if (!selectedDomain) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ domain: selectedDomain })
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/interviews/${data.interview.id}/start`);
      } else {
        const error = await response.json();
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Start New Interview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select your domain to begin your technical interview
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Choose Your Domain
          </h2>
          
          {/* Field Selection Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              1. Select Field (Optional - to filter domains)
            </label>
            <div className="relative">
              <button
                onClick={() => setIsFieldDropdownOpen(!isFieldDropdownOpen)}
                className="w-full px-4 py-3 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF] flex items-center justify-between"
              >
                <span className={selectedField ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                  {selectedField || 'All Fields'}
                </span>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isFieldDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isFieldDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <button
                    onClick={() => handleFieldSelect('')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                  >
                    All Fields
                  </button>
                  {Object.keys(domainsByField).map((field) => (
                    <button
                      key={field}
                      onClick={() => handleFieldSelect(field)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                    >
                      {field}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Domain Selection Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              2. Select Domain
            </label>
            <div className="relative">
              <button
                onClick={() => setIsDomainDropdownOpen(!isDomainDropdownOpen)}
                className="w-full px-4 py-3 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF] flex items-center justify-between"
              >
                <span className={selectedDomain ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                  {selectedDomain || 'Select a domain'}
                </span>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isDomainDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDomainDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                  {filteredDomains.length === 0 ? (
                    <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                      No domains found
                    </div>
                  ) : (
                    filteredDomains.map((domain: string, index: number) => (
                      <button
                        key={`${domain}-${index}`}
                        onClick={() => handleDomainSelect(domain)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                      >
                        {domain}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Selected Domain Display */}
          {selectedDomain && (
            <div className="mt-4 p-3 bg-[#0BC0DF]/10 border border-[#0BC0DF]/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#0BC0DF] rounded-full"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Selected: {selectedDomain}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            What to expect:
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>• 10 technical questions for your domain</li>
            <li>• Video recording for each answer</li>
            <li>• Instant AI feedback on completion</li>
            <li>• Camera and microphone required</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!selectedDomain || loading}
            className="flex-1 bg-[#0BC0DF] hover:bg-[#0BC0DF]/90"
          >
            {loading ? 'Creating...' : 'Start Interview'}
          </Button>
        </div>
      </div>
    </div>
  );
}
