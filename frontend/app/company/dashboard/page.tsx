'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BuildingOfficeIcon,
  BriefcaseIcon,
  UsersIcon,
  EyeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  NewspaperIcon,
  Cog6ToothIcon,
  MapPinIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import CenopieLoader from '@/components/CenopieLoader';
import VerificationBadge from '@/components/VerificationBadge';
import { useToastContext } from '@/components/ToastProvider';
import ConfirmModal from '@/components/ConfirmModal';

// Company News Tab Component
function CompanyNewsTab({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyNews = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/news`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('companyAuthToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setNews(data.news || []);
        } else {
          setError('Failed to fetch news');
        }
      } catch (err) {
        console.error('Error fetching company news:', err);
        setError('Failed to fetch news');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyNews();
  }, [companyId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Company News</h2>
        </div>
        <div className="p-6">
          <SimpleLoader size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Company News</h2>
          <button
            onClick={() => router.push('/company/news/create')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Post News</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {error ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">Error: {error}</div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12">
            <NewspaperIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No news posted yet</h3>
            <p className="text-gray-500 mb-4">Share company updates and announcements with your audience.</p>
            <button
              onClick={() => router.push('/company/news/create')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Post Your First News
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((article) => (
              <div
                key={article.id}
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{article.title}</h3>
                    <p className="text-gray-700 text-sm mb-3 line-clamp-3">{article.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        article.isPublished 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {article.isPublished ? 'Published' : 'Draft'}
                      </span>
                      {article.publishedAt && (
                        <span>Published {formatDate(article.publishedAt)}</span>
                      )}
                      <span>Created {formatDate(article.createdAt)}</span>
                    </div>
                  </div>
                  {article.image && (
                    <div className="ml-4 w-20 h-20 rounded-lg overflow-hidden bg-gray-200">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import SimpleLoader from '@/components/SimpleLoader';

interface Company {
  id: string;
  name: string;
  email: string;
  description: string;
  industry: string;
  website?: string;
  headquarters: string;
  size: string;
  founded?: string;
  logo?: string;
  coverImage?: string;
  isVerified: boolean;
  isApproved: boolean;
  status: 'pending' | 'approved' | 'rejected';
}

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  salary?: string;
  status: 'active' | 'paused' | 'closed';
  applicants: number;
  createdAt: string;
}

export default function CompanyDashboard() {
  const router = useRouter();
  const toast = useToastContext();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'jobs' | 'applications' | 'news'>('overview');
  const [editingProfile, setEditingProfile] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [showDeleteJobConfirm, setShowDeleteJobConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0
  });

  // Profile editing states
  const [profileData, setProfileData] = useState({
    name: '',
    description: '',
    industry: '',
    website: '',
    headquarters: '',
    size: '',
    founded: '',
    logo: '',
    coverImage: ''
  });

  // Job form states
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    requirements: '',
    benefits: '',
    location: '',
    type: 'Full-time',
    experience: '',
    salary: ''
  });

  // News form states
  const [newsData, setNewsData] = useState({
    title: '',
    content: '',
    image: '',
    publishNow: true
  });

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('companyAuthToken');
      const companyData = localStorage.getItem('currentCompany');

      if (!token || !companyData) {
        router.push('/company/auth/login');
        return false;
      }

      return true;
    };

    const loadDashboardData = async () => {
      if (!checkAuth()) return;

      try {
        setLoading(true);

        // Load company profile
        const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('companyAuthToken')}`
          }
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setCompany(profileData.company);
          setProfileData({
            name: profileData.company.name || '',
            description: profileData.company.description || '',
            industry: profileData.company.industry || '',
            website: profileData.company.website || '',
            headquarters: profileData.company.headquarters || '',
            size: profileData.company.size || '',
            founded: profileData.company.founded || '',
            logo: profileData.company.logo || '',
            coverImage: profileData.company.coverImage || ''
          });

          // Load company jobs and stats only if approved
          if (profileData.company.status === 'approved') {
            const [jobsResponse, statsResponse] = await Promise.all([
              fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/jobs`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('companyAuthToken')}`
                }
              }),
              fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/stats`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('companyAuthToken')}`
                }
              })
            ]);

            if (jobsResponse.ok) {
              const jobsData = await jobsResponse.json();
              setJobs(jobsData.jobs || []);
            }

            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              setStats(statsData.stats || stats);
            }
          }
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

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

  const handleLogout = () => {
    localStorage.removeItem('companyAuthToken');
    localStorage.removeItem('currentCompany');
    // Dispatch custom event to notify navbar of auth change
    window.dispatchEvent(new CustomEvent('companyAuthChange'));
    router.push('/company/auth/login');
  };

  const handleJobSubmit = async () => {
    try {
      const jobPayload = {
        ...jobData,
        requirements: jobData.requirements.split('\n').filter(req => req.trim()),
        benefits: jobData.benefits.split('\n').filter(benefit => benefit.trim()),
        status: 'active',
        applicants: 0
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('companyAuthToken')}`
        },
        body: JSON.stringify(jobPayload)
      });

      if (response.ok) {
        setShowJobForm(false);
        setJobData({
          title: '',
          description: '',
          requirements: '',
          benefits: '',
          location: '',
          type: 'Full-time',
          experience: '',
          salary: ''
        });
        // Reload jobs data
        window.location.reload();
        toast.success('Job posted successfully!');
      }
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Failed to create job');
    }
  };

  const handleNewsSubmit = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('companyAuthToken')}`
        },
        body: JSON.stringify(newsData)
      });

      if (response.ok) {
        setShowNewsForm(false);
        setNewsData({
          title: '',
          content: '',
          image: '',
          publishNow: true
        });
        toast.success('News posted successfully!');
      }
    } catch (error) {
      console.error('Error creating news:', error);
      toast.error('Failed to create news');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    setJobToDelete(jobId);
    setShowDeleteJobConfirm(true);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/jobs/${jobToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('companyAuthToken')}`
        }
      });

      if (response.ok) {
        setJobs(jobs.filter(job => job.id !== jobToDelete));
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
    setJobToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SimpleLoader size="lg" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Company Not Found</h1>
          <p className="text-gray-600 mb-6">Unable to load company data.</p>
          <button
            onClick={() => router.push('/company/auth/login')}
            className="bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Cover */}
      <div className="relative">
        <div className="h-48 w-full overflow-hidden">
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

        {/* Company Logo */}
        <div className="absolute -bottom-12 left-8 w-24 h-24 rounded-xl border-4 border-white bg-white shadow-lg overflow-hidden">
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

        {/* Logout Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={handleLogout}
            className="bg-white/90 hover:bg-white text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Company Info Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
              <VerificationBadge isVerified={company.isVerified} size="lg" />
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${company.status === 'approved' ? 'bg-green-100 text-green-800' :
                company.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                {company.status === 'approved' ? 'Approved' :
                  company.status === 'pending' ? 'Pending Approval' : 'Rejected'}
              </span>
            </div>
            <p className="text-gray-600">{company.email}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              {company.industry && (
                <span className="flex items-center">
                  <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                  {company.industry}
                </span>
              )}
              {company.headquarters && (
                <span className="flex items-center">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  {company.headquarters}
                </span>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <GlobeAltIcon className="w-4 h-4 mr-1" />
                  Website
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/company/profile?edit=true')}
              className="bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              <span>Edit Company</span>
            </button>
            <button
              onClick={() => router.push(`/companies/${company.id}`)}
              className="text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-1"
            >
              <EyeIcon className="w-4 h-4" />
              <span>View Public Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                  ? 'border-[#0BC0DF] text-[#0BC0DF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Overview
              </button>
              {company.status === 'approved' && (
                <>
                  <button
                    onClick={() => setActiveTab('jobs')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'jobs'
                      ? 'border-[#0BC0DF] text-[#0BC0DF]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    Jobs ({jobs.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('applications')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'applications'
                      ? 'border-[#0BC0DF] text-[#0BC0DF]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    Applications ({stats.totalApplications})
                  </button>
                  <button
                    onClick={() => setActiveTab('news')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'news'
                      ? 'border-[#0BC0DF] text-[#0BC0DF]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    News
                  </button>
                </>
              )}
            </nav>
          </div>

          <div className="p-6">
            {/* Status Alert */}
            {company.status !== 'approved' && (
              <div className={`mb-6 rounded-lg p-6 ${company.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-red-50 border border-red-200'
                }`}>
                <div className="flex items-start">
                  {company.status === 'pending' ? (
                    <ClockIcon className="w-6 h-6 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-red-600 mr-3 mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 ${company.status === 'pending' ? 'text-yellow-800' : 'text-red-800'
                      }`}>
                      {company.status === 'pending' ? 'Approval Process in Progress' : 'Application Rejected'}
                    </h3>
                    <p className={`text-sm mb-3 ${company.status === 'pending' ? 'text-yellow-700' : 'text-red-700'
                      }`}>
                      {company.status === 'pending'
                        ? 'Thank you for registering your company with Cenopie! Our team is currently reviewing your application and verifying your business information.'
                        : 'Your company registration was rejected. Please contact our support team for more information about the rejection reason and next steps.'}
                    </p>
                    {company.status === 'pending' && (
                      <div className="space-y-2 text-sm text-yellow-700">
                        <p><strong>What happens next:</strong></p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Our team will verify your business registration and contact information</li>
                          <li>You will receive an email notification once your company is approved</li>
                          <li>This process typically takes 1-2 business days</li>
                          <li>Once approved, you can start posting jobs and company news</li>
                        </ul>
                      </div>
                    )}
                    {company.status === 'rejected' && (
                      <div className="mt-3">
                        <button
                          onClick={() => window.location.href = 'mailto:support@cenopie.com?subject=Company Registration Rejected'}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          Contact Support
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards - Only show for approved companies */}
            {company.status === 'approved' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <BriefcaseIcon className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.activeJobs}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <UsersIcon className="w-8 h-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Applications</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <ClockIcon className="w-8 h-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Actions */}
                {company.status === 'approved' && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => router.push('/company/jobs/create')}
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <BriefcaseIcon className="w-6 h-6 text-blue-600 mr-3" />
                        <div>
                          <h4 className="font-medium text-gray-900">Post New Job</h4>
                          <p className="text-sm text-gray-600">Create a new job posting</p>
                        </div>
                      </button>

                      <button
                        onClick={() => router.push('/company/news/create')}
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <NewspaperIcon className="w-6 h-6 text-purple-600 mr-3" />
                        <div>
                          <h4 className="font-medium text-gray-900">Post News</h4>
                          <p className="text-sm text-gray-600">Share company updates</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Welcome message for non-approved companies */}
                {company.status !== 'approved' && (
                  <div className="text-center py-12">
                    <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to your dashboard</h3>
                    <p className="text-gray-500">Once your company is approved, you'll be able to post jobs and news.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'jobs' && company.status === 'approved' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Job Postings</h2>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push('/company/applications')}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Applications
                      </button>
                      <button
                        onClick={() => router.push('/company/jobs/create')}
                        className="bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>Post Job</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {jobs.length === 0 ? (
                    <div className="text-center py-12">
                      <BriefcaseIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
                      <p className="text-gray-500 mb-4">Start by posting your first job opening.</p>
                      <button
                        onClick={() => router.push('/company/jobs/create')}
                        className="bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        Post Your First Job
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {jobs.map((job) => (
                        <div
                          key={job.id}
                          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${job.status === 'active' ? 'bg-green-100 text-green-800' :
                                  job.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                  {job.status}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                                <span>{job.location}</span>
                                <span>{job.type}</span>
                                {job.salary && <span className="font-medium text-green-600">{job.salary}</span>}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/company/applications?jobId=${job.id}`);
                                  }}
                                  className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md hover:bg-purple-200 transition-colors font-medium"
                                >
                                  {job.applicants} applicants
                                </button>
                                <span className="text-xs">Posted {formatDate(job.createdAt)}</span>
                              </div>
                              <p className="text-gray-700 text-sm line-clamp-2">{job.description}</p>
                            </div>

                            <div className="flex items-center space-x-1 ml-4">
                              <button
                                onClick={() => router.push(`/jobs/${job.id}`)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                title="View job"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => router.push(`/company/applications?jobId=${job.id}`)}
                                className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                                title="View applicants"
                              >
                                <UsersIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteJob(job.id)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete job"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'applications' && company.status === 'approved' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Job Applications</h2>
                    <button
                      onClick={() => router.push('/company/applications')}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <UsersIcon className="w-4 h-4" />
                      <span>View All Applications</span>
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {stats.totalApplications === 0 ? (
                    <div className="text-center py-12">
                      <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                      <p className="text-gray-500 mb-4">
                        Applications will appear here when candidates apply to your job postings.
                      </p>
                      <div className="flex flex-wrap gap-4 justify-center">
                        <button
                          onClick={() => router.push('/company/jobs/create')}
                          className="bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white px-6 py-2 rounded-lg transition-colors"
                        >
                          Post a Job
                        </button>
                        <button
                          onClick={() => setActiveTab('jobs')}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                          View Jobs
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Application Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <UsersIcon className="w-8 h-8 text-blue-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-blue-600">Total Applications</p>
                              <p className="text-2xl font-bold text-blue-900">{stats.totalApplications}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-yellow-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <ClockIcon className="w-8 h-8 text-yellow-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-yellow-600">Pending Review</p>
                              <p className="text-2xl font-bold text-yellow-900">{stats.pendingApplications}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <CheckCircleIcon className="w-8 h-8 text-green-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-green-600">Active Jobs</p>
                              <p className="text-2xl font-bold text-green-900">{stats.activeJobs}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Applications by Job */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900">Applications by Job</h4>
                        {jobs.filter(job => job.applicants > 0).map((job) => (
                          <div key={job.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{job.title}</h5>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                  <span>{job.location}</span>
                                  <span>{job.type}</span>
                                  <span>Posted {formatDate(job.createdAt)}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <p className="text-lg font-semibold text-purple-600">{job.applicants}</p>
                                  <p className="text-sm text-gray-500">applications</p>
                                </div>
                                <button
                                  onClick={() => router.push(`/company/applications?jobId=${job.id}`)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                  View Applications
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {jobs.filter(job => job.applicants > 0).length === 0 && (
                          <div className="text-center py-8">
                            <p className="text-gray-500">No applications received yet for any jobs.</p>
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="border-t border-gray-200 pt-6">
                        <div className="flex flex-wrap gap-4">
                          <button
                            onClick={() => router.push('/company/applications')}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
                          >
                            View All Applications
                          </button>
                          <button
                            onClick={() => router.push('/company/jobs/create')}
                            className="bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white px-6 py-2 rounded-lg transition-colors"
                          >
                            Post New Job
                          </button>
                          <button
                            onClick={() => setActiveTab('jobs')}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                          >
                            Manage Jobs
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'news' && company.status === 'approved' && (
              <CompanyNewsTab companyId={company.id} />
            )}
          </div>
        </div>
      </div>

      {/* Delete Job Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteJobConfirm}
        onClose={() => {
          setShowDeleteJobConfirm(false);
          setJobToDelete(null);
        }}
        onConfirm={confirmDeleteJob}
        title="Delete Job"
        message="Are you sure you want to delete this job? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}