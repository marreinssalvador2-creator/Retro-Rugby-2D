/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  VIRTUAL_WIDTH,
  VIRTUAL_HEIGHT,
  PITCH_TOTAL_LENGTH,
  PITCH_WIDTH,
  PITCH_TRYLINE_LEFT,
  PITCH_TRYLINE_RIGHT,
  PITCH_22M_LEFT,
  PITCH_10M_LEFT,
  PITCH_HALFWAY,
  PITCH_10M_RIGHT,
  PITCH_22M_RIGHT,
  PITCH_TOUCH_LINE_TOP,
  PITCH_TOUCH_LINE_BOTTOM,
  PITCH_DEADBALL_LEFT,
  PITCH_DEADBALL_RIGHT,
  H_POST_Y_CENTER,
  H_POST_WIDTH,
  PITCH_IN_GOAL_DEPTH,
} from './constants';
import { Player, Ball, TeamData, MatchSituation, RuckContest, ScrumContest, LineoutContest, ConversionContest } from '../types/rugby';
import type { SlingshotKickAim } from './engine';

export class RetroRenderer {
  private ctx: CanvasRenderingContext2D;
  public cameraX: number = 0;
  public cameraY: number = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  /**
   * Updates camera smoothly to follow the active player or ball with leading offset
   */
  public updateCamera(targetX: number, targetY: number, targetFacing: 'left' | 'right' = 'right') {
    // Lead camera slightly ahead in movement direction
    const leadX = targetFacing === 'right' ? 45 : -45;
    const destX = targetX + leadX - VIRTUAL_WIDTH / 2;
    const destY = targetY - VIRTUAL_HEIGHT / 2;

    // Smooth lerp
    this.cameraX += (destX - this.cameraX) * 0.12;
    this.cameraY += (destY - this.cameraY) * 0.12;

    // Clamp camera within world bounds
    const minCamX = -30;
    const maxCamX = PITCH_TOTAL_LENGTH - VIRTUAL_WIDTH + 30;
    const minCamY = -20;
    const maxCamY = PITCH_WIDTH - VIRTUAL_HEIGHT + 20;

    this.cameraX = Math.max(minCamX, Math.min(maxCamX, this.cameraX));
    this.cameraY = Math.max(minCamY, Math.min(maxCamY, this.cameraY));
  }

  public render(
    teamA: TeamData,
    teamB: TeamData,
    players: Player[],
    ball: Ball,
    situation: MatchSituation,
    ruck: RuckContest | null,
    scrum: ScrumContest | null,
    lineout: LineoutContest | null,
    conversion: ConversionContest | null,
    passTarget: { x: number; y: number } | null,
    particles: { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
    targetReceiver: Player | null = null,
    passGesture: { isDragging: boolean; unlocked: boolean; startX: number; startY: number; currentX: number; currentY: number } | null = null,
    slingshotAim: SlingshotKickAim | null = null
  ) {
    const ctx = this.ctx;

    // Disable image smoothing for crisp pixel rendering
    ctx.imageSmoothingEnabled = false;

    ctx.save();
    // Clear screen
    ctx.fillStyle = '#0b130e';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Camera transform
    const camX = Math.round(this.cameraX);
    const camY = Math.round(this.cameraY);
    ctx.translate(-camX, -camY);

    // 1. Draw Field Turf and Lines
    this.drawPitch();

    // 2. Draw H-Posts on Try Lines
    this.drawGoalPosts();

    // 3. Draw Ruck Contest / Scrum / Lineout marks
    if (ruck) this.drawRuck(ruck);
    if (scrum) this.drawScrum(scrum);
    if (lineout) this.drawLineout(lineout);

    // 4. Draw Passing Target or Slingshot Kick Trajectory
    if (ball.state === 'held') {
      const carrier = players.find(p => p.id === ball.carrierId);
      if (carrier && carrier.teamId === 'A') {
        if (slingshotAim && slingshotAim.isDragging) {
          this.drawSlingshotKickTrajectory(carrier, slingshotAim);
        } else if (passGesture && passGesture.isDragging) {
          if (!passGesture.unlocked) {
            this.drawPassUnlockGuide(carrier, passGesture);
          } else {
            this.drawUnlockedPassAim(carrier, passGesture, targetReceiver);
          }
        } else if (passTarget) {
          this.drawPassAimTrajectory(carrier.x, carrier.y - 6, passTarget.x, passTarget.y);
        } else if (targetReceiver) {
          this.drawReceiverHighlight(targetReceiver);
        }
      }
    }

    // 5. Draw Particles (dust, sweat, impact)
    this.drawParticles(particles);

    // 6. Draw Players (Y-sorted for proper 2D depth)
    const sortedPlayers = [...players].sort((a, b) => a.y - b.y);
    for (const player of sortedPlayers) {
      const team = player.teamId === 'A' ? teamA : teamB;
      this.drawPlayer(player, team);
    }

    // 7. Draw Ball (if not held inside player)
    this.drawBall(ball);

    ctx.restore();

    // 8. Screen-space Overlays (Conversion kicking HUD, etc.)
    if (conversion && (situation === 'CONVERSION' || situation === 'PENALTY_KICK')) {
      this.drawConversionOverlay(conversion, teamA, teamB);
    }
  }

  /**
   * Draws the horizontal Rugby pitch with lawn stripes, touchlines, 22m, 10m, halfway, and numbers
   */
  private drawPitch() {
    const ctx = this.ctx;

    // Outer turf / sideline apron
    ctx.fillStyle = '#164821';
    ctx.fillRect(-60, -40, PITCH_TOTAL_LENGTH + 120, PITCH_WIDTH + 80);

    // Advertising boards along top and bottom sidelines (retro style)
    this.drawAdBoards();

    // Playing pitch stripes (alternating greens every 50 units = 5 meters)
    const stripeWidth = 50;
    const startX = PITCH_DEADBALL_LEFT;
    const endX = PITCH_DEADBALL_RIGHT;
    let isDark = false;

    for (let x = startX; x < endX; x += stripeWidth) {
      ctx.fillStyle = isDark ? '#1e682e' : '#237936';
      ctx.fillRect(x, PITCH_TOUCH_LINE_TOP, stripeWidth, PITCH_TOUCH_LINE_BOTTOM - PITCH_TOUCH_LINE_TOP);
      isDark = !isDark;
    }

    // In-goal turf areas (slightly distinct hue)
    ctx.fillStyle = 'rgba(15, 60, 25, 0.45)';
    ctx.fillRect(0, PITCH_TOUCH_LINE_TOP, PITCH_TRYLINE_LEFT, PITCH_TOUCH_LINE_BOTTOM - PITCH_TOUCH_LINE_TOP);
    ctx.fillRect(PITCH_TRYLINE_RIGHT, PITCH_TOUCH_LINE_TOP, PITCH_IN_GOAL_DEPTH, PITCH_TOUCH_LINE_BOTTOM - PITCH_TOUCH_LINE_TOP);

    // Touchlines (top & bottom)
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(PITCH_DEADBALL_LEFT, PITCH_TOUCH_LINE_TOP);
    ctx.lineTo(PITCH_DEADBALL_RIGHT, PITCH_TOUCH_LINE_TOP);
    ctx.moveTo(PITCH_DEADBALL_LEFT, PITCH_TOUCH_LINE_BOTTOM);
    ctx.lineTo(PITCH_DEADBALL_RIGHT, PITCH_TOUCH_LINE_BOTTOM);

    // Dead-ball lines at ends
    ctx.moveTo(PITCH_DEADBALL_LEFT, PITCH_TOUCH_LINE_TOP);
    ctx.lineTo(PITCH_DEADBALL_LEFT, PITCH_TOUCH_LINE_BOTTOM);
    ctx.moveTo(PITCH_DEADBALL_RIGHT, PITCH_TOUCH_LINE_TOP);
    ctx.lineTo(PITCH_DEADBALL_RIGHT, PITCH_TOUCH_LINE_BOTTOM);
    ctx.stroke();

    // Try Lines (Goal Lines) - Thick crisp white lines
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(PITCH_TRYLINE_LEFT, PITCH_TOUCH_LINE_TOP);
    ctx.lineTo(PITCH_TRYLINE_LEFT, PITCH_TOUCH_LINE_BOTTOM);
    ctx.moveTo(PITCH_TRYLINE_RIGHT, PITCH_TOUCH_LINE_TOP);
    ctx.lineTo(PITCH_TRYLINE_RIGHT, PITCH_TOUCH_LINE_BOTTOM);
    ctx.stroke();

    // 22-Meter Lines (solid)
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PITCH_22M_LEFT, PITCH_TOUCH_LINE_TOP);
    ctx.lineTo(PITCH_22M_LEFT, PITCH_TOUCH_LINE_BOTTOM);
    ctx.moveTo(PITCH_22M_RIGHT, PITCH_TOUCH_LINE_TOP);
    ctx.lineTo(PITCH_22M_RIGHT, PITCH_TOUCH_LINE_BOTTOM);
    ctx.stroke();

    // 10-Meter Lines (dashed)
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(PITCH_10M_LEFT, PITCH_TOUCH_LINE_TOP);
    ctx.lineTo(PITCH_10M_LEFT, PITCH_TOUCH_LINE_BOTTOM);
    ctx.moveTo(PITCH_10M_RIGHT, PITCH_TOUCH_LINE_TOP);
    ctx.lineTo(PITCH_10M_RIGHT, PITCH_TOUCH_LINE_BOTTOM);
    ctx.stroke();

    // Halfway 50m Line (solid with center circle & spot)
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PITCH_HALFWAY, PITCH_TOUCH_LINE_TOP);
    ctx.lineTo(PITCH_HALFWAY, PITCH_TOUCH_LINE_BOTTOM);
    ctx.stroke();

    // Halfway center spot
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(PITCH_HALFWAY - 2, H_POST_Y_CENTER - 2, 4, 4);

    // 5m and 15m dashed touchlines (Standard Rugby Union pitch marks)
    ctx.setLineDash([4, 10]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    const fiveM = 35;
    const fifteenM = 110;
    ctx.beginPath();
    ctx.moveTo(PITCH_TRYLINE_LEFT, PITCH_TOUCH_LINE_TOP + fiveM);
    ctx.lineTo(PITCH_TRYLINE_RIGHT, PITCH_TOUCH_LINE_TOP + fiveM);
    ctx.moveTo(PITCH_TRYLINE_LEFT, PITCH_TOUCH_LINE_TOP + fifteenM);
    ctx.lineTo(PITCH_TRYLINE_RIGHT, PITCH_TOUCH_LINE_TOP + fifteenM);
    ctx.moveTo(PITCH_TRYLINE_LEFT, PITCH_TOUCH_LINE_BOTTOM - fifteenM);
    ctx.lineTo(PITCH_TRYLINE_RIGHT, PITCH_TOUCH_LINE_BOTTOM - fifteenM);
    ctx.moveTo(PITCH_TRYLINE_LEFT, PITCH_TOUCH_LINE_BOTTOM - fiveM);
    ctx.lineTo(PITCH_TRYLINE_RIGHT, PITCH_TOUCH_LINE_BOTTOM - fiveM);
    ctx.stroke();
    ctx.setLineDash([]);

    // Stenciled Field Numbers (Large Retro Stencil)
    this.drawFieldNumbers();
  }

  private drawFieldNumbers() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const yTop = PITCH_TOUCH_LINE_TOP + 32;
    const yBottom = PITCH_TOUCH_LINE_BOTTOM - 32;

    const markers = [
      { x: PITCH_22M_LEFT, text: '22' },
      { x: PITCH_10M_LEFT, text: '10' },
      { x: PITCH_HALFWAY, text: '50' },
      { x: PITCH_10M_RIGHT, text: '10' },
      { x: PITCH_22M_RIGHT, text: '22' },
    ];

    for (const m of markers) {
      ctx.fillText(m.text, m.x, yTop);
      ctx.fillText(m.text, m.x, yBottom);
    }

    // "IN-GOAL" text stenciled in end zones
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.save();
    ctx.translate(PITCH_TRYLINE_LEFT - 50, H_POST_Y_CENTER);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('IN-GOAL', 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(PITCH_TRYLINE_RIGHT + 50, H_POST_Y_CENTER);
    ctx.rotate(Math.PI / 2);
    ctx.fillText('IN-GOAL', 0, 0);
    ctx.restore();
  }

  private drawAdBoards() {
    const ctx = this.ctx;
    const brands = ['RETRO RUGBY', 'RUGBY WORLD', 'POWER SCRUM', 'KICK PASS', 'TRY ZONE'];
    const boardWidth = 140;
    const boardHeight = 10;

    // Top ad boards
    let bIdx = 0;
    for (let x = 0; x < PITCH_TOTAL_LENGTH; x += boardWidth + 10) {
      ctx.fillStyle = bIdx % 2 === 0 ? '#1e293b' : '#334155';
      ctx.fillRect(x, PITCH_TOUCH_LINE_TOP - 16, boardWidth, boardHeight);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(brands[bIdx % brands.length], x + boardWidth / 2, PITCH_TOUCH_LINE_TOP - 9);
      bIdx++;
    }

    // Bottom ad boards
    bIdx = 0;
    for (let x = 0; x < PITCH_TOTAL_LENGTH; x += boardWidth + 10) {
      ctx.fillStyle = bIdx % 2 === 0 ? '#1e293b' : '#334155';
      ctx.fillRect(x, PITCH_TOUCH_LINE_BOTTOM + 6, boardWidth, boardHeight);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(brands[bIdx % brands.length], x + boardWidth / 2, PITCH_TOUCH_LINE_BOTTOM + 13);
      bIdx++;
    }
  }

  /**
   * Draws the iconic Rugby H-posts on the goal lines
   */
  private drawGoalPosts() {
    const ctx = this.ctx;
    const halfW = H_POST_WIDTH / 2;

    const postLocations = [PITCH_TRYLINE_LEFT, PITCH_TRYLINE_RIGHT];

    for (const postX of postLocations) {
      const topY = H_POST_Y_CENTER - halfW;
      const botY = H_POST_Y_CENTER + halfW;

      // Post shadow on turf
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(postX - 2, topY - 1, 16, 4);
      ctx.fillRect(postX - 2, botY - 1, 16, 4);

      // Post bases / pads (protective foam wraps in team colors)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(postX - 3, topY - 3, 6, 6);
      ctx.fillRect(postX - 3, botY - 3, 6, 6);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.strokeRect(postX - 3, topY - 3, 6, 6);
      ctx.strokeRect(postX - 3, botY - 3, 6, 6);

      // Crossbar between the two uprights
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(postX, topY);
      ctx.lineTo(postX, botY);
      ctx.stroke();

      // Top vertical upright tips (drawn sticking out)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(postX - 1, topY - 10, 2, 10);
      ctx.fillRect(postX - 1, botY, 2, 10);
    }
  }

  /**
   * Procedural Retro Bowl Player Sprite
   * Low resolution pixel-perfect character: ~16px tall, 8-10px wide
   */
  private drawPlayer(player: Player, team: TeamData, isCarrying: boolean = false) {
    const ctx = this.ctx;
    const x = Math.round(player.x);
    const y = Math.round(player.y);
    const isFacingRight = player.facing === 'right';

    ctx.save();
    ctx.translate(x, y);

    if (!isFacingRight) {
      ctx.scale(-1, 1);
    }

    // 1. Dynamic Pixel Shadow (adapts to jumping, diving, and ground impact)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    if (player.state === 'diving') {
      ctx.fillRect(-10, 10, 20, 2);
    } else if (player.state === 'tackled') {
      ctx.fillRect(-12, 6, 24, 3);
    } else {
      ctx.fillRect(-7, 9, 14, 3);
    }

    // 2. Active User Indicator (Retro yellow arrow)
    if (player.isUserControlled) {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-2, -22, 4, 3);
      ctx.fillRect(-3, -19, 6, 2);
      ctx.fillRect(-1, -17, 2, 2);
    }

    // Role badge for key playmakers (#10 Apertura, #9 Medio Scrum)
    if (player.position === 10 || player.position === 9) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(player.position === 10 ? '10' : '9', 0, -25);
    }

    // 3. Multi-phase Tackle State Machine Animation
    if (player.tackleState) {
      this.drawTackleState(player, team);
      ctx.restore();
      return;
    }

    if (player.state === 'tackled') {
      this.drawPlayerDown(player, team);
      ctx.restore();
      return;
    }

    if (player.state === 'diving') {
      this.drawPlayerDive(player, team);
      ctx.restore();
      return;
    }

    if (player.state === 'celebrating') {
      this.drawPlayerCelebrating(player, team);
      ctx.restore();
      return;
    }

    if (player.state === 'rucking') {
      this.drawPlayerRucking(player, team);
      ctx.restore();
      return;
    }

    if (player.state === 'kicking') {
      this.drawPlayerKicking(player, team);
      ctx.restore();
      return;
    }

    // 4. Human Rugby Player Sprite (Exact proportions from reference image)
    this.drawHumanRugbyPlayer(player, team, isCarrying);

    ctx.restore();
  }

  /**
   * Authentic Human Rugby Player Sprite modeled directly on user reference pixel art:
   * - Realistic human proportions with elbows, knees, muscular thighs, and separate limbs
   * - Distinct layered rendering: skin tone, hair, jersey with horizontal stripe, white cuffs,
   *   white shorts, socks with white top fold band, and rugby cleats.
   * - Morphological scaling by position (Pilieres robustos, Segundas líneas altos, Medio scrum ágil).
   */
  private drawHumanRugbyPlayer(player: Player, team: TeamData, isCarrying: boolean) {
    const ctx = this.ctx;
    const isMoving = player.state === 'running';
    const isSprinting = isMoving && player.isUserControlled && Math.abs(player.vx) > 1.2;
    const anim = player.animFrame;
    const body = player.bodyType || 'back_speed';

    // Body dimensions by role
    let torsoW = 10;
    let torsoH = 9;
    let legThick = 3;
    let yOffset = 0;

    if (body === 'prop_heavy') {
      torsoW = 12; // Broader heavy forward
      torsoH = 9;
      legThick = 4;
    } else if (body === 'lock_tall') {
      torsoW = 10;
      torsoH = 11; // Tall second row
      yOffset = -2;
    } else if (body === 'scrumhalf_agile') {
      torsoW = 8; // Nimble scrum-half
      torsoH = 8;
      yOffset = 1;
    }

    const skin = player.skinTone || '#e09e6c';
    const primary = team.kit.primary;
    const sockColor = team.kit.socks;
    const bootColor = '#1e242b';
    const whiteAccent = '#ffffff';

    // Dynamic banking tilt into the cut when dodging vertically (amague)
    if (Math.abs(player.vy) > 0.20) {
      ctx.rotate(player.vy * 0.08);
    }

    // A. LEGS & STRIDE (Defined human legs with knee joint and white-banded socks)
    if (isMoving) {
      const strideCycle = anim % 6;
      // Stride offsets
      let fX = 2;
      let fY = 4 + yOffset;
      let bX = -4;
      let bY = 4 + yOffset;

      if (strideCycle === 0) {
        fX = 3; fY = 3 + yOffset;
        bX = -5; bY = 2 + yOffset;
      } else if (strideCycle === 1) {
        fX = 2; fY = 5 + yOffset;
        bX = -3; bY = 3 + yOffset;
      } else if (strideCycle === 2) {
        fX = 0; fY = 5 + yOffset;
        bX = -1; bY = 4 + yOffset;
      } else if (strideCycle === 3) {
        fX = -5; fY = 2 + yOffset;
        bX = 3; bY = 3 + yOffset;
      } else if (strideCycle === 4) {
        fX = -3; fY = 3 + yOffset;
        bX = 2; bY = 5 + yOffset;
      } else {
        fX = -1; fY = 4 + yOffset;
        bX = 0; bY = 5 + yOffset;
      }

      // Back Leg (behind shorts)
      ctx.fillStyle = skin;
      ctx.fillRect(bX, bY - 2, legThick, 3); // Thigh
      ctx.fillStyle = whiteAccent;
      ctx.fillRect(bX, bY + 1, legThick, 1); // White sock top band
      ctx.fillStyle = sockColor;
      ctx.fillRect(bX, bY + 2, legThick, 3); // Main sock
      ctx.fillStyle = bootColor;
      ctx.fillRect(bX - 1, bY + 5, legThick + 1, 2); // Cleat
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(bX - 1, bY + 7, 1, 1); // Cleat studs
      ctx.fillRect(bX + legThick - 1, bY + 7, 1, 1);

      // Front Leg
      ctx.fillStyle = skin;
      ctx.fillRect(fX, fY - 2, legThick, 3); // Thigh
      ctx.fillStyle = whiteAccent;
      ctx.fillRect(fX, fY + 1, legThick, 1); // White sock top band
      ctx.fillStyle = sockColor;
      ctx.fillRect(fX, fY + 2, legThick, 3); // Main sock
      ctx.fillStyle = bootColor;
      ctx.fillRect(fX, fY + 5, legThick + 1, 2); // Cleat
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(fX, fY + 7, 1, 1); // Cleat studs
      ctx.fillRect(fX + legThick, fY + 7, 1, 1);
      ctx.fillStyle = bootColor;
      ctx.fillRect(fX, fY + 5, legThick + 1, 2); // Cleat
    } else {
      // Idle standing stance: feet planted shoulder-width
      const legY = 3 + yOffset;
      // Left leg
      ctx.fillStyle = skin;
      ctx.fillRect(-3, legY, legThick, 3);
      ctx.fillStyle = whiteAccent;
      ctx.fillRect(-3, legY + 3, legThick, 1);
      ctx.fillStyle = sockColor;
      ctx.fillRect(-3, legY + 4, legThick, 3);
      ctx.fillStyle = bootColor;
      ctx.fillRect(-4, legY + 7, legThick + 1, 2);

      // Right leg
      ctx.fillStyle = skin;
      ctx.fillRect(2, legY, legThick, 3);
      ctx.fillStyle = whiteAccent;
      ctx.fillRect(2, legY + 3, legThick, 1);
      ctx.fillStyle = sockColor;
      ctx.fillRect(2, legY + 4, legThick, 3);
      ctx.fillStyle = bootColor;
      ctx.fillRect(2, legY + 7, legThick + 1, 2);
    }

    // B. RUGBY SHORTS (Contoured white shorts with realistic leg separation)
    ctx.fillStyle = team.kit.shorts || '#ffffff';
    const shortsW = torsoW;
    const shortsX = -Math.floor(shortsW / 2);
    const shortsY = -1 + yOffset;
    ctx.fillRect(shortsX, shortsY, shortsW, 4);
    // Center groin notch
    ctx.clearRect(-1, shortsY + 2, 2, 2);

    // C. JERSEY TORSO (Team primary with bold horizontal chest stripe and collar)
    const torsoX = -Math.floor(torsoW / 2);
    const torsoY = -torsoH + yOffset;
    ctx.fillStyle = primary;
    ctx.fillRect(torsoX, torsoY, torsoW, torsoH);

    // Signature White Horizontal Chest Stripe (Exact match to reference photo!)
    ctx.fillStyle = whiteAccent;
    ctx.fillRect(torsoX, torsoY + Math.floor(torsoH * 0.45), torsoW, 2);

    // White Collar
    ctx.fillStyle = whiteAccent;
    ctx.fillRect(-2, torsoY - 1, 4, 2);

    // Jersey sleeve cuffs
    ctx.fillStyle = whiteAccent;
    ctx.fillRect(torsoX, torsoY + 2, 2, 2); // Back sleeve cuff
    ctx.fillRect(torsoX + torsoW - 2, torsoY + 2, 2, 2); // Front sleeve cuff

    // D. ARMS & RUGBY BALL
    if (isCarrying) {
      // 1. Back Arm: Bent at 90 degrees pumping back in stride
      ctx.fillStyle = primary;
      ctx.fillRect(torsoX - 2, torsoY + 1, 3, 3); // Shoulder
      ctx.fillStyle = skin;
      ctx.fillRect(torsoX - 4, torsoY + 3, 3, 2); // Upper arm
      ctx.fillRect(torsoX - 5, torsoY + 2, 2, 4); // Forearm & fist

      // 2. Rugby Ball: Tucked tightly against chest/ribs (White with blue curved stripes)
      const ballX = torsoX + torsoW - 3;
      const ballY = torsoY + 2;
      ctx.fillStyle = whiteAccent;
      ctx.fillRect(ballX, ballY, 7, 5); // Oval body
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(ballX + 2, ballY, 2, 5); // Curved center panel stripe
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ballX + 3, ballY + 1, 1, 3); // Seam

      // 3. Front Arm: Clasped firmly around the oval ball
      ctx.fillStyle = skin;
      ctx.fillRect(ballX - 1, ballY + 3, 4, 3); // Hand clutching bottom of ball
      ctx.fillRect(ballX + 4, ballY + 3, 3, 2); // Wrist
    } else if (player.state === 'passing') {
      // Both arms thrust forward in delivery sweep
      ctx.fillStyle = primary;
      ctx.fillRect(torsoX + torsoW - 1, torsoY + 1, 4, 3);
      ctx.fillStyle = skin;
      ctx.fillRect(torsoX + torsoW + 3, torsoY + 2, 4, 2);
    } else if (player.state === 'tackling') {
      // Dual wrap clamp arms
      ctx.fillStyle = skin;
      ctx.fillRect(torsoX + torsoW, torsoY + 1, 5, 3);
      ctx.fillRect(torsoX + torsoW, torsoY + 5, 5, 3);
    } else if (player.state === 'hand_off') {
      // Stiff-arm fend with extended palm!
      ctx.fillStyle = skin;
      ctx.fillRect(torsoX + torsoW, torsoY + 2, 7, 3);
      ctx.fillRect(torsoX + torsoW + 6, torsoY + 1, 2, 5); // Open palm
    } else {
      // Natural arm swing
      const armSwing = isMoving && (anim % 4 < 2) ? 1 : -1;
      ctx.fillStyle = skin;
      ctx.fillRect(torsoX + torsoW - 2, torsoY + 3 + armSwing, 3, 4);
    }

    // E. HEAD, HAIR, BEARD & CASCO (SCRUM CAP)
    const headX = -2;
    const headY = torsoY - 8;

    // Skin Face & Neck
    ctx.fillStyle = skin;
    ctx.fillRect(headX, headY, 6, 7); // Face profile
    ctx.fillRect(headX + 5, headY + 2, 2, 2); // Nose profile

    // Eye pixel
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(headX + 4, headY + 2, 1, 1);

    // Optional Beard
    if (player.hasBeard) {
      ctx.fillStyle = '#261910';
      ctx.fillRect(headX + 2, headY + 5, 4, 2);
      ctx.fillRect(headX + 5, headY + 4, 2, 2);
    }

    // Scrum Cap (Forwards) vs Natural Hair (Backs)
    if (player.hasScrumCap) {
      const cap = this.getScrumCapColor(player);
      ctx.fillStyle = cap;
      ctx.fillRect(headX - 1, headY - 2, 7, 5); // Dome
      ctx.fillRect(headX - 1, headY + 2, 3, 4); // Ear cover
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(headX, headY - 1, 5, 1); // Padded contour
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(headX + 2, headY + 6, 2, 1); // Chin strap
    } else {
      // Hair matching reference photo (square crown, angled back slope)
      const hair = player.hairColor || '#543621';
      ctx.fillStyle = hair;
      ctx.fillRect(headX - 1, headY - 2, 7, 4); // Flat top crown
      ctx.fillRect(headX - 2, headY, 3, 5); // Back slope
    }
  }

  /**
   * Multi-Phase Visual Tackle Rendering with 8 Physical Variants
   */
  private drawTackleState(player: Player, team: TeamData) {
    const ctx = this.ctx;
    const ts = player.tackleState;
    if (!ts) return;

    const skin = player.skinTone || '#e09e6c';
    const primary = team.kit.primary;
    const shorts = team.kit.shorts || '#ffffff';
    const socks = team.kit.socks;
    const progress = ts.fallProgress;

    switch (ts.variant) {
      case 'front_shoulder': {
        // Attacker driven backward onto his back (tilted -45° to -90°)
        ctx.rotate(-progress * Math.PI * 0.45);
        ctx.fillStyle = primary;
        ctx.fillRect(-6, -6, 12, 6);
        ctx.fillStyle = shorts;
        ctx.fillRect(6, -6, 5, 5);
        ctx.fillStyle = skin;
        ctx.fillRect(-10, -6, 4, 4); // Head
        ctx.fillStyle = socks;
        ctx.fillRect(11, -7, 4, 3); // Legs in air
        break;
      }

      case 'rear_slide': {
        // Tackled from behind, skidding forward on belly
        ctx.rotate(progress * Math.PI * 0.25);
        ctx.fillStyle = primary;
        ctx.fillRect(-4, -2, 12, 5);
        ctx.fillStyle = shorts;
        ctx.fillRect(-9, -2, 5, 5);
        ctx.fillStyle = skin;
        ctx.fillRect(8, -3, 4, 4); // Head forward
        ctx.fillStyle = socks;
        ctx.fillRect(-14, -2, 5, 3);
        break;
      }

      case 'lateral_roll': {
        // Lateral roll
        ctx.rotate(progress * Math.PI);
        ctx.fillStyle = primary;
        ctx.fillRect(-5, -5, 10, 6);
        ctx.fillStyle = shorts;
        ctx.fillRect(-5, 1, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(-3, -9, 6, 4);
        break;
      }

      case 'low_ankle': {
        // Low ankle tap: headlong trip, feet kicked up
        ctx.rotate(progress * Math.PI * 0.40);
        ctx.fillStyle = primary;
        ctx.fillRect(0, -3, 10, 5);
        ctx.fillStyle = skin;
        ctx.fillRect(10, -4, 4, 4); // Head near grass
        ctx.fillStyle = shorts;
        ctx.fillRect(-5, -3, 5, 5);
        ctx.fillStyle = socks;
        ctx.fillRect(-11, -8, 4, 4); // Feet flying up
        break;
      }

      case 'double_hit': {
        // Pinched by two defenders
        ctx.fillStyle = primary;
        ctx.fillRect(-5, -4, 10, 7);
        ctx.fillStyle = shorts;
        ctx.fillRect(-4, 3, 8, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(-2, -9, 5, 5);
        break;
      }

      default: {
        // Fallback ground slide
        ctx.fillStyle = primary;
        ctx.fillRect(-6, 2, 12, 4);
        ctx.fillStyle = shorts;
        ctx.fillRect(6, 2, 5, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(-11, 2, 5, 4);
        ctx.fillStyle = socks;
        ctx.fillRect(11, 2, 4, 3);
        break;
      }
    }
  }

  private drawPlayerDown(player: Player, team: TeamData) {
    const ctx = this.ctx;
    // Lying flat on pitch with realistic rugby silhouette
    ctx.fillStyle = team.kit.primary;
    ctx.fillRect(-6, 2, 11, 4);
    ctx.fillStyle = team.kit.shorts || '#ffffff';
    ctx.fillRect(5, 2, 5, 4);
    ctx.fillStyle = player.skinTone || '#e09e6c';
    ctx.fillRect(-11, 2, 5, 4);
    ctx.fillStyle = team.kit.socks;
    ctx.fillRect(10, 3, 5, 3);
    ctx.fillStyle = '#1e242b';
    ctx.fillRect(15, 3, 2, 3); // Cleats
  }

  /**
   * Spectacular Palomita Try Dive: Horizontal outstretched flying dive across the tryline!
   */
  private drawPlayerDive(player: Player, team: TeamData) {
    const ctx = this.ctx;
    // Arms forward clutching the oval rugby ball
    ctx.fillStyle = player.skinTone || '#e09e6c';
    ctx.fillRect(6, -3, 6, 3);

    // Oval rugby ball in hands (White with blue curved stripe)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(11, -5, 7, 5);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(13, -5, 2, 5);

    // Torso stretched horizontally in mid-air
    ctx.fillStyle = team.kit.primary;
    ctx.fillRect(-3, -4, 10, 6);
    // White chest stripe
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-3, -2, 10, 2);

    ctx.fillStyle = team.kit.shorts || '#ffffff';
    ctx.fillRect(-8, -4, 5, 6);

    // Muscular legs kicking backward
    ctx.fillStyle = player.skinTone || '#e09e6c';
    ctx.fillRect(-11, -3, 3, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-12, -3, 1, 3); // White sock band
    ctx.fillStyle = team.kit.socks;
    ctx.fillRect(-16, -3, 4, 3);
    ctx.fillStyle = '#1e242b';
    ctx.fillRect(-18, -4, 3, 4); // Cleats

    // Head with cap or hair
    ctx.fillStyle = player.skinTone || '#e09e6c';
    ctx.fillRect(2, -8, 4, 4);
    if (player.hasScrumCap) {
      ctx.fillStyle = player.scrumCapColor || '#0f172a';
      ctx.fillRect(1, -9, 5, 4);
    } else {
      ctx.fillStyle = player.hairColor || '#543621';
      ctx.fillRect(1, -9, 4, 3);
    }
  }

  private drawPlayerCelebrating(player: Player, team: TeamData) {
    const ctx = this.ctx;
    // Legs
    ctx.fillStyle = team.kit.socks;
    ctx.fillRect(-3, 3, 2, 4);
    ctx.fillRect(1, 3, 2, 4);
    // Shorts
    ctx.fillStyle = team.kit.shorts || '#ffffff';
    ctx.fillRect(-3, 0, 6, 3);
    // Jersey
    ctx.fillStyle = team.kit.primary;
    ctx.fillRect(-4, -6, 8, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -4, 8, 2); // White stripe
    // Raised arms (V-shape)
    ctx.fillStyle = player.skinTone || '#e09e6c';
    ctx.fillRect(-5, -10, 2, 5);
    ctx.fillRect(3, -10, 2, 5);
    // Head
    ctx.fillStyle = player.skinTone || '#e09e6c';
    ctx.fillRect(-2, -10, 4, 4);
    ctx.fillStyle = player.hairColor || '#543621';
    ctx.fillRect(-2, -11, 4, 2);
  }

  /**
   * Forwards bound in ruck: low crouched body driving forward with shoulders, legs pumping backward
   */
  private drawPlayerRucking(player: Player, team: TeamData) {
    const ctx = this.ctx;
    const skin = player.skinTone || '#e09e6c';
    const primary = team.kit.primary;
    const shorts = team.kit.shorts || '#ffffff';
    const socks = team.kit.socks;

    ctx.save();
    ctx.rotate(0.18); // forward drive lean

    // Pumping legs dug in grass
    ctx.fillStyle = skin;
    ctx.fillRect(-7, 1, 3, 3);
    ctx.fillRect(-11, -1, 3, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-7, 4, 3, 1);
    ctx.fillRect(-11, 2, 3, 1);
    ctx.fillStyle = socks;
    ctx.fillRect(-7, 5, 3, 3);
    ctx.fillRect(-11, 3, 3, 3);
    ctx.fillStyle = '#1e242b';
    ctx.fillRect(-8, 8, 4, 2); // Studs dug in
    ctx.fillRect(-12, 6, 4, 2);

    // Shorts
    ctx.fillStyle = shorts;
    ctx.fillRect(-5, -3, 6, 5);

    // Driving Torso
    ctx.fillStyle = primary;
    ctx.fillRect(0, -6, 10, 7);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, -3, 10, 2); // Jersey stripe

    // Bound Arms: wrapped around teammate/opponent
    ctx.fillStyle = skin;
    ctx.fillRect(6, -2, 5, 3);
    ctx.fillRect(9, -4, 2, 5);

    // Head down in the pack with scrum cap
    ctx.fillStyle = skin;
    ctx.fillRect(7, -8, 5, 5);
    const cap = this.getScrumCapColor(player);
    ctx.fillStyle = cap;
    ctx.fillRect(6, -9, 6, 5);

    ctx.restore();
  }

  /**
   * Kicking pose: body arched back, plant leg solid, kicking leg swept high forward!
   */
  private drawPlayerKicking(player: Player, team: TeamData) {
    const ctx = this.ctx;
    const skin = player.skinTone || '#e09e6c';
    const primary = team.kit.primary;
    const shorts = team.kit.shorts || '#ffffff';
    const socks = team.kit.socks;

    ctx.save();
    ctx.rotate(-0.14); // arched back

    // Plant leg on ground
    ctx.fillStyle = skin;
    ctx.fillRect(-3, 1, 3, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-3, 5, 3, 1);
    ctx.fillStyle = socks;
    ctx.fillRect(-3, 6, 3, 3);
    ctx.fillStyle = '#1e242b';
    ctx.fillRect(-4, 9, 4, 2);

    // Kicking leg: extended high forward!
    ctx.fillStyle = skin;
    ctx.fillRect(2, -1, 4, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, -3, 3, 1);
    ctx.fillStyle = socks;
    ctx.fillRect(7, -6, 3, 4);
    ctx.fillStyle = '#1e242b';
    ctx.fillRect(8, -8, 4, 3); // Cleat kicking high

    // Shorts
    ctx.fillStyle = shorts;
    ctx.fillRect(-4, -3, 7, 5);

    // Torso
    ctx.fillStyle = primary;
    ctx.fillRect(-4, -10, 9, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -6, 9, 2); // White stripe

    // Balanced outstretched arms
    ctx.fillStyle = skin;
    ctx.fillRect(-8, -8, 4, 2);
    ctx.fillRect(4, -8, 5, 2);

    // Head tilted looking up at ball flight
    ctx.fillStyle = skin;
    ctx.fillRect(-2, -14, 5, 5);
    ctx.fillStyle = player.hairColor || '#543621';
    ctx.fillRect(-3, -15, 6, 3);

    ctx.restore();
  }

  private getScrumCapColor(player: Player): string {
    if (player.scrumCapColor) return player.scrumCapColor;
    const palette = [
      '#1e293b', // 1: Pilier (Slate)
      '#991b1b', // 2: Hooker (Crimson)
      '#0369a1', // 3: Pilier (Navy)
      '#15803d', // 4: Lock (Forest green)
      '#854d0e', // 5: Lock (Amber gold)
      '#475569', // 6: Flanker (Steel grey)
      '#581c87', // 7: Flanker (Purple)
      '#1e1b4b', // 8: N8 (Midnight)
    ];
    return palette[(player.position - 1) % palette.length];
  }

  private drawBall(ball: Ball) {
    const ctx = this.ctx;
    if (!ball) return;
    const bx = isFinite(ball.x) ? ball.x : PITCH_HALFWAY;
    const by = isFinite(ball.y) ? ball.y : H_POST_Y_CENTER;
    const bz = isFinite(ball.z) ? Math.max(0, Math.min(60, ball.z)) : 0;
    const x = Math.round(bx);
    const y = Math.round(by - bz);

    ctx.save();
    ctx.translate(x, y);

    // Ball shadow on ground
    if (bz > 2) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(-3, Math.round(bz) - 1, 6, 2);
    }

    if (ball.rotation) {
      ctx.rotate(ball.rotation);
    }

    // Oval body (6x4 pixels)
    ctx.fillStyle = '#8d4925'; // Classic leather rugby brown
    ctx.fillRect(-3, -2, 6, 4);
    ctx.fillRect(-4, -1, 8, 2);

    // White tips / stripe
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-2, -2, 1, 4);
    ctx.fillRect(1, -2, 1, 4);

    ctx.restore();
  }

  /**
   * Phase 1: Draw forward drag gesture guide to unlock the pass
   */
  private drawPassUnlockGuide(
    carrier: Player,
    gesture: { isDragging: boolean; unlocked: boolean; startX: number; startY: number; currentX: number; currentY: number }
  ) {
    const ctx = this.ctx;
    const cx = Math.round(carrier.x);
    const cy = Math.round(carrier.y);

    // Forward unlock threshold indicator in front of drag start
    const unlockTargetX = Math.round(gesture.startX + 18);
    const unlockTargetY = Math.round(gesture.startY);

    // Dotted forward guide line
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(gesture.startX, gesture.startY);
    ctx.lineTo(unlockTargetX, unlockTargetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Line from start to current pointer
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gesture.startX, gesture.startY);
    ctx.lineTo(gesture.currentX, gesture.currentY);
    ctx.stroke();

    // Start anchor dot
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(Math.round(gesture.startX) - 2, Math.round(gesture.startY) - 2, 4, 4);

    // Target unlock gate / threshold indicator
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(unlockTargetX - 1, unlockTargetY - 4, 2, 8);
    ctx.fillRect(unlockTargetX + 1, unlockTargetY - 2, 2, 4);

    // Current drag point dot
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(Math.round(gesture.currentX) - 2, Math.round(gesture.currentY) - 2, 4, 4);

    // Animated arrow and label in front of carrier
    const pulse = Math.sin(Date.now() * 0.008) * 2;
    const arrowX = cx + 24 + pulse;

    ctx.fillStyle = '#facc15';
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('→ DESLIZÁ ADELANTE', cx + 32, cy - 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PARA DESTRABAR', cx + 32, cy - 7);

    // Small forward chevron sprite
    ctx.fillStyle = '#facc15';
    ctx.fillRect(arrowX, cy - 2, 3, 4);
    ctx.fillRect(arrowX + 3, cy - 1, 2, 2);
  }

  /**
   * Phase 2: Unlocked passing aim trajectory towards nearby legal support teammates
   */
  private drawUnlockedPassAim(
    carrier: Player,
    gesture: { isDragging: boolean; unlocked: boolean; startX: number; startY: number; currentX: number; currentY: number },
    targetReceiver: Player | null
  ) {
    const ctx = this.ctx;
    const cx = Math.round(carrier.x);
    const cy = Math.round(carrier.y - 6);

    // 1. Unlocked green status badge above carrier
    ctx.fillStyle = '#22c55e';
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('✓ PASE ACTIVO', cx, cy - 12);

    // 2. Subtle max legal pass radius (95 units)
    ctx.save();
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.22)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(cx, cy, 95, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 3. User pointer line from carrier to drag point
    const aimX = gesture.currentX;
    const aimY = gesture.currentY;
    const isForward = aimX > carrier.x + 10;
    const distToAim = Math.hypot(aimX - carrier.x, aimY - carrier.y);

    if (isForward) {
      // Illegal forward pass indicator
      this.drawTrajectoryDots(cx, cy, aimX, aimY, '#ef4444');
      ctx.fillStyle = '#ef4444';
      ctx.font = '5px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('¡FORWARD ILEGAL!', Math.round(aimX), Math.round(aimY) - 8);
      return;
    }

    if (distToAim > 105 && !targetReceiver) {
      // Out of range (trying to pass across entire pitch)
      this.drawTrajectoryDots(cx, cy, aimX, aimY, '#f97316');
      ctx.fillStyle = '#f97316';
      ctx.font = '5px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('¡MUY LEJOS! (MÁX 15m)', Math.round(aimX), Math.round(aimY) - 8);
      return;
    }

    // 4. Target Receiver trajectory
    if (targetReceiver) {
      const rx = Math.round(targetReceiver.x);
      const ry = Math.round(targetReceiver.y - 4);

      // Trajectory arc to receiver
      this.drawTrajectoryDots(cx, cy, rx, ry, '#22c55e');

      // Target reticle
      const pulse = Math.abs(Math.sin(Date.now() * 0.007)) * 2;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx - 6 - pulse, ry - 6 - pulse, 12 + pulse * 2, 12 + pulse * 2);

      // Reticle center pip
      ctx.fillStyle = '#facc15';
      ctx.fillRect(rx - 1, ry - 1, 2, 2);

      // Receiver info label
      ctx.fillStyle = '#22c55e';
      ctx.font = '5px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`[#${targetReceiver.position} ${targetReceiver.name}]`, rx, ry - 12);
      ctx.fillStyle = '#facc15';
      ctx.fillText('SOLTÁ PARA PASAR', rx, ry + 16);
    } else {
      // Free aim arc towards current drag point
      this.drawTrajectoryDots(cx, cy, aimX, aimY, '#facc15');
      ctx.fillStyle = '#facc15';
      ctx.fillRect(Math.round(aimX) - 2, Math.round(aimY) - 2, 4, 4);
    }
  }

  private drawTrajectoryDots(startX: number, startY: number, targetX: number, targetY: number, color: string) {
    const ctx = this.ctx;
    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.min(22, Math.max(4, Math.floor(dist / 7)));

    ctx.fillStyle = color;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const arcHeight = Math.sin(t * Math.PI) * 14;
      const px = startX + dx * t;
      const py = startY + dy * t - arcHeight;
      ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 2, 2);
    }
  }

  /**
   * Retro Slingshot kick trajectory: shows pulled-back trajectory and projected forward flight arc
   */
  private drawSlingshotKickTrajectory(carrier: Player, aim: SlingshotKickAim) {
    const ctx = this.ctx;
    const cx = Math.round(carrier.x);
    const cy = Math.round(carrier.y - 6);

    // Forward projected arc of dots towards target
    const dx = aim.targetX - carrier.x;
    const dy = aim.targetY - carrier.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.min(28, Math.max(6, Math.floor(dist / 9)));

    // Dotted flight arc in bright retro cyan
    ctx.fillStyle = '#38bdf8';
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const arcHeight = Math.sin(t * Math.PI) * (20 + aim.power * 25);
      const px = carrier.x + dx * t;
      const py = carrier.y + dy * t - arcHeight;
      const dotSize = (i === steps) ? 4 : 2;
      ctx.fillRect(Math.round(px) - Math.floor(dotSize / 2), Math.round(py) - Math.floor(dotSize / 2), dotSize, dotSize);
    }

    // Target landing reticle
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(aim.targetX) - 5, Math.round(aim.targetY) - 5, 10, 10);

    // Callout labels
    ctx.fillStyle = '#38bdf8';
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`PATADA (${Math.round(aim.power * 100)}%)`, Math.round(aim.targetX), Math.round(aim.targetY) - 8);
    ctx.fillStyle = '#facc15';
    ctx.fillText('SOLTÁ PARA PATEAR', cx, cy + 22);
  }

  /**
   * Retro Bowl signature passing arc: clean dotted trajectory leading to target
   */
  private drawPassAimTrajectory(startX: number, startY: number, targetX: number, targetY: number) {
    const ctx = this.ctx;
    const isForward = targetX > startX;
    const dotColor = isForward ? '#ef4444' : '#facc15';

    this.drawTrajectoryDots(startX, startY, targetX, targetY, dotColor);

    // Target reticle
    ctx.strokeStyle = dotColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(targetX) - 4, Math.round(targetY) - 4, 8, 8);

    if (isForward) {
      ctx.fillStyle = '#ef4444';
      ctx.font = '5px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('FORWARD!', Math.round(targetX), Math.round(targetY) - 8);
    }
  }

  /**
   * Draws subtle Retro Bowl style indicator over the designated support receiver
   */
  private drawReceiverHighlight(target: Player) {
    const ctx = this.ctx;
    const x = Math.round(target.x);
    const y = Math.round(target.y);

    // Indicator ring under player's feet
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 5, y + 6, 10, 3);

    // Small floating indicator above head
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x - 1, y - 14, 2, 2);
  }

  /**
   * Ruck breakdown contest visual
   */
  private drawRuck(ruck: RuckContest) {
    const ctx = this.ctx;
    const x = Math.round(ruck.x);
    const y = Math.round(ruck.y);

    // Ruck shadow/breakdown zone on pitch
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(x - 20, y - 12, 40, 24);

    // Ruck boundary lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 20, y - 12, 40, 24);

    // "RUCK" banner
    ctx.fillStyle = '#f59e0b';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('¡RUCK!', x, y - 22);

    // Contested meter above ruck (0 to 100 scale)
    const meterWidth = 44;
    const meterHeight = 5;
    const meterX = x - meterWidth / 2;
    const meterY = y - 16;

    // Dark border & background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(meterX - 1, meterY - 1, meterWidth + 2, meterHeight + 2);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

    // Team progress fill (0 to 100)
    const pct = Math.max(0, Math.min(1, ruck.progress / 100));
    const fillWidth = Math.round(meterWidth * pct);

    // Color: Green if dominant, yellow if balanced, flashing red if losing
    let barColor = '#22c55e';
    if (ruck.progress < 25) {
      // Flash red when close to losing turnover
      barColor = (Math.floor(Date.now() / 150) % 2 === 0) ? '#ef4444' : '#991b1b';
    } else if (ruck.progress < 50) {
      barColor = '#f59e0b';
    }

    ctx.fillStyle = barColor;
    ctx.fillRect(meterX, meterY, fillWidth, meterHeight);

    // Tap call-to-action text
    ctx.fillStyle = ruck.progress < 25 ? '#ef4444' : '#f8fafc';
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    if (ruck.progress < 25) {
      ctx.fillText('¡TOCA RAPIDO!', x, y - 8);
    } else {
      ctx.fillText('TOCA ESPACIO', x, y - 8);
    }
  }

  /**
   * Scrum pack locked together
   */
  private drawScrum(scrum: ScrumContest) {
    const ctx = this.ctx;
    const x = Math.round(scrum.x);
    const y = Math.round(scrum.y);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(x - 22, y - 14, 44, 28);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(scrum.stage.toUpperCase() + '!', x, y - 22);

    // Contest meter
    const meterW = 44;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - meterW / 2 - 1, y - 16, meterW + 2, 5);

    const norm = Math.max(0, Math.min(1, (scrum.progress + 100) / 200));
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x - meterW / 2, y - 15, Math.round(meterW * norm), 3);
  }

  /**
   * Lineout contest visual
   */
  private drawLineout(lineout: LineoutContest) {
    const ctx = this.ctx;
    const x = Math.round(lineout.x);
    const y = Math.round(lineout.y);

    ctx.fillStyle = '#a855f7';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LINEOUT', x, y - 24);
  }

  /**
   * Dust and tackle particles
   */
  private drawParticles(particles: { x: number; y: number; color: string; life: number }[]) {
    const ctx = this.ctx;
    for (const p of particles) {
      if (p.life > 0) {
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
      }
    }
  }

  /**
   * Conversion / Penalty Kick Retro Arcade Screen Overlay
   * Prominently features the giant H-posts and angle/power swing meters
   */
  private drawConversionOverlay(conv: ConversionContest, teamA: TeamData, _teamB: TeamData) {
    const ctx = this.ctx;

    // Darkened retro scrim
    ctx.fillStyle = 'rgba(10, 16, 12, 0.75)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Pitch green ground
    ctx.fillStyle = '#1e682e';
    ctx.fillRect(0, 150, VIRTUAL_WIDTH, 90);

    // Large Retro H-Posts looming in center
    const postCenterX = VIRTUAL_WIDTH / 2;
    const postCrossbarY = 110;
    const postWidth = 100;
    const postTop = 20;

    // Uprights
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(postCenterX - postWidth / 2 - 2, postTop, 4, 130);
    ctx.fillRect(postCenterX + postWidth / 2 - 2, postTop, 4, 130);
    // Crossbar
    ctx.fillRect(postCenterX - postWidth / 2 - 2, postCrossbarY, postWidth + 4, 4);

    // Protective pads at bottom of posts
    ctx.fillStyle = teamA.kit.primary;
    ctx.fillRect(postCenterX - postWidth / 2 - 5, 135, 10, 15);
    ctx.fillRect(postCenterX + postWidth / 2 - 5, 135, 10, 15);

    // Kicking Rugby Ball on tee in foreground
    const ballTeeX = postCenterX;
    const ballTeeY = 180;
    ctx.fillStyle = '#0284c7'; // Kicking tee
    ctx.fillRect(ballTeeX - 4, ballTeeY + 4, 8, 4);

    // Ball placed upright on tee
    ctx.fillStyle = '#8d4925';
    ctx.fillRect(ballTeeX - 3, ballTeeY - 6, 6, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ballTeeX - 3, ballTeeY - 3, 6, 2);

    // Retro Header: CONVERSION / PENALTY KICK
    ctx.fillStyle = '#facc15';
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    const title = conv.pointsValue === 2 ? 'CONVERSION KICK (+2)' : 'PENALTY KICK (+3)';
    ctx.fillText(title, postCenterX, 22);

    // Aiming Needle / Angle Arrow
    if (conv.stage === 'aiming' || conv.stage === 'power') {
      const arrowLength = 52;
      const rad = (conv.angle * Math.PI) / 180;
      const targetArrowX = ballTeeX + Math.sin(rad) * arrowLength;
      const targetArrowY = ballTeeY - Math.cos(rad) * arrowLength;

      ctx.strokeStyle = conv.stage === 'aiming' ? '#facc15' : '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ballTeeX, ballTeeY);
      ctx.lineTo(targetArrowX, targetArrowY);
      ctx.stroke();

      // Goal target indicator
      ctx.fillStyle = conv.stage === 'aiming' ? '#facc15' : '#22c55e';
      ctx.fillRect(targetArrowX - 2, targetArrowY - 2, 4, 4);

      if (conv.stage === 'power') {
        ctx.fillStyle = '#22c55e';
        ctx.font = '5px "Press Start 2P", monospace';
        ctx.fillText('✓ DIRECCIÓN LISTA', postCenterX, 155);
      }
    }

    // Flying Ball during flight and result
    if (conv.stage === 'flight' || conv.stage === 'result') {
      const t = conv.stage === 'flight' ? Math.min(1, conv.ballFlightTimer / 1.2) : 1;
      const flyX = ballTeeX + Math.sin((conv.angle * Math.PI) / 180) * 110 * t;
      const flyY = ballTeeY - (ballTeeY - (postCrossbarY - 15)) * t - Math.sin(t * Math.PI) * 45;
      const ballScale = Math.max(0.45, 1.0 - t * 0.50);

      ctx.save();
      ctx.translate(flyX, flyY);
      ctx.scale(ballScale, ballScale);
      ctx.fillStyle = '#8d4925';
      ctx.fillRect(-3, -5, 6, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, -2, 6, 2);
      ctx.restore();
    }

    // Power Meter Bar
    const barWidth = 140;
    const barHeight = 8;
    const barX = postCenterX - barWidth / 2;
    const barY = 205;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

    // Power gradient segments (red, yellow, green)
    const fillWidth = (conv.power / 100) * barWidth;
    let powerColor = '#ef4444';
    if (conv.power > 50) powerColor = '#facc15';
    if (conv.power > 75) powerColor = '#10b981';

    ctx.fillStyle = powerColor;
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    // Instruction text
    ctx.fillStyle = '#f8fafc';
    ctx.font = '6px "Press Start 2P", monospace';
    if (conv.stage === 'aiming') {
      ctx.fillStyle = (Math.floor(Date.now() / 250) % 2 === 0) ? '#facc15' : '#ffffff';
      ctx.fillText('1. CLICK EN PANTALLA: FIJAR DIRECCIÓN', postCenterX, 226);
    } else if (conv.stage === 'power') {
      ctx.fillStyle = (Math.floor(Date.now() / 200) % 2 === 0) ? '#10b981' : '#ffffff';
      ctx.fillText('2. CLICK EN PANTALLA: FIJAR POTENCIA', postCenterX, 226);
    } else if (conv.stage === 'result') {
      if (conv.isSuccess) {
        ctx.fillStyle = '#10b981';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText('¡¡¡ADENTRO!!! (+2 PUNTOS)', postCenterX, 85);
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText('¡AFUERA!', postCenterX, 85);
      }
    }
  }
}
