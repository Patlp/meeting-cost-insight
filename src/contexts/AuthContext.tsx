
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Refs to track state safely across renders and avoid race conditions
  const isSigningIn = useRef(false);
  const isSigningOut = useRef(false);
  const navigationInProgress = useRef(false);
  const authSubscription = useRef<{ unsubscribe: () => void } | null>(null);
  const sessionCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const authInitialized = useRef(false);
  
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
        setSession(newSession);
        setUser(newSession.user);
        setAuthError(null);
        
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
        setSession(null);
        setUser(null);
        
        // Only navigate if not already on auth page and not during initialization
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
          setAuthError(error.message);
        } 
        else {
          const existingSession = data.session;
          console.log(existingSession 
            ? `✅ Existing session found for ${existingSession.user.email}`
            : "ℹ️ No existing session");
            
          setSession(existingSession);
          setUser(existingSession?.user ?? null);
        }
      } catch (error) {
        console.error("❌ Critical error checking session:", error);
        setAuthError("Failed to initialize authentication");
      } finally {
        setLoading(false);
        setInitializing(false);
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
    if (!session) return;
    
    console.log("💓 Starting auth heartbeat");
    
    const heartbeatInterval = setInterval(() => {
      // Skip verification if we're currently signing in/out
      if (isSigningIn.current || isSigningOut.current) return;
      
      // Check the session validity
      supabase.auth.getSession().then(({ data }) => {
        const currentSession = data.session;
        
        if (!currentSession && session) {
          console.log("⚠️ Session lost during heartbeat check");
          setSession(null);
          setUser(null);
          
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
  }, [session, navigate, location.pathname]);
  
  // Log path changes for debugging
  useEffect(() => {
    console.log(`📍 Path changed: ${location.pathname}`);
  }, [location.pathname]);

  const signIn = async (email: string, password: string) => {
    try {
      setAuthError(null);
      setLoading(true);
      isSigningIn.current = true;
      
      console.log("🔑 Signing in with email:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Sign in error:", error.message);
        setAuthError(error.message);
        isSigningIn.current = false;
        
        toast({
          title: "Sign In Error",
          description: error.message,
          variant: "destructive",
        });
        
        throw error;
      }

      console.log("✅ Sign in successful:", data.user?.email);
      
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      
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
      console.log("📝 Signing up with email:", email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (error) {
        console.error("❌ Sign up error:", error.message);
        setAuthError(error.message);
        
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive",
        });
        
        throw error;
      }

      console.log("✅ Sign up successful:", data);
      
      toast({
        title: "Account created!",
        description: "Please check your email for the confirmation link.",
      });
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
      console.log("🚪 Signing out...");
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("❌ Sign out error:", error.message);
        setAuthError(error.message);
        isSigningOut.current = false;
        throw error;
      }
      
      console.log("✅ Sign out successful");
      
      // Auth state change listener will handle session update and navigation
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('❌ Sign out error:', error);
      isSigningOut.current = false;
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session,
      user,
      signIn, 
      signUp, 
      signOut, 
      loading: loading || initializing,
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
