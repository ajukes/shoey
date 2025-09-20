'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Home,
  Trophy,
  Users,
  Calendar,
  Settings,
  Menu,
  X,
  Zap,
  Database,
  Building2,
  Shield,
  LogOut,
  User,
  Target,
  Monitor,
} from 'lucide-react';
import { PlayerRole } from '@prisma/client';
import { GlassButton } from '@/components/ui/GlassButton';
import { useSession } from '@/lib/auth';

const baseNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/wallboard', label: 'Live Scores', icon: Monitor },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/leagues', label: 'Leagues', icon: Trophy },
  { href: '/clubs', label: 'Clubs', icon: Building2 },
  { href: '/teams', label: 'Teams', icon: Shield },
  { href: '/games', label: 'Games', icon: Calendar },
  { href: '/players', label: 'Players', icon: Users },
  { href: '/rules', label: 'Rules', icon: Zap },
  { href: '/rules-profiles', label: 'Rules Profiles', icon: Target },
  { href: '/variables', label: 'Variables', icon: Database },
];

const adminOnlyItems = [
  { href: '/seasons', label: 'Seasons', icon: Calendar },
];

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();
  const { session, user, player, loading } = useSession();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Get navigation items based on user role
  const getNavItems = () => {
    let navItems = [...baseNavItems];

    // Add admin-only items for ADMIN users
    if (player?.role === PlayerRole.ADMIN) {
      // Add admin items to the end
      navItems.push(...adminOnlyItems);
    }

    return navItems;
  };

  const navItems = getNavItems();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <GlassButton
          variant="glass"
          size="sm"
          iconOnly
          icon={isOpen ? X : Menu}
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <nav
        className={`
          md:hidden fixed top-0 left-0 h-full w-64 z-50
          bg-glass-dark backdrop-blur-xl border-r border-white/10
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-4 pt-16">
          <div className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-primary text-white shadow-lg'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-glass-dark backdrop-blur-xl border-r border-white/10 z-30">
        <div className="p-6 w-full flex flex-col h-full">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold gradient-text">Shoey</h1>

              {/* User Avatar */}
              {user && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || 'User'}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                        <User size={16} className="text-white" />
                      </div>
                    )}
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-10 w-48 bg-glass-dark backdrop-blur-xl border border-white/10 rounded-lg shadow-lg z-50">
                      <div className="p-3 border-b border-white/10">
                        <div className="text-sm font-medium text-white">
                          {player?.fullName || user.name}
                        </div>
                        <div className="text-xs text-white/60">{user.email}</div>
                        {player && (
                          <div className="text-xs text-purple-400 capitalize">
                            {player.role.toLowerCase()}
                          </div>
                        )}
                      </div>

                      <div className="p-2">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-primary text-white shadow-lg'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Bottom Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-glass-dark backdrop-blur-xl border-t border-white/10 px-2 py-2">
          <div className="flex justify-around">
            {[baseNavItems[0], baseNavItems[1], baseNavItems[2], baseNavItems[5]].map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex flex-col items-center space-y-1 px-2 py-2 rounded-lg
                    transition-all duration-200
                    ${isActive
                      ? 'text-purple-400'
                      : 'text-white/60 hover:text-white'
                    }
                  `}
                >
                  <item.icon size={18} />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}