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
  
  // Show the professional footer on the landing page
  if (pathname === '/landing') {
    return <LandingFooter />;
  }
  
  // Show the global footer on all other pages
  return <Footer />;
}