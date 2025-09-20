import { MainLayout } from '@/components/layout/MainLayout';
import { ClubManagement } from '@/components/clubs/ClubManagement';

export default function ClubsPage() {
  return (
    <MainLayout>
      <ClubManagement />
    </MainLayout>
  );
}