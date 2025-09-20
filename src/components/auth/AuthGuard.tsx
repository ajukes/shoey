'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';

interface AuthGuardProps {
  children: React.ReactNode;
  requirePlayer?: boolean;
}

export function AuthGuard({ children, requirePlayer = true }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      // Not authenticated, redirect to sign in
      router.push('/auth/signin');
      return;
    }

    if (requirePlayer && !session.user?.player) {
      // Authenticated but no player profile
      router.push('/auth/no-player');
      return;
    }
  }, [session, status, router, requirePlayer]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <GlassCard className="p-8">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Show loading while redirecting
  if (!session || (requirePlayer && !session.user?.player)) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <GlassCard className="p-8">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Redirecting...</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Authenticated and has required permissions
  return <>{children}</>;
}