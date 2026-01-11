"use client";
import { ReactNode, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '@/context/AuthContext';
import { MessageProvider } from '@/context/MessageContext';
import MessagingInitializer from './MessagingInitializer';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000, // TanStack Query v5 uses gcTime (garbage collection time)
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 2,
      },
    },
  }));

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-[#0BC0DF]"></div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <MessageProvider>
        <QueryClientProvider client={queryClient}>
          <MessagingInitializer />
          {children}

        </QueryClientProvider>
      </MessageProvider>
    </AuthProvider>
  );
}