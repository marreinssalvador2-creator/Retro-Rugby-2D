/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RugbyPositionInfo, TeamData } from '../types/rugby';

// Low-resolution retro rendering constants (16:9 widescreen retro pixel aesthetic)
export const VIRTUAL_WIDTH = 426;
export const VIRTUAL_HEIGHT = 240;

// Pitch world dimensions in internal game units (slightly enlarged for tactical depth)
export const PITCH_IN_GOAL_DEPTH = 110; // 11 meters in-goal at each end
export const PITCH_PLAYING_LENGTH = 1100; // 110 meters between try-lines
export const PITCH_TOTAL_LENGTH = PITCH_PLAYING_LENGTH + (2 * PITCH_IN_GOAL_DEPTH); // 1320 units
export const PITCH_WIDTH = 560; // 56 meters visible width
export const PITCH_TOUCH_LINE_TOP = 25;
export const PITCH_TOUCH_LINE_BOTTOM = PITCH_WIDTH - 25;

// Key pitch X coordinates
export const PITCH_TRYLINE_LEFT = PITCH_IN_GOAL_DEPTH; // X: 110
export const PITCH_22M_LEFT = PITCH_TRYLINE_LEFT + 242; // X: 352
export const PITCH_10M_LEFT = PITCH_TRYLINE_LEFT + 440; // X: 550
export const PITCH_HALFWAY = PITCH_TRYLINE_LEFT + 550; // X: 660
export const PITCH_10M_RIGHT = PITCH_TRYLINE_LEFT + 660; // X: 770
export const PITCH_22M_RIGHT = PITCH_TRYLINE_LEFT + 858; // X: 968
export const PITCH_TRYLINE_RIGHT = PITCH_TRYLINE_LEFT + 1100; // X: 1210
export const PITCH_DEADBALL_LEFT = 0;
export const PITCH_DEADBALL_RIGHT = PITCH_TOTAL_LENGTH; // X: 1320

export const H_POST_Y_CENTER = PITCH_WIDTH / 2;
export const H_POST_WIDTH = 58; // 5.8 meters between uprights
export const H_POST_CROSSBAR_HEIGHT = 30; // 3 meters height

// Varied retro scrum cap colors for forwards (no uniform blue seam)
export const SCRUM_CAP_COLORS = [
  '#0f172a', // Jet Black
  '#334155', // Slate Grey
  '#7f1d1d', // Dark Maroon
  '#14532d', // Forest Green
  '#1e1b4b', // Midnight Navy
  '#78350f', // Leather Brown
  '#831843', // Deep Wine
  '#e2e8f0', // Retro Off-White
];

// 6 Realistic Pixel Art Skin Tones matching reference image (#e09e6c tan/peach)
export const SKIN_TONES = [
  '#f6c8a3', // 1. Fair peach
  '#e09e6c', // 2. Golden Tan (exact match to user reference sprite!)
  '#c68642', // 3. Warm Amber / Mediterranean
  '#995f33', // 4. Bronze / Polynesian warrior
  '#683b1a', // 5. Deep Caramel
  '#3d2112', // 6. Rich Espresso
];

export const HAIR_COLORS = [
  '#543621', // Deep Warm Brown (reference image hair)
  '#1a1a1a', // Jet Black
  '#82542a', // Chestnut Auburn
  '#d4a359', // Dark Golden Blonde
  '#a33519', // Crimson Ginger
  '#71717a', // Grizzled Veteran Grey
];

export const HAIR_STYLES = ['classic', 'buzz', 'wavy', 'afro', 'undercut', 'bald'] as const;

export function getBodyTypeForPosition(position: number): 'prop_heavy' | 'lock_tall' | 'flanker_athletic' | 'scrumhalf_agile' | 'flyhalf_balanced' | 'back_speed' {
  switch (position) {
    case 1:
    case 2:
    case 3:
      return 'prop_heavy';
    case 4:
    case 5:
      return 'lock_tall';
    case 6:
    case 7:
    case 8:
      return 'flanker_athletic';
    case 9:
      return 'scrumhalf_agile';
    case 10:
      return 'flyhalf_balanced';
    default:
      return 'back_speed';
  }
}

// Rugby positions dictionary: distinct characteristics for forwards (powerful, slower) and backs (swift, agile)
// Speeds are dialed back ~18% for deliberate, readable tactical pacing
export const RUGBY_POSITIONS: Record<number, RugbyPositionInfo> = {
  1: { number: 1, code: 'LP', name: 'Loosehead Prop', spanishName: 'Pilar Izquierdo', role: 'prop', isForward: true, baseSpeed: 0.54, baseStrength: 1.45 },
  2: { number: 2, code: 'HK', name: 'Hooker', spanishName: 'Hooker', role: 'hooker', isForward: true, baseSpeed: 0.58, baseStrength: 1.35 },
  3: { number: 3, code: 'TP', name: 'Tighthead Prop', spanishName: 'Pilar Derecho', role: 'prop', isForward: true, baseSpeed: 0.53, baseStrength: 1.50 },
  4: { number: 4, code: 'SR', name: 'Second Row', spanishName: 'Segunda Línea', role: 'lock', isForward: true, baseSpeed: 0.60, baseStrength: 1.40 },
  5: { number: 5, code: 'SR', name: 'Second Row', spanishName: 'Segunda Línea', role: 'lock', isForward: true, baseSpeed: 0.61, baseStrength: 1.38 },
  6: { number: 6, code: 'BF', name: 'Blindside Flanker', spanishName: 'Ala Ciego', role: 'flanker', isForward: true, baseSpeed: 0.68, baseStrength: 1.25 },
  7: { number: 7, code: 'OF', name: 'Openside Flanker', spanishName: 'Ala Abierto', role: 'flanker', isForward: true, baseSpeed: 0.70, baseStrength: 1.22 },
  8: { number: 8, code: 'N8', name: 'Number Eight', spanishName: 'Octavo', role: 'eight', isForward: true, baseSpeed: 0.71, baseStrength: 1.30 },
  9: { number: 9, code: 'SH', name: 'Scrum-Half', spanishName: 'Medio Scrum', role: 'scrum_half', isForward: false, baseSpeed: 0.88, baseStrength: 0.80 },
  10: { number: 10, code: 'FH', name: 'Fly-Half', spanishName: 'Apertura', role: 'fly_half', isForward: false, baseSpeed: 0.86, baseStrength: 0.85 },
  11: { number: 11, code: 'LW', name: 'Left Wing', spanishName: 'Wing Izquierdo', role: 'wing', isForward: false, baseSpeed: 1.08, baseStrength: 0.80 },
  12: { number: 12, code: 'IC', name: 'Inside Centre', spanishName: 'Primer Centro', role: 'centre', isForward: false, baseSpeed: 0.88, baseStrength: 1.02 },
  13: { number: 13, code: 'OC', name: 'Outside Centre', spanishName: 'Segundo Centro', role: 'centre', isForward: false, baseSpeed: 0.90, baseStrength: 0.98 },
  14: { number: 14, code: 'RW', name: 'Right Wing', spanishName: 'Wing Derecho', role: 'wing', isForward: false, baseSpeed: 1.08, baseStrength: 0.80 },
  15: { number: 15, code: 'FB', name: 'Fullback', spanishName: 'Fullback', role: 'fullback', isForward: false, baseSpeed: 0.98, baseStrength: 0.90 },
};

// Official & Famous Rugby Teams
export const RUGBY_TEAMS: TeamData[] = [
  {
    id: 'arg',
    name: 'Los Pumas',
    shortName: 'ARG',
    flag: '🇦🇷',
    ranking: 6,
    kit: {
      primary: '#5bc0de', // Sky blue
      secondary: '#ffffff', // White hoops
      pattern: 'hoops',
      shorts: '#ffffff',
      socks: '#5bc0de',
    },
    awayKit: {
      primary: '#1c2833',
      secondary: '#5bc0de',
      pattern: 'solid',
      shorts: '#1c2833',
      socks: '#5bc0de',
    },
    stats: { speed: 8, strength: 9, kicking: 8, handling: 8 },
  },
  {
    id: 'nzl',
    name: 'All Blacks',
    shortName: 'NZL',
    flag: '🇳🇿',
    ranking: 2,
    kit: {
      primary: '#111111', // Legendary All Black
      secondary: '#ffffff',
      pattern: 'solid',
      shorts: '#111111',
      socks: '#111111',
    },
    awayKit: {
      primary: '#ffffff',
      secondary: '#111111',
      pattern: 'solid',
      shorts: '#111111',
      socks: '#ffffff',
    },
    stats: { speed: 10, strength: 9, kicking: 9, handling: 10 },
  },
  {
    id: 'rsa',
    name: 'Springboks',
    shortName: 'RSA',
    flag: '🇿🇦',
    ranking: 1,
    kit: {
      primary: '#0d4a22', // Deep bottle green
      secondary: '#ffc107', // Gold collar & chest accent
      pattern: 'chest_stripe',
      shorts: '#ffffff',
      socks: '#0d4a22',
    },
    awayKit: {
      primary: '#ffffff',
      secondary: '#0d4a22',
      pattern: 'solid',
      shorts: '#0d4a22',
      socks: '#ffffff',
    },
    stats: { speed: 8, strength: 10, kicking: 9, handling: 8 },
  },
  {
    id: 'fra',
    name: 'Les Bleus',
    shortName: 'FRA',
    flag: '🇫🇷',
    ranking: 4,
    kit: {
      primary: '#19398a', // French Blue
      secondary: '#ffffff',
      pattern: 'solid',
      shorts: '#ffffff',
      socks: '#d32f2f', // Red socks
    },
    awayKit: {
      primary: '#ffffff',
      secondary: '#19398a',
      pattern: 'solid',
      shorts: '#19398a',
      socks: '#ffffff',
    },
    stats: { speed: 9, strength: 8, kicking: 9, handling: 9 },
  },
  {
    id: 'ire',
    name: 'Ireland',
    shortName: 'IRE',
    flag: '🇮🇪',
    ranking: 3,
    kit: {
      primary: '#1b7340', // Shamrock Emerald Green
      secondary: '#ffffff',
      pattern: 'solid',
      shorts: '#ffffff',
      socks: '#1b7340',
    },
    awayKit: {
      primary: '#263238',
      secondary: '#1b7340',
      pattern: 'solid',
      shorts: '#263238',
      socks: '#1b7340',
    },
    stats: { speed: 8, strength: 9, kicking: 8, handling: 9 },
  },
  {
    id: 'eng',
    name: 'England',
    shortName: 'ENG',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    ranking: 5,
    kit: {
      primary: '#ffffff', // Classic White
      secondary: '#d32f2f', // Red rose accent
      pattern: 'solid',
      shorts: '#ffffff',
      socks: '#102040',
    },
    awayKit: {
      primary: '#102040',
      secondary: '#d32f2f',
      pattern: 'solid',
      shorts: '#102040',
      socks: '#102040',
    },
    stats: { speed: 8, strength: 9, kicking: 9, handling: 8 },
  },
  {
    id: 'aus',
    name: 'Wallabies',
    shortName: 'AUS',
    flag: '🇦🇺',
    ranking: 7,
    kit: {
      primary: '#f9a825', // Gold
      secondary: '#1b5e20', // Green collar
      pattern: 'solid',
      shorts: '#1b5e20',
      socks: '#f9a825',
    },
    awayKit: {
      primary: '#1b5e20',
      secondary: '#f9a825',
      pattern: 'solid',
      shorts: '#1b5e20',
      socks: '#1b5e20',
    },
    stats: { speed: 9, strength: 8, kicking: 7, handling: 9 },
  },
  {
    id: 'wal',
    name: 'Wales',
    shortName: 'WAL',
    flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    ranking: 8,
    kit: {
      primary: '#c62828', // Scarlet Red
      secondary: '#ffffff',
      pattern: 'solid',
      shorts: '#ffffff',
      socks: '#c62828',
    },
    awayKit: {
      primary: '#37474f',
      secondary: '#c62828',
      pattern: 'solid',
      shorts: '#37474f',
      socks: '#c62828',
    },
    stats: { speed: 8, strength: 8, kicking: 8, handling: 8 },
  },
  {
    id: 'sco',
    name: 'Scotland',
    shortName: 'SCO',
    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    ranking: 9,
    kit: {
      primary: '#0d233a', // Dark Navy
      secondary: '#8e24aa', // Thistle purple accent
      pattern: 'solid',
      shorts: '#ffffff',
      socks: '#0d233a',
    },
    awayKit: {
      primary: '#e0e0e0',
      secondary: '#0d233a',
      pattern: 'solid',
      shorts: '#0d233a',
      socks: '#0d233a',
    },
    stats: { speed: 9, strength: 8, kicking: 9, handling: 8 },
  },
  {
    id: 'fji',
    name: 'Flying Fijians',
    shortName: 'FJI',
    flag: '🇫🇯',
    ranking: 10,
    kit: {
      primary: '#ffffff', // White
      secondary: '#212121', // Black collar
      pattern: 'solid',
      shorts: '#212121',
      socks: '#212121',
    },
    awayKit: {
      primary: '#212121',
      secondary: '#ffffff',
      pattern: 'solid',
      shorts: '#ffffff',
      socks: '#212121',
    },
    stats: { speed: 10, strength: 8, kicking: 6, handling: 10 },
  },
];
