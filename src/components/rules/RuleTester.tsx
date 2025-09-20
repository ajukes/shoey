'use client';

import React, { useState } from 'react';
import { Play, RotateCcw, Users } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import {
  FlexibleRule,
  RuleEvaluationContext,
  PlayerVariables,
  GameVariables,
  PositionCategory,
  PlayerRuleResult
} from '@/types/rules';
import { RulesEngine } from '@/lib/rules-engine';

interface RuleTesterProps {
  rules: FlexibleRule[];
  teamId: string;
}

// Sample players for testing
const samplePlayers: PlayerVariables[] = [
  { playerId: 'gk1', goalsScored: 0, goalAssists: 0, greenCards: 0, yellowCards: 0, redCards: 0, saves: 5, tackles: 0, position: PositionCategory.GOALKEEPER },
  { playerId: 'def1', goalsScored: 0, goalAssists: 1, greenCards: 0, yellowCards: 1, redCards: 0, saves: 0, tackles: 8, position: PositionCategory.DEFENDER },
  { playerId: 'def2', goalsScored: 1, goalAssists: 0, greenCards: 0, yellowCards: 0, redCards: 0, saves: 0, tackles: 6, position: PositionCategory.DEFENDER },
  { playerId: 'mid1', goalsScored: 1, goalAssists: 2, greenCards: 0, yellowCards: 0, redCards: 0, saves: 0, tackles: 4, position: PositionCategory.MIDFIELDER },
  { playerId: 'mid2', goalsScored: 0, goalAssists: 1, greenCards: 0, yellowCards: 0, redCards: 0, saves: 0, tackles: 3, position: PositionCategory.MIDFIELDER },
  { playerId: 'fwd1', goalsScored: 2, goalAssists: 0, greenCards: 0, yellowCards: 0, redCards: 0, saves: 0, tackles: 1, position: PositionCategory.FORWARD },
  { playerId: 'fwd2', goalsScored: 1, goalAssists: 1, greenCards: 1, yellowCards: 0, redCards: 0, saves: 0, tackles: 0, position: PositionCategory.FORWARD }
];

export function RuleTester({ rules, teamId }: RuleTesterProps) {
  const [gameVariables, setGameVariables] = useState<GameVariables>({
    goalsFor: 5,
    goalsAgainst: 2
  });
  
  const [playerVariables, setPlayerVariables] = useState<PlayerVariables[]>(samplePlayers);
  const [testResults, setTestResults] = useState<PlayerRuleResult[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const runTest = () => {
    const context: RuleEvaluationContext = {
      gameVariables,
      playerVariables
    };

    const result = RulesEngine.evaluateRules(rules.filter(r => r.isActive), context);
    setTestResults(result.playerResults);
    setHasRun(true);
  };

  const resetTest = () => {
    setGameVariables({ goalsFor: 5, goalsAgainst: 2 });
    setPlayerVariables(samplePlayers);
    setTestResults([]);
    setHasRun(false);
  };

  const updatePlayerStat = (playerId: string, field: keyof PlayerVariables, value: number) => {
    setPlayerVariables(prev => prev.map(player => 
      player.playerId === playerId 
        ? { ...player, [field]: value }
        : player
    ));
  };

  // Group results by player
  const playerTotals = testResults.reduce((acc, result) => {
    if (!acc[result.playerId]) {
      acc[result.playerId] = {
        totalPoints: 0,
        rules: []
      };
    }
    acc[result.playerId].totalPoints += result.pointsAwarded;
    acc[result.playerId].rules.push(result);
    return acc;
  }, {} as Record<string, { totalPoints: number; rules: PlayerRuleResult[] }>);

  const getPlayerName = (playerId: string): string => {
    const names: Record<string, string> = {
      'gk1': 'Mike Johnson (GK)',
      'def1': 'John Smith (DEF)',
      'def2': 'David Brown (DEF)', 
      'mid1': 'Sarah Williams (MID)',
      'mid2': 'Emma Wilson (MID)',
      'fwd1': 'Alex Taylor (FWD)',
      'fwd2': 'Chris Lee (FWD)'
    };
    return names[playerId] || playerId;
  };

  const totalPointsAwarded = Object.values(playerTotals).reduce((sum, player) => sum + player.totalPoints, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Rule Tester</h2>
          <p className="text-white/60">Test your rules against sample game scenarios</p>
        </div>
        <div className="flex space-x-3">
          <GlassButton variant="glass" icon={RotateCcw} onClick={resetTest}>
            Reset
          </GlassButton>
          <GlassButton variant="primary" icon={Play} onClick={runTest}>
            Run Test
          </GlassButton>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Test Scenario Input */}
        <div className="space-y-6">
          {/* Game Variables */}
          <GlassCard>
            <h3 className="text-lg font-medium text-white mb-4">Game Result</h3>
            <div className="grid grid-cols-2 gap-4">
              <GlassInput
                label="Goals For"
                type="number"
                value={gameVariables.goalsFor.toString()}
                onChange={(e) => setGameVariables(prev => ({ 
                  ...prev, 
                  goalsFor: parseInt(e.target.value) || 0 
                }))}
              />
              <GlassInput
                label="Goals Against"
                type="number"
                value={gameVariables.goalsAgainst.toString()}
                onChange={(e) => setGameVariables(prev => ({ 
                  ...prev, 
                  goalsAgainst: parseInt(e.target.value) || 0 
                }))}
              />
            </div>
            <div className="mt-3 text-center">
              <span className={`text-lg font-bold ${
                gameVariables.goalsFor > gameVariables.goalsAgainst 
                  ? 'text-green-400' 
                  : gameVariables.goalsFor < gameVariables.goalsAgainst 
                    ? 'text-red-400' 
                    : 'text-yellow-400'
              }`}>
                {gameVariables.goalsFor > gameVariables.goalsAgainst ? 'WIN' : 
                 gameVariables.goalsFor < gameVariables.goalsAgainst ? 'LOSS' : 'DRAW'}
              </span>
            </div>
          </GlassCard>

          {/* Player Stats */}
          <GlassCard>
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <Users className="mr-2" size={18} />
              Player Statistics
            </h3>
            <div className="space-y-4">
              {playerVariables.map((player) => (
                <div key={player.playerId} className="p-4 rounded-lg bg-white/5">
                  <div className="font-medium text-white mb-3">{getPlayerName(player.playerId)}</div>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-white/60">Goals</label>
                      <input
                        type="number"
                        min="0"
                        value={player.goalsScored}
                        onChange={(e) => updatePlayerStat(player.playerId, 'goalsScored', parseInt(e.target.value) || 0)}
                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/60">Assists</label>
                      <input
                        type="number"
                        min="0"
                        value={player.goalAssists}
                        onChange={(e) => updatePlayerStat(player.playerId, 'goalAssists', parseInt(e.target.value) || 0)}
                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/60">Green</label>
                      <input
                        type="number"
                        min="0"
                        value={player.greenCards}
                        onChange={(e) => updatePlayerStat(player.playerId, 'greenCards', parseInt(e.target.value) || 0)}
                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/60">Yellow</label>
                      <input
                        type="number"
                        min="0"
                        value={player.yellowCards}
                        onChange={(e) => updatePlayerStat(player.playerId, 'yellowCards', parseInt(e.target.value) || 0)}
                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/60">Red</label>
                      <input
                        type="number"
                        min="0"
                        value={player.redCards}
                        onChange={(e) => updatePlayerStat(player.playerId, 'redCards', parseInt(e.target.value) || 0)}
                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Test Results */}
        <div className="space-y-6">
          {hasRun && (
            <>
              {/* Summary */}
              <GlassCard>
                <h3 className="text-lg font-medium text-white mb-4">Test Results Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Total Rules Applied:</span>
                    <span className="font-bold text-white">{testResults.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Total Points Awarded:</span>
                    <span className={`font-bold text-lg ${totalPointsAwarded >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {totalPointsAwarded >= 0 ? '+' : ''}{totalPointsAwarded}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Players Affected:</span>
                    <span className="font-bold text-white">{Object.keys(playerTotals).length}</span>
                  </div>
                </div>
              </GlassCard>

              {/* Player Results */}
              <GlassCard>
                <h3 className="text-lg font-medium text-white mb-4">Player Points Breakdown</h3>
                <div className="space-y-4">
                  {Object.entries(playerTotals)
                    .sort((a, b) => b[1].totalPoints - a[1].totalPoints)
                    .map(([playerId, data]) => (
                    <div key={playerId} className="p-4 rounded-lg bg-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-white">{getPlayerName(playerId)}</span>
                        <span className={`font-bold text-lg ${data.totalPoints >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {data.totalPoints >= 0 ? '+' : ''}{data.totalPoints}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {data.rules.map((rule, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-white/70">{rule.ruleName}</span>
                            <span className={`font-medium ${rule.pointsAwarded >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {rule.pointsAwarded >= 0 ? '+' : ''}{rule.pointsAwarded}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {Object.keys(playerTotals).length === 0 && (
                    <div className="text-center py-8 text-white/60">
                      No rules were triggered with the current scenario
                    </div>
                  )}
                </div>
              </GlassCard>
            </>
          )}

          {!hasRun && (
            <GlassCard className="text-center py-12">
              <div className="text-white/60 mb-4">
                <Play size={48} className="mx-auto mb-4 text-white/40" />
                Set up your test scenario and click "Run Test" to see how your rules would apply
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}