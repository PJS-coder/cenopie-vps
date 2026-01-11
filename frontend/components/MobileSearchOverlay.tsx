'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSearchOverlay({ isOpen, onClose }: MobileSearchOverlayProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when the overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure the element is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      onClose();
    }
  };

  // Handle Escape key to close the overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling when overlay is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore body scrolling when overlay is closed
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b safe-top">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="h-10 w-10 tap-target"
        >
          <XMarkIcon className="h-6 w-6" />
        </Button>
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-black/5 dark:bg-white/10 focus:outline-none text-base border-0"
              placeholder="Search users, jobs, companies..."
            />
          </div>
        </form>
        {searchQuery.trim() && (
          <Button 
            variant="ghost" 
            onClick={handleSearch}
            className="tap-target"
          >
            Search
          </Button>
        )}
      </div>

      {/* Search Suggestions */}
      <div className="p-4 flex-1 overflow-y-auto">
        {searchQuery.trim() ? (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Search Results</h3>
            <div className="space-y-2">
              {/* Show search query as first option */}
              <div 
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer tap-target"
                onClick={() => {
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  onClose();
                }}
              >
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm">Search for "{searchQuery}"</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Popular Searches</h3>
            <div className="space-y-2">
              {[
                'Software Engineer',
                'Product Manager', 
                'Data Scientist',
                'UX Designer',
                'Marketing Manager',
                'Sales Representative'
              ].map((suggestion) => (
                <div 
                  key={suggestion}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer tap-target"
                  onClick={() => {
                    setSearchQuery(suggestion);
                    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
                    onClose();
                  }}
                >
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}