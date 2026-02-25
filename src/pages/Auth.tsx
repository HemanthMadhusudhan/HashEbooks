import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Lock, User, Loader2, ArrowLeft, ShieldCheck, BookOpen, Sparkles } from 'lucide-react';
import type { EmailOtpType } from '@supabase/auth-js';
import { useToast } from '@/hooks/use-toast';
import hashebooksLogo from '@/assets/hashebooks-logo.webp';
import { getUserFriendlyError } from '@/lib/errorUtils';
import { motion, AnimatePresence } from 'framer-motion';

type AuthStep = 'credentials' | 'otp-verification' | 'forgot-password' | 'reset-link-sent' | 'new-password' | 'verification-success';

// Floating orbs background component
const FloatingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Primary orb */}
    <motion.div
      className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/30 to-primary/5 blur-3xl"
      animate={{
        x: [0, 100, 0],
        y: [0, -50, 0],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{ top: '-20%', left: '-10%' }}
    />
    {/* Accent orb */}
    <motion.div
      className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-br from-accent/25 to-accent/5 blur-3xl"
      animate={{
        x: [0, -80, 0],
        y: [0, 60, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 2,
      }}
      style={{ bottom: '-10%', right: '-5%' }}
    />
    {/* Small floating particles */}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full bg-primary/40"
        animate={{
          y: [0, -30, 0],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 3 + i,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 0.5,
        }}
        style={{
          left: `${15 + i * 15}%`,
          top: `${20 + (i % 3) * 25}%`,
        }}
      />
    ))}
  </div>
);

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLinkVerifying, setIsLinkVerifying] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authStep, setAuthStep] = useState<AuthStep>('credentials');
  const [signupResendCooldown, setSignupResendCooldown] = useState(0);
  const [activeTab, setActiveTab] = useState('signin');

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [isHandlingVerification, setIsHandlingVerification] = useState(false);
  const verificationSuccessStickyRef = useRef(false);

  const getHashType = () => {
    const hash = location.hash?.startsWith('#') ? location.hash.slice(1) : location.hash;
    const hashParams = new URLSearchParams(hash || '');
    return hashParams.get('type');
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token_hash = params.get('token_hash');
    const type = params.get('type');

    if (token_hash && type) {
      setIsHandlingVerification(true);
      return;
    }

    const hashType = getHashType();
    if (hashType === 'recovery' || hashType === 'signup' || hashType === 'magiclink') {
      setIsHandlingVerification(true);
    }
  }, [location.search, location.hash]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' && verificationSuccessStickyRef.current) {
          return;
        }

        if (event === 'PASSWORD_RECOVERY' && session) {
          setAuthStep('new-password');
          window.history.replaceState({}, '', '/auth');
          return;
        }

        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          const hashType = getHashType();
          if (hashType === 'signup' || hashType === 'magiclink') {
            verificationSuccessStickyRef.current = true;
            setAuthStep('verification-success');
            setIsHandlingVerification(false);
            window.history.replaceState({}, '', '/auth');

            setTimeout(() => {
              supabase.auth.signOut();
            }, 0);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [location.hash]);

  useEffect(() => {
    if (!isHandlingVerification) return;

    const hashType = getHashType();
    if (hashType !== 'signup' && hashType !== 'magiclink') return;

    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (!session) return;

      verificationSuccessStickyRef.current = true;
      setAuthStep('verification-success');
      setIsHandlingVerification(false);
      window.history.replaceState({}, '', '/auth');

      setTimeout(() => {
        supabase.auth.signOut();
      }, 0);
    });

    return () => {
      cancelled = true;
    };
  }, [isHandlingVerification, location.hash]);

  useEffect(() => {
    if (!isHandlingVerification) return;
    
    const params = new URLSearchParams(location.search);
    const token_hash = params.get('token_hash');
    const type = params.get('type');

    if (!token_hash || !type) return;

    let cancelled = false;

    setIsLinkVerifying(true);
    setIsLoading(true);

    supabase.auth
      .verifyOtp({ token_hash, type: type as EmailOtpType })
      .then(async ({ data, error }) => {
        if (cancelled) return;

        if (error) {
          toast({
            title: 'Verification failed',
            description: getUserFriendlyError(error),
            variant: 'destructive',
          });
          setIsHandlingVerification(false);
          navigate('/auth', { replace: true });
          return;
        }

        if (type === 'recovery') {
          setAuthStep('new-password');
          setIsHandlingVerification(false);
          window.history.replaceState({}, '', '/auth');
          return;
        }

        verificationSuccessStickyRef.current = true;
        setAuthStep('verification-success');
        setIsHandlingVerification(false);
        window.history.replaceState({}, '', '/auth');

        setTimeout(() => {
          supabase.auth.signOut();
        }, 0);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
        setIsLinkVerifying(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isHandlingVerification, location.search, navigate, toast]);

  useEffect(() => {
    if (signupResendCooldown <= 0) return;

    const t = window.setInterval(() => {
      setSignupResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);

    return () => window.clearInterval(t);
  }, [signupResendCooldown]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign in failed",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      navigate('/');
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const redirectUrl = `${window.location.origin}/auth`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      toast({
        title: "Sign up failed",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } else if (data.user && data.user.identities?.length === 0) {
      toast({
        title: "User already exists",
        description: "An account with this email already exists. Please sign in instead.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email",
        description: "Verification email sent. Please verify and then login.",
      });
      setAuthStep('otp-verification');
    }

    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    if (!email) return;
    if (signupResendCooldown > 0) return;

    setIsLoading(true);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
      },
    });

    if (error) {
      toast({
        title: "Failed to resend",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } else {
      setSignupResendCooldown(30);
      toast({
        title: "Email resent",
        description: "Check inbox and spam for the verification email.",
      });
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      toast({
        title: "Failed to send reset link",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } else {
      setAuthStep('reset-link-sent');
    }

    setIsLoading(false);
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      toast({
        title: "Failed to update password",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password updated!",
        description: "Your password has been reset successfully.",
      });
      navigate('/');
    }

    setIsLoading(false);
  };

  const handleBackToCredentials = () => {
    setAuthStep('credentials');
    setActiveTab('signin');
    setPassword('');
    setConfirmPassword('');
  };

  // Verification Success Screen
  if (authStep === 'verification-success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <FloatingOrbs />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="glass-card border-border/50 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                className="flex items-center justify-center gap-3 pt-4"
              >
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25">
                  <ShieldCheck className="w-10 h-10 text-primary-foreground" />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <CardTitle className="font-serif text-2xl gradient-text">Verification Successful</CardTitle>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <CardDescription className="text-base">
                  Your email has been verified successfully.
                </CardDescription>
              </motion.div>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button 
                  onClick={handleBackToCredentials}
                  className="w-full h-12 font-medium glass-button hover:scale-[1.02] transition-all duration-300"
                >
                  Continue to Sign In
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Email Verification Sent Step (Sign Up)
  if (authStep === 'otp-verification') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <FloatingOrbs />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="glass-card border-border/50 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex items-center justify-center gap-3 pt-4"
              >
                <motion.div 
                  className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25"
                  animate={{ 
                    boxShadow: [
                      "0 10px 40px -10px hsl(var(--primary) / 0.3)",
                      "0 10px 60px -10px hsl(var(--primary) / 0.5)",
                      "0 10px 40px -10px hsl(var(--primary) / 0.3)",
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Mail className="w-10 h-10 text-primary-foreground" />
                </motion.div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <CardTitle className="font-serif text-2xl gradient-text">Check Your Email</CardTitle>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <CardDescription className="text-base">
                  Email verification has been sent to<br />
                  <span className="font-medium text-foreground">{email}</span>
                  <br /><br />
                  Please verify it and then login.
                </CardDescription>
              </motion.div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button 
                  onClick={handleBackToCredentials}
                  className="w-full h-12 font-medium bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02]"
                >
                  Go to Sign In
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-center"
              >
                <p className="text-sm text-muted-foreground mb-2">
                  {"Didn't receive the email?"}
                </p>
                <Button 
                  type="button" 
                  variant="link" 
                  onClick={handleResendOtp}
                  disabled={isLoading || signupResendCooldown > 0}
                  className="text-primary hover:text-primary/80"
                >
                  {signupResendCooldown > 0 ? `Resend in ${signupResendCooldown}s` : 'Resend Email'}
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Forgot Password Step
  if (authStep === 'forgot-password') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <FloatingOrbs />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="glass-card border-border/50 shadow-2xl">
            <CardHeader className="text-center space-y-4 relative">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToCredentials}
                  className="absolute left-4 top-4 hover:bg-primary/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </motion.div>
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex items-center justify-center gap-3 pt-4"
              >
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                  <Mail className="w-10 h-10 text-primary-foreground" />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <CardTitle className="font-serif text-2xl gradient-text">Reset Password</CardTitle>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <CardDescription className="text-base">
                  Enter your email address and we'll send you a code to reset your password.
                </CardDescription>
              </motion.div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-2"
                >
                  <Label htmlFor="reset-email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Button 
                    type="submit" 
                    className="w-full h-12 font-medium bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02]" 
                    disabled={isLoading || !email}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      'Send Reset Code'
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Reset Link Sent Step
  if (authStep === 'reset-link-sent') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <FloatingOrbs />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="glass-card border-border/50 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex items-center justify-center gap-3 pt-4"
              >
                <motion.div 
                  className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-10 h-10 text-primary-foreground" />
                </motion.div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <CardTitle className="font-serif text-2xl gradient-text">Reset Link Sent</CardTitle>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <CardDescription className="text-base">
                  Password reset link has been sent to<br />
                  <span className="font-medium text-foreground">{email}</span>
                  <br /><br />
                  Please check your email and click the link to reset your password.
                </CardDescription>
              </motion.div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button 
                  onClick={handleBackToCredentials}
                  className="w-full h-12 font-medium bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02]"
                >
                  Go to Sign In
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Set New Password Step
  if (authStep === 'new-password') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <FloatingOrbs />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="glass-card border-border/50 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex items-center justify-center gap-3"
              >
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                  <ShieldCheck className="w-10 h-10 text-primary-foreground" />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <CardTitle className="font-serif text-2xl gradient-text">Set New Password</CardTitle>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <CardDescription className="text-base">
                  Create a strong password for your account.
                </CardDescription>
              </motion.div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-2"
                >
                  <Label htmlFor="new-password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-12 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-2"
                >
                  <Label htmlFor="confirm-password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-12 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <Button 
                    type="submit" 
                    className="w-full h-12 font-medium bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02]" 
                    disabled={isLoading || !password || !confirmPassword}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating password...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Main Auth Screen with Tabs
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingOrbs />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="glass-card border-border/50 shadow-2xl overflow-hidden">
          <CardHeader className="text-center space-y-4 pb-2">
            <motion.div 
              className="flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.img 
                src={hashebooksLogo} 
                alt="HashEBooks" 
                className="h-24 w-auto drop-shadow-lg"
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <CardDescription className="text-base flex items-center justify-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Upload, share, and read books for free
                <Sparkles className="w-4 h-4 text-accent" />
              </CardDescription>
            </motion.div>
          </CardHeader>
          
          <CardContent className="pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1">
                  <TabsTrigger 
                    value="signin" 
                    className="font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    className="font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>
              </motion.div>
              
              <AnimatePresence mode="wait">
                <TabsContent value="signin" key="signin">
                  <motion.form 
                    onSubmit={handleSignIn} 
                    className="space-y-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="signin-email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        Email
                      </Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                      />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="signin-password" className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        Password
                      </Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                      />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Button 
                        type="submit" 
                        className="w-full h-12 font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02]" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          'Sign In'
                        )}
                      </Button>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-center"
                    >
                      <Button 
                        type="button" 
                        variant="link" 
                        onClick={() => setAuthStep('forgot-password')}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        Forgot your password?
                      </Button>
                    </motion.div>
                  </motion.form>
                </TabsContent>
                
                <TabsContent value="signup" key="signup">
                  <motion.form 
                    onSubmit={handleSignUp} 
                    className="space-y-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="signup-name" className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        Display Name
                      </Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                      />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="signup-email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        Email
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                      />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="signup-password" className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        Password
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                      />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Button 
                        type="submit" 
                        className="w-full h-12 font-medium bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all duration-300 hover:scale-[1.02]" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Verify Email!
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.form>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </CardContent>
        </Card>

        {/* Decorative elements */}
        <motion.div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full blur-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
    </div>
  );
};

export default Auth;
