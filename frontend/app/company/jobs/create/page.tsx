'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BriefcaseIcon, MapPinIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline';
import OptimizedLoader from '@/components/OptimizedLoader';

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    benefits: '',
    location: '',
    type: 'Full-time',
    experience: '',
    salary: '',
    remote: false
  });

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
  const experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Executive', 'No Experience Required'];

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('companyAuthToken');
      const companyData = localStorage.getItem('currentCompany');
      
      console.log('=== JOB CREATE PAGE AUTH CHECK ===');
      console.log('Token exists:', !!token);
      console.log('Company data exists:', !!companyData);
      
      if (!token || !companyData) {
        console.log('Missing auth data, redirecting to login');
        router.push('/company/auth/login');
        return false;
      }
      
      // Fetch fresh company data from API to ensure status is up-to-date
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/api/company/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const freshCompany = data.company;
          
          console.log('Fresh company data from API:');
          console.log('Company:', freshCompany.name);
          console.log('Company status:', freshCompany.status);
          console.log('Company ID:', freshCompany._id || freshCompany.id);
          
          // Update localStorage with fresh data
          localStorage.setItem('currentCompany', JSON.stringify(freshCompany));
          
          if (freshCompany.status !== 'approved') {
            console.log('Company not approved, redirecting to dashboard');
            alert(`Your company is not yet approved. Current status: ${freshCompany.status}. Please wait for admin approval.`);
            router.push('/company/dashboard');
            return false;
          }
          
          setCompany(freshCompany);
          return true;
        } else {
          console.error('Failed to fetch company profile:', response.status);
          // Fall back to localStorage data
          const company = JSON.parse(companyData);
          console.log('Using cached company data:');
          console.log('Company:', company.name);
          console.log('Company status:', company.status);
          
          if (company.status !== 'approved') {
            console.log('Company not approved, redirecting to dashboard');
            alert(`Your company is not yet approved. Current status: ${company.status}. Please wait for admin approval.`);
            router.push('/company/dashboard');
            return false;
          }
          
          setCompany(company);
          return true;
        }
      } catch (error) {
        console.error('Error fetching company profile:', error);
        // Fall back to localStorage data
        const company = JSON.parse(companyData);
        
        if (company.status !== 'approved') {
          console.log('Company not approved, redirecting to dashboard');
          alert(`Your company is not yet approved. Current status: ${company.status}. Please wait for admin approval.`);
          router.push('/company/dashboard');
          return false;
        }
        
        setCompany(company);
        return true;
      }
    };

    checkAuth();

    // Listen for auth changes
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('companyAuthChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('companyAuthChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const jobData = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements.split('\n').filter(req => req.trim()),
        benefits: formData.benefits.split('\n').filter(benefit => benefit.trim()),
        location: formData.location,
        type: formData.type,
        experience: formData.experience || undefined,
        salary: formData.salary || undefined
      };

      console.log('Submitting job data:', jobData);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const token = localStorage.getItem('companyAuthToken');
      
      console.log('API URL:', apiUrl);
      console.log('Token exists:', !!token);

      const response = await fetch(`${apiUrl}/api/company/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jobData)
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Job created successfully:', data);
        alert('Job posted successfully!');
        router.push('/company/dashboard');
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        
        // Show detailed error message
        let errorMessage = errorData.message || `Failed to create job (${response.status})`;
        
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage += '\n\nErrors:\n' + errorData.errors.map((err: any) => 
            `- ${err.field}: ${err.message}`
          ).join('\n');
        }
        
        if (errorData.error) {
          errorMessage += '\n\nDetails: ' + errorData.error;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating job:', error);
      alert(`Failed to create job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !company) {
    return <OptimizedLoader variant="page" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.push('/company/dashboard')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-50 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <BriefcaseIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a New Job</h1>
            <p className="text-gray-600">
              Create a job posting for {company.name} to attract top talent.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Job Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF]"
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF]"
                    placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPinIcon className="w-4 h-4 inline mr-1" />
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF]"
                      placeholder="e.g. San Francisco, CA or Remote"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <ClockIcon className="w-4 h-4 inline mr-1" />
                      Job Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF]"
                    >
                      {jobTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience Level
                    </label>
                    <select
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF]"
                    >
                      <option value="">Select experience level</option>
                      {experienceLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />
                      Salary Range
                    </label>
                    <input
                      type="text"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF]"
                      placeholder="e.g. $80,000 - $120,000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Requirements
                </label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF]"
                  placeholder="Enter each requirement on a new line:&#10;Bachelor's degree in Computer Science&#10;3+ years of React experience&#10;Strong communication skills"
                />
                <p className="text-sm text-gray-500 mt-1">Enter each requirement on a new line</p>
              </div>
            </div>

            {/* Benefits */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Benefits</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Benefits & Perks
                </label>
                <textarea
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF]"
                  placeholder="Enter each benefit on a new line:&#10;Health, dental, and vision insurance&#10;Flexible work hours&#10;Professional development budget"
                />
                <p className="text-sm text-gray-500 mt-1">Enter each benefit on a new line</p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/company/dashboard')}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white px-8 py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Posting...' : 'Post Job'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}