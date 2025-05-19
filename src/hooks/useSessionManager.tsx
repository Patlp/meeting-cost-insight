
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
    
    // STEP 1: Set up auth state listener FIRST (before any async operations)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log(`🔔 Auth state changed: ${event}`, newSession?.user?.email || "No user");
      
      // Handle session changes synchronously to avoid race conditions
      if (newSession) {
        setSessionState(prev => ({
          ...prev,
          session: newSession,
          user: newSession.user,
          authError: null,
        }));
        
        // If this is an active sign-in (not just a refresh), navigate to home
        if (isSigningIn.current) {
          console.log("🔑 Active sign-in detected");
          
          // Make sure we only navigate if we're currently on the auth page
          if (location.pathname === '/auth' && !navigationInProgress.current) {
            console.log("🔀 Navigating to home page after sign-in");
            navigationInProgress.current = true;
            
            // Small delay to ensure state is updated first
            setTimeout(() => {
              navigate('/');
              navigationInProgress.current = false;
            }, 100);
          }
          
          isSigningIn.current = false;
        }
      } 
      else if (event === 'SIGNED_OUT') {
        console.log("🚪 User signed out");
        setSessionState(prev => ({
          ...prev,
          session: null,
          user: null,
        }));
        
        // Only navigate if not already on auth page and not during initialization
        const { initializing } = sessionState;
        if (location.pathname !== '/auth' && !initializing && !navigationInProgress.current) {
          console.log("🔀 Navigating to auth page after sign-out");
          navigationInProgress.current = true;
          
          setTimeout(() => {
            navigate('/auth');
            navigationInProgress.current = false;
          }, 100);
        }
      }
    });
    
    authSubscription.current = subscription;
    
    // STEP 2: AFTER setting up the listener, check for existing session
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
      } catch (error) {
        console.error("❌ Critical error checking session:", error);
        setSessionState(prev => ({
          ...prev,
          authError: "Failed to initialize authentication",
          loading: false,
          initializing: false
        }));
      }
    };
    
    // Add a short delay before checking session to ensure auth state is ready
    sessionCheckTimeout.current = setTimeout(checkSession, 100);
    
    // Cleanup
    return () => {
      console.log("🧹 Cleaning up auth subscription");
      if (authSubscription.current) {
        authSubscription.current.unsubscribe();
      }
      if (sessionCheckTimeout.current) {
        clearTimeout(sessionCheckTimeout.current);
      }
    };
  }, [navigate, location.pathname]);
  
  // Set up session verification via periodic heartbeat
  useEffect(() => {
    // Only start heartbeat if we have a session
    if (!sessionState.session) return;
    
    console.log("💓 Starting auth heartbeat");
    
    const heartbeatInterval = setInterval(() => {
      // Skip verification if we're currently signing in/out
      if (isSigningIn.current || isSigningOut.current) return;
      
      // Check the session validity
      supabase.auth.getSession().then(({ data }) => {
        const currentSession = data.session;
        
        if (!currentSession && sessionState.session) {
          console.log("⚠️ Session lost during heartbeat check");
          setSessionState(prev => ({
            ...prev,
            session: null,
            user: null,
          }));
          
          // Navigate to auth if not already there
          if (location.pathname !== '/auth' && !navigationInProgress.current) {
            console.log("🔀 Navigating to auth page after session loss");
            navigationInProgress.current = true;
            
            setTimeout(() => {
              navigate('/auth');
              navigationInProgress.current = false;
            }, 100);
          }
        }
        else if (currentSession) {
          // Refresh token if it's less than 30 minutes from expiry
          const now = Math.floor(Date.now() / 1000);
          const expiresAt = currentSession.expires_at as number;
          const timeLeft = expiresAt - now;
          
          if (timeLeft < 1800) {
            console.log("🔄 Refreshing session token during heartbeat");
            supabase.auth.refreshSession();
          }
        }
      });
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(heartbeatInterval);
  }, [sessionState.session, navigate, location.pathname]);
  
  return {
    ...sessionState,
    isSigningIn,
    isSigningOut,
    setLoading: (loading: boolean) => setSessionState(prev => ({ ...prev, loading })),
    setAuthError: (authError: string | null) => setSessionState(prev => ({ ...prev, authError }))
  };
}
