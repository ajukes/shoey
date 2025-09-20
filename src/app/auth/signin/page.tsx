'use client';

import { signIn, getSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push('/');
      }
    });
  }, [router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google', {
        callbackUrl: '/'
      });
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome to Shoey
          </h1>
          <p className="text-white/60 mb-6">
            Sign in to manage your hockey team
          </p>

          <GlassButton
            variant="primary"
            fullWidth
            onClick={handleGoogleSignIn}
            loading={loading}
          >
            Sign in with Google
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
}