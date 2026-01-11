'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { 
  BuildingOfficeIcon, 
  MapPinIcon, 
  UsersIcon,
  CheckBadgeIcon,
  MagnifyingGlassIcon
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

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:4000/api/companies');
        if (!response.ok) {
          throw new Error('Failed to fetch companies');
        }
        const data = await response.json();
        setCompanies(data.companies || []);
        setFilteredCompanies(data.companies || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load companies');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(company =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.industry.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  }, [searchQuery, companies]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Companies</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Companies</h1>
          <p className="text-gray-600">Discover companies and explore career opportunities</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Companies Grid */}
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search terms.' : 'No companies are available at the moment.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/companies/${company.id}`)}
              >
                {/* Cover Image */}
                <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 relative">
                  {company.coverImage && (
                    <img
                      src={company.coverImage}
                      alt={`${company.name} cover`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="p-6 -mt-8 relative">
                  {/* Logo */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-shrink-0">
                      {company.logo ? (
                        <img
                          src={company.logo}
                          alt={`${company.name} logo`}
                          className="w-16 h-16 rounded-lg object-cover border-4 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                          <BuildingOfficeIcon className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                    </div>
                    {company.isVerified && (
                      <CheckBadgeIcon className="w-6 h-6 text-blue-600 mt-2" />
                    )}
                  </div>

                  {/* Company Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{company.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{company.description}</p>
                    
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="w-3 h-3" />
                        <span>{company.headquarters}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UsersIcon className="w-3 h-3" />
                        <span>{company.size}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                        <span>{company.industry}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}