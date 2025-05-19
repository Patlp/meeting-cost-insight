
import { useRef } from 'react';
import { signIn as signInService, signUp as signUpService, signOut as signOutService } from '@/services/authService';

export function useAuthActions(
  setLoading: (loading: boolean) => void, 
  setAuthError: (error: string | null) => void,
  setIsSigningIn?: (value: boolean) => void
) {
  const isSigningIn = useRef(false);
  const isSigningOut = useRef(false);
  const isSigningUp = useRef(false);

  const signIn = async (email: string, password: string) => {
    try {
      setAuthError(null);
      setLoading(true);
      isSigningIn.current = true;
      
      // Explicitly set the signing in state if the function is provided
      if (setIsSigningIn) {
        setIsSigningIn(true);
      }
      
      console.log(`🔐 Starting sign in for: ${email}`);
      await signInService(email, password);
      console.log(`✅ Sign in service complete for: ${email}`);
      
      // Auth state change listener will handle session update and navigation
    } catch (error) {
      console.error('❌ Sign in error:', error);
      isSigningIn.current = false;
      
      // Reset the signing in state on error
      if (setIsSigningIn) {
        setIsSigningIn(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setAuthError(null);
      setLoading(true);
      isSigningUp.current = true;
      
      console.log(`📝 Starting sign up for: ${email}`);
      await signUpService(email, password);
      console.log(`✅ Sign up service complete for: ${email}`);
      
      // After signup, automatically try to sign in
      if (setIsSigningIn) {
        setIsSigningIn(true);
      }
    } catch (error) {
      console.error('❌ Sign up error:', error);
      isSigningUp.current = false;
    } finally {
      setLoading(false);
      isSigningUp.current = false;
    }
  };

  const signOut = async () => {
    try {
      setAuthError(null);
      setLoading(true);
      isSigningOut.current = true;
      
      console.log('🚪 Starting sign out');
      await signOutService();
      console.log('✅ Sign out service complete');
      
      // Auth state change listener will handle session update and navigation
    } catch (error) {
      console.error('❌ Sign out error:', error);
      isSigningOut.current = false;
    } finally {
      setLoading(false);
      isSigningOut.current = false;
    }
  };

  return {
    signIn,
    signUp,
    signOut,
    isSigningIn,
    isSigningOut,
    isSigningUp
  };
}
