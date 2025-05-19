
import { useState, useEffect, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

export interface SessionState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initializing: boolean;
  authError: string | null;
}

export function useSessionManager() {
  const [sessionState, setSessionState] = useState<SessionState>({
    session: null,
    user: null,
    loading: true,
    initializing: true,
    authError: null,
  });
  
  // Refs to track state safely across renders and avoid race conditions
  const isSigningIn = useRef(false);
  const isSigningOut = useRef(false);
  const navigationInProgress = useRef(false);
  const authSubscription = useRef<{ unsubscribe: () => void } | null>(null);
  const sessionCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const authInitialized = useRef(false);
  const initialCheckComplete = useRef(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize auth state - this only runs once
  useEffect(() => {
    // Prevent double initialization
    if (authInitialized.current) {
      console.log("🔒 Auth already initialized, skipping");
      return;
    }
    
    authInitialized.current = true;
    console.log(`🔒 Auth initializing on path: ${location.pathname}`);
    
    // Set up auth state listener first
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
        console.log(`🔔 Auth state changed: ${event}`, newSession?.user?.email || "No user");
        
        if (newSession) {
          setSessionState(prev => ({
            ...prev,
            session: newSession,
            user: newSession.user,
            loading: false,
            initializing: false,
            authError: null,
          }));
          
          // If this is an active sign-in, navigate to home
          if (isSigningIn.current) {
            console.log("🔑 Active sign-in detected");
            isSigningIn.current = false;
            
            // Only navigate if on auth page
            if (location.pathname === '/auth' && !navigationInProgress.current) {
              console.log("🔀 Navigating to home page after sign-in");
              navigationInProgress.current = true;
              
              setTimeout(() => {
                navigate('/');
                navigationInProgress.current = false;
              }, 100);
            }
          }
        } 
        else if (event === 'SIGNED_OUT') {
          console.log("🚪 User signed out");
          setSessionState(prev => ({
            ...prev,
            session: null,
            user: null,
            loading: false,
            initializing: false,
          }));
          
          // Only navigate if not already on auth page
          if (location.pathname !== '/auth' && !navigationInProgress.current) {
            console.log("🔀 Navigating to auth page after sign-out");
            navigationInProgress.current = true;
            
            setTimeout(() => {
              navigate('/auth');
              navigationInProgress.current = false;
            }, 100);
          }
        }
      });
      
      // Save subscription for cleanup
      authSubscription.current = subscription;
      console.log("✅ Auth state listener set up successfully");
    } catch (error) {
      console.error("❌ Failed to set up auth state listener:", error);
      setSessionState(prev => ({ 
        ...prev,
        authError: "Failed to set up authentication",
        loading: false,
        initializing: false
      }));
      return;
    }
    
    // After setting up listener, check for existing session
    const checkSession = async () => {
      try {
        console.log("🔍 Checking for existing session");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ Error checking session:", error.message);
          setSessionState(prev => ({ 
            ...prev, 
            authError: error.message,
            loading: false,
            initializing: false
          }));
        } 
        else {
          const existingSession = data.session;
          console.log(existingSession 
            ? `✅ Existing session found for ${existingSession.user.email}`
            : "ℹ️ No existing session");
            
          setSessionState(prev => ({ 
            ...prev,
            session: existingSession,
            user: existingSession?.user ?? null,
            loading: false,
            initializing: false
          }));
        }
        
        initialCheckComplete.current = true;
      } catch (error) {
        console.error("❌ Critical error checking session:", error);
        
        // Handle the specific lock error
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('LockManager.request') || errorMessage.includes('request() is not allowed')) {
          console.warn("⚠️ Browser security restrictions preventing session storage access. Using memory-only mode.");
          
          // Fall back to memory-only auth check
          try {
            // After a short delay, try one more time without locks
            setTimeout(async () => {
              try {
                const { data } = await supabase.auth.getSession();
                if (data.session) {
                  console.log(`✅ Session recovered in memory-only mode: ${data.session.user.email}`);
                  
                  setSessionState(prev => ({ 
                    ...prev,
                    session: data.session,
                    user: data.session?.user ?? null,
                    loading: false,
                    initializing: false,
                    authError: null
                  }));
                } else {
                  console.log("ℹ️ No session found in fallback mode");
                  setSessionState(prev => ({
                    ...prev,
                    loading: false,
                    initializing: false,
                    authError: null
                  }));
                }
              } catch (retryError) {
                console.error("❌ Final attempt to check session failed:", retryError);
                setSessionState(prev => ({
                  ...prev,
                  loading: false,
                  initializing: false,
                  authError: "Authentication verification failed"
                }));
              }
              
              initialCheckComplete.current = true;
            }, 300);
          } catch (e) {
            console.error("❌ Even fallback auth check failed:", e);
            setSessionState(prev => ({
              ...prev,
              loading: false,
              initializing: false,
              authError: "Authentication verification failed"
            }));
            initialCheckComplete.current = true;
          }
        } else {
          // For other errors, just update state
          setSessionState(prev => ({
            ...prev,
            authError: "Failed to verify authentication",
            loading: false,
            initializing: false
          }));
          initialCheckComplete.current = true;
        }
      }
    };
    
    // Add a short delay before checking session to ensure auth state is ready
    sessionCheckTimeout.current = setTimeout(checkSession, 100);
    
    // Fallback timeout to ensure we don't get stuck loading
    const fallbackTimeout = setTimeout(() => {
      if (!initialCheckComplete.current) {
        console.warn("⚠️ Auth check taking too long, forcing completion");
        setSessionState(prev => ({
          ...prev,
          loading: false,
          initializing: false,
          authError: prev.authError || "Authentication verification timed out"
        }));
        initialCheckComplete.current = true;
      }
    }, 5000);
    
    // Cleanup
    return () => {
      console.log("🧹 Cleaning up auth subscription");
      if (authSubscription.current) {
        authSubscription.current.unsubscribe();
      }
      if (sessionCheckTimeout.current) {
        clearTimeout(sessionCheckTimeout.current);
      }
      clearTimeout(fallbackTimeout);
    };
  }, [navigate, location.pathname]);
  
  // Public methods and state
  return {
    ...sessionState,
    isSigningIn,
    isSigningOut,
    setLoading: (loading: boolean) => setSessionState(prev => ({ ...prev, loading })),
    setAuthError: (authError: string | null) => setSessionState(prev => ({ ...prev, authError })),
    // Helper method to explicitly set signing in state
    setIsSigningIn: (value: boolean) => {
      isSigningIn.current = value;
    }
  };
}
