
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export async function signIn(email: string, password: string) {
  console.log("🔑 Signing in with email:", email);
  
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

  console.log("✅ Sign in successful:", data.user?.email);
  
  toast({
    title: "Welcome back!",
    description: "You have successfully signed in.",
  });
  
  return data;
}

export async function signUp(email: string, password: string) {
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
  
  return data;
}

export async function signOut() {
  console.log("🚪 Signing out...");
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error("❌ Sign out error:", error.message);
    
    toast({
      title: "Error",
      description: "Failed to sign out.",
      variant: "destructive",
    });
    
    throw error;
  }
  
  console.log("✅ Sign out successful");
  
  toast({
    title: "Signed out",
    description: "You have been successfully signed out.",
  });
}
