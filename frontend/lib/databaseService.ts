// Database service that uses MongoDB via API routes
// This replaces localStorage for true multi-user functionality

import { type JobPosting, type CompanyData, type UserData, type ApplicationData, type CompanyCreationData } from './types';

interface JobWithCompany extends JobPosting {
  companyData: CompanyData;
}

interface ApplicationWithJobUser extends ApplicationData {
  jobData: JobPosting;
  userData: UserData;
}

// Jobs API functions
export const fetchAllJobs = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  type?: string;
}): Promise<{ jobs: JobWithCompany[]; pagination?: any }> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.location) queryParams.append('location', params.location);
    if (params?.type) queryParams.append('type', params.type);
    
    const url = `${apiUrl}/api/jobs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle both old format (array) and new format (object with jobs and pagination)
    if (Array.isArray(data)) {
      // Old format - return as is for backward compatibility
      return {
        jobs: data.map((job: any) => ({
          ...job,
          id: job.id || job._id,
        }))
      };
    } else {
      // New format with pagination
      return {
        jobs: (data.jobs || []).map((job: any) => ({
          ...job,
          id: job.id || job._id,
        })),
        pagination: data.pagination
      };
    }
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return { jobs: [] };
  }
};

export const fetchJobsByCompanyId = async (companyId: string): Promise<JobWithCompany[]> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    const response = await fetch(`${apiUrl}/api/jobs?companyId=${companyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle both old format (array) and new format (object with jobs and pagination)
    if (Array.isArray(data)) {
      // Old format - return as is for backward compatibility
      return data.map((job: any) => ({
        ...job,
        id: job.id || job._id,
      }));
    } else {
      // New format with pagination
      return (data.jobs || []).map((job: any) => ({
        ...job,
        id: job.id || job._id,
      }));
    }
  } catch (error) {
    console.error('Error fetching jobs by company ID:', error);
    return [];
  }
};

export const createJob = async (job: JobPosting): Promise<boolean> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const response = await fetch(`${apiUrl}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(job),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // If job already exists, that's okay - don't throw an error
      if (response.status === 409 && errorData.error?.includes('already exists')) {
        console.log('Job already exists in database, skipping:', job.title);
        return true;
      }
      
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

export const deleteJob = async (jobId: string): Promise<boolean> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const response = await fetch(`${apiUrl}/api/jobs/${jobId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
};

// Applications API functions
export const fetchAllApplications = async (): Promise<ApplicationData[]> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/api/applications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const applications = await response.json();
    // Map MongoDB _id to id for frontend compatibility
    return applications.map((application: any) => ({
      ...application,
      id: application.id || application._id, // Use id if available, otherwise fallback to _id
    }));
  } catch (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
};

export const fetchApplicationsByCompany = async (companyId: string): Promise<ApplicationData[]> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/api/applications?companyId=${companyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const applications = await response.json();
    // Map MongoDB _id to id for frontend compatibility
    return applications.map((application: any) => ({
      ...application,
      id: application.id || application._id, // Use id if available, otherwise fallback to _id
    }));
  } catch (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
};

export const createApplication = async (application: ApplicationData): Promise<boolean> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const response = await fetch(`${apiUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(application),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // If application already exists, that's okay - don't throw an error
      if (response.status === 409 && errorData.error?.includes('already exists')) {
        console.log('Application already exists in database, skipping:', application.id);
        return true;
      }
      
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error creating application:', error);
    throw error;
  }
};

export const updateApplicationStatus = async (applicationId: string, status: 'pending' | 'reviewed' | 'accepted' | 'rejected'): Promise<boolean> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const response = await fetch(`${apiUrl}/api/applications/${applicationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error updating application:', error);
    throw error;
  }
};

// Companies API functions
export const fetchAllCompanies = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  industry?: string;
  size?: string;
  userId?: string;
}): Promise<{ companies: CompanyData[]; pagination?: any }> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.industry) queryParams.append('industry', params.industry);
    if (params?.size) queryParams.append('size', params.size);
    if (params?.userId) queryParams.append('userId', params.userId);
    
    const url = `${apiUrl}/api/companies${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Fetching companies from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('API Error fetching companies:', response.status, response.statusText);
      // Instead of throwing an error, return empty companies array
      return { companies: [] };
    }

    const data = await response.json();
    
    // Handle both old format (array) and new format (object with companies and pagination)
    if (Array.isArray(data)) {
      // Old format - return as is for backward compatibility
      console.log('Successfully fetched companies (old format):', data.length);
      return {
        companies: data.map((company: any) => ({
          ...company,
          id: company.id || company._id,
        }))
      };
    } else {
      // New format with pagination
      console.log('Successfully fetched companies (new format):', data.companies?.length || 0);
      return {
        companies: (data.companies || []).map((company: any) => ({
          ...company,
          id: company.id || company._id,
        })),
        pagination: data.pagination
      };
    }
  } catch (error) {
    console.error('Error fetching companies:', error);
    // Return a more user-friendly error message
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    // Don't throw the error, just return empty companies array
    return { companies: [] };
  }
};

export const fetchCompanyById = async (id: string): Promise<CompanyData | null> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    const response = await fetch(`${apiUrl}/api/companies/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Company not found
      }
      console.error('API Error fetching company:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const company = await response.json();
    
    // Map MongoDB _id to id for frontend compatibility
    return {
      ...company,
      id: company.id || company._id,
    };
  } catch (error) {
    console.error('Error fetching company by ID:', error);
    return null;
  }
};

export const createCompany = async (company: CompanyCreationData): Promise<any> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    console.log('Creating company with data:', company);
    console.log('Auth token present:', !!token);
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    

    
    const response = await fetch(`${apiUrl}/api/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(company),
    });

    console.log('Company creation response status:', response.status);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      console.error('Company creation failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      // If company already exists, that's okay - don't throw an error
      if (response.status === 409 && errorData.error?.includes('already exists')) {
        console.log('Company already exists in database, skipping:', company.name);
        return { success: true };
      }
      
      // Provide more specific error messages
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('You do not have permission to create companies.');
      } else if (response.status === 400) {
        throw new Error(errorData.error || 'Invalid company data provided.');
      }
      
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const companyData = await response.json();
    console.log('Company created successfully:', companyData);
    return companyData;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
};

// Utility functions
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

// Users API functions
export const fetchAllUsers = async (): Promise<UserData[]> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    console.log('Fetching users from:', `${apiUrl}/api/users`);
    
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const response = await fetch(`${apiUrl}/api/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      console.error('API Error fetching users:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const users = await response.json();
    console.log('Successfully fetched users:', users.length);
    
    // Map MongoDB _id to id for frontend compatibility
    return users.map((user: any) => ({
      ...user,
      id: user.id || user._id, // Use id if available, otherwise fallback to _id
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const createUser = async (user: UserData): Promise<boolean> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const response = await fetch(`${apiUrl}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // If user already exists, that's okay - don't throw an error
      if (response.status === 409 && errorData.error?.includes('already exists')) {
        console.log('User already exists in database, skipping:', user.name);
        return true;
      }
      
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const verifyUserInDB = async (userId: string, isVerified: boolean): Promise<boolean> => {
  try {
    console.log('Attempting to verify user:', userId, 'with verification status:', isVerified);
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    
    const response = await fetch(`${apiUrl}/api/users/${userId}/verify`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({ isVerified }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, create a fallback error object
        errorData = { 
          error: `HTTP error! status: ${response.status}`,
          status: response.status,
          statusText: response.statusText
        };
      }
      
      console.error('API Error response:', errorData);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    console.log('User verification updated successfully');
    return true;
  } catch (error) {
    console.error('Error verifying user:', error);
    throw error;
  }
};

// Database initialization - removed sample data creation
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Check database connectivity
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    const response = await fetch(`${apiUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('Database connection verified');
    } else {
      console.warn('Database connection check failed');
    }
  } catch (error) {
    console.error('Error checking database connection:', error);
  }
};

// Database-only functions (no localStorage fallback)
export const getJobsWithFallback = async (): Promise<JobWithCompany[]> => {
  try {
    const result = await fetchAllJobs();
    return result.jobs;
  } catch (error) {
    console.error('Failed to fetch from database:', error);
    return [];
  }
};

export const getCompaniesWithFallback = async (): Promise<CompanyData[]> => {
  try {
    const result = await fetchAllCompanies();
    return result.companies;
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
};

export const getUserCompanies = async (userId: string): Promise<CompanyData[]> => {
  try {
    const result = await fetchAllCompanies({ userId });
    return result.companies;
  } catch (error) {
    console.error('Error fetching user companies:', error);
    return [];
  }
};

export const getUsersWithFallback = async (): Promise<UserData[]> => {
  try {
    return await fetchAllUsers();
  } catch (error) {
    console.error('Failed to fetch from database:', error);
    return [];
  }
};

// Company approval functions
export const approveCompanyInDB = async (companyId: string, isVerified: boolean = false): Promise<boolean> => {
  try {
    console.log('Attempting to approve company:', companyId, 'with verification:', isVerified);
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    
    const response = await fetch(`${apiUrl}/api/companies/${companyId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({ isVerified }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, create a fallback error object
        errorData = { 
          error: `HTTP error! status: ${response.status}`,
          status: response.status,
          statusText: response.statusText
        };
      }
      
      console.error('API Error response:', errorData);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    console.log('Company approved successfully');
    return true;
  } catch (error) {
    console.error('Error approving company:', error);
    throw error;
  }
};

export const rejectCompanyInDB = async (companyId: string): Promise<boolean> => {
  try {
    console.log('Attempting to reject company:', companyId);
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const response = await fetch(`${apiUrl}/api/companies/${companyId}/approve`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, create a fallback error object
        errorData = { 
          error: `HTTP error! status: ${response.status}`,
          status: response.status,
          statusText: response.statusText
        };
      }
      
      console.error('API Error response:', errorData);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error rejecting company:', error);
    throw error;
  }
};

// Get user's company from MongoDB
export const getUserCompanyFromDB = async (userId: string): Promise<CompanyData | null> => {
  try {
    const result = await fetchAllCompanies({ userId });
    // Return the first company if any exist, since fetchAllCompanies already filters by userId
    return result.companies.length > 0 ? result.companies[0] : null;
  } catch (error) {
    console.error('Error fetching user company:', error);
    return null;
  }
};

// Update company in MongoDB
export const updateCompany = async (company: CompanyData): Promise<boolean> => {
  try {
    console.log('Updating company with data:', company);
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const response = await fetch(`${apiUrl}/api/companies/${company.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(company),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error response:', errorData);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
};
