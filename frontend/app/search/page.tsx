'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSearch } from '@/hooks/useSearch';
import { Button } from '@/components/ui/button';
import { UserIcon } from '@heroicons/react/24/outline';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const { results, loading, error, search } = useSearch();

  useEffect(() => {
    if (query) {
      search(query);
    }
  }, [query, search]);

  const handleClickResult = (result: any) => {
    if (result.type === 'user') {
      router.push(`/profile/${result.id}`);
    }
  };

  return (
    <div className="w-full flex justify-center px-4 lg:px-6 py-6">
      <div className="w-full lg:w-[1000px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Search Results</h1>
        <p className="text-gray-600">
          {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
        </p>
      </div>



      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && (
        <div className="space-y-4">
          {results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No results found for "{query}"</p>
            </div>
          ) : (
            results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleClickResult(result)}
                >
                  {result.profileImage ? (
                    <img
                      src={result.profileImage}
                      alt={result.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <div className="ml-4 flex-1">
                    <div className="font-semibold">{result.name}</div>
                    <p className="text-sm text-gray-600 mt-1">{result.headline}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                </div>
              ))
          )}
        </div>
      )}
      </div>
    </div>
  );
}