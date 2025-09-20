'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Dashboard } from '@/components/dashboard/Dashboard';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <Dashboard />
      </MainLayout>
    </AuthGuard>
  );
}