"use client";
import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';
import LandingFooter from '@/components/LandingFooter';

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer on messages page and any message-related routes
  if (pathname === '/messages' || pathname.startsWith('/messages/')) {
    return null;
  }
  
  // Hide footer during interview sessions for security and focus
  const isInterviewStartPage = pathname.includes('/interviews/') && pathname.includes('/start');
  if (isInterviewStartPage) {
    return null;
  }
  
  // Show the professional footer on the landing page
  if (pathname === '/landing') {
    return <LandingFooter />;
  }
  
  // Show the global footer on all other pages
  return <Footer />;
}