import { useEffect, useState } from 'react';
import { getCancellationInfo, clearCancellationInfo, CancellationInfo } from '@/lib/interviewCancellation';

export function useInterviewCancellation() {
  const [cancellationInfo, setCancellationInfo] = useState<CancellationInfo | null>(null);
  const [showCancellationMessage, setShowCancellationMessage] = useState(false);

  useEffect(() => {
    const info = getCancellationInfo();
    if (info) {
      setCancellationInfo(info);
      setShowCancellationMessage(true);
      
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setShowCancellationMessage(false);
        clearCancellationInfo();
        setCancellationInfo(null);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, []);

  const dismissCancellation = () => {
    setShowCancellationMessage(false);
    clearCancellationInfo();
    setCancellationInfo(null);
  };

  return {
    cancellationInfo,
    showCancellationMessage,
    dismissCancellation
  };
}