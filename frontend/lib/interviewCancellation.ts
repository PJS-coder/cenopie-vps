// Utility functions for handling interview cancellations

export interface CancellationInfo {
  isCancelled: boolean;
  reason: 'cheating' | 'browser-exit' | 'hard-refresh';
  message: string;
  interviewId: string;
}

export function getCancellationInfo(): CancellationInfo | null {
  if (typeof window === 'undefined') return null;
  
  const isCancelled = localStorage.getItem('interviewCancelled') === 'true';
  
  if (!isCancelled) return null;
  
  const reason = localStorage.getItem('cancellationReason') as CancellationInfo['reason'];
  const message = localStorage.getItem('cancellationMessage') || 'Interview was cancelled';
  const interviewId = localStorage.getItem('cancelledInterviewId') || '';
  
  return {
    isCancelled,
    reason,
    message,
    interviewId
  };
}

export function clearCancellationInfo(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('interviewCancelled');
  localStorage.removeItem('cancellationReason');
  localStorage.removeItem('cancellationMessage');
  localStorage.removeItem('cancelledInterviewId');
}

export function getStartNewInterviewUrl(interviewId: string): string {
  return `/interviews/${interviewId}/start`;
}