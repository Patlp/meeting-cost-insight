
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { setRememberMe } from '@/utils/customStorage';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true); // Default to remember
  const { signIn, signUp, loading, session, authError } = useAuth();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [displayError, setDisplayError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Add effect to redirect after successful login
  useEffect(() => {
    if (!loading && session?.user) {
      console.log("✅ Redirecting after login...");
      navigate("/");
    }
  }, [session, loading, navigate]);
  
  // Update error display when authError changes
  useEffect(() => {
    if (authError) {
      setDisplayError(authError);
    } else {
      setDisplayError(null);
    }
  }, [authError]);
  
  // Check for specific error parameters in URL (from failed redirects)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has('error') || params.has('error_description')) {
      const errorMsg = params.get('error_description') || params.get('error') || 'Authentication error';
      setDisplayError(errorMsg);
    }
  }, [location.search]);

  // Redirect if user is already logged in
  if (session) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisplayError(null);
    setIsSigningIn(true);
    
    // Update remember me preference before signing in
    setRememberMe(remember);
    
    try {
      await signIn(email, password);
    } catch (err: any) {
      setDisplayError(err.message || 'Sign in failed');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisplayError(null);
    setIsSigningUp(true);
    
    // Update remember me preference before signing up
    setRememberMe(remember);
    
    try {
      await signUp(email, password);
      setActiveTab('signin'); // Switch to sign in tab after signup
    } catch (err: any) {
      setDisplayError(err.message || 'Sign up failed');
    } finally {
      setIsSigningUp(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Handler for remember me checkbox
  const handleRememberChange = (checked: boolean) => {
    setRemember(checked);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary">TalkTax</h1>
          <p className="mt-2 text-gray-600">Sign in to access your account</p>
        </div>

        {displayError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Enter your email below to sign in or create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input 
                        id="signin-email" 
                        type="email" 
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input 
                        id="signin-password" 
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button 
                        type="button" 
                        onClick={togglePasswordVisibility} 
                        className="absolute right-3 top-2.5 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember" 
                      checked={remember} 
                      onCheckedChange={handleRememberChange}
                    />
                    <Label 
                      htmlFor="remember" 
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSigningIn || loading}>
                    {isSigningIn ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input 
                        id="signup-email" 
                        type="email" 
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input 
                        id="signup-password" 
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button 
                        type="button" 
                        onClick={togglePasswordVisibility} 
                        className="absolute right-3 top-2.5 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember-signup" 
                      checked={remember} 
                      onCheckedChange={handleRememberChange}
                    />
                    <Label 
                      htmlFor="remember-signup" 
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSigningUp || loading}>
                    {isSigningUp ? "Creating Account..." : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <p className="text-sm text-gray-500 text-center w-full">
              Secure authentication powered by Supabase
            </p>
            <p className="text-xs text-gray-400 text-center w-full">
              {remember ? 'Your session will persist until you log out.' : 'Your session will end when you close the browser.'}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
