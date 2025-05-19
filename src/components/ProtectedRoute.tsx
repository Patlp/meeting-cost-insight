
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [isPreview, setIsPreview] = useState(false);

  // Check if we're in a preview environment
  useEffect(() => {
    // Check if the URL contains typical preview indicators
    const isPreviewEnvironment = 
      window.location.hostname.includes('lovable.app') ||
      window.location.hostname.includes('preview') ||
      window.location.hostname.includes('localhost');
    
    setIsPreview(isPreviewEnvironment);
  }, []);

  // Show loading spinner while checking authentication
  if (loading && !isPreview) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // In preview environment, bypass authentication
  if (isPreview) {
    return <>{children}</>;
  }

  // In production environment, enforce authentication
  if (!session) {
    // Redirect to the login page with the return url
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
