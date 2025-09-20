'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { MainLayout } from '@/components/layout/MainLayout';
import { RulesProfileCard } from '@/components/rules-profiles/RulesProfileCard';
import { CreateRulesProfileModal } from '@/components/rules-profiles/CreateRulesProfileModal';

interface RulesProfile {
  id: string;
  name: string;
  description?: string;
  isClubDefault: boolean;
  isActive: boolean;
  club: {
    id: string;
    name: string;
  };
  rules: Array<{
    id: string;
    ruleId: string;
    customPoints?: number;
    isEnabled: boolean;
    rule: {
      id: string;
      name: string;
      description?: string;
      category: string;
      pointsAwarded: number;
    };
  }>;
  teams: Array<{
    id: string;
    name: string;
  }>;
  _count: {
    rules: number;
    teams: number;
  };
}

export default function RulesProfilesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rulesProfiles, setRulesProfiles] = useState<RulesProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchRulesProfiles();
  }, [session, status, router]);

  const fetchRulesProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rules-profiles');

      if (!response.ok) {
        throw new Error('Failed to fetch rules profiles');
      }

      const data = await response.json();
      setRulesProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (profileData: any) => {
    try {
      const response = await fetch('/api/rules-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create profile');
      }

      await fetchRulesProfiles();
      setShowCreateModal(false);
    } catch (err) {
      throw err;
    }
  };

  const handleEditProfile = (profile: RulesProfile) => {
    router.push(`/rules-profiles/${profile.id}/edit`);
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this rules profile?')) {
      return;
    }

    try {
      const response = await fetch(`/api/rules-profiles/${profileId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete profile');
      }

      await fetchRulesProfiles();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete profile');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-64">
            <div className="text-white/70">Loading rules profiles...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <GlassCard className="p-6 text-center">
            <div className="text-red-400 mb-4">Error loading rules profiles</div>
            <p className="text-white/70 mb-4">{error}</p>
            <GlassButton onClick={fetchRulesProfiles}>
              Try Again
            </GlassButton>
          </GlassCard>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Rules Profiles</h1>
            <p className="text-white/70">
              Manage club rules profiles and point configurations
            </p>
          </div>
          <GlassButton
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Profile
          </GlassButton>
        </div>

        {/* Rules Profiles Grid */}
        {rulesProfiles.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <div className="text-white/70 mb-4">No rules profiles found</div>
            <p className="text-white/50 mb-6">
              Create your first rules profile to start managing team scoring rules
            </p>
            <GlassButton onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Profile
            </GlassButton>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rulesProfiles.map((profile) => (
              <RulesProfileCard
                key={profile.id}
                profile={profile}
                onEdit={() => handleEditProfile(profile)}
                onDelete={() => handleDeleteProfile(profile.id)}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <CreateRulesProfileModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateProfile}
          />
        )}
      </div>
    </MainLayout>
  );
}