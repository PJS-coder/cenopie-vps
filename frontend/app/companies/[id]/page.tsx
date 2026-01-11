'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BuildingOfficeIcon, 
  MapPinIcon, 
  GlobeAltIcon, 
  CalendarIcon,
  UsersIcon,
  CheckBadgeIcon,
  BriefcaseIcon,
  NewspaperIcon
} from '@heroicons/react/24/outline';

interface Company {
  id: string;
  name: string;
  description: string;
  industry: string;
  website?: string;
  headquarters: string;
  size: string;
  founded?: string;
  logo?: string;
  coverImage?: string;
  isVerified: boolean;
  status: string;
  createdAt: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  salary?: string;
  status: string;
  applicants: number;
  createdAt: string;
}

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  image?: string;
  publishedAt: string;
}

export default function CompanyProfilePage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;
  
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'jobs' | 'news'>('about');

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        
        // Fetch company profile
        const apiUrl = 'http://localhost:4000'; // Direct URL for now
        const companyResponse = await fetch(`${apiUrl}/api/companies/${companyId}/public`);
        
        if (!companyResponse.ok) {
          throw new Error('Company not found');
        }
        const companyData = await companyResponse.json();
        setCompany(companyData.company);

        // Fetch company jobs
        const jobsResponse = await fetch(`${apiUrl}/api/companies/${companyId}/jobs`);
        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json();
          setJobs(jobsData.jobs || []);
        }

        // Fetch company news
        const newsResponse = await fetch(`${apiUrl}/api/companies/${companyId}/news`);
        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          setNews(newsData.news || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load company');
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Company Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The company you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/companies')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Companies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-blue-600 to-purple-600">
        {company.coverImage && (
          <img
            src={company.coverImage}
            alt={`${company.name} cover`}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      </div>

      {/* Company Header */}
      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={`${company.name} logo`}
                  className="w-24 h-24 rounded-lg object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                  <BuildingOfficeIcon className="w-12 h-12 text-gray-500" />
                </div>
              )}
            </div>

            {/* Company Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                {company.isVerified && (
                  <CheckBadgeIcon className="w-8 h-8 text-blue-600" />
                )}
              </div>
              <p className="text-gray-600 mb-4">{company.description}</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{company.headquarters}</span>
                </div>
                <div className="flex items-center gap-1">
                  <UsersIcon className="w-4 h-4" />
                  <span>{company.size}</span>
                </div>
                {company.founded && (
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Founded {company.founded}</span>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-1">
                    <GlobeAltIcon className="w-4 h-4" />
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('about')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'about'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                About
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className={`px-6 py-4 text-sm font-medium flex items-center gap-2 ${
                  activeTab === 'jobs'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BriefcaseIcon className="w-4 h-4" />
                Jobs ({jobs.length})
              </button>
              <button
                onClick={() => setActiveTab('news')}
                className={`px-6 py-4 text-sm font-medium flex items-center gap-2 ${
                  activeTab === 'news'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <NewspaperIcon className="w-4 h-4" />
                News ({news.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About {company.name}</h3>
                  <p className="text-gray-600 leading-relaxed">{company.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Industry</h4>
                    <p className="text-gray-600">{company.industry}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Company Size</h4>
                    <p className="text-gray-600">{company.size}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Headquarters</h4>
                    <p className="text-gray-600">{company.headquarters}</p>
                  </div>
                  {company.founded && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Founded</h4>
                      <p className="text-gray-600">{company.founded}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Jobs Tab */}
            {activeTab === 'jobs' && (
              <div className="space-y-4">
                {jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <BriefcaseIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No open positions at the moment.</p>
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{job.title}</h4>
                          <p className="text-gray-600 text-sm mb-2">{job.location} • {job.type}</p>
                          <p className="text-gray-600 text-sm line-clamp-2">{job.description}</p>
                          {job.salary && (
                            <p className="text-green-600 font-medium text-sm mt-2">{job.salary}</p>
                          )}
                        </div>
                        <Link
                          href={`/jobs/${job.id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors ml-4"
                        >
                          View Job
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* News Tab */}
            {activeTab === 'news' && (
              <div className="space-y-4">
                {news.length === 0 ? (
                  <div className="text-center py-8">
                    <NewspaperIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No news articles available.</p>
                  </div>
                ) : (
                  news.map((article) => (
                    <div key={article.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex gap-4">
                        {article.image && (
                          <img
                            src={article.image}
                            alt={article.title}
                            className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">{article.title}</h4>
                          <p className="text-gray-600 text-sm line-clamp-3">{article.content}</p>
                          <p className="text-gray-400 text-xs mt-2">
                            {new Date(article.publishedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}