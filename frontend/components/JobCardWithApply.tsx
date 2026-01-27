'use client';

import { useState, useEffect } from 'react';
import { BriefcaseIcon, MapPinIcon, ClockIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import VerificationBadge from './VerificationBadge';
import { jobApi } from '@/lib/api';
import { ApplicationData } from '@/lib/types';
import { useToastContext } from '@/components/ToastProvider';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: {
      id: string;
      name: string;
      logo?: string;
      isVerified?: boolean;
    };
    location: string;
    type: string;
    postedAt: string;
    description: string;
  };
  showApplyButton?: boolean;
}

export default function JobCardWithApply({ job, showApplyButton = true }: JobCardProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const { isAuthenticated } = useAuth();
  const toast = useToastContext();

  // Check if user has already applied for this job
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!isAuthenticated) return;
      
      try {
        // Get current user from localStorage
        const currentUserData = localStorage.getItem('currentUser');
        if (!currentUserData) return;
        
        const user = JSON.parse(currentUserData);
        
        const response = await fetch(`/api/applications?jobId=${job.id}&userId=${user.id}`);
        if (response.ok) {
          const applications = await response.json();
          if (applications.length > 0) {
            setHasApplied(true);
          }
        }
      } catch (error) {
        console.error('Error checking application status:', error);
      }
    };

    checkApplicationStatus();
  }, [job.id, isAuthenticated]);

  const handleApply = async () => {
    if (!isAuthenticated) {
      toast.warning('Please log in to apply for jobs');
      return;
    }

    // Get current user from localStorage
    const currentUserData = localStorage.getItem('currentUser');
    if (!currentUserData) {
      toast.error('Unable to retrieve user information. Please log in again.');
      return;
    }
    
    const user = JSON.parse(currentUserData);

    setIsApplying(true);
    
    try {
      // Create application data
      const applicationData: ApplicationData = {
        id: `app_${Date.now()}`,
        jobId: job.id,
        userId: user.id,
        companyId: job.company.id,
        status: 'pending',
        resume: null,
        coverLetter: `Application for ${job.title} at ${job.company.name}`,
        appliedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Submit application
      await jobApi.applyToJob(job.id);
      
      setHasApplied(true);
      toast.success('Application submitted successfully!');
    } catch (error) {
      console.error('Error applying for job:', error);
      toast.error('Failed to apply for job. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
              {job.company.isVerified && <VerificationBadge />}
            </div>
            
            <div className="mt-1 flex items-center text-sm text-gray-600">
              <BriefcaseIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              {job.company.name}
            </div>
            
            <div className="mt-2 flex flex-wrap gap-2">
              <div className="flex items-center text-sm text-gray-600">
                <MapPinIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                {job.location}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                {job.type}
              </div>
            </div>
            
            <p className="mt-3 text-sm text-gray-600 line-clamp-2">{job.description}</p>
          </div>
          
          {showApplyButton && (
            <div className="ml-4 flex-shrink-0">
              {hasApplied ? (
                <Button disabled className="bg-green-100 text-green-700 hover:bg-green-100">
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Application Sent
                </Button>
              ) : (
                <Button 
                  onClick={handleApply}
                  disabled={isApplying}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isApplying ? 'Applying...' : 'Apply Now'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}