
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Path logging for debugging
  const location = usePathLogger();
  
  // Session management
  const { 
    session, 
    user, 
    loading, 
    authError,
    setLoading,
    setAuthError
  } = useSessionManager();
  
  // Authentication actions
  const { signIn, signUp, signOut } = useAuthActions(setLoading, setAuthError);

  return (
    <AuthContext.Provider value={{ 
      session,
      user,
      signIn, 
      signUp, 
      signOut, 
      loading,
      authError
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
