/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CareerTeamData, GameSettings, FreeAgent, LeagueStandingItem } from '../types/career';
import { generateDefaultRoster, DEFAULT_FREE_AGENTS, DEFAULT_STANDINGS } from '../data/careerDefaults';
import { RUGBY_TEAMS } from '../game/constants';

const CAREER_STORAGE_KEY = 'retro_rugby_career_v1';
const SETTINGS_STORAGE_KEY = 'retro_rugby_settings_v1';
const FREE_AGENTS_KEY = 'retro_rugby_market_v1';
const STANDINGS_KEY = 'retro_rugby_standings_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  difficulty: 'normal',
  vibration: true,
  language: 'es',
};

export class CareerStorageService {
  public static loadCareer(): CareerTeamData | null {
    try {
      const raw = localStorage.getItem(CAREER_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Error loading career from localStorage', e);
      return null;
    }
  }

  public static saveCareer(career: CareerTeamData): void {
    try {
      localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(career));
    } catch (e) {
      console.warn('Error saving career to localStorage', e);
    }
  }

  public static createNewCareer(teamId: string, coachName: string): CareerTeamData {
    const baseTeam = RUGBY_TEAMS.find(t => t.id === teamId) || RUGBY_TEAMS[0];
    const initialRoster = generateDefaultRoster(teamId);

    const newCareer: CareerTeamData = {
      coachName: coachName.trim() || 'DT PUMA',
      teamId: baseTeam.id,
      teamName: baseTeam.name,
      shortName: baseTeam.shortName,
      flag: baseTeam.flag,
      primaryColor: baseTeam.kit.primary,
      secondaryColor: baseTeam.kit.secondary,
      coins: 200, // Initial starter budget
      season: 1,
      week: 1,
      fanSupport: 75,
      roster: initialRoster,
      facilities: {
        stadium: 1,
        training: 1,
        rehab: 1,
      },
      record: {
        wins: 0,
        losses: 0,
        draws: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      },
      championshipsWon: 0,
    };

    this.saveCareer(newCareer);
    this.resetStandings();
    this.resetFreeAgents();
    return newCareer;
  }

  public static loadSettings(): GameSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public static saveSettings(settings: GameSettings): void {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Error saving settings', e);
    }
  }

  public static loadFreeAgents(): FreeAgent[] {
    try {
      const raw = localStorage.getItem(FREE_AGENTS_KEY);
      if (!raw) return DEFAULT_FREE_AGENTS;
      return JSON.parse(raw);
    } catch {
      return DEFAULT_FREE_AGENTS;
    }
  }

  public static saveFreeAgents(agents: FreeAgent[]): void {
    try {
      localStorage.setItem(FREE_AGENTS_KEY, JSON.stringify(agents));
    } catch (e) {
      console.warn('Error saving free agents', e);
    }
  }

  public static resetFreeAgents(): void {
    this.saveFreeAgents(DEFAULT_FREE_AGENTS);
  }

  public static loadStandings(): LeagueStandingItem[] {
    try {
      const raw = localStorage.getItem(STANDINGS_KEY);
      if (!raw) return DEFAULT_STANDINGS;
      return JSON.parse(raw);
    } catch {
      return DEFAULT_STANDINGS;
    }
  }

  public static saveStandings(standings: LeagueStandingItem[]): void {
    try {
      localStorage.setItem(STANDINGS_KEY, JSON.stringify(standings));
    } catch (e) {
      console.warn('Error saving standings', e);
    }
  }

  public static resetStandings(): void {
    this.saveStandings(DEFAULT_STANDINGS);
  }

  public static clearAllData(): void {
    localStorage.removeItem(CAREER_STORAGE_KEY);
    localStorage.removeItem(FREE_AGENTS_KEY);
    localStorage.removeItem(STANDINGS_KEY);
  }
}
