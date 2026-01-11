'use client';


import { SearchResult } from '@/lib/api';
import { UserIcon } from '@heroicons/react/24/outline';

interface SearchSuggestionsProps {
  results: SearchResult[];
  loading: boolean;
  onSelect: (result: SearchResult) => void;
  onSearchAll: (query: string) => void;
  query: string;
}

export default function SearchSuggestions({ 
  results, 
  loading, 
  onSelect, 
  onSearchAll,
  query
}: SearchSuggestionsProps) {
  if (results.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {loading ? (
        <div className="px-4 py-3 text-center text-gray-500">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand mx-auto"></div>
        </div>
      ) : (
        <>
          <div className="py-1">
            {results.slice(0, 8).map((result) => (
              <div
                key={result.id}
                className="flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => onSelect(result)}
              >
                {result.profileImage ? (
                  <img
                    src={result.profileImage}
                    alt={result.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-gray-500" />
                  </div>
                )}
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{result.name}</p>
                  <p className="text-xs text-gray-500 truncate">{result.headline}</p>
                </div>
              </div>
            ))}
          </div>
          
          {results.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 py-2">
              <button
                className="w-full text-center text-sm text-brand hover:bg-gray-50 dark:hover:bg-gray-800 py-2"
                onClick={() => onSearchAll(query)}
              >
                View all {results.length} results for "{query}"
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}