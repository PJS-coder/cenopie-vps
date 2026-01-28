'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NewspaperIcon, PhotoIcon } from '@heroicons/react/24/outline';
import StreamingFeedLoader from '@/components/StreamingFeedLoader';
import { useToastContext } from '@/components/ToastProvider';

export default function CreateNewsPage() {
  const router = useRouter();
  const toast = useToastContext();
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [formData, setFormData] = useState({
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
      
      const company = JSON.parse(companyData);
      if (company.status !== 'approved') {
        router.push('/company/dashboard');
        return false;
      }
      
      setCompany(company);
      return true;
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      const newsData = {
        ...formData,
        publishedAt: formData.publishNow ? new Date().toISOString() : null
      };

      const token = localStorage.getItem('companyAuthToken');
      console.log('=== FRONTEND NEWS CREATION ===');
      console.log('Token available:', !!token);
      console.log('Token (first 20 chars):', token ? token.substring(0, 20) + '...' : 'None');
      console.log('News data:', newsData);
      console.log('API URL:', `${process.env.NEXT_PUBLIC_API_URL}/api/company/news`);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newsData)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        toast.success('News article created successfully!');
        
        // Trigger a refresh of news data across the app
        window.dispatchEvent(new CustomEvent('newsUpdated'));
        
        router.push('/company/dashboard');
      } else {
        const errorData = await response.json();
        console.error('News creation error:', errorData);
        console.error('Response status:', response.status);
        
        let errorMessage = 'Failed to create news. ';
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (response.status === 403) {
          errorMessage = 'Your company needs to be approved to create news.';
        } else {
          errorMessage = `Server error (${response.status})`;
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating news:', error);
      toast.error('Failed to create news. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !company) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6"><StreamingFeedLoader count={1} /></div>;
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
              <NewspaperIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Company News</h1>
            <p className="text-gray-600">
              Share updates, announcements, and news from {company.name}.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* News Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">News Article</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF]"
                    placeholder="e.g. We're Expanding to New Markets"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Article Content *
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF]"
                    placeholder="Write your news article content here. Share company updates, achievements, new product launches, team expansions, or any other news you'd like to share with the community..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <PhotoIcon className="w-4 h-4 inline mr-1" />
                    Featured Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BC0DF] focus:border-[#0BC0DF]"
                    placeholder="https://example.com/news-image.jpg"
                  />
                  <p className="text-sm text-gray-500 mt-1">Add an image to make your news more engaging</p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="publishNow"
                    checked={formData.publishNow}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-[#0BC0DF] focus:ring-[#0BC0DF] border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Publish immediately
                  </label>
                </div>
              </div>
            </div>

            {/* Preview */}
            {(formData.title || formData.content) && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg mb-4"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  {formData.title && (
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{formData.title}</h3>
                  )}
                  {formData.content && (
                    <div className="text-gray-700 whitespace-pre-line">
                      {formData.content.substring(0, 300)}
                      {formData.content.length > 300 && '...'}
                    </div>
                  )}
                  <div className="mt-4 text-sm text-gray-500">
                    By {company.name} • {formData.publishNow ? 'Publishing now' : 'Draft'}
                  </div>
                </div>
              </div>
            )}

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
                {loading ? 'Publishing...' : formData.publishNow ? 'Publish News' : 'Save Draft'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}