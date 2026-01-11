'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BuildingOfficeIcon, 
  UsersIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  StarIcon, 
  ShieldCheckIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { isPasskeyAuthenticated } from '@/lib/passkeyAuth';
import { fetchAllUsers, verifyUserInDB } from '@/lib/databaseService';
import { type CompanyData, type UserData } from '@/lib/types';
import VerificationBadge from '@/components/VerificationBadge';

export default function SecureAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'companies' | 'users' | 'make-admin' | 'hr-management'>('companies');
  const [companySubTab, setCompanySubTab] = useState<'pending' | 'approved' | 'blacklisted'>('pending');
  const [userSubTab, setUserSubTab] = useState<'active' | 'blacklisted'>('active');
  const [pendingCompanies, setPendingCompanies] = useState<CompanyData[]>([]);
  const [approvedCompanies, setApprovedCompanies] = useState<CompanyData[]>([]);
  const [blacklistedCompanies, setBlacklistedCompanies] = useState<CompanyData[]>([]);
  const [activeUsers, setActiveUsers] = useState<UserData[]>([]);
  const [blacklistedUsers, setBlacklistedUsers] = useState<UserData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [hrUsers, setHrUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [denialReason, setDenialReason] = useState('');
  
  // Search states
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [companySearchFilter, setCompanySearchFilter] = useState<'all' | 'name' | 'email' | 'industry'>('all');
  const [userSearchFilter, setUserSearchFilter] = useState<'all' | 'name' | 'email'>('all');
  
  // Make Admin form state
  const [adminEmail, setAdminEmail] = useState('');
  const [makingAdmin, setMakingAdmin] = useState(false);
  
  // HR Management form state
  const [hrEmail, setHrEmail] = useState('');
  const [makingHr, setMakingHr] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = isPasskeyAuthenticated();
      
      if (!authenticated) {
        setIsAuthenticated(false);
        router.push('/secure-admin/login');
        return;
      }
      
      // Check if user is actually an admin
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsAuthenticated(false);
        setAccessDenied(true);
        setDenialReason('No admin credentials found. Please login as an admin user first.');
        return;
      }
      
      // Verify admin status by trying to access admin endpoint
      // If loadData() succeeds, user is admin. If it fails with 403, they're not admin.
      setIsAuthenticated(true);
      loadData();
    };

    checkAuth();
  }, [router]);

  // Search filter functions
  const filterCompanies = (companies: CompanyData[], searchTerm: string, filter: string) => {
    if (!searchTerm.trim()) return companies;
    
    const term = searchTerm.toLowerCase();
    return companies.filter(company => {
      switch (filter) {
        case 'name':
          return company.name?.toLowerCase().includes(term);
        case 'email':
          return company.email?.toLowerCase().includes(term);
        case 'industry':
          return company.industry?.toLowerCase().includes(term);
        case 'all':
        default:
          return (
            company.name?.toLowerCase().includes(term) ||
            company.email?.toLowerCase().includes(term) ||
            company.industry?.toLowerCase().includes(term) ||
            company.businessRegistration?.toLowerCase().includes(term) ||
            company.contactPerson?.toLowerCase().includes(term)
          );
      }
    });
  };

  const filterUsers = (users: UserData[], searchTerm: string, filter: string) => {
    if (!searchTerm.trim()) return users;
    
    const term = searchTerm.toLowerCase();
    return users.filter(user => {
      switch (filter) {
        case 'name':
          return user.name?.toLowerCase().includes(term);
        case 'email':
          return user.email?.toLowerCase().includes(term);
        case 'all':
        default:
          return (
            user.name?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term) ||
            user.bio?.toLowerCase().includes(term) ||
            user.headline?.toLowerCase().includes(term)
          );
      }
    });
  };

  // Get filtered data
  const filteredPendingCompanies = filterCompanies(pendingCompanies, companySearchTerm, companySearchFilter);
  const filteredApprovedCompanies = filterCompanies(approvedCompanies, companySearchTerm, companySearchFilter);
  const filteredBlacklistedCompanies = filterCompanies(blacklistedCompanies, companySearchTerm, companySearchFilter);
  const filteredActiveUsers = filterUsers(activeUsers, userSearchTerm, userSearchFilter);
  const filteredBlacklistedUsers = filterUsers(blacklistedUsers, userSearchTerm, userSearchFilter);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading admin data...');
      
      // Get admin auth token - user must be logged in as admin
      const token = localStorage.getItem('authToken');
      if (!token) {
        setAccessDenied(true);
        setDenialReason('You must be logged in as an admin user to access this panel.');
        setLoading(false);
        return;
      }
      
      // Verify admin status with backend
      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/verify-admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!verifyResponse.ok) {
        setAccessDenied(true);
        setDenialReason('Access denied. You must be an admin user to access this panel.');
        setLoading(false);
        return;
      }
      
      console.log('Admin verification successful');
      
      // Load companies from admin API
      const companiesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        const allCompanies = companiesData.companies || [];
        console.log('Loaded companies:', allCompanies.length);
        
        const pending = allCompanies.filter((c: any) => c.status === 'pending' && !c.isBlacklisted);
        const approved = allCompanies.filter((c: any) => c.status === 'approved' && !c.isBlacklisted);
        const blacklisted = allCompanies.filter((c: any) => c.isBlacklisted);
        
        setPendingCompanies(pending.map((c: any) => ({
          ...c,
          isApproved: c.status === 'approved',
          isVerified: c.isVerified || false
        })));
        setApprovedCompanies(approved.map((c: any) => ({
          ...c,
          isApproved: c.status === 'approved',
          isVerified: c.isVerified || false
        })));
        setBlacklistedCompanies(blacklisted.map((c: any) => ({
          ...c,
          isApproved: c.status === 'approved',
          isVerified: c.isVerified || false
        })));
      }
      
      // Load users from existing API
      const allUsers = await fetchAllUsers();
      console.log('Loaded users:', Array.isArray(allUsers) ? allUsers.length : 'Invalid data');
      const usersArray = Array.isArray(allUsers) ? allUsers : [];
      setUsers(usersArray);
      
      // Separate active and blacklisted users
      const activeUsersFiltered = usersArray.filter((u: any) => !u.isBlacklisted);
      const blacklistedUsersFiltered = usersArray.filter((u: any) => u.isBlacklisted);
      setActiveUsers(activeUsersFiltered);
      setBlacklistedUsers(blacklistedUsersFiltered);
      
      // Load HR users
      const hrResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/hr-users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (hrResponse.ok) {
        const hrData = await hrResponse.json();
        setHrUsers(hrData.hrUsers || []);
        console.log('Loaded HR users:', hrData.hrUsers?.length || 0);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setLoading(false);
      alert('Failed to load admin data. Please try again.');
    }
  };

  const handleApprove = async (companyId: string, withVerification: boolean = false) => {
    try {
      console.log('Approving company:', companyId, 'with verification:', withVerification);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No admin token found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${companyId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: 'approved',
          adminNotes: withVerification ? 'Approved with verification badge' : 'Approved',
          isVerified: withVerification
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve company');
      }

      loadData();
    } catch (error) {
      console.error('Error approving company:', error);
      let errorMessage = 'Failed to approve company. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`Failed to approve company: ${errorMessage}`);
    }
  };

  const handleReject = async (companyId: string) => {
    if (confirm('Are you sure you want to reject this company? This action cannot be undone.')) {
      try {
        console.log('Rejecting company:', companyId);
        
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No admin token found');
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${companyId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            status: 'rejected',
            adminNotes: 'Company registration rejected'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to reject company');
        }

        loadData();
      } catch (error) {
        console.error('Error rejecting company:', error);
        let errorMessage = 'Failed to reject company. Please try again.';
        
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        alert(`Failed to reject company: ${errorMessage}`);
      }
    }
  };

  const handleVerify = async (companyId: string) => {
    if (confirm('Are you sure you want to grant verification to this company?')) {
      try {
        console.log('Verifying company:', companyId);
        
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No admin token found');
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${companyId}/verify`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            isVerified: true
          })
        });

        if (!response.ok) {
          throw new Error('Failed to verify company');
        }

        loadData();
      } catch (error) {
        console.error('Error verifying company:', error);
        let errorMessage = 'Failed to verify company. Please try again.';
        
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        alert(`Failed to verify company: ${errorMessage}`);
      }
    }
  };

  const handleRemoveVerification = async (companyId: string) => {
    if (confirm('Are you sure you want to remove verification from this company?')) {
      try {
        console.log('Removing verification from company:', companyId);
        
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No admin token found');
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${companyId}/verify`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            isVerified: false
          })
        });

        if (!response.ok) {
          throw new Error('Failed to remove verification');
        }

        loadData();
      } catch (error) {
        console.error('Error removing verification:', error);
        alert('Failed to remove verification. Please try again.');
      }
    }
  };

  const handleBlacklistCompany = async (companyId: string) => {
    const reason = prompt('Please provide a reason for blacklisting this company:');
    if (reason && confirm('Are you sure you want to blacklist this company? This action will remove verification and reject their status.')) {
      try {
        console.log('Blacklisting company:', companyId);
        
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No admin token found');
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${companyId}/blacklist`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            isBlacklisted: true,
            blacklistReason: reason
          })
        });

        if (!response.ok) {
          throw new Error('Failed to blacklist company');
        }

        loadData();
      } catch (error) {
        console.error('Error blacklisting company:', error);
        alert('Failed to blacklist company. Please try again.');
      }
    }
  };

  const handleUnblacklistCompany = async (companyId: string) => {
    if (confirm('Are you sure you want to remove this company from the blacklist?')) {
      try {
        console.log('Removing company from blacklist:', companyId);
        
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No admin token found');
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${companyId}/blacklist`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            isBlacklisted: false,
            blacklistReason: ''
          })
        });

        if (!response.ok) {
          throw new Error('Failed to remove from blacklist');
        }

        loadData();
      } catch (error) {
        console.error('Error removing from blacklist:', error);
        alert('Failed to remove from blacklist. Please try again.');
      }
    }
  };

  const handleUserVerify = async (userId: string) => {
    if (confirm('Are you sure you want to grant verification to this user?')) {
      try {
        console.log('Attempting to verify user with ID:', userId);
        await verifyUserInDB(userId, true);
        loadData();
      } catch (error) {
        console.error('Error verifying user:', error);
        console.error('Failed user ID:', userId);
        alert('Failed to verify user. Please try again.');
      }
    }
  };

  const handleUserUnverify = async (userId: string) => {
    if (confirm('Are you sure you want to remove verification from this user?')) {
      try {
        await verifyUserInDB(userId, false);
        loadData();
      } catch (error) {
        console.error('Error unverifying user:', error);
        alert('Failed to unverify user. Please try again.');
      }
    }
  };

  const handleBlacklistUser = async (userId: string) => {
    const reason = prompt('Please provide a reason for blacklisting this user:');
    if (reason && confirm('Are you sure you want to blacklist this user? This action will remove verification.')) {
      try {
        console.log('Blacklisting user:', userId);
        
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No admin token found');
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/blacklist`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            isBlacklisted: true,
            blacklistReason: reason
          })
        });

        if (!response.ok) {
          throw new Error('Failed to blacklist user');
        }

        loadData();
      } catch (error) {
        console.error('Error blacklisting user:', error);
        alert('Failed to blacklist user. Please try again.');
      }
    }
  };

  const handleUnblacklistUser = async (userId: string) => {
    if (confirm('Are you sure you want to remove this user from the blacklist?')) {
      try {
        console.log('Removing user from blacklist:', userId);
        
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No admin token found');
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/blacklist`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            isBlacklisted: false,
            blacklistReason: ''
          })
        });

        if (!response.ok) {
          throw new Error('Failed to remove from blacklist');
        }

        loadData();
      } catch (error) {
        console.error('Error removing from blacklist:', error);
        alert('Failed to remove from blacklist. Please try again.');
      }
    }
  };

  const handleMakeAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminEmail) {
      alert('Please enter an email address');
      return;
    }

    if (!confirm(`Are you sure you want to make ${adminEmail} an admin?`)) {
      return;
    }

    setMakingAdmin(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No admin token found');
      }

      // Find user by email and update their role
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/make-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: adminEmail
        })
      });

      if (response.ok) {
        alert('User has been promoted to admin successfully!');
        setAdminEmail('');
        loadData(); // Refresh user list
      } else {
        const data = await response.json();
        alert(data.message || data.error || 'Failed to make user admin');
      }
    } catch (error) {
      console.error('Error making admin:', error);
      alert('Failed to make user admin. Please try again.');
    } finally {
      setMakingAdmin(false);
    }
  };

  const handleMakeHr = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hrEmail) {
      alert('Please enter an email address');
      return;
    }

    if (!confirm(`Are you sure you want to make ${hrEmail} an HR?`)) {
      return;
    }

    setMakingHr(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No admin token found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/make-hr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: hrEmail
        })
      });

      if (response.ok) {
        alert('User has been promoted to HR successfully!');
        setHrEmail('');
        loadData(); // Refresh lists
      } else {
        const data = await response.json();
        alert(data.message || data.error || 'Failed to make user HR');
      }
    } catch (error) {
      console.error('Error making HR:', error);
      alert('Failed to make user HR. Please try again.');
    } finally {
      setMakingHr(false);
    }
  };

  const handleRemoveHr = async (email: string) => {
    if (!confirm(`Are you sure you want to remove HR role from ${email}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No admin token found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/remove-hr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email
        })
      });

      if (response.ok) {
        alert('HR role removed successfully!');
        loadData(); // Refresh lists
      } else {
        const data = await response.json();
        alert(data.message || data.error || 'Failed to remove HR role');
      }
    } catch (error) {
      console.error('Error removing HR:', error);
      alert('Failed to remove HR role. Please try again.');
    }
  };

  // Access Denied
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircleIcon className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-400 mb-6">
            {denialReason}
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500 p-2 rounded-lg">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Secure Admin Panel</h1>
                <p className="text-sm text-gray-400">Restricted access area</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/secure-admin')}
                className="text-gray-300 hover:text-white text-sm"
              >
                Home
              </button>
              <button
                onClick={() => router.push('/')}
                className="text-gray-300 hover:text-white text-sm"
              >
                Back to Site
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('secure_admin_passkey_session');
                  router.push('/secure-admin/login');
                }}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-400">Manage companies and user verifications</p>
            </div>
            <button
              onClick={loadData}
              className="flex items-center space-x-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Main Tabs */}
          <div className="bg-gray-700 rounded-lg mb-6">
            <div className="border-b border-gray-600">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('companies')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'companies'
                      ? 'border-green-500 text-green-500'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <BuildingOfficeIcon className="w-5 h-5" />
                    <span>Companies</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'users'
                      ? 'border-green-500 text-green-500'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="w-5 h-5" />
                    <span>Users ({users.length})</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('make-admin')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'make-admin'
                      ? 'border-green-500 text-green-500'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <ShieldCheckIcon className="w-5 h-5" />
                    <span>Make Admin</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('hr-management')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'hr-management'
                      ? 'border-green-500 text-green-500'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="w-5 h-5" />
                    <span>HR Management ({hrUsers.length})</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Companies Tab Content */}
            {activeTab === 'companies' && (
              <div>
                {/* Company Sub-tabs */}
                <div className="border-b border-gray-600">
                  <nav className="flex space-x-8 px-6">
                    <button
                      onClick={() => setCompanySubTab('pending')}
                      className={`py-3 px-1 border-b-2 font-medium text-sm ${
                        companySubTab === 'pending'
                          ? 'border-green-500 text-green-500'
                          : 'border-transparent text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Pending Approval ({filteredPendingCompanies.length})
                    </button>
                    <button
                      onClick={() => setCompanySubTab('approved')}
                      className={`py-3 px-1 border-b-2 font-medium text-sm ${
                        companySubTab === 'approved'
                          ? 'border-green-500 text-green-500'
                          : 'border-transparent text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Approved ({filteredApprovedCompanies.length})
                    </button>
                    <button
                      onClick={() => setCompanySubTab('blacklisted')}
                      className={`py-3 px-1 border-b-2 font-medium text-sm ${
                        companySubTab === 'blacklisted'
                          ? 'border-red-500 text-red-500'
                          : 'border-transparent text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Blacklisted ({filteredBlacklistedCompanies.length})
                    </button>
                  </nav>
                </div>

                {/* Company Search */}
                <div className="bg-gray-700 p-4 border-b border-gray-600">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search companies..."
                        value={companySearchTerm}
                        onChange={(e) => setCompanySearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={companySearchFilter}
                      onChange={(e) => setCompanySearchFilter(e.target.value as 'all' | 'name' | 'email' | 'industry')}
                      className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Fields</option>
                      <option value="name">Company Name</option>
                      <option value="email">Email</option>
                      <option value="industry">Industry</option>
                    </select>
                    {companySearchTerm && (
                      <button
                        onClick={() => setCompanySearchTerm('')}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {companySearchTerm && (
                    <div className="mt-2 text-sm text-gray-400">
                      Showing results for "{companySearchTerm}" in {companySearchFilter === 'all' ? 'all fields' : companySearchFilter}
                    </div>
                  )}
                </div>

                {/* Pending Companies */}
                {companySubTab === 'pending' && (
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-white">Pending Company Approvals</h2>
                      <div className="text-sm text-gray-400">
                        {companySearchTerm ? `${filteredPendingCompanies.length} of ${pendingCompanies.length}` : filteredPendingCompanies.length} companies
                      </div>
                    </div>
                    {filteredPendingCompanies.length === 0 ? (
                      <div className="text-center py-8">
                        <BuildingOfficeIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-500">
                          {companySearchTerm ? 'No companies found matching your search' : 'No pending company approvals'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredPendingCompanies.map((company) => (
                          <div key={company.id} className="bg-gray-600 rounded-lg p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-white">{company.name}</h3>
                                <p className="text-sm text-gray-400">{company.email}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Registered: {new Date(company.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <VerificationBadge isVerified={company.isVerified} />
                            </div>
                            
                            {/* Company Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              <div className="bg-gray-700 rounded p-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Industry</p>
                                <p className="text-sm text-white font-medium">{company.industry}</p>
                              </div>
                              
                              <div className="bg-gray-700 rounded p-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Size</p>
                                <p className="text-sm text-white font-medium">{company.size || 'Not specified'}</p>
                              </div>
                              
                              <div className="bg-gray-700 rounded p-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Headquarters</p>
                                <p className="text-sm text-white font-medium">{company.headquarters || 'Not specified'}</p>
                              </div>
                              
                              <div className="bg-gray-700 rounded p-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Founded</p>
                                <p className="text-sm text-white font-medium">{company.founded || 'Not specified'}</p>
                              </div>
                              
                              <div className="bg-gray-700 rounded p-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Business Registration</p>
                                <p className="text-sm text-white font-medium">{company.businessRegistration || 'Not provided'}</p>
                              </div>
                              
                              <div className="bg-gray-700 rounded p-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Contact Person</p>
                                <p className="text-sm text-white font-medium">{company.contactPerson || 'Not specified'}</p>
                              </div>
                            </div>
                            
                            {/* Website and Phone */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              {company.website && (
                                <div className="bg-gray-700 rounded p-3">
                                  <p className="text-xs text-gray-400 uppercase tracking-wide">Website</p>
                                  <a 
                                    href={company.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                                  >
                                    {company.website}
                                  </a>
                                </div>
                              )}
                              
                              {company.contactPhone && (
                                <div className="bg-gray-700 rounded p-3">
                                  <p className="text-xs text-gray-400 uppercase tracking-wide">Contact Phone</p>
                                  <p className="text-sm text-white font-medium">{company.contactPhone}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Company Description */}
                            {company.description && (
                              <div className="bg-gray-700 rounded p-3 mb-4">
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Company Description</p>
                                <p className="text-sm text-gray-300 leading-relaxed">{company.description}</p>
                              </div>
                            )}
                            
                            {/* Tax ID if provided */}
                            {company.taxId && (
                              <div className="bg-gray-700 rounded p-3 mb-4">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Tax ID</p>
                                <p className="text-sm text-white font-medium">{company.taxId}</p>
                              </div>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApprove(company.id)}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center"
                              >
                                <CheckCircleIcon className="w-4 h-4 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleApprove(company.id, true)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center"
                              >
                                <StarIcon className="w-4 h-4 mr-1" />
                                Approve & Verify
                              </button>
                              <button
                                onClick={() => handleReject(company.id)}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center"
                              >
                                <XCircleIcon className="w-4 h-4 mr-1" />
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Approved Companies */}
                {companySubTab === 'approved' && (
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-white">Approved Companies</h2>
                      <div className="text-sm text-gray-400">
                        {companySearchTerm ? `${filteredApprovedCompanies.length} of ${approvedCompanies.length}` : filteredApprovedCompanies.length} companies
                      </div>
                    </div>
                    {filteredApprovedCompanies.length === 0 ? (
                      <div className="text-center py-8">
                        <BuildingOfficeIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-500">
                          {companySearchTerm ? 'No companies found matching your search' : 'No approved companies'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredApprovedCompanies.map((company) => (
                          <div key={company.id} className="bg-gray-600 rounded-lg p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-white">{company.name}</h3>
                                <p className="text-sm text-gray-400">{company.email}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Approved: {company.approvedAt ? new Date(company.approvedAt).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                              <VerificationBadge isVerified={company.isVerified} />
                            </div>
                            
                            {/* Company Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              <div className="bg-gray-700 rounded p-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Industry</p>
                                <p className="text-sm text-white font-medium">{company.industry}</p>
                              </div>
                              
                              <div className="bg-gray-700 rounded p-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Size</p>
                                <p className="text-sm text-white font-medium">{company.size || 'Not specified'}</p>
                              </div>
                              
                              <div className="bg-gray-700 rounded p-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Headquarters</p>
                                <p className="text-sm text-white font-medium">{company.headquarters || 'Not specified'}</p>
                              </div>
                              
                              <div className="bg-gray-700 rounded p-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Founded</p>
                                <p className="text-sm text-white font-medium">{company.founded || 'Not specified'}</p>
                              </div>
                              
                              <div className="bg-gray-700 rounded p-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Business Registration</p>
                                <p className="text-sm text-white font-medium">{company.businessRegistration || 'Not provided'}</p>
                              </div>
                              
                              <div className="bg-gray-700 rounded p-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Contact Person</p>
                                <p className="text-sm text-white font-medium">{company.contactPerson || 'Not specified'}</p>
                              </div>
                            </div>
                            
                            {/* Website and Phone */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              {company.website && (
                                <div className="bg-gray-700 rounded p-3">
                                  <p className="text-xs text-gray-400 uppercase tracking-wide">Website</p>
                                  <a 
                                    href={company.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                                  >
                                    {company.website}
                                  </a>
                                </div>
                              )}
                              
                              {company.contactPhone && (
                                <div className="bg-gray-700 rounded p-3">
                                  <p className="text-xs text-gray-400 uppercase tracking-wide">Contact Phone</p>
                                  <p className="text-sm text-white font-medium">{company.contactPhone}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Company Description */}
                            {company.description && (
                              <div className="bg-gray-700 rounded p-3 mb-4">
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Company Description</p>
                                <p className="text-sm text-gray-300 leading-relaxed">{company.description}</p>
                              </div>
                            )}
                            
                            {/* Admin Notes if any */}
                            {company.adminNotes && (
                              <div className="bg-blue-900/20 border border-blue-700 rounded p-3 mb-4">
                                <p className="text-xs text-blue-400 uppercase tracking-wide mb-2">Admin Notes</p>
                                <p className="text-sm text-blue-300">{company.adminNotes}</p>
                              </div>
                            )}
                            
                            {/* Verification Actions */}
                            <div className="flex space-x-2">
                              {!company.isVerified ? (
                                <button
                                  onClick={() => handleVerify(company.id)}
                                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center"
                                >
                                  <StarIcon className="w-4 h-4 mr-1" />
                                  Grant Verification Badge
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleRemoveVerification(company.id)}
                                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center"
                                >
                                  <XCircleIcon className="w-4 h-4 mr-1" />
                                  Remove Verification
                                </button>
                              )}
                              <button
                                onClick={() => handleBlacklistCompany(company.id)}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center"
                              >
                                <XCircleIcon className="w-4 h-4 mr-1" />
                                Blacklist Company
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Blacklisted Companies */}
                {companySubTab === 'blacklisted' && (
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-white">Blacklisted Companies</h2>
                      <div className="text-sm text-gray-400">
                        {companySearchTerm ? `${filteredBlacklistedCompanies.length} of ${blacklistedCompanies.length}` : filteredBlacklistedCompanies.length} companies
                      </div>
                    </div>
                    {filteredBlacklistedCompanies.length === 0 ? (
                      <div className="text-center py-8">
                        <BuildingOfficeIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-500">
                          {companySearchTerm ? 'No companies found matching your search' : 'No blacklisted companies'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredBlacklistedCompanies.map((company) => (
                          <div key={company.id} className="bg-red-900/20 border border-red-700 rounded-lg p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-white">{company.name}</h3>
                                <p className="text-sm text-gray-400">{company.email}</p>
                                <p className="text-xs text-red-400 mt-1">
                                  Blacklisted: {company.blacklistedAt ? new Date(company.blacklistedAt).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                              <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                                BLACKLISTED
                              </div>
                            </div>
                            
                            {/* Blacklist Reason */}
                            {company.blacklistReason && (
                              <div className="bg-red-900/30 border border-red-700 rounded p-3 mb-4">
                                <p className="text-xs text-red-400 uppercase tracking-wide mb-2">Blacklist Reason</p>
                                <p className="text-sm text-red-300">{company.blacklistReason}</p>
                              </div>
                            )}
                            
                            {/* Company Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              <div className="bg-gray-700 rounded p-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Industry</p>
                                <p className="text-sm text-white font-medium">{company.industry}</p>
                              </div>
                              
                              <div className="bg-gray-700 rounded p-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Size</p>
                                <p className="text-sm text-white font-medium">{company.size || 'Not specified'}</p>
                              </div>
                              
                              <div className="bg-gray-700 rounded p-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Headquarters</p>
                                <p className="text-sm text-white font-medium">{company.headquarters || 'Not specified'}</p>
                              </div>
                            </div>
                            
                            {/* Unblacklist Action */}
                            <button
                              onClick={() => handleUnblacklistCompany(company.id)}
                              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center"
                            >
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              Remove from Blacklist
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Users Tab Content */}
            {activeTab === 'users' && (
              <div>
                {/* User Sub-tabs */}
                <div className="border-b border-gray-600">
                  <nav className="flex space-x-8 px-6">
                    <button
                      onClick={() => setUserSubTab('active')}
                      className={`py-3 px-1 border-b-2 font-medium text-sm ${
                        userSubTab === 'active'
                          ? 'border-green-500 text-green-500'
                          : 'border-transparent text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Active Users ({filteredActiveUsers.length})
                    </button>
                    <button
                      onClick={() => setUserSubTab('blacklisted')}
                      className={`py-3 px-1 border-b-2 font-medium text-sm ${
                        userSubTab === 'blacklisted'
                          ? 'border-red-500 text-red-500'
                          : 'border-transparent text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Blacklisted Users ({filteredBlacklistedUsers.length})
                    </button>
                  </nav>
                </div>

                {/* User Search */}
                <div className="bg-gray-700 p-4 border-b border-gray-600">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={userSearchFilter}
                      onChange={(e) => setUserSearchFilter(e.target.value as 'all' | 'name' | 'email')}
                      className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Fields</option>
                      <option value="name">Name</option>
                      <option value="email">Email</option>
                    </select>
                    {userSearchTerm && (
                      <button
                        onClick={() => setUserSearchTerm('')}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {userSearchTerm && (
                    <div className="mt-2 text-sm text-gray-400">
                      Showing results for "{userSearchTerm}" in {userSearchFilter === 'all' ? 'all fields' : userSearchFilter}
                    </div>
                  )}
                </div>

                {/* Active Users */}
                {userSubTab === 'active' && (
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-white">Active Users</h2>
                      <div className="text-sm text-gray-400">
                        {userSearchTerm ? `${filteredActiveUsers.length} of ${activeUsers.length}` : filteredActiveUsers.length} users
                      </div>
                    </div>
                    {filteredActiveUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <UsersIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-500">
                          {userSearchTerm ? 'No users found matching your search' : 'No active users found'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredActiveUsers.map((user) => (
                          <div key={user.id} className="bg-gray-600 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-medium text-white">{user.name}</h3>
                                <p className="text-sm text-gray-400">{user.email}</p>
                              </div>
                              {user.isVerified && <VerificationBadge isVerified={true} />}
                            </div>
                            <div className="flex space-x-2">
                              {!user.isVerified ? (
                                <button
                                  onClick={() => handleUserVerify(user.id)}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center"
                                >
                                  <StarIcon className="w-4 h-4 mr-1" />
                                  Verify User
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserUnverify(user.id)}
                                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center"
                                >
                                  <XCircleIcon className="w-4 h-4 mr-1" />
                                  Remove Verification
                                </button>
                              )}
                              <button
                                onClick={() => handleBlacklistUser(user.id)}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center"
                              >
                                <XCircleIcon className="w-4 h-4 mr-1" />
                                Blacklist User
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Blacklisted Users */}
                {userSubTab === 'blacklisted' && (
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-white">Blacklisted Users</h2>
                      <div className="text-sm text-gray-400">
                        {userSearchTerm ? `${filteredBlacklistedUsers.length} of ${blacklistedUsers.length}` : filteredBlacklistedUsers.length} users
                      </div>
                    </div>
                    {filteredBlacklistedUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <UsersIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-500">
                          {userSearchTerm ? 'No users found matching your search' : 'No blacklisted users'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredBlacklistedUsers.map((user) => (
                          <div key={user.id} className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-medium text-white">{user.name}</h3>
                                <p className="text-sm text-gray-400">{user.email}</p>
                                <p className="text-xs text-red-400 mt-1">
                                  Blacklisted: {user.blacklistedAt ? new Date(user.blacklistedAt).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                              <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                                BLACKLISTED
                              </div>
                            </div>
                            
                            {/* Blacklist Reason */}
                            {user.blacklistReason && (
                              <div className="bg-red-900/30 border border-red-700 rounded p-3 mb-3">
                                <p className="text-xs text-red-400 uppercase tracking-wide mb-1">Blacklist Reason</p>
                                <p className="text-sm text-red-300">{user.blacklistReason}</p>
                              </div>
                            )}
                            
                            <button
                              onClick={() => handleUnblacklistUser(user.id)}
                              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center"
                            >
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              Remove from Blacklist
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Make Admin Tab Content */}
            {activeTab === 'make-admin' && (
              <div className="p-6">
                <div className="max-w-2xl mx-auto">
                  <div className="bg-gray-700 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <ShieldCheckIcon className="w-8 h-8 text-green-500" />
                      <div>
                        <h2 className="text-xl font-semibold text-white">Make User Admin</h2>
                        <p className="text-sm text-gray-400">Promote an existing user to administrator</p>
                      </div>
                    </div>

                    <form onSubmit={handleMakeAdmin} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          User Email Address *
                        </label>
                        <input
                          type="email"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="user@example.com"
                          required
                        />
                        <p className="text-xs text-gray-400 mt-1">Enter the email of an existing user to promote them to admin</p>
                      </div>

                      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                        <p className="text-sm text-blue-300">
                          <strong>Note:</strong> This will promote the user to admin with privileges to:
                        </p>
                        <ul className="text-sm text-blue-300 mt-2 ml-4 list-disc space-y-1">
                          <li>Approve/reject companies</li>
                          <li>Verify users</li>
                          <li>Access all admin endpoints</li>
                          <li>Manage platform data</li>
                        </ul>
                      </div>

                      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                        <p className="text-sm text-yellow-300">
                          <strong>⚠️ Important:</strong> The user must already be registered in the system. If the email doesn't exist, the operation will fail.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={makingAdmin}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {makingAdmin ? (
                          <>
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            Promoting to Admin...
                          </>
                        ) : (
                          <>
                            <ShieldCheckIcon className="w-5 h-5" />
                            Make Admin
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* HR Management Tab Content */}
            {activeTab === 'hr-management' && (
              <div className="p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                  {/* Add HR Section */}
                  <div className="bg-gray-700 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <UsersIcon className="w-8 h-8 text-green-500" />
                      <div>
                        <h2 className="text-xl font-semibold text-white">Make User HR</h2>
                        <p className="text-sm text-gray-400">Promote an existing user to HR role</p>
                      </div>
                    </div>

                    <form onSubmit={handleMakeHr} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          User Email Address *
                        </label>
                        <input
                          type="email"
                          value={hrEmail}
                          onChange={(e) => setHrEmail(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="user@example.com"
                          required
                        />
                        <p className="text-xs text-gray-400 mt-1">Enter the email of an existing user to promote them to HR</p>
                      </div>

                      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                        <p className="text-sm text-blue-300">
                          <strong>Note:</strong> HR users will have access to:
                        </p>
                        <ul className="text-sm text-blue-300 mt-2 ml-4 list-disc space-y-1">
                          <li>View all completed interviews</li>
                          <li>Review candidate AI interviews</li>
                          <li>Shortlist or reject candidates</li>
                          <li>Schedule HR interviews with meeting links</li>
                        </ul>
                      </div>

                      <button
                        type="submit"
                        disabled={makingHr}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {makingHr ? (
                          <>
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            Promoting to HR...
                          </>
                        ) : (
                          <>
                            <UsersIcon className="w-5 h-5" />
                            Make HR
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Current HR Users List */}
                  <div className="bg-gray-700 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Current HR Users ({hrUsers.length})</h2>
                    
                    {hrUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <UsersIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400">No HR users yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {hrUsers.map((hr) => (
                          <div key={hr._id} className="bg-gray-600 rounded-lg p-4 flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-white">{hr.name}</h3>
                              <p className="text-sm text-gray-400">{hr.email}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Added: {new Date(hr.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveHr(hr.email)}
                              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm transition-colors"
                            >
                              Remove HR
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}