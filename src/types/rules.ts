// Rules Engine Types
export enum RuleCategory {
  GAME_RESULT = "GAME_RESULT",
  PLAYER_PERFORMANCE = "PLAYER_PERFORMANCE", 
  MANUAL = "MANUAL"
}

export enum TargetScope {
  ALL_PLAYERS = "ALL_PLAYERS",
  BY_POSITION = "BY_POSITION",
  INDIVIDUAL_PLAYER = "INDIVIDUAL_PLAYER"
}

export enum ConditionOperator {
  GREATER_THAN = "GREATER_THAN",        // ">"
  EQUAL = "EQUAL",                      // "=="
  LESS_THAN = "LESS_THAN",             // "<"
  GREATER_EQUAL = "GREATER_EQUAL",      // ">="
  LESS_EQUAL = "LESS_EQUAL",           // "<="
  NOT_EQUAL = "NOT_EQUAL"              // "!="
}

export enum ConditionScope {
  GAME = "GAME",
  PLAYER = "PLAYER"
}

export enum PositionCategory {
  GOALKEEPER = "GOALKEEPER",
  DEFENDER = "DEFENDER",
  MIDFIELDER = "MIDFIELDER",
  FORWARD = "FORWARD"
}

// Position value mapping for conditions (since DB stores values as integers)
export const POSITION_VALUES: Record<PositionCategory, number> = {
  [PositionCategory.GOALKEEPER]: 1,
  [PositionCategory.DEFENDER]: 2,
  [PositionCategory.MIDFIELDER]: 3,
  [PositionCategory.FORWARD]: 4
};

export const VALUE_TO_POSITION: Record<number, PositionCategory> = {
  1: PositionCategory.GOALKEEPER,
  2: PositionCategory.DEFENDER,
  3: PositionCategory.MIDFIELDER,
  4: PositionCategory.FORWARD
};

// Operator mappings for display and evaluation
export const OPERATOR_SYMBOLS: Record<ConditionOperator, string> = {
  [ConditionOperator.GREATER_THAN]: ">",
  [ConditionOperator.EQUAL]: "==",
  [ConditionOperator.LESS_THAN]: "<",
  [ConditionOperator.GREATER_EQUAL]: ">=",
  [ConditionOperator.LESS_EQUAL]: "<=",
  [ConditionOperator.NOT_EQUAL]: "!="
};

export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  [ConditionOperator.GREATER_THAN]: "Greater than",
  [ConditionOperator.EQUAL]: "Equal to",
  [ConditionOperator.LESS_THAN]: "Less than",
  [ConditionOperator.GREATER_EQUAL]: "Greater than or equal",
  [ConditionOperator.LESS_EQUAL]: "Less than or equal",
  [ConditionOperator.NOT_EQUAL]: "Not equal to"
};

// Available variables for rule conditions
export interface VariableDefinition {
  key: string;
  label: string;
  scope: ConditionScope;
  description: string;
  dataType: 'number' | 'boolean' | 'string';
}

export const GAME_VARIABLES: VariableDefinition[] = [
  {
    key: "goalsFor",
    label: "Goals For",
    scope: ConditionScope.GAME,
    description: "Number of goals scored by the team",
    dataType: 'number'
  },
  {
    key: "goalsAgainst", 
    label: "Goals Against",
    scope: ConditionScope.GAME,
    description: "Number of goals conceded by the team",
    dataType: 'number'
  }
];

export const PLAYER_VARIABLES: VariableDefinition[] = [
  {
    key: "goalsScored",
    label: "Goals Scored",
    scope: ConditionScope.PLAYER,
    description: "Number of goals scored by the player",
    dataType: 'number'
  },
  {
    key: "goalAssists",
    label: "Goal Assists", 
    scope: ConditionScope.PLAYER,
    description: "Number of assists by the player",
    dataType: 'number'
  },
  {
    key: "greenCards",
    label: "Green Cards",
    scope: ConditionScope.PLAYER,
    description: "Number of green cards received",
    dataType: 'number'
  },
  {
    key: "yellowCards",
    label: "Yellow Cards",
    scope: ConditionScope.PLAYER,
    description: "Number of yellow cards received", 
    dataType: 'number'
  },
  {
    key: "redCards",
    label: "Red Cards",
    scope: ConditionScope.PLAYER,
    description: "Number of red cards received",
    dataType: 'number'
  },
  {
    key: "saves",
    label: "Saves",
    scope: ConditionScope.PLAYER,
    description: "Number of saves made (goalkeepers)",
    dataType: 'number'
  },
  {
    key: "tackles",
    label: "Tackles",
    scope: ConditionScope.PLAYER,
    description: "Number of successful tackles",
    dataType: 'number'
  },
  {
    key: "position",
    label: "Player Position",
    scope: ConditionScope.PLAYER,
    description: "Player's position category",
    dataType: 'string'
  },
  {
    key: "played",
    label: "Played",
    scope: ConditionScope.PLAYER,
    description: "Whether the player participated in the game",
    dataType: 'boolean'
  }
];

export const ALL_VARIABLES = [...GAME_VARIABLES, ...PLAYER_VARIABLES];

// Rule interfaces
export interface RuleCondition {
  id?: string;
  variable: string;
  operator: ConditionOperator;
  value: number;
  compareVariable?: string; // For variable-to-variable comparisons
  scope: ConditionScope;
}

export interface FlexibleRule {
  id?: string;
  name: string;
  description: string;
  category: RuleCategory;
  pointsAwarded: number;
  isMultiplier: boolean;
  targetScope: TargetScope;
  targetPositions: PositionCategory[];
  conditions: RuleCondition[];
  isActive: boolean;
  teamId: string;
}

// Game data for rule evaluation
export interface GameVariables {
  goalsFor: number;
  goalsAgainst: number;
}

export interface PlayerVariables {
  playerId: string;
  goalsScored: number;
  goalAssists: number;
  greenCards: number;
  yellowCards: number;
  redCards: number;
  saves?: number;
  tackles?: number;
  position: PositionCategory;
  played: boolean;
}

export interface RuleEvaluationContext {
  gameVariables: GameVariables;
  playerVariables: PlayerVariables[];
}

// Rule evaluation results
export interface PlayerRuleResult {
  playerId: string;
  ruleId: string;
  ruleName: string;
  pointsAwarded: number;
  reason: string;
}

export interface RuleEvaluationResult {
  gameId: string;
  playerResults: PlayerRuleResult[];
  totalPointsAwarded: number;
}