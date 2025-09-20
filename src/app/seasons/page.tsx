'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { SeasonManagement } from '@/components/seasons/SeasonManagement';
import { PlayerRole } from '@prisma/client';

export default function SeasonsPage() {
  const { data: session, status } = useSession();

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white/60">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Only ADMIN users can access seasons management
  if (session.user.player?.role !== PlayerRole.ADMIN) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-white/60">Only administrators can manage seasons.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SeasonManagement />
    </MainLayout>
  );
}