'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  BuildingOfficeIcon, 
  MapPinIcon, 
  UsersIcon, 
  CalendarIcon, 
  GlobeAltIcon,
  BriefcaseIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { fetchCompanyById, fetchJobsByCompanyId, createApplication } from '@/lib/databaseService';
import { CompanyData, JobPosting, ApplicationData } from '@/lib/types';
import VerificationBadge from '@/components/VerificationBadge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToastContext } from '@/components/ToastProvider';

export default function CompanyProfilePage() {
  const toast = useToastContext();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState<{ [key: string]: boolean }>({});
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get the company ID from params
        const companyId = params?.id as string;
        
        if (!companyId) {
          setError('No company ID provided');
          return;
        }
        
        // Fetch company data
        const companyData = await fetchCompanyById(companyId);
        setCompany(companyData);
        
        // Fetch jobs for this company
        setJobsLoading(true);
        const companyJobs = await fetchJobsByCompanyId(companyId);
        setJobs(companyJobs);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load company profile');
      } finally {
        setLoading(false);
        setJobsLoading(false);
      }
    };

    fetchData();
  }, [params?.id]);

  const handleApplyClick = (jobId: string) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.warning('Please log in to apply for jobs.');
      router.push('/auth/login');
      return;
    }
    
    setSelectedJobId(jobId);
    // Pre-fill cover letter with a template
    setCoverLetter(`I am excited to apply for this position at ${company?.name}. I believe my skills and experience make me a strong candidate for this role.`);
    setShowApplicationModal(true);
  };

  const handleApplySubmit = async () => {
    if (!selectedJobId) return;
    
    // Get current user data
    const currentUserData = localStorage.getItem('currentUser');
    if (!currentUserData) {
      toast.error('Unable to retrieve user information. Please log in again.');
      router.push('/auth/login');
      return;
    }
    
    const currentUser = JSON.parse(currentUserData);
    
    try {
      // Set applying state for this job
      setApplying(prev => ({ ...prev, [selectedJobId]: true }));
      setShowApplicationModal(false);
      
      // Create application data
      const applicationData: ApplicationData = {
        id: `app_${Date.now()}_${selectedJobId}`,
        jobId: selectedJobId,
        userId: currentUser.id,
        companyId: company?.id || '',
        status: 'pending',
        resume: null,
        coverLetter: coverLetter,
        appliedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await createApplication(applicationData);
      toast.success('Your application has been submitted successfully!');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      // Reset applying state for this job
      setApplying(prev => ({ ...prev, [selectedJobId]: false }));
      setSelectedJobId(null);
      setCoverLetter('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-md w-full">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Company Not Found</h2>
          <p className="text-gray-600 mb-4">The company you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/company')}>Go to My Company</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Apply for Position</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell the employer why you're a great fit for this position..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowApplicationModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApplySubmit}
                  disabled={!coverLetter.trim() || applying[selectedJobId || '']}
                >
                  {applying[selectedJobId || ''] ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header with Banner */}
      <div className="relative">
        {/* Banner Image */}
        <div className="h-32 md:h-48 w-full overflow-hidden rounded-t-2xl">
          {company.coverImage ? (
            <img 
              src={company.coverImage} 
              alt={`${company.name} cover`} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
          )}
        </div>
        
        {/* Company Logo - Positioned on banner */}
        <div className="absolute -bottom-12 left-8 w-24 h-24 md:w-32 md:h-32 rounded-lg border-4 border-white bg-white shadow-lg overflow-hidden">
          {company.logo ? (
            <img 
              src={company.logo} 
              alt={`${company.name} logo`} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-blue-600 flex items-center justify-center">
              <BuildingOfficeIcon className="w-12 h-12 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Company Info - Below banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Company Name and Industry */}
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{company.name}</h1>
                {company.isVerified !== undefined && (
                  <VerificationBadge isVerified={company.isVerified} size="lg" />
                )}
              </div>
              <p className="text-gray-600 mt-1">{company.industry} • {company.size} employees</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => window.open(company.website, '_blank')}>
                <GlobeAltIcon className="w-4 h-4 mr-2" />
                Visit Website
              </Button>
            </div>
          </div>

          {/* Company Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <div className="flex items-start">
              <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Headquarters</p>
                <p className="font-medium">{company.headquarters}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Founded</p>
                <p className="font-medium">{company.founded}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <UsersIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Employees</p>
                <p className="font-medium">{company.employees}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Business Type</p>
                <p className="font-medium capitalize">{company.businessType}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
            <p className="text-gray-600 whitespace-pre-line">{company.description}</p>
          </div>

          {/* Jobs Section */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Jobs at {company.name}</h2>
              <span className="text-sm text-gray-500">
                {jobs.length} {jobs.length === 1 ? 'position' : 'positions'} available
              </span>
            </div>

            {jobsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8">
                <BriefcaseIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No positions available</h3>
                <p className="text-gray-500">This company doesn't have any open positions right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobs.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-gray-600 mt-1">{job.department}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {job.type}
                      </span>
                    </div>
                    
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <MapPinIcon className="w-4 h-4 mr-1.5" />
                      <span>{job.location}</span>
                      <ClockIcon className="w-4 h-4 ml-4 mr-1.5" />
                      <span>{job.experience}</span>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      {job.requirements.slice(0, 3).map((req, index) => (
                        <span 
                          key={index} 
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {req}
                        </span>
                      ))}
                      {job.requirements.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                          +{job.requirements.length - 3} more
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-6 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{job.salary}</p>
                        <p className="text-xs text-gray-500">Posted {new Date(job.postedAt).toLocaleDateString()}</p>
                      </div>
                      <Button 
                        onClick={() => handleApplyClick(job.id)}
                        disabled={applying[job.id]}
                      >
                        {applying[job.id] ? 'Applying...' : 'Apply Now'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}