/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, RotateCcw, Users } from 'lucide-react';
import { TeamData, MatchStats } from '../types/rugby';
import { useTranslation } from '../i18n/context';

interface GameOverModalProps {
  teamA: TeamData;
  teamB: TeamData;
  stats: MatchStats;
  onPlayAgain: () => void;
  onChangeTeams: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  teamA,
  teamB,
  stats,
  onPlayAgain,
  onChangeTeams,
}) => {
  const { t } = useTranslation();
  const isWin = stats.scoreA > stats.scoreB;
  const isDraw = stats.scoreA === stats.scoreB;

  const totalFrames = Math.max(1, stats.possessionFramesA + stats.possessionFramesB);
  const possA = Math.round((stats.possessionFramesA / totalFrames) * 100);
  const possB = 100 - possA;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-[#0f172a] border-2 border-slate-700 max-w-md w-full rounded-xl overflow-hidden shadow-2xl p-6 text-center space-y-5">
        <div className="flex justify-center">
          <Trophy className={isWin ? 'text-amber-400 animate-bounce' : 'text-slate-500'} size={40} />
        </div>

        <div>
          <h2 className="font-retro text-lg text-amber-400 tracking-wider">
            {isWin ? t('matchVictory') : isDraw ? t('matchDraw') : t('matchDefeat')}
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-1">{t('gameOverTitle')}</p>
        </div>

        {/* Big Score Board */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 flex items-center justify-around">
          <div className="flex flex-col items-center">
            <span className="text-2xl mb-1">{teamA.flag}</span>
            <span className="font-retro text-xs text-slate-300">{teamA.shortName}</span>
            <span className="font-retro text-2xl text-emerald-400 font-bold mt-1 tabular-nums">{stats.scoreA}</span>
          </div>

          <div className="font-retro text-slate-600 text-sm">FT</div>

          <div className="flex flex-col items-center">
            <span className="text-2xl mb-1">{teamB.flag}</span>
            <span className="font-retro text-xs text-slate-300">{teamB.shortName}</span>
            <span className="font-retro text-2xl text-red-400 font-bold mt-1 tabular-nums">{stats.scoreB}</span>
          </div>
        </div>

        {/* Detailed Rugby Match Stats */}
        <div className="bg-slate-900/60 rounded-lg p-3 text-xs space-y-2 border border-slate-800/80 font-sans">
          <div className="flex justify-between items-center text-slate-300">
            <span className="font-semibold text-emerald-400">{stats.triesA}</span>
            <span className="text-slate-400 font-retro text-[9px]">{t('tries')}</span>
            <span className="font-semibold text-red-400">{stats.triesB}</span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="font-semibold text-emerald-400">{stats.conversionsA}</span>
            <span className="text-slate-400 font-retro text-[9px]">{t('conversions')}</span>
            <span className="font-semibold text-red-400">{stats.conversionsB}</span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="font-semibold text-emerald-400">{stats.tacklesA}</span>
            <span className="text-slate-400 font-retro text-[9px]">{t('tackles')}</span>
            <span className="font-semibold text-red-400">{stats.tacklesB}</span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="font-semibold text-emerald-400">{possA}%</span>
            <span className="text-slate-400 font-retro text-[9px]">{t('possession')}</span>
            <span className="font-semibold text-red-400">{possB}%</span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="font-semibold text-emerald-400">{stats.scrumsWonA}</span>
            <span className="text-slate-400 font-retro text-[9px]">{t('scrumsWon')}</span>
            <span className="font-semibold text-red-400">{stats.scrumsWonB}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-retro text-xs rounded-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>{t('playAgainBtn')}</span>
          </button>

          <button
            onClick={onChangeTeams}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-retro text-[10px] rounded-lg flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition-transform cursor-pointer"
          >
            <Users size={14} />
            <span>{t('chooseTeamsOrHub')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
