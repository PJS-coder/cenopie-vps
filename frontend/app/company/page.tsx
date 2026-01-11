'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CompanyPage() {
  const router = useRouter();

  // Redirect users away from company page
  useEffect(() => {
    router.push('/jobs');
  }, [router]);

  return null;
}