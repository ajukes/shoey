'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Database, Zap } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassTable } from '@/components/ui/GlassTable';
import { EnhancedGlassDropdown } from '@/components/ui/EnhancedGlassDropdown';
import { VariableEditor } from './VariableEditor';
import {
  CustomVariable,
  BUILTIN_GAME_VARIABLES,
  BUILTIN_PLAYER_VARIABLES,
  VARIABLE_SUGGESTIONS,
  VariableStats
} from '@/types/variables';
import { ConditionScope } from '@/types/rules';

interface VariablesManagementProps {
  teamId: string;
}

export function VariablesManagement({ teamId }: VariablesManagementProps) {
  const [customVariables, setCustomVariables] = useState<CustomVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingVariable, setEditingVariable] = useState<CustomVariable | null>(null);
  const [selectedScope, setSelectedScope] = useState<ConditionScope | 'ALL'>('ALL');

  // Combine built-in and custom variables
  const builtInVariables = [
    ...BUILTIN_GAME_VARIABLES.map(v => ({ ...v, teamId })),
    ...BUILTIN_PLAYER_VARIABLES.map(v => ({ ...v, teamId }))
  ];
  
  const allVariables = [...builtInVariables, ...customVariables];
  
  const filteredVariables = selectedScope === 'ALL'
    ? allVariables
    : allVariables.filter(variable => variable.scope === selectedScope);

  // Fetch variables on component mount
  useEffect(() => {
    fetchVariables();
  }, [teamId]);

  const fetchVariables = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/variables?teamId=${teamId}`);
      if (response.ok) {
        const variables = await response.json();
        setCustomVariables(variables);
      } else {
        console.error('Failed to fetch variables');
      }
    } catch (error) {
      console.error('Error fetching variables:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats: VariableStats = {
    totalVariables: allVariables.length,
    gameVariables: allVariables.filter(v => v.scope === ConditionScope.GAME).length,
    playerVariables: allVariables.filter(v => v.scope === ConditionScope.PLAYER).length,
    activeVariables: allVariables.filter(v => v.isActive).length,
    customVariables: customVariables.length
  };

  const handleCreateVariable = () => {
    setEditingVariable(null);
    setShowEditor(true);
  };

  const handleEditVariable = (variable: CustomVariable) => {
    if (variable.isBuiltIn) {
      alert('Built-in variables cannot be edited');
      return;
    }
    setEditingVariable(variable);
    setShowEditor(true);
  };

  const handleSaveVariable = async (variable: CustomVariable) => {
    try {
      if (editingVariable) {
        // Update existing variable
        const response = await fetch(`/api/variables/${editingVariable.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(variable),
        });

        if (response.ok) {
          const updatedVariable = await response.json();
          setCustomVariables(prev => prev.map(v => 
            v.id === editingVariable.id ? updatedVariable : v
          ));
        } else {
          const error = await response.json();
          alert('Error updating variable: ' + error.error);
          return;
        }
      } else {
        // Create new variable
        const response = await fetch('/api/variables', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...variable, teamId }),
        });

        if (response.ok) {
          const newVariable = await response.json();
          setCustomVariables(prev => [...prev, newVariable]);
        } else {
          const error = await response.json();
          alert('Error creating variable: ' + error.error);
          return;
        }
      }
      setShowEditor(false);
      setEditingVariable(null);
    } catch (error) {
      console.error('Error saving variable:', error);
      alert('Error saving variable');
    }
  };

  const handleDeleteVariable = async (variableId: string) => {
    const variable = customVariables.find(v => v.id === variableId);
    if (!variable) return;

    if (variable.isBuiltIn) {
      alert('Built-in variables cannot be deleted');
      return;
    }

    if (confirm(`Are you sure you want to delete "${variable.label}"? This may affect existing rules.`)) {
      try {
        const response = await fetch(`/api/variables/${variableId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setCustomVariables(prev => prev.filter(v => v.id !== variableId));
        } else {
          const error = await response.json();
          alert('Error deleting variable: ' + error.error);
        }
      } catch (error) {
        console.error('Error deleting variable:', error);
        alert('Error deleting variable');
      }
    }
  };

  const handleToggleActive = async (variableId?: string) => {
    if (!variableId) return;
    
    const variable = allVariables.find(v => v.id === variableId);
    if (variable?.isBuiltIn) {
      alert('Built-in variables cannot be disabled');
      return;
    }

    const customVar = customVariables.find(v => v.id === variableId);
    if (!customVar) return;

    try {
      const response = await fetch(`/api/variables/${variableId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...customVar, isActive: !customVar.isActive }),
      });

      if (response.ok) {
        const updatedVariable = await response.json();
        setCustomVariables(prev => prev.map(v => 
          v.id === variableId ? updatedVariable : v
        ));
      } else {
        const error = await response.json();
        alert('Error updating variable: ' + error.error);
      }
    } catch (error) {
      console.error('Error toggling variable:', error);
      alert('Error updating variable');
    }
  };

  const getScopeColor = (scope: ConditionScope) => {
    return scope === ConditionScope.GAME 
      ? 'text-blue-400 bg-blue-400/20'
      : 'text-green-400 bg-green-400/20';
  };

  const getDataTypeColor = (dataType: string) => {
    return dataType === 'number' 
      ? 'text-purple-400 bg-purple-400/20'
      : 'text-yellow-400 bg-yellow-400/20';
  };

  const columns = [
    {
      key: 'label' as keyof CustomVariable,
      header: 'Variable',
      render: (value: any, variable: CustomVariable) => (
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-white">{variable.label}</span>
            {variable.isBuiltIn && (
              <span className="px-1.5 py-0.5 text-xs bg-gray-500/30 text-gray-300 rounded">
                Built-in
              </span>
            )}
          </div>
          <div className="text-xs text-white/60 mt-1">{variable.key}</div>
          <div className="text-xs text-white/50 mt-1">{variable.description}</div>
        </div>
      )
    },
    {
      key: 'scope' as keyof CustomVariable,
      header: 'Scope',
      render: (value: any, variable: CustomVariable) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${getScopeColor(variable.scope)}`}>
          {variable.scope}
        </span>
      ),
      mobileHidden: true
    },
    {
      key: 'dataType' as keyof CustomVariable,
      header: 'Type',
      render: (value: any, variable: CustomVariable) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${getDataTypeColor(variable.dataType)}`}>
          {variable.dataType}
        </span>
      ),
      mobileHidden: true
    },
    {
      key: 'defaultValue' as keyof CustomVariable,
      header: 'Default',
      render: (value: any, variable: CustomVariable) => (
        <span className="text-white/80 font-mono text-sm">
          {variable.defaultValue}
        </span>
      ),
      mobileHidden: true
    },
    {
      key: 'isActive' as keyof CustomVariable,
      header: 'Status',
      render: (value: any, variable: CustomVariable) => (
        <button
          onClick={() => handleToggleActive(variable.id)}
          className="flex items-center space-x-2"
          disabled={variable.isBuiltIn}
        >
          {variable.isActive ? (
            <ToggleRight className="text-green-400" size={20} />
          ) : (
            <ToggleLeft className="text-gray-400" size={20} />
          )}
          <span className={`text-xs ${variable.isActive ? 'text-green-400' : 'text-gray-400'}`}>
            {variable.isActive ? 'Active' : 'Inactive'}
          </span>
        </button>
      )
    },
    {
      key: 'actions' as keyof CustomVariable,
      header: 'Actions',
      render: (value: any, variable: CustomVariable) => (
        <div className="flex space-x-2">
          <GlassButton
            size="xs"
            iconOnly
            icon={Edit}
            onClick={() => handleEditVariable(variable)}
            disabled={variable.isBuiltIn}
          />
          {!variable.isBuiltIn && (
            <GlassButton
              size="xs"
              variant="danger"
              iconOnly
              icon={Trash2}
              onClick={() => handleDeleteVariable(variable.id!)}
            />
          )}
        </div>
      )
    }
  ];

  if (showEditor) {
    return (
      <VariableEditor
        initialVariable={editingVariable || undefined}
        onSave={handleSaveVariable}
        onCancel={() => {
          setShowEditor(false);
          setEditingVariable(null);
        }}
        teamId={teamId}
        existingVariables={allVariables}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Variables</h1>
          <p className="text-white/60">Manage data points that can be used in rules</p>
        </div>
        <GlassButton variant="primary" icon={Plus} onClick={handleCreateVariable}>
          Create Variable
        </GlassButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-white">{stats.totalVariables}</div>
          <div className="text-xs text-white/60">Total Variables</div>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.gameVariables}</div>
          <div className="text-xs text-white/60">Game Variables</div>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-green-400">{stats.playerVariables}</div>
          <div className="text-xs text-white/60">Player Variables</div>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.activeVariables}</div>
          <div className="text-xs text-white/60">Active Variables</div>
        </GlassCard>
        <GlassCard padding="sm" className="text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.customVariables}</div>
          <div className="text-xs text-white/60">Custom Variables</div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard padding="sm">
        <div className="flex items-center space-x-4">
          <EnhancedGlassDropdown
            label="Filter by Scope"
            value={selectedScope}
            onChange={(value) => setSelectedScope(value as ConditionScope | 'ALL')}
            options={[
              { value: 'ALL', label: 'All Variables', description: 'Show all variable types' },
              { value: ConditionScope.GAME, label: 'Game Variables', description: 'Team-level variables', color: 'primary' },
              { value: ConditionScope.PLAYER, label: 'Player Variables', description: 'Individual player variables', color: 'success' }
            ]}
            modal
            size="sm"
            variant="minimal"
            className="min-w-[200px]"
          />
        </div>
      </GlassCard>

      {/* Variables Table */}
      {loading ? (
        <GlassCard className="text-center py-12">
          <div className="text-white/60">Loading variables...</div>
        </GlassCard>
      ) : (
        <GlassTable
          data={filteredVariables}
          columns={columns}
          mobileCardView={true}
        />
      )}

      {/* Quick Start Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <Database className="mr-2 text-blue-400" size={18} />
            Game Variable Ideas
          </h3>
          <div className="space-y-2">
            {VARIABLE_SUGGESTIONS.GAME.map((suggestion, index) => (
              <div key={index} className="p-3 rounded-lg bg-white/5">
                <div className="font-medium text-blue-400 text-sm">{suggestion.label}</div>
                <div className="text-xs text-white/60 mt-1">{suggestion.description}</div>
                <div className="text-xs text-white/40 mt-1 font-mono">{suggestion.key}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <Zap className="mr-2 text-green-400" size={18} />
            Player Variable Ideas
          </h3>
          <div className="space-y-2">
            {VARIABLE_SUGGESTIONS.PLAYER.map((suggestion, index) => (
              <div key={index} className="p-3 rounded-lg bg-white/5">
                <div className="font-medium text-green-400 text-sm">{suggestion.label}</div>
                <div className="text-xs text-white/60 mt-1">{suggestion.description}</div>
                <div className="text-xs text-white/40 mt-1 font-mono">{suggestion.key}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Usage Information */}
      <GlassCard>
        <h3 className="text-lg font-medium text-white mb-4">How Variables Work</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-white/80">
          <div>
            <h4 className="font-medium text-blue-400 mb-2">Game Variables</h4>
            <ul className="space-y-1">
              <li>• Apply to the entire team/game</li>
              <li>• Examples: Goals For, Goals Against, Corners</li>
              <li>• Used in Game Rules for team-wide bonuses</li>
              <li>• Captain enters once per game</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-green-400 mb-2">Player Variables</h4>
            <ul className="space-y-1">
              <li>• Apply to individual players</li>
              <li>• Examples: Goals Scored, Assists, Cards</li>
              <li>• Used in Player Rules for individual scoring</li>
              <li>• Captain enters per player per game</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}