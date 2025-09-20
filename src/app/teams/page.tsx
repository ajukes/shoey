import { MainLayout } from '@/components/layout/MainLayout';
import { TeamManagement } from '@/components/teams/TeamManagement';

export default function TeamsPage() {
  return (
    <MainLayout>
      <TeamManagement />
    </MainLayout>
  );
}