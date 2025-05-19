
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, loading, authError } = useAuth();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  
  // Debug route protection
  useEffect(() => {
    console.log("🛡️ Protected route check:", { 
      path: location.pathname, 
      hasSession: !!session, 
      loading, 
      authError: authError || 'none' 
    });
  }, [session, loading, location, authError]);

  // Handle authentication verification
  useEffect(() => {
    // Wait for auth to finish loading before making decisions
    if (loading) return;
    
    // If we have a session, we're good to go
    if (session) {
      console.log("✅ User authenticated, showing protected content");
      setShowLoader(false);
      return;
    }
    
    // If auth is done loading and we don't have a session, prepare to redirect
    if (!loading && !session) {
      console.log("🚫 No authentication, preparing redirect to login");
      
      // Short delay before redirecting to prevent flickering
      // if auth state changes quickly
      const redirectTimer = setTimeout(() => {
        setShouldRedirect(true);
      }, 300);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [session, loading, location.pathname]);

  // Show loading state while checking authentication
  if (loading || (showLoader && !shouldRedirect)) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        <div className="mt-4 text-primary font-medium">Verifying authentication...</div>
        {loading && (
          <div className="mt-2 text-sm text-gray-500 max-w-md text-center">
            This is taking longer than expected. Checking your authentication status...
          </div>
        )}
      </div>
    );
  }

  // Redirect to auth page if not authenticated
  if (shouldRedirect || (!loading && !session)) {
    console.log(`🔀 Redirecting from ${location.pathname} to /auth`);
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
