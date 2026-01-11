"use client";
import { usePathname } from 'next/navigation';

export default function ConditionalMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Add landing-main class for landing page to exclude mobile nav spacing
  const isLandingPage = pathname === '/landing';
  
  return (
    <main className={`flex-grow ${isLandingPage ? 'landing-main' : ''}`}>
      {children}
    </main>
  );
}