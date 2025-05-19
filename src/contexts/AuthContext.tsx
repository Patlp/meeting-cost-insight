
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
  const lastActivityTime = useRef(Date.now());
  const initStartTime = useRef(Date.now());

  // Heartbeat timer to track activity
  useEffect(() => {
    const updateActivityTime = () => {
      lastActivityTime.current = Date.now();
    };

    // Update on user interactions
    window.addEventListener('click', updateActivityTime);
    window.addEventListener('keydown', updateActivityTime);
    window.addEventListener('mousemove', updateActivityTime);
    
    // Start a heartbeat interval
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceInit = Math.floor((now - initStartTime.current) / 1000);
      const timeSinceActivity = Math.floor((now - lastActivityTime.current) / 1000);
      
      if (session) {
        console.log(`Auth heartbeat: session active for ${timeSinceInit}s, last activity ${timeSinceActivity}s ago`);
      }
      
      // If we have a session but it's been inactive for a while, verify it
      if (session && timeSinceActivity > 30) {
        console.log("Verifying session after inactivity...");
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
          // Only log if something changed
          if (!!currentSession !== !!session) {
            console.log("Session verification result:", currentSession ? "valid" : "expired/missing");
          }
        });
      }
    }, 30000); // Every 30 seconds
    
    return () => {
      window.removeEventListener('click', updateActivityTime);
      window.removeEventListener('keydown', updateActivityTime);
      window.removeEventListener('mousemove', updateActivityTime);
      clearInterval(interval);
    };
  }, [session]);

  // Track page changes to help debug navigation-related auth issues
  useEffect(() => {
    console.log(`Page changed to: ${location.pathname}${location.search}`);
    
    // Update activity time on navigation
    lastActivityTime.current = Date.now();
  }, [location]);

  useEffect(() => {
    console.log("AuthProvider initializing...", { 
      currentPath: location.pathname,
      initStartTime: new Date(initStartTime.current).toISOString()
    });
    
    // Set up auth state listener FIRST before any async operations
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        const eventTime = new Date().toISOString();
        console.log(`Auth state changed [${eventTime}]: ${event}`, newSession?.user?.email);
        
        // Update state synchronously to avoid race conditions
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setAuthError(null);
        
        if (event === 'SIGNED_IN') {
          console.log("User signed in successfully!");
          
          // Only navigate on fresh sign in, not on page refresh
          if (location.pathname === '/auth') {
            navigate('/');
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out");
          // Only navigate if not already on auth page
          if (location.pathname !== '/auth') {
            navigate('/auth');
          }
        } else if (event === 'TOKEN_REFRESHED') {
          console.log("Auth token refreshed successfully");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession }, error }) => {
      const loadTime = Date.now() - initStartTime.current;
      
      if (error) {
        console.error(`Error checking session (${loadTime}ms):`, error);
        setAuthError(error.message);
      } else {
        console.log(
          `Initial session check (${loadTime}ms):`, 
          existingSession 
            ? `User ${existingSession.user.email} found` 
            : "No session found"
        );
      }
      
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
      setInitializing(false);
    }).catch(error => {
      console.error("Critical error checking session:", error);
      setLoading(false);
      setInitializing(false);
      setAuthError("Failed to initialize authentication");
    });

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  // Separate effect for logging session state changes
  useEffect(() => {
    if (!initializing) {
      console.log("Session state updated:", session ? `User ${session.user.email} active` : "No active session");
    }
  }, [session, initializing]);

  const signIn = async (email: string, password: string) => {
    try {
      setAuthError(null);
      setLoading(true);
      console.log("Signing in with email:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        setAuthError(error.message);
        
        toast({
          title: "Sign In Error",
          description: error.message,
          variant: "destructive",
        });
        
        throw error;
      }

      console.log("Sign in successful:", data.user?.email);
      
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setAuthError(null);
      setLoading(true);
      console.log("Signing up with email:", email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (error) {
        console.error("Sign up error:", error);
        setAuthError(error.message);
        
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive",
        });
        
        throw error;
      }

      console.log("Sign up successful:", data);
      
      toast({
        title: "Account created!",
        description: "Please check your email for the confirmation link.",
      });
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setAuthError(null);
      setLoading(true);
      console.log("Signing out...");
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Sign out error:", error);
        setAuthError(error.message);
        throw error;
      }
      
      console.log("Sign out successful");
      
      // Navigate always after successful signout
      navigate('/auth');
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
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
