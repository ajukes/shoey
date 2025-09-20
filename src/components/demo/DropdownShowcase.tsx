'use client';

import React, { useState } from 'react';
import { EnhancedGlassDropdown, DropdownOption } from '@/components/ui/EnhancedGlassDropdown';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Star,
  Shield,
  Crown,
  Trophy,
  Zap,
  Database,
  Settings,
  Users
} from 'lucide-react';

const sampleOptions: DropdownOption[] = [
  {
    value: 'john',
    label: 'John Doe',
    description: 'Software Engineer',
    icon: User,
    badge: 'Online',
    color: 'success'
  },
  {
    value: 'jane',
    label: 'Jane Smith',
    description: 'Product Manager',
    icon: User,
    badge: 'Away',
    color: 'warning'
  },
  {
    value: 'bob',
    label: 'Bob Johnson',
    description: 'Designer',
    icon: User,
    color: 'primary'
  },
  {
    value: 'alice',
    label: 'Alice Brown',
    description: 'Data Scientist',
    icon: User,
    disabled: true
  }
];

const teamOptions: DropdownOption[] = [
  {
    value: 'captain',
    label: 'Team Captain',
    description: 'Lead the team and make decisions',
    icon: Crown,
    color: 'warning'
  },
  {
    value: 'manager',
    label: 'Manager',
    description: 'Manage team operations',
    icon: Shield,
    color: 'primary'
  },
  {
    value: 'player',
    label: 'Player',
    description: 'Active team member',
    icon: Users,
    color: 'success'
  }
];

const settingsGroups = [
  {
    label: 'User Settings',
    options: [
      { value: 'profile', label: 'Profile Settings', icon: User },
      { value: 'notifications', label: 'Notifications', icon: Mail },
      { value: 'privacy', label: 'Privacy', icon: Shield }
    ]
  },
  {
    label: 'Team Settings',
    options: [
      { value: 'team-info', label: 'Team Information', icon: Users },
      { value: 'variables', label: 'Variables', icon: Database },
      { value: 'rules', label: 'Rules', icon: Zap }
    ]
  },
  {
    label: 'System',
    options: [
      { value: 'general', label: 'General Settings', icon: Settings },
      { value: 'advanced', label: 'Advanced', icon: Trophy, badge: 'Pro' }
    ]
  }
];

export function DropdownShowcase() {
  const [singleValue, setSingleValue] = useState('');
  const [multipleValues, setMultipleValues] = useState<string[]>([]);
  const [searchableValue, setSearchableValue] = useState('');
  const [teamRole, setTeamRole] = useState('');
  const [settingsValue, setSettingsValue] = useState('');
  const [limitedMultiple, setLimitedMultiple] = useState<string[]>([]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Enhanced Glassmorphic Dropdown Showcase</h2>
        <p className="text-white/70">
          A comprehensive dropdown component with advanced features, glassmorphic design, and full accessibility.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Dropdown */}
        <GlassCard>
          <h3 className="text-lg font-semibold text-white mb-4">Basic Dropdown</h3>
          <EnhancedGlassDropdown
            label="Select User"
            value={singleValue}
            onChange={(value) => setSingleValue(value as string)}
            options={sampleOptions}
            placeholder="Choose a user..."
            helperText="Select a user from the list"
          />
        </GlassCard>

        {/* Multiple Selection */}
        <GlassCard>
          <h3 className="text-lg font-semibold text-white mb-4">Multiple Selection</h3>
          <EnhancedGlassDropdown
            label="Select Team Members"
            value={multipleValues}
            onChange={(values) => setMultipleValues(values as string[])}
            options={sampleOptions}
            multiple
            showSelectAll
            clearable
            placeholder="Choose team members..."
            helperText="Select multiple users"
          />
        </GlassCard>

        {/* Searchable */}
        <GlassCard>
          <h3 className="text-lg font-semibold text-white mb-4">Searchable</h3>
          <EnhancedGlassDropdown
            label="Search Users"
            value={searchableValue}
            onChange={(value) => setSearchableValue(value as string)}
            options={sampleOptions}
            searchable
            clearable
            placeholder="Search and select..."
            size="lg"
            variant="bordered"
            helperText="Type to search through options"
          />
        </GlassCard>

        {/* Team Roles with Icons and Colors */}
        <GlassCard>
          <h3 className="text-lg font-semibold text-white mb-4">Styled Options</h3>
          <EnhancedGlassDropdown
            label="Team Role"
            value={teamRole}
            onChange={(value) => setTeamRole(value as string)}
            options={teamOptions}
            size="md"
            variant="minimal"
            placeholder="Select your role..."
            helperText="Choose your team role"
          />
        </GlassCard>

        {/* Grouped Options */}
        <GlassCard>
          <h3 className="text-lg font-semibold text-white mb-4">Grouped Options</h3>
          <EnhancedGlassDropdown
            label="Settings Category"
            value={settingsValue}
            onChange={(value) => setSettingsValue(value as string)}
            groups={settingsGroups}
            searchable
            placeholder="Choose settings..."
            maxHeight={400}
            helperText="Organized in groups for better navigation"
          />
        </GlassCard>

        {/* Limited Multiple Selection */}
        <GlassCard>
          <h3 className="text-lg font-semibold text-white mb-4">Limited Selection</h3>
          <EnhancedGlassDropdown
            label="Select Max 2 Users"
            value={limitedMultiple}
            onChange={(values) => setLimitedMultiple(values as string[])}
            options={sampleOptions}
            multiple
            maxSelections={2}
            clearable
            placeholder="Choose up to 2 users..."
            helperText="Maximum 2 selections allowed"
          />
        </GlassCard>

        {/* Modal Version */}
        <GlassCard>
          <h3 className="text-lg font-semibold text-white mb-4">Modal Version</h3>
          <EnhancedGlassDropdown
            label="Modal Selection"
            value={multipleValues}
            onChange={(values) => setMultipleValues(values as string[])}
            options={sampleOptions}
            multiple
            modal
            searchable
            showSelectAll
            placeholder="Open modal to select..."
            helperText="Opens in center of screen"
          />
        </GlassCard>
      </div>

      {/* Feature Showcase */}
      <GlassCard>
        <h3 className="text-lg font-semibold text-white mb-4">Features Overview</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-white/80">
          <div className="space-y-2">
            <h4 className="font-semibold text-white">Core Features</h4>
            <ul className="space-y-1">
              <li>• Single & multiple selection</li>
              <li>• Searchable options</li>
              <li>• Grouped options</li>
              <li>• Keyboard navigation</li>
              <li>• Loading states</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-white">Visual Features</h4>
            <ul className="space-y-1">
              <li>• Glassmorphic design</li>
              <li>• Custom icons & colors</li>
              <li>• Badges & descriptions</li>
              <li>• 3 size variants</li>
              <li>• 3 style variants</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-white">Advanced Features</h4>
            <ul className="space-y-1">
              <li>• Selection limits</li>
              <li>• Custom rendering</li>
              <li>• Error states</li>
              <li>• Helper text</li>
              <li>• Disabled options</li>
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* Current Selections */}
      <GlassCard>
        <h3 className="text-lg font-semibold text-white mb-4">Current Selections</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-white/70 mb-1">Single Selection:</div>
            <div className="text-white font-mono bg-white/10 p-2 rounded">
              {singleValue || 'None'}
            </div>
          </div>
          
          <div>
            <div className="text-white/70 mb-1">Multiple Selection:</div>
            <div className="text-white font-mono bg-white/10 p-2 rounded">
              {multipleValues.length > 0 ? JSON.stringify(multipleValues) : 'None'}
            </div>
          </div>
          
          <div>
            <div className="text-white/70 mb-1">Team Role:</div>
            <div className="text-white font-mono bg-white/10 p-2 rounded">
              {teamRole || 'None'}
            </div>
          </div>
          
          <div>
            <div className="text-white/70 mb-1">Settings:</div>
            <div className="text-white font-mono bg-white/10 p-2 rounded">
              {settingsValue || 'None'}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}