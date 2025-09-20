'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MainLayout } from '@/components/layout/MainLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassTable } from '@/components/ui/GlassTable';
import { GlassModal } from '@/components/ui/GlassModal';
import { PlayerForm } from '@/components/forms/PlayerForm';
import { PlayerRole } from '@prisma/client';
import {
  Users,
  Plus,
  Mail,
  Phone,
  Shield,
  Crown,
  Star,
  User
} from 'lucide-react';

interface Player {
  id: string;
  fullName: string;
  nickname?: string;
  email?: string;
  mobileNumber?: string;
  avatar?: string;
  role: PlayerRole;
  club: {
    id: string;
    name: string;
  };
  team: {
    id: string;
    name: string;
  };
  playingPosition?: {
    id: string;
    name: string;
    category: string;
  };
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export default function PlayersPage() {
  const { data: session } = useSession();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/players');
      if (response.ok) {
        const data = await response.json();
        setPlayers(data);
      } else {
        console.error('Failed to fetch players');
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlayer = async (data: any) => {
    try {
      setFormLoading(true);
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchPlayers();
        setShowCreateModal(false);
      } else {
        const error = await response.json();
        console.error('Failed to create player:', error);
        throw new Error(error.error || 'Failed to create player');
      }
    } catch (error) {
      console.error('Error creating player:', error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditPlayer = async (data: any) => {
    if (!editingPlayer) return;

    try {
      setFormLoading(true);
      const response = await fetch(`/api/players/${editingPlayer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchPlayers();
        setShowEditModal(false);
        setEditingPlayer(null);
      } else {
        const error = await response.json();
        console.error('Failed to update player:', error);
        throw new Error(error.error || 'Failed to update player');
      }
    } catch (error) {
      console.error('Error updating player:', error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleRowClick = (player: Player) => {
    if (canManagePlayers()) {
      setEditingPlayer(player);
      setShowEditModal(true);
    }
  };

  const getRoleIcon = (role: PlayerRole) => {
    switch (role) {
      case PlayerRole.ADMIN:
        return Crown;
      case PlayerRole.MANAGER:
        return Shield;
      case PlayerRole.CAPTAIN:
        return Star;
      default:
        return User;
    }
  };

  const getRoleColor = (role: PlayerRole) => {
    switch (role) {
      case PlayerRole.ADMIN:
        return 'text-yellow-400';
      case PlayerRole.MANAGER:
        return 'text-purple-400';
      case PlayerRole.CAPTAIN:
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const canManagePlayers = () => {
    const userRole = session?.user?.player?.role;
    return userRole === PlayerRole.ADMIN ||
           userRole === PlayerRole.MANAGER;
  };

  const columns = [
    {
      key: 'fullName' as keyof Player,
      header: 'Name',
      render: (value: any, row: Player) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-gradient-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm md:text-base font-medium">
              {row.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white font-medium text-sm md:text-base truncate">
              {row.fullName}
            </div>
            {row.nickname && (
              <div className="text-white/60 text-xs md:text-sm truncate">
                "{row.nickname}"
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'role' as keyof Player,
      header: 'Role',
      render: (value: any, row: Player) => {
        const Icon = getRoleIcon(row.role);
        return (
          <div className="flex items-center space-x-2">
            <Icon size={16} className={getRoleColor(row.role)} />
            <span className={`text-xs md:text-sm font-medium ${getRoleColor(row.role)} truncate`}>
              {row.role}
            </span>
          </div>
        );
      },
    },
    {
      key: 'team' as keyof Player,
      header: 'Team',
      render: (value: any, row: Player) => (
        <div className="min-w-0">
          <div className="text-white text-xs md:text-sm font-medium truncate">
            {row.team.name}
          </div>
          <div className="text-white/60 text-xs truncate">
            {row.club.name}
          </div>
        </div>
      ),
    },
    {
      key: 'playingPosition' as keyof Player,
      header: 'Position',
      mobileHidden: true,
      render: (value: any, row: Player) => (
        <div className="text-white/80 text-sm">
          {row.playingPosition?.name || 'Not assigned'}
        </div>
      ),
    },
    {
      key: 'email' as keyof Player,
      header: 'Contact',
      mobileHidden: true,
      render: (value: any, row: Player) => (
        <div className="space-y-1">
          {row.email ? (
            <div className="flex items-center space-x-2 text-white/80 text-xs">
              <Mail size={12} />
              <span>{row.email}</span>
              {row.user && (
                <div className="w-2 h-2 bg-green-400 rounded-full" title="Linked Account" />
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-white/40 text-xs">
              <Mail size={12} />
              <span>No email</span>
            </div>
          )}
          {row.mobileNumber ? (
            <div className="flex items-center space-x-2 text-white/60 text-xs">
              <Phone size={12} />
              <span>{row.mobileNumber}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-white/40 text-xs">
              <Phone size={12} />
              <span>No phone</span>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6 px-4 md:px-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Players
            </h1>
            <p className="text-white/60">
              Manage your team roster and player information
            </p>
          </div>

          {canManagePlayers() && (
            <GlassButton
              variant="primary"
              icon={Plus}
              onClick={() => setShowCreateModal(true)}
            >
              Add Player
            </GlassButton>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-6">
          <GlassCard padding="xs" className="text-center">
            <div className="flex items-center space-x-2 sm:flex-col sm:space-x-0 sm:space-y-2 sm:text-center">
              <div className="inline-flex p-1.5 sm:p-2 rounded-lg bg-blue-500/20 text-blue-400 ml-2 sm:ml-0 sm:mt-2">
                <Users size={16} className="sm:hidden" />
                <Users size={20} className="hidden sm:block" />
              </div>
              <div className="min-w-0 flex-1 sm:flex-initial">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 sm:mb-1">
                  {players.length}
                </div>
                <div className="text-xs md:text-sm text-white/60 leading-tight">
                  Total Players
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="xs" className="text-center">
            <div className="flex items-center space-x-2 sm:flex-col sm:space-x-0 sm:space-y-2 sm:text-center">
              <div className="inline-flex p-1.5 sm:p-2 rounded-lg bg-purple-500/20 text-purple-400 ml-2 sm:ml-0 sm:mt-2">
                <Shield size={16} className="sm:hidden" />
                <Shield size={20} className="hidden sm:block" />
              </div>
              <div className="min-w-0 flex-1 sm:flex-initial">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 sm:mb-1">
                  {players.filter(p => p.role === PlayerRole.MANAGER).length}
                </div>
                <div className="text-xs md:text-sm text-white/60 leading-tight">
                  Managers
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="xs" className="text-center">
            <div className="flex items-center space-x-2 sm:flex-col sm:space-x-0 sm:space-y-2 sm:text-center">
              <div className="inline-flex p-1.5 sm:p-2 rounded-lg bg-blue-500/20 text-blue-400 ml-2 sm:ml-0 sm:mt-2">
                <Star size={16} className="sm:hidden" />
                <Star size={20} className="hidden sm:block" />
              </div>
              <div className="min-w-0 flex-1 sm:flex-initial">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 sm:mb-1">
                  {players.filter(p => p.role === PlayerRole.CAPTAIN).length}
                </div>
                <div className="text-xs md:text-sm text-white/60 leading-tight">
                  Captains
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="xs" className="text-center">
            <div className="flex items-center space-x-2 sm:flex-col sm:space-x-0 sm:space-y-2 sm:text-center">
              <div className="inline-flex p-1.5 sm:p-2 rounded-lg bg-green-500/20 text-green-400 ml-2 sm:ml-0 sm:mt-2">
                <User size={16} className="sm:hidden" />
                <User size={20} className="hidden sm:block" />
              </div>
              <div className="min-w-0 flex-1 sm:flex-initial">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 sm:mb-1">
                  {players.filter(p => p.user).length}
                </div>
                <div className="text-xs md:text-sm text-white/60 leading-tight">
                  Linked Accounts
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Players Table */}
        <GlassCard>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-lg md:text-xl font-semibold text-white">Team Roster</h2>
            <div className="text-sm text-white/60">
              {loading ? 'Loading...' : `${players.length} players`}
            </div>
          </div>

          {/* Mobile hint */}
          <div className="md:hidden mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-300 text-center">
              {canManagePlayers() ? 'Tap any player card to edit' : 'Viewing player roster'}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8 md:py-12">
              <div className="text-white/60">Loading players...</div>
            </div>
          ) : (
            <GlassTable
              data={players}
              columns={columns}
              onRowClick={handleRowClick}
            />
          )}
        </GlassCard>
      </div>

      {/* Create Player Modal */}
      <GlassModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Player"
        size="lg"
      >
        <PlayerForm
          onSubmit={handleCreatePlayer}
          onCancel={() => setShowCreateModal(false)}
          loading={formLoading}
        />
      </GlassModal>

      {/* Edit Player Modal */}
      <GlassModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingPlayer(null);
        }}
        title="Edit Player"
        size="lg"
      >
        <PlayerForm
          player={editingPlayer}
          onSubmit={handleEditPlayer}
          onCancel={() => {
            setShowEditModal(false);
            setEditingPlayer(null);
          }}
          loading={formLoading}
        />
      </GlassModal>
    </MainLayout>
  );
}