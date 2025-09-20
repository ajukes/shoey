import { ConditionScope } from './rules';

export interface CustomVariable {
  id?: string;
  key: string;          // Used in conditions (e.g., "corners", "saves")
  label: string;        // Display name (e.g., "Corner Kicks", "Goalkeeper Saves")
  description: string;  // What this variable represents
  scope: ConditionScope; // GAME or PLAYER
  dataType: 'number' | 'boolean';
  defaultValue: number;
  isActive: boolean;
  isBuiltIn: boolean;   // System variables can't be deleted
  teamId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Built-in system variables that come with every team
export const BUILTIN_GAME_VARIABLES: CustomVariable[] = [
  {
    key: "goalsFor",
    label: "Goals For",
    description: "Number of goals scored by the team",
    scope: ConditionScope.GAME,
    dataType: 'number',
    defaultValue: 0,
    isActive: true,
    isBuiltIn: true,
    teamId: ''
  },
  {
    key: "goalsAgainst",
    label: "Goals Against", 
    description: "Number of goals conceded by the team",
    scope: ConditionScope.GAME,
    dataType: 'number',
    defaultValue: 0,
    isActive: true,
    isBuiltIn: true,
    teamId: ''
  }
];

export const BUILTIN_PLAYER_VARIABLES: CustomVariable[] = [
  {
    key: "goalsScored",
    label: "Goals Scored",
    description: "Number of goals scored by the player",
    scope: ConditionScope.PLAYER,
    dataType: 'number',
    defaultValue: 0,
    isActive: true,
    isBuiltIn: true,
    teamId: ''
  },
  {
    key: "goalAssists",
    label: "Goal Assists",
    description: "Number of assists by the player",
    scope: ConditionScope.PLAYER,
    dataType: 'number',
    defaultValue: 0,
    isActive: true,
    isBuiltIn: true,
    teamId: ''
  },
  {
    key: "greenCards",
    label: "Green Cards",
    description: "Number of green cards received",
    scope: ConditionScope.PLAYER,
    dataType: 'number',
    defaultValue: 0,
    isActive: true,
    isBuiltIn: true,
    teamId: ''
  },
  {
    key: "yellowCards",
    label: "Yellow Cards",
    description: "Number of yellow cards received",
    scope: ConditionScope.PLAYER,
    dataType: 'number',
    defaultValue: 0,
    isActive: true,
    isBuiltIn: true,
    teamId: ''
  },
  {
    key: "redCards",
    label: "Red Cards",
    description: "Number of red cards received",
    scope: ConditionScope.PLAYER,
    dataType: 'number',
    defaultValue: 0,
    isActive: true,
    isBuiltIn: true,
    teamId: ''
  },
];

// Common variable suggestions for quick setup
export const VARIABLE_SUGGESTIONS = {
  GAME: [
    { key: "corners", label: "Corner Kicks", description: "Number of corner kicks awarded to the team" },
    { key: "shots", label: "Shots on Target", description: "Number of shots on target by the team" },
    { key: "possession", label: "Possession %", description: "Percentage of possession held by the team" },
    { key: "fouls", label: "Fouls Committed", description: "Number of fouls committed by the team" },
    { key: "offside", label: "Offside Calls", description: "Number of offside calls against the team" }
  ],
  PLAYER: [
    { key: "passes", label: "Passes Completed", description: "Number of successful passes by the player" },
    { key: "interceptions", label: "Interceptions", description: "Number of interceptions made by the player" },
    { key: "blocks", label: "Blocks", description: "Number of shots/crosses blocked by the player" },
    { key: "crosses", label: "Successful Crosses", description: "Number of successful crosses by the player" },
    { key: "dribbles", label: "Successful Dribbles", description: "Number of successful dribbles by the player" },
    { key: "clearances", label: "Clearances", description: "Number of defensive clearances by the player" },
    { key: "minutesPlayed", label: "Minutes Played", description: "Number of minutes the player was on the field" }
  ]
};

export interface VariableUsage {
  variableKey: string;
  usedInRules: number; // Count of rules using this variable
  ruleNames: string[]; // Names of rules using this variable
}

export interface VariableStats {
  totalVariables: number;
  gameVariables: number;
  playerVariables: number;
  activeVariables: number;
  customVariables: number;
}