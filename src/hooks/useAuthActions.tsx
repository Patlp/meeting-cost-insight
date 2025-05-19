
import { useRef } from 'react';
import { signIn as signInService, signUp as signUpService, signOut as signOutService } from '@/services/authService';

export function useAuthActions(setLoading: (loading: boolean) => void, setAuthError: (error: string | null) => void) {
  const isSigningIn = useRef(false);
  const isSigningOut = useRef(false);

  const signIn = async (email: string, password: string) => {
    try {
      setAuthError(null);
      setLoading(true);
      isSigningIn.current = true;
      
      await signInService(email, password);
      // Auth state change listener will handle session update and navigation
    } catch (error) {
      console.error('❌ Sign in error:', error);
      isSigningIn.current = false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setAuthError(null);
      setLoading(true);
      
      await signUpService(email, password);
    } catch (error) {
      console.error('❌ Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setAuthError(null);
      setLoading(true);
      isSigningOut.current = true;
      
      await signOutService();
      // Auth state change listener will handle session update and navigation
    } catch (error) {
      console.error('❌ Sign out error:', error);
      isSigningOut.current = false;
    } finally {
      setLoading(false);
    }
  };

  return {
    signIn,
    signUp,
    signOut,
    isSigningIn,
    isSigningOut
  };
}
