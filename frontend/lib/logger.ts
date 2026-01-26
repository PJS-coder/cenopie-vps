// Production-safe logging utility
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (!IS_PRODUCTION) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (!IS_PRODUCTION) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  info: (...args: any[]) => {
    if (!IS_PRODUCTION) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (IS_DEVELOPMENT) {
      console.debug(...args);
    }
  },
  
  // Socket-specific logging
  socket: {
    log: (...args: any[]) => {
      if (!IS_PRODUCTION) {
        console.log('🔌', ...args);
      }
    },
    
    warn: (...args: any[]) => {
      if (!IS_PRODUCTION) {
        console.warn('🔌⚠️', ...args);
      }
    },
    
    error: (...args: any[]) => {
      console.error('🔌❌', ...args);
    }
  },
  
  // API-specific logging
  api: {
    log: (...args: any[]) => {
      if (!IS_PRODUCTION) {
        console.log('🌐', ...args);
      }
    },
    
    warn: (...args: any[]) => {
      if (!IS_PRODUCTION) {
        console.warn('🌐⚠️', ...args);
      }
    },
    
    error: (...args: any[]) => {
      console.error('🌐❌', ...args);
    }
  }
};

export default logger;