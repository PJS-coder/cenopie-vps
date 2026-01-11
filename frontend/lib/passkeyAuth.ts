// Passkey authentication system for secure admin access
const PASSKEY_SESSION_KEY = 'secure_admin_passkey_session';
const PASSKEY_HASH = 'cenopiee_secure_passkey_2025'; // This should be hashed in production

export interface PasskeySession {
  isAuthenticated: boolean;
  loginTime: number;
  expiresAt: number;
}

// Check if user is authenticated with passkey
export const isPasskeyAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const session = localStorage.getItem(PASSKEY_SESSION_KEY);
  if (!session) return false;
  
  try {
    const passkeySession: PasskeySession = JSON.parse(session);
    const now = Date.now();
    
    // Check if session is expired (1 hour)
    if (now > passkeySession.expiresAt) {
      localStorage.removeItem(PASSKEY_SESSION_KEY);
      return false;
    }
    
    return passkeySession.isAuthenticated;
  } catch {
    localStorage.removeItem(PASSKEY_SESSION_KEY);
    return false;
  }
};

// Authenticate with passkey
export const authenticateWithPasskey = (passkey: string): boolean => {
  // In a real implementation, you would hash the passkey and compare it securely
  // For this example, we're using a simple comparison
  if (passkey === PASSKEY_HASH) {
    const now = Date.now();
    const session: PasskeySession = {
      isAuthenticated: true,
      loginTime: now,
      expiresAt: now + (60 * 60 * 1000), // 1 hour
    };
    
    localStorage.setItem(PASSKEY_SESSION_KEY, JSON.stringify(session));
    return true;
  }
  
  return false;
};

// Logout from passkey session
export const logoutFromPasskey = (): void => {
  localStorage.removeItem(PASSKEY_SESSION_KEY);
};

// Get passkey session info
export const getPasskeySession = (): PasskeySession | null => {
  if (typeof window === 'undefined') return null;
  
  const session = localStorage.getItem(PASSKEY_SESSION_KEY);
  if (!session) return null;
  
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
};