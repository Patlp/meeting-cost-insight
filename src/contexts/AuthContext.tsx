
import React, { createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useAuthActions } from '@/hooks/useAuthActions';
import { usePathLogger } from '@/hooks/usePathLogger';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Path logging for debugging
  usePathLogger();
  
  // Session management
  const { 
    session, 
    user, 
    loading, 
    authError,
    setLoading,
    setAuthError,
    setIsSigningIn
  } = useSessionManager();
  
  // Authentication actions with enhanced error handling
  const { signIn, signUp, signOut } = useAuthActions(
    setLoading, 
    setAuthError, 
    setIsSigningIn // Pass the function to control signing in state
  );

  // Helper to clear auth errors
  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider value={{ 
      session,
      user,
      signIn, 
      signUp, 
      signOut, 
      loading,
      authError,
      clearAuthError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
