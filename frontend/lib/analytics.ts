// Google Analytics 4 Integration

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Check if GA is enabled
export const isGAEnabled = (): boolean => {
  return !!GA_TRACKING_ID && typeof window !== 'undefined';
};

// Page view tracking
export const pageview = (url: string): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};

// Event tracking
interface GAEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export const event = ({ action, category, label, value }: GAEvent): void => {
  if (!isGAEnabled()) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Custom events for Cenopie
export const trackSignup = (method: 'email' | 'google'): void => {
  event({
    action: 'sign_up',
    category: 'engagement',
    label: method,
  });
};

export const trackLogin = (method: 'email' | 'google'): void => {
  event({
    action: 'login',
    category: 'engagement',
    label: method,
  });
};

export const trackPostCreated = (): void => {
  event({
    action: 'post_created',
    category: 'content',
  });
};

export const trackJobApplication = (jobId: string): void => {
  event({
    action: 'job_application',
    category: 'conversion',
    label: jobId,
  });
};

export const trackConnectionRequest = (): void => {
  event({
    action: 'connection_request',
    category: 'engagement',
  });
};

export const trackSearch = (query: string): void => {
  event({
    action: 'search',
    category: 'engagement',
    label: query,
  });
};

export const trackProfileView = (userId: string): void => {
  event({
    action: 'profile_view',
    category: 'engagement',
    label: userId,
  });
};

export const trackCompanyView = (companyId: string): void => {
  event({
    action: 'company_view',
    category: 'engagement',
    label: companyId,
  });
};

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}
