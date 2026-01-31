"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BellIcon, 
  ChatBubbleLeftRightIcon,
  HomeIcon, 
  BriefcaseIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  MicrophoneIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import ProfileDropdown from './ProfileDropdown';
import MobileSearchOverlay from './MobileSearchOverlay';
import SearchSuggestions from './SearchSuggestions';
import { Button } from './ui/button';
import { useAuth } from '@/context/AuthContext';
import CenopieLogo from './CenopieLogo';
import { useSearch } from '@/hooks/useSearch';
import { useSocket } from '@/hooks/useSocket';

// Bottom navigation items for mobile - exactly 4 items (removed chats)
const bottomNav = [
  { href: '/feed', label: 'Feed', icon: HomeIcon, disabled: false },
  { href: '/notifications', label: 'Updates', icon: BellIcon, disabled: false },
  { href: '/jobs', label: 'Jobs', icon: BriefcaseIcon, disabled: false },
  { href: '/interviews', label: 'Interviews', icon: MicrophoneIcon, disabled: false },
];

// All navigation items for desktop
const allNav = [
  { href: '/feed', label: 'Feed', icon: HomeIcon, disabled: false },
  { href: '/jobs', label: 'Jobs', icon: BriefcaseIcon, disabled: false },
  { href: '/interviews', label: 'Interviews', icon: MicrophoneIcon, disabled: false },
  { href: '/showcase', label: 'Showcase', icon: SparklesIcon, disabled: false },
  { href: '/notifications', label: 'Updates', icon: BellIcon, disabled: false },
  { href: '/chats', label: 'Chats', icon: ChatBubbleLeftRightIcon, disabled: false },
];

export default function Navbar() {
  // All hooks must be called at the top level, before any conditional returns
  const pathname = usePathname();
  const router = useRouter();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  
  // Call hooks unconditionally
  const authContext = useAuth();
  const searchHook = useSearch();
  const { socket } = useSocket();
  
  // Extract values safely
  const isAuthenticated = authContext?.isAuthenticated || false;
  const { results, loading, search, clearResults } = searchHook;


  
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Check for company authentication
  const [isCompanyAuthenticated, setIsCompanyAuthenticated] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);

  // Check company authentication
  useEffect(() => {
    const checkCompanyAuth = () => {
      if (typeof window === 'undefined') return;
      
      try {
        const companyToken = localStorage.getItem('companyAuthToken');
        const currentCompany = localStorage.getItem('currentCompany');
        
        if (companyToken && currentCompany) {
          setIsCompanyAuthenticated(true);
          try {
            setCompanyData(JSON.parse(currentCompany));
          } catch (error) {
            console.error('Error parsing company data:', error);
            setCompanyData(null);
          }
        } else {
          setIsCompanyAuthenticated(false);
          setCompanyData(null);
        }
      } catch (error) {
        console.error('Error checking company auth:', error);
        setIsCompanyAuthenticated(false);
        setCompanyData(null);
      }
    };

    checkCompanyAuth();
    
    // Listen for storage changes (from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'companyAuthToken' || e.key === 'currentCompany') {
        checkCompanyAuth();
      }
    };
    
    // Listen for custom company auth changes (from same tab)
    const handleCompanyAuthChange = () => {
      checkCompanyAuth();
    };
    
    // Set up event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('companyAuthChange', handleCompanyAuthChange);
      window.addEventListener('companyLogin', handleCompanyAuthChange);
      window.addEventListener('companyLogout', handleCompanyAuthChange);
    }
    
    // Cleanup function
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('companyAuthChange', handleCompanyAuthChange);
        window.removeEventListener('companyLogin', handleCompanyAuthChange);
        window.removeEventListener('companyLogout', handleCompanyAuthChange);
      }
    };
  }, []);

  // Polling mechanism for company auth (separate useEffect to avoid dependency issues)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (typeof window === 'undefined') return;
      
      try {
        const currentToken = localStorage.getItem('companyAuthToken');
        const currentCompany = localStorage.getItem('currentCompany');
        const hasAuth = !!(currentToken && currentCompany);
        
        if (hasAuth !== isCompanyAuthenticated) {
          // Trigger a re-check by dispatching an event
          window.dispatchEvent(new CustomEvent('companyAuthChange'));
        }
      } catch (error) {
        console.error('Error in polling:', error);
      }
    }, 1000); // Check every second
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [isCompanyAuthenticated]);

  // Fetch unread notification count
  const fetchUnreadNotificationCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.cenopie.com'}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const notifications = await response.json();
        const unreadCount = notifications.filter((n: any) => !n.read).length;
        setUnreadNotificationCount(unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  }, [isAuthenticated]);

  // Fetch unread chat count
  const fetchUnreadChatCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.cenopie.com'}/api/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const totalUnreadCount = data.chats?.reduce((total: number, chat: any) => {
          return total + (chat.unreadCount || 0);
        }, 0) || 0;
        setUnreadChatCount(totalUnreadCount);
      }
    } catch (error) {
      console.error('Error fetching chat count:', error);
    }
  }, [isAuthenticated]);

  // Fetch notification count on mount and periodically
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadNotificationCount();
      fetchUnreadChatCount();
      
      // Refresh counts every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadNotificationCount();
        fetchUnreadChatCount();
      }, 30000);
      
      // Listen for notification updates
      const handleNotificationUpdate = () => {
        fetchUnreadNotificationCount();
      };
      
      // Listen for chat updates
      const handleChatUpdate = () => {
        fetchUnreadChatCount();
      };
      
      window.addEventListener('notificationUpdate', handleNotificationUpdate);
      window.addEventListener('chatUpdate', handleChatUpdate);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('notificationUpdate', handleNotificationUpdate);
        window.removeEventListener('chatUpdate', handleChatUpdate);
      };
    }
  }, [isAuthenticated, fetchUnreadNotificationCount, fetchUnreadChatCount]);

  // Socket listeners for real-time chat updates
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleNewMessage = (data: any) => {
      // Update chat count when new message arrives
      fetchUnreadChatCount();
    };

    const handleMessageRead = (data: any) => {
      // Update chat count when messages are read
      fetchUnreadChatCount();
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessageRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessageRead);
    };
  }, [socket, isAuthenticated, fetchUnreadChatCount]);

  // Handle search as user types (with debounce)
  useEffect(() => {
    if (searchQuery.trim() === '') {
      clearResults();
      return;
    }

    // Only search if user is authenticated
    if (!isAuthenticated) {
      clearResults();
      return;
    }

    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim() !== '') {
        search(searchQuery.trim());
      }
    }, 300);

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [searchQuery, search, clearResults, isAuthenticated]);

  // Handle click outside to close search suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    if (isSearchFocused) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchFocused]);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchFocused(false);
      clearResults();
    }
  };

  // Handle selecting a search suggestion
  const handleSelectSuggestion = (result: any) => {
    if (result.type === 'user') {
      router.push(`/profile/${result.id}`);
    } else if (result.type === 'company') {
      router.push(`/companies/${result.id}`);
    }
    setSearchQuery('');
    setIsSearchFocused(false);
    clearResults();
  };

  // Handle "View all results" click
  const handleSearchAll = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setSearchQuery('');
    setIsSearchFocused(false);
    clearResults();
  };

  // Handle Escape key to close search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchFocused(false);
      }
    };

    if (isSearchFocused) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchFocused]);

  // If company is authenticated, show company-specific navbar
  if (isCompanyAuthenticated) {
    const handleCompanyLogout = () => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('companyAuthToken');
          localStorage.removeItem('currentCompany');
          
          // Dispatch custom events to notify of auth change
          window.dispatchEvent(new CustomEvent('companyAuthChange'));
          window.dispatchEvent(new CustomEvent('companyLogout'));
        }
        setIsCompanyAuthenticated(false);
        setCompanyData(null);
        router.push('/');
      } catch (error) {
        console.error('Error during company logout:', error);
        router.push('/');
      }
    };

    return (
      <header className="sticky top-0 z-30 border-b bg-white/70 backdrop-blur dark:bg-black/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-4 xl:px-8 h-14 sm:h-16">
          {/* Logo - Desktop Only */}
          <Link href="/company/dashboard" className="hidden md:flex items-center shrink-0">
            <CenopieLogo />
          </Link>
          
          {/* Mobile Company Title */}
          <div className="flex md:hidden items-center">
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">
              <span className="text-gray-800 dark:text-white">ceno</span>
              <span className="text-[#0BC0DF]">pie</span>
              <span className="ml-2 text-sm text-gray-600">Company</span>
            </h1>
          </div>
          
          {/* Company Info & Logout */}
          <div className="flex items-center gap-3">
            {companyData && (
              <div className="hidden sm:flex items-center text-sm text-gray-600">
                <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                <span>{companyData.name}</span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCompanyLogout}
              className="text-gray-600 hover:text-gray-800"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>
    );
  }

  // If user is not authenticated, show simplified navbar with buttons on the right
  if (!isAuthenticated) {
    return (
      <header className="sticky top-0 z-30 border-b bg-white/70 backdrop-blur dark:bg-black/50">
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-4 px-3 sm:px-4 xl:px-8 h-14 sm:h-16">
          {/* Logo - Mobile and Desktop */}
          <Link href="/" className="flex items-center shrink-0">
            <CenopieLogo />
          </Link>
          
          {/* Right Section with Login/Signup Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* User Auth Buttons */}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/signup">Sign up</Link>
            </Button>
            
            {/* Company Auth Buttons */}
            <div className="hidden md:flex items-center border-l border-gray-200 dark:border-gray-700 pl-3 ml-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Companies:</span>
              <Button variant="outline" size="sm" asChild className="mr-1">
                <Link href="/company/auth/login">Login</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/company/auth/register">Register</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b bg-white/70 backdrop-blur dark:bg-black/50">
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-4 px-3 sm:px-4 xl:px-8 h-14 sm:h-16">
          {/* Logo - Desktop Only */}
          <Link href="/feed" className="hidden md:flex items-center shrink-0">
            <CenopieLogo />
          </Link>
          
          {/* Mobile Search Bar - Replaces Logo */}
          <div 
            ref={searchContainerRef}
            className="relative md:hidden flex-1 max-w-none mr-2"
          >
            <form onSubmit={handleSearch}>
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-9 pr-3 py-2 rounded-full bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0BC0DF] text-sm border-0" 
                placeholder="Search users, jobs, companies..." 
              />
            </form>
            {isSearchFocused && (
              <SearchSuggestions
                results={results}
                loading={loading}
                onSelect={handleSelectSuggestion}
                onSearchAll={handleSearchAll}
                query={searchQuery}
              />
            )}
          </div>
          
          {/* Search Bar - Desktop Only */}
          <div 
            ref={searchContainerRef}
            className="relative hidden md:block flex-1 max-w-sm ml-4"
          >
            <form onSubmit={handleSearch}>
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 focus:outline-none text-sm border-0" 
                placeholder="Search users, companies..." 
              />
            </form>
            {isSearchFocused && (
              <SearchSuggestions
                results={results}
                loading={loading}
                onSelect={handleSelectSuggestion}
                onSearchAll={handleSearchAll}
                query={searchQuery}
              />
            )}
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 ml-auto">
            {allNav.map((n) => (
              n.disabled ? (
                <div 
                  key={n.href} 
                  className="flex items-center gap-1 px-2 xl:px-3 py-1.5 rounded-full text-gray-400 cursor-not-allowed opacity-60"
                >
                  <n.icon className="w-4 h-4" />
                  <span className="text-sm">{n.label}</span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-1.5 py-0.5 rounded ml-1">Coming Soon</span>
                </div>
              ) : (
                <Link 
                  key={n.href} 
                  href={n.href as any} 
                  className={`flex items-center gap-1 px-2 xl:px-3 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${pathname===n.href ? 'text-brand' : ''}`}
                >
                  <div className="relative">
                    <n.icon className="w-4 h-4" />
                    {(n.href === '/interviews' || n.href === '/showcase') && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className="text-sm">{n.label}</span>
                  {n.href === '/notifications' && unreadNotificationCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                  {n.href === '/chats' && unreadChatCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
                      {unreadChatCount > 9 ? '9+' : unreadChatCount}
                    </span>
                  )}
                </Link>
              )
            ))}
          </nav>
          
          {/* Right Section - Desktop and Tablet */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3 lg:ml-0 ml-auto">
            {/* Profile Dropdown */}
            <ProfileDropdown />
          </div>

          {/* Mobile Right Section - Profile and Chats */}
          <div className="flex md:hidden items-center gap-2">
            {/* Chats Button - Mobile Only */}
            <Link 
              href="/chats"
              className={`relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
                pathname === '/chats' ? 'text-brand' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-blue-500 rounded-full">
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </span>
              )}
            </Link>
            
            {/* Profile Dropdown */}
            <ProfileDropdown />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - 4 Items */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t dark:bg-black/95 dark:border-gray-800">
        <nav className="bottom-nav-4-items px-1 py-2 safe-area-pb">
            {bottomNav.map((n) => (
              n.disabled ? (
                <div 
                  key={n.href} 
                  className="bottom-nav-item text-gray-400 cursor-not-allowed opacity-60"
                >
                  <div className="relative mb-1">
                    <n.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs truncate text-center">{n.label}</span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-1 py-0.5 rounded text-center mt-0.5">Soon</span>
                </div>
              ) : (
                <Link 
                  key={n.href} 
                  href={n.href as any} 
                  className={`bottom-nav-item rounded-lg transition-colors ${
                    pathname === n.href ? 'text-brand' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <div className="relative mb-1">
                    <n.icon className="w-5 h-5" />
                    {(n.href === '/interviews' || n.href === '/showcase') && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    )}
                    {n.href === '/notifications' && unreadNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-blue-500 rounded-full">
                        {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                      </span>
                    )}
                    {n.href === '/chats' && unreadChatCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-blue-500 rounded-full">
                        {unreadChatCount > 9 ? '9+' : unreadChatCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs truncate text-center">{n.label}</span>
                </Link>
              )
            ))}
        </nav>
      </div>

      {/* Mobile Search Overlay */}
      <MobileSearchOverlay 
        isOpen={mobileSearchOpen} 
        onClose={() => setMobileSearchOpen(false)} 
      />
    </>
  );
}