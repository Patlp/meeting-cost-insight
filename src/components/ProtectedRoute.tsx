
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  // Effect to mark when initial check is complete, even if loading is stuck
  useEffect(() => {
    // Set a timeout to ensure we don't get stuck in loading state forever
    const timer = setTimeout(() => {
      if (loading) {
        console.log("Auth check taking too long, proceeding to avoid hanging");
        setInitialCheckComplete(true);
      }
    }, 2000);

    // If loading completes normally, mark initial check as complete
    if (!loading) {
      setInitialCheckComplete(true);
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [loading]);

  // Show loading spinner while checking authentication and timeout hasn't occurred
  if (loading && !initialCheckComplete) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we're not loading or timeout occurred, and there's no session, redirect
  if (!session && initialCheckComplete) {
    // Redirect to the login page with the return url
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If session exists or we're in a preview mode, show children
  return <>{children}</>;
};

export default ProtectedRoute;
