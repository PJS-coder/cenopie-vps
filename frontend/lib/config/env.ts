// Environment configuration with validation and defaults
interface EnvironmentConfig {
  API_URL: string;
  APP_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
  IS_PRODUCTION: boolean;
  IS_DEVELOPMENT: boolean;
  SOCKET_URL: string;
  CLOUDINARY_CLOUD_NAME?: string;
  GOOGLE_ANALYTICS_ID?: string;
  SENTRY_DSN?: string;
}

// Validate required environment variables
const validateEnv = (): EnvironmentConfig => {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
  
  // Default URLs based on environment
  const defaultApiUrl = nodeEnv === 'production' 
    ? 'https://api.cenopie.com' 
    : 'http://localhost:4000';
    
  const defaultAppUrl = nodeEnv === 'production'
    ? 'https://cenopie.com'
    : 'http://localhost:3000';

  const config: EnvironmentConfig = {
    NODE_ENV: nodeEnv,
    IS_PRODUCTION: nodeEnv === 'production',
    IS_DEVELOPMENT: nodeEnv === 'development',
    API_URL: process.env.NEXT_PUBLIC_API_URL || defaultApiUrl,
    APP_URL: process.env.NEXT_PUBLIC_APP_URL || defaultAppUrl,
    SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || defaultApiUrl,
    CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    GOOGLE_ANALYTICS_ID: process.env.NEXT_PUBLIC_GA_ID,
    SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  };

  // Validate required variables in production
  if (config.IS_PRODUCTION) {
    const requiredVars = ['API_URL', 'APP_URL'];
    const missingVars = requiredVars.filter(key => !config[key as keyof EnvironmentConfig]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  // Log configuration in development
  if (config.IS_DEVELOPMENT) {
    console.log('🔧 Environment Configuration:', {
      NODE_ENV: config.NODE_ENV,
      API_URL: config.API_URL,
      APP_URL: config.APP_URL,
      SOCKET_URL: config.SOCKET_URL,
    });
  }

  return config;
};

// Export validated configuration
export const env = validateEnv();

// Helper functions
export const isProduction = () => env.IS_PRODUCTION;
export const isDevelopment = () => env.IS_DEVELOPMENT;
export const getApiUrl = (path = '') => `${env.API_URL}${path}`;
export const getAppUrl = (path = '') => `${env.APP_URL}${path}`;
export const getSocketUrl = () => env.SOCKET_URL;