import { MainLayout } from '@/components/layout/MainLayout';
import { LeagueManagement } from '@/components/leagues/LeagueManagement';

export default function LeaguesPage() {
  return (
    <MainLayout>
      <LeagueManagement />
    </MainLayout>
  );
}