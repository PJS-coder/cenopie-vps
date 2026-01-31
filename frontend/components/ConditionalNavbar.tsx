"use client";
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Hide navbar during interview sessions for security
  const hideNavbarPaths = [
    '/interviews/[id]/start', // Interview start page
  ];
  
  // Check if current path matches any hide patterns
  const shouldHideNavbar = hideNavbarPaths.some(path => {
    if (path.includes('[id]')) {
      // Handle dynamic routes like /interviews/[id]/start
      const pattern = path.replace('[id]', '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname);
    }
    return pathname === path;
  });
  
  // Also hide navbar if path contains /interviews/ and /start
  const isInterviewStartPage = pathname.includes('/interviews/') && pathname.includes('/start');
  
  if (shouldHideNavbar || isInterviewStartPage) {
    return null; // Don't render navbar during interviews
  }
  
  // Show navbar on all pages including chat pages
  return <Navbar />;
}