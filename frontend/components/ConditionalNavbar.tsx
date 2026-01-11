"use client";
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Show navbar on all pages including landing page
  return <Navbar />;
}