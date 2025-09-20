import { MainLayout } from '@/components/layout/MainLayout';
import { GameManagement } from '@/components/games/GameManagement';

export default function GamesPage() {
  return (
    <MainLayout>
      <GameManagement />
    </MainLayout>
  );
}