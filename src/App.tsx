/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RugbyGameEngine, GameInput, SlingshotKickAim } from './game/engine';
import { RetroRenderer } from './game/renderer';
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT, RUGBY_TEAMS } from './game/constants';
import { ScoreboardHUD } from './components/ScoreboardHUD';
import { TouchControls } from './components/TouchControls';
import { TeamSelectModal } from './components/TeamSelectModal';
import { TutorialModal } from './components/TutorialModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { RivalDriveOverlay } from './components/RivalDriveOverlay';
import { PenaltyDecisionModal } from './components/PenaltyDecisionModal';
import { ScrumSetPlayModal } from './components/ScrumSetPlayModal';
import { ScrumSetPlay } from './types/rugby';
import { retroAudio } from './audio/retroAudio';
import { Tv } from 'lucide-react';

// Career Mode System & Menu Components
import { GameScene, CareerTeamData } from './types/career';
import { CareerStorageService } from './services/careerStorage';
import { MainMenu } from './components/menu/MainMenu';
import { CareerSetupModal } from './components/menu/CareerSetupModal';
import { CareerHub } from './components/menu/CareerHub';
import { SquadScreen } from './components/menu/SquadScreen';
import { TransfersScreen } from './components/menu/TransfersScreen';
import { FacilitiesScreen } from './components/menu/FacilitiesScreen';
import { StandingsScreen } from './components/menu/StandingsScreen';
import { FinancesScreen } from './components/menu/FinancesScreen';
import { ChampionshipsScreen } from './components/menu/ChampionshipsScreen';
import { TutorialScreen } from './components/menu/TutorialScreen';
import { SettingsScreen } from './components/menu/SettingsScreen';
import { useTranslation } from './i18n/context';

export default function App() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<RugbyGameEngine | null>(null);
  const rendererRef = useRef<RetroRenderer | null>(null);

  // Active scene routing
  const [currentScene, setCurrentScene] = useState<GameScene>('MAIN_MENU');
  const [career, setCareer] = useState<CareerTeamData | null>(() => CareerStorageService.loadCareer());
  const [isCareerMatch, setIsCareerMatch] = useState(false);
  const [showCareerSetup, setShowCareerSetup] = useState(false);

  // Match setup state
  const [teamA, setTeamA] = useState(RUGBY_TEAMS[0]); // Los Pumas (Argentina)
  const [teamB, setTeamB] = useState(RUGBY_TEAMS[1]); // All Blacks (New Zealand)
  const [matchDuration] = useState(180); // 3 minutes per half

  // Modals & UI State
  const [showTeamSelect, setShowTeamSelect] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [scanlines, setScanlines] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // HUD mirror state
  const [hudStats, setHudStats] = useState({
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
  });
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [half, setHalf] = useState<1 | 2>(1);
  const [situation, setSituation] = useState(engineRef.current?.situation || 'OPEN_PLAY');
  const [eventMessage, setEventMessage] = useState(engineRef.current?.eventMessage || null);
  const [rivalDriveStage, setRivalDriveStage] = useState<'pelota_perdida' | 'rival_avanza' | 'rack' | 'outcome_recovered' | 'outcome_try' | 'outcome_conversion' | undefined>(undefined);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isDefending, setIsDefending] = useState(false);
  const [scrumStage, setScrumStage] = useState<'selecting' | 'crouch' | 'bind' | 'set' | 'push' | 'won' | undefined>(undefined);
  const [scrumFeedingTeam, setScrumFeedingTeam] = useState<'A' | 'B' | undefined>(undefined);
  const [penaltyDecision, setPenaltyDecision] = useState<{ teamAwarded: 'A' | 'B'; reason: string } | null>(null);

  // Real-time input buffers
  const inputRef = useRef<GameInput>({
    moveX: 0,
    moveY: 0,
    sprint: false,
    passRequested: false,
    kickRequested: false,
    tackleRequested: false,
    switchPlayerRequested: false,
    aimTarget: null,
    slingshotAim: null,
    slingshotRelease: false,
  });

  // Track key states
  const keysDown = useRef<Record<string, boolean>>({});

  // Mobile gesture recognizer state machine
  // Modes: 'idle' | 'undecided' | 'vertical_dodge' | 'forward_pass' | 'slingshot_kick'
  const gestureRef = useRef<{
    active: boolean;
    mode: 'idle' | 'undecided' | 'vertical_dodge' | 'forward_pass' | 'slingshot_kick';
    startClientX: number;
    startClientY: number;
    startWorldX: number;
    startWorldY: number;
    currentWorldX: number;
    currentWorldY: number;
  }>({
    active: false,
    mode: 'idle',
    startClientX: 0,
    startClientY: 0,
    startWorldX: 0,
    startWorldY: 0,
    currentWorldX: 0,
    currentWorldY: 0,
  });

  const passGestureVisualRef = useRef<{
    isDragging: boolean;
    unlocked: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const touchDpadActive = useRef<boolean>(false);

  // Initialize game engine
  const startNewMatch = useCallback((selectedA = teamA, selectedB = teamB, inCareer = false) => {
    const engine = new RugbyGameEngine(selectedA, selectedB, matchDuration);
    engineRef.current = engine;
    setIsGameOver(false);
    setIsPaused(false);
    setIsCareerMatch(inCareer);
    setTeamA(selectedA);
    setTeamB(selectedB);
    setCurrentScene('MATCH');
  }, [teamA, teamB, matchDuration]);

  // Load career and settings on initial boot
  useEffect(() => {
    const loadedSettings = CareerStorageService.loadSettings();
    setIsMuted(!loadedSettings.soundEnabled);
    setIsMusicMuted(!loadedSettings.musicEnabled);
    if (loadedSettings.musicEnabled) {
      retroAudio.startChiptune();
    }

    if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      setIsTouchDevice(true);
    }
  }, []);

  // Update career state with persistence helper
  const handleUpdateCareer = (updated: CareerTeamData) => {
    setCareer(updated);
    CareerStorageService.saveCareer(updated);
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }

      keysDown.current[e.code] = true;

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (currentScene === 'MATCH') {
          setIsPaused(prev => !prev);
        }
        return;
      }

      if (e.code === 'Space') {
        inputRef.current.passRequested = true;
      }
      if (e.code === 'KeyQ') {
        inputRef.current.kickRequested = true;
      }
      if (e.code === 'KeyF') {
        inputRef.current.tackleRequested = true;
      }
      if (e.code === 'KeyE') {
        inputRef.current.switchPlayerRequested = true;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        inputRef.current.sprint = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.current[e.code] = false;

      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        inputRef.current.sprint = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentScene]);

  // Canvas Coordinates Converter
  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !rendererRef.current) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = VIRTUAL_WIDTH / rect.width;
    const scaleY = VIRTUAL_HEIGHT / rect.height;

    const screenX = (clientX - rect.left) * scaleX;
    const screenY = (clientY - rect.top) * scaleY;

    const worldX = screenX + rendererRef.current.cameraX;
    const worldY = screenY + rendererRef.current.cameraY;
    return { x: worldX, y: worldY };
  };

  // TOUCH & MOUSE GESTURE HANDLING
  const handlePointerDown = (e: React.PointerEvent) => {
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    const engine = engineRef.current;
    if (!engine) return;

    // Any screen tap/click immediately skips active carteles or rival possession drive
    if (engine.situation === 'RIVAL_DRIVE' || engine.eventMessage) {
      engine.skipCurrentBannerOrEvent();
      setSituation(engine.situation);
      setEventMessage(engine.eventMessage);
      setRivalDriveStage(engine.rivalDrive?.stage);
      return;
    }

    // Conversion or penalty kicks: clicking anywhere locks aiming needle / power
    if (engine.situation === 'CONVERSION' || engine.situation === 'PENALTY_KICK') {
      inputRef.current.kickRequested = true;
      inputRef.current.passRequested = true;
      return;
    }

    const carrier = engine.players.find(p => p.id === engine.ball.carrierId);
    const isUserCarrying = carrier && carrier.teamId === 'A';

    if (engine.situation === 'OPEN_PLAY' && isUserCarrying) {
      gestureRef.current = {
        active: true,
        mode: 'undecided',
        startClientX: e.clientX,
        startClientY: e.clientY,
        startWorldX: coords.x,
        startWorldY: coords.y,
        currentWorldX: coords.x,
        currentWorldY: coords.y,
      };
    } else {
      // Tap in ruck, scrum, or on defense acts as tackle/action
      inputRef.current.passRequested = true;
      if (!isUserCarrying) {
        inputRef.current.tackleRequested = true;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const gesture = gestureRef.current;
    if (!gesture.active) return;

    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    gesture.currentWorldX = coords.x;
    gesture.currentWorldY = coords.y;

    const deltaX = e.clientX - gesture.startClientX;
    const deltaY = e.clientY - gesture.startClientY;

    const engine = engineRef.current;
    const carrier = engine?.players.find(p => p.id === engine?.ball.carrierId);
    if (!carrier) return;

    // Phase 1: Determine gesture intent cleanly
    if (gesture.mode === 'undecided') {
      // 1. Slingshot kick: dragging backward (to the left, deltaX < -15)
      if (deltaX < -15) {
        gesture.mode = 'slingshot_kick';
        passGestureVisualRef.current = null;
        inputRef.current.aimTarget = null;
        inputRef.current.moveY = 0;
        retroAudio.playBlip();
      }
      // 2. Pass cocking: dragging forward (to the right, deltaX > 16)
      else if (deltaX > 16) {
        gesture.mode = 'forward_pass';
        inputRef.current.slingshotAim = null;
        inputRef.current.moveY = 0;
        retroAudio.playBlip();
        passGestureVisualRef.current = {
          isDragging: true,
          unlocked: true,
          startX: gesture.startWorldX,
          startY: gesture.startWorldY,
          currentX: coords.x,
          currentY: coords.y,
        };
      }
      // 3. Vertical dodge (amague): swiping up or down
      else if (Math.abs(deltaY) > 8 && Math.abs(deltaX) < 14) {
        gesture.mode = 'vertical_dodge';
        passGestureVisualRef.current = null;
        inputRef.current.slingshotAim = null;
        inputRef.current.aimTarget = null;
      }
    }

    // Phase 2: Apply active gesture
    if (gesture.mode === 'slingshot_kick') {
      const pullDist = Math.hypot(deltaX, deltaY);
      const power = Math.min(1.0, pullDist / 110);
      const targetForwardX = carrier.x + Math.abs(deltaX) * 3.8;
      const targetForwardY = carrier.y + deltaY * 1.6;

      inputRef.current.slingshotAim = {
        isDragging: true,
        originX: carrier.x,
        originY: carrier.y,
        targetX: targetForwardX,
        targetY: targetForwardY,
        power,
      };
    } else if (gesture.mode === 'forward_pass') {
      if (passGestureVisualRef.current) {
        passGestureVisualRef.current.currentX = coords.x;
        passGestureVisualRef.current.currentY = coords.y;
      }
      inputRef.current.aimTarget = coords;
    } else if (gesture.mode === 'vertical_dodge') {
      inputRef.current.moveY = Math.sign(deltaY);
    }
  };

  const handlePointerUp = (_e: React.PointerEvent) => {
    const gesture = gestureRef.current;
    if (!gesture.active) return;

    if (gesture.mode === 'slingshot_kick' && inputRef.current.slingshotAim) {
      inputRef.current.slingshotRelease = true;
    } else if (gesture.mode === 'forward_pass' && passGestureVisualRef.current?.unlocked) {
      inputRef.current.passRequested = true;
    } else if (gesture.mode === 'vertical_dodge') {
      inputRef.current.moveY = 0;
    }

    // Reset gesture states
    gestureRef.current.active = false;
    gestureRef.current.mode = 'idle';
    passGestureVisualRef.current = null;
    inputRef.current.aimTarget = null;
  };

  // Main 60 FPS Game Loop
  useEffect(() => {
    if (currentScene !== 'MATCH') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    rendererRef.current = new RetroRenderer(ctx);
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const engine = engineRef.current;
      const renderer = rendererRef.current;

      if (engine && renderer) {
        // Movement input resolution
        let moveX = 0;
        let moveY = 0;
        const kd = keysDown.current;

        if (kd['KeyW'] || kd['ArrowUp']) moveY -= 1;
        if (kd['KeyS'] || kd['ArrowDown']) moveY += 1;
        if (kd['KeyA'] || kd['ArrowLeft']) moveX -= 1;
        if (kd['KeyD'] || kd['ArrowRight']) moveX += 1;

        if (moveX !== 0 && moveY !== 0) {
          moveX *= 0.7071;
          moveY *= 0.7071;
        }

        if (moveX !== 0 || moveY !== 0) {
          inputRef.current.moveX = moveX;
          inputRef.current.moveY = moveY;
        } else if (!gestureRef.current.active && !touchDpadActive.current) {
          inputRef.current.moveX = 0;
          inputRef.current.moveY = 0;
        }

        engine.isPaused = isPaused;
        engine.update(dt, inputRef.current);

        // Reset frame-based triggers
        inputRef.current.passRequested = false;
        inputRef.current.kickRequested = false;
        inputRef.current.tackleRequested = false;
        inputRef.current.switchPlayerRequested = false;
        if (inputRef.current.slingshotRelease) {
          inputRef.current.slingshotRelease = false;
          inputRef.current.slingshotAim = null;
        }

        // Camera tracking
        const controlledPlayer = engine.players.find(p => p.isUserControlled);
        const ballCarrier = engine.players.find(p => p.id === engine.ball.carrierId);
        const cameraTarget = ballCarrier || controlledPlayer || engine.ball;
        const targetReceiver = ballCarrier ? engine.getPrimaryPassTarget(ballCarrier, inputRef.current.moveY) : null;

        renderer.updateCamera(cameraTarget.x, cameraTarget.y, controlledPlayer?.facing || 'right');

        // Draw Scene
        renderer.render(
          engine.teamA,
          engine.teamB,
          engine.players,
          engine.ball,
          engine.situation,
          engine.ruck,
          engine.scrum,
          engine.lineout,
          engine.conversion,
          inputRef.current.aimTarget,
          engine.particles,
          targetReceiver,
          passGestureVisualRef.current,
          inputRef.current.slingshotAim
        );

        // Periodically sync UI HUD
        setHudStats({ ...engine.stats });
        setTimeRemaining(engine.matchTimeRemaining);
        setHalf(engine.currentHalf);
        setSituation(engine.situation);
        setEventMessage(engine.eventMessage);
        setRivalDriveStage(engine.rivalDrive?.stage);
        setIsDefending(engine.isUserDefending());
        setScrumStage(engine.scrum?.stage);
        setScrumFeedingTeam(engine.scrum?.feedingTeam);
        setPenaltyDecision(engine.penaltyDecision);

        if (engine.situation === 'FULL_TIME' && !isGameOver) {
          setIsGameOver(true);
          // If in career mode, process rewards
          if (isCareerMatch && career) {
            const won = engine.stats.scoreA > engine.stats.scoreB;
            const diff = engine.stats.scoreA - engine.stats.scoreB;
            let earnedCoins = won ? 60 : 10;
            if (won && diff >= 15) earnedCoins += 25; // Blowout bonus
            earnedCoins += (career.facilities.stadium - 1) * 25; // Stadium bonus

            const updatedRecord = {
              ...career.record,
              wins: career.record.wins + (won ? 1 : 0),
              losses: career.record.losses + (won ? 0 : 1),
              pointsFor: career.record.pointsFor + engine.stats.scoreA,
              pointsAgainst: career.record.pointsAgainst + engine.stats.scoreB,
            };

            const updatedCareer: CareerTeamData = {
              ...career,
              coins: career.coins + earnedCoins,
              week: career.week + 1,
              record: updatedRecord,
            };

            handleUpdateCareer(updatedCareer);
          }
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentScene, isPaused, isGameOver, isCareerMatch, career]);

  // SCENE ROUTING VIEW DISPATCHER
  if (currentScene === 'MAIN_MENU') {
    return (
      <>
        <MainMenu
          onNavigate={(scene) => {
            if (scene === 'CAREER_HUB') {
              if (career) {
                setCurrentScene('CAREER_HUB');
              } else {
                setShowCareerSetup(true);
              }
            } else {
              setCurrentScene(scene);
            }
          }}
          hasSavedCareer={career !== null}
          onContinueCareer={() => {
            if (career) {
              setCurrentScene('CAREER_HUB');
            } else {
              setShowCareerSetup(true);
            }
          }}
          onNewCareer={() => setShowCareerSetup(true)}
          onQuickMatch={() => {
            startNewMatch(RUGBY_TEAMS[0], RUGBY_TEAMS[1], false);
          }}
          isMuted={isMuted}
          isMusicMuted={isMusicMuted}
          onToggleMute={() => {
            const muted = retroAudio.toggleMute();
            setIsMuted(muted);
          }}
          onToggleMusic={() => {
            const newMusic = !isMusicMuted;
            setIsMusicMuted(newMusic);
            if (!newMusic) retroAudio.startChiptune();
            else retroAudio.stopChiptune();
          }}
        />

        {showCareerSetup && (
          <CareerSetupModal
            onCancel={() => setShowCareerSetup(false)}
            onConfirm={(teamId, coachName) => {
              const newCareer = CareerStorageService.createNewCareer(teamId, coachName);
              handleUpdateCareer(newCareer);
              setShowCareerSetup(false);
              setCurrentScene('CAREER_HUB');
            }}
          />
        )}
      </>
    );
  }

  if (currentScene === 'CAREER_HUB' && career) {
    return (
      <CareerHub
        career={career}
        onUpdateCareer={handleUpdateCareer}
        onNavigate={(scene) => setCurrentScene(scene)}
        onStartMatch={(opponentTeamId) => {
          const userTeam = RUGBY_TEAMS.find(t => t.id === career.teamId) || RUGBY_TEAMS[0];
          const rivalTeam = RUGBY_TEAMS.find(t => t.id === opponentTeamId) || RUGBY_TEAMS[1];
          startNewMatch(userTeam, rivalTeam, true);
        }}
        onBackToMenu={() => setCurrentScene('MAIN_MENU')}
      />
    );
  }

  if (currentScene === 'CAREER_SQUAD' && career) {
    return (
      <SquadScreen
        career={career}
        onUpdateCareer={handleUpdateCareer}
        onBack={() => setCurrentScene('CAREER_HUB')}
      />
    );
  }

  if (currentScene === 'CAREER_TRANSFERS' && career) {
    return (
      <TransfersScreen
        career={career}
        onUpdateCareer={handleUpdateCareer}
        onBack={() => setCurrentScene('CAREER_HUB')}
      />
    );
  }

  if (currentScene === 'CAREER_FACILITIES' && career) {
    return (
      <FacilitiesScreen
        career={career}
        onUpdateCareer={handleUpdateCareer}
        onBack={() => setCurrentScene('CAREER_HUB')}
      />
    );
  }

  if (currentScene === 'CAREER_STANDINGS' && career) {
    return (
      <StandingsScreen
        career={career}
        onBack={() => setCurrentScene('CAREER_HUB')}
      />
    );
  }

  if (currentScene === 'CAREER_FINANCES' && career) {
    return (
      <FinancesScreen
        career={career}
        onBack={() => setCurrentScene('CAREER_HUB')}
      />
    );
  }

  if (currentScene === 'CHAMPIONSHIPS') {
    return (
      <ChampionshipsScreen
        careerSeason={career?.season || 1}
        onBack={() => setCurrentScene(career ? 'CAREER_HUB' : 'MAIN_MENU')}
        onSelectTournament={(tourneyId) => {
          const userTeam = career ? (RUGBY_TEAMS.find(t => t.id === career.teamId) || RUGBY_TEAMS[0]) : RUGBY_TEAMS[0];
          const rivalTeam = RUGBY_TEAMS[1];
          startNewMatch(userTeam, rivalTeam, !!career);
        }}
      />
    );
  }

  if (currentScene === 'TUTORIAL') {
    return (
      <TutorialScreen
        onBack={() => setCurrentScene(career ? 'CAREER_HUB' : 'MAIN_MENU')}
      />
    );
  }

  if (currentScene === 'SETTINGS') {
    return (
      <SettingsScreen
        onBack={() => setCurrentScene(career ? 'CAREER_HUB' : 'MAIN_MENU')}
        onResetAllData={() => {
          setCareer(null);
          setCurrentScene('MAIN_MENU');
        }}
      />
    );
  }

  // MATCH SCENE (Default Match Gameplay Engine)
  return (
    <div className="relative w-screen h-screen bg-[#0b130e] flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      {/* Top Retro Bowl Scoreboard HUD */}
      <ScoreboardHUD
        teamA={teamA}
        teamB={teamB}
        stats={hudStats}
        timeRemaining={timeRemaining}
        half={half}
        situation={situation}
        eventMessage={eventMessage}
        onDismissEvent={() => {
          const engine = engineRef.current;
          if (engine) {
            engine.skipCurrentBannerOrEvent();
            setSituation(engine.situation);
            setEventMessage(engine.eventMessage);
            setRivalDriveStage(engine.rivalDrive?.stage);
          }
        }}
        isMuted={isMuted}
        onToggleMute={() => {
          const muted = retroAudio.toggleMute();
          setIsMuted(muted);
        }}
        onPause={() => setIsPaused(prev => !prev)}
        onHelp={() => setShowTutorial(true)}
        onRestart={() => startNewMatch(teamA, teamB, isCareerMatch)}
      />

      {/* Main Game Screen (Pixelated Canvas with 16:9 Aspect Ratio) */}
      <div className="relative w-full h-full flex items-center justify-center p-0 md:p-3">
        <canvas
          ref={canvasRef}
          width={VIRTUAL_WIDTH}
          height={VIRTUAL_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="pixelated w-full h-full max-w-[1280px] max-h-[720px] object-contain shadow-2xl bg-[#0b130e] border border-slate-900 rounded-xs cursor-crosshair touch-none"
        />

        {/* Optional Retro CRT Scanline overlay */}
        {scanlines && (
          <div className="absolute inset-0 pointer-events-none scanlines opacity-40 z-10" />
        )}

        {/* Rival Possession Fullscreen Retro Broadcast Overlay */}
        {situation === 'RIVAL_DRIVE' && (
          <RivalDriveOverlay
            stage={rivalDriveStage}
            eventMessage={eventMessage}
            rivalName={teamB.name}
            onSkip={() => {
              const engine = engineRef.current;
              if (engine) {
                engine.skipCurrentBannerOrEvent();
                setSituation(engine.situation);
                setEventMessage(engine.eventMessage);
                setRivalDriveStage(engine.rivalDrive?.stage);
              }
            }}
          />
        )}

        {/* Penalty Decision Modal */}
        {situation === 'PENALTY_DECISION' && penaltyDecision?.teamAwarded === 'A' && (
          <PenaltyDecisionModal
            reason={penaltyDecision.reason}
            onChoose={(action) => {
              const engine = engineRef.current;
              if (engine) {
                engine.choosePenaltyAction(action);
                setSituation(engine.situation);
                setPenaltyDecision(null);
                setEventMessage(engine.eventMessage);
              }
            }}
          />
        )}

        {/* Scrum Set Play Tactical Selection Modal */}
        {situation === 'SCRUM' && scrumStage === 'selecting' && scrumFeedingTeam === 'A' && (
          <ScrumSetPlayModal
            onSelectPlay={(play: ScrumSetPlay) => {
              const engine = engineRef.current;
              if (engine) {
                engine.chooseScrumSetPlay(play);
                setScrumStage(engine.scrum?.stage);
                setEventMessage(engine.eventMessage);
              }
            }}
          />
        )}

        {/* Interactive Clickable Conversion Button - Located at top so it does NOT obscure the bottom power meter */}
        {(situation === 'CONVERSION' || situation === 'PENALTY_KICK') && (
          <div className="absolute top-14 md:top-16 z-30 flex flex-col items-center pointer-events-auto animate-pulse">
            <button
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current.kickRequested = true;
                inputRef.current.passRequested = true;
              }}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-retro text-[10px] md:text-xs rounded-xl shadow-2xl border-2 border-white cursor-pointer flex items-center gap-2"
            >
              <span>{t('clickToAimConversion')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom PC Quick Controls Reference (unobtrusive retro strip) */}
      <div className="absolute bottom-1.5 left-4 z-20 hidden md:flex items-center gap-3 text-[10px] text-slate-400 font-mono pointer-events-none bg-slate-950/70 px-2.5 py-1 rounded border border-slate-800/60 backdrop-blur-xs">
        <span>{t('pcDodge')}</span>
        <span>·</span>
        <span>{t('pcPassGesture')}</span>
        <span>·</span>
        <span>{t('pcKickGesture')}</span>
        <span>·</span>
        <span>{t('pcSpace')}</span>
        <span>·</span>
        <span>{t('pcQ')}</span>
        <span>·</span>
        <span>{t('pcF')}</span>
        <span>·</span>
        <span>{t('pcE')}</span>
      </div>

      {/* Retro scanline toggle & exit buttons in corner */}
      <div className="absolute bottom-1.5 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => {
            if (isCareerMatch && career) {
              setCurrentScene('CAREER_HUB');
            } else {
              setCurrentScene('MAIN_MENU');
            }
          }}
          className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-[10px] font-retro text-slate-300 rounded shadow cursor-pointer transition-colors"
        >
          {t('exitToMenu')}
        </button>
        <button
          onClick={() => setScanlines(s => !s)}
          className={`px-2 py-1 border rounded text-[10px] font-retro flex items-center gap-1 shadow cursor-pointer transition-colors ${
            scanlines ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300' : 'bg-slate-900/80 border-slate-700 text-slate-400'
          }`}
          title="CRT Scanlines"
        >
          <Tv size={12} />
          <span>{t('crt')}</span>
        </button>
      </div>

      {/* Mobile Touch Controls */}
      <TouchControls
        visible={isTouchDevice && situation !== 'RIVAL_DRIVE'}
        isDefending={isDefending}
        onDirectionChange={(x, y) => {
          touchDpadActive.current = (x !== 0 || y !== 0);
          inputRef.current.moveX = x;
          inputRef.current.moveY = y;
        }}
        onSprintToggle={(sprint) => {
          inputRef.current.sprint = sprint;
        }}
        onPass={() => {
          inputRef.current.passRequested = true;
        }}
        onKick={() => {
          inputRef.current.kickRequested = true;
        }}
        onTackle={() => {
          inputRef.current.tackleRequested = true;
        }}
        onSwitchPlayer={() => {
          inputRef.current.switchPlayerRequested = true;
        }}
      />

      {/* Team Selection Modal */}
      {showTeamSelect && (
        <TeamSelectModal
          selectedTeamA={teamA}
          selectedTeamB={teamB}
          onSelectTeamA={setTeamA}
          onSelectTeamB={setTeamB}
          onStartMatch={() => {
            setShowTeamSelect(false);
            startNewMatch(teamA, teamB, false);
          }}
        />
      )}

      {/* Rugby Tutorial Modal */}
      {showTutorial && (
        <TutorialModal onClose={() => setShowTutorial(false)} />
      )}

      {/* In-game Pause Menu */}
      {isPaused && (
        <PauseModal
          teamA={teamA}
          teamB={teamB}
          isMuted={isMuted}
          onToggleMute={() => {
            const muted = retroAudio.toggleMute();
            setIsMuted(muted);
          }}
          onResume={() => setIsPaused(false)}
          onRestart={() => {
            setIsPaused(false);
            startNewMatch(teamA, teamB, isCareerMatch);
          }}
          onChangeTeams={() => {
            setIsPaused(false);
            if (isCareerMatch && career) {
              setCurrentScene('CAREER_HUB');
            } else {
              setShowTeamSelect(true);
            }
          }}
        />
      )}

      {/* Game Over / Full Time Modal */}
      {isGameOver && (
        <GameOverModal
          teamA={teamA}
          teamB={teamB}
          stats={hudStats}
          onPlayAgain={() => {
            setIsGameOver(false);
            startNewMatch(teamA, teamB, isCareerMatch);
          }}
          onChangeTeams={() => {
            setIsGameOver(false);
            if (isCareerMatch && career) {
              setCurrentScene('CAREER_HUB');
            } else {
              setCurrentScene('MAIN_MENU');
            }
          }}
        />
      )}
    </div>
  );
}
