
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AuthCallback: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setLoading(true);
        console.log("🔄 Processing auth callback...");
        
        // Get parameters from the URL
        const params = new URLSearchParams(location.hash || location.search);
        
        // Log auth parameters (for debugging)
        console.log("📊 Auth parameters:", {
          hasCode: params.has('code'),
          hasError: params.has('error'),
          hasToken: params.has('access_token'),
          hasType: params.has('type'),
          hasState: params.has('state'),
        });
        
        // Check for error in URL
        if (params.has('error') || params.has('error_description')) {
          const errorMessage = params.get('error_description') || params.get('error') || 'Authentication error';
          console.error("❌ Auth error from URL parameters:", errorMessage);
          setError(errorMessage);
          setLoading(false);
          return;
        }

        // Check if this is an email verification confirmation
        const isEmailConfirmation = params.has('type') && params.get('type') === 'signup';

        // Check if we're completing an OAuth or magic link flow
        if (params.has('code') || params.has('access_token') || params.has('state')) {
          try {
            // Let Supabase handle the redirect logic
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error("❌ Error getting session after redirect:", error.message);
              setError(`Authentication failed: ${error.message}`);
              setLoading(false);
              return;
            }
            
            if (data?.session) {
              console.log("✅ Successfully retrieved session after redirect:", data.session.user.email);
              
              // If this was an email verification, show success message
              if (isEmailConfirmation) {
                setVerificationSuccess(true);
                // Show toast notification
                toast({
                  title: "Email Verified!",
                  description: "Thanks for verifying your email — you're now signed in.",
                  duration: 5000,
                });
                setLoading(false);
                
                // After a brief delay to show success message, redirect to home
                setTimeout(() => {
                  navigate('/', { replace: true });
                }, 3000);
              } else {
                // For other auth flows, redirect immediately
                console.log("🔀 Redirecting to home page...");
                setTimeout(() => {
                  navigate('/', { replace: true });
                }, 500);
              }
            } else {
              console.warn("⚠️ No session found after redirect");
              setError("No session was created. Please try logging in again.");
              setLoading(false);
            }
          } catch (err: any) {
            console.error("❌ Critical error during auth callback:", err);
            setError(`Authentication error: ${err.message || 'Unknown error'}`);
            setLoading(false);
          }
        } else {
          // No auth parameters, redirect to login
          console.warn("⚠️ No auth parameters found in URL");
          setError("No authentication parameters found. Please try logging in again.");
          setLoading(false);
        }
      } catch (err: any) {
        console.error("❌ Unexpected auth callback error:", err);
        setError(`Unexpected error: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [location, navigate]);

  const handleRetry = () => {
    navigate('/auth', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        <div className="mt-4 text-primary font-medium">Completing authentication...</div>
        <div className="mt-2 text-sm text-gray-500 max-w-md text-center">
          Please wait while we verify your authentication.
          This may take a few moments.
        </div>
      </div>
    );
  }

  if (verificationSuccess) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-center text-2xl">Email Verified!</CardTitle>
            <CardDescription className="text-center">
              Thanks for verifying your email — you're now signed in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-sm text-gray-500 mb-4">
              You'll be redirected to the dashboard automatically in a few seconds.
            </div>
            <Button 
              onClick={() => navigate('/', { replace: true })}
              className="w-full"
            >
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <div className="text-sm text-gray-500 mb-6">
            <p className="mb-2">This could be due to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>An expired or invalid verification link</li>
              <li>Browser privacy settings blocking cookies or storage</li>
              <li>Network connectivity issues</li>
            </ul>
          </div>
          
          <Button onClick={handleRetry} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Return to login
          </Button>
        </div>
      </div>
    );
  }

  // Default fallback - should not reach here in normal flow
  return <Navigate to="/auth" replace />;
};

export default AuthCallback;
