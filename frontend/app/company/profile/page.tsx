'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  BuildingOfficeIcon, 
  PhotoIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  GlobeAltIcon,
  MapPinIcon,
  UsersIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import OptimizedLoader from '@/components/OptimizedLoader';
import VerificationBadge from '@/components/VerificationBadge';

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
  status: string;
}

// Toast Notification Component
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  show: boolean;
  onClose: () => void;
}

function Toast({ message, type, show, onClose }: ToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out ${
      show ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
    }`}>
      <div className={`rounded-lg shadow-lg border p-4 max-w-sm ${
        type === 'success' 
          ? 'bg-green-50 border-green-200 text-green-800' 
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
            type === 'success' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {type === 'success' ? (
              <CheckIcon className="w-4 h-4 text-green-600" />
            ) : (
              <XMarkIcon className="w-4 h-4 text-red-600" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium">{message}</p>
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 p-1 rounded-full hover:bg-opacity-20 transition-colors ${
              type === 'success' ? 'hover:bg-green-600' : 'hover:bg-red-600'
            }`}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompanyProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error'
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };
  
  const [formData, setFormData] = useState({
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

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
    'Retail', 'Consulting', 'Media', 'Real Estate', 'Transportation',
    'Energy', 'Agriculture', 'Construction', 'Entertainment', 'Other'
  ];

  const companySizes = [
    '1-10 employees',
    '11-50 employees', 
    '51-200 employees',
    '201-500 employees',
    '501-1000 employees',
    '1000+ employees'
  ];

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

    const loadCompanyProfile = async () => {
      if (!checkAuth()) return;
      
      try {
        setLoading(true);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('companyAuthToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCompany(data.company);
          setFormData({
            name: data.company.name || '',
            description: data.company.description || '',
            industry: data.company.industry || '',
            website: data.company.website || '',
            headquarters: data.company.headquarters || '',
            size: data.company.size || '',
            founded: data.company.founded || '',
            logo: data.company.logo || '',
            coverImage: data.company.coverImage || ''
          });

          // Check if edit mode should be enabled from URL parameter
          const editParam = searchParams.get('edit');
          if (editParam === 'true') {
            setEditing(true);
          }
        }
      } catch (error) {
        // Error loading company profile
      } finally {
        setLoading(false);
      }
    };

    loadCompanyProfile();

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
  }, [router, searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
      }
      
      if (type === 'logo') {
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
      } else {
        setCoverImageFile(file);
        setCoverImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'coverImage') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('companyAuthToken')}`
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.data?.url || data.url;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to upload ${type}`);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      let updateData = { ...formData };

      // Upload images separately
      if (logoFile) {
        const logoUrl = await handleImageUpload(logoFile, 'logo');
        updateData.logo = logoUrl;
      }

      if (coverImageFile) {
        const coverUrl = await handleImageUpload(coverImageFile, 'coverImage');
        updateData.coverImage = coverUrl;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('companyAuthToken')}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const data = await response.json();
        
        setCompany(data.company);
        setFormData({
          name: data.company.name || '',
          description: data.company.description || '',
          industry: data.company.industry || '',
          website: data.company.website || '',
          headquarters: data.company.headquarters || '',
          size: data.company.size || '',
          founded: data.company.founded || '',
          logo: data.company.logo || '',
          coverImage: data.company.coverImage || ''
        });
        
        // Update localStorage
        localStorage.setItem('currentCompany', JSON.stringify(data.company));
        
        setEditing(false);
        setLogoFile(null);
        setCoverImageFile(null);
        setLogoPreview('');
        setCoverImagePreview('');
        
        // Remove edit parameter from URL
        const editParam = searchParams.get('edit');
        if (editParam === 'true') {
          router.replace('/company/profile');
        }
        
        showToast('Company profile updated successfully!', 'success');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      showToast('Failed to update profile. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (company) {
      setFormData({
        name: company.name || '',
        description: company.description || '',
        industry: company.industry || '',
        website: company.website || '',
        headquarters: company.headquarters || '',
        size: company.size || '',
        founded: company.founded || '',
        logo: company.logo || '',
        coverImage: company.coverImage || ''
      });
    }
    setEditing(false);
    setLogoFile(null);
    setCoverImageFile(null);
    setLogoPreview('');
    setCoverImagePreview('');

    // If came from dashboard with edit parameter, go back to dashboard
    const editParam = searchParams.get('edit');
    if (editParam === 'true') {
      router.push('/company/dashboard');
    }
  };

  if (loading) {
    return <OptimizedLoader variant="page" />;
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Company Not Found</h1>
          <p className="text-gray-600 mb-6">Unable to load company profile.</p>
          <button
            onClick={() => router.push('/company/dashboard')}
            className="bg-[#0BC0DF] hover:bg-[#0aa9c4] text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toast 
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={hideToast}
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Simple Header - Only Back Button */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <button
                onClick={() => router.push('/company/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Cover Image Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="relative">
              <div className="h-40 w-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600">
                {editing && coverImagePreview ? (
                  <img 
                    src={coverImagePreview} 
                    alt="Cover preview" 
                    className="w-full h-full object-cover"
                  />
                ) : company.coverImage ? (
                  <img 
                    src={company.coverImage} 
                    alt={`${company.name} cover`} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <div className="text-center text-white">
                      <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium opacity-75">Add a cover image to showcase your company</p>
                    </div>
                  </div>
                )}
              </div>
              
              {editing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
                  <label className="bg-white text-gray-700 px-6 py-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2 shadow-lg font-medium border border-gray-200">
                    <PhotoIcon className="w-5 h-5 text-[#0BC0DF]" />
                    <span>Upload Cover Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'coverImage')}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
              
              {/* Company Logo */}
              <div className="absolute -bottom-12 left-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-xl border-4 border-white bg-white shadow-xl overflow-hidden">
                    {editing && logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : company.logo ? (
                      <img 
                        src={company.logo} 
                        alt={`${company.name} logo`} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <BuildingOfficeIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {editing && (
                    <label className="absolute inset-0 bg-black bg-opacity-60 rounded-xl flex items-center justify-center cursor-pointer hover:bg-opacity-70 transition-all duration-200 opacity-0 group-hover:opacity-100">
                      <div className="text-center text-white">
                        <PhotoIcon className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs font-medium">Upload Logo</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'logo')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
            
            <div className="pt-16 pb-6 px-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {editing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="text-2xl font-bold text-gray-900 bg-white border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[#0BC0DF] focus:ring-2 focus:ring-[#0BC0DF]/20 outline-none transition-all duration-200 shadow-sm"
                        placeholder="Company Name"
                      />
                    ) : (
                      <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                    )}
                    <VerificationBadge isVerified={company.isVerified} size="lg" />
                  </div>
                  <div className="flex items-center space-x-4 mb-3">
                    <p className="text-gray-600 font-medium">{company.email}</p>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      company.status === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                      company.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {company.status === 'approved' ? '✓ Approved Company' :
                       company.status === 'pending' ? '⏳ Pending Approval' : '✗ Rejected'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Company Information</h2>
              {!editing && (
                <div className="text-sm text-gray-500">
                  Keep your information up to date for better visibility
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-500" />
                    Industry
                  </label>
                  {editing ? (
                    <select
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF] transition-all duration-200 bg-white text-gray-900 font-medium shadow-sm hover:border-gray-400"
                    >
                      <option value="">Select an industry</option>
                      {industries.map(industry => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <BuildingOfficeIcon className="w-4 h-4 mr-3 text-[#0BC0DF]" />
                      <span className="text-gray-900 font-medium">{company.industry || 'Not specified'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <UsersIcon className="w-4 h-4 mr-2 text-gray-500" />
                    Company Size
                  </label>
                  {editing ? (
                    <select
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF] transition-all duration-200 bg-white text-gray-900 font-medium shadow-sm hover:border-gray-400"
                    >
                      <option value="">Select company size</option>
                      {companySizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <UsersIcon className="w-4 h-4 mr-3 text-[#0BC0DF]" />
                      <span className="text-gray-900 font-medium">{company.size || 'Not specified'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2 text-gray-500" />
                    Founded Year
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      name="founded"
                      value={formData.founded}
                      onChange={handleInputChange}
                      min="1800"
                      max={new Date().getFullYear()}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF] transition-all duration-200 bg-white text-gray-900 font-medium shadow-sm hover:border-gray-400"
                      placeholder="2020"
                    />
                  ) : (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <CalendarIcon className="w-4 h-4 mr-3 text-[#0BC0DF]" />
                      <span className="text-gray-900 font-medium">{company.founded || 'Not specified'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-2 text-gray-500" />
                    Headquarters
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="headquarters"
                      value={formData.headquarters}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF] transition-all duration-200 bg-white text-gray-900 font-medium shadow-sm hover:border-gray-400"
                      placeholder="City, Country"
                    />
                  ) : (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <MapPinIcon className="w-4 h-4 mr-3 text-[#0BC0DF]" />
                      <span className="text-gray-900 font-medium">{company.headquarters || 'Not specified'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <GlobeAltIcon className="w-4 h-4 mr-2 text-gray-500" />
                    Website
                  </label>
                  {editing ? (
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF] transition-all duration-200 bg-white text-gray-900 font-medium shadow-sm hover:border-gray-400"
                      placeholder="https://yourcompany.com"
                    />
                  ) : (
                    company.website ? (
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200 group"
                      >
                        <GlobeAltIcon className="w-4 h-4 mr-3 text-blue-600" />
                        <span className="text-blue-600 font-medium group-hover:underline">{company.website}</span>
                        <svg className="w-4 h-4 ml-2 text-blue-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <GlobeAltIcon className="w-4 h-4 mr-3 text-gray-400" />
                        <span className="text-gray-500 font-medium">No website specified</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Company Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">About the Company</h2>
              {!editing && (
                <div className="text-sm text-gray-500">
                  Tell your story and attract top talent
                </div>
              )}
            </div>
            {editing ? (
              <div className="space-y-3">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF] transition-colors resize-none text-gray-900 leading-relaxed"
                  placeholder="Describe your company, its mission, values, and what makes it unique. Share your company culture, achievements, and what sets you apart from competitors..."
                />
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Write a compelling description to attract the best candidates</span>
                  <span>{formData.description.length} characters</span>
                </div>
              </div>
            ) : (
              <div className="prose max-w-none">
                {company.description ? (
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100">
                    {company.description}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
                    <BuildingOfficeIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No company description added yet</p>
                    <p className="text-gray-400 text-sm mt-1">Add a description to help candidates learn about your company</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Edit Profile Button - Only show when not editing */}
          {!editing && (
            <div className="flex justify-center pt-6">
              <button
                onClick={() => setEditing(true)}
                className="bg-gradient-to-r from-[#0BC0DF] to-blue-500 hover:from-[#0aa9c4] hover:to-blue-600 text-white px-8 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <PencilIcon className="w-5 h-5" />
                <span>Edit Profile</span>
              </button>
            </div>
          )}

          {/* Action Buttons - Only show when editing */}
          {editing && (
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="text-gray-600 hover:text-gray-800 transition-all duration-200 flex items-center space-x-2 px-6 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium"
              >
                <XMarkIcon className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}