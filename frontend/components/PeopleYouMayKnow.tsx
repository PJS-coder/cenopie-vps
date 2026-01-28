'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import VerificationBadge from '@/components/VerificationBadge';
import { useSuggestedUsers } from '@/hooks/useSuggestedUsers';

interface PeopleYouMayKnowProps {
  currentUserId: string | null;
}

export default function PeopleYouMayKnow({ currentUserId }: PeopleYouMayKnowProps) {
  const router = useRouter();
  const { users: suggestedUsers, loading: suggestedUsersLoading, error: suggestedUsersError } = useSuggestedUsers();

  return (
    <div className="lg:sticky lg:top-6 space-y-6">
      {/* People You May Know */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">People You May Know</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {suggestedUsersLoading ? (
            <div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : suggestedUsersError ? (
            <div className="p-4 text-center text-red-500">
              Error loading suggestions
            </div>
          ) : suggestedUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No suggestions available
            </div>
          ) : (
            suggestedUsers.slice(0, 5).map((person: any) => (
              <div key={person.id} className="p-4 flex items-center">
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors -m-4 p-4 rounded-lg"
                  onClick={() => router.push(`/profile/${person.id}`)}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold text-sm overflow-hidden">
                    {person.profileImage ? (
                      <Image 
                        src={person.profileImage} 
                        alt={person.name} 
                        width={40} 
                        height={40} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{person.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-gray-900 dark:text-white truncate flex items-center space-x-1">
                      <span>{person.name}</span>
                      <VerificationBadge isVerified={person.isVerified} size="sm" />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {person.role} {person.company && `• ${person.company}`}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <button 
            className="w-full text-sm font-medium text-[#0BC0DF] hover:text-[#0aa9c4] transition-colors"
            onClick={() => router.push('/network')}
          >
            See all
          </button>
        </div>
      </div>
    
      {/* Footer Links - Hidden on Mobile */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-2 p-4 hidden md:block">
        <div>© {new Date().getFullYear()} Cenopie. All rights reserved.</div>
      </div>
    </div>
  );
}