'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BriefcaseIcon, 
  MapPinIcon, 
  BuildingOfficeIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  BookmarkIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import VerificationBadge from '@/components/VerificationBadge';
import { authenticatedFetchWithRetry, handleApiResponse } from '@/lib/apiUtils';
import { jobApi } from '@/lib/api';

import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { JobCardSkeleton } from '@/components/LoadingSkeleton';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  experience?: string;
  salary?: string;
  companyId: string;
  status: string;
  applicants: number;
  createdAt: string;
  isSaved?: boolean;
  isUrgent?: boolean;
  isRemote?: boolean;
  skillsRequired?: string[];
  benefits?: string[];
  company: {
    id: string;
    name: string;
    logo?: string;
    isVerified: boolean;
    industry?: string;
    size?: string;
  };
}

interface JobFilters {
  search: string;
  location: string;
  type: string;
  experience: string;
  salary: string;
  remote: boolean;
  urgent: boolean;
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [salaryFilter, setSalaryFilter] = useState('');
  const [remoteFilter, setRemoteFilter] = useState(false);
  const [urgentFilter, setUrgentFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'jobs' | 'internships'>('jobs');
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  
  // Applied filters (only update when user clicks search)
  const [appliedFilters, setAppliedFilters] = useState<JobFilters>({
    search: '',
    location: '',
    type: '',
    experience: '',
    salary: '',
    remote: false,
    urgent: false
  });

  // Load jobs when applied filters or tab changes
  useEffect(() => {
    loadJobs();
  }, [appliedFilters, activeTab]);

  // Load saved jobs status - optimized to run in background
  useEffect(() => {
    if (jobs.length > 0) {
      // Don't block UI - load saved status in background
      loadSavedJobsStatus();
    }
  }, [jobs]);

  const loadSavedJobsStatus = async () => {
    try {
      const savedJobsSet = new Set<string>();
      
      // Check saved status for each job in batches to avoid blocking
      const batchSize = 5;
      for (let i = 0; i < jobs.length; i += batchSize) {
        const batch = jobs.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (job) => {
          try {
            const response = await jobApi.isJobSaved(job.id);
            const isSaved = response.data?.saved ?? response.saved;
            
            if (isSaved) {
              savedJobsSet.add(job.id);
            }
          } catch (error) {
            // Silently fail for individual jobs
          }
        }));
        
        // Update UI after each batch
        setSavedJobs(new Set(savedJobsSet));
        
        // Small delay between batches to avoid overwhelming the API
        if (i + batchSize < jobs.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Error loading saved jobs status:', error);
    }
  };

  const handleSaveJob = async (jobId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const response = await jobApi.saveJob(jobId);
      
      // Handle both response formats: response.data.saved or response.saved
      const isSaved = response.data?.saved ?? response.saved;
      
      if (isSaved) {
        setSavedJobs(prev => new Set([...prev, jobId]));
      } else {
        setSavedJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error saving/unsaving job:', error);
      alert('Unable to save job at the moment. Please try again.');
    }
  };

  const handleSearch = () => {
    setAppliedFilters({
      search: searchTerm,
      location: locationFilter,
      type: typeFilter,
      experience: experienceFilter,
      salary: salaryFilter,
      remote: remoteFilter,
      urgent: urgentFilter
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setTypeFilter('');
    setExperienceFilter('');
    setSalaryFilter('');
    setRemoteFilter(false);
    setUrgentFilter(false);
    setAppliedFilters({
      search: '',
      location: '',
      type: '',
      experience: '',
      salary: '',
      remote: false,
      urgent: false
    });
  };

  const loadJobs = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (appliedFilters.search) params.append('search', appliedFilters.search);
      if (appliedFilters.location) params.append('location', appliedFilters.location);
      if (appliedFilters.type) params.append('type', appliedFilters.type);
      if (appliedFilters.experience) params.append('experience', appliedFilters.experience);
      if (appliedFilters.salary) params.append('salary', appliedFilters.salary);
      if (appliedFilters.remote) params.append('remote', 'true');
      if (appliedFilters.urgent) params.append('urgent', 'true');
      
      // Add category filter based on active tab
      if (activeTab === 'internships') {
        params.append('type', 'Internship');
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.cenopie.com';
      
      // Use Promise.race to timeout after 5 seconds
      const fetchPromise = authenticatedFetchWithRetry(
        `${apiUrl}/api/jobs?${params.toString()}`,
        {},
        { maxRetries: 2, baseDelay: 1000 } // Reduced retries and delay
      );
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      const data = await handleApiResponse<{jobs: Job[]}>(response);
      
      // Filter jobs based on active tab if backend doesn't filter properly
      let filteredJobs = data.jobs || [];
      if (activeTab === 'internships') {
        filteredJobs = filteredJobs.filter((job: Job) => 
          job.type?.toLowerCase().includes('internship')
        );
      } else {
        // For jobs tab, exclude internships
        filteredJobs = filteredJobs.filter((job: Job) => 
          !job.type?.toLowerCase().includes('internship')
        );
      }
      
      // Set jobs immediately - don't wait for saved status
      setJobs(filteredJobs);
      
    } catch (error) {
      console.error('Error loading jobs:', error);
      // Show cached jobs if available
      const cachedJobs = localStorage.getItem('cachedJobs');
      if (cachedJobs) {
        try {
          setJobs(JSON.parse(cachedJobs));
        } catch (e) {
          // Ignore cache errors
        }
      }
    } finally {
      setLoading(false);
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
    return (
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        <div className="w-full flex justify-center px-4 lg:px-6 py-4 lg:py-8">
          <div className="w-full lg:w-[1400px]">
            {/* Header Skeleton */}
            <div className="mb-6 lg:mb-8 lg:ml-80">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-2xl animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded w-80 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Layout with Sidebar */}
            <div className="flex gap-4 items-start relative">
              {/* Left Sidebar Skeleton - Desktop Only */}
              <div className="w-80 flex-shrink-0 hidden lg:block">
                <div className="fixed top-24 w-80 space-y-6 z-10" 
                     style={{left: 'max(1rem, calc(50vw - 700px))'}}>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                    <div className="h-6 bg-gray-200 rounded w-24 mb-3 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                      <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <div className="h-5 bg-gray-200 rounded w-16 mb-3 animate-pulse"></div>
                    <div className="space-y-3">
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Skeleton */}
              <div className="flex-1">
                <div className="mb-4 lg:mb-6">
                  <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>

                {/* Job Cards Skeleton */}
                <div className="space-y-8">
                  {[1, 2, 3].map((section) => (
                    <div key={section}>
                      <div className="flex items-center justify-between mb-6">
                        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
                        <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        {[1, 2, 3].map((card) => (
                          <JobCardSkeleton key={card} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="w-full flex justify-center px-4 lg:px-6 py-4 lg:py-8">
        <div className="w-full lg:w-[1400px]">
          {/* Header */}
          <div className="mb-6 lg:mb-8 lg:ml-80">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-[#0BC0DF] to-[#0aa9c4] p-4 rounded-2xl shadow-lg">
                <BriefcaseIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Find Your Dream <span className="text-[#0BC0DF]">Opportunity</span>
              </h1>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="lg:hidden mb-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2">
              <div className="flex space-x-1">
                <button
                  onClick={() => {
                    setActiveTab('jobs');
                    setTypeFilter('');
                    setAppliedFilters(prev => ({ ...prev, type: '' }));
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'jobs'
                      ? 'bg-[#0BC0DF] text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Jobs
                </button>
                <button
                  onClick={() => {
                    setActiveTab('internships');
                    setTypeFilter('');
                    setAppliedFilters(prev => ({ ...prev, type: '' }));
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'internships'
                      ? 'bg-[#0BC0DF] text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Internships
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Filters Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-5 h-5 text-[#0BC0DF]" />
                <span className="font-semibold text-gray-900">Filters</span>
                {(appliedFilters.search || appliedFilters.location || appliedFilters.type || appliedFilters.experience || appliedFilters.salary || appliedFilters.remote || appliedFilters.urgent) && (
                  <span className="bg-[#0BC0DF] text-white text-xs px-2 py-1 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <ChevronRightIcon className={`w-5 h-5 text-gray-400 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="lg:hidden mb-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="space-y-4">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Search</label>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF] text-sm"
                        placeholder="Keywords..."
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Location</label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF] text-sm"
                        placeholder="City or remote..."
                      />
                    </div>
                  </div>

                  {/* Job Type - Only show for Jobs tab */}
                  {activeTab === 'jobs' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Job Type</label>
                      <select
                        value={typeFilter}
                        onChange={(e) => {
                          setTypeFilter(e.target.value);
                          // Don't auto-apply, wait for search button
                        }}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF] text-sm bg-white"
                      >
                        <option value="">All Types</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Freelance">Freelance</option>
                      </select>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSearch}
                      className="flex-1 bg-[#0BC0DF] text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                      <MagnifyingGlassIcon className="w-4 h-4" />
                      Apply Filters
                    </button>
                    {(appliedFilters.search || appliedFilters.location || appliedFilters.type || appliedFilters.experience || appliedFilters.salary || appliedFilters.remote || appliedFilters.urgent) && (
                      <button
                        onClick={handleClearFilters}
                        className="px-4 py-3 text-gray-500 font-medium border border-gray-200 rounded-lg"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Layout with Sidebar */}
          <div className="flex gap-4 items-start relative">
            {/* Left Sidebar - Desktop Only */}
            <div className="w-80 flex-shrink-0 hidden lg:block">
              <div className="fixed top-24 w-80 max-h-[calc(100vh-7rem)] overflow-y-auto space-y-6 z-10" 
                   style={{left: 'max(1rem, calc(50vw - 700px))'}}>
                {/* Jobs/Internships Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <BriefcaseIcon className="w-5 h-5 text-[#0BC0DF]" />
                    Category
                  </h3>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => {
                        setActiveTab('jobs');
                        setTypeFilter('');
                        setAppliedFilters(prev => ({ ...prev, type: '' }));
                      }}
                      className={`px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                        activeTab === 'jobs'
                          ? 'bg-[#0BC0DF] text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Jobs
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('internships');
                        setTypeFilter('');
                        setAppliedFilters(prev => ({ ...prev, type: '' }));
                      }}
                      className={`px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                        activeTab === 'internships'
                          ? 'bg-[#0BC0DF] text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Internships
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                    <FunnelIcon className="w-4 h-4 text-[#0BC0DF]" />
                    Filters
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Search */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          className="w-full pl-8 pr-2.5 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#0BC0DF] focus:border-[#0BC0DF] text-xs"
                          placeholder="Keywords..."
                        />
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                      <div className="relative">
                        <MapPinIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={locationFilter}
                          onChange={(e) => setLocationFilter(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          className="w-full pl-8 pr-2.5 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#0BC0DF] focus:border-[#0BC0DF] text-xs"
                          placeholder="City or remote..."
                        />
                      </div>
                    </div>

                    {/* Job Type - Only show for Jobs tab */}
                    {activeTab === 'jobs' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Job Type</label>
                        <select
                          value={typeFilter}
                          onChange={(e) => {
                            setTypeFilter(e.target.value);
                            // Don't auto-apply, wait for search button
                          }}
                          className="w-full px-2.5 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#0BC0DF] focus:border-[#0BC0DF] text-xs bg-white"
                        >
                          <option value="">All Types</option>
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Freelance">Freelance</option>
                        </select>
                      </div>
                    )}

                    {/* Search Button */}
                    <button
                      onClick={handleSearch}
                      className="w-full bg-[#0BC0DF] text-white px-3 py-2 rounded-md font-medium flex items-center justify-center gap-1.5 text-xs"
                    >
                      <MagnifyingGlassIcon className="w-4 h-4" />
                      Apply Filters
                    </button>

                    {/* Clear Filters */}
                    {(appliedFilters.search || appliedFilters.location || appliedFilters.type || appliedFilters.experience || appliedFilters.salary || appliedFilters.remote || appliedFilters.urgent) && (
                      <button
                        onClick={handleClearFilters}
                        className="w-full text-xs text-gray-500 font-medium py-1.5"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Saved Jobs Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                    <BookmarkSolidIcon className="w-4 h-4 text-[#0BC0DF]" />
                    Saved Jobs
                  </h3>
                  <button
                    onClick={() => router.push('/saved')}
                    className="w-full bg-gray-100 hover:bg-[#0BC0DF] hover:text-white text-gray-700 px-3 py-2 rounded-md font-medium flex items-center justify-center gap-1.5 text-xs transition-colors"
                  >
                    <BookmarkIcon className="w-4 h-4" />
                    View Saved Jobs
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-lg lg:text-xl font-bold text-gray-900">
                    {activeTab === 'jobs' ? 'Available Jobs' : 'Internship Opportunities'}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {jobs.length} {activeTab === 'jobs' ? 'job' : 'internship'}{jobs.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>

              {jobs.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 lg:p-12 text-center">
                  <BriefcaseIcon className="w-12 h-12 lg:w-16 lg:h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-600 mb-4 max-w-md mx-auto text-sm lg:text-base">
                    {searchTerm || locationFilter || typeFilter
                      ? 'Try adjusting your filters to see more results.'
                      : 'Be the first to post a job opportunity!'}
                  </p>
                  <button
                    onClick={() => router.push('/company/auth/login')}
                    className="bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white px-6 py-2 rounded-lg transition-colors font-medium"
                  >
                    Company Login
                  </button>
                </div>
              ) : (
                <div className="space-y-8 lg:space-y-12">
                  {(() => {
                    // Filter jobs for each section
                    const recommendedJobs = jobs.filter(job => 
                      !job.location?.toLowerCase().includes('remote') && 
                      !job.type?.toLowerCase().includes('internship')
                    ).slice(0, 9);

                    const popularJobs = jobs.filter(job => 
                      job.type?.toLowerCase() === 'full-time' &&
                      !job.location?.toLowerCase().includes('remote')
                    ).slice(0, 9);

                    const remoteJobs = jobs.filter(job => 
                      job.location?.toLowerCase().includes('remote') ||
                      job.location?.toLowerCase().includes('work from home') ||
                      job.location?.toLowerCase().includes('anywhere')
                    ).slice(0, 9);

                    const latestJobs = jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 9);

                    return (
                      <>
                        {/* Recommended Jobs Section */}
                        {recommendedJobs.length > 0 && (
                          <JobSection 
                            title="Recommended for You" 
                            jobs={recommendedJobs} 
                            router={router} 
                            formatDate={formatDate}
                            savedJobs={savedJobs}
                            onSaveJob={handleSaveJob}
                          />
                        )}

                        {/* Popular Jobs Section */}
                        {popularJobs.length > 0 && (
                          <JobSection 
                            title="Popular This Week" 
                            jobs={popularJobs} 
                            router={router} 
                            formatDate={formatDate}
                            savedJobs={savedJobs}
                            onSaveJob={handleSaveJob}
                          />
                        )}

                        {/* Remote Jobs Section */}
                        {remoteJobs.length > 0 && (
                          <JobSection 
                            title="Remote Opportunities" 
                            jobs={remoteJobs} 
                            router={router} 
                            formatDate={formatDate}
                            savedJobs={savedJobs}
                            onSaveJob={handleSaveJob}
                          />
                        )}

                        {/* Latest Jobs Section */}
                        {latestJobs.length > 0 && (
                          <JobSection 
                            title="Latest Openings" 
                            jobs={latestJobs} 
                            router={router} 
                            formatDate={formatDate}
                            savedJobs={savedJobs}
                            onSaveJob={handleSaveJob}
                          />
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Job Section Component - Responsive Grid Layout
function JobSection({ title, jobs, router, formatDate, savedJobs, onSaveJob }: { 
  title: string; 
  jobs: Job[]; 
  router: any; 
  formatDate: (date: string) => string;
  savedJobs: Set<string>;
  onSaveJob: (jobId: string, event: React.MouseEvent) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  
  // Show only 3 jobs initially, all when expanded
  const displayedJobs = showAll ? jobs : jobs.slice(0, 3);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="w-1 h-6 lg:h-8 bg-[#0BC0DF] rounded-full"></div>
          <h2 className="text-xl lg:text-3xl font-extrabold text-gray-900">
            {title}
          </h2>
        </div>
        {jobs.length > 3 && (
          <button 
            onClick={() => setShowAll(!showAll)}
            className="px-3 lg:px-4 py-2 bg-[#0BC0DF] text-white rounded-lg lg:rounded-xl font-semibold text-xs lg:text-sm hover:bg-[#0aa9c4] transition-colors"
          >
            {showAll ? 'Show Less' : `Show More (${jobs.length - 3})`}
          </button>
        )}
      </div>
      
      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {displayedJobs.map((job) => (
          <JobCard 
            key={job.id} 
            job={job} 
            router={router} 
            formatDate={formatDate}
            isSaved={savedJobs.has(job.id)}
            onSaveJob={onSaveJob}
          />
        ))}
      </div>
    </div>
  );
}

// Job Card Component - Grid Layout Optimized
function JobCard({ job, router, formatDate, isSaved, onSaveJob }: { 
  job: Job; 
  router: any; 
  formatDate: (date: string) => string;
  isSaved: boolean;
  onSaveJob: (jobId: string, event: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={() => router.push(`/jobs/${job.id}`)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 lg:p-4 cursor-pointer relative hover:shadow-md transition-all h-full flex flex-col"
    >
      {/* Save Button - Top Right */}
      <button
        onClick={(e) => onSaveJob(job.id, e)}
        className={`absolute top-2 right-2 px-2 py-1 border rounded-lg flex items-center gap-1 text-xs font-semibold transition-colors ${
          isSaved 
            ? 'bg-[#0BC0DF] text-white border-[#0BC0DF]' 
            : 'text-gray-600 border-gray-200 hover:bg-gray-50'
        }`}
      >
        {isSaved ? 'Saved' : 'Save'}
        {isSaved ? (
          <BookmarkSolidIcon className="w-3 h-3" />
        ) : (
          <BookmarkIcon className="w-3 h-3" />
        )}
      </button>

      {/* Company Logo */}
      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden mb-3">
        {job.company?.logo ? (
          <img
            src={job.company.logo}
            alt={job.company.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <BuildingOfficeIcon className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" />
        )}
      </div>

      {/* Company Name & Time */}
      <div className="flex items-center gap-1 mb-2">
        <h4 className="text-sm font-bold text-gray-900 truncate">{job.company?.name || 'Unknown Company'}</h4>
        <VerificationBadge isVerified={job.company?.isVerified || false} size="sm" />
      </div>
      
      <div className="text-gray-400 text-xs mb-2">{formatDate(job.createdAt)}</div>

      {/* Job Title */}
      <h3 className="text-sm lg:text-base font-bold text-gray-900 mb-3 line-clamp-2 leading-tight flex-grow">
        {job.title}
      </h3>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="px-2.5 py-1 bg-[#E6F7FC] text-[#0BC0DF] rounded-full text-xs font-semibold">
          {job.type}
        </span>
        {job.experience && (
          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
            {job.experience}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 mb-3"></div>

      {/* Bottom Section */}
      <div className="flex items-center justify-between mt-auto">
        {/* Salary & Location */}
        <div className="flex-1 min-w-0">
          {job.salary && (
            <div className="text-sm font-bold text-gray-900 mb-1 truncate">
              {job.salary}
            </div>
          )}
          <div className="text-gray-500 text-xs truncate flex items-center gap-1">
            <MapPinIcon className="w-3 h-3 flex-shrink-0" />
            {job.location}
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/jobs/${job.id}`);
          }}
          className="px-3 lg:px-4 py-1.5 lg:py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors flex-shrink-0 ml-3"
        >
          Apply
        </button>
      </div>
    </div>
  );
}