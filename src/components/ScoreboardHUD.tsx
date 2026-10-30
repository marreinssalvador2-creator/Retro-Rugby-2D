/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TeamData, MatchStats, MatchSituation, MatchEventMessage } from '../types/rugby';
import { Volume2, VolumeX, Pause, HelpCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from '../i18n/context';

interface ScoreboardHUDProps {
  teamA: TeamData;
  teamB: TeamData;
  stats: MatchStats;
  timeRemaining: number;
  half: 1 | 2;
  situation: MatchSituation;
  eventMessage: MatchEventMessage | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onHelp: () => void;
  onRestart: () => void;
  onDismissEvent?: () => void;
}

export const ScoreboardHUD: React.FC<ScoreboardHUDProps> = ({
  teamA,
  teamB,
  stats,
  timeRemaining,
  half,
  situation,
  eventMessage,
  isMuted,
  onToggleMute,
  onPause,
  onHelp,
  onRestart,
  onDismissEvent,
}) => {
  const { t } = useTranslation();
  const minutes = Math.floor(Math.max(0, timeRemaining) / 60);
  const seconds = Math.floor(Math.max(0, timeRemaining) % 60);
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const getSituationLabel = () => {
    switch (situation) {
      case 'OPEN_PLAY': return 'OPEN PLAY';
      case 'RUCK': return 'RUCK!';
      case 'SCRUM': return 'SCRUM';
      case 'LINEOUT': return 'LINEOUT';
      case 'CONVERSION': return t('conversions');
      case 'PENALTY_KICK': return t('penalties');
      case 'TRY_SCORED': return 'TRY!';
      case 'RIVAL_DRIVE': return t('rivalPossessionTitle');
      case 'HALF_TIME': return 'HALF TIME';
      case 'FULL_TIME': return t('gameOverTitle');
      default: return 'RUGBY';
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none select-none">
      {/* Top Retro Bowl Score Bar */}
      <div className="bg-[#0b130e]/95 border-b-2 border-[#1e293b] px-3 py-1.5 flex items-center justify-between text-white shadow-lg">
        {/* Team A (User) */}
        <div className="flex items-center gap-2">
          <div 
            className="w-3.5 h-3.5 rounded-xs border border-white/40 shadow-xs flex items-center justify-center text-[10px]"
            style={{ backgroundColor: teamA.kit.primary }}
          >
            <span className="text-[8px] font-bold text-white drop-shadow-xs">{teamA.shortName[0]}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-retro text-[10px] tracking-wider text-slate-100">{teamA.shortName}</span>
            <span className="text-[8px] text-slate-400 font-sans hidden sm:inline">{teamA.name}</span>
          </div>
          <span className="font-retro text-base font-bold text-amber-300 ml-1.5 tabular-nums">
            {stats.scoreA}
          </span>
        </div>

        {/* Center Clock & Situation */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="font-retro text-[10px] text-emerald-400 tabular-nums">
              {timeFormatted}
            </span>
            <span className="text-[9px] text-slate-400 font-retro">
              {half === 1 ? t('firstHalf') : t('secondHalf')}
            </span>
          </div>
          <span className="text-[8px] font-retro text-amber-400/90 tracking-wide mt-0.5">
            {getSituationLabel()}
          </span>
        </div>

        {/* Team B (Rival) */}
        <div className="flex items-center gap-2">
          <span className="font-retro text-base font-bold text-amber-300 mr-1.5 tabular-nums">
            {stats.scoreB}
          </span>
          <div className="flex flex-col items-end">
            <span className="font-retro text-[10px] tracking-wider text-slate-100">{teamB.shortName}</span>
            <span className="text-[8px] text-slate-400 font-sans hidden sm:inline">{teamB.name}</span>
          </div>
          <div 
            className="w-3.5 h-3.5 rounded-xs border border-white/40 shadow-xs flex items-center justify-center text-[10px]"
            style={{ backgroundColor: teamB.kit.primary }}
          >
            <span className="text-[8px] font-bold text-white drop-shadow-xs">{teamB.shortName[0]}</span>
          </div>

          {/* Quick HUD Action Buttons */}
          <div className="flex items-center gap-1 ml-2 pointer-events-auto">
            <button
              onClick={onToggleMute}
              className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors cursor-pointer"
              title={isMuted ? 'Sound on' : 'Sound off'}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <button
              onClick={onPause}
              className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors cursor-pointer"
              title="Pause"
            >
              <Pause size={14} />
            </button>
            <button
              onClick={onHelp}
              className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors cursor-pointer"
              title={t('tutorial')}
            >
              <HelpCircle size={14} />
            </button>
            <button
              onClick={onRestart}
              className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors cursor-pointer"
              title={t('restartMatch')}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Retro Event Popups (TRY, KNOCK-ON, etc.) */}
      {eventMessage && (
        <div 
          onClick={onDismissEvent}
          className="flex justify-center mt-3 animate-bounce cursor-pointer pointer-events-auto"
          title={t('touchToSkip')}
        >
          <div className={`px-4 py-2 border-2 shadow-2xl font-retro text-center flex flex-col items-center ${
            eventMessage.type === 'try' 
              ? 'bg-amber-400 text-slate-950 border-white' 
              : eventMessage.type === 'whistle' 
              ? 'bg-red-600 text-white border-white' 
              : 'bg-slate-900 text-amber-300 border-amber-400'
          }`}>
            <div className="text-xs sm:text-sm font-bold tracking-wider">{eventMessage.text}</div>
            {eventMessage.subtext && (
              <div className="text-[8px] font-sans font-semibold opacity-90 mt-0.5 tracking-normal">
                {eventMessage.subtext}
              </div>
            )}
            <div className="text-[7px] text-white/80 font-mono tracking-widest mt-1">
              ⚡ {t('touchToSkip')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
