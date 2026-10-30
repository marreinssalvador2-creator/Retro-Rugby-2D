/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RugbyPositionNumber } from './rugby';

export type GameScene = 
  | 'MAIN_MENU'
  | 'CAREER_SETUP'
  | 'CAREER_HUB'
  | 'CAREER_SQUAD'
  | 'CAREER_TRANSFERS'
  | 'CAREER_FINANCES'
  | 'CAREER_STANDINGS'
  | 'CAREER_FACILITIES'
  | 'CHAMPIONSHIPS'
  | 'TUTORIAL'
  | 'SETTINGS'
  | 'MATCH'
  | 'MATCH_SUMMARY';

export interface CareerPlayer {
  id: string;
  name: string;
  position: RugbyPositionNumber;
  roleName: string;
  isForward: boolean;
  age: number;
  stars: number; // 1 to 5
  speed: number; // 1 to 10
  strength: number; // 1 to 10
  kicking: number; // 1 to 10
  handling: number; // 1 to 10
  salary: number; // Coins per season
  contractYears: number; // 1 to 3
  fitness: number; // 0 to 100%
  morale: number; // 0 to 100%
  stats: {
    tries: number;
    conversions: number;
    tackles: number;
    matches: number;
  };
}

export interface FreeAgent {
  id: string;
  name: string;
  position: RugbyPositionNumber;
  roleName: string;
  isForward: boolean;
  age: number;
  stars: number;
  price: number; // One-time signing fee in coins
  salary: number; // Weekly or season salary
  speed: number;
  strength: number;
  kicking: number;
  handling: number;
}

export interface CareerFacility {
  id: 'stadium' | 'training' | 'rehab';
  name: string;
  description: string;
  level: number; // 1 to 5
  costNextLevel: number;
  benefitDescription: string;
}

export interface CareerTeamData {
  coachName: string;
  teamId: string;
  teamName: string;
  shortName: string;
  flag: string;
  primaryColor: string;
  secondaryColor: string;
  coins: number;
  season: number;
  week: number;
  fanSupport: number; // 0 to 100%
  roster: CareerPlayer[];
  facilities: {
    stadium: number;
    training: number;
    rehab: number;
  };
  record: {
    wins: number;
    losses: number;
    draws: number;
    pointsFor: number;
    pointsAgainst: number;
  };
  championshipsWon: number;
}

export interface LeagueStandingItem {
  teamId: string;
  teamName: string;
  shortName: string;
  flag: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  points: number;
}

export interface TournamentBracketMatch {
  id: string;
  stageName: string; // e.g. "CUARTOS DE FINAL", "SEMIFINAL", "FINAL"
  homeTeam: { id: string; name: string; flag: string; score?: number };
  awayTeam: { id: string; name: string; flag: string; score?: number };
  winnerId?: string;
  isUserMatch: boolean;
}

export interface ChampionshipInfo {
  id: string;
  title: string;
  subtitle: string;
  type: 'national_league' | 'national_cup' | 'continental_cup' | 'world_cup' | 'rugby_championship';
  trophyEmoji: string;
  formatDescription: string;
  prizeCoins: number;
  isUnlocked: boolean;
  requiredSeason: number;
}

export interface CareerEventDilemma {
  id: string;
  title: string;
  description: string;
  playerName?: string;
  options: {
    label: string;
    description: string;
    coinDelta?: number;
    moraleDelta?: number;
    fitnessDelta?: number;
  }[];
}

export type Language = 'es' | 'en' | 'fr' | 'it';

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  difficulty: 'facil' | 'normal' | 'dificil';
  vibration: boolean;
  language: Language;
}
