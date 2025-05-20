
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { AuthError } from '@supabase/supabase-js';

/**
 * Handle authentication errors with appropriate messaging
 */
const handleAuthError = (error: AuthError | Error): never => {
  console.error("❌ Auth error:", error);
  
  // Format user-friendly error messages
  let errorMessage: string;
  let errorTitle: string = "Authentication Error";
  
  if ('status' in error && typeof error.status === 'number') {
    // This is a Supabase AuthError
    switch (error.status) {
      case 400:
        errorTitle = "Invalid Credentials";
        if (error.message.includes('Email not confirmed')) {
          errorMessage = "Please check your email and confirm your account before signing in.";
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        } else {
          errorMessage = error.message;
        }
        break;
      case 401:
        errorTitle = "Authentication Failed";
        errorMessage = "Your login session has expired. Please sign in again.";
        break;
      case 422:
        errorTitle = "Validation Error";
        if (error.message.includes('already registered')) {
          errorMessage = "This email is already registered. Try signing in instead.";
        } else if (error.message.includes('password')) {
          errorMessage = "Password must be at least 6 characters long.";
        } else {
          errorMessage = error.message;
        }
        break;
      case 429:
        errorTitle = "Too Many Requests";
        errorMessage = "Too many login attempts. Please wait a moment and try again.";
        break;
      default:
        errorMessage = error.message;
    }
  } else {
    // Generic error
    errorMessage = error.message || 'An unexpected authentication error occurred';
    
    // Special handling for common browser errors
    if (errorMessage.includes('NetworkError')) {
      errorTitle = "Network Error";
      errorMessage = "Unable to connect to authentication server. Please check your internet connection and try again.";
    } else if (errorMessage.includes('timeout')) {
      errorTitle = "Timeout Error";
      errorMessage = "The authentication request timed out. Please try again.";
    }
  }
  
  // Show toast to user
  toast({
    title: errorTitle,
    description: errorMessage,
    variant: "destructive",
  });
  
  // Re-throw with formatted message
  throw new Error(errorMessage);
};

export async function signIn(email: string, password: string) {
  console.log("🔑 Signing in with email:", email);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return handleAuthError(error);
    }

    console.log("✅ Sign in successful for:", data.user?.email);
    
    toast({
      title: "Welcome back!",
      description: "You have successfully signed in.",
    });
    
    return data;
  } catch (e) {
    // Handle unexpected errors
    if (e instanceof Error) {
      return handleAuthError(e);
    }
    
    // Really unknown error
    const errorMessage = 'An unknown error occurred during sign in';
    console.error("❌ Unexpected sign in error:", errorMessage);
    
    toast({
      title: "Authentication Error",
      description: errorMessage,
      variant: "destructive",
    });
    
    throw new Error(errorMessage);
  }
}

export async function signUp(email: string, password: string) {
  console.log("📝 Signing up with email:", email);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://talktax.app/auth/callback',
      }
    });

    if (error) {
      return handleAuthError(error);
    }

    console.log("✅ Sign up successful for:", data.user?.email);
    
    // Check if email confirmation is required
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast({
        title: "Account exists",
        description: "This email is already registered. Try signing in instead.",
      });
    } else if (data.session) {
      toast({
        title: "Account created!",
        description: "You have been automatically signed in.",
      });
    } else {
      toast({
        title: "Account created!",
        description: "Please check your email for the confirmation link.",
      });
    }
    
    return data;
  } catch (e) {
    // Handle unexpected errors
    if (e instanceof Error) {
      return handleAuthError(e);
    }
    
    // Really unknown error
    const errorMessage = 'An unknown error occurred during registration';
    console.error("❌ Unexpected sign up error:", errorMessage);
    
    toast({
      title: "Registration Error",
      description: errorMessage,
      variant: "destructive",
    });
    
    throw new Error(errorMessage);
  }
}

export async function signOut() {
  console.log("🚪 Signing out...");
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("❌ Sign out error:", error.message);
      
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
      
      throw error;
    }
    
    console.log("✅ Sign out successful");
    
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  } catch (e) {
    // Handle unexpected errors
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error("❌ Unexpected sign out error:", errorMessage);
    
    toast({
      title: "Error",
      description: "There was a problem signing out. Please try again.",
      variant: "destructive",
    });
    
    throw e;
  }
}
