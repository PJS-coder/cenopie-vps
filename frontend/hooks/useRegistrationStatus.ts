import { useState, useEffect } from 'react';

interface RegistrationStatus {
  allowRegistration: boolean;
  launchMode: string;
  message: string;
}

export const useRegistrationStatus = () => {
  const [status, setStatus] = useState<RegistrationStatus>({
    allowRegistration: true, // Default to true to avoid blocking during loading
    launchMode: 'open',
    message: 'Loading...'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegistrationStatus = async () => {
      try {
        setLoading(true);
        
        const API_BASE_URL = 'https://api.cenopie.com';
        const response = await fetch(`${API_BASE_URL}/api/auth/registration-status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setStatus(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch registration status:', err);
        setError('Failed to check registration status');
        // Default to closed registration on error for security
        setStatus({
          allowRegistration: false,
          launchMode: 'closed_beta',
          message: 'Registration status unavailable'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrationStatus();
  }, []);

  return {
    ...status,
    loading,
    error,
    isClosedBeta: status.launchMode === 'closed_beta'
  };
};