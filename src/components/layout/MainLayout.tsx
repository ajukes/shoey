'use client';

import { MobileNavigation } from './MobileNavigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-background">
      <MobileNavigation />
      
      {/* Main Content */}
      <main className="md:ml-64 pb-20 md:pb-0">
        <div className="px-4 md:px-6 py-6 pt-16 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}