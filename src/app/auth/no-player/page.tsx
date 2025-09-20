'use client';

import { signOut } from 'next-auth/react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { AlertCircle, LogOut } from 'lucide-react';

export default function NoPlayer() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md text-center">
        <div className="mb-6">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Player Profile Required
          </h1>
          <p className="text-white/60">
            You need a player profile to access Shoey. Please contact your team administrator to set up your profile.
          </p>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-white/60 bg-white/5 p-4 rounded-lg">
            <p className="mb-2">
              <strong>What you need to do:</strong>
            </p>
            <ul className="text-left space-y-1">
              <li>• Contact your team manager or captain</li>
              <li>• Ask them to create your player profile</li>
              <li>• Make sure they use the same email address you signed in with</li>
            </ul>
          </div>

          <GlassButton
            variant="secondary"
            fullWidth
            icon={LogOut}
            onClick={handleSignOut}
          >
            Sign Out
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
}