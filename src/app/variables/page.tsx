import { MainLayout } from '@/components/layout/MainLayout';
import { VariablesManagement } from '@/components/variables/VariablesManagement';

export default function VariablesPage() {
  // In a real app, we'd get teamId from session/auth
  const teamId = "1";

  return (
    <MainLayout>
      <VariablesManagement teamId={teamId} />
    </MainLayout>
  );
}