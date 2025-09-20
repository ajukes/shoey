import { MainLayout } from '@/components/layout/MainLayout';
import { RulesManagement } from '@/components/rules/RulesManagement';

export default function RulesPage() {
  // In a real app, we'd get teamId from session/auth
  const teamId = "1";

  return (
    <MainLayout>
      <RulesManagement teamId={teamId} />
    </MainLayout>
  );
}