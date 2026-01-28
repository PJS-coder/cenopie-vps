'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  BriefcaseIcon, 
  MapPinIcon, 
  ClockIcon, 
  UsersIcon, 
  BuildingOfficeIcon, 
  CurrencyDollarIcon, 
  AcademicCapIcon, 
  CheckCircleIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  LightBulbIcon,
  HeartIcon as HeartIconOutline,
  ShareIcon,
  CalendarIcon,
  GlobeAltIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/context/AuthContext';
import StreamingFeedLoader from '@/components/StreamingFeedLoader';
import VerificationBadge from '@/components/VerificationBadge';
import { jobApi } from '@/lib/api';
import { useToastContext } from '@/components/ToastProvider';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  benefits: string[];
  location: string;
  type: string;
  experience?: string;
  salary?: string;
  companyId: string;
  status: string;
  applicants: number;
  createdAt: string;
  company: {
    id: string;
    name: string;
    description: string;
    industry: string;
    headquarters: string;
    size: string;
    founded?: string;
    logo?: string;
    website?: string;
    isVerified: boolean;
  };
}

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;
  const { isAuthenticated } = useAuth();
  const toast = useToastContext();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const loadJob = async () => {
      try {
        setLoading(true);
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.cenopie.com';
        const response = await fetch(`${apiUrl}/api/jobs/${jobId}`);
        
        if (response.ok) {
          const data = await response.json();
          setJob(data.job);
          
          // Check if job is saved (if authenticated)
          if (isAuthenticated) {
            try {
              const savedResponse = await jobApi.isJobSaved(jobId);
              setIsSaved(savedResponse.data?.saved || false);
            } catch (error) {
              console.error('Error checking saved status:', error);
            }
          }
          
          // Check if user has applied (if authenticated)
          if (isAuthenticated) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const applicationsResponse = await fetch(`${apiUrl}/api/jobs/${jobId}/applications?userId=${currentUser.id || currentUser._id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              }
            });
            
            if (applicationsResponse.ok) {
              const applicationsData = await applicationsResponse.json();
              setIsApplied(applicationsData.hasApplied);
            }
          }
        } else {
          console.error('Failed to load job:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error loading job:', error);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      loadJob();
    }
  }, [jobId, isAuthenticated]);

  const handleSaveJob = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await jobApi.saveJob(jobId);
      setIsSaved(response.data?.saved || false);
      
      // Silent success - just update the UI without showing alerts
    } catch (error) {
      console.error('Error saving/unsaving job:', error);
      // Show user-friendly message without technical details
      toast.error('Unable to save job at the moment. Please try again.');
    }
  };

  const handleApply = async () => {
    if (!job) return;
    
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    if (isApplied) {
      toast.info('You have already applied for this position.');
      return;
    }
    
    setIsApplying(true);
    
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      const applicationData = {
        jobId: job.id,
        companyId: job.company.id,
        coverLetter: `I am excited to apply for the ${job.title} position at ${job.company.name}. I believe my skills and experience make me a strong candidate for this role.`
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(applicationData)
      });
      
      if (response.ok) {
        setIsApplied(true);
        setJob(prev => prev ? { ...prev, applicants: prev.applicants + 1 } : null);
        toast.success('Your application has been submitted successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Server error: ${response.status}`;
        
        if (response.status === 400 && errorMessage.includes('already applied')) {
          setIsApplied(true);
          toast.info('You have already applied for this position.');
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please check your connection and try again.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `Check out this job opportunity at ${job?.company?.name}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Job link copied to clipboard!');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6"><StreamingFeedLoader count={1} /></div>;
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <BriefcaseIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
          <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/jobs')}
            className="bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white px-6 py-2 rounded-lg transition-colors font-medium"
          >
            Browse All Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              <span>Back to Jobs</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Job Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-white border border-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    {job.company.logo ? (
                      <img
                        src={job.company.logo}
                        alt={job.company.name}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{job.title}</h1>
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="text-[#0BC0DF] font-medium text-lg">{job.company.name}</p>
                      <VerificationBadge isVerified={job.company.isVerified} size="md" />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-gray-600">
                      <span className="flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {job.location}
                      </span>
                      <span className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {job.type}
                      </span>
                      {job.experience && (
                        <span className="bg-gray-100 px-2 py-1 rounded-md text-sm font-medium">
                          {job.experience}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div className="p-6">
                {/* Overview */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <CurrencyDollarIcon className="w-5 h-5 text-gray-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Salary</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {job.salary || 'Not disclosed'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <UsersIcon className="w-5 h-5 text-gray-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Applicants</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{job.applicants}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <ClockIcon className="w-5 h-5 text-gray-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Posted</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{formatDate(job.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <DocumentTextIcon className="w-5 h-5 mr-2 text-gray-500" />
                    Job Description
                  </h2>
                  <div className="prose max-w-none text-gray-700">
                    <p className="whitespace-pre-line">{job.description}</p>
                  </div>
                </div>

                {/* Requirements */}
                {job.requirements && job.requirements.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <AcademicCapIcon className="w-5 h-5 mr-2 text-gray-500" />
                      Requirements
                    </h2>
                    <ul className="space-y-2">
                      {job.requirements.map((req, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Benefits */}
                {job.benefits && job.benefits.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <LightBulbIcon className="w-5 h-5 mr-2 text-gray-500" />
                      Benefits
                    </h2>
                    <ul className="space-y-2">
                      {job.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="space-y-4">
                <button
                  onClick={handleApply}
                  disabled={isApplied || isApplying || job.status !== 'active'}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    isApplied 
                      ? 'bg-green-100 text-green-800 cursor-not-allowed' 
                      : isApplying
                        ? 'bg-blue-400 text-white cursor-not-allowed'
                        : job.status !== 'active'
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white'
                  }`}
                >
                  {isApplied ? 'Application Submitted' : isApplying ? 'Applying...' : job.status !== 'active' ? 'Position Closed' : 'Apply Now'}
                </button>
                
                <button
                  onClick={handleSaveJob}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                    isSaved
                      ? 'bg-[#0BC0DF] text-white border border-[#0BC0DF]'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <BookmarkSolidIcon className="w-5 h-5 mr-2" />
                      Saved
                    </>
                  ) : (
                    <>
                      <BookmarkIcon className="w-5 h-5 mr-2" />
                      Save Job
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleShare}
                  className="w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                >
                  <ShareIcon className="w-5 h-5 mr-2" />
                  Share
                </button>
              </div>
            </div>

            {/* Company Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Company</h3>
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  {job.company?.logo ? (
                    <img
                      src={job.company.logo}
                      alt={job.company.name}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <BuildingOfficeIcon className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{job.company?.name || 'Unknown Company'}</h4>
                  <p className="text-sm text-gray-600">{job.company?.industry || 'Unknown Industry'}</p>
                </div>
              </div>
              
              <p className="text-gray-700 text-sm mb-4">{job.company?.description || 'No description available.'}</p>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{job.company?.headquarters || 'Unknown Location'}</span>
                </div>
                <div className="flex items-center">
                  <UsersIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{job.company?.size || 'Unknown Size'}</span>
                </div>
                {job.company?.founded && (
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                    <span>Founded {job.company.founded}</span>
                  </div>
                )}
                {job.company?.website && (
                  <div className="flex items-center">
                    <a 
                      href={job.company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-[#0BC0DF] hover:text-[#0aa9c4] transition-colors"
                    >
                      <GlobeAltIcon className="w-4 h-4 mr-2" />
                      <span>Visit Website</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}