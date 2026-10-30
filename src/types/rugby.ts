/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RugbyPositionNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export interface RugbyPositionInfo {
  number: RugbyPositionNumber;
  code: string;
  name: string;
  spanishName: string;
  role: 'prop' | 'hooker' | 'lock' | 'flanker' | 'eight' | 'scrum_half' | 'fly_half' | 'centre' | 'wing' | 'fullback';
  isForward: boolean;
  baseSpeed: number; // 0.8 - 1.2
  baseStrength: number; // 0.8 - 1.3
}

export interface TeamKit {
  primary: string; // Jersey base color
  secondary: string; // Jersey stripes / hoops / collar
  pattern: 'solid' | 'hoops' | 'sash' | 'chest_stripe';
  shorts: string;
  socks: string;
  scrumCapColor?: string;
}

export interface TeamData {
  id: string;
  name: string;
  shortName: string;
  flag: string;
  ranking: number;
  kit: TeamKit;
  awayKit: TeamKit;
  stats: {
    speed: number;    // 1-10
    strength: number; // 1-10
    kicking: number;  // 1-10
    handling: number; // 1-10
  };
}

export type PlayerState = 
  | 'idle'
  | 'running'
  | 'passing'
  | 'tackling'
  | 'tackled'
  | 'rucking'
  | 'scrum'
  | 'lineout'
  | 'kicking'
  | 'celebrating'
  | 'diving'
  | 'hand_off'
  | 'injured';

export type RugbyBodyType = 
  | 'prop_heavy'      // Numbers 1, 3 (Pilares) & 2 (Hooker): stocky, broad torso, low center of gravity
  | 'lock_tall'        // Numbers 4, 5 (Segunda Línea): tall, long legs, lineout jumper
  | 'flanker_athletic' // Numbers 6, 7 (Flankers) & 8 (N8): strong, balanced, quick ruck arrival
  | 'scrumhalf_agile'  // Number 9 (Medio Scrum): compact, swift pass acceleration
  | 'flyhalf_balanced' // Number 10 (Apertura): tactical posture, kicker
  | 'back_speed';      // Numbers 11, 14 (Wings), 12, 13 (Centros), 15 (Fullback): lean, long sprint stride

export type TackleVariant =
  | 'front_shoulder'   // Attacker driven backward onto back
  | 'rear_slide'       // Chased from behind, sliding forward on stomach
  | 'lateral_roll'     // Hit from flank, tumbling side roll
  | 'low_ankle'        // Low ankle tap, headlong trip
  | 'high_torso'       // Heavy upper chest wrap
  | 'double_hit'       // Two tacklers pinning carrier
  | 'drag_down'        // Forward drags tackler 1-2 steps before collapsing
  | 'whiff_evaded'     // Attacker jukes, tackler whiffs to grass
  | 'aerial_contest'   // Hit in air contesting high ball
  | 'sprint_slip';     // Slipping while at top speed

export interface TackleStateData {
  phase: 'anticipation' | 'impact' | 'displacement' | 'fall' | 'ground' | 'get_up';
  variant: TackleVariant;
  timer: number;
  hitStopTimer: number;
  slideVx: number;
  slideVy: number;
  defenderId?: string;
  fallProgress: number; // 0 to 1
}

export interface Player {
  id: string;
  teamId: 'A' | 'B';
  position: RugbyPositionNumber;
  name: string;
  x: number; // Internal low-res pitch coordinates
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  facing: 'left' | 'right';
  state: PlayerState;
  stateTimer: number;
  animFrame: number;
  animTimer: number;
  stamina: number; // 0 - 100
  skinTone: string;
  hairColor: string;
  hairStyle: 'classic' | 'buzz' | 'wavy' | 'afro' | 'undercut' | 'bald';
  hasBeard: boolean;
  bodyType: RugbyBodyType;
  hasScrumCap: boolean;
  scrumCapColor?: string;
  isUserControlled: boolean;
  speed: number;
  strength: number;
  tackleState?: TackleStateData | null;
}

export type BallState = 'held' | 'in_air_pass' | 'in_air_kick' | 'loose' | 'grounded';

export interface Ball {
  x: number;
  y: number;
  z: number; // Height off the ground (0 for on ground / held, >0 when kicked or passed)
  vx: number;
  vy: number;
  vz: number;
  state: BallState;
  carrierId: string | null;
  lastCarrierId: string | null;
  passStartX: number;
  passStartY: number;
  kickType?: 'punt' | 'grubber' | 'conversion' | 'drop';
  rotation: number;
  targetReceiverId?: string | null;
  kickImmunityTimer?: number;
}

export type MatchSituation = 
  | 'OPEN_PLAY'
  | 'RUCK'
  | 'SCRUM'
  | 'LINEOUT'
  | 'CONVERSION'
  | 'PENALTY_KICK'
  | 'PENALTY_DECISION'
  | 'TRY_SCORED'
  | 'KNOCK_ON'
  | 'HALF_TIME'
  | 'FULL_TIME'
  | 'RIVAL_DRIVE';

export type ScrumSetPlay = 
  | 'pick_and_go_8'    // Salida potente del 8 desde la base
  | 'backline_wings'    // Apertura rápida 9 -> 10 -> Wings por afuera
  | 'crash_center_12'  // Crash ball con el centro 12 atacando el canal
  | 'scissors_10_12';  // Tijera / Cruce 10-12 con fullback entrando desde atrás

export interface PenaltyDecisionData {
  teamAwarded: 'A' | 'B';
  x: number;
  y: number;
  reason: string;
}

export interface RuckContest {
  x: number;
  y: number;
  progress: number; // -100 (Team B dominates) to +100 (Team A dominates)
  timer: number;
  teamAForwards: string[];
  teamBForwards: string[];
  tackledPlayerId: string;
  tacklerPlayerId: string;
  readyToPass: boolean;
}

export interface ScrumContest {
  x: number;
  y: number;
  feedingTeam: 'A' | 'B';
  progress: number;
  timer: number;
  stage: 'selecting' | 'crouch' | 'bind' | 'set' | 'push' | 'won';
  readyToRelease: boolean;
  selectedSetPlay?: ScrumSetPlay;
}

export interface LineoutContest {
  x: number;
  y: number;
  throwingTeam: 'A' | 'B';
  jumpTimer: number;
  stage: 'lineup' | 'throw' | 'jump' | 'secured';
  jumperAHeight: number;
  jumperBHeight: number;
  securedBy: 'A' | 'B' | null;
}

export interface ConversionContest {
  kickerId: string;
  kickX: number;
  kickY: number;
  targetPostX: number;
  targetPostY: number;
  angle: number; // degrees
  angleSpeed: number;
  angleDir: number;
  power: number; // 0 - 100
  powerSpeed: number;
  powerDir: number;
  stage: 'aiming' | 'power' | 'flight' | 'result';
  isSuccess: boolean | null;
  ballFlightTimer: number;
  pointsValue: 2 | 3; // 2 for conversion, 3 for penalty kick / drop goal
}

export interface MatchStats {
  scoreA: number;
  scoreB: number;
  triesA: number;
  triesB: number;
  conversionsA: number;
  conversionsB: number;
  penaltiesA: number;
  penaltiesB: number;
  dropGoalsA: number;
  dropGoalsB: number;
  tacklesA: number;
  tacklesB: number;
  metresGainedA: number;
  metresGainedB: number;
  possessionFramesA: number;
  possessionFramesB: number;
  knockOnsA: number;
  knockOnsB: number;
  scrumsWonA: number;
  scrumsWonB: number;
}

export interface MatchEventMessage {
  id: string;
  text: string;
  subtext?: string;
  type: 'try' | 'whistle' | 'points' | 'turnover' | 'info';
  timer: number;
}
