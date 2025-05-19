
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export async function signIn(email: string, password: string) {
  console.log("🔑 Signing in with email:", email);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("❌ Sign in error:", error.message);
      
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive",
      });
      
      throw error;
    }

    console.log("✅ Sign in successful for:", data.user?.email);
    
    toast({
      title: "Welcome back!",
      description: "You have successfully signed in.",
    });
    
    return data;
  } catch (e) {
    // Handle unexpected errors
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error("❌ Unexpected sign in error:", errorMessage);
    
    toast({
      title: "Authentication Error",
      description: "There was a problem signing in. Please try again.",
      variant: "destructive",
    });
    
    throw e;
  }
}

export async function signUp(email: string, password: string) {
  console.log("📝 Signing up with email:", email);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      }
    });

    if (error) {
      console.error("❌ Sign up error:", error.message);
      
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive",
      });
      
      throw error;
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
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error("❌ Unexpected sign up error:", errorMessage);
    
    toast({
      title: "Registration Error",
      description: "There was a problem creating your account. Please try again.",
      variant: "destructive",
    });
    
    throw e;
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
