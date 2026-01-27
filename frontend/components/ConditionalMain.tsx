"use client";
import { usePathname } from 'next/navigation';

export default function ConditionalMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Add landing-main class for landing page to exclude mobile nav spacing
  const isLandingPage = pathname === '/landing';
  const isMessagesPage = pathname === '/messages' || pathname.startsWith('/messages/');
  const isFeedPage = pathname === '/feed' || pathname.startsWith('/feed/');
  
  // Pages that use fixed layout (no normal scrolling)
  const isFixedLayoutPage = isMessagesPage || isFeedPage;
  
  return (
    <main className={`flex-grow ${isLandingPage ? 'landing-main' : ''} ${!isFixedLayoutPage ? 'normal-page' : ''}`}>
      {children}
    </main>
  );
}