
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, loading, authError } = useAuth();
  const location = useLocation();
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  const [showingLoader, setShowingLoader] = useState(true);
  const [redirectTriggered, setRedirectTriggered] = useState(false);
  const [waitedSufficientTime, setWaitedSufficientTime] = useState(false);

  // Debug current auth state
  useEffect(() => {
    console.log("ProtectedRoute rendering:", {
      path: location.pathname,
      hasSession: !!session,
      authLoading: loading,
      initialCheckComplete,
      authError: authError || 'none',
      redirectTriggered,
      waitedSufficientTime
    });
  }, [session, loading, initialCheckComplete, location, authError, redirectTriggered, waitedSufficientTime]);

  // Wait a minimum time before considering auth check complete
  useEffect(() => {
    const timer = setTimeout(() => {
      setWaitedSufficientTime(true);
    }, 500); // Give auth a minimum time to load
    
    return () => clearTimeout(timer);
  }, []);

  // Effect to mark when initial check is complete, even if loading is stuck
  useEffect(() => {
    // Set a timeout to ensure we don't get stuck in loading state forever
    const timer = setTimeout(() => {
      if (loading) {
        console.log("Auth check taking too long, proceeding with available information");
        setInitialCheckComplete(true);
        setShowingLoader(false);
      }
    }, 2000); // Increased timeout to give more time for auth to initialize

    // If loading completes normally, mark initial check as complete
    if (!loading && waitedSufficientTime) {
      console.log("Auth loading complete, status:", session ? "authenticated" : "unauthenticated");
      setInitialCheckComplete(true);
      
      // Add a tiny delay before hiding loader for smoother transitions
      const hideTimer = setTimeout(() => {
        setShowingLoader(false);
      }, 300);
      
      clearTimeout(timer);
      return () => clearTimeout(hideTimer);
    }

    return () => clearTimeout(timer);
  }, [loading, session, waitedSufficientTime]);

  // Handle redirecting to auth page if not authenticated
  useEffect(() => {
    if (initialCheckComplete && !loading && !session && !redirectTriggered) {
      console.log("Authentication required for path:", location.pathname);
      setRedirectTriggered(true);
    }
  }, [initialCheckComplete, loading, session, location.pathname, redirectTriggered]);

  // Show loading spinner while checking authentication
  if (showingLoader) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        <div className="mt-4 text-primary font-medium">Verifying authentication...</div>
        {loading && initialCheckComplete && (
          <div className="mt-2 text-sm text-gray-500">
            This is taking longer than expected...
          </div>
        )}
      </div>
    );
  }

  // If we're redirecting, go to auth page
  if (redirectTriggered) {
    console.log(`Redirecting from ${location.pathname} to /auth`);
    // Redirect to the login page with the return url
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If session exists, show children
  return <>{children}</>;
};

export default ProtectedRoute;
