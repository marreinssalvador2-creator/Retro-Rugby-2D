/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Player,
  Ball,
  TeamData,
  MatchSituation,
  MatchStats,
  RuckContest,
  ScrumContest,
  LineoutContest,
  ConversionContest,
  MatchEventMessage,
  RugbyPositionNumber,
  TackleVariant,
  TackleStateData,
  ScrumSetPlay,
  PenaltyDecisionData,
} from '../types/rugby';
import {
  PITCH_HALFWAY,
  PITCH_TRYLINE_LEFT,
  PITCH_TRYLINE_RIGHT,
  PITCH_22M_LEFT,
  PITCH_22M_RIGHT,
  PITCH_TOUCH_LINE_TOP,
  PITCH_TOUCH_LINE_BOTTOM,
  PITCH_DEADBALL_LEFT,
  PITCH_DEADBALL_RIGHT,
  H_POST_Y_CENTER,
  RUGBY_POSITIONS,
  SCRUM_CAP_COLORS,
  SKIN_TONES,
  HAIR_COLORS,
  HAIR_STYLES,
  getBodyTypeForPosition,
} from './constants';
import { retroAudio } from '../audio/retroAudio';

export interface SlingshotKickAim {
  isDragging: boolean;
  power: number; // 0 to 1
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
}

export interface GameInput {
  moveX: number;
  moveY: number;
  sprint: boolean;
  passRequested: boolean;
  kickRequested: boolean;
  tackleRequested: boolean;
  switchPlayerRequested: boolean;
  aimTarget: { x: number; y: number } | null;
  slingshotAim?: SlingshotKickAim | null;
  slingshotRelease?: boolean;
}

export class RugbyGameEngine {
  public teamA: TeamData; // User team (attacks left to right)
  public teamB: TeamData; // Opponent AI team (attacks right to left)
  public players: Player[] = [];
  public ball: Ball;
  public situation: MatchSituation = 'OPEN_PLAY';
  public stats: MatchStats;
  public matchTimeRemaining: number; // in seconds
  public currentHalf: 1 | 2 = 1;
  public isPaused: boolean = false;
  public userControllingId: string | null = null;

  // Breakdown & set piece states
  public ruck: RuckContest | null = null;
  public scrum: ScrumContest | null = null;
  public lineout: LineoutContest | null = null;
  public conversion: ConversionContest | null = null;
  public penaltyDecision: PenaltyDecisionData | null = null;
  public rivalDrive: {
    stage: 'pelota_perdida' | 'rival_avanza' | 'rack' | 'outcome_recovered' | 'outcome_try' | 'outcome_conversion';
    timer: number;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    isTry: boolean;
    carrierId: string;
  } | null = null;

  // Visual particles
  public particles: { x: number; y: number; vx: number; vy: number; color: string; life: number }[] = [];

  // Match events feed
  public eventMessage: MatchEventMessage | null = null;

  // Kickoff / restart timer
  private restartTimer: number = 0;
  private whistleTimer: number = 0;
  public tackleProtectionTimer: number = 0;
  private lastScoringTeam: 'A' | 'B' = 'A';

  // Vertical dodging cooldown (creates a ~0.45s - 0.5s commitment delay when cutting up or down)
  public dodgeCooldownTimer: number = 0;
  public activeDodgeY: number = 0;

  constructor(teamA: TeamData, teamB: TeamData, matchDurationSeconds: number = 180) {
    this.teamA = teamA;
    this.teamB = teamB;
    this.matchTimeRemaining = matchDurationSeconds;

    this.ball = {
      x: PITCH_HALFWAY,
      y: H_POST_Y_CENTER,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      state: 'held',
      carrierId: null,
      lastCarrierId: null,
      passStartX: 0,
      passStartY: 0,
      rotation: 0,
    };

    this.stats = {
      scoreA: 0,
      scoreB: 0,
      triesA: 0,
      triesB: 0,
      conversionsA: 0,
      conversionsB: 0,
      penaltiesA: 0,
      penaltiesB: 0,
      dropGoalsA: 0,
      dropGoalsB: 0,
      tacklesA: 0,
      tacklesB: 0,
      metresGainedA: 0,
      metresGainedB: 0,
      possessionFramesA: 0,
      possessionFramesB: 0,
      knockOnsA: 0,
      knockOnsB: 0,
      scrumsWonA: 0,
      scrumsWonB: 0,
    };

    this.initPlayers();
    this.setupKickoff('A');
  }

  private initPlayers() {
    this.players = [];

    // Spawn 15 players for Team A
    for (let posNum = 1; posNum <= 15; posNum++) {
      const pos = RUGBY_POSITIONS[posNum];
      const p: Player = {
        id: `A_${posNum}`,
        teamId: 'A',
        position: posNum as RugbyPositionNumber,
        name: `${pos.code} ${pos.spanishName}`,
        x: PITCH_HALFWAY - 40,
        y: H_POST_Y_CENTER,
        vx: 0,
        vy: 0,
        targetX: PITCH_HALFWAY - 40,
        targetY: H_POST_Y_CENTER,
        facing: 'right',
        state: 'idle',
        stateTimer: 0,
        animFrame: 0,
        animTimer: 0,
        stamina: 100,
        skinTone: SKIN_TONES[(posNum - 1) % SKIN_TONES.length],
        hairColor: HAIR_COLORS[(posNum * 2) % HAIR_COLORS.length],
        hairStyle: HAIR_STYLES[(posNum - 1) % HAIR_STYLES.length],
        hasBeard: posNum % 4 === 0 || posNum === 1 || posNum === 8,
        bodyType: getBodyTypeForPosition(posNum),
        hasScrumCap: pos.isForward,
        scrumCapColor: pos.isForward ? SCRUM_CAP_COLORS[(posNum - 1) % SCRUM_CAP_COLORS.length] : undefined,
        isUserControlled: posNum === 10, // Fly-half starts controlled
        speed: pos.baseSpeed * (0.9 + this.teamA.stats.speed * 0.02),
        strength: pos.baseStrength * (0.9 + this.teamA.stats.strength * 0.02),
        tackleState: null,
      };
      this.players.push(p);
    }

    // Spawn 15 players for Team B
    for (let posNum = 1; posNum <= 15; posNum++) {
      const pos = RUGBY_POSITIONS[posNum];
      const p: Player = {
        id: `B_${posNum}`,
        teamId: 'B',
        position: posNum as RugbyPositionNumber,
        name: `${pos.code} ${pos.spanishName}`,
        x: PITCH_HALFWAY + 40,
        y: H_POST_Y_CENTER,
        vx: 0,
        vy: 0,
        targetX: PITCH_HALFWAY + 40,
        targetY: H_POST_Y_CENTER,
        facing: 'left',
        state: 'idle',
        stateTimer: 0,
        animFrame: 0,
        animTimer: 0,
        stamina: 100,
        skinTone: SKIN_TONES[(posNum + 1) % SKIN_TONES.length],
        hairColor: HAIR_COLORS[(posNum + 3) % HAIR_COLORS.length],
        hairStyle: HAIR_STYLES[(posNum + 2) % HAIR_STYLES.length],
        hasBeard: posNum % 3 === 0,
        bodyType: getBodyTypeForPosition(posNum),
        hasScrumCap: pos.isForward,
        scrumCapColor: pos.isForward ? SCRUM_CAP_COLORS[(posNum + 3) % SCRUM_CAP_COLORS.length] : undefined,
        isUserControlled: false,
        speed: pos.baseSpeed * (0.9 + this.teamB.stats.speed * 0.02),
        strength: pos.baseStrength * (0.9 + this.teamB.stats.strength * 0.02),
        tackleState: null,
      };
      this.players.push(p);
    }

    this.userControllingId = 'A_10';
  }

  /**
   * Sets up kickoff positions from halfway
   */
  public setupKickoff(kickingTeam: 'A' | 'B') {
    this.situation = 'OPEN_PLAY';
    this.ruck = null;
    this.scrum = null;
    this.lineout = null;
    this.conversion = null;
    this.rivalDrive = null;

    if (kickingTeam === 'A') {
      const kicker = this.players.find(p => p.teamId === 'A' && p.position === 10)!;
      kicker.x = PITCH_HALFWAY;
      kicker.y = H_POST_Y_CENTER;
      kicker.facing = 'right';

      this.ball.x = PITCH_HALFWAY;
      this.ball.y = H_POST_Y_CENTER;
      this.ball.z = 0;
      this.ball.vx = 0;
      this.ball.vy = 0;
      this.ball.vz = 0;
      this.ball.state = 'held';
      this.ball.carrierId = kicker.id;
      this.ball.lastCarrierId = kicker.id;

      this.setUserControlled(kicker.id);
      this.alignTeamFormation('A', PITCH_HALFWAY - 50, 'attack');
      this.alignTeamFormation('B', PITCH_HALFWAY + 120, 'defense');

      retroAudio.playWhistle();
      this.showEvent('¡KICKOFF!', 'Comienza la jugada', 'whistle');
    } else {
      // Rival kicks off deep to Los Pumas fullback #15 who catches it in the 22m area
      const fullback = this.players.find(p => p.teamId === 'A' && p.position === 15) || this.players.find(p => p.teamId === 'A')!;
      fullback.x = PITCH_22M_LEFT + 25;
      fullback.y = H_POST_Y_CENTER;
      fullback.facing = 'right';

      this.ball.x = fullback.x;
      this.ball.y = fullback.y;
      this.ball.z = 0;
      this.ball.vx = 0;
      this.ball.vy = 0;
      this.ball.vz = 0;
      this.ball.state = 'held';
      this.ball.carrierId = fullback.id;
      this.ball.lastCarrierId = fullback.id;

      this.setUserControlled(fullback.id);
      this.alignTeamFormation('A', PITCH_22M_LEFT - 10, 'attack');
      this.alignTeamFormation('B', PITCH_HALFWAY + 30, 'defense');

      retroAudio.playWhistle();
      this.showEvent('¡RECEPCIÓN PUMA!', 'Los Pumas reciben la salida rival', 'info');
    }
  }

  /**
   * Returns standard tactical rugby width channel (Y: 90 - 430) well inside the 520-unit pitch.
   * Backline fans out across the field while forward pods provide close, structured support.
   */
  public getTacticalLane(position: number, ruckY: number = H_POST_Y_CENTER): number {
    const clampedY = Math.max(PITCH_TOUCH_LINE_TOP + 80, Math.min(PITCH_TOUCH_LINE_BOTTOM - 80, ruckY));
    switch (position) {
      // Wings hold touchline width across both edges
      case 11: return PITCH_TOUCH_LINE_TOP + 40;  // Left Wing (Wide Top channel)
      case 14: return PITCH_TOUCH_LINE_BOTTOM - 40; // Right Wing (Wide Bottom channel)

      // Tight Five Forward Pod (Front row & Locks close around the ball)
      case 1:  return clampedY - 26; // Loosehead Prop
      case 2:  return clampedY - 10; // Hooker
      case 3:  return clampedY + 18; // Tighthead Prop
      case 4:  return clampedY - 18; // Lock
      case 5:  return clampedY + 22; // Lock

      // Back Row Loose Forwards (Flankers & Number 8)
      case 6:  return clampedY - 48; // Blindside Flanker
      case 7:  return clampedY + 48; // Openside Flanker
      case 8:  return clampedY;      // Number 8 (directly behind base)

      // Backs: Classical angled diagonal backline
      case 9:  return clampedY;      // Scrum-Half (pivot at base)
      case 10: return clampedY + 36; // Fly-Half (first receiver)
      case 12: return clampedY + 68; // Inside Centre
      case 13: return clampedY + 100; // Outside Centre
      case 15: return clampedY - 32; // Fullback (roaming sweeper)
      default: return clampedY;
    }
  }

  /**
   * Returns attacking depth behind ball carrier (units)
   */
  public getAttackDepth(position: number): number {
    switch (position) {
      case 1:
      case 2:
      case 3:
        return 12; // Tight forward pod
      case 4:
      case 5:
      case 8:
        return 16; // Crash forward pod
      case 6:
      case 7:
        return 18; // Link flankers
      case 9:
        return 6;  // Scrum-half close pivot
      case 10:
        return 22; // Fly-half playmaker depth
      case 12:
        return 30; // Inside Centre
      case 13:
        return 38; // Outside Centre
      case 11:
      case 14:
        return 28; // Wings running the outside channel
      case 15:
        return 50; // Fullback sweeping deep
      default:
        return 20;
    }
  }

  /**
   * Arranges authentic rugby union backline depth and forward pods
   */
  private alignTeamFormation(teamId: 'A' | 'B', anchorX: number, role: 'attack' | 'defense', ruckY: number = H_POST_Y_CENTER) {
    const isTeamA = teamId === 'A';
    const dir = isTeamA ? 1 : -1;
    const teamPlayers = this.players.filter(p => p.teamId === teamId);

    for (const p of teamPlayers) {
      p.state = 'idle';
      p.vx = 0;
      p.vy = 0;
      p.facing = isTeamA ? 'right' : 'left';

      const laneY = this.getTacticalLane(p.position, ruckY);

      if (role === 'attack') {
        const depth = this.getAttackDepth(p.position);
        p.targetX = anchorX - dir * depth;
        p.targetY = laneY;
      } else {
        // Defensive flat wall on offside line
        p.targetX = anchorX;
        p.targetY = laneY;
        if (p.position === 15) {
          p.targetX = anchorX + dir * 65; // Fullback deep sweeper
        } else if (p.position === 9) {
          p.targetX = anchorX + dir * 18; // Scrum-half sweeping behind line
        }
      }

      p.x = p.targetX;
      p.y = p.targetY;
    }
  }

  public setUserControlled(playerId: string) {
    for (const p of this.players) {
      p.isUserControlled = p.id === playerId;
    }
    this.userControllingId = playerId;
  }

  /**
   * Returns true if user team (Team A) is currently on defense (does not have possession of ball)
   */
  public isUserDefending(): boolean {
    if (this.situation === 'RIVAL_DRIVE') return false;
    if (this.ball.carrierId) {
      const carrier = this.players.find(p => p.id === this.ball.carrierId);
      return carrier?.teamId !== 'A';
    }
    return true; // Loose ball or in air without Team A possession allows defender switching
  }

  /**
   * Main game tick (called 60 FPS)
   */
  public update(dt: number, input: GameInput) {
    if (this.isPaused) return;

    // Handle event banner timers
    if (this.eventMessage) {
      this.eventMessage.timer -= dt;
      if (this.eventMessage.timer <= 0) {
        this.eventMessage = null;
      }
    }

    // Decrement dodge transition / direction switch cooldown
    if (this.dodgeCooldownTimer > 0) {
      this.dodgeCooldownTimer = Math.max(0, this.dodgeCooldownTimer - dt);
    }

    // Decrement match clock during open play
    if (this.situation === 'OPEN_PLAY') {
      this.matchTimeRemaining -= dt;
      if (this.matchTimeRemaining <= 0) {
        this.handleHalfOrFullTime();
        return;
      }

      // Track possession
      if (this.ball.carrierId) {
        const carrier = this.players.find(p => p.id === this.ball.carrierId);
        if (carrier) {
          if (carrier.teamId === 'A') this.stats.possessionFramesA++;
          else this.stats.possessionFramesB++;
        }
      }
    }

    // Particles update
    this.updateParticles(dt);

    // Branch update based on situation
    switch (this.situation) {
      case 'OPEN_PLAY':
        this.updateOpenPlay(dt, input);
        break;
      case 'RIVAL_DRIVE':
        this.updateRivalDrive(dt);
        break;
      case 'RUCK':
        this.updateRuck(dt, input);
        break;
      case 'SCRUM':
        this.updateScrum(dt, input);
        break;
      case 'LINEOUT':
        this.updateLineout(dt, input);
        break;
      case 'CONVERSION':
      case 'PENALTY_KICK':
        this.updateConversion(dt, input);
        break;
      case 'PENALTY_DECISION':
        this.updatePenaltyDecision(dt);
        break;
      case 'TRY_SCORED':
        this.updateTryCelebration(dt);
        break;
      case 'KNOCK_ON':
        this.updateKnockOnWhistle(dt);
        break;
    }
  }

  /**
   * Calculates player speed adjusted for physical stamina / fatigue
   * Only the player carrying the ball tires after running a lot, running slightly slower (no indicator bar)
   */
  public getFatiguedSpeed(player: Player): number {
    if (this.ball.carrierId !== player.id) {
      return player.speed;
    }
    const s = Math.max(0, Math.min(100, player.stamina));
    // When running a lot with the ball, carrier tires and runs slightly slower (up to 18% slower at low stamina, but still responsive)
    const fatigueFactor = 0.82 + 0.18 * (s / 100);
    return player.speed * fatigueFactor;
  }

  /**
   * Open Play: Running, passing backwards, tackling, kicking, breakdown triggers
   */
  private updateOpenPlay(dt: number, input: GameInput) {
    const carrier = this.players.find(p => p.id === this.ball.carrierId);
    const isTeamACarrying = carrier && carrier.teamId === 'A';
    const isTeamBCarrying = carrier && carrier.teamId === 'B';

    // 1. Control assignment:
    if (isTeamACarrying) {
      // In attack: User MUST ALWAYS control the ball carrier!
      if (this.userControllingId !== carrier.id) {
        this.setUserControlled(carrier.id);
      }
    } else if (isTeamBCarrying) {
      // In defense: User controls the nearest Team A defender to make tackles!
      const userPlayer = this.players.find(p => p.isUserControlled);
      if (!userPlayer || userPlayer.teamId !== 'A' || userPlayer.state === 'tackled') {
        this.switchControlToNearestDefender(carrier.x, carrier.y);
      } else {
        const distToCarrier = Math.hypot(userPlayer.x - carrier.x, userPlayer.y - carrier.y);
        // If controlled defender is caught too far (> 110 units), auto-switch to closer defender so user can defend!
        if (distToCarrier > 110) {
          this.switchControlToNearestDefender(carrier.x, carrier.y);
        }
      }
    } else {
      // Loose ball or ball in air: ensure active Team A player is controlled
      const userPlayer = this.players.find(p => p.isUserControlled);
      if (!userPlayer || userPlayer.teamId !== 'A' || userPlayer.state === 'tackled') {
        const activeTeammates = this.players.filter(p => p.teamId === 'A' && p.state !== 'tackled');
        if (activeTeammates.length > 0) {
          activeTeammates.sort((a, b) => Math.hypot(a.x - this.ball.x, a.y - this.ball.y) - Math.hypot(b.x - this.ball.x, b.y - this.ball.y));
          this.setUserControlled(activeTeammates[0].id);
        }
      }
    }

    // 2. User Controlled Player Input & Movement
    const userPlayer = this.players.find(p => p.isUserControlled);
    if (userPlayer && userPlayer.state !== 'tackled') {
      const isCarrying = this.ball.carrierId === userPlayer.id;
      const baseSpd = this.getFatiguedSpeed(userPlayer);
      let speedMult = baseSpd * 1.6;

      // Sprint boost drains extra stamina
      if (input.sprint && userPlayer.stamina > 10) {
        speedMult *= 1.30;
      }

      if (isCarrying && userPlayer.teamId === 'A') {
        // Forward run towards opponent tryline in stride
        userPlayer.vx = speedMult * 0.94;
        userPlayer.facing = 'right';
        userPlayer.state = 'running';

        // Rugby sidestep / amague commitment with ~0.48s delay between cutting up and down
        const reqDir = Math.abs(input.moveY) > 0.25 ? Math.sign(input.moveY) : 0;
        if (reqDir !== 0 && reqDir !== this.activeDodgeY) {
          // Player requests a cut in a new vertical direction (up or down)
          if (this.dodgeCooldownTimer <= 0) {
            this.activeDodgeY = reqDir;
            this.dodgeCooldownTimer = 0.48; // ~0.5 second commitment delay before switching!
            this.spawnDustParticles(userPlayer.x - 2, userPlayer.y + 4, 4);
            retroAudio.playBlip();
          }
        } else if (reqDir === 0 && this.dodgeCooldownTimer <= 0.18) {
          this.activeDodgeY = 0;
        }

        const targetVy = this.activeDodgeY * speedMult * 0.88;
        // Heavy, weighted rugby physical momentum when steering up and down
        userPlayer.vy += (targetVy - userPlayer.vy) * 0.16;
      } else {
        // On defense or loose ball chasing: full 2D movement to position and tackle!
        userPlayer.vx = input.moveX * speedMult;
        userPlayer.vy = input.moveY * speedMult;

        if (input.moveX !== 0 || input.moveY !== 0) {
          userPlayer.state = 'running';
          if (input.moveX > 0) userPlayer.facing = 'right';
          else if (input.moveX < 0) userPlayer.facing = 'left';
        } else {
          userPlayer.state = 'idle';
        }
      }

      // Slingshot Kick Action (drag backwards to project forward arc & kick)
      if (isCarrying && input.slingshotRelease && input.slingshotAim) {
        this.executeSlingshotKick(userPlayer, input.slingshotAim);
      }

      // Pass Action (Space, Click Release, or Touch Button)
      if (isCarrying && input.passRequested) {
        this.attemptPass(userPlayer, input.aimTarget, input.moveY);
      }

      // Tactical Kick Action (Q)
      if (isCarrying && input.kickRequested) {
        this.attemptTacticalKick(userPlayer);
      }

      // Tackle Attempt / Fend Action (F key, or tap on defense)
      if (!isCarrying && (input.tackleRequested || input.passRequested)) {
        userPlayer.state = 'tackling';
        userPlayer.stateTimer = 0.35;
        this.attemptTackle(userPlayer);
      }
    }

    // 3. Switch Defender Request (E key or mobile button)
    if (input.switchPlayerRequested) {
      if (!carrier || carrier.teamId !== 'A') {
        this.switchControlToNearestDefender(this.ball.x, this.ball.y);
      }
    }

    // 4. Update Ball in Air or Loose
    this.updateBallPhysics(dt);
    this.updateTackleStates(dt);

    // 5. Update All Players: Stamina fatigue, AI logic, and physics integration
    for (const p of this.players) {
      this.updatePlayerAnimations(p, dt);

      // AI logic for non-user controlled players
      if (!p.isUserControlled) {
        this.updateAIPlayer(p, carrier ?? null, dt);
      }

      // Stamina drain: ONLY the ball carrier tires after running a lot!
      if (this.ball.carrierId === p.id) {
        if (p.state === 'running') {
          const isSprinting = p.isUserControlled && input.sprint;
          const drain = isSprinting ? 6.5 : 3.2;
          p.stamina = Math.max(0, p.stamina - dt * drain);
        } else {
          p.stamina = Math.min(100, p.stamina + dt * 10.0);
        }
      } else {
        // Players without the ball keep their full stamina
        p.stamina = Math.min(100, p.stamina + dt * 20.0);
      }

      // Physics integration
      p.x += p.vx;
      p.y += p.vy;

      // Sideline touch check for ball carrier
      if (this.ball.carrierId === p.id) {
        if (p.y < PITCH_TOUCH_LINE_TOP - 2 || p.y > PITCH_TOUCH_LINE_BOTTOM + 2) {
          this.triggerLineout(p.x, p.y <= PITCH_TOUCH_LINE_TOP ? PITCH_TOUCH_LINE_TOP : PITCH_TOUCH_LINE_BOTTOM, p.teamId === 'A' ? 'B' : 'A');
          return;
        }

        // Try Grounding Check!
        this.checkTryScored(p);
      }

      // Pitch boundaries clamp
      p.x = Math.max(PITCH_DEADBALL_LEFT + 10, Math.min(PITCH_DEADBALL_RIGHT - 10, p.x));
      p.y = Math.max(PITCH_TOUCH_LINE_TOP - 1, Math.min(PITCH_TOUCH_LINE_BOTTOM + 1, p.y));
    }

    // Teammate soft separation (prevents crowding / bunching up)
    for (let i = 0; i < this.players.length; i++) {
      const p1 = this.players[i];
      if (p1.state === 'tackled' || p1.state === 'rucking') continue;
      for (let j = i + 1; j < this.players.length; j++) {
        const p2 = this.players[j];
        if (p1.teamId === p2.teamId && p2.state !== 'tackled' && p2.state !== 'rucking') {
          const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (d < 16 && d > 0.1) {
            const push = (16 - d) * 0.12;
            const nx = (p1.x - p2.x) / d;
            const ny = (p1.y - p2.y) / d;
            if (!p1.isUserControlled) { p1.x += nx * push; p1.y += ny * push; }
            if (!p2.isUserControlled) { p2.x -= nx * push; p2.y -= ny * push; }
          }
        }
      }
    }

    // 6. Tackle Collisions between ball carrier and opponents
    if (this.tackleProtectionTimer > 0) {
      this.tackleProtectionTimer -= dt;
    }

    if (carrier && carrier.state !== 'tackled' && carrier.state !== 'diving' && this.tackleProtectionTimer <= 0) {
      for (const opp of this.players) {
        if (opp.teamId !== carrier.teamId && opp.state !== 'tackled' && opp.state !== 'rucking' && opp.state !== 'diving') {
          const dx = carrier.x - opp.x;
          const dy = carrier.y - opp.y;
          const dist = Math.hypot(dx, dy);

          // Juke / Amague check: only triggers if player actively cuts with vertical input
          if (carrier.teamId === 'A' && dist < 22 && dist >= 13) {
            const isAmagando = Math.abs(input.moveY) > 0.40 && this.dodgeCooldownTimer > 0.28;
            // Deliberate juke makes defender whiff and fall flat to turf
            if (isAmagando && opp.state === 'running' && Math.random() < 0.24) {
              opp.state = 'tackled';
              opp.stateTimer = 1.3;
              opp.vx = -0.4;
              opp.vy = (Math.random() - 0.5) * 0.6;
              this.spawnDustParticles(opp.x, opp.y, 10);
              retroAudio.playWhiff();
              this.showEvent('¡AMAGUE EXITOSO!', '¡El defensor pasó de largo!', 'info');
              continue;
            }
          }

          // Tackle execution within 13 units
          if (dist < 13) {
            // Check for high tackle referee whistle (Penalty!)
            if (opp.teamId === 'B' && Math.random() < 0.12) {
              this.triggerPenalty(carrier.x, carrier.y, 'A', '¡PENAL! Tackle alto peligroso');
              return;
            }

            opp.state = 'tackling';
            opp.x += (carrier.x - opp.x) * 0.35;
            opp.y += (carrier.y - opp.y) * 0.35;
            this.executeTackle(carrier, opp);
            break;
          }
        }
      }
    }
  }

  /**
   * Identifies primary eligible support runner for display and passing
   */
  public getPrimaryPassTarget(carrier?: Player | null, moveY: number = 0): Player | null {
    const c = carrier || this.players.find(p => p.id === this.ball.carrierId);
    if (!c) return null;
    return this.selectTargetReceiver(c, null, moveY);
  }

  /**
   * Intelligently selects the best nearby support runner to receive the pass.
   * Passes can only be thrown to nearby teammates (max 95 units), avoiding unrealistic full-field passes.
   */
  public selectTargetReceiver(carrier: Player, aimTarget: { x: number; y: number } | null, moveY: number = 0): Player | null {
    const isTeamA = carrier.teamId === 'A';
    const MAX_PASS_DIST = 95; // Rugby reality: short-to-medium support passes only, never across field!

    // Teammates eligible to receive
    const teammates = this.players.filter(p => 
      p.teamId === carrier.teamId && 
      p.id !== carrier.id && 
      p.state !== 'tackled'
    );

    if (teammates.length === 0) return null;

    // Filter teammates within max pass distance (no "punta a punta" passes)
    const nearbyTeammates = teammates.filter(p => {
      const dist = Math.hypot(p.x - carrier.x, p.y - carrier.y);
      return dist <= MAX_PASS_DIST;
    });

    if (nearbyTeammates.length === 0) return null;

    // Filter teammates who are legally behind or flat relative to carrier
    const backwardTeammates = nearbyTeammates.filter(p => {
      const isBehind = isTeamA ? (p.x <= carrier.x + 8) : (p.x >= carrier.x - 8);
      return isBehind;
    });

    const pool = backwardTeammates.length > 0 ? backwardTeammates : nearbyTeammates;

    // 1. If user clicked on or aimed near a specific teammate within pool
    if (aimTarget) {
      let closestByAim: Player | null = null;
      let minAimDist = Infinity;
      for (const t of pool) {
        const d = Math.hypot(t.x - aimTarget.x, t.y - aimTarget.y);
        if (d < minAimDist) {
          minAimDist = d;
          closestByAim = t;
        }
      }
      if (closestByAim && minAimDist < 48) {
        return closestByAim;
      }
    }

    // 2. Directional intent if moving vertically (amague up/down)
    if (moveY < -0.15) {
      // User is moving Up: prefer teammates above carrier (lower Y)
      const topOptions = pool.filter(p => p.y < carrier.y - 8);
      if (topOptions.length > 0) {
        topOptions.sort((a, b) => Math.hypot(a.x - carrier.x, a.y - carrier.y) - Math.hypot(b.x - carrier.x, b.y - carrier.y));
        return topOptions[0];
      }
    } else if (moveY > 0.15) {
      // User is moving Down: prefer teammates below carrier (higher Y)
      const botOptions = pool.filter(p => p.y > carrier.y + 8);
      if (botOptions.length > 0) {
        botOptions.sort((a, b) => Math.hypot(a.x - carrier.x, a.y - carrier.y) - Math.hypot(b.x - carrier.x, b.y - carrier.y));
        return botOptions[0];
      }
    }

    // 3. Rugby Backline Chain progression among nearby pool
    const backlineOrder: Record<number, number[]> = {
      9: [10, 12, 8, 1, 2],
      10: [12, 13, 15, 11, 14],
      12: [13, 10, 15, 14, 11],
      13: [14, 11, 15, 12],
      11: [15, 10, 12, 13],
      14: [15, 13, 12, 10],
      15: [14, 13, 11, 10],
      1: [9, 10, 2, 3],
      2: [9, 10, 1, 3],
      3: [9, 10, 2, 1],
      4: [9, 10, 8, 5],
      5: [9, 10, 8, 4],
      6: [9, 10, 12, 8],
      7: [9, 10, 12, 8],
      8: [9, 10, 12, 7],
    };

    const preferredPositions = backlineOrder[carrier.position] || [10, 12, 9, 15];
    for (const posNum of preferredPositions) {
      const match = pool.find(p => p.position === posNum);
      if (match) return match;
    }

    // Fallback: closest legal teammate in pool
    pool.sort((a, b) => Math.hypot(a.x - carrier.x, a.y - carrier.y) - Math.hypot(b.x - carrier.x, b.y - carrier.y));
    return pool[0] || null;
  }

  /**
   * Attempts a pass with strict Rugby backward pass enforcement
   */
  private attemptPass(passer: Player, aimTarget: { x: number; y: number } | null, moveY: number = 0) {
    const isTeamA = passer.teamId === 'A';

    const receiver = this.selectTargetReceiver(passer, aimTarget, moveY);
    if (!receiver) {
      this.showEvent('¡SIN APOYO CERCANO!', 'Mantené la pelota viva', 'info');
      return;
    }

    // Legal pass execution
    passer.state = 'passing';
    passer.stateTimer = 0.2;
    retroAudio.playPass();

    // Lead receiver in stride safely
    const rx = isFinite(receiver.x) ? receiver.x : passer.x;
    const ry = isFinite(receiver.y) ? receiver.y : passer.y;
    const rvx = isFinite(receiver.vx) ? receiver.vx : 0;
    const rvy = isFinite(receiver.vy) ? receiver.vy : 0;

    const dist = Math.max(1, Math.hypot(rx - passer.x, ry - passer.y));
    const speed = 7.5;
    const flightTime = Math.max(0.1, dist / (speed * 60));
    const leadX = rvx * (flightTime * 60) * 0.7;
    const leadY = rvy * (flightTime * 60) * 0.7;

    const targetX = rx + leadX;
    const targetY = ry + leadY;

    this.ball.x = passer.x;
    this.ball.y = passer.y;
    this.ball.z = 4;
    this.ball.state = 'in_air_pass';
    this.ball.carrierId = null;
    this.ball.lastCarrierId = passer.id;
    this.ball.targetReceiverId = receiver.id;
    this.ball.passStartX = passer.x;
    this.ball.passStartY = passer.y;

    const dx = targetX - passer.x;
    const dy = targetY - passer.y;
    const realDist = Math.max(1, Math.hypot(dx, dy));

    this.ball.vx = (dx / realDist) * speed;
    this.ball.vy = (dy / realDist) * speed;
    this.ball.vz = 1.8; // Low spiral arc
  }

  /**
   * Tactical Kick (Punt or Grubber or Drop Goal)
   */
  private attemptTacticalKick(kicker: Player) {
    const isTeamA = kicker.teamId === 'A';
    const attackingDir = isTeamA ? 1 : -1;
    const distToTryLine = isTeamA ? PITCH_TRYLINE_RIGHT - kicker.x : kicker.x - PITCH_TRYLINE_LEFT;

    kicker.state = 'kicking';
    kicker.stateTimer = 0.25;
    retroAudio.playKick();

    // Check for drop goal opportunity if close enough (inside 40m)
    if (distToTryLine < 350 && Math.abs(kicker.y - H_POST_Y_CENTER) < 80) {
      this.attemptDropGoal(kicker);
      return;
    }

    // Standard tactical chip / punt forward into space
    this.ball.state = 'in_air_kick';
    this.ball.carrierId = null;
    this.ball.lastCarrierId = kicker.id;
    this.ball.x = kicker.x + attackingDir * 6;
    this.ball.y = kicker.y;
    this.ball.z = 6;
    this.ball.vx = attackingDir * (5.5 + Math.random() * 1.5);
    this.ball.vy = (Math.random() - 0.5) * 1.8;
    this.ball.vz = 5.2;
    this.ball.kickImmunityTimer = 0.4;

    this.spawnDustParticles(kicker.x, kicker.y, 6);
    this.showEvent('¡PATADA AL ESPACIO!', 'Todos a la carrera', 'info');
  }

  /**
   * Slingshot kick: Dragging backwards pulls back and projects a forward dotted arc.
   * Releasing fires the kick downfield along the arc!
   */
  public executeSlingshotKick(kicker: Player, aim: SlingshotKickAim) {
    kicker.state = 'kicking';
    kicker.stateTimer = 0.28;
    retroAudio.playKick();

    const isTeamA = kicker.teamId === 'A';
    const forwardDir = isTeamA ? 1 : -1;

    this.ball.state = 'in_air_kick';
    this.ball.carrierId = null;
    this.ball.lastCarrierId = kicker.id;
    this.ball.x = kicker.x + forwardDir * 6;
    this.ball.y = kicker.y;
    this.ball.z = 6;
    this.ball.kickImmunityTimer = 0.4;

    const dx = aim.targetX - kicker.x;
    const dy = aim.targetY - kicker.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const speed = 4.2 + aim.power * 4.6; // Up to 8.8 units/frame

    this.ball.vx = (dx / dist) * speed;
    this.ball.vy = (dy / dist) * speed;
    this.ball.vz = 4.2 + aim.power * 3.6; // High spiral trajectory

    this.spawnDustParticles(kicker.x + 4, kicker.y + 4, 8);
    this.showEvent('¡PATADA AL ESPACIO!', 'Pelota bombeada hacia adelante', 'info');
  }

  private attemptDropGoal(kicker: Player) {
    const isTeamA = kicker.teamId === 'A';
    this.conversion = {
      kickerId: kicker.id,
      kickX: kicker.x,
      kickY: kicker.y,
      targetPostX: isTeamA ? PITCH_TRYLINE_RIGHT : PITCH_TRYLINE_LEFT,
      targetPostY: H_POST_Y_CENTER,
      angle: 0,
      angleSpeed: 100,
      angleDir: 1,
      power: 40,
      powerSpeed: 120,
      powerDir: 1,
      stage: 'aiming',
      isSuccess: null,
      ballFlightTimer: 0,
      pointsValue: 3,
    };
    this.situation = 'PENALTY_KICK';
    this.showEvent('¡INTENTO DE DROP GOAL!', 'Vale 3 puntos a los palos', 'info');
  }

  /**
   * Attempts a tackle by a defender towards the ball carrier
   * Close physical contact or diving tackle within 22 units
   */
  private attemptTackle(tackler: Player) {
    const carrier = this.players.find(p => p.id === this.ball.carrierId);
    if (carrier && carrier.teamId !== tackler.teamId && carrier.state !== 'tackled' && tackler.state !== 'tackled' && tackler.state !== 'rucking') {
      const dist = Math.hypot(carrier.x - tackler.x, carrier.y - tackler.y);
      if (dist < 22) {
        // Diving tackle wrap!
        tackler.x += (carrier.x - tackler.x) * 0.45;
        tackler.y += (carrier.y - tackler.y) * 0.45;
        this.executeTackle(carrier, tackler);
      }
    }
  }

  /**
   * Executes a tackle and starts a Ruck contest
   */
  private determineTackleVariant(carrier: Player, tackler: Player): TackleVariant {
    const dx = tackler.x - carrier.x;
    const dy = tackler.y - carrier.y;
    const isMovingRight = carrier.facing === 'right';
    const isFromBehind = isMovingRight ? (dx < -6) : (dx > 6);
    const isLateral = Math.abs(dy) > Math.abs(dx) * 0.85;

    const anotherDefender = this.players.find(p => p.teamId === tackler.teamId && p.id !== tackler.id && Math.hypot(p.x - carrier.x, p.y - carrier.y) < 22);
    if (anotherDefender) {
      return 'double_hit';
    }
    if (isFromBehind) {
      return 'rear_slide';
    }
    if ((carrier.bodyType === 'prop_heavy' || carrier.position === 8) && tackler.bodyType === 'back_speed') {
      return 'drag_down';
    }
    if (tackler.bodyType === 'prop_heavy' && carrier.bodyType === 'back_speed') {
      return 'high_torso';
    }
    if (isLateral && Math.random() < 0.35) {
      return 'low_ankle';
    }
    if (isLateral) {
      return 'lateral_roll';
    }
    return 'front_shoulder';
  }

  /**
   * Executes a tackle with chained physical phases:
   * Anticipation -> Impact (Hit-stop & Screen shake) -> Displacement -> Fall -> Ground -> Ruck
   */
  private executeTackle(carrier: Player, tackler: Player) {
    const variant = this.determineTackleVariant(carrier, tackler);

    carrier.state = 'tackled';
    carrier.stateTimer = 2.4;
    tackler.state = 'tackling';
    tackler.stateTimer = 1.4;

    const dx = tackler.x - carrier.x;
    const dy = tackler.y - carrier.y;
    const dist = Math.hypot(dx, dy) || 1;

    const forwardDir = carrier.facing === 'right' ? 1 : -1;
    let pushX = carrier.vx * 0.4;
    let pushY = carrier.vy * 0.3;

    if (variant === 'front_shoulder') {
      pushX = -forwardDir * 1.2;
    } else if (variant === 'rear_slide') {
      pushX = forwardDir * 1.4;
    } else if (variant === 'lateral_roll') {
      pushY = Math.sign(dy) * 1.1;
      pushX = forwardDir * 0.5;
    } else if (variant === 'drag_down') {
      pushX = forwardDir * 1.8;
    } else if (variant === 'low_ankle') {
      pushX = forwardDir * 1.1;
    }

    carrier.tackleState = {
      phase: 'anticipation',
      variant,
      timer: 0,
      hitStopTimer: 0.08,
      slideVx: pushX,
      slideVy: pushY,
      defenderId: tackler.id,
      fallProgress: 0,
    };

    if (tackler.teamId === 'A') this.stats.tacklesA++;
    else this.stats.tacklesB++;
  }

  public updateTackleStates(dt: number) {
    for (const p of this.players) {
      if (!p.tackleState) continue;
      const ts = p.tackleState;
      ts.timer += dt;

      switch (ts.phase) {
        case 'anticipation':
          if (ts.timer >= 0.12) {
            ts.phase = 'impact';
            ts.timer = 0;
            retroAudio.playTackle();
            this.spawnDustParticles(p.x, p.y, 14);
          }
          break;

        case 'impact':
          if (ts.timer >= ts.hitStopTimer + 0.04) {
            ts.phase = 'displacement';
            ts.timer = 0;
          }
          break;

        case 'displacement':
          p.x += ts.slideVx * 14 * dt;
          p.y += ts.slideVy * 14 * dt;
          ts.slideVx *= 0.92;
          ts.slideVy *= 0.92;

          if (ts.timer >= 0.28) {
            ts.phase = 'fall';
            ts.timer = 0;
          }
          break;

        case 'fall':
          ts.fallProgress = Math.min(1.0, ts.timer / 0.42);
          p.x += ts.slideVx * 9 * dt;
          p.y += ts.slideVy * 9 * dt;
          ts.slideVx *= 0.88;
          ts.slideVy *= 0.88;

          if (ts.timer >= 0.42) {
            ts.phase = 'ground';
            ts.timer = 0;
            this.spawnDustParticles(p.x, p.y, 10);
            // Ball carrier holds and presents ball backwards
            this.ball.state = 'held';
            this.ball.carrierId = p.id;
            const forwardDir = p.facing === 'right' ? 1 : -1;
            this.ball.x = p.x - forwardDir * 4;
            this.ball.y = p.y;
            this.ball.z = 0;
          }
          break;

        case 'ground':
          p.x += ts.slideVx * 4 * dt;
          p.y += ts.slideVy * 4 * dt;
          ts.slideVx *= 0.75;

          if (ts.timer >= 0.65 && this.situation === 'OPEN_PLAY') {
            const isTeamATackled = p.teamId === 'A';
            const tacklerId = ts.defenderId || this.players.find(o => o.teamId !== p.teamId)?.id || '';

            this.situation = 'RUCK';
            this.ball.state = 'grounded';
            this.ball.carrierId = null;
            this.ball.x = p.x - (p.facing === 'right' ? 5 : -5);
            this.ball.y = p.y;

            this.ruck = {
              x: p.x,
              y: p.y,
              progress: isTeamATackled ? 40 : 35, // Requires active user effort!
              timer: 0,
              teamAForwards: [],
              teamBForwards: [],
              tackledPlayerId: p.id,
              tacklerPlayerId: tacklerId,
              readyToPass: false,
            };

            if (isTeamATackled) {
              this.showEvent('¡RUCK OFENSIVO!', '¡TOCÁ RÁPIDO PARA CONSERVAR!', 'whistle');
            } else {
              this.showEvent('¡RUCK DEFENSIVO!', '¡TOCÁ RÁPIDO PARA ROBAR!', 'whistle');
            }

            ts.phase = 'get_up';
            ts.timer = 0;
          }
          break;

        case 'get_up':
          if (ts.timer >= 0.30) {
            p.tackleState = null;
          }
          break;
      }
    }
  }

  /**
   * Ruck breakdown contest logic:
   * Dynamic contest where either team can win possession or force turnovers
   */
  private updateRuck(dt: number, input: GameInput) {
    if (!this.ruck) return;

    this.ruck.timer += dt;

    // Pin ball firmly at base of ruck
    this.ball.x = this.ruck.x;
    this.ball.y = this.ruck.y;
    this.ball.z = 0;
    this.ball.state = 'grounded';
    this.ball.carrierId = null;
    this.ball.vx = 0;
    this.ball.vy = 0;

    // 1. Freeze tackled player and tackler firmly on the turf
    const tackledP = this.players.find(p => p.id === this.ruck!.tackledPlayerId);
    if (tackledP) {
      tackledP.vx = 0;
      tackledP.vy = 0;
      tackledP.x = this.ruck.x;
      tackledP.y = this.ruck.y;
      tackledP.state = 'tackled';
    }
    const tacklerP = this.players.find(p => p.id === this.ruck!.tacklerPlayerId);
    if (tacklerP) {
      tacklerP.vx = 0;
      tacklerP.vy = 0;
      tacklerP.x = this.ruck.x + (tacklerP.teamId === 'A' ? -4 : 4);
      tacklerP.y = this.ruck.y;
      tacklerP.state = 'tackled';
    }

    const isTeamATackled = tackledP ? tackledP.teamId === 'A' : true;
    const attackingTeamId: 'A' | 'B' = isTeamATackled ? 'A' : 'B';
    const defendingTeamId: 'A' | 'B' = isTeamATackled ? 'B' : 'A';

    // 2. Bind exactly 2 forwards from each team into the ruck pile
    const forwardsA = this.players.filter(p => p.teamId === 'A' && RUGBY_POSITIONS[p.position].isForward && p.id !== this.ruck!.tackledPlayerId && p.id !== this.ruck!.tacklerPlayerId);
    const forwardsB = this.players.filter(p => p.teamId === 'B' && RUGBY_POSITIONS[p.position].isForward && p.id !== this.ruck!.tackledPlayerId && p.id !== this.ruck!.tacklerPlayerId);

    const ruckingForwardsA = forwardsA.slice(0, 2);
    const ruckingForwardsB = forwardsB.slice(0, 2);

    for (const p of ruckingForwardsA) {
      const d = Math.hypot((this.ruck.x - 7) - p.x, this.ruck.y - p.y);
      p.x += ((this.ruck.x - 7) - p.x) * 0.08;
      p.y += (this.ruck.y - p.y) * 0.08;
      p.vx = 0;
      p.vy = 0;
      p.facing = 'right';
      p.state = d > 5 ? 'running' : 'rucking';
    }
    for (const p of ruckingForwardsB) {
      const d = Math.hypot((this.ruck.x + 7) - p.x, this.ruck.y - p.y);
      p.x += ((this.ruck.x + 7) - p.x) * 0.08;
      p.y += (this.ruck.y - p.y) * 0.08;
      p.vx = 0;
      p.vy = 0;
      p.facing = 'left';
      p.state = d > 5 ? 'running' : 'rucking';
    }

    // 3. Both teams organize into structured attack and defensive lines
    const attackDir = attackingTeamId === 'A' ? 1 : -1;
    const attackingBacks = this.players.filter(p => p.teamId === attackingTeamId && !ruckingForwardsA.includes(p) && !ruckingForwardsB.includes(p) && p.id !== this.ruck!.tackledPlayerId && p.id !== this.ruck!.tacklerPlayerId);
    for (const p of attackingBacks) {
      if (p.position === 9) {
        p.targetX = this.ruck.x - attackDir * 10;
        p.targetY = this.ruck.y;
      } else {
        const laneY = this.getTacticalLane(p.position);
        const depth = this.getAttackDepth(p.position) + 12;
        p.targetX = this.ruck.x - attackDir * depth;
        p.targetY = laneY;
      }
      p.x += (p.targetX - p.x) * 0.12;
      p.y += (p.targetY - p.y) * 0.12;
      p.vx = 0;
      p.vy = 0;
      p.facing = attackingTeamId === 'A' ? 'right' : 'left';
      p.state = Math.hypot(p.targetX - p.x, p.targetY - p.y) > 2 ? 'running' : 'idle';
    }

    const defendingPlayers = this.players.filter(p => p.teamId === defendingTeamId && !ruckingForwardsA.includes(p) && !ruckingForwardsB.includes(p) && p.id !== this.ruck!.tackledPlayerId && p.id !== this.ruck!.tacklerPlayerId);
    const defOffsideX = this.ruck.x + attackDir * 55;
    for (const p of defendingPlayers) {
      const laneY = this.getTacticalLane(p.position);
      p.targetX = defOffsideX + (p.position === 15 ? attackDir * 45 : 0);
      p.targetY = laneY;
      p.x += (p.targetX - p.x) * 0.12;
      p.y += (p.targetY - p.y) * 0.12;
      p.vx = 0;
      p.vy = 0;
      p.facing = defendingTeamId === 'A' ? 'right' : 'left';
      p.state = Math.hypot(p.targetX - p.x, p.targetY - p.y) > 2 ? 'running' : 'idle';
    }

    // 4. Ruck contest mechanics
    if (isTeamATackled) {
      // User attacking: Rival forwards drive to contest ball vigorously!
      const rivalPush = 14 + this.teamB.stats.strength * 0.6;
      this.ruck.progress -= dt * rivalPush;

      // User actively taps or presses to push forwards over ball
      if (input.passRequested || input.tackleRequested) {
        this.ruck.progress += 8.5;
        this.spawnDustParticles(this.ruck.x, this.ruck.y, 4);
        retroAudio.playBlip();
      }

      this.ruck.progress = Math.max(-5, Math.min(105, this.ruck.progress));

      // 10% chance referee catches rival infringing in breakdown (penalty for Los Pumas!)
      if (this.ruck.timer > 1.6 && Math.random() < 0.04 * dt * 60) {
        const rx = this.ruck.x;
        const ry = this.ruck.y;
        this.ruck = null;
        this.triggerPenalty(rx, ry, 'A', '¡PENAL! Infracción rival en el ruck (no soltar)');
        return;
      }

      if (this.ruck.progress <= 0) {
        this.resolveRuck('B', '¡TURNOVER RIVAL! El rival empujó y robó la pelota');
        return;
      }
      if (this.ruck.progress >= 82) {
        this.resolveRuck('A', '¡PELOTA LIMPIA! ¡RUCK GANADO!');
        return;
      }
    } else {
      // User defending: Counter-ruck to steal the ball from Team B!
      this.ruck.progress -= dt * (14 + this.teamB.stats.strength * 0.8);

      if (input.passRequested || input.tackleRequested) {
        this.ruck.progress += 10; // Counter-ruck drive!
        this.spawnDustParticles(this.ruck.x, this.ruck.y, 4);
        retroAudio.playBlip();
      }

      this.ruck.progress = Math.max(-5, Math.min(105, this.ruck.progress));

      if (this.ruck.progress >= 80) {
        this.resolveRuck('A', '¡CONTRARUCK GANADO! ¡PELOTA RECUPERADA!');
        return;
      }
      if (this.ruck.progress <= 0) {
        this.resolveRuck('B', '¡EL RIVAL CONSERVA LA PELOTA!');
        return;
      }
    }

    // Time limit (4.8 seconds max for deliberate physical breakdown)
    if (this.ruck.timer >= 4.8) {
      if (isTeamATackled) {
        // User must have actively pushed progress to at least 55 to win
        const winningTeam: 'A' | 'B' = this.ruck.progress >= 55 ? 'A' : 'B';
        this.resolveRuck(winningTeam, winningTeam === 'A' ? '¡PELOTA LIMPIA! ¡RUCK GANADO!' : '¡TURNOVER RIVAL! Posesión perdida');
      } else {
        const winningTeam: 'A' | 'B' = this.ruck.progress >= 60 ? 'A' : 'B';
        this.resolveRuck(winningTeam, winningTeam === 'A' ? '¡PELOTA RECUPERADA!' : '¡RIVAL CONSERVA!');
      }
    }
  }

  private resolveRuck(winningTeam: 'A' | 'B', message: string) {
    if (!this.ruck) return;

    const ruckX = this.ruck.x;
    const ruckY = this.ruck.y;

    // Release tackled/rucking players back to feet
    for (const p of this.players) {
      if (p.state === 'tackled' || p.state === 'rucking') {
        p.state = 'idle';
        p.vx = 0;
        p.vy = 0;
      }
    }

    if (winningTeam === 'B') {
      this.ruck = null;
      this.startRivalDrive(ruckX, ruckY);
      return;
    }

    const scrumHalf = this.players.find(p => p.teamId === 'A' && p.position === 9) ||
                      this.players.find(p => p.teamId === 'A' && p.state !== 'tackled');

    if (scrumHalf) {
      // Scrum-half digs the ball out and runs into open play
      scrumHalf.x = ruckX - 8;
      scrumHalf.y = ruckY;
      scrumHalf.state = 'running';
      scrumHalf.facing = 'right';
      scrumHalf.vx = 2.0;
      scrumHalf.vy = 0;

      this.ball.state = 'held';
      this.ball.carrierId = scrumHalf.id;
      this.ball.lastCarrierId = scrumHalf.id;
      this.ball.x = scrumHalf.x;
      this.ball.y = scrumHalf.y;
      this.ball.z = 4;

      this.setUserControlled(scrumHalf.id);
      retroAudio.playCatch();
      this.showEvent(message, 'Medio scrum con la pelota: pasá o esquivá', 'info');
    }

    // Tackle protection: 2.6s window so player has plenty of space and time to pass or run
    this.tackleProtectionTimer = 2.6;
    this.situation = 'OPEN_PLAY';
    this.ruck = null;
  }

  /**
   * Skips any current event message, cartel, or rival possession simulation stage-by-stage on screen tap.
   */
  public skipCurrentBannerOrEvent() {
    if (this.situation === 'PENALTY_DECISION' && this.penaltyDecision) {
      if (this.penaltyDecision.teamAwarded === 'A') {
        this.choosePenaltyAction('tap_and_go');
        return;
      }
    }

    if (this.situation === 'RIVAL_DRIVE' && this.rivalDrive) {
      const rd = this.rivalDrive;
      const carrier = this.players.find(p => p.id === rd.carrierId);

      // 1. If in 'pelota_perdida', advance to 'rival_avanza'
      if (rd.stage === 'pelota_perdida') {
        rd.stage = 'rival_avanza';
        rd.timer = 0;
        this.showEvent('EL RIVAL AVANZA', 'Ataque frontal con fases combinadas', 'info');
        retroAudio.playBlip();
        return;
      }

      // 2. If in 'rival_avanza', advance to 'rack'
      if (rd.stage === 'rival_avanza') {
        rd.stage = 'rack';
        rd.timer = 0;
        if (carrier) {
          carrier.x = rd.targetX;
          carrier.y = rd.targetY;
          carrier.state = 'tackled';
          this.ball.x = carrier.x;
          this.ball.y = carrier.y;
          this.ball.z = 0;
        }
        retroAudio.playTackle();
        this.spawnDustParticles(rd.targetX, rd.targetY, 16);
        this.showEvent('RACK', '¡Impacto defensivo y disputa feroz!', 'whistle');
        return;
      }

      // 3. If in 'rack', advance to outcome (try or recovered)
      if (rd.stage === 'rack') {
        rd.timer = 0;
        if (rd.isTry) {
          rd.stage = 'outcome_try';
          if (carrier) {
            carrier.x = PITCH_TRYLINE_LEFT - 10;
            this.ball.x = carrier.x;
            carrier.state = 'celebrating';
          }
          this.stats.scoreB += 5;
          this.stats.triesB++;
          this.lastScoringTeam = 'B';
          retroAudio.playTryFanfare();
          this.showEvent('TRY DEL RIVAL', '+5 puntos para el rival', 'try');
        } else {
          rd.stage = 'outcome_recovered';
          if (carrier) {
            carrier.x = rd.targetX;
            carrier.y = rd.targetY;
            this.ball.x = carrier.x;
            this.ball.y = carrier.y;
          }
          retroAudio.playCatch();
          this.showEvent('¡PELOTA RECUPERADA!', '¡Robo en el ruck! Los Pumas al ataque', 'try');
        }
        return;
      }

      // 4. If in 'outcome_try', advance to 'outcome_conversion'
      if (rd.stage === 'outcome_try') {
        rd.stage = 'outcome_conversion';
        rd.timer = 0;
        const converted = Math.random() < 0.70;
        if (converted) {
          this.stats.scoreB += 2;
          this.stats.conversionsB++;
          retroAudio.playKick();
          this.showEvent('EL RIVAL HA CONVERTIDO', '+2 puntos rivales (Conversión acertada)', 'whistle');
        } else {
          this.showEvent('CONVERSIÓN RIVAL ERRADA', 'El remate no pasó los palos', 'info');
        }
        return;
      }

      // 5. If in 'outcome_conversion', restart game from kickoff
      if (rd.stage === 'outcome_conversion') {
        this.rivalDrive = null;
        this.situation = 'OPEN_PLAY';
        this.setupKickoff('A');
        this.showEvent('REINICIO DE SALIDA', 'Los Pumas reciben el kick-off', 'info');
        return;
      }

      // 6. If in 'outcome_recovered', restore play immediately at the exact spot
      if (rd.stage === 'outcome_recovered') {
        const recoveredX = rd.targetX;
        const recoveredY = rd.targetY;

        const pumasHalf = this.players.find(p => p.teamId === 'A' && (p.position === 9 || p.position === 10)) ||
                          this.players.find(p => p.teamId === 'A')!;

        pumasHalf.x = Math.max(PITCH_TRYLINE_LEFT + 25, Math.min(PITCH_TRYLINE_RIGHT - 25, recoveredX));
        pumasHalf.y = Math.max(PITCH_TOUCH_LINE_TOP + 20, Math.min(PITCH_TOUCH_LINE_BOTTOM - 20, recoveredY));
        pumasHalf.facing = 'right';
        pumasHalf.state = 'running';
        pumasHalf.vx = 0;
        pumasHalf.vy = 0;

        this.ball.x = pumasHalf.x;
        this.ball.y = pumasHalf.y;
        this.ball.z = 4;
        this.ball.state = 'held';
        this.ball.carrierId = pumasHalf.id;
        this.ball.lastCarrierId = pumasHalf.id;

        for (const p of this.players) {
          if (p.state === 'tackled' || p.state === 'rucking') {
            p.state = 'idle';
          }
        }

        this.alignTeamFormation('A', pumasHalf.x - 35, 'attack');
        this.alignTeamFormation('B', pumasHalf.x + 45, 'defense');

        this.setUserControlled(pumasHalf.id);
        this.tackleProtectionTimer = 2.0;

        this.situation = 'OPEN_PLAY';
        this.rivalDrive = null;
        retroAudio.playCatch();
        this.showEvent('¡PELOTA EN JUEGO!', '¡Ataque de Los Pumas!', 'info');
        return;
      }
    }

    if (this.situation === 'KNOCK_ON') {
      this.whistleTimer = 0;
      this.triggerScrum(this.ball.x, this.ball.y, 'B');
      return;
    }

    if (this.situation === 'LINEOUT' && this.lineout?.stage === 'lineup') {
      this.lineout.stage = 'throw';
      this.lineout.jumpTimer = 1.0;
      return;
    }

    if (this.situation === 'TRY_SCORED') {
      this.restartTimer = 0;
      this.setupConversionKick();
      return;
    }

    // Dismiss active event popup message
    if (this.eventMessage) {
      this.eventMessage = null;
    }
  }

  /**
   * Starts simulated rival offensive drive
   * Shows narrative banners (PELOTA PERDIDA -> EL RIVAL AVANZA -> RACK -> ¡PELOTA RECUPERADA! / TRY DEL RIVAL)
   * If recovered, ball remains at the exact field position where the rival was stopped!
   */
  public startRivalDrive(lostX: number, lostY: number) {
    this.situation = 'RIVAL_DRIVE';
    this.ruck = null;
    this.scrum = null;
    this.lineout = null;
    this.conversion = null;

    // Pick a Team B carrier (e.g. fly-half #10, scrum-half #9, or nearest B player)
    const carrierB = this.players.find(p => p.teamId === 'B' && p.position === 10) ||
                     this.players.find(p => p.teamId === 'B' && p.position === 9) ||
                     this.players.find(p => p.teamId === 'B')!;

    // Position carrier at the exact turnover spot
    carrierB.x = Math.max(PITCH_TRYLINE_LEFT + 25, Math.min(PITCH_TRYLINE_RIGHT - 25, lostX));
    carrierB.y = Math.max(PITCH_TOUCH_LINE_TOP + 25, Math.min(PITCH_TOUCH_LINE_BOTTOM - 25, lostY));
    carrierB.facing = 'left';
    carrierB.state = 'running';
    carrierB.vx = -1.2;
    carrierB.vy = 0;

    this.ball.state = 'held';
    this.ball.carrierId = carrierB.id;
    this.ball.lastCarrierId = carrierB.id;
    this.ball.x = carrierB.x;
    this.ball.y = carrierB.y;
    this.ball.z = 4;
    this.ball.vx = 0;
    this.ball.vy = 0;

    // Remove user control during rival drive ("no se puede jugar")
    for (const p of this.players) {
      p.isUserControlled = false;
    }
    this.userControllingId = null;

    // Decide if rival drive leads to a try or if Los Pumas recover the ball:
    // If turnover happened deep inside Los Pumas half (lostX < PITCH_22M_LEFT + 30), 50% try
    // Otherwise 35% try, 65% recovered
    const isDeepInOwn22 = lostX < PITCH_22M_LEFT + 30;
    const isTry = isDeepInOwn22 ? Math.random() < 0.50 : Math.random() < 0.35;

    let targetX: number;
    if (isTry) {
      targetX = PITCH_TRYLINE_LEFT - 12; // In-goal try
    } else {
      // Rival advances 40 to 80 units towards Los Pumas tryline before getting stopped
      const advanceDistance = 45 + Math.random() * 45;
      targetX = Math.max(PITCH_TRYLINE_LEFT + 25, carrierB.x - advanceDistance);
    }
    const targetY = Math.max(PITCH_TOUCH_LINE_TOP + 25, Math.min(PITCH_TOUCH_LINE_BOTTOM - 25, carrierB.y + (Math.random() - 0.5) * 40));

    this.rivalDrive = {
      stage: 'pelota_perdida',
      timer: 0,
      startX: carrierB.x,
      startY: carrierB.y,
      targetX,
      targetY,
      isTry,
      carrierId: carrierB.id,
    };

    retroAudio.playWhistle(true);
    this.showEvent('PELOTA PERDIDA', '¡El rival toma la posesión!', 'whistle');
  }

  private updateRivalDrive(dt: number) {
    if (!this.rivalDrive) {
      this.situation = 'OPEN_PLAY';
      return;
    }

    const rd = this.rivalDrive;
    rd.timer += dt;

    const carrier = this.players.find(p => p.id === rd.carrierId);
    if (!carrier) return;

    // Always update animation frames
    for (const p of this.players) {
      this.updatePlayerAnimations(p, dt);
    }

    switch (rd.stage) {
      case 'pelota_perdida': {
        carrier.facing = 'left';
        carrier.state = 'running';
        this.ball.x = carrier.x;
        this.ball.y = carrier.y;
        this.ball.z = 4;

        this.positionDriveSupport(carrier, dt);

        if (rd.timer >= 1.6) {
          rd.stage = 'rival_avanza';
          rd.timer = 0;
          this.showEvent('EL RIVAL AVANZA', 'Ataque frontal con fases combinadas', 'info');
        }
        break;
      }

      case 'rival_avanza': {
        const dx = rd.targetX - carrier.x;
        const dy = rd.targetY - carrier.y;
        const dist = Math.hypot(dx, dy);

        const moveSpeed = 48; // speed of advance in units/sec
        if (dist > 2) {
          const vx = (dx / dist) * moveSpeed;
          const vy = (dy / dist) * moveSpeed;
          carrier.x += vx * dt;
          carrier.y += vy * dt;
          carrier.facing = 'left';
          carrier.state = 'running';
          carrier.vx = vx;
          carrier.vy = vy;
        } else {
          carrier.vx = 0;
          carrier.vy = 0;
        }

        this.ball.x = carrier.x;
        this.ball.y = carrier.y;
        this.ball.z = 4;

        if (Math.random() < 0.15) {
          this.spawnDustParticles(carrier.x + 4, carrier.y + 6, 2);
        }

        this.positionDriveSupport(carrier, dt);

        if (rd.timer >= 2.4 || (dist <= 4 && !rd.isTry)) {
          rd.stage = 'rack';
          rd.timer = 0;
          retroAudio.playTackle();
          this.spawnDustParticles(carrier.x, carrier.y, 16);
          this.showEvent('RACK', '¡Impacto defensivo y disputa feroz!', 'whistle');
        }
        break;
      }

      case 'rack': {
        carrier.state = 'tackled';
        carrier.vx = 0;
        carrier.vy = 0;
        this.ball.x = carrier.x;
        this.ball.y = carrier.y;
        this.ball.z = 0;

        for (const p of this.players) {
          if (p.id === carrier.id) continue;
          const d = Math.hypot(p.x - carrier.x, p.y - carrier.y);
          if (d < 35 && RUGBY_POSITIONS[p.position].isForward) {
            const tx = carrier.x + (p.teamId === 'A' ? -6 : 6);
            p.x += (tx - p.x) * 0.15;
            p.y += (carrier.y - p.y) * 0.15;
            p.state = 'rucking';
          }
        }

        if (rd.timer >= 1.8) {
          rd.timer = 0;
          if (rd.isTry) {
            rd.stage = 'outcome_try';
            this.stats.scoreB += 5;
            this.stats.triesB++;
            retroAudio.playTryFanfare();
            this.showEvent('TRY DEL RIVAL', '+5 puntos para el rival', 'try');
          } else {
            // RECOVERED!
            // Crucial: Ball stays at exact position where rival had it
            rd.stage = 'outcome_recovered';
            retroAudio.playCatch();
            this.showEvent('¡PELOTA RECUPERADA!', '¡Robo en el ruck! Los Pumas al ataque', 'try');
          }
        }
        break;
      }

      case 'outcome_recovered': {
        const recoveredX = carrier.x;
        const recoveredY = carrier.y;

        const pumasHalf = this.players.find(p => p.teamId === 'A' && p.position === 9) ||
                          this.players.find(p => p.teamId === 'A' && p.position === 10) ||
                          this.players.find(p => p.teamId === 'A')!;

        pumasHalf.x = recoveredX;
        pumasHalf.y = recoveredY;
        pumasHalf.facing = 'right';
        pumasHalf.state = 'running';
        pumasHalf.vx = 0;
        pumasHalf.vy = 0;

        this.ball.x = recoveredX;
        this.ball.y = recoveredY;
        this.ball.z = 4;
        this.ball.state = 'held';
        this.ball.carrierId = pumasHalf.id;
        this.ball.lastCarrierId = pumasHalf.id;

        for (const p of this.players) {
          if (p.state === 'tackled' || p.state === 'rucking') {
            p.state = 'idle';
          }
        }

        this.alignTeamFormation('A', recoveredX - 35, 'attack');
        this.alignTeamFormation('B', recoveredX + 45, 'defense');

        this.setUserControlled(pumasHalf.id);
        this.tackleProtectionTimer = 2.0;

        this.situation = 'OPEN_PLAY';
        this.rivalDrive = null;
        break;
      }

      case 'outcome_try': {
        if (rd.timer >= 2.0) {
          rd.stage = 'outcome_conversion';
          rd.timer = 0;
          const converted = Math.random() < 0.70;
          if (converted) {
            this.stats.scoreB += 2;
            this.stats.conversionsB++;
            retroAudio.playKick();
            this.showEvent('EL RIVAL HA CONVERTIDO', '+2 puntos rivales (Conversión acertada)', 'whistle');
          } else {
            this.showEvent('CONVERSIÓN RIVAL ERRADA', 'El remate no pasó los palos', 'info');
          }
        }
        break;
      }

      case 'outcome_conversion': {
        if (rd.timer >= 2.0) {
          this.rivalDrive = null;
          this.setupKickoff('A');
        }
        break;
      }
    }
  }

  private positionDriveSupport(carrier: Player, _dt: number) {
    for (const p of this.players) {
      if (p.teamId === 'B' && p.id !== carrier.id) {
        const laneY = this.getTacticalLane(p.position);
        const depth = this.getAttackDepth(p.position);
        const targetX = carrier.x + depth + 10;
        p.x += (targetX - p.x) * 0.08;
        p.y += (laneY - p.y) * 0.08;
        p.facing = 'left';
        p.state = 'running';
      } else if (p.teamId === 'A') {
        const laneY = this.getTacticalLane(p.position);
        const targetX = Math.max(PITCH_TRYLINE_LEFT + 8, carrier.x - 30);
        p.x += (targetX - p.x) * 0.08;
        p.y += (laneY - p.y) * 0.08;
        p.facing = 'right';
        p.state = 'running';
      }
    }
  }

  /**
   * Scrum pack contest logic with Set Plays ("Jugadas preparadas")
   */
  public triggerScrum(x: number, y: number, feedingTeam: 'A' | 'B', defaultPlay: ScrumSetPlay = 'backline_wings') {
    this.situation = 'SCRUM';
    const isTeamA = feedingTeam === 'A';
    const scrumX = Math.max(PITCH_TRYLINE_LEFT + 60, Math.min(PITCH_TRYLINE_RIGHT - 60, x));
    const scrumY = Math.max(PITCH_TOUCH_LINE_TOP + 60, Math.min(PITCH_TOUCH_LINE_BOTTOM - 60, y));

    this.scrum = {
      x: scrumX,
      y: scrumY,
      feedingTeam,
      progress: isTeamA ? 25 : -25,
      timer: 0,
      stage: isTeamA ? 'selecting' : 'crouch', // When Team A feeds, player selects set play!
      readyToRelease: false,
      selectedSetPlay: defaultPlay,
    };

    retroAudio.playWhistle(true);
    if (isTeamA) {
      this.showEvent('¡SCRUM DE LOS PUMAS!', 'Elegí tu jugada preparada', 'whistle');
    } else {
      this.showEvent('¡SCRUM RIVAL!', 'Crouch, Bind, Set', 'whistle');
    }

    this.positionScrumPlayers(scrumX, scrumY, feedingTeam, defaultPlay);
  }

  public chooseScrumSetPlay(play: ScrumSetPlay) {
    if (!this.scrum) return;
    this.scrum.selectedSetPlay = play;
    this.scrum.stage = 'crouch';
    this.scrum.timer = 0;
    retroAudio.playBlip();

    const playTitles: Record<ScrumSetPlay, string> = {
      pick_and_go_8: 'SALIDA DEL 8 (PICK & GO)',
      backline_wings: 'APERTURA RÁPIDA A LOS WINGS',
      crash_center_12: 'CRASH BALL DEL 12',
      scissors_10_12: 'TIJERA CRUCE 10-12-15',
    };
    this.showEvent(`JUGADA: ${playTitles[play]}`, '¡Crouch, Bind, Set... Empujen!', 'info');
    this.positionScrumPlayers(this.scrum.x, this.scrum.y, this.scrum.feedingTeam, play);
  }

  public positionScrumPlayers(sx: number, sy: number, feedingTeam: 'A' | 'B', play: ScrumSetPlay = 'backline_wings') {
    // 1. Pack Forwards (1 to 8) bound in scrum pack
    for (const p of this.players) {
      if (RUGBY_POSITIONS[p.position].isForward) {
        p.state = 'scrum';
        p.vx = 0;
        p.vy = 0;
        const isA = p.teamId === 'A';
        const dir = isA ? -1 : 1;
        p.facing = isA ? 'right' : 'left';

        // Scrum pack rows:
        if (p.position === 1) { p.x = sx + dir * 6; p.y = sy - 6; }
        else if (p.position === 2) { p.x = sx + dir * 6; p.y = sy; }
        else if (p.position === 3) { p.x = sx + dir * 6; p.y = sy + 6; }
        else if (p.position === 4) { p.x = sx + dir * 14; p.y = sy - 4; }
        else if (p.position === 5) { p.x = sx + dir * 14; p.y = sy + 4; }
        else if (p.position === 6) { p.x = sx + dir * 14; p.y = sy - 11; }
        else if (p.position === 7) { p.x = sx + dir * 14; p.y = sy + 11; }
        else if (p.position === 8) { p.x = sx + dir * 20; p.y = sy; }
      } else {
        // Backs positioned according to Set Play
        p.state = 'idle';
        p.vx = 0;
        p.vy = 0;
        const isA = p.teamId === 'A';
        const dir = isA ? -1 : 1;
        p.facing = isA ? 'right' : 'left';

        if (p.position === 9) {
          p.x = sx + dir * 18;
          p.y = sy - 8;
        } else if (p.position === 10) {
          p.x = sx + dir * (play === 'crash_center_12' ? 26 : 34);
          p.y = sy + 28;
        } else if (p.position === 12) {
          p.x = sx + dir * (play === 'crash_center_12' ? 38 : play === 'scissors_10_12' ? 44 : 52);
          p.y = sy + (play === 'crash_center_12' ? 24 : play === 'scissors_10_12' ? 42 : 55);
        } else if (p.position === 13) {
          p.x = sx + dir * 68;
          p.y = sy + 80;
        } else if (p.position === 11) {
          p.x = sx + dir * 32;
          p.y = PITCH_TOUCH_LINE_TOP + 40;
        } else if (p.position === 14) {
          p.x = sx + dir * 42;
          p.y = PITCH_TOUCH_LINE_BOTTOM - 40;
        } else if (p.position === 15) {
          p.x = sx + dir * (play === 'scissors_10_12' ? 58 : 75);
          p.y = sy + (play === 'scissors_10_12' ? 32 : -20);
        }
      }
    }
  }

  private updateScrum(dt: number, input: GameInput) {
    if (!this.scrum) return;
    if (this.scrum.stage === 'selecting') {
      // Waiting for user to pick set play from UI overlay
      return;
    }

    this.scrum.timer += dt;

    if (this.scrum.stage === 'crouch' && this.scrum.timer > 0.6) {
      this.scrum.stage = 'bind';
    } else if (this.scrum.stage === 'bind' && this.scrum.timer > 1.2) {
      this.scrum.stage = 'set';
      retroAudio.playScrumClash();
    } else if (this.scrum.stage === 'set' && this.scrum.timer > 1.8) {
      this.scrum.stage = 'push';
    }

    if (this.scrum.stage === 'push') {
      if (input.passRequested || input.tackleRequested) {
        this.scrum.progress += 8;
        this.spawnDustParticles(this.scrum.x, this.scrum.y, 4);
        retroAudio.playBlip();
      }

      // Resolve scrum
      if (this.scrum.timer > 3.4) {
        const winningTeam = this.scrum.progress >= 0 ? 'A' : 'B';
        const play = this.scrum.selectedSetPlay || 'backline_wings';
        const sx = this.scrum.x;
        const sy = this.scrum.y;

        if (winningTeam === 'A') {
          this.stats.scrumsWonA++;
          this.executeScrumSetPlay(play, sx, sy);
          this.situation = 'OPEN_PLAY';
          this.scrum = null;
        } else {
          this.stats.scrumsWonB++;
          this.scrum = null;
          this.startRivalDrive(sx, sy);
        }
      }
    }
  }

  private executeScrumSetPlay(play: ScrumSetPlay, sx: number, sy: number) {
    retroAudio.playWhistle();

    // Release all scrumming forwards back to feet
    for (const p of this.players) {
      if (p.state === 'scrum') {
        p.state = 'idle';
        p.vx = 0;
        p.vy = 0;
      }
    }

    if (play === 'pick_and_go_8') {
      // 1. Number 8 picks up ball from base with flankers bound in support
      const num8 = this.players.find(p => p.teamId === 'A' && p.position === 8)!;
      num8.x = sx - 4;
      num8.y = sy;
      num8.state = 'running';
      num8.vx = 2.4;
      num8.vy = 0;
      num8.facing = 'right';

      this.ball.state = 'held';
      this.ball.carrierId = num8.id;
      this.ball.lastCarrierId = num8.id;
      this.ball.x = num8.x;
      this.ball.y = num8.y;
      this.ball.z = 4;

      this.setUserControlled(num8.id);
      this.tackleProtectionTimer = 2.4;
      this.showEvent('¡SALIDA DEL 8!', '¡Ataque potente por la base del scrum!', 'info');
    } else if (play === 'crash_center_12') {
      // 2. Fly-half delivers flat crash ball to Inside Centre 12 charging forward
      const centre12 = this.players.find(p => p.teamId === 'A' && p.position === 12)!;
      centre12.x = sx - 6;
      centre12.y = sy + 22;
      centre12.state = 'running';
      centre12.vx = 2.8;
      centre12.vy = 0;
      centre12.facing = 'right';

      this.ball.state = 'held';
      this.ball.carrierId = centre12.id;
      this.ball.lastCarrierId = centre12.id;
      this.ball.x = centre12.x;
      this.ball.y = centre12.y;
      this.ball.z = 4;

      this.setUserControlled(centre12.id);
      this.tackleProtectionTimer = 2.4;
      this.showEvent('¡CRASH BALL DEL 12!', '¡El centro perfora directo la marca rival!', 'info');
    } else if (play === 'scissors_10_12') {
      // 3. Scissors play: 10 holds, 12 cuts inside, 15 sweeps through
      const flyHalf = this.players.find(p => p.teamId === 'A' && p.position === 10)!;
      const centre12 = this.players.find(p => p.teamId === 'A' && p.position === 12)!;
      const fullback = this.players.find(p => p.teamId === 'A' && p.position === 15)!;

      flyHalf.x = sx - 10;
      flyHalf.y = sy + 24;
      flyHalf.state = 'running';
      flyHalf.vx = 2.1;
      flyHalf.vy = 0.8;
      flyHalf.facing = 'right';

      if (centre12) {
        centre12.state = 'running';
        centre12.vx = 2.4;
        centre12.vy = -1.2; // scissors angle
      }

      if (fullback) {
        fullback.state = 'running';
        fullback.vx = 2.9; // sweeps into gap
      }

      this.ball.state = 'held';
      this.ball.carrierId = flyHalf.id;
      this.ball.lastCarrierId = flyHalf.id;
      this.ball.x = flyHalf.x;
      this.ball.y = flyHalf.y;
      this.ball.z = 4;

      this.setUserControlled(flyHalf.id);
      this.tackleProtectionTimer = 2.6;
      this.showEvent('¡TIJERA CRUCE 10-12!', '¡Cruce engañoso y entrada del Fullback!', 'info');
    } else {
      // 4. Default: backline sweep to wings
      const flyHalf = this.players.find(p => p.teamId === 'A' && p.position === 10)!;
      flyHalf.x = sx - 12;
      flyHalf.y = sy + 28;
      flyHalf.state = 'running';
      flyHalf.vx = 2.2;
      flyHalf.facing = 'right';

      const wing14 = this.players.find(p => p.teamId === 'A' && p.position === 14);
      if (wing14) {
        wing14.state = 'running';
        wing14.vx = 3.0;
      }

      this.ball.state = 'held';
      this.ball.carrierId = flyHalf.id;
      this.ball.lastCarrierId = flyHalf.id;
      this.ball.x = flyHalf.x;
      this.ball.y = flyHalf.y;
      this.ball.z = 4;

      this.setUserControlled(flyHalf.id);
      this.tackleProtectionTimer = 2.4;
      this.showEvent('¡APERTURA VELOZ!', 'Pase al 10 y apertura a las puntas', 'info');
    }
  }

  /**
   * Penalty Kick / Decision mechanics
   */
  public triggerPenalty(x: number, y: number, teamAwarded: 'A' | 'B', reason: string = '¡PENAL!') {
    this.situation = 'PENALTY_DECISION';
    this.penaltyDecision = {
      teamAwarded,
      x: Math.max(PITCH_TRYLINE_LEFT + 25, Math.min(PITCH_TRYLINE_RIGHT - 25, x)),
      y: Math.max(PITCH_TOUCH_LINE_TOP + 25, Math.min(PITCH_TOUCH_LINE_BOTTOM - 25, y)),
      reason,
    };

    retroAudio.playWhistle(true);
    if (teamAwarded === 'A') {
      this.stats.penaltiesA++;
      this.showEvent(reason, '¡Elegí tu decisión táctica!', 'whistle');
    } else {
      this.stats.penaltiesB++;
      this.showEvent(reason, 'Penal en contra', 'whistle');
      // Rival AI chooses after brief moment
      setTimeout(() => {
        this.resolveRivalPenaltyDecision();
      }, 1200);
    }
  }

  private updatePenaltyDecision(_dt: number) {
    // Players freeze around penalty mark
    for (const p of this.players) {
      p.vx = 0;
      p.vy = 0;
      if (p.state !== 'tackled') p.state = 'idle';
    }
  }

  public choosePenaltyAction(action: 'kick_posts' | 'scrum' | 'tap_and_go') {
    if (this.situation !== 'PENALTY_DECISION' || !this.penaltyDecision) return;
    const { x, y } = this.penaltyDecision;
    this.penaltyDecision = null;

    if (action === 'kick_posts') {
      this.setupPenaltyKick(x, y, 'A');
    } else if (action === 'scrum') {
      this.triggerScrum(x, y, 'A');
    } else if (action === 'tap_and_go') {
      this.executeTapAndGo(x, y, 'A');
    }
  }

  public setupPenaltyKick(kickX: number, kickY: number, team: 'A' | 'B') {
    this.situation = 'PENALTY_KICK';
    const isTeamAKicking = team === 'A';
    const kicker = this.players.find(p => p.teamId === team && p.position === 10) ||
                   this.players.find(p => p.teamId === team)!;
    const postX = isTeamAKicking ? PITCH_TRYLINE_RIGHT : PITCH_TRYLINE_LEFT;

    kicker.x = kickX;
    kicker.y = kickY;
    kicker.facing = isTeamAKicking ? 'right' : 'left';
    this.ball.x = kickX;
    this.ball.y = kickY;
    this.ball.z = 2;
    this.ball.state = 'held';
    this.ball.carrierId = kicker.id;

    if (isTeamAKicking) {
      this.setUserControlled(kicker.id);
    }

    this.conversion = {
      kickerId: kicker.id,
      kickX,
      kickY,
      targetPostX: postX,
      targetPostY: H_POST_Y_CENTER,
      angle: -20,
      angleSpeed: 95,
      angleDir: 1,
      power: 20,
      powerSpeed: 110,
      powerDir: 1,
      stage: 'aiming',
      isSuccess: null,
      ballFlightTimer: 0,
      pointsValue: 3, // Penal vale 3 puntos!
    };

    if (isTeamAKicking) {
      this.showEvent('¡PENAL A LOS PALOS!', 'Click para fijar dirección (Vale 3 pts)', 'info');
    } else {
      this.showEvent(`¡PENAL DE ${this.teamB.name.toUpperCase()}!`, 'Tiro a los palos rival (Vale 3 pts)', 'info');
    }
  }

  public executeTapAndGo(x: number, y: number, team: 'A' | 'B') {
    this.situation = 'OPEN_PLAY';
    retroAudio.playBlip();
    retroAudio.playWhistle();

    const tapper = this.players.find(p => p.teamId === team && (p.position === 9 || p.position === 10)) ||
                   this.players.find(p => p.teamId === team)!;

    tapper.x = x;
    tapper.y = y;
    tapper.facing = team === 'A' ? 'right' : 'left';
    tapper.state = 'running';
    tapper.vx = team === 'A' ? 2.6 : -2.6;
    tapper.vy = 0;

    this.ball.x = tapper.x;
    this.ball.y = tapper.y;
    this.ball.z = 4;
    this.ball.state = 'held';
    this.ball.carrierId = tapper.id;
    this.ball.lastCarrierId = tapper.id;

    // Defense pushed back 10 meters offside!
    const retreatDir = team === 'A' ? 1 : -1;
    for (const p of this.players) {
      if (p.teamId !== team) {
        p.x = Math.max(PITCH_TRYLINE_LEFT + 20, Math.min(PITCH_TRYLINE_RIGHT - 20, x + retreatDir * 65));
        p.state = 'idle';
      }
    }

    if (team === 'A') {
      this.setUserControlled(tapper.id);
      this.tackleProtectionTimer = 2.6;
      this.showEvent('¡TAP & GO! ¡JUEGO RÁPIDO!', '¡Ataque a velocidad con ventaja!', 'info');
    } else {
      this.startRivalDrive(x, y);
    }
  }

  private resolveRivalPenaltyDecision() {
    if (this.situation !== 'PENALTY_DECISION' || !this.penaltyDecision) return;
    const { x, y } = this.penaltyDecision;
    this.penaltyDecision = null;

    const distToPosts = x - PITCH_TRYLINE_LEFT;
    if (distToPosts < 280) {
      // Rival kicks to posts for 3 points
      this.setupPenaltyKick(x, y, 'B');
    } else {
      // Rival takes scrum
      this.triggerScrum(x, y, 'B');
    }
  }

  /**
   * Lineout touchline set piece
   */
  private triggerLineout(x: number, y: number, throwingTeam: 'A' | 'B') {
    this.situation = 'LINEOUT';
    this.lineout = {
      x: Math.max(PITCH_TRYLINE_LEFT + 50, Math.min(PITCH_TRYLINE_RIGHT - 50, x)),
      y,
      throwingTeam,
      jumpTimer: 0,
      stage: 'lineup',
      jumperAHeight: 0,
      jumperBHeight: 0,
      securedBy: null,
    };

    retroAudio.playWhistle(true);
    this.showEvent('¡TOUCH! LINEOUT', `Lanza ${throwingTeam === 'A' ? this.teamA.name : this.teamB.name}`, 'whistle');
  }

  private updateLineout(dt: number, input: GameInput) {
    if (!this.lineout) return;
    this.lineout.jumpTimer += dt;

    if (this.lineout.stage === 'lineup' && this.lineout.jumpTimer > 1.0) {
      this.lineout.stage = 'throw';
      retroAudio.playPass();
    }

    if (this.lineout.stage === 'throw') {
      // Jump contest
      if (input.passRequested || input.tackleRequested) {
        this.lineout.jumperAHeight += 4;
      }
      this.lineout.jumperBHeight += 3.5;

      if (this.lineout.jumpTimer > 2.0) {
        const winner = this.lineout.throwingTeam === 'A' ? 'A' : (this.lineout.jumperAHeight > this.lineout.jumperBHeight ? 'A' : 'B');
        if (winner === 'A') {
          const flyHalf = this.players.find(p => p.teamId === 'A' && p.position === 10);
          if (flyHalf) {
            this.ball.state = 'held';
            this.ball.carrierId = flyHalf.id;
            this.ball.lastCarrierId = flyHalf.id;
            this.setUserControlled(flyHalf.id);
          }
          this.situation = 'OPEN_PLAY';
          this.lineout = null;
          retroAudio.playCatch();
          this.showEvent('¡LINEOUT GANADO!', 'Pelota para el apertura', 'info');
        } else {
          const lx = this.lineout.x;
          const ly = this.lineout.y;
          this.lineout = null;
          this.startRivalDrive(lx, ly);
          return;
        }
      }
    }
  }

  /**
   * Check for Try grounded in in-goal
   */
  private checkTryScored(carrier: Player) {
    const isTeamA = carrier.teamId === 'A';

    // Team A attacks right (In-goal is X >= PITCH_TRYLINE_RIGHT)
    if (isTeamA && carrier.x >= PITCH_TRYLINE_RIGHT) {
      carrier.state = 'diving'; // Spectacular "Palomita" dive across tryline!
      carrier.vx = 2.4; // Skids forward onto the turf
      this.ball.x = carrier.x + 8;
      this.ball.y = carrier.y;
      this.ball.z = 0;
      this.stats.scoreA += 5;
      this.stats.triesA++;
      this.lastScoringTeam = 'A';
      retroAudio.playDive();
      retroAudio.playTryFanfare();
      this.spawnDustParticles(carrier.x, carrier.y, 24);

      this.situation = 'TRY_SCORED';
      this.showEvent('¡¡¡TRY DE PALOMITA!!!', '+5 PUNTOS PARA LOS PUMAS', 'try');
      this.restartTimer = 2.4;
    }
    // Team B attacks left (In-goal is X <= PITCH_TRYLINE_LEFT)
    else if (!isTeamA && carrier.x <= PITCH_TRYLINE_LEFT) {
      carrier.state = 'celebrating';
      this.stats.scoreB += 5;
      this.stats.triesB++;
      this.lastScoringTeam = 'B';
      retroAudio.playTryFanfare();
      this.spawnDustParticles(carrier.x, carrier.y, 18);

      this.situation = 'TRY_SCORED';
      this.showEvent(`¡TRY DE ${this.teamB.name.toUpperCase()}!`, '+5 Puntos para el rival', 'try');
      this.restartTimer = 2.4;
    }
  }

  private updateTryCelebration(dt: number) {
    this.restartTimer -= dt;
    if (this.restartTimer <= 0) {
      // Setup conversion kick!
      this.setupConversionKick();
    }
  }

  /**
   * Prepares Conversion kick after a Try
   */
  private setupConversionKick() {
    this.situation = 'CONVERSION';
    const isTeamAKicking = this.lastScoringTeam === 'A';
    const kicker = this.players.find(p => p.teamId === this.lastScoringTeam && p.position === 10) ||
                   this.players.find(p => p.teamId === this.lastScoringTeam)!;

    const postX = isTeamAKicking ? PITCH_TRYLINE_RIGHT : PITCH_TRYLINE_LEFT;
    const kickX = isTeamAKicking ? postX - 220 : postX + 220;

    kicker.x = kickX;
    kicker.y = H_POST_Y_CENTER;
    kicker.facing = isTeamAKicking ? 'right' : 'left';

    this.ball.x = kickX;
    this.ball.y = H_POST_Y_CENTER;
    this.ball.z = 2;
    this.ball.state = 'held';
    this.ball.carrierId = kicker.id;

    if (isTeamAKicking) {
      this.setUserControlled(kicker.id);
    }

    this.conversion = {
      kickerId: kicker.id,
      kickX,
      kickY: H_POST_Y_CENTER,
      targetPostX: postX,
      targetPostY: H_POST_Y_CENTER,
      angle: -25,
      angleSpeed: 95,
      angleDir: 1,
      power: 20,
      powerSpeed: 110,
      powerDir: 1,
      stage: 'aiming',
      isSuccess: null,
      ballFlightTimer: 0,
      pointsValue: 2,
    };

    if (isTeamAKicking) {
      this.showEvent('¡CONVERSIÓN DE LOS PUMAS!', 'Click para fijar dirección', 'info');
    } else {
      this.showEvent(`¡CONVERSIÓN DE ${this.teamB.name.toUpperCase()}!`, 'Intento a los palos rival', 'info');
    }
  }

  /**
   * Conversion & Penalty Kick interactive mini-game:
   * Click to set direction, then click to set power and kick!
   */
  private updateConversion(dt: number, input: GameInput) {
    if (!this.conversion) return;
    const c = this.conversion;
    const kicker = this.players.find(p => p.id === c.kickerId);
    const isUserTeamKicking = kicker ? kicker.teamId === 'A' : true;

    if (c.stage === 'aiming') {
      // Swing needle back and forth
      c.angle += c.angleSpeed * c.angleDir * dt;
      if (c.angle > 35) { c.angle = 35; c.angleDir = -1; }
      if (c.angle < -35) { c.angle = -35; c.angleDir = 1; }

      const userClickTrigger = isUserTeamKicking && (input.passRequested || input.kickRequested);
      const aiAutoLock = !isUserTeamKicking && Math.abs(c.angle) < 14 && Math.random() < 0.08;

      if (userClickTrigger || aiAutoLock) {
        c.stage = 'power';
        retroAudio.playBlip();
        if (isUserTeamKicking) {
          this.showEvent('¡DIRECCIÓN FIJADA!', 'Click para fijar potencia', 'info');
        }
      }
    } else if (c.stage === 'power') {
      // Charge power bar
      c.power += c.powerSpeed * c.powerDir * dt;
      if (c.power > 100) { c.power = 100; c.powerDir = -1; }
      if (c.power < 10) { c.power = 10; c.powerDir = 1; }

      const userClickTrigger = isUserTeamKicking && (input.passRequested || input.kickRequested);
      const aiAutoLock = !isUserTeamKicking && c.power > 65 && Math.random() < 0.12;

      if (userClickTrigger || aiAutoLock) {
        c.stage = 'flight';
        c.ballFlightTimer = 0;
        retroAudio.playKick();

        // Accurate angle and sufficient power check
        const accurateAngle = Math.abs(c.angle) < 18;
        const sufficientPower = c.power > 45;
        c.isSuccess = accurateAngle && sufficientPower;

        if (c.isSuccess) {
          if (isUserTeamKicking) {
            this.stats.scoreA += 2;
            this.stats.conversionsA++;
            this.showEvent('¡¡¡CONVERSIÓN ADENTRO!!!', '+2 PUNTOS', 'points');
          } else {
            this.stats.scoreB += 2;
            this.stats.conversionsB++;
            this.showEvent(`¡CONVERSIÓN DE ${this.teamB.name.toUpperCase()}!`, '+2 PUNTOS RIVAL', 'points');
          }
          retroAudio.playWhistle();
        } else {
          this.showEvent('¡CONVERSIÓN ERRADA!', 'Balón desviado', 'info');
        }
      }
    } else if (c.stage === 'flight') {
      c.ballFlightTimer += dt;
      const t = Math.min(1, c.ballFlightTimer / 1.2);
      this.ball.x = c.kickX + (c.targetPostX - c.kickX) * t;
      this.ball.y = c.kickY + (c.targetPostY - c.kickY + (c.angle * 2.2)) * t;
      this.ball.z = Math.sin(t * Math.PI) * 45;
      this.ball.state = 'in_air_kick';
      this.ball.carrierId = null;

      if (c.ballFlightTimer > 1.2) {
        c.stage = 'result';
        c.ballFlightTimer = 0;
      }
    } else if (c.stage === 'result') {
      c.ballFlightTimer += dt;
      if (c.ballFlightTimer > 1.8) {
        // Kickoff restart for conceding team
        const concedingTeam = isUserTeamKicking ? 'B' : 'A';
        this.conversion = null;
        this.setupKickoff(concedingTeam);
      }
    }
  }

  /**
   * Knock-on or Forward pass whistle
   */
  public triggerKnockOn(x: number, y: number, committingTeam: 'A' | 'B', reason: string = '¡KNOCK-ON!') {
    this.situation = 'KNOCK_ON';
    this.whistleTimer = 1.4;
    retroAudio.playWhistle();
    this.showEvent(reason, 'Scrum para el equipo rival', 'whistle');

    if (committingTeam === 'A') this.stats.knockOnsA++;
    else this.stats.knockOnsB++;

    this.ball.state = 'grounded';
    this.ball.carrierId = null;
    this.ball.x = x;
    this.ball.y = y;
    this.ball.z = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;
  }

  private updateKnockOnWhistle(dt: number) {
    this.whistleTimer -= dt;
    if (this.whistleTimer <= 0) {
      // Award scrum to opposite team
      this.triggerScrum(this.ball.x, this.ball.y, 'B');
    }
  }

  /**
   * Ball trajectory in air or loose on pitch.
   * Rock-solid physics that ensures the ball never disappears or becomes invalid.
   */
  private updateBallPhysics(dt: number) {
    const b = this.ball;

    // Numerical sanity check (recovers cleanly if any coordinate was ever NaN)
    if (!isFinite(b.x)) b.x = PITCH_HALFWAY;
    if (!isFinite(b.y)) b.y = H_POST_Y_CENTER;
    if (!isFinite(b.z)) b.z = 0;
    if (!isFinite(b.vx)) b.vx = 0;
    if (!isFinite(b.vy)) b.vy = 0;
    if (!isFinite(b.vz)) b.vz = 0;

    if (b.state === 'held') {
      const carrier = b.carrierId ? this.players.find(p => p.id === b.carrierId) : null;
      if (carrier && carrier.state !== 'tackled') {
        b.x = carrier.x + (carrier.facing === 'right' ? 3 : -3);
        b.y = carrier.y - 2;
        b.z = 4;
        return;
      } else {
        // Carrier lost or tackled without ruck: safely ground ball on turf
        b.state = 'grounded';
        b.carrierId = null;
        b.z = 0;
      }
    }

    if (b.kickImmunityTimer && b.kickImmunityTimer > 0) {
      b.kickImmunityTimer -= dt;
    }

    if (b.state === 'in_air_pass' || b.state === 'in_air_kick') {
      b.x += b.vx;
      b.y += b.vy;
      b.z += b.vz;
      b.vz -= (b.state === 'in_air_kick' ? 0.20 : 0.08); // Lower gravity for pass
      b.z = Math.max(0, Math.min(60, b.z));
      b.rotation = (b.rotation || 0) + 0.2;

      // 1. Check for catch by intended receiver or teammates
      if (b.state === 'in_air_pass') {
        const teamLetter = b.lastCarrierId?.startsWith('A') ? 'A' : 'B';
        const targetReceiver = this.players.find(p => p.id === b.targetReceiverId && p.state !== 'tackled');
        const candidatePlayers = targetReceiver ? [targetReceiver] : this.players.filter(p => p.teamId === teamLetter && p.id !== b.lastCarrierId && p.state !== 'tackled');

        for (const p of candidatePlayers) {
          const dist = Math.hypot(p.x - b.x, p.y - b.y);
          if (dist < 18 && b.z < 18) {
            // Ball caught!
            b.state = 'held';
            b.carrierId = p.id;
            b.lastCarrierId = p.id;
            b.targetReceiverId = null;
            b.vx = 0;
            b.vy = 0;
            b.vz = 0;
            b.z = 4;
            retroAudio.playCatch();

            // Grant tackle protection upon catch so receiver isn't tackled on frame 0
            this.tackleProtectionTimer = 0.65;

            // Immediately set receiver into active run stride
            p.state = 'running';
            p.facing = p.teamId === 'A' ? 'right' : 'left';
            p.vx = p.teamId === 'A' ? p.speed * 1.4 : -p.speed * 1.4;

            if (p.teamId === 'A') {
              this.setUserControlled(p.id);
            }
            return;
          }
        }

        // Check for rare interception by opponents only if directly obstructing passing lane
        const oppTeamLetter = teamLetter === 'A' ? 'B' : 'A';
        for (const opp of this.players) {
          if (opp.teamId === oppTeamLetter && opp.state !== 'tackled' && opp.state !== 'rucking') {
            const dist = Math.hypot(opp.x - b.x, opp.y - b.y);
            const passTravel = Math.hypot(b.x - b.passStartX, b.y - b.passStartY);
            // Interception happens ONLY if defender is right in the line (< 4.5 units) and low flight
            if (dist < 4.5 && b.z < 6 && passTravel > 25 && Math.random() < 0.03) {
              // Interception!
              b.state = 'held';
              b.carrierId = opp.id;
              b.lastCarrierId = opp.id;
              b.targetReceiverId = null;
              b.vx = 0;
              b.vy = 0;
              b.vz = 0;
              b.z = 4;
              retroAudio.playCatch();
              this.showEvent('¡INTERCEPCIÓN!', 'Robo de balón', 'turnover');
              if (opp.teamId === 'A') {
                this.setUserControlled(opp.id);
              } else {
                this.startRivalDrive(opp.x, opp.y);
                return;
              }
              return;
            }
          }
        }
      } else {
        // Kick catch check (only after ball has cleared the kicker)
        const canCatchKick = !(b.kickImmunityTimer && b.kickImmunityTimer > 0);
        if (canCatchKick) {
          for (const p of this.players) {
            if (p.state !== 'tackled' && p.state !== 'rucking') {
              const dist = Math.hypot(p.x - b.x, p.y - b.y);
              if (dist < 14 && b.z < 14) {
                b.state = 'held';
                b.carrierId = p.id;
                b.lastCarrierId = p.id;
                b.vx = 0;
                b.vy = 0;
                b.vz = 0;
                b.z = 4;
                retroAudio.playCatch();
                if (p.teamId === 'A') {
                  this.setUserControlled(p.id);
                  this.tackleProtectionTimer = 0.65;
                  this.showEvent('¡PELOTA RECUPERADA EN EL AIRE!', '¡Salida rápida al contraataque!', 'info');
                } else {
                  this.startRivalDrive(p.x, p.y);
                  return;
                }
                return;
              }
            }
          }
        }
      }

      // Ball hits the ground
      if (b.z <= 0) {
        b.z = 0;
        if (b.vz < 0) {
          b.vz = -b.vz * 0.35;
          b.vx *= 0.7;
          b.vy *= 0.7;
          if (Math.abs(b.vz) < 0.35) {
            b.vz = 0;
            b.state = 'grounded';
          }
        } else {
          b.state = 'grounded';
        }
      }
    } else if (b.state === 'grounded') {
      b.vx *= 0.88;
      b.vy *= 0.88;
      b.x += b.vx;
      b.y += b.vy;
      b.z = 0;

      // Only allow loose ball scoops in OPEN_PLAY (never during tackle placement or active ruck)
      if (this.situation === 'OPEN_PLAY') {
        for (const p of this.players) {
          if (p.state !== 'tackled' && p.state !== 'rucking') {
            const dist = Math.hypot(p.x - b.x, p.y - b.y);
            if (dist < 10) {
              b.state = 'held';
              b.carrierId = p.id;
              b.lastCarrierId = p.id;
              b.vx = 0;
              b.vy = 0;
              b.z = 4;
              retroAudio.playCatch();
              if (p.teamId === 'A') {
                this.setUserControlled(p.id);
                this.tackleProtectionTimer = 0.8;
                this.showEvent('¡PELOTA SUELTA RECUPERADA!', '¡Ataque en marcha!', 'info');
              } else {
                this.startRivalDrive(p.x, p.y);
                return;
              }
              return;
            }
          }
        }
      }
    }

    // Keep ball strictly on pitch
    b.x = Math.max(PITCH_DEADBALL_LEFT + 5, Math.min(PITCH_DEADBALL_RIGHT - 5, b.x));
    b.y = Math.max(PITCH_TOUCH_LINE_TOP - 6, Math.min(PITCH_TOUCH_LINE_BOTTOM + 6, b.y));
    b.z = Math.max(0, Math.min(60, b.z));
  }

  /**
   * AI behavior for teammates and opponents:
   * Maintains authentic rugby union attack structures and disciplined defensive lines
   * Prevents swarming to the sidelines or bunching into single points
   */
  private updateAIPlayer(player: Player, carrier: Player | null, _dt: number) {
    const isTeamA = player.teamId === 'A';
    const isTeammateOfCarrier = carrier ? carrier.teamId === player.teamId : false;
    const spd = this.getFatiguedSpeed(player) * 1.25;

    // 1. BALL IN AIR (Pass or Kick) or LOOSE ON GROUND:
    if (!carrier) {
      if (this.ball.state === 'in_air_pass') {
        const isTarget = player.id === this.ball.targetReceiverId;
        if (isTarget) {
          // ONLY the designated receiver runs directly to intercept the ball
          const dx = this.ball.x - player.x;
          const dy = this.ball.y - player.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 3) {
            player.vx = (dx / dist) * spd * 1.15;
            player.vy = (dy / dist) * spd * 1.15;
            player.facing = player.vx >= 0 ? 'right' : 'left';
            player.state = 'running';
          }
          return;
        }

        // Other teammates maintain support depth relative to the ball's X position
        const dir = isTeamA ? 1 : -1;
        const laneY = this.getTacticalLane(player.position);
        const depth = this.getAttackDepth(player.position);
        const desiredX = this.ball.x - dir * depth;
        const desiredY = Math.max(PITCH_TOUCH_LINE_TOP + 40, Math.min(PITCH_TOUCH_LINE_BOTTOM - 40, laneY));
        const dx = desiredX - player.x;
        const dy = desiredY - player.y;
        player.vx = Math.sign(dx) * Math.min(Math.abs(dx) * 0.15, spd);
        player.vy = Math.sign(dy) * Math.min(Math.abs(dy) * 0.15, spd);
        player.state = Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1 ? 'running' : 'idle';
        return;
      }

      // Loose ball: ONLY the single closest player from each team chases it
      const teammates = this.players.filter(p => p.teamId === player.teamId && p.state !== 'tackled');
      teammates.sort((a, b) => Math.hypot(a.x - this.ball.x, a.y - this.ball.y) - Math.hypot(b.x - this.ball.x, b.y - this.ball.y));
      const isChaser = teammates[0]?.id === player.id;

      if (isChaser) {
        const dx = this.ball.x - player.x;
        const dy = this.ball.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 3) {
          player.vx = (dx / dist) * spd;
          player.vy = (dy / dist) * spd;
          player.facing = player.vx >= 0 ? 'right' : 'left';
          player.state = 'running';
        }
      } else {
        // Hold field channel instead of all 30 players piling on the ball
        const laneY = this.getTacticalLane(player.position);
        const targetX = this.ball.x + (isTeamA ? -35 : 35);
        const targetY = Math.max(PITCH_TOUCH_LINE_TOP + 40, Math.min(PITCH_TOUCH_LINE_BOTTOM - 40, laneY));
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        player.vx = Math.sign(dx) * Math.min(Math.abs(dx) * 0.12, spd * 0.8);
        player.vy = Math.sign(dy) * Math.min(Math.abs(dy) * 0.12, spd * 0.8);
        player.state = Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1 ? 'running' : 'idle';
      }
      return;
    }

    // 2. AI BALL CARRIER (Team B attacking towards user's tryline)
    if (carrier.id === player.id) {
      const targetTryLineX = isTeamA ? PITCH_TRYLINE_RIGHT : PITCH_TRYLINE_LEFT;
      const dx = targetTryLineX - player.x;
      player.vx = (dx > 0 ? 1 : -1) * spd * 1.05;

      const nearestOpp = this.findNearestPlayer(player, isTeamA ? 'B' : 'A');
      const oppDist = nearestOpp ? Math.hypot(nearestOpp.x - player.x, nearestOpp.y - player.y) : 999;

      // Dynamic evasive cuts / sidestep:
      if (nearestOpp && oppDist < 42 && Math.abs(nearestOpp.x - player.x) < 32) {
        const stepDir = player.y >= nearestOpp.y ? 1 : -1;
        player.vy = stepDir * spd * 0.70;
      } else {
        const laneY = this.getTacticalLane(player.position);
        player.vy = (laneY - player.y) * 0.06;
      }

      player.facing = player.vx >= 0 ? 'right' : 'left';
      player.state = 'running';

      // Authentic AI rugby play choices:
      // A. Deep territory tactical kick to relieve pressure
      const inOwnDeep22 = isTeamA ? player.x < PITCH_22M_LEFT : player.x > PITCH_22M_RIGHT;
      if (inOwnDeep22 && (player.position === 10 || player.position === 15) && oppDist < 26) {
        if (Math.random() < 0.20) {
          this.attemptTacticalKick(player);
          return;
        }
      }

      // B. Smart passing to support teammates (creating multi-phase plays for opponent):
      // If approached by defender or if playmakers spread wide to fast wings:
      if (oppDist < 28 || (player.position === 10 && Math.random() < 0.05)) {
        if (Math.random() < 0.25) {
          this.attemptPass(player, null);
        }
      }
      return;
    }

    // 3. ATTACKING SUPPORT (Teammates of ball carrier)
    if (isTeammateOfCarrier) {
      const dir = isTeamA ? 1 : -1;
      const isForward = RUGBY_POSITIONS[player.position].isForward;
      let desiredX;
      let desiredY;

      if (isForward) {
        // Forward Pack Pods: tightly support the carrier around their hips for rucks & crash balls
        const depth = player.position === 8 ? 8 : (player.position <= 3 ? 12 : 16);
        desiredX = carrier.x - dir * depth;

        let forwardOffsetY = 0;
        if (player.position === 1) forwardOffsetY = -12;
        else if (player.position === 2) forwardOffsetY = -4;
        else if (player.position === 3) forwardOffsetY = 12;
        else if (player.position === 4) forwardOffsetY = -20;
        else if (player.position === 5) forwardOffsetY = 20;
        else if (player.position === 6) forwardOffsetY = -28;
        else if (player.position === 7) forwardOffsetY = 28;
        else if (player.position === 8) forwardOffsetY = 0;

        desiredY = Math.max(PITCH_TOUCH_LINE_TOP + 35, Math.min(PITCH_TOUCH_LINE_BOTTOM - 35, carrier.y + forwardOffsetY));
      } else {
        // Backs (9, 10, 12, 13, 11, 14, 15) fan into wide space in attacking echelon
        const depth = this.getAttackDepth(player.position);
        desiredX = carrier.x - dir * depth;
        const laneY = this.getTacticalLane(player.position, carrier.y);
        desiredY = Math.max(PITCH_TOUCH_LINE_TOP + 40, Math.min(PITCH_TOUCH_LINE_BOTTOM - 40, laneY));
      }

      const dx = desiredX - player.x;
      const dy = desiredY - player.y;

      player.vx = carrier.vx * 0.92 + Math.sign(dx) * Math.min(Math.abs(dx) * 0.22, spd * 1.15);
      player.vy = Math.sign(dy) * Math.min(Math.abs(dy) * 0.22, spd * 1.15);
      player.facing = isTeamA ? 'right' : 'left';
      player.state = Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1 ? 'running' : 'idle';
    } 
    // 4. DEFENSIVE WALL (Opponents of ball carrier)
    else {
      const offsideX = carrier.x + (isTeamA ? -34 : 34);
      const laneY = this.getTacticalLane(player.position);
      const driftY = (carrier.y - H_POST_Y_CENTER) * 0.18;
      const targetY = Math.max(PITCH_TOUCH_LINE_TOP + 45, Math.min(PITCH_TOUCH_LINE_BOTTOM - 45, laneY + driftY));

      // Single primary tackler closest to carrier
      const defenders = this.players.filter(p => p.teamId === player.teamId && p.state !== 'tackled');
      defenders.sort((a, b) => Math.hypot(a.x - carrier.x, a.y - carrier.y) - Math.hypot(b.x - carrier.x, b.y - carrier.y));
      const primaryTackler = defenders[0];
      const isPrimary = primaryTackler && primaryTackler.id === player.id;
      const distToCarrier = Math.hypot(carrier.x - player.x, carrier.y - player.y);

      if (isPrimary && distToCarrier < 85) {
        // Only primary tackler commits directly to carrier
        const tdx = carrier.x - player.x;
        const tdy = carrier.y - player.y;
        player.vx = (tdx / distToCarrier) * spd * 1.10;
        player.vy = (tdy / distToCarrier) * spd * 1.10;
        player.facing = player.vx >= 0 ? 'right' : 'left';
        player.state = 'running';
      } else if (distToCarrier < 15) {
        // Close personal perimeter assistance
        const tdx = carrier.x - player.x;
        const tdy = carrier.y - player.y;
        player.vx = (tdx / distToCarrier) * spd;
        player.vy = (tdy / distToCarrier) * spd;
        player.facing = player.vx >= 0 ? 'right' : 'left';
        player.state = 'running';
      } else {
        // Hold disciplined defensive wall and drift
        let targetX = offsideX;
        if (player.position === 15) {
          targetX = offsideX + (isTeamA ? -55 : 55);
        }

        const dx = targetX - player.x;
        const dy = targetY - player.y;
        player.vx = Math.sign(dx) * Math.min(Math.abs(dx) * 0.15, spd * 0.85);
        player.vy = Math.sign(dy) * Math.min(Math.abs(dy) * 0.15, spd * 0.85);
        player.facing = isTeamA ? 'right' : 'left';
        player.state = Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1 ? 'running' : 'idle';
      }
    }
  }

  private findNearestPlayer(origin: Player, targetTeamId: 'A' | 'B'): Player | null {
    let nearest: Player | null = null;
    let minD = Infinity;
    for (const p of this.players) {
      if (p.teamId === targetTeamId) {
        const d = Math.hypot(p.x - origin.x, p.y - origin.y);
        if (d < minD) {
          minD = d;
          nearest = p;
        }
      }
    }
    return nearest;
  }

  private switchControlToNearestDefender(targetX: number, targetY: number) {
    const defenders = this.players.filter(p => p.teamId === 'A' && p.state !== 'tackled');
    defenders.sort((a, b) => Math.hypot(a.x - targetX, a.y - targetY) - Math.hypot(b.x - targetX, b.y - targetY));
    
    let chosen = defenders[0];
    if (defenders.length > 1 && chosen.id === this.userControllingId) {
      chosen = defenders[1];
    }
    if (chosen) {
      this.setUserControlled(chosen.id);
      retroAudio.playBlip();
    }
  }

  private updatePlayerAnimations(player: Player, dt: number) {
    player.animTimer += dt;
    const isSprinting = player.state === 'running' && player.isUserControlled && Math.abs(player.vx) > 1.2;
    const frameInterval = isSprinting ? 0.08 : (player.state === 'running' ? 0.11 : 0.22);
    const maxFrames = isSprinting ? 8 : (player.state === 'running' ? 6 : 4);

    if (player.animTimer > frameInterval) {
      player.animTimer = 0;
      player.animFrame = (player.animFrame + 1) % maxFrames;
    }

    if (player.stateTimer > 0) {
      player.stateTimer -= dt;
      if (player.stateTimer <= 0) {
        if (player.state === 'tackled' && !player.tackleState) {
          player.state = 'idle';
        } else if (player.state === 'passing' || player.state === 'kicking' || player.state === 'tackling' || player.state === 'hand_off') {
          player.state = 'idle';
        }
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt * 2.5;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  public spawnDustParticles(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        color: Math.random() > 0.5 ? '#cbd5e1' : '#15803d',
        life: 1.0,
      });
    }
  }

  private handleHalfOrFullTime() {
    if (this.currentHalf === 1) {
      this.currentHalf = 2;
      this.matchTimeRemaining = 180; // Second half
      this.situation = 'HALF_TIME';
      retroAudio.playWhistle();
      this.showEvent('¡ENTRETIEMPO!', 'Fin del primer tiempo', 'whistle');
    } else {
      this.situation = 'FULL_TIME';
      retroAudio.playWhistle();
      this.showEvent('¡FINAL DEL PARTIDO!', 'Resultado definitivo', 'whistle');
    }
  }

  public resumeSecondHalf() {
    this.situation = 'OPEN_PLAY';
    this.setupKickoff('B');
  }

  public showEvent(text: string, subtext: string, type: 'try' | 'whistle' | 'points' | 'turnover' | 'info') {
    this.eventMessage = {
      id: Math.random().toString(),
      text,
      subtext,
      type,
      timer: 2.2,
    };
  }
}
