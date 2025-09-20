'use client';

import React, { useState } from 'react';
import { X, Eye, Lightbulb } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { EnhancedGlassDropdown } from '@/components/ui/EnhancedGlassDropdown';
import { Hash, ToggleLeft } from 'lucide-react';
import {
  CustomVariable,
  VARIABLE_SUGGESTIONS
} from '@/types/variables';
import { ConditionScope } from '@/types/rules';

interface VariableEditorProps {
  initialVariable?: Partial<CustomVariable>;
  onSave: (variable: CustomVariable) => void;
  onCancel: () => void;
  teamId: string;
  existingVariables: CustomVariable[];
}

export function VariableEditor({ 
  initialVariable, 
  onSave, 
  onCancel, 
  teamId, 
  existingVariables 
}: VariableEditorProps) {
  const [variable, setVariable] = useState<Partial<CustomVariable>>({
    key: '',
    label: '',
    description: '',
    scope: ConditionScope.PLAYER,
    dataType: 'number',
    defaultValue: 0,
    isActive: true,
    isBuiltIn: false,
    teamId,
    ...initialVariable
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [keyError, setKeyError] = useState('');

  // Get suggestions based on current scope
  const suggestions = variable.scope === ConditionScope.GAME 
    ? VARIABLE_SUGGESTIONS.GAME 
    : VARIABLE_SUGGESTIONS.PLAYER;

  const validateKey = (key: string): string => {
    if (!key) return 'Variable key is required';
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(key)) {
      return 'Key must start with a letter and contain only letters and numbers';
    }
    if (key.length < 2) return 'Key must be at least 2 characters';
    if (key.length > 20) return 'Key must be less than 20 characters';
    
    // Check for duplicates (excluding current variable if editing)
    const existingKey = existingVariables.find(v => 
      v.key.toLowerCase() === key.toLowerCase() && 
      v.id !== initialVariable?.id
    );
    if (existingKey) return 'A variable with this key already exists';
    
    return '';
  };

  const handleKeyChange = (key: string) => {
    setVariable(prev => ({ ...prev, key }));
    setKeyError(validateKey(key));
  };

  const handleSave = () => {
    const keyValidation = validateKey(variable.key || '');
    if (keyValidation) {
      setKeyError(keyValidation);
      return;
    }

    if (!variable.label?.trim()) {
      alert('Variable label is required');
      return;
    }

    if (!variable.description?.trim()) {
      alert('Variable description is required');
      return;
    }

    onSave(variable as CustomVariable);
  };

  const applySuggestion = (suggestion: typeof suggestions[0]) => {
    setVariable(prev => ({
      ...prev,
      key: suggestion.key,
      label: suggestion.label,
      description: suggestion.description
    }));
    setKeyError('');
    setShowSuggestions(false);
  };

  const generateKeyFromLabel = (label: string) => {
    // Auto-generate key from label
    const key = label
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, '') // Remove spaces
      .substring(0, 20); // Limit length
    
    if (key) {
      handleKeyChange(key);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {initialVariable?.id ? 'Edit Variable' : 'Create New Variable'}
          </h2>
          <GlassButton variant="glass" size="sm" iconOnly icon={X} onClick={onCancel} />
        </div>

        <div className="space-y-6">
          {/* Quick Suggestions */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Variable Details</h3>
            <GlassButton 
              variant="glass" 
              size="sm" 
              icon={Lightbulb}
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              {showSuggestions ? 'Hide' : 'Show'} Suggestions
            </GlassButton>
          </div>

          {showSuggestions && (
            <GlassCard padding="sm">
              <h4 className="text-sm font-medium text-white/80 mb-3">
                Quick Start - {variable.scope === ConditionScope.GAME ? 'Game' : 'Player'} Variables
              </h4>
              <div className="grid gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => applySuggestion(suggestion)}
                    className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="font-medium text-white text-sm">{suggestion.label}</div>
                    <div className="text-xs text-white/60 mt-1">{suggestion.description}</div>
                    <div className="text-xs text-white/40 mt-1 font-mono">{suggestion.key}</div>
                  </button>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Scope Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">Variable Scope</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setVariable(prev => ({ ...prev, scope: ConditionScope.GAME }))}
                className={`p-4 rounded-lg border transition-all ${
                  variable.scope === ConditionScope.GAME
                    ? 'bg-blue-500/20 border-blue-400/50 text-blue-400'
                    : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
                }`}
              >
                <div className="font-medium">Game Variable</div>
                <div className="text-xs mt-1 opacity-80">Team-level data (goals, corners, etc.)</div>
              </button>
              <button
                onClick={() => setVariable(prev => ({ ...prev, scope: ConditionScope.PLAYER }))}
                className={`p-4 rounded-lg border transition-all ${
                  variable.scope === ConditionScope.PLAYER
                    ? 'bg-green-500/20 border-green-400/50 text-green-400'
                    : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
                }`}
              >
                <div className="font-medium">Player Variable</div>
                <div className="text-xs mt-1 opacity-80">Individual player data (goals, assists, etc.)</div>
              </button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <GlassInput
                label="Display Label"
                value={variable.label}
                onChange={(e) => {
                  const label = e.target.value;
                  setVariable(prev => ({ ...prev, label }));
                  // Auto-generate key if it's empty
                  if (!variable.key) {
                    generateKeyFromLabel(label);
                  }
                }}
                placeholder="e.g., Corner Kicks"
              />
            </div>
            
            <div className="space-y-2">
              <GlassInput
                label="Variable Key"
                value={variable.key}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder="e.g., corners"
                error={keyError}
              />
              <p className="text-xs text-white/50">
                Used in rules (letters and numbers only, no spaces)
              </p>
            </div>
          </div>

          <GlassInput
            label="Description"
            value={variable.description}
            onChange={(e) => setVariable(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what this variable represents..."
          />

          {/* Data Type & Default Value */}
          <div className="grid md:grid-cols-2 gap-4">
            <EnhancedGlassDropdown
              label="Data Type"
              value={variable.dataType || 'number'}
              onChange={(value) => setVariable(prev => ({ 
                ...prev, 
                dataType: value as 'number' | 'boolean',
                defaultValue: value === 'boolean' ? 0 : prev.defaultValue
              }))}
              options={[
                { 
                  value: 'number', 
                  label: 'Number', 
                  description: 'Numeric values (goals, saves, etc.)',
                  icon: Hash,
                  color: 'primary'
                },
                { 
                  value: 'boolean', 
                  label: 'Boolean (True/False)', 
                  description: 'Yes/No or On/Off values',
                  icon: ToggleLeft,
                  color: 'success'
                }
              ]}
              modal
              helperText="Choose the type of data this variable will store"
            />

            <GlassInput
              label="Default Value"
              type="number"
              value={variable.defaultValue?.toString()}
              onChange={(e) => setVariable(prev => ({ 
                ...prev, 
                defaultValue: parseInt(e.target.value) || 0 
              }))}
            />
          </div>

          {/* Preview */}
          <GlassCard padding="sm">
            <h4 className="text-sm font-medium text-white/80 mb-3 flex items-center">
              <Eye className="mr-2" size={16} />
              Preview
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Display Name:</span>
                <span className="text-white font-medium">{variable.label || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Variable Key:</span>
                <code className="text-purple-400 bg-purple-400/10 px-2 py-1 rounded text-xs">
                  {variable.key || 'notset'}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Scope:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  variable.scope === ConditionScope.GAME 
                    ? 'text-blue-400 bg-blue-400/20' 
                    : 'text-green-400 bg-green-400/20'
                }`}>
                  {variable.scope}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Type & Default:</span>
                <span className="text-white">{variable.dataType} ({variable.defaultValue})</span>
              </div>
            </div>
          </GlassCard>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="text-sm text-white/60">
              {initialVariable?.id ? 'Update existing variable' : 'Create new variable'}
            </div>
            
            <div className="space-x-3">
              <GlassButton variant="glass" onClick={onCancel}>
                Cancel
              </GlassButton>
              <GlassButton 
                variant="primary" 
                onClick={handleSave}
                disabled={!!keyError || !variable.key || !variable.label}
              >
                {initialVariable?.id ? 'Update' : 'Create'} Variable
              </GlassButton>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Usage Examples */}
      <GlassCard>
        <h3 className="text-lg font-medium text-white mb-4">Usage Examples</h3>
        <div className="space-y-4 text-sm">
          <div className="p-3 rounded-lg bg-white/5">
            <div className="font-medium text-blue-400 mb-2">Game Variable Example</div>
            <div className="text-white/80">
              If you create "corners" (Corner Kicks), you can use it in rules like:
            </div>
            <code className="block mt-2 text-purple-400 bg-purple-400/10 p-2 rounded text-xs">
              "If corners ≥ 5, give +2 points to all players"
            </code>
          </div>
          
          <div className="p-3 rounded-lg bg-white/5">
            <div className="font-medium text-green-400 mb-2">Player Variable Example</div>
            <div className="text-white/80">
              If you create "passes" (Passes Completed), you can use it in rules like:
            </div>
            <code className="block mt-2 text-purple-400 bg-purple-400/10 p-2 rounded text-xs">
              "If passes ≥ 50, give +3 points to that player"
            </code>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}